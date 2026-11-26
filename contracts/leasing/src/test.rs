use super::*;
use soroban_sdk::{
    testutils::{Address as _, Ledger as _},
    token, Address, Env, String,
};

const NOW: u64 = 1_700_000_000;
const MONTH: u64 = 30 * 86_400;

struct Fixture<'a> {
    env: Env,
    client: LeasingClient<'a>,
    admin: Address,
    lessor: Address,
    lessee: Address,
    payment: token::Client<'a>,
}

fn setup() -> Fixture<'static> {
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().set_timestamp(NOW);
    let admin = Address::generate(&env);
    let lessor = Address::generate(&env);
    let lessee = Address::generate(&env);
    let sac = env.register_stellar_asset_contract_v2(admin.clone());
    let payment_address = sac.address();
    let payment = token::Client::new(&env, &payment_address);
    let token_admin = token::StellarAssetClient::new(&env, &payment_address);
    token_admin.mint(&lessee, &100_000);

    let contract_id = env.register(Leasing, ());
    let client = LeasingClient::new(&env, &contract_id);
    client.initialize(&admin, &payment_address);
    Fixture {
        env,
        client,
        admin,
        lessor,
        lessee,
        payment,
    }
}

fn create(fixture: &Fixture<'_>) -> Lease {
    fixture.client.create_lease(
        &fixture.lessor,
        &String::from_str(&fixture.env, "lease_001"),
        &String::from_str(&fixture.env, "ast_eng_001"),
        &fixture.lessee,
        &5_000,
        &MONTH,
        &NOW,
    )
}

#[test]
fn creates_an_active_lease() {
    let fixture = setup();
    let lease = create(&fixture);

    assert_eq!(lease.status, LeaseStatus::Active);
    assert_eq!(lease.next_due_at, NOW);
    assert_eq!(lease.total_paid, 0);
}

#[test]
fn lessee_pays_rent_and_schedule_advances() {
    let fixture = setup();
    create(&fixture);
    fixture.env.ledger().set_timestamp(NOW + 86_400);

    let lease = fixture.client.pay_rent(
        &fixture.lessee,
        &String::from_str(&fixture.env, "lease_001"),
    );

    assert_eq!(lease.total_paid, 5_000);
    assert_eq!(lease.payments, 1);
    assert_eq!(lease.next_due_at, NOW + 86_400 + MONTH);
    assert_eq!(fixture.payment.balance(&fixture.lessor), 5_000);
}

#[test]
fn arrears_and_default_flow() {
    let fixture = setup();
    create(&fixture);
    fixture.env.ledger().set_timestamp(NOW + MONTH);

    let arrears = fixture.client.flag_arrears(
        &fixture.lessor,
        &String::from_str(&fixture.env, "lease_001"),
    );
    assert_eq!(arrears.status, LeaseStatus::Arrears);

    let defaulted = fixture
        .client
        .default_lease(&fixture.admin, &String::from_str(&fixture.env, "lease_001"));
    assert_eq!(defaulted.status, LeaseStatus::Defaulted);
    assert_eq!(
        fixture.client.try_pay_rent(
            &fixture.lessee,
            &String::from_str(&fixture.env, "lease_001")
        ),
        Err(Ok(Error::InvalidStatus))
    );
}

#[test]
fn late_payment_cures_arrears() {
    let fixture = setup();
    create(&fixture);
    fixture.env.ledger().set_timestamp(NOW + MONTH + 1);
    fixture.client.flag_arrears(
        &fixture.lessor,
        &String::from_str(&fixture.env, "lease_001"),
    );

    let cured = fixture.client.pay_rent(
        &fixture.lessee,
        &String::from_str(&fixture.env, "lease_001"),
    );

    assert_eq!(cured.status, LeaseStatus::Active);
    assert_eq!(cured.next_due_at, NOW + MONTH + 1 + MONTH);
}

#[test]
fn cannot_flag_before_due() {
    let fixture = setup();
    create(&fixture);

    assert_eq!(
        fixture.client.try_flag_arrears(
            &fixture.lessor,
            &String::from_str(&fixture.env, "lease_001")
        ),
        Err(Ok(Error::NotDue))
    );
}

#[test]
fn only_lessee_pays_and_only_lessor_manages() {
    let fixture = setup();
    create(&fixture);
    let outsider = Address::generate(&fixture.env);

    assert_eq!(
        fixture
            .client
            .try_pay_rent(&outsider, &String::from_str(&fixture.env, "lease_001")),
        Err(Ok(Error::Unauthorized))
    );
    fixture.env.ledger().set_timestamp(NOW + MONTH);
    assert_eq!(
        fixture
            .client
            .try_flag_arrears(&outsider, &String::from_str(&fixture.env, "lease_001")),
        Err(Ok(Error::Unauthorized))
    );
}

#[test]
fn rejects_invalid_lease_parameters() {
    let fixture = setup();

    assert_eq!(
        fixture.client.try_create_lease(
            &fixture.lessor,
            &String::from_str(&fixture.env, "lease_bad"),
            &String::from_str(&fixture.env, "ast_eng_001"),
            &fixture.lessee,
            &0,
            &MONTH,
            &NOW,
        ),
        Err(Ok(Error::InvalidLease))
    );
    assert_eq!(
        fixture.client.try_create_lease(
            &fixture.lessor,
            &String::from_str(&fixture.env, "lease_bad"),
            &String::from_str(&fixture.env, "ast_eng_001"),
            &fixture.lessor,
            &100,
            &MONTH,
            &NOW,
        ),
        Err(Ok(Error::InvalidParties))
    );
}

#[test]
fn extends_lease_due_date() {
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().set_timestamp(1_700_000_000);
    let admin = Address::generate(&env);
    let lessor = Address::generate(&env);
    let lessee = Address::generate(&env);
    let sac = env.register_stellar_asset_contract_v2(admin.clone());
    let token = sac.address();
    let contract_id = env.register(Leasing, ());
    let client = LeasingClient::new(&env, &contract_id);
    client.initialize(&admin, &token);
    client.create_lease(
        &lessor,
        &String::from_str(&env, "lease_001"),
        &String::from_str(&env, "asset_001"),
        &lessee,
        &100,
        &3600,
        &1_700_000_000,
    );
    let extended = client.extender_lease(&lessor, &String::from_str(&env, "lease_001"), &2);
    assert_eq!(extended.next_due_at, 1_700_000_000 + 2 * 3600);
}

#[test]
fn prepays_multiple_rent_periods() {
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().set_timestamp(1_700_000_000);
    let admin = Address::generate(&env);
    let lessor = Address::generate(&env);
    let lessee = Address::generate(&env);
    let sac = env.register_stellar_asset_contract_v2(admin.clone());
    let token = sac.address();
    let token_admin = token::StellarAssetClient::new(&env, &token);
    token_admin.mint(&lessee, &10_000);
    let contract_id = env.register(Leasing, ());
    let client = LeasingClient::new(&env, &contract_id);
    client.initialize(&admin, &token);
    client.create_lease(
        &lessor,
        &String::from_str(&env, "lease_001"),
        &String::from_str(&env, "asset_001"),
        &lessee,
        &100,
        &3600,
        &1_700_000_000,
    );
    let updated = client.pagar_renta_anticipada(&lessee, &String::from_str(&env, "lease_001"), &3);
    assert_eq!(updated.payments, 3);
    assert_eq!(updated.total_paid, 300);
}

#[test]
fn closes_lease_early() {
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().set_timestamp(1_700_000_000);
    let admin = Address::generate(&env);
    let lessor = Address::generate(&env);
    let lessee = Address::generate(&env);
    let sac = env.register_stellar_asset_contract_v2(admin.clone());
    let token = sac.address();
    let contract_id = env.register(Leasing, ());
    let client = LeasingClient::new(&env, &contract_id);
    client.initialize(&admin, &token);
    client.create_lease(
        &lessor,
        &String::from_str(&env, "lease_early"),
        &String::from_str(&env, "asset_001"),
        &lessee,
        &100,
        &3600,
        &1_700_000_000,
    );
    let closed = client.cerrar_anticipado(&lessor, &String::from_str(&env, "lease_early"));
    assert_eq!(closed.status, LeaseStatus::Closed);
}

#[test]
fn renews_a_lease() {
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().set_timestamp(1_700_000_000);
    let admin = Address::generate(&env);
    let lessor = Address::generate(&env);
    let lessee = Address::generate(&env);
    let sac = env.register_stellar_asset_contract_v2(admin.clone());
    let token = sac.address();
    let contract_id = env.register(Leasing, ());
    let client = LeasingClient::new(&env, &contract_id);
    client.initialize(&admin, &token);
    client.create_lease(
        &lessor,
        &String::from_str(&env, "lease_renew"),
        &String::from_str(&env, "asset_001"),
        &lessee,
        &100,
        &3600,
        &1_700_000_000,
    );
    let renewed = client.renovar_lease(&lessor, &String::from_str(&env, "lease_renew"), &2);
    assert_eq!(renewed.next_due_at, 1_700_000_000 + 2 * 3600);
    assert_eq!(renewed.total_paid, 0);
    assert_eq!(renewed.payments, 0);
}

#[test]
fn renews_multiple_leases() {
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().set_timestamp(1_700_000_000);
    let admin = Address::generate(&env);
    let lessor = Address::generate(&env);
    let lessee = Address::generate(&env);
    let sac = env.register_stellar_asset_contract_v2(admin.clone());
    let token = sac.address();
    let contract_id = env.register(Leasing, ());
    let client = LeasingClient::new(&env, &contract_id);
    client.initialize(&admin, &token);
    client.create_lease(
        &lessor,
        &String::from_str(&env, "lease_a"),
        &String::from_str(&env, "asset_a"),
        &lessee,
        &100,
        &3600,
        &1_700_000_000,
    );
    client.create_lease(
        &lessor,
        &String::from_str(&env, "lease_b"),
        &String::from_str(&env, "asset_b"),
        &lessee,
        &100,
        &3600,
        &1_700_000_000,
    );
    let ids = soroban_sdk::vec![
        &env,
        String::from_str(&env, "lease_a"),
        String::from_str(&env, "lease_b")
    ];
    let renewed = client.renovar_masivo(&lessor, &ids, &2);
    assert_eq!(renewed, 2);
}
