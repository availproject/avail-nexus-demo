"use client";
import { useEffect, useMemo, useState, useCallback } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import Image from "next/image";
import { SUPPORTED_CHAINS } from "@avail/nexus-sdk";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useNexus } from "@/provider/NexusProvider";
import { TokenBalance } from "./unified-balance";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import IntentModal from "./intent-modal";
import AllowanceModal from "./allowance-modal";
import {
  AVAILABLE_TOKENS,
  chainData,
  chainIcons,
  INITIAL_CHAIN,
} from "@/lib/constants";

// Define types for the steps
interface SdkStep {
  type: string;
  typeID: string;
  data?: Record<string, any>;
}

interface ComponentStep extends SdkStep {
  done: boolean;
}

interface StepCompletionEventData {
  typeID: string;
  [key: string]: any;
}

interface TransactionData {
  explorerURL: string;
  intentHash: number;
  timestamp: number;
  status: "pending" | "completed";
  token?: string;
  amount?: string;
}

interface IntentSubmittedData {
  explorerURL: string;
  intentHash: number;
}

type SupportedChainId =
  (typeof SUPPORTED_CHAINS)[keyof typeof SUPPORTED_CHAINS];
type SupportedToken = "ETH" | "USDC" | "USDT";

interface BridgeState {
  availableBalance: TokenBalance[];
  selectedChain: SupportedChainId;
  selectedToken: string;
  bridgeAmount: string;
  isLoading: boolean;
  isBridging: boolean;
  error: string | null;
  steps: ComponentStep[];
  currentTransactionData: TransactionData | null;
}

const TokenImage = ({ src, alt }: { src: string; alt: string }) => (
  <Image
    src={src || ""}
    alt={alt}
    width={24}
    height={24}
    className="rounded-full"
  />
);

const NexusBridge = () => {
  const [state, setState] = useState<BridgeState>({
    availableBalance: [],
    selectedChain: INITIAL_CHAIN,
    selectedToken: "",
    bridgeAmount: "",
    isLoading: false,
    isBridging: false,
    error: null,
    steps: [],
    currentTransactionData: null,
  });

  const {
    nexusSdk,
    intentModal,
    allowanceModal,
    setIntentModal,
    setAllowanceModal,
  } = useNexus();

  const handleChainSelect = useCallback((chainId: string) => {
    setState((prev) => ({
      ...prev,
      selectedChain: parseInt(chainId) as SupportedChainId,
      selectedToken: "",
    }));
  }, []);

  const handleTokenSelect = useCallback((symbol: string) => {
    setState((prev) => ({ ...prev, selectedToken: symbol }));
  }, []);

  const handleAmountChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      if (
        value === "" ||
        (/^\d*\.?\d*$/.test(value) && !isNaN(parseFloat(value)))
      ) {
        setState((prev) => ({ ...prev, bridgeAmount: value }));
      }
    },
    []
  );

  const fetchAvailableBalance = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      const balance = await nexusSdk?.getUnifiedBalances();
      setState((prev) => ({
        ...prev,
        availableBalance: balance as TokenBalance[],
        isLoading: false,
      }));
    } catch (error) {
      console.error("Error fetching balances", error);
      setState((prev) => ({
        ...prev,
        error: "Failed to fetch balances",
        isLoading: false,
      }));
      toast.error("Failed to fetch balances");
    }
  }, [nexusSdk]);

  const handleBridge = useCallback(async () => {
    if (!state.selectedToken || !state.bridgeAmount) return;

    try {
      setState((prev) => ({ ...prev, isBridging: true, error: null }));
      const result = await nexusSdk?.bridge({
        chainId: state.selectedChain,
        token: state.selectedToken as SupportedToken,
        amount: state.bridgeAmount,
      });
      console.log("result", result);
      setState((prev) => ({ ...prev, bridgeAmount: "" }));
    } catch (error: any) {
      console.log("error in bridge", error);

      // Handle specific error cases
      let errorMessage = "Bridge transaction failed";

      if (error?.message?.includes("User rejected")) {
        errorMessage = "Transaction was rejected by user";
      } else if (
        error?.message?.includes("User rejection during setting allowance")
      ) {
        errorMessage = "Token approval was rejected";
      } else if (error?.message?.includes("insufficient funds")) {
        errorMessage = "Insufficient funds for transaction";
      } else if (error?.message?.includes("gas")) {
        errorMessage = "Insufficient funds for gas fees";
      } else if (error?.message) {
        // If we have an error message but it's not one of our known cases,
        // clean it up by removing any technical details after the first colon
        errorMessage = error.message.split(":")[0];
      }

      setState((prev) => ({ ...prev, error: errorMessage }));
      toast.error(errorMessage, {
        description: "Please try again",
        duration: 4000,
      });
    } finally {
      setState((prev) => ({ ...prev, isBridging: false }));
    }
  }, [nexusSdk, state.selectedChain, state.selectedToken, state.bridgeAmount]);

  useEffect(() => {
    if (!state.availableBalance.length && !state.isLoading) {
      fetchAvailableBalance();
    }

    const handleExpectedSteps = (expectedStepsData: SdkStep[]) => {
      console.log("expectedStepsData", expectedStepsData);
      setState((prevState) => ({
        ...prevState,
        steps: expectedStepsData.map((s) => ({ ...s, done: false })),
      }));
    };

    const handleStepComplete = (completedStepData: StepCompletionEventData) => {
      console.log("completedStepData", completedStepData);
      setState((prevState) => {
        // Check if this step was already marked as done
        const stepAlreadyDone = prevState.steps.find(
          (s) => s.typeID === completedStepData.typeID && s.done
        );
        if (stepAlreadyDone) return prevState; // Skip if already processed

        const updatedSteps = prevState.steps.map((s) =>
          s.typeID === completedStepData.typeID ? { ...s, done: true } : s
        );

        // Find the completed step
        const stepJustCompleted = updatedSteps.find(
          (s) => s.typeID === completedStepData.typeID
        );

        if (stepJustCompleted?.done) {
          // Handle final step (INTENT_FULFILLED)
          if (completedStepData.typeID === "IF") {
            // Update transaction status in local storage
            const existingTransactions = JSON.parse(
              localStorage.getItem("bridgeTransactions") ?? "[]"
            );
            const updatedTransactions = existingTransactions.map(
              (tx: TransactionData) => {
                if (
                  tx.intentHash === state.currentTransactionData?.intentHash
                ) {
                  return { ...tx, status: "completed" };
                }
                return tx;
              }
            );
            localStorage.setItem(
              "bridgeTransactions",
              JSON.stringify(updatedTransactions)
            );

            // Show final toast with explorer link
            toast.success(
              <div className="flex items-center gap-2">
                <span>Bridge transaction completed successfully!</span>
                {state.currentTransactionData && (
                  <Button
                    variant="connectkit"
                    size="sm"
                    onClick={() =>
                      window.open(
                        state.currentTransactionData?.explorerURL,
                        "_blank"
                      )
                    }
                    className="w-full"
                  >
                    View in Explorer
                  </Button>
                )}
              </div>,
              {
                duration: 5000, // 5 seconds
              }
            );
            fetchAvailableBalance();
          } else {
            const stepName = stepJustCompleted.type
              .split("_")
              .map(
                (word) =>
                  word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
              )
              .join(" ");

            if (
              completedStepData.typeID === "IS" &&
              "data" in completedStepData
            ) {
              const intentData = completedStepData.data as IntentSubmittedData;
              const transactionData: TransactionData = {
                explorerURL: intentData.explorerURL,
                intentHash: intentData.intentHash,
                timestamp: Date.now(),
                status: "pending",
                token: prevState.selectedToken,
                amount: prevState.bridgeAmount,
              };

              // Store in local storage
              const existingTransactions = JSON.parse(
                localStorage.getItem("bridgeTransactions") ?? "[]"
              );
              localStorage.setItem(
                "bridgeTransactions",
                JSON.stringify([...existingTransactions, transactionData])
              );

              // Update current transaction in state
              setState((prev) => ({
                ...prev,
                currentTransactionData: transactionData,
              }));
            }

            toast.success(`${stepName}!`);
          }
        }

        return { ...prevState, steps: updatedSteps };
      });
    };

    // Add event listeners
    nexusSdk?.nexusAdapter?.caEvents.on("expected_steps", handleExpectedSteps);
    nexusSdk?.nexusAdapter?.caEvents.on("step_complete", handleStepComplete);

    // Cleanup on unmount or when dependencies change
    return () => {
      nexusSdk?.nexusAdapter?.caEvents.off(
        "expected_steps",
        handleExpectedSteps
      );
      nexusSdk?.nexusAdapter?.caEvents.off("step_complete", handleStepComplete);
    };
  }, [nexusSdk, fetchAvailableBalance]);

  const isValidBridgeAmount = useMemo(() => {
    if (!state.bridgeAmount) return false;
    const amount = parseFloat(state.bridgeAmount);
    const totalTokenBalance = state.availableBalance.find(
      (t) => t.symbol === state.selectedToken
    )?.balance;
    return amount > 0 && amount <= parseFloat(totalTokenBalance ?? "0");
  }, [state.bridgeAmount, state.availableBalance, state.selectedToken]);

  const formatBalance = (balance: number) => balance.toFixed(6);

  if (state.isLoading) {
    return (
      <div className="flex items-center justify-center w-full h-48">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full gap-y-4 py-4">
      <div className="w-full max-w-sm space-y-4">
        <Select
          value={state.selectedChain.toString()}
          onValueChange={handleChainSelect}
        >
          <SelectTrigger className="w-full !shadow-[var(--ck-connectbutton-box-shadow)] rounded-[var(--ck-connectbutton-border-radius)] border-none">
            <SelectValue>
              {state.selectedChain && (
                <div className="flex items-center gap-2">
                  <TokenImage
                    src={chainIcons[state.selectedChain]}
                    alt={chainData[state.selectedChain]?.name ?? ""}
                  />
                  {chainData[state.selectedChain]?.name}
                </div>
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="bg-accent-foreground rounded-[var(--ck-connectbutton-border-radius)]">
            {Object.entries(SUPPORTED_CHAINS).map(([name, chainId]) => {
              const chain = chainData[chainId as SupportedChainId];
              if (!chain) return null;
              return (
                <SelectItem
                  key={chainId}
                  value={chainId.toString()}
                  className="flex items-center gap-2 hover:bg-background/50"
                >
                  <div className="flex items-center gap-2">
                    <TokenImage
                      src={chainIcons[chainId as SupportedChainId]}
                      alt={chain.name}
                    />
                    {chain.name}
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>

        <Select value={state.selectedToken} onValueChange={handleTokenSelect}>
          <SelectTrigger className="w-full !shadow-[var(--ck-connectbutton-box-shadow)] rounded-[var(--ck-connectbutton-border-radius)] border-none">
            <SelectValue placeholder="Select a token">
              {state.selectedChain &&
                AVAILABLE_TOKENS?.find(
                  (t) => t.symbol === state.selectedToken
                ) && (
                  <div className="flex items-center gap-2">
                    <TokenImage
                      src={
                        AVAILABLE_TOKENS?.find(
                          (t) => t.symbol === state.selectedToken
                        )?.icon ?? ""
                      }
                      alt={state.selectedToken}
                    />
                    {state.selectedToken}
                  </div>
                )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="bg-accent-foreground rounded-[var(--ck-connectbutton-border-radius)]">
            {AVAILABLE_TOKENS?.map((token) => (
              <SelectItem
                key={token.symbol}
                value={token.symbol}
                className="flex items-center gap-2 hover:bg-background/50"
              >
                <div className="flex items-center gap-2">
                  <TokenImage src={token.icon ?? ""} alt={token.symbol} />
                  <div className="flex flex-col">
                    <span>{token.symbol}</span>
                  </div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="w-full max-w-sm flex items-center gap-x-2 shadow-[var(--ck-connectbutton-box-shadow)] rounded-[var(--ck-connectbutton-border-radius)]">
        <Input
          type="text"
          placeholder="Bridge amount"
          className="border-none focus-visible:ring-0 focus-visible:ring-offset-0"
          value={state.bridgeAmount}
          onChange={handleAmountChange}
          disabled={!state.selectedToken || state.isBridging}
        />
      </div>

      <Button
        variant="connectkit"
        className="w-full font-semibold"
        onClick={handleBridge}
        disabled={!isValidBridgeAmount || state.isBridging}
      >
        {state.isBridging ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          "Bridge"
        )}
      </Button>

      {intentModal && (
        <IntentModal
          intentModal={intentModal}
          setIntentModal={setIntentModal}
        />
      )}

      {allowanceModal && (
        <AllowanceModal
          allowanceModal={allowanceModal}
          setAllowanceModal={setAllowanceModal}
        />
      )}
    </div>
  );
};

export default NexusBridge;
