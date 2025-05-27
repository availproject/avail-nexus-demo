/**
 * Error types that can occur during bridge operations
 */
export enum BridgeErrorType {
  USER_REJECTED = "USER_REJECTED",
  INSUFFICIENT_FUNDS = "INSUFFICIENT_FUNDS",
  INSUFFICIENT_GAS = "INSUFFICIENT_GAS",
  NETWORK_ERROR = "NETWORK_ERROR",
  ALLOWANCE_REJECTED = "ALLOWANCE_REJECTED",
  UNKNOWN = "UNKNOWN",
}

/**
 * Structured error information
 */
export interface BridgeError {
  type: BridgeErrorType;
  message: string;
  originalError?: Error;
  isRetryable: boolean;
  userFriendlyMessage: string;
}

/**
 * Error patterns to match against error messages
 */
const ERROR_PATTERNS = {
  [BridgeErrorType.USER_REJECTED]: [
    "user rejected",
    "user denied",
    "user cancelled",
    "transaction was rejected",
  ],
  [BridgeErrorType.ALLOWANCE_REJECTED]: [
    "user rejection during setting allowance",
    "allowance rejected",
    "token approval was rejected",
  ],
  [BridgeErrorType.INSUFFICIENT_FUNDS]: [
    "insufficient funds",
    "insufficient balance",
    "not enough balance",
  ],
  [BridgeErrorType.INSUFFICIENT_GAS]: [
    "insufficient funds for gas",
    "gas required exceeds allowance",
    "out of gas",
  ],
  [BridgeErrorType.NETWORK_ERROR]: [
    "network error",
    "connection error",
    "timeout",
    "failed to fetch",
  ],
};

/**
 * User-friendly error messages
 */
const USER_FRIENDLY_MESSAGES = {
  [BridgeErrorType.USER_REJECTED]: "Transaction was cancelled by user",
  [BridgeErrorType.ALLOWANCE_REJECTED]: "Token approval was cancelled",
  [BridgeErrorType.INSUFFICIENT_FUNDS]: "Insufficient balance on source chain",
  [BridgeErrorType.INSUFFICIENT_GAS]: "Insufficient funds for gas fees",
  [BridgeErrorType.NETWORK_ERROR]:
    "Network error - please check your connection",
  [BridgeErrorType.UNKNOWN]: "An unexpected error occurred",
};

/**
 * Determine if an error type is retryable
 */
const RETRYABLE_ERRORS = new Set([
  BridgeErrorType.NETWORK_ERROR,
  BridgeErrorType.UNKNOWN,
]);

/**
 * Categorize an error based on its message
 */
const categorizeError = (errorMessage: string): BridgeErrorType => {
  const lowerMessage = errorMessage.toLowerCase();

  for (const [errorType, patterns] of Object.entries(ERROR_PATTERNS)) {
    if (patterns.some((pattern) => lowerMessage.includes(pattern))) {
      return errorType as BridgeErrorType;
    }
  }

  return BridgeErrorType.UNKNOWN;
};

/**
 * Parse and structure an error from bridge operations
 */
export const parseBridgeError = (error: unknown): BridgeError => {
  let errorMessage = "An unexpected error occurred";
  let originalError: Error | undefined;

  if (error instanceof Error) {
    errorMessage = error.message;
    originalError = error;
  } else if (typeof error === "string") {
    errorMessage = error;
  } else if (error && typeof error === "object" && "message" in error) {
    errorMessage = String((error as { message: unknown }).message);
  }

  // Check the entire error message for patterns first
  const errorType = categorizeError(errorMessage);

  // Extract a clean message for display (still useful for logging)
  const cleanMessage = errorMessage.split(":")[0].trim();

  return {
    type: errorType,
    message: cleanMessage,
    originalError,
    isRetryable: RETRYABLE_ERRORS.has(errorType),
    userFriendlyMessage: USER_FRIENDLY_MESSAGES[errorType],
  };
};

export const formatErrorForUser = (error: unknown): string => {
  const bridgeError = parseBridgeError(error);
  return bridgeError.userFriendlyMessage;
};

export const logBridgeError = (error: unknown, context?: string): void => {
  const bridgeError = parseBridgeError(error);

  console.error("Bridge Error:", {
    context,
    type: bridgeError.type,
    message: bridgeError.message,
    isRetryable: bridgeError.isRetryable,
    originalError: bridgeError.originalError,
  });
};
