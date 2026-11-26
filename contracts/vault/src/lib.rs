#![no_std]

use soroban_sdk::contractevent;
use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, token, Address, Env, String,
};

#[contracttype]
pub enum DataKey {
    Admin,
    Token,
    Amount,
    Code,
    Claimed,
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    InvalidAmount = 3,
    InvalidCode = 4,
    AlreadyClaimed = 5,
    Unauthorized = 6,
}

#[contractevent]
pub struct VaultFunded {
    pub amount: i128,
}

#[contractevent]
pub struct VaultClaimed {
    pub claimer: Address,
    pub amount: i128,
    pub code: String,
}

#[contract]
pub struct Vault;

#[contractimpl]
impl Vault {
    pub fn initialize(
        env: Env,
        admin: Address,
        token: Address,
        amount: i128,
        code: String,
    ) -> Result<(), Error> {
        if env.storage().instance().has(&DataKey::Admin) {
            return Err(Error::AlreadyInitialized);
        }
        if amount <= 0 {
            return Err(Error::InvalidAmount);
        }
        admin.require_auth();
        let payment = token::Client::new(&env, &token);
        payment.transfer(&admin, env.current_contract_address(), &amount);

        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::Token, &token);
        env.storage().instance().set(&DataKey::Amount, &amount);
        env.storage().instance().set(&DataKey::Code, &code);
        env.storage().instance().set(&DataKey::Claimed, &false);

        VaultFunded { amount }.publish(&env);
        Ok(())
    }

    pub fn saldo(env: Env) -> i128 {
        env.storage().instance().get(&DataKey::Amount).unwrap_or(0)
    }

    pub fn codigo(env: Env) -> String {
        env.storage()
            .instance()
            .get(&DataKey::Code)
            .unwrap_or_else(|| String::from_str(&env, ""))
    }

    pub fn reclamar(env: Env, caller: Address, code: String) -> Result<i128, Error> {
        caller.require_auth();
        let stored_code: String = env
            .storage()
            .instance()
            .get(&DataKey::Code)
            .ok_or(Error::NotInitialized)?;
        if code != stored_code {
            return Err(Error::InvalidCode);
        }
        let claimed: bool = env
            .storage()
            .instance()
            .get(&DataKey::Claimed)
            .unwrap_or(false);
        if claimed {
            return Err(Error::AlreadyClaimed);
        }
        let amount: i128 = env
            .storage()
            .instance()
            .get(&DataKey::Amount)
            .ok_or(Error::NotInitialized)?;
        if amount <= 0 {
            return Err(Error::InvalidAmount);
        }
        let token: Address = env
            .storage()
            .instance()
            .get(&DataKey::Token)
            .ok_or(Error::NotInitialized)?;
        let payment = token::Client::new(&env, &token);
        payment.transfer(&env.current_contract_address(), &caller, &amount);

        env.storage().instance().set(&DataKey::Amount, &0_i128);
        env.storage().instance().set(&DataKey::Claimed, &true);

        VaultClaimed {
            claimer: caller,
            amount,
            code: stored_code,
        }
        .publish(&env);
        Ok(amount)
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{testutils::Address as _, token, Address, Env, String};

    #[test]
    fn funds_and_claims_with_code() {
        let env = Env::default();
        env.mock_all_auths();
        let admin = Address::generate(&env);
        let claimer = Address::generate(&env);
        let sac = env.register_stellar_asset_contract_v2(admin.clone());
        let token = sac.address();
        let token_admin = token::StellarAssetClient::new(&env, &token);
        token_admin.mint(&admin, &5555);

        let contract_id = env.register(Vault, ());
        let client = VaultClient::new(&env, &contract_id);
        client.initialize(&admin, &token, &5555, &String::from_str(&env, "Ship It"));
        assert_eq!(client.saldo(), 5555);

        let amount = client.reclamar(&claimer, &String::from_str(&env, "Ship It"));
        assert_eq!(amount, 5555);
        assert_eq!(client.saldo(), 0);
    }

    #[test]
    fn rejects_wrong_code() {
        let env = Env::default();
        env.mock_all_auths();
        let admin = Address::generate(&env);
        let claimer = Address::generate(&env);
        let sac = env.register_stellar_asset_contract_v2(admin.clone());
        let token = sac.address();
        let token_admin = token::StellarAssetClient::new(&env, &token);
        token_admin.mint(&admin, &5555);

        let contract_id = env.register(Vault, ());
        let client = VaultClient::new(&env, &contract_id);
        client.initialize(&admin, &token, &5555, &String::from_str(&env, "Ship It"));

        let result = client.try_reclamar(&claimer, &String::from_str(&env, "Wrong"));
        assert!(result.is_err());
    }
}
