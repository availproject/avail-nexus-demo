"use client";
import { useNexus } from "@/provider/NexusProvider";
import {
  SUPPORTED_CHAINS,
  SwapIntent,
  SwapOptionalParams,
  TOKEN_CONTRACT_ADDRESSES,
} from "@avail-project/nexus";
import React, { useState } from "react";
import { Button } from "./ui/button";
import { parseUnits } from "viem";

interface SwapIntentHook {
  allow: () => void;
  deny: () => void;
  intent: SwapIntent;
  refresh: () => Promise<SwapIntent>;
}

const NexusSwaps = ({ isTestnet }: { isTestnet: boolean }) => {
  const { nexusSdk } = useNexus();
  const [swapIntent, setSwapIntent] = useState<SwapIntentHook | null>(null);

  const startSwap = async () => {
    try {
      const options: Omit<SwapOptionalParams, "emit"> = {
        swapIntenHook: async ({
          allow,
          deny,
          intent,
          refresh,
        }: {
          allow: () => void;
          deny: () => void;
          intent: SwapIntent;
          refresh: () => Promise<SwapIntent>;
        }) => {
          console.log("Swap intent hook", intent);
          setSwapIntent({ allow, deny, intent, refresh });
        },
      };
      const amount = parseUnits("0.5", 6);
      const payload = {
        // fromAmount: amount,
        toAmount: amount,
        // fromChainID: SUPPORTED_CHAINS.OPTIMISM,
        // fromTokenAddress:
        //   TOKEN_CONTRACT_ADDRESSES["USDC"][SUPPORTED_CHAINS.OPTIMISM],
        toChainID: SUPPORTED_CHAINS.ARBITRUM,
        toTokenAddress:
          TOKEN_CONTRACT_ADDRESSES["USDT"][SUPPORTED_CHAINS.ARBITRUM],
      };
      console.log("Payload", payload);
      console.log("Amount", amount);
      console.log("Options", { ...options });
      const result = await nexusSdk?.swap(payload, {
        swapIntenHook: async (data: SwapIntentHook) => {
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
