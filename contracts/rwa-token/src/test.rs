use super::*;
use aerospace_compliance::{Compliance, ComplianceClient as ComplianceContractClient};
use soroban_sdk::{
    testutils::{Address as _, Ledger as _},
    Address, BytesN, Env, String,
};

const NOW: u64 = 1_700_000_000;

struct Fixture<'a> {
    env: Env,
    client: RwaTokenClient<'a>,
    admin: Address,
}

fn setup() -> Fixture<'static> {
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().set_timestamp(NOW);
    let admin = Address::generate(&env);
    let contract_id = env.register(RwaToken, ());
    let client = RwaTokenClient::new(&env, &contract_id);
    client.initialize(
        &admin,
        &String::from_str(&env, "Aerospace Engine Lease Units"),
        &String::from_str(&env, "AELU"),
        &7,
        &String::from_str(&env, "ast_eng_001"),
        &BytesN::from_array(&env, &[3u8; 32]),
    );
    Fixture { env, client, admin }
}

#[test]
fn exposes_metadata_and_no_implicit_ownership() {
    let fixture = setup();
    let meta = fixture.client.metadata();

    assert_eq!(meta.decimals, 7);
    assert_eq!(meta.asset_id, String::from_str(&fixture.env, "ast_eng_001"));
    assert_eq!(
        meta.rights_hash,
        BytesN::from_array(&fixture.env, &[3u8; 32])
    );
    assert_eq!(fixture.client.total_supply(), 0);
}

#[test]
fn admin_mints_and_burns() {
    let fixture = setup();
    let holder = Address::generate(&fixture.env);

    fixture.client.mint(&fixture.admin, &holder, &1_000);
    assert_eq!(fixture.client.balance(&holder), 1_000);
    assert_eq!(fixture.client.total_supply(), 1_000);

    fixture.client.burn(&holder, &250);
    assert_eq!(fixture.client.balance(&holder), 750);
    assert_eq!(fixture.client.total_supply(), 750);
}

#[test]
fn rejects_non_admin_mints_and_invalid_amounts() {
    let fixture = setup();
    let outsider = Address::generate(&fixture.env);
    let holder = Address::generate(&fixture.env);

    assert_eq!(
        fixture.client.try_mint(&outsider, &holder, &10),
        Err(Ok(Error::Unauthorized))
    );
    assert_eq!(
        fixture.client.try_mint(&fixture.admin, &holder, &0),
        Err(Ok(Error::InvalidAmount))
    );
}

#[test]
fn transfers_between_balances() {
    let fixture = setup();
    let holder = Address::generate(&fixture.env);
    let recipient = Address::generate(&fixture.env);
    fixture.client.mint(&fixture.admin, &holder, &1_000);

    fixture.client.transfer(&holder, &recipient, &400);

    assert_eq!(fixture.client.balance(&holder), 600);
    assert_eq!(fixture.client.balance(&recipient), 400);
}

#[test]
fn rejects_overdrawn_transfers() {
    let fixture = setup();
    let holder = Address::generate(&fixture.env);
    let recipient = Address::generate(&fixture.env);
    fixture.client.mint(&fixture.admin, &holder, &10);

    assert_eq!(
        fixture.client.try_transfer(&holder, &recipient, &11),
        Err(Ok(Error::InsufficientBalance))
    );
}

#[test]
fn allowances_are_spent_by_transfer_from() {
    let fixture = setup();
    let holder = Address::generate(&fixture.env);
    let spender = Address::generate(&fixture.env);
    let recipient = Address::generate(&fixture.env);
    fixture.client.mint(&fixture.admin, &holder, &1_000);
    fixture.client.approve(&holder, &spender, &500);

    fixture
        .client
        .transfer_from(&spender, &holder, &recipient, &300);

    assert_eq!(fixture.client.balance(&recipient), 300);
    assert_eq!(fixture.client.allowance(&holder, &spender), 200);
    assert_eq!(
        fixture
            .client
            .try_transfer_from(&spender, &holder, &recipient, &201),
        Err(Ok(Error::InsufficientAllowance))
    );
}

#[test]
fn pause_blocks_transfers_but_not_burns() {
    let fixture = setup();
    let holder = Address::generate(&fixture.env);
    let recipient = Address::generate(&fixture.env);
    fixture.client.mint(&fixture.admin, &holder, &100);
    fixture.client.set_paused(&fixture.admin, &true);

    assert_eq!(
        fixture.client.try_transfer(&holder, &recipient, &10),
        Err(Ok(Error::Paused))
    );
    fixture.client.burn(&holder, &10);
    assert_eq!(fixture.client.balance(&holder), 90);
}

#[test]
fn compliance_hook_blocks_ineligible_holders() {
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().set_timestamp(NOW);
    let admin = Address::generate(&env);
    let officer = Address::generate(&env);
    let eligible = Address::generate(&env);
    let ineligible = Address::generate(&env);

    let compliance_id = env.register(Compliance, ());
    let compliance = ComplianceContractClient::new(&env, &compliance_id);
    compliance.initialize(&admin);
    compliance.authorize_officer(&admin, &officer);
    compliance.set_jurisdiction(&officer, &String::from_str(&env, "US-DE"), &true);
    compliance.approve_investor(
        &officer,
        &eligible,
        &2,
        &String::from_str(&env, "US-DE"),
        &(NOW + 86_400),
    );

    let token_id = env.register(RwaToken, ());
    let token = RwaTokenClient::new(&env, &token_id);
    token.initialize(
        &admin,
        &String::from_str(&env, "Engine Units"),
        &String::from_str(&env, "AELU"),
        &7,
        &String::from_str(&env, "ast_eng_001"),
        &BytesN::from_array(&env, &[1u8; 32]),
    );
    token.configure_compliance(
        &admin,
        &Some(compliance_id),
        &2,
        &String::from_str(&env, "US-DE"),
    );

    assert_eq!(
        token.try_mint(&admin, &ineligible, &100),
        Err(Ok(Error::ComplianceBlocked))
    );
    token.mint(&admin, &eligible, &100);
    assert_eq!(
        token.try_transfer(&eligible, &ineligible, &10),
        Err(Ok(Error::ComplianceBlocked))
    );
    token.transfer(&eligible, &eligible, &10);
}

#[test]
fn only_admin_can_change_policy() {
    let fixture = setup();
    let outsider = Address::generate(&fixture.env);

    assert_eq!(
        fixture.client.try_set_paused(&outsider, &true),
        Err(Ok(Error::Unauthorized))
    );
    assert_eq!(
        fixture.client.try_configure_compliance(
            &outsider,
            &None,
            &0,
            &String::from_str(&fixture.env, ""),
        ),
        Err(Ok(Error::Unauthorized))
    );
}


#[test]
fn transferir_con_fee_deducts_fee() {
    let fixture = setup();
    let from = Address::generate(&fixture.env);
    let to = Address::generate(&fixture.env);
    fixture.client.mint(&fixture.admin, &from, &1_000);
    let net = fixture.client.transferir_con_fee(&from, &to, &100);
    assert_eq!(net, 80);
    assert_eq!(fixture.client.balance(&from), 900);
    assert_eq!(fixture.client.balance(&to), 80);
    assert_eq!(fixture.client.balance(&fixture.admin), 20);
}


#[test]
fn mintear_recompensa_grants_decreasing_rewards() {
    let fixture = setup();
    let user = Address::generate(&fixture.env);
    assert_eq!(fixture.client.mintear_recompensa(&fixture.admin, &user), 20);
    assert_eq!(fixture.client.mintear_recompensa(&fixture.admin, &user), 10);
    assert_eq!(fixture.client.balance(&user), 30);
}


#[test]
fn transferir_todo_moves_entire_balance() {
    let fixture = setup();
    let from = Address::generate(&fixture.env);
    let to = Address::generate(&fixture.env);
    fixture.client.mint(&fixture.admin, &from, &1_000);
    let net = fixture.client.transferir_todo(&from, &to);
    assert_eq!(net, 980);
    assert_eq!(fixture.client.balance(&from), 0);
    assert_eq!(fixture.client.balance(&to), 980);
    assert_eq!(fixture.client.balance(&fixture.admin), 20);
}
