/**
 * @fileoverview MCP (Model Context Protocol) API route for handling MCP requests.
 * Provides a POST endpoint that processes MCP protocol requests for AI-powered queries.
 * Handles authentication, request parsing, tool execution, and error responses.
 */

import { NextRequest, NextResponse } from "next/server";
import { 
  handleMCPRequest, 
  validateAuthentication,
  type MCPRequest,
  type ToolExecutionContext 
} from "@/lib/mcp-server";

/**
 * Extracts profile_id from the request body context.
 * In production, this would extract from authenticated session/JWT token.
 * For now, expects profile_id in request body context.
 * 
 * @param {unknown} body - Parsed request body
 * @returns {string | null} Profile ID if authenticated, null otherwise
 */
function extractProfileId(body: unknown): string | null {
  try {
    // Type guard to check if body is an object with context property
    if (!body || typeof body !== "object" || body === null) {
      return null;
    }
    
    const bodyObj = body as { context?: { profileId?: unknown } };
    const profileId = bodyObj.context?.profileId;
    
    if (!profileId || typeof profileId !== "string") {
      return null;
    }
    
    return profileId;
  } catch (error) {
    console.error("Failed to extract profile ID:", error);
    return null;
  }
}

/**
 * Parses and validates MCP request format.
 * Ensures the request follows MCP protocol specification.
 * 
 * @param {unknown} body - Request body to parse
 * @returns {MCPRequest} Parsed MCP request
 * @throws {Error} If request format is invalid
 */
function parseMCPRequest(body: unknown): MCPRequest {
  if (!body || typeof body !== "object" || body === null) {
    throw new Error("Invalid request body");
  }

  const bodyObj = body as { method?: unknown; params?: unknown };
  const { method, params } = bodyObj;

  if (!method || typeof method !== "string") {
    throw new Error("Missing or invalid method");
  }

  if (!["tools/list", "tools/call"].includes(method)) {
    throw new Error(`Unsupported method: ${method}`);
  }

  // Validate params for tools/call
  if (method === "tools/call") {
    if (!params || typeof params !== "object" || params === null) {
      throw new Error("Missing params for tools/call");
    }
    
    const paramsObj = params as { name?: unknown; arguments?: unknown };
    if (!paramsObj.name || typeof paramsObj.name !== "string") {
      throw new Error("Missing tool name in params");
    }
  }

  return {
    method: method as "tools/list" | "tools/call",
    params: params || undefined,
  };
}

/**
 * Logs MCP request for audit and debugging purposes.
 * Includes request method, tool name, profile ID, and timestamp.
 * 
 * @param {MCPRequest} request - MCP request to log
 * @param {string} profileId - Authenticated user's profile ID
 * @param {string} status - Request status (success/error)
 * @param {string} [error] - Error message if request failed
 */
function logMCPRequest(
  request: MCPRequest, 
  profileId: string, 
  status: "success" | "error",
  error?: string
): void {
  const logData = {
    timestamp: new Date().toISOString(),
    method: request.method,
    tool_name: request.params?.name || null,
    profile_id: profileId,
    status,
    error: error || null,
  };

  if (status === "error") {
    console.error("MCP Request Failed:", logData);
  } else {
    console.log("MCP Request:", logData);
  }
}

/**
 * POST /api/mcp
 * Handles MCP protocol requests for AI-powered data queries.
 * 
 * Request format:
 * ```json
 * {
 *   "method": "tools/list" | "tools/call",
 *   "params": { "name": "tool_name", "arguments": {...} },
 *   "context": { "profileId": "user-id" }
 * }
 * ```
 * 
 * Response format follows MCP specification:
 * - tools/list: Returns available tools
 * - tools/call: Returns tool execution result
 * 
 * @param {NextRequest} request - Next.js request object
 * @returns {Promise<NextResponse>} MCP protocol response or error
 */
export async function POST(request: NextRequest) {
  let profileId: string | null = null;
  let mcpRequest: MCPRequest | null = null;

  try {
    // Parse request body once
    const body = await request.json();

    // Extract and validate authentication
    profileId = extractProfileId(body);
    if (!profileId) {
      return NextResponse.json(
        { 
          error: "Authentication required",
          code: "UNAUTHORIZED" 
        },
        { status: 401 }
      );
    }

    // Validate user authentication
    await validateAuthentication(profileId);

    // Parse MCP request from the same body
    mcpRequest = parseMCPRequest(body);

    // Create execution context
    const context: ToolExecutionContext = {
      profileId,
      sessionId: request.headers.get("x-session-id") || undefined,
    };

    // Execute MCP request
    const result = await handleMCPRequest(mcpRequest, context);

    // Log successful request
    logMCPRequest(mcpRequest, profileId, "success");

    // Return MCP protocol response
    return NextResponse.json(result);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    // Log failed request
    if (mcpRequest && profileId) {
      logMCPRequest(mcpRequest, profileId, "error", errorMessage);
    }

    // Handle specific error types
    if (errorMessage.includes("Authentication") || errorMessage.includes("Invalid or inactive")) {
      return NextResponse.json(
        { 
          error: "Authentication required",
          code: "UNAUTHORIZED" 
        },
        { status: 401 }
      );
    }

    if (errorMessage.includes("Invalid request") || errorMessage.includes("Missing") || errorMessage.includes("Unsupported method")) {
      return NextResponse.json(
        { 
          error: errorMessage,
          code: "BAD_REQUEST" 
        },
        { status: 400 }
      );
    }

    if (errorMessage.includes("Unknown tool")) {
      return NextResponse.json(
        { 
          error: errorMessage,
          code: "NOT_FOUND" 
        },
        { status: 404 }
      );
    }

    // Generic server error
    console.error("MCP API Error:", error);
    return NextResponse.json(
      { 
        error: "Internal server error",
        code: "INTERNAL_ERROR" 
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/mcp
 * Returns API information and available methods.
 * Useful for debugging and API discovery.
 */
export async function GET() {
  return NextResponse.json({
    name: "Banb MCP Server",
    version: "1.0.0",
    description: "Model Context Protocol server for Banb banking data queries",
    methods: ["tools/list", "tools/call"],
    authentication: "required",
    documentation: "https://github.com/your-org/banb#mcp-api",
  });
}