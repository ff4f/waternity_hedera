export const hashscanTx = (txId: string, network: "testnet" | "mainnet" | "previewnet" = "testnet") =>
  `https://hashscan.io/${network}/transaction/${encodeURIComponent(txId)}`;