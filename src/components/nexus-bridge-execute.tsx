"use client";

import React, { useCallback, useEffect, useMemo } from "react";
import {
  useBridgeExecuteStore,
  bridgeExecuteSelectors,
} from "@/store/bridgeExecuteStore";
import { useNexus } from "@/provider/NexusProvider";
import { getTemplatesForChain } from "@/constants/contractTemplates";
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
import TemplateInputs from "./bridge-execute/TemplateInputs";
import { useBridgeExecuteTransaction } from "@/hooks/useBridgeExecuteTransaction";
import { useTransactionProgress } from "@/hooks/useTransactionProgress";
import { SimulationPreview } from "./shared/simulation-preview";

const NexusBridgeAndExecute = () => {
  const { nexusSdk } = useNexus();

  // Store selectors
  const selectedChain = useBridgeExecuteStore(
    bridgeExecuteSelectors.selectedChain
  );
  const selectedToken = useBridgeExecuteStore(
    bridgeExecuteSelectors.selectedToken
  );
  const bridgeAmount = useBridgeExecuteStore(
    bridgeExecuteSelectors.bridgeAmount
  );
  const selectedTemplate = useBridgeExecuteStore(
    bridgeExecuteSelectors.selectedTemplate
  );
  const templateParams = useBridgeExecuteStore(
    bridgeExecuteSelectors.templateParams
  );
  const showAdvanced = useBridgeExecuteStore(
    bridgeExecuteSelectors.showAdvanced
  );
  const availableBalance = useBridgeExecuteStore(
    bridgeExecuteSelectors.availableBalance
  );
  const isLoading = useBridgeExecuteStore(bridgeExecuteSelectors.isLoading);
  const error = useBridgeExecuteStore(bridgeExecuteSelectors.error);
  const canSubmit = useBridgeExecuteStore(bridgeExecuteSelectors.canSubmit);
  const progressSteps = useBridgeExecuteStore(
    bridgeExecuteSelectors.progressSteps
  );

  // Store actions
  const setSelectedChain = useBridgeExecuteStore(
    (state) => state.setSelectedChain
  );
  const setSelectedToken = useBridgeExecuteStore(
    (state) => state.setSelectedToken
  );
  const setBridgeAmount = useBridgeExecuteStore(
    (state) => state.setBridgeAmount
  );
  const setSelectedTemplate = useBridgeExecuteStore(
    (state) => state.setSelectedTemplate
  );
  const setTemplateParam = useBridgeExecuteStore(
    (state) => state.setTemplateParam
  );
  const setShowAdvanced = useBridgeExecuteStore(
    (state) => state.setShowAdvanced
  );
  const setAvailableBalance = useBridgeExecuteStore(
    (state) => state.setAvailableBalance
  );
  const setLoading = useBridgeExecuteStore((state) => state.setLoading);

  // Bridge and execute hook
  const {
    executeBridgeAndExecute,
    isExecuting,
    bridgeSimulation,
    executeSimulation,
    isSimulating,
  } = useBridgeExecuteTransaction();

  // Progress tracking
  useTransactionProgress({
    transactionType: "execute",
    formData: {
      selectedToken,
      amount: bridgeAmount,
      selectedChain: selectedChain.toString(),
    },
  });

  // Get available templates based on selected chain and token
  const availableTemplates = useMemo(() => {
    if (!selectedChain) return [];

    let templates = getTemplatesForChain(selectedChain);

    if (selectedToken) {
      templates = templates.filter((template) =>
        template.supportedTokens.includes(selectedToken)
      );
    }

    return templates;
  }, [selectedChain, selectedToken]);

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
    if (selectedTokenBalance && parseFloat(selectedTokenBalance) > 0) {
      setBridgeAmount(selectedTokenBalance);
    }
  }, [selectedTokenBalance, setBridgeAmount]);

  // Load balances on mount
  useEffect(() => {
    if (!availableBalance.length && !isLoading) {
      fetchAvailableBalance();
    }
  }, [availableBalance.length, isLoading, fetchAvailableBalance]);

  // Clear template when chain/token changes and it's no longer compatible
  useEffect(() => {
    if (
      selectedTemplate &&
      !availableTemplates.some((t) => t.id === selectedTemplate.id)
    ) {
      setSelectedTemplate(null);
    }
  }, [selectedTemplate, availableTemplates, setSelectedTemplate]);

  return (
    <ScrollArea className="h-[calc(60vh-100px)] no-scrollbar">
      <div className="flex flex-col w-full gap-y-4 py-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Bridge Setup</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Chain Selection */}
            <ChainSelect
              selectedChain={selectedChain}
              handleSelect={setSelectedChain}
              chainLabel="Destination Chain"
            />

            {/* Token Selection */}
            <TokenSelect
              selectedToken={selectedToken}
              selectedChain={selectedChain.toString()}
              handleTokenSelect={setSelectedToken}
            />

            {/* Amount Input */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Amount</Label>
              <div className="relative">
                <Input
                  type="text"
                  placeholder="0.0"
                  value={bridgeAmount || ""}
                  onChange={handleAmountChange}
                  disabled={!selectedToken || isExecuting}
                  className="border-none focus-visible:ring-0 focus-visible:ring-offset-0 shadow-[var(--ck-connectbutton-box-shadow)] rounded-[var(--ck-connectbutton-border-radius)]"
                />
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
            </div>
          </CardContent>
        </Card>

        {/* Protocol Selection and Template Inputs */}
        {selectedToken && availableTemplates.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Protocol Selection</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <TemplateSelector
                templates={availableTemplates}
                selectedTemplate={selectedTemplate}
                onSelect={setSelectedTemplate}
              />

              {selectedTemplate && (
                <TemplateInputs
                  template={selectedTemplate}
                  values={templateParams}
                  onChange={setTemplateParam}
                  showAdvanced={showAdvanced}
                  onToggleAdvanced={() => setShowAdvanced(!showAdvanced)}
                />
              )}
            </CardContent>
          </Card>
        )}

        {/* Simulation Preview */}
        {selectedToken &&
          bridgeAmount &&
          selectedTemplate &&
          parseFloat(bridgeAmount) > 0 && (
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
                <Card className="w-full">
                  <CardContent className="p-4">
                    <div className="text-lg font-semibold mb-2">
                      Execute Cost Estimate
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Gas Cost</span>
                        <span className="font-medium">
                          {executeSimulation.estimatedCost || "0"} ETH
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Status</span>
                        <span className="font-medium">
                          {executeSimulation.success ? "Success" : "Failed"}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {isSimulating && (
                <div className="text-center text-sm text-muted-foreground">
                  Simulating bridge & execute transaction...
                </div>
              )}
            </div>
          )}

        {/* Progress Tracking */}
        {progressSteps.length > 0 && (
          <Card>
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

        <Button
          onClick={handleSubmit}
          disabled={!canSubmit || isExecuting}
          className="w-full font-semibold"
          variant="connectkit"
        >
          {isExecuting
            ? "Processing..."
            : !selectedTemplate
            ? "Select a Protocol"
            : !selectedToken
            ? "Select Token"
            : !bridgeAmount || parseFloat(bridgeAmount) <= 0
            ? "Enter Amount"
            : "Bridge & Execute"}
        </Button>
      </div>
    </ScrollArea>
  );
};

export default NexusBridgeAndExecute;
