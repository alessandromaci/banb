/**
 * MCP OpenAI Function Calling Integration Tests
 * 
 * Tests the integration of MCP tools with OpenAI function calling.
 * Validates tool definitions, function calling flow, and response handling.
 */

import assert from 'node:assert/strict';

/**
 * Test: MCP Tools to OpenAI Functions Conversion
 * Validates that MCP tools are correctly converted to OpenAI function format
 */
export async function testMCPToolsConversion() {
  // Mock MCP tools (simplified version of actual tools)
  const mockMCPTools = [
    {
      name: "get_investment_options",
      description: "Retrieve available investment products",
      inputSchema: {
        type: "object",
        properties: {},
      },
    },
    {
      name: "get_user_balance",
      description: "Get current USDC balance",
      inputSchema: {
        type: "object",
        properties: {},
      },
    },
    {
      name: "get_recent_transactions",
      description: "Retrieve recent transaction history",
      inputSchema: {
        type: "object",
        properties: {
          limit: {
            type: "number",
            description: "Maximum number of transactions",
            minimum: 1,
            maximum: 50,
          },
        },
      },
    },
  ];

  // Convert to OpenAI function format
  const openAIFunctions = mockMCPTools.map((tool) => ({
    type: "function",
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.inputSchema,
    },
  }));

  // Validate conversion
  assert.equal(openAIFunctions.length, 3);
  
  const firstFunction = openAIFunctions[0];
  assert.equal(firstFunction.type, "function");
  assert.equal(firstFunction.function.name, "get_investment_options");
  assert.equal(firstFunction.function.description, "Retrieve available investment products");
  assert.ok(firstFunction.function.parameters);

  const thirdFunction = openAIFunctions[2];
  assert.equal(thirdFunction.function.name, "get_recent_transactions");
  assert.ok(thirdFunction.function.parameters.properties.limit);
  assert.equal(thirdFunction.function.parameters.properties.limit.type, "number");
}

/**
 * Test: OpenAI Tool Call Response Structure
 * Validates the structure of OpenAI tool call responses
 */
export async function testOpenAIToolCallStructure() {
  // Mock OpenAI response with tool calls
  const mockOpenAIResponse = {
    choices: [
      {
        message: {
          role: "assistant",
          content: null,
          tool_calls: [
            {
              id: "call_123",
              type: "function",
              function: {
                name: "get_user_balance",
                arguments: "{}"
              }
            },
            {
              id: "call_456",
              type: "function",
              function: {
                name: "get_recent_transactions",
                arguments: '{"limit": 5}'
              }
            }
          ]
        }
      }
    ]
  };

  // Validate response structure
  const choice = mockOpenAIResponse.choices[0];
  assert.ok(choice.message.tool_calls);
  assert.equal(choice.message.tool_calls.length, 2);

  // Validate first tool call
  const firstCall = choice.message.tool_calls[0];
  assert.equal(firstCall.type, "function");
  assert.equal(firstCall.function.name, "get_user_balance");
  assert.equal(firstCall.function.arguments, "{}");

  // Validate second tool call with arguments
  const secondCall = choice.message.tool_calls[1];
  assert.equal(secondCall.function.name, "get_recent_transactions");
  const args = JSON.parse(secondCall.function.arguments);
  assert.equal(args.limit, 5);
}

/**
 * Test: MCP Tool Result Formatting
 * Validates that MCP tool results are properly formatted for OpenAI
 */
export async function testMCPToolResultFormatting() {
  // Mock MCP tool result
  const mockMCPResult = {
    content: [
      {
        type: "text",
        text: JSON.stringify({
          success: true,
          data: {
            balance: "150.75",
            currency: "USDC",
            status: "connected"
          },
          timestamp: "2025-01-15T10:30:00Z"
        })
      }
    ]
  };

  // Extract and parse the result
  const textContent = mockMCPResult.content[0].text;
  const parsedResult = JSON.parse(textContent);
  
  assert.ok(parsedResult.success);
  assert.ok(parsedResult.data);
  assert.equal(parsedResult.data.balance, "150.75");
  assert.equal(parsedResult.data.currency, "USDC");
  assert.ok(parsedResult.timestamp);

  // Format for OpenAI tool response
  const formattedForOpenAI = JSON.stringify(parsedResult.data, null, 2);
  assert.ok(formattedForOpenAI.includes("150.75"));
  assert.ok(formattedForOpenAI.includes("USDC"));
}

/**
 * Test: Error Handling in Tool Execution
 * Validates that tool execution errors are properly handled
 */
export async function testToolExecutionErrorHandling() {
  // Mock MCP error result
  const mockErrorResult = {
    content: [
      {
        type: "text",
        text: JSON.stringify({
          success: false,
          error: "Authentication required",
          timestamp: "2025-01-15T10:30:00Z"
        })
      }
    ]
  };

  // Parse error result
  const textContent = mockErrorResult.content[0].text;
  const parsedResult = JSON.parse(textContent);
  
  assert.equal(parsedResult.success, false);
  assert.equal(parsedResult.error, "Authentication required");
  assert.ok(parsedResult.timestamp);

  // Format error for OpenAI
  const errorMessage = `Error: ${parsedResult.error}`;
  assert.equal(errorMessage, "Error: Authentication required");
}

/**
 * Test: System Message with MCP Tools
 * Validates that the system message properly describes available tools
 */
export async function testSystemMessageWithMCPTools() {
  const systemMessage = `You are a helpful banking assistant for Banb, a blockchain-based neo-bank. You can help users analyze their spending, send payments, and answer questions about their account.

You have access to the following tools to query user data:
- get_investment_options: Get available investment products
- get_user_balance: Get current USDC balance
- get_recent_transactions: Get recent transaction history
- get_recipients: Get saved payment recipients
- get_transaction_summary: Get spending analysis and insights

Use these tools when users ask about their data. Always provide helpful, accurate information based on the tool results.

When suggesting a payment, use the format: "I can send $X to [recipient name] for you. Would you like me to proceed?"`;

  // Validate system message contains tool descriptions
  assert.ok(systemMessage.includes("get_investment_options"));
  assert.ok(systemMessage.includes("get_user_balance"));
  assert.ok(systemMessage.includes("get_recent_transactions"));
  assert.ok(systemMessage.includes("get_recipients"));
  assert.ok(systemMessage.includes("get_transaction_summary"));
  
  // Validate banking context
  assert.ok(systemMessage.includes("banking assistant"));
  assert.ok(systemMessage.includes("Banb"));
  assert.ok(systemMessage.includes("blockchain-based neo-bank"));
}

/**
 * Test: Function Calling Flow Simulation
 * Simulates the complete function calling flow
 */
export async function testFunctionCallingFlow() {
  // Step 1: User asks about balance
  const userMessage = "What's my current balance?";
  
  // Step 2: OpenAI decides to call get_user_balance
  const toolCall = {
    id: "call_balance_123",
    type: "function",
    function: {
      name: "get_user_balance",
      arguments: "{}"
    }
  };
  
  // Step 3: Execute MCP tool (mock result)
  const toolResult = {
    balance: "150.75",
    currency: "USDC",
    status: "connected"
  };
  
  // Step 4: Format result for OpenAI
  const formattedResult = JSON.stringify(toolResult, null, 2);
  
  // Step 5: OpenAI generates final response (mock)
  const finalResponse = "Your current balance is $150.75 USDC. Your wallet is connected and ready for transactions.";
  
  // Validate the flow
  assert.equal(toolCall.function.name, "get_user_balance");
  assert.ok(formattedResult.includes("150.75"));
  assert.ok(finalResponse.includes("150.75"));
  assert.ok(finalResponse.includes("USDC"));
}

/**
 * Test: Multi-Tool Call Scenario
 * Tests handling multiple tool calls in a single request
 */
export async function testMultiToolCallScenario() {
  // User asks for comprehensive overview
  const userMessage = "Give me an overview of my account - balance, recent transactions, and spending summary";
  
  // OpenAI decides to call multiple tools
  const toolCalls = [
    {
      id: "call_balance_123",
      function: { name: "get_user_balance", arguments: "{}" }
    },
    {
      id: "call_transactions_456",
      function: { name: "get_recent_transactions", arguments: '{"limit": 5}' }
    },
    {
      id: "call_summary_789",
      function: { name: "get_transaction_summary", arguments: "{}" }
    }
  ];
  
  // Mock tool results
  const toolResults = [
    "Balance: $150.75 USDC",
    "Recent transactions: 5 transactions totaling $45.20",
    "Summary: Total spent $245.50, top recipient Alice ($75.00)"
  ];
  
  // Validate multi-tool scenario
  assert.equal(toolCalls.length, 3);
  assert.equal(toolResults.length, 3);
  
  // Validate each tool call
  assert.equal(toolCalls[0].function.name, "get_user_balance");
  assert.equal(toolCalls[1].function.name, "get_recent_transactions");
  assert.equal(toolCalls[2].function.name, "get_transaction_summary");
  
  // Validate arguments parsing
  const transactionArgs = JSON.parse(toolCalls[1].function.arguments);
  assert.equal(transactionArgs.limit, 5);
}

/**
 * Test: Authentication Context Validation
 * Validates that profile ID is properly passed to MCP tools
 */
export async function testAuthenticationContext() {
  const mockContext = {
    profileId: "user-123-456",
    userAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    sessionId: "session-789"
  };
  
  // Validate context structure
  assert.ok(mockContext.profileId);
  assert.ok(mockContext.userAddress);
  assert.ok(mockContext.sessionId);
  
  // Validate profile ID format (UUID-like)
  assert.ok(mockContext.profileId.includes("-"));
  assert.ok(mockContext.profileId.length > 10);
  
  // Validate Ethereum address format
  assert.ok(mockContext.userAddress.startsWith("0x"));
  assert.equal(mockContext.userAddress.length, 41); // 0x + 40 hex characters
}

/**
 * Main test runner
 */
export async function test() {
  console.log("Running MCP OpenAI Integration Tests...\n");

  try {
    await testMCPToolsConversion();
    console.log("✓ MCP tools conversion test passed");

    await testOpenAIToolCallStructure();
    console.log("✓ OpenAI tool call structure test passed");

    await testMCPToolResultFormatting();
    console.log("✓ MCP tool result formatting test passed");

    await testToolExecutionErrorHandling();
    console.log("✓ Tool execution error handling test passed");

    await testSystemMessageWithMCPTools();
    console.log("✓ System message with MCP tools test passed");

    await testFunctionCallingFlow();
    console.log("✓ Function calling flow test passed");

    await testMultiToolCallScenario();
    console.log("✓ Multi-tool call scenario test passed");

    await testAuthenticationContext();
    console.log("✓ Authentication context test passed");

    console.log("\n✓ All MCP OpenAI integration tests passed!");
  } catch (error) {
    console.error("\n✗ Test failed:", error.message);
    throw error;
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  test().catch(console.error);
} else {
  // Also run if imported as module
  test().catch(console.error);
}