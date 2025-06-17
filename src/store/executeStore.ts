import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { INITIAL_CHAIN } from "@/lib/constants";
import { ExecuteSimulation, SUPPORTED_CHAINS_IDS } from "avail-nexus-sdk";
import { ComponentStep } from "@/types/bridge";
import { TransactionData, TransactionHistoryItem } from "@/types/transaction";
import { Abi } from "viem";

/**
 * Deposit form data interface
 */
export interface ExecuteFormData {
  toChainId: SUPPORTED_CHAINS_IDS;
  contractAddress: string;
  functionName: string;
  functionParams: string[];
  contractAbi: unknown;
  value?: string;
  gasLimit?: string;
}

/**
 * Deposit store state interface
 */
interface ExecuteState {
  // Form data
  toChainId: SUPPORTED_CHAINS_IDS;
  contractAddress: string;
  functionName: string;
  functionParams: string[];
  contractAbi: unknown;
  value: string;
  gasLimit: string;

  // UI state
  isExecuting: boolean;
  error: string | null;

  // Simulation state
  simulation: ExecuteSimulation | null;
  isSimulating: boolean;
  simulationError: string | null;

  // Progress state
  progressSteps: ComponentStep[];
  currentTransaction: TransactionData | null;
  transactionHistory: TransactionHistoryItem[];

  // Actions
  setToChainId: (chainId: SUPPORTED_CHAINS_IDS) => void;
  setContractAddress: (address: string) => void;
  setFunctionName: (name: string) => void;
  setFunctionParams: (params: string[]) => void;
  setContractAbi: (abi: unknown) => void;
  setValue: (value: string) => void;
  setGasLimit: (gasLimit: string) => void;

  setExecuting: (isExecuting: boolean) => void;
  setError: (error: string | null) => void;

  setSimulation: (simulation: ExecuteSimulation | null) => void;
  setSimulating: (isSimulating: boolean) => void;
  setSimulationError: (error: string | null) => void;
  clearSimulation: () => void;

  setProgressSteps: (steps: ComponentStep[]) => void;
  updateStepCompletion: (typeID: string) => void;
  resetProgress: () => void;
  setCurrentTransaction: (transaction: TransactionData | null) => void;

  resetForm: () => void;
}

/**
 * Deposit store
 */
export const useExecuteStore = create<ExecuteState>()(
  persist(
    immer((set) => ({
      // Initial form state
      toChainId: INITIAL_CHAIN,
      contractAddress: "",
      functionName: "",
      functionParams: [],
      contractAbi: [],
      value: "",
      gasLimit: "",

      // Initial UI state
      isExecuting: false,
      error: null,

      // Initial simulation state
      simulation: null,
      isSimulating: false,
      simulationError: null,

      // Initial progress state
      progressSteps: [],
      currentTransaction: null,
      transactionHistory: [],

      // Form actions
      setToChainId: (chainId) =>
        set((state) => {
          state.toChainId = chainId;
        }),

      setContractAddress: (address) =>
        set((state) => {
          state.contractAddress = address;
        }),

      setFunctionName: (name) =>
        set((state) => {
          state.functionName = name;
        }),

      setFunctionParams: (params) =>
        set((state) => {
          state.functionParams = params;
        }),

      setContractAbi: (abi) =>
        set((state) => {
          state.contractAbi = abi;
        }),

      setValue: (value) =>
        set((state) => {
          state.value = value;
        }),

      setGasLimit: (gasLimit) =>
        set((state) => {
          state.gasLimit = gasLimit;
        }),

      // UI actions
      setExecuting: (isExecuting) =>
        set((state) => {
          state.isExecuting = isExecuting;
        }),

      setError: (error) =>
        set((state) => {
          state.error = error;
        }),

      // Simulation actions
      setSimulation: (simulation) =>
        set((state) => {
          state.simulation = simulation;
        }),

      setSimulating: (isSimulating) =>
        set((state) => {
          state.isSimulating = isSimulating;
        }),

      setSimulationError: (error) =>
        set((state) => {
          state.simulationError = error;
        }),

      clearSimulation: () =>
        set((state) => {
          state.simulation = null;
          state.simulationError = null;
        }),

      // Progress actions
      setProgressSteps: (steps) =>
        set((state) => {
          state.progressSteps = steps;
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
          state.currentTransaction = null;
        }),

      setCurrentTransaction: (transaction) =>
        set((state) => {
          state.currentTransaction = transaction;
        }),

      // Reset form
      resetForm: () =>
        set((state) => {
          state.contractAddress = "";
          state.functionName = "";
          state.functionParams = [];
          state.contractAbi = [];
          state.value = "";
          state.gasLimit = "";
          state.error = null;
          state.simulation = null;
          state.simulationError = null;
        }),
    })),
    {
      name: "execute-store",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        toChainId: state.toChainId,
        transactionHistory: state.transactionHistory,
      }),
    }
  )
);

/**
 * Deposit store selectors
 */
export const executeSelectors = {
  // Form selectors
  toChainId: (state: ExecuteState) => state.toChainId,
  contractAddress: (state: ExecuteState) => state.contractAddress,
  functionName: (state: ExecuteState) => state.functionName,
  functionParams: (state: ExecuteState) => state.functionParams,
  contractAbi: (state: ExecuteState) => state.contractAbi,
  value: (state: ExecuteState) => state.value,
  gasLimit: (state: ExecuteState) => state.gasLimit,

  // UI selectors
  isExecuting: (state: ExecuteState) => state.isExecuting,
  error: (state: ExecuteState) => state.error,

  // Simulation selectors
  simulation: (state: ExecuteState) => state.simulation,
  isSimulating: (state: ExecuteState) => state.isSimulating,
  simulationError: (state: ExecuteState) => state.simulationError,

  // Progress selectors
  progressSteps: (state: ExecuteState) => state.progressSteps,
  hasActiveSteps: (state: ExecuteState) => state.progressSteps.length > 0,
  completedStepsCount: (state: ExecuteState) =>
    state.progressSteps.filter((step) => step.done).length,
  currentTransaction: (state: ExecuteState) => state.currentTransaction,

  // Validation selectors
  isFormValid: (state: ExecuteState) =>
    state.contractAddress.trim() !== "" &&
    state.functionName.trim() !== "" &&
    (state.contractAbi as Abi).length > 0,
};
