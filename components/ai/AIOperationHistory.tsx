"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/lib/user-context";
import { getAIOperationHistory, type AIOperation } from "@/lib/ai-agent";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DollarSign,
  TrendingUp,
  HelpCircle,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  AlertCircle,
} from "lucide-react";

/**
 * AI Operation History Component
 * 
 * Displays a list of all AI operations performed by the user.
 * Shows operation type, status, timestamp, and execution results.
 * Provides transparency and audit trail for AI-suggested actions.
 * 
 * @component
 * @example
 * ```tsx
 * <AIOperationHistory />
 * ```
 */
export function AIOperationHistory() {
  const { profile } = useUser();
  const [operations, setOperations] = useState<AIOperation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (profile?.id) {
      loadHistory();
    }
  }, [profile?.id]);

  const loadHistory = async () => {
    if (!profile?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      const history = await getAIOperationHistory(profile.id, 50);
      setOperations(history);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load history";
      setError(errorMessage);
      console.error("[AIOperationHistory] Error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!profile) {
    return (
      <Card className="p-6 text-center">
        <p className="text-muted-foreground">Please log in to view AI operation history</p>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-muted-foreground">Loading history...</span>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="flex flex-col items-center gap-4">
          <AlertCircle className="h-8 w-8 text-destructive" />
          <div className="text-center space-y-2">
            <p className="font-medium">Failed to load history</p>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
          <Button onClick={loadHistory} variant="outline">
            Try Again
          </Button>
        </div>
      </Card>
    );
  }

  if (operations.length === 0) {
    return (
      <Card className="p-6 text-center">
        <div className="space-y-2">
          <p className="font-medium">No AI operations yet</p>
          <p className="text-sm text-muted-foreground">
            Your AI assistant interactions will appear here
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">AI Operation History</h3>
        <Button onClick={loadHistory} variant="ghost" size="sm">
          Refresh
        </Button>
      </div>

      <div className="space-y-3">
        {operations.map((operation) => (
          <OperationCard key={operation.id} operation={operation} />
        ))}
      </div>
    </div>
  );
}

/**
 * Operation Card Component
 * Displays a single AI operation with details.
 */
function OperationCard({ operation }: { operation: AIOperation }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className="p-4">
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1">
            {/* Icon */}
            <div className="mt-0.5">{getOperationIcon(operation.operation_type)}</div>

            {/* Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium capitalize">{operation.operation_type}</span>
                {getStatusBadge(operation)}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {new Date(operation.created_at).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Expand Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? "Less" : "More"}
          </Button>
        </div>

        {/* User Message */}
        {operation.user_message && (
          <div className="pl-9">
            <p className="text-sm">
              <span className="font-medium">You: </span>
              {operation.user_message}
            </p>
          </div>
        )}

        {/* Expanded Details */}
        {isExpanded && (
          <div className="pl-9 space-y-3 pt-2 border-t">
            {/* AI Response */}
            {operation.ai_response && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">AI Response</p>
                <p className="text-sm">{operation.ai_response}</p>
              </div>
            )}

            {/* Operation Data */}
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Operation Data</p>
              <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                {JSON.stringify(operation.operation_data, null, 2)}
              </pre>
            </div>

            {/* Execution Result */}
            {operation.execution_result && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  Execution Result
                </p>
                <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                  {JSON.stringify(operation.execution_result, null, 2)}
                </pre>
              </div>
            )}

            {/* Execution Time */}
            {operation.executed_at && (
              <div className="text-xs text-muted-foreground">
                Executed at: {new Date(operation.executed_at).toLocaleString()}
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

/**
 * Get icon for operation type
 */
function getOperationIcon(type: string) {
  switch (type) {
    case "payment":
      return <DollarSign className="h-5 w-5 text-primary" />;
    case "analysis":
      return <TrendingUp className="h-5 w-5 text-primary" />;
    case "query":
      return <HelpCircle className="h-5 w-5 text-primary" />;
    default:
      return <HelpCircle className="h-5 w-5 text-muted-foreground" />;
  }
}

/**
 * Get status badge for operation
 */
function getStatusBadge(operation: AIOperation) {
  if (!operation.user_confirmed) {
    return (
      <Badge variant="secondary" className="gap-1">
        <XCircle className="h-3 w-3" />
        Not Confirmed
      </Badge>
    );
  }

  if (!operation.executed) {
    return (
      <Badge variant="secondary" className="gap-1">
        <Clock className="h-3 w-3" />
        Pending
      </Badge>
    );
  }

  // Check if execution was successful
  const hasError = operation.execution_result?.error;
  if (hasError) {
    return (
      <Badge variant="destructive" className="gap-1">
        <XCircle className="h-3 w-3" />
        Failed
      </Badge>
    );
  }

  return (
    <Badge variant="default" className="gap-1 bg-green-600">
      <CheckCircle className="h-3 w-3" />
      Executed
    </Badge>
  );
}
