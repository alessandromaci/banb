/**
 * @fileoverview Model Context Protocol (MCP) server implementation for Banb.
 * Provides read-only query tools for AI-powered natural language queries about user data.
 * Exposes investment options, balances, transactions, recipients, and portfolio insights.
 */

// Import removed - we'll define investment options directly to avoid client/server issues
import { getRecentTransactions, getSentTransactions } from "./transactions";
import { getRecipientsByProfile } from "./recipients";
import { getPortfolioInsights, type PortfolioInsights } from "./portfolio-insights";
import { fetchOnchainTransactions, type FormattedOnchainTransaction } from "./onchain-transactions";
import { supabase } from "./supabase";

/**
 * Server-side investment options data.
 * Duplicated from lib/investments.ts to avoid client/server boundary issues.
 */
const SERVER_INVESTMENT_OPTIONS = [
  {
    id: "morpho-vault-1",
    name: "Spark USDC Vault",
    description: "Spark blue-chip USDC vault. Lending against the lowest risk crypto and real-world assets (RWAs). Curated by SparkDAO which allocates billions in assets across all of DeFi.",
    apr: 6.55,
    type: "morpho_vault",
    vault_address: "0x7BfA7C4f149E7415b73bdeDfe609237e29CBF34A",
  },
  {
    id: "morpho-vault-2", 
    name: "Steakhouse USDC Vault",
    description: "The Steakhouse USDC vault aims to optimize yields by lending USDC against blue chip crypto and real world asset (RWA) collateral markets, depending on market conditions.",
    apr: 5.59,
    type: "morpho_vault",
    vault_address: "0xbeeF010f9cb27031ad51e3333f9aF9C6B1228183",
  },
  {
    id: "morpho-vault-3",
    name: "Seamless USDC Vault", 
    description: "The Seamless USDC Vault curated by Gauntlet is intended to optimize risk-adjusted yield across high-demand collateral markets on Base.",
    apr: 6.99,
    type: "morpho_vault",
    vault_address: "0x616a4E1db48e22028f6bbf20444Cd3b8e3273738",
  },
] as const;

/**
 * MCP tool definition interface following the MCP specification.
 */
export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: "object";
    properties: Record<string, unknown>;
    required?: string[];
  };
}

/**
 * MCP tool execution result interface following the MCP specification.
 */
export interface MCPToolResult {
  content: Array<{
    type: "text";
    text: string;
  }>;
}

/**
 * MCP request interface for handling protocol requests.
 */
export interface MCPRequest {
  method: "tools/list" | "tools/call";
  params?: {
    name?: string;
    arguments?: Record<string, unknown>;
  };
}

/**
 * Tool execution context containing authenticated user information.
 */
export interface ToolExecutionContext {
  profileId: string;
  userAddress?: string;
  sessionId?: string;
}

/**
 * Registry of available MCP tools for querying Banb application data.
 * All tools are read-only and require user authentication.
 */
export const MCP_TOOLS: MCPTool[] = [
  {
    name: "get_investment_options",
    description: "Retrieve available investment products with APR, risk level, and details. Returns all investment opportunities users can choose from.",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "get_user_balance",
    description: "Get current USDC balance for the authenticated user. Returns formatted balance with currency symbol.",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "get_accounts",
    description: "Get accounts linked to the authenticated user profile with their balances and metadata.",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "get_recent_transactions",
    description: "Retrieve recent transaction history for the authenticated user. Includes transaction details like amount, recipient, date, and status.",
    inputSchema: {
      type: "object",
      properties: {
        limit: {
          type: "number",
          description: "Maximum number of transactions to return (default 10, max 50)",
          minimum: 1,
          maximum: 50,
        },
      },
    },
  },
  {
    name: "get_recipients",
    description: "Get saved payment recipients (friends list) for the authenticated user. Returns recipient names and addresses.",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "get_transaction_summary",
    description: "Get spending analysis and patterns for the authenticated user. Returns insights like total spent, top recipients, spending trends, and average transaction amounts.",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "get_onchain_transactions",
    description: "Fetch transaction history directly from the Base blockchain using Basescan API. Use this when database transactions are empty or user explicitly requests onchain data. Returns last transactions with amounts, counterparties, and dates.",
    inputSchema: {
      type: "object",
      properties: {
        limit: {
          type: "number",
          description: "Maximum number of transactions to return (default 5, max 20)",
          minimum: 1,
          maximum: 20,
        },
      },
    },
  },
];

/**
 * Handles MCP protocol requests and routes them to appropriate handlers.
 * Supports tools/list and tools/call methods as per MCP specification.
 * 
 * @param {MCPRequest} request - MCP protocol request
 * @param {ToolExecutionContext} context - Authenticated user context
 * @returns {Promise<any>} MCP protocol response
 * @throws {Error} If request is invalid or tool execution fails
 * 
 * @example
 * ```typescript
 * const response = await handleMCPRequest(
 *   { method: "tools/list" },
 *   { profileId: "user-123" }
 * );
 * ```
 */
export async function handleMCPRequest(
  request: MCPRequest,
  context: ToolExecutionContext
): Promise<{ tools: MCPTool[] } | MCPToolResult> {
  switch (request.method) {
    case "tools/list":
      return {
        tools: MCP_TOOLS,
      };

    case "tools/call":
      if (!request.params?.name) {
        throw new Error("Tool name is required for tools/call");
      }

      const tool = MCP_TOOLS.find((t) => t.name === request.params!.name);
      if (!tool) {
        throw new Error(`Unknown tool: ${request.params!.name}`);
      }

      return await executeToolHandler(
        request.params!.name,
        request.params!.arguments || {},
        context
      );

    default:
      throw new Error(`Unsupported method: ${request.method}`);
  }
}

/**
 * Executes a specific MCP tool handler with the provided arguments.
 * Validates authentication and routes to the appropriate tool implementation.
 * 
 * @param {string} toolName - Name of the tool to execute
 * @param {Record<string, unknown>} args - Tool arguments
 * @param {ToolExecutionContext} context - Authenticated user context
 * @returns {Promise<MCPToolResult>} Tool execution result
 * @throws {Error} If tool execution fails or user is not authenticated
 */
export async function executeToolHandler(
  toolName: string,
  args: Record<string, unknown>,
  context: ToolExecutionContext
): Promise<MCPToolResult> {
  // Validate authentication
  if (!context.profileId) {
    throw new Error("Authentication required");
  }

  try {
    let result: unknown;

    switch (toolName) {
      case "get_investment_options":
        result = await getInvestmentOptionsHandler();
        break;

      case "get_user_balance":
        result = await getUserBalanceHandler(context);
        break;

      case "get_accounts":
        result = await getAccountsHandler(context);
        break;

      case "get_recent_transactions":
        result = await getRecentTransactionsHandler(args, context);
        break;

      case "get_recipients":
        result = await getRecipientsHandler(context);
        break;

      case "get_transaction_summary":
        result = await getTransactionSummaryHandler(context);
        break;

      case "get_onchain_transactions":
        result = await getOnchainTransactionsHandler(args, context);
        break;

      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            success: true,
            data: result,
            timestamp: new Date().toISOString(),
          }),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : "Tool execution failed",
            timestamp: new Date().toISOString(),
          }),
        },
      ],
    };
  }
}

/**
 * Handler for get_investment_options tool.
 * Retrieves all available investment products with details.
 * Returns investment data formatted with name, description, APR, type, and vault address.
 * 
 * @returns {Promise<Array<{id: string; name: string; description: string; apr: string; type: string; vault_address: string | null}>>} Investment options data in MCP response format
 */
async function getInvestmentOptionsHandler(): Promise<Array<{
  id: string;
  name: string;
  description: string;
  apr: string;
  type: string;
  vault_address: string | null;
}>> {
  return SERVER_INVESTMENT_OPTIONS.map((option) => ({
    id: option.id,
    name: option.name,
    description: option.description,
    apr: `${option.apr}%`,
    type: option.type,
    vault_address: option.vault_address || null,
  }));
}

/**
 * Handler for get_user_balance tool.
 * Retrieves current USDC balance for the authenticated user.
 * Note: This is a simplified implementation that returns account balance from database.
 * In production, this would integrate with the actual USDC balance hook.
 * 
 * @param {ToolExecutionContext} context - User context
 * @returns {Promise<{balance: string; currency: string; status: string; error?: string}>} Balance data
 */
async function getUserBalanceHandler(context: ToolExecutionContext): Promise<{
  balance: string;
  currency: string;
  status: string;
  error?: string;
}> {
  try {
    // Get user's primary account balance from database
    // This is a simplified approach - in production you'd use the actual USDC balance
    const { data: accounts, error } = await supabase
      .from("accounts")
      .select("balance")
      .eq("profile_id", context.profileId)
      .eq("is_primary", true)
      .eq("status", "active")
      .single();

    if (error || !accounts) {
      return {
        balance: "$0.00",
        currency: "USDC",
        status: "wallet_not_connected",
      };
    }

    const balance = parseFloat(accounts.balance || "0");
    return {
      balance: `$${balance.toFixed(2)}`,
      currency: "USDC",
      status: "connected",
    };
  } catch (error) {
    return {
      balance: "$0.00",
      currency: "USDC",
      status: "error",
      error: error instanceof Error ? error.message : "Failed to fetch balance",
    };
  }
}

/**
 * Transaction response type for getRecentTransactionsHandler
 */
type TransactionResponse = 
  | Array<{
      id: string;
      amount: string;
      recipient_name: string;
      recipient_address: string | null;
      date: string;
      status: string;
      token: string;
      chain: string;
    }>
  | { message: string; suggestion: string };

/**
 * Handler for get_recent_transactions tool.
 * Retrieves recent transaction history with recipient details.
 * 
 * @param {Record<string, unknown>} args - Tool arguments
 * @param {ToolExecutionContext} context - User context
 * @returns {Promise<TransactionResponse>} Transaction data or suggestion message
 */
async function getRecentTransactionsHandler(
  args: Record<string, unknown>,
  context: ToolExecutionContext
): Promise<TransactionResponse> {
  const limit = Math.min(Math.max((args.limit as number) || 10, 1), 50);

  const transactions = await getRecentTransactions(context.profileId, limit);

  // If no transactions in database, suggest checking onchain
  if (transactions.length === 0) {
    return {
      message: "No transactions found in the database.",
      suggestion: "Would you like me to check for onchain transactions? This will fetch your transaction history directly from the blockchain."
    };
  }

  return transactions.map((tx) => ({
    id: tx.id,
    amount: `$${parseFloat(tx.amount).toFixed(2)}`,
    recipient_name: tx.recipient?.name || "Unknown",
    recipient_address: tx.recipient?.external_address
      ? `${tx.recipient.external_address.slice(0, 6)}...${tx.recipient.external_address.slice(-4)}`
      : null,
    date: new Date(tx.created_at).toLocaleDateString(),
    status: tx.status,
    token: tx.token,
    chain: tx.chain,
  }));
}

/**
 * Handler for get_accounts tool.
 * Retrieves all accounts linked to the authenticated user profile with balances.
 * Returns masked addresses for privacy and formatted balances.
 * 
 * @param {ToolExecutionContext} context - User context
 * @returns {Promise<Array<{id: string; name: string; type: string; address: string; network: string; balance: string; is_primary: boolean; status: string}>>} Accounts data
 */
async function getAccountsHandler(context: ToolExecutionContext): Promise<Array<{
  id: string;
  name: string;
  type: string;
  address: string;
  network: string;
  balance: string;
  is_primary: boolean;
  status: string;
}>> {
  const { data: accounts, error } = await supabase
    .from("accounts")
    .select("id, name, type, address, network, balance, is_primary, status")
    .eq("profile_id", context.profileId)
    .order("is_primary", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error("Failed to fetch accounts");
  }

  return (accounts || []).map((acc) => ({
    id: acc.id,
    name: acc.name,
    type: acc.type,
    address: acc.address ? `${acc.address.slice(0, 6)}...${acc.address.slice(-4)}` : "",
    network: acc.network,
    balance: `$${parseFloat(acc.balance || "0").toFixed(2)}`,
    is_primary: !!acc.is_primary,
    status: acc.status,
  }));
}

/**
 * Handler for get_recipients tool.
 * Retrieves saved payment recipients with masked addresses for privacy.
 * Calculates total amounts sent to each recipient from transaction history.
 * 
 * @param {ToolExecutionContext} context - User context
 * @returns {Promise<Array<{id: string; name: string; address: string | null; is_app_user: boolean; status: string; total_sent: string}>>} Recipients data with total amounts sent
 */
async function getRecipientsHandler(context: ToolExecutionContext): Promise<Array<{
  id: string;
  name: string;
  address: string | null;
  is_app_user: boolean;
  status: string;
  total_sent: string;
}>> {
  const [recipients, transactions] = await Promise.all([
    getRecipientsByProfile(context.profileId),
    getSentTransactions(context.profileId),
  ]);

  // Calculate total amounts sent to each recipient
  const recipientTotals = new Map<string, number>();
  transactions.forEach((tx) => {
    if (tx.recipient_id) {
      const current = recipientTotals.get(tx.recipient_id) || 0;
      recipientTotals.set(tx.recipient_id, current + parseFloat(tx.amount));
    }
  });

  return recipients.map((recipient) => ({
    id: recipient.id,
    name: recipient.name,
    address: recipient.external_address
      ? `${recipient.external_address.slice(0, 6)}...${recipient.external_address.slice(-4)}`
      : null,
    is_app_user: !!recipient.profile_id_link,
    status: recipient.status,
    total_sent: (recipientTotals.get(recipient.id) || 0).toFixed(2),
  }));
}

/**
 * Handler for get_transaction_summary tool.
 * Retrieves portfolio insights and spending analysis.
 * 
 * @param {ToolExecutionContext} context - User context
 * @returns {Promise<{total_spent: string; top_recipients: Array<{name: string; amount: string}>; spending_trend: string; average_transaction: string; summary: string}>} Transaction summary data
 */
async function getTransactionSummaryHandler(context: ToolExecutionContext): Promise<{
  total_spent: string;
  top_recipients: Array<{ name: string; amount: string }>;
  spending_trend: string;
  average_transaction: string;
  summary: string;
}> {
  const insights = await getPortfolioInsights(context.profileId);

  return {
    total_spent: `$${insights.totalSpent}`,
    top_recipients: insights.topRecipients.map((recipient) => ({
      name: recipient.name,
      amount: `$${recipient.amount}`,
    })),
    spending_trend: insights.spendingTrend,
    average_transaction: `$${insights.averageTransaction}`,
    summary: generateInsightsSummary(insights),
  };
}

/**
 * Generates a natural language summary of portfolio insights.
 * 
 * @param {PortfolioInsights} insights - Portfolio insights data
 * @returns {string} Natural language summary
 */
function generateInsightsSummary(insights: PortfolioInsights): string {
  const { totalSpent, topRecipients, spendingTrend, averageTransaction } = insights;

  let summary = `You have spent a total of $${totalSpent}`;

  if (topRecipients.length > 0) {
    summary += ` with your top recipient being ${topRecipients[0].name} ($${topRecipients[0].amount})`;
  }

  summary += `. Your average transaction is $${averageTransaction}`;

  switch (spendingTrend) {
    case "increasing":
      summary += " and your spending has been increasing recently.";
      break;
    case "decreasing":
      summary += " and your spending has been decreasing recently.";
      break;
    default:
      summary += " and your spending has been stable.";
      break;
  }

  return summary;
}

/**
 * Onchain transaction response type for getOnchainTransactionsHandler
 */
type OnchainTransactionResponse = 
  | Array<{
      tx_hash: string;
      from: string;
      to: string;
      amount: string;
      token: string;
      date: string;
      direction: string;
      status: string;
      explorer_url: string;
    }>
  | { error: string; message: string };

/**
 * Handler for get_onchain_transactions tool.
 * Fetches transaction history directly from Base blockchain via Basescan API.
 * Returns formatted transaction data with explorer links.
 * 
 * @param {Record<string, unknown>} args - Tool arguments
 * @param {ToolExecutionContext} context - User context
 * @returns {Promise<OnchainTransactionResponse>} Onchain transaction data or error message
 */
async function getOnchainTransactionsHandler(
  args: Record<string, unknown>,
  context: ToolExecutionContext
): Promise<OnchainTransactionResponse> {
  try {
    const limit = Math.min(Math.max((args.limit as number) || 5, 1), 20);
    
    const transactions = await fetchOnchainTransactions(context.profileId, limit);
    
    if (transactions.length === 0) {
      return {
        error: "no_transactions",
        message: "No onchain transactions found for this account."
      };
    }

    return transactions.map((tx) => ({
      tx_hash: `${tx.tx_hash.slice(0, 10)}...${tx.tx_hash.slice(-8)}`,
      from: `${tx.from.slice(0, 6)}...${tx.from.slice(-4)}`,
      to: `${tx.to.slice(0, 6)}...${tx.to.slice(-4)}`,
      amount: `$${tx.amount}`,
      token: tx.token,
      date: tx.date,
      direction: tx.direction === "in" ? "received" : "sent",
      status: tx.status,
      explorer_url: `https://basescan.org/tx/${tx.tx_hash}`,
    }));
  } catch (error) {
    return {
      error: "fetch_failed",
      message: error instanceof Error ? error.message : "Failed to fetch onchain transactions"
    };
  }
}

/**
 * Validates user authentication using profile_id from session context.
 * This function should be called before executing any MCP tools.
 * 
 * @param {string} profileId - Profile ID from authenticated session
 * @returns {Promise<boolean>} True if user is authenticated
 * @throws {Error} If authentication validation fails
 */
export async function validateAuthentication(profileId: string): Promise<boolean> {
  if (!profileId) {
    throw new Error("Profile ID is required");
  }

  try {
    // Verify the profile exists and is active
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("id, status")
      .eq("id", profileId)
      .eq("status", "active")
      .single();

    if (error || !profile) {
      throw new Error("Invalid or inactive user profile");
    }

    return true;
  } catch (error) {
    throw new Error("Authentication validation failed");
  }
}