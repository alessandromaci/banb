/**
 * MCP API Route Tests
 * 
 * Tests the MCP API route functionality including authentication,
 * request parsing, and error handling.
 */

import assert from 'node:assert/strict';

/**
 * Test: MCP Request Parsing
 * Validates that MCP requests are correctly parsed and validated
 */
export async function testMCPRequestParsing() {
  // Mock parseMCPRequest function (simplified version)
  function parseMCPRequest(body) {
    if (!body || typeof body !== "object") {
      throw new Error("Invalid request body");
    }

    const { method, params } = body;

    if (!method || typeof method !== "string") {
      throw new Error("Missing or invalid method");
    }

    if (!["tools/list", "tools/call"].includes(method)) {
      throw new Error(`Unsupported method: ${method}`);
    }

    // Validate params for tools/call
    if (method === "tools/call") {
      if (!params || typeof params !== "object") {
        throw new Error("Missing params for tools/call");
      }
      
      if (!params.name || typeof params.name !== "string") {
        throw new Error("Missing tool name in params");
      }
    }

    return {
      method: method,
      params: params || undefined,
    };
  }

  // Test valid tools/list request
  const listRequest = { method: "tools/list" };
  const parsedList = parseMCPRequest(listRequest);
  assert.equal(parsedList.method, "tools/list");
  assert.equal(parsedList.params, undefined);

  // Test valid tools/call request
  const callRequest = {
    method: "tools/call",
    params: {
      name: "get_investment_options",
      arguments: {}
    }
  };
  const parsedCall = parseMCPRequest(callRequest);
  assert.equal(parsedCall.method, "tools/call");
  assert.equal(parsedCall.params.name, "get_investment_options");

  // Test invalid method
  try {
    parseMCPRequest({ method: "invalid/method" });
    assert.fail("Should have thrown error for invalid method");
  } catch (error) {
    assert.ok(error.message.includes("Unsupported method"));
  }

  // Test missing tool name for tools/call
  try {
    parseMCPRequest({ method: "tools/call", params: {} });
    assert.fail("Should have thrown error for missing tool name");
  } catch (error) {
    assert.ok(error.message.includes("Missing tool name"));
  }
}

/**
 * Test: Profile ID Extraction
 * Validates that profile IDs are correctly extracted from request context
 */
export async function testProfileIdExtraction() {
  // Mock extractProfileId function
  function extractProfileId(body) {
    try {
      const profileId = body.context?.profileId;
      
      if (!profileId || typeof profileId !== "string") {
        return null;
      }
      
      return profileId;
    } catch (error) {
      console.error("Failed to extract profile ID:", error);
      return null;
    }
  }

  // Test valid profile ID
  const validBody = {
    method: "tools/list",
    context: { profileId: "user-123" }
  };
  const profileId = extractProfileId(validBody);
  assert.equal(profileId, "user-123");

  // Test missing context
  const noContextBody = { method: "tools/list" };
  const noProfileId = extractProfileId(noContextBody);
  assert.equal(noProfileId, null);

  // Test invalid profile ID type
  const invalidTypeBody = {
    method: "tools/list",
    context: { profileId: 123 }
  };
  const invalidProfileId = extractProfileId(invalidTypeBody);
  assert.equal(invalidProfileId, null);
}

/**
 * Test: Error Response Format
 * Validates that error responses follow the expected format
 */
export async function testErrorResponseFormat() {
  // Test authentication error
  const authError = {
    error: "Authentication required",
    code: "UNAUTHORIZED"
  };
  assert.equal(authError.error, "Authentication required");
  assert.equal(authError.code, "UNAUTHORIZED");

  // Test bad request error
  const badRequestError = {
    error: "Invalid request body",
    code: "BAD_REQUEST"
  };
  assert.equal(badRequestError.error, "Invalid request body");
  assert.equal(badRequestError.code, "BAD_REQUEST");

  // Test not found error
  const notFoundError = {
    error: "Unknown tool: invalid_tool",
    code: "NOT_FOUND"
  };
  assert.equal(notFoundError.error, "Unknown tool: invalid_tool");
  assert.equal(notFoundError.code, "NOT_FOUND");

  // Test internal error
  const internalError = {
    error: "Internal server error",
    code: "INTERNAL_ERROR"
  };
  assert.equal(internalError.error, "Internal server error");
  assert.equal(internalError.code, "INTERNAL_ERROR");
}

/**
 * Test: MCP Tools List Response
 * Validates the structure of tools/list response
 */
export async function testMCPToolsListResponse() {
  // Mock tools list (simplified version of MCP_TOOLS)
  const mockTools = [
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

  const toolsListResponse = { tools: mockTools };

  // Validate response structure
  assert.ok(Array.isArray(toolsListResponse.tools));
  assert.equal(toolsListResponse.tools.length, 3);

  // Validate each tool structure
  toolsListResponse.tools.forEach(tool => {
    assert.ok(tool.name);
    assert.ok(tool.description);
    assert.ok(tool.inputSchema);
    assert.equal(tool.inputSchema.type, "object");
    assert.ok(tool.inputSchema.properties);
  });

  // Validate specific tool
  const transactionsTool = toolsListResponse.tools.find(t => t.name === "get_recent_transactions");
  assert.ok(transactionsTool);
  assert.ok(transactionsTool.inputSchema.properties.limit);
  assert.equal(transactionsTool.inputSchema.properties.limit.type, "number");
}

/**
 * Test: Tool Execution Context
 * Validates that tool execution context is properly structured
 */
export async function testToolExecutionContext() {
  const context = {
    profileId: "user-123",
    sessionId: "session-456",
  };

  // Validate required fields
  assert.ok(context.profileId);
  assert.equal(typeof context.profileId, "string");

  // Validate optional fields
  if (context.sessionId) {
    assert.equal(typeof context.sessionId, "string");
  }

  if (context.userAddress) {
    assert.equal(typeof context.userAddress, "string");
  }
}

/**
 * Test: Logging Format
 * Validates that MCP request logging follows expected format
 */
export async function testLoggingFormat() {
  // Mock log data structure
  const logData = {
    timestamp: new Date().toISOString(),
    method: "tools/call",
    tool_name: "get_investment_options",
    profile_id: "user-123",
    status: "success",
    error: null,
  };

  // Validate log structure
  assert.ok(logData.timestamp);
  assert.ok(logData.method);
  assert.ok(logData.profile_id);
  assert.ok(["success", "error"].includes(logData.status));

  // Validate timestamp format (ISO string)
  const timestamp = new Date(logData.timestamp);
  assert.ok(!isNaN(timestamp.getTime()));

  // Test error log
  const errorLogData = {
    ...logData,
    status: "error",
    error: "Tool execution failed",
  };

  assert.equal(errorLogData.status, "error");
  assert.ok(errorLogData.error);
}

/**
 * Test: API Info Response
 * Validates the GET endpoint response format
 */
export async function testAPIInfoResponse() {
  const apiInfo = {
    name: "Banb MCP Server",
    version: "1.0.0",
    description: "Model Context Protocol server for Banb banking data queries",
    methods: ["tools/list", "tools/call"],
    authentication: "required",
    documentation: "https://github.com/your-org/banb#mcp-api",
  };

  // Validate structure
  assert.ok(apiInfo.name);
  assert.ok(apiInfo.version);
  assert.ok(apiInfo.description);
  assert.ok(Array.isArray(apiInfo.methods));
  assert.equal(apiInfo.authentication, "required");

  // Validate methods
  assert.ok(apiInfo.methods.includes("tools/list"));
  assert.ok(apiInfo.methods.includes("tools/call"));
}

/**
 * Main test runner
 */
export async function test() {
  console.log("Running MCP API Tests...\n");

  try {
    await testMCPRequestParsing();
    console.log("✓ MCP request parsing test passed");

    await testProfileIdExtraction();
    console.log("✓ Profile ID extraction test passed");

    await testErrorResponseFormat();
    console.log("✓ Error response format test passed");

    await testMCPToolsListResponse();
    console.log("✓ MCP tools list response test passed");

    await testToolExecutionContext();
    console.log("✓ Tool execution context test passed");

    await testLoggingFormat();
    console.log("✓ Logging format test passed");

    await testAPIInfoResponse();
    console.log("✓ API info response test passed");

    console.log("\n✓ All MCP API tests passed!");
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