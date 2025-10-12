"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import {
  AudioLines,
  ArrowDown,
  BarChart3,
  CreditCard,
  Plus,
  MoreHorizontal,
  Send,
  DollarSign,
  Euro,
  ExternalLink,
  Moon,
  Sun,
  PlusCircle,
  Loader2,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { sdk } from "@farcaster/miniapp-sdk";
import { useAccount } from "wagmi";
import { useUSDCBalance } from "@/lib/payments";
import { useUser } from "@/lib/user-context";
import {
  type Currency,
  useExchangeRate,
  convertCurrency,
  formatCurrency,
} from "@/lib/currency";
import {
  getRecentTransactions,
  formatTransactionAmount,
  type Transaction,
} from "@/lib/transactions";

export function BankingHome() {
  const [, setActiveTab] = useState("home");
  const [isMounted, setIsMounted] = useState(false);
  const [currency, setCurrency] = useState<Currency>("USD");
  const [activeAccount, setActiveAccount] = useState<"main" | "investment">(
    "main"
  );
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);

  const router = useRouter();
  const { address } = useAccount();
  const { formattedBalance: usdcBalance, isLoading: balanceLoading } =
    useUSDCBalance(address);
  const { profile, isLoading: profileLoading } = useUser();
  const { rate: eurRate, isLoading: rateLoading } = useExchangeRate();

  // Calculate displayed balance based on currency
  const fiatBalance: number = profile?.balance
    ? parseFloat(profile.balance)
    : 0;
  const displayedBalance: number =
    currency === "EUR"
      ? convertCurrency(fiatBalance, "USD", "EUR", eurRate)
      : fiatBalance;

  // Mount check to prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    // Call sdk.actions.ready() to hide the splash screen
    const initializeSDK = async () => {
      try {
        await sdk.actions.ready();
        console.log("Farcaster SDK ready - splash screen hidden");
      } catch (error) {
        console.error("Failed to initialize Farcaster SDK:", error);
      }
    };

    initializeSDK();
  }, []);

  // Redirect to login if no profile
  useEffect(() => {
    if (!profileLoading && !profile) {
      router.push("/login");
    }
  }, [profile, profileLoading, router]);

  // Fetch recent transactions
  useEffect(() => {
    const fetchTransactions = async () => {
      if (!profile?.id) return;

      try {
        setLoadingTransactions(true);
        const data = await getRecentTransactions(profile.id, 3);
        setTransactions(data);
      } catch (error) {
        console.error("Failed to fetch transactions:", error);
      } finally {
        setLoadingTransactions(false);
      }
    };

    fetchTransactions();
  }, [profile?.id]);

  const toggleCurrency = () => {
    setCurrency(currency === "USD" ? "EUR" : "USD");
  };

  const openBaseScan = () => {
    if (address) {
      window.open(`https://basescan.org/address/${address}`, "_blank");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#5B4FE8] via-[#4A3FD8] to-[#1E1B3D] text-white">
      {/* Mobile Container */}
      <div className="mx-auto max-w-md">
        {/* Header */}
        <div className="pt-3 px-6 pb-6">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => router.push("/profile")}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            >
              <Avatar className="h-10 w-10 border-2 border-white/20">
                <AvatarFallback className="bg-white/10 text-white">
                  {profile?.name?.charAt(0).toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
              <div className="text-left">
                <div className="font-semibold">
                  {profile?.name || "Loading..."}
                </div>
                <div className="text-xs text-white/60">@{profile?.handle}</div>
              </div>
            </button>
            <div className="flex items-center gap-3">
              <Button
                size="icon"
                variant="ghost"
                className="h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white"
              >
                <BarChart3 className="h-5 w-5" />
              </Button>
              <Button
                onClick={() => router.push("/cards")}
                size="icon"
                variant="ghost"
                className="h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white"
              >
                <CreditCard className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Balance Section */}
          <button
            onClick={() => router.push("/cards")}
            className="text-center mb-2 w-full hover:opacity-90 transition-opacity"
          >
            <div className="text-sm text-white/70 mb-2">
              {activeAccount === "main" ? "Main" : "Investment"} - {currency}
            </div>
            {activeAccount === "main" ? (
              <>
                <div className="text-5xl font-bold mb-2">
                  {!isMounted || balanceLoading || rateLoading
                    ? `${currency === "USD" ? "$" : "€"}...`
                    : formatCurrency(displayedBalance, currency)}
                </div>
                {address && isMounted && (
                  <div className="text-xs text-white/50">
                    {address.slice(0, 6)}...{address.slice(-4)} -{" "}
                    {usdcBalance || "0.00"} USDC
                  </div>
                )}
              </>
            ) : (
              <div className="text-2xl font-semibold text-white/60 mb-2">
                Investment account — coming soon
              </div>
            )}
          </button>

          {/* Pagination Dots */}
          <div className="flex justify-center gap-2 mb-8">
            <button
              onClick={() => setActiveAccount("main")}
              className={`h-2 w-2 rounded-full transition-colors ${
                activeAccount === "main" ? "bg-white" : "bg-white/30"
              }`}
            />
            <button
              onClick={() => setActiveAccount("investment")}
              className={`h-2 w-2 rounded-full transition-colors ${
                activeAccount === "investment" ? "bg-white" : "bg-white/30"
              }`}
            />
          </div>

          <div className="h-6" />

          {/* Action Buttons */}
          <div className="grid grid-cols-4 gap-4 mb-8">
            <div className="flex flex-col items-center gap-2">
              <Button
                size="icon"
                disabled
                className="h-14 w-14 rounded-full bg-white/5 text-white/30 border-0 cursor-not-allowed"
              >
                <Plus className="h-6 w-6" />
              </Button>
              <span className="text-xs text-white/40">Add money</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Button
                size="icon"
                disabled
                className="h-14 w-14 rounded-full bg-white/5 text-white/30 border-0 cursor-not-allowed"
              >
                <ArrowDown className="h-6 w-6" />
              </Button>
              <span className="text-xs text-white/40">Withdraw</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Button
                onClick={() => {
                  setActiveTab("payments");
                  router.push("/payments");
                }}
                size="icon"
                className="h-14 w-14 rounded-full bg-white/15 hover:bg-white/25 text-white border-0"
              >
                <Send className="h-6 w-6" />
              </Button>
              <span className="text-xs text-white/90">Send money</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Button
                onClick={() => setMoreMenuOpen(true)}
                size="icon"
                className="h-14 w-14 rounded-full bg-white/15 hover:bg-white/25 text-white border-0"
              >
                <MoreHorizontal className="h-6 w-6" />
              </Button>
              <span className="text-xs text-white/90">More</span>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative mb-8">
            <Input
              placeholder="Ask anything"
              className="pl-4 bg-white/10 border-white/20 text-white placeholder:text-white/60 h-12 rounded-2xl"
            />
            <AudioLines className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/60" />
          </div>

          {/* Transactions Card */}
          <Card className="bg-[#2A2640] border-0 rounded-3xl p-4 mb-6">
            <div className="space-y-4">
              {loadingTransactions ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-white/60" />
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-8 text-white/60">
                  <p>No transactions yet</p>
                </div>
              ) : (
                <>
                  {transactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                          <span className="text-xl text-white">
                            {tx.recipient_id?.charAt(0).toUpperCase() || "?"}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium text-white">
                            {tx.recipient_id || "Unknown"}
                          </div>
                          <div className="text-sm text-white/60">
                            {new Date(tx.created_at).toLocaleTimeString(
                              "en-US",
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div
                          className={`font-medium ${
                            tx.status === "success"
                              ? "text-green-400"
                              : tx.status === "failed"
                              ? "text-red-400"
                              : "text-white"
                          }`}
                        >
                          {formatTransactionAmount(tx.amount, tx.token)}
                        </div>
                        <div className="text-xs text-white/60 capitalize">
                          {tx.status}
                        </div>
                      </div>
                    </div>
                  ))}

                  <Button
                    onClick={() => router.push("/transactions")}
                    variant="ghost"
                    className="w-full text-white/80 hover:text-white hover:bg-white/5"
                  >
                    See all
                  </Button>
                </>
              )}
            </div>
          </Card>
        </div>

        {/* Bottom Spacer for Navigation */}
        <div className="h-20" />
      </div>

      {/* More Menu Bottom Sheet */}
      <BottomSheet
        open={moreMenuOpen}
        onClose={() => setMoreMenuOpen(false)}
        title="More Options"
      >
        <div className="space-y-2">
          <Button
            onClick={() => {
              toggleCurrency();
              setMoreMenuOpen(false);
            }}
            variant="ghost"
            className="w-full justify-start h-14 text-white hover:bg-white/10 rounded-xl"
          >
            {currency === "USD" ? (
              <DollarSign className="h-5 w-5 mr-3" />
            ) : (
              <Euro className="h-5 w-5 mr-3" />
            )}
            <span className="text-base">Display Currency: {currency}</span>
          </Button>

          <Button
            onClick={() => {
              openBaseScan();
              setMoreMenuOpen(false);
            }}
            variant="ghost"
            className="w-full justify-start h-14 text-white hover:bg-white/10 rounded-xl"
          >
            <ExternalLink className="h-5 w-5 mr-3" />
            <span className="text-base">Explore on BaseScan</span>
          </Button>

          <Button
            onClick={() => {
              setTheme(theme === "dark" ? "light" : "dark");
              console.log(
                "Theme toggled:",
                theme === "dark" ? "light" : "dark"
              );
              setMoreMenuOpen(false);
            }}
            variant="ghost"
            className="w-full justify-start h-14 text-white hover:bg-white/10 rounded-xl"
          >
            {theme === "dark" ? (
              <Sun className="h-5 w-5 mr-3" />
            ) : (
              <Moon className="h-5 w-5 mr-3" />
            )}
            <span className="text-base">
              Change Theme: {theme === "dark" ? "Light" : "Dark"}
            </span>
          </Button>

          <Button
            onClick={() => {
              console.log("Add Investment Account clicked");
              setMoreMenuOpen(false);
            }}
            variant="ghost"
            className="w-full justify-start h-14 text-white hover:bg-white/10 rounded-xl"
          >
            <PlusCircle className="h-5 w-5 mr-3" />
            <span className="text-base">Add Investment Account</span>
          </Button>
        </div>
      </BottomSheet>
    </div>
  );
}
