"use client";
import { useNexus } from "@/provider/NexusProvider";
import React, { useEffect, useState, useCallback } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import Image from "next/image";
import { Separator } from "./ui/separator";
import { Loader2 } from "lucide-react";

export interface TokenBalance {
  symbol: string;
  balance: string;
  balanceInFiat: number;
  decimals: number;
  icon: string | undefined;
  breakdown: ChainBalance[];
  abstracted: boolean;
}

interface ChainBalance {
  chain: {
    id: number;
    name: string;
    logo: string;
  };
  network: string;
  contractAddress: string;
  balance: string;
  balanceInFiat: number;
  isNative?: boolean;
}

const UnifiedBalance = () => {
  const { nexusSdk, isInitialized } = useNexus();
  const [balance, setBalance] = useState<TokenBalance[] | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUnifiedBalance = useCallback(async () => {
    if (!nexusSdk || !isInitialized) return;

    try {
      setIsLoading(true);
      setError(null);
      const unifiedBalance = await nexusSdk.getUnifiedBalances();
      setBalance(unifiedBalance as TokenBalance[]);
    } catch (error: any) {
      console.error("Unable to fetch balance", error);
      setError(error?.message ?? "Failed to fetch balance");
    } finally {
      setIsLoading(false);
    }
  }, [nexusSdk, isInitialized]);

  useEffect(() => {
    fetchUnifiedBalance();
  }, [fetchUnifiedBalance]);

  const formatBalance = (balance: string, decimals: number) => {
    const num = parseFloat(balance);
    return num.toFixed(Math.min(6, decimals));
  };

  if (error) {
    return (
      <div className="w-full max-w-2xl mx-auto p-4 text-red-500">
        Error: {error}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="w-full max-w-2xl mx-auto p-4 text-center flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto py-4">
      <Accordion type="single" collapsible className="w-full space-y-4">
        {balance
          ?.filter((token) => parseFloat(token.balance) > 0)
          .map((token) => (
            <AccordionItem
              key={token.symbol}
              value={token.symbol}
              removeLastBorder={true}
              className="px-4 !shadow-[var(--ck-connectbutton-box-shadow)] !rounded-[var(--ck-connectbutton-border-radius)]"
            >
              <AccordionTrigger className="hover:no-underline cursor-pointer">
                <div className="flex items-center justify-between w-full pr-4">
                  <div className="flex items-center gap-3">
                    <div className="relative h-8 w-8">
                      {token.icon && (
                        <Image
                          src={token.icon}
                          alt={token.symbol}
                          fill
                          className="rounded-full"
                        />
                      )}
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold">{token.symbol}</h3>
                      <p className="text-sm text-muted-foreground">
                        ${token.balanceInFiat.toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <p className="text-lg font-medium">
                    {formatBalance(token.balance, token.decimals)}
                  </p>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3 py-2">
                  {token.breakdown
                    .filter((chain) => parseFloat(chain.balance) > 0)
                    .map((chain, index, filteredChains) => (
                      <React.Fragment key={chain.chain.id}>
                        <div className="flex items-center justify-between px-2 py-1 rounded-md">
                          <div className="flex items-center gap-2">
                            <div className="relative h-6 w-6">
                              <Image
                                src={chain.chain.logo}
                                alt={chain.chain.name}
                                sizes="100%"
                                fill
                                className="rounded-full"
                              />
                            </div>
                            <span className="text-sm">{chain.chain.name}</span>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">
                              {formatBalance(chain.balance, token.decimals)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              ${chain.balanceInFiat.toFixed(2)}
                            </p>
                          </div>
                        </div>
                        {index < filteredChains.length - 1 && (
                          <Separator className="my-2" />
                        )}
                      </React.Fragment>
                    ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
      </Accordion>
    </div>
  );
};

export default UnifiedBalance;
