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
  TrendingUp,
  Receipt,
  Activity,
  Home,
  User,
  MessageCircle,
  ArrowDownFromLine,
} from "lucide-react";
import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { sdk } from "@farcaster/miniapp-sdk";
import { useAccountSafe as useAccount } from "@/lib/use-account-safe";
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
import { InsightsCarousel } from "@/components/insights-carousel";
import dynamic from "next/dynamic";
import { useInvestments } from "@/lib/investments";
import {
  getInvestmentSummaryByVault,
  getInvestmentHistory,
} from "@/lib/investment-movements";
import { useAIConsent } from "@/components/ai/AIConsentDialog";
import { OnboardingTour } from "@/components/onboarding-tour";

// Dynamically import AI components that use framer-motion (~300KB)
const AIAgentChat = dynamic(
  () =>
    import("@/components/ai/AIAgentChat").then((mod) => ({
      default: mod.AIAgentChat,
    })),
  { ssr: false, loading: () => null }
);
const AIConsentDialog = dynamic(
  () =>
    import("@/components/ai/AIConsentDialog").then((mod) => ({
      default: mod.AIConsentDialog,
    })),
  { ssr: false }
);
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useLinkAccount } from "@privy-io/react-auth";
import { createAccount, getAccountsByProfile } from "@/lib/accounts";
import { type Account } from "@/lib/supabase";
import { toast } from "sonner";

enum AccountType {
  Main = "main",
  Investment = "investment",
  Spending = "spending",
}

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
  const [activeAccount, setActiveAccount] = useState<AccountType>(
    AccountType.Main
  );
  const [currentSpendingAccountIndex, setCurrentSpendingAccountIndex] =
    useState(0);
  const [copied, setCopied] = useState(false);
  const [showAddAccountModal, setShowAddAccountModal] = useState(false);
  const [showAIChat, setShowAIChat] = useState(false);
  const [showAIConsent, setShowAIConsent] = useState(false);
  const { hasConsent, grantConsent } = useAIConsent();

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
  const { profile, isLoading: profileLoading } = useUser();
  const linkingProfileIdRef = useRef<string | null>(null);

  const { linkWallet } = useLinkAccount({
    onSuccess: async ({ user: updatedUser, linkedAccount }) => {
      let linkedAddress: string | null = null;
      
      if (linkedAccount && "address" in linkedAccount) {
        linkedAddress = linkedAccount.address as string;
      } else {
        const walletAccounts = updatedUser?.linkedAccounts?.filter(
          (acc) => "address" in acc && acc.type === "wallet"
        );
        if (walletAccounts && walletAccounts.length > 0) {
          const lastWallet = walletAccounts[walletAccounts.length - 1];
          linkedAddress = "address" in lastWallet ? (lastWallet.address as string) : null;
        }
      }
      
      if (!linkedAddress) {
        toast.error("Wallet linked but could not determine address. Please refresh the page.");
        setIsAddingAccount(false);
        return;
      }
      
      if (!linkingProfileIdRef.current) {
        setIsAddingAccount(false);
        return;
      }
      
      const existingAccounts = await getAccountsByProfile(linkingProfileIdRef.current);
      const isDuplicate = existingAccounts.some(
        (acc) => acc.address.toLowerCase() === linkedAddress!.toLowerCase()
      );

      if (isDuplicate) {
        toast.info("This wallet is already linked to your account");
        setIsAddingAccount(false);
        return;
      }

      const currentSpendingAccounts = existingAccounts.filter((acc) => acc.type === "spending");
      const accountNumber = currentSpendingAccounts.length + 2;
      
      try {
        const newAccount = await createAccount({
          profile_id: linkingProfileIdRef.current,
          name: `Spending Account ${accountNumber}`,
          type: "spending",
          address: linkedAddress,
          network: "base",
          is_primary: false,
        });

        setSpendingAccounts((prev) => [...prev, newAccount]);

        toast.success(`Spending Account ${accountNumber} added!`);

        const refreshedAccounts = await getAccountsByProfile(linkingProfileIdRef.current);
        const refreshedSpending = refreshedAccounts.filter((acc) => acc.type === "spending");
        setSpendingAccounts(refreshedSpending);

        setTimeout(() => {
          setCurrentCardIndex((prev) => {
            const newIndex = refreshedSpending.findIndex(
              (acc) => acc.address.toLowerCase() === linkedAddress!.toLowerCase()
            );
            return newIndex >= 0 ? newIndex : prev + 1;
          });
        }, 200);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        toast.error(`Wallet linked but failed to create account: ${errorMessage}`);
      } finally {
        setIsAddingAccount(false);
        linkingProfileIdRef.current = null;
      }
    },
    onError: (error: unknown) => {
      let errorMessage = "Unknown error";
      if (typeof error === "string") {
        errorMessage = error;
      } else if (error && typeof error === "object" && "message" in error && typeof error.message === "string") {
        errorMessage = error.message;
      }
      
      if (!errorMessage.includes("abort") && !errorMessage.includes("cancel") && !errorMessage.includes("reject")) {
        toast.error("Failed to link wallet. Please try again.");
      }
      
      setIsAddingAccount(false);
    },
  });

  // Spending Accounts State
  const [spendingAccounts, setSpendingAccounts] = useState<Account[]>([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(false);
  const [isAddingAccount, setIsAddingAccount] = useState(false);
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
  // This will be calculated after we know the current card
  let displayedBalance: number = 0;
  let balanceLoading = false;

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
        // Silently fail - SDK initialization error
      }
    };

    initializeSDK();
  }, []);

  // Redirect to login if no profile
  useEffect(() => {
    if (!profileLoading && !profile) {
      router.push("/");
    }
  }, [profile, profileLoading, router]);


  // Load all spending accounts from database
  useEffect(() => {
    const loadSpendingAccounts = async () => {
      if (!profile?.id) return;

      setIsLoadingAccounts(true);
      try {
        const accounts = await getAccountsByProfile(profile.id);
        const spending = accounts.filter((acc) => acc.type === "spending");
        setSpendingAccounts(spending);
      } catch (error) {
        toast.error("Failed to load accounts");
      } finally {
        setIsLoadingAccounts(false);
      }
    };

    loadSpendingAccounts();
  }, [profile?.id]);

  // Fetch recent transactions
  useEffect(() => {
    const fetchTransactions = async () => {
      if (!profile?.id) return;

      try {
        setLoadingTransactions(true);
        const data = await getRecentTransactions(profile.id, 3);
        // Filter to show only successful transactions (exclude pending/sent)
        const successfulTransactions = data.filter(
          (tx) => tx.status === "success"
        );
        setTransactions(successfulTransactions);
      } catch (error) {
        // Silently fail - transactions will show empty
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

  // Memoize currentAccount to prevent unnecessary re-renders
  const currentAccount = useMemo(() => {
    return investmentAccounts[currentInvestmentAccount];
  }, [investmentAccounts, currentInvestmentAccount]);

  const currentAccountBalance = currentAccount?.total_value || 0;

  // Memoize fetchMovements to prevent unnecessary re-renders
  const fetchMovements = useCallback(async () => {
    if (!profile?.id || activeAccount !== AccountType.Investment) return;

    setMovementsLoading(true);
    try {
      // Get current account at the time of execution to avoid stale closure
      const currentAccountData = investmentAccounts[currentInvestmentAccount];

      if (currentAccountData) {
        const movements = await getInvestmentHistory(profile.id, 10);
        // Filter to show only confirmed movements (exclude pending)
        const confirmedMovements = movements.filter(
          (movement) => movement.status === "confirmed"
        );
        setInvestmentMovements(confirmedMovements);

        const monthlyRewards = parseFloat(
          String(currentAccountData?.total_rewards || "0")
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
  }, [
    profile?.id,
    activeAccount,
    investmentAccounts,
    currentInvestmentAccount,
  ]);

  // Fetch investment movements for current account
  useEffect(() => {
    if (activeAccount === AccountType.Investment) {
      fetchMovements();
    } else if (activeAccount === AccountType.Main) {
      setInvestmentMovements([]);
      setMonthlyRewards(0);
    }
  }, [activeAccount, fetchMovements]);

  const copyAddress = async () => {
    if (currentCardAddress) {
      try {
        await navigator.clipboard.writeText(currentCardAddress);
        setCopied(true);
        setTimeout(() => setCopied(false), 1000);
      } catch (err) {
        // Silently fail - user can manually copy if needed
      }
    }
  };

  // Handle adding a new spending account
  const handleAddSpendingAccount = async () => {
    if (!profile?.id) {
      toast.error("No profile found");
      return;
    }

    setIsAddingAccount(true);
    setShowAddAccountModal(false);

    try {
      linkingProfileIdRef.current = profile.id;
      await linkWallet();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "";
      if (!errorMessage.includes("abort") && !errorMessage.includes("cancel")) {
        toast.error(errorMessage || "Failed to add spending account");
      }
    } finally {
      setIsAddingAccount(false);
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

    if (isLeftSwipe) {
      // Swipe left -> next card
      setCurrentCardIndex((prev) =>
        prev < allAccountCards.length - 1 ? prev + 1 : prev
      );
    }
    if (isRightSwipe) {
      // Swipe right -> previous card
      setCurrentCardIndex((prev) => (prev > 0 ? prev - 1 : prev));
    }

    setTouchStart(null);
    setTouchEnd(null);
  };

  const hasInvestmentAccount = investmentAccounts.length > 0;

  // Calculate all accounts in order: Active wallet first (from DB), then other accounts, then individual Investments, Add New last
  // Source of truth: accounts table in database + investments table
  const allAccountCards = useMemo(() => {
    const cards: Array<{
      type: "spending" | "add-new" | "investment";
      account?: Account;
      investmentAccount?: {
        vault_address: string;
        total_invested: number;
        total_rewards: number;
        total_value: number;
        investment_name: string;
        investment_id: string;
        apr: number;
        status: string;
      };
      index: number;
    }> = [];

    // Find the active account from DB that matches wagmi's connected address
    const activeAccount = spendingAccounts.find(
      (acc) => address && acc.address.toLowerCase() === address.toLowerCase()
    );

    // Add active account first (leftmost dot)
    if (activeAccount) {
      cards.push({ type: "spending", account: activeAccount, index: 0 });
    }

    // Add all other accounts from DB (not the active one)
    spendingAccounts.forEach((account) => {
      if (!address || account.address.toLowerCase() !== address.toLowerCase()) {
        cards.push({ type: "spending", account, index: cards.length });
      }
    });

    // Add individual investment cards (each investment gets its own card)
    investmentAccounts.forEach((investment) => {
      cards.push({
        type: "investment",
        investmentAccount: investment,
        index: cards.length,
      });
    });

    // Add new card at the end
    cards.push({ type: "add-new", index: cards.length });

    return cards;
  }, [spendingAccounts, investmentAccounts, address]);

  // Track current card index
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const currentCard = allAccountCards[currentCardIndex] || allAccountCards[0];

  // Sync activeAccount state with current card type
  useEffect(() => {
    if (currentCard.type === "investment") {
      setActiveAccount(AccountType.Investment);
      // Find the index of this investment in investmentAccounts array
      if (currentCard.investmentAccount) {
        const investmentIndex = investmentAccounts.findIndex(
          (inv) =>
            inv.vault_address === currentCard.investmentAccount?.vault_address
        );
        if (investmentIndex !== -1) {
          setCurrentInvestmentAccount(investmentIndex);
        }
      }
    } else if (currentCard.type === "spending") {
      setActiveAccount(AccountType.Main);
    }
  }, [currentCard.type, currentCard.investmentAccount, investmentAccounts]);

  // Get the address for the current card (from DB account)
  const currentCardAddress = useMemo(() => {
    if (currentCard.type === "spending" && currentCard.account) {
      return currentCard.account.address;
    }
    return undefined;
  }, [currentCard]);

  // Use current card's address for balance
  const {
    formattedBalance: currentCardBalance,
    isLoading: currentBalanceLoading,
  } = useUSDCBalance(currentCardAddress as `0x${string}`);

  // Calculate displayed balance for current card
  const usdBalance: number = currentCardBalance
    ? parseFloat(currentCardBalance)
    : 0;
  displayedBalance =
    currency === "EUR"
      ? convertCurrency(usdBalance, "USD", "EUR", eurRate)
      : usdBalance;
  balanceLoading = currentBalanceLoading;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#3B1EFF] via-[#5B3FFF] to-[#1A0F3D] text-white">
      {/* Mobile Container */}
      <div className="mx-auto max-w-md">
        {/* Header */}
        <div className="pt-6 px-6 pb-6">
          <div className="flex items-center justify-between mb-10">
            <button
              data-tour="profile"
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
              onClick={() => {
                const subject = "BANB Feedback";
                const body = `Hi BANB team,

Here are three things I love:
1. 
2. 
3. 

Here are three things I would like to change:
1. 
2. 
3. 

Thanks!`;
                const mailtoLink = `mailto:alessandromaci96@gmail.com?subject=${encodeURIComponent(
                  subject
                )}&body=${encodeURIComponent(body)}`;
                const link = document.createElement("a");
                link.href = mailtoLink;
                link.target = "_blank";
                link.rel = "noopener noreferrer";
                link.click();
              }}
            >
              <MessageCircle className="h-4 w-4" />
              Feedback
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
              {currentCard.type === "spending" &&
                (currentCard.account?.name || "Spending Account")}
              {currentCard.type === "add-new" && ""}
              {currentCard.type === "investment" && "Investment Account"}
              {currentCard.type !== "add-new" && ` - ${currency}`}
            </div>
            {currentCard.type === "spending" ? (
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
                {currentCardAddress && isMounted && (
                  <div className="text-sm text-white/70 mb-3 flex items-center justify-center gap-1">
                    <button
                      onClick={copyAddress}
                      className="flex items-center gap-2 hover:text-white transition-colors cursor-pointer"
                    >
                      <span>
                        {currentCardAddress.slice(0, 6)}...
                        {currentCardAddress.slice(-4)}
                      </span>
                      {copied ? (
                        <Check className="h-4 w-4 text-white" />
                      ) : (
                        <Copy className="h-4 w-4 opacity-60 hover:opacity-100" />
                      )}
                    </button>
                    <span className="text-white/50">-</span>
                    <span className="flex items-center gap-1 font-sans">
                      {currentCardBalance || "0.00"}{" "}
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
            ) : currentCard.type === "add-new" ? (
              <>
                {/* Add New Account Card */}
                <div className="text-center py-8">
                  <Button
                    onClick={() => setShowAddAccountModal(true)}
                    className="bg-white/15 hover:bg-white/25 text-white border-0 rounded-full px-6 py-3"
                  >
                    Add New Account
                  </Button>
                </div>
              </>
            ) : (
              <>
                {/* Investment Account */}
                {currentCard.type === "investment" &&
                currentCard.investmentAccount ? (
                  <>
                    <div className="text-6xl font-bold mb-6 transition-all duration-500 ease-out flex items-end justify-center">
                      {!isMounted || investmentsLoading ? (
                        `${currency === "USD" ? "$" : "€"}...`
                      ) : (
                        <>
                          <span>
                            {
                              formatBalanceWithDifferentSizes(
                                currentCard.investmentAccount.total_value || 0,
                                currency
                              ).symbol
                            }
                          </span>
                          <span>
                            {
                              formatBalanceWithDifferentSizes(
                                currentCard.investmentAccount.total_value || 0,
                                currency
                              ).integerPart
                            }
                          </span>
                          <span className="text-4xl">
                            .
                            {
                              formatBalanceWithDifferentSizes(
                                currentCard.investmentAccount.total_value || 0,
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
                          {currentCard.investmentAccount.investment_name ||
                            "Investment Account"}
                        </span>
                        {copied ? (
                          <Check className="h-4 w-4 text-green-400" />
                        ) : (
                          <Copy className="h-4 w-4 opacity-60 hover:opacity-100" />
                        )}
                      </button>

                      <span className="text-white/50">-</span>
                      <span>
                        {currentCard.investmentAccount.total_value?.toFixed(
                          2
                        ) || "0.00"}{" "}
                        USDC
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8"></div>
                )}
              </>
            )}
          </div>

          {/* Pagination Dots */}
          <div
            data-tour="pagination"
            className="flex justify-center gap-2 mb-10"
          >
            {allAccountCards.map((card, index) => (
              <button
                key={`dot-${card.type}-${index}`}
                onClick={() => setCurrentCardIndex(index)}
                className={`h-2 w-2 rounded-full transition-colors ${
                  currentCardIndex === index
                    ? "bg-white shadow-lg shadow-white/50"
                    : "bg-white/30"
                }`}
              />
            ))}
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-4 gap-4 mb-8">
            {/* Add Button */}
            <div className="flex flex-col items-center gap-2">
              <Button
                size="icon"
                className="h-16 w-16 rounded-full bg-white/15 hover:bg-white/25 text-white border-0 shadow-lg shadow-indigo-500/20 transition-all hover:scale-105"
                onClick={() => {
                  if (activeAccount === AccountType.Main) {
                    // Store deposit data in sessionStorage
                    sessionStorage.setItem(
                      "depositData",
                      JSON.stringify({
                        balance: displayedBalance.toString(),
                        currency: currency,
                        account: AccountType.Main,
                        walletAddress: address || "",
                      })
                    );
                    router.push("/deposit");
                  } else if (
                    currentCard.type === "investment" &&
                    currentCard.investmentAccount
                  ) {
                    // Investment account - add more to same vault
                    router.push(
                      `/invest/amount?vault=${
                        currentCard.investmentAccount.vault_address
                      }&name=${encodeURIComponent(
                        currentCard.investmentAccount.investment_name || ""
                      )}`
                    );
                  }
                }}
              >
                <Plus className="size-6" />
              </Button>
              <span className="text-xs text-white/90 font-medium whitespace-nowrap">
                Add money
              </span>
            </div>

            {/* Invest/Withdraw Button */}
            <div
              data-tour="invest"
              className="flex flex-col items-center gap-2"
            >
              <Button
                size="icon"
                className="h-16 w-16 rounded-full bg-white/15 hover:bg-white/25 text-white border-0 shadow-lg shadow-indigo-500/20 transition-all hover:scale-105"
                onClick={() => {
                  if (activeAccount === AccountType.Main) {
                    router.push("/invest/select");
                  } else {
                    // Investment account - withdraw from vault (disabled for now)
                    // TODO: Implement withdrawal functionality
                  }
                }}
                disabled={activeAccount === AccountType.Investment}
              >
                {activeAccount === AccountType.Investment ? (
                  <ArrowDownFromLine className="size-6" />
                ) : (
                  <TrendingUp className="size-6" />
                )}
              </Button>
              <span className="text-xs text-white/90 font-medium whitespace-nowrap">
                {activeAccount === AccountType.Investment
                  ? "Withdraw"
                  : "Invest"}
              </span>
            </div>

            {/* Send/Info Button */}
            <div className="flex flex-col items-center gap-2">
              <Button
                onClick={() => {
                  if (activeAccount === AccountType.Main) {
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
                {activeAccount === AccountType.Main ? (
                  <Send className="size-6" />
                ) : (
                  <Info className="size-6" />
                )}
              </Button>
              <span className="text-xs text-white/90 font-medium whitespace-nowrap">
                {activeAccount === AccountType.Main ? "Send" : "Info"}
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

          <InsightsCarousel />

          {/* Rewards Summary & Transactions/Investments Card */}
          {activeAccount === AccountType.Investment && currentAccount && (
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
              {activeAccount === AccountType.Main ? (
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
                disabled={true}
                className={`flex flex-col items-center gap-1 py-2 transition-colors ${
                  activeTab === "analytics" ? "text-white" : "text-white/50"
                }`}
              >
                <BarChart3 className="size-8" />
                <span className="text-xs">Analytics</span>
              </button>

              {/* Center AI Button */}
              <button
                data-tour="ai-bar"
                onClick={() => {
                  // Check consent before opening AI chat
                  if (hasConsent === false || hasConsent === null) {
                    setShowAIConsent(true);
                  } else {
                    setShowAIChat(true);
                  }
                }}
                className="flex flex-col items-center gap-1 py-2 transition-colors"
              >
                <div className="size-8 bg-white rounded-full flex items-center justify-center shadow-lg">
                  <Image
                    src="/banb-white-icon.svg"
                    alt="BANB AI"
                    width={18}
                    height={18}
                    style={{ width: "auto", height: "auto" }}
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
            <h2 className="text-xl font-semibold text-white mb-6 text-center">
              Add New Account
            </h2>

            <div className="space-y-4">
              <button
                onClick={handleAddSpendingAccount}
                disabled={isAddingAccount}
                className="w-full p-4 rounded-2xl bg-white/10 border border-white/20 text-white hover:bg-white/15 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="text-left">
                  <div className="font-medium flex items-center gap-2">
                    {isAddingAccount && (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}
                    Spending Account
                  </div>
                  <div className="text-sm text-white/60">
                    {isAddingAccount
                      ? "Connecting wallet..."
                      : "Connect a new wallet"}
                  </div>
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
              disabled={isAddingAccount}
              className="w-full mt-6 py-3 text-white/60 hover:text-white transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* AI Consent Dialog */}
      <AIConsentDialog
        open={showAIConsent}
        onConsent={() => {
          grantConsent();
          setShowAIConsent(false);
          setShowAIChat(true);
        }}
        onDecline={() => {
          setShowAIConsent(false);
        }}
      />

      {/* AI Chat Dialog */}
      <Dialog open={showAIChat} onOpenChange={setShowAIChat}>
        <DialogContent className="ai-chat-dialog w-full max-w-full sm:max-w-4xl h-[90vh] sm:h-[85vh] p-0 gap-0 rounded-t-2xl rounded-b-none sm:rounded-b-2xl flex flex-col">
          <DialogHeader className="sr-only">
            <DialogTitle>BANB AI</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-hidden">
            <AIAgentChat />
          </div>
        </DialogContent>
      </Dialog>

      <OnboardingTour />
    </div>
  );
}
