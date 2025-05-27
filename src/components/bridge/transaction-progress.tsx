"use client";

import React from "react";
import { Clock } from "lucide-react";
import { useTransactionProgress } from "@/hooks/bridge/useTransactionProgress";
import { formatStepName } from "@/lib/bridge/formatters";
import { Progress } from "../ui/progress";

export const TransactionProgress: React.FC = () => {
  const {
    progressSteps,
    hasActiveSteps,
    progressPercentage,
    completedStepsCount,
    totalSteps,
  } = useTransactionProgress();

  if (!hasActiveSteps) {
    return null;
  }

  const currentStep = progressSteps.find((step) => !step.done);

  return (
    <div className="flex flex-col items-center gap-y-2 w-full shadow-[var(--ck-primary-button-box-shadow)] !rounded-[var(--ck-primary-button-border-radius)] p-2">
      <div className="flex flex-col items-start gap-y-2 w-full">
        <span className="text-sm font-medium">Transaction Progress</span>
        {currentStep && (
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-x-1 w-full">
              <Clock className="w-3 h-3 text-blue-500" />
              <span className="text-xs text-muted-foreground">
                {formatStepName(currentStep.type)}
              </span>
            </div>
            <span className="text-xs text-muted-foreground">
              {completedStepsCount}/{totalSteps}
            </span>
          </div>
        )}
      </div>
      <Progress value={progressPercentage} />
    </div>
  );
};
