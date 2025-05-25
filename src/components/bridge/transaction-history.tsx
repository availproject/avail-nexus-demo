"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { History, ExternalLink } from "lucide-react";
import { useTransactionHistory } from "@/hooks/bridge/useTransactionHistory";
import {
  formatTimestamp,
  formatDisplayAmount,
  getStatusIcon,
  getStatusBadgeVariant,
} from "@/lib/bridge/formatters";
import Link from "next/link";

/**
 * Transaction history component with toggle and transaction list
 */
export const TransactionHistory: React.FC = () => {
  const { recentTransactions, showHistory, totalCount, toggleHistory } =
    useTransactionHistory();

  return (
    <>
      {/* History Toggle Button */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Bridge Assets</h3>
        <Button
          variant="connectkit"
          onClick={toggleHistory}
          className="flex items-center gap-2 bg-accent-foreground"
        >
          <History className="w-4 h-4" />
          History ({totalCount})
        </Button>
      </div>

      {/* Transaction History Panel */}
      {showHistory && (
        <Card className="!shadow-[var(--ck-modal-box-shadow)] !rounded-[var(--ck-connectbutton-border-radius)] bg-accent-foreground border-none">
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Recent Transactions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 ">
            {recentTransactions.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No transactions yet
              </p>
            ) : (
              recentTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-2 rounded border font-medium"
                >
                  <div className="flex items-center gap-2">
                    {getStatusIcon(tx.status)}
                    <div>
                      <p className="text-sm font-medium ">
                        {tx.amount && tx.token
                          ? formatDisplayAmount(tx.amount, tx.token)
                          : "Unknown Amount"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatTimestamp(tx.timestamp)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant={getStatusBadgeVariant(tx.status)}>
                      {tx.status}
                    </Badge>

                    {tx.explorerURL && (
                      <Link
                        href={tx.explorerURL}
                        target="_blank"
                        className="hover:bg-transparent hover:text-secondary cursor-pointer"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                    )}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}
    </>
  );
};
