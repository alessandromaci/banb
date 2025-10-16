"use client";

import { useState } from "react";
import { type ParsedAIOperation, executeAIOperation } from "@/lib/ai-agent";
import { useUser } from "@/lib/user-context";
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
import { AlertTriangle, DollarSign, TrendingUp, HelpCircle, Loader2 } from "lucide-react";
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
  const { toast } = useToast();
  const [isExecuting, setIsExecuting] = useState(false);
  const [open, setOpen] = useState(true);

  const handleConfirm = async () => {
    if (!profile?.id) {
      toast({
        title: "Error",
        description: "User not authenticated",
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
          {/* Operation Details */}
          <Card className="p-4">
            <OperationDetails operation={operation} />
          </Card>

          {/* Security Warning for Payments */}
          {operation.type === "payment" && (
            <Card className="p-4 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                    Payment Operation
                  </p>
                  <p className="text-xs text-amber-800 dark:text-amber-200">
                    This will send real funds from your wallet. Make sure the recipient and amount are correct before confirming.
                  </p>
                </div>
              </div>
            </Card>
          )}

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
            disabled={isExecuting}
            className="w-full sm:w-auto"
          >
            {isExecuting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Confirm"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Operation Details Component
 * Displays operation-specific details based on type.
 */
function OperationDetails({ operation }: { operation: ParsedAIOperation }) {
  switch (operation.type) {
    case "payment":
      return (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Type</span>
            <span className="text-sm font-medium">Payment</span>
          </div>
          {operation.data.amount && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Amount</span>
              <span className="text-sm font-medium">
                {operation.data.amount} {operation.data.token || "USDC"}
              </span>
            </div>
          )}
          {operation.data.to && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">To</span>
              <span className="text-sm font-mono">
                {operation.data.to.slice(0, 6)}...{operation.data.to.slice(-4)}
              </span>
            </div>
          )}
          {operation.data.chain && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Network</span>
              <span className="text-sm font-medium capitalize">{operation.data.chain}</span>
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
