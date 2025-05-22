import { IntentModalTrigger } from "@/provider/NexusProvider";
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { MoveRight } from "lucide-react";

interface IntentModalProps {
  intentModal: IntentModalTrigger | null;
  setIntentModal: (modal: IntentModalTrigger | null) => void;
}

// Helper component to display chain info
const ChainDisplay = ({
  name,
  logoUrl,
}: {
  name: string;
  logoUrl?: string;
}) => (
  <div className="flex items-center space-x-2">
    {logoUrl && (
      <Image
        src={logoUrl}
        alt={`${name} logo`}
        width={20}
        height={20}
        className="rounded-full"
      />
    )}
    <p className="font-medium">{name}</p>
  </div>
);

const IntentModal: React.FC<IntentModalProps> = ({
  intentModal,
  setIntentModal,
}) => {
  if (!intentModal) {
    return null;
  }
  console.log("intentModal", intentModal);
  const { data, resolve, reject } = intentModal;
  const { intent, refresh } = data;

  const handleAllow = () => {
    resolve();
    setIntentModal(null);
  };

  const handleDeny = () => {
    reject("User denied intent");
    setIntentModal(null);
  };

  const handleRefresh = () => {
    refresh();
  };

  return (
    <Dialog
      open={!!intentModal}
      onOpenChange={(isOpen) => !isOpen && handleDeny()}
    >
      <DialogContent className="w-md bg-accent-foreground border-none !shadow-[var(--ck-modal-box-shadow)] !rounded-[var(--ck-connectbutton-border-radius)]">
        <DialogHeader>
          <DialogTitle>Confirm Transaction</DialogTitle>
          <DialogDescription>
            Please review the details of this transaction carefully.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="flex items-center justify-between w-full">
            {intent.sources && intent.sources.length > 0 && (
              <div className="p-3 bg-muted/20 rounded-full">
                {intent.sources.map((source: any, index: number) => (
                  <Image
                    key={source?.chainLogo}
                    src={source.chainLogo}
                    alt={`${source.chainName} logo`}
                    width={20}
                    height={20}
                    className="rounded-full"
                  />
                ))}
              </div>
            )}
            <MoveRight className="size-8" />
            {intent.token && (
              <div className="p-3 bg-muted/20 rounded-full">
                {intent.token.logo && (
                  <Image
                    src={intent.token.logo}
                    alt={`${intent.token.name} logo`}
                    width={24}
                    height={24}
                    className="rounded-full"
                  />
                )}
              </div>
            )}
            <MoveRight className="size-8" />
            {intent.destination && (
              <div className="p-3 bg-muted/20 rounded-full">
                <Image
                  src={intent.destination.chainLogo}
                  alt={`${intent.destination.chainName} logo`}
                  width={24}
                  height={24}
                  className="rounded-full"
                />
              </div>
            )}
          </div>

          {intent.fees && (
            <div className="p-3 rounded-[var(--ck-connectbutton-border-radius)] shadow-[var(--ck-connectbutton-balance-box-shadow)]">
              <h4 className="font-semibold mb-2">Estimated Fees</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <p className="font-medium">Gas Supplied</p>
                  <p className="font-medium">
                    {intent.fees.gasSupplied} {intent.token?.symbol}
                  </p>
                </div>
                <div className="flex justify-between">
                  <p className="font-medium">CA Gas</p>
                  <p className="font-medium">
                    {intent.fees.caGas} {intent.token?.symbol}
                  </p>
                </div>
                <div className="flex justify-between">
                  <p className="font-medium">Solver Fee</p>
                  <p className="font-medium">
                    {intent.fees.solver} {intent.token?.symbol}
                  </p>
                </div>
                <div className="flex justify-between">
                  <p className="font-medium">Protocol Fee</p>
                  <p className="font-medium">
                    {intent.fees.protocol} {intent.token?.symbol}
                  </p>
                </div>
                <div className="flex justify-between pt-2 mt-1 border-t font-semibold">
                  <p>Total Fees</p>
                  <p>
                    {intent.fees.total} {intent.token?.symbol}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
        <DialogFooter className="gap-2 sm:justify-between pt-2">
          <Button
            variant="connectkit"
            onClick={handleRefresh}
            className="sm:mr-auto font-semibold"
          >
            Refresh Data
          </Button>
          <div className="flex w-full justify-between sm:justify-end sm:w-auto gap-2">
            <Button
              variant="connectkit"
              onClick={handleDeny}
              className="bg-destructive/50 font-semibold w-1/2 sm:w-auto"
            >
              Deny
            </Button>
            <Button
              variant="connectkit"
              onClick={handleAllow}
              className="font-semibold w-1/2 sm:w-auto"
            >
              Allow
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default IntentModal;
