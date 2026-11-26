use super::*;
use aerospace_compliance::{Compliance, ComplianceClient as ComplianceContractClient};
use soroban_sdk::{
    testutils::{Address as _, Ledger as _},
    token, Address, Env, String,
};

const NOW: u64 = 1_700_000_000;

struct Fixture<'a> {
    env: Env,
    client: InvestmentClient<'a>,
    admin: Address,
    issuer: Address,
    payment: token::Client<'a>,
    token_admin: token::StellarAssetClient<'a>,
}

fn setup() -> Fixture<'static> {
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().set_timestamp(NOW);
    let admin = Address::generate(&env);
    let issuer = Address::generate(&env);
    let sac = env.register_stellar_asset_contract_v2(admin.clone());
    let payment_address = sac.address();
    let payment = token::Client::new(&env, &payment_address);
    let token_admin = token::StellarAssetClient::new(&env, &payment_address);

    let contract_id = env.register(Investment, ());
    let client = InvestmentClient::new(&env, &contract_id);
    client.initialize(&admin, &payment_address, &None);
    Fixture {
        env,
        client,
        admin,
        issuer,
        payment,
        token_admin,
    }
}

fn create(fixture: &Fixture<'_>, target: i128) -> Offering {
    fixture.client.create_offering(
        &fixture.issuer,
        &String::from_str(&fixture.env, "off_001"),
        &String::from_str(&fixture.env, "ast_eng_001"),
        &target,
        &100,
        &(NOW + 10),
        &(NOW + 1_000),
        &2,
        &String::from_str(&fixture.env, "US-DE"),
    )
}

#[test]
fn creates_a_valid_offering() {
    let fixture = setup();
    let offering = create(&fixture, 10_000);

    assert_eq!(offering.status, OfferingStatus::Open);
    assert_eq!(offering.committed, 0);
    assert_eq!(offering.investor_count, 0);
    assert_eq!(fixture.client.offering_ids().len(), 1);
}

#[test]
fn rejects_invalid_offering_parameters_and_duplicates() {
    let fixture = setup();

    let invalid = fixture.client.try_create_offering(
        &fixture.issuer,
        &String::from_str(&fixture.env, "off_bad"),
        &String::from_str(&fixture.env, "ast_eng_001"),
        &100,
        &200,
        &(NOW + 10),
        &(NOW + 1_000),
        &2,
        &String::from_str(&fixture.env, "US-DE"),
    );
    assert_eq!(invalid, Err(Ok(Error::InvalidOffering)));

    create(&fixture, 10_000);
    let duplicate = fixture.client.try_create_offering(
        &fixture.issuer,
        &String::from_str(&fixture.env, "off_001"),
        &String::from_str(&fixture.env, "ast_eng_001"),
        &10_000,
        &100,
        &(NOW + 10),
        &(NOW + 1_000),
        &2,
        &String::from_str(&fixture.env, "US-DE"),
    );
    assert_eq!(duplicate, Err(Ok(Error::OfferingExists)));
}

#[test]
fn subscribes_funds_and_settles_to_the_issuer() {
    let fixture = setup();
    create(&fixture, 10_000);
    let investor = Address::generate(&fixture.env);
    fixture.token_admin.mint(&investor, &20_000);
    fixture.env.ledger().set_timestamp(NOW + 100);

    let position = fixture.client.subscribe(
        &investor,
        &String::from_str(&fixture.env, "off_001"),
        &6_000,
    );
    assert_eq!(position.amount, 6_000);
    assert_eq!(fixture.payment.balance(&investor), 14_000);

    let offering = fixture
        .client
        .get_offering(&String::from_str(&fixture.env, "off_001"));
    assert_eq!(offering.status, OfferingStatus::Open);
    assert_eq!(offering.investor_count, 1);

    fixture.client.subscribe(
        &investor,
        &String::from_str(&fixture.env, "off_001"),
        &4_000,
    );
    let funded = fixture
        .client
        .get_offering(&String::from_str(&fixture.env, "off_001"));
    assert_eq!(funded.status, OfferingStatus::Funded);
    assert_eq!(funded.committed, 10_000);

    fixture.env.ledger().set_timestamp(NOW + 1_000);
    let settled = fixture
        .client
        .settle(&String::from_str(&fixture.env, "off_001"));

    assert_eq!(settled.status, OfferingStatus::Settled);
    assert_eq!(fixture.payment.balance(&fixture.issuer), 10_000);
    assert_eq!(fixture.payment.balance(&fixture.client.address), 0);
}

#[test]
fn enforces_window_ticket_size_and_amount() {
    let fixture = setup();
    create(&fixture, 10_000);
    let investor = Address::generate(&fixture.env);
    fixture.token_admin.mint(&investor, &20_000);

    assert_eq!(
        fixture
            .client
            .try_subscribe(&investor, &String::from_str(&fixture.env, "off_001"), &100),
        Err(Ok(Error::OfferingNotOpen))
    );

    fixture.env.ledger().set_timestamp(NOW + 100);
    assert_eq!(
        fixture
            .client
            .try_subscribe(&investor, &String::from_str(&fixture.env, "off_001"), &99),
        Err(Ok(Error::BelowMinimum))
    );
    assert_eq!(
        fixture
            .client
            .try_subscribe(&investor, &String::from_str(&fixture.env, "off_001"), &0),
        Err(Ok(Error::InvalidAmount))
    );

    fixture.env.ledger().set_timestamp(NOW + 1_000);
    assert_eq!(
        fixture
            .client
            .try_subscribe(&investor, &String::from_str(&fixture.env, "off_001"), &100),
        Err(Ok(Error::OfferingNotOpen))
    );
}

#[test]
fn failed_offering_refunds_each_position_once() {
    let fixture = setup();
    create(&fixture, 10_000);
    let investor = Address::generate(&fixture.env);
    fixture.token_admin.mint(&investor, &5_000);
    fixture.env.ledger().set_timestamp(NOW + 100);

    fixture.client.subscribe(
        &investor,
        &String::from_str(&fixture.env, "off_001"),
        &2_000,
    );
    fixture.env.ledger().set_timestamp(NOW + 1_000);
    let failed = fixture
        .client
        .mark_failed(&fixture.admin, &String::from_str(&fixture.env, "off_001"));
    assert_eq!(failed.status, OfferingStatus::Failed);

    let refund = fixture
        .client
        .claim_refund(&investor, &String::from_str(&fixture.env, "off_001"));
    assert_eq!(refund, 2_000);
    assert_eq!(fixture.payment.balance(&investor), 5_000);
    assert_eq!(
        fixture
            .client
            .try_claim_refund(&investor, &String::from_str(&fixture.env, "off_001")),
        Err(Ok(Error::NothingToRefund))
    );
}

#[test]
fn cannot_settle_before_close_or_without_funding() {
    let fixture = setup();
    create(&fixture, 10_000);

    assert_eq!(
        fixture
            .client
            .try_settle(&String::from_str(&fixture.env, "off_001")),
        Err(Ok(Error::TooEarly))
    );

    fixture.env.ledger().set_timestamp(NOW + 1_000);
    assert_eq!(
        fixture
            .client
            .try_settle(&String::from_str(&fixture.env, "off_001")),
        Err(Ok(Error::NotFunded))
    );
}

#[test]
fn compliance_blocks_ineligible_subscribers() {
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().set_timestamp(NOW);
    let admin = Address::generate(&env);
    let issuer = Address::generate(&env);
    let officer = Address::generate(&env);
    let investor = Address::generate(&env);

    let compliance_id = env.register(Compliance, ());
    let compliance = ComplianceContractClient::new(&env, &compliance_id);
    compliance.initialize(&admin);
    compliance.authorize_officer(&admin, &officer);
    compliance.set_jurisdiction(&officer, &String::from_str(&env, "US-DE"), &true);

    let sac = env.register_stellar_asset_contract_v2(admin.clone());
    let payment_address = sac.address();
    let token_admin = token::StellarAssetClient::new(&env, &payment_address);
    token_admin.mint(&investor, &10_000);

    let contract_id = env.register(Investment, ());
    let client = InvestmentClient::new(&env, &contract_id);
    client.initialize(&admin, &payment_address, &Some(compliance_id));
    client.create_offering(
        &issuer,
        &String::from_str(&env, "off_001"),
        &String::from_str(&env, "ast_eng_001"),
        &10_000,
        &100,
        &(NOW + 10),
        &(NOW + 1_000),
        &2,
        &String::from_str(&env, "US-DE"),
    );
    env.ledger().set_timestamp(NOW + 100);

    assert_eq!(
        client.try_subscribe(&investor, &String::from_str(&env, "off_001"), &1_000),
        Err(Ok(Error::ComplianceBlocked))
    );

    compliance.approve_investor(
        &officer,
        &investor,
        &2,
        &String::from_str(&env, "US-DE"),
        &(NOW + 86_400),
    );
    client.subscribe(&investor, &String::from_str(&env, "off_001"), &1_000);
}


#[test]
fn reembolsar_todo_refunds_failed_offerings() {
    let fixture = setup();
    create(&fixture, 10_000);
    let investor = Address::generate(&fixture.env);
    fixture.token_admin.mint(&investor, &5_000);
    fixture.env.ledger().set_timestamp(NOW + 100);
    fixture.client.subscribe(&investor, &String::from_str(&fixture.env, "off_001"), &2_000);
    fixture.env.ledger().set_timestamp(NOW + 1_000);
    fixture.client.mark_failed(&fixture.admin, &String::from_str(&fixture.env, "off_001"));
    let ids = soroban_sdk::vec![&fixture.env, String::from_str(&fixture.env, "off_001")];
    let total = fixture.client.reembolsar_todo(&investor, &ids);
    assert_eq!(total, 2_000);
    assert_eq!(fixture.payment.balance(&investor), 5_000);
}


#[test]
fn cancels_a_pending_subscription() {
    let fixture = setup();
    create(&fixture, 10_000);
    let investor = Address::generate(&fixture.env);
    fixture.token_admin.mint(&investor, &5_000);
    fixture.env.ledger().set_timestamp(NOW + 100);
    fixture.client.subscribe(&investor, &String::from_str(&fixture.env, "off_001"), &2_000);
    let refund = fixture.client.cancelar_suscripcion(&investor, &String::from_str(&fixture.env, "off_001"));
    assert_eq!(refund, 2_000);
    assert_eq!(fixture.payment.balance(&investor), 5_000);
}
