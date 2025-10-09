import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import {
  SimulationResult,
  SUPPORTED_CHAINS,
  SUPPORTED_CHAINS_IDS,
  SUPPORTED_TOKENS,
  UserAsset,
} from "@avail-project/nexus-core";
import { BridgeFormData, ComponentStep } from "@/types/bridge";

/**
 * Bridge store state interface
 */
interface BridgeState {
  // Form state
  form: BridgeFormData;

  // Balance state
  availableBalance: UserAsset[];

  // Simulation state
  simulation: SimulationResult | null;
  isSimulating: boolean;
  simulationError: string | null;

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
  setAvailableBalance: (balance: UserAsset[]) => void;

  // Simulation actions
  setSimulation: (simulation: SimulationResult | null) => void;
  setSimulating: (simulating: boolean) => void;
  setSimulationError: (error: string | null) => void;
  clearSimulation: () => void;

  // Progress tracking actions
  setProgressSteps: (steps: ComponentStep[]) => void;
  updateStepCompletion: (typeID: string) => void;
  resetProgress: () => void;

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
    selectedChain: SUPPORTED_CHAINS.ETHEREUM,
    selectedToken: undefined,
    bridgeAmount: "",
  },
  availableBalance: [],
  simulation: null,
  isSimulating: false,
  simulationError: null,
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
      setAvailableBalance: (balance: UserAsset[]) =>
        set((state) => {
          state.availableBalance = balance;
        }),

      // Simulation actions
      setSimulation: (simulation) =>
        set((state) => {
          state.simulation = simulation;
        }),

      setSimulating: (simulating) =>
        set((state) => {
          state.isSimulating = simulating;
        }),

      setSimulationError: (error) =>
        set((state) => {
          state.simulationError = error;
        }),

      clearSimulation: () =>
        set((state) => {
          state.simulation = null;
        }),

      setProgressSteps: (steps) =>
        set((state) => {
          state.progressSteps = steps.map((step) => ({ ...step, done: false }));
        }),

      updateStepCompletion: (typeID) =>
        set((state) => {
          const stepIndex = state.progressSteps.findIndex(
            (step: ComponentStep) => step.typeID === typeID,
          );
          if (stepIndex !== -1 && !state.progressSteps[stepIndex].done) {
            state.progressSteps[stepIndex].done = true;
          }
        }),

      resetProgress: () =>
        set((state) => {
          state.progressSteps = [];
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
        form: {
          selectedChain: state.form.selectedChain,
        },
      }),
      merge: (
        persistedState: unknown,
        currentState: BridgeStore,
      ): BridgeStore => ({
        ...currentState,
        ...(persistedState as Partial<BridgeStore>),
        isLoading: false,
        isBridging: false,
        error: null,
        showAllowanceModal: false,
        progressSteps: [],
        availableBalance: [],
        simulation: null,
        isSimulating: false,
        simulationError: null,
      }),
    },
  ),
);

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
      (step) => step.done,
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

  // Simulation selectors
  simulation: (state: BridgeStore) => state.simulation,
  isSimulating: (state: BridgeStore) => state.isSimulating,
  simulationError: (state: BridgeStore) => state.simulationError,
  hasSimulation: (state: BridgeStore) => !!state.simulation,

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

  // Computed selectors
  isFormValid: (state: BridgeStore) =>
    !!state.form.selectedToken &&
    !!state.form.bridgeAmount &&
    parseFloat(state.form.bridgeAmount) > 0,

  canSubmit: (state: BridgeStore) =>
    bridgeSelectors.isFormValid(state) && !state.isBridging && !state.isLoading,
};
