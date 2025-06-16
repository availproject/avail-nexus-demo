import { useCallback, useRef } from "react";
import {
  useDepositStore,
  depositSelectors,
  DepositSimulation,
} from "@/store/depositStore";
import { useNexus } from "@/provider/NexusProvider";
import { useTransactionProgress } from "./useTransactionProgress";
import { toast } from "sonner";

interface ErrorWithCode extends Error {
  code?: number;
}

/**
 * Deposit parameters interface
 */
export interface DepositParams {
  toChainId: number;
  contractAddress: string;
  contractAbi: any[];
  functionName: string;
  functionParams: any[];
  value?: string;
  gasLimit?: string;
  waitForReceipt?: boolean;
  requiredConfirmations?: number;
  receiptTimeout?: number;
}

/**
 * Check if error is due to allowance rejection
 */
const isAllowanceRejectionError = (error: unknown): boolean => {
  if (error instanceof Error) {
    return (
      error.message.includes("User rejection during setting allowance") ||
      error.message.includes("allowance") ||
      (error as ErrorWithCode).code === 4001
    );
  }
  return false;
};

export const useDepositTransaction = () => {
  const { nexusSdk } = useNexus();
  const simulationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Store selectors
  const toChainId = useDepositStore(depositSelectors.toChainId);
  const contractAddress = useDepositStore(depositSelectors.contractAddress);
  const functionName = useDepositStore(depositSelectors.functionName);
  const functionParams = useDepositStore(depositSelectors.functionParams);
  const contractAbi = useDepositStore(depositSelectors.contractAbi);
  const value = useDepositStore(depositSelectors.value);
  const gasLimit = useDepositStore(depositSelectors.gasLimit);
  const isDepositing = useDepositStore(depositSelectors.isDepositing);
  const simulation = useDepositStore(depositSelectors.simulation);
  const isSimulating = useDepositStore(depositSelectors.isSimulating);

  // Store actions
  const setDepositing = useDepositStore((state) => state.setDepositing);
  const setError = useDepositStore((state) => state.setError);
  const resetForm = useDepositStore((state) => state.resetForm);
  const setSimulation = useDepositStore((state) => state.setSimulation);
  const setSimulating = useDepositStore((state) => state.setSimulating);
  const setSimulationError = useDepositStore(
    (state) => state.setSimulationError
  );
  const clearSimulation = useDepositStore((state) => state.clearSimulation);

  // Hooks
  const { resetAllProgress } = useTransactionProgress({
    transactionType: "deposit",
  });

  /**
   * Execute deposit transaction
   */
  const executeDeposit = useCallback(
    async (depositParams?: Partial<DepositParams>) => {
      const params = {
        toChainId,
        contractAddress,
        contractAbi,
        functionName,
        functionParams,
        value,
        gasLimit,
        waitForReceipt: true,
        requiredConfirmations: 2,
        ...depositParams,
      };

      if (
        !params.contractAddress ||
        !params.functionName ||
        !params.contractAbi.length ||
        !nexusSdk
      ) {
        const errorMsg = "Missing required parameters for deposit transaction";
        setError(errorMsg);
        toast.error(errorMsg);
        resetAllProgress();
        return { success: false, error: errorMsg };
      }

      try {
        setDepositing(true);
        setError(null);

        console.log("Starting deposit transaction:", params);

        // Execute deposit transaction
        const depositResult = await nexusSdk.deposit(params);

        console.log("Deposit result:", depositResult);

        // Reset form on successful deposit
        resetForm();

        toast.success("Deposit completed successfully!");

        return {
          success: true,
          data: depositResult,
          transactionHash: depositResult.transactionHash,
          explorerUrl: depositResult.explorerUrl,
        };
      } catch (error) {
        console.error("Deposit transaction failed:", error);

        // ALWAYS reset progress on any error
        resetAllProgress();

        // Handle specific error cases
        let errorMessage = "Deposit failed";

        if (error instanceof Error) {
          if (error.message.includes("User rejected")) {
            errorMessage = "Transaction was rejected by user";
          } else if (
            error.message.includes("User rejection during setting allowance")
          ) {
            errorMessage = "Token approval was rejected";
          } else if (error.message.includes("insufficient funds")) {
            errorMessage = "Insufficient funds for transaction";
          } else if (error.message.includes("gas")) {
            errorMessage = "Insufficient funds for gas fees";
          } else if (error.message.includes("contract")) {
            errorMessage = "Smart contract interaction failed";
          } else {
            errorMessage = error.message.split(":")[0];
          }
        }

        // Special handling for allowance rejection errors
        if (isAllowanceRejectionError(error)) {
          console.log(
            "Allowance rejection detected in deposit transaction, resetting progress"
          );

          // Show specific toast for allowance rejection
          toast.error("Token approval was cancelled", {
            description: "Please approve the token allowance to continue",
            duration: 4000,
          });

          return { success: false, error: "Token approval was cancelled" };
        }

        // Set error state
        setError(errorMessage);

        // Show user-friendly error toast
        toast.error(errorMessage, {
          description: "Please try again",
          duration: 4000,
        });

        return { success: false, error: errorMessage };
      } finally {
        setDepositing(false);
      }
    },
    [
      toChainId,
      contractAddress,
      contractAbi,
      functionName,
      functionParams,
      value,
      gasLimit,
      nexusSdk,
      setDepositing,
      setError,
      resetForm,
      resetAllProgress,
    ]
  );

  /**
   * Simulate deposit transaction
   */
  const simulateDeposit = useCallback(
    async (depositParams?: Partial<DepositParams>) => {
      const params = {
        toChainId,
        contractAddress,
        contractAbi,
        functionName,
        functionParams,
        value,
        gasLimit,
        ...depositParams,
      };

      if (
        !params.contractAddress ||
        !params.functionName ||
        !params.contractAbi.length ||
        !nexusSdk
      ) {
        return null;
      }

      try {
        const simulation = await nexusSdk.simulateDeposit(params);
        console.log("Deposit simulation result:", simulation);
        return simulation;
      } catch (error) {
        console.error("Deposit simulation failed:", error);
        return null;
      }
    },
    [
      toChainId,
      contractAddress,
      contractAbi,
      functionName,
      functionParams,
      value,
      gasLimit,
      nexusSdk,
    ]
  );

  /**
   * Run simulation for current deposit parameters
   */
  const runDepositSimulation = useCallback(async () => {
    if (!contractAddress || !functionName || !contractAbi.length || !nexusSdk) {
      clearSimulation();
      return;
    }

    try {
      setSimulating(true);
      setSimulationError(null);

      const result = await nexusSdk.simulateDeposit({
        toChainId,
        contractAddress,
        contractAbi,
        functionName,
        functionParams,
        value,
        gasLimit,
      });

      console.log("Deposit simulation result:", result);

      if (result) {
        const simulationData: DepositSimulation = {
          estimatedGas: result.estimatedCostEth || "0.001",
          totalCost: result.estimatedCostEth || "0.001",
          estimatedTime: 60, // 1 minute default for deposits
          estimatedCostEth: result.estimatedCostEth,
          gasLimit: result.gasLimit,
        };

        setSimulation(simulationData);
      } else {
        // Fallback simulation if SDK doesn't provide detailed response
        const fallbackSimulation: DepositSimulation = {
          estimatedGas: "0.001",
          totalCost: "0.001",
          estimatedTime: 60,
        };
        setSimulation(fallbackSimulation);
      }
    } catch (error) {
      console.error("Deposit simulation failed:", error);
      setSimulationError(
        error instanceof Error ? error.message : "Simulation failed"
      );

      // Provide fallback simulation even on error
      const fallbackSimulation: DepositSimulation = {
        estimatedGas: "0.001",
        totalCost: "0.001",
        estimatedTime: 60,
      };
      setSimulation(fallbackSimulation);
    } finally {
      setSimulating(false);
    }
  }, [
    contractAddress,
    functionName,
    contractAbi,
    functionParams,
    value,
    gasLimit,
    toChainId,
    nexusSdk,
    setSimulating,
    setSimulationError,
    setSimulation,
    clearSimulation,
  ]);

  /**
   * Trigger simulation with debounce
   */
  const triggerDepositSimulation = useCallback(
    (params?: Partial<DepositParams>) => {
      // Clear existing timeout
      if (simulationTimeoutRef.current) {
        clearTimeout(simulationTimeoutRef.current);
      }

      // Set new timeout for debounced simulation
      simulationTimeoutRef.current = setTimeout(() => {
        runDepositSimulation();
      }, 500); // 500ms delay
    },
    [runDepositSimulation]
  );

  return {
    executeDeposit,
    simulateDeposit,
    runDepositSimulation,
    triggerDepositSimulation,
    simulation,
    isSimulating,
    isDepositing,
  };
};
