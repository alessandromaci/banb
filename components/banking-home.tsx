"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MoreMenu } from "@/components/more-menu";
import {
  AudioLines,
  ArrowDownToLine,
  BarChart3,
  CreditCard,
  Plus,
  MoreHorizontal,
  Send,
  Loader2,
  Search,
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
    <div className="min-h-screen bg-gradient-to-b from-[#3B1EFF] via-[#5B3FFF] to-[#1A0F3D] text-white">
      {/* Mobile Container */}
      <div className="mx-auto max-w-md">
        {/* Header */}
        <div className="pt-3 px-6 pb-6">
          <div className="flex items-center justify-between mb-10">
            <button
              onClick={() => router.push("/profile")}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            >
              <Avatar className="h-12 w-12 border-2 border-white/20">
                <AvatarFallback className="bg-white/10 text-white">
                  {profile?.name?.charAt(0).toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
              <div className="text-left">
                <div className="font-semibold">{profile?.name}</div>
                <div className="text-xs text-white/60">@{profile?.handle}</div>
              </div>
            </button>
            <div className="flex items-center gap-3">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => router.push("/analytics")}
                className="h-11 w-11 rounded-full bg-white/10 hover:bg-white/20 text-white shadow-lg shadow-indigo-500/20"
              >
                <BarChart3 className="h-5 w-5" />
              </Button>
              <Button
                onClick={() => router.push("/cards")}
                size="icon"
                variant="ghost"
                className="h-11 w-11 rounded-full bg-white/10 hover:bg-white/20 text-white shadow-lg shadow-indigo-500/20"
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
            <div className="text-sm text-white/70 mb-3">
              {activeAccount === "main" ? "Main" : "Investment"} - {currency}
            </div>
            {activeAccount === "main" ? (
              <>
                <div className="text-6xl font-bold mb-6 transition-all duration-500 ease-out">
                  {!isMounted || balanceLoading || rateLoading
                    ? `${currency === "USD" ? "$" : "€"}...`
                    : formatCurrency(displayedBalance, currency)}
                </div>
                {address && isMounted && (
                  <div className="text-sm text-white/70 mb-3">
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
          <div className="flex justify-center gap-2 mb-10">
            <button
              onClick={() => setActiveAccount("main")}
              className={`h-2 w-2 rounded-full ${
                activeAccount === "main"
                  ? "bg-white shadow-lg shadow-white/50"
                  : "bg-white/30"
              }`}
            />
            <button
              onClick={() => setActiveAccount("investment")}
              className={`h-2 w-2 rounded-full transition-colors ${
                activeAccount === "investment" ? "bg-white" : "bg-white/30"
              }`}
            />
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-4 gap-6 mb-10">
            <div className="flex flex-col items-center gap-3">
              <Button
                size="icon"
                className="h-16 w-16 rounded-full bg-white/15 hover:bg-white/25 text-white border-0 shadow-lg shadow-indigo-500/20 transition-all hover:scale-105"
              >
                <Plus className="h-7 w-7" />
              </Button>
              <span className="text-sm text-white/90 font-medium">Add</span>
            </div>
            <div className="flex flex-col items-center gap-3">
              <Button
                size="icon"
                className="h-16 w-16 rounded-full bg-white/15 hover:bg-white/25 text-white border-0 shadow-lg shadow-indigo-500/20 transition-all hover:scale-105"
              >
                <ArrowDownToLine className="h-7 w-7" />
              </Button>
              <span className="text-sm text-white/90 font-medium">
                Withdraw
              </span>
            </div>
            <div className="flex flex-col items-center gap-3">
              <Button
                onClick={() => {
                  setActiveTab("payments");
                  router.push("/payments");
                }}
                size="icon"
                className="h-16 w-16 rounded-full bg-white/15 hover:bg-white/25 text-white border-0 shadow-lg shadow-indigo-500/20 transition-all hover:scale-105"
              >
                <Send className="h-7 w-7" />
              </Button>
              <span className="text-sm text-white/90 font-medium">Send</span>
            </div>
            <div className="flex flex-col items-center gap-3">
              <Button
                onClick={() => setMoreMenuOpen(true)}
                size="icon"
                className="h-16 w-16 rounded-full bg-white/15 hover:bg-white/25 text-white border-0 shadow-lg shadow-indigo-500/20 transition-all hover:scale-105"
              >
                <MoreHorizontal className="h-7 w-7" />
              </Button>
              <span className="text-sm text-white/90 font-medium">More</span>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative mb-10">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/60" />
            <Input
              placeholder="Ask anything"
              className="pl-12 bg-white/10 border-white/20 text-white placeholder:text-white/60 h-14 rounded-2xl backdrop-blur-sm"
            />
            <AudioLines className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/60" />
          </div>

          {/* Transactions Card */}
          <Card className="bg-[#2A1F4D]/80 backdrop-blur-sm border-0 rounded-3xl p-5 mb-6 shadow-xl">
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
                        <div className="h-12 w-12 rounded-full bg-[#00704A] flex items-center justify-center">
                          <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center">
                            <span className="text-sm font-semibold text-[#00704A]">
                              {tx.recipient_id?.charAt(0).toUpperCase() || "?"}
                            </span>
                          </div>
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
                          className={`font-semibold ${
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
                    variant="ghost"
                    onClick={() => router.push("/transactions")}
                    className="w-full text-white/80 hover:text-white hover:bg-white/10 rounded-xl"
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

      {/* More Menu */}
      <MoreMenu
        isOpen={moreMenuOpen}
        onClose={() => setMoreMenuOpen(false)}
        onCurrencyToggle={toggleCurrency}
        onExploreBaseScan={openBaseScan}
        onThemeToggle={() => {
          setTheme(theme === "dark" ? "light" : "dark");
          console.log("Theme toggled:", theme === "dark" ? "light" : "dark");
        }}
        onAddInvestmentAccount={() => {
          console.log("Add Investment Account clicked");
        }}
        currency={currency}
        theme={theme}
      />
    </div>
  );
}
