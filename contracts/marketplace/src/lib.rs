#![no_std]

use soroban_sdk::contractevent;

use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, token, Address, Env, String,
};

#[contracttype]
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum ListingStatus {
    Open = 0,
    Filled = 1,
    Cancelled = 2,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Listing {
    pub id: String,
    pub asset_id: String,
    pub seller: Address,
    pub token: Address,
    pub units: i128,
    pub price: i128,
    pub created_at: u64,
    pub expires_at: u64,
    pub status: ListingStatus,
}

#[contracttype]
pub enum DataKey {
    Admin,
    PaymentToken,
    FeeRecipient,
    FeeBps,
    Listing(String),
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    Unauthorized = 3,
    ListingExists = 4,
    ListingNotFound = 5,
    InvalidListing = 6,
    InvalidFee = 7,
    ListingNotOpen = 8,
    ListingExpired = 9,
    AllowanceTooLow = 10,
    NotSeller = 11,
}

/// Emitted when a seller lists tokenized units.
#[contractevent]
pub struct ListingCreated {
    pub listing_id: String,
    pub units: i128,
    pub price: i128,
}

/// Emitted when a listing is filled.
#[contractevent]
pub struct ListingFilled {
    pub listing_id: String,
    pub buyer: Address,
    pub price: i128,
}

/// Emitted when a listing is cancelled.
#[contractevent]
pub struct ListingCancelled {
    pub listing_id: String,
}

#[contract]
pub struct Marketplace;

#[contractimpl]
impl Marketplace {
    pub fn initialize(
        env: Env,
        admin: Address,
        payment_token: Address,
        fee_recipient: Address,
        fee_bps: u32,
    ) -> Result<(), Error> {
        if env.storage().instance().has(&DataKey::Admin) {
            return Err(Error::AlreadyInitialized);
        }
        if fee_bps > 1_000 {
            return Err(Error::InvalidFee);
        }
        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage()
            .instance()
            .set(&DataKey::PaymentToken, &payment_token);
        env.storage()
            .instance()
            .set(&DataKey::FeeRecipient, &fee_recipient);
        env.storage().instance().set(&DataKey::FeeBps, &fee_bps);
        Ok(())
    }

    pub fn set_fee(env: Env, caller: Address, fee_bps: u32) -> Result<(), Error> {
        caller.require_auth();
        require_admin(&env, &caller)?;
        if fee_bps > 1_000 {
            return Err(Error::InvalidFee);
        }
        env.storage().instance().set(&DataKey::FeeBps, &fee_bps);
        Ok(())
    }

    pub fn fee_bps(env: Env) -> u32 {
        env.storage().instance().get(&DataKey::FeeBps).unwrap_or(0)
    }

    /// Lists tokenized units. The seller keeps custody and must approve this
    /// contract as a spender for the listed units before or after listing.
    #[allow(clippy::too_many_arguments)]
    pub fn create_listing(
        env: Env,
        seller: Address,
        id: String,
        asset_id: String,
        token: Address,
        units: i128,
        price: i128,
        expires_at: u64,
    ) -> Result<Listing, Error> {
        seller.require_auth();
        if units <= 0 || price <= 0 || expires_at <= env.ledger().timestamp() {
            return Err(Error::InvalidListing);
        }
        let key = DataKey::Listing(id.clone());
        if env.storage().persistent().has(&key) {
            return Err(Error::ListingExists);
        }
        let listing = Listing {
            id: id.clone(),
            asset_id,
            seller: seller.clone(),
            token: token.clone(),
            units,
            price,
            created_at: env.ledger().timestamp(),
            expires_at,
            status: ListingStatus::Open,
        };
        env.storage().persistent().set(&key, &listing);

        let token_client = token::Client::new(&env, &token);
        if token_client.allowance(&seller, &env.current_contract_address()) < units {
            return Err(Error::AllowanceTooLow);
        }
        ListingCreated {
            listing_id: listing.id.clone(),
            units,
            price,
        }
        .publish(&env);
        Ok(listing)
    }

    /// Fills a listing. Payment and token delivery settle atomically in one
    /// transaction: either both legs succeed or neither does.
    pub fn fill(env: Env, buyer: Address, id: String) -> Result<Listing, Error> {
        buyer.require_auth();
        let mut listing = get_listing_or_error(&env, &id)?;
        if listing.status != ListingStatus::Open {
            return Err(Error::ListingNotOpen);
        }
        if env.ledger().timestamp() >= listing.expires_at {
            return Err(Error::ListingExpired);
        }
        let fee_bps = Self::fee_bps(env.clone());
        let fee = listing.price * (fee_bps as i128) / 10_000;
        let seller_amount = listing.price - fee;

        let payment_address: Address = env
            .storage()
            .instance()
            .get(&DataKey::PaymentToken)
            .ok_or(Error::NotInitialized)?;
        let payment = token::Client::new(&env, &payment_address);
        payment.transfer(&buyer, &listing.seller, &seller_amount);
        if fee > 0 {
            let fee_recipient: Address = env
                .storage()
                .instance()
                .get(&DataKey::FeeRecipient)
                .ok_or(Error::NotInitialized)?;
            payment.transfer(&buyer, &fee_recipient, &fee);
        }

        let asset_token = token::Client::new(&env, &listing.token);
        asset_token.transfer_from(
            &env.current_contract_address(),
            &listing.seller,
            &buyer,
            &listing.units,
        );

        listing.status = ListingStatus::Filled;
        ListingFilled {
            listing_id: id.clone(),
            buyer: buyer.clone(),
            price: listing.price,
        }
        .publish(&env);
        env.storage()
            .persistent()
            .set(&DataKey::Listing(id), &listing);
        Ok(listing)
    }

    pub fn cancel(env: Env, caller: Address, id: String) -> Result<Listing, Error> {
        caller.require_auth();
        let mut listing = get_listing_or_error(&env, &id)?;
        let admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .ok_or(Error::NotInitialized)?;
        if caller != listing.seller && caller != admin {
            return Err(Error::NotSeller);
        }
        if listing.status != ListingStatus::Open {
            return Err(Error::ListingNotOpen);
        }
        listing.status = ListingStatus::Cancelled;
        ListingCancelled {
            listing_id: id.clone(),
        }
        .publish(&env);
        env.storage()
            .persistent()
            .set(&DataKey::Listing(id), &listing);
        Ok(listing)
    }

    pub fn get_listing(env: Env, id: String) -> Result<Listing, Error> {
        get_listing_or_error(&env, &id)
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

fn get_listing_or_error(env: &Env, id: &String) -> Result<Listing, Error> {
    env.storage()
        .persistent()
        .get(&DataKey::Listing(id.clone()))
        .ok_or(Error::ListingNotFound)
}

#[cfg(test)]
mod test;
