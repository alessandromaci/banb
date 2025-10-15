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
  Info,
  Loader2,
  Search,
  Copy,
  Check,
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
import { getRecentTransactions, type Transaction } from "@/lib/transactions";
import { TransactionCard } from "@/components/ui/transaction-card";
import { InvestmentMovementCard } from "@/components/ui/investment-movement-card";
import { RewardsSummaryCard } from "@/components/ui/rewards-summary-card";
import { useInvestments } from "@/lib/investments";
import {
  getInvestmentSummaryByVault,
  getInvestmentHistory,
} from "@/lib/investment-movements";

/**
 * Main banking home component with account switching and investment management.
 * Supports both main account (USDC balance) and investment accounts with swipe navigation.
 *
 * Features:
 * - Account switching between main and investment accounts
 * - Swipe navigation for account switching
 * - Investment account management and display
 * - Transaction history for main account
 * - Investment movements and rewards for investment accounts
 *
 * @returns {JSX.Element} Banking home component
 */
export function BankingHome() {
  // UI State
  const [, setActiveTab] = useState("home");
  const [isMounted, setIsMounted] = useState(false);
  const [currency, setCurrency] = useState<Currency>("USD");
  const [activeAccount, setActiveAccount] = useState<"main" | "investment">(
    "main"
  );
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [copied, setCopied] = useState(false);
  const [showAddAccountModal, setShowAddAccountModal] = useState(false);

  // Touch/Swipe State
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Investment State
  const [investmentAccounts, setInvestmentAccounts] = useState<
    Array<{
      vault_address: string;
      total_invested: number;
      total_rewards: number;
      total_value: number;
      investment_name: string;
      investment_id: string;
      apr: number;
      status: string;
    }>
  >([]);
  const [currentInvestmentAccount, setCurrentInvestmentAccount] = useState(0);
  const [investmentMovements, setInvestmentMovements] = useState<
    Array<{
      id: string;
      profile_id: string;
      investment_id: string;
      movement_type: "deposit" | "withdrawal" | "reward" | "fee";
      amount: string;
      token: string;
      tx_hash?: string;
      chain: string;
      status: "pending" | "confirmed" | "failed";
      metadata?: Record<string, unknown>;
      created_at: string;
      updated_at?: string;
    }>
  >([]);
  const [movementsLoading, setMovementsLoading] = useState(false);
  const [monthlyRewards, setMonthlyRewards] = useState(0);

  // Transaction State
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);

  const router = useRouter();
  const { address } = useAccount();
  const { formattedBalance: usdcBalance, isLoading: balanceLoading } =
    useUSDCBalance(address);
  const { profile, isLoading: profileLoading } = useUser();
  const { rate: eurRate, isLoading: rateLoading } = useExchangeRate();
  const {
    investments,
    isLoading: investmentsLoading,
    getInvestmentSummary,
  } = useInvestments(profile?.id);
  const [investmentSummary, setInvestmentSummary] = useState<{
    totalInvested: number;
    totalRewards: number;
    totalValue: number;
  } | null>(null);

  // Calculate displayed balance based on currency
  // Use on-chain USDC balance as source of truth (1 USDC = 1 USD)
  const usdBalance: number = usdcBalance ? parseFloat(usdcBalance) : 0;
  const displayedBalance: number =
    currency === "EUR"
      ? convertCurrency(usdBalance, "USD", "EUR", eurRate)
      : usdBalance;

  // Mount check to prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    // Call sdk.actions.ready() to hide the splash screen
    const initializeSDK = async () => {
      try {
        await sdk.actions.ready();
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

  // Fetch investment summary and accounts
  useEffect(() => {
    const fetchInvestmentData = async () => {
      if (!profile?.id) return;

      try {
        const summary = await getInvestmentSummary();
        setInvestmentSummary(summary);

        const accounts = await getInvestmentSummaryByVault(profile.id);
        setInvestmentAccounts(accounts);
      } catch (error) {
        // Set empty arrays to prevent app crash
        setInvestmentAccounts([]);
        setInvestmentSummary({
          totalInvested: 0,
          totalRewards: 0,
          totalValue: 0,
        });
      }
    };

    fetchInvestmentData();
  }, [profile?.id, getInvestmentSummary]);

  // Calculate investment account balance using summary data
  const investmentBalance = investmentSummary?.totalValue || 0;
  const currentAccount = investmentAccounts[currentInvestmentAccount];
  const currentAccountBalance = currentAccount?.total_value || 0;

  // Fetch investment movements for current account
  useEffect(() => {
    if (profile?.id && activeAccount === "investment") {
      const fetchMovements = async () => {
        setMovementsLoading(true);
        try {
          if (currentAccount) {
            const movements = await getInvestmentHistory(profile.id, 10);
            setInvestmentMovements(movements);

            const monthlyRewards = parseFloat(
              String(currentAccount.total_rewards || "0")
            );
            setMonthlyRewards(monthlyRewards);
          } else {
            setInvestmentMovements([]);
            setMonthlyRewards(0);
          }
        } catch (error) {
          setInvestmentMovements([]);
          setMonthlyRewards(0);
        } finally {
          setMovementsLoading(false);
        }
      };

      fetchMovements();
    } else if (activeAccount === "main") {
      setInvestmentMovements([]);
      setMonthlyRewards(0);
    }
  }, [profile?.id, activeAccount, currentAccount]);

  const toggleCurrency = () => {
    setCurrency(currency === "USD" ? "EUR" : "USD");
  };

  const openBaseScan = () => {
    if (address) {
      window.open(`https://basescan.org/address/${address}`, "_blank");
    }
  };

  const copyAddress = async () => {
    if (address) {
      try {
        await navigator.clipboard.writeText(address);
        setCopied(true);
        setTimeout(() => setCopied(false), 1000);
      } catch (err) {
        // Silently fail - user can manually copy if needed
      }
    }
  };

  const copyVaultAddress = async () => {
    if (currentAccount?.vault_address) {
      await navigator.clipboard.writeText(
        `https://app.morpho.org/base/vault/${currentAccount.vault_address}`
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 1000);
    }
  };

  // Swipe handling for account switching
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && activeAccount === "main") {
      setActiveAccount("investment");
    }
    if (isRightSwipe && activeAccount === "investment") {
      setActiveAccount("main");
    }
  };

  const hasInvestmentAccount = investmentAccounts.length > 0;

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
          <div
            className="text-center mb-2 w-full hover:opacity-90 transition-opacity"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div className="text-sm text-white/70 mb-3">
              {activeAccount === "main" ? "Main" : "Investment Account"} -{" "}
              {currency}
            </div>
            {activeAccount === "main" ? (
              <>
                <div className="text-6xl font-bold mb-6 transition-all duration-500 ease-out">
                  {!isMounted || balanceLoading || rateLoading
                    ? `${currency === "USD" ? "$" : "€"}...`
                    : formatCurrency(displayedBalance, currency)}
                </div>
                {address && isMounted && (
                  <div className="text-sm text-white/70 mb-3 flex items-center justify-center gap-2">
                    <button
                      onClick={copyAddress}
                      className="flex items-center gap-2 hover:text-white transition-colors cursor-pointer"
                    >
                      <span>
                        {address.slice(0, 6)}...{address.slice(-4)}
                      </span>
                      {copied ? (
                        <Check className="h-4 w-4 text-green-400" />
                      ) : (
                        <Copy className="h-4 w-4 opacity-60 hover:opacity-100" />
                      )}
                    </button>
                    <span className="text-white/50">-</span>
                    <span>{usdcBalance || "0.00"} USDC</span>
                  </div>
                )}
              </>
            ) : (
              <>
                {hasInvestmentAccount ? (
                  <>
                    <div className="text-6xl font-bold mb-6 transition-all duration-500 ease-out">
                      {!isMounted || investmentsLoading
                        ? `${currency === "USD" ? "$" : "€"}...`
                        : formatCurrency(currentAccountBalance, currency)}
                    </div>
                    <div className="text-sm text-white/70 mb-3 flex items-center justify-center gap-2">
                      <button
                        onClick={copyVaultAddress}
                        className="flex items-center gap-2 hover:text-white transition-colors cursor-pointer"
                      >
                        <span>
                          {currentAccount?.investment_name ||
                            "Investment Account"}
                        </span>
                        {copied ? (
                          <Check className="h-4 w-4 text-green-400" />
                        ) : (
                          <Copy className="h-4 w-4 opacity-60 hover:opacity-100" />
                        )}
                      </button>

                      <span className="text-white/50">-</span>
                      <span>{currentAccountBalance || "0.00"} USDC</span>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <Button
                      onClick={() => setShowAddAccountModal(true)}
                      className="bg-white/15 hover:bg-white/25 text-white border-0 rounded-full px-6 py-3"
                    >
                      Add new account
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>

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
            {investmentAccounts.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setActiveAccount("investment");
                  setCurrentInvestmentAccount(index);
                }}
                className={`h-2 w-2 rounded-full transition-colors ${
                  activeAccount === "investment" &&
                  currentInvestmentAccount === index
                    ? "bg-white"
                    : "bg-white/30"
                }`}
              />
            ))}
            {investmentAccounts.length === 0 && (
              <button
                onClick={() => setActiveAccount("investment")}
                className={`h-2 w-2 rounded-full transition-colors ${
                  activeAccount === "investment" ? "bg-white" : "bg-white/30"
                }`}
              />
            )}
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-4 gap-6 mb-10">
            {/* Add Button */}
            <div className="flex flex-col items-center gap-3">
              <Button
                size="icon"
                className="h-16 w-16 rounded-full bg-white/15 hover:bg-white/25 text-white border-0 shadow-lg shadow-indigo-500/20 transition-all hover:scale-105"
                onClick={() => {
                  if (activeAccount === "main") {
                    router.push("/deposit");
                  } else {
                    // Investment account - add more to same vault
                    if (currentAccount?.vault_address) {
                      router.push(
                        `/invest/amount?vault=${
                          currentAccount.vault_address
                        }&name=${encodeURIComponent(
                          currentAccount.investment_name
                        )}`
                      );
                    }
                  }
                }}
              >
                <Plus className="h-7 w-7" />
              </Button>
              <span className="text-sm text-white/90 font-medium">Add</span>
            </div>

            {/* Withdraw Button */}
            <div className="flex flex-col items-center gap-3">
              <Button
                size="icon"
                className="h-16 w-16 rounded-full bg-white/15 hover:bg-white/25 text-white border-0 shadow-lg shadow-indigo-500/20 transition-all hover:scale-105"
                onClick={() => {
                  if (activeAccount === "main") {
                    router.push("/withdraw");
                  } else {
                    // Investment account - withdraw from vault (disabled for now)
                    // TODO: Implement withdrawal functionality
                  }
                }}
                disabled={activeAccount === "investment"}
              >
                <ArrowDownToLine className="h-7 w-7" />
              </Button>
              <span className="text-sm text-white/90 font-medium">
                Withdraw
              </span>
            </div>

            {/* Send/Info Button */}
            <div className="flex flex-col items-center gap-3">
              <Button
                onClick={() => {
                  if (activeAccount === "main") {
                    setActiveTab("payments");
                    router.push("/payments");
                  } else {
                    // Investment account - show vault info
                    if (currentAccount?.vault_address) {
                      router.push(
                        `/invest/info/${currentAccount.vault_address}`
                      );
                    }
                  }
                }}
                size="icon"
                className="h-16 w-16 rounded-full bg-white/15 hover:bg-white/25 text-white border-0 shadow-lg shadow-indigo-500/20 transition-all hover:scale-105"
              >
                {activeAccount === "main" ? (
                  <Send className="h-7 w-7" />
                ) : (
                  <Info className="h-7 w-7" />
                )}
              </Button>
              <span className="text-sm text-white/90 font-medium">
                {activeAccount === "main" ? "Send" : "Info"}
              </span>
            </div>

            {/* More Button */}
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

          {/* Transactions/Investments Card */}

          {/* Rewards Summary */}
          {activeAccount === "investment" && (
            <RewardsSummaryCard
              totalRewards={
                typeof currentAccount.total_rewards === "number"
                  ? currentAccount.total_rewards
                  : parseFloat(String(currentAccount.total_rewards || "0"))
              }
              monthlyRewards={monthlyRewards}
              apr={currentAccount.apr || 0}
            />
          )}

          <Card className="bg-[#2A1F4D]/80 backdrop-blur-sm border-0 rounded-3xl p-5 mb-6 shadow-xl">
            <div className="space-y-4">
              {activeAccount === "main" ? (
                // Show transactions for main account
                <>
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
                      {transactions
                        .filter((tx) => tx.status === "success")
                        .map((tx) => (
                          <TransactionCard
                            key={tx.id}
                            transaction={tx}
                            variant="default"
                          />
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
                </>
              ) : (
                // Show investment movements and rewards for investment account
                <>
                  {/* Investment Movements */}
                  {movementsLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-white/60" />
                    </div>
                  ) : investmentMovements.length === 0 ? (
                    <div className="text-center py-8 text-white/60">
                      <p>No activity yet</p>
                    </div>
                  ) : (
                    <>
                      {investmentMovements.map((movement) => (
                        <InvestmentMovementCard
                          key={movement.id}
                          movement={movement}
                        />
                      ))}
                      <Button
                        variant="ghost"
                        onClick={() => router.push("/investments/movements")}
                        className="w-full text-white/80 hover:text-white hover:bg-white/10 rounded-xl"
                      >
                        See all
                      </Button>
                    </>
                  )}
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
        }}
        onAddInvestmentAccount={() => setShowAddAccountModal(true)}
        currency={currency}
        theme={theme}
      />

      {/* Add New Account Modal */}
      {showAddAccountModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#2A1F4D] rounded-3xl p-6 w-full max-w-sm">
            <h2 className="text-xl font-semibold text-white mb-6 text-center">
              Add new account
            </h2>

            <div className="space-y-4">
              <button
                disabled
                className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 text-white/40 cursor-not-allowed"
              >
                <div className="text-left">
                  <div className="font-medium">Spending Account</div>
                  <div className="text-sm text-white/40">Coming soon</div>
                </div>
              </button>

              <button
                onClick={() => {
                  setShowAddAccountModal(false);
                  router.push("/invest/select");
                }}
                className="w-full p-4 rounded-2xl bg-white/10 border border-white/20 text-white hover:bg-white/15 transition-colors"
              >
                <div className="text-left">
                  <div className="font-medium">Saving Account</div>
                  <div className="text-sm text-white/60">
                    Invest and earn rewards
                  </div>
                </div>
              </button>
            </div>

            <button
              onClick={() => setShowAddAccountModal(false)}
              className="w-full mt-6 py-3 text-white/60 hover:text-white transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
