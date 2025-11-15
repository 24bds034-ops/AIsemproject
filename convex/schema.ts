import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  conversations: defineTable({
    userId: v.id("users"),
    messages: v.array(v.object({
      id: v.string(),
      role: v.union(v.literal("user"), v.literal("assistant"), v.literal("thinking")),
      content: v.string(),
      timestamp: v.number(),
      isComplete: v.optional(v.boolean()),
    })),
  }).index("by_user", ["userId"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
