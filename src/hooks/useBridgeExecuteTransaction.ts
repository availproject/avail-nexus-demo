import { useState, useCallback } from "react";
import { useNexus } from "@/provider/NexusProvider";
import { useAccount } from "wagmi";
import {
  SUPPORTED_TOKENS,
  SimulationResult,
  SUPPORTED_CHAINS_IDS,
  TOKEN_METADATA,
  getTokenContractAddress,
} from "@avail-project/nexus-core";
import type {
  BridgeAndExecuteParams,
  BridgeAndExecuteResult,
  BridgeAndExecuteSimulationResult,
  ExecuteSimulation,
} from "@avail-project/nexus-core";
import { parseUnits, type Abi, encodeFunctionData } from "viem";
import { createOnEvent } from "@/hooks/useNexusProgressEvents";
import { getTemplateById } from "@/constants/contractTemplates";
import { useBridgeExecuteStore } from "@/store/bridgeExecuteStore";

import { toast } from "sonner";
import { useNexusErrorHandler } from "@/hooks/useNexusErrorHandler";

interface UseBridgeExecuteTransactionReturn {
  executeBridgeAndExecute: () => Promise<{ success: boolean }>;
  simulateBridgeAndExecute: () => Promise<void>;
  isExecuting: boolean;
  isSimulating: boolean;
  error: string | null;
  bridgeSimulation: SimulationResult | null;
  executeSimulation: ExecuteSimulation | null;
  multiStepResult: BridgeAndExecuteSimulationResult | null;
}

export function useBridgeExecuteTransaction(): UseBridgeExecuteTransactionReturn {
  const { nexusSdk } = useNexus();
  const { address } = useAccount();
  const [isExecuting, setIsExecuting] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bridgeSimulation, setBridgeSimulation] =
    useState<SimulationResult | null>(null);
  const [executeSimulation, setExecuteSimulation] =
    useState<ExecuteSimulation | null>(null);
  // Removed unused approvalSimulation state
  const [multiStepResult, setMultiStepResult] =
    useState<BridgeAndExecuteSimulationResult | null>(null);
  // Manual allowance management removed; handled via setOnAllowanceHook

  const {
    selectedToken,
    bridgeAmount,
    selectedChain,
    selectedTemplate,
    resetProgress,
    setError: setStoreError,
    reset,
  } = useBridgeExecuteStore();
  const { handleError } = useNexusErrorHandler();

  // Enhanced error parsing
  const parseBridgeExecuteError = useCallback((error: unknown) => {
    if (error instanceof Error) {
      if (error.message.includes("insufficient allowance")) {
        return { type: "ALLOWANCE", message: "Token allowance insufficient" };
      }
      if (error.message.includes("simulation failed")) {
        return { type: "SIMULATION", message: "Transaction simulation failed" };
      }
      return { type: "GENERAL", message: error.message };
    }
    return { type: "UNKNOWN", message: "Unknown error occurred" };
  }, []);

  const buildExecuteParams = useCallback(
    (
      token: SUPPORTED_TOKENS,
      amount: string,
      chainId: SUPPORTED_CHAINS_IDS
    ) => {
      if (!selectedTemplate) {
        throw new Error("No template selected");
      }

      if (!address) {
        throw new Error("Wallet not connected");
      }

      const template = getTemplateById(selectedTemplate.id);
      if (!template) {
        throw new Error(`Template ${selectedTemplate.id} not found`);
      }

      const supportedChain = template.supportedChains.find(
        (chain: SUPPORTED_CHAINS_IDS) => chain === chainId
      );
      if (!supportedChain) {
        throw new Error(
          `Template ${selectedTemplate.id} not supported on chain ${chainId}`
        );
      }

      const contractAddress = template.contractAddress as `0x${string}`;

      // Build function arguments based on template type
      let ethValue: bigint | undefined;
      const contractAbi = template.abi as Abi;
      const functionName = template.functionName;

      if (token === "ETH") {
        throw new Error(
          `Direct ETH deposits to AAVE are not supported. Please use USDC instead.`
        );
      }

      const decimals = TOKEN_METADATA[token].decimals;
      const amountWei = parseUnits(amount, decimals);
      const tokenAddrStr = getTokenContractAddress(token, chainId);
      if (!tokenAddrStr) {
        throw new Error(`No contract address for ${token} on chain ${chainId}`);
      }
      const tokenAddr = tokenAddrStr as `0x${string}`;
      const args = [tokenAddr, amountWei, address, 0] as const;
      const data = encodeFunctionData({ abi: contractAbi, functionName, args });

      return {
        to: contractAddress,
        data,
        value: ethValue,
        tokenApproval: {
          token: token,
          amount: amountWei,
          spender: contractAddress,
        },
      };
    },
    [selectedTemplate, address]
  );

  const simulateBridgeAndExecute = useCallback(async () => {
    if (
      !nexusSdk ||
      !selectedToken ||
      !bridgeAmount ||
      !selectedChain ||
      !selectedTemplate
    ) {
      setError("Missing required parameters for simulation");
      return;
    }

    try {
      setError(null);
      setIsSimulating(true);
      setBridgeSimulation(null);
      setExecuteSimulation(null);
      setMultiStepResult(null);

      const executeParams = buildExecuteParams(
        selectedToken,
        bridgeAmount,
        selectedChain
      );

      const params: BridgeAndExecuteParams = {
        token: selectedToken,
        amount: parseUnits(
          bridgeAmount,
          TOKEN_METADATA[selectedToken].decimals
        ),
        toChainId: selectedChain,
        execute: executeParams,
      };

      console.log("simulateBridgeAndExecute params", params);

      const result = await nexusSdk.simulateBridgeAndExecute(params);

      console.log("simulateBridgeAndExecute result", result);

      // Populate legacy fields for UI fallback
      setBridgeSimulation(result.bridgeSimulation);
      setExecuteSimulation(result.executeSimulation || null);
      setMultiStepResult(null);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Simulation failed";
      setError(errorMessage);
      // Clear legacy states on error
      setMultiStepResult(null);
      setBridgeSimulation(null);
      setExecuteSimulation(null);
      console.error("Simulation error:", err);
      handleError(err, "Bridge and execute simulation");
    } finally {
      setIsSimulating(false);
    }
  }, [
    nexusSdk,
    selectedToken,
    bridgeAmount,
    selectedChain,
    selectedTemplate,
    buildExecuteParams,
  ]);

  const executeBridgeAndExecute = useCallback(async () => {
    if (
      !nexusSdk ||
      !selectedToken ||
      !bridgeAmount ||
      !selectedChain ||
      !selectedTemplate
    ) {
      setError("Missing required parameters");
      return { success: false };
    }

    try {
      setIsExecuting(true);
      setError(null);
      setStoreError(null);
      resetProgress();

      const executeParams = buildExecuteParams(
        selectedToken,
        bridgeAmount,
        selectedChain
      );

      const params: BridgeAndExecuteParams = {
        token: selectedToken,
        amount: parseUnits(
          bridgeAmount,
          TOKEN_METADATA[selectedToken].decimals
        ),
        toChainId: selectedChain,
        execute: executeParams,
        waitForReceipt: true,
        receiptTimeout: 300000,
      };
      console.log("executeBridgeAndExecute params", params);
      const result: BridgeAndExecuteResult = await nexusSdk.bridgeAndExecute(
        params,
        { onEvent: createOnEvent("bridge-execute") }
      );

      console.log("Bridge and execute completed:", result);
      reset();
      if (result) {
        toast.success(`Bridge and Execute completed successfully!`, {
          duration: 5000,
          action:
            result?.executeExplorerUrl && result?.executeExplorerUrl?.length > 0
              ? {
                  label: "View in Explorer",
                  onClick: () =>
                    window.open(result?.executeExplorerUrl, "_blank"),
                }
              : undefined,
        });
      }

      return { success: true };
    } catch (err) {
      const parsedError = parseBridgeExecuteError(err);
      setError(parsedError.message);
      setStoreError(parsedError.message);
      console.error("Bridge and execute error:", err);
      handleError(err, "Bridge and execute execution");

      // Show appropriate toast based on error type
      if (parsedError.type === "ALLOWANCE") {
        toast.error("Please set token allowance first");
      } else if (parsedError.type === "SIMULATION") {
        toast.error("Transaction simulation failed. Please check parameters.");
      } else {
        toast.error(parsedError.message);
      }

      return { success: false };
    } finally {
      setIsExecuting(false);
    }
  }, [
    nexusSdk,
    selectedToken,
    bridgeAmount,
    selectedChain,
    selectedTemplate,
    buildExecuteParams,
    resetProgress,
    setStoreError,
    parseBridgeExecuteError,
    reset,
  ]);

  // Manual allowance helpers removed

  return {
    executeBridgeAndExecute,
    simulateBridgeAndExecute,
    isExecuting,
    isSimulating,
    error,
    bridgeSimulation,
    executeSimulation,
    multiStepResult,
  };
}
