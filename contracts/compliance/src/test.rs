use super::*;
use soroban_sdk::{
    testutils::{Address as _, Ledger as _},
    Address, Env, String,
};

const NOW: u64 = 1_700_000_000;

struct Fixture<'a> {
    client: ComplianceClient<'a>,
    officer: Address,
}

fn setup(env: &Env) -> Fixture<'_> {
    env.mock_all_auths();
    env.ledger().set_timestamp(NOW);
    let admin = Address::generate(env);
    let officer = Address::generate(env);
    let contract_id = env.register(Compliance, ());
    let client = ComplianceClient::new(env, &contract_id);
    client.initialize(&admin);
    client.authorize_officer(&admin, &officer);
    client.set_jurisdiction(&officer, &String::from_str(env, "US-DE"), &true);
    Fixture { client, officer }
}

fn approve(env: &Env, fixture: &Fixture<'_>, investor: &Address) -> InvestorRecord {
    fixture.client.approve_investor(
        &fixture.officer,
        investor,
        &2,
        &String::from_str(env, "US-DE"),
        &(NOW + 86_400),
    )
}

#[test]
fn approves_and_checks_an_eligible_investor() {
    let env = Env::default();
    let fixture = setup(&env);
    let investor = Address::generate(&env);

    let record = approve(&env, &fixture, &investor);
    assert_eq!(record.status, InvestorStatus::Approved);
    assert_eq!(record.tier, 2);
    assert!(fixture
        .client
        .is_eligible(&investor, &2, &String::from_str(&env, "US-DE")));
    assert!(!fixture
        .client
        .is_eligible(&investor, &3, &String::from_str(&env, "US-DE")));
}

#[test]
fn rejects_disallowed_or_mismatched_jurisdictions() {
    let env = Env::default();
    let fixture = setup(&env);
    let investor = Address::generate(&env);

    let rejected = fixture.client.try_approve_investor(
        &fixture.officer,
        &investor,
        &1,
        &String::from_str(&env, "XX"),
        &(NOW + 100),
    );
    assert_eq!(rejected, Err(Ok(Error::JurisdictionNotAllowed)));

    approve(&env, &fixture, &investor);
    assert!(!fixture
        .client
        .is_eligible(&investor, &1, &String::from_str(&env, "US-NY")));
}

#[test]
fn expires_eligibility_at_the_ledger_time() {
    let env = Env::default();
    let fixture = setup(&env);
    let investor = Address::generate(&env);
    approve(&env, &fixture, &investor);

    env.ledger().set_timestamp(NOW + 86_400);
    assert!(!fixture
        .client
        .is_eligible(&investor, &1, &String::from_str(&env, "US-DE")));
}

#[test]
fn suspension_removes_eligibility() {
    let env = Env::default();
    let fixture = setup(&env);
    let investor = Address::generate(&env);
    approve(&env, &fixture, &investor);

    fixture.client.suspend_investor(&fixture.officer, &investor);

    assert_eq!(
        fixture.client.get_investor(&investor).status,
        InvestorStatus::Suspended
    );
    assert!(!fixture
        .client
        .is_eligible(&investor, &1, &String::from_str(&env, "US-DE")));
}

#[test]
fn rejects_invalid_tiers_and_expiries() {
    let env = Env::default();
    let fixture = setup(&env);
    let investor = Address::generate(&env);

    let zero = fixture.client.try_approve_investor(
        &fixture.officer,
        &investor,
        &0,
        &String::from_str(&env, "US-DE"),
        &(NOW + 100),
    );
    assert_eq!(zero, Err(Ok(Error::InvalidTier)));

    let past = fixture.client.try_approve_investor(
        &fixture.officer,
        &investor,
        &1,
        &String::from_str(&env, "US-DE"),
        &NOW,
    );
    assert_eq!(past, Err(Ok(Error::InvalidExpiry)));
}

#[test]
fn only_officers_can_change_eligibility() {
    let env = Env::default();
    let fixture = setup(&env);
    let outsider = Address::generate(&env);
    let investor = Address::generate(&env);

    assert_eq!(
        fixture.client.try_approve_investor(
            &outsider,
            &investor,
            &1,
            &String::from_str(&env, "US-DE"),
            &(NOW + 100),
        ),
        Err(Ok(Error::Unauthorized))
    );
    assert_eq!(
        fixture
            .client
            .try_set_jurisdiction(&outsider, &String::from_str(&env, "US-NY"), &true),
        Err(Ok(Error::Unauthorized))
    );
}

#[test]
fn unknown_investors_are_not_eligible() {
    let env = Env::default();
    let fixture = setup(&env);
    let unknown = Address::generate(&env);

    assert!(!fixture
        .client
        .is_eligible(&unknown, &1, &String::from_str(&env, "US-DE")));
}


#[test]
fn reactivates_a_suspended_investor() {
    let env = Env::default();
    let fixture = setup(&env);
    let investor = Address::generate(&env);
    approve(&env, &fixture, &investor);
    fixture.client.suspend_investor(&fixture.officer, &investor);
    let record = fixture
        .client
        .reactivar_inversor(&fixture.officer, &investor, &(NOW + 172_800));
    assert_eq!(record.status, InvestorStatus::Approved);
}


#[test]
fn renews_an_approved_investor() {
    let env = Env::default();
    let fixture = setup(&env);
    let investor = Address::generate(&env);
    approve(&env, &fixture, &investor);
    let renewed = fixture
        .client
        .renovar_inversor(&fixture.officer, &investor, &(NOW + 172_800));
    assert_eq!(renewed.expires_at, NOW + 172_800);
}


#[test]
fn updates_investor_tier() {
    let env = Env::default();
    let fixture = setup(&env);
    let investor = Address::generate(&env);
    approve(&env, &fixture, &investor);
    let updated = fixture
        .client
        .actualizar_tier(&fixture.officer, &investor, &4);
    assert_eq!(updated.tier, 4);
}
