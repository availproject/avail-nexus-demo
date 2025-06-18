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
  templates: ContractTemplate[];
  selectedTemplate: ContractTemplate | null;
  onSelect: (template: ContractTemplate) => void;
  className?: string;
}

const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  templates,
  selectedTemplate,
  onSelect,
  className,
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

  if (templates.length === 0) {
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
    <div className={cn("space-y-4", className)}>
      <div className="grid grid-cols-1 gap-3">
        {templates.map((template) => (
          <Card
            key={template.id}
            className={cn(
              "cursor-pointer transition-all duration-200 hover:shadow-md",
              selectedTemplate?.id === template.id
                ? "ring-2 ring-primary shadow-md"
                : "hover:shadow-sm"
            )}
            onClick={() => onSelect(template)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{template.icon}</span>
                  <div>
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <CardDescription className="text-sm">
                      {template.description}
                    </CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-xs",
                      getCategoryColor(template.category)
                    )}
                  >
                    {template.category}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={cn("text-xs", getRiskColor(template.riskLevel))}
                  >
                    {template.riskLevel} risk
                  </Badge>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {template.expectedOutcome}
              </p>
              {selectedTemplate?.id === template.id && (
                <div className="mt-3 pt-3 border-t">
                  <Button size="sm" className="w-full">
                    Selected ✓
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default TemplateSelector;
