import { HashConnect, SessionData, HashConnectConnectionState } from 'hashconnect';
import { AccountId, LedgerId, Transaction, TransactionId } from '@hashgraph/sdk';

let hashconnect: HashConnect | null = null;
let pairingData: SessionData | null = null;

const appMetadata = {
    name: "Waternity",
    description: "Waternity dApp",
    icons: ["https://www.hashpack.app/img/logo.svg"],
    url: "http://localhost:3000"
};

export const initializeHashConnect = async () => {
    if (!hashconnect) {
        hashconnect = new HashConnect(LedgerId.TESTNET, process.env.NEXT_PUBLIC_PROJECT_ID!, appMetadata, true);

        hashconnect.pairingEvent.on((newPairing: SessionData) => {
            pairingData = newPairing;
        });

        hashconnect.disconnectionEvent.on(() => {
            pairingData = null;
        });

        await hashconnect.init();
    }

    return { hashconnect, pairingData };
};

export const connectToHashPack = async () => {
    if (!hashconnect) {
        throw new Error("HashConnect not initialized");
    }

    if (!pairingData) {
        hashconnect.openPairingModal();
    }

    return new Promise<AccountId>((resolve, reject) => {
        const pairingEventHandler = (pairingInfo: SessionData) => {
            if (pairingInfo.accountIds.length > 0) {
                const accountId = AccountId.fromString(pairingInfo.accountIds[0]);
                hashconnect!.pairingEvent.off(pairingEventHandler);
                resolve(accountId);
            } else {
                reject(new Error("No account found"));
            }
        };
        hashconnect.pairingEvent.on(pairingEventHandler);
    });
};

export const getSigner = (accountId: AccountId) => {
    if (!hashconnect) {
        throw new Error("HashConnect not initialized");
    }
    
    return hashconnect.getSigner(accountId as any);
};

export const sendTransaction = async (tx: Transaction, accountId: AccountId) => {
    if (!hashconnect) {
        throw new Error("HashConnect not initialized");
    }

    const signer = hashconnect.getSigner(accountId as any);
    
    const frozenTx = await tx.freezeWithSigner(signer as any);
    const response = await frozenTx.executeWithSigner(signer as any);

    return response.transactionId.toString();
};