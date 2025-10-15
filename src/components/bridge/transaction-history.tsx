"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { History, ExternalLink, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Separator } from "../ui/separator";
import { useSDKTransactionHistory } from "@/hooks/useSDKTransactionHistory";
import { CHAIN_METADATA, RequestForFunds } from "@avail-project/nexus-core";
import Image from "next/image";

/**
 * Transaction history component with toggle and transaction list
 */
export const TransactionHistory: React.FC = () => {
  const [showHistory, setShowHistory] = useState(false);
  const { transactions, getTransactionStatus, totalCount, loading, error } =
    useSDKTransactionHistory();

  // Helper function to render status badge
  const renderStatusBadge = (status: string) => {
    const variants: Record<
      string,
      "default" | "destructive" | "outline" | "secondary"
    > = {
      completed: "default",
      failed: "destructive",
      pending: "secondary",
    };

    return (
      <Badge variant={variants[status] || "outline"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (loading) {
    return <div className="text-center py-4">Loading transactions...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500 py-4">{error}</div>;
  }

  if (transactions.length === 0) {
    return null;
  }

  return (
    <>
      {/* History Toggle Button */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Bridge Assets</h3>
        <Button
          variant="connectkit"
          onClick={() => setShowHistory(!showHistory)}
          className="flex items-center gap-2 bg-accent-foreground"
        >
          <History className="w-4 h-4" />
          History ({totalCount})
        </Button>
      </div>

      {/* Transaction History Panel */}
      {showHistory && (
        <Card className="!shadow-[var(--ck-modal-box-shadow)] !rounded-[var(--ck-connectbutton-border-radius)] bg-accent-foreground border-none gap-y-1">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">
              Recent Transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-y-2">
              {transactions.map((tx: RequestForFunds) => (
                <div
                  key={tx.id.toString()}
                  className="px-4 py-2 rounded-lg border border-border bg-background/50"
                >
                  {/* Header with Status and Explorer Link */}
                  <div className="flex items-center justify-between w-full">
                    {renderStatusBadge(getTransactionStatus(tx))}
                    {tx.id && (
                      <Link
                        href={`https://explorer.nexus.availproject.org/intent/${tx.id}`}
                        target="_blank"
                        className="hover:bg-transparent hover:text-secondary cursor-pointer flex items-center gap-x-2 text-sm font-semibold"
                      >
                        View on Explorer
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-x-2 w-full py-2">
                    <p className="text-sm font-medium">
                      Transaction ID: {tx.id.toString()}
                    </p>
                    <div className="flex items-center gap-x-2">
                      <Image
                        src={CHAIN_METADATA[Number(tx.sources[0].chainID)].logo}
                        alt={CHAIN_METADATA[Number(tx.sources[0].chainID)].name}
                        width={28}
                        height={28}
                      />
                      <ArrowRight className="w-5 h-5" />
                      <Image
                        src={CHAIN_METADATA[Number(tx.destinationChainID)].logo}
                        alt={CHAIN_METADATA[Number(tx.destinationChainID)].name}
                        width={28}
                        height={28}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      <Separator />
    </>
  );
};
