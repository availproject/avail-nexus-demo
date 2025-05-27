import { useCallback, useMemo } from "react";
import { useBridgeStore, bridgeSelectors } from "@/store/bridgeStore";
import { TransactionData, TransactionHistoryItem } from "@/types/transaction";
import {
  clearTransactionHistory,
  getTransactionByIntentHash,
} from "@/lib/bridge/transactionStorage";

/**
 * Hook for managing transaction history
 */
export const useTransactionHistory = () => {
  // Store selectors
  const transactionHistory = useBridgeStore(bridgeSelectors.transactionHistory);
  const recentTransactions = useBridgeStore(bridgeSelectors.recentTransactions);
  const showHistory = useBridgeStore(bridgeSelectors.showHistory);

  // Store actions
  const loadHistory = useBridgeStore((state) => state.loadHistory);
  const addTransaction = useBridgeStore((state) => state.addTransaction);
  const updateTransaction = useBridgeStore((state) => state.updateTransaction);
  const toggleHistoryVisibility = useBridgeStore(
    (state) => state.toggleHistoryVisibility
  );
  const clearHistory = useBridgeStore((state) => state.clearHistory);

  const initializeHistory = useCallback(() => {
    loadHistory();
  }, [loadHistory]);

  const addNewTransaction = useCallback(
    (transaction: TransactionData) => {
      addTransaction(transaction);
    },
    [addTransaction]
  );

  const updateExistingTransaction = useCallback(
    (intentHash: number, updates: Partial<TransactionData>) => {
      updateTransaction(intentHash, updates);
    },
    [updateTransaction]
  );

  const markTransactionCompleted = useCallback(
    (intentHash: number) => {
      updateTransaction(intentHash, { status: "completed" });
    },
    [updateTransaction]
  );

  const markTransactionFailed = useCallback(
    (intentHash: number) => {
      updateTransaction(intentHash, { status: "failed" });
    },
    [updateTransaction]
  );

  const getTransaction = useCallback(
    (intentHash: number): TransactionHistoryItem | null => {
      return getTransactionByIntentHash(intentHash);
    },
    []
  );

  const getTransactionsByStatus = useCallback(
    (status: "pending" | "completed" | "failed") => {
      return transactionHistory.filter((tx) => tx.status === status);
    },
    [transactionHistory]
  );

  const computedValues = useMemo(() => {
    const pending = transactionHistory.filter((tx) => tx.status === "pending");
    const completed = transactionHistory.filter(
      (tx) => tx.status === "completed"
    );
    const failed = transactionHistory.filter((tx) => tx.status === "failed");

    return {
      pending,
      completed,
      failed,
      pendingCount: pending.length,
      completedCount: completed.length,
      failedCount: failed.length,
      totalCount: transactionHistory.length,
      hasPendingTransactions: pending.length > 0,
      statistics: {
        total: transactionHistory.length,
        pending: pending.length,
        completed: completed.length,
        failed: failed.length,
        successRate:
          transactionHistory.length > 0
            ? (completed.length / transactionHistory.length) * 100
            : 0,
      },
    };
  }, [transactionHistory]);

  const getPendingTransactions = useCallback(() => {
    return computedValues.pending;
  }, [computedValues.pending]);

  const getCompletedTransactions = useCallback(() => {
    return computedValues.completed;
  }, [computedValues.completed]);

  const getFailedTransactions = useCallback(() => {
    return computedValues.failed;
  }, [computedValues.failed]);

  const clearAllHistory = useCallback(() => {
    clearHistory();
    clearTransactionHistory();
  }, [clearHistory]);

  const toggleHistory = useCallback(() => {
    toggleHistoryVisibility();
  }, [toggleHistoryVisibility]);

  const getStatistics = useCallback(() => {
    return computedValues.statistics;
  }, [computedValues.statistics]);

  const hasPendingTransactions = useCallback(() => {
    return computedValues.hasPendingTransactions;
  }, [computedValues.hasPendingTransactions]);

  const getMostRecentTransaction =
    useCallback((): TransactionHistoryItem | null => {
      if (transactionHistory.length === 0) return null;
      return transactionHistory[0];
    }, [transactionHistory]);

  const searchTransactions = useCallback(
    (query: string) => {
      const lowerQuery = query.toLowerCase();
      return transactionHistory.filter(
        (tx) =>
          tx.token?.toLowerCase().includes(lowerQuery) ||
          tx.amount?.includes(query) ||
          tx.explorerURL.includes(query)
      );
    },
    [transactionHistory]
  );

  return {
    // State
    transactionHistory,
    recentTransactions,
    showHistory,

    // Actions
    initializeHistory,
    addNewTransaction,
    updateExistingTransaction,
    markTransactionCompleted,
    markTransactionFailed,
    clearAllHistory,
    toggleHistory,

    // Queries
    getTransaction,
    getTransactionsByStatus,
    getPendingTransactions,
    getCompletedTransactions,
    getFailedTransactions,
    getMostRecentTransaction,
    searchTransactions,

    // Computed values
    getStatistics,
    hasPendingTransactions,

    // Counts
    totalCount: computedValues.totalCount,
    pendingCount: computedValues.pendingCount,
    completedCount: computedValues.completedCount,
    failedCount: computedValues.failedCount,
  };
};
