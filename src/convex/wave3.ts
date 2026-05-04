import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// ─── Token Balance ────────────────────────────────────────────────────────────

export const getTokenBalance = query({
  args: { walletAddress: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("tokenBalances")
      .withIndex("by_wallet", q => q.eq("walletAddress", args.walletAddress))
      .unique();
  },
});

export const claimTokenReward = mutation({
  args: {
    walletAddress: v.string(),
    rewardAmount: v.number(),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("tokenBalances")
      .withIndex("by_wallet", q => q.eq("walletAddress", args.walletAddress))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        balance: existing.balance + args.rewardAmount,
        participationScore: existing.participationScore + 1,
        lastClaim: Date.now(),
      });
    } else {
      await ctx.db.insert("tokenBalances", {
        walletAddress: args.walletAddress,
        balance: args.rewardAmount,
        stakedBalance: 0,
        participationScore: 1,
        lastClaim: Date.now(),
      });
    }
  },
});

export const stakeTokens = mutation({
  args: {
    walletAddress: v.string(),
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("tokenBalances")
      .withIndex("by_wallet", q => q.eq("walletAddress", args.walletAddress))
      .unique();

    if (!existing || existing.balance < args.amount) {
      throw new Error("Insufficient balance");
    }

    await ctx.db.patch(existing._id, {
      balance: existing.balance - args.amount,
      stakedBalance: existing.stakedBalance + args.amount,
    });
  },
});

// ─── Referrals ────────────────────────────────────────────────────────────────

export const submitReferral = mutation({
  args: {
    referrerWallet: v.string(),
    refereeWallet: v.string(),
    rewardHash: v.string(),
  },
  handler: async (ctx, args) => {
    // Prevent duplicate referrals
    const existing = await ctx.db
      .query("referrals")
      .withIndex("by_referrer", q => q.eq("referrerWallet", args.referrerWallet))
      .take(100);

    const duplicate = existing.find(r => r.refereeWallet === args.refereeWallet);
    if (duplicate) throw new Error("Referral already exists");

    return await ctx.db.insert("referrals", {
      referrerWallet: args.referrerWallet,
      refereeWallet: args.refereeWallet,
      rewardHash: args.rewardHash,
      status: "pending",
    });
  },
});

export const getReferrals = query({
  args: { walletAddress: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("referrals")
      .withIndex("by_referrer", q => q.eq("referrerWallet", args.walletAddress))
      .take(50);
  },
});

// ─── ATS Integrations ─────────────────────────────────────────────────────────

export const getIntegrationConfigs = query({
  args: { walletAddress: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("integrationConfigs")
      .withIndex("by_wallet", q => q.eq("walletAddress", args.walletAddress))
      .take(10);
  },
});

export const upsertIntegrationConfig = mutation({
  args: {
    walletAddress: v.string(),
    type: v.union(v.literal("greenhouse"), v.literal("lever"), v.literal("workday")),
    apiKeyHash: v.string(),
    active: v.boolean(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("integrationConfigs")
      .withIndex("by_wallet", q => q.eq("walletAddress", args.walletAddress))
      .take(10);

    const match = existing.find(c => c.type === args.type);

    if (match) {
      await ctx.db.patch(match._id, {
        apiKeyHash: args.apiKeyHash,
        active: args.active,
        lastSync: Date.now(),
      });
    } else {
      await ctx.db.insert("integrationConfigs", {
        walletAddress: args.walletAddress,
        type: args.type,
        apiKeyHash: args.apiKeyHash,
        active: args.active,
        lastSync: Date.now(),
      });
    }
  },
});
