# MCP (Model Context Protocol) Setup Guide

This guide explains how to configure the MCP integration for AI-powered queries in Banb.

## Overview

The MCP integration allows users to ask natural language questions about their banking data through the AI chat interface. The AI can query investment options, balances, transactions, recipients, and spending patterns using structured tools.

## Prerequisites

- OpenAI API account and API key
- Banb application running with Supabase database configured
- User authentication working (profiles, sessions)

## Configuration

### 1. Environment Variables

Add the following to your `.env.local` file:

```bash
# AI Backend Configuration
# REQUIRED for MCP functionality: Must be set to "openai"
AI_PROVIDER=openai

# REQUIRED for MCP functionality: Must be a valid OpenAI API key
# Get from https://platform.openai.com/api-keys
AI_API_KEY=sk-your-actual-openai-api-key-here
```

### 2. OpenAI API Key Setup

1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Sign in or create an account
3. Click "Create new secret key"
4. Copy the key (starts with `sk-`)
5. Add it to your `.env.local` file as `AI_API_KEY`

**Important**: 
- Keep your API key secure and never commit it to version control
- The key should start with `sk-` for proper validation
- You'll need billing set up on your OpenAI account for API usage

### 3. Validation

The system automatically validates your configuration:

- ✅ `AI_PROVIDER` must be set to `"openai"`
- ✅ `AI_API_KEY` must be present and start with `sk-`
- ✅ API key must be valid (tested on first request)

If configuration is invalid, the AI will return mock responses with helpful error messages.

## Available MCP Tools

The following tools are available for AI queries:

### 1. `get_investment_options`
- **Purpose**: Retrieve available investment products
- **Returns**: Investment options with APR, risk level, and details
- **Example Query**: "What investments can I make?"

### 2. `get_user_balance`
- **Purpose**: Get current USDC balance
- **Returns**: Formatted balance with currency
- **Example Query**: "What's my balance?"

### 3. `get_recent_transactions`
- **Purpose**: Retrieve recent transaction history
- **Parameters**: `limit` (optional, default 10, max 50)
- **Returns**: Transactions with amounts, recipients, dates
- **Example Query**: "Show me my recent transactions"

### 4. `get_recipients`
- **Purpose**: Get saved payment recipients
- **Returns**: Recipients with names, addresses, and total amounts sent
- **Example Query**: "Who are my payment recipients?"

### 5. `get_transaction_summary`
- **Purpose**: Get spending analysis and insights
- **Returns**: Total spent, top recipients, trends, averages
- **Example Query**: "Analyze my spending patterns"

## Usage Examples

Once configured, users can ask natural language questions:

```
User: "What investments are available?"
AI: "You have 3 investment options available:
     1. Spark USDC Vault - 6.55% APR (Low Risk)
     2. Compound USDC - 4.2% APR (Low Risk)  
     3. Aave USDC Pool - 5.8% APR (Medium Risk)"

User: "How much have I spent this month?"
AI: "Based on your transaction history, you've spent $1,247.50 
     total. Your top recipient is Alice ($450.00), and your 
     spending has been increasing recently."

User: "Show my balance and recent payments"
AI: "Your current balance is $2,340.67 USDC. Your recent 
     transactions include: $50 to Bob on Jan 15, $25 to Alice 
     on Jan 14, $100 to Coffee Shop on Jan 13..."
```

## Troubleshooting

### Mock Responses

If you see responses starting with "⚠️ Configuration Issue:", check:

1. **AI_PROVIDER not set to openai**:
   ```
   AI_PROVIDER=openai  # Must be exactly "openai"
   ```

2. **Missing or invalid API key**:
   ```
   AI_API_KEY=sk-your-actual-key-here  # Must start with "sk-"
   ```

3. **API key format validation failed**:
   - Ensure the key starts with `sk-`
   - Check for extra spaces or characters
   - Verify you copied the complete key

### API Errors

- **401 Unauthorized**: API key is invalid or expired
- **429 Rate Limited**: Too many requests, try again later
- **500 Server Error**: Check server logs for details

### Development Mode

For development without an API key, set:
```bash
AI_API_KEY=your_ai_api_key
```

This will trigger mock responses with sample data.

## Security Considerations

- **Authentication**: All MCP tools require user authentication
- **Data Scoping**: Users can only access their own data
- **Privacy**: Wallet addresses are masked in responses
- **Rate Limiting**: 10 requests per minute per user
- **Audit Logging**: All MCP requests are logged for security

## API Endpoints

### MCP Protocol Endpoint
- **URL**: `POST /api/mcp`
- **Purpose**: Handle MCP protocol requests
- **Authentication**: Required (profile_id in context)

### AI Chat Endpoint  
- **URL**: `POST /api/ai/chat`
- **Purpose**: Process natural language queries with MCP integration
- **Authentication**: Required (profile_id in context)

## Development

### Testing MCP Tools

You can test MCP tools directly:

```bash
curl -X POST http://localhost:3000/api/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "method": "tools/list",
    "context": {"profileId": "user-123"}
  }'
```

### Adding New Tools

1. Define tool in `lib/mcp-server.ts` `MCP_TOOLS` array
2. Add handler function following existing patterns
3. Update tool execution switch statement
4. Add tests for the new tool

## Support

For issues with MCP setup:

1. Check the browser console for error messages
2. Verify environment variables are loaded correctly
3. Test API key with a simple OpenAI request
4. Check server logs for detailed error information

The system is designed to gracefully degrade to mock responses when configuration is incomplete, so users can still interact with the AI interface during setup.