#![no_std]

use soroban_sdk::contractevent;

use soroban_sdk::{
    contract, contractclient, contracterror, contractimpl, contracttype, Address, BytesN, Env,
    String,
};

/// Minimal read interface used to gate transfers through the compliance contract.
#[contractclient(name = "ComplianceClient")]
pub trait ComplianceInterface {
    fn is_eligible(env: Env, investor: Address, required_tier: u32, jurisdiction: String) -> bool;
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct TokenMetadata {
    pub name: String,
    pub symbol: String,
    pub decimals: u32,
    pub asset_id: String,
    /// SHA-256 of the legal rights description. The token itself does not convey
    /// title to the underlying asset.
    pub rights_hash: BytesN<32>,
}

#[contracttype]
pub enum DataKey {
    Admin,
    Metadata,
    TotalSupply,
    Balance(Address),
    Allowance(Address, Address),
    Paused,
    Compliance,
    RequiredTier,
    Jurisdiction,
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    Unauthorized = 3,
    InvalidAmount = 4,
    InsufficientBalance = 5,
    InsufficientAllowance = 6,
    Paused = 7,
    ComplianceBlocked = 8,
    InvalidDecimals = 9,
}

/// Emitted when tokenized rights are minted.
#[contractevent]
pub struct TokenMinted {
    pub to: Address,
    pub amount: i128,
}

/// Emitted when tokenized rights move between holders.
#[contractevent]
pub struct TokenTransferred {
    pub from: Address,
    pub to: Address,
    pub amount: i128,
}

/// Emitted when tokenized rights are burned.
#[contractevent]
pub struct TokenBurned {
    pub from: Address,
    pub amount: i128,
}

#[contract]
pub struct RwaToken;

#[contractimpl]
impl RwaToken {
    #[allow(clippy::too_many_arguments)]
    pub fn initialize(
        env: Env,
        admin: Address,
        name: String,
        symbol: String,
        decimals: u32,
        asset_id: String,
        rights_hash: BytesN<32>,
    ) -> Result<(), Error> {
        if env.storage().instance().has(&DataKey::Admin) {
            return Err(Error::AlreadyInitialized);
        }
        if decimals > 18 {
            return Err(Error::InvalidDecimals);
        }
        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(
            &DataKey::Metadata,
            &TokenMetadata {
                name,
                symbol,
                decimals,
                asset_id,
                rights_hash,
            },
        );
        env.storage().instance().set(&DataKey::TotalSupply, &0_i128);
        env.storage().instance().set(&DataKey::Paused, &false);
        Ok(())
    }

    pub fn admin(env: Env) -> Result<Address, Error> {
        env.storage()
            .instance()
            .get(&DataKey::Admin)
            .ok_or(Error::NotInitialized)
    }

    pub fn metadata(env: Env) -> Result<TokenMetadata, Error> {
        env.storage()
            .instance()
            .get(&DataKey::Metadata)
            .ok_or(Error::NotInitialized)
    }

    pub fn name(env: Env) -> String {
        Self::metadata(env.clone())
            .map(|meta| meta.name)
            .unwrap_or_else(|_| String::from_str(&env, ""))
    }

    pub fn symbol(env: Env) -> String {
        Self::metadata(env.clone())
            .map(|meta| meta.symbol)
            .unwrap_or_else(|_| String::from_str(&env, ""))
    }

    pub fn decimals(env: Env) -> u32 {
        Self::metadata(env.clone())
            .map(|meta| meta.decimals)
            .unwrap_or(0)
    }

    pub fn total_supply(env: Env) -> i128 {
        env.storage()
            .instance()
            .get(&DataKey::TotalSupply)
            .unwrap_or(0)
    }

    pub fn balance(env: Env, account: Address) -> i128 {
        env.storage()
            .persistent()
            .get(&DataKey::Balance(account))
            .unwrap_or(0)
    }

    pub fn allowance(env: Env, from: Address, spender: Address) -> i128 {
        env.storage()
            .persistent()
            .get(&DataKey::Allowance(from, spender))
            .unwrap_or(0)
    }

    /// Configures the compliance contract and eligibility policy. An admin can
    /// also remove the hook, but production deployments should keep it enabled.
    pub fn configure_compliance(
        env: Env,
        caller: Address,
        compliance: Option<Address>,
        required_tier: u32,
        jurisdiction: String,
    ) -> Result<(), Error> {
        caller.require_auth();
        require_admin(&env, &caller)?;
        match compliance {
            Some(address) => {
                env.storage().instance().set(&DataKey::Compliance, &address);
                env.storage()
                    .instance()
                    .set(&DataKey::RequiredTier, &required_tier);
                env.storage()
                    .instance()
                    .set(&DataKey::Jurisdiction, &jurisdiction);
            }
            None => {
                env.storage().instance().remove(&DataKey::Compliance);
            }
        }
        Ok(())
    }

    pub fn set_paused(env: Env, caller: Address, paused: bool) -> Result<(), Error> {
        caller.require_auth();
        require_admin(&env, &caller)?;
        env.storage().instance().set(&DataKey::Paused, &paused);
        Ok(())
    }

    pub fn is_paused(env: Env) -> bool {
        env.storage()
            .instance()
            .get(&DataKey::Paused)
            .unwrap_or(false)
    }

    /// Mints tokenized rights. Minting does not transfer or imply ownership of the
    /// underlying physical asset.
    pub fn mint(env: Env, caller: Address, to: Address, amount: i128) -> Result<(), Error> {
        caller.require_auth();
        require_admin(&env, &caller)?;
        if amount <= 0 {
            return Err(Error::InvalidAmount);
        }
        check_compliance(&env, &to)?;
        let balance = Self::balance(env.clone(), to.clone()) + amount;
        env.storage()
            .persistent()
            .set(&DataKey::Balance(to.clone()), &balance);
        TokenMinted { to, amount }.publish(&env);
        let supply = Self::total_supply(env.clone()) + amount;
        env.storage().instance().set(&DataKey::TotalSupply, &supply);
        Ok(())
    }

    pub fn burn(env: Env, from: Address, amount: i128) -> Result<(), Error> {
        from.require_auth();
        burn_internal(&env, &from, amount)
    }

    pub fn approve(env: Env, from: Address, spender: Address, amount: i128) -> Result<(), Error> {
        from.require_auth();
        if amount < 0 {
            return Err(Error::InvalidAmount);
        }
        env.storage()
            .persistent()
            .set(&DataKey::Allowance(from, spender), &amount);
        Ok(())
    }

    pub fn transfer(env: Env, from: Address, to: Address, amount: i128) -> Result<(), Error> {
        from.require_auth();
        transfer_internal(&env, &from, &to, amount)
    }

    pub fn transfer_from(
        env: Env,
        spender: Address,
        from: Address,
        to: Address,
        amount: i128,
    ) -> Result<(), Error> {
        spender.require_auth();
        let allowance = Self::allowance(env.clone(), from.clone(), spender.clone());
        if allowance < amount {
            return Err(Error::InsufficientAllowance);
        }
        env.storage().persistent().set(
            &DataKey::Allowance(from.clone(), spender),
            &(allowance - amount),
        );
        transfer_internal(&env, &from, &to, amount)
    }

    pub fn burn_from(env: Env, spender: Address, from: Address, amount: i128) -> Result<(), Error> {
        spender.require_auth();
        let allowance = Self::allowance(env.clone(), from.clone(), spender.clone());
        if allowance < amount {
            return Err(Error::InsufficientAllowance);
        }
        env.storage().persistent().set(
            &DataKey::Allowance(from.clone(), spender),
            &(allowance - amount),
        );
        burn_internal(&env, &from, amount)
    }
}

fn transfer_internal(env: &Env, from: &Address, to: &Address, amount: i128) -> Result<(), Error> {
    if amount <= 0 {
        return Err(Error::InvalidAmount);
    }
    if RwaToken::is_paused(env.clone()) {
        return Err(Error::Paused);
    }
    check_compliance(env, from)?;
    check_compliance(env, to)?;
    let from_balance = RwaToken::balance(env.clone(), from.clone());
    if from_balance < amount {
        return Err(Error::InsufficientBalance);
    }
    env.storage()
        .persistent()
        .set(&DataKey::Balance(from.clone()), &(from_balance - amount));
    let to_balance = RwaToken::balance(env.clone(), to.clone()) + amount;
    env.storage()
        .persistent()
        .set(&DataKey::Balance(to.clone()), &to_balance);
    TokenTransferred {
        from: from.clone(),
        to: to.clone(),
        amount,
    }
    .publish(env);
    Ok(())
}

fn burn_internal(env: &Env, from: &Address, amount: i128) -> Result<(), Error> {
    if amount <= 0 {
        return Err(Error::InvalidAmount);
    }
    let balance = RwaToken::balance(env.clone(), from.clone());
    if balance < amount {
        return Err(Error::InsufficientBalance);
    }
    env.storage()
        .persistent()
        .set(&DataKey::Balance(from.clone()), &(balance - amount));
    let supply = RwaToken::total_supply(env.clone()) - amount;
    env.storage().instance().set(&DataKey::TotalSupply, &supply);
    TokenBurned {
        from: from.clone(),
        amount,
    }
    .publish(env);
    Ok(())
}

fn check_compliance(env: &Env, account: &Address) -> Result<(), Error> {
    let compliance: Address = match env.storage().instance().get(&DataKey::Compliance) {
        Some(address) => address,
        None => return Ok(()),
    };
    let tier: u32 = env
        .storage()
        .instance()
        .get(&DataKey::RequiredTier)
        .unwrap_or(1);
    let jurisdiction: String = env
        .storage()
        .instance()
        .get(&DataKey::Jurisdiction)
        .unwrap_or_else(|| String::from_str(env, ""));
    let client = ComplianceClient::new(env, &compliance);
    if !client.is_eligible(account, &tier, &jurisdiction) {
        return Err(Error::ComplianceBlocked);
    }
    Ok(())
}

fn require_admin(env: &Env, caller: &Address) -> Result<(), Error> {
    let admin: Address = env
        .storage()
        .instance()
        .get(&DataKey::Admin)
        .ok_or(Error::NotInitialized)?;
    if admin != *caller {
        return Err(Error::Unauthorized);
    }
    Ok(())
}

#[cfg(test)]
mod test;
