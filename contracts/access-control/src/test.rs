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
fn revokes_all_roles_from_an_account() {
    let env = Env::default();
    let (client, owner) = setup(&env);
    let target = Address::generate(&env);

    client.grant(&owner, &target, &Role::Issuer);
    client.grant(&owner, &target, &Role::Operator);

    let revoked = client.revocar_todo(&owner, &target);
    assert_eq!(revoked, 2);
    assert!(!client.has_role(&target, &Role::Issuer));
    assert!(!client.has_role(&target, &Role::Operator));
}

#[test]
fn non_admin_cannot_revoke_all_roles() {
    let env = Env::default();
    let (client, owner) = setup(&env);
    let outsider = Address::generate(&env);
    let target = Address::generate(&env);

    client.grant(&owner, &target, &Role::Issuer);
    let result = client.try_revocar_todo(&outsider, &target);

    assert_eq!(result, Err(Ok(Error::Unauthorized)));
    assert!(client.has_role(&target, &Role::Issuer));
}

#[test]
fn revocar_todo_returns_zero_when_no_roles() {
    let env = Env::default();
    let (client, owner) = setup(&env);
    let target = Address::generate(&env);

    let revoked = client.revocar_todo(&owner, &target);
    assert_eq!(revoked, 0);
}

#[test]
fn revocar_todo_cannot_revoke_owner() {
    let env = Env::default();
    let (client, owner) = setup(&env);

    let result = client.try_revocar_todo(&owner, &owner);
    assert_eq!(result, Err(Ok(Error::CannotRevokeOwner)));
}
