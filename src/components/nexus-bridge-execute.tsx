"use client";

import React, { useCallback, useEffect, useMemo } from "react";
import {
  useBridgeExecuteStore,
  bridgeExecuteSelectors,
} from "@/store/bridgeExecuteStore";
import { useNexus } from "@/provider/NexusProvider";
import { CONTRACT_TEMPLATES } from "@/constants/contractTemplates";
import { ScrollArea } from "./ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Infinity, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

// Import components
import ChainSelect from "./blocks/chain-select";
import TokenSelect from "./blocks/token-select";
import TemplateSelector from "./bridge-execute/TemplateSelector";
import { useBridgeExecuteTransaction } from "@/hooks/useBridgeExecuteTransaction";
import { useTransactionProgress } from "@/hooks/useTransactionProgress";
import { SimulationPreview } from "./shared/simulation-preview";
import IntentModal from "./nexus-modals/intent-modal";
import AllowanceModal from "./nexus-modals/allowance-modal";
import { SUPPORTED_CHAINS, TOKEN_METADATA } from "@avail-project/nexus-core";

const NexusBridgeAndExecute = ({ isTestnet }: { isTestnet: boolean }) => {
  const {
    nexusSdk,
    intentModal,
    allowanceModal,
    setIntentModal,
    setAllowanceModal,
  } = useNexus();

  // Store selectors
  const selectedChain = SUPPORTED_CHAINS.BASE;
  const selectedToken = TOKEN_METADATA["USDC"]?.symbol;
  const bridgeAmount = useBridgeExecuteStore(
    bridgeExecuteSelectors.bridgeAmount
  );
  const selectedTemplate = CONTRACT_TEMPLATES[0];

  const availableBalance = useBridgeExecuteStore(
    bridgeExecuteSelectors.availableBalance
  );
  const isLoading = useBridgeExecuteStore(bridgeExecuteSelectors.isLoading);
  const error = useBridgeExecuteStore(bridgeExecuteSelectors.error);
  const canSubmit = useBridgeExecuteStore(bridgeExecuteSelectors.canSubmit);
  const progressSteps = useBridgeExecuteStore(
    bridgeExecuteSelectors.progressSteps
  );

  const setBridgeAmount = useBridgeExecuteStore(
    (state) => state.setBridgeAmount
  );
  const setAvailableBalance = useBridgeExecuteStore(
    (state) => state.setAvailableBalance
  );
  const setLoading = useBridgeExecuteStore((state) => state.setLoading);
  const setSelectedChain = useBridgeExecuteStore(
    (state) => state.setSelectedChain
  );
  const setSelectedToken = useBridgeExecuteStore(
    (state) => state.setSelectedToken
  );
  const setSelectedTemplate = useBridgeExecuteStore(
    (state) => state.setSelectedTemplate
  );

  // Bridge and execute hook
  const {
    executeBridgeAndExecute,
    isExecuting,
    bridgeSimulation,
    executeSimulation,
    isSimulating,
    simulateBridgeAndExecute,
  } = useBridgeExecuteTransaction();

  // Approval UI removed; handled via SDK hooks

  // Progress tracking
  useTransactionProgress();

  // Get selected token balance
  const selectedTokenBalance = useMemo(() => {
    if (!selectedToken || !availableBalance.length) return "0";
    const tokenBalance = availableBalance.find(
      (token) => token.symbol === selectedToken
    );
    return tokenBalance?.balance || "0";
  }, [selectedToken, availableBalance]);

  // Fetch available balance
  const fetchAvailableBalance = useCallback(async () => {
    if (!nexusSdk) return;

    try {
      setLoading(true);
      const balance = await nexusSdk.getUnifiedBalances();
      setAvailableBalance(balance);
    } catch (error) {
      console.error("Error fetching balances:", error);
      toast.error("Failed to fetch balances");
    } finally {
      setLoading(false);
    }
  }, [nexusSdk, setLoading, setAvailableBalance]);

  // Handle form submission
  const handleSubmit = useCallback(async () => {
    if (!canSubmit || !selectedTemplate || !nexusSdk) return;
    const result = await executeBridgeAndExecute();

    if (result?.success) {
      // Refresh balance after successful transaction
      fetchAvailableBalance();
      toast.success("Bridge & Execute completed successfully!");
    }
  }, [
    canSubmit,
    selectedTemplate,
    nexusSdk,
    executeBridgeAndExecute,
    fetchAvailableBalance,
  ]);

  // Handle amount input changes
  const handleAmountChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setBridgeAmount(e.target.value);
    },
    [setBridgeAmount]
  );

  // Set max amount
  const setMaxAmount = useCallback(() => {
    if (selectedTokenBalance && Number.parseFloat(selectedTokenBalance) > 0) {
      setBridgeAmount(selectedTokenBalance);
    }
  }, [selectedTokenBalance, setBridgeAmount]);

  // Handle approval dialog
  // Manual allowance actions removed

  // Check if approval is needed based on simulation
  // Approval requirement surfaced by SDK via allowance hook modal

  // Validation helpers for safe access (no multi-step result used in UI)

  // Load balances on mount
  useEffect(() => {
    if (!availableBalance.length && !isLoading) {
      fetchAvailableBalance();
    }
  }, [availableBalance.length, isLoading, fetchAvailableBalance]);

  // Set hardcoded values in store on mount
  useEffect(() => {
    setSelectedChain(SUPPORTED_CHAINS.BASE);
    setSelectedToken("USDC");
    setSelectedTemplate(CONTRACT_TEMPLATES[0]);
  }, [setSelectedChain, setSelectedToken, setSelectedTemplate]);

  // Auto-trigger simulation when bridge execute parameters change
  useEffect(() => {
    if (bridgeAmount && Number.parseFloat(bridgeAmount) > 0) {
      // Debounce the simulation to avoid too many calls
      const timer = setTimeout(() => {
        simulateBridgeAndExecute();
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [bridgeAmount]);

  if (!nexusSdk || isTestnet) return null;

  return (
    <ScrollArea className="h-[calc(70vh-100px)] no-scrollbar">
      <div className="flex flex-col w-full gap-y-4 py-4">
        <Card className="border-none py-4 !shadow-[var(--ck-connectbutton-box-shadow)] !rounded-[var(--ck-connectbutton-border-radius)] bg-accent-foreground">
          <CardHeader>
            <CardTitle className="text-lg">Bridge Setup</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Chain Selection */}
            <ChainSelect
              selectedChain={8453}
              handleSelect={() => {}}
              disabled={true}
              chainLabel="Destination Chain"
              isTestnet={isTestnet}
            />

            {/* Token Selection */}
            <TokenSelect
              selectedToken={"USDC"}
              selectedChain={selectedChain.toString()}
              handleTokenSelect={() => {}}
              isTestnet={isTestnet}
              disabled={true}
            />

            {/* Amount Input */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Amount</Label>
              <div className="relative">
                <div className="w-full flex items-center gap-x-2 shadow-[var(--ck-connectbutton-box-shadow)] rounded-[var(--ck-connectbutton-border-radius)]">
                  <Input
                    type="text"
                    placeholder="0.0"
                    value={bridgeAmount || ""}
                    onChange={handleAmountChange}
                    disabled={!selectedToken || isExecuting}
                    className="border-none focus-visible:ring-0 focus-visible:ring-offset-0 shadow-[var(--ck-connectbutton-box-shadow)] rounded-[var(--ck-connectbutton-border-radius)]"
                  />
                </div>
                {selectedToken && (
                  <div className="absolute right-12 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    {selectedToken}
                  </div>
                )}
                {selectedToken &&
                  Number.parseFloat(selectedTokenBalance) > 0 && (
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
            </div>
          </CardContent>
        </Card>

        <TemplateSelector selectedTemplate={selectedTemplate} disabled={true} />

        {/* Simulation Loading */}
        {bridgeAmount &&
          Number.parseFloat(bridgeAmount) > 0 &&
          isSimulating && (
            <Card className="w-full border-none py-4 !shadow-[var(--ck-connectbutton-box-shadow)] !rounded-[var(--ck-connectbutton-border-radius)] bg-accent-foreground">
              <CardContent className="p-4">
                <div className="flex items-center justify-center space-x-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                  <span className="text-sm font-medium">
                    Simulating bridge & execute transaction...
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

        {/* Simulation Results */}
        {bridgeAmount &&
          Number.parseFloat(bridgeAmount) > 0 &&
          !isSimulating && (
            <div className="space-y-4">
              {bridgeSimulation && (
                <SimulationPreview
                  simulation={bridgeSimulation}
                  isSimulating={isSimulating}
                  simulationError={null}
                  title="Bridge Cost Estimate"
                  className="w-full"
                />
              )}

              {executeSimulation && (
                <Card className="w-full border-none py-4 !shadow-[var(--ck-connectbutton-box-shadow)] !rounded-[var(--ck-connectbutton-border-radius)] bg-accent-foreground">
                  <CardContent className="p-4">
                    <div className="text-lg font-semibold mb-2">
                      Execute Cost Estimate
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Gas Used</span>
                        <span className="font-medium">
                          {String(executeSimulation.gasUsed ?? "0")}
                        </span>
                      </div>
                      {/* No status flag in new ExecuteSimulation; showing gas used only */}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

        {/* Progress Tracking */}
        {progressSteps.length > 0 && (
          <Card className="border-none py-4 !shadow-[var(--ck-connectbutton-box-shadow)] !rounded-[var(--ck-connectbutton-border-radius)] bg-accent-foreground">
            <CardHeader>
              <CardTitle className="text-lg">Transaction Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {progressSteps.map((step) => (
                  <div
                    key={step.typeID}
                    className="flex items-center gap-2 text-sm"
                  >
                    <div
                      className={`w-2 h-2 rounded-full ${
                        step.done ? "bg-green-500" : "bg-gray-300"
                      }`}
                    />
                    <span className={step.done ? "text-green-600" : ""}>
                      {step.type}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error Display */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <span className="text-sm text-red-700">{error}</span>
          </div>
        )}

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

        <Button
          onClick={handleSubmit}
          disabled={!canSubmit || isExecuting}
          className="w-full font-semibold  bg-accent-foreground"
          variant="connectkit"
        >
          {isExecuting
            ? "Processing..."
            : !selectedTemplate
            ? "Select a Protocol"
            : !selectedToken
            ? "Select Token"
            : !bridgeAmount || Number.parseFloat(bridgeAmount) <= 0
            ? "Enter Amount"
            : "Bridge & Execute"}
        </Button>
      </div>

      {/* Manual approval dialog removed; SDK modal handles approvals */}
    </ScrollArea>
  );
};

export default NexusBridgeAndExecute;
