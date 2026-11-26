#![no_std]

use soroban_sdk::contractevent;

use soroban_sdk::{
    contract, contractclient, contracterror, contractimpl, contracttype, token, Address, Env,
    String,
};

#[contractclient(name = "ComplianceClient")]
pub trait ComplianceInterface {
    fn is_eligible(env: Env, investor: Address, required_tier: u32, jurisdiction: String) -> bool;
}

#[contracttype]
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum OfferingStatus {
    Open = 0,
    Funded = 1,
    Settled = 2,
    Failed = 3,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Offering {
    pub id: String,
    pub asset_id: String,
    pub issuer: Address,
    pub target: i128,
    pub committed: i128,
    pub min_ticket: i128,
    pub opens_at: u64,
    pub closes_at: u64,
    pub investor_count: u32,
    pub status: OfferingStatus,
    pub required_tier: u32,
    pub jurisdiction: String,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Position {
    pub investor: Address,
    pub offering_id: String,
    pub amount: i128,
    pub refunded: bool,
    pub subscribed_at: u64,
}

#[contracttype]
pub enum DataKey {
    Admin,
    PaymentToken,
    Compliance,
    Offering(String),
    Position(String, Address),
    OfferingIds,
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    Unauthorized = 3,
    OfferingExists = 4,
    OfferingNotFound = 5,
    InvalidOffering = 6,
    OfferingNotOpen = 7,
    BelowMinimum = 8,
    InvalidAmount = 9,
    NotFunded = 10,
    TooEarly = 11,
    ComplianceBlocked = 12,
    NothingToRefund = 13,
}

/// Emitted when an issuer opens an offering.
#[contractevent]
pub struct OfferingCreated {
    pub offering_id: String,
    pub issuer: Address,
    pub target: i128,
}

/// Emitted when an investor subscribes.
#[contractevent]
pub struct Subscribed {
    pub offering_id: String,
    pub investor: Address,
    pub amount: i128,
}

/// Emitted when a funded offering settles to the issuer.
#[contractevent]
pub struct OfferingSettled {
    pub offering_id: String,
    pub committed: i128,
}

/// Emitted when an offering fails to reach its target.
#[contractevent]
pub struct OfferingFailed {
    pub offering_id: String,
    pub committed: i128,
}

/// Emitted when an investor claims a refund.
#[contractevent]
pub struct Refunded {
    pub offering_id: String,
    pub investor: Address,
    pub amount: i128,
}

#[contract]
pub struct Investment;

#[contractimpl]
impl Investment {
    pub fn initialize(
        env: Env,
        admin: Address,
        payment_token: Address,
        compliance: Option<Address>,
    ) -> Result<(), Error> {
        if env.storage().instance().has(&DataKey::Admin) {
            return Err(Error::AlreadyInitialized);
        }
        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage()
            .instance()
            .set(&DataKey::PaymentToken, &payment_token);
        if let Some(address) = compliance {
            env.storage().instance().set(&DataKey::Compliance, &address);
        }
        Ok(())
    }

    pub fn payment_token(env: Env) -> Result<Address, Error> {
        env.storage()
            .instance()
            .get(&DataKey::PaymentToken)
            .ok_or(Error::NotInitialized)
    }

    /// Creates an offering. No funds move at creation and no token is minted.
    #[allow(clippy::too_many_arguments)]
    pub fn create_offering(
        env: Env,
        issuer: Address,
        id: String,
        asset_id: String,
        target: i128,
        min_ticket: i128,
        opens_at: u64,
        closes_at: u64,
        required_tier: u32,
        jurisdiction: String,
    ) -> Result<Offering, Error> {
        issuer.require_auth();
        if target <= 0 || min_ticket <= 0 || min_ticket > target || closes_at <= opens_at {
            return Err(Error::InvalidOffering);
        }
        let key = DataKey::Offering(id.clone());
        if env.storage().persistent().has(&key) {
            return Err(Error::OfferingExists);
        }
        let offering = Offering {
            id: id.clone(),
            asset_id,
            issuer,
            target,
            committed: 0,
            min_ticket,
            opens_at,
            closes_at,
            investor_count: 0,
            status: OfferingStatus::Open,
            required_tier,
            jurisdiction,
        };
        env.storage().persistent().set(&key, &offering);
        OfferingCreated {
            offering_id: id.clone(),
            issuer: offering.issuer.clone(),
            target,
        }
        .publish(&env);
        let mut ids: soroban_sdk::Vec<String> = env
            .storage()
            .persistent()
            .get(&DataKey::OfferingIds)
            .unwrap_or_else(|| soroban_sdk::Vec::new(&env));
        ids.push_back(id);
        env.storage().persistent().set(&DataKey::OfferingIds, &ids);
        Ok(offering)
    }

    /// Subscribes USDC (or another SAC) into the contract. The transfer is the
    /// settlement leg; the contract holds funds until settlement or refund.
    pub fn subscribe(
        env: Env,
        investor: Address,
        offering_id: String,
        amount: i128,
    ) -> Result<Position, Error> {
        investor.require_auth();
        if amount <= 0 {
            return Err(Error::InvalidAmount);
        }
        let mut offering = get_offering_or_error(&env, &offering_id)?;
        let now = env.ledger().timestamp();
        if offering.status != OfferingStatus::Open
            || now < offering.opens_at
            || now >= offering.closes_at
        {
            return Err(Error::OfferingNotOpen);
        }
        if amount < offering.min_ticket {
            return Err(Error::BelowMinimum);
        }
        check_compliance(&env, &investor, &offering)?;

        let position_key = DataKey::Position(offering_id.clone(), investor.clone());
        let existing: Option<Position> = env.storage().persistent().get(&position_key);
        if existing.is_none() {
            offering.investor_count += 1;
        }

        let payment = token::Client::new(&env, &Self::payment_token(env.clone())?);
        payment.transfer(&investor, env.current_contract_address(), &amount);

        let position = match existing {
            Some(mut position) => {
                position.amount += amount;
                position
            }
            None => Position {
                investor: investor.clone(),
                offering_id: offering_id.clone(),
                amount,
                refunded: false,
                subscribed_at: now,
            },
        };
        env.storage().persistent().set(&position_key, &position);

        offering.committed += amount;
        if offering.committed >= offering.target {
            offering.status = OfferingStatus::Funded;
        }
        env.storage()
            .persistent()
            .set(&DataKey::Offering(offering_id.clone()), &offering);
        Subscribed {
            offering_id,
            investor,
            amount,
        }
        .publish(&env);
        Ok(position)
    }

    /// Settles a funded offering after the close, paying the issuer the committed
    /// amount. The issuer must authorise settlement.
    pub fn settle(env: Env, offering_id: String) -> Result<Offering, Error> {
        let mut offering = get_offering_or_error(&env, &offering_id)?;
        offering.issuer.require_auth();
        if env.ledger().timestamp() < offering.closes_at {
            return Err(Error::TooEarly);
        }
        if offering.status != OfferingStatus::Funded {
            return Err(Error::NotFunded);
        }
        let payment = token::Client::new(&env, &Self::payment_token(env.clone())?);
        payment.transfer(
            &env.current_contract_address(),
            &offering.issuer,
            &offering.committed,
        );
        offering.status = OfferingStatus::Settled;
        env.storage()
            .persistent()
            .set(&DataKey::Offering(offering_id.clone()), &offering);
        OfferingSettled {
            offering_id,
            committed: offering.committed,
        }
        .publish(&env);
        Ok(offering)
    }

    /// Marks an offering failed after its close when the target was not reached.
    pub fn mark_failed(env: Env, caller: Address, offering_id: String) -> Result<Offering, Error> {
        caller.require_auth();
        require_admin(&env, &caller)?;
        let mut offering = get_offering_or_error(&env, &offering_id)?;
        if env.ledger().timestamp() < offering.closes_at {
            return Err(Error::TooEarly);
        }
        if offering.status == OfferingStatus::Settled || offering.status == OfferingStatus::Failed {
            return Err(Error::NotFunded);
        }
        offering.status = OfferingStatus::Failed;
        env.storage()
            .persistent()
            .set(&DataKey::Offering(offering_id.clone()), &offering);
        OfferingFailed {
            offering_id,
            committed: offering.committed,
        }
        .publish(&env);
        Ok(offering)
    }

    /// Refunds a single position after an offering is marked failed.
    pub fn claim_refund(env: Env, investor: Address, offering_id: String) -> Result<i128, Error> {
        investor.require_auth();
        let offering = get_offering_or_error(&env, &offering_id)?;
        if offering.status != OfferingStatus::Failed {
            return Err(Error::NotFunded);
        }
        let key = DataKey::Position(offering_id.clone(), investor.clone());
        let mut position: Position = env
            .storage()
            .persistent()
            .get(&key)
            .ok_or(Error::NothingToRefund)?;
        if position.refunded {
            return Err(Error::NothingToRefund);
        }
        let payment = token::Client::new(&env, &Self::payment_token(env.clone())?);
        payment.transfer(&env.current_contract_address(), &investor, &position.amount);
        position.refunded = true;
        let refund = position.amount;
        env.storage().persistent().set(&key, &position);
        Refunded {
            offering_id,
            investor,
            amount: refund,
        }
        .publish(&env);
        Ok(refund)
    }

    /// Refunds all provided failed offerings for an investor in one transaction.
    pub fn reembolsar_todo(
        env: Env,
        investor: Address,
        offering_ids: soroban_sdk::Vec<String>,
    ) -> i128 {
        investor.require_auth();
        let payment = token::Client::new(&env, &Self::payment_token(env.clone()).unwrap());
        let mut total: i128 = 0;
        for id in offering_ids.iter() {
            let offering = match get_offering_or_error(&env, &id) {
                Ok(o) => o,
                Err(_) => continue,
            };
            if offering.status != OfferingStatus::Failed {
                continue;
            }
            let key = DataKey::Position(id.clone(), investor.clone());
            let mut position: Position = match env.storage().persistent().get(&key) {
                Some(p) => p,
                None => continue,
            };
            if position.refunded {
                continue;
            }
            payment.transfer(&env.current_contract_address(), &investor, &position.amount);
            position.refunded = true;
            let refund = position.amount;
            env.storage().persistent().set(&key, &position);
            Refunded {
                offering_id: id.clone(),
                investor: investor.clone(),
                amount: refund,
            }
            .publish(&env);
            total += refund;
        }
        total
    }

    /// Cancels a pending subscription and refunds the investor.
    pub fn cancelar_suscripcion(
        env: Env,
        investor: Address,
        offering_id: String,
    ) -> Result<i128, Error> {
        investor.require_auth();
        let mut offering = get_offering_or_error(&env, &offering_id)?;
        if offering.status != OfferingStatus::Open {
            return Err(Error::OfferingNotOpen);
        }
        let key = DataKey::Position(offering_id.clone(), investor.clone());
        let mut position: Position = env
            .storage()
            .persistent()
            .get(&key)
            .ok_or(Error::NothingToRefund)?;
        if position.refunded {
            return Err(Error::NothingToRefund);
        }
        let payment = token::Client::new(&env, &Self::payment_token(env.clone())?);
        payment.transfer(&env.current_contract_address(), &investor, &position.amount);
        position.refunded = true;
        let refund = position.amount;
        env.storage().persistent().set(&key, &position);

        offering.committed -= refund;
        if offering.committed < 0 {
            offering.committed = 0;
        }
        env.storage()
            .persistent()
            .set(&DataKey::Offering(offering_id.clone()), &offering);

        Refunded {
            offering_id,
            investor,
            amount: refund,
        }
        .publish(&env);
        Ok(refund)
    }

    /// Extends an offering's close date.
    pub fn extender_oferta(
        env: Env,
        caller: Address,
        offering_id: String,
        extra_seconds: u64,
    ) -> Result<Offering, Error> {
        caller.require_auth();
        let mut offering = get_offering_or_error(&env, &offering_id)?;
        if caller != offering.issuer {
            require_admin(&env, &caller)?;
        }
        if offering.status != OfferingStatus::Open && offering.status != OfferingStatus::Funded {
            return Err(Error::OfferingNotOpen);
        }
        if extra_seconds == 0 {
            return Err(Error::InvalidAmount);
        }
        offering.closes_at += extra_seconds;
        env.storage()
            .persistent()
            .set(&DataKey::Offering(offering_id), &offering);
        Ok(offering)
    }

    /// Subscribes with a 10% discount when the amount reaches 5 XLM.
    pub fn suscribir_con_descuento(
        env: Env,
        investor: Address,
        offering_id: String,
        amount: i128,
    ) -> Result<Position, Error> {
        investor.require_auth();
        if amount <= 0 {
            return Err(Error::InvalidAmount);
        }
        let mut offering = get_offering_or_error(&env, &offering_id)?;
        let now = env.ledger().timestamp();
        if offering.status != OfferingStatus::Open
            || now < offering.opens_at
            || now >= offering.closes_at
        {
            return Err(Error::OfferingNotOpen);
        }
        let discounted = if amount >= 50_000_000 {
            amount * 90 / 100
        } else {
            amount
        };
        if discounted < offering.min_ticket {
            return Err(Error::BelowMinimum);
        }
        check_compliance(&env, &investor, &offering)?;

        let position_key = DataKey::Position(offering_id.clone(), investor.clone());
        let existing: Option<Position> = env.storage().persistent().get(&position_key);
        if existing.is_none() {
            offering.investor_count += 1;
        }

        let payment = token::Client::new(&env, &Self::payment_token(env.clone())?);
        payment.transfer(&investor, env.current_contract_address(), &discounted);

        let position = match existing {
            Some(mut position) => {
                position.amount += discounted;
                position
            }
            None => Position {
                investor: investor.clone(),
                offering_id: offering_id.clone(),
                amount: discounted,
                refunded: false,
                subscribed_at: now,
            },
        };
        env.storage().persistent().set(&position_key, &position);

        offering.committed += discounted;
        if offering.committed >= offering.target {
            offering.status = OfferingStatus::Funded;
        }
        env.storage()
            .persistent()
            .set(&DataKey::Offering(offering_id.clone()), &offering);
        Subscribed {
            offering_id,
            investor,
            amount: discounted,
        }
        .publish(&env);
        Ok(position)
    }

    /// Subscribes multiple investors to an offering in one transaction.
    pub fn suscribir_masivo(
        env: Env,
        offering_id: String,
        investors: soroban_sdk::Vec<Address>,
        amounts: soroban_sdk::Vec<i128>,
    ) -> i128 {
        let mut offering = match get_offering_or_error(&env, &offering_id) {
            Ok(o) => o,
            Err(_) => return 0,
        };
        let now = env.ledger().timestamp();
        if offering.status != OfferingStatus::Open
            || now < offering.opens_at
            || now >= offering.closes_at
        {
            return 0;
        }
        let payment = token::Client::new(&env, &Self::payment_token(env.clone()).unwrap());
        let mut total_committed: i128 = 0;
        let len = investors.len().min(amounts.len());
        for i in 0..len {
            let investor = investors.get(i).unwrap();
            let amount = amounts.get(i).unwrap();
            if amount <= 0 || amount < offering.min_ticket {
                continue;
            }
            // compliance check
            if let Some(compliance) = env.storage().instance().get::<_, Address>(&DataKey::Compliance) {
                let client = ComplianceClient::new(&env, &compliance);
                if !client.is_eligible(&investor, &offering.required_tier, &offering.jurisdiction) {
                    continue;
                }
            }
            investor.require_auth();
            let position_key = DataKey::Position(offering_id.clone(), investor.clone());
            let existing: Option<Position> = env.storage().persistent().get(&position_key);
            if existing.is_none() {
                offering.investor_count += 1;
            }
            payment.transfer(&investor, env.current_contract_address(), &amount);
            let position = match existing {
                Some(mut p) => {
                    p.amount += amount;
                    p
                }
                None => Position {
                    investor: investor.clone(),
                    offering_id: offering_id.clone(),
                    amount,
                    refunded: false,
                    subscribed_at: now,
                },
            };
            env.storage().persistent().set(&position_key, &position);
            offering.committed += amount;
            total_committed += amount;
            Subscribed {
                offering_id: offering_id.clone(),
                investor,
                amount,
            }
            .publish(&env);
        }
        if offering.committed >= offering.target {
            offering.status = OfferingStatus::Funded;
        }
        env.storage()
            .persistent()
            .set(&DataKey::Offering(offering_id), &offering);
        total_committed
    }

    /// Marks multiple offerings as failed after their close.
    pub fn marcar_fallido_masivo(
        env: Env,
        caller: Address,
        offering_ids: soroban_sdk::Vec<String>,
    ) -> u32 {
        caller.require_auth();
        if require_admin(&env, &caller).is_err() {
            return 0;
        }
        let now = env.ledger().timestamp();
        let mut marked = 0_u32;
        for id in offering_ids.iter() {
            if let Ok(mut offering) = get_offering_or_error(&env, &id) {
                if now < offering.closes_at {
                    continue;
                }
                if offering.status == OfferingStatus::Settled || offering.status == OfferingStatus::Failed {
                    continue;
                }
                offering.status = OfferingStatus::Failed;
                env.storage()
                    .persistent()
                    .set(&DataKey::Offering(id.clone()), &offering);
                OfferingFailed {
                    offering_id: id.clone(),
                    committed: offering.committed,
                }
                .publish(&env);
                marked += 1;
            }
        }
        marked
    }

    pub fn get_offering(env: Env, offering_id: String) -> Result<Offering, Error> {
        get_offering_or_error(&env, &offering_id)
    }

    pub fn get_position(
        env: Env,
        offering_id: String,
        investor: Address,
    ) -> Result<Position, Error> {
        env.storage()
            .persistent()
            .get(&DataKey::Position(offering_id, investor))
            .ok_or(Error::OfferingNotFound)
    }

    pub fn offering_ids(env: Env) -> soroban_sdk::Vec<String> {
        env.storage()
            .persistent()
            .get(&DataKey::OfferingIds)
            .unwrap_or_else(|| soroban_sdk::Vec::new(&env))
    }
}

fn check_compliance(env: &Env, investor: &Address, offering: &Offering) -> Result<(), Error> {
    let compliance: Address = match env.storage().instance().get(&DataKey::Compliance) {
        Some(address) => address,
        None => return Ok(()),
    };
    let client = ComplianceClient::new(env, &compliance);
    if !client.is_eligible(investor, &offering.required_tier, &offering.jurisdiction) {
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

fn get_offering_or_error(env: &Env, id: &String) -> Result<Offering, Error> {
    env.storage()
        .persistent()
        .get(&DataKey::Offering(id.clone()))
        .ok_or(Error::OfferingNotFound)
}

#[cfg(test)]
mod test;
