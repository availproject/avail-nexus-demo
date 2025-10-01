import {
  SUPPORTED_CHAINS_IDS,
  SUPPORTED_TOKENS,
  UserAsset,
  SimulationResult,
} from "@avail-project/nexus-core";
import { ComponentStep } from "@/types/bridge";

export interface TemplateInputField {
  name: string;
  type: "text" | "number" | "address" | "select";
  label: string;
  placeholder?: string;
  description?: string;
  required: boolean;
  options?: { label: string; value: string }[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}

export interface ContractTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: "lending" | "staking" | "defi";

  // Contract details
  contractAddress: string;
  abi: readonly unknown[];
  functionName: string;

  // Chain and token support
  supportedChains: SUPPORTED_CHAINS_IDS[];
  supportedTokens: SUPPORTED_TOKENS[];

  // UI configuration
  inputFields: TemplateInputField[];
  expectedOutcome: string;
  riskLevel: "low" | "medium" | "high";

  // Special handling
  requiresEthValue?: boolean; // For functions that need msg.value
}

export interface BridgeExecuteFormData {
  selectedChain: SUPPORTED_CHAINS_IDS;
  selectedToken: SUPPORTED_TOKENS | undefined;
  bridgeAmount: string;
  selectedTemplate: ContractTemplate | null;
  templateParams: Record<string, string>;
  showAdvanced: boolean;
}

export interface BridgeExecuteState extends BridgeExecuteFormData {
  // Balance state
  availableBalance: UserAsset[];

  // Simulation states
  bridgeSimulation: SimulationResult | null;
  executeSimulation: SimulationResult | null;
  isSimulating: boolean;
  simulationError: string | null;

  // UI states
  isLoading: boolean;
  isExecuting: boolean;
  error: string | null;

  // Progress tracking
  progressSteps: ComponentStep[];
}

export interface BridgeExecuteValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface StepSimulation {
  type: "bridge" | "approval" | "execute";
  required: boolean;
  simulation: SimulationResult | ApprovalSimulation | ExecuteSimulation;
  description: string;
}

export interface ApprovalSimulation {
  gasUsed: string;
  gasPrice: string;
  estimatedCost: {
    wei: string;
    eth: string;
    gwei: string;
  };
  success: boolean;
  error?: string;
}

export interface ExecuteSimulation {
  gasUsed: string;
  gasPrice: string;
  estimatedCost: {
    wei: string;
    eth: string;
    gwei: string;
  };
  success: boolean;
  error?: string;
}
