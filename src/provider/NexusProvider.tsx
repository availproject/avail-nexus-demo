"use client";

import { NexusSDK } from "@avail/nexus-sdk";
import React, {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";

interface NexusContextType {
  nexusSdk: NexusSDK | undefined;
  isInitialized: boolean;
}

const NexusContext = createContext<NexusContextType | undefined>(undefined);

interface NexusProviderProps {
  children: ReactNode;
  isConnected: boolean;
}

export const NexusProvider: React.FC<NexusProviderProps> = ({
  children,
  isConnected,
}) => {
  const [nexusSdk, setNexusSdk] = useState<NexusSDK | undefined>(undefined);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  const initializeSDK = useCallback(async () => {
    console.log("initializeSDK", isConnected, nexusSdk);
    if (isConnected && !nexusSdk) {
      try {
        const sdk = new NexusSDK();
        await sdk.initialize(window.ethereum);
        setNexusSdk(sdk);
        setIsInitialized(true);
      } catch (error) {
        console.error("Failed to initialize NexusSDK:", error);
        setIsInitialized(false);
      }
    }
  }, [isConnected, nexusSdk]);

  const cleanupSDK = useCallback(() => {
    if (nexusSdk) {
      nexusSdk.removeAllCaEventListeners();
      nexusSdk.deinit();
      setNexusSdk(undefined);
      setIsInitialized(false);
    }
  }, [nexusSdk]);

  useEffect(() => {
    console.log("useEffect", isConnected);
    if (!isConnected) {
      cleanupSDK();
    } else {
      initializeSDK();
    }

    return () => {
      cleanupSDK();
    };
  }, [isConnected]);

  const contextValue: NexusContextType = useMemo(
    () => ({
      nexusSdk,
      isInitialized,
    }),
    [nexusSdk, isInitialized]
  );

  return (
    <NexusContext.Provider value={contextValue}>
      {children}
    </NexusContext.Provider>
  );
};

export const useNexus = () => {
  const context = useContext(NexusContext);
  if (context === undefined) {
    throw new Error("useNexus must be used within a NexusProvider");
  }
  return context;
};
