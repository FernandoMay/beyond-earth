#![no_std]

use soroban_sdk::contractevent;
use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, Address, BytesN, Env, String,
};

#[contracttype]
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum ProposalStatus {
    Active = 0,
    Passed = 1,
    Rejected = 2,
    Executed = 3,
    Cancelled = 4,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Proposal {
    pub id: String,
    pub proposer: Address,
    pub title_hash: BytesN<32>,
    pub description_hash: BytesN<32>,
    pub created_at: u64,
    pub voting_ends_at: u64,
    pub executable_at: u64,
    pub yes_votes: u32,
    pub no_votes: u32,
    pub status: ProposalStatus,
    pub executed_at: u64,
}

#[contracttype]
pub enum DataKey {
    Admin,
    VotingPeriod,
    Timelock,
    Quorum,
    Member(Address),
    MemberCount,
    Proposal(String),
    Vote(String, Address),
    AllProposals,
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    Unauthorized = 3,
    NotMember = 4,
    AlreadyMember = 5,
    ProposalExists = 6,
    ProposalNotFound = 7,
    InvalidConfig = 8,
    VotingClosed = 9,
    AlreadyVoted = 10,
    VotingStillOpen = 11,
    ProposalNotActive = 12,
    NotPassed = 13,
    TimelockActive = 14,
    CannotCancel = 15,
}

/// Council governance. Voting power is one vote per approved council member;
/// there is deliberately no transferable governance token at launch.
/// Emitted when a member is added.
#[contractevent]
pub struct MemberAdded {
    pub member: Address,
}

/// Emitted when a member is removed.
#[contractevent]
pub struct MemberRemoved {
    pub member: Address,
}

/// Emitted when a proposal is created.
#[contractevent]
pub struct ProposalCreated {
    pub proposal_id: String,
    pub proposer: Address,
}

/// Emitted when a vote is cast.
#[contractevent]
pub struct VoteCast {
    pub proposal_id: String,
    pub voter: Address,
    pub support: bool,
}

/// Emitted when a proposal is finalized.
#[contractevent]
pub struct ProposalFinalized {
    pub proposal_id: String,
    pub status: u32,
}

/// Emitted when a proposal is executed.
#[contractevent]
pub struct ProposalExecuted {
    pub proposal_id: String,
}

/// Emitted when a proposal is cancelled.
#[contractevent]
pub struct ProposalCancelled {
    pub proposal_id: String,
}

/// Emitted when a proposal is reopened.
#[contractevent]
pub struct ProposalReopened {
    pub proposal_id: String,
}

#[contract]
pub struct Governance;

#[contractimpl]
impl Governance {
    pub fn initialize(
        env: Env,
        admin: Address,
        voting_period: u64,
        timelock: u64,
        quorum: u32,
    ) -> Result<(), Error> {
        if env.storage().instance().has(&DataKey::Admin) {
            return Err(Error::AlreadyInitialized);
        }
        if voting_period == 0 || quorum == 0 {
            return Err(Error::InvalidConfig);
        }
        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage()
            .instance()
            .set(&DataKey::VotingPeriod, &voting_period);
        env.storage().instance().set(&DataKey::Timelock, &timelock);
        env.storage().instance().set(&DataKey::Quorum, &quorum);
        env.storage()
            .persistent()
            .set(&DataKey::Member(admin.clone()), &true);
        env.storage().instance().set(&DataKey::MemberCount, &1_u32);
        Ok(())
    }

    pub fn add_member(env: Env, caller: Address, member: Address) -> Result<u32, Error> {
        caller.require_auth();
        require_admin(&env, &caller)?;
        if env
            .storage()
            .persistent()
            .get::<_, bool>(&DataKey::Member(member.clone()))
            .unwrap_or(false)
        {
            return Err(Error::AlreadyMember);
        }
        env.storage()
            .persistent()
            .set(&DataKey::Member(member.clone()), &true);
        MemberAdded {
            member: member.clone(),
        }
        .publish(&env);
        let count = Self::member_count(env.clone()) + 1;
        env.storage().instance().set(&DataKey::MemberCount, &count);
        Ok(count)
    }

    pub fn remove_member(env: Env, caller: Address, member: Address) -> Result<u32, Error> {
        caller.require_auth();
        require_admin(&env, &caller)?;
        let admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .ok_or(Error::NotInitialized)?;
        if member == admin {
            return Err(Error::Unauthorized);
        }
        if !env
            .storage()
            .persistent()
            .get::<_, bool>(&DataKey::Member(member.clone()))
            .unwrap_or(false)
        {
            return Err(Error::NotMember);
        }
        env.storage()
            .persistent()
            .remove(&DataKey::Member(member.clone()));
        MemberRemoved {
            member: member.clone(),
        }
        .publish(&env);
        let count = Self::member_count(env.clone()).saturating_sub(1);
        env.storage().instance().set(&DataKey::MemberCount, &count);
        Ok(count)
    }

    pub fn is_member(env: Env, account: Address) -> bool {
        env.storage()
            .persistent()
            .get(&DataKey::Member(account))
            .unwrap_or(false)
    }

    pub fn member_count(env: Env) -> u32 {
        env.storage()
            .instance()
            .get(&DataKey::MemberCount)
            .unwrap_or(0)
    }

    pub fn propose(
        env: Env,
        proposer: Address,
        id: String,
        title_hash: BytesN<32>,
        description_hash: BytesN<32>,
    ) -> Result<Proposal, Error> {
        proposer.require_auth();
        if !Self::is_member(env.clone(), proposer.clone()) {
            return Err(Error::NotMember);
        }
        let key = DataKey::Proposal(id.clone());
        if env.storage().persistent().has(&key) {
            return Err(Error::ProposalExists);
        }
        let now = env.ledger().timestamp();
        let voting_period: u64 = env
            .storage()
            .instance()
            .get(&DataKey::VotingPeriod)
            .ok_or(Error::NotInitialized)?;
        let timelock: u64 = env
            .storage()
            .instance()
            .get(&DataKey::Timelock)
            .unwrap_or(0);
        let voting_ends_at = now + voting_period;
        let proposal = Proposal {
            id: id.clone(),
            proposer,
            title_hash,
            description_hash,
            created_at: now,
            voting_ends_at,
            executable_at: voting_ends_at + timelock,
            yes_votes: 0,
            no_votes: 0,
            status: ProposalStatus::Active,
            executed_at: 0,
        };
        env.storage().persistent().set(&key, &proposal);
        ProposalCreated {
            proposal_id: id.clone(),
            proposer: proposal.proposer.clone(),
        }
        .publish(&env);

        let mut all: soroban_sdk::Vec<String> = env
            .storage()
            .instance()
            .get(&DataKey::AllProposals)
            .unwrap_or_else(|| soroban_sdk::Vec::new(&env));
        all.push_back(id.clone());
        env.storage().instance().set(&DataKey::AllProposals, &all);

        Ok(proposal)
    }

    pub fn vote(env: Env, voter: Address, id: String, support: bool) -> Result<Proposal, Error> {
        voter.require_auth();
        if !Self::is_member(env.clone(), voter.clone()) {
            return Err(Error::NotMember);
        }
        let mut proposal = get_proposal_or_error(&env, &id)?;
        if proposal.status != ProposalStatus::Active {
            return Err(Error::ProposalNotActive);
        }
        if env.ledger().timestamp() >= proposal.voting_ends_at {
            return Err(Error::VotingClosed);
        }
        let vote_key = DataKey::Vote(id.clone(), voter.clone());
        if env
            .storage()
            .persistent()
            .get::<_, bool>(&vote_key)
            .unwrap_or(false)
        {
            return Err(Error::AlreadyVoted);
        }
        if support {
            proposal.yes_votes += 1;
        } else {
            proposal.no_votes += 1;
        }
        env.storage().persistent().set(&vote_key, &true);
        env.storage()
            .persistent()
            .set(&DataKey::Proposal(id.clone()), &proposal);
        VoteCast {
            proposal_id: id.clone(),
            voter: voter.clone(),
            support,
        }
        .publish(&env);
        Ok(proposal)
    }

    pub fn has_voted(env: Env, id: String, voter: Address) -> bool {
        env.storage()
            .persistent()
            .get(&DataKey::Vote(id, voter))
            .unwrap_or(false)
    }

    /// Finalizes a proposal after voting closes. Passing requires quorum and a
    /// strict majority of yes over no.
    pub fn finalize(env: Env, id: String) -> Result<Proposal, Error> {
        let mut proposal = get_proposal_or_error(&env, &id)?;
        if proposal.status != ProposalStatus::Active {
            return Err(Error::ProposalNotActive);
        }
        if env.ledger().timestamp() < proposal.voting_ends_at {
            return Err(Error::VotingStillOpen);
        }
        let quorum: u32 = env
            .storage()
            .instance()
            .get(&DataKey::Quorum)
            .ok_or(Error::NotInitialized)?;
        proposal.status = if proposal.yes_votes >= quorum && proposal.yes_votes > proposal.no_votes
        {
            ProposalStatus::Passed
        } else {
            ProposalStatus::Rejected
        };
        ProposalFinalized {
            proposal_id: id.clone(),
            status: proposal.status as u32,
        }
        .publish(&env);
        env.storage()
            .persistent()
            .set(&DataKey::Proposal(id), &proposal);
        Ok(proposal)
    }

    /// Marks a passed proposal executed after the timelock. Execution itself is
    /// performed by the operations runbook against the referenced decision hash.
    pub fn execute(env: Env, caller: Address, id: String) -> Result<Proposal, Error> {
        caller.require_auth();
        require_admin(&env, &caller)?;
        let mut proposal = get_proposal_or_error(&env, &id)?;
        if proposal.status != ProposalStatus::Passed {
            return Err(Error::NotPassed);
        }
        if env.ledger().timestamp() < proposal.executable_at {
            return Err(Error::TimelockActive);
        }
        proposal.status = ProposalStatus::Executed;
        proposal.executed_at = env.ledger().timestamp();
        ProposalExecuted {
            proposal_id: id.clone(),
        }
        .publish(&env);
        env.storage()
            .persistent()
            .set(&DataKey::Proposal(id), &proposal);
        Ok(proposal)
    }

    pub fn cancel(env: Env, caller: Address, id: String) -> Result<Proposal, Error> {
        caller.require_auth();
        require_admin(&env, &caller)?;
        let mut proposal = get_proposal_or_error(&env, &id)?;
        if proposal.status != ProposalStatus::Active && proposal.status != ProposalStatus::Passed {
            return Err(Error::CannotCancel);
        }
        proposal.status = ProposalStatus::Cancelled;
        ProposalCancelled {
            proposal_id: id.clone(),
        }
        .publish(&env);
        env.storage()
            .persistent()
            .set(&DataKey::Proposal(id), &proposal);
        Ok(proposal)
    }

    /// Reopens a rejected proposal with a fresh voting window.
    pub fn reabrir_propuesta(env: Env, caller: Address, id: String) -> Result<Proposal, Error> {
        caller.require_auth();
        require_admin(&env, &caller)?;
        let mut proposal = get_proposal_or_error(&env, &id)?;
        if proposal.status != ProposalStatus::Rejected {
            return Err(Error::ProposalNotActive);
        }
        let voting_period: u64 = env
            .storage()
            .instance()
            .get(&DataKey::VotingPeriod)
            .ok_or(Error::NotInitialized)?;
        let timelock: u64 = env
            .storage()
            .instance()
            .get(&DataKey::Timelock)
            .unwrap_or(0);
        let now = env.ledger().timestamp();
        proposal.status = ProposalStatus::Active;
        proposal.yes_votes = 0;
        proposal.no_votes = 0;
        proposal.created_at = now;
        proposal.voting_ends_at = now + voting_period;
        proposal.executable_at = proposal.voting_ends_at + timelock;
        env.storage()
            .persistent()
            .set(&DataKey::Proposal(id.clone()), &proposal);
        ProposalReopened {
            proposal_id: id.clone(),
        }
        .publish(&env);
        Ok(proposal)
    }

    /// Votes and finalizes immediately if quorum is reached.
    pub fn votar_y_finalizar(
        env: Env,
        voter: Address,
        id: String,
        support: bool,
    ) -> Result<Proposal, Error> {
        voter.require_auth();
        if !Self::is_member(env.clone(), voter.clone()) {
            return Err(Error::NotMember);
        }
        let mut proposal = get_proposal_or_error(&env, &id)?;
        if proposal.status != ProposalStatus::Active {
            return Err(Error::ProposalNotActive);
        }
        if env.ledger().timestamp() >= proposal.voting_ends_at {
            return Err(Error::VotingClosed);
        }
        let vote_key = DataKey::Vote(id.clone(), voter.clone());
        if env
            .storage()
            .persistent()
            .get::<_, bool>(&vote_key)
            .unwrap_or(false)
        {
            return Err(Error::AlreadyVoted);
        }
        if support {
            proposal.yes_votes += 1;
        } else {
            proposal.no_votes += 1;
        }
        env.storage().persistent().set(&vote_key, &true);
        env.storage()
            .persistent()
            .set(&DataKey::Proposal(id.clone()), &proposal);
        VoteCast {
            proposal_id: id.clone(),
            voter: voter.clone(),
            support,
        }
        .publish(&env);

        let quorum: u32 = env
            .storage()
            .instance()
            .get(&DataKey::Quorum)
            .ok_or(Error::NotInitialized)?;
        if proposal.yes_votes >= quorum && proposal.yes_votes > proposal.no_votes {
            proposal.status = ProposalStatus::Passed;
            ProposalFinalized {
                proposal_id: id.clone(),
                status: proposal.status as u32,
            }
            .publish(&env);
            env.storage()
                .persistent()
                .set(&DataKey::Proposal(id), &proposal);
        }
        Ok(proposal)
    }

    /// Executes all passed proposals whose timelock has expired.
    pub fn ejecutar_todo(env: Env, caller: Address) -> u32 {
        caller.require_auth();
        require_admin(&env, &caller).unwrap();
        let proposals: soroban_sdk::Vec<String> = env
            .storage()
            .instance()
            .get(&DataKey::AllProposals)
            .unwrap_or_else(|| soroban_sdk::Vec::new(&env));
        let now = env.ledger().timestamp();
        let mut executed = 0_u32;
        for id in proposals.iter() {
            if let Some(mut proposal) = env
                .storage()
                .persistent()
                .get::<_, Proposal>(&DataKey::Proposal(id.clone()))
            {
                if proposal.status == ProposalStatus::Passed && now >= proposal.executable_at {
                    proposal.status = ProposalStatus::Executed;
                    proposal.executed_at = now;
                    ProposalExecuted {
                        proposal_id: id.clone(),
                    }
                    .publish(&env);
                    env.storage()
                        .persistent()
                        .set(&DataKey::Proposal(id), &proposal);
                    executed += 1;
                }
            }
        }
        executed
    }

    /// Cancels multiple active proposals.
    pub fn cancelar_masivo(env: Env, caller: Address, ids: soroban_sdk::Vec<String>) -> u32 {
        caller.require_auth();
        if require_admin(&env, &caller).is_err() {
            return 0;
        }
        if ids.len() > 50 {
            return 0;
        }
        let mut cancelled = 0_u32;
        for id in ids.iter() {
            if let Some(mut proposal) = env
                .storage()
                .persistent()
                .get::<_, Proposal>(&DataKey::Proposal(id.clone()))
            {
                if proposal.status == ProposalStatus::Active
                    || proposal.status == ProposalStatus::Passed
                {
                    proposal.status = ProposalStatus::Cancelled;
                    ProposalCancelled {
                        proposal_id: id.clone(),
                    }
                    .publish(&env);
                    env.storage()
                        .persistent()
                        .set(&DataKey::Proposal(id), &proposal);
                    cancelled += 1;
                }
            }
        }
        cancelled
    }

    pub fn get_proposal(env: Env, id: String) -> Result<Proposal, Error> {
        get_proposal_or_error(&env, &id)
    }
}

fn require_admin(env: &Env, caller: &Address) -> Result<(), Error> {
    let admin: Address = env
        .storage()
        .instance()
        .get(&DataKey::Admin)
        .ok_or(Error::NotInitialized)?;
    if admin != *caller {
        return Err(Error::Unauthorized);
    }
    Ok(())
}

fn get_proposal_or_error(env: &Env, id: &String) -> Result<Proposal, Error> {
    env.storage()
        .persistent()
        .get(&DataKey::Proposal(id.clone()))
        .ok_or(Error::ProposalNotFound)
}

#[cfg(test)]
mod test;
