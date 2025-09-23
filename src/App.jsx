import React from "react";
import Routes from "./Routes";
import { WalletProvider } from "./lib/wallet-context";
import ClientOnly from "./components/ClientOnly";

function App() {
  return (
    <ClientOnly fallback={<div>Loading...</div>}>
      <WalletProvider>
        <Routes />
      </WalletProvider>
    </ClientOnly>
  );
}

export default App;
