import { mutation, query, action } from "./_generated/server";
import { api } from "./_generated/api";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import OpenAI from "openai";

// Prefer standard OpenAI environment variables. If `OPENAI_API_KEY` is set,
// use the default OpenAI API unless `OPENAI_BASE_URL` is explicitly provided.
const openaiApiKey = process.env.OPENAI_API_KEY || process.env.CONVEX_OPENAI_API_KEY;
const openaiBaseUrl = process.env.OPENAI_BASE_URL;

const openai = new OpenAI(
  openaiBaseUrl
    ? { apiKey: openaiApiKey, baseURL: openaiBaseUrl }
    : { apiKey: openaiApiKey }
);

export const getConversation = query({
  args: {
    conversationId: v.optional(v.id("conversations")),
  },
  handler: async (ctx, args): Promise<any | null> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    if (args.conversationId) {
      const conversation = await ctx.db.get(args.conversationId);
      if (conversation && conversation.userId === userId) {
        return conversation;
      }
      return null;
    }

    // If no conversationId provided, get the most recent conversation
    const conversation = await ctx.db
      .query("conversations")
      .withIndex("by_user_updated", (q) => q.eq("userId", userId))
      .order("desc")
      .first();

    return conversation;
  },
});

export const getAllConversations = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const conversations = await ctx.db
      .query("conversations")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    // Sort by updatedAt if available, otherwise by creation order
    const sorted = conversations.sort((a, b) => {
      const aTime = a.updatedAt || a.createdAt || 0;
      const bTime = b.updatedAt || b.createdAt || 0;
      return bTime - aTime;
    });

    return sorted.map(conv => ({
      _id: conv._id,
      title: conv.title || "New Chat",
      updatedAt: conv.updatedAt || conv.createdAt || Date.now(),
      createdAt: conv.createdAt || Date.now(),
    }));
  },
});

export const createConversation = mutation({
  args: {
    title: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const now = Date.now();
    const title = args.title || "New Chat";

    const conversationId = await ctx.db.insert("conversations", {
      userId,
      title,
      messages: [],
      createdAt: now,
      updatedAt: now,
    });

    return conversationId;
  },
});

export const deleteConversation = mutation({
  args: {
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const conversation = await ctx.db.get(args.conversationId);
    if (conversation && conversation.userId === userId) {
      await ctx.db.delete(args.conversationId);
    }
  },
});

export const sendMessage = mutation({
  args: {
    content: v.string(),
    conversationId: v.optional(v.id("conversations")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const messageId = crypto.randomUUID();
    const timestamp = Date.now();

    const userMessage = {
      id: messageId,
      role: "user" as const,
      content: args.content,
      timestamp,
    };

    let conversation: any = null;

    if (args.conversationId) {
      conversation = await ctx.db.get(args.conversationId);
      if (!conversation || conversation.userId !== userId) {
        throw new Error("Conversation not found");
      }
    } else {
      // Get most recent conversation or create new one
      conversation = await ctx.db
        .query("conversations")
        .withIndex("by_user_updated", (q) => q.eq("userId", userId))
        .order("desc")
        .first();
    }

    if (!conversation) {
      const now = Date.now();
      const title = args.content.length > 50 ? args.content.substring(0, 50) + "..." : args.content;
      const conversationId = await ctx.db.insert("conversations", {
        userId,
        title,
        messages: [userMessage],
        createdAt: now,
        updatedAt: now,
      });
      return { messageId, conversationId };
    } else {
      const updatedMessages = [...conversation.messages, userMessage];
      const title = conversation.title === "New Chat" && args.content.length <= 50
        ? args.content
        : conversation.title;

      await ctx.db.patch(conversation._id, {
        messages: updatedMessages,
        updatedAt: timestamp,
        title,
      });
      return { messageId, conversationId: conversation._id };
    }
  },
});

export const getMedicineInfo = action({
  args: {
    medicine: v.string(),
    quickAction: v.optional(v.string()),
    conversationId: v.optional(v.id("conversations")),
  },
  handler: async (ctx, args): Promise<string> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // First, add a thinking message
    const thinkingId = await ctx.runMutation(api.medibot.addThinkingMessage, {
      medicine: args.medicine,
      quickAction: args.quickAction,
      conversationId: args.conversationId,
    });

    // Graceful fallback when OpenAI API key is not configured
    if (!openaiApiKey) {
      const msg =
        "OpenAI API key is not configured. Please set `OPENAI_API_KEY` in `.env.local` and restart the dev servers.";
      await ctx.runMutation(api.medibot.updateThinkingMessage, {
        messageId: thinkingId,
        thinking: "Configuration missing: OPENAI_API_KEY",
        conversationId: args.conversationId,
      });
      await ctx.runMutation(api.medibot.addAIResponse, { 
        content: msg,
        conversationId: args.conversationId,
      });
      return msg;
    }

    let prompt = `You are MediBot, a friendly and safety-first AI medicine assistant. A user is asking about "${args.medicine}".`;
    
    if (args.quickAction) {
      prompt += ` They specifically want to know about: ${args.quickAction}.`;
    }

    prompt += `

Please provide your response in this EXACT format:

<think>
Let me think about ${args.medicine}...

[Your detailed thinking process here - analyze the medicine, consider what information is most important, think about safety concerns, etc. Be thorough and show your reasoning process. This should be 2-3 sentences explaining your thought process.]
</think>

**${args.medicine}**

• **What it's used for:** [brief description]
• **How it works:** [simple terms, no medical jargon]
• **How to take:** [basic instructions, no specific dosing]
• **Common side effects:** [list 3-4 most common]
• **Serious side effects:** [red flag symptoms]
• **Precautions:** [pregnancy, allergies, kidney/liver issues]
• **Interactions:** [alcohol and common drug interactions]
• **When to avoid:** [contraindications]
• **Overdose/Missed dose:** [basic guidance]
• **Storage:** [how to store properly]

Important rules:
- ALWAYS start with <think> tags showing your reasoning
- Use simple, friendly language in the main response
- Keep each bullet point short (1-2 sentences max)
- If you're unsure about the medicine, say "I'm not sure about that one. Please check the spelling or ask for another name."
- Always end with: "This is general information only. Please consult a doctor before taking or stopping any medicine."
- If the user mentions overdose, chest pain, fainting, or severe symptoms, include: "⚠️ This could be serious — please contact a doctor or hospital immediately."
- Prefer generic names but mention brand names if commonly known
- Be confident but cautious
- Never diagnose, prescribe, or change dosages`;

    // Spelling correction behavior
    prompt += `

Spelling and normalization rules:
- First, check whether the input medicine name looks misspelled or is an alias/brand.
- If correction is needed, normalize to the most likely, widely used generic name.
- When a correction happens, prepend this exact line BEFORE the main header:
  i guess you are reffering to "<CorrectedName>"
- Then produce the main response using the corrected name in the header (e.g., **<CorrectedName>**).
- If the original is already correct, do NOT add the correction line.
- Apply the selected quick action (if provided) to the corrected name.
`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: prompt,
          },
          {
            role: "user",
            content: args.quickAction 
              ? `Tell me about ${args.quickAction.toLowerCase()} for ${args.medicine}`
              : `Tell me about ${args.medicine}`,
          },
        ],
        temperature: 0.3,
        max_tokens: 1000,
      });

      const fullResponse = response.choices[0]?.message?.content || "I'm sorry, I couldn't process that request. Please try again.";

      // Parse thinking and main response
      const thinkMatch = fullResponse.match(/<think>(.*?)<\/think>/s);
      const thinking = thinkMatch ? thinkMatch[1].trim() : null;
      const mainResponse = fullResponse.replace(/<think>.*?<\/think>/s, '').trim();

      // Update the thinking message with actual thinking content
      if (thinking) {
        await ctx.runMutation(api.medibot.updateThinkingMessage, {
          messageId: thinkingId,
          thinking: thinking,
          conversationId: args.conversationId,
        });
      }

      // Add the main AI response
      await ctx.runMutation(api.medibot.addAIResponse, {
        content: mainResponse,
        conversationId: args.conversationId,
      });

      return mainResponse;
    } catch (error) {
      console.error("OpenAI API error:", error);
      
      // Update thinking message with error
      await ctx.runMutation(api.medibot.updateThinkingMessage, {
        messageId: thinkingId,
        thinking: "I'm having trouble processing this request right now...",
        conversationId: args.conversationId,
      });
      // Fallback: try local Python backend for a response
      type EnhancedResponse = { response?: string; thinking?: string; confidence?: number } | null;
      try {
        const enhanced: EnhancedResponse = await ctx.runAction(api.python_integration.getEnhancedResponse, {
          medicine: args.medicine,
          quickAction: args.quickAction,
        });
        if (enhanced && enhanced.response) {
          if (enhanced.thinking) {
            await ctx.runMutation(api.medibot.updateThinkingMessage, {
              messageId: thinkingId,
              thinking: enhanced.thinking,
              conversationId: args.conversationId,
            });
          }
          await ctx.runMutation(api.medibot.addAIResponse, {
            content: enhanced.response,
            conversationId: args.conversationId,
          });
          return enhanced.response;
        }
      } catch (fallbackErr) {
        console.error("Python backend fallback error:", fallbackErr);
      }

      const errorResponse = "I'm sorry, I'm having trouble processing your request right now. Please try again in a moment.";
      await ctx.runMutation(api.medibot.addAIResponse, {
        content: errorResponse,
        conversationId: args.conversationId,
      });
      
      return errorResponse;
    }
  },
});

// General chat for non-medicine prompts. Uses conversation history for context.
export const generalChat = action({
  args: {
    message: v.string(),
    conversationId: v.optional(v.id("conversations")),
  },
  handler: async (ctx, args): Promise<string> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Graceful fallback when OpenAI API key is not configured
    if (!openaiApiKey) {
      const msg =
        "OpenAI API key is not configured. Please set `OPENAI_API_KEY` in `.env.local` and restart the dev servers.";
      await ctx.runMutation(api.medibot.addAIResponse, { 
        content: msg,
        conversationId: args.conversationId,
      });
      return msg;
    }

    const conversation = await ctx.runQuery(api.medibot.getConversation, {
      conversationId: args.conversationId,
    });

    // Build history excluding thinking messages
    const history: { role: "user" | "assistant"; content: string }[] = [];
    if (conversation) {
      for (const m of conversation.messages) {
        if (m.role === "thinking") continue;
        history.push({ role: m.role, content: m.content });
      }
    }

    const system = `You are MediBot, a friendly assistant.\n
For medical questions: be cautious, avoid prescribing, give general info, and include a short safety note when relevant.\nFor non-medical or general questions: answer helpfully and conversationally.\nKeep responses clear and concise.`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: system },
          ...history.map(h => ({ role: h.role, content: h.content })),
          { role: "user", content: args.message },
        ],
        temperature: 0.7,
        max_tokens: 800,
      });

      const content = response.choices[0]?.message?.content || "I'm sorry, I couldn't process that request.";

      await ctx.runMutation(api.medibot.addAIResponse, {
        content,
        conversationId: args.conversationId,
      });

      return content;
    } catch (error: any) {
      console.error("OpenAI general chat error:", error);
      let errorResponse = "I'm having trouble answering right now. Please try again in a moment.";

      const status = error?.status || error?.response?.status;
      const code = error?.code || error?.error?.code;
      if (status === 401 || code === "invalid_api_key") {
        errorResponse = "OpenAI API key appears invalid or missing. Set `OPENAI_API_KEY` in `.env.local` and restart the dev servers.";
      }

      await ctx.runMutation(api.medibot.addAIResponse, {
        content: errorResponse,
        conversationId: args.conversationId,
      });
      return errorResponse;
    }
  },
});

export const addThinkingMessage = mutation({
  args: {
    medicine: v.string(),
    quickAction: v.optional(v.string()),
    conversationId: v.optional(v.id("conversations")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    let conversation: any = null;

    if (args.conversationId) {
      conversation = await ctx.db.get(args.conversationId);
      if (!conversation || conversation.userId !== userId) {
        throw new Error("Conversation not found");
      }
    } else {
      conversation = await ctx.db
        .query("conversations")
        .withIndex("by_user_updated", (q) => q.eq("userId", userId))
        .order("desc")
        .first();
    }

    if (conversation) {
      const thinkingId = crypto.randomUUID();
      const thinkingMessage = {
        id: thinkingId,
        role: "thinking" as const,
        content: `Thinking about ${args.medicine}${args.quickAction ? ` (${args.quickAction})` : ''}...`,
        timestamp: Date.now(),
        isComplete: false,
      };

      const updatedMessages = [...conversation.messages, thinkingMessage];
      await ctx.db.patch(conversation._id, {
        messages: updatedMessages,
        updatedAt: Date.now(),
      });

      return thinkingId;
    }
    
    return crypto.randomUUID();
  },
});

export const updateThinkingMessage = mutation({
  args: {
    messageId: v.string(),
    thinking: v.string(),
    conversationId: v.optional(v.id("conversations")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    let conversation: any = null;

    if (args.conversationId) {
      conversation = await ctx.db.get(args.conversationId);
      if (!conversation || conversation.userId !== userId) {
        throw new Error("Conversation not found");
      }
    } else {
      conversation = await ctx.db
        .query("conversations")
        .withIndex("by_user_updated", (q) => q.eq("userId", userId))
        .order("desc")
        .first();
    }

    if (conversation) {
      const updatedMessages = conversation.messages.map((msg: any) =>
        msg.id === args.messageId
          ? { ...msg, content: args.thinking, isComplete: true }
          : msg
      );

      await ctx.db.patch(conversation._id, {
        messages: updatedMessages,
        updatedAt: Date.now(),
      });
    }
  },
});

export const addAIResponse = mutation({
  args: {
    content: v.string(),
    conversationId: v.optional(v.id("conversations")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    let conversation: any = null;

    if (args.conversationId) {
      conversation = await ctx.db.get(args.conversationId);
      if (!conversation || conversation.userId !== userId) {
        throw new Error("Conversation not found");
      }
    } else {
      conversation = await ctx.db
        .query("conversations")
        .withIndex("by_user_updated", (q) => q.eq("userId", userId))
        .order("desc")
        .first();
    }

    if (conversation) {
      const aiMessage = {
        id: crypto.randomUUID(),
        role: "assistant" as const,
        content: args.content,
        timestamp: Date.now(),
      };

      const updatedMessages = [...conversation.messages, aiMessage];
      await ctx.db.patch(conversation._id, {
        messages: updatedMessages,
        updatedAt: Date.now(),
      });
    }
  },
});

export const clearConversation = mutation({
  args: {
    conversationId: v.optional(v.id("conversations")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    let conversation: any = null;

    if (args.conversationId) {
      conversation = await ctx.db.get(args.conversationId);
      if (!conversation || conversation.userId !== userId) {
        throw new Error("Conversation not found");
      }
    } else {
      conversation = await ctx.db
        .query("conversations")
        .withIndex("by_user_updated", (q) => q.eq("userId", userId))
        .order("desc")
        .first();
    }

    if (conversation) {
      await ctx.db.patch(conversation._id, {
        messages: [],
        updatedAt: Date.now(),
      });
    }
  },
});
