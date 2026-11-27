#![no_std]

use soroban_sdk::contractevent;

use soroban_sdk::{contract, contracterror, contractimpl, contracttype, Address, Env};

/// Operational roles used across the Aerospace RWA contracts.
///
/// Roles are granted by the owner and are deliberately separate from token
/// balances: holding a token never grants an administrative permission.
#[contracttype]
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum Role {
    Admin = 0,
    Issuer = 1,
    Compliance = 2,
    Operator = 3,
    Auditor = 4,
}

#[contracttype]
pub enum DataKey {
    Owner,
    Role(Address, Role),
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    Unauthorized = 3,
    CannotRevokeOwner = 4,
    AlreadyHasRole = 5,
}

/// Emitted when an admin grants a role.
#[contractevent]
pub struct RoleGranted {
    pub caller: Address,
    pub grantee: Address,
    pub role: u32,
}

/// Emitted when an admin transfers a role.
#[contractevent]
pub struct RoleTransferred {
    pub caller: Address,
    pub from: Address,
    pub to: Address,
    pub role: u32,
}

/// Emitted when an admin revokes a role.
#[contractevent]
pub struct RoleRevoked {
    pub caller: Address,
    pub grantee: Address,
    pub role: u32,
}

#[contract]
pub struct AccessControl;

#[contractimpl]
impl AccessControl {
    /// Sets the owner and grants the owner the Admin role.
    pub fn initialize(env: Env, owner: Address) -> Result<(), Error> {
        if env.storage().instance().has(&DataKey::Owner) {
            return Err(Error::AlreadyInitialized);
        }
        owner.require_auth();
        env.storage().instance().set(&DataKey::Owner, &owner);
        env.storage()
            .persistent()
            .set(&DataKey::Role(owner.clone(), Role::Admin), &true);
        Ok(())
    }

    pub fn owner(env: Env) -> Result<Address, Error> {
        env.storage()
            .instance()
            .get(&DataKey::Owner)
            .ok_or(Error::NotInitialized)
    }

    /// Grants a role. Only an admin can grant roles.
    pub fn grant(env: Env, caller: Address, grantee: Address, role: Role) -> Result<(), Error> {
        caller.require_auth();
        require_admin(&env, &caller)?;
        RoleGranted {
            caller: caller.clone(),
            grantee: grantee.clone(),
            role: role as u32,
        }
        .publish(&env);
        env.storage()
            .persistent()
            .set(&DataKey::Role(grantee, role), &true);
        Ok(())
    }

    /// Revokes a role. The owner's Admin role cannot be revoked.
    pub fn revoke(env: Env, caller: Address, grantee: Address, role: Role) -> Result<(), Error> {
        caller.require_auth();
        require_admin(&env, &caller)?;
        if role == Role::Admin && is_owner(&env, &grantee) {
            return Err(Error::CannotRevokeOwner);
        }
        RoleRevoked {
            caller: caller.clone(),
            grantee: grantee.clone(),
            role: role as u32,
        }
        .publish(&env);
        env.storage()
            .persistent()
            .remove(&DataKey::Role(grantee, role));
        Ok(())
    }

    /// Transfers a role from one account to another. The owner's Admin role
    /// cannot be transferred.
    pub fn transferir_rol(
        env: Env,
        caller: Address,
        from: Address,
        to: Address,
        role: Role,
    ) -> Result<(), Error> {
        caller.require_auth();
        require_admin(&env, &caller)?;
        if role == Role::Admin && is_owner(&env, &from) {
            return Err(Error::CannotRevokeOwner);
        }
        if !Self::has_role(env.clone(), from.clone(), role) {
            return Err(Error::Unauthorized);
        }
        if Self::has_role(env.clone(), to.clone(), role) {
            return Err(Error::AlreadyHasRole);
        }
        env.storage()
            .persistent()
            .remove(&DataKey::Role(from.clone(), role));
        env.storage()
            .persistent()
            .set(&DataKey::Role(to.clone(), role), &true);
        RoleTransferred {
            caller: caller.clone(),
            from,
            to,
            role: role as u32,
        }
        .publish(&env);
        Ok(())
    }

    /// Revokes every role held by an account. Returns the number of roles revoked.
    pub fn revocar_todo(env: Env, caller: Address, grantee: Address) -> Result<u32, Error> {
        caller.require_auth();
        require_admin(&env, &caller)?;
        if is_owner(&env, &grantee) {
            return Err(Error::CannotRevokeOwner);
        }
        let mut revoked = 0_u32;
        for role in [
            Role::Admin,
            Role::Issuer,
            Role::Compliance,
            Role::Operator,
            Role::Auditor,
        ] {
            if Self::has_role(env.clone(), grantee.clone(), role) {
                RoleRevoked {
                    caller: caller.clone(),
                    grantee: grantee.clone(),
                    role: role as u32,
                }
                .publish(&env);
                env.storage()
                    .persistent()
                    .remove(&DataKey::Role(grantee.clone(), role));
                revoked += 1;
            }
        }
        Ok(revoked)
    }

    /// Grants a role to multiple accounts.
    pub fn otorgar_masivo(
        env: Env,
        caller: Address,
        grantees: soroban_sdk::Vec<Address>,
        role: Role,
    ) -> u32 {
        caller.require_auth();
        if require_admin(&env, &caller).is_err() {
            return 0;
        }
        if grantees.len() > 50 {
            return 0;
        }
        let mut granted = 0_u32;
        for grantee in grantees.iter() {
            if Self::has_role(env.clone(), grantee.clone(), role) {
                continue;
            }
            if role == Role::Admin && is_owner(&env, &grantee) {
                continue;
            }
            RoleGranted {
                caller: caller.clone(),
                grantee: grantee.clone(),
                role: role as u32,
            }
            .publish(&env);
            env.storage()
                .persistent()
                .set(&DataKey::Role(grantee, role), &true);
            granted += 1;
        }
        granted
    }

    /// Revokes a role from multiple accounts.
    pub fn revocar_masivo(
        env: Env,
        caller: Address,
        grantees: soroban_sdk::Vec<Address>,
        role: Role,
    ) -> u32 {
        caller.require_auth();
        if require_admin(&env, &caller).is_err() {
            return 0;
        }
        let mut revoked = 0_u32;
        for grantee in grantees.iter() {
            if role == Role::Admin && is_owner(&env, &grantee) {
                continue;
            }
            if Self::has_role(env.clone(), grantee.clone(), role) {
                RoleRevoked {
                    caller: caller.clone(),
                    grantee: grantee.clone(),
                    role: role as u32,
                }
                .publish(&env);
                env.storage()
                    .persistent()
                    .remove(&DataKey::Role(grantee, role));
                revoked += 1;
            }
        }
        revoked
    }

    pub fn has_role(env: Env, account: Address, role: Role) -> bool {
        if role == Role::Admin && is_owner(&env, &account) {
            return true;
        }
        env.storage()
            .persistent()
            .get(&DataKey::Role(account, role))
            .unwrap_or(false)
    }

    /// Panics when the account lacks the role. Contracts that call this keep a
    /// single, auditable authorisation path.
    pub fn require_role(env: Env, account: Address, role: Role) {
        if !Self::has_role(env, account, role) {
            panic!("missing role");
        }
    }
}

fn is_owner(env: &Env, account: &Address) -> bool {
    env.storage()
        .instance()
        .get::<_, Address>(&DataKey::Owner)
        .map(|owner| owner == *account)
        .unwrap_or(false)
}

fn require_admin(env: &Env, caller: &Address) -> Result<(), Error> {
    if !AccessControl::has_role(env.clone(), caller.clone(), Role::Admin) {
        return Err(Error::Unauthorized);
    }
    Ok(())
}

#[cfg(test)]
mod test;
