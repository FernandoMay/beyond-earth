#![no_std]

use soroban_sdk::{contract, contracterror, contractimpl, contracttype, Address, Env};

#[contracttype]
pub enum DataKey {
    Count(Address),
    Total,
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    NotInitialized = 1,
}

#[contract]
pub struct Withdrawals;

#[contractimpl]
impl Withdrawals {
    /// First withdrawal credits 20, every subsequent one credits 10.
    pub fn retirar(env: Env, user: Address) -> i128 {
        user.require_auth();

        let count: u32 = env
            .storage()
            .persistent()
            .get(&DataKey::Count(user.clone()))
            .unwrap_or(0);

        let amount: i128 = if count == 0 { 20 } else { 10 };

        env.storage()
            .persistent()
            .set(&DataKey::Count(user), &(count + 1));

        let total: i128 = env.storage().persistent().get(&DataKey::Total).unwrap_or(0);
        env.storage()
            .persistent()
            .set(&DataKey::Total, &(total + amount));

        amount
    }

    pub fn total_retirado(env: Env) -> i128 {
        env.storage().persistent().get(&DataKey::Total).unwrap_or(0)
    }

    pub fn retiros_de(env: Env, user: Address) -> u32 {
        env.storage()
            .persistent()
            .get(&DataKey::Count(user))
            .unwrap_or(0)
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::testutils::Address as _;
    use soroban_sdk::Env;

    #[test]
    fn first_retirar_sums_twenty_then_ten() {
        let env = Env::default();
        env.mock_all_auths();
        let contract_id = env.register(Withdrawals, ());
        let client = WithdrawalsClient::new(&env, &contract_id);
        let user = Address::generate(&env);

        assert_eq!(client.retirar(&user), 20);
        assert_eq!(client.retirar(&user), 10);
        assert_eq!(client.retirar(&user), 10);
        assert_eq!(client.total_retirado(), 40);
        assert_eq!(client.retiros_de(&user), 3);
    }
}
