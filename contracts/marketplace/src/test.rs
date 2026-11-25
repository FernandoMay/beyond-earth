use super::*;
use aerospace_rwa_token::{RwaToken, RwaTokenClient};
use soroban_sdk::{
    testutils::{Address as _, Ledger as _},
    token, Address, BytesN, Env, String,
};

const NOW: u64 = 1_700_000_000;
const EXPIRY: u64 = NOW + 7 * 86_400;

struct Fixture<'a> {
    env: Env,
    client: MarketplaceClient<'a>,
    asset_token: RwaTokenClient<'a>,
    payment: token::Client<'a>,
    admin: Address,
    seller: Address,
    buyer: Address,
    fee_recipient: Address,
}

fn setup() -> Fixture<'static> {
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().set_timestamp(NOW);
    let admin = Address::generate(&env);
    let seller = Address::generate(&env);
    let buyer = Address::generate(&env);
    let fee_recipient = Address::generate(&env);

    let sac = env.register_stellar_asset_contract_v2(admin.clone());
    let payment_address = sac.address();
    let payment = token::Client::new(&env, &payment_address);
    let token_admin = token::StellarAssetClient::new(&env, &payment_address);
    token_admin.mint(&buyer, &100_000);

    let asset_id = env.register(RwaToken, ());
    let asset_token = RwaTokenClient::new(&env, &asset_id);
    asset_token.initialize(
        &admin,
        &String::from_str(&env, "Engine Lease Units"),
        &String::from_str(&env, "AELU"),
        &7,
        &String::from_str(&env, "ast_eng_001"),
        &BytesN::from_array(&env, &[4u8; 32]),
    );
    asset_token.mint(&admin, &seller, &1_000);

    let contract_id = env.register(Marketplace, ());
    let client = MarketplaceClient::new(&env, &contract_id);
    client.initialize(&admin, &payment_address, &fee_recipient, &250);
    asset_token.approve(&seller, &client.address, &500);

    Fixture {
        env,
        client,
        asset_token,
        payment,
        admin,
        seller,
        buyer,
        fee_recipient,
    }
}

fn create(fixture: &Fixture<'_>, price: i128) -> Listing {
    fixture.client.create_listing(
        &fixture.seller,
        &String::from_str(&fixture.env, "lst_001"),
        &String::from_str(&fixture.env, "ast_eng_001"),
        &fixture.asset_token.address,
        &100,
        &price,
        &EXPIRY,
    )
}

#[test]
fn creates_a_listing_with_allowance() {
    let fixture = setup();
    let listing = create(&fixture, 10_000);

    assert_eq!(listing.status, ListingStatus::Open);
    assert_eq!(listing.units, 100);
    assert_eq!(fixture.client.fee_bps(), 250);
}

#[test]
fn requires_spender_allowance() {
    let fixture = setup();
    let other_seller = Address::generate(&fixture.env);
    fixture
        .asset_token
        .mint(&fixture.admin, &other_seller, &1_000);

    assert_eq!(
        fixture.client.try_create_listing(
            &other_seller,
            &String::from_str(&fixture.env, "lst_no_allowance"),
            &String::from_str(&fixture.env, "ast_eng_001"),
            &fixture.asset_token.address,
            &100,
            &10_000,
            &EXPIRY,
        ),
        Err(Ok(Error::AllowanceTooLow))
    );
}

#[test]
fn fills_atomically_with_fee() {
    let fixture = setup();
    create(&fixture, 10_000);

    let filled = fixture
        .client
        .fill(&fixture.buyer, &String::from_str(&fixture.env, "lst_001"));

    assert_eq!(filled.status, ListingStatus::Filled);
    assert_eq!(fixture.payment.balance(&fixture.seller), 9_750);
    assert_eq!(fixture.payment.balance(&fixture.fee_recipient), 250);
    assert_eq!(fixture.payment.balance(&fixture.buyer), 90_000);
    assert_eq!(fixture.asset_token.balance(&fixture.buyer), 100);
    assert_eq!(fixture.asset_token.balance(&fixture.seller), 900);
    assert_eq!(
        fixture
            .client
            .try_fill(&fixture.buyer, &String::from_str(&fixture.env, "lst_001")),
        Err(Ok(Error::ListingNotOpen))
    );
}

#[test]
fn seller_can_cancel_and_expired_listings_cannot_fill() {
    let fixture = setup();
    create(&fixture, 10_000);
    fixture
        .client
        .cancel(&fixture.seller, &String::from_str(&fixture.env, "lst_001"));
    assert_eq!(
        fixture
            .client
            .try_fill(&fixture.buyer, &String::from_str(&fixture.env, "lst_001")),
        Err(Ok(Error::ListingNotOpen))
    );

    let fixture = setup();
    create(&fixture, 10_000);
    fixture.env.ledger().set_timestamp(EXPIRY);
    assert_eq!(
        fixture
            .client
            .try_fill(&fixture.buyer, &String::from_str(&fixture.env, "lst_001")),
        Err(Ok(Error::ListingExpired))
    );
}

#[test]
fn only_seller_or_admin_can_cancel() {
    let fixture = setup();
    create(&fixture, 10_000);

    assert_eq!(
        fixture
            .client
            .try_cancel(&fixture.buyer, &String::from_str(&fixture.env, "lst_001")),
        Err(Ok(Error::NotSeller))
    );
    fixture
        .client
        .cancel(&fixture.admin, &String::from_str(&fixture.env, "lst_001"));
}

#[test]
fn rejects_invalid_fees_and_listing_parameters() {
    let env = Env::default();
    env.mock_all_auths();
    let admin = Address::generate(&env);
    let sac = env.register_stellar_asset_contract_v2(admin.clone());
    let contract_id = env.register(Marketplace, ());
    let client = MarketplaceClient::new(&env, &contract_id);

    assert_eq!(
        client.try_initialize(&admin, &sac.address(), &admin, &1_001),
        Err(Ok(Error::InvalidFee))
    );

    let fixture = setup();
    assert_eq!(
        fixture.client.try_create_listing(
            &fixture.seller,
            &String::from_str(&fixture.env, "lst_bad"),
            &String::from_str(&fixture.env, "ast_eng_001"),
            &fixture.asset_token.address,
            &0,
            &10_000,
            &EXPIRY,
        ),
        Err(Ok(Error::InvalidListing))
    );
}
