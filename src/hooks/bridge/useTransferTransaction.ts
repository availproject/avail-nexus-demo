import { useCallback, useState, useEffect, useRef } from "react";
import { useNexus } from "@/provider/NexusProvider";
import { useTransactionProgress } from "./useTransactionProgress";
import { toast } from "sonner";
import {
  SUPPORTED_CHAINS_IDS,
  SUPPORTED_TOKENS,
  SimulationResult,
} from "avail-nexus-sdk";

interface ErrorWithCode extends Error {
  code?: number;
}

interface TransferSimulation {
  estimatedGas: string;
  totalCost: string;
  estimatedTime: number;
}

interface TransferParams {
  token: SUPPORTED_TOKENS;
  amount: string;
  chainId: SUPPORTED_CHAINS_IDS;
  recipient: `0x${string}`;
}

const isAllowanceRejectionError = (error: unknown): boolean => {
  if (error instanceof Error) {
    return (
      error.message.includes("User rejection during setting allowance") ||
      error.message.includes("User rejected the request")
    );
  }

  const errorWithCode = error as ErrorWithCode;
  return errorWithCode?.code === 4001;
};

export const useTransferTransaction = () => {
  const { nexusSdk } = useNexus();
  const simulationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Simulation state
  const [simulation, setSimulation] = useState<TransferSimulation | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationError, setSimulationError] = useState<string | null>(null);

  // Hooks
  const { resetAllProgress } = useTransactionProgress({
    transactionType: "transfer",
  });

  /**
   * Execute transfer transaction with full flow
   */
  const executeTransfer = useCallback(
    async (transferParams: TransferParams) => {
      const { token, amount, chainId, recipient } = transferParams;

      if (!token || !amount || !chainId || !recipient || !nexusSdk) {
        const errorMsg = "Missing required parameters for transfer transaction";
        toast.error(errorMsg);
        resetAllProgress();
        return { success: false, error: errorMsg };
      }

      try {
        console.log("Starting transfer transaction:", {
          chainId,
          token,
          amount,
          recipient,
        });

        // Execute transfer transaction
        const transferTxn = await nexusSdk.transfer({
          token,
          amount,
          chainId,
          recipient,
        });

        console.log("transferTxn", transferTxn);

        return { success: true, data: transferTxn };
      } catch (error) {
        console.error("Transfer transaction failed:", error);

        // ALWAYS reset progress on any error
        resetAllProgress();

        // Handle specific error cases
        let errorMessage = "Transfer failed";

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
          } else {
            errorMessage = error.message.split(":")[0];
          }
        }

        // Special handling for allowance rejection errors
        if (isAllowanceRejectionError(error)) {
          console.log(
            "Allowance rejection detected in transfer transaction, resetting progress"
          );

          // Show specific toast for allowance rejection
          toast.error("Token approval was cancelled", {
            description: "Please approve the token allowance to continue",
            duration: 4000,
          });

          return { success: false, error: "Token approval was cancelled" };
        }

        // Show user-friendly error toast
        toast.error(errorMessage, {
          description: "Please try again",
          duration: 4000,
        });

        return { success: false, error: errorMessage };
      }
    },
    [nexusSdk, resetAllProgress]
  );

  /**
   * Run simulation for transfer parameters
   */
  const runTransferSimulation = useCallback(
    async (transferParams: TransferParams) => {
      const { token, amount, chainId, recipient } = transferParams;

      if (
        !token ||
        !amount ||
        !chainId ||
        !recipient ||
        !nexusSdk ||
        parseFloat(amount) <= 0
      ) {
        setSimulation(null);
        return;
      }

      try {
        setIsSimulating(true);
        setSimulationError(null);

        // Try to simulate transfer using SDK if available
        const result: SimulationResult | any =
          await nexusSdk.simulateTransfer?.({
            token,
            amount,
            chainId,
            recipient,
          });

        if (result?.intent) {
          // If we get the same structure as bridge simulation
          const { intent } = result;
          const { fees } = intent;

          const simulationData: TransferSimulation = {
            estimatedGas: fees.caGas || fees.total || "0.001",
            totalCost: fees.total || "0.001",
            estimatedTime: 60, // 1 minute default for transfers
          };

          setSimulation(simulationData);
        } else if (result) {
          // Handle other possible response structures
          const simulationData: TransferSimulation = {
            estimatedGas:
              (result as any).estimatedGas ??
              (result as any).gasCost ??
              "0.001",
            totalCost:
              (result as any).totalCost ??
              (result as any).estimatedGas ??
              "0.001",
            estimatedTime: (result as any).estimatedTime ?? 60, // 1 minute default for transfers
          };

          setSimulation(simulationData);
        } else {
          // Fallback simulation if SDK doesn't support transfer simulation
          const fallbackSimulation: TransferSimulation = {
            estimatedGas: "0.001", // Typical transfer gas cost
            totalCost: "0.001",
            estimatedTime: 60, // 1 minute
          };
          setSimulation(fallbackSimulation);
        }
      } catch (error) {
        console.error("Transfer simulation failed:", error);
        setSimulationError(
          error instanceof Error ? error.message : "Simulation failed"
        );

        // Provide fallback simulation even on error
        const fallbackSimulation: TransferSimulation = {
          estimatedGas: "0.001",
          totalCost: "0.001",
          estimatedTime: 60,
        };
        setSimulation(fallbackSimulation);
      } finally {
        setIsSimulating(false);
      }
    },
    [nexusSdk]
  );

  /**
   * Debounced simulation trigger
   */
  const triggerTransferSimulation = useCallback(
    (transferParams: TransferParams) => {
      // Clear existing timeout
      if (simulationTimeoutRef.current) {
        clearTimeout(simulationTimeoutRef.current);
      }

      // Set new timeout for debounced simulation
      simulationTimeoutRef.current = setTimeout(() => {
        runTransferSimulation(transferParams);
      }, 500); // 500ms debounce
    },
    [runTransferSimulation]
  );

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (simulationTimeoutRef.current) {
        clearTimeout(simulationTimeoutRef.current);
      }
    };
  }, []);

  return {
    executeTransfer,
    simulation,
    isSimulating,
    simulationError,
    triggerTransferSimulation,
  };
};
