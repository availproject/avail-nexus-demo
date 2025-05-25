"use client";

import {
  NexusSDK,
  OnAllowanceHookData,
  OnIntentHookData,
} from "@avail/nexus-sdk";
import React, {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect,
  useMemo,
  useCallback,
  SetStateAction,
  Dispatch,
} from "react";

interface NexusContextType {
  nexusSdk: NexusSDK | undefined;
  isInitialized: boolean;
  allowanceModal: OnAllowanceHookData | null;
  setAllowanceModal: Dispatch<SetStateAction<OnAllowanceHookData | null>>;
  intentModal: OnIntentHookData | null;
  setIntentModal: Dispatch<SetStateAction<OnIntentHookData | null>>;
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
  const [allowanceModal, setAllowanceModal] =
    useState<OnAllowanceHookData | null>(null);
  const [intentModal, setIntentModal] = useState<OnIntentHookData | null>(null);

  const initializeSDK = useCallback(async () => {
    console.log("initializeSDK", isConnected, nexusSdk);
    if (isConnected && !nexusSdk) {
      try {
        const sdk = new NexusSDK();
        await sdk.initialize(window.ethereum);
        setNexusSdk(sdk);
        setIsInitialized(true);
        sdk.setOnAllowanceHook(async (data) => {
          // This is a hook for the dev to show user the allowances that need to be setup for the current tx to happen
          // where,
          // sources: an array of objects with minAllowance, chainID, token symbol, etc.
          // allow(allowances): continues the transaction flow with the specified allowances; `allowances` is an array with the chosen allowance for each of the requirements (allowances.length === sources.length), either 'min', 'max', a bigint or a string
          // deny(): stops the flow
          setAllowanceModal(data);
        });
        sdk.setOnIntentHook((data) => {
          // This is a hook for the dev to show user the intent, the sources and associated fees
          // where,
          // intent: Intent data containing sources and fees for display purpose
          // allow(): accept the current intent and continue the flow
          // deny(): deny the intent and stop the flow
          // refresh(): should be on a timer of 5s to refresh the intent (old intents might fail due to fee changes if not refreshed)
          setIntentModal(data);
        });
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
  }, [isConnected, cleanupSDK, initializeSDK]);

  const contextValue: NexusContextType = useMemo(
    () => ({
      nexusSdk,
      isInitialized,
      allowanceModal,
      setAllowanceModal,
      intentModal,
      setIntentModal,
    }),
    [nexusSdk, isInitialized, allowanceModal, intentModal]
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
