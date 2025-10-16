"use client";

import { AIAgentChat } from "@/components/ai/AIAgentChat";
import { Card } from "@/components/ui/card";

/**
 * AI Banking Assistant Demo Page
 * 
 * Standalone demo page for testing the AI-powered banking assistant.
 * This page can be accessed at /ai-assistant for full-screen chat experience.
 */
export default function AIAssistantDemo() {
  return (
    <div className="min-h-screen bg-background p-4">
      <div className="mx-auto max-w-4xl space-y-4">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">AI Banking Assistant</h1>
          <p className="text-muted-foreground">
            Your intelligent banking companion
          </p>
        </div>

        <Card className="h-[600px] overflow-hidden">
          <AIAgentChat />
        </Card>

        <Card className="p-4 bg-muted/50">
          <h3 className="font-semibold mb-2">What I Can Help With</h3>
          <ul className="text-sm space-y-1 text-muted-foreground">
            <li>• Analyze your spending patterns and trends</li>
            <li>• Provide portfolio insights and recommendations</li>
            <li>• Help you send payments to recipients</li>
            <li>• Answer questions about your transactions and balance</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
