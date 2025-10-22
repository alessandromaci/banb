"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  BarChart3,
  CreditCard,
  Plus,
  Send,
  Info,
  Loader2,
  Copy,
  Check,
  Sparkles,
  TrendingUp,
  Receipt,
  Activity,
  Home,
  User,
  Wallet,
} from "lucide-react";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { sdk } from "@farcaster/miniapp-sdk";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useAccount } from "wagmi";
import { useSetActiveWallet } from "@privy-io/wagmi";
import { useUSDCBalance } from "@/lib/payments";
import { useUser } from "@/lib/user-context";
import { createAccount, useAccounts } from "@/lib/accounts";
import { useToast } from "@/hooks/use-toast";
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
import { AIBar } from "@/components/ai-bar";
import { InsightsCarousel } from "@/components/insights-carousel";
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
  const [activeTab, setActiveTab] = useState("home");
  const [isMounted, setIsMounted] = useState(false);
  const [currency, setCurrency] = useState<Currency>("USD");
  const [activeAccount, setActiveAccount] = useState<"spending" | "investment">(
    "spending"
  );
  const [currentSpendingAccountIndex, setCurrentSpendingAccountIndex] =
    useState(0);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [copied, setCopied] = useState(false);
  const [showAddAccountModal, setShowAddAccountModal] = useState(false);
  const [isAIBarExpanded, setIsAIBarExpanded] = useState(false);

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
  const { profile, isLoading: profileLoading } = useUser();
  const { rate: eurRate, isLoading: rateLoading } = useExchangeRate();
  const { toast } = useToast();

  // Wallet management following Privy + wagmi best practices:
  // - Use Privy for: connecting wallets, multi-wallet management
  // - Use wagmi for: reading active wallet state (address, balance, transactions)
  const { ready: privyReady, connectWallet: privyConnectWallet } = usePrivy();
  const { wallets: privyWallets } = useWallets(); // For multi-wallet scenarios
  const { setActiveWallet } = useSetActiveWallet();

  // Use wagmi for active wallet address and balance
  const { address } = useAccount();

  // Accounts State - fetch all accounts from database
  const { accounts, refreshAccounts } = useAccounts(profile?.id);

  // Filter accounts by type
  const spendingAccounts = accounts.filter((acc) => acc.type === "spending");
  const currentSpendingAccount = spendingAccounts[currentSpendingAccountIndex];

  // Use wagmi to get balance for the currently displayed spending account
  const displayAddress = (currentSpendingAccount?.address || address) as
    | `0x${string}`
    | undefined;
  const { formattedBalance: usdcBalance, isLoading: balanceLoading } =
    useUSDCBalance(displayAddress);

  // Sync Privy wallet with wagmi when wallet connects
  useEffect(() => {
    const syncWallet = async () => {
      if (privyWallets.length > 0 && setActiveWallet) {
        await setActiveWallet(privyWallets[0]);
      }
    };
    syncWallet();
  }, [privyWallets, setActiveWallet]);

  // Ensure spending account index is valid when accounts change
  useEffect(() => {
    if (
      spendingAccounts.length > 0 &&
      currentSpendingAccountIndex >= spendingAccounts.length
    ) {
      setCurrentSpendingAccountIndex(0);
    }
  }, [spendingAccounts.length, currentSpendingAccountIndex]);

  // State for wallet connection flow
  const [showConnectWallet, setShowConnectWallet] = useState(false);
  const [isConnectingWallet, setIsConnectingWallet] = useState(false);
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
        console.error("Error fetching investment data:", error);
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

  // Memoize currentAccount to prevent unnecessary re-renders
  const currentAccount = useMemo(() => {
    return investmentAccounts[currentInvestmentAccount];
  }, [investmentAccounts, currentInvestmentAccount]);

  const currentAccountBalance = currentAccount?.total_value || 0;

  // Memoize fetchMovements to prevent unnecessary re-renders
  const fetchMovements = useCallback(async () => {
    if (!profile?.id || activeAccount !== "investment") return;

    setMovementsLoading(true);
    try {
      // Get current account at the time of execution to avoid stale closure
      const currentAccountData = investmentAccounts[currentInvestmentAccount];

      if (currentAccountData) {
        const movements = await getInvestmentHistory(profile.id, 10);
        setInvestmentMovements(movements);

        const monthlyRewards = parseFloat(
          String(currentAccountData?.total_rewards || "0")
        );
        setMonthlyRewards(monthlyRewards);
      } else {
        setInvestmentMovements([]);
        setMonthlyRewards(0);
      }
    } catch (error) {
      console.error("Error in fetchMovements:", error);
      setInvestmentMovements([]);
      setMonthlyRewards(0);
    } finally {
      setMovementsLoading(false);
    }
  }, [
    profile?.id,
    activeAccount,
    investmentAccounts,
    currentInvestmentAccount,
  ]);

  // Fetch investment movements for current account
  useEffect(() => {
    if (activeAccount === "investment") {
      fetchMovements();
    } else if (activeAccount === "spending") {
      setInvestmentMovements([]);
      setMonthlyRewards(0);
    }
  }, [activeAccount, fetchMovements]);

  const toggleCurrency = () => {
    setCurrency(currency === "USD" ? "EUR" : "USD");
  };

  const openBaseScan = () => {
    if (address) {
      window.open(`https://basescan.org/address/${address}`, "_blank");
    }
  };

  const copyAddress = async () => {
    const addressToCopy = currentSpendingAccount?.address || address;
    if (addressToCopy) {
      try {
        await navigator.clipboard.writeText(addressToCopy);
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

  // Helper function to split balance into integer and decimal parts
  const formatBalanceWithDifferentSizes = (
    balance: number,
    currency: Currency
  ) => {
    const formatted = formatCurrency(balance, currency);
    const symbol = currency === "USD" ? "$" : "€";
    const numberPart = formatted.replace(symbol, "");

    const parts = numberPart.split(".");
    const integerPart = parts[0];
    const decimalPart = parts[1] || "00";

    return { symbol, integerPart, decimalPart };
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

    // Swipe logic: Navigate through spending accounts, then to investment accounts
    if (isLeftSwipe) {
      if (activeAccount === "spending") {
        // If not on last spending account, go to next spending account
        if (currentSpendingAccountIndex < spendingAccounts.length - 1) {
          setCurrentSpendingAccountIndex((prev) => prev + 1);
        } else if (investmentAccounts.length > 0) {
          // If on last spending account and investments exist, switch to investment
          setActiveAccount("investment");
          setCurrentInvestmentAccount(0);
        }
      } else if (activeAccount === "investment") {
        // Navigate through investment accounts
        if (currentInvestmentAccount < investmentAccounts.length - 1) {
          setCurrentInvestmentAccount((prev) => prev + 1);
        }
      }
    }

    if (isRightSwipe) {
      if (activeAccount === "investment") {
        // If on first investment account, go back to last spending account
        if (currentInvestmentAccount === 0) {
          setActiveAccount("spending");
          setCurrentSpendingAccountIndex(spendingAccounts.length - 1);
        } else {
          // Navigate back through investment accounts
          setCurrentInvestmentAccount((prev) => prev - 1);
        }
      } else if (activeAccount === "spending") {
        // Navigate back through spending accounts
        if (currentSpendingAccountIndex > 0) {
          setCurrentSpendingAccountIndex((prev) => prev - 1);
        }
      }
    }
  };

  // Handle wallet connection for spending account
  const handleConnectWalletForSpending = async () => {
    if (!privyReady) {
      toast({
        title: "Not Ready",
        description: "Wallet connection is not ready yet. Please wait.",
        variant: "destructive",
      });
      return;
    }

    if (!profile?.id) {
      toast({
        title: "Error",
        description: "User profile not found. Please log in again.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsConnectingWallet(true);

      // Open Privy wallet connection modal
      await privyConnectWallet();

      // Wait a moment for wallet to be added to array
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Get the newly connected wallet
      const newWallet = privyWallets[privyWallets.length - 1];

      if (!newWallet || !newWallet.address) {
        throw new Error("No wallet address received");
      }

      // Create spending account in database
      await createAccount({
        profile_id: profile.id,
        name: `Spending Account ${accounts.length + 1}`,
        type: "spending",
        address: newWallet.address,
        network: "base",
        is_primary: false,
      });

      // Refresh accounts list to show the new account
      await refreshAccounts();

      toast({
        title: "Success!",
        description: "Spending account created successfully.",
      });

      // Close modals
      setShowConnectWallet(false);
      setShowAddAccountModal(false);
    } catch (error) {
      console.error("Failed to connect wallet:", error);

      if (
        error instanceof Error &&
        error.message.includes("already connected")
      ) {
        toast({
          title: "Wallet Already Added",
          description: "This wallet is already connected to your account.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Connection Failed",
          description:
            error instanceof Error
              ? error.message
              : "Failed to connect wallet. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsConnectingWallet(false);
    }
  };

  const hasInvestmentAccount = investmentAccounts.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#3B1EFF] via-[#5B3FFF] to-[#1A0F3D] text-white">
      {/* Mobile Container */}
      <div className="mx-auto max-w-md">
        {/* Header */}
        <div className="pt-6 px-6 pb-6">
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
            <Button
              className="bg-white text-indigo-600 hover:bg-white/90 rounded-full px-6 py-2 font-semibold shadow-lg shadow-white/20 transition-all hover:scale-105"
              onClick={() => router.push("/upgrade")}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Upgrade
            </Button>
          </div>

          {/* Balance Section */}
          <div
            className="text-center mb-2 w-full hover:opacity-90 transition-opacity"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div className="text-sm text-white/70 mb-3">
              {activeAccount === "spending"
                ? currentSpendingAccount?.name || "Spending Account"
                : "Investment Account"}{" "}
              - {currency}
            </div>
            {activeAccount === "spending" ? (
              <>
                <div className="text-6xl font-bold mb-6 transition-all duration-500 ease-out flex items-end justify-center">
                  {!isMounted || balanceLoading || rateLoading ? (
                    `${currency === "USD" ? "$" : "€"}...`
                  ) : (
                    <>
                      <span>
                        {
                          formatBalanceWithDifferentSizes(
                            displayedBalance,
                            currency
                          ).symbol
                        }
                      </span>
                      <span>
                        {
                          formatBalanceWithDifferentSizes(
                            displayedBalance,
                            currency
                          ).integerPart
                        }
                      </span>
                      <span className="text-4xl">
                        .
                        {
                          formatBalanceWithDifferentSizes(
                            displayedBalance,
                            currency
                          ).decimalPart
                        }
                      </span>
                    </>
                  )}
                </div>
                {displayAddress && isMounted && (
                  <div className="text-sm text-white/70 mb-3 flex items-center justify-center gap-1">
                    <button
                      onClick={copyAddress}
                      className="flex items-center gap-2 hover:text-white transition-colors cursor-pointer"
                    >
                      <span>
                        {displayAddress.slice(0, 6)}...
                        {displayAddress.slice(-4)}
                      </span>
                      {copied ? (
                        <Check className="h-4 w-4 text-white" />
                      ) : (
                        <Copy className="h-4 w-4 opacity-60 hover:opacity-100" />
                      )}
                    </button>
                    <span className="text-white/50">-</span>
                    <span className="flex items-center gap-1 font-sans">
                      {usdcBalance || "0.00"}{" "}
                      {/* <Image
                        src="/usdc-logo.png"
                        alt="USDC"
                        width={15}
                        height={15}
                      /> */}{" "}
                      USDC
                    </span>
                  </div>
                )}
              </>
            ) : (
              <>
                {hasInvestmentAccount ? (
                  <>
                    <div className="text-6xl font-bold mb-6 transition-all duration-500 ease-out flex items-end justify-center">
                      {!isMounted || investmentsLoading ? (
                        `${currency === "USD" ? "$" : "€"}...`
                      ) : (
                        <>
                          <span>
                            {
                              formatBalanceWithDifferentSizes(
                                currentAccountBalance,
                                currency
                              ).symbol
                            }
                          </span>
                          <span>
                            {
                              formatBalanceWithDifferentSizes(
                                currentAccountBalance,
                                currency
                              ).integerPart
                            }
                          </span>
                          <span className="text-4xl">
                            .
                            {
                              formatBalanceWithDifferentSizes(
                                currentAccountBalance,
                                currency
                              ).decimalPart
                            }
                          </span>
                        </>
                      )}
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
            {/* Spending account dots */}
            {spendingAccounts.map((_, index) => (
              <button
                key={`spending-${index}`}
                onClick={() => {
                  setActiveAccount("spending");
                  setCurrentSpendingAccountIndex(index);
                }}
                className={`h-2 w-2 rounded-full transition-colors ${
                  activeAccount === "spending" &&
                  currentSpendingAccountIndex === index
                    ? "bg-white shadow-lg shadow-white/50"
                    : "bg-white/30"
                }`}
              />
            ))}

            {/* Investment account dots */}
            {investmentAccounts.map((_, index) => (
              <button
                key={`investment-${index}`}
                onClick={() => {
                  setActiveAccount("investment");
                  setCurrentInvestmentAccount(index);
                }}
                className={`h-2 w-2 rounded-full transition-colors ${
                  activeAccount === "investment" &&
                  currentInvestmentAccount === index
                    ? "bg-white shadow-lg shadow-white/50"
                    : "bg-white/30"
                }`}
              />
            ))}

            {/* Placeholder dot for "add investment" if no investments yet */}
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
          <div className="grid grid-cols-4 gap-4 mb-8">
            {/* Add Button */}
            <div className="flex flex-col items-center gap-2">
              <Button
                size="icon"
                className="h-16 w-16 rounded-full bg-white/15 hover:bg-white/25 text-white border-0 shadow-lg shadow-indigo-500/20 transition-all hover:scale-105"
                onClick={() => {
                  if (activeAccount === "spending") {
                    // Store deposit data in sessionStorage
                    sessionStorage.setItem(
                      "depositData",
                      JSON.stringify({
                        balance: displayedBalance.toString(),
                        currency: currency,
                        account: "spending",
                        walletAddress:
                          currentSpendingAccount?.address || address || "",
                      })
                    );
                    router.push("/deposit");
                  } else {
                    // Investment account - add more to same vault
                    if (currentAccount?.vault_address) {
                      router.push(
                        `/invest/amount?vault=${
                          currentAccount.vault_address
                        }&name=${encodeURIComponent(
                          currentAccount.investment_name || ""
                        )}`
                      );
                    }
                  }
                }}
              >
                <Plus className="size-6" />
              </Button>
              <span className="text-xs text-white/90 font-medium whitespace-nowrap">
                Add money
              </span>
            </div>

            {/* Withdraw Button */}
            <div className="flex flex-col items-center gap-2">
              <Button
                size="icon"
                className="h-16 w-16 rounded-full bg-white/15 hover:bg-white/25 text-white border-0 shadow-lg shadow-indigo-500/20 transition-all hover:scale-105"
                onClick={() => {
                  if (activeAccount === "spending") {
                    router.push("/invest/select");
                  } else {
                    // Investment account - withdraw from vault (disabled for now)
                    // TODO: Implement withdrawal functionality
                  }
                }}
                disabled={activeAccount === "investment"}
              >
                <TrendingUp className="size-6" />
              </Button>
              <span className="text-xs text-white/90 font-medium whitespace-nowrap">
                Invest
              </span>
            </div>

            {/* Send/Info Button */}
            <div className="flex flex-col items-center gap-2">
              <Button
                onClick={() => {
                  if (activeAccount === "spending") {
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
                {activeAccount === "spending" ? (
                  <Send className="size-6" />
                ) : (
                  <Info className="size-6" />
                )}
              </Button>
              <span className="text-xs text-white/90 font-medium whitespace-nowrap">
                {activeAccount === "spending" ? "Send" : "Info"}
              </span>
            </div>

            {/* More Button */}
            <div className="flex flex-col items-center gap-2">
              <Button
                onClick={() => router.push("/cards")}
                size="icon"
                className="h-16 w-16 rounded-full bg-white/15 hover:bg-white/25 text-white border-0 shadow-lg shadow-indigo-500/20 transition-all hover:scale-105"
              >
                <CreditCard className="size-6" />
              </Button>
              <span className="text-xs text-white/90 font-medium whitespace-nowrap">
                Get card
              </span>
            </div>
          </div>

          {/* Carousel */}
          <InsightsCarousel />

          {/* Rewards Summary */}
          {activeAccount === "investment" && currentAccount && (
            <RewardsSummaryCard
              totalRewards={
                typeof currentAccount?.total_rewards === "number"
                  ? currentAccount.total_rewards
                  : parseFloat(String(currentAccount?.total_rewards || "0"))
              }
              monthlyRewards={monthlyRewards}
              apr={currentAccount?.apr || 0}
            />
          )}

          <Card className="bg-[#2A1F4D]/80 backdrop-blur-sm border-0 rounded-3xl p-5 mb-10 shadow-xl">
            <div className="space-y-4">
              {activeAccount === "spending" ? (
                // Show transactions for main account
                <>
                  {loadingTransactions ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-white/60" />
                    </div>
                  ) : transactions.length === 0 ? (
                    <div className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center">
                          <Receipt className="h-5 w-5 text-white/60" />
                        </div>
                        <div className="font-sans text-white">
                          No transactions yet
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      {transactions
                        .filter((tx) => tx.status === "success")
                        .slice(0, 3)
                        .map((tx) => (
                          <TransactionCard
                            key={tx.id}
                            transaction={tx}
                            variant="default"
                          />
                        ))}

                      {transactions.filter((tx) => tx.status === "success")
                        .length > 3 && (
                        <Button
                          variant="ghost"
                          onClick={() => router.push("/transactions")}
                          className="w-full text-white/80 hover:text-white hover:bg-white/10 rounded-xl"
                        >
                          See all
                        </Button>
                      )}
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
                    <div className="flex items-center justify-between py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center">
                          <Activity className="h-5 w-5 text-white/60" />
                        </div>
                        <div className="font-medium text-white">
                          No activity yet
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      {investmentMovements.slice(0, 3).map((movement) => (
                        <InvestmentMovementCard
                          key={movement.id}
                          movement={movement}
                        />
                      ))}
                      {investmentMovements.length > 3 && (
                        <Button
                          variant="ghost"
                          onClick={() => router.push("/investments/movements")}
                          className="w-full text-white/80 hover:text-white hover:bg-white/10 rounded-xl"
                        >
                          See all
                        </Button>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          </Card>
        </div>

        {/* AI Bar - Controlled by Navigation Button */}
        <AIBar
          isExpanded={isAIBarExpanded}
          onToggle={setIsAIBarExpanded}
          hideCollapsed={true}
        />

        {/* Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-[#1A0F3D]/95 backdrop-blur-lg border-t border-white/10">
          <div className="mx-auto max-w-md px-6 py-3">
            <div className="grid grid-cols-5 gap-2">
              <button
                onClick={() => setActiveTab("home")}
                className={`flex flex-col items-center gap-1 py-2 transition-colors ${
                  activeTab === "home" ? "text-white" : "text-white/50"
                }`}
              >
                <Home className="size-8" />
                <span className="text-xs">Home</span>
              </button>
              <button
                onClick={() => {
                  setActiveTab("analytics");
                  router.push("/analytics");
                }}
                className={`flex flex-col items-center gap-1 py-2 transition-colors ${
                  activeTab === "analytics" ? "text-white" : "text-white/50"
                }`}
              >
                <BarChart3 className="size-8" />
                <span className="text-xs">Analytics</span>
              </button>

              {/* Center AI Button */}
              <button
                onClick={() => {
                  setIsAIBarExpanded(!isAIBarExpanded);
                }}
                className="flex flex-col items-center gap-1 py-2 transition-colors"
              >
                <div className="size-8 bg-white rounded-full flex items-center justify-center shadow-lg">
                  <Image
                    src="/banb-white-icon.svg"
                    alt="BANB AI"
                    width={18}
                    height={18}
                  />
                </div>
                <span className="text-xs">Ask BANB</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab("cards");
                  router.push("/cards");
                }}
                className={`flex flex-col items-center gap-1 py-2 transition-colors ${
                  activeTab === "cards" ? "text-white" : "text-white/50"
                }`}
              >
                <CreditCard className="size-8" />
                <span className="text-xs">Cards</span>
              </button>
              <button
                onClick={() => {
                  setActiveTab("profile");
                  router.push("/profile");
                }}
                className={`flex flex-col items-center gap-1 py-2 transition-colors ${
                  activeTab === "profile" ? "text-white" : "text-white/50"
                }`}
              >
                <User className="size-8" />
                <span className="text-xs">Profile</span>
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Spacer for Navigation */}
        <div className="h-20" />
      </div>

      {/* Add New Account Modal */}
      {showAddAccountModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#2A1F4D] rounded-3xl p-6 w-full max-w-sm">
            {!showConnectWallet ? (
              <>
                <h2 className="text-xl font-semibold text-white mb-6 text-center">
                  Add new account
                </h2>

                <div className="space-y-4">
                  <button
                    onClick={() => setShowConnectWallet(true)}
                    className="w-full p-4 rounded-2xl bg-white/10 border border-white/20 text-white hover:bg-white/15 transition-colors"
                  >
                    <div className="text-left">
                      <div className="font-medium">Spending Account</div>
                      <div className="text-sm text-white/60">
                        Connect a wallet for daily spending
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setShowAddAccountModal(false);
                      setShowConnectWallet(false);
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
                  onClick={() => {
                    setShowAddAccountModal(false);
                    setShowConnectWallet(false);
                  }}
                  className="w-full mt-6 py-3 text-white/60 hover:text-white transition-colors"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <h2 className="text-xl font-semibold text-white mb-6 text-center">
                  Connect Wallet
                </h2>

                <div className="space-y-6">
                  <p className="text-white/70 text-sm text-center">
                    Connect your wallet to create a spending account
                  </p>

                  <Button
                    onClick={handleConnectWalletForSpending}
                    disabled={!privyReady || isConnectingWallet}
                    className="w-full bg-white text-indigo-600 hover:bg-white/90 rounded-full py-6 font-semibold shadow-lg transition-all hover:scale-105"
                  >
                    {isConnectingWallet ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <Wallet className="h-5 w-5 mr-2" />
                        Connect Wallet
                      </>
                    )}
                  </Button>
                </div>

                <button
                  onClick={() => setShowConnectWallet(false)}
                  disabled={isConnectingWallet}
                  className="w-full mt-6 py-3 text-white/60 hover:text-white transition-colors disabled:opacity-50"
                >
                  Back
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
