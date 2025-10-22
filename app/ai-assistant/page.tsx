"use client";

import { AIAgentChat } from "@/components/ai/AIAgentChat";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

/**
 * AI Banking Assistant Page
 * 
 * Full-screen AI chat interface for banking operations.
 * Accessible at /ai-assistant for dedicated AI interaction experience.
 */
export default function AIAssistantPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#3B1EFF] via-[#5B3FFF] to-[#1A0F3D]">
      <div className="mx-auto max-w-4xl p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="text-white hover:bg-white/10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white">AI Banking Assistant</h1>
            <p className="text-sm text-white/70">Your intelligent banking companion</p>
          </div>
        </div>

        {/* Chat Interface */}
        <Card className="h-[calc(100vh-180px)] overflow-hidden bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm">
          <AIAgentChat />
        </Card>

        {/* Info Card */}
        <Card className="p-4 bg-white/10 backdrop-blur-sm border-white/20">
          <h3 className="font-semibold mb-2 text-white">What I Can Help With</h3>
          <ul className="text-sm space-y-1 text-white/80">
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
