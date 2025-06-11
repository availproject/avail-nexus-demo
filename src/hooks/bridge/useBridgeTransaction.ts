import { useCallback } from "react";
import { useBridgeStore, bridgeSelectors } from "@/store/bridgeStore";
import { useNexus } from "@/provider/NexusProvider";
import { useTransactionProgress } from "./useTransactionProgress";
import {
  parseBridgeError,
  formatErrorForUser,
  logBridgeError,
} from "@/lib/bridge/errorHandling";
import { toast } from "sonner";
import { BridgeTransactionParams } from "@/types/bridge";

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

  // Store selectors
  const selectedChain = useBridgeStore(bridgeSelectors.selectedChain);
  const selectedToken = useBridgeStore(bridgeSelectors.selectedToken);
  const bridgeAmount = useBridgeStore(bridgeSelectors.bridgeAmount);
  const isBridging = useBridgeStore(bridgeSelectors.isBridging);

  // Store actions
  const setBridging = useBridgeStore((state) => state.setBridging);
  const setError = useBridgeStore((state) => state.setError);
  const resetForm = useBridgeStore((state) => state.resetForm);

  // Hooks
  const { resetAllProgress } = useTransactionProgress();

  /**
   * Execute bridge transaction with full flow
   */
  const executeBridge = useCallback(async () => {
    if (!selectedToken || !bridgeAmount || !nexusSdk) {
      const errorMsg = "Missing required parameters for bridge transaction";
      setError(errorMsg);
      toast.error(errorMsg);
      // Reset progress on parameter validation error
      resetAllProgress();
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

      // Step 2: Execute bridge transaction
      const bridgeParams: BridgeTransactionParams = {
        chainId: selectedChain,
        token: selectedToken,
        amount: bridgeAmount,
      };

      await nexusSdk.bridge(bridgeParams);

      resetForm();

      return { success: true };
    } catch (error) {
      console.error("Bridge transaction failed:", error);

      // ALWAYS reset progress on any error
      resetAllProgress();

      // Parse and handle the error
      const bridgeError = parseBridgeError(error);
      const userFriendlyMessage = formatErrorForUser(error);

      // Log structured error information
      logBridgeError(error, "Bridge transaction execution");

      // Special handling for allowance rejection errors
      if (isAllowanceRejectionError(error)) {
        console.log(
          "Allowance rejection detected in bridge transaction, resetting progress"
        );

        // Set specific error message for allowance rejection
        setError("Token approval was cancelled");

        // Show specific toast for allowance rejection
        toast.error("Token approval was cancelled", {
          description:
            "Please approve the token allowance to continue with the bridge transaction",
          duration: 4000,
        });

        return { success: false, error: "Token approval was cancelled" };
      }

      // Set error state
      setError(userFriendlyMessage);

      // Show user-friendly error toast
      toast.error(userFriendlyMessage, {
        description: bridgeError.isRetryable ? "Please try again" : undefined,
        duration: 4000,
      });

      return { success: false, error: userFriendlyMessage };
    } finally {
      setBridging(false);
    }
  }, [
    selectedToken,
    bridgeAmount,
    nexusSdk,
    selectedChain,
    setBridging,
    setError,
    resetForm,
    resetAllProgress,
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
  }, [selectedToken, bridgeAmount, nexusSdk]);

  return {
    isBridging,
    executeBridge,
    simulateBridge,
  };
};
