import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { Infer, v } from "convex/values";

export const ROLES = {
  ADMIN: "admin",
  USER: "user",
  MEMBER: "member",
} as const;

export const roleValidator = v.union(
  v.literal(ROLES.ADMIN),
  v.literal(ROLES.USER),
  v.literal(ROLES.MEMBER),
);
export type Role = Infer<typeof roleValidator>;

const schema = defineSchema(
  {
    ...authTables,

    users: defineTable({
      name: v.optional(v.string()),
      image: v.optional(v.string()),
      email: v.optional(v.string()),
      emailVerificationTime: v.optional(v.number()),
      isAnonymous: v.optional(v.boolean()),
      role: v.optional(roleValidator),
    }).index("email", ["email"]),

    // Encrypted candidate profiles (stored as hash commitments)
    encryptedProfiles: defineTable({
      walletAddress: v.string(),
      profileHash: v.string(),
      experienceHash: v.string(),
      salaryHash: v.string(),
      skillsHash: v.string(),
      skillCount: v.number(),
      experienceYears: v.number(),
      submitted: v.boolean(),
      // Stealth Mode fields
      stealthEnabled: v.optional(v.boolean()),
      blockedDomains: v.optional(v.array(v.string())),
      timeLockDate: v.optional(v.string()),
    }).index("by_wallet", ["walletAddress"]),

    // Encrypted job postings
    jobPostings: defineTable({
      walletAddress: v.string(),
      jobHash: v.string(),
      budgetHash: v.string(),
      expHash: v.string(),
      requiredSkillCount: v.number(),
      requiredExpYears: v.number(),
      submitted: v.boolean(),
    }).index("by_wallet", ["walletAddress"]),

    // Match requests
    matchRequests: defineTable({
      candidateWallet: v.string(),
      employerWallet: v.string(),
      candidateProfileId: v.id("encryptedProfiles"),
      jobPostingId: v.id("jobPostings"),
      status: v.union(v.literal("pending"), v.literal("matched"), v.literal("rejected")),
      score: v.optional(v.number()),
      suggestedSalary: v.optional(v.number()),
      candidateConsented: v.boolean(),
      employerConsented: v.boolean(),
      salaryRevealed: v.optional(v.boolean()),
    })
      .index("by_candidate", ["candidateWallet"])
      .index("by_employer", ["employerWallet"])
      .index("by_candidate_and_employer", ["candidateWallet", "employerWallet"]),

    // Counter-Offer Calculator requests
    counterOfferRequests: defineTable({
      walletAddress: v.string(),
      currentSalaryHash: v.string(),
      targetIncreasePercent: v.number(),
      yearsAtCompany: v.number(),
      role: v.string(),
      marketDataHash: v.string(),
      // Result
      status: v.union(v.literal("pending"), v.literal("complete")),
      offersNeeded: v.optional(v.number()),
      projectedIncrease: v.optional(v.number()),
      negotiationScript: v.optional(v.string()),
    }).index("by_wallet", ["walletAddress"]),

    // Interview Insurance orders
    interviewInsuranceOrders: defineTable({
      walletAddress: v.string(),
      escrowHash: v.string(),
      targetRole: v.string(),
      targetSalaryMin: v.number(),
      targetSalaryMax: v.number(),
      // Status
      status: v.union(
        v.literal("pending"),
        v.literal("active"),
        v.literal("interviews_scheduled"),
        v.literal("completed"),
        v.literal("refunded")
      ),
      interviewsScheduled: v.number(),
      interviewsTarget: v.number(),
      expiresAt: v.number(),
      paidAt: v.optional(v.number()),
    }).index("by_wallet", ["walletAddress"]),

    // Notifications
    notifications: defineTable({
      walletAddress: v.string(),
      type: v.union(
        v.literal("match_found"),
        v.literal("consent_received"),
        v.literal("salary_revealed"),
        v.literal("profile_submitted"),
        v.literal("job_posted"),
        v.literal("insurance_activated"),
        v.literal("counter_offer_ready"),
        v.literal("governance_vote"),
        v.literal("system")
      ),
      title: v.string(),
      message: v.string(),
      read: v.boolean(),
      relatedId: v.optional(v.string()),
    })
      .index("by_wallet", ["walletAddress"])
      .index("by_wallet_and_read", ["walletAddress", "read"]),

    // Governance proposals (on-chain simulation)
    governanceProposals: defineTable({
      proposalId: v.string(),
      title: v.string(),
      description: v.string(),
      category: v.union(
        v.literal("parameter"),
        v.literal("upgrade"),
        v.literal("treasury"),
        v.literal("emergency")
      ),
      status: v.union(
        v.literal("active"),
        v.literal("passed"),
        v.literal("rejected"),
        v.literal("pending")
      ),
      votesFor: v.number(),
      votesAgainst: v.number(),
      quorum: v.number(),
      endsAt: v.number(),
      proposerWallet: v.string(),
    }).index("by_proposal_id", ["proposalId"]),

    // Governance votes
    governanceVotes: defineTable({
      proposalId: v.string(),
      voterWallet: v.string(),
      vote: v.union(v.literal("for"), v.literal("against")),
      txHash: v.string(),
    })
      .index("by_proposal", ["proposalId"])
      .index("by_voter", ["voterWallet"])
      .index("by_proposal_and_voter", ["proposalId", "voterWallet"]),

    // Wave 3: Token balances (CipherToken — FHE-gated rewards)
    tokenBalances: defineTable({
      walletAddress: v.string(),
      balance: v.number(),
      stakedBalance: v.number(),
      participationScore: v.number(),
      lastClaim: v.number(),
    }).index("by_wallet", ["walletAddress"]),

    // Wave 3: ATS integration configs (Greenhouse, Lever, Workday)
    integrationConfigs: defineTable({
      walletAddress: v.string(),
      type: v.union(v.literal("greenhouse"), v.literal("lever"), v.literal("workday")),
      apiKeyHash: v.string(),
      active: v.boolean(),
      lastSync: v.number(),
    }).index("by_wallet", ["walletAddress"]),

    // Wave 3: Referral tracking
    referrals: defineTable({
      referrerWallet: v.string(),
      refereeWallet: v.string(),
      rewardHash: v.string(),
      status: v.union(v.literal("pending"), v.literal("confirmed"), v.literal("paid")),
    }).index("by_referrer", ["referrerWallet"]),

    // Wave 3: Vault credentials (encrypted credential commitments)
    vaultCredentials: defineTable({
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
      revealed: v.boolean(),
      value: v.optional(v.string()),
    }).index("by_wallet", ["walletAddress"]),

    // CV file uploads (PDF stored via Convex file storage)
    cvUploads: defineTable({
      walletAddress: v.string(),
      storageId: v.string(),
      fileName: v.string(),
      fileSize: v.number(),
      uploadedAt: v.number(),
    }).index("by_wallet", ["walletAddress"]),
  },
  {
    schemaValidation: false,
  },
);

export default schema;