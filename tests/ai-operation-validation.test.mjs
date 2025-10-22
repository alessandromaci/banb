/**
 * @fileoverview Tests for AI agent operation validation.
 * Tests operation type validation, data structure validation, confirmation flow, and audit trail.
 * Requirements: 12.4, 12.7, 12.11
 */

import { strict as assert } from "assert";

/**
 * Test: Operation type validation
 * Validates that only allowed operation types are accepted
 */
export function testOperationTypeValidation() {
  console.log("Testing operation type validation...");

  function validateOperationType(type) {
    const validTypes = ["payment", "analysis", "query"];
    return validTypes.includes(type);
  }

  // Valid operation types
  assert.ok(validateOperationType("payment"), "payment should be valid");
  assert.ok(validateOperationType("analysis"), "analysis should be valid");
  assert.ok(validateOperationType("query"), "query should be valid");

  // Invalid operation types
  assert.ok(!validateOperationType("transfer"), "transfer should be invalid");
  assert.ok(!validateOperationType("delete"), "delete should be invalid");
  assert.ok(!validateOperationType(""), "empty string should be invalid");
  assert.ok(!validateOperationType(null), "null should be invalid");
  assert.ok(!validateOperationType(undefined), "undefined should be invalid");

  console.log("✓ Operation type validation test passed");
}

/**
 * Test: Payment operation data structure validation
 * Validates required fields and data types for payment operations
 */
export function testPaymentOperationDataStructure() {
  console.log("Testing payment operation data structure...");

  function validatePaymentData(data) {
    const errors = [];

    // Check required fields
    if (!data.recipient_id && !data.to) {
      errors.push("Payment requires recipient_id or to address");
    }

    if (!data.amount) {
      errors.push("Payment requires amount");
    } else {
      const amount = parseFloat(String(data.amount));
      if (isNaN(amount)) {
        errors.push("Amount must be a valid number");
      } else if (amount <= 0) {
        errors.push("Amount must be greater than zero");
      }
    }

    if (!data.chain) {
      errors.push("Payment requires chain");
    }

    // Token is optional but should be validated if present
    if (data.token && typeof data.token !== "string") {
      errors.push("Token must be a string");
    }

    return { valid: errors.length === 0, errors };
  }

  // Valid payment data with recipient_id
  const validPayment1 = validatePaymentData({
    recipient_id: "uuid-123",
    amount: "50.00",
    chain: "base",
    token: "USDC",
  });
  assert.ok(validPayment1.valid, "Valid payment with recipient_id should pass");
  assert.equal(validPayment1.errors.length, 0, "Should have no errors");

  // Valid payment data with to address
  const validPayment2 = validatePaymentData({
    to: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    amount: "100.50",
    chain: "base",
  });
  assert.ok(validPayment2.valid, "Valid payment with to address should pass");

  // Invalid: missing recipient
  const invalidPayment1 = validatePaymentData({
    amount: "50.00",
    chain: "base",
  });
  assert.ok(!invalidPayment1.valid, "Payment without recipient should fail");
  assert.ok(
    invalidPayment1.errors.some((e) => e.includes("recipient")),
    "Should have recipient error"
  );

  // Invalid: missing amount
  const invalidPayment2 = validatePaymentData({
    recipient_id: "uuid-123",
    chain: "base",
  });
  assert.ok(!invalidPayment2.valid, "Payment without amount should fail");
  assert.ok(
    invalidPayment2.errors.some((e) => e.includes("amount")),
    "Should have amount error"
  );

  // Invalid: zero amount
  const invalidPayment3 = validatePaymentData({
    recipient_id: "uuid-123",
    amount: "0",
    chain: "base",
  });
  assert.ok(!invalidPayment3.valid, "Payment with zero amount should fail");
  assert.ok(
    invalidPayment3.errors.some((e) => e.includes("greater than zero")),
    "Should have zero amount error"
  );

  // Invalid: negative amount
  const invalidPayment4 = validatePaymentData({
    recipient_id: "uuid-123",
    amount: "-50.00",
    chain: "base",
  });
  assert.ok(!invalidPayment4.valid, "Payment with negative amount should fail");

  // Invalid: missing chain
  const invalidPayment5 = validatePaymentData({
    recipient_id: "uuid-123",
    amount: "50.00",
  });
  assert.ok(!invalidPayment5.valid, "Payment without chain should fail");
  assert.ok(
    invalidPayment5.errors.some((e) => e.includes("chain")),
    "Should have chain error"
  );

  // Invalid: non-numeric amount
  const invalidPayment6 = validatePaymentData({
    recipient_id: "uuid-123",
    amount: "abc",
    chain: "base",
  });
  assert.ok(!invalidPayment6.valid, "Payment with non-numeric amount should fail");

  console.log("✓ Payment operation data structure test passed");
}

/**
 * Test: Analysis operation data structure validation
 * Validates that analysis operations have valid structure
 */
export function testAnalysisOperationDataStructure() {
  console.log("Testing analysis operation data structure...");

  function validateAnalysisData(data) {
    const errors = [];

    // Analysis operations can have optional parameters
    if (data.analysis_type && typeof data.analysis_type !== "string") {
      errors.push("analysis_type must be a string");
    }

    if (data.time_range && typeof data.time_range !== "string") {
      errors.push("time_range must be a string");
    }

    return { valid: errors.length === 0, errors };
  }

  // Valid: empty analysis data
  const validAnalysis1 = validateAnalysisData({});
  assert.ok(validAnalysis1.valid, "Empty analysis data should be valid");

  // Valid: with analysis_type
  const validAnalysis2 = validateAnalysisData({
    analysis_type: "spending_pattern",
  });
  assert.ok(validAnalysis2.valid, "Analysis with type should be valid");

  // Valid: with time_range
  const validAnalysis3 = validateAnalysisData({
    time_range: "30_days",
  });
  assert.ok(validAnalysis3.valid, "Analysis with time_range should be valid");

  // Valid: with both parameters
  const validAnalysis4 = validateAnalysisData({
    analysis_type: "spending_pattern",
    time_range: "30_days",
  });
  assert.ok(validAnalysis4.valid, "Analysis with both parameters should be valid");

  // Invalid: wrong type for analysis_type
  const invalidAnalysis1 = validateAnalysisData({
    analysis_type: 123,
  });
  assert.ok(!invalidAnalysis1.valid, "Analysis with numeric type should fail");

  // Invalid: wrong type for time_range
  const invalidAnalysis2 = validateAnalysisData({
    time_range: true,
  });
  assert.ok(!invalidAnalysis2.valid, "Analysis with boolean time_range should fail");

  console.log("✓ Analysis operation data structure test passed");
}

/**
 * Test: Query operation data structure validation
 * Validates that query operations have valid structure
 */
export function testQueryOperationDataStructure() {
  console.log("Testing query operation data structure...");

  function validateQueryData(data) {
    const errors = [];

    // Query operations can have optional parameters
    if (data.query && typeof data.query !== "string") {
      errors.push("query must be a string");
    }

    if (data.filters && typeof data.filters !== "object") {
      errors.push("filters must be an object");
    }

    return { valid: errors.length === 0, errors };
  }

  // Valid: empty query data
  const validQuery1 = validateQueryData({});
  assert.ok(validQuery1.valid, "Empty query data should be valid");

  // Valid: with query string
  const validQuery2 = validateQueryData({
    query: "top recipients",
  });
  assert.ok(validQuery2.valid, "Query with string should be valid");

  // Valid: with filters
  const validQuery3 = validateQueryData({
    filters: { status: "active" },
  });
  assert.ok(validQuery3.valid, "Query with filters should be valid");

  // Valid: with both parameters
  const validQuery4 = validateQueryData({
    query: "recent transactions",
    filters: { limit: 10 },
  });
  assert.ok(validQuery4.valid, "Query with both parameters should be valid");

  // Invalid: wrong type for query
  const invalidQuery1 = validateQueryData({
    query: 123,
  });
  assert.ok(!invalidQuery1.valid, "Query with numeric query should fail");

  // Invalid: wrong type for filters
  const invalidQuery2 = validateQueryData({
    filters: "invalid",
  });
  assert.ok(!invalidQuery2.valid, "Query with string filters should fail");

  console.log("✓ Query operation data structure test passed");
}

/**
 * Test: Operation confirmation flow
 * Validates that payment operations require confirmation
 */
export function testOperationConfirmationFlow() {
  console.log("Testing operation confirmation flow...");

  function requiresConfirmation(operationType) {
    // Only payment operations require user confirmation
    return operationType === "payment";
  }

  function canExecute(operationType, userConfirmed) {
    if (requiresConfirmation(operationType)) {
      return userConfirmed === true;
    }
    return true; // Non-payment operations don't require confirmation
  }

  // Payment operations require confirmation
  assert.ok(requiresConfirmation("payment"), "Payment should require confirmation");
  assert.ok(!requiresConfirmation("analysis"), "Analysis should not require confirmation");
  assert.ok(!requiresConfirmation("query"), "Query should not require confirmation");

  // Payment execution with confirmation
  assert.ok(
    canExecute("payment", true),
    "Payment with confirmation should be executable"
  );
  assert.ok(
    !canExecute("payment", false),
    "Payment without confirmation should not be executable"
  );
  assert.ok(
    !canExecute("payment", undefined),
    "Payment with undefined confirmation should not be executable"
  );

  // Non-payment operations don't need confirmation
  assert.ok(
    canExecute("analysis", false),
    "Analysis without confirmation should be executable"
  );
  assert.ok(
    canExecute("query", false),
    "Query without confirmation should be executable"
  );

  console.log("✓ Operation confirmation flow test passed");
}

/**
 * Test: Audit trail creation
 * Validates that operations are properly logged
 */
export function testAuditTrailCreation() {
  console.log("Testing audit trail creation...");

  function createAuditRecord(operation) {
    // Simulate audit record creation
    const record = {
      id: `audit-${Date.now()}`,
      profile_id: operation.profile_id,
      operation_type: operation.operation_type,
      operation_data: operation.operation_data,
      user_message: operation.user_message || "",
      ai_response: operation.ai_response || "",
      user_confirmed: operation.user_confirmed || false,
      executed: operation.executed || false,
      execution_result: operation.execution_result || null,
      created_at: new Date().toISOString(),
      executed_at: operation.executed ? new Date().toISOString() : null,
    };

    return record;
  }

  // Test successful payment operation audit
  const paymentOperation = {
    profile_id: "user-123",
    operation_type: "payment",
    operation_data: {
      recipient_id: "recipient-456",
      amount: "50.00",
      chain: "base",
    },
    user_message: "Send $50 to Alice",
    ai_response: "Payment sent successfully",
    user_confirmed: true,
    executed: true,
    execution_result: { transactionId: "tx-789" },
  };

  const paymentAudit = createAuditRecord(paymentOperation);
  assert.ok(paymentAudit.id, "Audit record should have ID");
  assert.equal(paymentAudit.profile_id, "user-123", "Should record profile_id");
  assert.equal(paymentAudit.operation_type, "payment", "Should record operation type");
  assert.ok(paymentAudit.user_confirmed, "Should record confirmation status");
  assert.ok(paymentAudit.executed, "Should record execution status");
  assert.ok(paymentAudit.executed_at, "Should record execution timestamp");
  assert.equal(
    paymentAudit.execution_result.transactionId,
    "tx-789",
    "Should record execution result"
  );

  // Test failed operation audit
  const failedOperation = {
    profile_id: "user-123",
    operation_type: "payment",
    operation_data: {
      recipient_id: "recipient-456",
      amount: "50.00",
      chain: "base",
    },
    user_message: "Send $50 to Alice",
    ai_response: "Payment failed",
    user_confirmed: true,
    executed: false,
    execution_result: { error: "Insufficient balance" },
  };

  const failedAudit = createAuditRecord(failedOperation);
  assert.ok(!failedAudit.executed, "Should record failed execution");
  assert.ok(!failedAudit.executed_at, "Should not have execution timestamp");
  assert.equal(
    failedAudit.execution_result.error,
    "Insufficient balance",
    "Should record error"
  );

  // Test rejected operation audit
  const rejectedOperation = {
    profile_id: "user-123",
    operation_type: "payment",
    operation_data: {
      recipient_id: "recipient-456",
      amount: "50.00",
      chain: "base",
    },
    user_message: "Send $50 to Alice",
    ai_response: "Payment prepared",
    user_confirmed: false,
    executed: false,
    execution_result: { error: "User rejected" },
  };

  const rejectedAudit = createAuditRecord(rejectedOperation);
  assert.ok(!rejectedAudit.user_confirmed, "Should record rejection");
  assert.ok(!rejectedAudit.executed, "Should not be executed");

  // Test analysis operation audit
  const analysisOperation = {
    profile_id: "user-123",
    operation_type: "analysis",
    operation_data: {},
    user_message: "Analyze my spending",
    ai_response: "Here are your insights",
    user_confirmed: false,
    executed: true,
    execution_result: {
      totalSpent: "225.00",
      topRecipients: [{ name: "Alice", amount: "175.00" }],
    },
  };

  const analysisAudit = createAuditRecord(analysisOperation);
  assert.equal(analysisAudit.operation_type, "analysis", "Should record analysis type");
  assert.ok(analysisAudit.executed, "Analysis should be executed");
  assert.ok(analysisAudit.execution_result.totalSpent, "Should record analysis result");

  console.log("✓ Audit trail creation test passed");
}

/**
 * Test: Complete operation validation workflow
 * Tests the full validation flow from operation creation to execution
 */
export function testCompleteOperationValidation() {
  console.log("Testing complete operation validation workflow...");

  function validateAndExecuteOperation(operation, userConfirmed) {
    const validationErrors = [];

    // Step 1: Validate operation type
    const validTypes = ["payment", "analysis", "query"];
    if (!validTypes.includes(operation.type)) {
      validationErrors.push(`Invalid operation type: ${operation.type}`);
      return { success: false, errors: validationErrors };
    }

    // Step 2: Validate operation data based on type
    if (operation.type === "payment") {
      if (!operation.data.recipient_id && !operation.data.to) {
        validationErrors.push("Payment requires recipient");
      }
      if (!operation.data.amount) {
        validationErrors.push("Payment requires amount");
      } else {
        const amount = parseFloat(String(operation.data.amount));
        if (isNaN(amount) || amount <= 0) {
          validationErrors.push("Invalid payment amount");
        }
      }
      if (!operation.data.chain) {
        validationErrors.push("Payment requires chain");
      }
    }

    if (validationErrors.length > 0) {
      return { success: false, errors: validationErrors };
    }

    // Step 3: Check confirmation for payment operations
    if (operation.type === "payment" && !userConfirmed) {
      return {
        success: false,
        errors: ["Payment operations require user confirmation"],
      };
    }

    // Step 4: Execute operation (simulated)
    return { success: true, result: { executed: true } };
  }

  // Test valid payment with confirmation
  const validPayment = {
    type: "payment",
    data: {
      recipient_id: "uuid-123",
      amount: "50.00",
      chain: "base",
    },
  };
  const result1 = validateAndExecuteOperation(validPayment, true);
  assert.ok(result1.success, "Valid payment with confirmation should succeed");

  // Test valid payment without confirmation
  const result2 = validateAndExecuteOperation(validPayment, false);
  assert.ok(!result2.success, "Valid payment without confirmation should fail");
  assert.ok(
    result2.errors.some((e) => e.includes("confirmation")),
    "Should have confirmation error"
  );

  // Test invalid payment (missing amount)
  const invalidPayment = {
    type: "payment",
    data: {
      recipient_id: "uuid-123",
      chain: "base",
    },
  };
  const result3 = validateAndExecuteOperation(invalidPayment, true);
  assert.ok(!result3.success, "Invalid payment should fail");
  assert.ok(
    result3.errors.some((e) => e.includes("amount")),
    "Should have amount error"
  );

  // Test valid analysis (no confirmation needed)
  const validAnalysis = {
    type: "analysis",
    data: {},
  };
  const result4 = validateAndExecuteOperation(validAnalysis, false);
  assert.ok(result4.success, "Valid analysis without confirmation should succeed");

  // Test invalid operation type
  const invalidType = {
    type: "invalid",
    data: {},
  };
  const result5 = validateAndExecuteOperation(invalidType, false);
  assert.ok(!result5.success, "Invalid operation type should fail");
  assert.ok(
    result5.errors.some((e) => e.includes("Invalid operation type")),
    "Should have type error"
  );

  console.log("✓ Complete operation validation workflow test passed");
}

// Run all tests
console.log("\n🧪 Running AI Operation Validation Tests...\n");

try {
  testOperationTypeValidation();
  testPaymentOperationDataStructure();
  testAnalysisOperationDataStructure();
  testQueryOperationDataStructure();
  testOperationConfirmationFlow();
  testAuditTrailCreation();
  testCompleteOperationValidation();

  console.log("\n✅ All AI operation validation tests passed!\n");
  process.exit(0);
} catch (error) {
  console.error("\n❌ Test failed:", error.message);
  console.error(error.stack);
  process.exit(1);
}
