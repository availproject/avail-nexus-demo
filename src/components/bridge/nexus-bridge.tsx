"use client";

import { useBridgeTransaction } from "@/hooks/useBridgeTransaction";
import { useTransactionProgress } from "@/hooks/useTransactionProgress";
import { useNexus } from "@/provider/NexusProvider";
import { bridgeSelectors, useBridgeStore } from "@/store/bridgeStore";
import { Loader2 } from "lucide-react";
import { useCallback, useEffect } from "react";
import { toast } from "sonner";
import { ScrollArea } from "../ui/scroll-area";
import { TransactionHistory } from "./transaction-history";
import { BridgeForm } from "./bridge-form";
import { TransactionProgress } from "./transaction-progress";
import IntentModal from "../nexus-modals/intent-modal";
import AllowanceModal from "../nexus-modals/allowance-modal";

const NexusBridge: React.FC = () => {
  const {
    nexusSdk,
    intentModal,
    allowanceModal,
    setIntentModal,
    setAllowanceModal,
  } = useNexus();

  const isLoading = useBridgeStore(bridgeSelectors.isLoading);
  const availableBalance = useBridgeStore(bridgeSelectors.availableBalance);
  const transactionSteps = useBridgeStore(bridgeSelectors.progressSteps);

  const setLoading = useBridgeStore((state) => state.setLoading);
  const setAvailableBalance = useBridgeStore(
    (state) => state.setAvailableBalance
  );

  const { executeBridge, isBridging } = useBridgeTransaction();
  useTransactionProgress();

  const fetchAvailableBalance = useCallback(async () => {
    if (!nexusSdk) return;

    try {
      setLoading(true);
      const balance = await nexusSdk.getUnifiedBalances();
      setAvailableBalance(balance);
    } catch (error) {
      console.error("Error fetching balances:", error);
      toast.error("Failed to fetch balances");
    } finally {
      setLoading(false);
    }
  }, [nexusSdk, setLoading, setAvailableBalance]);

  /**
   * Handle bridge form submission
   */
  const handleBridgeSubmit = useCallback(async () => {
    const result = await executeBridge();

    if (result.success) {
      await fetchAvailableBalance();
    }
  }, [executeBridge, fetchAvailableBalance]);

  useEffect(() => {
    if (!availableBalance.length && !isLoading) {
      // fetchAvailableBalance();
    }
  }, [availableBalance.length, isLoading, fetchAvailableBalance]);

  if (isLoading && !availableBalance.length) {
    return (
      <div className="flex items-center justify-center w-full h-48">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <ScrollArea className="h-[calc(60vh-100px)] no-scrollbar">
      <div className="flex flex-col w-full gap-y-4 py-4">
        <TransactionHistory />

        <BridgeForm
          availableBalance={availableBalance}
          onSubmit={handleBridgeSubmit}
          isSubmitting={isBridging}
        />
        {transactionSteps && transactionSteps.length > 0 && (
          <TransactionProgress />
        )}

        {intentModal && (
          <IntentModal
            intentModal={intentModal}
            setIntentModal={setIntentModal}
          />
        )}

        {allowanceModal && (
          <AllowanceModal
            allowanceModal={allowanceModal}
            setAllowanceModal={setAllowanceModal}
          />
        )}
      </div>
    </ScrollArea>
  );
};

export default NexusBridge;
