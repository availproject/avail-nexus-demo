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

/**
 * Main orchestrator hook for bridge transactions
 */
export const useBridgeTransaction = () => {
  const { nexusSdk } = useNexus();

  // Store selectors
  const selectedChain = useBridgeStore(bridgeSelectors.selectedChain);
  const selectedToken = useBridgeStore(bridgeSelectors.selectedToken);
  const bridgeAmount = useBridgeStore(bridgeSelectors.bridgeAmount);
  const isBridging = useBridgeStore(bridgeSelectors.isBridging);
  const error = useBridgeStore(bridgeSelectors.error);
  const showAllowanceModal = useBridgeStore(bridgeSelectors.showAllowanceModal);

  // Store actions
  const setBridging = useBridgeStore((state) => state.setBridging);
  const setError = useBridgeStore((state) => state.setError);
  const setShowAllowanceModal = useBridgeStore(
    (state) => state.setShowAllowanceModal
  );
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

      const result = await nexusSdk.bridge(bridgeParams);

      console.log("Bridge transaction result:", result);

      // Step 3: Reset form on success
      resetForm();

      toast.success("Bridge transaction initiated successfully!");

      return { success: true, result };
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

  /**
   * Handle allowance modal completion
   */
  const handleAllowanceReady = useCallback(
    async (hasAllowance: boolean) => {
      if (!hasAllowance) {
        setShowAllowanceModal(false);
        // Reset progress when allowance is denied
        resetAllProgress();
        return;
      }

      // Close the allowance modal
      setShowAllowanceModal(false);

      // Proceed with bridge transaction
      if (selectedToken && bridgeAmount && nexusSdk) {
        try {
          setBridging(true);

          const bridgeParams: BridgeTransactionParams = {
            chainId: selectedChain,
            token: selectedToken,
            amount: bridgeAmount,
          };

          const result = await nexusSdk.bridge(bridgeParams);

          console.log("Bridge transaction result after allowance:", result);

          // Reset form on success
          resetForm();

          toast.success("Bridge transaction completed successfully!");
        } catch (error) {
          console.error("Bridge transaction failed after allowance:", error);

          // ALWAYS reset progress on any error
          resetAllProgress();

          // Special handling for allowance rejection errors
          if (isAllowanceRejectionError(error)) {
            console.log(
              "Allowance rejection detected after allowance modal, resetting progress"
            );

            // Set specific error message for allowance rejection
            setError("Token approval was cancelled");

            // Show specific toast for allowance rejection
            toast.error("Token approval was cancelled", {
              description:
                "Please approve the token allowance to continue with the bridge transaction",
              duration: 4000,
            });

            return;
          }

          const userFriendlyMessage = formatErrorForUser(error);
          logBridgeError(error, "Bridge transaction after allowance");

          setError(userFriendlyMessage);
          toast.error(userFriendlyMessage, {
            description: "Please try again",
            duration: 4000,
          });
        } finally {
          setBridging(false);
        }
      }
    },
    [
      selectedToken,
      bridgeAmount,
      nexusSdk,
      selectedChain,
      setShowAllowanceModal,
      setBridging,
      setError,
      resetForm,
      resetAllProgress,
    ]
  );

  /**
   * Cancel current transaction
   */
  const cancelTransaction = useCallback(() => {
    setBridging(false);
    setError(null);
    setShowAllowanceModal(false);
    resetAllProgress();

    toast.info("Transaction cancelled");
  }, [setBridging, setError, setShowAllowanceModal, resetAllProgress]);

  /**
   * Retry failed transaction
   */
  const retryTransaction = useCallback(async () => {
    if (error) {
      setError(null);
      return await executeBridge();
    }
  }, [error, setError, executeBridge]);

  /**
   * Check if transaction can be executed
   */
  const canExecute = useCallback(() => {
    return (
      !!selectedToken &&
      !!bridgeAmount &&
      !!nexusSdk &&
      !isBridging &&
      parseFloat(bridgeAmount) > 0
    );
  }, [selectedToken, bridgeAmount, nexusSdk, isBridging]);

  /**
   * Get transaction status
   */
  const getTransactionStatus = useCallback(() => {
    if (isBridging) return "executing";
    if (showAllowanceModal) return "awaiting_allowance";
    if (error) return "error";
    return "ready";
  }, [isBridging, showAllowanceModal, error]);

  /**
   * Reset all transaction state
   */
  const resetTransaction = useCallback(() => {
    setBridging(false);
    setError(null);
    setShowAllowanceModal(false);
    resetAllProgress();
  }, [setBridging, setError, setShowAllowanceModal, resetAllProgress]);

  return {
    // State
    isBridging,
    error,
    showAllowanceModal,

    // Actions
    executeBridge,
    handleAllowanceReady,
    cancelTransaction,
    retryTransaction,
    resetTransaction,

    // Computed values
    canExecute: canExecute(),
    transactionStatus: getTransactionStatus(),

    // Transaction parameters
    transactionParams:
      selectedToken && bridgeAmount
        ? {
            chainId: selectedChain,
            token: selectedToken,
            amount: bridgeAmount,
          }
        : null,
  };
};
