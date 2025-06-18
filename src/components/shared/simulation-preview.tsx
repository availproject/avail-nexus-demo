import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, TrendingUp, ArrowRight, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { SimulationResult } from "avail-nexus-sdk";
import { Separator } from "../ui/separator";
import { ScrollArea } from "../ui/scroll-area";

interface SimulationPreviewProps {
  simulation: SimulationResult | null;
  isSimulating: boolean;
  simulationError?: string | null;
  title?: string;
  className?: string;
}

/**
 * Enhanced simulation preview component for displaying comprehensive bridge/transfer information
 */
export const SimulationPreview: React.FC<SimulationPreviewProps> = ({
  simulation,
  isSimulating,
  simulationError,
  title = "Cost Estimate",
  className,
}) => {
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  const formatCost = (cost: string) => {
    const numCost = parseFloat(cost);
    if (numCost === 0) return "Free";
    if (numCost < 0.001) return "< 0.001";
    return numCost.toFixed(6);
  };

  if (simulationError) {
    return (
      <Card
        className={cn(
          "border-none !shadow-[var(--ck-tertiary-box-shadow)] !rounded-[var(--ck-tertiary-border-radius)] bg-destructive/30",
          className
        )}
      >
        <CardContent className="p-4">
          <div className="text-destructive text-sm font-bold">
            {simulationError}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isSimulating) {
    return (
      <Card
        className={cn(
          "border-none !shadow-[var(--ck-tertiary-box-shadow)] !rounded-[var(--ck-tertiary-border-radius)] bg-accent/10",
          className
        )}
      >
        <CardContent className="p-4 rounded-none">
          <div className="flex items-center justify-center text-primary font-medium">
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
            <span className="text-sm">Calculating costs...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!simulation) {
    return null;
  }

  const { intent, token } = simulation;

  // Compact Preview Component
  const CompactPreview = () => (
    <Card
      className={cn(
        "border-none !shadow-[var(--ck-tertiary-box-shadow)] !rounded-[var(--ck-tertiary-border-radius)] bg-accent/10 py-2",
        className
      )}
    >
      <CardContent className="px-4 py-2 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="text-sm font-bold text-muted-foreground flex items-center gap-x-2">
            <TrendingUp className="w-4 h-4" strokeWidth={2} />
            {title}
          </div>
          <Button
            variant="connectkit"
            size="sm"
            onClick={() => setShowDetailsDialog(true)}
            className="h-6 p-2 text-xs hover:bg-secondary/10 bg-transparent rounded-full font-semibold"
          >
            <Eye className="w-3 h-3 mr-1" />
            View Details
          </Button>
        </div>

        {/* Compact Route Display */}
        <div className="flex items-center gap-2 text-xs">
          {/* Source Summary */}
          <div className="flex flex-col items-center gap-1 p-2 flex-1 rounded-md">
            {intent.sources && intent.sources.length > 1 ? (
              <>
                <div className="flex -space-x-1">
                  {intent.sources.slice(0, 2).map((source, index) => (
                    <Image
                      key={`${source.chainID}-${index}`}
                      src={source.chainLogo ?? ""}
                      alt={source.chainName ?? ""}
                      width={20}
                      height={20}
                      className="rounded-full border border-background"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  ))}
                  {intent.sources.length > 2 && (
                    <div className="w-5 h-5 rounded-full bg-muted-foreground/50 flex items-center justify-center text-[8px] text-white border border-background">
                      +{intent.sources.length - 2}
                    </div>
                  )}
                </div>
                <div className="text-[10px] text-muted-foreground font-bold text-center">
                  {intent.sources.length} chains
                </div>
              </>
            ) : (
              intent.sources?.[0] && (
                <>
                  <Image
                    src={intent.sources[0].chainLogo ?? ""}
                    alt={intent.sources[0].chainName ?? ""}
                    width={20}
                    height={20}
                    className="rounded-full"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                  <div className="text-[10px] text-muted-foreground text-center">
                    {intent.sources[0].chainName}
                  </div>
                </>
              )
            )}
          </div>

          <ArrowRight className="w-6 h-6 text-muted-foreground" />

          {/* Destination */}
          <div className="flex flex-col items-center gap-1 p-2 flex-1 rounded-md">
            <Image
              src={intent.destination.chainLogo ?? ""}
              alt={intent.destination.chainName ?? ""}
              width={20}
              height={20}
              className="rounded-full"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
            <div className="text-[10px] text-muted-foreground text-center">
              {intent.destination.chainName}
            </div>
          </div>
        </div>

        {/* Key Info */}
        <div className="space-y-1">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Total Gas Cost</span>
            <span className="font-bold">
              {formatCost(intent.fees.total ?? "0")} {intent.token?.symbol}
            </span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Total Amount</span>
            <span className="font-bold text-primary">
              {intent.sourcesTotal || intent.destination.amount}{" "}
              {intent.token?.symbol}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // Detailed Dialog Component
  const DetailedDialog = () => (
    <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
      <DialogContent className="max-w-xl bg-accent-foreground border-none !shadow-[var(--ck-modal-box-shadow)] !rounded-[var(--ck-connectbutton-border-radius)]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Transaction Details
          </DialogTitle>
          <DialogDescription>
            Complete breakdown of your bridge transaction
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-96 sm:max-h-[450px]">
          <div className="space-y-4 pr-4">
            {/* Bridge Route Information */}
            {intent?.sources && intent?.destination && intent.token && (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-muted-foreground">
                  Transaction Route
                </h4>
                <div className="flex items-center gap-2 text-xs">
                  {/* Multiple Source Chains */}
                  <div className="flex flex-col gap-2 flex-1">
                    {intent.sources.map((source, index) => (
                      <div
                        key={`${source.chainID}-${index}`}
                        className="flex flex-col justify-center items-center gap-1 p-2 shadow-[var(--ck-tertiary-box-shadow)] !rounded-[var(--ck-tertiary-border-radius)]"
                      >
                        <Image
                          src={source.chainLogo ?? ""}
                          alt={source.chainName ?? ""}
                          width={24}
                          height={24}
                          className="rounded-full"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                        <div className="text-muted-foreground font-bold text-center">
                          {source.amount} {intent.token?.symbol}
                        </div>
                        <div className="text-xs text-muted-foreground/70 text-center">
                          {source.chainName}
                        </div>
                      </div>
                    ))}
                    {/* Show total if multiple sources */}
                    {intent.sources.length > 1 && intent.sourcesTotal && (
                      <div className="text-xs text-center text-muted-foreground font-bold border-t pt-1">
                        Total: {intent.sourcesTotal} {intent.token?.symbol}
                      </div>
                    )}
                  </div>

                  <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />

                  <div className="flex flex-col justify-center items-center gap-y-1 p-2 w-fit shadow-[var(--ck-tertiary-box-shadow)] !rounded-[var(--ck-tertiary-border-radius)]">
                    <Image
                      src={token.logo ?? ""}
                      alt={token.symbol}
                      className="rounded-full"
                      width={24}
                      height={24}
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                    <div className="font-bold text-xs text-muted-foreground">
                      {intent.token.symbol}
                    </div>
                  </div>

                  <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />

                  {/* Destination Chain */}
                  <div className="flex flex-col justify-center items-center gap-1 p-2 flex-1 shadow-[var(--ck-tertiary-box-shadow)] !rounded-[var(--ck-tertiary-border-radius)]">
                    <Image
                      src={intent.destination.chainLogo ?? ""}
                      alt={intent.destination.chainName ?? ""}
                      width={24}
                      height={24}
                      className="rounded-full"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                    <div className="text-muted-foreground font-bold text-center">
                      {intent.destination.amount} {intent.token?.symbol}
                    </div>
                    <div className="text-xs text-muted-foreground/70 text-center">
                      {intent.destination.chainName}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Cost Summary */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-muted-foreground">
                Cost Breakdown
              </h4>
              <div className="space-y-2 font-bold">
                {/* Network Gas */}
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Network Gas
                  </span>
                  <span className="text-sm">
                    {formatCost(intent.fees.caGas ?? "0")}{" "}
                    {intent.token?.symbol}
                  </span>
                </div>

                {/* Solver Fee (if applicable) */}
                {intent.fees.solver && parseFloat(intent.fees.solver) > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Solver Fee
                    </span>
                    <span className="text-sm">
                      {formatCost(intent.fees.solver)} {intent.token?.symbol}
                    </span>
                  </div>
                )}

                {intent.fees.protocol &&
                  parseFloat(intent.fees.protocol) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        Protocol Fee
                      </span>
                      <span className="text-sm">
                        {formatCost(intent.fees.protocol)}{" "}
                        {intent.token?.symbol}
                      </span>
                    </div>
                  )}

                {intent.fees.gasSupplied &&
                  parseFloat(intent.fees.gasSupplied) > 0 && (
                    <div className="flex justify-between text-xs">
                      <span className="text-sm text-muted-foreground">
                        Additional Gas
                      </span>
                      <span className="text-sm">
                        {formatCost(intent.fees.gasSupplied)}{" "}
                        {intent.token?.symbol}
                      </span>
                    </div>
                  )}

                <Separator />

                {/* Total Cost */}
                <div className="flex justify-between items-center pt-1">
                  <span className="text-sm text-primary">Total Cost</span>
                  <span className="text-sm text-primary">
                    {formatCost(intent.fees.total ?? "0")}{" "}
                    {intent.token?.symbol}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );

  return (
    <>
      <CompactPreview />
      <DetailedDialog />
    </>
  );
};
