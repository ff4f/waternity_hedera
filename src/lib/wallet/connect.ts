import { AccountId, LedgerId, Transaction } from '@hashgraph/sdk';

let hashconnect: HashConnectInstance | null = null;
let pairingData: { accountIds: string[] } | null = null;
let HashConnect: unknown = null;

interface AppMetadata {
  name: string;
  description: string;
  icons: string[];
  url: string;
}

interface HashConnectInstance {
  pairingEvent: {
    on: (cb: (info: { accountIds: string[] }) => void) => void;
    off: (cb: (info: { accountIds: string[] }) => void) => void;
  };
  disconnectionEvent: {
    on: (cb: () => void) => void;
  };
  init: () => Promise<void>;
  openPairingModal: () => void;
  getSigner: (accountId: AccountId) => unknown;
}

const appMetadata: AppMetadata = {
  name: "Waternity",
  description: "Waternity dApp",
  icons: ["https://www.hashpack.app/img/logo.svg"],
  url: "http://localhost:3000",
};

export const initializeHashConnect = async () => {
  if (typeof window === 'undefined') return null;

  if (!HashConnect) {
    const hashconnectModule = await import('hashconnect');
    HashConnect = (hashconnectModule as unknown as { HashConnect: unknown }).HashConnect;
  }

  if (!hashconnect && HashConnect) {
    const Ctor = HashConnect as new (
      ledgerId: LedgerId,
      projectId: string,
      metadata: unknown,
      _debug?: boolean
    ) => HashConnectInstance;
    hashconnect = new Ctor(
      LedgerId.TESTNET,
      process.env.NEXT_PUBLIC_PROJECT_ID!,
      appMetadata,
      true
    );

    hashconnect.pairingEvent.on((newPairing: { accountIds: string[] }) => {
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
    const pairingEventHandler = (pairingInfo: { accountIds: string[] }) => {
      if (pairingInfo.accountIds.length > 0) {
        const accountId = AccountId.fromString(pairingInfo.accountIds[0]);
        hashconnect!.pairingEvent.off(pairingEventHandler);
        resolve(accountId);
      } else {
        reject(new Error("No account found"));
      }
    };
    hashconnect!.pairingEvent.on(pairingEventHandler);
  });
};

export const getSigner = (accountId: AccountId) => {
  if (!hashconnect) {
    throw new Error("HashConnect not initialized");
  }

  return hashconnect.getSigner(accountId);
};

export const sendTransaction = async (tx: Transaction, accountId: AccountId) => {
  if (!hashconnect) {
    throw new Error("HashConnect not initialized");
  }

  const signer = hashconnect.getSigner(accountId);

  const frozenTx = await (tx as unknown as { freezeWithSigner: (s: unknown) => Promise<unknown> }).freezeWithSigner(signer);
  const response = await (frozenTx as unknown as { executeWithSigner: (s: unknown) => Promise<{ transactionId: { toString: () => string } }> }).executeWithSigner(signer);

  return response.transactionId.toString();
};