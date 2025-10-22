import { AIOperationHistory } from "@/components/ai/AIOperationHistory";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

/**
 * AI Operation History Page
 * 
 * Displays the complete history of AI operations for the current user.
 * Provides transparency and audit trail for all AI-suggested actions.
 */
export default function AIHistoryPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto p-4 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/home">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">AI Operation History</h1>
            <p className="text-sm text-muted-foreground">
              View all AI assistant interactions and operations
            </p>
          </div>
        </div>

        {/* History Component */}
        <AIOperationHistory />
      </div>
    </div>
  );
}
