import React from "react";
import { TransactionStatus } from "@/types/transaction";
import { CheckCircle, Clock, AlertCircle } from "lucide-react";

/**
 * Format timestamp to human-readable date string
 */
export const formatTimestamp = (timestamp: number): string => {
  return new Date(timestamp).toLocaleString();
};

/**
 * Format timestamp to relative time (e.g., "2 minutes ago")
 */
export const formatRelativeTime = (timestamp: number): string => {
  const now = Date.now();
  const diff = now - timestamp;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} day${days > 1 ? "s" : ""} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
  return "Just now";
};

/**
 * Format amount with proper decimal places
 */
export const formatAmount = (amount: string | number, decimals = 6): string => {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;

  if (isNaN(num)) return "0";

  // For very small amounts, show more decimals
  if (num < 0.001) return num.toFixed(8);

  // For normal amounts, limit decimals
  return num.toFixed(decimals).replace(/\.?0+$/, "");
};

/**
 * Format display amount with currency symbol
 */
export const formatDisplayAmount = (
  amount: string | number,
  symbol?: string
): string => {
  const formattedAmount = formatAmount(amount);
  return symbol ? `${formattedAmount} ${symbol}` : formattedAmount;
};

/**
 * Get status icon component for transaction status
 */
export const getStatusIcon = (
  status: TransactionStatus
): React.ReactElement => {
  const iconProps = { className: "w-4 h-4" };

  switch (status) {
    case "completed":
      return React.createElement(CheckCircle, {
        ...iconProps,
        className: "w-4 h-4 text-green-500",
      });
    case "pending":
      return React.createElement(Clock, {
        ...iconProps,
        className: "w-4 h-4 text-yellow-500",
      });
    case "failed":
      return React.createElement(AlertCircle, {
        ...iconProps,
        className: "w-4 h-4 text-red-500",
      });
    default:
      return React.createElement(Clock, {
        ...iconProps,
        className: "w-4 h-4 text-gray-500",
      });
  }
};

/**
 * Get status color class for styling
 */
export const getStatusColor = (status: TransactionStatus): string => {
  switch (status) {
    case "completed":
      return "text-green-600";
    case "pending":
      return "text-yellow-600";
    case "failed":
      return "text-red-600";
    default:
      return "text-gray-600";
  }
};

/**
 * Get badge variant for transaction status
 */
export const getStatusBadgeVariant = (status: TransactionStatus) => {
  switch (status) {
    case "completed":
      return "default";
    case "pending":
      return "secondary";
    case "failed":
      return "destructive";
    default:
      return "secondary";
  }
};

/**
 * Format step name from SDK type string
 */
export const formatStepName = (stepType: string): string => {
  return stepType
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

/**
 * Validate and format bridge amount input
 */
export const validateAmountInput = (value: string): boolean => {
  if (value === "") return true;
  return /^\d*\.?\d*$/.test(value) && !isNaN(parseFloat(value));
};

/**
 * Format chain name for display
 */
export const formatChainName = (chainId: number): string => {
  // This could be enhanced with a mapping of chain IDs to names
  return `Chain ${chainId}`;
};

/**
 * Truncate address for display
 */
export const truncateAddress = (address: string, chars = 6): string => {
  if (address.length <= chars * 2) return address;
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
};

/**
 * Format gas estimate for display
 */
export const formatGasEstimate = (gasEstimate: string | number): string => {
  const gas =
    typeof gasEstimate === "string" ? parseFloat(gasEstimate) : gasEstimate;

  if (isNaN(gas)) return "Unknown";

  // Format gas in appropriate units
  if (gas > 1000000) {
    return `${(gas / 1000000).toFixed(2)}M`;
  } else if (gas > 1000) {
    return `${(gas / 1000).toFixed(2)}K`;
  }

  return gas.toString();
};
