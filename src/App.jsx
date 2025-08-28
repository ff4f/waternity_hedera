import React from "react";
import Routes from "./Routes";
import { WalletProvider } from "./lib/wallet-context";

function App() {
  return (
    <WalletProvider>
      <Routes />
    </WalletProvider>
  );
}

export default App;
