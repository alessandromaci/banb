"use client";

import { useState, useEffect } from "react";

// Disable static generation for this page
export const dynamic = 'force-dynamic';
import { AlertTriangle, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { normalize } from "viem/ens";
import { mainnet } from "viem/chains";
import { createPublicClient, http, isAddress } from "viem";
import { Button } from "@/components/ui/button";
import { SearchBar } from "@/components/payments/SearchBar";
import { FriendList } from "@/components/payments/FriendList";
import { useUser } from "@/lib/user-context";
import { getRecipientsByProfile } from "@/lib/recipients";
import { useUSDCBalance } from "@/lib/payments";

export default function PaymentsPage() {
  const router = useRouter();
  const { address: userAddress } = useAccount();
  const { profile } = useUser();
  const { formattedBalance } = useUSDCBalance(userAddress);
  const [searchTerm, setSearchTerm] = useState("");
  const [resolvedAddress, setResolvedAddress] = useState<string | null>(null);
  const [isResolvingENS, setIsResolvingENS] = useState(false);
  const [showWarning, setShowWarning] = useState(false);

  // ENS resolution
  useEffect(() => {
    const resolveENS = async () => {
      if (!searchTerm || !searchTerm.includes(".eth")) {
        setResolvedAddress(null);
        return;
      }

      setIsResolvingENS(true);
      try {
        const client = createPublicClient({
          chain: mainnet,
          transport: http(),
        });

        const address = await client.getEnsAddress({
          name: normalize(searchTerm),
        });

        setResolvedAddress(address || null);
      } catch (error) {
        console.error("ENS resolution failed:", error);
        setResolvedAddress(null);
      } finally {
        setIsResolvingENS(false);
      }
    };

    const timeoutId = setTimeout(resolveENS, 500);
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Check if address is known friend
  useEffect(() => {
    const checkAddress = async () => {
      if (!profile?.id) return;

      const addressToCheck = resolvedAddress || searchTerm;
      if (!isAddress(addressToCheck)) {
        setShowWarning(false);
        return;
      }

      try {
        const recipients = await getRecipientsByProfile(profile.id);
        const isKnown = recipients.some(
          (r) =>
            r.external_address?.toLowerCase() === addressToCheck.toLowerCase()
        );
        setShowWarning(!isKnown);
      } catch (error) {
        console.error("Error checking friends:", error);
        setShowWarning(false);
      }
    };

    checkAddress();
  }, [resolvedAddress, searchTerm, profile?.id]);

  const handleContinueWithAddress = () => {
    const addressToUse = resolvedAddress || searchTerm;
    if (isAddress(addressToUse)) {
      // Store unknown address in session for review page
      sessionStorage.setItem("unknownRecipientAddress", addressToUse);
      router.push(`/payments/crypto/unknown/amount`);
    }
  };

  return (
    <div className="min-h-screen bg-[#0E0E0F] text-white">
      <div className="mx-auto max-w-md px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="flex-1 ml-2">
            <h1 className="text-xl font-medium">Send</h1>
            <p className="text-sm text-white/50">
              Balance: ${formattedBalance || "0.00"}
            </p>
          </div>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => router.push("/home")}
            className="h-10 w-10 text-white hover:bg-white/10 rounded-full"
          >
            <X className="h-6 w-6" />
          </Button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <SearchBar
            placeholder="@username or address"
            value={searchTerm}
            onChange={setSearchTerm}
            showPrefix={true}
          />
          {isResolvingENS && (
            <p className="text-xs text-white/50 mt-2 px-4">Resolving ENS...</p>
          )}
          {resolvedAddress && (
            <p className="text-xs text-white/50 mt-2 px-4">
              Resolved to: {resolvedAddress.slice(0, 6)}...
              {resolvedAddress.slice(-4)}
            </p>
          )}
        </div>

        {/* Warning for unknown addresses */}
        {showWarning && (
          <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-white/90 mb-3">
                  This is not an address you have interacted with recently.
                  Proceed with caution.
                </p>
                <Button
                  onClick={handleContinueWithAddress}
                  className="w-full h-12 rounded-full bg-white hover:bg-white/90 text-black font-medium"
                >
                  Continue
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Friends List */}
        <div className="pb-24">
          <FriendList
            searchTerm={searchTerm}
            resolvedAddress={resolvedAddress}
          />
        </div>
      </div>
    </div>
  );
}
