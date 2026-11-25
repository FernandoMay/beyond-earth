from pathlib import Path

ROOT = Path("contracts")

def apply(rel, defs, pairs, marker="#[contract]\n"):
    path = ROOT / rel
    s = path.read_text()
    assert s.count("#![no_std]\n") == 1, (rel, "no_std")
    s = s.replace("#![no_std]\n", "#![no_std]\n\nuse soroban_sdk::contractevent;\n", 1)
    assert s.count(marker) == 1, (rel, "marker", s.count(marker))
    s = s.replace(marker, defs.rstrip() + "\n\n" + marker, 1)
    for old, new in pairs:
        count = s.count(old)
        assert count == 1, (rel, old[:90], count)
        s = s.replace(old, new, 1)
    path.write_text(s)
    print("updated", rel)

# ---------------------------------------------------------------- access-control
apply(
    "access-control/src/lib.rs",
    """
/// Emitted when an admin grants a role.
#[contractevent]
pub struct RoleGranted {
    pub caller: Address,
    pub grantee: Address,
    pub role: u32,
}

/// Emitted when an admin revokes a role.
#[contractevent]
pub struct RoleRevoked {
    pub caller: Address,
    pub grantee: Address,
    pub role: u32,
}
""",
    [
        (
            "use soroban_sdk::{\n    contract, contracterror, contractimpl, contracttype, symbol_short, Address, Env,\n};",
            "use soroban_sdk::{contract, contracterror, contractimpl, contracttype, Address, Env};",
        ),
        (
            """        env.events().publish(
            (symbol_short!("acl"), symbol_short!("grant")),
            (caller, grantee.clone(), role as u32),
        );""",
            """        RoleGranted {
            caller: caller.clone(),
            grantee: grantee.clone(),
            role: role as u32,
        }
        .publish(&env);""",
        ),
        (
            """        env.events().publish(
            (symbol_short!("acl"), symbol_short!("revoke")),
            (caller, grantee.clone(), role as u32),
        );""",
            """        RoleRevoked {
            caller: caller.clone(),
            grantee: grantee.clone(),
            role: role as u32,
        }
        .publish(&env);""",
        ),
    ],
)

# ---------------------------------------------------------------- asset-registry
apply(
    "asset-registry/src/lib.rs",
    """
/// Emitted when an issuer registers an asset.
#[contractevent]
pub struct AssetRegistered {
    pub asset_id: String,
    pub issuer: Address,
    pub valuation_usd: i128,
}

/// Emitted when a reviewer verifies an asset's evidence.
#[contractevent]
pub struct AssetVerified {
    pub asset_id: String,
    pub reviewer: Address,
}

/// Emitted when a verified asset is attached to a token contract.
#[contractevent]
pub struct AssetTokenized {
    pub asset_id: String,
    pub caller: Address,
}

/// Emitted when an asset's lifecycle status changes.
#[contractevent]
pub struct AssetStatusChanged {
    pub asset_id: String,
    pub status: u32,
}
""",
    [
        (
            """        env.storage().persistent().set(&key, &record);

        let mut ids: Vec<String> = env""",
            """        env.storage().persistent().set(&key, &record);
        AssetRegistered {
            asset_id: id.clone(),
            issuer: issuer.clone(),
            valuation_usd,
        }
        .publish(&env);

        let mut ids: Vec<String> = env""",
        ),
        (
            """        record.verified_at = env.ledger().timestamp();
        env.storage().persistent().set(&DataKey::Asset(id), &record);""",
            """        record.verified_at = env.ledger().timestamp();
        AssetVerified {
            asset_id: id.clone(),
            reviewer: reviewer.clone(),
        }
        .publish(&env);
        env.storage().persistent().set(&DataKey::Asset(id), &record);""",
        ),
        (
            """        record.status = AssetStatus::Tokenized;
        env.storage().persistent().set(&DataKey::Asset(id), &record);""",
            """        record.status = AssetStatus::Tokenized;
        AssetTokenized {
            asset_id: id.clone(),
            caller: caller.clone(),
        }
        .publish(&env);
        env.storage().persistent().set(&DataKey::Asset(id), &record);""",
        ),
        (
            """        record.status = status;
        env.storage().persistent().set(&DataKey::Asset(id), &record);""",
            """        record.status = status;
        AssetStatusChanged {
            asset_id: id.clone(),
            status: status as u32,
        }
        .publish(&env);
        env.storage().persistent().set(&DataKey::Asset(id), &record);""",
        ),
    ],
)

# ---------------------------------------------------------------- compliance
apply(
    "compliance/src/lib.rs",
    """
/// Emitted when an investor's eligibility record changes.
#[contractevent]
pub struct InvestorUpdated {
    pub investor: Address,
    pub tier: u32,
    pub approved: bool,
}
""",
    [
        (
            """            updated_at: env.ledger().timestamp(),
        };
        env.storage()
            .persistent()
            .set(&DataKey::Investor(investor), &record);""",
            """            updated_at: env.ledger().timestamp(),
        };
        InvestorUpdated {
            investor: investor.clone(),
            tier,
            approved: true,
        }
        .publish(&env);
        env.storage()
            .persistent()
            .set(&DataKey::Investor(investor), &record);""",
        ),
        (
            """        record.updated_at = env.ledger().timestamp();
        env.storage()
            .persistent()
            .set(&DataKey::Investor(investor), &record);""",
            """        record.updated_at = env.ledger().timestamp();
        InvestorUpdated {
            investor: investor.clone(),
            tier: record.tier,
            approved: false,
        }
        .publish(&env);
        env.storage()
            .persistent()
            .set(&DataKey::Investor(investor), &record);""",
        ),
    ],
)

# ---------------------------------------------------------------- rwa-token
apply(
    "rwa-token/src/lib.rs",
    """
/// Emitted when tokenized rights are minted.
#[contractevent]
pub struct TokenMinted {
    pub to: Address,
    pub amount: i128,
}

/// Emitted when tokenized rights move between holders.
#[contractevent]
pub struct TokenTransferred {
    pub from: Address,
    pub to: Address,
    pub amount: i128,
}

/// Emitted when tokenized rights are burned.
#[contractevent]
pub struct TokenBurned {
    pub from: Address,
    pub amount: i128,
}
""",
    [
        (
            """        env.storage()
            .persistent()
            .set(&DataKey::Balance(to), &balance);""",
            """        env.storage()
            .persistent()
            .set(&DataKey::Balance(to.clone()), &balance);
        TokenMinted { to, amount }.publish(&env);""",
        ),
        (
            """    env.storage()
        .persistent()
        .set(&DataKey::Balance(to.clone()), &to_balance);
    Ok(())""",
            """    env.storage()
        .persistent()
        .set(&DataKey::Balance(to.clone()), &to_balance);
    TokenTransferred {
        from: from.clone(),
        to: to.clone(),
        amount,
    }
    .publish(env);
    Ok(())""",
        ),
        (
            """    let supply = RwaToken::total_supply(env.clone()) - amount;
    env.storage().instance().set(&DataKey::TotalSupply, &supply);
    Ok(())""",
            """    let supply = RwaToken::total_supply(env.clone()) - amount;
    env.storage().instance().set(&DataKey::TotalSupply, &supply);
    TokenBurned {
        from: from.clone(),
        amount,
    }
    .publish(env);
    Ok(())""",
        ),
    ],
)

# ---------------------------------------------------------------- investment
apply(
    "investment/src/lib.rs",
    """
/// Emitted when an issuer opens an offering.
#[contractevent]
pub struct OfferingCreated {
    pub offering_id: String,
    pub issuer: Address,
    pub target: i128,
}

/// Emitted when an investor subscribes.
#[contractevent]
pub struct Subscribed {
    pub offering_id: String,
    pub investor: Address,
    pub amount: i128,
}

/// Emitted when a funded offering settles to the issuer.
#[contractevent]
pub struct OfferingSettled {
    pub offering_id: String,
    pub committed: i128,
}

/// Emitted when an offering fails to reach its target.
#[contractevent]
pub struct OfferingFailed {
    pub offering_id: String,
    pub committed: i128,
}

/// Emitted when an investor claims a refund.
#[contractevent]
pub struct Refunded {
    pub offering_id: String,
    pub investor: Address,
    pub amount: i128,
}
""",
    [
        (
            """        env.storage().persistent().set(&key, &offering);
        let mut ids""",
            """        env.storage().persistent().set(&key, &offering);
        OfferingCreated {
            offering_id: id.clone(),
            issuer: offering.issuer.clone(),
            target,
        }
        .publish(&env);
        let mut ids""",
        ),
        (
            """        env.storage()
            .persistent()
            .set(&DataKey::Offering(offering_id), &offering);
        Ok(position)""",
            """        env.storage()
            .persistent()
            .set(&DataKey::Offering(offering_id.clone()), &offering);
        Subscribed {
            offering_id,
            investor,
            amount,
        }
        .publish(&env);
        Ok(position)""",
        ),
        (
            """        offering.status = OfferingStatus::Settled;
        env.storage()
            .persistent()
            .set(&DataKey::Offering(offering_id), &offering);
        Ok(offering)""",
            """        offering.status = OfferingStatus::Settled;
        env.storage()
            .persistent()
            .set(&DataKey::Offering(offering_id.clone()), &offering);
        OfferingSettled {
            offering_id,
            committed: offering.committed,
        }
        .publish(&env);
        Ok(offering)""",
        ),
        (
            """        offering.status = OfferingStatus::Failed;
        env.storage()
            .persistent()
            .set(&DataKey::Offering(offering_id), &offering);
        Ok(offering)""",
            """        offering.status = OfferingStatus::Failed;
        env.storage()
            .persistent()
            .set(&DataKey::Offering(offering_id.clone()), &offering);
        OfferingFailed {
            offering_id,
            committed: offering.committed,
        }
        .publish(&env);
        Ok(offering)""",
        ),
        (
            """        env.storage().persistent().set(&key, &position);
        Ok(refund)""",
            """        env.storage().persistent().set(&key, &position);
        Refunded {
            offering_id,
            investor,
            amount: refund,
        }
        .publish(&env);
        Ok(refund)""",
        ),
    ],
)

# ---------------------------------------------------------------- escrow
apply(
    "escrow/src/lib.rs",
    """
/// Emitted when a buyer funds an escrow.
#[contractevent]
pub struct EscrowCreated {
    pub escrow_id: String,
    pub buyer: Address,
    pub seller: Address,
    pub amount: i128,
}

/// Emitted when a party disputes an escrow.
#[contractevent]
pub struct EscrowDisputed {
    pub escrow_id: String,
}

/// Emitted when escrowed funds are released to the seller.
#[contractevent]
pub struct EscrowReleased {
    pub escrow_id: String,
    pub seller: Address,
    pub amount: i128,
}

/// Emitted when escrowed funds are refunded to the buyer.
#[contractevent]
pub struct EscrowRefunded {
    pub escrow_id: String,
    pub buyer: Address,
    pub amount: i128,
}
""",
    [
        (
            """        env.storage().persistent().set(&key, &escrow);
        Ok(escrow)""",
            """        env.storage().persistent().set(&key, &escrow);
        EscrowCreated {
            escrow_id: id.clone(),
            buyer: escrow.buyer.clone(),
            seller: escrow.seller.clone(),
            amount,
        }
        .publish(&env);
        Ok(escrow)""",
        ),
        (
            """        escrow.status = EscrowStatus::Disputed;
        env.storage()""",
            """        escrow.status = EscrowStatus::Disputed;
        EscrowDisputed {
            escrow_id: id.clone(),
        }
        .publish(&env);
        env.storage()""",
        ),
        (
            """        escrow.status = EscrowStatus::Released;
        escrow.resolved_at = env.ledger().timestamp();
        env.storage()""",
            """        escrow.status = EscrowStatus::Released;
        escrow.resolved_at = env.ledger().timestamp();
        EscrowReleased {
            escrow_id: id.clone(),
            seller: escrow.seller.clone(),
            amount: escrow.amount,
        }
        .publish(&env);
        env.storage()""",
        ),
        (
            """        escrow.status = EscrowStatus::Refunded;
        escrow.resolved_at = env.ledger().timestamp();
        env.storage()""",
            """        escrow.status = EscrowStatus::Refunded;
        escrow.resolved_at = env.ledger().timestamp();
        EscrowRefunded {
            escrow_id: id.clone(),
            buyer: escrow.buyer.clone(),
            amount: escrow.amount,
        }
        .publish(&env);
        env.storage()""",
        ),
    ],
)

# ---------------------------------------------------------------- revenue-distribution
apply(
    "revenue-distribution/src/lib.rs",
    """
/// Emitted when an issuer funds a distribution.
#[contractevent]
pub struct DistributionPublished {
    pub distribution_id: String,
    pub total_amount: i128,
    pub total_units: i128,
}

/// Emitted when units are allocated to an investor.
#[contractevent]
pub struct UnitsAllocated {
    pub distribution_id: String,
    pub investor: Address,
    pub units: i128,
}

/// Emitted when an investor claims a pro-rata share.
#[contractevent]
pub struct DistributionClaimed {
    pub distribution_id: String,
    pub investor: Address,
    pub amount: i128,
}

/// Emitted when a distribution closes and returns unclaimed funds.
#[contractevent]
pub struct DistributionClosed {
    pub distribution_id: String,
    pub remaining: i128,
}
""",
    [
        (
            """        env.storage().persistent().set(&key, &distribution);
        Ok(distribution)""",
            """        env.storage().persistent().set(&key, &distribution);
        DistributionPublished {
            distribution_id: id.clone(),
            total_amount,
            total_units,
        }
        .publish(&env);
        Ok(distribution)""",
        ),
        (
            """        env.storage()
            .persistent()
            .set(&DataKey::Distribution(distribution_id), &distribution);
        Ok(current + units)""",
            """        env.storage()
            .persistent()
            .set(&DataKey::Distribution(distribution_id.clone()), &distribution);
        UnitsAllocated {
            distribution_id,
            investor,
            units: current + units,
        }
        .publish(&env);
        Ok(current + units)""",
        ),
        (
            """        env.storage()
            .persistent()
            .set(&DataKey::Distribution(distribution_id), &distribution);
        Ok(entitlement)""",
            """        env.storage()
            .persistent()
            .set(&DataKey::Distribution(distribution_id.clone()), &distribution);
        DistributionClaimed {
            distribution_id,
            investor,
            amount: entitlement,
        }
        .publish(&env);
        Ok(entitlement)""",
        ),
        (
            """        distribution.status = DistributionStatus::Closed;
        env.storage()
            .persistent()
            .set(&DataKey::Distribution(distribution_id), &distribution);
        Ok(remaining)""",
            """        distribution.status = DistributionStatus::Closed;
        env.storage()
            .persistent()
            .set(&DataKey::Distribution(distribution_id.clone()), &distribution);
        DistributionClosed {
            distribution_id,
            remaining,
        }
        .publish(&env);
        Ok(remaining)""",
        ),
    ],
)

# ---------------------------------------------------------------- leasing
apply(
    "leasing/src/lib.rs",
    """
/// Emitted when a lease schedule is created.
#[contractevent]
pub struct LeaseCreated {
    pub lease_id: String,
    pub rent_amount: i128,
    pub interval_seconds: u64,
}

/// Emitted when a lessee pays rent.
#[contractevent]
pub struct RentPaid {
    pub lease_id: String,
    pub lessee: Address,
    pub amount: i128,
}

/// Emitted when a lease is flagged as in arrears.
#[contractevent]
pub struct LeaseArrears {
    pub lease_id: String,
    pub next_due_at: u64,
}

/// Emitted when an arrears lease is defaulted.
#[contractevent]
pub struct LeaseDefaulted {
    pub lease_id: String,
}

/// Emitted when a lease is closed.
#[contractevent]
pub struct LeaseClosed {
    pub lease_id: String,
}
""",
    [
        (
            """        env.storage().persistent().set(&key, &lease);
        Ok(lease)""",
            """        env.storage().persistent().set(&key, &lease);
        LeaseCreated {
            lease_id: id.clone(),
            rent_amount,
            interval_seconds,
        }
        .publish(&env);
        Ok(lease)""",
        ),
        (
            """        lease.status = LeaseStatus::Active;
        env.storage().persistent().set(&DataKey::Lease(id), &lease);""",
            """        lease.status = LeaseStatus::Active;
        RentPaid {
            lease_id: id.clone(),
            lessee: lease.lessee.clone(),
            amount: lease.rent_amount,
        }
        .publish(&env);
        env.storage().persistent().set(&DataKey::Lease(id), &lease);""",
        ),
        (
            """        lease.status = LeaseStatus::Arrears;
        env.storage().persistent().set(&DataKey::Lease(id), &lease);""",
            """        lease.status = LeaseStatus::Arrears;
        LeaseArrears {
            lease_id: id.clone(),
            next_due_at: lease.next_due_at,
        }
        .publish(&env);
        env.storage().persistent().set(&DataKey::Lease(id), &lease);""",
        ),
        (
            """        lease.status = LeaseStatus::Defaulted;
        env.storage().persistent().set(&DataKey::Lease(id), &lease);""",
            """        lease.status = LeaseStatus::Defaulted;
        LeaseDefaulted {
            lease_id: id.clone(),
        }
        .publish(&env);
        env.storage().persistent().set(&DataKey::Lease(id), &lease);""",
        ),
        (
            """        lease.status = LeaseStatus::Closed;
        env.storage().persistent().set(&DataKey::Lease(id), &lease);""",
            """        lease.status = LeaseStatus::Closed;
        LeaseClosed {
            lease_id: id.clone(),
        }
        .publish(&env);
        env.storage().persistent().set(&DataKey::Lease(id), &lease);""",
        ),
    ],
)

# ---------------------------------------------------------------- marketplace
apply(
    "marketplace/src/lib.rs",
    """
/// Emitted when a seller lists tokenized units.
#[contractevent]
pub struct ListingCreated {
    pub listing_id: String,
    pub units: i128,
    pub price: i128,
}

/// Emitted when a listing is filled.
#[contractevent]
pub struct ListingFilled {
    pub listing_id: String,
    pub buyer: Address,
    pub price: i128,
}

/// Emitted when a listing is cancelled.
#[contractevent]
pub struct ListingCancelled {
    pub listing_id: String,
}
""",
    [
        (
            """        if token_client.allowance(&seller, &env.current_contract_address()) < units {
            return Err(Error::AllowanceTooLow);
        }
        Ok(listing)""",
            """        if token_client.allowance(&seller, &env.current_contract_address()) < units {
            return Err(Error::AllowanceTooLow);
        }
        ListingCreated {
            listing_id: listing.id.clone(),
            units,
            price,
        }
        .publish(&env);
        Ok(listing)""",
        ),
        (
            """        listing.status = ListingStatus::Filled;
        env.storage()""",
            """        listing.status = ListingStatus::Filled;
        ListingFilled {
            listing_id: id.clone(),
            buyer: buyer.clone(),
            price: listing.price,
        }
        .publish(&env);
        env.storage()""",
        ),
        (
            """        listing.status = ListingStatus::Cancelled;
        env.storage()""",
            """        listing.status = ListingStatus::Cancelled;
        ListingCancelled {
            listing_id: id.clone(),
        }
        .publish(&env);
        env.storage()""",
        ),
    ],
)

# ---------------------------------------------------------------- governance
apply(
    "governance/src/lib.rs",
    """
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
""",
    [
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
            """        env.storage()
            .persistent()
            .set(&DataKey::Proposal(id), &proposal);
        Ok(proposal)""",
            """        env.storage()
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
    ],
    marker="/// Council governance.",
)

print("done")
