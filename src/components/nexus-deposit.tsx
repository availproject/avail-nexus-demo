"use client";
import React, { useState, useEffect } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Loader2, Plus, Trash2, Info } from "lucide-react";
import { toast } from "sonner";
import { useNexus } from "@/provider/NexusProvider";
import { SUPPORTED_CHAINS_IDS } from "avail-nexus-sdk";
import ChainSelect from "./blocks/chain-select";
import { SimulationPreview } from "./shared/simulation-preview";
import IntentModal from "./nexus-modals/intent-modal";
import AllowanceModal from "./nexus-modals/allowance-modal";
import { INITIAL_CHAIN } from "@/lib/constants";
import { ScrollArea } from "./ui/scroll-area";

interface DepositState {
  toChainId: SUPPORTED_CHAINS_IDS;
  contractAddress: string;
  functionName: string;
  functionParams: string[];
  contractAbi: string;
  value: string;
  gasLimit: string;
  isDepositing: boolean;
  simulation: any;
  isSimulating: boolean;
  simulationError: string | null;
}

// Example ABIs for common DeFi protocols
const EXAMPLE_ABIS = {
  aave: [
    {
      type: "function",
      name: "supply",
      inputs: [
        { name: "asset", type: "address" },
        { name: "amount", type: "uint256" },
        { name: "onBehalfOf", type: "address" },
        { name: "referralCode", type: "uint16" },
      ],
      outputs: [],
      stateMutability: "nonpayable",
    },
  ],
  compound: [
    {
      type: "function",
      name: "supply",
      inputs: [
        { name: "asset", type: "address" },
        { name: "amount", type: "uint256" },
      ],
      outputs: [],
      stateMutability: "nonpayable",
    },
  ],
  staking: [
    {
      type: "function",
      name: "stake",
      inputs: [{ name: "amount", type: "uint256" }],
      outputs: [],
      stateMutability: "nonpayable",
    },
  ],
  deposit: [
    {
      type: "function",
      name: "deposit",
      inputs: [
        { name: "amount", type: "uint256" },
        { name: "onBehalfOf", type: "address" },
      ],
      outputs: [],
      stateMutability: "payable",
    },
  ],
};

const NexusDeposit = () => {
  const [state, setState] = useState<DepositState>({
    toChainId: INITIAL_CHAIN,
    contractAddress: "",
    functionName: "",
    functionParams: [],
    contractAbi: "",
    value: "",
    gasLimit: "",
    isDepositing: false,
    simulation: null,
    isSimulating: false,
    simulationError: null,
  });

  const {
    nexusSdk,
    intentModal,
    allowanceModal,
    setIntentModal,
    setAllowanceModal,
  } = useNexus();

  const handleChainSelect = (chainId: SUPPORTED_CHAINS_IDS) => {
    setState({ ...state, toChainId: chainId });
  };

  const handleInputChange = (
    field: keyof DepositState,
    value: string | string[]
  ) => {
    setState({ ...state, [field]: value });
  };

  const addFunctionParam = () => {
    setState({
      ...state,
      functionParams: [...state.functionParams, ""],
    });
  };

  const removeFunctionParam = (index: number) => {
    const newParams = state.functionParams.filter((_, i) => i !== index);
    setState({ ...state, functionParams: newParams });
  };

  const updateFunctionParam = (index: number, value: string) => {
    const newParams = [...state.functionParams];
    newParams[index] = value;
    setState({ ...state, functionParams: newParams });
  };

  const loadExampleABI = (type: keyof typeof EXAMPLE_ABIS) => {
    const abi = EXAMPLE_ABIS[type];
    setState({
      ...state,
      contractAbi: JSON.stringify(abi, null, 2),
      functionName: abi[0].name,
    });
  };

  const runSimulation = async () => {
    if (
      !state.contractAddress ||
      !state.functionName ||
      !state.contractAbi ||
      !nexusSdk
    ) {
      return;
    }

    try {
      setState({ ...state, isSimulating: true, simulationError: null });

      let parsedAbi;
      try {
        parsedAbi = JSON.parse(state.contractAbi);
      } catch (error) {
        console.error("Invalid ABI format", error);
        throw new Error("Invalid ABI format");
      }

      const params = {
        toChainId: state.toChainId,
        contractAddress: state.contractAddress,
        contractAbi: parsedAbi,
        functionName: state.functionName,
        functionParams: state.functionParams,
        value: state.value || "0",
        ...(state.gasLimit && { gasLimit: BigInt(state.gasLimit) }),
      };

      const result = await nexusSdk.simulateDeposit(params);

      console.log("Deposit simulation result:", result);

      const simulation = {
        estimatedGas: result?.estimatedCostEth || "0.001",
        totalCost: result?.estimatedCostEth || "0.001",
        estimatedTime: 60,
      };

      setState({ ...state, simulation, isSimulating: false });
    } catch (error) {
      console.error("Deposit simulation failed:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Simulation failed";
      setState({
        ...state,
        simulationError: errorMessage,
        isSimulating: false,
      });
      toast.error(errorMessage);
    }
  };

  const handleDeposit = async () => {
    if (
      !state.contractAddress ||
      !state.functionName ||
      !state.contractAbi ||
      !nexusSdk
    ) {
      toast.error("Please fill all required fields");
      return;
    }

    setState({ ...state, isDepositing: true });

    try {
      let parsedAbi;
      try {
        parsedAbi = JSON.parse(state.contractAbi);
      } catch (error) {
        console.error("Invalid ABI format", error);
        throw new Error("Invalid ABI format");
      }

      const params = {
        toChainId: state.toChainId,
        contractAddress: state.contractAddress,
        contractAbi: parsedAbi,
        functionName: state.functionName,
        functionParams: state.functionParams,
        value: state.value || "0",
        waitForReceipt: true,
        requiredConfirmations: 2,
        ...(state.gasLimit && { gasLimit: BigInt(state.gasLimit) }),
      };

      console.log("Starting deposit transaction:", params);

      const result = await nexusSdk.deposit(params);

      console.log("Deposit result:", result);

      toast.success("Deposit completed successfully!", {
        description: `Transaction: ${result.transactionHash}`,
      });

      // Reset form
      setState({
        ...state,
        contractAddress: "",
        functionName: "",
        functionParams: [],
        contractAbi: "",
        value: "",
        gasLimit: "",
        isDepositing: false,
      });
    } catch (error) {
      console.error("Deposit transaction failed:", error);

      let errorMessage = "Deposit failed";
      if (error instanceof Error) {
        if (error.message.includes("User rejected")) {
          errorMessage = "Transaction was rejected by user";
        } else if (error.message.includes("insufficient funds")) {
          errorMessage = "Insufficient funds for transaction";
        } else if (error.message.includes("gas")) {
          errorMessage = "Insufficient funds for gas fees";
        } else if (error.message.includes("contract")) {
          errorMessage = "Smart contract interaction failed";
        } else {
          errorMessage = error.message.split(":")[0];
        }
      }

      setState({ ...state, isDepositing: false });
      toast.error(errorMessage, {
        description: "Please try again",
      });
    }
  };

  // Auto-run simulation when key parameters change
  useEffect(() => {
    if (
      state.contractAddress &&
      state.functionName &&
      state.contractAbi &&
      !state.isSimulating
    ) {
      const timeoutId = setTimeout(() => {
        runSimulation();
      }, 1000);

      return () => clearTimeout(timeoutId);
    }
  }, [
    state.contractAddress,
    state.functionName,
    state.contractAbi,
    state.functionParams,
  ]);

  const isFormValid =
    state.contractAddress.trim() !== "" &&
    state.functionName.trim() !== "" &&
    state.contractAbi.trim() !== "";

  return (
    <ScrollArea className="h-[calc(100vh-400px)]">
      <div className="flex flex-col gap-4 max-w-lg mx-auto p-4">
        <div className="text-center mb-4">
          <h3 className="text-lg font-semibold">Smart Contract Deposit</h3>
          <p className="text-sm text-muted-foreground">
            Deposit directly to smart contracts after bridging
          </p>
        </div>

        {/* Chain Selection */}
        <div className="space-y-2">
          <ChainSelect
            selectedChain={state.toChainId}
            handleSelect={handleChainSelect}
          />
        </div>

        {/* Contract Address */}
        <div className="space-y-2">
          <Label className="font-bold ">Contract Address *</Label>
          <Input
            type="text"
            placeholder="0x..."
            className="!shadow-[var(--ck-connectbutton-box-shadow)] !rounded-[var(--ck-connectbutton-border-radius)] border-none !focus-visible:none outline-none"
            value={state.contractAddress}
            onChange={(e) =>
              handleInputChange("contractAddress", e.target.value)
            }
          />
        </div>

        {/* Example ABI Templates */}
        <div className="space-y-2">
          <Label className="font-bold">Quick Templates</Label>
          <div className="flex flex-wrap gap-2">
            {Object.keys(EXAMPLE_ABIS).map((type) => (
              <Button
                key={type}
                variant="connectkit"
                size="sm"
                onClick={() =>
                  loadExampleABI(type as keyof typeof EXAMPLE_ABIS)
                }
                className="bg-white rounded-full font-medium"
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        {/* Function Name */}
        <div className="space-y-2">
          <Label className="font-bold">Function Name *</Label>
          <Input
            type="text"
            placeholder="deposit, stake, supply, etc."
            className="!shadow-[var(--ck-connectbutton-box-shadow)] !rounded-[var(--ck-connectbutton-border-radius)] border-none !focus-visible:none outline-none"
            value={state.functionName}
            onChange={(e) => handleInputChange("functionName", e.target.value)}
          />
        </div>

        {/* Function Parameters */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="font-bold">Function Parameters</Label>
            <Button
              variant="connectkit"
              size="sm"
              onClick={addFunctionParam}
              className="bg-white rounded-full font-medium"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Param
            </Button>
          </div>
          {state.functionParams.map((param, index) => (
            <div key={index} className="flex gap-2">
              <Input
                type="text"
                placeholder={`Parameter ${index + 1}`}
                className="!shadow-[var(--ck-connectbutton-box-shadow)] !rounded-[var(--ck-connectbutton-border-radius)] border-none !focus-visible:none outline-none"
                value={param}
                onChange={(e) => updateFunctionParam(index, e.target.value)}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => removeFunctionParam(index)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>

        {/* Value (ETH) */}
        <div className="space-y-2">
          <Label className="font-bold">Value (ETH)</Label>
          <Input
            type="text"
            placeholder="0 (for payable functions)"
            className="!shadow-[var(--ck-connectbutton-box-shadow)] !rounded-[var(--ck-connectbutton-border-radius)] border-none !focus-visible:none outline-none"
            value={state.value}
            onChange={(e) => handleInputChange("value", e.target.value)}
          />
        </div>

        {/* Gas Limit */}
        <div className="space-y-2">
          <Label className="font-bold">Gas Limit (optional)</Label>
          <Input
            type="text"
            placeholder="Auto-estimate if empty"
            className="!shadow-[var(--ck-connectbutton-box-shadow)] !rounded-[var(--ck-connectbutton-border-radius)] border-none !focus-visible:none outline-none"
            value={state.gasLimit}
            onChange={(e) => handleInputChange("gasLimit", e.target.value)}
          />
        </div>

        {/* Simulation Preview */}
        {(state.simulation || state.isSimulating || state.simulationError) && (
          <SimulationPreview
            simulation={state.simulation}
            isSimulating={state.isSimulating}
            simulationError={state.simulationError}
            title="Deposit Cost Estimate"
            className="w-full"
          />
        )}

        {/* Info Box */}
        <div className="p-3 border rounded-lg bg-blue-50 dark:bg-blue-950">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-600 mt-0.5" />
            <div className="text-xs text-blue-700 dark:text-blue-300">
              <p className="font-medium mb-1">How it works:</p>
              <ul className="space-y-1 list-disc list-inside">
                <li>Bridge tokens to target chain</li>
                <li>Execute smart contract function</li>
                <li>Monitor transaction progress</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <Button
          variant="connectkit"
          className="w-full font-semibold"
          onClick={handleDeposit}
          disabled={!isFormValid || state.isDepositing}
        >
          {state.isDepositing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing Deposit...
            </>
          ) : (
            "Execute Deposit"
          )}
        </Button>

        {/* Modals */}
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
    </ScrollArea>
  );
};

export default NexusDeposit;
