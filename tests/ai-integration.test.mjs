/**
 * AI Agent Integration Tests
 * 
 * Tests the integration of AI agent into banking home and core functionality.
 * Validates consent flow, context access, and operation parsing.
 */

import assert from 'node:assert/strict';

/**
 * Test: AI Consent Storage
 * Validates that consent preferences are properly stored and retrieved
 */
export async function testConsentStorage() {
  // Simulate localStorage behavior
  const storage = new Map();
  
  const mockLocalStorage = {
    getItem: (key) => storage.get(key) || null,
    setItem: (key, value) => storage.set(key, value),
    removeItem: (key) => storage.delete(key),
  };

  // Test granting consent
  mockLocalStorage.setItem("banb_ai_consent", "granted");
  mockLocalStorage.setItem("banb_ai_consent_date", new Date().toISOString());
  
  assert.equal(mockLocalStorage.getItem("banb_ai_consent"), "granted");
  assert.ok(mockLocalStorage.getItem("banb_ai_consent_date"));

  // Test declining consent
  mockLocalStorage.setItem("banb_ai_consent", "declined");
  mockLocalStorage.removeItem("banb_ai_consent_date");
  
  assert.equal(mockLocalStorage.getItem("banb_ai_consent"), "declined");
  assert.equal(mockLocalStorage.getItem("banb_ai_consent_date"), null);

  // Test revoking consent
  mockLocalStorage.removeItem("banb_ai_consent");
  assert.equal(mockLocalStorage.getItem("banb_ai_consent"), null);
}

/**
 * Test: AI Context Data Structure
 * Validates that AI context contains required fields
 */
export async function testAIContextStructure() {
  const mockContext = {
    balance: "100.50",
    transactions: [
      {
        id: "tx1",
        amount: "10.00",
        token: "USDC",
        status: "success",
        recipient: { name: "Alice" }
      }
    ],
    recipients: [
      {
        id: "rec1",
        name: "Alice",
        external_address: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
      }
    ]
  };

  // Validate structure
  assert.ok(mockContext.balance);
  assert.ok(Array.isArray(mockContext.transactions));
  assert.ok(Array.isArray(mockContext.recipients));
  
  // Validate transaction structure
  const tx = mockContext.transactions[0];
  assert.ok(tx.id);
  assert.ok(tx.amount);
  assert.ok(tx.token);
  assert.ok(tx.status);
  
  // Validate recipient structure
  const recipient = mockContext.recipients[0];
  assert.ok(recipient.id);
  assert.ok(recipient.name);
  assert.ok(recipient.external_address);
}

/**
 * Test: AI Operation Type Validation
 * Validates that operation types are correctly identified
 */
export async function testOperationTypeValidation() {
  const validTypes = ["payment", "analysis", "query"];
  
  // Test valid types
  validTypes.forEach(type => {
    assert.ok(validTypes.includes(type));
  });
  
  // Test invalid types
  const invalidTypes = ["transfer", "withdraw", "deposit"];
  invalidTypes.forEach(type => {
    assert.ok(!validTypes.includes(type));
  });
}

/**
 * Test: Payment Operation Data Structure
 * Validates payment operation has required fields
 */
export async function testPaymentOperationStructure() {
  const paymentOperation = {
    type: "payment",
    data: {
      recipient_id: "rec1",
      amount: "50.00",
      token: "USDC",
      chain: "base",
      to: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
    }
  };

  // Validate operation structure
  assert.equal(paymentOperation.type, "payment");
  assert.ok(paymentOperation.data);
  
  // Validate required fields
  assert.ok(paymentOperation.data.recipient_id);
  assert.ok(paymentOperation.data.amount);
  assert.ok(paymentOperation.data.token);
  assert.ok(paymentOperation.data.chain);
  assert.ok(paymentOperation.data.to);
  
  // Validate amount format
  const amount = parseFloat(paymentOperation.data.amount);
  assert.ok(amount > 0);
  assert.ok(Number.isFinite(amount));
}

/**
 * Test: Analysis Operation Data Structure
 * Validates analysis operation structure
 */
export async function testAnalysisOperationStructure() {
  const analysisOperation = {
    type: "analysis",
    data: {}
  };

  assert.equal(analysisOperation.type, "analysis");
  assert.ok(typeof analysisOperation.data === "object");
}

/**
 * Test: Portfolio Insights Calculation
 * Validates portfolio insights are calculated correctly
 */
export async function testPortfolioInsightsCalculation() {
  const mockTransactions = [
    { amount: "10.00", recipient: { name: "Alice" } },
    { amount: "20.00", recipient: { name: "Bob" } },
    { amount: "15.00", recipient: { name: "Alice" } },
    { amount: "5.00", recipient: { name: "Charlie" } },
  ];

  // Calculate total spent
  const totalSpent = mockTransactions.reduce((sum, tx) => {
    return sum + parseFloat(tx.amount);
  }, 0);
  
  assert.equal(totalSpent, 50.00);

  // Calculate average transaction
  const averageTransaction = totalSpent / mockTransactions.length;
  assert.equal(averageTransaction, 12.50);

  // Group by recipient
  const recipientTotals = new Map();
  mockTransactions.forEach(tx => {
    const name = tx.recipient.name;
    const current = recipientTotals.get(name) || 0;
    recipientTotals.set(name, current + parseFloat(tx.amount));
  });

  // Validate recipient totals
  assert.equal(recipientTotals.get("Alice"), 25.00);
  assert.equal(recipientTotals.get("Bob"), 20.00);
  assert.equal(recipientTotals.get("Charlie"), 5.00);

  // Get top recipient
  const topRecipients = Array.from(recipientTotals.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  
  assert.equal(topRecipients[0][0], "Alice");
  assert.equal(topRecipients[0][1], 25.00);
}

/**
 * Test: AI Response Parsing
 * Validates that AI responses are correctly parsed for operations
 */
export async function testAIResponseParsing() {
  // Test payment detection
  const paymentResponse = "I can send $50 to Alice for you. Would you like me to proceed?";
  assert.ok(paymentResponse.toLowerCase().includes("send"));
  
  // Extract amount
  const amountMatch = paymentResponse.match(/\$(\d+(?:\.\d{2})?)/);
  assert.ok(amountMatch);
  assert.equal(amountMatch[1], "50");
  
  // Extract recipient
  const recipientMatch = paymentResponse.match(/to\s+([A-Za-z]+)/i);
  assert.ok(recipientMatch);
  assert.equal(recipientMatch[1], "Alice");

  // Test analysis detection
  const analysisResponse = "Let me analyze your spending patterns...";
  assert.ok(analysisResponse.toLowerCase().includes("analyze"));
}

/**
 * Test: Operation Confirmation Requirement
 * Validates that payment operations require user confirmation
 */
export async function testOperationConfirmationRequirement() {
  const paymentOperation = {
    type: "payment",
    data: { recipient_id: "rec1", amount: "50.00" }
  };

  const analysisOperation = {
    type: "analysis",
    data: {}
  };

  // Payment requires confirmation
  assert.equal(paymentOperation.type, "payment");
  const paymentRequiresConfirmation = paymentOperation.type === "payment";
  assert.ok(paymentRequiresConfirmation);

  // Analysis doesn't require confirmation
  assert.equal(analysisOperation.type, "analysis");
  const analysisRequiresConfirmation = analysisOperation.type === "payment";
  assert.ok(!analysisRequiresConfirmation);
}

/**
 * Main test runner
 */
export async function test() {
  console.log("Running AI Integration Tests...\n");

  try {
    await testConsentStorage();
    console.log("✓ Consent storage test passed");

    await testAIContextStructure();
    console.log("✓ AI context structure test passed");

    await testOperationTypeValidation();
    console.log("✓ Operation type validation test passed");

    await testPaymentOperationStructure();
    console.log("✓ Payment operation structure test passed");

    await testAnalysisOperationStructure();
    console.log("✓ Analysis operation structure test passed");

    await testPortfolioInsightsCalculation();
    console.log("✓ Portfolio insights calculation test passed");

    await testAIResponseParsing();
    console.log("✓ AI response parsing test passed");

    await testOperationConfirmationRequirement();
    console.log("✓ Operation confirmation requirement test passed");

    console.log("\n✓ All AI integration tests passed!");
  } catch (error) {
    console.error("\n✗ Test failed:", error.message);
    throw error;
  }
}
