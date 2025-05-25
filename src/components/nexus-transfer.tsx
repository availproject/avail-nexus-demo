"use client";
import React, { useState } from "react";
import ChainSelect from "./chain-select";
import TokenSelect from "./token-select";
import AllowanceChecker from "@/components/allowance-checker";
import { INITIAL_CHAIN } from "@/lib/constants";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useNexus } from "@/provider/NexusProvider";
import useAllowanceManager from "@/hooks/useAllowanceManager";
import { SUPPORTED_CHAINS_IDS, SUPPORTED_TOKENS } from "@avail/nexus-sdk";

interface TransferState {
  selectedChain: SUPPORTED_CHAINS_IDS;
  selectedToken: SUPPORTED_TOKENS | undefined;
  recipientAddress: `0x${string}` | undefined;
  amount: string;
  isTransferring: boolean;
}

const NexusTransfer = () => {
  const [state, setState] = useState<TransferState>({
    selectedChain: INITIAL_CHAIN,
    selectedToken: undefined,
    recipientAddress: undefined,
    amount: "",
    isTransferring: false,
  });
  const { nexusSdk } = useNexus();
  const { ensureAllowance } = useAllowanceManager();

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
      // First, check if we have sufficient allowance for the transaction
      const hasAllowance = await ensureAllowance({
        tokens: [state.selectedToken],
        amount: parseFloat(state.amount),
        chainId: state.selectedChain,
      });

      // If allowance is insufficient, the SDK's onAllowanceHook will automatically trigger
      // the allowance modal when we proceed with the transfer transaction
      // The ensureAllowance function returns false if allowance is insufficient,
      // but we still proceed as the SDK will handle the allowance flow

      console.log(
        "Allowance check result:",
        hasAllowance
          ? "Sufficient"
          : "Insufficient - will trigger allowance modal"
      );

      const transferTxn = await nexusSdk?.transfer({
        token: state.selectedToken,
        amount: state.amount,
        chainId: state.selectedChain,
        recipient: state.recipientAddress,
      });
      console.log("transferTxn", transferTxn);

      // Clear form on successful transfer
      setState({
        ...state,
        amount: "",
        recipientAddress: undefined,
        isTransferring: false,
      });

      toast.success("Transfer completed successfully!");
    } catch (error: unknown) {
      console.error(error);

      // Handle specific error cases
      let errorMessage = "Transfer failed";

      if (error instanceof Error) {
        if (error.message.includes("User rejected")) {
          errorMessage = "Transaction was rejected by user";
        } else if (
          error.message.includes("User rejection during setting allowance")
        ) {
          errorMessage = "Token approval was rejected";
        } else if (error.message.includes("insufficient funds")) {
          errorMessage = "Insufficient funds for transaction";
        } else if (error.message.includes("gas")) {
          errorMessage = "Insufficient funds for gas fees";
        } else {
          errorMessage = error.message.split(":")[0];
        }
      }

      toast.error(errorMessage, {
        description: "Please try again",
        duration: 4000,
      });
    } finally {
      setState({ ...state, isTransferring: false });
    }
  };

  const isValidTransferAmount = state.amount && state.amount !== "";

  return (
    <div className="flex flex-col gap-y-4 py-4">
      <div className="w-full max-w-sm space-y-4">
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
      <div className="w-full max-w-sm flex items-center gap-x-2 shadow-[var(--ck-connectbutton-box-shadow)] rounded-[var(--ck-connectbutton-border-radius)]">
        <Input
          type="text"
          placeholder="Recipient address"
          className="border-none focus-visible:ring-0 focus-visible:ring-offset-0"
          value={state.recipientAddress}
          onChange={handleRecipientAddressChange}
          disabled={!state.selectedToken}
        />
      </div>
      <div className="w-full max-w-sm flex items-center gap-x-2 shadow-[var(--ck-connectbutton-box-shadow)] rounded-[var(--ck-connectbutton-border-radius)]">
        <Input
          type="text"
          placeholder="Amount"
          className="border-none focus-visible:ring-0 focus-visible:ring-offset-0"
          value={state.amount}
          onChange={handleAmountChange}
          disabled={!state.selectedToken}
        />
      </div>

      {/* Allowance Checker - Show when token and amount are selected */}
      {state.selectedToken && state.amount && parseFloat(state.amount) > 0 && (
        <div className="w-full max-w-sm">
          <AllowanceChecker
            token={state.selectedToken}
            amount={parseFloat(state.amount)}
            chainId={state.selectedChain}
            showSetAllowance={true}
            className="text-sm"
          />
        </div>
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
    </div>
  );
};

export default NexusTransfer;
