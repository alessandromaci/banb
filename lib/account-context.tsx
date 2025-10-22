/**
 * @fileoverview Account context for managing selected account state.
 * Provides context for the currently selected account across the application.
 */

"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { type Account } from "./supabase";

interface AccountContextType {
  selectedAccount: Account | null;
  setSelectedAccount: (account: Account | null) => void;
  selectAccountById: (accountId: string, accounts: Account[]) => void;
}

const AccountContext = createContext<AccountContextType | undefined>(undefined);

/**
 * Provider component for account context.
 *
 * @param children - Child components
 */
export function AccountProvider({ children }: { children: React.ReactNode }) {
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);

  const selectAccountById = useCallback(
    (accountId: string, accounts: Account[]) => {
      const account = accounts.find((acc) => acc.id === accountId);
      setSelectedAccount(account || null);
    },
    []
  );

  return (
    <AccountContext.Provider
      value={{
        selectedAccount,
        setSelectedAccount,
        selectAccountById,
      }}
    >
      {children}
    </AccountContext.Provider>
  );
}

/**
 * Hook to use account context.
 *
 * @returns Account context value
 * @throws Error if used outside AccountProvider
 *
 * @example
 * ```tsx
 * function AccountSelector() {
 *   const { selectedAccount, setSelectedAccount } = useSelectedAccount();
 *   
 *   return (
 *     <div>
 *       Current: {selectedAccount?.name || "None"}
 *       <button onClick={() => setSelectedAccount(someAccount)}>
 *         Select Account
 *       </button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useSelectedAccount(): AccountContextType {
  const context = useContext(AccountContext);
  if (context === undefined) {
    throw new Error("useSelectedAccount must be used within an AccountProvider");
  }
  return context;
}