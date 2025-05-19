"use client";
import { WagmiProvider, createConfig, http, useAccount } from "wagmi";
import {
  arbitrum,
  base,
  linea,
  mainnet,
  optimism,
  polygon,
} from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConnectKitProvider, getDefaultConfig } from "connectkit";
import { NexusProvider } from "./NexusProvider";
import { useState, useEffect } from "react";

const config = createConfig(
  getDefaultConfig({
    chains: [mainnet, arbitrum, base, optimism, polygon, linea],
    transports: {
      [mainnet.id]: http(mainnet.rpcUrls.default.http[0]),
      [arbitrum.id]: http(arbitrum.rpcUrls.default.http[0]),
      [base.id]: http(base.rpcUrls.default.http[0]),
      [optimism.id]: http(optimism.rpcUrls.default.http[0]),
      [polygon.id]: http(polygon.rpcUrls.default.http[0]),
      [linea.id]: http(linea.rpcUrls.default.http[0]),
    },

    walletConnectProjectId:
      process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ??
      "5ccff0b96382c3591b17a986fc9b4b11",

    // Required App Info
    appName: "Avail Nexus",

    // Optional App Info
    appDescription: "Avail Nexus",
    appUrl: "https://www.availproject.org/",
    appIcon:
      "https://www.availproject.org/_next/static/media/avail_logo.9c818c5a.png",
  })
);

const queryClient = new QueryClient();

const InternalProvider = ({ children }: { children: React.ReactNode }) => {
  const [isConnected, setIsConnected] = useState(false);
  const { isConnected: accountConnected } = useAccount();

  useEffect(() => {
    setIsConnected(accountConnected);
  }, [accountConnected]);

  const handleConnection = () => {
    setIsConnected(true);
  };

  const handleDisconnection = () => {
    setIsConnected(false);
  };

  return (
    <ConnectKitProvider
      theme="retro"
      onConnect={handleConnection}
      onDisconnect={handleDisconnection}
    >
      <NexusProvider isConnected={isConnected}>{children}</NexusProvider>
    </ConnectKitProvider>
  );
};

export const Web3Provider = ({ children }: { children: React.ReactNode }) => {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <InternalProvider>{children}</InternalProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};
