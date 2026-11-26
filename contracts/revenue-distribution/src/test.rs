use super::*;
use soroban_sdk::{
    testutils::{Address as _, Ledger as _},
    token, Address, Env, String,
};

const NOW: u64 = 1_700_000_000;
const DEADLINE: u64 = NOW + 30 * 86_400;

struct Fixture<'a> {
    env: Env,
    client: RevenueDistributionClient<'a>,
    issuer: Address,
    alice: Address,
    bob: Address,
    payment: token::Client<'a>,
}

fn setup() -> Fixture<'static> {
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().set_timestamp(NOW);
    let admin = Address::generate(&env);
    let issuer = Address::generate(&env);
    let alice = Address::generate(&env);
    let bob = Address::generate(&env);
    let sac = env.register_stellar_asset_contract_v2(admin.clone());
    let payment_address = sac.address();
    let payment = token::Client::new(&env, &payment_address);
    let token_admin = token::StellarAssetClient::new(&env, &payment_address);
    token_admin.mint(&issuer, &100_000);

    let contract_id = env.register(RevenueDistribution, ());
    let client = RevenueDistributionClient::new(&env, &contract_id);
    client.initialize(&admin, &payment_address);
    Fixture {
        env,
        client,
        issuer,
        alice,
        bob,
        payment,
    }
}

fn create(fixture: &Fixture<'_>) -> Distribution {
    fixture.client.create_distribution(
        &fixture.issuer,
        &String::from_str(&fixture.env, "dist_001"),
        &String::from_str(&fixture.env, "ast_eng_001"),
        &10_000,
        &100,
        &DEADLINE,
    )
}

#[test]
fn funds_a_distribution() {
    let fixture = setup();
    let distribution = create(&fixture);

    assert_eq!(distribution.status, DistributionStatus::Funded);
    assert_eq!(fixture.payment.balance(&fixture.issuer), 90_000);
    assert_eq!(fixture.payment.balance(&fixture.client.address), 10_000);
}

#[test]
fn pays_pro_rata_claims_once() {
    let fixture = setup();
    create(&fixture);
    fixture.client.allocate(
        &fixture.issuer,
        &String::from_str(&fixture.env, "dist_001"),
        &fixture.alice,
        &60,
    );
    fixture.client.allocate(
        &fixture.issuer,
        &String::from_str(&fixture.env, "dist_001"),
        &fixture.bob,
        &40,
    );

    let alice_claim = fixture
        .client
        .claim(&fixture.alice, &String::from_str(&fixture.env, "dist_001"));
    let bob_claim = fixture
        .client
        .claim(&fixture.bob, &String::from_str(&fixture.env, "dist_001"));

    assert_eq!(alice_claim, 6_000);
    assert_eq!(bob_claim, 4_000);
    assert_eq!(fixture.payment.balance(&fixture.alice), 6_000);
    assert!(fixture
        .client
        .has_claimed(&String::from_str(&fixture.env, "dist_001"), &fixture.alice));
    assert_eq!(
        fixture
            .client
            .try_claim(&fixture.alice, &String::from_str(&fixture.env, "dist_001")),
        Err(Ok(Error::AlreadyClaimed))
    );
}

#[test]
fn rejects_claims_without_allocation() {
    let fixture = setup();
    create(&fixture);

    assert_eq!(
        fixture
            .client
            .try_claim(&fixture.alice, &String::from_str(&fixture.env, "dist_001")),
        Err(Ok(Error::NothingToClaim))
    );
}

#[test]
fn prevents_over_allocation() {
    let fixture = setup();
    create(&fixture);

    assert_eq!(
        fixture.client.try_allocate(
            &fixture.issuer,
            &String::from_str(&fixture.env, "dist_001"),
            &fixture.alice,
            &101,
        ),
        Err(Ok(Error::OverAllocated))
    );
}

#[test]
fn only_issuer_or_admin_can_allocate() {
    let fixture = setup();
    create(&fixture);

    assert_eq!(
        fixture.client.try_allocate(
            &fixture.alice,
            &String::from_str(&fixture.env, "dist_001"),
            &fixture.alice,
            &10,
        ),
        Err(Ok(Error::Unauthorized))
    );
}

#[test]
fn close_returns_unclaimed_funds_to_the_issuer() {
    let fixture = setup();
    create(&fixture);
    fixture.client.allocate(
        &fixture.issuer,
        &String::from_str(&fixture.env, "dist_001"),
        &fixture.alice,
        &60,
    );
    fixture
        .client
        .claim(&fixture.alice, &String::from_str(&fixture.env, "dist_001"));

    assert_eq!(
        fixture
            .client
            .try_close(&fixture.issuer, &String::from_str(&fixture.env, "dist_001")),
        Err(Ok(Error::TooEarly))
    );

    fixture.env.ledger().set_timestamp(DEADLINE);
    let remaining = fixture
        .client
        .close(&fixture.issuer, &String::from_str(&fixture.env, "dist_001"));

    assert_eq!(remaining, 4_000);
    assert_eq!(fixture.payment.balance(&fixture.issuer), 94_000);
    assert_eq!(
        fixture
            .client
            .get_distribution(&String::from_str(&fixture.env, "dist_001"))
            .status,
        DistributionStatus::Closed
    );
    assert_eq!(
        fixture
            .client
            .try_claim(&fixture.bob, &String::from_str(&fixture.env, "dist_001")),
        Err(Ok(Error::DistributionClosed))
    );
}

#[test]
fn rejects_invalid_distribution_parameters() {
    let fixture = setup();

    assert_eq!(
        fixture.client.try_create_distribution(
            &fixture.issuer,
            &String::from_str(&fixture.env, "dist_bad"),
            &String::from_str(&fixture.env, "ast_eng_001"),
            &0,
            &100,
            &DEADLINE,
        ),
        Err(Ok(Error::InvalidAmount))
    );
    assert_eq!(
        fixture.client.try_create_distribution(
            &fixture.issuer,
            &String::from_str(&fixture.env, "dist_bad"),
            &String::from_str(&fixture.env, "ast_eng_001"),
            &1_000,
            &100,
            &NOW,
        ),
        Err(Ok(Error::InvalidDeadline))
    );
}

#[test]
fn reclamar_todo_claims_all() {
    let fixture = setup();
    create(&fixture);
    fixture.client.allocate(
        &fixture.issuer,
        &String::from_str(&fixture.env, "dist_001"),
        &fixture.alice,
        &50,
    );
    let ids = soroban_sdk::vec![&fixture.env, String::from_str(&fixture.env, "dist_001")];
    let total = fixture.client.reclamar_todo(&fixture.alice, &ids);
    assert_eq!(total, 5_000);
    assert_eq!(fixture.payment.balance(&fixture.alice), 5_000);
}

#[test]
fn cerrar_todo_closes_funded_distributions() {
    let fixture = setup();
    create(&fixture);
    fixture.env.ledger().set_timestamp(DEADLINE + 1);
    let closed = fixture.client.cerrar_todo(&fixture.issuer);
    assert_eq!(closed, 1);
}

#[test]
fn asignar_masivo_allocates_to_multiple() {
    let fixture = setup();
    create(&fixture);
    let alice = fixture.alice.clone();
    let bob = fixture.bob.clone();
    let investors = soroban_sdk::vec![&fixture.env, alice.clone(), bob.clone()];
    let units = soroban_sdk::vec![&fixture.env, 30_i128, 20_i128];
    let total = fixture.client.asignar_masivo(
        &fixture.issuer,
        &String::from_str(&fixture.env, "dist_001"),
        &investors,
        &units,
    );
    assert_eq!(total, 50);
    assert_eq!(
        fixture
            .client
            .allocation(&String::from_str(&fixture.env, "dist_001"), &fixture.alice),
        30
    );
    assert_eq!(
        fixture
            .client
            .allocation(&String::from_str(&fixture.env, "dist_001"), &fixture.bob),
        20
    );
}

#[test]
fn reclamar_masivo_claims_multiple() {
    let fixture = setup();
    create(&fixture);
    fixture.client.allocate(
        &fixture.issuer,
        &String::from_str(&fixture.env, "dist_001"),
        &fixture.alice,
        &50,
    );
    let ids = soroban_sdk::vec![&fixture.env, String::from_str(&fixture.env, "dist_001")];
    let total = fixture.client.reclamar_masivo(&fixture.alice, &ids);
    assert_eq!(total, 5_000);
    assert_eq!(fixture.payment.balance(&fixture.alice), 5_000);
}
