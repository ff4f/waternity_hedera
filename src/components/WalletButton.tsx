"use client";

import { AccountId } from "@hashgraph/sdk";
import { useCallback, useEffect, useState } from "react";
import { initializeHashConnect, connectToHashPack } from "@/lib/wallet/connect";

export default function WalletButton() {
    const [accountId, setAccountId] = useState<AccountId | null>(null);

    const handleConnect = useCallback(async () => {
        try {
            await initializeHashConnect();
            const accId = await connectToHashPack();
            setAccountId(accId as AccountId);
        } catch (error) {
            console.error("Error connecting to HashPack:", error);
        }
    }, []);

    return (
        <div>
            {accountId ? (
                <p>Connected with: {accountId.toString()}</p>
            ) : (
                <button onClick={handleConnect}>Connect Wallet</button>
            )}
        </div>
    );
}