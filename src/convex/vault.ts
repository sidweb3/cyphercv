import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getCredentials = query({
  args: { walletAddress: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("vaultCredentials")
      .withIndex("by_wallet", q => q.eq("walletAddress", args.walletAddress))
      .order("desc")
      .take(50);
  },
});

export const addCredential = mutation({
  args: {
    walletAddress: v.string(),
    type: v.union(
      v.literal("salary_range"),
      v.literal("experience"),
      v.literal("skill_vector"),
      v.literal("identity"),
      v.literal("education")
    ),
    label: v.string(),
    hash: v.string(),
    network: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("vaultCredentials", {
      walletAddress: args.walletAddress,
      type: args.type,
      label: args.label,
      hash: args.hash,
      network: args.network,
      revealed: false,
    });
  },
});

export const toggleReveal = mutation({
  args: { credentialId: v.id("vaultCredentials") },
  handler: async (ctx, args) => {
    const cred = await ctx.db.get(args.credentialId);
    if (!cred) throw new Error("Credential not found");
    await ctx.db.patch(args.credentialId, { revealed: !cred.revealed });
  },
});

export const revokeCredential = mutation({
  args: { credentialId: v.id("vaultCredentials") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.credentialId);
  },
});
