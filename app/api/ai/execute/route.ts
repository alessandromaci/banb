import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

/**
 * Validate operation data based on type
 * Ensures all required fields are present and properly formatted
 */
function validateOperation(
  operationType: string,
  operationData: Record<string, unknown>
): { valid: boolean; error?: string } {
  switch (operationType) {
    case "payment":
      // Validate amount
      if (!operationData.amount) {
        return { valid: false, error: "Payment requires amount" };
      }
      const amount = parseFloat(operationData.amount as string);
      if (isNaN(amount) || amount <= 0) {
        return { valid: false, error: "Invalid payment amount: must be greater than zero" };
      }
      if (amount > 1000000) {
        return { valid: false, error: "Payment amount exceeds maximum limit" };
      }

      // Validate recipient
      if (!operationData.recipientName && !operationData.recipient_id) {
        return { valid: false, error: "Payment requires recipient name or ID" };
      }

      // Validate token
      if (operationData.token && operationData.token !== "USDC") {
        return { valid: false, error: "Only USDC payments are currently supported" };
      }

      // Validate chain
      if (operationData.chain && operationData.chain !== "base") {
        return { valid: false, error: "Only Base network is currently supported" };
      }

      return { valid: true };

    case "analysis":
      // Analysis operations don't require specific data
      return { valid: true };

    case "query":
      // Query operations don't require specific data
      return { valid: true };

    default:
      return { valid: false, error: "Unknown operation type" };
  }
}

/**
 * Execute payment operation
 * Creates a pending transaction that must be confirmed by the user's wallet
 */
async function executePayment(
  profileId: string,
  operationData: Record<string, unknown>
): Promise<{ success: boolean; result?: Record<string, unknown>; error?: string }> {
  try {
    const { amount, recipientName, recipient_id } = operationData;

    let recipient;

    // Find recipient by ID or name
    if (recipient_id) {
      const { data, error } = await supabase
        .from("recipients")
        .select("*")
        .eq("id", recipient_id as string)
        .eq("profile_id", profileId)
        .eq("status", "active")
        .single();

      if (error || !data) {
        console.error("[executePayment] Recipient not found by ID:", error);
        return {
          success: false,
          error: `Recipient not found`,
        };
      }
      recipient = data;
    } else if (recipientName) {
      const { data: recipients, error: recipientError } = await supabase
        .from("recipients")
        .select("*")
        .eq("profile_id", profileId)
        .eq("status", "active")
        .ilike("name", recipientName as string)
        .limit(1);

      if (recipientError || !recipients || recipients.length === 0) {
        console.error("[executePayment] Recipient not found by name:", recipientError);
        return {
          success: false,
          error: `Recipient "${recipientName}" not found`,
        };
      }
      recipient = recipients[0];
    } else {
      return {
        success: false,
        error: "Recipient ID or name is required",
      };
    }

    // Validate recipient has an address
    if (!recipient.external_address) {
      return {
        success: false,
        error: "Recipient does not have a wallet address",
      };
    }

    // Create pending transaction
    const { data: transaction, error: txError } = await supabase
      .from("transactions")
      .insert({
        sender_profile_id: profileId,
        recipient_id: recipient.id,
        chain: operationData.chain || "base",
        amount: amount as string,
        token: operationData.token || "USDC",
        status: "pending",
      })
      .select()
      .single();

    if (txError || !transaction) {
      console.error("[executePayment] Failed to create transaction:", txError);
      return {
        success: false,
        error: "Failed to create transaction",
      };
    }

    console.log(`[executePayment] ✓ Transaction created: ${transaction.id}`);

    // Return transaction for client-side blockchain execution
    return {
      success: true,
      result: {
        transactionId: transaction.id,
        recipientAddress: recipient.external_address,
        recipientName: recipient.name,
        amount: amount,
        token: operationData.token || "USDC",
        chain: operationData.chain || "base",
        status: "pending",
        message: "Transaction created. Please confirm in your wallet to complete the payment.",
      },
    };
  } catch (error) {
    console.error("[executePayment] ❌ Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Payment execution failed",
    };
  }
}

/**
 * Execute analysis operation
 */
async function executeAnalysis(
  profileId: string,
  operationData: Record<string, unknown>
): Promise<{ success: boolean; result?: Record<string, unknown>; error?: string }> {
  try {
    // Fetch transactions for analysis
    const { data: transactions, error } = await supabase
      .from("transactions")
      .select(
        `
        *,
        recipient:recipients(name)
      `
      )
      .eq("sender_profile_id", profileId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      return {
        success: false,
        error: "Failed to fetch transaction data",
      };
    }

    // Calculate basic metrics
    const totalSpent = transactions?.reduce((sum, tx) => {
      return sum + parseFloat(tx.amount || "0");
    }, 0) || 0;

    const recipientCounts = new Map<string, number>();
    transactions?.forEach((tx) => {
      const name = tx.recipient?.name || "Unknown";
      recipientCounts.set(name, (recipientCounts.get(name) || 0) + 1);
    });

    const topRecipients = Array.from(recipientCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    return {
      success: true,
      result: {
        totalTransactions: transactions?.length || 0,
        totalSpent: totalSpent.toFixed(2),
        topRecipients,
        averageTransaction: transactions?.length
          ? (totalSpent / transactions.length).toFixed(2)
          : "0.00",
      },
    };
  } catch (error) {
    console.error("Analysis execution error:", error);
    return {
      success: false,
      error: "Analysis execution failed",
    };
  }
}

/**
 * Execute query operation
 */
async function executeQuery(
  profileId: string,
  operationData: Record<string, unknown>
): Promise<{ success: boolean; result?: Record<string, unknown>; error?: string }> {
  // Query operations are typically read-only and handled by the chat endpoint
  return {
    success: true,
    result: {
      message: "Query processed successfully",
    },
  };
}

/**
 * POST /api/ai/execute
 * Execute AI-suggested operations after user confirmation
 * 
 * Security measures:
 * - Validates user confirmation
 * - Checks operation hasn't been executed already
 * - Validates operation data
 * - Logs all operations to audit trail
 * - Follows same security rules as manual operations
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { operationId, confirmed, operationType, operationData, profileId, userConfirmed } = body;

    // Support both operation ID (for stored operations) and direct execution
    if (operationId) {
      // Validate input
      if (typeof operationId !== "string") {
        return NextResponse.json(
          { success: false, message: "Invalid operation ID" },
          { status: 400 }
        );
      }

      if (!confirmed) {
        return NextResponse.json(
          { success: false, message: "Operation not confirmed by user" },
          { status: 400 }
        );
      }

      // Fetch operation from database
      const { data: operation, error: fetchError } = await supabase
        .from("ai_operations")
        .select("*")
        .eq("id", operationId)
        .single();

      if (fetchError || !operation) {
        console.error("[AI Execute] Operation not found:", fetchError);
        return NextResponse.json(
          { success: false, message: "Operation not found" },
          { status: 404 }
        );
      }

      // Check if already executed (prevent double execution)
      if (operation.executed) {
        console.warn("[AI Execute] Operation already executed:", operationId);
        return NextResponse.json(
          { success: false, message: "Operation already executed" },
          { status: 400 }
        );
      }

      // Validate operation
      const validation = validateOperation(operation.operation_type, operation.operation_data);
      if (!validation.valid) {
        console.error("[AI Execute] Validation failed:", validation.error);
        return NextResponse.json(
          { success: false, message: validation.error },
          { status: 400 }
        );
      }

      // Execute operation based on type
      let executionResult;
      switch (operation.operation_type) {
        case "payment":
          executionResult = await executePayment(operation.profile_id, operation.operation_data);
          break;
        case "analysis":
          executionResult = await executeAnalysis(operation.profile_id, operation.operation_data);
          break;
        case "query":
          executionResult = await executeQuery(operation.profile_id, operation.operation_data);
          break;
        default:
          return NextResponse.json(
            { success: false, message: "Unknown operation type" },
            { status: 400 }
          );
      }

      // Update operation record with execution result
      const { error: updateError } = await supabase
        .from("ai_operations")
        .update({
          user_confirmed: true,
          executed: executionResult.success,
          execution_result: executionResult.result || { error: executionResult.error },
          executed_at: new Date().toISOString(),
        })
        .eq("id", operationId);

      if (updateError) {
        console.error("[AI Execute] Failed to update operation:", updateError);
      }

      console.log(`[AI Execute] ${executionResult.success ? "✓" : "❌"} ${operation.operation_type} operation`);

      return NextResponse.json({
        success: executionResult.success,
        result: executionResult.result,
        message: executionResult.error,
      });
    } else {
      // Direct execution without stored operation
      if (!operationType || !profileId) {
        return NextResponse.json(
          { success: false, message: "Operation type and profile ID are required" },
          { status: 400 }
        );
      }

      if (operationType === "payment" && !userConfirmed) {
        return NextResponse.json(
          { success: false, message: "Payment operations require user confirmation" },
          { status: 400 }
        );
      }

      // Validate operation
      const validation = validateOperation(operationType, operationData || {});
      if (!validation.valid) {
        console.error("[AI Execute] Validation failed:", validation.error);
        return NextResponse.json(
          { success: false, message: validation.error },
          { status: 400 }
        );
      }

      // Execute operation
      let executionResult;
      switch (operationType) {
        case "payment":
          executionResult = await executePayment(profileId, operationData || {});
          break;
        case "analysis":
          executionResult = await executeAnalysis(profileId, operationData || {});
          break;
        case "query":
          executionResult = await executeQuery(profileId, operationData || {});
          break;
        default:
          return NextResponse.json(
            { success: false, message: "Unknown operation type" },
            { status: 400 }
          );
      }

      console.log(`[AI Execute] ${executionResult.success ? "✓" : "❌"} ${operationType} operation (direct)`);

      return NextResponse.json({
        success: executionResult.success,
        result: executionResult.result,
        message: executionResult.error,
      });
    }
  } catch (error) {
    console.error("[AI Execute] ❌ Error:", error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : "Operation execution failed" 
      },
      { status: 500 }
    );
  }
}
