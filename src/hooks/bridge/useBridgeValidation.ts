import { useMemo } from "react";
import { validateAmountInput } from "@/lib/bridge/formatters";
import { SUPPORTED_TOKENS, UnifiedBalanceResponse } from "@avail/nexus-sdk";
import { BridgeValidationResult } from "@/types/bridge";

/**
 * Hook for bridge form validation
 */
export const useBridgeValidation = (
  selectedToken: SUPPORTED_TOKENS | undefined,
  bridgeAmount: string,
  availableBalance: UnifiedBalanceResponse[]
) => {
  /**
   * Validate the bridge amount input
   */
  const isValidAmountFormat = useMemo(() => {
    return validateAmountInput(bridgeAmount);
  }, [bridgeAmount]);

  /**
   * Get the token balance for the selected token
   */
  const tokenBalance = useMemo(() => {
    if (!selectedToken) return null;
    return availableBalance.find((token) => token.symbol === selectedToken);
  }, [selectedToken, availableBalance]);

  /**
   * Check if the amount is within available balance
   */
  const isWithinBalance = useMemo(() => {
    if (!bridgeAmount || !tokenBalance) return true;

    const amount = parseFloat(bridgeAmount);
    const balance = parseFloat(tokenBalance.balance);

    return amount <= balance;
  }, [bridgeAmount, tokenBalance]);

  /**
   * Check if the amount is greater than zero
   */
  const isPositiveAmount = useMemo(() => {
    if (!bridgeAmount || bridgeAmount.trim() === "") return false;
    const amount = parseFloat(bridgeAmount);
    return amount > 0;
  }, [bridgeAmount]);

  /**
   * Check if the amount is not too small (dust amount)
   */
  const isNotDustAmount = useMemo(() => {
    if (!bridgeAmount || bridgeAmount.trim() === "") return true;
    const amount = parseFloat(bridgeAmount);
    // Consider amounts less than 0.000001 as dust
    return amount >= 0.000001;
  }, [bridgeAmount]);

  /**
   * Comprehensive validation result
   */
  const validationResult = useMemo((): BridgeValidationResult => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Only show validation errors if user has started interacting with the form
    const hasUserInput = !!selectedToken || !!bridgeAmount;

    // Check if token is selected - only show error if user has started input
    if (!selectedToken && hasUserInput) {
      errors.push("Please select a token");
    }

    // Check if amount is provided - only show error if user has started input
    if (!bridgeAmount && hasUserInput && selectedToken) {
      errors.push("Please enter an amount");
    } else if (bridgeAmount) {
      // Only validate amount format and constraints if amount is provided
      // Check amount format
      if (!isValidAmountFormat) {
        errors.push("Invalid amount format");
      } else {
        // Check if amount is positive
        if (!isPositiveAmount) {
          errors.push("Amount must be greater than zero");
        }

        // Check if amount is not dust
        if (!isNotDustAmount) {
          warnings.push("Amount is very small and may not be economical");
        }

        // Check if amount is within balance
        if (!isWithinBalance) {
          errors.push("Insufficient balance");
        }

        // Check if amount leaves some balance for gas (warning)
        if (tokenBalance && selectedToken === "ETH") {
          const amount = parseFloat(bridgeAmount);
          const balance = parseFloat(tokenBalance.balance);
          const remainingBalance = balance - amount;

          if (remainingBalance < 0.01) {
            warnings.push("Consider leaving some ETH for gas fees");
          }
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }, [
    selectedToken,
    bridgeAmount,
    isValidAmountFormat,
    isPositiveAmount,
    isNotDustAmount,
    isWithinBalance,
    tokenBalance,
  ]);

  /**
   * Quick validation checks for UI states
   */
  const quickChecks = useMemo(
    () => ({
      hasToken: !!selectedToken,
      hasAmount: !!bridgeAmount,
      isValidFormat: isValidAmountFormat,
      isPositive: isPositiveAmount,
      hasBalance: isWithinBalance,
      isNotDust: isNotDustAmount,
    }),
    [
      selectedToken,
      bridgeAmount,
      isValidAmountFormat,
      isPositiveAmount,
      isWithinBalance,
      isNotDustAmount,
    ]
  );

  /**
   * Get maximum available amount for the selected token
   */
  const maxAmount = useMemo(() => {
    if (!tokenBalance) return "0";

    // For ETH, reserve some for gas fees
    if (selectedToken === "ETH") {
      const balance = parseFloat(tokenBalance.balance);
      const reserveForGas = 0.01; // Reserve 0.01 ETH for gas
      const maxAvailable = Math.max(0, balance - reserveForGas);
      return maxAvailable.toString();
    }

    return tokenBalance.balance;
  }, [tokenBalance, selectedToken]);

  /**
   * Format validation errors for display
   */
  const getErrorMessage = () => {
    if (validationResult.errors.length === 0) return null;
    return validationResult.errors[0]; // Return first error
  };

  /**
   * Format validation warnings for display
   */
  const getWarningMessage = () => {
    if (validationResult.warnings.length === 0) return null;
    return validationResult.warnings[0]; // Return first warning
  };

  return {
    // Validation results
    validationResult,
    isValid: validationResult.isValid,

    // Quick checks
    ...quickChecks,

    // Helper values
    tokenBalance,
    maxAmount,

    // Formatted messages
    errorMessage: getErrorMessage(),
    warningMessage: getWarningMessage(),

    // Utility functions
    canSubmit:
      validationResult.isValid &&
      !!selectedToken &&
      !!bridgeAmount &&
      bridgeAmount.trim() !== "",
  };
};
