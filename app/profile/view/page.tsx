"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Copy } from "lucide-react";
import Link from "next/link";
import { useUser } from "@/lib/user-context";
import { useAccount } from "wagmi";
import { useState } from "react";

export default function ViewProfilePage() {
  const { profile } = useUser();
  const { address } = useAccount();
  const [copied, setCopied] = useState(false);

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!profile) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-white">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <Link href="/profile">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/10"
            >
              <ArrowLeft className="h-6 w-6" />
            </Button>
          </Link>
          <h1 className="text-xl font-semibold">View Profile</h1>
          <div className="w-10" />
        </div>

        {/* Profile Details */}
        <div className="p-6 space-y-4">
          <Card className="bg-white/5 border-white/10 p-4">
            <div className="space-y-4">
              <div>
                <p className="text-sm text-white/60 mb-1">Name</p>
                <p className="text-lg">{profile.name}</p>
              </div>

              <div>
                <p className="text-sm text-white/60 mb-1">Handle</p>
                <p className="text-lg">@{profile.handle}</p>
              </div>

              <div>
                <p className="text-sm text-white/60 mb-1">Wallet Address</p>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-mono">
                    {address
                      ? `${address.slice(0, 10)}...${address.slice(-8)}`
                      : "Not connected"}
                  </p>
                  {address && (
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={copyAddress}
                      className="h-8 w-8 text-white hover:bg-white/10"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                {copied && (
                  <p className="text-xs text-green-400 mt-1">
                    Copied to clipboard!
                  </p>
                )}
              </div>

              <div>
                <p className="text-sm text-white/60 mb-1">Account ID</p>
                <p className="text-sm font-mono">{profile.id}</p>
              </div>

              <div>
                <p className="text-sm text-white/60 mb-1">Member Since</p>
                <p className="text-sm">
                  {new Date(profile.created_at).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
