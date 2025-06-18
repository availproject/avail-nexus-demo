import { useCallback, useState, useEffect } from "react";
import { useNexus } from "@/provider/NexusProvider";
import { RequestForFunds } from "avail-nexus-sdk";

/**
 * Hook for managing transaction history using SDK's getMyIntents()
 * This replaces the local storage-based transaction history
 */
export const useSDKTransactionHistory = () => {
  const { nexusSdk } = useNexus();
  const [transactions, setTransactions] = useState<RequestForFunds[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch transactions from SDK
   */
  const fetchTransactions = useCallback(
    async (page = 1) => {
      if (!nexusSdk) {
        setError("SDK not initialized");
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const intents = await nexusSdk.getMyIntents(page);
        setTransactions(intents);
      } catch (err) {
        console.error("Failed to fetch transaction history:", err);
        setError(
          err instanceof Error ? err.message : "Failed to fetch transactions"
        );
      } finally {
        setLoading(false);
      }
    },
    [nexusSdk]
  );

  /**
   * Auto-fetch on SDK initialization
   */
  useEffect(() => {
    if (nexusSdk) {
      fetchTransactions();
    }
  }, [nexusSdk, fetchTransactions]);

  /**
   * Transform SDK transaction data for UI consumption
   */
  const getTransactionStatus = useCallback((transaction: RequestForFunds) => {
    if (transaction.fulfilled) return "completed";
    if (transaction.refunded) return "failed";
    if (transaction.deposited) return "pending";
    return "pending";
  }, []);

  /**
   * Get recent transactions (last 5)
   */
  const recentTransactions = transactions.slice(0, 5);

  /**
   * Get transactions by status
   */
  const getTransactionsByStatus = useCallback(
    (status: "pending" | "completed" | "failed") => {
      return transactions.filter((tx) => getTransactionStatus(tx) === status);
    },
    [transactions, getTransactionStatus]
  );

  /**
   * Computed statistics
   */
  const statistics = {
    total: transactions.length,
    pending: getTransactionsByStatus("pending").length,
    completed: getTransactionsByStatus("completed").length,
    failed: getTransactionsByStatus("failed").length,
    successRate:
      transactions.length > 0
        ? (getTransactionsByStatus("completed").length / transactions.length) *
          100
        : 0,
  };

  /**
   * Search transactions by intent ID or other criteria
   */
  const searchTransactions = useCallback(
    (query: string) => {
      return transactions.filter(
        (tx) =>
          tx.id.toString().includes(query) ||
          tx.destinationChainID.toString().includes(query)
      );
    },
    [transactions]
  );

  /**
   * Get most recent transaction
   */
  const getMostRecentTransaction = useCallback((): RequestForFunds | null => {
    return transactions.length > 0 ? transactions[0] : null;
  }, [transactions]);

  /**
   * Check if there are pending transactions
   */
  const hasPendingTransactions = useCallback(() => {
    return getTransactionsByStatus("pending").length > 0;
  }, [getTransactionsByStatus]);

  return {
    // State
    transactions,
    recentTransactions,
    loading,
    error,

    // Actions
    fetchTransactions,
    refetch: fetchTransactions,

    // Queries
    getTransactionsByStatus,
    searchTransactions,
    getMostRecentTransaction,
    getTransactionStatus,

    // Computed values
    statistics,
    hasPendingTransactions: hasPendingTransactions(),

    // Counts
    totalCount: transactions.length,
    pendingCount: statistics.pending,
    completedCount: statistics.completed,
    failedCount: statistics.failed,
  };
};
