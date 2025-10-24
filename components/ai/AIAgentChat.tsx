"use client";

import React, { useState, useRef, useEffect } from "react";
import { useUser } from "@/lib/user-context";
import { useAccount } from "wagmi";
import { useAIAgent, type AIAgentMessage, type ParsedAIOperation } from "@/lib/ai-agent";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Loader2, Send, Sparkles, TrendingUp, DollarSign, Users, History } from "lucide-react";
import { AIOperationConfirmation } from "./AIOperationConfirmation";
import { useRouter } from "next/navigation";

/**
 * AI Agent Chat Interface Component
 * 
 * Provides a conversational interface for AI-powered banking operations.
 * Features message history, suggested prompts, typing indicators, and operation confirmations.
 * 
 * @component
 * @example
 * ```tsx
 * <AIAgentChat />
 * ```
 */
export function AIAgentChat() {
  const { profile, isLoading: isLoadingProfile } = useUser();
  const { address } = useAccount();
  const router = useRouter();
  const [inputValue, setInputValue] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    isProcessing,
    sendMessage,
    clearHistory,
    error,
    pendingOperation,
  } = useAIAgent(profile?.id || "", address);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Show confirmation modal when operation is pending
  useEffect(() => {
    if (pendingOperation) {
      setShowConfirmation(true);
    }
  }, [pendingOperation]);

  const handleSend = async () => {
    if (!inputValue.trim() || isProcessing) return;

    const message = inputValue.trim();
    setInputValue("");
    await sendMessage(message);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestedPrompt = (prompt: string) => {
    setInputValue(prompt);
  };

  const suggestedPrompts = [
    {
      icon: <TrendingUp className="h-4 w-4" />,
      text: "Analyze my spending this month",
    },
    {
      icon: <Users className="h-4 w-4" />,
      text: "Who do I send money to most often?",
    },
    {
      icon: <DollarSign className="h-4 w-4" />,
      text: "Show my balance trend",
    },
  ];

  // Show loading state while profile is being loaded
  if (isLoadingProfile) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading your profile...</p>
      </div>
    );
  }

  // Show authentication required if no profile
  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center space-y-4">
        <Sparkles className="h-12 w-12 text-muted-foreground" />
        <div>
          <h3 className="font-semibold text-lg mb-2">Authentication Required</h3>
          <p className="text-muted-foreground">Please log in to use the AI assistant</p>
        </div>
        <Button onClick={() => router.push("/home")}>
          Go to Home
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="font-semibold">AI Banking Assistant</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/ai-assistant/history")}
            className="gap-2"
          >
            <History className="h-4 w-4" />
            History
          </Button>
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearHistory}
              disabled={isProcessing}
            >
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full space-y-6">
            <div className="text-center space-y-2">
              <Sparkles className="h-12 w-12 text-primary mx-auto" />
              <h3 className="font-semibold text-lg">Welcome to AI Banking</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                I can help you analyze your spending, manage payments, and provide insights about your portfolio.
              </p>
            </div>

            {/* Suggested Prompts */}
            <div className="w-full max-w-md space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Try asking:</p>
              <div className="grid gap-2">
                {suggestedPrompts.map((prompt, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="justify-start gap-2 h-auto py-3"
                    onClick={() => handleSuggestedPrompt(prompt.text)}
                    disabled={isProcessing}
                  >
                    {prompt.icon}
                    <span className="text-left">{prompt.text}</span>
                  </Button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message, index) => (
              <MessageBubble key={index} message={message} />
            ))}

            {/* Typing Indicator */}
            {isProcessing && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="h-4 w-4 text-primary" />
                </div>
                <Card className="p-3 max-w-[80%]">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">Thinking...</span>
                  </div>
                </Card>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <Card className="p-3 bg-destructive/10 border-destructive">
                <p className="text-sm text-destructive">{error}</p>
              </Card>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything about your banking..."
            disabled={isProcessing}
            className="flex-1"
          />
          <Button
            onClick={handleSend}
            disabled={!inputValue.trim() || isProcessing}
            size="icon"
          >
            {isProcessing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Operation Confirmation Modal */}
      {showConfirmation && pendingOperation && (
        <AIOperationConfirmation
          operation={pendingOperation}
          onConfirm={() => {
            setShowConfirmation(false);
            // Operation execution will be handled by parent component
          }}
          onReject={() => {
            setShowConfirmation(false);
          }}
        />
      )}
    </div>
  );
}

/**
 * Message Bubble Component
 * Displays individual chat messages with appropriate styling based on role.
 */
function MessageBubble({ message }: { message: AIAgentMessage }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex items-start gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      {/* Avatar */}
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
          isUser ? "bg-primary text-primary-foreground" : "bg-primary/10"
        }`}
      >
        {isUser ? (
          <span className="text-xs font-semibold">You</span>
        ) : (
          <Sparkles className="h-4 w-4 text-primary" />
        )}
      </div>

      {/* Message Content */}
      <Card
        className={`p-3 max-w-[80%] ${
          isUser ? "bg-primary text-primary-foreground" : ""
        }`}
      >
        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        <p
          className={`text-xs mt-1 ${
            isUser ? "text-primary-foreground/70" : "text-muted-foreground"
          }`}
        >
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </Card>
    </div>
  );
}
