"use client";
import { useEffect, useMemo, useState, useCallback } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  mainnet,
  base,
  arbitrum,
  optimism,
  polygon,
  avalanche,
  linea,
} from "viem/chains";
import Image from "next/image";
import { SUPPORTED_CHAINS } from "@avail/nexus-sdk";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useNexus } from "@/provider/NexusProvider";
import { TokenBalance } from "./unified-balance";
import { Label } from "./ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const INITIAL_CHAIN = SUPPORTED_CHAINS.ETHEREUM.toString();

const chainIcons: Record<number, string> = {
  [SUPPORTED_CHAINS.ETHEREUM]:
    "https://assets.coingecko.com/coins/images/279/small/ethereum.png",
  [SUPPORTED_CHAINS.BASE]:
    "https://raw.githubusercontent.com/base/brand-kit/main/logo/symbol/Base_Symbol_Blue.svg",
  [SUPPORTED_CHAINS.ARBITRUM]:
    "https://assets.coingecko.com/coins/images/16547/small/photo_2023-03-29_21.47.00.jpeg",
  [SUPPORTED_CHAINS.OPTIMISM]:
    "https://assets.coingecko.com/coins/images/25244/small/Optimism.png",
  [SUPPORTED_CHAINS.POLYGON]:
    "https://assets.coingecko.com/coins/images/4713/small/polygon.png",
  [SUPPORTED_CHAINS.AVALANCHE]:
    "https://assets.coingecko.com/coins/images/12559/small/Avalanche_Circle_RedWhite_Trans.png",
  [SUPPORTED_CHAINS.LINEA]:
    "https://assets.coingecko.com/asset_platforms/images/135/small/linea.jpeg?1706606705",
  [SUPPORTED_CHAINS.SCROLL]:
    "https://assets.coingecko.com/coins/images/50571/standard/scroll.jpg?1728376125",
} as const;

const chainData = {
  [SUPPORTED_CHAINS.ETHEREUM]: mainnet,
  [SUPPORTED_CHAINS.BASE]: base,
  [SUPPORTED_CHAINS.ARBITRUM]: arbitrum,
  [SUPPORTED_CHAINS.OPTIMISM]: optimism,
  [SUPPORTED_CHAINS.POLYGON]: polygon,
  [SUPPORTED_CHAINS.AVALANCHE]: avalanche,
  [SUPPORTED_CHAINS.LINEA]: linea,
  [SUPPORTED_CHAINS.SCROLL]: {
    id: SUPPORTED_CHAINS.SCROLL,
    name: "Scroll",
    network: "scroll",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  },
} as const;

const TokenImage = ({ src, alt }: { src: string; alt: string }) => (
  <Image
    src={src || ""}
    alt={alt}
    width={24}
    height={24}
    className="rounded-full"
  />
);

const NexusBridge = () => {
  const [state, setState] = useState({
    availableBalance: [] as TokenBalance[],
    selectedChain: INITIAL_CHAIN,
    selectedToken: "",
    bridgeAmount: "",
    isLoading: false,
    isBridging: false,
    error: null as string | null,
  });

  const { nexusSdk } = useNexus();

  // Memoized computations
  const availableTokensOnChain = useMemo(() => {
    if (!state.availableBalance.length) return [];

    return state.availableBalance
      .filter((token) =>
        token.breakdown.some(
          (breakdown) =>
            breakdown.chain.id === parseInt(state.selectedChain) &&
            parseFloat(breakdown.balance) > 0
        )
      )
      .map((token) => ({
        symbol: token.symbol,
        icon: token.icon,
        balance:
          token.breakdown.find(
            (b) => b.chain.id === parseInt(state.selectedChain)
          )?.balance ?? "0",
      }));
  }, [state.availableBalance, state.selectedChain]);

  const selectedTokenBalance = useMemo(() => {
    if (!state.selectedToken) return 0;

    const token = state.availableBalance.find(
      (t) => t.symbol === state.selectedToken
    );
    const chainBalance = token?.breakdown.find(
      (b) => b.chain.id === parseInt(state.selectedChain)
    );
    return chainBalance ? parseFloat(chainBalance.balance) : 0;
  }, [state.availableBalance, state.selectedChain, state.selectedToken]);

  // Handlers
  const handleChainSelect = useCallback((chainId: string) => {
    setState((prev) => ({
      ...prev,
      selectedChain: chainId,
      selectedToken: "",
    }));
  }, []);

  const handleTokenSelect = useCallback((symbol: string) => {
    setState((prev) => ({ ...prev, selectedToken: symbol }));
  }, []);

  const handleAmountChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      if (
        value === "" ||
        (/^\d*\.?\d*$/.test(value) && !isNaN(parseFloat(value)))
      ) {
        setState((prev) => ({ ...prev, bridgeAmount: value }));
      }
    },
    []
  );

  const fetchAvailableBalance = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      const balance = await nexusSdk?.getUnifiedBalances();
      setState((prev) => ({
        ...prev,
        availableBalance: balance as TokenBalance[],
        isLoading: false,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: "Failed to fetch balances",
        isLoading: false,
      }));
      toast.error("Failed to fetch balances");
    }
  }, [nexusSdk]);

  const handleBridge = useCallback(async () => {
    if (!state.selectedToken || !state.bridgeAmount) return;

    try {
      setState((prev) => ({ ...prev, isBridging: true, error: null }));
      await nexusSdk?.bridge({
        chainId: parseInt(state.selectedChain),
        token: state.selectedToken,
        amount: state.bridgeAmount,
      });
      toast.success("Bridge transaction initiated");
      setState((prev) => ({ ...prev, bridgeAmount: "" }));
    } catch (error: any) {
      const errorMessage = error?.message || "Bridge transaction failed";
      setState((prev) => ({ ...prev, error: errorMessage }));
      toast.error(errorMessage);
    } finally {
      setState((prev) => ({ ...prev, isBridging: false }));
    }
  }, [nexusSdk, state.selectedChain, state.selectedToken, state.bridgeAmount]);

  useEffect(() => {
    if (!state.availableBalance.length && !state.isLoading) {
      fetchAvailableBalance();
    }
  }, [state.availableBalance.length, state.isLoading, fetchAvailableBalance]);

  const isValidBridgeAmount = useMemo(() => {
    if (!state.bridgeAmount) return false;
    const amount = parseFloat(state.bridgeAmount);
    return amount > 0 && amount <= selectedTokenBalance;
  }, [state.bridgeAmount, selectedTokenBalance]);

  const formatBalance = (balance: number) => balance.toFixed(6);

  if (state.isLoading) {
    return (
      <div className="flex items-center justify-center w-full h-48">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full gap-y-4 py-4">
      <div className="w-full max-w-sm space-y-4">
        {/* Chain Select */}
        <Select value={state.selectedChain} onValueChange={handleChainSelect}>
          <SelectTrigger className="w-full !shadow-[var(--ck-connectbutton-box-shadow)] rounded-[var(--ck-connectbutton-border-radius)] border-none">
            <SelectValue>
              {state.selectedChain && (
                <div className="flex items-center gap-2">
                  <TokenImage
                    src={chainIcons[parseInt(state.selectedChain)]}
                    alt={chainData[parseInt(state.selectedChain)]?.name || ""}
                  />
                  {chainData[parseInt(state.selectedChain)]?.name}
                </div>
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="bg-accent-foreground rounded-[var(--ck-connectbutton-border-radius)]">
            {Object.entries(SUPPORTED_CHAINS).map(([name, chainId]) => {
              const chain = chainData[chainId];
              if (!chain) return null;
              return (
                <SelectItem
                  key={chainId}
                  value={chainId.toString()}
                  className="flex items-center gap-2 hover:bg-background/50"
                >
                  <div className="flex items-center gap-2">
                    <TokenImage src={chainIcons[chainId]} alt={chain.name} />
                    {chain.name}
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>

        {/* Token Select */}
        <Select
          value={state.selectedToken}
          onValueChange={handleTokenSelect}
          disabled={availableTokensOnChain.length === 0}
        >
          <SelectTrigger className="w-full !shadow-[var(--ck-connectbutton-box-shadow)] rounded-[var(--ck-connectbutton-border-radius)] border-none">
            <SelectValue placeholder="Select a token">
              {state.selectedToken &&
                availableTokensOnChain?.find(
                  (t) => t.symbol === state.selectedToken
                ) && (
                  <div className="flex items-center gap-2">
                    <TokenImage
                      src={
                        availableTokensOnChain.find(
                          (t) => t.symbol === state.selectedToken
                        )?.icon ?? ""
                      }
                      alt={state.selectedToken}
                    />
                    {state.selectedToken}
                  </div>
                )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="bg-accent-foreground rounded-[var(--ck-connectbutton-border-radius)]">
            {availableTokensOnChain?.map((token) => (
              <SelectItem
                key={token.symbol}
                value={token.symbol}
                className="flex items-center gap-2 hover:bg-background/50"
              >
                <div className="flex items-center gap-2">
                  <TokenImage src={token.icon ?? ""} alt={token.symbol} />
                  <div className="flex flex-col">
                    <span>{token.symbol}</span>
                    <span className="text-xs text-muted-foreground">
                      Balance: {formatBalance(parseFloat(token.balance))}
                    </span>
                  </div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Amount Input */}
      <div className="w-full max-w-sm flex items-center gap-x-2 shadow-[var(--ck-connectbutton-box-shadow)] rounded-[var(--ck-connectbutton-border-radius)]">
        <Input
          type="text"
          placeholder="Bridge amount"
          className="border-none focus-visible:ring-0 focus-visible:ring-offset-0"
          value={state.bridgeAmount}
          onChange={handleAmountChange}
          disabled={!state.selectedToken || state.isBridging}
        />
        {state.selectedToken && (
          <Label className="min-w-fit pr-2">
            {`Balance: ${formatBalance(selectedTokenBalance)}`}
          </Label>
        )}
      </div>

      {/* Bridge Button */}
      <Button
        variant="connectkit"
        className="w-full font-semibold"
        onClick={handleBridge}
        disabled={!isValidBridgeAmount || state.isBridging}
      >
        {state.isBridging ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          "Bridge"
        )}
      </Button>
    </div>
  );
};

export default NexusBridge;
