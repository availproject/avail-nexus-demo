import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, DollarSign, TrendingUp, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface SimulationData {
  estimatedGas: string;
  bridgeFee?: string;
  totalCost: string;
  estimatedTime: number;
  breakdown?: {
    networkFee?: string;
    protocolFee?: string;
    solverFee?: string;
    gasSupplied?: string;
  };
  // Enhanced simulation data from SDK
  intent?: {
    destination?: {
      amount: string;
      chainID: number;
      chainLogo: string;
      chainName: string;
    };
    sources?: Array<{
      amount: string;
      chainID: number;
      chainLogo: string;
      chainName: string;
      contractAddress?: string;
    }>;
    sourcesTotal?: string;
    token?: {
      decimals: number;
      logo: string;
      name: string;
      symbol: string;
    };
  };
}

interface SimulationPreviewProps {
  simulation: SimulationData | null;
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
      <Card className={cn("border-red-200 bg-red-50", className)}>
        <CardContent className="p-4">
          <div className="text-red-600 text-sm">Error: {simulationError}</div>
        </CardContent>
      </Card>
    );
  }

  if (isSimulating) {
    return (
      <Card className={cn("border-blue-200 bg-blue-50", className)}>
        <CardContent className="p-4">
          <div className="flex items-center justify-center text-blue-600">
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

  const { intent } = simulation;

  return (
    <Card className={cn("border-green-200 bg-green-50", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-green-700 flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        {/* Token Information */}
        {intent?.token && (
          <div className="flex items-center gap-2 p-2 bg-white rounded border">
            <img
              src={intent.token.logo}
              alt={intent.token.symbol}
              className="w-6 h-6 rounded-full"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
            <div>
              <div className="font-medium text-sm">{intent.token.name}</div>
              <div className="text-xs text-muted-foreground">
                {intent.token.symbol}
              </div>
            </div>
          </div>
        )}

        {/* Bridge Route Information */}
        {intent?.sources && intent?.destination && (
          <div className="space-y-2">
            <div className="text-xs font-medium text-muted-foreground">
              Bridge Route
            </div>
            <div className="flex items-center gap-2 text-xs">
              {/* Source Chain */}
              <div className="flex items-center gap-1 bg-white p-2 rounded border flex-1">
                <img
                  src={intent.sources[0]?.chainLogo}
                  alt={intent.sources[0]?.chainName}
                  className="w-4 h-4 rounded-full"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
                <div>
                  <div className="font-medium">
                    {intent.sources[0]?.chainName}
                  </div>
                  <div className="text-muted-foreground">
                    {intent.sources[0]?.amount} {intent.token?.symbol}
                  </div>
                </div>
              </div>

              <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />

              {/* Destination Chain */}
              <div className="flex items-center gap-1 bg-white p-2 rounded border flex-1">
                <img
                  src={intent.destination.chainLogo}
                  alt={intent.destination.chainName}
                  className="w-4 h-4 rounded-full"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
                <div>
                  <div className="font-medium">
                    {intent.destination.chainName}
                  </div>
                  <div className="text-muted-foreground">
                    {intent.destination.amount} {intent.token?.symbol}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Cost Summary */}
        <div className="space-y-2">
          {/* Network Gas */}
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <DollarSign className="w-3 h-3" />
              Network Gas
            </span>
            <span className="text-sm font-medium">
              {formatCost(simulation.estimatedGas)}
            </span>
          </div>

          {/* Solver Fee (if applicable) */}
          {simulation.bridgeFee && parseFloat(simulation.bridgeFee) > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Solver Fee</span>
              <span className="text-sm font-medium">
                {formatCost(simulation.bridgeFee)}
              </span>
            </div>
          )}

          {/* Total Cost */}
          <div className="flex justify-between items-center pt-1 border-t border-green-200">
            <span className="text-sm font-semibold text-green-700">
              Total Cost
            </span>
            <span className="text-sm font-bold text-green-700">
              {formatCost(simulation.totalCost)}
            </span>
          </div>
        </div>

        {/* Fee Breakdown (if available) */}
        {simulation.breakdown && (
          <div className="pt-2 border-t border-green-200">
            <div className="text-xs text-muted-foreground mb-1">
              Fee Breakdown:
            </div>
            {simulation.breakdown.networkFee && (
              <div className="flex justify-between text-xs">
                <span>Network Gas</span>
                <span>{formatCost(simulation.breakdown.networkFee)}</span>
              </div>
            )}
            {simulation.breakdown.protocolFee &&
              parseFloat(simulation.breakdown.protocolFee) > 0 && (
                <div className="flex justify-between text-xs">
                  <span>Protocol Fee</span>
                  <span>{formatCost(simulation.breakdown.protocolFee)}</span>
                </div>
              )}
            {simulation.breakdown.solverFee &&
              parseFloat(simulation.breakdown.solverFee) > 0 && (
                <div className="flex justify-between text-xs">
                  <span>Solver Fee</span>
                  <span>{formatCost(simulation.breakdown.solverFee)}</span>
                </div>
              )}
            {simulation.breakdown.gasSupplied &&
              parseFloat(simulation.breakdown.gasSupplied) > 0 && (
                <div className="flex justify-between text-xs">
                  <span>Additional Gas</span>
                  <span>{formatCost(simulation.breakdown.gasSupplied)}</span>
                </div>
              )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
