"use client";

import React from "react";
import { ContractTemplate } from "@/types/bridge-execute";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";

interface TemplateSelectorProps {
  selectedTemplate: ContractTemplate | null;
  className?: string;
  disabled?: boolean;
}

const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  selectedTemplate,
  className,
  disabled = false,
}) => {
  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "low":
        return "bg-green-100 text-green-800 border-green-300";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "high":
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "lending":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "staking":
        return "bg-purple-100 text-purple-800 border-purple-300";
      case "defi":
        return "bg-orange-100 text-orange-800 border-orange-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  if (!selectedTemplate) {
    return (
      <div className={cn("text-center py-8", className)}>
        <p className="text-muted-foreground">
          No protocols available for the selected chain and token.
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          Try selecting a different chain or token.
        </p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4 select-none", className)}>
      <div className="grid grid-cols-1 gap-3">
        <Card
          className={cn(
            "cursor-pointer transition-all duration-200 bg-secondary/20 gap-y-0 border-none !shadow-[var(--ck-connectbutton-balance-connectbutton-box-shadow)]",
            disabled && "pointer-events-none cursor-not-allowed"
          )}
        >
          <CardHeader className="pb-0">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div>
                  <CardTitle className="text-lg flex flex-col gap-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex gap-2">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs",
                            getCategoryColor(selectedTemplate.category)
                          )}
                        >
                          {selectedTemplate.category}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs",
                            getRiskColor(selectedTemplate.riskLevel)
                          )}
                        >
                          {selectedTemplate.riskLevel} risk
                        </Badge>
                      </div>
                    </div>
                    {selectedTemplate.name}
                  </CardTitle>
                  <CardDescription className="text-sm">
                    {selectedTemplate.description}
                  </CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm text-muted-foreground mt-2">
              {selectedTemplate.expectedOutcome}
            </p>
            <div className="mt-3 pt-3 border-t">
              <Button
                size="sm"
                className="w-full rounded-full bg-background/10 text-primary shadow-2xl border border-border hover:bg-accent/20"
              >
                Selected ✓
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TemplateSelector;
