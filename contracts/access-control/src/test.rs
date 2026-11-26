use super::*;
use soroban_sdk::{testutils::Address as _, Address, Env};

fn setup(env: &Env) -> (AccessControlClient<'_>, Address) {
    env.mock_all_auths();
    let owner = Address::generate(env);
    let contract_id = env.register(AccessControl, ());
    let client = AccessControlClient::new(env, &contract_id);
    client.initialize(&owner);
    (client, owner)
}

#[test]
fn initializes_with_owner_as_admin() {
    let env = Env::default();
    let (client, owner) = setup(&env);

    assert_eq!(client.owner(), owner);
    assert!(client.has_role(&owner, &Role::Admin));
}

#[test]
fn cannot_initialize_twice() {
    let env = Env::default();
    let (client, owner) = setup(&env);

    let result = client.try_initialize(&owner);
    assert_eq!(result, Err(Ok(Error::AlreadyInitialized)));
}

#[test]
fn admin_can_grant_and_revoke_roles() {
    let env = Env::default();
    let (client, owner) = setup(&env);
    let operator = Address::generate(&env);

    client.grant(&owner, &operator, &Role::Operator);
    assert!(client.has_role(&operator, &Role::Operator));
    assert!(!client.has_role(&operator, &Role::Compliance));

    client.revoke(&owner, &operator, &Role::Operator);
    assert!(!client.has_role(&operator, &Role::Operator));
}

#[test]
fn non_admin_cannot_grant_roles() {
    let env = Env::default();
    let (client, owner) = setup(&env);
    let outsider = Address::generate(&env);
    let target = Address::generate(&env);

    client.grant(&owner, &outsider, &Role::Issuer);
    let result = client.try_grant(&outsider, &target, &Role::Admin);

    assert_eq!(result, Err(Ok(Error::Unauthorized)));
    assert!(!client.has_role(&target, &Role::Admin));
}

#[test]
fn owner_admin_role_cannot_be_revoked() {
    let env = Env::default();
    let (client, owner) = setup(&env);

    let result = client.try_revoke(&owner, &owner, &Role::Admin);

    assert_eq!(result, Err(Ok(Error::CannotRevokeOwner)));
    assert!(client.has_role(&owner, &Role::Admin));
}

#[test]
fn role_is_scoped_to_account() {
    let env = Env::default();
    let (client, owner) = setup(&env);
    let auditor = Address::generate(&env);

    client.grant(&owner, &auditor, &Role::Auditor);

    assert!(client.has_role(&auditor, &Role::Auditor));
    assert!(!client.has_role(&owner, &Role::Auditor));
}

#[test]
fn transfers_a_role_between_accounts() {
    let env = Env::default();
    let (client, owner) = setup(&env);
    let from = Address::generate(&env);
    let to = Address::generate(&env);

    client.grant(&owner, &from, &Role::Operator);
    assert!(client.has_role(&from, &Role::Operator));

    client.transferir_rol(&owner, &from, &to, &Role::Operator);
    assert!(!client.has_role(&from, &Role::Operator));
    assert!(client.has_role(&to, &Role::Operator));
}

#[test]
fn revokes_all_roles_from_account() {
    let env = Env::default();
    let (client, owner) = setup(&env);
    let operator = Address::generate(&env);

    client.grant(&owner, &operator, &Role::Operator);
    client.grant(&owner, &operator, &Role::Issuer);
    assert!(client.has_role(&operator, &Role::Operator));
    assert!(client.has_role(&operator, &Role::Issuer));

    let revoked = client.revocar_todo(&owner, &operator);
    assert_eq!(revoked, 2);
    assert!(!client.has_role(&operator, &Role::Operator));
    assert!(!client.has_role(&operator, &Role::Issuer));
}


#[test]
fn grants_role_to_multiple_accounts() {
    let env = Env::default();
    let (client, owner) = setup(&env);
    let a = Address::generate(&env);
    let b = Address::generate(&env);
    let grantees = soroban_sdk::vec![&env, a.clone(), b.clone()];
    let granted = client.otorgar_masivo(&owner, &grantees, &Role::Operator);
    assert_eq!(granted, 2);
    assert!(client.has_role(&a, &Role::Operator));
    assert!(client.has_role(&b, &Role::Operator));
}
