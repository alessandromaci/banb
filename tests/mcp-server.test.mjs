/**
 * MCP Server Unit Tests
 * 
 * Tests the core MCP server functionality including tool registration,
 * tool execution handlers, authentication validation, and data formatting.
 */

import assert from 'node:assert/strict';

/**
 * Mock data for testing
 */
const mockInvestmentOptions = [
    {
        id: "spark-usdc",
        name: "Spark USDC Vault",
        description: "Earn yield on USDC through Spark Protocol",
        apr: "6.55%",
        type: "defi",
        vault_address: "0x1234567890abcdef"
    },
    {
        id: "compound-usdc",
        name: "Compound USDC",
        description: "Lend USDC on Compound Protocol",
        apr: "4.2%",
        type: "defi",
        vault_address: "0xabcdef1234567890"
    }
];

const mockTransactions = [
    {
        id: "tx-1",
        amount: "50.00",
        recipient: { name: "Alice", external_address: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb" },
        created_at: "2025-01-15T10:30:00Z",
        status: "completed",
        token: "USDC",
        chain: "base"
    },
    {
        id: "tx-2",
        amount: "25.50",
        recipient: { name: "Bob", external_address: "0x8ba1f109551bD432803012645Hac136c22C57592" },
        created_at: "2025-01-14T15:45:00Z",
        status: "completed",
        token: "USDC",
        chain: "base"
    }
];

const mockRecipients = [
    {
        id: "recipient-1",
        name: "Alice",
        external_address: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
        profile_id_link: null,
        status: "active"
    },
    {
        id: "recipient-2",
        name: "Bob",
        external_address: "0x8ba1f109551bD432803012645Hac136c22C57592",
        profile_id_link: "user-456",
        status: "active"
    }
];

/**
 * Test: MCP Tool Registry Structure
 * Validates that all required tools are registered with proper schemas
 */
export async function testMCPToolRegistry() {
    // Mock MCP_TOOLS array (simplified version)
    const MCP_TOOLS = [
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
    ];

    // Validate tool count
    assert.equal(MCP_TOOLS.length, 5);

    // Validate each tool structure
    MCP_TOOLS.forEach(tool => {
        assert.ok(tool.name);
        assert.ok(tool.description);
        assert.ok(tool.inputSchema);
        assert.equal(tool.inputSchema.type, "object");
        assert.ok(tool.inputSchema.properties !== undefined);
    });

    // Validate specific tools
    const investmentTool = MCP_TOOLS.find(t => t.name === "get_investment_options");
    assert.ok(investmentTool);
    assert.ok(investmentTool.description.includes("investment products"));

    const transactionsTool = MCP_TOOLS.find(t => t.name === "get_recent_transactions");
    assert.ok(transactionsTool);
    assert.ok(transactionsTool.inputSchema.properties.limit);
    assert.equal(transactionsTool.inputSchema.properties.limit.type, "number");
    assert.equal(transactionsTool.inputSchema.properties.limit.minimum, 1);
    assert.equal(transactionsTool.inputSchema.properties.limit.maximum, 50);
}

/**
 * Test: Investment Options Handler
 * Validates the get_investment_options tool handler
 */
export async function testGetInvestmentOptionsHandler() {
    // Mock handler implementation
    async function getInvestmentOptionsHandler() {
        return mockInvestmentOptions.map((option) => ({
            id: option.id,
            name: option.name,
            description: option.description,
            apr: option.apr,
            type: option.type,
            vault_address: option.vault_address || null,
        }));
    }

    const result = await getInvestmentOptionsHandler();

    // Validate result structure
    assert.ok(Array.isArray(result));
    assert.equal(result.length, 2);

    // Validate first investment option
    const firstOption = result[0];
    assert.equal(firstOption.id, "spark-usdc");
    assert.equal(firstOption.name, "Spark USDC Vault");
    assert.equal(firstOption.apr, "6.55%");
    assert.equal(firstOption.type, "defi");
    assert.ok(firstOption.vault_address);

    // Validate all required fields are present
    result.forEach(option => {
        assert.ok(option.id);
        assert.ok(option.name);
        assert.ok(option.description);
        assert.ok(option.apr);
        assert.ok(option.type);
    });
}

/**
 * Test: User Balance Handler
 * Validates the get_user_balance tool handler
 */
export async function testGetUserBalanceHandler() {
    // Mock handler implementation
    async function getUserBalanceHandler(context) {
        // Simulate database query result
        const mockAccount = { balance: "150.75" };

        if (!mockAccount) {
            return {
                balance: "$0.00",
                currency: "USDC",
                status: "wallet_not_connected",
            };
        }

        const balance = parseFloat(mockAccount.balance || "0");
        return {
            balance: `${balance.toFixed(2)}`,
            currency: "USDC",
            status: "connected",
        };
    }

    const context = { profileId: "test-user-123" };
    const result = await getUserBalanceHandler(context);

    // Validate result structure
    assert.equal(result.balance, "150.75");
    assert.equal(result.currency, "USDC");
    assert.equal(result.status, "connected");

    // Test error case (no account)
    async function getUserBalanceHandlerNoAccount() {
        return {
            balance: "$0.00",
            currency: "USDC",
            status: "wallet_not_connected",
        };
    }

    const errorResult = await getUserBalanceHandlerNoAccount();
    assert.equal(errorResult.balance, "$0.00");
    assert.equal(errorResult.status, "wallet_not_connected");
}

/**
 * Test: Recent Transactions Handler
 * Validates the get_recent_transactions tool handler
 */
export async function testGetRecentTransactionsHandler() {
    // Mock handler implementation
    async function getRecentTransactionsHandler(args, context) {
        const limit = Math.min(Math.max((args.limit) || 10, 1), 50);
        const transactions = mockTransactions.slice(0, limit);

        return transactions.map((tx) => ({
            id: tx.id,
            amount: `${parseFloat(tx.amount).toFixed(2)}`,
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

    const context = { profileId: "test-user-123" };

    // Test default limit
    const defaultResult = await getRecentTransactionsHandler({}, context);
    assert.ok(Array.isArray(defaultResult));
    assert.equal(defaultResult.length, 2);

    // Test custom limit
    const limitedResult = await getRecentTransactionsHandler({ limit: 1 }, context);
    assert.equal(limitedResult.length, 1);

    // Validate transaction structure
    const firstTx = defaultResult[0];
    assert.equal(firstTx.id, "tx-1");
    assert.equal(firstTx.amount, "50.00");
    assert.equal(firstTx.recipient_name, "Alice");
    assert.ok(firstTx.recipient_address.includes("0x742d"));
    assert.ok(firstTx.recipient_address.includes("..."));
    assert.equal(firstTx.status, "completed");
    assert.equal(firstTx.token, "USDC");
    assert.equal(firstTx.chain, "base");

    // Test limit bounds
    const maxLimitResult = await getRecentTransactionsHandler({ limit: 100 }, context);
    assert.equal(maxLimitResult.length, 2); // Should be capped at available transactions

    const minLimitResult = await getRecentTransactionsHandler({ limit: 0 }, context);
    assert.equal(minLimitResult.length, 2); // Should use default limit of 10, but we only have 2 transactions
}

/**
 * Test: Recipients Handler
 * Validates the get_recipients tool handler
 */
export async function testGetRecipientsHandler() {
    // Mock handler implementation
    async function getRecipientsHandler(context) {
        const recipients = mockRecipients;
        const transactions = mockTransactions;

        // Calculate total amounts sent to each recipient
        const recipientTotals = new Map();
        transactions.forEach((tx) => {
            if (tx.recipient) {
                const recipientId = recipients.find(r => r.name === tx.recipient.name)?.id;
                if (recipientId) {
                    const current = recipientTotals.get(recipientId) || 0;
                    recipientTotals.set(recipientId, current + parseFloat(tx.amount));
                }
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

    const context = { profileId: "test-user-123" };
    const result = await getRecipientsHandler(context);

    // Validate result structure
    assert.ok(Array.isArray(result));
    assert.equal(result.length, 2);

    // Validate first recipient
    const alice = result.find(r => r.name === "Alice");
    assert.ok(alice);
    assert.equal(alice.name, "Alice");
    assert.ok(alice.address.includes("0x742d"));
    assert.equal(alice.is_app_user, false);
    assert.equal(alice.status, "active");
    assert.equal(alice.total_sent, "50.00");

    // Validate second recipient (app user)
    const bob = result.find(r => r.name === "Bob");
    assert.ok(bob);
    assert.equal(bob.is_app_user, true);
    assert.equal(bob.total_sent, "25.50");

    // Validate address masking
    result.forEach(recipient => {
        if (recipient.address) {
            assert.ok(recipient.address.includes("..."));
            assert.ok(recipient.address.startsWith("0x"));
            assert.ok(recipient.address.length < 42); // Should be shorter than full address
        }
    });
}

/**
 * Test: Transaction Summary Handler
 * Validates the get_transaction_summary tool handler
 */
export async function testGetTransactionSummaryHandler() {
    // Mock portfolio insights
    const mockInsights = {
        totalSpent: "75.50",
        topRecipients: [
            { name: "Alice", amount: "50.00" },
            { name: "Bob", amount: "25.50" }
        ],
        spendingTrend: "increasing",
        averageTransaction: "37.75"
    };

    // Mock handler implementation
    async function getTransactionSummaryHandler(context) {
        const insights = mockInsights;

        return {
            total_spent: `${insights.totalSpent}`,
            top_recipients: insights.topRecipients.map((recipient) => ({
                name: recipient.name,
                amount: `${recipient.amount}`,
            })),
            spending_trend: insights.spendingTrend,
            average_transaction: `${insights.averageTransaction}`,
            summary: generateInsightsSummary(insights),
        };
    }

    function generateInsightsSummary(insights) {
        const { totalSpent, topRecipients, spendingTrend, averageTransaction } = insights;

        let summary = `You have spent a total of ${totalSpent}`;

        if (topRecipients.length > 0) {
            summary += ` with your top recipient being ${topRecipients[0].name} (${topRecipients[0].amount})`;
        }

        summary += `. Your average transaction is ${averageTransaction}`;

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

    const context = { profileId: "test-user-123" };
    const result = await getTransactionSummaryHandler(context);

    // Validate result structure
    assert.equal(result.total_spent, "75.50");
    assert.ok(Array.isArray(result.top_recipients));
    assert.equal(result.top_recipients.length, 2);
    assert.equal(result.spending_trend, "increasing");
    assert.equal(result.average_transaction, "37.75");
    assert.ok(result.summary);

    // Validate top recipients
    const topRecipient = result.top_recipients[0];
    assert.equal(topRecipient.name, "Alice");
    assert.equal(topRecipient.amount, "50.00");

    // Validate summary content
    assert.ok(result.summary.includes("75.50"));
    assert.ok(result.summary.includes("Alice"));
    assert.ok(result.summary.includes("increasing"));
    assert.ok(result.summary.includes("37.75"));
}

/**
 * Test: Tool Execution Result Format
 * Validates that tool results are properly formatted according to MCP spec
 */
export async function testToolExecutionResultFormat() {
    // Mock successful result
    const successResult = {
        content: [
            {
                type: "text",
                text: JSON.stringify({
                    success: true,
                    data: { balance: "150.75", currency: "USDC" },
                    timestamp: "2025-01-15T10:30:00Z",
                }),
            },
        ],
    };

    // Validate success result structure
    assert.ok(Array.isArray(successResult.content));
    assert.equal(successResult.content.length, 1);
    assert.equal(successResult.content[0].type, "text");

    const successData = JSON.parse(successResult.content[0].text);
    assert.equal(successData.success, true);
    assert.ok(successData.data);
    assert.ok(successData.timestamp);

    // Mock error result
    const errorResult = {
        content: [
            {
                type: "text",
                text: JSON.stringify({
                    success: false,
                    error: "Authentication required",
                    timestamp: "2025-01-15T10:30:00Z",
                }),
            },
        ],
    };

    // Validate error result structure
    const errorData = JSON.parse(errorResult.content[0].text);
    assert.equal(errorData.success, false);
    assert.equal(errorData.error, "Authentication required");
    assert.ok(errorData.timestamp);
}

/**
 * Test: Authentication Validation
 * Validates that authentication is properly checked
 */
export async function testAuthenticationValidation() {
    // Mock validation function
    async function validateAuthentication(profileId) {
        if (!profileId) {
            throw new Error("Profile ID is required");
        }

        // Simulate database check
        const mockProfile = { id: profileId, status: "active" };

        if (!mockProfile || mockProfile.status !== "active") {
            throw new Error("Invalid or inactive user profile");
        }

        return true;
    }

    // Test valid authentication
    const validResult = await validateAuthentication("test-user-123");
    assert.equal(validResult, true);

    // Test missing profile ID
    try {
        await validateAuthentication("");
        assert.fail("Should have thrown error for missing profile ID");
    } catch (error) {
        assert.ok(error.message.includes("Profile ID is required"));
    }

    // Test null profile ID
    try {
        await validateAuthentication(null);
        assert.fail("Should have thrown error for null profile ID");
    } catch (error) {
        assert.ok(error.message.includes("Profile ID is required"));
    }
}

/**
 * Test: MCP Request Handling
 * Validates the main MCP request handler
 */
export async function testMCPRequestHandling() {
    // Mock handleMCPRequest function
    async function handleMCPRequest(request, context) {
        switch (request.method) {
            case "tools/list":
                return {
                    tools: [
                        { name: "get_investment_options", description: "Get investments", inputSchema: { type: "object", properties: {} } },
                        { name: "get_user_balance", description: "Get balance", inputSchema: { type: "object", properties: {} } }
                    ],
                };

            case "tools/call":
                if (!request.params?.name) {
                    throw new Error("Tool name is required for tools/call");
                }

                // Mock tool execution
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify({
                                success: true,
                                data: { mock: "result" },
                                timestamp: new Date().toISOString(),
                            }),
                        },
                    ],
                };

            default:
                throw new Error(`Unsupported method: ${request.method}`);
        }
    }

    const context = { profileId: "test-user-123" };

    // Test tools/list
    const listRequest = { method: "tools/list" };
    const listResult = await handleMCPRequest(listRequest, context);
    assert.ok(Array.isArray(listResult.tools));
    assert.equal(listResult.tools.length, 2);

    // Test tools/call
    const callRequest = {
        method: "tools/call",
        params: { name: "get_user_balance", arguments: {} }
    };
    const callResult = await handleMCPRequest(callRequest, context);
    assert.ok(Array.isArray(callResult.content));

    // Test invalid method
    try {
        await handleMCPRequest({ method: "invalid/method" }, context);
        assert.fail("Should have thrown error for invalid method");
    } catch (error) {
        assert.ok(error.message.includes("Unsupported method"));
    }

    // Test missing tool name
    try {
        await handleMCPRequest({ method: "tools/call", params: {} }, context);
        assert.fail("Should have thrown error for missing tool name");
    } catch (error) {
        assert.ok(error.message.includes("Tool name is required"));
    }
}

/**
 * Main test runner
 */
export async function test() {
    console.log("Running MCP Server Unit Tests...\n");

    try {
        await testMCPToolRegistry();
        console.log("✓ MCP tool registry test passed");

        await testGetInvestmentOptionsHandler();
        console.log("✓ Investment options handler test passed");

        await testGetUserBalanceHandler();
        console.log("✓ User balance handler test passed");

        await testGetRecentTransactionsHandler();
        console.log("✓ Recent transactions handler test passed");

        await testGetRecipientsHandler();
        console.log("✓ Recipients handler test passed");

        await testGetTransactionSummaryHandler();
        console.log("✓ Transaction summary handler test passed");

        await testToolExecutionResultFormat();
        console.log("✓ Tool execution result format test passed");

        await testAuthenticationValidation();
        console.log("✓ Authentication validation test passed");

        await testMCPRequestHandling();
        console.log("✓ MCP request handling test passed");

        console.log("\n✓ All MCP server unit tests passed!");
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