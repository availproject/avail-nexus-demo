import { useState, useCallback } from "react";
import { useNexus } from "@/provider/NexusProvider";
import {
  SUPPORTED_TOKENS,
  SimulationResult,
  SUPPORTED_CHAINS_IDS,
} from "avail-nexus-sdk";
import type {
  BridgeAndExecuteParams,
  BridgeAndExecuteResult,
  ExecuteSimulation,
} from "avail-nexus-sdk";
import type { Abi } from "viem";
import { getTemplateById } from "@/constants/contractTemplates";
import { useBridgeExecuteStore } from "@/store/bridgeExecuteStore";

interface UseBridgeExecuteTransactionReturn {
  executeBridgeAndExecute: () => Promise<{ success: boolean }>;
  simulateBridgeAndExecute: () => Promise<void>;
  isExecuting: boolean;
  isSimulating: boolean;
  error: string | null;
  bridgeSimulation: SimulationResult | null;
  executeSimulation: ExecuteSimulation | null;
}

export function useBridgeExecuteTransaction(): UseBridgeExecuteTransactionReturn {
  const { nexusSdk } = useNexus();
  const [isExecuting, setIsExecuting] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bridgeSimulation, setBridgeSimulation] =
    useState<SimulationResult | null>(null);
  const [executeSimulation, setExecuteSimulation] =
    useState<ExecuteSimulation | null>(null);

  const {
    selectedToken,
    bridgeAmount,
    selectedChain,
    selectedTemplate,
    resetProgress,
    setError: setStoreError,
  } = useBridgeExecuteStore();

  const buildExecuteParams = useCallback(
    (
      token: SUPPORTED_TOKENS,
      amount: string,
      chainId: SUPPORTED_CHAINS_IDS
    ) => {
      if (!selectedTemplate) {
        throw new Error("No template selected");
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

      const contractAddress = template.contractAddress;
      const amountWei = BigInt(parseFloat(amount) * 10 ** 18);

      // Build function arguments based on template type
      let functionArgs: unknown[];
      let ethValue: string | undefined;

      switch (selectedTemplate.id) {
        case "aave-deposit":
          functionArgs = [
            token, // asset
            amountWei.toString(), // amount as string
            "0x0000000000000000000000000000000000000000", // onBehalfOf (user address, will be set by SDK)
            0, // referralCode
          ];
          break;

        case "lido-stake":
          functionArgs = [
            "0x0000000000000000000000000000000000000000", // referralAddress
          ];
          ethValue = `0x${amountWei.toString(16)}`; // ETH sent as msg.value
          break;

        case "compound-supply":
          functionArgs = [amountWei.toString()]; // mintAmount as string
          break;

        default:
          throw new Error(`Unsupported template: ${selectedTemplate.id}`);
      }

      return {
        contractAddress,
        contractAbi: template.abi as Abi,
        functionName: template.functionName,
        functionParams: functionArgs,
        value: ethValue,
      };
    },
    [selectedTemplate]
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

      const executeParams = buildExecuteParams(
        selectedToken,
        bridgeAmount,
        selectedChain
      );

      const params: BridgeAndExecuteParams = {
        token: selectedToken,
        amount: BigInt(parseFloat(bridgeAmount) * 10 ** 18).toString(),
        toChainId: selectedChain,
        execute: executeParams,
      };

      const result = await nexusSdk.simulateBridgeAndExecute(params);

      if (!result.success) {
        throw new Error(result.error || "Simulation failed");
      }

      setBridgeSimulation(result.bridgeSimulation);
      setExecuteSimulation(result.executeSimulation || null);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Simulation failed";
      setError(errorMessage);
      console.error("Simulation error:", err);
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
        amount: BigInt(parseFloat(bridgeAmount) * 10 ** 18).toString(),
        toChainId: selectedChain,
        execute: executeParams,
        waitForReceipt: true,
        receiptTimeout: 300000,
      };

      const result: BridgeAndExecuteResult = await nexusSdk.bridgeAndExecute(
        params
      );

      console.log("Bridge and execute completed:", result);
      return { success: true };
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Transaction failed";
      setError(errorMessage);
      setStoreError(errorMessage);
      console.error("Bridge and execute error:", err);
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
  ]);

  return {
    executeBridgeAndExecute,
    simulateBridgeAndExecute,
    isExecuting,
    isSimulating,
    error,
    bridgeSimulation,
    executeSimulation,
  };
}
