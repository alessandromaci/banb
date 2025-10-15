import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

/**
 * Validate operation data based on type
 */
function validateOperation(
  operationType: string,
  operationData: Record<string, unknown>
): { valid: boolean; error?: string } {
  switch (operationType) {
    case "payment":
      if (!operationData.amount || !operationData.recipientName) {
        return { valid: false, error: "Payment requires amount and recipient" };
      }
      // Validate amount format
      const amount = parseFloat(operationData.amount as string);
      if (isNaN(amount) || amount <= 0) {
        return { valid: false, error: "Invalid payment amount" };
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
 */
async function executePayment(
  profileId: string,
  operationData: Record<string, unknown>
): Promise<{ success: boolean; result?: Record<string, unknown>; error?: string }> {
  try {
    const { amount, recipientName } = operationData;

    // Find recipient by name
    const { data: recipients, error: recipientError } = await supabase
      .from("recipients")
      .select("*")
      .eq("profile_id", profileId)
      .eq("status", "active")
      .ilike("name", recipientName as string)
      .limit(1);

    if (recipientError || !recipients || recipients.length === 0) {
      return {
        success: false,
        error: `Recipient "${recipientName}" not found`,
      };
    }

    const recipient = recipients[0];

    // Create pending transaction
    const { data: transaction, error: txError } = await supabase
      .from("transactions")
      .insert({
        sender_profile_id: profileId,
        recipient_id: recipient.id,
        chain: "base",
        amount: amount as string,
        token: "USDC",
        status: "pending",
      })
      .select()
      .single();

    if (txError || !transaction) {
      return {
        success: false,
        error: "Failed to create transaction",
      };
    }

    // Return transaction for client-side blockchain execution
    return {
      success: true,
      result: {
        transactionId: transaction.id,
        recipientAddress: recipient.external_address,
        amount: amount,
        status: "pending",
        message: "Transaction created. Please confirm in your wallet to complete the payment.",
      },
    };
  } catch (error) {
    console.error("Payment execution error:", error);
    return {
      success: false,
      error: "Payment execution failed",
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
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { operationId, confirmed } = body;

    // Validate input
    if (!operationId || typeof operationId !== "string") {
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
      return NextResponse.json(
        { success: false, message: "Operation not found" },
        { status: 404 }
      );
    }

    // Check if already executed
    if (operation.executed) {
      return NextResponse.json(
        { success: false, message: "Operation already executed" },
        { status: 400 }
      );
    }

    // Validate operation
    const validation = validateOperation(operation.operation_type, operation.operation_data);
    if (!validation.valid) {
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

    // Update operation record
    await supabase
      .from("ai_operations")
      .update({
        user_confirmed: true,
        executed: true,
        execution_result: executionResult.result || { error: executionResult.error },
        executed_at: new Date().toISOString(),
      })
      .eq("id", operationId);

    return NextResponse.json({
      success: executionResult.success,
      result: executionResult.result,
      message: executionResult.error,
    });
  } catch (error) {
    console.error("AI execute error:", error);
    return NextResponse.json(
      { success: false, message: "Operation execution failed" },
      { status: 500 }
    );
  }
}
