"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

// Import components
import ChainSelect from "./blocks/chain-select";
import TokenSelect from "./blocks/token-select";
import TemplateSelector from "./bridge-execute/TemplateSelector";
import TemplateInputs from "./bridge-execute/TemplateInputs";
import { useBridgeExecuteTransaction } from "@/hooks/useBridgeExecuteTransaction";
import { useTransactionProgress } from "@/hooks/useTransactionProgress";
import { SimulationPreview } from "./shared/simulation-preview";
import IntentModal from "./nexus-modals/intent-modal";
import AllowanceModal from "./nexus-modals/allowance-modal";

const NexusBridgeAndExecute = () => {
  const {
    nexusSdk,
    intentModal,
    allowanceModal,
    setIntentModal,
    setAllowanceModal,
  } = useNexus();

  if (!nexusSdk) return null;

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
    multiStepResult,
    isSimulating,
    simulateBridgeAndExecute,
    setTokenAllowance,
    isSettingAllowance,
    currentAllowance,
  } = useBridgeExecuteTransaction();

  // Approval dialog state
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [approvalAmount, setApprovalAmount] = useState("");
  const [isUnlimitedApproval, setIsUnlimitedApproval] = useState(false);

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
    console.log("Templates for chain:", selectedChain, templates);

    if (selectedToken) {
      console.log("Filtering templates for token:", selectedToken);
      templates = templates.filter((template) => {
        const includes = template.supportedTokens.includes(selectedToken);
        console.log(
          `Template ${template.name} supports token ${selectedToken}:`,
          includes
        );
        return includes;
      });
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

  // Handle approval dialog
  const handleOpenApprovalDialog = useCallback(() => {
    // Use destination amount from bridge simulation as minimum (this is what arrives on destination chain)
    const destinationAmount =
      multiStepResult?.bridgeSimulation?.intent?.destination?.amount;
    const minAmount = destinationAmount || bridgeAmount || "0.01";
    setApprovalAmount(minAmount);
    setIsUnlimitedApproval(false);
    setShowApprovalDialog(true);
  }, [multiStepResult, bridgeAmount]);

  const handleSetAllowance = useCallback(async () => {
    const amount = isUnlimitedApproval ? "1000000" : approvalAmount; // 1M tokens for unlimited
    const result = await setTokenAllowance(amount);

    if (result.success) {
      toast.success("Token allowance set successfully!");
      setShowApprovalDialog(false);
    } else {
      toast.error("Failed to set token allowance");
    }
  }, [approvalAmount, isUnlimitedApproval, setTokenAllowance]);

  // Check if approval is needed based on simulation
  const needsApproval = useMemo(() => {
    return multiStepResult?.metadata?.approvalRequired || false;
  }, [multiStepResult]);

  // Validation helpers for safe access
  const isValidMultiStepResult = useMemo(() => {
    return (
      multiStepResult &&
      multiStepResult.steps &&
      multiStepResult.steps.length > 0 &&
      multiStepResult.totalEstimatedCost
    );
  }, [multiStepResult]);

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

  // Auto-trigger simulation when bridge execute parameters change
  useEffect(() => {
    if (
      selectedToken &&
      bridgeAmount &&
      selectedTemplate &&
      selectedChain &&
      parseFloat(bridgeAmount) > 0
    ) {
      // Debounce the simulation to avoid too many calls
      const timer = setTimeout(() => {
        simulateBridgeAndExecute();
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [
    selectedToken,
    bridgeAmount,
    selectedTemplate,
    selectedChain,
    simulateBridgeAndExecute,
  ]);

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
          <Card className="border-none py-4 !shadow-[var(--ck-connectbutton-box-shadow)] !rounded-[var(--ck-connectbutton-border-radius)] bg-accent-foreground gap-y-1">
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

        {/* Show fallback when token is selected but no templates available */}
        {selectedToken && availableTemplates.length === 0 && (
          <Card className="border-none py-0 !shadow-[var(--ck-connectbutton-balance-connectbutton-box-shadow)] !rounded-full bg-destructive/30">
            <CardContent className="px-1">
              <div className="text-center py-2">
                <p className="text-muted-foreground font-semibold text-[0.8rem]">
                  No protocols available for the selected chain and token
                  combination.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Simulation Loading */}
        {selectedToken &&
          bridgeAmount &&
          selectedTemplate &&
          parseFloat(bridgeAmount) > 0 &&
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
        {selectedToken &&
          bridgeAmount &&
          selectedTemplate &&
          multiStepResult &&
          parseFloat(bridgeAmount) > 0 &&
          !isSimulating && (
            <div className="space-y-4">
              {/* Simulation Error Display */}
              {multiStepResult.error && (
                <Card className="w-full border-red-500 bg-red-50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                      <div>
                        <div className="text-lg font-semibold mb-1 text-red-800">
                          Simulation Failed
                        </div>
                        <div className="text-sm text-red-700">
                          {multiStepResult.error}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Successful Simulation Display */}
              {!multiStepResult.error && isValidMultiStepResult && (
                <div className="space-y-4">
                  {/* Total Cost Summary */}
                  <Card className="w-full border-none py-4 !shadow-[var(--ck-connectbutton-box-shadow)] !rounded-[var(--ck-connectbutton-border-radius)] bg-accent-foreground">
                    <CardContent className="p-4">
                      <div className="text-lg font-semibold mb-2">
                        Total Estimated Cost
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Bridge</span>
                          <span className="font-medium">
                            {
                              multiStepResult.totalEstimatedCost?.breakdown
                                .bridge
                            }{" "}
                            {selectedToken}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Execute</span>
                          <span className="font-medium">
                            {parseFloat(
                              multiStepResult.totalEstimatedCost?.breakdown
                                .execute ?? "0"
                            ).toFixed(6)}{" "}
                            {selectedToken}
                          </span>
                        </div>
                        <div className="border-t pt-2 mt-2">
                          <div className="flex justify-between font-semibold">
                            <span>Total</span>
                            <span>
                              {parseFloat(
                                multiStepResult.totalEstimatedCost?.total ?? "0"
                              ).toFixed(6)}{" "}
                              {selectedToken}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Approval Management */}
                  {needsApproval && selectedToken && (
                    <Card className="w-full border-blue-500 bg-blue-50">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-lg font-semibold mb-1 text-blue-800">
                              🔐 Token Approval Required
                            </div>
                            <div className="text-sm text-blue-700">
                              {selectedToken} needs approval to interact with
                              the protocol
                            </div>
                            {currentAllowance && (
                              <div className="text-xs text-blue-600 mt-1">
                                Current allowance: {currentAllowance}
                              </div>
                            )}
                          </div>
                          <Button
                            onClick={handleOpenApprovalDialog}
                            disabled={isSettingAllowance}
                            className="bg-blue-600 hover:bg-blue-700"
                            size="sm"
                          >
                            {isSettingAllowance
                              ? "Setting..."
                              : "Set Allowance"}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Steps Breakdown */}
                  <div className="space-y-3">
                    {multiStepResult.steps.map((step, index) => (
                      <Card
                        key={index}
                        className="w-full border-none py-3 !shadow-[var(--ck-connectbutton-box-shadow)] !rounded-[var(--ck-connectbutton-border-radius)] bg-accent-foreground"
                      >
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-sm font-medium">
                                Step {index + 1}:{" "}
                                {step.type.charAt(0).toUpperCase() +
                                  step.type.slice(1)}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {step.description}
                              </div>
                            </div>
                            <div className="text-right">
                              {step.type === "bridge" &&
                                step.simulation &&
                                typeof step.simulation === "object" &&
                                "intent" in step.simulation && (
                                  <div className="text-xs">
                                    <div>
                                      Cost: {step.simulation.intent.fees.total}{" "}
                                    </div>
                                    <div className="text-green-600">
                                      ✓ Ready
                                    </div>
                                  </div>
                                )}
                              {step.type === "execute" &&
                                step.simulation &&
                                typeof step.simulation === "object" &&
                                "success" in step.simulation && (
                                  <div className="text-xs">
                                    <div>
                                      Cost:{" "}
                                      {parseFloat(
                                        step.simulation.gasUsed
                                      ).toFixed(6)}
                                    </div>
                                    <div
                                      className={
                                        step.simulation.success
                                          ? "text-green-600"
                                          : "text-yellow-600"
                                      }
                                    >
                                      {step.simulation.success
                                        ? "✓ Ready"
                                        : "⏳ Pending Approval"}
                                    </div>
                                  </div>
                                )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Legacy Simulation Display (fallback) */}
              {!multiStepResult.error &&
                !isValidMultiStepResult &&
                (bridgeSimulation || executeSimulation) && (
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
                              <span className="text-muted-foreground">
                                Gas Cost
                              </span>
                              <span className="font-medium">
                                {executeSimulation.gasUsed ?? "0"}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">
                                Status
                              </span>
                              <span className="font-medium">
                                {executeSimulation.success
                                  ? "Success"
                                  : "Failed"}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
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
            : !bridgeAmount || parseFloat(bridgeAmount) <= 0
            ? "Enter Amount"
            : "Bridge & Execute"}
        </Button>
      </div>

      {/* Approval Dialog */}
      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Set Token Allowance</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-sm text-gray-600">
              Set how much {selectedToken} the protocol can spend on your
              behalf.
              {multiStepResult?.bridgeSimulation?.intent?.destination
                ?.amount && (
                <div className="mt-1 text-xs text-blue-600">
                  Note: You&apos;ll receive{" "}
                  {multiStepResult.bridgeSimulation.intent.destination.amount}{" "}
                  {selectedToken} after bridging
                </div>
              )}
            </div>

            <div className="space-y-3">
              <RadioGroup
                value={isUnlimitedApproval ? "unlimited" : "limited"}
                onValueChange={(value) =>
                  setIsUnlimitedApproval(value === "unlimited")
                }
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="limited" id="limited" />
                  <Label htmlFor="limited" className="text-sm font-medium">
                    Set specific amount
                  </Label>
                </div>

                {!isUnlimitedApproval && (
                  <div className="pl-6 space-y-2">
                    <Label htmlFor="approval-amount" className="text-sm">
                      Amount (minimum:{" "}
                      {multiStepResult?.bridgeSimulation?.intent?.destination
                        ?.amount ||
                        bridgeAmount ||
                        "0.01"}{" "}
                      {selectedToken})
                    </Label>
                    <Input
                      id="approval-amount"
                      type="number"
                      step="0.000001"
                      min={
                        multiStepResult?.bridgeSimulation?.intent?.destination
                          ?.amount ||
                        bridgeAmount ||
                        "0.01"
                      }
                      value={approvalAmount}
                      onChange={(e) => setApprovalAmount(e.target.value)}
                      placeholder={`Enter amount of ${selectedToken}`}
                    />
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="unlimited" id="unlimited" />
                  <Label
                    htmlFor="unlimited"
                    className="text-sm font-medium flex items-center gap-2"
                  >
                    Unlimited approval <Infinity className="w-4 h-4" />
                  </Label>
                </div>

                {isUnlimitedApproval && (
                  <div className="pl-6 text-xs text-gray-500">
                    You won&apos;t need to approve this token again for this
                    protocol.
                  </div>
                )}
              </RadioGroup>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowApprovalDialog(false)}
                className="flex-1"
                disabled={isSettingAllowance}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSetAllowance}
                disabled={
                  isSettingAllowance ||
                  (!isUnlimitedApproval &&
                    (!approvalAmount ||
                      parseFloat(approvalAmount) <
                        parseFloat(
                          multiStepResult?.bridgeSimulation?.intent?.destination
                            ?.amount ||
                            bridgeAmount ||
                            "0"
                        )))
                }
                className="flex-1"
              >
                {isSettingAllowance ? "Setting..." : "Set Allowance"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </ScrollArea>
  );
};

export default NexusBridgeAndExecute;
