import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, AlertCircle, XCircle } from "lucide-react";
import useAllowanceManager, {
  AllowanceCheckResult,
} from "@/hooks/useAllowanceManager";
import { toast } from "sonner";
import {
  AllowanceParams,
  SUPPORTED_CHAINS_IDS,
  SUPPORTED_TOKENS,
} from "@avail/nexus-sdk";

interface AllowanceCheckerProps {
  token: SUPPORTED_TOKENS;
  amount: number | string;
  chainId: SUPPORTED_CHAINS_IDS;
  onAllowanceReady?: (hasAllowance: boolean) => void;
  showSetAllowance?: boolean;
  className?: string;
}

const AllowanceChecker: React.FC<AllowanceCheckerProps> = ({
  token,
  amount,
  chainId,
  onAllowanceReady,
  showSetAllowance = true,
  className = "",
}) => {
  const [allowanceResult, setAllowanceResult] =
    useState<AllowanceCheckResult | null>(null);
  const [showSetForm, setShowSetForm] = useState(false);
  const [allowanceType, setAllowanceType] = useState<"min" | "max" | "custom">(
    "min"
  );
  const [customAmount, setCustomAmount] = useState("");

  const {
    checkAllowance,
    setAllowance,
    isCheckingAllowance,
    isSettingAllowance,
  } = useAllowanceManager();

  // Check allowance when params change
  useEffect(() => {
    if (token && amount && chainId) {
      const checkParams: AllowanceParams = {
        tokens: [token],
        amount: parseFloat(amount.toString()),
        chainId,
      };

      checkAllowance(checkParams).then((result) => {
        setAllowanceResult(result);
      });
    }
  }, [token, amount, chainId, checkAllowance]);

  const handleSetAllowance = async () => {
    if (!token || !chainId) return;

    let allowanceValue: string | number;

    switch (allowanceType) {
      case "min":
        allowanceValue = parseFloat(allowanceResult?.requiredAllowance ?? "0");
        break;
      case "max":
        allowanceValue = "max";
        break;
      case "custom":
        if (!customAmount || isNaN(parseFloat(customAmount))) {
          toast.error("Please enter a valid custom amount");
          return;
        }
        allowanceValue = parseFloat(customAmount);
        break;
      default:
        allowanceValue = parseFloat(allowanceResult?.requiredAllowance ?? "0");
    }

    const success = await setAllowance({
      tokens: [token],
      amount: allowanceValue,
      chainId,
    });

    if (success) {
      setShowSetForm(false);
      // Recheck allowance after setting
      const checkParams: AllowanceParams = {
        tokens: [token],
        amount: parseFloat(amount.toString()),
        chainId,
      };

      const result = await checkAllowance(checkParams);
      console.log("recheck result", result);
      setAllowanceResult(result);

      if (result?.hasEnoughAllowance) {
        onAllowanceReady?.(true);
      }
    }
  };

  const formatAmount = (amount: string): string => {
    const num = parseFloat(amount);
    if (num === 0) return "0";
    if (num < 0.000001) return "< 0.000001";
    return num.toFixed(6);
  };

  const handleClose = () => {
    onAllowanceReady?.(false);
  };

  const getAllowanceStatusIcon = () => {
    if (isCheckingAllowance) {
      return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
    }

    if (!allowanceResult) {
      return <XCircle className="w-4 h-4 text-gray-400" />;
    }

    if (allowanceResult.hasEnoughAllowance) {
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    }

    return <AlertCircle className="w-4 h-4 text-yellow-500" />;
  };

  const getAllowanceStatusText = () => {
    if (isCheckingAllowance) return "Checking allowance...";
    if (!allowanceResult) return "Unable to check allowance";
    if (allowanceResult.hasEnoughAllowance) return "Sufficient allowance";
    return "Insufficient allowance";
  };

  const getAllowanceStatusBadge = () => {
    if (isCheckingAllowance) {
      return <Badge variant="secondary">Checking...</Badge>;
    }

    if (!allowanceResult) {
      return <Badge variant="destructive">Unknown</Badge>;
    }

    if (allowanceResult.hasEnoughAllowance) {
      return (
        <Badge variant="default" className="bg-green-500">
          Approved
        </Badge>
      );
    }

    return <Badge variant="destructive">Needs Approval</Badge>;
  };

  return (
    <Card
      className={`!max-w-3xl ${className} bg-accent-foreground !shadow-[var(--ck-modal-box-shadow)] !rounded-[var(--ck-connectbutton-border-radius)] border-none mb-3`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getAllowanceStatusIcon()}
            <CardTitle className="text-sm font-semibold">
              {token} Allowance Status
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {getAllowanceStatusBadge()}
          </div>
        </div>
        <CardDescription className="text-xs font-semibold">
          {getAllowanceStatusText()}
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-0 !max-w-3xl">
        {allowanceResult && (
          <div className="space-y-2 text-xs font-semibold">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Current:</span>
              <span className="font-mono">
                {formatAmount(allowanceResult.currentAllowance)} {token}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Required:</span>
              <span className="font-mono">
                {formatAmount(allowanceResult.requiredAllowance)} {token}
              </span>
            </div>
          </div>
        )}

        {showSetAllowance &&
          allowanceResult &&
          !allowanceResult.hasEnoughAllowance && (
            <div className="mt-3 space-y-3">
              {!showSetForm ? (
                <div className="flex gap-2">
                  <Button
                    variant="connectkit"
                    size="sm"
                    onClick={handleClose}
                    className="flex-1 text-xs font-semibold rounded-[var(--ck-connectbutton-border-radius)] bg-secondary/30"
                  >
                    Skip
                  </Button>
                  <Button
                    variant="connectkit"
                    size="sm"
                    onClick={() => setShowSetForm(true)}
                    className="flex-1 text-xs font-semibold rounded-[var(--ck-connectbutton-border-radius)] bg-primary/30"
                  >
                    Set Allowance
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="space-y-2 ">
                    <Label className="text-xs font-semibold">
                      Allowance Amount
                    </Label>
                    <RadioGroup
                      value={allowanceType}
                      onValueChange={(value) =>
                        setAllowanceType(value as "min" | "max" | "custom")
                      }
                      className="space-y-1 "
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem
                          value="min"
                          id="min"
                          className="w-3 h-3"
                        />
                        <Label htmlFor="min" className="text-xs font-semibold">
                          Minimum Required (
                          {formatAmount(allowanceResult.requiredAllowance)}{" "}
                          {token})
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem
                          value="max"
                          id="max"
                          className="w-3 h-3"
                        />
                        <Label htmlFor="max" className="text-xs font-semibold">
                          Unlimited (Recommended)
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2 font-semibold">
                        <RadioGroupItem
                          value="custom"
                          id="custom"
                          className="w-3 h-3"
                        />
                        <Label
                          htmlFor="custom"
                          className="text-xs font-semibold"
                        >
                          Custom Amount
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {allowanceType === "custom" && (
                    <div className="w-full max-w-sm flex items-center gap-x-2 shadow-[var(--ck-connectbutton-box-shadow)] rounded-[var(--ck-connectbutton-border-radius)]">
                      <Input
                        type="text"
                        placeholder="Enter custom amount"
                        value={customAmount}
                        onChange={(e) => setCustomAmount(e.target.value)}
                        className="!text-xs h-8 font-semibold border-none focus-visible:ring-0 focus-visible:ring-offset-0"
                      />
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      variant="connectkit"
                      size="sm"
                      onClick={() => setShowSetForm(false)}
                      className="w-full flex-1 text-xs h-8 font-semibold !rounded-[var(--ck-connectbutton-border-radius)] !bg-secondary/30"
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="connectkit"
                      size="sm"
                      onClick={handleSetAllowance}
                      disabled={
                        isSettingAllowance ||
                        (allowanceType === "custom" && !customAmount)
                      }
                      className="w-full flex-1 text-xs h-8 font-semibold !rounded-[var(--ck-connectbutton-border-radius)] !bg-primary/30"
                    >
                      {isSettingAllowance ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        "Approve"
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
      </CardContent>
    </Card>
  );
};

export default AllowanceChecker;
