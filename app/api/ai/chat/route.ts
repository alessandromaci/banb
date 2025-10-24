import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { MCP_TOOLS, executeToolHandler, type ToolExecutionContext } from "@/lib/mcp-server";

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

    // Get balance if requested (server-side via MCP tool)
    if (options.includeBalance) {
      try {
        const balanceResult = await executeToolHandler(
          "get_user_balance",
          {},
          { profileId } as ToolExecutionContext
        );
        let balanceInfo: unknown = null;
        if (balanceResult.content && balanceResult.content[0]?.text) {
          const parsed = JSON.parse(balanceResult.content[0].text);
          if (parsed.success) {
            balanceInfo = parsed.data;
          }
        }
        // Provide structured balance info or omit if unavailable
        if (balanceInfo) {
          context.balance = balanceInfo;
        }
      } catch (e) {
        console.warn("Failed to fetch balance via MCP tool:", e);
      }
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
 * Convert MCP tools to OpenAI function definitions
 */
function convertMCPToolsToOpenAIFunctions() {
  return MCP_TOOLS.map((tool) => ({
    type: "function",
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.inputSchema,
    },
  }));
}

/**
 * Execute MCP tool and return formatted result
 */
async function executeMCPTool(
  toolName: string,
  args: Record<string, unknown>,
  profileId: string
): Promise<string> {
  try {
    console.log(`Executing MCP tool: ${toolName} for profile: ${profileId}`);
    
    const context: ToolExecutionContext = { profileId };
    const result = await executeToolHandler(toolName, args, context);
    
    // Extract the text content from MCP result
    if (result.content && result.content[0]?.text) {
      const parsedResult = JSON.parse(result.content[0].text);
      if (parsedResult.success) {
        // Format the data for better AI consumption
        const formattedData = JSON.stringify(parsedResult.data, null, 2);
        console.log(`Tool ${toolName} returned data:`, formattedData.substring(0, 200) + "...");
        return formattedData;
      } else {
        console.error(`Tool ${toolName} returned error:`, parsedResult.error);
        return `Error: ${parsedResult.error}`;
      }
    }
    
    console.warn(`Tool ${toolName} returned no content`);
    return "No data returned from tool";
  } catch (error) {
    console.error(`Error executing MCP tool ${toolName}:`, error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return `Error executing ${toolName}: ${errorMessage}`;
  }
}

/**
 * Validates AI configuration for MCP functionality
 */
function validateAIConfiguration(): { valid: boolean; error?: string } {
  const aiProvider = process.env.AI_PROVIDER;
  const apiKey = process.env.AI_API_KEY;

  // Check if AI_PROVIDER is set to openai for MCP functionality
  if (aiProvider !== "openai") {
    return {
      valid: false,
      error: `MCP functionality requires AI_PROVIDER="openai", but got "${aiProvider}". Please update your .env.local file.`
    };
  }

  // Check if API key is configured
  if (!apiKey || apiKey === "your_ai_api_key" || (typeof apiKey === "string" && apiKey.startsWith("your_"))) {
    return {
      valid: false,
      error: "AI_API_KEY is not configured. Please add a valid OpenAI API key to your .env.local file."
    };
  }

  // Basic API key format validation (OpenAI keys start with sk-)
  if (typeof apiKey === "string" && !apiKey.startsWith("sk-")) {
    return {
      valid: false,
      error: "Invalid AI_API_KEY format. OpenAI API keys should start with 'sk-'."
    };
  }

  return { valid: true };
}

/**
 * Call AI backend with MCP tool integration (OpenAI, Anthropic, or local model)
 */
async function callAIBackend(
  message: string,
  context: Record<string, unknown>,
  profileId?: string
): Promise<string> {
  const aiProvider = process.env.AI_PROVIDER || "openai";
  const apiKey = process.env.AI_API_KEY;

  // Validate AI configuration
  const configValidation = validateAIConfiguration();
  if (!configValidation.valid) {
    console.warn("AI configuration invalid:", configValidation.error);
    return await generateMockResponse(message, context, profileId, configValidation.error);
  }

  try {
    if (aiProvider === "openai") {
      // Prepare system message with MCP tool context
      const systemMessage = `You are a helpful banking assistant for Banb, a blockchain-based neo-bank. You can help users analyze their spending, send payments, and answer questions about their account.

You have access to the following tools to query user data:
- get_investment_options: Get available investment products with APR, risk level, and details
- get_user_balance: Get current USDC balance for the authenticated user
- get_accounts: Get accounts linked to the user with balances and metadata
- get_recent_transactions: Get recent transaction history with recipient details
- get_onchain_transactions: Fetch transaction history directly from Base blockchain (ONLY call this when user explicitly requests onchain check)
- get_recipients: Get saved payment recipients (friends list)
- get_transaction_summary: Get spending analysis and patterns with insights

Use these tools when users ask about their data. Always provide helpful, accurate information based on the tool results.
When users ask about investments, balance, transactions, accounts, recipients, or spending patterns, use the appropriate tools to get current data.

IMPORTANT BEHAVIOR FOR TRANSACTIONS:
- When a user asks about transactions or spending patterns, call the appropriate tool (get_recent_transactions or get_transaction_summary)
- If the tool returns a JSON object with "message" and "suggestion" fields, this means NO transactions found in database
- DO NOT automatically call get_onchain_transactions
- Instead, inform the user that no transactions were found in the database, and suggest they can check onchain transactions from the blockchain
- Tell them they can click a button or say "check onchain" to search the blockchain directly
- ONLY call get_onchain_transactions if the user explicitly says "check onchain", "search blockchain", "onchain transactions", or similar requests

FORMATTING ONCHAIN TRANSACTIONS:
- When get_onchain_transactions returns data, use the "display" field for each transaction (it's pre-formatted)
- Present transactions in a clean list format, one per line
- Include the explorer_url link for users to view details: "View on Basescan: [url]"
- Example format:
  📥 Received 50.00 USDC - 1/15/2025
  📤 Sent 25.00 USDC - 1/14/2025
  View details: https://basescan.org/tx/...
- Keep presentation simple and mobile-friendly

LANGUAGE:
- Respond in the same language as the user's question. If the user asks in Italian, respond in Italian. If the user asks in English, respond in English
- Keep answers concise and helpful

When suggesting a payment, use the format: "I can send $X to [recipient name] for you. Would you like me to proceed?"`;

      // Prepare OpenAI request with function calling
      const requestBody: {
        model: string;
        messages: Array<{role: string; content: string | null; tool_calls?: unknown[]}>;
        max_tokens: number;
        temperature: number;
        tools?: unknown[];
        tool_choice?: string;
      } = {
        model: "gpt-4o-mini", // Use the available model
        messages: [
          {
            role: "system",
            content: systemMessage,
          },
          {
            role: "user",
            content: message,
          },
        ],
        max_tokens: 500,
        temperature: 0.7,
      };

      // Add function calling if profile ID is available (user is authenticated)
      if (profileId) {
        requestBody.tools = convertMCPToolsToOpenAIFunctions();
        requestBody.tool_choice = "auto";
      }

      console.log("Making OpenAI request with tools:", profileId ? "enabled" : "disabled");

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("OpenAI API error:", response.status, errorText);
        
        // Handle specific API key errors
        if (response.status === 401) {
          console.error("OpenAI API key is invalid or expired");
          return generateMockResponse(message, context, profileId, "Invalid or expired OpenAI API key. Please check your AI_API_KEY in .env.local.");
        }
        
        if (response.status === 429) {
          console.error("OpenAI API rate limit exceeded");
          return generateMockResponse(message, context, "OpenAI API rate limit exceeded. Please try again later.");
        }
        
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const choice = data.choices[0];
      
      if (!choice) {
        console.error("No choices returned from OpenAI");
        return "I'm sorry, I couldn't process that request.";
      }

      // Check if OpenAI wants to call tools
      if (choice.message.tool_calls && choice.message.tool_calls.length > 0 && profileId) {
        console.log(`OpenAI requested ${choice.message.tool_calls.length} tool calls`);
        
        const toolMessages: Array<{
          role: string;
          tool_call_id: string;
          content: string;
        }> = [];
        
        // Execute each tool call
        for (const toolCall of choice.message.tool_calls) {
          const toolName = toolCall.function.name;
          const toolArgs = JSON.parse(toolCall.function.arguments || "{}");
          
          console.log(`Executing MCP tool: ${toolName} with args:`, toolArgs);
          
          try {
            const toolResult = await executeMCPTool(toolName, toolArgs, profileId);
            toolMessages.push({
              role: "tool",
              tool_call_id: toolCall.id,
              content: toolResult,
            });
            console.log(`Tool ${toolName} executed successfully`);
          } catch (toolError) {
            console.error(`Error executing tool ${toolName}:`, toolError);
            toolMessages.push({
              role: "tool",
              tool_call_id: toolCall.id,
              content: `Error: ${toolError instanceof Error ? toolError.message : "Tool execution failed"}`,
            });
          }
        }
        
        // Make a second call to OpenAI with tool results
        const followUpRequestBody = {
          model: "gpt-4o-mini", // Use the available model
          messages: [
            {
              role: "system",
              content: systemMessage,
            },
            {
              role: "user",
              content: message,
            },
            {
              role: "assistant",
              content: null,
              tool_calls: choice.message.tool_calls,
            },
            ...toolMessages,
          ],
          max_tokens: 500,
          temperature: 0.7,
        };

        console.log("Making follow-up OpenAI request with tool results");

        const followUpResponse = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify(followUpRequestBody),
        });

        if (!followUpResponse.ok) {
          const errorText = await followUpResponse.text();
          console.error("OpenAI follow-up API error:", followUpResponse.status, errorText);
          throw new Error(`OpenAI follow-up API error: ${followUpResponse.status} ${followUpResponse.statusText}`);
        }

        const followUpData = await followUpResponse.json();
        const finalResponse = followUpData.choices[0]?.message?.content;
        
        if (!finalResponse) {
          console.error("No content in follow-up response");
          return "I processed your request but couldn't generate a response.";
        }

        console.log("Successfully completed MCP tool integration flow");
        return finalResponse;
      }

      // Return direct response if no tool calls
      const directResponse = choice.message?.content;
      if (!directResponse) {
        console.error("No content in direct response");
        return "I'm sorry, I couldn't process that request.";
      }

      console.log("Returning direct response (no tool calls)");
      return directResponse;
    } else if (aiProvider === "anthropic") {
      // Note: Anthropic integration doesn't support MCP tools in this implementation
      console.log("Using Anthropic (no MCP tool support)");
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey || "",
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
      // Local model via Ollama (no MCP tool support)
      console.log("Using local model (no MCP tool support)");
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
    return generateMockResponse(message, context, profileId);
  }
}

/**
 * Generate mock response when AI backend is unavailable
 */
async function generateMockResponse(
  message: string,
  context: Record<string, unknown>,
  profileId?: string,
  configError?: string
): Promise<string> {
  // If there's a configuration error, include it in the response
  const configMessage = configError 
    ? `⚠️ Configuration Issue: ${configError}\n\n` 
    : "⚠️ AI_API_KEY not configured. Please add a valid OpenAI API key to your .env.local file for full functionality.\n\n";
  const lowerMessage = message.toLowerCase();

  // If we have an authenticated user, try to satisfy the request via MCP tools directly (DB-backed)
  if (profileId) {
    try {
      // Italian keyword detection
      const itTransazioni = lowerMessage.includes("transazioni") || lowerMessage.includes("storico");
      const itConti = lowerMessage.includes("conti") || lowerMessage.includes("account") || lowerMessage.includes("collegati");
      const itSaldi = lowerMessage.includes("saldo") || lowerMessage.includes("ammontare") || lowerMessage.includes("disponibile");
      const itInvestimenti = lowerMessage.includes("investimenti") || lowerMessage.includes("investimento") || lowerMessage.includes("tipologie");

      // If the user asks for a combined Italian report, fetch all relevant data
      if (itTransazioni || itConti || itSaldi || itInvestimenti) {
        const parts: string[] = [];

        if (itConti || itSaldi) {
          const accountsData = await executeMCPTool("get_accounts", {}, profileId);
          parts.push("Conti collegati e saldi (dati live):\n" + accountsData);
        }
        if (itTransazioni) {
          const txData = await executeMCPTool("get_recent_transactions", { limit: 10 }, profileId);
          parts.push("Transazioni recenti (dati live):\n" + txData);
        }
        if (itInvestimenti) {
          const invData = await executeMCPTool("get_investment_options", {}, profileId);
          parts.push("Tipologie di investimenti disponibili (dati dal codice):\n" + invData);
        }

        if (parts.length > 0) {
          return configMessage + parts.join("\n\n");
        }
      }

      // Map English intent to MCP tool
      if (lowerMessage.includes("investment") || lowerMessage.includes("invest")) {
        const data = await executeMCPTool("get_investment_options", {}, profileId);
        return configMessage + "Here are the available investment options (live data):\n\n" + data;
      }

      if (lowerMessage.includes("spending") || lowerMessage.includes("analyze") || lowerMessage.includes("summary")) {
        const data = await executeMCPTool("get_transaction_summary", {}, profileId);
        return configMessage + "Here is your spending summary (live data):\n\n" + data;
      }

      if (lowerMessage.includes("transaction") || lowerMessage.includes("history")) {
        const data = await executeMCPTool("get_recent_transactions", { limit: 10 }, profileId);
        return configMessage + "Here are your recent transactions (live data):\n\n" + data;
      }

      if (lowerMessage.includes("recipient") || lowerMessage.includes("friend")) {
        const data = await executeMCPTool("get_recipients", {}, profileId);
        return configMessage + "Here are your saved recipients (live data):\n\n" + data;
      }

      if (lowerMessage.includes("balance") || lowerMessage.includes("accounts")) {
        // Provide both overall balance and accounts when asked about balance/accounts
        const [balanceData, accountsData] = await Promise.all([
          executeMCPTool("get_user_balance", {}, profileId),
          executeMCPTool("get_accounts", {}, profileId),
        ]);
        return configMessage + "Balance information (live data):\n\n" + balanceData + "\n\nLinked accounts (live data):\n" + accountsData;
      }

      // Default authenticated fallback: return a brief live snapshot using MCP tools
      const [summaryData, accountsData] = await Promise.all([
        executeMCPTool("get_transaction_summary", {}, profileId),
        executeMCPTool("get_accounts", {}, profileId),
      ]);
      return configMessage +
        "Here is a quick snapshot of your account (live data):\n\n" +
        "Spending summary:\n" + summaryData +
        "\n\nLinked accounts and balances:\n" + accountsData;
    } catch (e) {
      console.warn("MCP fallback failed, returning generic guidance.", e);
      // Fall through to generic responses below
    }
  }

  // Generic guidance (no DB calls)
  if (lowerMessage.includes("investment") || lowerMessage.includes("invest")) {
    return configMessage + "I can help you explore investment options. You have access to several investment products with different risk levels and APR rates.";
  }

  if (lowerMessage.includes("spending") || lowerMessage.includes("analyze") || lowerMessage.includes("summary")) {
    const txCount = Array.isArray(context.transactions) ? context.transactions.length : 0;
    return configMessage + `Based on your recent activity, you have ${txCount} transactions. I can provide detailed spending analysis and insights.`;
  }

  if (lowerMessage.includes("transaction") || lowerMessage.includes("history")) {
    return configMessage + "I can show you your recent transaction history including amounts, recipients, and dates.";
  }

  if (lowerMessage.includes("recipient") || lowerMessage.includes("friend")) {
    return configMessage + "I can help you view your saved payment recipients and analyze your payment patterns.";
  }

  if (lowerMessage.includes("send") || lowerMessage.includes("pay")) {
    return configMessage + "I can help you send a payment. Please specify the amount and recipient, and I'll prepare the transaction for your review.";
  }

  if (lowerMessage.includes("balance")) {
    return configMessage + "I can check your current USDC balance and provide balance-related insights.";
  }

  return configMessage + "I'm here to help with your banking needs. You can ask me about investments, balance, transactions, recipients, or spending analysis.";
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

    // Call AI backend with MCP integration
    const aiResponse = await callAIBackend(sanitizedMessage, userContext, profileId);

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
