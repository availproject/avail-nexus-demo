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
  SetStateAction,
  Dispatch,
} from "react";

interface NexusContextType {
  nexusSdk: NexusSDK | undefined;
  isInitialized: boolean;
  allowanceModal: AllowanceModalTrigger | null;
  setAllowanceModal: Dispatch<SetStateAction<AllowanceModalTrigger | null>>;
  intentModal: IntentModalTrigger | null;
  setIntentModal: Dispatch<SetStateAction<IntentModalTrigger | null>>;
}

const NexusContext = createContext<NexusContextType | undefined>(undefined);

interface NexusProviderProps {
  children: ReactNode;
  isConnected: boolean;
}

interface AllowanceRequestData {
  sources: any[];
}

interface AllowanceResult {
  type: "min" | "max" | "custom";
  value?: string;
}

interface IntentRequestData {
  intent: any;
  refresh: () => void;
}

export interface AllowanceModalTrigger {
  data: AllowanceRequestData;
  resolve: (allowances: Array<string>) => void;
  reject: (reason?: any) => void;
}

export interface IntentModalTrigger {
  data: IntentRequestData;
  resolve: () => void;
  reject: (reason?: any) => void;
}

export const NexusProvider: React.FC<NexusProviderProps> = ({
  children,
  isConnected,
}) => {
  const [nexusSdk, setNexusSdk] = useState<NexusSDK | undefined>(undefined);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [allowanceModal, setAllowanceModal] =
    useState<AllowanceModalTrigger | null>(null);
  const [intentModal, setIntentModal] = useState<IntentModalTrigger | null>(
    null
  );

  const initializeSDK = useCallback(async () => {
    console.log("initializeSDK", isConnected, nexusSdk);
    if (isConnected && !nexusSdk) {
      try {
        const sdk = new NexusSDK();
        await sdk.initialize(window.ethereum);
        setNexusSdk(sdk);
        setIsInitialized(true);
        sdk.setOnAllowanceHook(
          async ({
            allow,
            deny,
            sources,
          }: {
            allow: (allowances: any[]) => void;
            deny: () => void;
            sources: any[];
          }) => {
            // This is a hook for the dev to show user the allowances that need to be setup for the current tx to happen
            // where,
            // sources: an array of objects with minAllowance, chainID, token symbol, etc.
            // allow(allowances): continues the transaction flow with the specified allowances; `allowances` is an array with the chosen allowance for each of the requirements (allowances.length === sources.length), either 'min', 'max', a bigint or a string
            // deny(): stops the flow
            console.log("setOnAllowanceHook triggered:", sources);
            try {
              const result = await new Promise<string[]>((resolve, reject) => {
                setAllowanceModal({ data: { sources }, resolve, reject });
              });
              console.log("Allowance selection from UI:", result);

              // Pass the allowances directly to the SDK
              allow(result);
            } catch (rejectionReason) {
              console.log("Allowance denied via UI:", rejectionReason);
              deny();
            } finally {
              setAllowanceModal(null);
            }
          }
        );
        sdk.setOnIntentHook(
          ({
            intent,
            allow,
            deny,
            refresh,
          }: {
            intent: any;
            allow: () => void;
            deny: () => void;
            refresh: () => void;
          }) => {
            // This is a hook for the dev to show user the intent, the sources and associated fees
            // where,
            // intent: Intent data containing sources and fees for display purpose
            // allow(): accept the current intent and continue the flow
            // deny(): deny the intent and stop the flow
            // refresh(): should be on a timer of 5s to refresh the intent (old intents might fail due to fee changes if not refreshed)
            console.log("setOnIntentHook triggered:", intent);
            new Promise<void>((resolve, reject) => {
              setIntentModal({ data: { intent, refresh }, resolve, reject });
            })
              .then(() => {
                console.log("Intent approved via UI.");
                allow();
              })
              .catch((rejectionReason) => {
                console.log("Intent denied via UI:", rejectionReason);
                deny();
              })
              .finally(() => {
                setIntentModal(null);
              });
          }
        );
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
