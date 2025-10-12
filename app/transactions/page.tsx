"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { useUser } from "@/lib/user-context";
import { useEffect, useState } from "react";
import {
  getTransactionsByProfile,
  groupTransactionsByDate,
  formatTransactionAmount,
  type Transaction,
} from "@/lib/transactions";

export default function TransactionsPage() {
  const { profile } = useUser();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!profile?.id) return;

      try {
        setIsLoading(true);
        const data = await getTransactionsByProfile(profile.id);
        setTransactions(data);
      } catch (err) {
        console.error("Failed to fetch transactions:", err);
        setError("Failed to load transactions");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransactions();
  }, [profile?.id]);

  const pendingTransactions = transactions.filter(
    (tx) => tx.status === "pending" || tx.status === "sent"
  );
  const completedTransactions = transactions.filter(
    (tx) => tx.status === "success"
  );
  const groupedTransactions = groupTransactionsByDate(completedTransactions);

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <Link href="/home">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/10"
            >
              <ArrowLeft className="h-6 w-6" />
            </Button>
          </Link>
          <h1 className="text-xl font-semibold">Transactions</h1>
          <div className="w-10" />
        </div>

        {/* Content */}
        <div className="p-6">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-white/60" />
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-400">{error}</p>
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-white/60">No transactions yet</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Pending Transactions */}
              {pendingTransactions.length > 0 && (
                <div>
                  <h2 className="text-sm font-semibold text-white/60 mb-3 uppercase">
                    Pending
                  </h2>
                  <Card className="bg-white/5 border-white/10 p-4 space-y-4">
                    {pendingTransactions.map((tx) => (
                      <div
                        key={tx.id}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded-full bg-yellow-500/20 flex items-center justify-center">
                            <Loader2 className="h-5 w-5 text-yellow-400 animate-spin" />
                          </div>
                          <div>
                            <div className="font-medium">
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
                          <div className="font-medium text-yellow-400">
                            {formatTransactionAmount(tx.amount, tx.token)}
                          </div>
                          <div className="text-xs text-white/60 capitalize">
                            {tx.status}
                          </div>
                        </div>
                      </div>
                    ))}
                  </Card>
                </div>
              )}

              {/* Grouped Transactions by Date */}
              {Object.entries(groupedTransactions).map(([date, txs]) => (
                <div key={date}>
                  <h2 className="text-sm font-semibold text-white/60 mb-3">
                    {date}
                  </h2>
                  <Card className="bg-white/5 border-white/10 p-4 space-y-4">
                    {txs.map((tx) => (
                      <div
                        key={tx.id}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                            <span className="text-xl">
                              {tx.recipient_id?.charAt(0).toUpperCase() || "?"}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium">
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
                          <div className="font-medium text-green-400">
                            {formatTransactionAmount(tx.amount, tx.token)}
                          </div>
                          <div className="text-xs text-white/60 capitalize">
                            {tx.status}
                          </div>
                        </div>
                      </div>
                    ))}
                  </Card>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
