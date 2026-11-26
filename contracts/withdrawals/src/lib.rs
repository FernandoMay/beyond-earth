#![no_std]

use soroban_sdk::contractevent;
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

/// Emitted when a withdrawal is recorded.
#[contractevent]
pub struct Retirado {
    pub user: Address,
    pub amount: i128,
}

/// Emitted when a deposit is recorded.
#[contractevent]
pub struct Depositado {
    pub user: Address,
    pub amount: i128,
}

/// Emitted when a transfer occurs.
#[contractevent]
pub struct Transferido {
    pub from: Address,
    pub to: Address,
    pub amount: i128,
}

/// Emitted when a reward is granted.
#[contractevent]
pub struct Recompensado {
    pub user: Address,
    pub amount: i128,
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

        Retirado {
            user: user.clone(),
            amount,
        }
        .publish(&env);

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

        Depositado {
            user: user.clone(),
            amount: amount + bonus,
        }
        .publish(&env);

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

        let total: i128 = env.storage().persistent().get(&DataKey::Total).unwrap_or(0);
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

    /// Transfers `amount` from one user's balance to another's.
    pub fn transferir(env: Env, from: Address, to: Address, amount: i128) -> i128 {
        from.require_auth();
        if amount <= 0 {
            panic!("amount must be positive");
        }
        if from == to {
            panic!("cannot transfer to self");
        }
        let from_balance: i128 = env
            .storage()
            .persistent()
            .get(&DataKey::Balance(from.clone()))
            .unwrap_or(0);
        if from_balance < amount {
            panic!("insufficient balance");
        }
        let to_balance: i128 = env
            .storage()
            .persistent()
            .get(&DataKey::Balance(to.clone()))
            .unwrap_or(0);

        Transferido {
            from: from.clone(),
            to: to.clone(),
            amount,
        }
        .publish(&env);

        env.storage()
            .persistent()
            .set(&DataKey::Balance(from.clone()), &(from_balance - amount));
        env.storage()
            .persistent()
            .set(&DataKey::Balance(to), &(to_balance + amount));

        from_balance - amount
    }

    /// Rewards a user: 20 the first time, 10 afterwards.
    pub fn recompensar(env: Env, user: Address) -> i128 {
        user.require_auth();
        let count: u32 = env
            .storage()
            .persistent()
            .get(&DataKey::Count(user.clone()))
            .unwrap_or(0);
        let reward: i128 = if count == 0 { 20 } else { 10 };

        Recompensado {
            user: user.clone(),
            amount: reward,
        }
        .publish(&env);

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
            .set(&DataKey::BonusTotal, &(bonus_total + reward));

        reward
    }

    /// Consolidates a user's balance and accumulated bonus into a single balance.
    pub fn consolidar(env: Env, user: Address) -> i128 {
        user.require_auth();
        let balance: i128 = env
            .storage()
            .persistent()
            .get(&DataKey::Balance(user.clone()))
            .unwrap_or(0);
        let bonus_total: i128 = env
            .storage()
            .persistent()
            .get(&DataKey::BonusTotal)
            .unwrap_or(0);
        // Only consolidate if there is something to add.
        if bonus_total <= 0 {
            return balance;
        }
        let new_balance = balance + bonus_total;
        env.storage()
            .persistent()
            .set(&DataKey::Balance(user.clone()), &new_balance);
        env.storage().persistent().set(&DataKey::BonusTotal, &0i128);
        new_balance
    }

    /// Withdraws the entire balance of a user.
    pub fn retirar_todo(env: Env, user: Address) -> i128 {
        user.require_auth();
        let balance: i128 = env
            .storage()
            .persistent()
            .get(&DataKey::Balance(user.clone()))
            .unwrap_or(0);
        if balance <= 0 {
            panic!("no balance to withdraw");
        }
        Retirado {
            user: user.clone(),
            amount: balance,
        }
        .publish(&env);
        env.storage()
            .persistent()
            .set(&DataKey::Balance(user), &0_i128);
        balance
    }

    /// Deposits for multiple users in one transaction.
    pub fn depositar_masivo(
        env: Env,
        caller: Address,
        users: soroban_sdk::Vec<Address>,
        amounts: soroban_sdk::Vec<i128>,
    ) -> i128 {
        caller.require_auth();
        let mut total: i128 = 0;
        let len = users.len().min(amounts.len());
        for i in 0..len {
            let user = users.get(i).unwrap();
            let amount = amounts.get(i).unwrap();
            if amount <= 0 {
                continue;
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
            total += amount + bonus;
        }
        total
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
    fn consolidar_merges_bonus_into_balance() {
        let env = Env::default();
        env.mock_all_auths();
        let contract_id = env.register(Withdrawals, ());
        let client = WithdrawalsClient::new(&env, &contract_id);
        let user = Address::generate(&env);

        client.recompensar(&user); // 20
        assert_eq!(client.consolidar(&user), 20);
        assert_eq!(client.saldo(&user), 20);
        assert_eq!(client.bonus_total(), 0);
    }

    #[test]
    fn recompensar_grants_decreasing_rewards() {
        let env = Env::default();
        env.mock_all_auths();
        let contract_id = env.register(Withdrawals, ());
        let client = WithdrawalsClient::new(&env, &contract_id);
        let user = Address::generate(&env);

        assert_eq!(client.recompensar(&user), 20);
        assert_eq!(client.recompensar(&user), 10);
        assert_eq!(client.bonus_total(), 30);
    }

    #[test]
    fn transferir_moves_balance_between_users() {
        let env = Env::default();
        env.mock_all_auths();
        let contract_id = env.register(Withdrawals, ());
        let client = WithdrawalsClient::new(&env, &contract_id);
        let alice = Address::generate(&env);
        let bob = Address::generate(&env);

        client.depositar(&alice, &100);
        assert_eq!(client.transferir(&alice, &bob, &40), 80);
        assert_eq!(client.saldo(&alice), 80);
        assert_eq!(client.saldo(&bob), 40);
    }

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
    #[test]
    fn retirar_todo_empties_balance() {
        let env = Env::default();
        env.mock_all_auths();
        let contract_id = env.register(Withdrawals, ());
        let client = WithdrawalsClient::new(&env, &contract_id);
        let user = Address::generate(&env);
        client.depositar(&user, &100);
        assert_eq!(client.retirar_todo(&user), 120);
        assert_eq!(client.saldo(&user), 0);
    }

    #[test]
    fn depositar_masivo_deposits_for_multiple() {
        let env = Env::default();
        env.mock_all_auths();
        let contract_id = env.register(Withdrawals, ());
        let client = WithdrawalsClient::new(&env, &contract_id);
        let alice = Address::generate(&env);
        let bob = Address::generate(&env);
        let users = soroban_sdk::vec![&env, alice.clone(), bob.clone()];
        let amounts = soroban_sdk::vec![&env, 100_i128, 50_i128];
        let total = client.depositar_masivo(&Address::generate(&env), &users, &amounts);
        assert_eq!(total, 190);
        assert_eq!(client.saldo(&alice), 120);
        assert_eq!(client.saldo(&bob), 70);
    }
}
