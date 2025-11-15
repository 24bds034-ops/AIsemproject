import { action } from "./_generated/server";
import { v } from "convex/values";

// Python backend integration for enhanced AI thinking
export const getEnhancedThinking = action({
  args: {
    medicine: v.string(),
    quickAction: v.optional(v.string()),
    context: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const pythonBackendUrl = process.env.PYTHON_BACKEND_URL || 'http://localhost:5000';
    
    try {
      const response = await fetch(`${pythonBackendUrl}/generate_thinking`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          medicine: args.medicine,
          quick_action: args.quickAction,
          context: args.context,
        }),
      });

      if (!response.ok) {
        throw new Error(`Python backend error: ${response.status}`);
      }

      const result = await response.json();
      return {
        thinking: result.thinking,
        confidence: result.confidence,
        modelVersion: result.model_version,
      };
    } catch (error) {
      console.error('Error calling Python backend:', error);
      
      // Fallback to basic thinking
      return {
        thinking: `Let me think about ${args.medicine}... I need to consider what this medication is used for, how it works, potential side effects, and important safety information.`,
        confidence: 0.3,
        modelVersion: 'fallback',
      };
    }
  },
});

export const getEnhancedResponse = action({
  args: {
    medicine: v.string(),
    thinking: v.optional(v.string()),
    quickAction: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const pythonBackendUrl = process.env.PYTHON_BACKEND_URL || 'http://localhost:5000';
    
    try {
      const response = await fetch(`${pythonBackendUrl}/generate_response`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          medicine: args.medicine,
          thinking: args.thinking,
          quick_action: args.quickAction,
        }),
      });

      if (!response.ok) {
        throw new Error(`Python backend error: ${response.status}`);
      }

      const result = await response.json();
      return {
        response: result.response,
        thinking: result.thinking,
        confidence: result.confidence,
      };
    } catch (error) {
      console.error('Error calling Python backend:', error);
      return null;
    }
  },
});

export const trainModel = action({
  args: {
    conversations: v.array(v.object({
      userId: v.id("users"),
      messages: v.array(v.object({
        id: v.string(),
        role: v.union(v.literal("user"), v.literal("assistant"), v.literal("thinking")),
        content: v.string(),
        timestamp: v.number(),
        isComplete: v.optional(v.boolean()),
      })),
    })),
  },
  handler: async (ctx, args) => {
    const pythonBackendUrl = process.env.PYTHON_BACKEND_URL || 'http://localhost:5000';
    
    try {
      const response = await fetch(`${pythonBackendUrl}/train`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversations: args.conversations,
        }),
      });

      if (!response.ok) {
        throw new Error(`Training failed: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error training model:', error);
      throw new Error('Failed to train model');
    }
  },
});

export const submitFeedback = action({
  args: {
    conversationId: v.string(),
    feedbackType: v.union(v.literal("positive"), v.literal("negative"), v.literal("correction")),
    feedbackData: v.object({
      message: v.optional(v.string()),
      suggestion: v.optional(v.string()),
      rating: v.optional(v.number()),
    }),
  },
  handler: async (ctx, args) => {
    const pythonBackendUrl = process.env.PYTHON_BACKEND_URL || 'http://localhost:5000';
    
    try {
      const response = await fetch(`${pythonBackendUrl}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversation_id: args.conversationId,
          type: args.feedbackType,
          data: args.feedbackData,
        }),
      });

      if (!response.ok) {
        throw new Error(`Feedback submission failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error submitting feedback:', error);
      throw new Error('Failed to submit feedback');
    }
  },
});

export const getModelStats = action({
  args: {},
  handler: async (ctx, args) => {
    const pythonBackendUrl = process.env.PYTHON_BACKEND_URL || 'http://localhost:5000';
    
    try {
      const response = await fetch(`${pythonBackendUrl}/model_stats`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get model stats: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting model stats:', error);
      return {
        model_version: 'unknown',
        training_examples: 0,
        accuracy_metrics: {},
        error: 'Failed to connect to Python backend'
      };
    }
  },
});
