import React, { useState, useEffect, Dispatch, SetStateAction } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import Image from "next/image";
import {
  AllowanceHookSource,
  CHAIN_METADATA,
  OnAllowanceHookData,
} from "@avail-project/nexus";
import { useBridgeStore } from "@/store/bridgeStore";
import { toast } from "sonner";
import { useNexus } from "@/provider/NexusProvider";

interface AllowanceModalProps {
  allowanceModal: OnAllowanceHookData | null;
  setAllowanceModal: Dispatch<SetStateAction<OnAllowanceHookData | null>>;
}

const AllowanceModal: React.FC<AllowanceModalProps> = ({
  allowanceModal,
  setAllowanceModal,
}) => {
  const { nexusSdk } = useNexus();
  const [selectedAllowances, setSelectedAllowances] = useState<string[]>([]);
  const { reset } = useBridgeStore();

  useEffect(() => {
    if (allowanceModal) {
      setSelectedAllowances(allowanceModal.sources.map(() => "min"));
    }
  }, [allowanceModal]);

  if (!allowanceModal) {
    return null;
  }

  const { sources, allow, deny } = allowanceModal;

  const handleRadioChange = (index: number, value: string) => {
    const newSelectedAllowances = [...selectedAllowances];
    if (value === "custom") {
      newSelectedAllowances[index] = "custom_input_pending";
    } else {
      newSelectedAllowances[index] = value;
    }
    setSelectedAllowances(newSelectedAllowances);
  };

  const handleCustomAmountChange = (index: number, customAmountStr: string) => {
    const newSelectedAllowances = [...selectedAllowances];
    try {
      if (customAmountStr === "") {
        newSelectedAllowances[index] = "custom_input_pending";
      } else {
        newSelectedAllowances[index] = customAmountStr;
      }
    } catch (error) {
      console.error("Invalid custom amount:", customAmountStr, error);
      newSelectedAllowances[index] = "custom_input_error";
    }
    setSelectedAllowances(newSelectedAllowances);
  };

  const getRadioValue = (index: number): string => {
    const currentValue = selectedAllowances[index];
    if (typeof currentValue === "string") {
      if (currentValue === "min" || currentValue === "max") return currentValue;
      if (!isNaN(Number(currentValue))) return "custom";
      return currentValue;
    }
    return "custom";
  };

  const handleApprove = () => {
    console.log("Initial selectedAllowances:", selectedAllowances);

    const processedAllowances = selectedAllowances.map((val, index) => {
      const source = sources[index];
      console.log("Processing allowance for token:", source.token.symbol, {
        selectedValue: val,
        minAllowance: source.allowance.minimum,
        decimals: source.token.decimals,
        type: typeof val,
      });

      if (val === "custom_input_pending" || val === "custom_input_error") {
        console.log("Using minAllowance due to invalid custom input");
        return "min";
      }

      if (val === "min") {
        console.log("Using 'min' for minimum allowance");
        return "min";
      }

      if (val === "max") {
        console.log("Using 'max' for unlimited allowance");
        return "max";
      }

      // For custom amounts, ensure it's a valid number
      if (typeof val === "string" && !isNaN(Number(val))) {
        console.log("Using custom amount:", val);
        return val;
      }

      // Fallback to min if something goes wrong
      console.log("Fallback to min");
      return "min";
    });

    console.log("Final processed allowances in modal:", processedAllowances);
    allow(processedAllowances);
    setAllowanceModal(null);
  };

  const handleDeny = () => {
    deny();
    reset();
    toast.info("Allowance denied");
    setAllowanceModal(null);
  };

  console.log("allowanceModal", allowanceModal);

  return (
    <Dialog
      open={!!allowanceModal}
      onOpenChange={(isOpen) => !isOpen && handleDeny()}
    >
      <DialogContent className="w-md bg-accent-foreground !shadow-[var(--ck-modal-box-shadow)] !rounded-[var(--ck-connectbutton-border-radius)] border-none">
        <DialogHeader>
          <DialogTitle>Set Token Allowances</DialogTitle>
          <DialogDescription>
            The following token allowances are required for this transaction.
            Please approve them.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto">
          {sources?.map((source: AllowanceHookSource, index: number) => (
            <div
              key={source.token.symbol ?? index}
              className="p-3 border !rounded-[var(--ck-connectbutton-border-radius)]"
            >
              <div className="flex items-center gap-x-2">
                <p className="font-semibold">
                  Token: {source.token.symbol} on {source.chain.name}
                </p>
                <Image
                  src={CHAIN_METADATA[source.chain.id]?.logo ?? ""}
                  alt={`${source.chain.name} logo`}
                  width={20}
                  height={20}
                />
              </div>
              <div className="flex justify-between items-center text-sm">
                <span>Current Allowance</span>
                <span className="font-bold">
                  {nexusSdk?.utils.formatBalance(
                    source.allowance.current,
                    source.token.decimals
                  )}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span>Required Allowance</span>
                <span className="font-bold">
                  {nexusSdk?.utils.formatBalance(
                    source.allowance.minimum,
                    source.token.decimals
                  )}
                </span>
              </div>

              <RadioGroup
                value={getRadioValue(index)}
                onValueChange={(value: string) =>
                  handleRadioChange(index, value)
                }
                className="mt-2 mb-1"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="min" id={`min-${index}`} />
                  <Label htmlFor={`min-${index}`}>
                    Minimum (
                    {nexusSdk?.utils.formatBalance(
                      source.allowance.minimum,
                      source.token.decimals
                    )}
                    )
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="max" id={`max-${index}`} />
                  <Label htmlFor={`max-${index}`}>Maximum (Unlimited)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="custom" id={`custom-${index}`} />
                  <Label htmlFor={`custom-${index}`}>Custom Amount</Label>
                </div>
              </RadioGroup>

              {getRadioValue(index) === "custom" && (
                <Input
                  type="number"
                  step="any"
                  min="0"
                  placeholder="Enter custom amount"
                  value={
                    typeof selectedAllowances[index] === "string" &&
                    !isNaN(Number(selectedAllowances[index]))
                      ? selectedAllowances[index]
                      : ""
                  }
                  onChange={(e) =>
                    handleCustomAmountChange(index, e.target.value)
                  }
                  className="mt-4 w-full !shadow-[var(--ck-connectbutton-box-shadow)] !rounded-[var(--ck-connectbutton-border-radius)] border-none focus-visible:outline-none"
                />
              )}
            </div>
          ))}
        </div>
        <DialogFooter className="gap-2 sm:justify-end mt-4">
          <Button
            variant="connectkit"
            onClick={handleDeny}
            className="bg-destructive/50 font-semibold"
          >
            Deny
          </Button>
          <Button
            variant="connectkit"
            onClick={handleApprove}
            className="font-semibold"
          >
            Approve Selected
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AllowanceModal;
