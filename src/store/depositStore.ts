import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { INITIAL_CHAIN } from "@/lib/constants";
import { SUPPORTED_CHAINS_IDS, SUPPORTED_TOKENS } from "avail-nexus-sdk";
import { ComponentStep } from "@/types/bridge";
import { TransactionData, TransactionHistoryItem } from "@/types/transaction";

/**
 * Deposit simulation result interface
 */
export interface DepositSimulation {
  estimatedGas: string;
  totalCost: string;
  estimatedTime: number; // estimated completion time in seconds
  estimatedCostEth?: string;
  gasLimit?: string;
}

/**
 * Deposit form data interface
 */
export interface DepositFormData {
  toChainId: SUPPORTED_CHAINS_IDS;
  contractAddress: string;
  functionName: string;
  functionParams: any[];
  contractAbi: any[];
  value?: string;
  gasLimit?: string;
}

/**
 * Deposit store state interface
 */
interface DepositState {
  // Form data
  toChainId: SUPPORTED_CHAINS_IDS;
  contractAddress: string;
  functionName: string;
  functionParams: any[];
  contractAbi: any[];
  value: string;
  gasLimit: string;

  // UI state
  isDepositing: boolean;
  error: string | null;

  // Simulation state
  simulation: DepositSimulation | null;
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
  setFunctionParams: (params: any[]) => void;
  setContractAbi: (abi: any[]) => void;
  setValue: (value: string) => void;
  setGasLimit: (gasLimit: string) => void;

  setDepositing: (isDepositing: boolean) => void;
  setError: (error: string | null) => void;

  setSimulation: (simulation: DepositSimulation | null) => void;
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
export const useDepositStore = create<DepositState>()(
  persist(
    immer((set, get) => ({
      // Initial form state
      toChainId: INITIAL_CHAIN,
      contractAddress: "",
      functionName: "",
      functionParams: [],
      contractAbi: [],
      value: "",
      gasLimit: "",

      // Initial UI state
      isDepositing: false,
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
      setDepositing: (isDepositing) =>
        set((state) => {
          state.isDepositing = isDepositing;
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
      name: "deposit-store",
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
export const depositSelectors = {
  // Form selectors
  toChainId: (state: DepositState) => state.toChainId,
  contractAddress: (state: DepositState) => state.contractAddress,
  functionName: (state: DepositState) => state.functionName,
  functionParams: (state: DepositState) => state.functionParams,
  contractAbi: (state: DepositState) => state.contractAbi,
  value: (state: DepositState) => state.value,
  gasLimit: (state: DepositState) => state.gasLimit,

  // UI selectors
  isDepositing: (state: DepositState) => state.isDepositing,
  error: (state: DepositState) => state.error,

  // Simulation selectors
  simulation: (state: DepositState) => state.simulation,
  isSimulating: (state: DepositState) => state.isSimulating,
  simulationError: (state: DepositState) => state.simulationError,

  // Progress selectors
  progressSteps: (state: DepositState) => state.progressSteps,
  hasActiveSteps: (state: DepositState) => state.progressSteps.length > 0,
  completedStepsCount: (state: DepositState) =>
    state.progressSteps.filter((step) => step.done).length,
  currentTransaction: (state: DepositState) => state.currentTransaction,

  // Validation selectors
  isFormValid: (state: DepositState) =>
    state.contractAddress.trim() !== "" &&
    state.functionName.trim() !== "" &&
    state.contractAbi.length > 0,
};
