"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import {
  X,
  DollarSign,
  Moon,
  Globe,
  Wallet,
  CreditCard,
  MessageCircle,
  Mail,
  ExternalLink,
  LogOut,
  Trash2,
  ChevronRight,
  ChevronDown,
  Edit,
  Loader2,
  Compass,
  Copy,
  Check,
  WalletIcon,
  Sparkles,
  RotateCcw,
} from "lucide-react";
import { useAccount } from "wagmi";
import { useUser } from "@/lib/user-context";
import { updateProfileName, deleteProfile } from "@/lib/profile";
import { getAccountsByProfile, updateAccount } from "@/lib/accounts";
import { type Account } from "@/lib/supabase";
import { useSetActiveWalletSafe } from "@/lib/use-account-safe";
import { useWallets, usePrivy } from "@privy-io/react-auth";
import { toast } from "sonner";

export default function ProfilePage() {
  const router = useRouter();
  const { profile, setProfile } = useUser();
  const { connector, address } = useAccount();
  const { wallets: privyWallets } = useWallets();
  const { setActiveWallet } = useSetActiveWalletSafe();
  const { connectWallet } = usePrivy();
  const [currency, setCurrency] = useState<"USD" | "EUR">("USD");
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(profile?.name || "");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showWallets, setShowWallets] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [linkedAccounts, setLinkedAccounts] = useState<Account[]>([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(false);
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [editedAccountName, setEditedAccountName] = useState("");
  const [isSwitchingWallet, setIsSwitchingWallet] = useState(false);

  // Fetch all linked accounts from DB
  useEffect(() => {
    const fetchLinkedAccounts = async () => {
      if (!profile?.id) return;

      setIsLoadingAccounts(true);
      try {
        const accounts = await getAccountsByProfile(profile.id);
        setLinkedAccounts(accounts);
      } catch (err) {
        console.error("Failed to fetch linked accounts:", err);
      } finally {
        setIsLoadingAccounts(false);
      }
    };

    fetchLinkedAccounts();
  }, [profile?.id]);

  const handleSaveName = async () => {
    if (!profile || !editedName.trim()) return;

    setIsSaving(true);
    setError(null);

    try {
      const updatedProfile = await updateProfileName(profile.id, editedName);
      setProfile(updatedProfile);
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update name");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!profile) return;

    setIsDeleting(true);
    setError(null);

    try {
      await deleteProfile(profile.id);
      setProfile(null);
      localStorage.removeItem("user_profile");
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete account");
      setIsDeleting(false);
    }
  };

  const handleLogout = () => {
    setProfile(null);
    localStorage.removeItem("user_profile");
    router.push("/");
  };

  const handleExploreBaseScan = () => {
    if (profile?.wallet_address) {
      window.open(
        `https://basescan.org/address/${profile.wallet_address}`,
        "_blank"
      );
    }
  };

  const handleCopyAddress = async (address: string) => {
    await navigator.clipboard.writeText(address);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  const handleEmailSupport = () => {
    window.location.href = "mailto:support@banb.app";
  };

  const handleResetTour = () => {
    localStorage.removeItem("hasCompletedTour");
    toast.success(
      "Tour reset! You'll see it next time you visit the home page."
    );
    router.push("/home");
  };

  const handleConnectWallet = async () => {
    try {
      await connectWallet();
      toast.success("Wallet connected! You can now use it.");
      // Reload accounts to refresh connection status
      if (profile?.id) {
        const accounts = await getAccountsByProfile(profile.id);
        setLinkedAccounts(accounts);
      }
    } catch (err) {
      console.error("Failed to connect wallet:", err);
      // Don't show error if user cancelled
      const errorMessage = err instanceof Error ? err.message : "";
      if (!errorMessage.includes("abort") && !errorMessage.includes("cancel")) {
        toast.error("Failed to connect wallet");
      }
    }
  };

  const handleSwitchWallet = async (account: Account) => {
    if (!address || account.address.toLowerCase() === address.toLowerCase()) {
      return; // Already active
    }

    setIsSwitchingWallet(true);
    try {
      // Find the wallet in Privy's wallets
      const targetWallet = privyWallets.find(
        (w) => w.address.toLowerCase() === account.address.toLowerCase()
      );

      if (!targetWallet) {
        toast.error(
          "This wallet is not connected. Please connect it first to use it."
        );
        setIsSwitchingWallet(false);
        return;
      }

      console.log("Switching to wallet:", account.address);

      // Switch active wallet in wagmi
      await setActiveWallet(
        targetWallet as unknown as Parameters<typeof setActiveWallet>[0]
      );

      console.log("Wallet switched successfully");

      toast.success(`Switched to ${account.name}`);

      // Force a small delay to ensure wagmi updates
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (err) {
      console.error("Failed to switch wallet:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to switch wallet"
      );
    } finally {
      setIsSwitchingWallet(false);
    }
  };

  const handleSaveAccountName = async (accountId: string) => {
    if (!editedAccountName.trim()) {
      toast.error("Account name cannot be empty");
      return;
    }

    try {
      await updateAccount(accountId, { name: editedAccountName });

      // Update local state
      setLinkedAccounts((prev) =>
        prev.map((acc) =>
          acc.id === accountId ? { ...acc, name: editedAccountName } : acc
        )
      );

      setEditingAccountId(null);
      setEditedAccountName("");
      toast.success("Account name updated");
    } catch (err) {
      console.error("Failed to update account name:", err);
      toast.error("Failed to update account name");
    }
  };

  // Get connection method from wallet connector
  const getConnectionMethod = () => {
    if (!connector) return "Email";

    const connectorName = connector.name?.toLowerCase() || "";

    // Check connector name for Farcaster Wallet or Porto
    if (connectorName.includes("farcaster")) return "Farcaster Wallet";
    if (connectorName.includes("porto")) return "Porto Wallet";

    // Return the connector name if available, otherwise default to Email
    return connector.name || "Email";
  };

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#0E0E0F] flex items-center justify-center">
        <p className="text-white">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0E0E0F] text-white pb-20">
      <div className="mx-auto max-w-md">
        {/* Header */}
        <div className="px-6 py-8 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-medium pl-2">Account</h1>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/home")}
              className="text-white hover:bg-white/10 rounded-full"
            >
              <X className="h-6 w-6" />
            </Button>
          </div>
        </div>

        <div className="px-6 space-y-6">
          {/* Profile Info */}
          <div className="flex flex-col items-center py-4">
            <div className="relative mb-4">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-4xl font-bold">
                {profile.name.charAt(0).toUpperCase()}
              </div>
            </div>

            {isEditing ? (
              <div className="w-full space-y-3">
                <Input
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  className="h-12 bg-white/5 border-white/10 text-white text-center"
                  placeholder="Enter your name"
                />
                <div className="flex gap-2">
                  <Button
                    onClick={handleSaveName}
                    disabled={isSaving || !editedName.trim()}
                    className="flex-1 h-12 bg-white text-black hover:bg-white/90 rounded-full"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Saving...
                      </>
                    ) : (
                      "Save"
                    )}
                  </Button>
                  <Button
                    onClick={() => {
                      setIsEditing(false);
                      setEditedName(profile.name);
                      setError(null);
                    }}
                    variant="ghost"
                    className="flex-1 h-12 text-white hover:bg-white/10 rounded-full"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center flex items-center justify-center">
                <h2 className="text-2xl font-semibold">{profile.name}</h2>
                <button
                  onClick={() => {
                    setIsEditing(true);
                    setEditedName(profile.name);
                  }}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <Edit className="h-4 w-4 text-white/60" />
                </button>
              </div>
            )}

            {error && (
              <div className="mt-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20 w-full">
                <p className="text-sm text-red-400 text-center">{error}</p>
              </div>
            )}
          </div>

          {/* Upgrade */}
          <div>
            <h2 className="text-base font-semibold text-white mb-3 px-1">
              Premium
            </h2>
            <div className="bg-white/5 rounded-2xl border border-white/10">
              <button
                onClick={() => router.push("/upgrade")}
                className="w-full flex items-center justify-between p-4 hover:bg-white/10 transition-colors rounded-2xl"
              >
                <div className="flex items-center gap-3">
                  <Sparkles className="h-5 w-5 text-white/60" />
                  <div className="text-left">
                    <p className="text-base font-medium text-white">
                      Upgrade Account
                    </p>
                    <p className="text-sm text-white/50">
                      Unlock premium features
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-white/40" />
              </button>
            </div>
          </div>

          {/* Authentication */}
          <div>
            <h2 className="text-base font-semibold text-white mb-3 px-1">
              Authentication
            </h2>
            <div className="bg-white/5 rounded-2xl border border-white/10 divide-y divide-white/10">
              <button className="w-full flex items-center justify-between p-4 hover:bg-white/10 transition-colors rounded-2xl">
                <div className="flex items-center gap-3">
                  <WalletIcon className="h-5 w-5 text-white/60" />
                  <p className="text-base font-medium text-white">
                    {getConnectionMethod()}
                  </p>
                </div>
              </button>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-between p-4 hover:bg-white/10 transition-colors first:rounded-t-2xl"
              >
                <div className="flex items-center gap-3">
                  <LogOut className="h-5 w-5 text-white/60" />
                  <p className="text-base font-medium text-white">Logout</p>
                </div>
                <div className="flex items-center gap-2">
                  <ChevronRight className="h-5 w-5 text-white/40" />
                </div>
              </button>
            </div>
          </div>

          {/* Preferences */}
          <div>
            <h2 className="text-base font-semibold text-white mb-3 px-1">
              Preferences
            </h2>
            <div className="bg-white/5 rounded-2xl border border-white/10 divide-y divide-white/10">
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <DollarSign className="h-5 w-5 text-white/60" />
                  <p className="text-base font-medium text-white">
                    Display Currency
                  </p>
                </div>
                <div className="flex gap-1 bg-white/10 rounded-lg p-1">
                  <button
                    onClick={() => setCurrency("USD")}
                    className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors w-[52px] flex items-center justify-center ${
                      currency === "USD"
                        ? "bg-white/20 text-white"
                        : "text-white/60"
                    }`}
                  >
                    USD
                  </button>
                  <button
                    onClick={() => setCurrency("EUR")}
                    className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors w-[52px] flex items-center justify-center ${
                      currency === "EUR"
                        ? "bg-white/20 text-white"
                        : "text-white/60"
                    }`}
                  >
                    EUR
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <Moon className="h-5 w-5 text-white/60" />
                  <p className="text-base font-medium text-white">Theme</p>
                </div>
                <div className="flex gap-1 bg-white/10 rounded-lg p-1">
                  <button
                    onClick={() => setTheme("dark")}
                    className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors w-[52px] flex items-center justify-center ${
                      theme === "dark"
                        ? "bg-white/20 text-white"
                        : "text-white/60"
                    }`}
                  >
                    Dark
                  </button>
                  <button
                    onClick={() => setTheme("light")}
                    className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors w-[52px] flex items-center justify-center ${
                      theme === "light"
                        ? "bg-white/20 text-white"
                        : "text-white/60"
                    }`}
                  >
                    Light
                  </button>
                </div>
              </div>
              <button className="w-full flex items-center justify-between p-4 hover:bg-white/10 transition-colors">
                <div className="flex items-center gap-3">
                  <Globe className="h-5 w-5 text-white/60" />
                  <div className="text-left">
                    <p className="text-base font-medium text-white">Language</p>
                    <p className="text-sm text-white/50">English</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-white/40" />
              </button>
              <button
                onClick={handleResetTour}
                className="w-full flex items-center justify-between p-4 hover:bg-white/10 transition-colors last:rounded-b-2xl"
              >
                <div className="flex items-center gap-3">
                  <RotateCcw className="h-5 w-5 text-white/60" />
                  <div className="text-left">
                    <p className="text-base font-medium text-white">
                      Reset Tour
                    </p>
                    <p className="text-sm text-white/50">
                      View onboarding tour again
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-white/40" />
              </button>
            </div>
          </div>

          {/* Accounts & Connections */}
          <div>
            <h2 className="text-base font-semibold text-white mb-3 px-1">
              Accounts & Connections
            </h2>
            <div className="bg-white/5 rounded-2xl border border-white/10 divide-y divide-white/10">
              <div>
                <button
                  onClick={() => setShowWallets(!showWallets)}
                  className="w-full flex items-center justify-between p-4 hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Wallet className="h-5 w-5 text-white/60" />
                    <div className="text-left">
                      <p className="text-base font-medium text-white">
                        Linked Wallets
                      </p>
                      <p className="text-sm text-white/50">
                        View or Add Wallets
                      </p>
                    </div>
                  </div>
                  <ChevronDown
                    className={`h-5 w-5 text-white/40 transition-transform ${
                      showWallets ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {showWallets && (
                  <div className="px-4 pb-2 space-y-2">
                    {isLoadingAccounts ? (
                      <div className="flex items-center justify-center p-4">
                        <Loader2 className="h-5 w-5 animate-spin text-white/60" />
                      </div>
                    ) : linkedAccounts.length > 0 ? (
                      linkedAccounts.map((account) => {
                        const isActive =
                          address &&
                          account.address.toLowerCase() ===
                            address.toLowerCase();
                        const isEditing = editingAccountId === account.id;
                        const isConnected = privyWallets.some(
                          (w) =>
                            w.address.toLowerCase() ===
                            account.address.toLowerCase()
                        );

                        return (
                          <div
                            key={account.id}
                            className="p-3 bg-white/5 rounded-lg space-y-2"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {isActive && (
                                  <div className="relative">
                                    <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                                    <div className="absolute inset-0 h-2 w-2 bg-green-500 rounded-full opacity-75 animate-ping"></div>
                                  </div>
                                )}
                                {isEditing ? (
                                  <Input
                                    value={editedAccountName}
                                    onChange={(e) =>
                                      setEditedAccountName(e.target.value)
                                    }
                                    className="h-8 bg-white/5 border-white/10 text-white text-xs"
                                    placeholder="Account name"
                                  />
                                ) : (
                                  <p className="text-xs text-white/50">
                                    {account.name}
                                  </p>
                                )}
                              </div>
                              {!isEditing && (
                                <button
                                  onClick={() => {
                                    setEditingAccountId(account.id);
                                    setEditedAccountName(account.name);
                                  }}
                                  className="p-1 hover:bg-white/10 rounded transition-colors"
                                >
                                  <Edit className="h-3 w-3 text-white/60" />
                                </button>
                              )}
                            </div>

                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm text-white font-mono">
                                {account.address.slice(0, 6)}...
                                {account.address.slice(-4)}
                              </p>
                              <button
                                onClick={() =>
                                  handleCopyAddress(account.address)
                                }
                                className="p-1.5 hover:bg-white/10 rounded transition-colors"
                              >
                                {copiedAddress ? (
                                  <Check className="h-4 w-4 text-green-500" />
                                ) : (
                                  <Copy className="h-4 w-4 text-white/60" />
                                )}
                              </button>
                            </div>

                            {isEditing ? (
                              <div className="flex gap-2 pt-1">
                                <Button
                                  onClick={() =>
                                    handleSaveAccountName(account.id)
                                  }
                                  size="sm"
                                  className="flex-1 h-7 bg-white text-black hover:bg-white/90 text-xs"
                                >
                                  Save
                                </Button>
                                <Button
                                  onClick={() => {
                                    setEditingAccountId(null);
                                    setEditedAccountName("");
                                  }}
                                  size="sm"
                                  variant="ghost"
                                  className="flex-1 h-7 text-white hover:bg-white/10 text-xs"
                                >
                                  Cancel
                                </Button>
                              </div>
                            ) : !isActive ? (
                              <div className="space-y-1">
                                {isConnected ? (
                                  <Button
                                    onClick={() => handleSwitchWallet(account)}
                                    disabled={isSwitchingWallet}
                                    size="sm"
                                    className="w-full h-7 bg-white/10 hover:bg-white/20 text-white text-xs"
                                  >
                                    {isSwitchingWallet ? (
                                      <>
                                        <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                        Switching...
                                      </>
                                    ) : (
                                      "Use as main"
                                    )}
                                  </Button>
                                ) : (
                                  <Button
                                    onClick={handleConnectWallet}
                                    size="sm"
                                    variant="outline"
                                    className="w-full h-7 border-white/20 text-white hover:bg-white/10 text-xs"
                                  >
                                    Connect Wallet
                                  </Button>
                                )}
                              </div>
                            ) : null}
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-3 text-center">
                        <p className="text-sm text-white/50">
                          No linked wallets found
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <button
                onClick={handleExploreBaseScan}
                className="w-full flex items-center justify-between p-4 hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Compass className="h-5 w-5 text-white/60" />
                  <div className="text-left">
                    <p className="text-base font-medium text-white">
                      BaseScan Explorer
                    </p>
                    <p className="text-sm text-white/50">
                      View address on Base network
                    </p>
                  </div>
                </div>
                <ExternalLink className="h-5 w-5 text-white/40" />
              </button>

              <button
                onClick={() => router.push("/cards")}
                className="w-full flex items-center justify-between p-4 hover:bg-white/10 transition-colors last:rounded-b-2xl"
              >
                <div className="flex items-center gap-3">
                  <CreditCard className="h-5 w-5 text-white/60" />
                  <div className="text-left">
                    <p className="text-base font-medium text-white">
                      Crypto Card
                    </p>
                    <p className="text-sm text-white/50">Coming Soon 🔒</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-white/40" />
              </button>
            </div>
          </div>

          {/* Community & Support */}
          <div>
            <h2 className="text-base font-semibold text-white mb-3 px-1">
              Community & Support
            </h2>
            <div className="bg-white/5 rounded-2xl border border-white/10 divide-y divide-white/10">
              <button
                onClick={() =>
                  window.open("https://t.me/alessandromaci", "_blank")
                }
                className="w-full flex items-center justify-between p-4 hover:bg-white/10 transition-colors first:rounded-t-2xl"
              >
                <div className="flex items-center gap-3">
                  <MessageCircle className="h-5 w-5 text-white/60" />
                  <div className="text-left">
                    <p className="text-base font-medium text-white">
                      Telegram Community
                    </p>
                    <p className="text-sm text-white/50">Join Group</p>
                  </div>
                </div>
                <ExternalLink className="h-5 w-5 text-white/40" />
              </button>
              <button
                onClick={handleEmailSupport}
                className="w-full flex items-center justify-between p-4 hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-white/60" />
                  <div className="text-left">
                    <p className="text-base font-medium text-white">
                      Contact Support
                    </p>
                    <p className="text-sm text-white/50">
                      alessandromaci96@gmail.com
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-white/40" />
              </button>
              <button className="w-full flex items-center justify-between p-4 hover:bg-white/10 transition-colors">
                <div className="flex items-center gap-3">
                  <Image
                    src="/x-logo.png"
                    alt="X"
                    width={20}
                    height={20}
                    className="text-white/60"
                  />
                  <div className="text-left">
                    <p className="text-base font-medium text-white">
                      Follow on X (Twitter)
                    </p>
                    <p className="text-sm text-white/50">@alerex_eth</p>
                  </div>
                </div>
                <ExternalLink className="h-5 w-5 text-white/40" />
              </button>
              <button className="w-full flex items-center justify-between p-4 hover:bg-white/10 transition-colors">
                <div className="flex items-center gap-3">
                  <Image
                    src="/farcaster-logo.svg"
                    alt="Farcaster"
                    width={20}
                    height={20}
                    className="text-white/60"
                  />
                  <div className="text-left">
                    <p className="text-base font-medium text-white">
                      Follow on Farcaster
                    </p>
                    <p className="text-sm text-white/50">@alessandro-maci</p>
                  </div>
                </div>
                <ExternalLink className="h-5 w-5 text-white/40" />
              </button>
            </div>
          </div>

          {/* Advanced */}
          <div>
            <h2 className="text-base font-semibold text-white mb-3 px-1">
              Advanced
            </h2>
            <div className="bg-white/5 rounded-2xl border border-white/10 divide-y divide-white/10">
              {!showDeleteConfirm ? (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full flex items-center justify-between p-4 hover:bg-red-500/20 transition-colors last:rounded-b-2xl"
                >
                  <div className="flex items-center gap-3">
                    <Trash2 className="h-5 w-5 text-red-400" />
                    <div className="text-left">
                      <p className="text-base font-medium text-red-400">
                        Delete Account
                      </p>
                      <p className="text-sm text-red-400/70">
                        Permanently remove your account
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-red-400/60" />
                </button>
              ) : (
                <div className="p-4 space-y-3">
                  <p className="text-sm text-white">
                    Are you sure? This will permanently delete your account and
                    all data.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleDeleteAccount}
                      disabled={isDeleting}
                      className="flex-1 h-12 bg-red-500 text-white hover:bg-red-600 rounded-full"
                    >
                      {isDeleting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Deleting...
                        </>
                      ) : (
                        "Yes, Delete"
                      )}
                    </Button>
                    <Button
                      onClick={() => {
                        setShowDeleteConfirm(false);
                        setError(null);
                      }}
                      variant="ghost"
                      disabled={isDeleting}
                      className="flex-1 h-12 text-white hover:bg-white/10 rounded-full"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
