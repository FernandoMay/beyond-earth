#![no_std]

use soroban_sdk::contractevent;

use soroban_sdk::{contract, contracterror, contractimpl, contracttype, Address, Env, String};

#[contracttype]
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum InvestorStatus {
    Pending = 0,
    Approved = 1,
    Suspended = 2,
    Expired = 3,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct InvestorRecord {
    pub investor: Address,
    pub tier: u32,
    pub jurisdiction: String,
    pub status: InvestorStatus,
    pub expires_at: u64,
    pub updated_at: u64,
}

#[contracttype]
pub enum DataKey {
    Admin,
    Officer(Address),
    Jurisdiction(String),
    Investor(Address),
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    Unauthorized = 3,
    InvalidTier = 4,
    JurisdictionNotAllowed = 5,
    InvestorNotFound = 6,
    InvalidExpiry = 7,
    AlreadyAuthorized = 8,
    InvalidTransition = 9,
}

/// Emitted when an investor's eligibility record changes.
#[contractevent]
pub struct InvestorUpdated {
    pub investor: Address,
    pub tier: u32,
    pub approved: bool,
}

#[contract]
pub struct Compliance;

#[contractimpl]
impl Compliance {
    pub fn initialize(env: Env, admin: Address) -> Result<(), Error> {
        if env.storage().instance().has(&DataKey::Admin) {
            return Err(Error::AlreadyInitialized);
        }
        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage()
            .persistent()
            .set(&DataKey::Officer(admin.clone()), &true);
        Ok(())
    }

    pub fn authorize_officer(env: Env, caller: Address, officer: Address) -> Result<(), Error> {
        caller.require_auth();
        require_admin(&env, &caller)?;
        if env
            .storage()
            .persistent()
            .get::<_, bool>(&DataKey::Officer(officer.clone()))
            .unwrap_or(false)
        {
            return Err(Error::AlreadyAuthorized);
        }
        env.storage()
            .persistent()
            .set(&DataKey::Officer(officer), &true);
        Ok(())
    }

    /// Adds or removes a jurisdiction from the allowlist.
    pub fn set_jurisdiction(
        env: Env,
        caller: Address,
        jurisdiction: String,
        allowed: bool,
    ) -> Result<(), Error> {
        caller.require_auth();
        require_officer(&env, &caller)?;
        env.storage()
            .persistent()
            .set(&DataKey::Jurisdiction(jurisdiction), &allowed);
        Ok(())
    }

    pub fn is_jurisdiction_allowed(env: Env, jurisdiction: String) -> bool {
        env.storage()
            .persistent()
            .get(&DataKey::Jurisdiction(jurisdiction))
            .unwrap_or(false)
    }

    /// Records an approved investor with a tier and expiry. Tier 0 is not a valid
    /// approved tier; use `suspend_investor` to remove eligibility.
    pub fn approve_investor(
        env: Env,
        officer: Address,
        investor: Address,
        tier: u32,
        jurisdiction: String,
        expires_at: u64,
    ) -> Result<InvestorRecord, Error> {
        officer.require_auth();
        require_officer(&env, &officer)?;
        if tier == 0 || tier > 4 {
            return Err(Error::InvalidTier);
        }
        if expires_at <= env.ledger().timestamp() {
            return Err(Error::InvalidExpiry);
        }
        if !Self::is_jurisdiction_allowed(env.clone(), jurisdiction.clone()) {
            return Err(Error::JurisdictionNotAllowed);
        }

        let record = InvestorRecord {
            investor: investor.clone(),
            tier,
            jurisdiction,
            status: InvestorStatus::Approved,
            expires_at,
            updated_at: env.ledger().timestamp(),
        };
        InvestorUpdated {
            investor: investor.clone(),
            tier,
            approved: true,
        }
        .publish(&env);
        env.storage()
            .persistent()
            .set(&DataKey::Investor(investor), &record);
        Ok(record)
    }

    pub fn suspend_investor(
        env: Env,
        officer: Address,
        investor: Address,
    ) -> Result<InvestorRecord, Error> {
        officer.require_auth();
        require_officer(&env, &officer)?;
        let mut record = get_investor_or_error(&env, &investor)?;
        record.status = InvestorStatus::Suspended;
        record.updated_at = env.ledger().timestamp();
        InvestorUpdated {
            investor: investor.clone(),
            tier: record.tier,
            approved: false,
        }
        .publish(&env);
        env.storage()
            .persistent()
            .set(&DataKey::Investor(investor), &record);
        Ok(record)
    }

    /// Reactivates a previously suspended investor with a new expiry.
    pub fn reactivar_inversor(
        env: Env,
        officer: Address,
        investor: Address,
        expires_at: u64,
    ) -> Result<InvestorRecord, Error> {
        officer.require_auth();
        require_officer(&env, &officer)?;
        let mut record = get_investor_or_error(&env, &investor)?;
        if record.status != InvestorStatus::Suspended {
            return Err(Error::InvalidTransition);
        }
        if expires_at <= env.ledger().timestamp() {
            return Err(Error::InvalidExpiry);
        }
        record.status = InvestorStatus::Approved;
        record.expires_at = expires_at;
        record.updated_at = env.ledger().timestamp();
        InvestorUpdated {
            investor: investor.clone(),
            tier: record.tier,
            approved: true,
        }
        .publish(&env);
        env.storage()
            .persistent()
            .set(&DataKey::Investor(investor), &record);
        Ok(record)
    }

    /// Renews an approved investor's expiry date.
    pub fn renovar_inversor(
        env: Env,
        officer: Address,
        investor: Address,
        expires_at: u64,
    ) -> Result<InvestorRecord, Error> {
        officer.require_auth();
        require_officer(&env, &officer)?;
        let mut record = get_investor_or_error(&env, &investor)?;
        if record.status != InvestorStatus::Approved {
            return Err(Error::InvalidTransition);
        }
        if expires_at <= env.ledger().timestamp() {
            return Err(Error::InvalidExpiry);
        }
        record.expires_at = expires_at;
        record.updated_at = env.ledger().timestamp();
        InvestorUpdated {
            investor: investor.clone(),
            tier: record.tier,
            approved: true,
        }
        .publish(&env);
        env.storage()
            .persistent()
            .set(&DataKey::Investor(investor), &record);
        Ok(record)
    }

    /// Updates an approved investor's tier.
    pub fn actualizar_tier(
        env: Env,
        officer: Address,
        investor: Address,
        tier: u32,
    ) -> Result<InvestorRecord, Error> {
        officer.require_auth();
        require_officer(&env, &officer)?;
        let mut record = get_investor_or_error(&env, &investor)?;
        if record.status != InvestorStatus::Approved {
            return Err(Error::InvalidTransition);
        }
        if tier == 0 || tier > 4 {
            return Err(Error::InvalidTier);
        }
        record.tier = tier;
        record.updated_at = env.ledger().timestamp();
        InvestorUpdated {
            investor: investor.clone(),
            tier,
            approved: true,
        }
        .publish(&env);
        env.storage()
            .persistent()
            .set(&DataKey::Investor(investor), &record);
        Ok(record)
    }

    /// Suspends multiple investors in one transaction.
    pub fn suspender_masivo(
        env: Env,
        officer: Address,
        investors: soroban_sdk::Vec<Address>,
    ) -> u32 {
        officer.require_auth();
        if require_officer(&env, &officer).is_err() {
            return 0;
        }
        if investors.len() > 50 {
            return 0;
        }
        let mut suspended = 0_u32;
        for investor in investors.iter() {
            if let Ok(mut record) = get_investor_or_error(&env, &investor) {
                if record.status == InvestorStatus::Approved {
                    record.status = InvestorStatus::Suspended;
                    record.updated_at = env.ledger().timestamp();
                    InvestorUpdated {
                        investor: investor.clone(),
                        tier: record.tier,
                        approved: false,
                    }
                    .publish(&env);
                    env.storage()
                        .persistent()
                        .set(&DataKey::Investor(investor), &record);
                    suspended += 1;
                }
            }
        }
        suspended
    }

    pub fn get_investor(env: Env, investor: Address) -> Result<InvestorRecord, Error> {
        get_investor_or_error(&env, &investor)
    }

    /// Eligibility is evaluated against tier, status, expiry and jurisdiction at
    /// the current ledger time. A suspended or expired investor is never eligible.
    pub fn is_eligible(
        env: Env,
        investor: Address,
        required_tier: u32,
        jurisdiction: String,
    ) -> bool {
        let record = match get_investor_or_error(&env, &investor) {
            Ok(record) => record,
            Err(_) => return false,
        };
        record.status == InvestorStatus::Approved
            && record.tier >= required_tier
            && record.expires_at > env.ledger().timestamp()
            && record.jurisdiction == jurisdiction
            && Self::is_jurisdiction_allowed(env, jurisdiction)
    }

    /// Panics when eligibility fails so downstream contracts cannot continue with
    /// a non-compliant transfer or subscription.
    pub fn require_eligible(env: Env, investor: Address, required_tier: u32, jurisdiction: String) {
        if !Self::is_eligible(env, investor, required_tier, jurisdiction) {
            panic!("investor not eligible");
        }
    }
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

fn require_officer(env: &Env, caller: &Address) -> Result<(), Error> {
    if !env
        .storage()
        .persistent()
        .get::<_, bool>(&DataKey::Officer(caller.clone()))
        .unwrap_or(false)
    {
        return Err(Error::Unauthorized);
    }
    Ok(())
}

fn get_investor_or_error(env: &Env, investor: &Address) -> Result<InvestorRecord, Error> {
    env.storage()
        .persistent()
        .get(&DataKey::Investor(investor.clone()))
        .ok_or(Error::InvestorNotFound)
}

#[cfg(test)]
mod test;
