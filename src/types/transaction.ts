export interface TransactionData {
  explorerURL: string;
  intentHash: number;
  timestamp: number;
  status: "pending" | "completed" | "failed";
  token?: string;
  amount?: string;
  fromChain?: string;
  toChain?: string;
  gasEstimate?: string;
  actualGasUsed?: string;
}

export interface IntentSubmittedData {
  explorerURL: string;
  intentHash: number;
}

export interface StepCompletionEventData {
  typeID: string;
  data?: IntentSubmittedData;
  [key: string]: unknown;
}

export interface TransactionMonitor {
  intentHash: number;
  status: "pending" | "completed" | "failed";
  startTime: number;
  estimatedCompletion?: number;
}

export type TransactionStatus = "pending" | "completed" | "failed";

export interface TransactionHistoryItem extends TransactionData {
  id: string;
}
