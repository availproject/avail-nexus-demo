"use client";
import React, { useState, useEffect } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useNexus } from "@/provider/NexusProvider";
import {
  SUPPORTED_CHAINS,
  SUPPORTED_CHAINS_IDS,
  SUPPORTED_TOKENS,
} from "avail-nexus-sdk";
import ChainSelect from "./blocks/chain-select";
import TokenSelect from "./blocks/token-select";
import { useTransactionProgress } from "@/hooks/useTransactionProgress";
import { useTransferTransaction } from "@/hooks/useTransferTransaction";
import { SimulationPreview } from "./shared/simulation-preview";
import IntentModal from "./nexus-modals/intent-modal";
import AllowanceModal from "./nexus-modals/allowance-modal";

interface TransferState {
  selectedChain: SUPPORTED_CHAINS_IDS;
  selectedToken: SUPPORTED_TOKENS | undefined;
  recipientAddress: `0x${string}` | undefined;
  amount: string;
  isTransferring: boolean;
}

const NexusTransfer = () => {
  const [state, setState] = useState<TransferState>({
    selectedChain: SUPPORTED_CHAINS.ETHEREUM,
    selectedToken: undefined,
    recipientAddress: undefined,
    amount: "",
    isTransferring: false,
  });
  const {
    nexusSdk,
    intentModal,
    allowanceModal,
    setIntentModal,
    setAllowanceModal,
  } = useNexus();

  const {
    executeTransfer,
    simulation,
    isSimulating,
    simulationError,
    triggerTransferSimulation,
  } = useTransferTransaction();

  useTransactionProgress({
    transactionType: "transfer",
    formData: {
      selectedToken: state.selectedToken,
      amount: state.amount,
      selectedChain: state.selectedChain.toString(),
      recipientAddress: state.recipientAddress,
    },
  });

  // Trigger simulation when transfer parameters change
  useEffect(() => {
    if (
      state.selectedToken &&
      state.amount &&
      state.recipientAddress &&
      state.selectedChain &&
      parseFloat(state.amount) > 0
    ) {
      triggerTransferSimulation({
        token: state.selectedToken,
        amount: state.amount,
        chainId: state.selectedChain,
        recipient: state.recipientAddress,
      });
    }
  }, [
    state.selectedToken,
    state.amount,
    state.recipientAddress,
    state.selectedChain,
    triggerTransferSimulation,
  ]);

  const handleChainSelect = (chainId: SUPPORTED_CHAINS_IDS) => {
    setState({ ...state, selectedChain: chainId });
  };

  const handleTokenSelect = (token: SUPPORTED_TOKENS) => {
    setState({ ...state, selectedToken: token });
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setState({ ...state, amount: e.target.value });
  };

  const handleRecipientAddressChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setState({ ...state, recipientAddress: e.target.value as `0x${string}` });
  };

  const handleTransfer = async () => {
    if (
      !state.selectedToken ||
      !state.recipientAddress ||
      !state.amount ||
      !state.selectedChain
    ) {
      toast.error("Please fill all the fields");
      return;
    }

    setState({ ...state, isTransferring: true });

    try {
      const result = await executeTransfer({
        token: state.selectedToken,
        amount: state.amount,
        chainId: state.selectedChain,
        recipient: state.recipientAddress,
      });

      console.log("result", result);

      if (result.success) {
        // Clear form on successful transfer
        setState({
          ...state,
          amount: "",
          recipientAddress: undefined,
          isTransferring: false,
        });
      }
    } catch (error: unknown) {
      console.error("Unexpected error in handleTransfer:", error);
    } finally {
      setState({ ...state, isTransferring: false });
    }
  };

  const isValidTransferAmount = state.amount && state.amount !== "";

  return (
    <div className="flex flex-col gap-y-4 py-4">
      <div className="w-full space-y-4">
        <ChainSelect
          selectedChain={state.selectedChain}
          handleSelect={handleChainSelect}
        />
        <TokenSelect
          selectedToken={state.selectedToken}
          selectedChain={state.selectedChain.toString()}
          handleTokenSelect={handleTokenSelect}
        />
      </div>
      <div className="w-full flex items-center gap-x-2 shadow-[var(--ck-connectbutton-box-shadow)] rounded-[var(--ck-connectbutton-border-radius)]">
        <Input
          type="text"
          placeholder="Recipient address"
          className="border-none focus-visible:ring-0 focus-visible:ring-offset-0"
          value={
            state.recipientAddress
              ? nexusSdk?.utils.truncateAddress(state.recipientAddress, 6, 6)
              : ""
          }
          onChange={handleRecipientAddressChange}
          disabled={!state.selectedToken}
        />
      </div>
      <div className="w-full flex items-center gap-x-2 shadow-[var(--ck-connectbutton-box-shadow)] rounded-[var(--ck-connectbutton-border-radius)]">
        <Input
          type="text"
          placeholder="Amount"
          className="border-none focus-visible:ring-0 focus-visible:ring-offset-0"
          value={state.amount}
          onChange={handleAmountChange}
          disabled={!state.selectedToken}
        />
      </div>

      {/* Transfer Simulation Preview */}
      {state.selectedToken &&
        state.amount &&
        state.recipientAddress &&
        parseFloat(state.amount) > 0 && (
          <SimulationPreview
            simulation={simulation}
            isSimulating={isSimulating}
            simulationError={simulationError}
            title="Transfer Cost Estimate"
            className="w-full"
          />
        )}

      <Button
        variant="connectkit"
        className="w-full font-semibold"
        onClick={handleTransfer}
        disabled={!isValidTransferAmount || state.isTransferring}
      >
        {state.isTransferring ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          "Continue"
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

export default NexusTransfer;
