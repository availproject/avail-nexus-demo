import { useEffect, useCallback, useState } from "react";
import { ProgressStep } from "avail-nexus-sdk";
import { useBridgeStore, bridgeSelectors } from "@/store/bridgeStore";
import { useNexus } from "@/provider/NexusProvider";

import { formatStepName } from "@/lib/bridge/formatters";
import { toast } from "sonner";
import { useAccount } from "wagmi";
import { StepCompletionEventData, TransactionType } from "@/types/transaction";
import { useSDKTransactionHistory } from "./useSDKTransactionHistory";

interface TransactionProgressOptions {
  transactionType?: TransactionType;
  formData?: {
    selectedToken?: string;
    amount?: string;
    selectedChain?: string;
    recipientAddress?: string;
  };
}

/**
 * Hook for managing transaction progress and SDK events
 */
export const useTransactionProgress = (
  options: TransactionProgressOptions = {}
) => {
  const { transactionType = "bridge", formData } = options;

  const { nexusSdk } = useNexus();
  const account = useAccount();
  const [explorerURL, setExplorerURL] = useState<string>("");

  // Store selectors
  const progressSteps = useBridgeStore(bridgeSelectors.progressSteps);
  const hasActiveSteps = useBridgeStore(bridgeSelectors.hasActiveSteps);
  const completedStepsCount = useBridgeStore(
    bridgeSelectors.completedStepsCount
  );
  const storeSelectedToken = useBridgeStore(bridgeSelectors.selectedToken);
  const storeBridgeAmount = useBridgeStore(bridgeSelectors.bridgeAmount);
  const storeSelectedChain = useBridgeStore(bridgeSelectors.selectedChain);

  // Get form data - use provided formData or fallback to bridge store
  const selectedToken = formData?.selectedToken ?? storeSelectedToken;
  const bridgeAmount = formData?.amount ?? storeBridgeAmount;
  const selectedChain = formData?.selectedChain ?? storeSelectedChain;
  const recipientAddress = formData?.recipientAddress;

  // Store actions
  const setProgressSteps = useBridgeStore((state) => state.setProgressSteps);
  const updateStepCompletion = useBridgeStore(
    (state) => state.updateStepCompletion
  );
  const resetProgress = useBridgeStore((state) => state.resetProgress);

  // SDK Transaction history hook
  const { fetchTransactions } = useSDKTransactionHistory();

  /**
   * Handle step completion from SDK
   */
  const handleStepComplete = useCallback(
    (completedStepData: StepCompletionEventData) => {
      const { typeID, data } = completedStepData;

      // Find and update the completed step
      const completedStep = progressSteps.find(
        (step) => step.typeID === typeID
      );
      if (!completedStep || completedStep.done) return;
      updateStepCompletion(typeID);
      // Handle different step types
      switch (typeID) {
        case "IF": // Intent Fulfilled
          fetchTransactions();

          toast.success(
            `${formatStepName(
              transactionType
            )} transaction completed successfully!`,
            {
              duration: 5000,
              action:
                explorerURL?.length > 0
                  ? {
                      label: "View in Explorer",
                      onClick: () => window.open(explorerURL, "_blank"),
                    }
                  : undefined,
            }
          );
          // Reset progress after a delay
          setTimeout(() => {
            resetProgress();
          }, 2000);
          break;

        case "IS": // Intent Submitted
          if (data) {
            fetchTransactions();
            setExplorerURL(completedStepData?.data?.explorerURL ?? "");
            toast.success(
              `${transactionType} transaction submitted successfully!`
            );
          }
          break;

        default: // Regular step completion
          toast.success(`${formatStepName(completedStep.type)} completed!`);
          break;
      }
    },
    [
      progressSteps,
      updateStepCompletion,
      fetchTransactions,
      resetProgress,
      transactionType,
      selectedToken,
      bridgeAmount,
      selectedChain,
      recipientAddress,
      account?.chain?.name,
      explorerURL,
    ]
  );

  /**
   * Handle transaction error
   */
  const handleTransactionError = useCallback(
    (error: unknown) => {
      console.error("Transaction error:", error);
      fetchTransactions();
      resetProgress();
      toast.error(
        error instanceof Error ? error.message : "Transaction failed"
      );
    },
    [fetchTransactions, resetProgress]
  );

  const getProgressPercentage = useCallback(() => {
    if (progressSteps.length === 0) return 0;
    return (completedStepsCount / progressSteps.length) * 100;
  }, [progressSteps.length, completedStepsCount]);

  /**
   * Subscribe to SDK events
   */
  useEffect(() => {
    if (!nexusSdk?.nexusAdapter?.caEvents) return;

    const { caEvents } = nexusSdk.nexusAdapter;

    // Add event listeners
    caEvents.on("expected_steps", (steps: ProgressStep[]) => {
      console.log("Expected steps received:", steps);
      setProgressSteps(steps.map((step) => ({ ...step, done: false })));
    });
    caEvents.on("step_complete", handleStepComplete);
    caEvents.on("error", handleTransactionError);

    return () => {
      caEvents.off("expected_steps", setProgressSteps);
      caEvents.off("step_complete", handleStepComplete);
      caEvents.off("error", handleTransactionError);
    };
  }, [
    setProgressSteps,
    handleStepComplete,
    handleTransactionError,
    nexusSdk?.nexusAdapter,
  ]);

  return {
    progressSteps,
    hasActiveSteps,
    completedStepsCount,
    resetProgress,
    getProgressPercentage,
  };
};
