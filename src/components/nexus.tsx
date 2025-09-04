import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import UnifiedBalance from "./unified-balance";
import NexusContentWrapper from "./blocks/nexus-content-wrapper";
import NexusTransfer from "./nexus-transfer";
import NexusBridge from "./bridge/nexus-bridge";
import NexusBridgeAndExecute from "./nexus-bridge-execute";
import { cn } from "@/lib/utils";
import NexusSwaps from "./nexus-swaps";

const Nexus = ({ isTestnet }: { isTestnet: boolean }) => {
  console.log("isTestnet", isTestnet);
  return (
    <Card className="bg-foreground !shadow-[var(--ck-modal-box-shadow)] !rounded-[var(--ck-connectbutton-border-radius)] border-none mx-auto w-[95%] max-w-xl">
      <CardHeader className="flex flex-col w-full items-center">
        <CardTitle className="text-xl">Nexus Upgrade</CardTitle>
        <CardDescription className="text-center">
          Allow users to seamlessly move tokens into your dApp, no bridging, and
          no confusion. Connect your wallet to experience the Nexus Effect.
        </CardDescription>
        {isTestnet && (
          <CardDescription className="text-xs text-center">
            You are on Devnet.
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="px-1 md:px-6">
        <NexusContentWrapper>
          <Tabs defaultValue="unified-balance">
            <TabsList
              className={cn(
                "grid w-full  shadow-[var(--ck-primary-button-box-shadow)]",
                isTestnet ? "grid-cols-3" : "grid-cols-5"
              )}
            >
              <TabsTrigger
                value="unified-balance"
                className="data-[state=active]:border-secondary/50 px-2"
              >
                Unified Balance
              </TabsTrigger>
              <TabsTrigger
                value="bridge"
                className="data-[state=active]:border-secondary/50 px-2"
              >
                Bridge
              </TabsTrigger>
              <TabsTrigger
                value="transfer"
                className=" data-[state=active]:border-secondary/50 px-2"
              >
                Transfer
              </TabsTrigger>
              <TabsTrigger
                value="swaps"
                className=" data-[state=active]:border-secondary/50 px-2"
              >
                Swaps
              </TabsTrigger>
              {!isTestnet && (
                <TabsTrigger
                  value="bridge-execute"
                  className=" data-[state=active]:border-secondary/50 px-2"
                >
                  Bridge & Execute
                </TabsTrigger>
              )}
            </TabsList>
            <TabsContent value="unified-balance">
              <UnifiedBalance />
            </TabsContent>
            <TabsContent value="bridge">
              <NexusBridge isTestnet={isTestnet} />
            </TabsContent>
            <TabsContent value="transfer">
              <NexusTransfer isTestnet={isTestnet} />
            </TabsContent>
            <TabsContent value="swaps">
              <NexusSwaps isTestnet={isTestnet} />
            </TabsContent>
            <TabsContent value="bridge-execute">
              <NexusBridgeAndExecute isTestnet={isTestnet} />
            </TabsContent>
          </Tabs>
        </NexusContentWrapper>
      </CardContent>
    </Card>
  );
};

export default Nexus;
