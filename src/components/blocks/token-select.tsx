import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import Image from "next/image";
import {
  SUPPORTED_TOKENS,
  TESTNET_TOKEN_METADATA,
  TokenMetadata,
} from "avail-nexus-sdk";

const TokenSelect = ({
  selectedToken,
  selectedChain,
  handleTokenSelect,
}: {
  selectedToken?: SUPPORTED_TOKENS;
  selectedChain: string;
  handleTokenSelect: (token: SUPPORTED_TOKENS) => void;
}) => {
  return (
    <Select
      value={selectedToken}
      onValueChange={(value) => handleTokenSelect(value as SUPPORTED_TOKENS)}
    >
      <SelectTrigger className="w-full !shadow-[var(--ck-connectbutton-box-shadow)] rounded-[var(--ck-connectbutton-border-radius)] border-none">
        <SelectValue placeholder="Select a token">
          {selectedChain &&
            Object.values(TESTNET_TOKEN_METADATA)?.find(
              (t) => t.symbol === selectedToken
            ) && (
              <div className="flex items-center gap-2">
                <Image
                  src={
                    Object.values(TESTNET_TOKEN_METADATA)?.find(
                      (t) => t.symbol === selectedToken
                    )?.icon ?? ""
                  }
                  alt={selectedToken ?? ""}
                  width={24}
                  height={24}
                  className="rounded-full"
                />
                {selectedToken}
              </div>
            )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="bg-accent-foreground rounded-[var(--ck-connectbutton-border-radius)]">
        {Object.values(TESTNET_TOKEN_METADATA)?.map((token: TokenMetadata) => (
          <SelectItem
            key={token.symbol}
            value={token.symbol}
            className="flex items-center gap-2 hover:bg-background/50 rounded-[var(--ck-connectbutton-border-radius)]"
          >
            <div className="flex items-center gap-2 my-1">
              <Image
                src={token.icon ?? ""}
                alt={token.symbol}
                width={24}
                height={24}
                className="rounded-full"
              />
              <div className="flex flex-col">
                <span>{token.name}</span>
              </div>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default TokenSelect;
