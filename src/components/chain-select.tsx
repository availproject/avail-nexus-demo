import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { chainData, chainIcons } from "@/lib/constants";
import { SUPPORTED_CHAINS, SUPPORTED_CHAINS_IDS } from "@avail/nexus-sdk";
import { Label } from "./ui/label";
import Image from "next/image";

const ChainSelect = ({
  selectedChain,
  handleSelect,
  chainLabel = "Destination Chain",
}: {
  selectedChain: SUPPORTED_CHAINS_IDS;
  handleSelect: (chainId: SUPPORTED_CHAINS_IDS) => void;
  chainLabel?: string;
}) => {
  return (
    <Select
      value={selectedChain.toString()}
      onValueChange={(value) =>
        handleSelect(parseInt(value) as SUPPORTED_CHAINS_IDS)
      }
    >
      <div className="flex flex-col items-start gap-y-1">
        {chainLabel && (
          <Label className="text-sm font-semibold">{chainLabel}</Label>
        )}
        <SelectTrigger className="w-full !shadow-[var(--ck-connectbutton-box-shadow)] rounded-[var(--ck-connectbutton-border-radius)] border-none !focus-visible:none outline-none">
          <SelectValue>
            {!!selectedChain && (
              <div className="flex items-center gap-2">
                <Image
                  src={chainIcons[selectedChain]}
                  alt={chainData[selectedChain]?.name ?? ""}
                  width={24}
                  height={24}
                  className="rounded-full"
                />
                {chainData[selectedChain]?.name}
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
      </div>

      <SelectContent className="bg-accent-foreground rounded-[var(--ck-connectbutton-border-radius)]">
        {Object.entries(SUPPORTED_CHAINS).map(([, chainId]) => {
          const chain = chainData[chainId as SUPPORTED_CHAINS_IDS];
          if (!chain) return null;
          return (
            <SelectItem
              key={chainId}
              value={chainId.toString()}
              className="flex items-center gap-2 hover:bg-background/50 rounded-[var(--ck-connectbutton-border-radius)]"
            >
              <div className="flex items-center gap-2 my-1">
                <Image
                  src={chainIcons[chainId as SUPPORTED_CHAINS_IDS]}
                  alt={chain.name}
                  width={24}
                  height={24}
                  className="rounded-full"
                />
                {chain.name}
              </div>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
};

export default ChainSelect;
