"use client";

import { useMetaMask } from "@/hooks/metamask/useMetaMaskProvider";
import { useInMemoryStorage } from "@/hooks/useInMemoryStorage";
import { useState } from "react";

export function WalletButton() {
  const { provider, accounts, isConnected, connect, error } = useMetaMask();
  const { storage } = useInMemoryStorage();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleDisconnect = async () => {
    await storage.removeItem("wallet.lastConnectorId");
    await storage.removeItem("wallet.lastAccounts");
    await storage.removeItem("wallet.lastChainId");
    await storage.removeItem("wallet.connected");
    setIsDropdownOpen(false);
    window.location.reload();
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (!isConnected || !accounts || accounts.length === 0) {
    return (
      <button
        onClick={connect}
        className="px-4 py-2.5 bg-gradient-to-r from-primary to-secondary text-primary-foreground rounded-lg hover:from-primary/90 hover:to-secondary/90 transition-all shadow-md hover:shadow-lg font-semibold text-sm"
      >
        Connect Wallet
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="px-4 py-2.5 bg-gradient-to-r from-primary to-secondary text-primary-foreground rounded-lg hover:from-primary/90 hover:to-secondary/90 transition-all shadow-md hover:shadow-lg font-semibold text-sm flex items-center gap-2"
      >
        <div className="w-2 h-2 bg-primary-foreground rounded-full animate-pulse"></div>
        {formatAddress(accounts[0])}
      </button>
      {isDropdownOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white border-2 border-border rounded-xl shadow-2xl p-4 z-50">
          <div className="space-y-3">
            <div className="pb-3 border-b border-border">
              <p className="text-xs font-semibold text-foreground/70 mb-2 uppercase tracking-wide">Connected Wallet</p>
              <p className="text-sm font-mono break-all bg-surface/80 text-foreground p-2.5 rounded-lg border border-border/50">{accounts[0]}</p>
            </div>
            <button
              onClick={handleDisconnect}
              className="w-full px-4 py-2.5 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors font-semibold text-sm shadow-sm"
            >
              Disconnect
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


