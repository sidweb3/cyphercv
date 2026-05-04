import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Request a match between a candidate and employer
export const requestMatch = mutation({
  args: {
    candidateWallet: v.string(),
    employerWallet: v.string(),
    candidateProfileId: v.id("encryptedProfiles"),
    jobPostingId: v.id("jobPostings"),
    // Simulated FHE result (Wave 2 mock — real FHE in Wave 3)
    score: v.number(),
    compatible: v.boolean(),
    suggestedSalary: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Check if match already exists
    const existing = await ctx.db
      .query("matchRequests")
      .withIndex("by_candidate_and_employer", q =>
        q.eq("candidateWallet", args.candidateWallet).eq("employerWallet", args.employerWallet)
      )
      .unique();

    if (existing) {
      return existing._id;
    }

    return await ctx.db.insert("matchRequests", {
      candidateWallet: args.candidateWallet,
      employerWallet: args.employerWallet,
      candidateProfileId: args.candidateProfileId,
      jobPostingId: args.jobPostingId,
      status: args.compatible ? "matched" : "rejected",
      score: args.compatible ? args.score : undefined,
      suggestedSalary: args.compatible ? args.suggestedSalary : undefined,
      candidateConsented: false,
      employerConsented: false,
    });
  },
});

// Get matches for a candidate wallet
export const getCandidateMatches = query({
  args: { walletAddress: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("matchRequests")
      .withIndex("by_candidate", q => q.eq("candidateWallet", args.walletAddress))
      .take(50);
  },
});

// Get matches for an employer wallet
export const getEmployerMatches = query({
  args: { walletAddress: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("matchRequests")
      .withIndex("by_employer", q => q.eq("employerWallet", args.walletAddress))
      .take(50);
  },
});

// Submit a counter-offer request
export const submitCounterOffer = mutation({
  args: {
    walletAddress: v.string(),
    matchId: v.id("matchRequests"),
    currentSalary: v.number(),
    targetIncreasePercent: v.number(),
    yearsAtCompany: v.number(),
    role: v.string(),
  },
  handler: async (ctx, args) => {
    const match = await ctx.db.get(args.matchId);
    if (!match) throw new Error("Match not found");

    // Simulate market data hash
    const marketDataHash = `0x${Math.random().toString(16).slice(2, 18)}`;
    const currentSalaryHash = `0x${Math.random().toString(16).slice(2, 18)}`;

    // Compute simulated result
    const offersNeeded = Math.ceil(3 + (args.targetIncreasePercent / 10));
    const projectedIncrease = Math.round(args.targetIncreasePercent * (1 + args.yearsAtCompany * 0.05));
    const negotiationScript = `Based on ${args.yearsAtCompany} years at company and ${args.targetIncreasePercent}% target increase, you should request ${projectedIncrease}% citing market data. Secure ${offersNeeded} competing offers first.`;

    return await ctx.db.insert("counterOfferRequests", {
      walletAddress: args.walletAddress,
      currentSalaryHash,
      targetIncreasePercent: args.targetIncreasePercent,
      yearsAtCompany: args.yearsAtCompany,
      role: args.role,
      marketDataHash,
      status: "complete",
      offersNeeded,
      projectedIncrease,
      negotiationScript,
    });
  },
});

// Get counter-offer requests for a wallet
export const getCounterOffers = query({
  args: { walletAddress: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("counterOfferRequests")
      .withIndex("by_wallet", q => q.eq("walletAddress", args.walletAddress))
      .take(20);
  },
});

// Consent to reveal salary
export const consentReveal = mutation({
  args: {
    matchId: v.id("matchRequests"),
    role: v.union(v.literal("candidate"), v.literal("employer")),
  },
  handler: async (ctx, args) => {
    const match = await ctx.db.get(args.matchId);
    if (!match) throw new Error("Match not found");

    const patch =
      args.role === "candidate"
        ? { candidateConsented: true }
        : { employerConsented: true };

    await ctx.db.patch(args.matchId, patch);

    // If both consented, mark salary as revealed
    const updated = await ctx.db.get(args.matchId);
    if (updated && updated.candidateConsented && updated.employerConsented) {
      await ctx.db.patch(args.matchId, { salaryRevealed: true });
    }
  },
});

// Global stats
export const getProtocolStats = query({
  args: {},
  handler: async (ctx) => {
    const candidates = await ctx.db.query("encryptedProfiles").take(1000);
    const jobs = await ctx.db.query("jobPostings").take(1000);
    const matches = await ctx.db.query("matchRequests").take(1000);

    return {
      totalCandidates: candidates.length,
      totalJobs: jobs.length,
      totalMatches: matches.filter(m => m.status === "matched").length,
      totalRequests: matches.length,
    };
  },
});