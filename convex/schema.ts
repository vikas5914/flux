import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

export default defineSchema({
  ...authTables,
  watchHistory: defineTable({
    userId: v.id("users"),
    contentId: v.string(),
    season: v.optional(v.string()),
    episode: v.optional(v.string()),
    provider: v.optional(v.string()),
    watchedTime: v.optional(v.number()), // seconds watched into the episode/movie
    duration: v.optional(v.number()), // total duration in seconds
    updatedAt: v.number(),
  })
    .index("by_user", ["userId", "updatedAt"])
    .index("by_user_content", ["userId", "contentId"]),
});
