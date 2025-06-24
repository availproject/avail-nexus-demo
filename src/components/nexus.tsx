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

const Nexus = () => {
  return (
    <Card className="bg-accent-foreground !shadow-[var(--ck-modal-box-shadow)] !rounded-[var(--ck-connectbutton-border-radius)] border-none mx-auto w-[95%] max-w-lg">
      <CardHeader className="flex flex-col w-full items-center">
        <CardTitle className="text-xl">Nexus</CardTitle>
        <CardDescription className="text-center">
          Cross-chain transactions made easy.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-1 md:px-6">
        <NexusContentWrapper>
          <Tabs defaultValue="unified-balance">
            <TabsList className="grid w-full grid-cols-4 shadow-[var(--ck-primary-button-box-shadow)]">
              <TabsTrigger
                value="unified-balance"
                className="data-[state=active]:border-secondary/50 "
              >
                Unified Balance
              </TabsTrigger>
              <TabsTrigger
                value="bridge"
                className="data-[state=active]:border-secondary/50 "
              >
                Bridge
              </TabsTrigger>
              <TabsTrigger
                value="transfer"
                className=" data-[state=active]:border-secondary/50 "
              >
                Transfer
              </TabsTrigger>
              <TabsTrigger
                value="bridge-execute"
                className=" data-[state=active]:border-secondary/50 "
              >
                Bridge & Execute
              </TabsTrigger>
            </TabsList>
            <TabsContent value="unified-balance">
              <UnifiedBalance />
            </TabsContent>
            <TabsContent value="bridge">
              <NexusBridge />
            </TabsContent>
            <TabsContent value="transfer">
              <NexusTransfer />
            </TabsContent>
            <TabsContent value="bridge-execute">
              <NexusBridgeAndExecute />
            </TabsContent>
          </Tabs>
        </NexusContentWrapper>
      </CardContent>
    </Card>
  );
};

export default Nexus;
