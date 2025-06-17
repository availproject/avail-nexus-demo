import { useCallback, useState } from "react";
import { useNexus } from "@/provider/NexusProvider";
import { toast } from "sonner";
import { ExecuteParams, ExecuteSimulation } from "avail-nexus-sdk";

/**
 * Simplified execute transaction hook that relies on SDK return types
 */
export const useExecuteTransaction = () => {
  const { nexusSdk } = useNexus();

  // Local state instead of store dependencies
  const [isExecuting, setIsExecuting] = useState(false);
  const [simulation, setSimulation] = useState<ExecuteSimulation | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationError, setSimulationError] = useState<string | null>(null);

  /**
   * Execute transaction with simplified flow
   */
  const executeTransaction = useCallback(
    async (executeParams: ExecuteParams) => {
      if (
        !executeParams.contractAddress ||
        !executeParams.functionName ||
        !executeParams.contractAbi.length ||
        !nexusSdk
      ) {
        const errorMsg = "Missing required parameters for execute transaction";
        toast.error(errorMsg);
        return { success: false, error: errorMsg };
      }

      try {
        setIsExecuting(true);

        console.log("Starting execute transaction:", executeParams);

        // SDK now returns proper ExecuteResult with success/error
        const executeResult = await nexusSdk.execute(executeParams);

        toast.success("Execute transaction completed successfully!");
        return {
          success: true,
          data: executeResult,
          transactionHash: executeResult.transactionHash,
          explorerUrl: executeResult.explorerUrl,
        };
      } catch (error) {
        console.error("Execute transaction failed:", error);

        const errorMessage =
          error instanceof Error ? error.message : "Execute failed";
        toast.error(errorMessage);
        return { success: false, error: errorMessage };
      } finally {
        setIsExecuting(false);
      }
    },
    [nexusSdk]
  );

  /**
   * Simulate execute transaction
   */
  const simulateExecute = useCallback(
    async (executeParams: ExecuteParams) => {
      if (
        !executeParams.contractAddress ||
        !executeParams.functionName ||
        !executeParams.contractAbi.length ||
        !nexusSdk
      ) {
        setSimulation(null);
        return null;
      }

      try {
        setIsSimulating(true);
        setSimulationError(null);

        const result = await nexusSdk.simulateExecute(executeParams);
        setSimulation(result);
        return result;
      } catch (error) {
        console.error("Execute simulation failed:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Simulation failed";
        setSimulationError(errorMessage);
        setSimulation(null);
        return null;
      } finally {
        setIsSimulating(false);
      }
    },
    [nexusSdk]
  );

  return {
    isExecuting,
    executeTransaction,
    simulation,
    isSimulating,
    simulationError,
    simulateExecute,
  };
};
