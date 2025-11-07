import { useCallback } from "react";
import { useBridgeStore, bridgeSelectors } from "@/store/bridgeStore";

/**
 * Hook for managing transaction progress and SDK events
 */
export const useTransactionProgress = () => {
  // Store selectors
  const progressSteps = useBridgeStore(bridgeSelectors.progressSteps);
  const hasActiveSteps = useBridgeStore(bridgeSelectors.hasActiveSteps);
  const completedStepsCount = useBridgeStore(
    bridgeSelectors.completedStepsCount
  );

  // Store actions
  const resetProgress = useBridgeStore((state) => state.resetProgress);

  const getProgressPercentage = useCallback(() => {
    if (progressSteps.length === 0) return 0;
    return (completedStepsCount / progressSteps.length) * 100;
  }, [progressSteps.length, completedStepsCount]);

  return {
    progressSteps,
    hasActiveSteps,
    completedStepsCount,
    resetProgress,
    getProgressPercentage,
  };
};
