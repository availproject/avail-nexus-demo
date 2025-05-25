import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { INITIAL_CHAIN } from "@/lib/constants";
import {
  loadTransactionHistory,
  addTransactionToHistory,
  updateTransactionInHistory,
} from "@/lib/bridge/transactionStorage";
import {
  SUPPORTED_CHAINS_IDS,
  SUPPORTED_TOKENS,
  UnifiedBalanceResponse,
} from "@avail/nexus-sdk";
import { BridgeFormData, ComponentStep } from "@/types/bridge";
import { TransactionData, TransactionHistoryItem } from "@/types/transaction";

/**
 * Bridge store state interface
 */
interface BridgeState {
  // Form state
  form: BridgeFormData;

  // Balance state
  availableBalance: UnifiedBalanceResponse[];

  // Transaction history
  transactionHistory: TransactionHistoryItem[];
  showHistory: boolean;

  // Current transaction
  currentTransaction: TransactionData | null;
  progressSteps: ComponentStep[];

  // UI state
  isLoading: boolean;
  isBridging: boolean;
  error: string | null;
  showAllowanceModal: boolean;
}

/**
 * Bridge store actions interface
 */
interface BridgeActions {
  // Form actions
  setSelectedChain: (chainId: SUPPORTED_CHAINS_IDS) => void;
  setSelectedToken: (token: SUPPORTED_TOKENS | undefined) => void;
  setBridgeAmount: (amount: string) => void;
  resetForm: () => void;

  // Balance actions
  setAvailableBalance: (balance: UnifiedBalanceResponse[]) => void;

  // Transaction history actions
  loadHistory: () => void;
  addTransaction: (transaction: TransactionData) => void;
  updateTransaction: (
    intentHash: number,
    updates: Partial<TransactionData>
  ) => void;
  toggleHistoryVisibility: () => void;
  clearHistory: () => void;

  // Progress tracking actions
  setProgressSteps: (steps: ComponentStep[]) => void;
  updateStepCompletion: (typeID: string) => void;
  resetProgress: () => void;

  // Current transaction actions
  setCurrentTransaction: (transaction: TransactionData | null) => void;

  // UI state actions
  setLoading: (loading: boolean) => void;
  setBridging: (bridging: boolean) => void;
  setError: (error: string | null) => void;
  setShowAllowanceModal: (show: boolean) => void;

  // Utility actions
  reset: () => void;
}

/**
 * Combined store type
 */
type BridgeStore = BridgeState & BridgeActions;

/**
 * Initial state
 */
const initialState: BridgeState = {
  form: {
    selectedChain: INITIAL_CHAIN,
    selectedToken: undefined,
    bridgeAmount: "",
  },
  availableBalance: [],
  transactionHistory: [],
  showHistory: false,
  currentTransaction: null,
  progressSteps: [],
  isLoading: false,
  isBridging: false,
  error: null,
  showAllowanceModal: false,
};

/**
 * Create the bridge store with persistence and immer middleware
 */
export const useBridgeStore = create<BridgeStore>()(
  persist(
    immer((set) => ({
      ...initialState,

      // Form actions
      setSelectedChain: (chainId) =>
        set((state) => {
          state.form.selectedChain = chainId;
          state.form.selectedToken = undefined;
          state.error = null;
        }),

      setSelectedToken: (token) =>
        set((state) => {
          state.form.selectedToken = token;
          state.error = null;
        }),

      setBridgeAmount: (amount) =>
        set((state) => {
          state.form.bridgeAmount = amount;
          state.error = null;
        }),

      resetForm: () =>
        set((state) => {
          state.form = { ...initialState.form };
          state.error = null;
        }),

      // Balance actions
      setAvailableBalance: (balance: UnifiedBalanceResponse[]) =>
        set((state) => {
          state.availableBalance = balance;
        }),

      // Transaction history actions
      loadHistory: () =>
        set((state) => {
          state.transactionHistory = loadTransactionHistory();
        }),

      addTransaction: (transaction) =>
        set((state) => {
          const updatedHistory = addTransactionToHistory(transaction);
          state.transactionHistory = updatedHistory;
        }),

      updateTransaction: (intentHash, updates) =>
        set((state) => {
          const updatedHistory = updateTransactionInHistory(
            intentHash,
            updates
          );
          state.transactionHistory = updatedHistory;

          if (state.currentTransaction?.intentHash === intentHash) {
            state.currentTransaction = {
              ...state.currentTransaction,
              ...updates,
            };
          }
        }),

      toggleHistoryVisibility: () =>
        set((state) => {
          state.showHistory = !state.showHistory;
        }),

      clearHistory: () =>
        set((state) => {
          state.transactionHistory = [];
          localStorage.removeItem("bridgeTransactions");
        }),

      setProgressSteps: (steps) =>
        set((state) => {
          state.progressSteps = steps.map((step) => ({ ...step, done: false }));
        }),

      updateStepCompletion: (typeID) =>
        set((state) => {
          const stepIndex = state.progressSteps.findIndex(
            (step: ComponentStep) => step.typeID === typeID
          );
          if (stepIndex !== -1 && !state.progressSteps[stepIndex].done) {
            state.progressSteps[stepIndex].done = true;
          }
        }),

      resetProgress: () =>
        set((state) => {
          state.progressSteps = [];
        }),

      setCurrentTransaction: (transaction) =>
        set((state) => {
          state.currentTransaction = transaction;
        }),

      // UI state actions
      setLoading: (loading) =>
        set((state) => {
          state.isLoading = loading;
        }),

      setBridging: (bridging) =>
        set((state) => {
          state.isBridging = bridging;
        }),

      setError: (error) =>
        set((state) => {
          state.error = error;
        }),

      setShowAllowanceModal: (show) =>
        set((state) => {
          state.showAllowanceModal = show;
        }),

      reset: () =>
        set((state) => {
          Object.assign(state, initialState);
        }),
    })),
    {
      name: "bridge-store",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        transactionHistory: state.transactionHistory,
        showHistory: state.showHistory,
        form: {
          selectedChain: state.form.selectedChain,
        },
      }),
      merge: (
        persistedState: unknown,
        currentState: BridgeStore
      ): BridgeStore => ({
        ...currentState,
        ...(persistedState as Partial<BridgeStore>),
        isLoading: false,
        isBridging: false,
        error: null,
        showAllowanceModal: false,
        currentTransaction: null,
        progressSteps: [],
        availableBalance: [],
      }),
    }
  )
);

let cachedRecentTransactions: TransactionHistoryItem[] = [];
let lastTransactionHistoryLength = 0;
let lastTransactionHistoryHash = "";

const getRecentTransactions = (
  transactionHistory: TransactionHistoryItem[]
): TransactionHistoryItem[] => {
  // Create a simple hash of the transaction history to detect changes
  const currentHash = transactionHistory
    .map((tx) => `${tx.id}-${tx.status}`)
    .join("|");

  if (
    transactionHistory.length !== lastTransactionHistoryLength ||
    currentHash !== lastTransactionHistoryHash
  ) {
    cachedRecentTransactions = transactionHistory.slice(0, 5);
    lastTransactionHistoryLength = transactionHistory.length;
    lastTransactionHistoryHash = currentHash;
  }

  return cachedRecentTransactions;
};

// Memoized selector for completed steps count to prevent infinite loops
let cachedCompletedStepsCount = 0;
let lastProgressStepsLength = 0;
let lastProgressStepsHash = "";

const getCompletedStepsCount = (progressSteps: ComponentStep[]): number => {
  // Create a simple hash of the progress steps to detect changes
  const currentHash = progressSteps
    .map((step) => `${step.typeID}-${step.done}`)
    .join("|");

  // Only recalculate if the steps have actually changed
  if (
    progressSteps.length !== lastProgressStepsLength ||
    currentHash !== lastProgressStepsHash
  ) {
    cachedCompletedStepsCount = progressSteps.filter(
      (step) => step.done
    ).length;
    lastProgressStepsLength = progressSteps.length;
    lastProgressStepsHash = currentHash;
  }

  return cachedCompletedStepsCount;
};

export const bridgeSelectors = {
  // Form selectors
  form: (state: BridgeStore) => state.form,
  selectedChain: (state: BridgeStore) => state.form.selectedChain,
  selectedToken: (state: BridgeStore) => state.form.selectedToken,
  bridgeAmount: (state: BridgeStore) => state.form.bridgeAmount,

  // Balance selectors
  availableBalance: (state: BridgeStore) => state.availableBalance,

  // Transaction history selectors
  transactionHistory: (state: BridgeStore) => state.transactionHistory,
  recentTransactions: (state: BridgeStore) =>
    getRecentTransactions(state.transactionHistory),
  showHistory: (state: BridgeStore) => state.showHistory,

  // Progress selectors
  progressSteps: (state: BridgeStore) => state.progressSteps,
  hasActiveSteps: (state: BridgeStore) => state.progressSteps.length > 0,
  completedStepsCount: (state: BridgeStore) =>
    getCompletedStepsCount(state.progressSteps),

  // UI state selectors
  isLoading: (state: BridgeStore) => state.isLoading,
  isBridging: (state: BridgeStore) => state.isBridging,
  error: (state: BridgeStore) => state.error,
  showAllowanceModal: (state: BridgeStore) => state.showAllowanceModal,

  // Current transaction selectors
  currentTransaction: (state: BridgeStore) => state.currentTransaction,
  hasCurrentTransaction: (state: BridgeStore) => !!state.currentTransaction,

  // Computed selectors
  isFormValid: (state: BridgeStore) =>
    !!state.form.selectedToken &&
    !!state.form.bridgeAmount &&
    parseFloat(state.form.bridgeAmount) > 0,

  canSubmit: (state: BridgeStore) =>
    bridgeSelectors.isFormValid(state) && !state.isBridging && !state.isLoading,
};
