import { useState, useCallback, useEffect } from "react";
import { useNexus } from "@/provider/NexusProvider";
import { useAccount } from "wagmi";
import {
  SUPPORTED_TOKENS,
  SimulationResult,
  SUPPORTED_CHAINS_IDS,
} from "@avail-project/nexus";
import type {
  AllowanceResponse,
  BridgeAndExecuteParams,
  BridgeAndExecuteResult,
  BridgeAndExecuteSimulationResult,
  ExecuteSimulation,
} from "@avail-project/nexus";
import type { Abi } from "viem";
import { getTemplateById } from "@/constants/contractTemplates";
import { useBridgeExecuteStore } from "@/store/bridgeExecuteStore";
import { getTokenAddress, getTokenDecimals } from "@/constants/tokenAddresses";
import { toast } from "sonner";

interface UseBridgeExecuteTransactionReturn {
  executeBridgeAndExecute: () => Promise<{ success: boolean }>;
  simulateBridgeAndExecute: () => Promise<void>;
  isExecuting: boolean;
  isSimulating: boolean;
  error: string | null;
  bridgeSimulation: SimulationResult | null;
  executeSimulation: ExecuteSimulation | null;
  multiStepResult: BridgeAndExecuteSimulationResult | null;
  // Approval management
  setTokenAllowance: (amount: string) => Promise<{ success: boolean }>;
  isSettingAllowance: boolean;
  currentAllowance: string | null;
  checkCurrentAllowance: () => Promise<void>;
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
  const [isSettingAllowance, setIsSettingAllowance] = useState(false);
  const [currentAllowance, setCurrentAllowance] = useState<string | null>(null);

  const {
    selectedToken,
    bridgeAmount,
    selectedChain,
    selectedTemplate,
    resetProgress,
    setError: setStoreError,
    reset,
  } = useBridgeExecuteStore();

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

      const contractAddress = template.contractAddress;

      // Use correct decimals for each token
      const amountInSmallestUnit = BigInt(
        parseFloat(amount) * 10 ** getTokenDecimals(token)
      );

      // Build function arguments based on template type
      let functionArgs: unknown[];
      let ethValue: string | undefined;
      const contractAbi = template.abi as Abi;
      const functionName = template.functionName;

      if (token === "ETH") {
        throw new Error(
          `Direct ETH deposits to AAVE are not supported. Please use USDC instead.`
        );
      } else {
        const assetAddress = getTokenAddress(token, chainId);
        if (!assetAddress) {
          throw new Error(`Token ${token} not supported on chain ${chainId}`);
        }
        functionArgs = [
          assetAddress, // asset
          amountInSmallestUnit.toString(), // amount with correct decimals
          address, // onBehalfOf (user's wallet address)
          0, // referralCode
        ];
      }

      return {
        contractAddress,
        contractAbi: contractAbi,
        functionName: functionName,
        functionParams: functionArgs,
        value: ethValue,
        tokenApproval: {
          token: token,
          amount: amount,
          chainId: chainId,
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
        amount: bridgeAmount,
        toChainId: selectedChain,
        execute: executeParams,
      };

      console.log("simulateBridgeAndExecute params", params);

      const result = await nexusSdk.simulateBridgeAndExecute(params);

      console.log("simulateBridgeAndExecute result", result);

      // Always set the multiStepResult, whether success or failure
      setMultiStepResult(result);

      if (result.success) {
        setBridgeSimulation(result.bridgeSimulation);
        setExecuteSimulation(result.executeSimulation || null);
        setError(null); // Clear any previous errors on success
      } else {
        // On failure, clear the simulation states but keep the error in multiStepResult
        setBridgeSimulation(null);
        setExecuteSimulation(null);
        setError(result.error || "Simulation failed");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Simulation failed";
      setError(errorMessage);
      // Create a failed result object when there's an exception
      setMultiStepResult({
        success: false,
        error: errorMessage,
        steps: [],
        bridgeSimulation: null,
        executeSimulation: undefined,
      });
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
        amount: bridgeAmount,
        toChainId: selectedChain,
        execute: executeParams,
        waitForReceipt: true,
        receiptTimeout: 300000,
      };
      console.log("executeBridgeAndExecute params", params);
      const result: BridgeAndExecuteResult = await nexusSdk.bridgeAndExecute(
        params
      );

      console.log("Bridge and execute completed:", result);
      reset();
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
      return { success: true };
    } catch (err) {
      const parsedError = parseBridgeExecuteError(err);
      setError(parsedError.message);
      setStoreError(parsedError.message);
      console.error("Bridge and execute error:", err);

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

  // Check current allowance for the selected token and protocol
  const checkCurrentAllowance = useCallback(async () => {
    if (!nexusSdk || !selectedToken || !selectedTemplate || !address) {
      setCurrentAllowance(null);
      return;
    }

    try {
      const template = getTemplateById(selectedTemplate.id);
      if (!template) {
        setCurrentAllowance(null);
        return;
      }

      const tokenAddress = getTokenAddress(selectedToken, selectedChain);
      if (!tokenAddress) {
        // ETH doesn't need approval
        setCurrentAllowance("unlimited");
        return;
      }

      // Get allowance from SDK
      const allowanceResponse: AllowanceResponse[] =
        await nexusSdk.getAllowance(selectedChain, [selectedToken]);
      console.log("allowanceResponse", allowanceResponse);

      if (allowanceResponse && allowanceResponse.length > 0) {
        const allowance = allowanceResponse[0];

        // Try different possible properties for the allowance amount
        const allowanceAmount = allowance.allowance;

        const allowanceFormatted = nexusSdk.utils.formatTokenAmount(
          allowanceAmount,
          selectedToken
        );
        setCurrentAllowance(allowanceFormatted);
      } else {
        setCurrentAllowance("0");
      }
    } catch (error) {
      console.error("Error checking allowance:", error);
      setCurrentAllowance("0");
    }
  }, [nexusSdk, selectedToken, selectedTemplate, address, selectedChain]);

  // Set token allowance
  const setTokenAllowance = useCallback(
    async (amount: string) => {
      if (!nexusSdk || !selectedToken || !selectedTemplate || !address) {
        return { success: false };
      }

      try {
        setIsSettingAllowance(true);
        setError(null);

        const template = getTemplateById(selectedTemplate.id);
        if (!template) {
          throw new Error(`Template ${selectedTemplate.id} not found`);
        }

        // Use the destination amount from bridge simulation if available
        const destinationAmount =
          multiStepResult?.bridgeSimulation?.intent?.destination?.amount ||
          amount;

        console.log("Setting allowance:", {
          chain: selectedChain,
          token: selectedToken,
          spender: template.contractAddress,
          amount: destinationAmount,
          originalAmount: amount,
        });

        // Convert amount to BigInt with correct decimals
        const decimals = getTokenDecimals(selectedToken);
        const amountBigInt = BigInt(
          parseFloat(destinationAmount) * 10 ** decimals
        );

        // Enhanced SDK call with better error handling
        await nexusSdk.setAllowance(
          selectedChain,
          [selectedToken],
          amountBigInt
        );

        // Check allowance again after setting
        await checkCurrentAllowance();

        // Re-run simulation after approval
        setTimeout(() => {
          simulateBridgeAndExecute();
        }, 1000);

        return { success: true };
      } catch (err) {
        const parsedError = parseBridgeExecuteError(err);
        setError(parsedError.message);
        console.error("Allowance setting error:", err);
        return { success: false };
      } finally {
        setIsSettingAllowance(false);
      }
    },
    [
      nexusSdk,
      selectedToken,
      selectedTemplate,
      selectedChain,
      address,
      multiStepResult,
      checkCurrentAllowance,
      simulateBridgeAndExecute,
      parseBridgeExecuteError,
    ]
  );

  // Check allowance when token/template changes
  useEffect(() => {
    if (selectedToken && selectedTemplate) {
      checkCurrentAllowance();
    }
  }, [selectedToken, selectedTemplate, checkCurrentAllowance]);

  return {
    executeBridgeAndExecute,
    simulateBridgeAndExecute,
    isExecuting,
    isSimulating,
    error,
    bridgeSimulation,
    executeSimulation,
    multiStepResult,
    setTokenAllowance,
    isSettingAllowance,
    currentAllowance,
    checkCurrentAllowance,
  };
}
