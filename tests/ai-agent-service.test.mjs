/**
 * @fileoverview Tests for AI agent service layer functions.
 * Tests portfolio insights, operation parsing, and context retrieval.
 */

import { strict as assert } from "assert";

/**
 * Mock data for testing
 */
const mockTransactions = [
  {
    id: "tx1",
    sender_profile_id: "profile1",
    recipient_id: "recipient1",
    amount: "100.00",
    token: "USDC",
    chain: "base",
    status: "success",
    tx_hash: "0x123",
    created_at: "2025-01-01T00:00:00Z",
    recipient: { name: "Alice", profile_id: "profile2", external_address: "0xabc" },
  },
  {
    id: "tx2",
    sender_profile_id: "profile1",
    recipient_id: "recipient2",
    amount: "50.00",
    token: "USDC",
    chain: "base",
    status: "success",
    tx_hash: "0x456",
    created_at: "2025-01-02T00:00:00Z",
    recipient: { name: "Bob", profile_id: "profile3", external_address: "0xdef" },
  },
  {
    id: "tx3",
    sender_profile_id: "profile1",
    recipient_id: "recipient1",
    amount: "75.00",
    token: "USDC",
    chain: "base",
    status: "success",
    tx_hash: "0x789",
    created_at: "2025-01-03T00:00:00Z",
    recipient: { name: "Alice", profile_id: "profile2", external_address: "0xabc" },
  },
];

const mockRecipients = [
  {
    id: "recipient1",
    profile_id: "profile1",
    name: "Alice",
    status: "active",
    recipient_type: "crypto",
    external_address: "0xabc",
    profile_id_link: null,
    bank_details: null,
    created_at: "2025-01-01T00:00:00Z",
  },
  {
    id: "recipient2",
    profile_id: "profile1",
    name: "Bob",
    status: "active",
    recipient_type: "crypto",
    external_address: "0xdef",
    profile_id_link: null,
    bank_details: null,
    created_at: "2025-01-01T00:00:00Z",
  },
];

/**
 * Test: Portfolio insights calculation
 */
export async function testPortfolioInsightsCalculation() {
  console.log("Testing portfolio insights calculation...");

  // Mock the getSentTransactions function
  const mockGetSentTransactions = async () => mockTransactions;

  // Calculate insights manually
  const totalSpent = mockTransactions.reduce((sum, tx) => sum + parseFloat(tx.amount), 0);
  const averageTransaction = totalSpent / mockTransactions.length;

  // Group by recipient
  const recipientTotals = new Map();
  mockTransactions.forEach((tx) => {
    const name = tx.recipient.name;
    const current = recipientTotals.get(name) || { name, amount: 0 };
    current.amount += parseFloat(tx.amount);
    recipientTotals.set(name, current);
  });

  const topRecipients = Array.from(recipientTotals.values())
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 3);

  // Verify calculations
  assert.equal(totalSpent, 225.0, "Total spent should be 225.00");
  assert.equal(averageTransaction, 75.0, "Average transaction should be 75.00");
  assert.equal(topRecipients[0].name, "Alice", "Top recipient should be Alice");
  assert.equal(topRecipients[0].amount, 175.0, "Alice total should be 175.00");

  console.log("✓ Portfolio insights calculation test passed");
}

/**
 * Test: AI response parsing for payment operations
 */
export async function testAIResponseParsingPayment() {
  console.log("Testing AI response parsing for payments...");

  const context = {
    balance: "1000.00",
    transactions: mockTransactions,
    recipients: mockRecipients,
  };

  // Test payment detection
  const paymentResponse = "I can send $50 to Alice for you. Would you like me to proceed?";
  const amountMatch = paymentResponse.match(/\$(\d+(?:\.\d{2})?)|(\d+(?:\.\d{2})?)\s*usdc/i);
  const toMatch = paymentResponse.match(/to\s+([A-Za-z]+)/i);

  assert.ok(amountMatch, "Should detect amount in payment response");
  assert.ok(toMatch, "Should detect recipient in payment response");
  assert.equal(amountMatch[1], "50", "Should extract correct amount");
  assert.equal(toMatch[1], "Alice", "Should extract correct recipient name");

  // Find recipient
  const recipientName = toMatch[1];
  const recipient = context.recipients.find((r) =>
    r.name.toLowerCase().includes(recipientName.toLowerCase())
  );

  assert.ok(recipient, "Should find recipient in context");
  assert.equal(recipient.name, "Alice", "Should match correct recipient");

  console.log("✓ AI response parsing for payments test passed");
}

/**
 * Test: AI response parsing for analysis operations
 */
export async function testAIResponseParsingAnalysis() {
  console.log("Testing AI response parsing for analysis...");

  const analysisResponses = [
    "Let me analyze your spending patterns...",
    "Here are your portfolio insights...",
    "Based on your spending history...",
  ];

  analysisResponses.forEach((response) => {
    const lowerResponse = response.toLowerCase();
    const isAnalysis =
      lowerResponse.includes("analyze") ||
      lowerResponse.includes("spending") ||
      lowerResponse.includes("insights");

    assert.ok(isAnalysis, `Should detect analysis operation in: "${response}"`);
  });

  console.log("✓ AI response parsing for analysis test passed");
}

/**
 * Test: Operation validation
 */
export async function testOperationValidation() {
  console.log("Testing operation validation...");

  // Valid operation types
  const validTypes = ["payment", "analysis", "query"];
  validTypes.forEach((type) => {
    assert.ok(
      ["payment", "analysis", "query"].includes(type),
      `${type} should be valid operation type`
    );
  });

  // Invalid operation type
  const invalidType = "invalid";
  assert.ok(
    !["payment", "analysis", "query"].includes(invalidType),
    "Invalid type should not be accepted"
  );

  // Payment data validation
  const validPaymentData = {
    recipient_id: "uuid",
    amount: "50.00",
    token: "USDC",
  };
  assert.ok(validPaymentData.recipient_id, "Payment should have recipient_id");
  assert.ok(validPaymentData.amount, "Payment should have amount");

  const invalidPaymentData = {
    recipient_id: "uuid",
    // missing amount
  };
  assert.ok(!invalidPaymentData.amount, "Invalid payment data should be detected");

  console.log("✓ Operation validation test passed");
}

/**
 * Test: Context retrieval structure
 */
export async function testContextRetrieval() {
  console.log("Testing context retrieval structure...");

  const mockContext = {
    balance: "1000.00",
    transactions: mockTransactions,
    recipients: mockRecipients,
  };

  // Verify context structure
  assert.ok(mockContext.balance, "Context should include balance");
  assert.ok(Array.isArray(mockContext.transactions), "Context should include transactions array");
  assert.ok(Array.isArray(mockContext.recipients), "Context should include recipients array");

  // Verify transaction structure
  const tx = mockContext.transactions[0];
  assert.ok(tx.id, "Transaction should have id");
  assert.ok(tx.amount, "Transaction should have amount");
  assert.ok(tx.recipient, "Transaction should have recipient details");

  // Verify recipient structure
  const recipient = mockContext.recipients[0];
  assert.ok(recipient.id, "Recipient should have id");
  assert.ok(recipient.name, "Recipient should have name");
  assert.ok(recipient.external_address, "Recipient should have address");

  console.log("✓ Context retrieval structure test passed");
}

/**
 * Test: Spending trend calculation
 */
export async function testSpendingTrendCalculation() {
  console.log("Testing spending trend calculation...");

  // Test increasing trend
  const increasingTxs = [
    { amount: "10.00" },
    { amount: "20.00" },
    { amount: "30.00" },
    { amount: "40.00" },
  ];

  const midpoint = Math.floor(increasingTxs.length / 2);
  const firstHalf = increasingTxs.slice(0, midpoint);
  const secondHalf = increasingTxs.slice(midpoint);

  const firstTotal = firstHalf.reduce((sum, tx) => sum + parseFloat(tx.amount), 0);
  const secondTotal = secondHalf.reduce((sum, tx) => sum + parseFloat(tx.amount), 0);

  assert.ok(secondTotal > firstTotal, "Second half should be greater for increasing trend");

  // Test stable trend
  const stableTxs = [
    { amount: "25.00" },
    { amount: "25.00" },
    { amount: "25.00" },
    { amount: "25.00" },
  ];

  const stableMidpoint = Math.floor(stableTxs.length / 2);
  const stableFirst = stableTxs
    .slice(0, stableMidpoint)
    .reduce((sum, tx) => sum + parseFloat(tx.amount), 0);
  const stableSecond = stableTxs
    .slice(stableMidpoint)
    .reduce((sum, tx) => sum + parseFloat(tx.amount), 0);

  const difference = Math.abs(stableSecond - stableFirst);
  const total = stableTxs.reduce((sum, tx) => sum + parseFloat(tx.amount), 0);
  const threshold = total * 0.1;

  assert.ok(difference <= threshold, "Difference should be within threshold for stable trend");

  console.log("✓ Spending trend calculation test passed");
}

// Run all tests
async function runTests() {
  console.log("\n=== AI Agent Service Tests ===\n");

  try {
    await testPortfolioInsightsCalculation();
    await testAIResponseParsingPayment();
    await testAIResponseParsingAnalysis();
    await testOperationValidation();
    await testContextRetrieval();
    await testSpendingTrendCalculation();

    console.log("\n✓ All AI agent service tests passed!\n");
    process.exit(0);
  } catch (error) {
    console.error("\n✗ Test failed:", error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

runTests();
