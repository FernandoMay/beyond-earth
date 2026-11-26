use super::*;
use soroban_sdk::{
    testutils::{Address as _, Ledger as _},
    token, Address, Env, String,
};

const NOW: u64 = 1_700_000_000;

struct Fixture<'a> {
    env: Env,
    client: EscrowContractClient<'a>,
    admin: Address,
    buyer: Address,
    seller: Address,
    arbiter: Address,
    payment: token::Client<'a>,
}

fn setup() -> Fixture<'static> {
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().set_timestamp(NOW);
    let admin = Address::generate(&env);
    let buyer = Address::generate(&env);
    let seller = Address::generate(&env);
    let arbiter = Address::generate(&env);
    let sac = env.register_stellar_asset_contract_v2(admin.clone());
    let payment_address = sac.address();
    let payment = token::Client::new(&env, &payment_address);
    let token_admin = token::StellarAssetClient::new(&env, &payment_address);
    token_admin.mint(&buyer, &10_000);

    let contract_id = env.register(EscrowContract, ());
    let client = EscrowContractClient::new(&env, &contract_id);
    client.initialize(&admin, &payment_address);
    Fixture {
        env,
        client,
        admin,
        buyer,
        seller,
        arbiter,
        payment,
    }
}

fn create(fixture: &Fixture<'_>, amount: i128) -> Escrow {
    fixture.client.create_escrow(
        &fixture.buyer,
        &String::from_str(&fixture.env, "esc_001"),
        &fixture.seller,
        &fixture.arbiter,
        &amount,
    )
}

#[test]
fn creates_a_funded_escrow() {
    let fixture = setup();
    let escrow = create(&fixture, 2_500);

    assert_eq!(escrow.status, EscrowStatus::Funded);
    assert_eq!(escrow.amount, 2_500);
    assert_eq!(fixture.payment.balance(&fixture.buyer), 7_500);
    assert_eq!(fixture.payment.balance(&fixture.client.address), 2_500);
}

#[test]
fn arbiter_releases_to_seller() {
    let fixture = setup();
    create(&fixture, 2_500);

    let released = fixture
        .client
        .release(&fixture.arbiter, &String::from_str(&fixture.env, "esc_001"));

    assert_eq!(released.status, EscrowStatus::Released);
    assert_eq!(fixture.payment.balance(&fixture.seller), 2_500);
    assert_eq!(fixture.payment.balance(&fixture.client.address), 0);
}

#[test]
fn disputed_escrow_can_be_refunded_by_admin() {
    let fixture = setup();
    create(&fixture, 2_500);
    fixture
        .client
        .dispute(&fixture.buyer, &String::from_str(&fixture.env, "esc_001"));

    let refunded = fixture
        .client
        .refund(&fixture.admin, &String::from_str(&fixture.env, "esc_001"));

    assert_eq!(refunded.status, EscrowStatus::Refunded);
    assert_eq!(fixture.payment.balance(&fixture.buyer), 10_000);
}

#[test]
fn unauthorized_parties_cannot_release() {
    let fixture = setup();
    create(&fixture, 2_500);

    assert_eq!(
        fixture
            .client
            .try_release(&fixture.buyer, &String::from_str(&fixture.env, "esc_001")),
        Err(Ok(Error::Unauthorized))
    );
    assert_eq!(
        fixture
            .client
            .try_release(&fixture.seller, &String::from_str(&fixture.env, "esc_001")),
        Err(Ok(Error::Unauthorized))
    );
}

#[test]
fn rejects_duplicate_invalid_and_resolved_escrows() {
    let fixture = setup();
    create(&fixture, 1_000);

    assert_eq!(
        fixture.client.try_create_escrow(
            &fixture.buyer,
            &String::from_str(&fixture.env, "esc_001"),
            &fixture.seller,
            &fixture.arbiter,
            &1_000,
        ),
        Err(Ok(Error::EscrowExists))
    );
    assert_eq!(
        fixture.client.try_create_escrow(
            &fixture.buyer,
            &String::from_str(&fixture.env, "esc_zero"),
            &fixture.seller,
            &fixture.arbiter,
            &0,
        ),
        Err(Ok(Error::InvalidAmount))
    );

    fixture
        .client
        .release(&fixture.arbiter, &String::from_str(&fixture.env, "esc_001"));
    assert_eq!(
        fixture
            .client
            .try_refund(&fixture.arbiter, &String::from_str(&fixture.env, "esc_001")),
        Err(Ok(Error::InvalidStatus))
    );
}

#[test]
fn rejects_seller_as_buyer_or_arbiter() {
    let fixture = setup();

    assert_eq!(
        fixture.client.try_create_escrow(
            &fixture.buyer,
            &String::from_str(&fixture.env, "esc_bad"),
            &fixture.buyer,
            &fixture.arbiter,
            &100,
        ),
        Err(Ok(Error::InvalidParties))
    );
}

#[test]
fn partial_release_reduces_escrow() {
    let fixture = setup();
    create(&fixture, 2_500);
    let updated = fixture.client.liberar_parcial(
        &fixture.arbiter,
        &String::from_str(&fixture.env, "esc_001"),
        &1_000,
    );
    assert_eq!(updated.amount, 1_500);
    assert_eq!(updated.status, EscrowStatus::Funded);
    assert_eq!(fixture.payment.balance(&fixture.seller), 1_000);
}

#[test]
fn partial_refund_reduces_escrow() {
    let fixture = setup();
    create(&fixture, 2_500);
    let updated = fixture.client.reembolsar_parcial(
        &fixture.arbiter,
        &String::from_str(&fixture.env, "esc_001"),
        &1_000,
    );
    assert_eq!(updated.amount, 1_500);
    assert_eq!(updated.status, EscrowStatus::Funded);
    assert_eq!(fixture.payment.balance(&fixture.buyer), 8_500);
}

#[test]
fn releases_remaining_escrow() {
    let fixture = setup();
    create(&fixture, 2_500);
    let updated = fixture.client.liberar_parcial(
        &fixture.arbiter,
        &String::from_str(&fixture.env, "esc_001"),
        &1_000,
    );
    assert_eq!(updated.amount, 1_500);
    let released = fixture
        .client
        .liberar_total(&fixture.arbiter, &String::from_str(&fixture.env, "esc_001"));
    assert_eq!(released.amount, 0);
    assert_eq!(released.status, EscrowStatus::Released);
    assert_eq!(fixture.payment.balance(&fixture.seller), 2_500);
}

#[test]
fn disputes_and_refunds() {
    let fixture = setup();
    create(&fixture, 2_500);
    let refunded = fixture
        .client
        .disputar_y_reembolsar(&fixture.buyer, &String::from_str(&fixture.env, "esc_001"));
    assert_eq!(refunded.status, EscrowStatus::Refunded);
    assert_eq!(fixture.payment.balance(&fixture.buyer), 10_000);
}

#[test]
fn reembolsar_todo_refunds_multiple() {
    let fixture = setup();
    create(&fixture, 1_000);
    // create a second escrow
    fixture.client.create_escrow(
        &fixture.buyer,
        &String::from_str(&fixture.env, "esc_002"),
        &fixture.seller,
        &fixture.arbiter,
        &2_000,
    );
    let ids = soroban_sdk::vec![
        &fixture.env,
        String::from_str(&fixture.env, "esc_001"),
        String::from_str(&fixture.env, "esc_002")
    ];
    let total = fixture.client.reembolsar_todo(&fixture.buyer, &ids);
    assert_eq!(total, 3_000);
    assert_eq!(fixture.payment.balance(&fixture.buyer), 10_000);
}
