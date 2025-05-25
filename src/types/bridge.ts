import {
  SUPPORTED_CHAINS,
  ProgressStep,
  UnifiedBalanceResponse,
} from "@avail/nexus-sdk";
import { TransactionData } from "./transaction";

export type SupportedChainId =
  (typeof SUPPORTED_CHAINS)[keyof typeof SUPPORTED_CHAINS];
export type SupportedToken = "ETH" | "USDC" | "USDT";

export interface ComponentStep extends ProgressStep {
  done: boolean;
}

export interface BridgeFormData {
  selectedChain: SupportedChainId;
  selectedToken: SupportedToken | undefined;
  bridgeAmount: string;
}

export interface BridgeState extends BridgeFormData {
  availableBalance: UnifiedBalanceResponse[];
  isLoading: boolean;
  isBridging: boolean;
  error: string | null;
  steps: ComponentStep[];
  currentTransactionData: TransactionData | null;
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
