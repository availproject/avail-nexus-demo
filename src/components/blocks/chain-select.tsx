import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  CHAIN_METADATA,
  chainIcons,
  MAINNET_CHAINS,
  SUPPORTED_CHAINS_IDS,
  TESTNET_CHAINS,
} from "@avail-project/nexus/core";
import { Label } from "../ui/label";
import Image from "next/image";

const ChainSelect = ({
  selectedChain,
  handleSelect,
  chainLabel = "Destination Chain",
  isTestnet = false,
}: {
  selectedChain: SUPPORTED_CHAINS_IDS;
  handleSelect: (chainId: SUPPORTED_CHAINS_IDS) => void;
  chainLabel?: string;
  isTestnet?: boolean;
}) => {
  const chains = isTestnet ? TESTNET_CHAINS : MAINNET_CHAINS;
  const chainData = CHAIN_METADATA;
  return (
    <Select
      value={selectedChain?.toString() ?? ""}
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
                  alt={CHAIN_METADATA[selectedChain]?.name ?? ""}
                  width={24}
                  height={24}
                  className="rounded-full"
                />
                {CHAIN_METADATA[selectedChain]?.name}
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
      </div>

      <SelectContent className="bg-accent-foreground rounded-[var(--ck-connectbutton-border-radius)]">
        {chains.map((chainId) => {
          return (
            <SelectItem
              key={chainId}
              value={chainId.toString()}
              className="flex items-center gap-2 !hover:bg-background/30 rounded-[var(--ck-connectbutton-border-radius)]"
            >
              <div className="flex items-center gap-2 my-1">
                <Image
                  src={chainIcons[chainId]}
                  alt={chainData[chainId]?.name ?? ""}
                  width={24}
                  height={24}
                  className="rounded-full"
                />
                {chainData[chainId]?.name}
              </div>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
};

export default ChainSelect;
