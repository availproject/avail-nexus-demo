import { useCallback } from "react";
import { useBridgeStore, bridgeSelectors } from "@/store/bridgeStore";
import {
  SUPPORTED_CHAINS_IDS,
  SUPPORTED_TOKENS,
  UserAsset,
} from "@avail-project/nexus-core";
import { validateAmountInput } from "@/lib/bridge/formatters";
import { useBridgeValidation } from "./useBridgeValidation";
import { toast } from "sonner";

/**
 * Orchestrator hook for bridge form management
 */
export const useBridgeForm = (availableBalance: UserAsset[]) => {
  // Store selectors
  const form = useBridgeStore(bridgeSelectors.form);
  const selectedChain = useBridgeStore(bridgeSelectors.selectedChain);
  const selectedToken = useBridgeStore(bridgeSelectors.selectedToken);
  const bridgeAmount = useBridgeStore(bridgeSelectors.bridgeAmount);
  const isFormValid = useBridgeStore(bridgeSelectors.isFormValid);
  const canSubmit = useBridgeStore(bridgeSelectors.canSubmit);
  const isBridging = useBridgeStore(bridgeSelectors.isBridging);
  const isLoading = useBridgeStore(bridgeSelectors.isLoading);
  const error = useBridgeStore(bridgeSelectors.error);

  // Store actions
  const setSelectedChain = useBridgeStore((state) => state.setSelectedChain);
  const setSelectedToken = useBridgeStore((state) => state.setSelectedToken);
  const setBridgeAmount = useBridgeStore((state) => state.setBridgeAmount);
  const resetForm = useBridgeStore((state) => state.resetForm);
  const setError = useBridgeStore((state) => state.setError);

  // Validation hook
  const validation = useBridgeValidation(
    selectedToken,
    bridgeAmount,
    availableBalance,
  );

  /**
   * Handle chain selection
   */
  const handleChainSelect = useCallback(
    (chainId: SUPPORTED_CHAINS_IDS) => {
      setSelectedChain(chainId);
      // Clear any existing errors when chain changes
      if (error) {
        setError(null);
      }
    },
    [setSelectedChain, error, setError],
  );

  /**
   * Handle token selection
   */
  const handleTokenSelect = useCallback(
    (token: SUPPORTED_TOKENS) => {
      setSelectedToken(token);
      // Clear any existing errors when token changes
      if (error) {
        setError(null);
      }
    },
    [setSelectedToken, error, setError],
  );

  /**
   * Handle amount input change with validation
   */
  const handleAmountChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;

      // Allow empty string (user clearing the input)
      if (value === "") {
        setBridgeAmount("");
        if (error) {
          setError(null);
        }
        return;
      }

      // Only allow valid number formats
      if (validateAmountInput(value)) {
        setBridgeAmount(value);
        // Clear any existing errors when amount changes
        if (error) {
          setError(null);
        }
      }
    },
    [setBridgeAmount, error, setError],
  );

  /**
   * Set amount to maximum available
   */
  const setMaxAmount = useCallback(() => {
    if (validation.maxAmount && validation.maxAmount !== "0") {
      setBridgeAmount(validation.maxAmount);
      if (error) {
        setError(null);
      }
    }
  }, [validation.maxAmount, setBridgeAmount, error, setError]);

  /**
   * Clear the form
   */
  const clearForm = useCallback(() => {
    // Only clear if user explicitly requests it or after successful transaction
    toast.info("Form cleared", {
      description: "All fields have been reset",
      duration: 2000,
    });
    resetForm();
  }, [resetForm]);

  /**
   * Reset only the amount field
   */
  const clearAmount = useCallback(() => {
    setBridgeAmount("");
    if (error) {
      setError(null);
    }
  }, [setBridgeAmount, error, setError]);

  /**
   * Get available tokens for the selected chain
   */
  const getAvailableTokens = useCallback(() => {
    return availableBalance
      .filter((token) => parseFloat(token.balance) > 0)
      .map((token) => token.symbol as SUPPORTED_TOKENS);
  }, [availableBalance]);

  /**
   * Check if a specific token is available
   */
  const isTokenAvailable = useCallback(
    (token: SUPPORTED_TOKENS) => {
      const tokenBalance = availableBalance.find((t) => t.symbol === token);
      return tokenBalance && parseFloat(tokenBalance.balance) > 0;
    },
    [availableBalance],
  );

  /**
   * Get token balance for display
   */
  const getTokenBalance = useCallback(
    (token: SUPPORTED_TOKENS) => {
      const tokenBalance = availableBalance.find((t) => t.symbol === token);
      return tokenBalance?.balance ?? "0";
    },
    [availableBalance],
  );

  /**
   * Validate form and return detailed result
   */
  const validateForm = useCallback(() => {
    return validation.validationResult;
  }, [validation.validationResult]);

  /**
   * Check if form can be submitted
   */
  const canSubmitForm = useCallback(() => {
    return canSubmit && validation.isValid && !isBridging && !isLoading;
  }, [canSubmit, validation.isValid, isBridging, isLoading]);

  /**
   * Get form submission readiness with improved error messaging
   */
  const getSubmissionState = useCallback(() => {
    if (isBridging) return { ready: false, reason: "Transaction in progress" };
    if (isLoading) return { ready: false, reason: "Loading..." };

    // Fallback checks for basic form completeness first
    if (!selectedToken)
      return { ready: false, reason: "Please select a token" };
    if (!bridgeAmount || bridgeAmount.trim() === "")
      return { ready: false, reason: "Please enter an amount" };

    // Use validation errors first as they are more specific and consider the actual amount
    if (!validation.isValid && validation.errorMessage) {
      return { ready: false, reason: validation.errorMessage };
    }

    // Only check token availability as a last resort if no amount is entered
    if (selectedToken && !bridgeAmount && !isTokenAvailable(selectedToken))
      return {
        ready: false,
        reason: "Insufficient balance for selected token",
      };

    return { ready: true, reason: null };
  }, [
    isBridging,
    isLoading,
    selectedToken,
    bridgeAmount,
    validation.isValid,
    validation.errorMessage,
    isTokenAvailable,
  ]);

  return {
    // Form state
    form,
    selectedChain,
    selectedToken,
    bridgeAmount,
    isFormValid,
    canSubmit: canSubmitForm(),

    // UI state
    isBridging,
    isLoading,
    error,

    // Validation
    validation,

    // Form actions
    handleChainSelect,
    handleTokenSelect,
    handleAmountChange,
    setMaxAmount,
    clearForm,
    clearAmount,

    // Utility functions
    getAvailableTokens,
    isTokenAvailable,
    getTokenBalance,
    validateForm,
    getSubmissionState,

    // Computed values
    availableTokens: getAvailableTokens(),
    submissionState: getSubmissionState(),
    hasAvailableBalance: availableBalance.length > 0,
    selectedTokenBalance: selectedToken ? getTokenBalance(selectedToken) : "0",
  };
};
