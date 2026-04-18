import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Submit or update an encrypted candidate profile
export const submitCandidateProfile = mutation({
  args: {
    walletAddress: v.string(),
    profileHash: v.string(),
    experienceHash: v.string(),
    salaryHash: v.string(),
    skillsHash: v.string(),
    skillCount: v.number(),
    experienceYears: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("encryptedProfiles")
      .withIndex("by_wallet", q => q.eq("walletAddress", args.walletAddress))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        profileHash: args.profileHash,
        experienceHash: args.experienceHash,
        salaryHash: args.salaryHash,
        skillsHash: args.skillsHash,
        skillCount: args.skillCount,
        experienceYears: args.experienceYears,
        submitted: true,
      });
      return existing._id;
    }

    return await ctx.db.insert("encryptedProfiles", {
      walletAddress: args.walletAddress,
      profileHash: args.profileHash,
      experienceHash: args.experienceHash,
      salaryHash: args.salaryHash,
      skillsHash: args.skillsHash,
      skillCount: args.skillCount,
      experienceYears: args.experienceYears,
      submitted: true,
    });
  },
});

// Update stealth settings for a profile
export const updateStealthSettings = mutation({
  args: {
    walletAddress: v.string(),
    stealthEnabled: v.boolean(),
    blockedDomains: v.array(v.string()),
    timeLockDate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("encryptedProfiles")
      .withIndex("by_wallet", q => q.eq("walletAddress", args.walletAddress))
      .unique();

    if (!existing) throw new Error("Profile not found");

    await ctx.db.patch(existing._id, {
      stealthEnabled: args.stealthEnabled,
      blockedDomains: args.blockedDomains,
      timeLockDate: args.timeLockDate,
    });
  },
});

// Get candidate profile by wallet
export const getCandidateProfile = query({
  args: { walletAddress: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("encryptedProfiles")
      .withIndex("by_wallet", q => q.eq("walletAddress", args.walletAddress))
      .unique();
  },
});

// Submit or update an encrypted job posting
export const submitJobPosting = mutation({
  args: {
    walletAddress: v.string(),
    jobHash: v.string(),
    budgetHash: v.string(),
    expHash: v.string(),
    requiredSkillCount: v.number(),
    requiredExpYears: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("jobPostings")
      .withIndex("by_wallet", q => q.eq("walletAddress", args.walletAddress))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        jobHash: args.jobHash,
        budgetHash: args.budgetHash,
        expHash: args.expHash,
        requiredSkillCount: args.requiredSkillCount,
        requiredExpYears: args.requiredExpYears,
        submitted: true,
      });
      return existing._id;
    }

    return await ctx.db.insert("jobPostings", {
      walletAddress: args.walletAddress,
      jobHash: args.jobHash,
      budgetHash: args.budgetHash,
      expHash: args.expHash,
      requiredSkillCount: args.requiredSkillCount,
      requiredExpYears: args.requiredExpYears,
      submitted: true,
    });
  },
});

// Get job posting by wallet
export const getJobPosting = query({
  args: { walletAddress: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("jobPostings")
      .withIndex("by_wallet", q => q.eq("walletAddress", args.walletAddress))
      .unique();
  },
});

// Get all submitted job postings (for matching)
export const getAllJobPostings = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("jobPostings").take(100);
  },
});

// Get all submitted candidate profiles (for employer view)
export const getAllCandidateProfiles = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("encryptedProfiles").take(100);
  },
});

// Submit a counter-offer calculator request
export const submitCounterOffer = mutation({
  args: {
    walletAddress: v.string(),
    currentSalaryHash: v.string(),
    targetIncreasePercent: v.number(),
    yearsAtCompany: v.number(),
    role: v.string(),
    marketDataHash: v.string(),
  },
  handler: async (ctx, args) => {
    // Simulate FHE computation result
    const offersNeeded = Math.floor(Math.random() * 2) + 2; // 2-3
    const projectedIncrease = Math.round(args.targetIncreasePercent * (0.8 + Math.random() * 0.4));
    const scripts = [
      "Lead with competing offers. Never reveal your current salary first. Anchor high — 20% above target.",
      "Use market data as leverage. Reference the encrypted salary benchmarks from Cipher CV's dataset.",
      "Time your ask after a win. Schedule the conversation post-project delivery for maximum leverage.",
    ];
    const negotiationScript = scripts[Math.floor(Math.random() * scripts.length)];

    const existing = await ctx.db
      .query("counterOfferRequests")
      .withIndex("by_wallet", q => q.eq("walletAddress", args.walletAddress))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        currentSalaryHash: args.currentSalaryHash,
        targetIncreasePercent: args.targetIncreasePercent,
        yearsAtCompany: args.yearsAtCompany,
        role: args.role,
        marketDataHash: args.marketDataHash,
        status: "complete",
        offersNeeded,
        projectedIncrease,
        negotiationScript,
      });
      return existing._id;
    }

    return await ctx.db.insert("counterOfferRequests", {
      walletAddress: args.walletAddress,
      currentSalaryHash: args.currentSalaryHash,
      targetIncreasePercent: args.targetIncreasePercent,
      yearsAtCompany: args.yearsAtCompany,
      role: args.role,
      marketDataHash: args.marketDataHash,
      status: "complete",
      offersNeeded,
      projectedIncrease,
      negotiationScript,
    });
  },
});

// Get counter-offer result
export const getCounterOffer = query({
  args: { walletAddress: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("counterOfferRequests")
      .withIndex("by_wallet", q => q.eq("walletAddress", args.walletAddress))
      .unique();
  },
});

// Submit interview insurance order
export const submitInterviewInsurance = mutation({
  args: {
    walletAddress: v.string(),
    escrowHash: v.string(),
    targetRole: v.string(),
    targetSalaryMin: v.number(),
    targetSalaryMax: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("interviewInsuranceOrders")
      .withIndex("by_wallet", q => q.eq("walletAddress", args.walletAddress))
      .unique();

    const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 days

    if (existing) {
      await ctx.db.patch(existing._id, {
        escrowHash: args.escrowHash,
        targetRole: args.targetRole,
        targetSalaryMin: args.targetSalaryMin,
        targetSalaryMax: args.targetSalaryMax,
        status: "active",
        interviewsScheduled: 0,
        interviewsTarget: 3,
        expiresAt,
        paidAt: Date.now(),
      });
      return existing._id;
    }

    return await ctx.db.insert("interviewInsuranceOrders", {
      walletAddress: args.walletAddress,
      escrowHash: args.escrowHash,
      targetRole: args.targetRole,
      targetSalaryMin: args.targetSalaryMin,
      targetSalaryMax: args.targetSalaryMax,
      status: "active",
      interviewsScheduled: 0,
      interviewsTarget: 3,
      expiresAt,
      paidAt: Date.now(),
    });
  },
});

// Get interview insurance order
export const getInterviewInsurance = query({
  args: { walletAddress: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("interviewInsuranceOrders")
      .withIndex("by_wallet", q => q.eq("walletAddress", args.walletAddress))
      .unique();
  },
});