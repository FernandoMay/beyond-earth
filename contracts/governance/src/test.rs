use super::*;
use soroban_sdk::{
    testutils::{Address as _, Ledger as _},
    Address, BytesN, Env, String,
};

const NOW: u64 = 1_700_000_000;
const VOTING_PERIOD: u64 = 7 * 86_400;
const TIMELOCK: u64 = 2 * 86_400;

struct Fixture<'a> {
    env: Env,
    client: GovernanceClient<'a>,
    admin: Address,
    alice: Address,
    bob: Address,
    carol: Address,
}

fn setup() -> Fixture<'static> {
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().set_timestamp(NOW);
    let admin = Address::generate(&env);
    let alice = Address::generate(&env);
    let bob = Address::generate(&env);
    let carol = Address::generate(&env);
    let contract_id = env.register(Governance, ());
    let client = GovernanceClient::new(&env, &contract_id);
    client.initialize(&admin, &VOTING_PERIOD, &TIMELOCK, &2);
    client.add_member(&admin, &alice);
    client.add_member(&admin, &bob);
    client.add_member(&admin, &carol);
    Fixture {
        env,
        client,
        admin,
        alice,
        bob,
        carol,
    }
}

fn propose(fixture: &Fixture<'_>) -> Proposal {
    fixture.client.propose(
        &fixture.alice,
        &String::from_str(&fixture.env, "prop_001"),
        &BytesN::from_array(&fixture.env, &[1u8; 32]),
        &BytesN::from_array(&fixture.env, &[2u8; 32]),
    )
}

#[test]
fn council_members_propose_and_pass() {
    let fixture = setup();
    let proposal = propose(&fixture);

    assert_eq!(proposal.status, ProposalStatus::Active);
    assert_eq!(fixture.client.member_count(), 4);

    fixture.client.vote(
        &fixture.alice,
        &String::from_str(&fixture.env, "prop_001"),
        &true,
    );
    fixture.client.vote(
        &fixture.bob,
        &String::from_str(&fixture.env, "prop_001"),
        &true,
    );
    fixture.client.vote(
        &fixture.carol,
        &String::from_str(&fixture.env, "prop_001"),
        &false,
    );

    fixture.env.ledger().set_timestamp(NOW + VOTING_PERIOD);
    let passed = fixture
        .client
        .finalize(&String::from_str(&fixture.env, "prop_001"));

    assert_eq!(passed.status, ProposalStatus::Passed);
    assert_eq!(passed.yes_votes, 2);
    assert_eq!(passed.no_votes, 1);
}

#[test]
fn quorum_failure_rejects() {
    let fixture = setup();
    propose(&fixture);
    fixture.client.vote(
        &fixture.alice,
        &String::from_str(&fixture.env, "prop_001"),
        &true,
    );

    fixture.env.ledger().set_timestamp(NOW + VOTING_PERIOD);
    let rejected = fixture
        .client
        .finalize(&String::from_str(&fixture.env, "prop_001"));

    assert_eq!(rejected.status, ProposalStatus::Rejected);
}

#[test]
fn only_members_can_vote_once() {
    let fixture = setup();
    propose(&fixture);
    let outsider = Address::generate(&fixture.env);

    assert_eq!(
        fixture.client.try_vote(
            &outsider,
            &String::from_str(&fixture.env, "prop_001"),
            &true
        ),
        Err(Ok(Error::NotMember))
    );

    fixture.client.vote(
        &fixture.alice,
        &String::from_str(&fixture.env, "prop_001"),
        &true,
    );
    assert_eq!(
        fixture.client.try_vote(
            &fixture.alice,
            &String::from_str(&fixture.env, "prop_001"),
            &true
        ),
        Err(Ok(Error::AlreadyVoted))
    );
}

#[test]
fn cannot_finalize_while_open_or_vote_after_close() {
    let fixture = setup();
    propose(&fixture);

    assert_eq!(
        fixture
            .client
            .try_finalize(&String::from_str(&fixture.env, "prop_001")),
        Err(Ok(Error::VotingStillOpen))
    );

    fixture.env.ledger().set_timestamp(NOW + VOTING_PERIOD);
    assert_eq!(
        fixture.client.try_vote(
            &fixture.alice,
            &String::from_str(&fixture.env, "prop_001"),
            &true
        ),
        Err(Ok(Error::VotingClosed))
    );
}

#[test]
fn execute_respects_the_timelock() {
    let fixture = setup();
    propose(&fixture);
    fixture.client.vote(
        &fixture.alice,
        &String::from_str(&fixture.env, "prop_001"),
        &true,
    );
    fixture.client.vote(
        &fixture.bob,
        &String::from_str(&fixture.env, "prop_001"),
        &true,
    );
    fixture.env.ledger().set_timestamp(NOW + VOTING_PERIOD);
    fixture
        .client
        .finalize(&String::from_str(&fixture.env, "prop_001"));

    assert_eq!(
        fixture
            .client
            .try_execute(&fixture.admin, &String::from_str(&fixture.env, "prop_001")),
        Err(Ok(Error::TimelockActive))
    );

    fixture
        .env
        .ledger()
        .set_timestamp(NOW + VOTING_PERIOD + TIMELOCK);
    let executed = fixture
        .client
        .execute(&fixture.admin, &String::from_str(&fixture.env, "prop_001"));
    assert_eq!(executed.status, ProposalStatus::Executed);
    assert_eq!(executed.executed_at, NOW + VOTING_PERIOD + TIMELOCK);
}

#[test]
fn admin_can_cancel_and_manage_members() {
    let fixture = setup();
    propose(&fixture);

    let cancelled = fixture
        .client
        .cancel(&fixture.admin, &String::from_str(&fixture.env, "prop_001"));
    assert_eq!(cancelled.status, ProposalStatus::Cancelled);

    fixture.client.remove_member(&fixture.admin, &fixture.carol);
    assert!(!fixture.client.is_member(&fixture.carol));
    assert_eq!(fixture.client.member_count(), 3);
    assert_eq!(
        fixture
            .client
            .try_remove_member(&fixture.admin, &fixture.admin),
        Err(Ok(Error::Unauthorized))
    );
}

#[test]
fn non_members_cannot_propose() {
    let fixture = setup();
    let outsider = Address::generate(&fixture.env);

    assert_eq!(
        fixture.client.try_propose(
            &outsider,
            &String::from_str(&fixture.env, "prop_bad"),
            &BytesN::from_array(&fixture.env, &[1u8; 32]),
            &BytesN::from_array(&fixture.env, &[2u8; 32]),
        ),
        Err(Ok(Error::NotMember))
    );
}


#[test]
fn reopens_a_rejected_proposal() {
    let fixture = setup();
    propose(&fixture);
    fixture.client.vote(
        &fixture.alice,
        &String::from_str(&fixture.env, "prop_001"),
        &true,
    );
    fixture.env.ledger().set_timestamp(NOW + VOTING_PERIOD);
    let rejected = fixture
        .client
        .finalize(&String::from_str(&fixture.env, "prop_001"));
    assert_eq!(rejected.status, ProposalStatus::Rejected);

    let reopened = fixture
        .client
        .reabrir_propuesta(&fixture.admin, &String::from_str(&fixture.env, "prop_001"));
    assert_eq!(reopened.status, ProposalStatus::Active);
    assert_eq!(reopened.yes_votes, 0);
}
