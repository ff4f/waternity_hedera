"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React, { useEffect } from "react";
import { WalletProvider } from "../lib/wallet-context";
import { UserProvider } from "../lib/auth/user-context";

const queryClient = new QueryClient();

export default function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Fire-and-forget health check to initialize DB (auto-seed) on first run
    fetch("/api/health").catch(() => {});
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <UserProvider>
        <WalletProvider>
          {children}
        </WalletProvider>
      </UserProvider>
    </QueryClientProvider>
  );
}