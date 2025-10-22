"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function DevPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            🚧 Banb Development Mode
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Authentication bypassed - Test all features without wallet connection
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* MCP Testing */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
              🤖 MCP Integration
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Test the Model Context Protocol integration with OpenAI function calling.
            </p>
            <div className="space-y-3">
              <Link href="/test-mcp">
                <Button className="w-full">Test MCP Tools & AI Chat</Button>
              </Link>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                • Test all 5 MCP tools
                • AI chat with function calling
                • Mock data responses
              </div>
            </div>
          </div>

          {/* API Testing */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
              🔧 API Endpoints
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Direct API testing without frontend complexity.
            </p>
            <div className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => window.open('/api/mcp', '_blank')}
              >
                GET /api/mcp (Info)
              </Button>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                • MCP server information
                • Available tools list
                • API documentation
              </div>
            </div>
          </div>

          {/* Configuration Status */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
              ⚙️ Configuration Status
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-300">Development Mode</span>
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">
                  ✅ Active
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-300">Privy Auth</span>
                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-sm">
                  🚧 Bypassed
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-300">MCP Server</span>
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">
                  ✅ Running
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-300">OpenAI API</span>
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">
                  ✅ Configured
                </span>
              </div>
            </div>
          </div>

          {/* Documentation */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
              📚 Documentation
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Setup guides and technical documentation.
            </p>
            <div className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => window.open('/docs/MCP_SETUP.md', '_blank')}
              >
                MCP Setup Guide
              </Button>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                • OpenAI API configuration
                • Available MCP tools
                • Troubleshooting guide
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
            🚀 Quick Actions
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            <Button 
              onClick={() => {
                fetch('/api/mcp', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    method: 'tools/list',
                    context: { profileId: 'dev-user-123' }
                  })
                }).then(r => r.json()).then(console.log);
              }}
            >
              Test MCP Tools List
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => {
                fetch('/api/ai/chat', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    message: 'What investment options are available?',
                    context: { profileId: 'dev-user-123' }
                  })
                }).then(r => r.json()).then(console.log);
              }}
            >
              Test AI Chat
            </Button>

            <Link href="/">
              <Button variant="secondary" className="w-full">
                Back to Landing Page
              </Button>
            </Link>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
            💡 Check browser console for API responses
          </p>
        </div>
      </div>
    </div>
  );
}