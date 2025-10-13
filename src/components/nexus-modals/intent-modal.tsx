import React, { useEffect, useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";
import { ArrowRight, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { CHAIN_METADATA, OnIntentHookData } from "@avail-project/nexus-core";
import { useBridgeStore } from "@/store/bridgeStore";
import { toast } from "sonner";

interface IntentModalProps {
  intentModal: OnIntentHookData;
  setIntentModal: (modal: OnIntentHookData | null) => void;
}

interface IntentSource {
  chainID: number;
  chainLogo: string | undefined;
  chainName: string;
  amount: string;
  contractAddress: `0x${string}`;
}

const IntentModal: React.FC<IntentModalProps> = ({
  intentModal,
  setIntentModal,
}) => {
  console.log("intentModal", intentModal);
  const { intent, refresh, allow, deny } = intentModal;
  const { reset } = useBridgeStore();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const formatCost = (cost: string) => {
    const numCost = parseFloat(cost);
    if (numCost === 0) return "Free";
    if (numCost < 0.001) return "< 0.001";
    return numCost.toFixed(6);
  };

  const handleAllow = () => {
    if (isRefreshing) return;
    allow();
    setIntentModal(null);
  };

  const handleDeny = () => {
    deny();
    reset();
    setIntentModal(null);
    toast.info("Transaction denied");
  };

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    toast.info("Refreshing transaction details");
    refresh();
    setIsRefreshing(false);
  }, [refresh]);

  useEffect(() => {
    const interval = setInterval(() => {
      handleRefresh();
    }, 5000);
    return () => clearInterval(interval);
  }, [handleRefresh]);

  return (
    <Dialog
      open={!!intentModal}
      onOpenChange={(isOpen) => !isOpen && handleDeny()}
    >
      <DialogContent className="w-[28rem] bg-accent-foreground border-none !shadow-[var(--ck-modal-box-shadow)] !rounded-[var(--ck-connectbutton-border-radius)] gap-y-3">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Confirm Transaction
          </DialogTitle>
          <DialogDescription>
            Please review the details of this transaction carefully.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-1 py-2">
          {/* Transaction Route */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row items-center gap-1 text-xs">
              {/* Multiple Source Chains */}
              <div className="flex flex-col gap-y-2 flex-1">
                {intent.sources &&
                  intent.sources.map((source: IntentSource, index) => (
                    <div
                      key={`${source.chainID}-${index}`}
                      className="flex flex-col justify-center items-center gap-y-1 px-3 py-2 bg-muted/10 shadow-[var(--ck-tertiary-box-shadow)] !rounded-[var(--ck-tertiary-border-radius)]"
                    >
                      <Image
                        src={CHAIN_METADATA[source.chainID]?.logo ?? ""}
                        alt={source.chainName ?? ""}
                        width={24}
                        height={24}
                        className="rounded-full"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                      <div className="flex items-center gap-x-2">
                        <div className="text-card-foreground font-bold text-center text-sm">
                          {source.amount} {intent.token?.symbol}
                        </div>
                      </div>
                    </div>
                  ))}
                {/* Show total if multiple sources */}
                {intent.sources &&
                  intent.sources.length > 1 &&
                  intent.sourcesTotal && (
                    <div className="text-xs text-center text-muted-foreground font-bold border-t border-muted pt-2">
                      Total: {intent.sourcesTotal} {intent.token?.symbol}
                    </div>
                  )}
              </div>

              <ArrowRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />

              {intent.token && intent.token.logo && (
                <Image
                  src={intent.token.logo}
                  alt={intent.token.symbol}
                  className="rounded-full"
                  width={24}
                  height={24}
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              )}

              <ArrowRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />

              {/* Destination Chain */}
              <div className="flex flex-col justify-center items-center gap-y-1 px-3 py-2 flex-1 bg-muted/10 shadow-[var(--ck-tertiary-box-shadow)] !rounded-[var(--ck-tertiary-border-radius)]">
                {intent.destination && (
                  <>
                    <Image
                      src={
                        CHAIN_METADATA[intent.destination.chainID]?.logo ?? ""
                      }
                      alt={intent.destination.chainName ?? ""}
                      width={24}
                      height={24}
                      className="rounded-full"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                    <div className="text-card-foreground font-bold text-center text-sm">
                      {intent.destination.amount} {intent.token?.symbol}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Fees Section */}
          {intent.fees && (
            <div className="space-y-3 mt-6">
              <div className="p-4 bg-muted/10 rounded-[var(--ck-tertiary-border-radius)] shadow-[var(--ck-tertiary-box-shadow)] space-y-3">
                {/* Individual Fees */}
                <div className="space-y-2 font-semibold">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Network Gas
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {formatCost(intent.fees.caGas ?? "0")}{" "}
                      {intent.token?.symbol}
                    </span>
                  </div>

                  {intent.fees.solver && parseFloat(intent.fees.solver) > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        Solver Fee
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {formatCost(intent.fees.solver)} {intent.token?.symbol}
                      </span>
                    </div>
                  )}

                  {intent.fees.protocol &&
                    parseFloat(intent.fees.protocol) > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">
                          Protocol Fee
                        </span>
                        <span className="text-sm font-medium text-muted-foreground">
                          {formatCost(intent.fees.protocol)}{" "}
                          {intent.token?.symbol}
                        </span>
                      </div>
                    )}

                  {intent.fees.gasSupplied &&
                    parseFloat(intent.fees.gasSupplied) > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">
                          Additional Gas
                        </span>
                        <span className="text-sm font-medium text-muted-foreground">
                          {formatCost(intent.fees.gasSupplied)}{" "}
                          {intent.token?.symbol}
                        </span>
                      </div>
                    )}

                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-muted-foreground">
                      Total Gas Cost
                    </span>
                    <span className="text-sm font-bold text-muted-foreground">
                      {formatCost(intent.fees.total ?? "0")}{" "}
                      {intent.token?.symbol}
                    </span>
                  </div>
                </div>

                <Separator />

                {/* Total Cost */}
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-primary">
                    Total Cost
                  </span>
                  <span className="text-sm font-bold text-primary">
                    {formatCost(intent.sourcesTotal ?? "0")}{" "}
                    {intent.token?.symbol}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="w-11/12 pt-4 mx-auto">
          <div className="flex w-full justify-center items-center gap-4">
            <Button
              variant="connectkit"
              onClick={handleDeny}
              className="bg-destructive/50 font-semibold w-1/2 text-muted-foreground"
            >
              Deny
            </Button>
            <Button
              variant="connectkit"
              onClick={handleAllow}
              disabled={isRefreshing}
              className={cn(
                "font-semibold w-1/2 text-muted-foreground",
                isRefreshing && "bg-gray-500 cursor-not-allowed",
              )}
            >
              {isRefreshing ? "Refreshing..." : "Allow"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default IntentModal;
