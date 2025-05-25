"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Clock } from "lucide-react";
import { useTransactionProgress } from "@/hooks/bridge/useTransactionProgress";
import { formatStepName, getStatusColor } from "@/lib/bridge/formatters";

/**
 * Transaction progress component showing step completion
 */
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

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-sm flex items-center justify-between">
          <span>Transaction Progress</span>
          <span className="text-xs text-muted-foreground">
            {completedStepsCount}/{totalSteps}
          </span>
        </CardTitle>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </CardHeader>

      <CardContent className="space-y-2">
        {progressSteps.map((step, index) => (
          <div key={step.typeID} className="flex items-center gap-2">
            {step.done ? (
              <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
            ) : (
              <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
            )}

            <span
              className={`text-sm ${getStatusColor(
                step.done ? "completed" : "pending"
              )}`}
            >
              {formatStepName(step.type)}
            </span>

            {/* Step indicator */}
            <div className="ml-auto text-xs text-muted-foreground">
              {index + 1}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
