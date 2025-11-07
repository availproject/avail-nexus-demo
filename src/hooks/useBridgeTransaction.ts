import { useCallback, useEffect, useRef } from "react";
import { useBridgeStore, bridgeSelectors } from "@/store/bridgeStore";
import { useNexus } from "@/provider/NexusProvider";
import {
  parseBridgeError,
  formatErrorForUser,
  logBridgeError,
} from "@/lib/bridge/errorHandling";
import { toast } from "sonner";
import { SimulationResult } from "@avail-project/nexus-core";
import { useTransactionProgress } from "./useTransactionProgress";
import { createOnEvent } from "@/hooks/useNexusProgressEvents";
import { useSDKTransactionHistory } from "./useSDKTransactionHistory";
import { useNexusErrorHandler } from "@/hooks/useNexusErrorHandler";

interface ErrorWithCode extends Error {
  code?: number;
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

export const useBridgeTransaction = () => {
  const { nexusSdk } = useNexus();
  const simulationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Store selectors
  const selectedChain = useBridgeStore(bridgeSelectors.selectedChain);
  const selectedToken = useBridgeStore(bridgeSelectors.selectedToken);
  const bridgeAmount = useBridgeStore(bridgeSelectors.bridgeAmount);
  const isBridging = useBridgeStore(bridgeSelectors.isBridging);
  const simulation = useBridgeStore(bridgeSelectors.simulation);
  const isSimulating = useBridgeStore(bridgeSelectors.isSimulating);

  // Store actions
  const setBridging = useBridgeStore((state) => state.setBridging);
  const setError = useBridgeStore((state) => state.setError);
  const setSimulation = useBridgeStore((state) => state.setSimulation);
  const setSimulating = useBridgeStore((state) => state.setSimulating);
  const setSimulationError = useBridgeStore(
    (state) => state.setSimulationError
  );
  const clearSimulation = useBridgeStore((state) => state.clearSimulation);

  // Hooks
  const { resetProgress } = useTransactionProgress();
  const { refetch } = useSDKTransactionHistory();
  const { handleError } = useNexusErrorHandler();

  /**
   * Execute bridge transaction with full flow
   */
  const executeBridge = useCallback(async () => {
    if (!selectedToken || !bridgeAmount || !nexusSdk) {
      const errorMsg = "Missing required parameters for bridge transaction";
      setError(errorMsg);
      toast.error(errorMsg);
      // Reset progress on parameter validation error
      resetProgress();
      return { success: false, error: errorMsg };
    }

    try {
      setBridging(true);
      setError(null);

      console.log("Starting bridge transaction:", {
        chainId: selectedChain,
        token: selectedToken,
        amount: bridgeAmount,
      });

      const result = await nexusSdk.bridge(
        {
          chainId: selectedChain,
          token: selectedToken,
          amount: bridgeAmount,
        },
        { onEvent: createOnEvent("bridge") }
      );

      if (!result) {
        setError("Unknown error");
      }

      if (result) {
        toast.success("Bridge transaction completed successfully!", {
          description: `${bridgeAmount} ${selectedToken} bridged successfully`,
          duration: 5000,
        });
      }

      console.log("Bridge transaction result:", result);

      // Show success feedback before resetting form

      return result;
    } catch (error: unknown) {
      console.error("Bridge transaction failed:", error);

      // Parse and handle the error
      const bridgeError = parseBridgeError(error);
      const userFriendlyMessage = formatErrorForUser(error);

      // Log structured error information
      logBridgeError(error, "Bridge transaction execution");

      // Special handling for allowance rejection errors
      if (isAllowanceRejectionError(error)) {
        console.log("Allowance rejection detected in bridge transaction");

        // Set specific error message for allowance rejection
        setError("Token approval was cancelled");

        // Show specific toast for allowance rejection - don't reset progress immediately
        toast.error("Token approval was cancelled", {
          description:
            "Please approve the token allowance to continue with the bridge transaction",
          duration: 6000,
        });

        // Only reset progress after a delay to allow user to read the message
        setTimeout(() => {
          resetProgress();
        }, 3000);

        return { success: false, error: "Token approval was cancelled" };
      }

      // For other errors, only reset progress if it's a non-retryable error
      if (!bridgeError.isRetryable) {
        setTimeout(() => {
          resetProgress();
        }, 2000);
      }

      // Set error state
      setError(userFriendlyMessage);

      // Show user-friendly error toast with longer duration for complex errors
      toast.error(userFriendlyMessage, {
        description: bridgeError.isRetryable
          ? "You can try again, or check your wallet and network connection"
          : "Please check your transaction parameters and try again",
        duration: 6000,
      });

      handleError(error, "Bridge transaction execution");

      return { success: false, error: userFriendlyMessage };
    } finally {
      setBridging(false);
      refetch();
    }
  }, [
    selectedToken,
    bridgeAmount,
    nexusSdk,
    selectedChain,
    setBridging,
    setError,
    resetProgress,
    refetch,
  ]);

  const simulateBridge = useCallback(async () => {
    if (!selectedToken || !bridgeAmount || !nexusSdk) {
      return null;
    }

    try {
      const simulation = await nexusSdk.simulateBridge({
        chainId: selectedChain,
        token: selectedToken,
        amount: bridgeAmount,
      });
      console.log("Simulation result:", simulation);
      return simulation;
    } catch (error) {
      console.error("Simulation failed:", error);
      return null;
    }
  }, [selectedToken, bridgeAmount, nexusSdk, selectedChain]);

  /**
   * Run simulation for current bridge parameters
   */
  const runSimulation = useCallback(async () => {
    if (
      !selectedToken ||
      !bridgeAmount ||
      !nexusSdk ||
      Number.parseFloat(bridgeAmount) <= 0
    ) {
      clearSimulation();
      return;
    }

    try {
      setSimulating(true);
      setSimulationError(null);

      const result: SimulationResult = await nexusSdk.simulateBridge({
        chainId: selectedChain,
        token: selectedToken,
        amount: bridgeAmount,
      });

      console.log("Simulation result:", result);

      if (result?.intent) {
        const { intent } = result;

        const simulationData: SimulationResult = {
          intent,
          token: result.token,
        };

        setSimulation(simulationData);
      } else {
        clearSimulation();
      }
    } catch (error) {
      console.error(error);
      setSimulationError(
        error instanceof Error ? error.message : "Simulation failed"
      );
      clearSimulation();
    } finally {
      setSimulating(false);
    }
  }, [
    selectedToken,
    bridgeAmount,
    selectedChain,
    nexusSdk,
    setSimulating,
    setSimulationError,
    setSimulation,
    clearSimulation,
  ]);

  /**
   * Auto-run simulation when form inputs change (with debouncing)
   */
  useEffect(() => {
    // Clear existing timeout
    if (simulationTimeoutRef.current) {
      clearTimeout(simulationTimeoutRef.current);
    }

    // Set new timeout for debounced simulation
    simulationTimeoutRef.current = setTimeout(() => {
      runSimulation();
    }, 500); // 500ms debounce

    // Cleanup on unmount
    return () => {
      if (simulationTimeoutRef.current) {
        clearTimeout(simulationTimeoutRef.current);
      }
    };
  }, [selectedToken, bridgeAmount, selectedChain, runSimulation]);

  /**
   * Manual simulation trigger
   */
  const triggerSimulation = useCallback(() => {
    if (simulationTimeoutRef.current) {
      clearTimeout(simulationTimeoutRef.current);
    }
    runSimulation();
  }, [runSimulation]);

  return {
    isBridging,
    executeBridge,
    simulateBridge,
    simulation,
    isSimulating,
    runSimulation,
    triggerSimulation,
  };
};
