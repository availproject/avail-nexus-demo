import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, TrendingUp, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { SimulationResult } from "avail-nexus-sdk";
import { Separator } from "../ui/separator";

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
            Error: {simulationError}
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
  return (
    <Card
      className={cn(
        "border-none !shadow-[var(--ck-tertiary-box-shadow)] !rounded-[var(--ck-tertiary-border-radius)] bg-accent/10 gap-y-1",
        className
      )}
    >
      <CardContent className="pt-0 space-y-3">
        {/* Bridge Route Information */}
        {intent?.sources && intent?.destination && intent.token && (
          <div className="space-y-2">
            <div className="text-sm font-bold text-muted-foreground flex items-center gap-x-2">
              <TrendingUp
                className="w-5 h-5"
                strokeWidth={2}
                fontWeight={"bold"}
              />
              {title}
            </div>
            <div className="flex items-center gap-2 text-xs">
              {/* Source Chain */}
              <div className="flex flex-col justify-center items-center gap-1  p-2 flex-1 shadow-[var(--ck-tertiary-box-shadow)] !rounded-[var(--ck-tertiary-border-radius)]">
                <Image
                  src={intent.sources[0].chainLogo ?? ""}
                  alt={intent.sources[0].chainName ?? ""}
                  width={24}
                  height={24}
                  className="rounded-full"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
                <div className="text-muted-foreground font-bold">
                  {intent.sources[0]?.amount} {intent.token?.symbol}
                </div>
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
              <div className="flex flex-col justify-center items-center gap-1  p-2 flex-1 shadow-[var(--ck-tertiary-box-shadow)] !rounded-[var(--ck-tertiary-border-radius)]">
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

                <div className="text-muted-foreground font-bold">
                  {intent.destination.amount} {intent.token?.symbol}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Cost Summary */}
        <div className="space-y-2 pt-4 font-bold">
          {/* Network Gas */}
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Network Gas</span>
            <span className="text-md">
              {formatCost(intent.fees.caGas ?? "0")}
            </span>
          </div>

          {/* Solver Fee (if applicable) */}
          {intent.fees.solver && parseFloat(intent.fees.solver) > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Solver Fee</span>
              <span className="text-md">{formatCost(intent.fees.solver)}</span>
            </div>
          )}

          {intent.fees.protocol && parseFloat(intent.fees.protocol) > 0 && (
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">
                Protocol Fee
              </span>
              <span className="text-md">
                {formatCost(intent.fees.protocol)}
              </span>
            </div>
          )}

          {intent.fees.gasSupplied &&
            parseFloat(intent.fees.gasSupplied) > 0 && (
              <div className="flex justify-between text-xs">
                <span className="text-sm text-muted-foreground">
                  Additional Gas
                </span>
                <span className="text-md">
                  {formatCost(intent.fees.gasSupplied)}
                </span>
              </div>
            )}

          <Separator />

          {/* Total Cost */}
          <div className="flex justify-between items-center pt-1">
            <span className="text-sm text-primary">Total Cost</span>
            <span className="text-md text-primary">
              {formatCost(intent.fees.total ?? "0")}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
