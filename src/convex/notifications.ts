import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Get notifications for a wallet
export const getNotifications = query({
  args: { walletAddress: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("notifications")
      .withIndex("by_wallet", q => q.eq("walletAddress", args.walletAddress))
      .order("desc")
      .take(50);
  },
});

// Get unread count
export const getUnreadCount = query({
  args: { walletAddress: v.string() },
  handler: async (ctx, args) => {
    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_wallet_and_read", q =>
        q.eq("walletAddress", args.walletAddress).eq("read", false)
      )
      .take(100);
    return unread.length;
  },
});

// Mark notification as read
export const markRead = mutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.notificationId, { read: true });
  },
});

// Mark all as read
export const markAllRead = mutation({
  args: { walletAddress: v.string() },
  handler: async (ctx, args) => {
    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_wallet_and_read", q =>
        q.eq("walletAddress", args.walletAddress).eq("read", false)
      )
      .take(100);
    await Promise.all(unread.map(n => ctx.db.patch(n._id, { read: true })));
  },
});

// Create a notification
export const createNotification = mutation({
  args: {
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
    relatedId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("notifications", {
      walletAddress: args.walletAddress,
      type: args.type,
      title: args.title,
      message: args.message,
      read: false,
      relatedId: args.relatedId,
    });
  },
});

// Delete a notification
export const deleteNotification = mutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.notificationId);
  },
});
