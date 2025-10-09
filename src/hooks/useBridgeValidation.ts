import { useMemo } from "react";
import { validateAmountInput } from "@/lib/bridge/formatters";
import { SUPPORTED_TOKENS, UserAsset } from "@avail-project/nexus-core";
import { BridgeValidationResult } from "@/types/bridge";

export const useBridgeValidation = (
  selectedToken: SUPPORTED_TOKENS | undefined,
  bridgeAmount: string,
  availableBalance: UserAsset[],
) => {
  const isValidAmountFormat = useMemo(() => {
    return validateAmountInput(bridgeAmount);
  }, [bridgeAmount]);

  const tokenBalance = useMemo(() => {
    if (!selectedToken) return null;
    return availableBalance.find((token) => token.symbol === selectedToken);
  }, [selectedToken, availableBalance]);

  const isWithinBalance = useMemo(() => {
    if (!bridgeAmount || !tokenBalance) return true;

    const amount = parseFloat(bridgeAmount);
    const balance = parseFloat(tokenBalance.balance);

    return amount <= balance;
  }, [bridgeAmount, tokenBalance]);

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
    const validateTokenSelection = (): string[] => {
      const hasUserInput = !!selectedToken || !!bridgeAmount;
      return !selectedToken && hasUserInput ? ["Please select a token"] : [];
    };

    const validateAmountPresence = (): string[] => {
      const hasUserInput = !!selectedToken || !!bridgeAmount;
      if (!bridgeAmount && hasUserInput && selectedToken) {
        return ["Please enter an amount"];
      }
      return [];
    };

    const validateAmountFormat = (): string[] => {
      return bridgeAmount && !isValidAmountFormat
        ? ["Invalid amount format"]
        : [];
    };

    const validateAmountValue = (): string[] => {
      if (!bridgeAmount || !isValidAmountFormat) return [];

      const errors: string[] = [];
      if (!isPositiveAmount) {
        errors.push("Amount must be greater than zero");
      }
      if (!isWithinBalance) {
        errors.push("Insufficient balance");
      }
      return errors;
    };

    const getAmountWarnings = (): string[] => {
      if (!bridgeAmount || !isValidAmountFormat) return [];

      const warnings: string[] = [];
      if (!isNotDustAmount) {
        warnings.push("Amount is very small and may not be economical");
      }

      if (tokenBalance && selectedToken === "ETH") {
        const amount = parseFloat(bridgeAmount);
        const balance = parseFloat(tokenBalance.balance);
        const remainingBalance = balance - amount;

        if (remainingBalance < 0.01) {
          warnings.push("Consider leaving some ETH for gas fees");
        }
      }
      return warnings;
    };

    const errors = [
      ...validateTokenSelection(),
      ...validateAmountPresence(),
      ...validateAmountFormat(),
      ...validateAmountValue(),
    ];

    const warnings = getAmountWarnings();

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
    isWithinBalance,
    isNotDustAmount,
    tokenBalance,
  ]);

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
    ],
  );

  const maxAmount = useMemo(() => {
    if (!tokenBalance) return "0";

    if (selectedToken === "ETH") {
      const balance = parseFloat(tokenBalance.balance);
      const reserveForGas = 0.01; // Reserve 0.01 ETH for gas
      const maxAvailable = Math.max(0, balance - reserveForGas);
      return maxAvailable.toString();
    }

    return tokenBalance.balance;
  }, [tokenBalance, selectedToken]);

  const getErrorMessage = () => {
    if (validationResult.errors.length === 0) return null;
    return validationResult.errors[0];
  };

  const getWarningMessage = () => {
    if (validationResult.warnings.length === 0) return null;
    return validationResult.warnings[0];
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
