"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useBridgeForm } from "@/hooks/useBridgeForm";
import { useBridgeTransaction } from "@/hooks/useBridgeTransaction";
import { useBridgeStore, bridgeSelectors } from "@/store/bridgeStore";
import { cn } from "@/lib/utils";
import { UserAsset } from "avail-nexus-sdk";
import { Infinity } from "lucide-react";
import ChainSelect from "../blocks/chain-select";
import TokenSelect from "../blocks/token-select";
import { SimulationPreview } from "../shared/simulation-preview";

interface BridgeFormProps {
  availableBalance: UserAsset[];
  onSubmit: () => void;
  isSubmitting?: boolean;
}

/**
 * Bridge form component for chain, token, and amount selection
 */
export const BridgeForm: React.FC<BridgeFormProps> = ({
  availableBalance,
  onSubmit,
  isSubmitting = false,
}) => {
  const {
    selectedChain,
    selectedToken,
    bridgeAmount,
    canSubmit,
    validation,
    handleChainSelect,
    handleTokenSelect,
    handleAmountChange,
    setMaxAmount,
    selectedTokenBalance,
    submissionState,
  } = useBridgeForm(availableBalance);

  // Get simulation data from the bridge transaction hook
  const { simulation, isSimulating } = useBridgeTransaction();
  const simulationError = useBridgeStore(bridgeSelectors.simulationError);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (canSubmit && !isSubmitting) {
      onSubmit();
    }
  };

  return (
    <form onSubmit={handleFormSubmit} className="w-full space-y-4">
      {/* Chain Selection */}
      <div className="space-y-2">
        <ChainSelect
          selectedChain={selectedChain}
          handleSelect={handleChainSelect}
        />
      </div>

      {/* Token Selection */}
      <div className="space-y-2">
        <TokenSelect
          selectedToken={selectedToken}
          selectedChain={selectedChain.toString()}
          handleTokenSelect={handleTokenSelect}
        />
      </div>

      {/* Amount Input */}
      <div className="space-y-2">
        <div className="relative">
          <div className="w-full flex items-center gap-x-2 shadow-[var(--ck-connectbutton-box-shadow)] rounded-[var(--ck-connectbutton-border-radius)]">
            <Input
              type="text"
              placeholder="0.0"
              value={bridgeAmount || ""}
              onChange={handleAmountChange}
              disabled={!selectedToken || isSubmitting}
              className={cn(
                "border-none focus-visible:ring-0 focus-visible:ring-offset-0",
                validation.errorMessage ? "border-red-500" : ""
              )}
            />
          </div>
          {selectedToken && (
            <div className="absolute right-12 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              {selectedToken}
            </div>
          )}
          {selectedToken && parseFloat(selectedTokenBalance) > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={setMaxAmount}
              className="h-auto p-0 text-xs text-primary absolute right-3 top-1/2 -translate-y-1/2 hover:bg-transparent hover:text-secondary cursor-pointer"
            >
              <Infinity />
            </Button>
          )}
        </div>

        {validation.errorMessage && (selectedToken || bridgeAmount) && (
          <div className="text-xs text-red-500">{validation.errorMessage}</div>
        )}
      </div>

      {/* Simulation Preview */}
      {selectedToken && bridgeAmount && parseFloat(bridgeAmount) > 0 && (
        <SimulationPreview
          simulation={simulation}
          isSimulating={isSimulating}
          simulationError={simulationError}
          title="Bridge Cost Estimate"
          className="w-full"
        />
      )}

      {/* Submit Button */}
      <Button
        type="submit"
        variant="connectkit"
        className="w-full font-semibold"
        disabled={!submissionState.ready || isSubmitting}
      >
        {isSubmitting ? "Processing..." : submissionState.reason ?? "Continue"}
      </Button>
    </form>
  );
};
