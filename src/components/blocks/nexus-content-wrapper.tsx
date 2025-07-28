"use client";
import { useNexus } from "@/provider/NexusProvider";
import React from "react";
import ConnectWallet from "./connect-wallet";

const NexusContentWrapper = ({ children }: { children: React.ReactNode }) => {
  const { isInitialized } = useNexus();
  return (
    <>
      {isInitialized ? (
        <>{children}</>
      ) : (
        <div className="w-full flex items-center justify-center">
          <ConnectWallet connectCopy="Connect to experience the Nexus effect" />
        </div>
      )}
    </>
  );
};
export default NexusContentWrapper;
