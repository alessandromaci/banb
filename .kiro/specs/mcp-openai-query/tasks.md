# Implementation Plan

- [x] 1. Create MCP server implementation




  - Implement MCP protocol handler with tools/list and tools/call methods
  - Define tool registry with 5 read-only query tools (get_investment_options, get_user_balance, get_recent_transactions, get_recipients, get_transaction_summary)
  - Implement tool execution handlers that call existing data access functions
  - Add authentication validation using profile_id from context
  - Format tool responses according to MCP specification
  - _Requirements: 1.1, 2.1, 3.1, 4.1, 5.1_

- [x] 2. Create MCP API route





  - Create POST endpoint at /api/mcp for handling MCP requests
  - Implement session validation to extract profile_id
  - Add request parsing for tools/list and tools/call methods
  - Implement error handling for 401, 400, 404, and 500 status codes
  - Add logging for all MCP requests and tool executions
  - _Requirements: 4.2, 4.4, 5.2, 5.3, 5.5_

- [x] 3. Integrate MCP with OpenAI function calling






  - Modify /api/ai/chat route to include MCP tool definitions in OpenAI system prompt
  - Enable function_call parameter in OpenAI API request
  - Implement tool call detection from OpenAI response
  - Execute MCP tools when OpenAI requests them
  - Inject tool results back into OpenAI conversation for final response generation
  - _Requirements: 1.3, 1.4, 2.4, 3.4_

- [x] 4. Implement tool execution handlers





- [x] 4.1 Implement get_investment_options tool



  - Call getInvestmentOptions() from lib/investments.ts
  - Format investment data with name, description, APR, type, and vault address
  - Return JSON array in MCP response format
  - _Requirements: 1.1, 1.2_

- [x] 4.2 Implement get_user_balance tool



  - Accept profile_id from execution context
  - Fetch USDC balance using existing useUSDCBalance logic
  - Format balance with currency symbol
  - Handle cases where wallet is not connected
  - _Requirements: 2.1, 2.5_

- [x] 4.3 Implement get_recent_transactions tool



  - Accept optional limit parameter (default 10, max 50)
  - Call getRecentTransactions() with profile_id
  - Include transaction amount, recipient name, date, and status
  - Mask full wallet addresses for privacy
  - _Requirements: 2.2, 2.3, 5.4_

- [x] 4.4 Implement get_recipients tool



  - Call getRecipientsByProfile() with profile_id
  - Return recipient names and masked addresses
  - Calculate total amounts sent to each recipient from transaction history
  - _Requirements: 3.1, 3.2_

- [x] 4.5 Implement get_transaction_summary tool



  - Call getPortfolioInsights() with profile_id
  - Return total spent, top recipients, spending trend, and average transaction
  - Format insights in natural language-friendly structure
  - _Requirements: 3.3, 3.4_

- [x] 5. Add configuration and environment setup


  - Document AI_API_KEY requirement in .env.local
  - Add validation for AI_PROVIDER="openai" setting
  - Implement graceful error handling when API key is missing
  - Add configuration documentation to README or setup guide
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 6. Write unit tests for MCP server


  - Test tool registration and listing
  - Test each tool execution handler with valid inputs
  - Test authentication validation
  - Test error handling for invalid inputs
  - Test data formatting and response structure
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [x] 7. Write integration tests




  - Test end-to-end MCP request flow through API route
  - Test OpenAI function calling with MCP tools
  - Test multi-tool conversation scenarios
  - Test error handling across all layers
  - Test with unauthenticated sessions
  - _Requirements: 1.4, 2.4, 3.4, 5.2, 5.5_
