"use client";
import { useNexus } from "@/provider/NexusProvider";
import {
  ExactInSwapInput,
  ExactOutSwapInput,
  SUPPORTED_CHAINS,
  SwapIntent,
  SwapIntentHook,
  TOKEN_CONTRACT_ADDRESSES,
} from "@avail-project/nexus-core";

import React, { useState } from "react";
import { Button } from "./ui/button";
import { parseUnits } from "viem";

const NexusSwaps = ({ isTestnet }: { isTestnet: boolean }) => {
  const { nexusSdk } = useNexus();
  const [swapIntent, setSwapIntent] = useState<{
    allow: () => void;
    deny: () => void;
    intent: SwapIntent;
    refresh: () => Promise<SwapIntent>;
  } | null>(null);

  const startSwap = async () => {
    try {
      const amount = parseUnits("0.1", 6);

      const payload: ExactInSwapInput = {
        from: [
          {
            chainId: SUPPORTED_CHAINS.ARBITRUM,
            amount,
            tokenAddress:
              TOKEN_CONTRACT_ADDRESSES["USDC"][SUPPORTED_CHAINS.ARBITRUM],
          },
        ],
        toChainId: SUPPORTED_CHAINS.BNB,
        toTokenAddress: "0x0000000000000000000000000000000000000000",
        // toTokenAddress: TOKEN_CONTRACT_ADDRESSES["USDC"][SUPPORTED_CHAINS.BNB],
      };

      // const swapWithExactOutInput: ExactOutSwapInput = {
      //   toChainId: 137, // Polygon Mainnet
      //   toTokenAddress:
      //     "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174" as `0x${string}`,
      //   toAmount: BigInt(10000), // bigint
      // };
      console.log("Payload", payload);
      console.log("Amount", amount);
      // const result = await nexusSdk?.swapWithExactOut(swapWithExactOutInput, {
      //   swapIntentHook: async (data: {
      //     allow: () => void;
      //     deny: () => void;
      //     intent: SwapIntent;
      //     refresh: () => Promise<SwapIntent>;
      //   }) => {
      //     console.log("Swap intent hook", data);
      //     setSwapIntent(data);
      //   },
      // });
      const result = await nexusSdk?.swapWithExactIn(payload, {
        swapIntentHook: async (data: {
          allow: () => void;
          deny: () => void;
          intent: SwapIntent;
          refresh: () => Promise<SwapIntent>;
        }) => {
          console.log("Swap intent hook", data);
          setSwapIntent(data);
        },
      });
      console.log("Swap result", result);
    } catch (error) {
      console.error("Error starting swap", error);
    }
  };

  return (
    <div className="w-full flex flex-col gap-4">
      Swaps
      <Button onClick={startSwap}>Start Swap</Button>
      {swapIntent && (
        <div className="flex flex-col gap-2">
          <p>{JSON.stringify(swapIntent.intent)}</p>
          <Button onClick={() => swapIntent.allow()}>Allow</Button>
          <Button
            onClick={() => {
              swapIntent.deny();
              setSwapIntent(null);
            }}
          >
            Deny
          </Button>
          <Button onClick={() => swapIntent.refresh()}>Refresh</Button>
        </div>
      )}
    </div>
  );
};

export default NexusSwaps;
