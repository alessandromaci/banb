# Design Document

## Overview

This design adds Model Context Protocol (MCP) integration to the Banb application, enabling AI-powered natural language queries about user data through OpenAI's API. The MCP server exposes read-only tools that retrieve investment options, balances, transactions, and recipient data, allowing users to ask questions like "What investments can I make?" or "Show me my recent transactions" through the existing AI chat interface.

The implementation follows a simple MVP approach suitable for hackathon/demo purposes, with optional write operations (payments, investment actions) marked for future enhancement.

## Architecture

### High-Level Flow

```
User Query → AI Chat Interface → MCP Client → MCP Server → OpenAI API
                                      ↓
                                 Query Tools
                                      ↓
                            Application Database
                                      ↓
                              Formatted Response
                                      ↓
                            AI Chat Interface
```

### Component Layers

1. **MCP Server Layer** (`lib/mcp-server.ts`)
   - Implements MCP protocol specification
   - Exposes query tools for data retrieval
   - Handles authentication and authorization
   - Formats data for AI consumption

2. **API Route Layer** (`app/api/mcp/route.ts`)
   - HTTP endpoint for MCP requests
   - Session validation
   - Request/response transformation
   - Error handling and logging

3. **Integration Layer** (existing `app/api/ai/chat/route.ts`)
   - Modified to support MCP tool calls
   - Orchestrates OpenAI API with MCP tools
   - Manages conversation context

4. **Data Access Layer** (existing utilities)
   - Reuses existing functions from `lib/investments.ts`, `lib/transactions.ts`, `lib/recipients.ts`
   - No new database queries needed

## Components and Interfaces

### MCP Server

**File**: `lib/mcp-server.ts`

**Responsibilities**:
- Define MCP tools for querying app data
- Implement tool execution handlers
- Format responses for AI consumption
- Validate user authentication

**Key Interfaces**:

```typescript
interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: "object";
    properties: Record<string, unknown>;
    required?: string[];
  };
}

interface MCPToolResult {
  content: Array<{
    type: "text";
    text: string;
  }>;
}

interface MCPRequest {
  method: "tools/list" | "tools/call";
  params?: {
    name?: string;
    arguments?: Record<string, unknown>;
  };
}
```

**Exposed Tools** (MVP):

1. `get_investment_options`
   - Description: "Retrieve available investment products with APR, risk level, and details"
   - Input: None
   - Output: JSON array of investment options

2. `get_user_balance`
   - Description: "Get current USDC balance for the authenticated user"
   - Input: None (uses session profile_id)
   - Output: Balance string with currency

3. `get_recent_transactions`
   - Description: "Retrieve recent transaction history"
   - Input: `{ limit?: number }` (default 10, max 50)
   - Output: JSON array of transactions with recipient names

4. `get_recipients`
   - Description: "Get saved payment recipients"
   - Input: None
   - Output: JSON array of recipients with names and addresses

5. `get_transaction_summary`
   - Description: "Get spending analysis and patterns"
   - Input: None
   - Output: Summary with total spent, top recipients, trends

**Optional Tools** (Future):

6. `create_payment` (requires user confirmation)
7. `create_investment` (requires user confirmation)
8. `get_investment_recommendations` (personalized suggestions)

### API Route

**File**: `app/api/mcp/route.ts`

**Endpoints**:
- `POST /api/mcp` - Handle MCP protocol requests

**Request Flow**:
1. Validate authentication (extract profile_id from session)
2. Parse MCP request (tools/list or tools/call)
3. Execute tool handler
4. Format response per MCP spec
5. Return JSON response

**Error Handling**:
- 401: Unauthenticated requests
- 400: Invalid MCP request format
- 404: Unknown tool name
- 500: Tool execution failure

### AI Chat Integration

**File**: `app/api/ai/chat/route.ts` (modifications)

**Changes**:
1. Add MCP tool definitions to OpenAI system prompt
2. Enable function calling in OpenAI API request
3. Handle tool call responses from OpenAI
4. Execute MCP tools and inject results back into conversation
5. Return final AI response with tool data

**OpenAI Function Calling Flow**:
```
User: "What investments can I make?"
  ↓
OpenAI decides to call: get_investment_options()
  ↓
Execute MCP tool → Fetch investment data
  ↓
Inject tool result into OpenAI conversation
  ↓
OpenAI generates natural language response
  ↓
Return: "You can invest in 3 options: Spark USDC Vault (6.55% APR)..."
```

## Data Models

### MCP Tool Registry

```typescript
const MCP_TOOLS: MCPTool[] = [
  {
    name: "get_investment_options",
    description: "Retrieve available investment products...",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  // ... other tools
];
```

### Tool Execution Context

```typescript
interface ToolExecutionContext {
  profileId: string;
  userAddress?: string;
  sessionId?: string;
}
```

### Tool Response Format

All tools return data in a consistent format:

```typescript
{
  content: [
    {
      type: "text",
      text: JSON.stringify({
        success: true,
        data: { /* tool-specific data */ },
        timestamp: "2025-01-15T10:30:00Z"
      })
    }
  ]
}
```

## Error Handling

### Authentication Errors

- **Scenario**: User not authenticated
- **Response**: 401 with message "Authentication required"
- **Logging**: Log attempt with IP and timestamp

### Tool Execution Errors

- **Scenario**: Database query fails
- **Response**: Return error in tool result format
- **Logging**: Log error with stack trace
- **Fallback**: Return empty data set with error flag

### OpenAI API Errors

- **Scenario**: API key invalid or rate limit exceeded
- **Response**: Return graceful error message to user
- **Logging**: Log API error details
- **Fallback**: Use mock response or suggest retry

### Data Validation Errors

- **Scenario**: Invalid tool arguments
- **Response**: 400 with validation error details
- **Logging**: Log invalid request
- **Fallback**: None (reject request)

## Testing Strategy

### Unit Tests

**File**: `tests/mcp-server.test.mjs`

Test cases:
1. Tool registration and listing
2. Tool execution with valid inputs
3. Tool execution with invalid inputs
4. Authentication validation
5. Data formatting

### Integration Tests

**File**: `tests/mcp-integration.test.mjs`

Test cases:
1. End-to-end MCP request flow
2. OpenAI function calling with MCP tools
3. Multi-tool conversation scenarios
4. Error handling across layers
5. Session management

### Manual Testing

Test scenarios:
1. Ask about investment options
2. Query balance and transactions
3. Ask about recipients
4. Request spending analysis
5. Test with unauthenticated session
6. Test with missing API key

## Configuration

### Environment Variables

Required:
- `AI_API_KEY` - OpenAI API key (existing)
- `AI_PROVIDER` - Set to "openai" (existing)

Optional:
- `MCP_ENABLE_WRITE_TOOLS` - Enable optional write operations (default: false)
- `MCP_LOG_LEVEL` - Logging verbosity (default: "info")

### OpenAI Configuration

Model: `gpt-4` or `gpt-4-turbo`
Function calling: Enabled
Max tokens: 500 (existing)
Temperature: 0.7 (existing)

## Security Considerations

### Authentication

- All MCP requests require valid session
- Profile ID extracted from authenticated session
- No cross-user data access

### Data Exposure

- Only expose user's own data
- Mask sensitive information (full wallet addresses)
- Limit transaction history to recent items
- No exposure of internal IDs in responses

### Rate Limiting

- Reuse existing rate limiting (10 requests/minute)
- Apply to MCP endpoint
- Track by profile_id

### Input Validation

- Validate all tool arguments
- Sanitize user input (existing sanitization)
- Limit query result sizes
- Prevent SQL injection (using Supabase client)

## Performance Considerations

### Caching

- Cache investment options (static data)
- Cache user balance for 30 seconds
- No caching for transactions (real-time data)

### Query Optimization

- Limit transaction queries to 50 max
- Use existing database indexes
- Fetch only required fields
- Parallel data fetching where possible

### Response Size

- Limit tool responses to 2KB max
- Paginate large result sets
- Summarize verbose data

## Deployment

### Prerequisites

1. OpenAI API key configured in `.env.local`
2. Existing Supabase connection working
3. AI chat interface deployed

### Deployment Steps

1. Deploy MCP server code (`lib/mcp-server.ts`)
2. Deploy API route (`app/api/mcp/route.ts`)
3. Update AI chat route with MCP integration
4. Test with sample queries
5. Monitor logs for errors

### Rollback Plan

- MCP integration is additive (no breaking changes)
- Can disable by removing MCP tool definitions from OpenAI prompt
- Existing AI chat continues to work without MCP

## Future Enhancements (Optional)

### Write Operations

- Enable `create_payment` tool with confirmation dialog
- Enable `create_investment` tool with confirmation dialog
- Add transaction approval workflow

### Advanced Queries

- Investment performance tracking
- Spending predictions
- Budget recommendations
- Comparative analysis

### Personalization

- Risk profile-based recommendations
- Learning from user preferences
- Contextual suggestions

### Multi-Modal

- Chart generation for spending trends
- Visual investment comparisons
- Transaction timeline visualization

## Dependencies

### Existing Dependencies (No Changes)

- `@supabase/supabase-js` - Database access
- `next` - API routes
- OpenAI API - AI processing

### New Dependencies (None Required)

The MCP implementation uses standard HTTP and JSON, requiring no additional packages.

## Migration Path

### Phase 1: MVP (Current Spec)

- Implement read-only MCP tools
- Integrate with OpenAI function calling
- Basic error handling and logging

### Phase 2: Enhanced Queries (Optional)

- Add investment recommendations
- Implement spending predictions
- Add comparative analysis tools

### Phase 3: Write Operations (Optional)

- Enable payment creation with confirmation
- Enable investment creation with confirmation
- Add approval workflow

### Phase 4: Advanced Features (Optional)

- Multi-modal responses (charts, visualizations)
- Proactive notifications
- Personalized insights
