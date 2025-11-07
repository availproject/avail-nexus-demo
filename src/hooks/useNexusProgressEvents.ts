import { NEXUS_EVENTS, type OnEventParam } from "@avail-project/nexus-core";
import { useBridgeStore } from "@/store/bridgeStore";
import { useBridgeExecuteStore } from "@/store/bridgeExecuteStore";
import type { ProgressStep } from "@/types/bridge";

type TransactionKind = "bridge" | "transfer" | "bridge-execute";

/**
 * Factory for per-call onEvent handlers that feed SDK events into our stores.
 */
export function createOnEvent(
  transactionType: TransactionKind
): OnEventParam["onEvent"] {
  return (event) => {
    const setProgressSteps =
      transactionType === "bridge-execute"
        ? useBridgeExecuteStore.getState().setProgressSteps
        : useBridgeStore.getState().setProgressSteps;

    const updateStepCompletion =
      transactionType === "bridge-execute"
        ? useBridgeExecuteStore.getState().updateStepCompletion
        : useBridgeStore.getState().updateStepCompletion;

    if (event.name === NEXUS_EVENTS.STEPS_LIST) {
      const steps = event.args.map<ProgressStep>((s) => ({
        type: s.type,
        typeID: s.typeID,
        // Preserve any attached data for consumers that need it
        data: (s as unknown as { data?: unknown }).data,
      }));
      // Stores require ComponentStep[] (done flag)
      setProgressSteps(steps.map((s) => ({ ...s, done: false })));
      return;
    }

    if (event.name === NEXUS_EVENTS.STEP_COMPLETE) {
      const step = event.args;
      updateStepCompletion(step.typeID);
      return;
    }
  };
}
