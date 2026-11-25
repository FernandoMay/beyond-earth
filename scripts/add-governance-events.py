from pathlib import Path

path = Path("contracts/governance/src/lib.rs")
s = path.read_text()
assert "contractevent" not in s

defs = """
/// Emitted when a council member opens a proposal.
#[contractevent]
pub struct ProposalCreated {
    pub proposal_id: String,
    pub proposer: Address,
    pub voting_ends_at: u64,
}

/// Emitted when a council member votes.
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
    pub yes_votes: u32,
    pub no_votes: u32,
}

/// Emitted when a passed proposal is executed after the timelock.
#[contractevent]
pub struct ProposalExecuted {
    pub proposal_id: String,
}

/// Emitted when a proposal is cancelled.
#[contractevent]
pub struct ProposalCancelled {
    pub proposal_id: String,
}
"""

s = s.replace("#![no_std]\n", "#![no_std]\n\nuse soroban_sdk::contractevent;\n", 1)
marker = "/// Council governance."
assert s.count(marker) == 1
s = s.replace(marker, defs.strip() + "\n\n" + marker, 1)

pairs = [
    (
        """        env.storage().persistent().set(&key, &proposal);
        Ok(proposal)""",
        """        env.storage().persistent().set(&key, &proposal);
        ProposalCreated {
            proposal_id: id.clone(),
            proposer: proposal.proposer.clone(),
            voting_ends_at,
        }
        .publish(&env);
        Ok(proposal)""",
    ),
    (
        """        env.storage().persistent().set(&vote_key, &true);
        env.storage()
            .persistent()
            .set(&DataKey::Proposal(id), &proposal);
        Ok(proposal)""",
        """        env.storage().persistent().set(&vote_key, &true);
        env.storage()
            .persistent()
            .set(&DataKey::Proposal(id.clone()), &proposal);
        VoteCast {
            proposal_id: id,
            voter,
            support,
        }
        .publish(&env);
        Ok(proposal)""",
    ),
    (
        """        proposal.status = ProposalStatus::Executed;
        proposal.executed_at = env.ledger().timestamp();
        env.storage()""",
        """        proposal.status = ProposalStatus::Executed;
        proposal.executed_at = env.ledger().timestamp();
        ProposalExecuted {
            proposal_id: id.clone(),
        }
        .publish(&env);
        env.storage()""",
    ),
    (
        """        proposal.status = ProposalStatus::Cancelled;
        env.storage()""",
        """        proposal.status = ProposalStatus::Cancelled;
        ProposalCancelled {
            proposal_id: id.clone(),
        }
        .publish(&env);
        env.storage()""",
    ),
    (
        """            ProposalStatus::Rejected
        };
        env.storage()
            .persistent()
            .set(&DataKey::Proposal(id), &proposal);
        Ok(proposal)""",
        """            ProposalStatus::Rejected
        };
        env.storage()
            .persistent()
            .set(&DataKey::Proposal(id.clone()), &proposal);
        ProposalFinalized {
            proposal_id: id,
            status: proposal.status as u32,
            yes_votes: proposal.yes_votes,
            no_votes: proposal.no_votes,
        }
        .publish(&env);
        Ok(proposal)""",
    ),
]

for old, new in pairs:
    assert s.count(old) == 1, old[:80]
    s = s.replace(old, new, 1)

path.write_text(s)
print("updated governance")
