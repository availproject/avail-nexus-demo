"use client";
import { WagmiProvider, createConfig, http, useAccount } from "wagmi";
import {
  sepolia,
  baseSepolia,
  arbitrumSepolia,
  optimismSepolia,
  polygonMumbai,
  lineaTestnet,
} from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConnectKitProvider, getDefaultConfig } from "connectkit";
import { NexusProvider } from "./NexusProvider";
import { useState, useEffect } from "react";

const config = createConfig(
  getDefaultConfig({
    chains: [
      sepolia,
      arbitrumSepolia,
      baseSepolia,
      optimismSepolia,
      polygonMumbai,
      lineaTestnet,
    ],
    transports: {
      [sepolia.id]: http(sepolia.rpcUrls.default.http[0]),
      [arbitrumSepolia.id]: http(arbitrumSepolia.rpcUrls.default.http[0]),
      [baseSepolia.id]: http(baseSepolia.rpcUrls.default.http[0]),
      [optimismSepolia.id]: http(optimismSepolia.rpcUrls.default.http[0]),
      [polygonMumbai.id]: http(polygonMumbai.rpcUrls.default.http[0]),
      [lineaTestnet.id]: http(lineaTestnet.rpcUrls.default.http[0]),
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
