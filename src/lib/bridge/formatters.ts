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
