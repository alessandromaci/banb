import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// Rate limiting: Store request counts in memory (in production, use Redis)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10; // requests per minute
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute in ms

/**
 * Rate limiter for AI endpoints
 */
function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);

  if (!record || now > record.resetAt) {
    rateLimitMap.set(identifier, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (record.count >= RATE_LIMIT) {
    return false;
  }

  record.count++;
  return true;
}

/**
 * Sanitize user input to prevent prompt injection
 */
function sanitizeInput(input: string): string {
  // Remove potential prompt injection patterns
  const dangerous = [
    /ignore\s+previous\s+instructions/gi,
    /disregard\s+all\s+prior/gi,
    /forget\s+everything/gi,
    /new\s+instructions:/gi,
    /system\s+prompt:/gi,
    /you\s+are\s+now/gi,
  ];

  let sanitized = input;
  dangerous.forEach((pattern) => {
    sanitized = sanitized.replace(pattern, "[FILTERED]");
  });

  // Limit length
  return sanitized.slice(0, 1000);
}

/**
 * Retrieve user context for AI processing
 */
async function getUserContext(
  profileId: string,
  options: {
    includeBalance?: boolean;
    includeTransactions?: boolean;
    includeRecipients?: boolean;
  }
) {
  const context: Record<string, unknown> = {};

  try {
    // Get profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", profileId)
      .single();

    if (profile) {
      context.profile = {
        name: profile.name,
        handle: profile.handle,
      };
    }

    // Get balance if requested (from blockchain, not DB)
    if (options.includeBalance) {
      // Note: In production, fetch from blockchain via wagmi
      // For now, we'll indicate it should be fetched client-side
      context.balance = "FETCH_FROM_BLOCKCHAIN";
    }

    // Get recent transactions if requested
    if (options.includeTransactions) {
      const { data: transactions } = await supabase
        .from("transactions")
        .select(
          `
          *,
          recipient:recipients(name, external_address)
        `
        )
        .eq("sender_profile_id", profileId)
        .order("created_at", { ascending: false })
        .limit(10);

      context.transactions = transactions || [];
    }

    // Get recipients if requested
    if (options.includeRecipients) {
      const { data: recipients } = await supabase
        .from("recipients")
        .select("*")
        .eq("profile_id", profileId)
        .eq("status", "active");

      context.recipients = recipients || [];
    }

    return context;
  } catch (error) {
    console.error("Error fetching user context:", error);
    return context;
  }
}

/**
 * Parse AI response for actionable operations
 */
function parseAIResponse(response: string): {
  operation: Record<string, unknown> | null;
} {
  // Simple pattern matching for operations
  // In production, use structured output from AI model

  const paymentPattern = /send\s+\$?(\d+(?:\.\d{2})?)\s+to\s+(\w+)/i;
  const match = response.match(paymentPattern);

  if (match) {
    return {
      operation: {
        type: "payment",
        data: {
          amount: match[1],
          recipientName: match[2],
        },
      },
    };
  }

  return { operation: null };
}

/**
 * Call AI backend (OpenAI, Anthropic, or local model)
 */
async function callAIBackend(
  message: string,
  context: Record<string, unknown>
): Promise<string> {
  const aiProvider = process.env.AI_PROVIDER || "openai";
  const apiKey = process.env.AI_API_KEY;

  // If no API key or placeholder key, return a mock response
  if (!apiKey || apiKey === "your_ai_api_key" || apiKey.startsWith("your_")) {
    console.warn("No valid AI_API_KEY configured, using mock response");
    return generateMockResponse(message, context);
  }

  try {
    if (aiProvider === "openai") {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4",
          messages: [
            {
              role: "system",
              content: `You are a helpful banking assistant. You can help users analyze their spending, send payments, and answer questions about their account. 
              
Context: ${JSON.stringify(context)}

When suggesting a payment, use the format: "I can send $X to [recipient name] for you. Would you like me to proceed?"`,
            },
            {
              role: "user",
              content: message,
            },
          ],
          max_tokens: 500,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || "I'm sorry, I couldn't process that request.";
    } else if (aiProvider === "anthropic") {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-3-sonnet-20240229",
          max_tokens: 500,
          messages: [
            {
              role: "user",
              content: `Context: ${JSON.stringify(context)}\n\nUser message: ${message}`,
            },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(`Anthropic API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.content[0]?.text || "I'm sorry, I couldn't process that request.";
    } else {
      // Local model via Ollama
      const response = await fetch("http://localhost:11434/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama2",
          prompt: `Context: ${JSON.stringify(context)}\n\nUser: ${message}\n\nAssistant:`,
          stream: false,
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.response || "I'm sorry, I couldn't process that request.";
    }
  } catch (error) {
    console.error("AI backend error:", error);
    return generateMockResponse(message, context);
  }
}

/**
 * Generate mock response when AI backend is unavailable
 */
function generateMockResponse(message: string, context: Record<string, unknown>): string {
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes("spending") || lowerMessage.includes("analyze")) {
    const txCount = Array.isArray(context.transactions) ? context.transactions.length : 0;
    return `Based on your recent activity, you have ${txCount} transactions. Your spending patterns look healthy!`;
  }

  if (lowerMessage.includes("send") || lowerMessage.includes("pay")) {
    return "I can help you send a payment. Please specify the amount and recipient, and I'll prepare the transaction for your review.";
  }

  if (lowerMessage.includes("balance")) {
    return "Your current balance information is available on your dashboard. Would you like me to analyze your spending patterns?";
  }

  return "I'm here to help with your banking needs. You can ask me to analyze your spending, send payments, or answer questions about your account.";
}

/**
 * POST /api/ai/chat
 * Process AI agent chat messages
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, context: requestContext } = body;

    // Validate input
    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { success: false, message: "Invalid message" },
        { status: 400 }
      );
    }

    // Get profile ID from context (in production, extract from auth session)
    const profileId = requestContext?.profileId;
    if (!profileId) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    // Rate limiting
    if (!checkRateLimit(profileId)) {
      return NextResponse.json(
        { success: false, message: "Rate limit exceeded. Please try again later." },
        { status: 429 }
      );
    }

    // Sanitize input
    const sanitizedMessage = sanitizeInput(message);

    // Get user context
    const userContext = await getUserContext(profileId, {
      includeBalance: requestContext?.includeBalance,
      includeTransactions: requestContext?.includeTransactions,
      includeRecipients: requestContext?.includeRecipients,
    });

    // Call AI backend
    const aiResponse = await callAIBackend(sanitizedMessage, userContext);

    // Parse for operations
    const { operation } = parseAIResponse(aiResponse);

    // If operation detected, create audit record
    if (operation) {
      await supabase.from("ai_operations").insert({
        profile_id: profileId,
        operation_type: (operation as { type: string }).type,
        operation_data: (operation as { data: Record<string, unknown> }).data,
        user_message: sanitizedMessage,
        ai_response: aiResponse,
        user_confirmed: false,
        executed: false,
      });
    }

    return NextResponse.json({
      success: true,
      response: aiResponse,
      operation,
    });
  } catch (error) {
    console.error("AI chat error:", error);
    return NextResponse.json(
      { success: false, message: "Unable to process request" },
      { status: 500 }
    );
  }
}
