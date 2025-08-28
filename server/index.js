/* eslint-disable no-console */
const express = require("express");
const cors = require("cors");
// Removed body-parser in favor of built-in express.json()
const { Client, TopicCreateTransaction, TopicMessageSubmitTransaction, Hbar, AccountId, PrivateKey, TokenCreateTransaction, TokenType, TokenSupplyType, TokenMintTransaction } = require("@hashgraph/sdk");

const PORT = process.env.PORT || 8787;
const HEDERA_NET = process.env.HEDERA_NET || "testnet";
const OPERATOR_ID = process.env.OPERATOR_ID;
const OPERATOR_KEY = process.env.OPERATOR_KEY;
const MIRROR_NODE = process.env.MIRROR_NODE || (HEDERA_NET === 'mainnet' ? 'https://mainnet-public.mirrornode.hedera.com' : 'https://testnet.mirrornode.hedera.com');

// P0-1: Multi-topic ENV
const EVENTS_TOPIC_ID = process.env.EVENTS_TOPIC_ID || ""; // water.events (meter readings)
const SETTLEMENTS_TOPIC_ID = process.env.SETTLEMENTS_TOPIC_ID || ""; // water.settlements
const ANCHORS_TOPIC_ID = process.env.ANCHORS_TOPIC_ID || ""; // water.anchors

// Track last created/minted tokens (for audit links)
let lastHTSTokenId = "";
let lastHTSNftTokenId = "";
const MANIFEST_URI = process.env.MANIFEST_URI || 
  "ipfs://bafybeigdyrhk7yxxwellswl001manifest/manifest.json";
if (!OPERATOR_ID || !OPERATOR_KEY) {
  console.warn("[WARN] Missing OPERATOR_ID/OPERATOR_KEY env. HCS/HTS actions will fail.");
}

const app = express();
app.use(cors());
app.use(express.json());

function hederaClient() {
  const client = Client.forName(HEDERA_NET);
  if (OPERATOR_ID && OPERATOR_KEY) {
    client.setOperator(AccountId.fromString(OPERATOR_ID), PrivateKey.fromString(OPERATOR_KEY));
  }
  return client;
}

// In-memory recent events per topic (not persistent, demo only)
const recentByTopic = new Map(); // topicId -> [{txId, type, ts, wellId, payload}]
function pushRecent(topicId, item) {
  const arr = recentByTopic.get(topicId) || [];
  arr.unshift(item);
  if (arr.length > 100) arr.pop();
  recentByTopic.set(topicId, arr);
}

// Canonical schema normalizer for HCS messages
function normalizeEventMessage(msg) {
  // Accept either string or object
  let obj;
  if (typeof msg === "string") {
    try { obj = JSON.parse(msg); } catch { obj = { type: "RAW", payload: { raw: String(msg) } }; }
  } else if (typeof msg === "object" && msg) {
    obj = { ...msg };
  } else {
    obj = { type: "RAW", payload: { raw: String(msg) } };
  }

  const now = new Date().toISOString();
  const type = obj.type || "RAW";
  const wellId = obj.wellId || obj.payload?.wellId || "WELL-UNK";
  const ts = obj.ts || now;

  // Harmonize meter fields
  const volumeLiters = obj.volumeLiters ?? obj.volume ?? obj.payload?.volumeLiters ?? obj.payload?.volume;
  const payload = { ...obj.payload };
  if (volumeLiters != null) payload.volumeLiters = Number(volumeLiters);

  return { type, wellId, ts, payload };
}

// Seeder state
const seeders = new Map(); // topicId -> interval

// Routes
app.get("/api/health", (_, res) => res.json({ ok: true }));

// Config expose
app.get("/api/hcs/config", (req, res) => {
  res.json({
    network: HEDERA_NET,
    mirror: MIRROR_NODE,
    topics: {
      events: EVENTS_TOPIC_ID,
      settlements: SETTLEMENTS_TOPIC_ID,
      anchors: ANCHORS_TOPIC_ID,
    },
  });
});

// Create HCS topic
app.post("/api/hcs/topic", async (req, res) => {
  try {
    const client = hederaClient();
    const tx = await new TopicCreateTransaction().setAdminKey(PrivateKey.fromString(OPERATOR_KEY).publicKey).execute(client);
    const rx = await tx.getReceipt(client);
    const topicId = rx.topicId.toString();
    res.json({ topicId });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: String(e) });
  }
});

// Submit message to topic
app.post("/api/hcs/submit", async (req, res) => {
  const { topicId, message } = req.body || {};
  if (!topicId) return res.status(400).json({ error: "topicId required" });
  try {
    const norm = normalizeEventMessage(message);
    const client = hederaClient();
    const msg = Buffer.from(JSON.stringify(norm));
    const tx = await new TopicMessageSubmitTransaction().setTopicId(topicId).setMessage(msg).execute(client);
    const rx = await tx.getReceipt(client);
    const txId = tx.transactionId.toString();
    pushRecent(topicId, { txId, ...norm });
    res.json({ ok: true, txId, status: rx.status.toString() });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: String(e) });
  }
});

// Seeder: start
app.post("/api/hcs/seed/start", async (req, res) => {
  const { topicId, intervalMs = 3000, wellId = "WELL-NE-001" } = req.body || {};
  if (!topicId) return res.status(400).json({ error: "topicId required" });
  if (seeders.has(topicId)) return res.json({ ok: true, status: "already" });
  const client = hederaClient();
  const interval = setInterval(async () => {
    try {
      const reading = normalizeEventMessage({ type: "METER_READING", wellId, volumeLiters: Math.random() < 0.5 ? 50 : 200, ts: new Date().toISOString() });
      const tx = await new TopicMessageSubmitTransaction().setTopicId(topicId).setMessage(JSON.stringify(reading)).execute(client);
      await tx.getReceipt(client);
      const txId = tx.transactionId.toString();
      pushRecent(topicId, { txId, ...reading });
    } catch (e) {
      console.warn("seed error", e?.message || e);
    }
  }, intervalMs);
  seeders.set(topicId, interval);
  res.json({ ok: true, status: "started" });
});

// Seeder: stop
app.post("/api/hcs/seed/stop", (req, res) => {
  const { topicId } = req.body || {};
  if (!topicId) return res.status(400).json({ error: "topicId required" });
  const it = seeders.get(topicId);
  if (it) clearInterval(it);
  seeders.delete(topicId);
  res.json({ ok: true, status: "stopped" });
});

// Operate: Dry-run valve command (logs to HCS events topic, no execution)
app.post("/api/operate/valve/dryrun", async (req, res) => {
  try {
    const { topicId = EVENTS_TOPIC_ID, percent = 0, reason = "", wellId = "WELL-NE-001" } = req.body || {};
    if (!topicId) return res.status(400).json({ error: "topicId required (events topic)" });
    const message = normalizeEventMessage({
      type: "VALVE_COMMAND_DRYRUN",
      wellId,
      payload: { percent: Number(percent), reason: String(reason) },
      ts: new Date().toISOString(),
    });
    const client = hederaClient();
    const tx = await new TopicMessageSubmitTransaction().setTopicId(topicId).setMessage(JSON.stringify(message)).execute(client);
    const rx = await tx.getReceipt(client);
    const txId = tx.transactionId.toString();
    pushRecent(topicId, { txId, ...message });
    res.json({ ok: true, status: rx.status.toString(), txId, topicId });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: String(e) });
  }
});

// Events buffer read
app.get("/api/hcs/events", (req, res) => {
  const topicId = req.query.topicId || EVENTS_TOPIC_ID;
  const limit = Math.min(parseInt(req.query.limit || "20", 10), 100);
  if (!topicId) return res.status(400).json({ error: "topicId required" });
  const arr = recentByTopic.get(topicId) || [];
  res.json({ topicId, events: arr.slice(0, limit) });
});

// Settlement preview (pure function on inputs)
app.post("/api/settle/preview", (req, res) => {
  try {
    const { liters = 0, tariff = 0.0008, split = { op: 0.5, inv: 0.4, plat: 0.1 }, coverageTarget = 1.2 } = req.body || {};
    const gross = Number(liters) * Number(tariff);
    const out = {
      liters: Number(liters),
      tariff: Number(tariff),
      gross: Number(gross.toFixed(6)),
      split: {
        op: Number((gross * split.op).toFixed(6)),
        inv: Number((gross * split.inv).toFixed(6)),
        plat: Number((gross * split.plat).toFixed(6)),
      },
      coverageTarget: Number(coverageTarget),
      coverageRatio: Number((gross > 0 ? gross / (gross / coverageTarget) : 0).toFixed(3)),
      window: { from: new Date(Date.now() - 24 * 3600 * 1000).toISOString(), to: new Date().toISOString() },
    };
    res.json(out);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// Execute settlement: aggregate and submit to settlements topic
app.post("/api/settle/execute", async (req, res) => {
  try {
    const {
      liters = 0,
      tariff = 0.0008,
      split = { op: 0.5, inv: 0.4, plat: 0.1 },
      eventsTopicId = EVENTS_TOPIC_ID,
      settlementsTopicId = SETTLEMENTS_TOPIC_ID,
    } = req.body || {};

    const targetTopicId = settlementsTopicId || SETTLEMENTS_TOPIC_ID;
    if (!targetTopicId) return res.status(400).json({ error: "settlementsTopicId required (or set SETTLEMENTS_TOPIC_ID env)" });

    // Determine well scope from recent events (if available)
    const evArr = eventsTopicId ? (recentByTopic.get(eventsTopicId) || []) : [];
    const uniqueWells = Array.from(new Set(evArr.slice(0, 50).map((e) => e.wellId).filter(Boolean)));
    const wellId = uniqueWells.length === 1 ? uniqueWells[0] : uniqueWells.length > 1 ? "MULTI" : "WELL-AGG";

    const gross = Number(liters) * Number(tariff);
    const settlement = {
      type: "SETTLEMENT_EXECUTED",
      wellId,
      ts: new Date().toISOString(),
      payload: {
        liters: Number(liters),
        tariff: Number(tariff),
        gross: Number(gross.toFixed(6)),
        split: {
          op: Number((gross * split.op).toFixed(6)),
          inv: Number((gross * split.inv).toFixed(6)),
          plat: Number((gross * split.plat).toFixed(6)),
        },
        window: { from: new Date(Date.now() - 24 * 3600 * 1000).toISOString(), to: new Date().toISOString() },
      },
    };

    const client = hederaClient();
    const tx = await new TopicMessageSubmitTransaction().setTopicId(targetTopicId).setMessage(JSON.stringify(settlement)).execute(client);
    const rx = await tx.getReceipt(client);
    const txId = tx.transactionId.toString();
    pushRecent(targetTopicId, { txId, ...settlement });

    res.json({ ok: true, txId, status: rx.status.toString(), topicId: targetTopicId, settlement: settlement.payload });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: String(e) });
  }
});

// Anchor preview: mock bundle + merkle
function simpleMerkle(leaves) {
  const crypto = require("crypto");
  const hash = (d) => crypto.createHash("sha256").update(d).digest("hex");
  let layer = leaves.map((x) => hash(x));
  if (layer.length === 0) return "";
  while (layer.length > 1) {
    const next = [];
    for (let i = 0; i < layer.length; i += 2) {
      const a = layer[i];
      const b = layer[i + 1] || a;
      next.push(hash(a + b));
    }
    layer = next;
  }
  return layer[0];
}

app.post("/api/anchor/preview", (req, res) => {
  try {
    const { topicId = EVENTS_TOPIC_ID, count = 10 } = req.body || {};
    if (!topicId) return res.status(400).json({ error: "topicId required" });
    const events = (recentByTopic.get(topicId) || []).slice(0, count);
    const leaves = events.map((e) => JSON.stringify({ txId: e.txId, type: e.type, ts: e.ts }));
    const merkleRoot = simpleMerkle(leaves);
    res.json({ topicId, leaves: leaves.length, merkleRoot, sample: events.slice(0, 3) });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// Execute anchor: compute merkle from events topic and submit to anchors topic
app.post("/api/anchor/execute", async (req, res) => {
  try {
    const {
      eventsTopicId = EVENTS_TOPIC_ID,
      anchorsTopicId = ANCHORS_TOPIC_ID,
      count = 16,
    } = req.body || {};

    const sourceTopicId = eventsTopicId || EVENTS_TOPIC_ID;
    const targetTopicId = anchorsTopicId || ANCHORS_TOPIC_ID;
    if (!sourceTopicId) return res.status(400).json({ error: "eventsTopicId required (or set EVENTS_TOPIC_ID env)" });
    if (!targetTopicId) return res.status(400).json({ error: "anchorsTopicId required (or set ANCHORS_TOPIC_ID env)" });

    const events = (recentByTopic.get(sourceTopicId) || []).slice(0, count);
    const leaves = events.map((e) => JSON.stringify({ txId: e.txId, type: e.type, ts: e.ts }));
    const merkleRoot = simpleMerkle(leaves);

    const anchorMsg = {
      type: "ANCHOR_EXECUTED",
      wellId: events[0]?.wellId || "WELL-AGG",
      ts: new Date().toISOString(),
      payload: {
        sourceTopicId,
        leaves: leaves.length,
        merkleRoot,
        sample: events.slice(0, 3).map((e) => ({ txId: e.txId, type: e.type, ts: e.ts })),
      },
    };

    const client = hederaClient();
    const tx = await new TopicMessageSubmitTransaction().setTopicId(targetTopicId).setMessage(JSON.stringify(anchorMsg)).execute(client);
    const rx = await tx.getReceipt(client);
    const txId = tx.transactionId.toString();
    pushRecent(targetTopicId, { txId, ...anchorMsg });

    res.json({ ok: true, txId, status: rx.status.toString(), topicId: targetTopicId, merkleRoot, leaves: leaves.length });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: String(e) });
  }
});

// HTS: create FT and mint
app.post("/api/hts/token/create", async (req, res) => {
  try {
    const { name = "WaterCredit", symbol = "WCR", decimals = 6 } = req.body || {};
    const client = hederaClient();
    const tx = await new TokenCreateTransaction()
      .setTokenName(name)
      .setTokenSymbol(symbol)
      .setDecimals(decimals)
      .setInitialSupply(0)
      .setTokenType(TokenType.FungibleCommon)
      .setSupplyType(TokenSupplyType.Infinite)
      .setTreasuryAccountId(OPERATOR_ID)
      .setAdminKey(PrivateKey.fromString(OPERATOR_KEY))
      .setSupplyKey(PrivateKey.fromString(OPERATOR_KEY))
      .setFreezeDefault(false)
      .setMaxTransactionFee(new Hbar(2))
      .execute(client);
    const rx = await tx.getReceipt(client);
    res.json({ tokenId: rx.tokenId.toString(), status: rx.status.toString() });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: String(e) });
  }
});

app.post("/api/hts/token/mint", async (req, res) => {
  try {
    const { tokenId, amount = 100000 } = req.body || {};
    if (!tokenId) return res.status(400).json({ error: "tokenId required" });
    const client = hederaClient();
    const tx = await new TokenMintTransaction()
      .setTokenId(tokenId)
      .setAmount(amount)
      .setMaxTransactionFee(new Hbar(2))
      .execute(client);
    const rx = await tx.getReceipt(client);
    res.json({ ok: true, status: rx.status.toString() });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: String(e) });
  }
});

// HTS NFT: create a non-fungible token for a Well
app.post("/api/hts/nft/create", async (req, res) => {
  try {
    const { name = "Well NFT", symbol = "WELL", memo = "Waternity RWA Well" } = req.body || {};
    const client = hederaClient();
    const tx = await new TokenCreateTransaction()
      .setTokenName(name)
      .setTokenSymbol(symbol)
      .setTokenMemo(memo)
      .setTreasuryAccountId(AccountId.fromString(OPERATOR_ID))
      .setTokenType(TokenType.NonFungibleUnique)
      .setSupplyType(TokenSupplyType.Infinite)
      .freezeWith(client)
      .sign(PrivateKey.fromString(OPERATOR_KEY));
    const submit = await tx.execute(client);
    const rx = await submit.getReceipt(client);
    const tokenId = rx.tokenId.toString();
    lastHTSNftTokenId = tokenId;
    res.json({ ok: true, status: rx.status.toString(), tokenId });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: String(e) });
  }
});

// HTS NFT: mint 1 NFT with metadataURI (manifest)
app.post("/api/hts/nft/mint", async (req, res) => {
  try {
    const { tokenId = lastHTSNftTokenId, metadataURI = MANIFEST_URI } = req.body || {};
    if (!tokenId) return res.status(400).json({ error: "tokenId required (or create NFT first)" });
    const client = hederaClient();
    const meta = Buffer.from(String(metadataURI));
    const tx = await new TokenMintTransaction().setTokenId(tokenId).setMetadata([meta]).execute(client);
    const rx = await tx.getReceipt(client);
    const serials = (rx.serials && Array.from(rx.serials).map(String)) || [];
    res.json({ ok: true, status: rx.status.toString(), tokenId, serials });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: String(e) });
  }
});

// Audit reports: aggregate recent events for export/demo
app.get("/api/audit/reports", (req, res) => {
  try {
    const pick = (e) => ({
      txId: e?.txId || null,
      type: e?.type || null,
      ts: e?.ts || null,
      wellId: e?.wellId || null,
      volumeLiters: e?.payload?.volumeLiters ?? null,
    });

    const getArr = (topicId) => (topicId ? (recentByTopic.get(topicId) || []) : []);

    const evArr = getArr(EVENTS_TOPIC_ID);
    const stArr = getArr(SETTLEMENTS_TOPIC_ID);
    const anArr = getArr(ANCHORS_TOPIC_ID);

    // KPI (dummy from recent events)
    const liters = evArr.reduce((acc, e) => acc + (Number(e?.payload?.volumeLiters) || 0), 0);
    const tariff = 0.0008;
    const gross = Number((liters * tariff).toFixed(6));
    const split = { op: Number((gross * 0.5).toFixed(6)), inv: Number((gross * 0.4).toFixed(6)), plat: Number((gross * 0.1).toFixed(6)) };
    const coverageTarget = 1.2;
    const coverageRatio = Number((gross > 0 ? gross / (gross / coverageTarget) : 0).toFixed(3));

    const net = HEDERA_NET;
    const hsTopic = (id) => (id ? `https://hashscan.io/${net}/topic/${id}` : null);
    const hsToken = (id) => (id ? `https://hashscan.io/${net}/token/${id}` : null);
    const hfs = MANIFEST_URI ? { manifestUri: MANIFEST_URI, gateway: MANIFEST_URI.startsWith("ipfs://") ? `https://ipfs.io/ipfs/${MANIFEST_URI.replace("ipfs://", "")}` : MANIFEST_URI } : null;

    const body = {
      network: HEDERA_NET,
      mirror: MIRROR_NODE,
      topics: {
        events: EVENTS_TOPIC_ID || null,
        settlements: SETTLEMENTS_TOPIC_ID || null,
        anchors: ANCHORS_TOPIC_ID || null,
      },
      kpi: { liters, tariff, gross, split, coverageTarget, coverageRatio },
      links: {
        hcs: { events: hsTopic(EVENTS_TOPIC_ID), settlements: hsTopic(SETTLEMENTS_TOPIC_ID), anchors: hsTopic(ANCHORS_TOPIC_ID) },
        hts: { tokenId: lastHTSTokenId || null, tokenLink: hsToken(lastHTSTokenId) || null, nftTokenId: lastHTSNftTokenId || null, nftTokenLink: hsToken(lastHTSNftTokenId) || null },
        hfs,
      },
      snapshotAt: new Date().toISOString(),
      counts: {
        events: evArr.length,
        settlements: stArr.length,
        anchors: anArr.length,
      },
      latest: {
        events: evArr[0] ? pick(evArr[0]) : null,
        settlements: stArr[0] ? pick(stArr[0]) : null,
        anchors: anArr[0] ? pick(anArr[0]) : null,
      },
      events: {
        events: evArr.map(pick),
        settlements: stArr.map(pick),
        anchors: anArr.map(pick),
      },
    };

    res.json(body);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

app.listen(PORT, () => console.log(JSON.stringify({ level: 'info', msg: 'server_listening', port: PORT, network: HEDERA_NET, mirror: MIRROR_NODE })));