#![no_std]

use soroban_sdk::contractevent;

use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, token, Address, Env, String,
};

#[contracttype]
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum EscrowStatus {
    Funded = 0,
    Released = 1,
    Refunded = 2,
    Disputed = 3,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Escrow {
    pub id: String,
    pub buyer: Address,
    pub seller: Address,
    pub arbiter: Address,
    pub amount: i128,
    pub status: EscrowStatus,
    pub created_at: u64,
    pub resolved_at: u64,
}

#[contracttype]
pub enum DataKey {
    Admin,
    Token,
    Escrow(String),
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    Unauthorized = 3,
    EscrowExists = 4,
    EscrowNotFound = 5,
    InvalidAmount = 6,
    InvalidStatus = 7,
    InvalidParties = 8,
}


/// Emitted when a buyer funds an escrow.
#[contractevent]
pub struct EscrowCreated {
    pub escrow_id: String,
    pub buyer: Address,
    pub seller: Address,
    pub amount: i128,
}

/// Emitted when a party disputes an escrow.
#[contractevent]
pub struct EscrowDisputed {
    pub escrow_id: String,
}

/// Emitted when escrowed funds are released to the seller.
#[contractevent]
pub struct EscrowReleased {
    pub escrow_id: String,
    pub seller: Address,
    pub amount: i128,
}

/// Emitted when escrowed funds are refunded to the buyer.
#[contractevent]
pub struct EscrowRefunded {
    pub escrow_id: String,
    pub buyer: Address,
    pub amount: i128,
}

#[contract]
pub struct EscrowContract;

#[contractimpl]
impl EscrowContract {
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

    /// Creates a funded escrow. The buyer's tokens move into the contract; the
    /// seller cannot receive them until the arbiter releases the escrow.
    pub fn create_escrow(
        env: Env,
        buyer: Address,
        id: String,
        seller: Address,
        arbiter: Address,
        amount: i128,
    ) -> Result<Escrow, Error> {
        buyer.require_auth();
        if amount <= 0 {
            return Err(Error::InvalidAmount);
        }
        if buyer == seller || arbiter == buyer || arbiter == seller {
            return Err(Error::InvalidParties);
        }
        let key = DataKey::Escrow(id.clone());
        if env.storage().persistent().has(&key) {
            return Err(Error::EscrowExists);
        }
        let payment = token::Client::new(&env, &Self::token(env.clone())?);
        payment.transfer(&buyer, env.current_contract_address(), &amount);

        let escrow = Escrow {
            id: id.clone(),
            buyer,
            seller,
            arbiter,
            amount,
            status: EscrowStatus::Funded,
            created_at: env.ledger().timestamp(),
            resolved_at: 0,
        };
        env.storage().persistent().set(&key, &escrow);
        EscrowCreated {
            escrow_id: id.clone(),
            buyer: escrow.buyer.clone(),
            seller: escrow.seller.clone(),
            amount,
        }
        .publish(&env);
        Ok(escrow)
    }

    pub fn dispute(env: Env, caller: Address, id: String) -> Result<Escrow, Error> {
        caller.require_auth();
        let mut escrow = get_escrow_or_error(&env, &id)?;
        if caller != escrow.buyer && caller != escrow.seller {
            return Err(Error::Unauthorized);
        }
        if escrow.status != EscrowStatus::Funded {
            return Err(Error::InvalidStatus);
        }
        escrow.status = EscrowStatus::Disputed;
        EscrowDisputed {
            escrow_id: id.clone(),
        }
        .publish(&env);
        env.storage()
            .persistent()
            .set(&DataKey::Escrow(id), &escrow);
        Ok(escrow)
    }

    /// Releases funds to the seller. Only the arbiter or contract admin can do so.
    pub fn release(env: Env, caller: Address, id: String) -> Result<Escrow, Error> {
        caller.require_auth();
        let mut escrow = get_escrow_or_error(&env, &id)?;
        require_resolver(&env, &caller, &escrow)?;
        if escrow.status != EscrowStatus::Funded && escrow.status != EscrowStatus::Disputed {
            return Err(Error::InvalidStatus);
        }
        let payment = token::Client::new(&env, &Self::token(env.clone())?);
        payment.transfer(
            &env.current_contract_address(),
            &escrow.seller,
            &escrow.amount,
        );
        escrow.status = EscrowStatus::Released;
        escrow.resolved_at = env.ledger().timestamp();
        EscrowReleased {
            escrow_id: id.clone(),
            seller: escrow.seller.clone(),
            amount: escrow.amount,
        }
        .publish(&env);
        env.storage()
            .persistent()
            .set(&DataKey::Escrow(id), &escrow);
        Ok(escrow)
    }

    /// Returns funds to the buyer. Only the arbiter or contract admin can do so.
    pub fn refund(env: Env, caller: Address, id: String) -> Result<Escrow, Error> {
        caller.require_auth();
        let mut escrow = get_escrow_or_error(&env, &id)?;
        require_resolver(&env, &caller, &escrow)?;
        if escrow.status != EscrowStatus::Funded && escrow.status != EscrowStatus::Disputed {
            return Err(Error::InvalidStatus);
        }
        let payment = token::Client::new(&env, &Self::token(env.clone())?);
        payment.transfer(
            &env.current_contract_address(),
            &escrow.buyer,
            &escrow.amount,
        );
        escrow.status = EscrowStatus::Refunded;
        escrow.resolved_at = env.ledger().timestamp();
        EscrowRefunded {
            escrow_id: id.clone(),
            buyer: escrow.buyer.clone(),
            amount: escrow.amount,
        }
        .publish(&env);
        env.storage()
            .persistent()
            .set(&DataKey::Escrow(id), &escrow);
        Ok(escrow)
    }

    pub fn get_escrow(env: Env, id: String) -> Result<Escrow, Error> {
        get_escrow_or_error(&env, &id)
    }
}

fn require_resolver(env: &Env, caller: &Address, escrow: &Escrow) -> Result<(), Error> {
    let admin: Address = env
        .storage()
        .instance()
        .get(&DataKey::Admin)
        .ok_or(Error::NotInitialized)?;
    if *caller != escrow.arbiter && *caller != admin {
        return Err(Error::Unauthorized);
    }
    Ok(())
}

fn get_escrow_or_error(env: &Env, id: &String) -> Result<Escrow, Error> {
    env.storage()
        .persistent()
        .get(&DataKey::Escrow(id.clone()))
        .ok_or(Error::EscrowNotFound)
}

#[cfg(test)]
mod test;
