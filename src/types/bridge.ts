import { SUPPORTED_CHAINS, UserAsset } from "@avail-project/nexus-core";

export type SupportedChainId =
  (typeof SUPPORTED_CHAINS)[keyof typeof SUPPORTED_CHAINS];
export type SupportedToken = "ETH" | "USDC" | "USDT";

export type ProgressStep = {
  type: string;
  typeID: string;
  data?: unknown;
};

export interface ComponentStep extends ProgressStep {
  done: boolean;
}

export interface BridgeFormData {
  selectedChain: SupportedChainId;
  selectedToken: SupportedToken | undefined;
  bridgeAmount: string;
}

export interface BridgeState extends BridgeFormData {
  availableBalance: UserAsset[];
  isLoading: boolean;
  isBridging: boolean;
  error: string | null;
  steps: ComponentStep[];
  showAllowanceModal: boolean;
}

export interface BridgeValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface BridgeTransactionParams {
  chainId: SupportedChainId;
  token: SupportedToken;
  amount: string;
}

export interface AllowanceCheckParams {
  tokens: SupportedToken[];
  amount: number;
  chainId: SupportedChainId;
}
