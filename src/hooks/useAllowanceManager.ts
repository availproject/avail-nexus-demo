import { useState, useCallback } from "react";
import { useNexus } from "@/provider/NexusProvider";
import {
  AllowanceParams,
  AllowanceResponse,
  SUPPORTED_CHAINS_IDS,
  SUPPORTED_TOKENS,
} from "@avail/nexus-sdk";
import { toast } from "sonner";

interface AllowanceManagerState {
  isCheckingAllowance: boolean;
  isSettingAllowance: boolean;
  allowanceError: string | null;
}

interface AllowanceCheckResult {
  hasEnoughAllowance: boolean;
  currentAllowance: string;
  requiredAllowance: string;
  needsApproval: boolean;
}

interface SetAllowanceParams {
  tokens: SUPPORTED_TOKENS[];
  amount: number | string; // Allow both number and "max" string
  chainId: SUPPORTED_CHAINS_IDS;
}

const useAllowanceManager = () => {
  const { nexusSdk } = useNexus();
  const [state, setState] = useState<AllowanceManagerState>({
    isCheckingAllowance: false,
    isSettingAllowance: false,
    allowanceError: null,
  });

  /**
   * Check if the current allowance is sufficient for the transaction
   */
  const checkAllowance = useCallback(
    async (params: AllowanceParams): Promise<AllowanceCheckResult | null> => {
      if (!nexusSdk) {
        console.error("NexusSDK not initialized");
        return null;
      }

      setState((prev) => ({
        ...prev,
        isCheckingAllowance: true,
        allowanceError: null,
      }));

      try {
        const allowanceResponse = await nexusSdk.getAllowance({
          tokens: params.tokens,
          amount:
            typeof params.amount === "string"
              ? parseFloat(params.amount)
              : params.amount,
          chainId: params.chainId,
        });

        console.log("allowanceResponse", allowanceResponse);

        if (allowanceResponse && allowanceResponse.length > 0) {
          const tokenAllowance = allowanceResponse[0];
          const currentAllowance = parseFloat(
            tokenAllowance.allowance.toString()
          );
          const requiredAmount =
            typeof params.amount === "string"
              ? parseFloat(params.amount)
              : params.amount;

          const hasEnoughAllowance = currentAllowance >= requiredAmount;
          console.log("final result", {
            hasEnoughAllowance,
            currentAllowance: tokenAllowance.allowance.toString(),
            requiredAllowance: params.amount.toString(),
            needsApproval: !hasEnoughAllowance,
          });
          return {
            hasEnoughAllowance,
            currentAllowance: tokenAllowance.allowance.toString(),
            requiredAllowance: params.amount.toString(),
            needsApproval: !hasEnoughAllowance,
          };
        }

        return {
          hasEnoughAllowance: false,
          currentAllowance: "0",
          requiredAllowance: params.amount.toString(),
          needsApproval: true,
        };
      } catch (error: unknown) {
        console.error("Error checking allowance:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Failed to check allowance";
        setState((prev) => ({ ...prev, allowanceError: errorMessage }));
        toast.error("Failed to check allowance", {
          description: errorMessage,
        });
        return null;
      } finally {
        setState((prev) => ({ ...prev, isCheckingAllowance: false }));
      }
    },
    [nexusSdk]
  );

  /**
   * Set allowance for a specific token on a chain
   */
  const setAllowance = useCallback(
    async (params: SetAllowanceParams): Promise<boolean> => {
      if (!nexusSdk) {
        console.error("NexusSDK not initialized");
        return false;
      }

      setState((prev) => ({
        ...prev,
        isSettingAllowance: true,
        allowanceError: null,
      }));

      try {
        let allowanceValue: bigint;

        if (params.amount === "max") {
          allowanceValue = BigInt(
            "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
          );
        } else {
          const amount =
            typeof params.amount === "string"
              ? parseFloat(params.amount)
              : params.amount;
          const decimals = nexusSdk
            .getSupportedTokens()
            .find((token) => token.symbol === params.tokens[0])?.decimals;
          if (!decimals) {
            throw new Error("Decimals not found");
          }
          const tokenUnits = Math.floor(amount * Math.pow(10, decimals));
          allowanceValue = BigInt(tokenUnits);
        }

        await nexusSdk.setAllowance(
          params.chainId,
          params.tokens,
          allowanceValue
        );

        toast.success("Allowance set successfully", {
          description: `${params.tokens} allowance updated on chain ${params.chainId}`,
        });

        return true;
      } catch (error: unknown) {
        console.error("Error setting allowance:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Failed to set allowance";
        setState((prev) => ({ ...prev, allowanceError: errorMessage }));

        // Handle specific error cases
        if (error instanceof Error) {
          if (error.message.includes("User rejected")) {
            toast.error("Transaction rejected", {
              description: "Allowance approval was rejected by user",
            });
          } else if (error.message.includes("insufficient funds")) {
            toast.error("Insufficient funds", {
              description: "Not enough funds to pay for gas fees",
            });
          } else {
            toast.error("Failed to set allowance", {
              description: errorMessage,
            });
          }
        } else {
          toast.error("Failed to set allowance", {
            description: errorMessage,
          });
        }

        return false;
      } finally {
        setState((prev) => ({ ...prev, isSettingAllowance: false }));
      }
    },
    [nexusSdk]
  );

  /**
   * Revoke allowance for a specific token on a chain
   */
  const revokeAllowance = useCallback(
    async (
      token: SUPPORTED_TOKENS,
      chainId: SUPPORTED_CHAINS_IDS
    ): Promise<boolean> => {
      if (!nexusSdk) {
        console.error("NexusSDK not initialized");
        return false;
      }

      setState((prev) => ({
        ...prev,
        isSettingAllowance: true,
        allowanceError: null,
      }));

      try {
        await nexusSdk.revokeAllowance(chainId, [token]);

        toast.success("Allowance revoked successfully", {
          description: `${token} allowance revoked on chain ${chainId}`,
        });

        return true;
      } catch (error: unknown) {
        console.error("Error revoking allowance:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Failed to revoke allowance";
        setState((prev) => ({ ...prev, allowanceError: errorMessage }));
        toast.error("Failed to revoke allowance", {
          description: errorMessage,
        });
        return false;
      } finally {
        setState((prev) => ({ ...prev, isSettingAllowance: false }));
      }
    },
    [nexusSdk]
  );

  /**
   * Check allowance and prompt user to set it if insufficient
   * This is the main function that components should use before transactions
   */
  const ensureAllowance = useCallback(
    async (params: AllowanceParams): Promise<boolean> => {
      try {
        // First check current allowance
        const allowanceResult = await checkAllowance(params);

        if (!allowanceResult) {
          return false;
        }

        // If allowance is sufficient, proceed
        if (allowanceResult.hasEnoughAllowance) {
          return true;
        }

        // If allowance is insufficient, the SDK's onAllowanceHook will automatically trigger
        // the allowance modal when the actual transaction is attempted.
        // We can also proactively set allowance here if needed.

        console.log("Insufficient allowance detected:", {
          current: allowanceResult.currentAllowance,
          required: allowanceResult.requiredAllowance,
          token: params.tokens,
          chainId: params.chainId,
        });

        // Return false to indicate that allowance needs to be set
        // The actual transaction will trigger the allowance modal
        return false;
      } catch (error) {
        console.error("Error in ensureAllowance:", error);
        return false;
      }
    },
    [checkAllowance]
  );

  /**
   * Get allowances for multiple tokens on a chain
   */
  const getAllowances = useCallback(
    async (
      tokens: SUPPORTED_TOKENS[],
      amount: number,
      chainId: SUPPORTED_CHAINS_IDS
    ): Promise<AllowanceResponse[] | null> => {
      if (!nexusSdk) {
        console.error("NexusSDK not initialized");
        return null;
      }

      setState((prev) => ({
        ...prev,
        isCheckingAllowance: true,
        allowanceError: null,
      }));

      try {
        const allowances = await nexusSdk.getAllowance({
          tokens,
          amount,
          chainId,
        });
        return allowances;
      } catch (error: unknown) {
        console.error("Error getting allowances:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Failed to get allowances";
        setState((prev) => ({ ...prev, allowanceError: errorMessage }));
        return null;
      } finally {
        setState((prev) => ({ ...prev, isCheckingAllowance: false }));
      }
    },
    [nexusSdk]
  );

  /**
   * Check if a token needs allowance approval for a specific amount
   */
  const needsApproval = useCallback(
    async (params: AllowanceParams): Promise<boolean> => {
      const result = await checkAllowance(params);
      return result?.needsApproval ?? true;
    },
    [checkAllowance]
  );

  return {
    // State
    isCheckingAllowance: state.isCheckingAllowance,
    isSettingAllowance: state.isSettingAllowance,
    allowanceError: state.allowanceError,

    // Methods
    checkAllowance,
    setAllowance,
    revokeAllowance,
    ensureAllowance,
    getAllowances,
    needsApproval,
  };
};

export default useAllowanceManager;
export type { AllowanceCheckResult, SetAllowanceParams };
