import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Seed initial proposals if none exist
export const seedProposals = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("governanceProposals").take(1);
    if (existing.length > 0) return;

    const proposals = [
      {
        proposalId: "prop-001",
        title: "Reduce FHE Match Threshold to 60%",
        description: "Lower the minimum match score threshold from 70% to 60% to increase match volume while maintaining quality. This change affects the FHE.gte() comparison in the matching contract.",
        category: "parameter" as const,
        status: "active" as const,
        votesFor: 847,
        votesAgainst: 312,
        quorum: 1000,
        endsAt: Date.now() + 86400000 * 3,
        proposerWallet: "0x7f3a9b2c4e1d8f5a",
      },
      {
        proposalId: "prop-002",
        title: "Upgrade to @cofhe/sdk v2.1",
        description: "Migrate the client-side encryption library from @cofhe/sdk v2.0 to v2.1. This upgrade includes performance improvements to the encryptInputs() builder pattern and adds support for batch encryption.",
        category: "upgrade" as const,
        status: "active" as const,
        votesFor: 1203,
        votesAgainst: 89,
        quorum: 1000,
        endsAt: Date.now() + 86400000 * 5,
        proposerWallet: "0x9b2c4e1d8f5a7f3a",
      },
      {
        proposalId: "prop-003",
        title: "Add ZK Proof Verification Layer",
        description: "Integrate a zero-knowledge proof verification layer alongside FHE matching. Candidates can optionally generate ZK proofs of their credentials for additional verification without revealing values.",
        category: "upgrade" as const,
        status: "passed" as const,
        votesFor: 2341,
        votesAgainst: 156,
        quorum: 1000,
        endsAt: Date.now() - 86400000 * 2,
        proposerWallet: "0x3d8e2f1a9c7b4e6d",
      },
      {
        proposalId: "prop-004",
        title: "Emergency: Pause Matching During Audit",
        description: "Temporarily pause the FHE matching protocol for 48 hours to conduct a security audit of the salary comparison circuit.",
        category: "emergency" as const,
        status: "rejected" as const,
        votesFor: 234,
        votesAgainst: 1876,
        quorum: 1000,
        endsAt: Date.now() - 86400000 * 5,
        proposerWallet: "0x5c9f2e8a1b4d7e3c",
      },
      {
        proposalId: "prop-005",
        title: "Increase Consent Reveal Window to 72h",
        description: "Extend the mutual consent reveal window from 24 hours to 72 hours. This gives both parties more time to review and sign the consent transaction after a match is found.",
        category: "parameter" as const,
        status: "pending" as const,
        votesFor: 0,
        votesAgainst: 0,
        quorum: 1000,
        endsAt: Date.now() + 86400000 * 7,
        proposerWallet: "0x1a9c7b4e6d3d8e2f",
      },
    ];

    for (const p of proposals) {
      await ctx.db.insert("governanceProposals", p);
    }
  },
});

// Get all proposals
export const getProposals = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("governanceProposals").order("desc").take(50);
  },
});

// Get votes for a proposal
export const getProposalVotes = query({
  args: { proposalId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("governanceVotes")
      .withIndex("by_proposal", q => q.eq("proposalId", args.proposalId))
      .take(1000);
  },
});

// Check if wallet has voted on a proposal
export const getMyVote = query({
  args: { proposalId: v.string(), voterWallet: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("governanceVotes")
      .withIndex("by_proposal_and_voter", q =>
        q.eq("proposalId", args.proposalId).eq("voterWallet", args.voterWallet)
      )
      .unique();
  },
});

// Cast a vote
export const castVote = mutation({
  args: {
    proposalId: v.string(),
    voterWallet: v.string(),
    vote: v.union(v.literal("for"), v.literal("against")),
    txHash: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if already voted
    const existing = await ctx.db
      .query("governanceVotes")
      .withIndex("by_proposal_and_voter", q =>
        q.eq("proposalId", args.proposalId).eq("voterWallet", args.voterWallet)
      )
      .unique();

    if (existing) throw new Error("Already voted on this proposal");

    // Record vote
    await ctx.db.insert("governanceVotes", {
      proposalId: args.proposalId,
      voterWallet: args.voterWallet,
      vote: args.vote,
      txHash: args.txHash,
    });

    // Update proposal vote counts
    const proposal = await ctx.db
      .query("governanceProposals")
      .withIndex("by_proposal_id", q => q.eq("proposalId", args.proposalId))
      .unique();

    if (proposal) {
      await ctx.db.patch(proposal._id, {
        votesFor: args.vote === "for" ? proposal.votesFor + 1 : proposal.votesFor,
        votesAgainst: args.vote === "against" ? proposal.votesAgainst + 1 : proposal.votesAgainst,
      });
    }
  },
});

// Submit a new proposal
export const submitProposal = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    category: v.union(
      v.literal("parameter"),
      v.literal("upgrade"),
      v.literal("treasury"),
      v.literal("emergency")
    ),
    proposerWallet: v.string(),
  },
  handler: async (ctx, args) => {
    const count = await ctx.db.query("governanceProposals").take(1000);
    const proposalId = `prop-${String(count.length + 1).padStart(3, "0")}`;

    return await ctx.db.insert("governanceProposals", {
      proposalId,
      title: args.title,
      description: args.description,
      category: args.category,
      status: "pending",
      votesFor: 0,
      votesAgainst: 0,
      quorum: 1000,
      endsAt: Date.now() + 86400000 * 7,
      proposerWallet: args.proposerWallet,
    });
  },
});
