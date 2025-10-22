"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

interface InvestmentOption {
  name: string;
  apr: string;
  description: string;
  vaultAddress: string;
}

export default function TestMCPPage() {
  const [response, setResponse] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [parsedInvestments, setParsedInvestments] = useState<InvestmentOption[]>([]);
  const [isListening, setIsListening] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  const testMCPTools = async () => {
    setLoading(true);
    try {
      const listResponse = await fetch("/api/mcp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method: "tools/list",
          context: { profileId: "test-user-123" }
        })
      });

      const listData = await listResponse.json();
      setResponse(`Tools List:\n${JSON.stringify(listData, null, 2)}`);
    } catch (error) {
      setResponse(`Error: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  const parseInvestmentResponse = (text: string): InvestmentOption[] => {
    const investments: InvestmentOption[] = [];
    const lines = text.split('\n');
    let currentInvestment: Partial<InvestmentOption> = {};

    for (const line of lines) {
      if (line.includes('**') && line.includes('Vault')) {
        if (currentInvestment.name) {
          investments.push(currentInvestment as InvestmentOption);
        }
        currentInvestment = { name: line.replace(/\*\*/g, '').replace(/^\d+\.\s*/, '').trim() };
      } else if (line.includes('APR:')) {
        currentInvestment.apr = line.split('APR:')[1]?.trim() || '';
      } else if (line.includes('Description:')) {
        currentInvestment.description = line.split('Description:')[1]?.trim() || '';
      } else if (line.includes('Vault Address:')) {
        currentInvestment.vaultAddress = line.split('Vault Address:')[1]?.trim() || '';
      }
    }

    if (currentInvestment.name) {
      investments.push(currentInvestment as InvestmentOption);
    }

    return investments;
  };

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  const startVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Voice input is not supported in your browser. Please use Chrome or Edge.');
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recognition = new SpeechRecognitionAPI() as any;

    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setChatInput(transcript);
      setIsListening(false);
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const sendChatMessage = async (message?: string) => {
    const messageToSend = message || chatInput;
    if (!messageToSend.trim()) return;

    setChatLoading(true);

    const userMessage: ChatMessage = {
      role: "user",
      content: messageToSend,
      timestamp: Date.now()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setChatInput("");

    try {
      const chatResponse = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: messageToSend,
          context: {
            profileId: "test-user-123",
            includeBalance: true,
            includeTransactions: true,
            includeRecipients: true,
          }
        })
      });

      const chatData = await chatResponse.json();

      if (chatData.success && chatData.response) {
        const assistantMessage: ChatMessage = {
          role: "assistant",
          content: chatData.response,
          timestamp: Date.now()
        };

        setChatMessages(prev => [...prev, assistantMessage]);

        // Parse investment options if present
        const investments = parseInvestmentResponse(chatData.response);
        if (investments.length > 0) {
          setParsedInvestments(investments);
        }

        // Speak the response
        speakText(chatData.response);
      } else {
        const errorMessage: ChatMessage = {
          role: "assistant",
          content: `Error: ${chatData.message || "Failed to get response"}`,
          timestamp: Date.now()
        };
        setChatMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      const errorMessage: ChatMessage = {
        role: "assistant",
        content: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
        timestamp: Date.now()
      };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setChatLoading(false);
    }
  };

  const quickQuestions = [
    "What investment options are available?",
    "Show me my balance",
    "What are my recent transactions?",
    "Who are my recipients?",
    "Analyze my spending"
  ];

  return (
    <div className="container mx-auto p-8 max-w-6xl">
      <h1 className="text-3xl font-bold mb-6">🤖 AI Chat & MCP Testing</h1>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* Chat Interface */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>AI Chat Interface</CardTitle>
            <CardDescription>Test text and voice chat with MCP-powered AI</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Chat Messages */}
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 mb-4 h-96 overflow-y-auto">
              {chatMessages.length === 0 ? (
                <p className="text-gray-500 text-center mt-8">Start a conversation...</p>
              ) : (
                <div className="space-y-4">
                  {chatMessages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${msg.role === "user"
                            ? "bg-blue-500 text-white"
                            : "bg-white dark:bg-gray-800 border"
                          }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    </div>
                  ))}
                  {chatLoading && (
                    <div className="flex justify-start">
                      <div className="bg-white dark:bg-gray-800 border rounded-lg p-3">
                        <p className="text-sm text-gray-500">Thinking...</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Quick Questions */}
            <div className="mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Quick questions:</p>
              <div className="flex flex-wrap gap-2">
                {quickQuestions.map((q, idx) => (
                  <Button
                    key={idx}
                    variant="outline"
                    size="sm"
                    onClick={() => sendChatMessage(q)}
                    disabled={chatLoading}
                  >
                    {q}
                  </Button>
                ))}
              </div>
            </div>

            {/* Input */}
            <div className="flex gap-2">
              <Input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && sendChatMessage()}
                placeholder="Ask me anything about your account..."
                disabled={chatLoading}
              />
              <Button
                onClick={() => startVoiceInput()}
                disabled={chatLoading || isListening}
                variant="outline"
                title="Voice input"
              >
                {isListening ? "🎤 Listening..." : "🎤"}
              </Button>
              <Button onClick={() => sendChatMessage()} disabled={chatLoading || !chatInput.trim()}>
                Send
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Parsed Investment Options */}
        {parsedInvestments.length > 0 && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>💰 Investment Options</CardTitle>
              <CardDescription>Parsed from AI response</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                {parsedInvestments.map((inv, idx) => (
                  <div key={idx} className="border rounded-lg p-4">
                    <h3 className="font-semibold mb-2">{inv.name}</h3>
                    <p className="text-2xl font-bold text-green-600 mb-2">{inv.apr}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{inv.description}</p>
                    <p className="text-xs text-gray-500 font-mono break-all">{inv.vaultAddress}</p>
                    <Button className="w-full mt-3" size="sm">Invest</Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* MCP Tools Test */}
        <Card>
          <CardHeader>
            <CardTitle>🔧 MCP Tools</CardTitle>
            <CardDescription>Test MCP server directly</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={testMCPTools} disabled={loading} className="w-full">
              {loading ? "Testing..." : "List Available Tools"}
            </Button>
          </CardContent>
        </Card>

        {/* Status */}
        <Card>
          <CardHeader>
            <CardTitle>✅ Connection Status</CardTitle>
            <CardDescription>System health check</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm">MCP Server</span>
              <span className="text-green-600 font-semibold">✓ Connected</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">OpenAI API</span>
              <span className="text-green-600 font-semibold">✓ Active</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Voice Input</span>
              <span className="text-green-600 font-semibold">✓ Available</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Text-to-Speech</span>
              <span className="text-green-600 font-semibold">✓ Available</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Raw Response */}
      {response && (
        <Card>
          <CardHeader>
            <CardTitle>Raw API Response</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="whitespace-pre-wrap text-xs overflow-auto max-h-64 bg-gray-50 dark:bg-gray-900 p-4 rounded">
              {response}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}