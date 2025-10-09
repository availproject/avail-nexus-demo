import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import type { WritableDraft } from "immer";
import {
  SUPPORTED_CHAINS,
  SUPPORTED_CHAINS_IDS,
  SUPPORTED_TOKENS,
  UserAsset,
  SimulationResult,
} from "@avail-project/nexus-core";
import { BridgeExecuteState, ContractTemplate } from "@/types/bridge-execute";
import { ComponentStep } from "@/types/bridge";

/**
 * Bridge Execute store actions interface
 */
interface BridgeExecuteActions {
  // Form actions
  setSelectedChain: (chainId: SUPPORTED_CHAINS_IDS) => void;
  setSelectedToken: (token: SUPPORTED_TOKENS | undefined) => void;
  setBridgeAmount: (amount: string) => void;
  setSelectedTemplate: (template: ContractTemplate | null) => void;
  setTemplateParams: (params: Record<string, string>) => void;
  setTemplateParam: (key: string, value: string) => void;
  setShowAdvanced: (show: boolean) => void;
  resetForm: () => void;

  // Balance actions
  setAvailableBalance: (balance: UserAsset[]) => void;

  // Simulation actions
  setBridgeSimulation: (simulation: SimulationResult | null) => void;
  setExecuteSimulation: (simulation: SimulationResult | null) => void;
  setSimulating: (simulating: boolean) => void;
  setSimulationError: (error: string | null) => void;
  clearSimulations: () => void;

  // Progress tracking actions
  setProgressSteps: (steps: ComponentStep[]) => void;
  updateStepCompletion: (typeID: string) => void;
  resetProgress: () => void;

  // UI state actions
  setLoading: (loading: boolean) => void;
  setExecuting: (executing: boolean) => void;
  setError: (error: string | null) => void;

  // Utility actions
  reset: () => void;
}

type BridgeExecuteStore = BridgeExecuteState & BridgeExecuteActions;

/**
 * Initial state
 */
const initialState: BridgeExecuteState = {
  // Form state
  selectedChain: SUPPORTED_CHAINS.ETHEREUM,
  selectedToken: undefined,
  bridgeAmount: "",
  selectedTemplate: null,
  templateParams: {},
  showAdvanced: false,

  // Balance state
  availableBalance: [],

  // Simulation states
  bridgeSimulation: null,
  executeSimulation: null,
  isSimulating: false,
  simulationError: null,

  // UI states
  isLoading: false,
  isExecuting: false,
  error: null,

  // Progress tracking
  progressSteps: [],
};

/**
 * Create the bridge execute store with persistence and immer middleware
 */
export const useBridgeExecuteStore = create<BridgeExecuteStore>()(
  persist(
    immer((set) => ({
      ...initialState,

      // Form actions
      setSelectedChain: (chainId) =>
        set((state) => {
          state.selectedChain = chainId;
          state.selectedToken = undefined;
          state.selectedTemplate = null;
          state.templateParams = {};
          state.error = null;
        }),

      setSelectedToken: (token) =>
        set((state) => {
          state.selectedToken = token;
          state.error = null;
        }),

      setBridgeAmount: (amount) =>
        set((state) => {
          state.bridgeAmount = amount;
          state.error = null;
        }),

      setSelectedTemplate: (template) =>
        set((state) => {
          state.selectedTemplate = template as WritableDraft<ContractTemplate>;
          state.templateParams = {};
          state.error = null;
        }),

      setTemplateParams: (params) =>
        set((state) => {
          state.templateParams = params;
        }),

      setTemplateParam: (key, value) =>
        set((state) => {
          state.templateParams[key] = value;
        }),

      setShowAdvanced: (show) =>
        set((state) => {
          state.showAdvanced = show;
        }),

      resetForm: () =>
        set((state) => {
          Object.assign(state, {
            selectedToken: undefined,
            bridgeAmount: "",
            selectedTemplate: null,
            templateParams: {},
            showAdvanced: false,
            error: null,
          });
        }),

      // Balance actions
      setAvailableBalance: (balance: UserAsset[]) =>
        set((state) => {
          state.availableBalance = balance;
        }),

      // Simulation actions
      setBridgeSimulation: (simulation) =>
        set((state) => {
          state.bridgeSimulation = simulation;
        }),

      setExecuteSimulation: (simulation) =>
        set((state) => {
          state.executeSimulation = simulation;
        }),

      setSimulating: (simulating) =>
        set((state) => {
          state.isSimulating = simulating;
        }),

      setSimulationError: (error) =>
        set((state) => {
          state.simulationError = error;
        }),

      clearSimulations: () =>
        set((state) => {
          state.bridgeSimulation = null;
          state.executeSimulation = null;
          state.simulationError = null;
        }),

      // Progress tracking actions
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

      setExecuting: (executing) =>
        set((state) => {
          state.isExecuting = executing;
        }),

      setError: (error) =>
        set((state) => {
          state.error = error;
        }),

      reset: () =>
        set((state) => {
          Object.assign(state, initialState);
        }),
    })),
    {
      name: "bridge-execute-store",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        selectedChain: state.selectedChain,
        showAdvanced: state.showAdvanced,
      }),
      merge: (
        persistedState: unknown,
        currentState: BridgeExecuteStore,
      ): BridgeExecuteStore => ({
        ...currentState,
        ...(persistedState as Partial<BridgeExecuteStore>),
        // Reset transient state
        isLoading: false,
        isExecuting: false,
        error: null,
        progressSteps: [],
        availableBalance: [],
        bridgeSimulation: null,
        executeSimulation: null,
        isSimulating: false,
        simulationError: null,
        selectedToken: undefined,
        bridgeAmount: "",
        selectedTemplate: null,
        templateParams: {},
      }),
    },
  ),
);

// Helper function to count completed steps
const getCompletedStepsCount = (steps: ComponentStep[]): number => {
  return steps.filter((step) => step.done).length;
};

/**
 * Selectors for the bridge execute store
 */
export const bridgeExecuteSelectors = {
  // Form selectors
  selectedChain: (state: BridgeExecuteStore) => state.selectedChain,
  selectedToken: (state: BridgeExecuteStore) => state.selectedToken,
  bridgeAmount: (state: BridgeExecuteStore) => state.bridgeAmount,
  selectedTemplate: (state: BridgeExecuteStore) => state.selectedTemplate,
  templateParams: (state: BridgeExecuteStore) => state.templateParams,
  showAdvanced: (state: BridgeExecuteStore) => state.showAdvanced,

  // Balance selectors
  availableBalance: (state: BridgeExecuteStore) => state.availableBalance,

  // Simulation selectors
  bridgeSimulation: (state: BridgeExecuteStore) => state.bridgeSimulation,
  executeSimulation: (state: BridgeExecuteStore) => state.executeSimulation,
  isSimulating: (state: BridgeExecuteStore) => state.isSimulating,
  simulationError: (state: BridgeExecuteStore) => state.simulationError,
  hasSimulations: (state: BridgeExecuteStore) =>
    !!(state.bridgeSimulation || state.executeSimulation),

  // Progress selectors
  progressSteps: (state: BridgeExecuteStore) => state.progressSteps,
  hasActiveSteps: (state: BridgeExecuteStore) => state.progressSteps.length > 0,
  completedStepsCount: (state: BridgeExecuteStore) =>
    getCompletedStepsCount(state.progressSteps),

  // UI state selectors
  isLoading: (state: BridgeExecuteStore) => state.isLoading,
  isExecuting: (state: BridgeExecuteStore) => state.isExecuting,
  error: (state: BridgeExecuteStore) => state.error,

  // Computed selectors
  isFormValid: (state: BridgeExecuteStore) =>
    !!state.selectedToken &&
    !!state.bridgeAmount &&
    parseFloat(state.bridgeAmount) > 0 &&
    !!state.selectedTemplate,

  canSubmit: (state: BridgeExecuteStore) =>
    bridgeExecuteSelectors.isFormValid(state) &&
    !state.isExecuting &&
    !state.isLoading,
};
