"use client";
import { Avatar, ConnectKitButton } from "connectkit";
import React from "react";
import { Button } from "../ui/button";

const ConnectWallet = ({
  connectCopy = "Connect",
}: {
  connectCopy?: string;
}) => {
  return (
    <ConnectKitButton.Custom>
      {({ isConnected, show, address, truncatedAddress }) => (
        <div className="flex items-center gap-x-2">
          <Button variant="connectkit" onClick={show}>
            {isConnected && <Avatar size={20} address={address} />}
            {isConnected ? truncatedAddress : connectCopy}
          </Button>
        </div>
      )}
    </ConnectKitButton.Custom>
  );
};

export default ConnectWallet;
