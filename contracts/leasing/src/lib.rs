#![no_std]

use soroban_sdk::contractevent;

use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, token, Address, Env, String,
};

#[contracttype]
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum LeaseStatus {
    Active = 0,
    Arrears = 1,
    Defaulted = 2,
    Closed = 3,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Lease {
    pub id: String,
    pub asset_id: String,
    pub lessor: Address,
    pub lessee: Address,
    pub rent_amount: i128,
    pub interval_seconds: u64,
    pub start_at: u64,
    pub next_due_at: u64,
    pub total_paid: i128,
    pub payments: u32,
    pub status: LeaseStatus,
    pub created_at: u64,
}

#[contracttype]
pub enum DataKey {
    Admin,
    Token,
    Lease(String),
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    Unauthorized = 3,
    LeaseExists = 4,
    LeaseNotFound = 5,
    InvalidLease = 6,
    InvalidStatus = 7,
    NotDue = 8,
    InvalidParties = 9,
}

/// Emitted when a lease schedule is created.
#[contractevent]
pub struct LeaseCreated {
    pub lease_id: String,
    pub rent_amount: i128,
    pub interval_seconds: u64,
}

/// Emitted when a lessee pays rent.
#[contractevent]
pub struct RentPaid {
    pub lease_id: String,
    pub lessee: Address,
    pub amount: i128,
}

/// Emitted when a lease is flagged as in arrears.
#[contractevent]
pub struct LeaseArrears {
    pub lease_id: String,
    pub next_due_at: u64,
}

/// Emitted when an arrears lease is defaulted.
#[contractevent]
pub struct LeaseDefaulted {
    pub lease_id: String,
}

/// Emitted when a lease is closed.
#[contractevent]
pub struct LeaseClosed {
    pub lease_id: String,
}

#[contract]
pub struct Leasing;

#[contractimpl]
impl Leasing {
    pub fn initialize(env: Env, admin: Address, token: Address) -> Result<(), Error> {
        if env.storage().instance().has(&DataKey::Admin) {
            return Err(Error::AlreadyInitialized);
        }
        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::Token, &token);
        Ok(())
    }

    pub fn token(env: Env) -> Result<Address, Error> {
        env.storage()
            .instance()
            .get(&DataKey::Token)
            .ok_or(Error::NotInitialized)
    }

    /// Records a lease schedule. Rent is paid in the configured settlement token.
    #[allow(clippy::too_many_arguments)]
    pub fn create_lease(
        env: Env,
        lessor: Address,
        id: String,
        asset_id: String,
        lessee: Address,
        rent_amount: i128,
        interval_seconds: u64,
        start_at: u64,
    ) -> Result<Lease, Error> {
        lessor.require_auth();
        if rent_amount <= 0 || interval_seconds == 0 {
            return Err(Error::InvalidLease);
        }
        if lessor == lessee {
            return Err(Error::InvalidParties);
        }
        let key = DataKey::Lease(id.clone());
        if env.storage().persistent().has(&key) {
            return Err(Error::LeaseExists);
        }
        let start = if start_at < env.ledger().timestamp() {
            env.ledger().timestamp()
        } else {
            start_at
        };
        let lease = Lease {
            id: id.clone(),
            asset_id,
            lessor,
            lessee,
            rent_amount,
            interval_seconds,
            start_at: start,
            next_due_at: start,
            total_paid: 0,
            payments: 0,
            status: LeaseStatus::Active,
            created_at: env.ledger().timestamp(),
        };
        env.storage().persistent().set(&key, &lease);
        LeaseCreated {
            lease_id: id.clone(),
            rent_amount,
            interval_seconds,
        }
        .publish(&env);
        Ok(lease)
    }

    /// Pays one rent interval. A late payment cures arrears and resets the next
    /// due date from the payment time.
    pub fn pay_rent(env: Env, lessee: Address, id: String) -> Result<Lease, Error> {
        lessee.require_auth();
        let mut lease = get_lease_or_error(&env, &id)?;
        if lessee != lease.lessee {
            return Err(Error::Unauthorized);
        }
        if lease.status != LeaseStatus::Active && lease.status != LeaseStatus::Arrears {
            return Err(Error::InvalidStatus);
        }
        let payment = token::Client::new(&env, &Self::token(env.clone())?);
        payment.transfer(&lessee, &lease.lessor, &lease.rent_amount);
        let now = env.ledger().timestamp();
        lease.total_paid += lease.rent_amount;
        lease.payments += 1;
        lease.next_due_at = now + lease.interval_seconds;
        lease.status = LeaseStatus::Active;
        RentPaid {
            lease_id: id.clone(),
            lessee: lease.lessee.clone(),
            amount: lease.rent_amount,
        }
        .publish(&env);
        env.storage().persistent().set(&DataKey::Lease(id), &lease);
        Ok(lease)
    }

    /// Flags a lease as in arrears once the due date has passed.
    pub fn flag_arrears(env: Env, caller: Address, id: String) -> Result<Lease, Error> {
        caller.require_auth();
        let mut lease = get_lease_or_error(&env, &id)?;
        require_lessor_or_admin(&env, &caller, &lease)?;
        if lease.status != LeaseStatus::Active {
            return Err(Error::InvalidStatus);
        }
        if env.ledger().timestamp() <= lease.next_due_at {
            return Err(Error::NotDue);
        }
        lease.status = LeaseStatus::Arrears;
        LeaseArrears {
            lease_id: id.clone(),
            next_due_at: lease.next_due_at,
        }
        .publish(&env);
        env.storage().persistent().set(&DataKey::Lease(id), &lease);
        Ok(lease)
    }

    /// Defaults an arrears lease. Defaulting is an operational record, not an
    /// automatic seizure of any asset.
    pub fn default_lease(env: Env, caller: Address, id: String) -> Result<Lease, Error> {
        caller.require_auth();
        let mut lease = get_lease_or_error(&env, &id)?;
        require_lessor_or_admin(&env, &caller, &lease)?;
        if lease.status != LeaseStatus::Arrears {
            return Err(Error::InvalidStatus);
        }
        lease.status = LeaseStatus::Defaulted;
        LeaseDefaulted {
            lease_id: id.clone(),
        }
        .publish(&env);
        env.storage().persistent().set(&DataKey::Lease(id), &lease);
        Ok(lease)
    }

    pub fn close_lease(env: Env, caller: Address, id: String) -> Result<Lease, Error> {
        caller.require_auth();
        let mut lease = get_lease_or_error(&env, &id)?;
        require_lessor_or_admin(&env, &caller, &lease)?;
        if lease.status == LeaseStatus::Closed {
            return Err(Error::InvalidStatus);
        }
        lease.status = LeaseStatus::Closed;
        LeaseClosed {
            lease_id: id.clone(),
        }
        .publish(&env);
        env.storage().persistent().set(&DataKey::Lease(id), &lease);
        Ok(lease)
    }

    /// Extends a lease by the given number of periods.
    pub fn extender_lease(
        env: Env,
        caller: Address,
        id: String,
        periods: u32,
    ) -> Result<Lease, Error> {
        caller.require_auth();
        let mut lease = get_lease_or_error(&env, &id)?;
        require_lessor_or_admin(&env, &caller, &lease)?;
        if lease.status == LeaseStatus::Closed || lease.status == LeaseStatus::Defaulted {
            return Err(Error::InvalidStatus);
        }
        if periods == 0 {
            return Err(Error::InvalidLease);
        }
        lease.next_due_at += lease.interval_seconds * periods as u64;
        env.storage().persistent().set(&DataKey::Lease(id), &lease);
        Ok(lease)
    }

    pub fn get_lease(env: Env, id: String) -> Result<Lease, Error> {
        get_lease_or_error(&env, &id)
    }
}

fn require_lessor_or_admin(env: &Env, caller: &Address, lease: &Lease) -> Result<(), Error> {
    let admin: Address = env
        .storage()
        .instance()
        .get(&DataKey::Admin)
        .ok_or(Error::NotInitialized)?;
    if *caller != lease.lessor && *caller != admin {
        return Err(Error::Unauthorized);
    }
    Ok(())
}

fn get_lease_or_error(env: &Env, id: &String) -> Result<Lease, Error> {
    env.storage()
        .persistent()
        .get(&DataKey::Lease(id.clone()))
        .ok_or(Error::LeaseNotFound)
}

#[cfg(test)]
mod test;
