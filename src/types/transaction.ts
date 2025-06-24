export type TransactionType =
  | "bridge"
  | "transfer"
  | "execute"
  | "bridge-execute";

export interface IntentSubmittedData {
  explorerURL: string;
  intentHash: number;
}

export interface StepCompletionEventData {
  typeID: string;
  data?: {
    explorerURL?: string;
    [key: string]: unknown;
  };
}

export interface TransactionMonitor {
  intentHash: number;
  status: "pending" | "completed" | "failed";
  startTime: number;
  estimatedCompletion?: number;
}

export type TransactionStatus = "pending" | "completed" | "failed";
