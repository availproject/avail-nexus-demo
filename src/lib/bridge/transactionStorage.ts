import { TransactionData, TransactionHistoryItem } from "@/types/transaction";

const STORAGE_KEY = "bridgeTransactions";
const MAX_HISTORY_ITEMS = 100;

const safeParseJSON = <T>(value: string | null, fallback: T): T => {
  if (!value) return fallback;

  try {
    return JSON.parse(value);
  } catch (error) {
    console.error("Failed to parse JSON from localStorage:", error);
    return fallback;
  }
};

const generateTransactionId = (transaction: TransactionData): string => {
  return `${transaction.intentHash}-${transaction.timestamp}`;
};

export const loadTransactionHistory = (): TransactionHistoryItem[] => {
  const stored = localStorage.getItem(STORAGE_KEY);
  const history = safeParseJSON(stored, [] as TransactionHistoryItem[]);

  return history.map((item) => ({
    ...item,
    id: item.id || generateTransactionId(item),
    // Migrate old transactions to have a type field (default to "bridge")
    type: item.type || "bridge",
  }));
};

export const saveTransactionHistory = (
  history: TransactionHistoryItem[]
): void => {
  try {
    const limitedHistory = history.slice(0, MAX_HISTORY_ITEMS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(limitedHistory));
  } catch (error) {
    console.error("Failed to save transaction history:", error);
  }
};

export const addTransactionToHistory = (
  transaction: TransactionData
): TransactionHistoryItem[] => {
  const currentHistory = loadTransactionHistory();

  const existingTransaction = currentHistory.find(
    (tx) => tx.intentHash === transaction.intentHash
  );

  if (existingTransaction) {
    console.log(
      `Transaction with intentHash ${transaction.intentHash} already exists, skipping duplicate`
    );
    return currentHistory;
  }

  const newTransaction: TransactionHistoryItem = {
    ...transaction,
    id: generateTransactionId(transaction),
  };

  const updatedHistory = [newTransaction, ...currentHistory];
  saveTransactionHistory(updatedHistory);

  return updatedHistory;
};

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

export const clearTransactionHistory = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error("Failed to clear transaction history:", error);
  }
};

export const getTransactionByIntentHash = (
  intentHash: number
): TransactionHistoryItem | null => {
  const history = loadTransactionHistory();
  return history.find((tx) => tx.intentHash === intentHash) || null;
};
