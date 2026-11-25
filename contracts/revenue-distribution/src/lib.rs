#![no_std]

use soroban_sdk::contractevent;

use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, token, Address, Env, String,
};

#[contracttype]
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum DistributionStatus {
    Funded = 0,
    Closed = 1,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Distribution {
    pub id: String,
    pub asset_id: String,
    pub issuer: Address,
    pub total_amount: i128,
    pub total_units: i128,
    pub allocated_units: i128,
    pub claimed_amount: i128,
    pub created_at: u64,
    pub claim_deadline: u64,
    pub status: DistributionStatus,
}

#[contracttype]
pub enum DataKey {
    Admin,
    Token,
    Distribution(String),
    Allocation(String, Address),
    Claimed(String, Address),
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    Unauthorized = 3,
    DistributionExists = 4,
    DistributionNotFound = 5,
    InvalidAmount = 6,
    InvalidDeadline = 7,
    OverAllocated = 8,
    NothingToClaim = 9,
    AlreadyClaimed = 10,
    DistributionClosed = 11,
    TooEarly = 12,
}

/// Emitted when an issuer funds a distribution.
#[contractevent]
pub struct DistributionPublished {
    pub distribution_id: String,
    pub total_amount: i128,
    pub total_units: i128,
}

/// Emitted when units are allocated to an investor.
#[contractevent]
pub struct UnitsAllocated {
    pub distribution_id: String,
    pub investor: Address,
    pub units: i128,
}

/// Emitted when an investor claims a pro-rata share.
#[contractevent]
pub struct DistributionClaimed {
    pub distribution_id: String,
    pub investor: Address,
    pub amount: i128,
}

/// Emitted when a distribution closes and returns unclaimed funds.
#[contractevent]
pub struct DistributionClosed {
    pub distribution_id: String,
    pub remaining: i128,
}

#[contract]
pub struct RevenueDistribution;

#[contractimpl]
impl RevenueDistribution {
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

    /// Funds a distribution. The issuer transfers the full amount into the
    /// contract before any investor can claim.
    #[allow(clippy::too_many_arguments)]
    pub fn create_distribution(
        env: Env,
        issuer: Address,
        id: String,
        asset_id: String,
        total_amount: i128,
        total_units: i128,
        claim_deadline: u64,
    ) -> Result<Distribution, Error> {
        issuer.require_auth();
        if total_amount <= 0 || total_units <= 0 {
            return Err(Error::InvalidAmount);
        }
        if claim_deadline <= env.ledger().timestamp() {
            return Err(Error::InvalidDeadline);
        }
        let key = DataKey::Distribution(id.clone());
        if env.storage().persistent().has(&key) {
            return Err(Error::DistributionExists);
        }
        let payment = token::Client::new(&env, &Self::token(env.clone())?);
        payment.transfer(&issuer, env.current_contract_address(), &total_amount);

        let distribution = Distribution {
            id: id.clone(),
            asset_id,
            issuer,
            total_amount,
            total_units,
            allocated_units: 0,
            claimed_amount: 0,
            created_at: env.ledger().timestamp(),
            claim_deadline,
            status: DistributionStatus::Funded,
        };
        env.storage().persistent().set(&key, &distribution);
        DistributionPublished {
            distribution_id: id.clone(),
            total_amount,
            total_units,
        }
        .publish(&env);
        Ok(distribution)
    }

    /// Records the unit snapshot used for pro-rata claims. Only the issuer or
    /// admin can allocate, and allocations can never exceed total units.
    pub fn allocate(
        env: Env,
        caller: Address,
        distribution_id: String,
        investor: Address,
        units: i128,
    ) -> Result<i128, Error> {
        caller.require_auth();
        if units <= 0 {
            return Err(Error::InvalidAmount);
        }
        let mut distribution = get_distribution_or_error(&env, &distribution_id)?;
        require_issuer_or_admin(&env, &caller, &distribution)?;
        if distribution.status != DistributionStatus::Funded {
            return Err(Error::DistributionClosed);
        }
        let key = DataKey::Allocation(distribution_id.clone(), investor.clone());
        let current: i128 = env.storage().persistent().get(&key).unwrap_or(0);
        if distribution.allocated_units + units > distribution.total_units {
            return Err(Error::OverAllocated);
        }
        distribution.allocated_units += units;
        env.storage().persistent().set(&key, &(current + units));
        env.storage().persistent().set(
            &DataKey::Distribution(distribution_id.clone()),
            &distribution,
        );
        UnitsAllocated {
            distribution_id,
            investor,
            units: current + units,
        }
        .publish(&env);
        Ok(current + units)
    }

    /// Claims the investor's pro-rata share. Rounding dust stays in the contract
    /// and can be recovered by the issuer after the deadline.
    pub fn claim(env: Env, investor: Address, distribution_id: String) -> Result<i128, Error> {
        investor.require_auth();
        let mut distribution = get_distribution_or_error(&env, &distribution_id)?;
        if distribution.status != DistributionStatus::Funded {
            return Err(Error::DistributionClosed);
        }
        let claim_key = DataKey::Claimed(distribution_id.clone(), investor.clone());
        if env
            .storage()
            .persistent()
            .get::<_, bool>(&claim_key)
            .unwrap_or(false)
        {
            return Err(Error::AlreadyClaimed);
        }
        let units: i128 = env
            .storage()
            .persistent()
            .get(&DataKey::Allocation(
                distribution_id.clone(),
                investor.clone(),
            ))
            .unwrap_or(0);
        if units <= 0 {
            return Err(Error::NothingToClaim);
        }
        let entitlement = distribution.total_amount * units / distribution.total_units;
        if entitlement <= 0 {
            return Err(Error::NothingToClaim);
        }

        let payment = token::Client::new(&env, &Self::token(env.clone())?);
        payment.transfer(&env.current_contract_address(), &investor, &entitlement);
        env.storage().persistent().set(&claim_key, &true);
        distribution.claimed_amount += entitlement;
        env.storage().persistent().set(
            &DataKey::Distribution(distribution_id.clone()),
            &distribution,
        );
        DistributionClaimed {
            distribution_id,
            investor,
            amount: entitlement,
        }
        .publish(&env);
        Ok(entitlement)
    }

    /// Closes a distribution after the deadline and returns any unclaimed balance
    /// (including rounding dust) to the issuer.
    pub fn close(env: Env, caller: Address, distribution_id: String) -> Result<i128, Error> {
        caller.require_auth();
        let mut distribution = get_distribution_or_error(&env, &distribution_id)?;
        require_issuer_or_admin(&env, &caller, &distribution)?;
        if distribution.status != DistributionStatus::Funded {
            return Err(Error::DistributionClosed);
        }
        if env.ledger().timestamp() < distribution.claim_deadline {
            return Err(Error::TooEarly);
        }
        let remaining = distribution.total_amount - distribution.claimed_amount;
        if remaining > 0 {
            let payment = token::Client::new(&env, &Self::token(env.clone())?);
            payment.transfer(
                &env.current_contract_address(),
                &distribution.issuer,
                &remaining,
            );
        }
        distribution.status = DistributionStatus::Closed;
        env.storage().persistent().set(
            &DataKey::Distribution(distribution_id.clone()),
            &distribution,
        );
        DistributionClosed {
            distribution_id,
            remaining,
        }
        .publish(&env);
        Ok(remaining)
    }

    pub fn get_distribution(env: Env, id: String) -> Result<Distribution, Error> {
        get_distribution_or_error(&env, &id)
    }

    pub fn allocation(env: Env, id: String, investor: Address) -> i128 {
        env.storage()
            .persistent()
            .get(&DataKey::Allocation(id, investor))
            .unwrap_or(0)
    }

    pub fn has_claimed(env: Env, id: String, investor: Address) -> bool {
        env.storage()
            .persistent()
            .get(&DataKey::Claimed(id, investor))
            .unwrap_or(false)
    }
}

fn require_issuer_or_admin(
    env: &Env,
    caller: &Address,
    distribution: &Distribution,
) -> Result<(), Error> {
    let admin: Address = env
        .storage()
        .instance()
        .get(&DataKey::Admin)
        .ok_or(Error::NotInitialized)?;
    if *caller != distribution.issuer && *caller != admin {
        return Err(Error::Unauthorized);
    }
    Ok(())
}

fn get_distribution_or_error(env: &Env, id: &String) -> Result<Distribution, Error> {
    env.storage()
        .persistent()
        .get(&DataKey::Distribution(id.clone()))
        .ok_or(Error::DistributionNotFound)
}

#[cfg(test)]
mod test;
