import { useEffect, useCallback } from "react";
import { ProgressStep } from "@avail/nexus-sdk";
import { useBridgeStore, bridgeSelectors } from "@/store/bridgeStore";
import { useNexus } from "@/provider/NexusProvider";

import { useTransactionHistory } from "./useTransactionHistory";
import { formatStepName } from "@/lib/bridge/formatters";
import { toast } from "sonner";
import { useAccount } from "wagmi";
import {
  IntentSubmittedData,
  StepCompletionEventData,
  TransactionData,
} from "@/types/transaction";
import { ComponentStep } from "@/types/bridge";

/**
 * Hook for managing transaction progress and SDK events
 */
export const useTransactionProgress = () => {
  const { nexusSdk } = useNexus();
  const account = useAccount();
  // Store selectors
  const progressSteps = useBridgeStore(bridgeSelectors.progressSteps);
  const hasActiveSteps = useBridgeStore(bridgeSelectors.hasActiveSteps);
  const completedStepsCount = useBridgeStore(
    bridgeSelectors.completedStepsCount
  );
  const currentTransaction = useBridgeStore(bridgeSelectors.currentTransaction);

  // Store actions
  const setProgressSteps = useBridgeStore((state) => state.setProgressSteps);
  const updateStepCompletion = useBridgeStore(
    (state) => state.updateStepCompletion
  );
  const resetProgress = useBridgeStore((state) => state.resetProgress);
  const setCurrentTransaction = useBridgeStore(
    (state) => state.setCurrentTransaction
  );

  // Transaction history hook
  const { addNewTransaction, updateExistingTransaction } =
    useTransactionHistory();

  /**
   * Handle expected steps from SDK
   */
  const handleExpectedSteps = useCallback(
    (expectedStepsData: ProgressStep[]) => {
      console.log("Expected steps received:", expectedStepsData);

      const componentSteps: ComponentStep[] = expectedStepsData.map((step) => ({
        ...step,
        done: false,
      }));

      setProgressSteps(componentSteps);
    },
    [setProgressSteps]
  );

  /**
   * Handle step completion from SDK
   */
  const handleStepComplete = useCallback(
    (completedStepData: StepCompletionEventData) => {
      console.log("Step completed:", completedStepData);

      const { typeID } = completedStepData;

      // Find the completed step
      const completedStep = progressSteps.find(
        (step) => step.typeID === typeID
      );

      if (!completedStep || completedStep.done) {
        return;
      }

      updateStepCompletion(typeID);

      if (typeID === "IF") {
        handleTransactionCompleted();
      } else if (typeID === "IS" && "data" in completedStepData) {
        handleTransactionSubmitted(
          completedStepData.data as IntentSubmittedData
        );
      } else {
        handleRegularStepCompletion(completedStep);
      }
    },
    [progressSteps, updateStepCompletion]
  );

  /**
   * Handle transaction submission (Intent Submitted)
   */
  const handleTransactionSubmitted = useCallback(
    (intentData: IntentSubmittedData) => {
      const transactionData: TransactionData = {
        explorerURL: intentData.explorerURL,
        intentHash: intentData.intentHash,
        timestamp: Date.now(),
        status: "pending",
        token: undefined,
        amount: undefined,
        fromChain: account?.chain?.name,
        toChain: undefined,
      };

      // Add to transaction history
      addNewTransaction(transactionData);

      // Set as current transaction
      setCurrentTransaction(transactionData);

      updateExistingTransaction(transactionData.intentHash, transactionData);

      // Show success toast
      toast.success("Transaction submitted successfully!");
    },
    [
      addNewTransaction,
      setCurrentTransaction,
      updateExistingTransaction,
      account?.chain?.name,
    ]
  );

  /**
   * Handle transaction completion (Intent Fulfilled)
   */
  const handleTransactionCompleted = useCallback(() => {
    if (!currentTransaction) return;

    // Update transaction status
    updateExistingTransaction(currentTransaction.intentHash, {
      status: "completed",
    });

    // Show completion toast with explorer link
    toast.success("Bridge transaction completed successfully!", {
      duration: 5000,
      action: {
        label: "View in Explorer",
        onClick: () => window.open(currentTransaction.explorerURL, "_blank"),
      },
    });

    // Reset progress after a delay
    setTimeout(() => {
      resetProgress();
      setCurrentTransaction(null);
    }, 2000);
  }, [
    currentTransaction,
    updateExistingTransaction,
    resetProgress,
    setCurrentTransaction,
  ]);

  /**
   * Handle regular step completion
   */
  const handleRegularStepCompletion = useCallback((step: ComponentStep) => {
    const stepName = formatStepName(step.type);
    toast.success(`${stepName} completed!`);
  }, []);

  /**
   * Set up SDK event listeners
   */
  useEffect(() => {
    if (!nexusSdk?.nexusAdapter?.caEvents) return;

    const { caEvents } = nexusSdk.nexusAdapter;

    // Add event listeners
    caEvents.on("expected_steps", handleExpectedSteps);
    caEvents.on("step_complete", handleStepComplete);

    const handleTransactionError = (error: unknown) => {
      console.log("Transaction error detected:", error);

      // Check if this is an allowance rejection error
      const isAllowanceError =
        (error instanceof Error &&
          (error.message.includes("User rejection during setting allowance") ||
            error.message.includes("User rejected the request"))) ||
        (error as { code?: number })?.code === 4001;

      if (isAllowanceError) {
        console.log("Allowance rejection detected, resetting progress");

        // Reset progress to clear any incorrectly marked completed steps
        resetProgress();
        setCurrentTransaction(null);

        // Show appropriate error message
        toast.error("Token approval was cancelled", {
          description: "Please approve the token allowance to continue",
          duration: 4000,
        });
      }
    };

    // Listen for error events if available
    caEvents.on("error", handleTransactionError);
    caEvents.on("transaction_failed", handleTransactionError);

    // Cleanup on unmount
    return () => {
      caEvents.off("expected_steps", handleExpectedSteps);
      caEvents.off("step_complete", handleStepComplete);

      // Clean up error listeners
      caEvents.off("error", handleTransactionError);
      caEvents.off("transaction_failed", handleTransactionError);
    };
  }, [
    nexusSdk,
    handleExpectedSteps,
    handleStepComplete,
    resetProgress,
    setCurrentTransaction,
  ]);

  /**
   * Reset all progress state
   */
  const resetAllProgress = useCallback(() => {
    resetProgress();
    setCurrentTransaction(null);
  }, [resetProgress, setCurrentTransaction]);

  /**
   * Get progress percentage
   */
  const getProgressPercentage = useCallback(() => {
    if (progressSteps.length === 0) return 0;
    return (completedStepsCount / progressSteps.length) * 100;
  }, [progressSteps.length, completedStepsCount]);

  /**
   * Check if all steps are completed
   */
  const isAllStepsCompleted = useCallback(() => {
    return (
      progressSteps.length > 0 && completedStepsCount === progressSteps.length
    );
  }, [progressSteps.length, completedStepsCount]);

  /**
   * Get current step (first incomplete step)
   */
  const getCurrentStep = useCallback(() => {
    return progressSteps.find((step) => !step.done) || null;
  }, [progressSteps]);

  /**
   * Get completed steps
   */
  const getCompletedSteps = useCallback(() => {
    return progressSteps.filter((step) => step.done);
  }, [progressSteps]);

  /**
   * Get pending steps
   */
  const getPendingSteps = useCallback(() => {
    return progressSteps.filter((step) => !step.done);
  }, [progressSteps]);

  return {
    // State
    progressSteps,
    hasActiveSteps,
    completedStepsCount,
    currentTransaction,

    // Actions
    resetAllProgress,

    // Computed values
    progressPercentage: getProgressPercentage(),
    isAllStepsCompleted: isAllStepsCompleted(),
    currentStep: getCurrentStep(),
    completedSteps: getCompletedSteps(),
    pendingSteps: getPendingSteps(),

    // Counts
    totalSteps: progressSteps.length,
    pendingStepsCount: getPendingSteps().length,
  };
};
