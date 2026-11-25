#![no_std]

use soroban_sdk::contractevent;

use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, Address, BytesN, Env, String, Vec,
};

#[contracttype]
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum Vertical {
    Aviation = 0,
    Space = 1,
    Manufacturing = 2,
    Drones = 3,
    Marketplace = 4,
}

#[contracttype]
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum AssetStatus {
    Draft = 0,
    EvidenceReview = 1,
    Verified = 2,
    Tokenized = 3,
    Active = 4,
    Suspended = 5,
    Retired = 6,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct AssetRecord {
    pub id: String,
    pub registry_id: String,
    pub vertical: Vertical,
    pub status: AssetStatus,
    pub owner: Address,
    pub operator: String,
    pub evidence_hash: BytesN<32>,
    pub valuation_usd: i128,
    pub registered_at: u64,
    pub verified_at: u64,
    pub illustrative: bool,
}

#[contracttype]
pub enum DataKey {
    Admin,
    Issuer(Address),
    Asset(String),
    AssetIds,
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    Unauthorized = 3,
    AssetExists = 4,
    AssetNotFound = 5,
    InvalidValuation = 6,
    EvidenceMismatch = 7,
    InvalidTransition = 8,
    AlreadyAuthorized = 9,
}


/// Emitted when an issuer registers an asset.
#[contractevent]
pub struct AssetRegistered {
    pub asset_id: String,
    pub issuer: Address,
    pub valuation_usd: i128,
}

/// Emitted when a reviewer verifies an asset's evidence.
#[contractevent]
pub struct AssetVerified {
    pub asset_id: String,
    pub reviewer: Address,
}

/// Emitted when a verified asset is attached to a token contract.
#[contractevent]
pub struct AssetTokenized {
    pub asset_id: String,
    pub caller: Address,
}

/// Emitted when an asset's lifecycle status changes.
#[contractevent]
pub struct AssetStatusChanged {
    pub asset_id: String,
    pub status: u32,
}

#[contract]
pub struct AssetRegistry;

#[contractimpl]
impl AssetRegistry {
    pub fn initialize(env: Env, admin: Address) -> Result<(), Error> {
        if env.storage().instance().has(&DataKey::Admin) {
            return Err(Error::AlreadyInitialized);
        }
        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage()
            .persistent()
            .set(&DataKey::Issuer(admin.clone()), &true);
        Ok(())
    }

    pub fn admin(env: Env) -> Result<Address, Error> {
        env.storage()
            .instance()
            .get(&DataKey::Admin)
            .ok_or(Error::NotInitialized)
    }

    pub fn authorize_issuer(env: Env, caller: Address, issuer: Address) -> Result<(), Error> {
        caller.require_auth();
        require_admin(&env, &caller)?;
        if env
            .storage()
            .persistent()
            .get::<_, bool>(&DataKey::Issuer(issuer.clone()))
            .unwrap_or(false)
        {
            return Err(Error::AlreadyAuthorized);
        }
        env.storage()
            .persistent()
            .set(&DataKey::Issuer(issuer), &true);
        Ok(())
    }

    /// Registers a physical or contractual asset. The caller must be the owner
    /// and an authorised issuer. Registration does not create a token.
    #[allow(clippy::too_many_arguments)]
    pub fn register_asset(
        env: Env,
        issuer: Address,
        id: String,
        registry_id: String,
        vertical: Vertical,
        operator: String,
        evidence_hash: BytesN<32>,
        valuation_usd: i128,
    ) -> Result<AssetRecord, Error> {
        issuer.require_auth();
        if !is_issuer(&env, &issuer) {
            return Err(Error::Unauthorized);
        }
        if valuation_usd <= 0 {
            return Err(Error::InvalidValuation);
        }
        let key = DataKey::Asset(id.clone());
        if env.storage().persistent().has(&key) {
            return Err(Error::AssetExists);
        }

        let record = AssetRecord {
            id: id.clone(),
            registry_id,
            vertical,
            status: AssetStatus::Draft,
            owner: issuer.clone(),
            operator,
            evidence_hash,
            valuation_usd,
            registered_at: env.ledger().timestamp(),
            verified_at: 0,
            illustrative: false,
        };
        env.storage().persistent().set(&key, &record);
        AssetRegistered {
            asset_id: id.clone(),
            issuer: issuer.clone(),
            valuation_usd,
        }
        .publish(&env);

        let mut ids: Vec<String> = env
            .storage()
            .persistent()
            .get(&DataKey::AssetIds)
            .unwrap_or_else(|| Vec::new(&env));
        ids.push_back(id);
        env.storage().persistent().set(&DataKey::AssetIds, &ids);
        Ok(record)
    }

    /// Marks an asset verified after evidence review. The evidence hash must be
    /// the same bytes the issuer registered, preventing a silent document swap.
    pub fn verify_asset(
        env: Env,
        reviewer: Address,
        id: String,
        evidence_hash: BytesN<32>,
    ) -> Result<AssetRecord, Error> {
        reviewer.require_auth();
        require_admin(&env, &reviewer)?;
        let mut record = get_asset_or_error(&env, &id)?;
        if record.evidence_hash != evidence_hash {
            return Err(Error::EvidenceMismatch);
        }
        if record.status != AssetStatus::Draft && record.status != AssetStatus::EvidenceReview {
            return Err(Error::InvalidTransition);
        }
        record.status = AssetStatus::Verified;
        record.verified_at = env.ledger().timestamp();
        AssetVerified {
            asset_id: id.clone(),
            reviewer: reviewer.clone(),
        }
        .publish(&env);
        env.storage().persistent().set(&DataKey::Asset(id), &record);
        Ok(record)
    }

    /// Called by the tokenization flow once a token contract is attached. Only a
    /// verified asset can be tokenized.
    pub fn mark_tokenized(env: Env, caller: Address, id: String) -> Result<AssetRecord, Error> {
        caller.require_auth();
        require_admin(&env, &caller)?;
        let mut record = get_asset_or_error(&env, &id)?;
        if record.status != AssetStatus::Verified {
            return Err(Error::InvalidTransition);
        }
        record.status = AssetStatus::Tokenized;
        AssetTokenized {
            asset_id: id.clone(),
            caller: caller.clone(),
        }
        .publish(&env);
        env.storage().persistent().set(&DataKey::Asset(id), &record);
        Ok(record)
    }

    pub fn set_status(
        env: Env,
        caller: Address,
        id: String,
        status: AssetStatus,
    ) -> Result<AssetRecord, Error> {
        caller.require_auth();
        require_admin(&env, &caller)?;
        let mut record = get_asset_or_error(&env, &id)?;
        let allowed = matches!(
            (record.status, status),
            (AssetStatus::Tokenized, AssetStatus::Active)
                | (AssetStatus::Active, AssetStatus::Suspended)
                | (AssetStatus::Suspended, AssetStatus::Active)
                | (AssetStatus::Active, AssetStatus::Retired)
                | (AssetStatus::Suspended, AssetStatus::Retired)
        );
        if !allowed {
            return Err(Error::InvalidTransition);
        }
        record.status = status;
        AssetStatusChanged {
            asset_id: id.clone(),
            status: status as u32,
        }
        .publish(&env);
        env.storage().persistent().set(&DataKey::Asset(id), &record);
        Ok(record)
    }

    pub fn get_asset(env: Env, id: String) -> Result<AssetRecord, Error> {
        get_asset_or_error(&env, &id)
    }

    pub fn asset_count(env: Env) -> u32 {
        env.storage()
            .persistent()
            .get::<_, Vec<String>>(&DataKey::AssetIds)
            .map(|ids| ids.len())
            .unwrap_or(0)
    }

    pub fn asset_ids(env: Env) -> Vec<String> {
        env.storage()
            .persistent()
            .get(&DataKey::AssetIds)
            .unwrap_or_else(|| Vec::new(&env))
    }
}

fn is_issuer(env: &Env, account: &Address) -> bool {
    env.storage()
        .persistent()
        .get::<_, bool>(&DataKey::Issuer(account.clone()))
        .unwrap_or(false)
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

fn get_asset_or_error(env: &Env, id: &String) -> Result<AssetRecord, Error> {
    env.storage()
        .persistent()
        .get(&DataKey::Asset(id.clone()))
        .ok_or(Error::AssetNotFound)
}

#[cfg(test)]
mod test;
