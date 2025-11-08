# AI Chat User Guide

## How to Access the AI Assistant

### From Home Screen
1. Log in to your Banb account
2. Navigate to the home screen
3. Look for the "Ask BANB" button in the bottom navigation bar (center button with BANB icon)
4. Click the button to open the AI chat

### From Direct URL
- Navigate to `/ai-assistant` for a full-screen chat experience
- Navigate to `/test-mcp` for testing and debugging

## First-Time Setup

When you first use the AI assistant:
1. A consent dialog will appear
2. Read the privacy information
3. Click "Allow" to grant consent
4. The chat interface will open

Your consent is saved and you won't see this dialog again.

## What You Can Ask

### Balance & Account Information
- "What's my balance?"
- "Show me my current balance"
- "How much money do I have?"

### Transaction History
- "Show my recent transactions"
- "What are my last 5 transactions?"
- "Who did I send money to recently?"

### Spending Analysis
- "Analyze my spending"
- "What are my spending patterns?"
- "Who do I send money to most often?"
- "Show me my spending trends"

### Investment Information
- "What investment options are available?"
- "Show me investment opportunities"
- "What are the APR rates?"
- "Tell me about the investment vaults"

### Recipients & Friends
- "Who are my saved recipients?"
- "Show me my friends list"
- "How much have I sent to [name]?"

## Features

### Suggested Prompts
When you first open the chat, you'll see suggested questions you can click:
- "Analyze my spending this month"
- "Who do I send money to most often?"
- "Show my balance trend"

### Real-Time Data
The AI assistant has access to your real account data:
- Current USDC balance
- Transaction history
- Saved recipients
- Investment options
- Spending patterns

### Smart Insights
The AI can provide:
- Spending trend analysis (increasing/decreasing/stable)
- Top recipients by amount sent
- Average transaction amounts
- Total spending summaries

### Operation Suggestions
The AI can suggest operations like:
- "I can send $50 to Alice for you. Would you like me to proceed?"

When the AI suggests an operation, you'll see a confirmation dialog before anything is executed.

## Tips for Best Results

### Be Specific
- ❌ "Tell me about my account"
- ✅ "Show me my balance and recent transactions"

### Ask Follow-Up Questions
- After getting your balance, ask "How does this compare to last month?"
- After seeing transactions, ask "Who did I send the most money to?"

### Use Natural Language
- You don't need to use specific commands
- Ask questions as you would to a human assistant
- The AI understands context and intent

## Privacy & Security

### What the AI Can Access
- Your balance (from database)
- Your transaction history
- Your saved recipients
- Available investment options
- Your spending patterns

### What the AI Cannot Do
- Execute transactions without your confirmation
- Access other users' data
- Modify your account settings
- Share your data with third parties

### Data Usage
- All conversations are processed through OpenAI's API
- Operation logs are stored in the database for audit purposes
- Your consent can be revoked at any time

## Troubleshooting

### "Authentication Required" Message
- Make sure you're logged in
- Try refreshing the page
- Check your internet connection

### AI Not Responding
- Check your internet connection
- Try sending the message again
- If the issue persists, contact support

### Incorrect Information
- The AI uses real-time data from your account
- If information seems wrong, verify it in your transaction history
- Report any discrepancies to support

### Chat Won't Open
- Make sure you've granted consent
- Try refreshing the page
- Clear your browser cache
- Check browser console for errors

## Example Conversations

### Example 1: Balance Check
**You**: What's my balance?

**BANB AI**: Your current USDC balance is $1,234.56. You have this amount available in your main spending account on the Base network.

### Example 2: Spending Analysis
**You**: Analyze my spending this month

**BANB AI**: Based on your recent transactions, you've spent a total of $450.00 this month. Your top recipient is Alice ($200.00), followed by Bob ($150.00). Your average transaction is $45.00, and your spending has been stable compared to previous periods.

### Example 3: Investment Options
**You**: What investment options are available?

**BANB AI**: You have access to 3 investment vaults:

1. **Spark USDC Vault** - 6.55% APR
   - Lending against low-risk crypto and RWAs
   - Curated by SparkDAO

2. **Steakhouse USDC Vault** - 5.59% APR
   - Optimizes yields across blue chip crypto and RWA markets

3. **Seamless USDC Vault** - 6.99% APR
   - Risk-adjusted yield on Base network
   - Curated by Gauntlet

Would you like more details about any of these options?

### Example 4: Transaction History
**You**: Show my recent transactions

**BANB AI**: Here are your 3 most recent transactions:

1. $50.00 to Alice - Jan 15, 2024 (Confirmed)
2. $25.00 to Bob - Jan 14, 2024 (Confirmed)
3. $100.00 to Charlie - Jan 13, 2024 (Confirmed)

All transactions were sent in USDC on the Base network.

## Advanced Features

### Voice Input (Test Page Only)
- Navigate to `/test-mcp`
- Click the microphone button
- Speak your question
- The AI will respond with text-to-speech

### Quick Questions (Test Page Only)
- Pre-defined question buttons for common queries
- One-click access to frequently asked questions
- Faster than typing for common requests

### Raw API Responses (Test Page Only)
- View the raw JSON responses from the API
- Useful for debugging and understanding data structure
- Shows MCP tool execution details

## Getting Help

If you need assistance:
1. Check this guide for common questions
2. Try the test page at `/test-mcp` for debugging
3. Check the browser console for error messages
4. Contact support with specific error details

## Feedback

We're constantly improving the AI assistant. If you have:
- Feature requests
- Bug reports
- Suggestions for improvement
- Questions not covered in this guide

Please reach out to our support team or submit feedback through the app.
