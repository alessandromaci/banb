"use client";

import { useState } from "react";
import { type ParsedAIOperation, executeAIOperation } from "@/lib/ai-agent";
import { useUser } from "@/lib/user-context";
import { useUSDCBalance } from "@/lib/payments";
import { useAccount } from "wagmi";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertTriangle, DollarSign, TrendingUp, HelpCircle, Loader2, Shield, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AIOperationConfirmationProps {
  operation: ParsedAIOperation;
  onConfirm: () => void;
  onReject: () => void;
}

/**
 * AI Operation Confirmation Component
 * 
 * Displays a confirmation modal for AI-suggested operations.
 * Shows operation details, security warnings for payments, and approve/reject buttons.
 * 
 * @component
 * @param {ParsedAIOperation} operation - The operation to confirm
 * @param {Function} onConfirm - Callback when user confirms
 * @param {Function} onReject - Callback when user rejects
 * 
 * @example
 * ```tsx
 * <AIOperationConfirmation
 *   operation={pendingOperation}
 *   onConfirm={() => console.log("Confirmed")}
 *   onReject={() => console.log("Rejected")}
 * />
 * ```
 */
export function AIOperationConfirmation({
  operation,
  onConfirm,
  onReject,
}: AIOperationConfirmationProps) {
  const { profile } = useUser();
  const { address } = useAccount();
  const { formattedBalance } = useUSDCBalance(address);
  const { toast } = useToast();
  const [isExecuting, setIsExecuting] = useState(false);
  const [open, setOpen] = useState(true);
  const [securityAcknowledged, setSecurityAcknowledged] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Validate operation on mount
  useState(() => {
    const errors = validateOperation(operation, formattedBalance);
    setValidationErrors(errors);
  });

  const handleConfirm = async () => {
    if (!profile?.id) {
      toast({
        title: "Error",
        description: "User not authenticated",
        variant: "destructive",
      });
      return;
    }

    // Require security acknowledgment for payment operations
    if (operation.type === "payment" && !securityAcknowledged) {
      toast({
        title: "Security Acknowledgment Required",
        description: "Please confirm you understand this will send real funds",
        variant: "destructive",
      });
      return;
    }

    // Check for validation errors
    if (validationErrors.length > 0) {
      toast({
        title: "Validation Failed",
        description: validationErrors[0],
        variant: "destructive",
      });
      return;
    }

    setIsExecuting(true);

    try {
      const result = await executeAIOperation(operation, true, profile.id);

      if (result.success) {
        toast({
          title: "Success",
          description: getSuccessMessage(operation.type),
        });
        setOpen(false);
        onConfirm();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Operation failed";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const handleReject = () => {
    setOpen(false);
    onReject();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleReject()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getOperationIcon(operation.type)}
            Confirm AI Operation
          </DialogTitle>
          <DialogDescription>
            Review the details below and confirm to proceed.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <Card className="p-4 bg-destructive/10 border-destructive">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-destructive">
                    Validation Failed
                  </p>
                  <ul className="text-xs text-destructive/90 list-disc list-inside space-y-1">
                    {validationErrors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </Card>
          )}

          {/* Operation Details */}
          <Card className="p-4">
            <OperationDetails operation={operation} balance={formattedBalance} />
          </Card>

          {/* Security Warning for Payments */}
          {operation.type === "payment" && (
            <>
              <Card className="p-4 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" />
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                      Payment Security Warning
                    </p>
                    <ul className="text-xs text-amber-800 dark:text-amber-200 space-y-1">
                      <li>• This will send real USDC from your wallet</li>
                      <li>• Blockchain transactions cannot be reversed</li>
                      <li>• Verify the recipient address is correct</li>
                      <li>• You will need to approve the transaction in your wallet</li>
                    </ul>
                  </div>
                </div>
              </Card>

              {/* Security Acknowledgment Checkbox */}
              <div className="flex items-start gap-3 p-4 border rounded-lg">
                <Checkbox
                  id="security-ack"
                  checked={securityAcknowledged}
                  onCheckedChange={(checked) => setSecurityAcknowledged(checked === true)}
                  disabled={validationErrors.length > 0}
                />
                <label
                  htmlFor="security-ack"
                  className="text-sm leading-tight cursor-pointer"
                >
                  I understand this will send real funds and I have verified the recipient and amount are correct
                </label>
              </div>
            </>
          )}

          {/* Security Badge */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Shield className="h-4 w-4" />
            <span>All AI operations are logged for security and audit purposes</span>
          </div>

          {/* Explanation */}
          <div className="text-sm text-muted-foreground">
            {getOperationExplanation(operation.type)}
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={handleReject}
            disabled={isExecuting}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={
              isExecuting ||
              validationErrors.length > 0 ||
              (operation.type === "payment" && !securityAcknowledged)
            }
            className="w-full sm:w-auto"
          >
            {isExecuting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Confirm & Execute"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Validates an operation before execution
 */
function validateOperation(operation: ParsedAIOperation, balance?: string): string[] {
  const errors: string[] = [];

  switch (operation.type) {
    case "payment":
      // Validate amount
      if (!operation.data.amount) {
        errors.push("Payment amount is required");
      } else {
        const amount = parseFloat(operation.data.amount as string);
        if (isNaN(amount) || amount <= 0) {
          errors.push("Payment amount must be greater than zero");
        }

        // Check balance
        if (balance) {
          const balanceNum = parseFloat(balance);
          if (!isNaN(balanceNum) && amount > balanceNum) {
            errors.push(`Insufficient balance. You have ${balance} USDC but trying to send ${amount} USDC`);
          }
        }
      }

      // Validate recipient
      if (!operation.data.to && !operation.data.recipient_id) {
        errors.push("Recipient address or ID is required");
      }

      // Validate address format if provided
      if (operation.data.to && typeof operation.data.to === "string") {
        const address = operation.data.to as string;
        if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
          errors.push("Invalid recipient address format");
        }
      }

      // Validate chain
      if (!operation.data.chain) {
        errors.push("Blockchain network is required");
      }
      break;

    case "analysis":
      // Analysis operations don't require validation
      break;

    case "query":
      // Query operations don't require validation
      break;

    default:
      errors.push("Unknown operation type");
  }

  return errors;
}

/**
 * Operation Details Component
 * Displays operation-specific details based on type.
 */
function OperationDetails({
  operation,
  balance
}: {
  operation: ParsedAIOperation;
  balance?: string;
}) {
  switch (operation.type) {
    case "payment":
      return (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Type</span>
            <span className="text-sm font-medium">Payment</span>
          </div>
          {operation.data.amount != null && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Amount</span>
              <span className="text-sm font-medium">
                {String(operation.data.amount)} {String(operation.data.token) || "USDC"}
              </span>
            </div>
          )}
          {balance && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Your Balance</span>
              <span className="text-sm font-medium">{balance} USDC</span>
            </div>
          )}
          {operation.data.to != null && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">To</span>
              <span className="text-sm font-mono">
                {String(operation.data.to).slice(0, 6)}...{String(operation.data.to).slice(-4)}
              </span>
            </div>
          )}
          {operation.data.chain != null && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Network</span>
              <span className="text-sm font-medium capitalize">{String(operation.data.chain)}</span>
            </div>
          )}
        </div>
      );

    case "analysis":
      return (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Type</span>
            <span className="text-sm font-medium">Portfolio Analysis</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Generate insights about your spending patterns and transaction history.
          </p>
        </div>
      );

    case "query":
      return (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Type</span>
            <span className="text-sm font-medium">Information Query</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Retrieve information about your account and transactions.
          </p>
        </div>
      );

    default:
      return (
        <div className="text-sm text-muted-foreground">
          Unknown operation type
        </div>
      );
  }
}

/**
 * Get icon for operation type
 */
function getOperationIcon(type: string) {
  switch (type) {
    case "payment":
      return <DollarSign className="h-5 w-5" />;
    case "analysis":
      return <TrendingUp className="h-5 w-5" />;
    case "query":
      return <HelpCircle className="h-5 w-5" />;
    default:
      return null;
  }
}

/**
 * Get explanation text for operation type
 */
function getOperationExplanation(type: string): string {
  switch (type) {
    case "payment":
      return "The AI assistant has suggested a payment. This will execute a blockchain transaction from your connected wallet.";
    case "analysis":
      return "The AI assistant will analyze your transaction history to provide spending insights and patterns.";
    case "query":
      return "The AI assistant will retrieve information from your account to answer your question.";
    default:
      return "The AI assistant has suggested an operation.";
  }
}

/**
 * Get success message for operation type
 */
function getSuccessMessage(type: string): string {
  switch (type) {
    case "payment":
      return "Payment initiated successfully";
    case "analysis":
      return "Analysis completed successfully";
    case "query":
      return "Query completed successfully";
    default:
      return "Operation completed successfully";
  }
}
