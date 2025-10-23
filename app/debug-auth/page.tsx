"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useEffect, useState } from "react";

export default function DebugAuthPage() {
  const { ready, authenticated, user, login } = usePrivy();
  const [envVars, setEnvVars] = useState<Record<string, string>>({});
  const [consoleErrors, setConsoleErrors] = useState<string[]>([]);

  useEffect(() => {
    // Check environment variables (client-side only)
    setEnvVars({
      PRIVY_APP_ID: process.env.NEXT_PUBLIC_PRIVY_APP_ID || "NOT SET",
      SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || "NOT SET",
    });

    // Capture console errors
    const originalError = console.error;
    const errors: string[] = [];
    console.error = (...args: any[]) => {
      errors.push(args.map(a => String(a)).join(' '));
      setConsoleErrors([...errors]);
      originalError.apply(console, args);
    };

    return () => {
      console.error = originalError;
    };
  }, []);

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-3xl font-bold mb-8">Auth Debug Page</h1>

      <div className="space-y-6">
        {/* Environment Variables */}
        <section className="bg-white/5 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Environment Variables</h2>
          <div className="space-y-2 font-mono text-sm">
            {Object.entries(envVars).map(([key, value]) => (
              <div key={key}>
                <span className="text-blue-400">{key}:</span>{" "}
                <span className="text-green-400">{value}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Privy Status */}
        <section className="bg-white/5 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Privy Status</h2>
          <div className="space-y-2">
            <div>
              <span className="text-blue-400">Ready:</span>{" "}
              <span className={ready ? "text-green-400" : "text-red-400"}>
                {ready ? "✓ Yes" : "✗ No"}
              </span>
            </div>
            <div>
              <span className="text-blue-400">Authenticated:</span>{" "}
              <span
                className={authenticated ? "text-green-400" : "text-red-400"}
              >
                {authenticated ? "✓ Yes" : "✗ No"}
              </span>
            </div>
            <div>
              <span className="text-blue-400">User:</span>{" "}
              <span className="text-yellow-400">
                {user ? JSON.stringify(user, null, 2) : "null"}
              </span>
            </div>
          </div>
        </section>

        {/* Actions */}
        <section className="bg-white/5 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Actions</h2>
          <button
            onClick={login}
            disabled={!ready}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded-lg font-semibold"
          >
            {ready ? "Test Login" : "Loading..."}
          </button>
        </section>

        {/* Console Errors */}
        <section className="bg-white/5 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Console Errors</h2>
          {consoleErrors.length === 0 ? (
            <p className="text-green-400">No errors detected</p>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {consoleErrors.map((error, i) => (
                <div key={i} className="text-red-400 text-xs font-mono bg-red-900/20 p-2 rounded">
                  {error}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Browser Info */}
        <section className="bg-white/5 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Browser Info</h2>
          <div className="space-y-2 font-mono text-sm">
            <div>
              <span className="text-blue-400">User Agent:</span>{" "}
              <span className="text-gray-400 text-xs break-all">
                {typeof window !== "undefined" ? navigator.userAgent : "N/A"}
              </span>
            </div>
            <div>
              <span className="text-blue-400">URL:</span>{" "}
              <span className="text-gray-400">
                {typeof window !== "undefined" ? window.location.href : "N/A"}
              </span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
