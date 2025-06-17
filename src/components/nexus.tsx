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
import NexusExecute from "./nexus-execute";

const Nexus = () => {
  return (
    <Card className="bg-accent-foreground !shadow-[var(--ck-modal-box-shadow)] !rounded-[var(--ck-connectbutton-border-radius)] border-none min-w-2xs">
      <CardHeader className="flex flex-col w-full items-center">
        <CardTitle className="text-xl">Nexus</CardTitle>
        <CardDescription className="text-center">
          Nexus is a platform for creating and managing your own Nexus.
        </CardDescription>
      </CardHeader>
      <CardContent>
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
                value="execute"
                className=" data-[state=active]:border-secondary/50 "
              >
                Execute
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
            <TabsContent value="execute">
              <NexusExecute />
            </TabsContent>
          </Tabs>
        </NexusContentWrapper>
      </CardContent>
    </Card>
  );
};

export default Nexus;
