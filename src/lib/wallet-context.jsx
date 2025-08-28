import React, { createContext, useContext, useState, useMemo } from 'react';

const WalletContext = createContext({ wallet: { connected: false, accountId: '', state: 'Disconnected' }, setWallet: () => {} });

export function WalletProvider({ children, initial }) {
  const [wallet, setWallet] = useState(initial || { connected: false, accountId: '', state: 'Disconnected' });
  const value = useMemo(() => ({ wallet, setWallet }), [wallet]);
  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWalletContext() {
  return useContext(WalletContext);
}