"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createProfile, getProfileByAnyWallet } from "@/lib/profile";
import { createAccount } from "@/lib/accounts";
import { useUser } from "@/lib/user-context";
import { usePrivy, useWallets, useCreateWallet } from "@privy-io/react-auth";
import { useAccount } from "wagmi";

/**
 * Helper function to derive username from email
 */
function deriveUsernameFromEmail(email: string): string {
  const beforeAt = email.split("@")[0];
  return beforeAt.replace(/[^a-zA-Z0-9]/g, "").slice(0, 20) || "user";
}

export function SignUpForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [isCreatingProfile, setIsCreatingProfile] = useState(false);
  const isRedirectingRef = useRef(false);
  const hasStartedRef = useRef(false);

  const { setProfile } = useUser();
  const { user, ready: privyReady } = usePrivy();
  const { wallets: privyWallets } = useWallets();
  const { address: wagmiAddress } = useAccount();
  const { createWallet } = useCreateWallet();

  // Get smart wallet address from Privy user's linkedAccounts
  const smartWallet = user?.linkedAccounts?.find(
    (account) => account.type === "smart_wallet" || account.type === "wallet"
  );
  const smartWalletAddress =
    smartWallet && "address" in smartWallet
      ? (smartWallet.address as string)
      : null;

  // Use smart wallet address if available, otherwise fall back to wagmi address
  const address = smartWalletAddress || wagmiAddress;

  // Extract username from Google/Apple/Email
  const extractUsernameFromUser = (userToExtract: typeof user) => {
    if (!userToExtract || !privyReady) return null;

    // Check for Google OAuth account first
    const googleAccount = userToExtract.linkedAccounts?.find(
      (account) => account.type === "google_oauth"
    );
    if (googleAccount && "email" in googleAccount) {
      const googleEmail = googleAccount.email as string | undefined;
      if (googleEmail) {
        return deriveUsernameFromEmail(googleEmail);
      }
    }
    if (googleAccount && "subject" in googleAccount) {
      const googleSubject = googleAccount.subject as string | undefined;
      if (googleSubject) {
        return `user${googleSubject.slice(-8)}`;
      }
    }

    // Check for Apple OAuth account
    const appleAccount = userToExtract.linkedAccounts?.find(
      (account) => account.type === "apple_oauth"
    );
    if (appleAccount && "email" in appleAccount) {
      const appleEmail = appleAccount.email as string | undefined;
      if (appleEmail) {
        return deriveUsernameFromEmail(appleEmail);
      }
    }

    // Fallback to email account
    const emailAccount = userToExtract.linkedAccounts?.find(
      (account) => account.type === "email"
    );
    if (emailAccount && "address" in emailAccount) {
      const emailAddress = emailAccount.address as string;
      if (emailAddress) {
        return deriveUsernameFromEmail(emailAddress);
      }
    }

    // Try direct email property
    if (userToExtract.email?.address) {
      return deriveUsernameFromEmail(userToExtract.email.address);
    }

    // Last resort: generate a default username
    return "user";
  };

  // Watch for address becoming available and trigger profile creation
  useEffect(() => {
    if (
      hasStartedRef.current ||
      isCreatingProfile ||
      !privyReady ||
      !user ||
      isRedirectingRef.current
    )
      return;

    const extractedUsername = extractUsernameFromUser(user);
    if (!extractedUsername) return;

    // If we have username, start the process
    if (extractedUsername) {
      hasStartedRef.current = true;
      setUsername(extractedUsername);
      createProfileWithUsername(extractedUsername);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, user, privyReady, isCreatingProfile]);

  // Create profile with given username
  const createProfileWithUsername = async (profileUsername: string) => {
    if (!privyReady || isCreatingProfile) return;

    // Check if user has a wallet, create one if not
    const hasSmartWallet = user?.linkedAccounts?.some(
      (account) => account.type === "smart_wallet" || account.type === "wallet"
    );
    const hasEmbeddedWallet = privyWallets.some(
      (wallet) => wallet.walletClientType === "privy"
    );

    // If user doesn't have a wallet, create one before proceeding
    if (!hasSmartWallet && !hasEmbeddedWallet && !address) {
      try {
        await createWallet();
        return; // Exit early, useEffect will retry when address becomes available
      } catch (error) {
        setError("Failed to create wallet. Please try again.");
        setIsCreatingProfile(false);
        return;
      }
    }

    // If address isn't ready yet, wait for it
    if (!address) {
      return; // Exit early, will retry when address is available via useEffect
    }

    if (!profileUsername) {
      return;
    }

    setIsCreatingProfile(true);
    setError(null);

    try {
      // Check if profile already exists
      const existingProfile = await getProfileByAnyWallet(address);
      if (existingProfile) {
        isRedirectingRef.current = true;
        setProfile(existingProfile);
        setIsCreatingProfile(false);

        if (typeof window !== "undefined") {
          window.location.href = "/home";
        } else {
          router.push("/home");
        }
        return;
      }

      // Create new profile with username
      const profile = await createProfile({
        name: profileUsername,
        wallet_address: address,
      });

      // Create initial spending account
      await createAccount({
        profile_id: profile.id,
        name: "Spending Account 1",
        type: "spending",
        address: address,
        network: "base",
        is_primary: true,
      });

      // Mark as redirecting to prevent loops
      isRedirectingRef.current = true;
      setProfile(profile);
      setIsCreatingProfile(false);

      // Use window.location immediately for reliable redirect
      if (typeof window !== "undefined") {
        window.location.href = "/home?newUser=true";
      } else {
        router.push("/home?newUser=true");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create profile");
      setIsCreatingProfile(false);
    }
  };

  // Show loading screen while creating profile
  if (isCreatingProfile) {
    return (
      <div className="h-dvh bg-black text-white flex flex-col items-center justify-center relative overflow-hidden touch-none">
        <div className="text-center space-y-6">
          <Loader2 className="h-16 w-16 animate-spin mx-auto text-white" />
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">Creating your profile</h2>
            <p className="text-white/60 text-sm">
              Please wait while we set everything up...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show error screen if profile creation failed
  if (error) {
    return (
      <div className="h-dvh bg-black text-white flex flex-col items-center justify-center relative overflow-hidden touch-none">
        <div className="text-center space-y-6 px-6 max-w-md">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">Something went wrong</h2>
            <p className="text-white/60 text-sm">{error}</p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-xl text-white font-semibold"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Show initial loading while waiting for Privy/user/wallet
  return (
    <div className="h-dvh bg-black text-white flex flex-col items-center justify-center relative overflow-hidden touch-none">
      <div className="text-center space-y-6">
        <Loader2 className="h-16 w-16 animate-spin mx-auto text-white" />
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">Setting up your account</h2>
          <p className="text-white/60 text-sm">
            Please wait while we prepare everything...
          </p>
        </div>
      </div>
    </div>
  );
}
