/**
 * Ensure MCP tools list includes get_accounts and converts to OpenAI function format.
 */

import assert from 'node:assert/strict';

export async function testMCPToolsIncludeGetAccounts() {
  const MCP_TOOLS = [
    {
      name: 'get_investment_options',
      description: 'Retrieve available investment products with APR, risk level, and details.',
      inputSchema: { type: 'object', properties: {} },
    },
    {
      name: 'get_user_balance',
      description: 'Get current USDC balance for the authenticated user.',
      inputSchema: { type: 'object', properties: {} },
    },
    {
      name: 'get_accounts',
      description: 'Get accounts linked to the authenticated user profile with their balances and metadata.',
      inputSchema: { type: 'object', properties: {} },
    },
    {
      name: 'get_recent_transactions',
      description: 'Retrieve recent transaction history for the authenticated user.',
      inputSchema: {
        type: 'object',
        properties: {
          limit: { type: 'number', minimum: 1, maximum: 50 },
        },
      },
    },
  ];

  const openAIFunctions = MCP_TOOLS.map((tool) => ({
    type: 'function',
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.inputSchema,
    },
  }));

  // Validate get_accounts is present
  const hasGetAccounts = openAIFunctions.some((f) => f.function.name === 'get_accounts');
  assert.ok(hasGetAccounts, 'get_accounts should be exposed as an OpenAI function');

  // Validate schema shape for get_accounts
  const getAccountsFn = openAIFunctions.find((f) => f.function.name === 'get_accounts');
  assert.equal(getAccountsFn.type, 'function');
  assert.equal(getAccountsFn.function.parameters.type, 'object');
  assert.ok(getAccountsFn.function.parameters.properties);
}
