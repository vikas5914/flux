import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { auth } from "./auth";

const MAX_HISTORY_ITEMS = 20;

/**
 * Get the authenticated user's watch history, ordered by most recently watched.
 */
export const getUserHistory = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return [];

    const entries = await ctx.db
      .query("watchHistory")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(MAX_HISTORY_ITEMS);

    return entries;
  },
});

/**
 * Upsert a watch history entry for the authenticated user.
 * If the entry already exists (same user + contentId), update it.
 * Otherwise, insert a new one. Also enforces the max history limit.
 */
export const upsertWatchHistory = mutation({
  args: {
    contentId: v.string(),
    season: v.optional(v.string()),
    episode: v.optional(v.string()),
    provider: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return;

    const now = Date.now();

    // Check if entry already exists for this user + content
    const existing = await ctx.db
      .query("watchHistory")
      .withIndex("by_user_content", (q) => q.eq("userId", userId).eq("contentId", args.contentId))
      .unique();

    if (existing) {
      // Update existing entry — merge fields (keep old values if new ones are undefined)
      await ctx.db.patch(existing._id, {
        season: args.season ?? existing.season,
        episode: args.episode ?? existing.episode,
        provider: args.provider ?? existing.provider,
        updatedAt: now,
      });
    } else {
      // Insert new entry
      await ctx.db.insert("watchHistory", {
        userId,
        contentId: args.contentId,
        season: args.season,
        episode: args.episode,
        provider: args.provider,
        updatedAt: now,
      });

      // Enforce max history limit — remove oldest entries beyond the cap
      const allEntries = await ctx.db
        .query("watchHistory")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .order("desc")
        .collect();

      if (allEntries.length > MAX_HISTORY_ITEMS) {
        const toDelete = allEntries.slice(MAX_HISTORY_ITEMS);
        for (const entry of toDelete) {
          await ctx.db.delete(entry._id);
        }
      }
    }
  },
});

/**
 * Batch import watch history entries (used for localStorage migration).
 * Only inserts entries that don't already exist for this user.
 */
export const importWatchHistory = mutation({
  args: {
    entries: v.array(
      v.object({
        contentId: v.string(),
        season: v.optional(v.string()),
        episode: v.optional(v.string()),
        provider: v.optional(v.string()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return;

    const now = Date.now();

    for (let i = 0; i < args.entries.length; i++) {
      const entry = args.entries[i];

      // Skip if already exists
      const existing = await ctx.db
        .query("watchHistory")
        .withIndex("by_user_content", (q) =>
          q.eq("userId", userId).eq("contentId", entry.contentId),
        )
        .unique();

      if (!existing) {
        await ctx.db.insert("watchHistory", {
          userId,
          contentId: entry.contentId,
          season: entry.season,
          episode: entry.episode,
          provider: entry.provider,
          // Older entries get earlier timestamps to preserve order
          updatedAt: now - (args.entries.length - i),
        });
      }
    }
  },
});
