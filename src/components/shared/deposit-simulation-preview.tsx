import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { DepositSimulation } from "avail-nexus-sdk";
import { Separator } from "../ui/separator";

interface DepositSimulationPreviewProps {
  simulation: DepositSimulation | null;
  isSimulating: boolean;
  simulationError?: string | null;
  title?: string;
  className?: string;
}

/**
 * Enhanced simulation preview component for displaying comprehensive bridge/transfer information
 */
export const DepositSimulationPreview: React.FC<
  DepositSimulationPreviewProps
> = ({
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

  const { success, estimatedCost, estimatedCostEth } = simulation;
  return (
    <Card
      className={cn(
        "border-none !shadow-[var(--ck-tertiary-box-shadow)] !rounded-[var(--ck-tertiary-border-radius)] bg-accent/10 gap-y-1",
        className
      )}
    >
      <CardContent className="pt-0 space-y-3">
        {/* Bridge Route Information */}
        {success && (
          <div className="space-y-2">
            <div className="text-sm font-bold text-muted-foreground flex items-center gap-x-2">
              <TrendingUp
                className="w-5 h-5"
                strokeWidth={2}
                fontWeight={"bold"}
              />
              {title}
            </div>
          </div>
        )}

        {/* Cost Summary */}
        <div className="space-y-2 pt-4 font-bold">
          {/* Network Gas */}
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Network Gas</span>
            <span className="text-md">{formatCost(estimatedCost ?? "0")}</span>
          </div>

          {/* Solver Fee (if applicable) */}
          {estimatedCostEth && parseFloat(estimatedCostEth) > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Solver Fee</span>
              <span className="text-md">{formatCost(estimatedCostEth)}</span>
            </div>
          )}

          {estimatedCostEth && parseFloat(estimatedCostEth) > 0 && (
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">
                Protocol Fee
              </span>
              <span className="text-md">{formatCost(estimatedCostEth)}</span>
            </div>
          )}

          {estimatedCostEth && parseFloat(estimatedCostEth) > 0 && (
            <div className="flex justify-between text-xs">
              <span className="text-sm text-muted-foreground">
                Additional Gas
              </span>
              <span className="text-md">{formatCost(estimatedCostEth)}</span>
            </div>
          )}

          <Separator />

          {/* Total Cost */}
          <div className="flex justify-between items-center pt-1">
            <span className="text-sm text-primary">Total Cost</span>
            <span className="text-md text-primary">
              {formatCost(estimatedCost ?? "0")}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
