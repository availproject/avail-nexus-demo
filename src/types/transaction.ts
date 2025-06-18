export type TransactionType = "bridge" | "transfer" | "execute";

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
