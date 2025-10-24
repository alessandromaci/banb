/**
 * @fileoverview AI agent service layer for portfolio management and banking operations.
 * Provides React hooks and functions for AI-powered chat interface, operation execution,
 * and portfolio insights. Integrates with OpenAI/Anthropic/local models for natural language processing.
 */

"use client";

import { useState, useCallback, useEffect } from "react";
import { supabase, type Transaction, type Recipient } from "./supabase";
import type { AIOperation } from "./supabase";
import { getRecentTransactions, getSentTransactions } from "./transactions";
import { getRecipientsByProfile } from "./recipients";
import { useUSDCBalance } from "./payments";
import { getPortfolioInsights, type PortfolioInsights } from "./portfolio-insights";

// Re-export AIOperation for convenience
export type { AIOperation };

/**
 * AI chat message structure.
 * 
 * @interface AIAgentMessage
 * @property {"user" | "assistant"} role - Message sender role
 * @property {string} content - Message text content
 * @property {number} timestamp - Unix timestamp of message creation
 */
export interface AIAgentMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

/**
 * User context data provided to AI for decision making.
 * 
 * @interface AIAgentContext
 * @property {string} balance - Current USDC balance
 * @property {Transaction[]} transactions - Recent transaction history
 * @property {Recipient[]} recipients - Saved payment recipients
 */
export interface AIAgentContext {
  balance: string;
  transactions: Transaction[];
  recipients: Recipient[];
}

/**
 * Parsed operation from AI response.
 * 
 * @interface ParsedAIOperation
 * @property {"payment" | "analysis" | "query"} type - Operation type
 * @property {Record<string, unknown>} data - Operation-specific data
 */
export interface ParsedAIOperation {
  type: "payment" | "analysis" | "query";
  data: Record<string, unknown>;
}

// Re-export PortfolioInsights for convenience
export type { PortfolioInsights } from "./portfolio-insights";

/**
 * React hook for AI agent chat interface.
 * Manages conversation history, processes user messages, and handles AI responses.
 * Automatically retrieves user context (balance, transactions, recipients) for AI.
 * 
 * @param {string} profileId - Current user's profile ID
 * @param {string | undefined} userAddress - User's wallet address for balance lookup
 * @returns {Object} AI agent state and functions
 * @returns {AIAgentMessage[]} return.messages - Conversation history
 * @returns {boolean} return.isProcessing - True while AI is generating response
 * @returns {function} return.sendMessage - Function to send user message
 * @returns {function} return.clearHistory - Function to clear conversation
 * @returns {string | null} return.error - Error message if operation failed
 * @returns {ParsedAIOperation | null} return.pendingOperation - Operation awaiting confirmation
 * 
 * @example
 * ```tsx
 * function AIChat() {
 *   const { profile } = useUser();
 *   const { address } = useAccount();
 *   const { messages, isProcessing, sendMessage, error, pendingOperation } = 
 *     useAIAgent(profile?.id || "", address);
 *   
 *   const handleSend = async (text: string) => {
 *     await sendMessage(text);
 *   };
 *   
 *   return (
 *     <div>
 *       {messages.map((msg, i) => (
 *         <div key={i}>{msg.role}: {msg.content}</div>
 *       ))}
 *       {pendingOperation && <ConfirmationModal operation={pendingOperation} />}
 *     </div>
 *   );
 * }
 * ```
 */
export function useAIAgent(profileId: string, userAddress?: `0x${string}`) {
  const [messages, setMessages] = useState<AIAgentMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingOperation, setPendingOperation] = useState<ParsedAIOperation | null>(null);

  const { formattedBalance } = useUSDCBalance(userAddress);

  // Log when profile ID changes for debugging
  useEffect(() => {
    if (profileId) {
      console.log("[useAIAgent] Initialized with profile ID:", profileId);
    }
  }, [profileId]);

  /**
   * Retrieves current user context for AI.
   * Fetches balance, recent transactions, and recipients.
   */
  const getContext = useCallback(async (): Promise<AIAgentContext> => {
    const [transactions, recipients] = await Promise.all([
      getRecentTransactions(profileId, 10),
      getRecipientsByProfile(profileId),
    ]);

    return {
      balance: formattedBalance || "0.00",
      transactions,
      recipients,
    };
  }, [profileId, formattedBalance]);

  /**
   * Sends a message to the AI and processes the response.
   * Automatically includes user context in the request.
   */
  const sendMessage = useCallback(
    async (message: string) => {
      if (!profileId) {
        setError("User not authenticated. Please log in to use the AI assistant.");
        return;
      }

      setIsProcessing(true);
      setError(null);

      // Add user message to history
      const userMessage: AIAgentMessage = {
        role: "user",
        content: message,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, userMessage]);

      try {
        // Send to AI API with profileId in context
        const response = await fetch("/api/ai/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message,
            context: {
              profileId,
              includeBalance: true,
              includeTransactions: true,
              includeRecipients: true,
            },
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to process message");
        }

        const data = await response.json();

        // Add AI response to history
        const aiMessage: AIAgentMessage = {
          role: "assistant",
          content: data.response,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, aiMessage]);

        // Handle operation if present
        if (data.operation) {
          setPendingOperation(data.operation);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to send message";
        setError(errorMessage);
        console.error("[useAIAgent] Error:", err);
      } finally {
        setIsProcessing(false);
      }
    },
    [profileId]
  );

  /**
   * Clears conversation history.
   */
  const clearHistory = useCallback(() => {
    setMessages([]);
    setPendingOperation(null);
    setError(null);
  }, []);

  return {
    messages,
    isProcessing,
    sendMessage,
    clearHistory,
    error,
    pendingOperation,
  };
}

/**
 * Validates an AI operation before execution.
 * Checks operation type, required fields, and data integrity.
 * 
 * @param {ParsedAIOperation} operation - Operation to validate
 * @returns {{valid: boolean; errors: string[]}} Validation result
 */
export function validateAIOperation(operation: ParsedAIOperation): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Validate operation type
  if (!["payment", "analysis", "query"].includes(operation.type)) {
    errors.push(`Invalid operation type: ${operation.type}`);
    return { valid: false, errors };
  }

  // Type-specific validation
  switch (operation.type) {
    case "payment": {
      const data = operation.data;
      if (!data.recipient_id && !data.to) {
        errors.push("Payment requires recipient_id or recipient address");
      }
      if (!data.amount) {
        errors.push("Payment requires amount");
      } else {
        const amount = parseFloat(String(data.amount));
        if (isNaN(amount) || amount <= 0) {
          errors.push("Payment amount must be greater than zero");
        }
      }
      if (!data.chain) {
        errors.push("Payment requires blockchain network");
      }
      break;
    }

    case "analysis":
      // Analysis operations don't require specific validation
      break;

    case "query":
      // Query operations don't require specific validation
      break;
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Executes an AI-suggested operation after user confirmation.
 * Validates operation type and data, executes using appropriate service functions,
 * and logs to audit trail.
 * 
 * @async
 * @param {ParsedAIOperation} operation - Operation to execute
 * @param {boolean} userConfirmed - Whether user confirmed the operation
 * @param {string} profileId - Current user's profile ID
 * @returns {Promise<{success: boolean; result: any}>} Execution result
 * @throws {Error} If operation validation fails
 * @throws {Error} If user did not confirm payment operation
 * @throws {Error} If operation execution fails
 * 
 * @example
 * ```typescript
 * const operation = {
 *   type: "payment",
 *   data: {
 *     recipient_id: "uuid",
 *     amount: "50.00",
 *     token: "USDC"
 *   }
 * };
 * 
 * const result = await executeAIOperation(operation, true, currentUser.id);
 * if (result.success) {
 *   console.log("Payment executed:", result.result.transactionId);
 * }
 * ```
 */
export async function executeAIOperation(
  operation: ParsedAIOperation,
  userConfirmed: boolean,
  profileId: string
): Promise<{ success: boolean; result: Record<string, unknown> | PortfolioInsights }> {
  // Validate operation
  const validation = validateAIOperation(operation);
  if (!validation.valid) {
    const errorMessage = `Operation validation failed: ${validation.errors.join(", ")}`;
    console.error("[executeAIOperation] Validation failed:", validation.errors);

    // Log failed validation
    await logAIOperation({
      profile_id: profileId,
      operation_type: operation.type,
      operation_data: operation.data as Record<string, unknown>,
      user_message: "",
      ai_response: "",
      user_confirmed: false,
      executed: false,
      execution_result: { error: errorMessage, validation_errors: validation.errors } as Record<string, unknown>,
    });

    throw new Error(errorMessage);
  }

  // Payment operations require user confirmation
  if (operation.type === "payment" && !userConfirmed) {
    const errorMessage = "Payment operations require user confirmation";
    console.error("[executeAIOperation]", errorMessage);

    // Log rejected operation
    await logAIOperation({
      profile_id: profileId,
      operation_type: operation.type,
      operation_data: operation.data as Record<string, unknown>,
      user_message: "",
      ai_response: "",
      user_confirmed: false,
      executed: false,
      execution_result: { error: errorMessage } as Record<string, unknown>,
    });

    throw new Error(errorMessage);
  }

  try {
    let result: Record<string, unknown> | PortfolioInsights;

    switch (operation.type) {
      case "payment":
        // Execute payment via API
        const paymentResponse = await fetch("/api/ai/execute", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            operationType: "payment",
            operationData: operation.data,
            profileId,
            userConfirmed,
          }),
        });

        if (!paymentResponse.ok) {
          const errorData = await paymentResponse.json();
          throw new Error(errorData.message || "Payment execution failed");
        }

        result = await paymentResponse.json();
        break;

      case "analysis":
        // Execute analysis
        result = await getPortfolioInsights(profileId);
        break;

      case "query":
        // Query operations don't need execution, just return the data
        result = operation.data;
        break;

      default:
        throw new Error(`Unsupported operation type: ${operation.type}`);
    }

    // Log successful operation to audit trail
    await logAIOperation({
      profile_id: profileId,
      operation_type: operation.type,
      operation_data: operation.data as Record<string, unknown>,
      user_message: "",
      ai_response: "",
      user_confirmed: userConfirmed,
      executed: true,
      execution_result: result as Record<string, unknown>,
    });

    console.log(`[executeAIOperation] ✓ ${operation.type} operation executed successfully`);
    return { success: true, result };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Operation execution failed";
    console.error("[executeAIOperation] ❌ Error:", err);

    // Log failed operation
    await logAIOperation({
      profile_id: profileId,
      operation_type: operation.type,
      operation_data: operation.data as Record<string, unknown>,
      user_message: "",
      ai_response: "",
      user_confirmed: userConfirmed,
      executed: false,
      execution_result: { error: errorMessage } as Record<string, unknown>,
    });

    throw new Error(errorMessage);
  }
}

// Re-export getPortfolioInsights for convenience
export { getPortfolioInsights } from "./portfolio-insights";

/**
 * Parses AI response text to extract actionable operations.
 * Looks for payment commands, analysis requests, and queries.
 * 
 * @param {string} aiResponse - AI's text response
 * @param {AIAgentContext} context - User context for validation
 * @returns {ParsedAIOperation | null} Parsed operation or null if none found
 * 
 * @example
 * ```typescript
 * const response = "I can send $50 to Alice for you. Would you like me to proceed?";
 * const operation = parseAIResponse(response, context);
 * // Returns: { type: "payment", data: { recipient_id: "...", amount: "50.00" } }
 * ```
 */
export function parseAIResponse(
  aiResponse: string,
  context: AIAgentContext
): ParsedAIOperation | null {
  const lowerResponse = aiResponse.toLowerCase();

  // Check for payment operation
  if (lowerResponse.includes("send") || lowerResponse.includes("pay")) {
    // Extract amount (look for $XX or XX USDC patterns)
    const amountMatch = aiResponse.match(/\$(\d+(?:\.\d{2})?)|(\d+(?:\.\d{2})?)\s*usdc/i);
    if (amountMatch) {
      const amount = amountMatch[1] || amountMatch[2];

      // Extract recipient name
      const toMatch = aiResponse.match(/to\s+([A-Za-z]+)/i);
      if (toMatch) {
        const recipientName = toMatch[1];

        // Find recipient in context
        const recipient = context.recipients.find((r) =>
          r.name.toLowerCase().includes(recipientName.toLowerCase())
        );

        if (recipient) {
          return {
            type: "payment",
            data: {
              recipient_id: recipient.id,
              amount,
              token: "USDC",
              chain: "base",
              to: recipient.external_address || "",
            },
          };
        }
      }
    }
  }

  // Check for analysis operation
  if (
    lowerResponse.includes("analyze") ||
    lowerResponse.includes("spending") ||
    lowerResponse.includes("insights")
  ) {
    return {
      type: "analysis",
      data: {},
    };
  }

  // Default to query operation
  return null;
}

/**
 * Logs an AI operation to the audit trail.
 * Creates a record in the ai_operations table for compliance and debugging.
 * 
 * @async
 * @param {Partial<AIOperation>} operationData - Operation data to log
 * @returns {Promise<void>}
 * @throws {Error} If database operation fails
 * 
 * @example
 * ```typescript
 * await logAIOperation({
 *   profile_id: currentUser.id,
 *   operation_type: "payment",
 *   operation_data: { amount: "50.00", recipient_id: "uuid" },
 *   user_message: "Send $50 to Alice",
 *   ai_response: "Payment sent successfully",
 *   user_confirmed: true,
 *   executed: true,
 *   execution_result: { transactionId: "uuid" }
 * });
 * ```
 */
async function logAIOperation(operationData: Partial<AIOperation>): Promise<void> {
  try {
    const { error } = await supabase.from("ai_operations").insert({
      profile_id: operationData.profile_id,
      operation_type: operationData.operation_type,
      operation_data: operationData.operation_data || {},
      user_message: operationData.user_message || "",
      ai_response: operationData.ai_response || "",
      user_confirmed: operationData.user_confirmed || false,
      executed: operationData.executed || false,
      execution_result: operationData.execution_result || null,
      executed_at: operationData.executed ? new Date().toISOString() : null,
    });

    if (error) {
      console.error("[logAIOperation] Failed to log operation:", error);
      // Don't throw - logging failure shouldn't break the operation
    }
  } catch (err) {
    console.error("[logAIOperation] Error:", err);
    // Don't throw - logging failure shouldn't break the operation
  }
}

/**
 * Retrieves AI operation history for a profile.
 * Returns operations ordered by creation date (newest first).
 * 
 * @async
 * @param {string} profileId - Profile ID to fetch history for
 * @param {number} [limit=20] - Maximum number of operations to return
 * @returns {Promise<AIOperation[]>} Array of AI operations
 * @throws {Error} If database operation fails
 * 
 * @example
 * ```typescript
 * const history = await getAIOperationHistory(currentUser.id, 10);
 * history.forEach(op => {
 *   console.log(`${op.operation_type}: ${op.executed ? 'executed' : 'not executed'}`);
 * });
 * ```
 */
export async function getAIOperationHistory(
  profileId: string,
  limit: number = 20
): Promise<AIOperation[]> {
  try {
    const { data, error } = await supabase
      .from("ai_operations")
      .select("*")
      .eq("profile_id", profileId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to fetch AI operation history: ${error.message}`);
    }

    return data || [];
  } catch (err) {
    console.error("[getAIOperationHistory] Error:", err);
    throw new Error("Failed to fetch AI operation history");
  }
}
