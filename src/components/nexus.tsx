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
import NexusContentWrapper from "./nexus-content-wrapper";
import NexusBridge from "./nexus-bridge";
import NexusTransfer from "./nexus-transfer";

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
            <TabsList className="grid w-full grid-cols-3 shadow-[var(--ck-primary-button-box-shadow)]">
              <TabsTrigger value="unified-balance">Unified Balance</TabsTrigger>
              <TabsTrigger value="bridge">Bridge</TabsTrigger>
              <TabsTrigger value="transfer">Transfer</TabsTrigger>
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
          </Tabs>
        </NexusContentWrapper>
      </CardContent>
    </Card>
  );
};

export default Nexus;
