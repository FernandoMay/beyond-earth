use super::*;
use soroban_sdk::{
    testutils::{Address as _, Ledger as _},
    Address, BytesN, Env, String,
};

struct Fixture<'a> {
    client: AssetRegistryClient<'a>,
    admin: Address,
    issuer: Address,
}

fn setup(env: &Env) -> Fixture<'_> {
    env.mock_all_auths();
    env.ledger().set_timestamp(1_700_000_000);
    let admin = Address::generate(env);
    let issuer = Address::generate(env);
    let contract_id = env.register(AssetRegistry, ());
    let client = AssetRegistryClient::new(env, &contract_id);
    client.initialize(&admin);
    client.authorize_issuer(&admin, &issuer);
    Fixture {
        client,
        admin,
        issuer,
    }
}

fn hash(env: &Env, byte: u8) -> BytesN<32> {
    BytesN::from_array(env, &[byte; 32])
}

fn register(env: &Env, fixture: &Fixture<'_>) -> AssetRecord {
    fixture.client.register_asset(
        &fixture.issuer,
        &String::from_str(env, "ast_eng_001"),
        &String::from_str(env, "ARW-AV-0001"),
        &Vertical::Aviation,
        &String::from_str(env, "Meridian LeaseCo"),
        &hash(env, 7),
        &420_000_000_000_000,
    )
}

#[test]
fn registers_an_asset_in_draft() {
    let env = Env::default();
    let fixture = setup(&env);
    let record = register(&env, &fixture);

    assert_eq!(record.status, AssetStatus::Draft);
    assert_eq!(record.vertical, Vertical::Aviation);
    assert_eq!(record.owner, fixture.issuer);
    assert_eq!(fixture.client.asset_count(), 1);
    assert_eq!(fixture.client.asset_ids().len(), 1);
    assert_eq!(fixture.client.get_asset(&record.id), record);
}

#[test]
fn rejects_duplicate_and_invalid_assets() {
    let env = Env::default();
    let fixture = setup(&env);
    register(&env, &fixture);

    let duplicate = fixture.client.try_register_asset(
        &fixture.issuer,
        &String::from_str(&env, "ast_eng_001"),
        &String::from_str(&env, "ARW-AV-0001"),
        &Vertical::Aviation,
        &String::from_str(&env, "Meridian LeaseCo"),
        &hash(&env, 7),
        &1,
    );
    assert_eq!(duplicate, Err(Ok(Error::AssetExists)));

    let invalid = fixture.client.try_register_asset(
        &fixture.issuer,
        &String::from_str(&env, "ast_eng_002"),
        &String::from_str(&env, "ARW-AV-0002"),
        &Vertical::Aviation,
        &String::from_str(&env, "Meridian LeaseCo"),
        &hash(&env, 8),
        &0,
    );
    assert_eq!(invalid, Err(Ok(Error::InvalidValuation)));
}

#[test]
fn rejects_unregistered_issuer() {
    let env = Env::default();
    let fixture = setup(&env);
    let outsider = Address::generate(&env);

    let result = fixture.client.try_register_asset(
        &outsider,
        &String::from_str(&env, "ast_bad"),
        &String::from_str(&env, "ARW-AV-9999"),
        &Vertical::Aviation,
        &String::from_str(&env, "Unknown"),
        &hash(&env, 1),
        &1,
    );
    assert_eq!(result, Err(Ok(Error::Unauthorized)));
}

#[test]
fn verifies_only_with_matching_evidence() {
    let env = Env::default();
    let fixture = setup(&env);
    let record = register(&env, &fixture);

    let mismatch = fixture
        .client
        .try_verify_asset(&fixture.admin, &record.id, &hash(&env, 9));
    assert_eq!(mismatch, Err(Ok(Error::EvidenceMismatch)));

    let verified = fixture
        .client
        .verify_asset(&fixture.admin, &record.id, &hash(&env, 7));
    assert_eq!(verified.status, AssetStatus::Verified);
    assert!(verified.verified_at > 0);
}

#[test]
fn enforces_status_transitions() {
    let env = Env::default();
    let fixture = setup(&env);
    let record = register(&env, &fixture);

    assert_eq!(
        fixture
            .client
            .try_set_status(&fixture.admin, &record.id, &AssetStatus::Active),
        Err(Ok(Error::InvalidTransition))
    );

    fixture
        .client
        .verify_asset(&fixture.admin, &record.id, &hash(&env, 7));
    fixture.client.mark_tokenized(&fixture.admin, &record.id);
    fixture
        .client
        .set_status(&fixture.admin, &record.id, &AssetStatus::Active);
    fixture
        .client
        .set_status(&fixture.admin, &record.id, &AssetStatus::Suspended);

    assert_eq!(
        fixture.client.get_asset(&record.id).status,
        AssetStatus::Suspended
    );
}

#[test]
fn only_admin_can_verify_or_change_status() {
    let env = Env::default();
    let fixture = setup(&env);
    let record = register(&env, &fixture);

    assert_eq!(
        fixture
            .client
            .try_verify_asset(&fixture.issuer, &record.id, &hash(&env, 7)),
        Err(Ok(Error::Unauthorized))
    );
    assert_eq!(
        fixture
            .client
            .try_set_status(&fixture.issuer, &record.id, &AssetStatus::Retired),
        Err(Ok(Error::Unauthorized))
    );
}

#[test]
fn reactivates_a_suspended_asset() {
    let env = Env::default();
    let fixture = setup(&env);
    let record = register(&env, &fixture);
    fixture
        .client
        .verify_asset(&fixture.admin, &record.id, &hash(&env, 7));
    fixture.client.mark_tokenized(&fixture.admin, &record.id);
    fixture
        .client
        .set_status(&fixture.admin, &record.id, &AssetStatus::Active);
    fixture
        .client
        .set_status(&fixture.admin, &record.id, &AssetStatus::Suspended);
    let reactivated = fixture.client.reactivar_activo(&fixture.admin, &record.id);
    assert_eq!(reactivated.status, AssetStatus::Active);
    assert_eq!(fixture.client.reactivations(), 1);
}

#[test]
fn suspends_an_active_asset() {
    let env = Env::default();
    let fixture = setup(&env);
    let record = register(&env, &fixture);
    fixture
        .client
        .verify_asset(&fixture.admin, &record.id, &hash(&env, 7));
    fixture.client.mark_tokenized(&fixture.admin, &record.id);
    fixture
        .client
        .set_status(&fixture.admin, &record.id, &AssetStatus::Active);
    let suspended = fixture.client.suspender_activo(&fixture.admin, &record.id);
    assert_eq!(suspended.status, AssetStatus::Suspended);
}
