import { TransactionData, TransactionHistoryItem } from "@/types/transaction";

const STORAGE_KEY = "bridgeTransactions";
const MAX_HISTORY_ITEMS = 100; // Prevent localStorage from growing too large

/**
 * Safely parse JSON from localStorage with error handling
 */
const safeParseJSON = <T>(value: string | null, fallback: T): T => {
  if (!value) return fallback;

  try {
    return JSON.parse(value);
  } catch (error) {
    console.error("Failed to parse JSON from localStorage:", error);
    return fallback;
  }
};

/**
 * Generate a unique ID for transaction history items
 */
const generateTransactionId = (transaction: TransactionData): string => {
  return `${transaction.intentHash}-${transaction.timestamp}`;
};

/**
 * Load transaction history from localStorage
 */
export const loadTransactionHistory = (): TransactionHistoryItem[] => {
  const stored = localStorage.getItem(STORAGE_KEY);
  const history = safeParseJSON(stored, [] as TransactionHistoryItem[]);

  // Ensure all items have IDs (for backward compatibility)
  return history.map((item) => ({
    ...item,
    id: item.id || generateTransactionId(item),
  }));
};

/**
 * Save transaction history to localStorage
 */
export const saveTransactionHistory = (
  history: TransactionHistoryItem[]
): void => {
  try {
    // Limit history size to prevent localStorage bloat
    const limitedHistory = history.slice(0, MAX_HISTORY_ITEMS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(limitedHistory));
  } catch (error) {
    console.error("Failed to save transaction history:", error);
  }
};

/**
 * Add a new transaction to history
 */
export const addTransactionToHistory = (
  transaction: TransactionData
): TransactionHistoryItem[] => {
  const currentHistory = loadTransactionHistory();
  const newTransaction: TransactionHistoryItem = {
    ...transaction,
    id: generateTransactionId(transaction),
  };

  const updatedHistory = [newTransaction, ...currentHistory];
  saveTransactionHistory(updatedHistory);

  return updatedHistory;
};

/**
 * Update an existing transaction in history
 */
export const updateTransactionInHistory = (
  intentHash: number,
  updates: Partial<TransactionData>
): TransactionHistoryItem[] => {
  const currentHistory = loadTransactionHistory();
  const updatedHistory = currentHistory.map((tx) =>
    tx.intentHash === intentHash ? { ...tx, ...updates } : tx
  );

  saveTransactionHistory(updatedHistory);
  return updatedHistory;
};

/**
 * Clear all transaction history
 */
export const clearTransactionHistory = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error("Failed to clear transaction history:", error);
  }
};

/**
 * Get transaction by intent hash
 */
export const getTransactionByIntentHash = (
  intentHash: number
): TransactionHistoryItem | null => {
  const history = loadTransactionHistory();
  return history.find((tx) => tx.intentHash === intentHash) || null;
};
