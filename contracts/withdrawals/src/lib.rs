#![no_std]

use soroban_sdk::{contract, contracterror, contractimpl, contracttype, Address, Env};

#[contracttype]
pub enum DataKey {
    Count(Address),
    Total,
    Balance(Address),
    BonusTotal,
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

    /// Deposits an amount for a user. The first deposit grants a 20 bonus,
    /// every subsequent deposit grants a 10 bonus. Returns the new balance.
    pub fn depositar(env: Env, user: Address, amount: i128) -> i128 {
        user.require_auth();
        if amount <= 0 {
            panic!("amount must be positive");
        }

        let count: u32 = env
            .storage()
            .persistent()
            .get(&DataKey::Count(user.clone()))
            .unwrap_or(0);

        let bonus: i128 = if count == 0 { 20 } else { 10 };

        let balance: i128 = env
            .storage()
            .persistent()
            .get(&DataKey::Balance(user.clone()))
            .unwrap_or(0);
        let new_balance = balance + amount + bonus;
        env.storage()
            .persistent()
            .set(&DataKey::Balance(user.clone()), &new_balance);

        env.storage()
            .persistent()
            .set(&DataKey::Count(user), &(count + 1));

        let bonus_total: i128 = env
            .storage()
            .persistent()
            .get(&DataKey::BonusTotal)
            .unwrap_or(0);
        env.storage()
            .persistent()
            .set(&DataKey::BonusTotal, &(bonus_total + bonus));

        let total: i128 = env
            .storage()
            .persistent()
            .get(&DataKey::Total)
            .unwrap_or(0);
        env.storage()
            .persistent()
            .set(&DataKey::Total, &(total + amount + bonus));

        new_balance
    }

    pub fn saldo(env: Env, user: Address) -> i128 {
        env.storage()
            .persistent()
            .get(&DataKey::Balance(user))
            .unwrap_or(0)
    }

    pub fn bonus_total(env: Env) -> i128 {
        env.storage()
            .persistent()
            .get(&DataKey::BonusTotal)
            .unwrap_or(0)
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
    fn depositar_grants_bonus_and_updates_balance() {
        let env = Env::default();
        env.mock_all_auths();
        let contract_id = env.register(Withdrawals, ());
        let client = WithdrawalsClient::new(&env, &contract_id);
        let user = Address::generate(&env);

        assert_eq!(client.depositar(&user, &100), 120);
        assert_eq!(client.depositar(&user, &50), 180);
        assert_eq!(client.saldo(&user), 180);
        assert_eq!(client.bonus_total(), 30);
    }

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
