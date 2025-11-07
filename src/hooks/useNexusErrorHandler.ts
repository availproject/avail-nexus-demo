import { ERROR_CODES, NexusError } from "@avail-project/nexus-core";
import { toast } from "sonner";
export function handleError(err: unknown, context?: string) {
  if (err instanceof NexusError) {
    const base = `[${err.code}] ${err.message}`;
    if (context) {
      // eslint-disable-next-line no-console
      console.error(`${context}: ${base}`);
    } else {
      // eslint-disable-next-line no-console
      console.error(base);
    }

    switch (err.code) {
      case ERROR_CODES.USER_DENIED_INTENT:
      case ERROR_CODES.USER_DENIED_ALLOWANCE:
      case ERROR_CODES.USER_DENIED_INTENT_SIGNATURE:
      case ERROR_CODES.USER_DENIED_SIWE_SIGNATURE:
        toast.error("You rejected the transaction. Please try again.");
        break;
      case ERROR_CODES.INSUFFICIENT_BALANCE:
        toast.error("Insufficient balance.");
        break;
      case ERROR_CODES.TRON_DEPOSIT_FAIL:
      case ERROR_CODES.FUEL_DEPOSIT_FAIL:
        toast.error("Deposit failed. Please retry.");
        break;
      default:
        // eslint-disable-next-line no-console
        console.error("Unexpected NexusError:", err.toJSON());
        toast.error(err.message);
    }
    return;
  }

  // Non-Nexus errors
  // eslint-disable-next-line no-console
  console.error("Unexpected error:", err);
  toast.error("Unexpected error occurred");
}
export function useNexusErrorHandler() {
  return { handleError };
}
