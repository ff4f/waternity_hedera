import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../lib/api";
import { LedgerId } from "@hashgraph/sdk";
import RoleBadge from "../../components/ui/RoleBadge";
import { getRoleByWallet } from "../../lib/rbac";
import { useWalletContext } from "../../lib/wallet-context";

// Utils
function fmt(n) {
  if (typeof n === "number") {
    return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
  }
  return n;
}

function nowTxRef() {
  const d = new Date();
  const sec = Math.floor(d.getTime() / 1000);
  const nano = (d.getMilliseconds() * 1_000_000).toString().padStart(9, "0");
  return `${sec}.${nano}`;
}

function hashscanTxLink(ref) {
  return `https://hashscan.io/testnet/transaction/${ref}`;
}

function hashscanTopicLink(id) {
  return `https://hashscan.io/testnet/topic/${id}`;
}

function hashscanTokenLink(id) {
  return `https://hashscan.io/testnet/token/${id}`;
}

function short(s) {
  if (!s) return "";
  return s.length > 12 ? `${s.slice(0, 6)}…${s.slice(-4)}` : s;
}

// Demo seed data
const SEED_WELL = {
  wellId: "WELL-NE-001",
  capexTarget: 12000,
  raised: 3500,
  location: "-1.2921,36.8219",
  operator: "Ngong Hills Water Co‑op",
  nft: { id: "0.0.6201-0001", tokenId: "0.0.6201", mintTx: "1735123456.000000001" },
  tariff: 0.0008, // USDC/L
  forecastLitersDay: 5200,
  split: { op: 0.5, inv: 0.4, plat: 0.1 },
  topics: {
    build: "0.0.8801",
    meter: "0.0.8802",
    settlement: "0.0.8803",
    audit: "0.0.8804",
  },
};

// Small pills
function ProofPill({ type = "HCS", label, tx, link }) {
  const color = type === "HTS" ? "bg-emerald-600" : type === "HFS" ? "bg-amber-600" : "bg-sky-600";
  return (
    <a href={link} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-3 py-1.5 rounded-full text-white text-xs shadow-sm hover:opacity-90" style={{ background: undefined }}>
      <span className={`inline-block w-2 h-2 rounded-full ${color}`}></span>
      <span className="font-semibold">{type}</span>
      <span>{label}</span>
      <span className="opacity-80">{short(tx)}</span>
    </a>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-2xl border p-4 bg-white">
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-slate-500 mt-1">{label}</div>
    </div>
  );
}

function PitchCard({ title, items, color }) {
  const ring = color === "red" ? "ring-rose-100" : color === "emerald" ? "ring-emerald-100" : "ring-slate-100";
  return (
    <div className={`rounded-2xl border p-4 bg-white ring-4 ${ring}`}>
      <div className="font-semibold mb-2">{title}</div>
      <ul className="text-sm list-disc pl-5 text-slate-700 space-y-1">
        {items.map((it, i) => (
          <li key={i}>{it}</li>
        ))}
      </ul>
    </div>
  );
}

const LandingPage = () => {
  const navigate = useNavigate();
  const { wallet: globalWallet, setWallet: setGlobalWallet } = useWalletContext?.() || { wallet: { connected: false, accountId: '', state: 'Disconnected' }, setWallet: () => {} };

  // Live counters (landing)
  const [counterLiters, setCounterLiters] = useState(18_450_000);
  const [counterFamilies, setCounterFamilies] = useState(92_300);
  const [counterPayouts, setCounterPayouts] = useState(12_640);
  useEffect(() => {
    const t = setInterval(() => {
      setCounterLiters((v) => v + Math.floor(Math.random() * 50));
      setCounterFamilies((v) => v + Math.floor(Math.random() * 2));
      setCounterPayouts((v) => v + Math.random() * 0.5);
    }, 2000);
    return () => clearInterval(t);
  }, []);

  // De-dup ProofPill demo tx ids so label/link match
  const demoTx = useMemo(() => [nowTxRef(), nowTxRef(), nowTxRef(), nowTxRef()], []);

  // MVP backend demo state
  const [backend, setBackend] = useState({ topicId: "", tokenId: "", lastTx: "", status: "", seeding: false });
  // Config + KPI + Live feed (P0)
  const [config, setConfig] = useState({ events: "", settlements: "", anchors: "", network: "" });
  const [kpi, setKpi] = useState(null);
  const [live, setLive] = useState({ topicId: "", events: [] });
  const [anchor, setAnchor] = useState(null);
  const [audit, setAudit] = useState(null);
  const [anchorETA, setAnchorETA] = useState("-");
  
  // Wallet (HashConnect)
  const [wallet, setWallet] = useState({ connected: false, accountId: "", state: "Disconnected" });
  const [hc, setHc] = useState(null);
  useEffect(() => {
    try {
      setGlobalWallet?.(wallet);
    } catch {}
  }, [wallet, setGlobalWallet]);
  const projectId = import.meta.env.VITE_WC_PROJECT_ID || import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || "";
  const appMetadata = { name: "Waternity", description: "Water per liter", icons: [], url: (typeof window !== "undefined" && window.location?.origin) ? window.location.origin : "http://localhost" };

  // HashConnect initialization
  useEffect(() => {
    if (!projectId) {
      console.warn("HashConnect disabled: missing VITE_WC_PROJECT_ID or VITE_WALLETCONNECT_PROJECT_ID");
      return;
    }

    const initHashConnect = async () => {
      if (typeof window === 'undefined') return;
      
      try {
        const { HashConnect } = await import('hashconnect');
        const h = new HashConnect(LedgerId.TESTNET, projectId, appMetadata, true);
        
        // v3: register events before init
        h.pairingEvent.on((pair) => {
          const acc = pair?.accountIds?.[0];
          setWallet({ connected: true, accountId: acc || "", state: "Connected" });
        });
        h.disconnectionEvent?.on?.(() => {
          setWallet({ connected: false, accountId: "", state: "Disconnected" });
        });
        h.connectionStatusChangeEvent?.on?.((st) => {
          setWallet((prev) => ({ ...prev, state: String(st) }));
        });

        await h.init();
        setHc(h);
        
        return () => {
          try { h?.disconnect?.(); } catch {}
        };
      } catch (e) {
        console.error(e);
      }
    };
    
    initHashConnect();
  }, [projectId]);

// Fetch config + settlement preview on load
useEffect(() => {
  (async () => {
    try {
      const cfg = await api("/api/hcs/config");
      if (cfg) setConfig(cfg);
      const sp = await api("/api/settle/preview", { method: "POST", body: JSON.stringify({ liters: SEED_WELL.forecastLitersDay, tariff: SEED_WELL.tariff, split: SEED_WELL.split, coverageTarget: 1.2 }) });
      setKpi(sp);

      // Auto-bootstrap: if no EVENTS_TOPIC_ID from server config, create topic and start seed
      if (!cfg?.events) {
        try {
          const created = await api("/api/hcs/topic", { method: "POST" });
          if (created?.topicId) {
            setBackend((p) => ({ ...p, topicId: created.topicId }));
            await api("/api/hcs/seed/start", { method: "POST", body: JSON.stringify({ topicId: created.topicId, intervalMs: 3000, wellId: SEED_WELL.wellId }) });
            setBackend((p) => ({ ...p, seeding: true }));
          }
        } catch (e) {
          console.warn("auto-bootstrap topic/seed failed", e);
        }
      }
    } catch (e) {
      console.error("init load error", e);
    }
  })();
}, []);

// Live feed polling (prefer config.events, fallback backend.topicId)
useEffect(() => {
  const topicId = config.events || backend.topicId;
  if (!topicId) return;
  setLive((p) => ({ ...p, topicId }));
  let stop = false;
  const tick = async () => {
    if (stop) return;
    try {
      const r = await api(`/api/hcs/events?topicId=${encodeURIComponent(topicId)}&limit=20`);
      setLive({ topicId, events: r?.events || [] });
    } catch (e) {
      // ignore
    } finally {
      setTimeout(tick, 3000);
    }
  };
  tick();
  return () => {
    stop = true;
  };
}, [config.events, backend.topicId]);

// Recompute KPI from current live feed window
useEffect(() => {
  const topicId = live.topicId || config.events || backend.topicId;
  if (!topicId) return;
  const liters = (live.events || []).reduce((acc, e) => acc + (e?.payload?.volumeLiters || 0), 0);
  if (liters <= 0) return;
  (async () => {
    try {
      const sp = await api("/api/settle/preview", { method: "POST", body: JSON.stringify({ liters, tariff: SEED_WELL.tariff, split: SEED_WELL.split, coverageTarget: 1.2 }) });
      setKpi(sp);
    } catch (e) {
      // ignore
    }
  })();
}, [live.events, live.topicId, config.events, backend.topicId]);

// Next Anchor ETA (heuristic: anchor per 12 events; use recent event rate)
useEffect(() => {
  const evs = live.events || [];
  const target = 12;
  const have = Math.min(evs.length, target);
  const remaining = Math.max(0, target - have);
  const timestamps = evs.map(e => new Date(e.ts).getTime()).filter(Boolean).sort((a,b) => a - b);
  let eventsPerMinute = 20; // fallback ~3s per event (seed default)
  if (timestamps.length >= 2) {
    const first = timestamps[0];
    const last = timestamps[timestamps.length - 1];
    const spanMs = Math.max(1, last - first);
    const intervals = Math.max(1, timestamps.length - 1);
    const avgMs = spanMs / intervals;
    if (avgMs > 0) eventsPerMinute = 60000 / avgMs;
  }
  const etaMin = remaining > 0 ? remaining / eventsPerMinute : 0;
  const totalSec = Math.round(etaMin * 60);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  const label = remaining === 0 ? "~now" : (m > 0 ? `~${m}m ${s}s` : `~${s}s`);
  setAnchorETA(label);
}, [live.events]);

// Handlers — Wallet
const handleConnectWallet = async () => {
  try {
    if (hc?.connectToLocalWallet) {
      await hc.connectToLocalWallet();
      setWallet((prev) => ({ ...prev, connected: true, state: "Connected" }));
    }
  } catch (e) {
    console.warn("wallet connect failed", e);
  }
};

const handleDisconnectWallet = async () => {
  try {
    await hc?.disconnect?.();
  } catch {}
  setWallet({ connected: false, accountId: "", state: "Disconnected" });
};

// Ensure topic helper
const ensureTopicId = async () => {
  const tid = backend.topicId || config.events;
  if (tid) return tid;
  try {
    const created = await api("/api/hcs/topic", { method: "POST" });
    if (created?.topicId) {
      setBackend((p) => ({ ...p, topicId: created.topicId }));
      return created.topicId;
    }
  } catch (e) {
    console.warn("ensure topic failed", e);
  }
  return "";
};

// Handlers — HCS
const handleCreateTopic = async () => {
  try {
    const r = await api("/api/hcs/topic", { method: "POST" });
    if (r?.topicId) setBackend((p) => ({ ...p, topicId: r.topicId }));
  } catch (e) {
    console.warn("create topic failed", e);
  }
};

const handleSubmitMsg = async () => {
  try {
    const topicId = await ensureTopicId();
    if (!topicId) return;
    const reading = { type: "METER_READING", wellId: SEED_WELL.wellId, volumeLiters: Math.random() < 0.5 ? 50 : 200, ts: new Date().toISOString() };
    const r = await api("/api/hcs/submit", { method: "POST", body: JSON.stringify({ topicId, message: reading }) });
    setBackend((p) => ({ ...p, lastTx: r?.txId || p.lastTx, status: r?.status || p.status }));
  } catch (e) {
    console.warn("submit msg failed", e);
  }
};

const handleStartSeed = async () => {
  try {
    const topicId = await ensureTopicId();
    if (!topicId) return;
    await api("/api/hcs/seed/start", { method: "POST", body: JSON.stringify({ topicId, intervalMs: 3000, wellId: SEED_WELL.wellId }) });
    setBackend((p) => ({ ...p, seeding: true, status: "seeding" }));
  } catch (e) {
    console.warn("seed start failed", e);
  }
};

const handleStopSeed = async () => {
  try {
    const topicId = backend.topicId || config.events;
    if (!topicId) return;
    await api("/api/hcs/seed/stop", { method: "POST", body: JSON.stringify({ topicId }) });
    setBackend((p) => ({ ...p, seeding: false, status: "idle" }));
  } catch (e) {
    console.warn("seed stop failed", e);
  }
};

// Handlers — Anchor + Audit
const handleAnchorPreview = async () => {
  try {
    const topicId = live.topicId || config.events || backend.topicId;
    if (!topicId) return;
    const r = await api("/api/anchor/preview", { method: "POST", body: JSON.stringify({ topicId, count: 16 }) });
    setAnchor(r);
  } catch (e) {
    console.warn("anchor preview failed", e);
  }
};

const handleAuditPreview = async () => {
  try {
    const r = await fetchAudit();
    if (r) setAudit(r);
  } catch (e) {
    console.warn("audit preview failed", e);
  }
};

// Execute Handlers — Settlement & Anchor
const handleExecuteSettlement = async () => {
  try {
    const liters = (live.events || []).reduce((acc, e) => acc + (e?.payload?.volumeLiters || 0), 0);
    const r = await api("/api/settle/execute", { method: "POST", body: JSON.stringify({ liters, tariff: SEED_WELL.tariff, split: SEED_WELL.split, eventsTopicId: live.topicId || config.events || backend.topicId, settlementsTopicId: config.settlements || backend.topicId }) });
    setBackend((p) => ({ ...p, lastTx: r?.txId || p.lastTx, status: r?.status || p.status }));
  } catch (e) {
    console.warn("execute settlement failed", e);
  }
};

const handleExecuteAnchor = async () => {
  try {
    const r = await api("/api/anchor/execute", { method: "POST", body: JSON.stringify({ eventsTopicId: live.topicId || config.events || backend.topicId, anchorsTopicId: config.anchors || backend.topicId, count: 16 }) });
    setBackend((p) => ({ ...p, lastTx: r?.txId || p.lastTx, status: r?.status || p.status }));
    if (r?.merkleRoot) setAnchor({ merkleRoot: r.merkleRoot, leaves: r.leaves });
  } catch (e) {
    console.warn("execute anchor failed", e);
  }
};

const download = (filename, content, type = "application/octet-stream") => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(url);
    a.remove();
  }, 0);
};

const handleExportAuditJSON = () => {
  if (!audit) return;
  download(`audit-${(audit.snapshotAt || "").replace(/[:.]/g, "-")}.json`, JSON.stringify(audit, null, 2), "application/json");
};

const handleExportAuditCSV = () => {
  if (!audit) return;
  const rows = [];
  rows.push("section,txId,type,ts,wellId,volumeLiters");
  const pushRows = (section, arr) => {
    (arr || []).forEach((e) => {
      rows.push([section, e.txId, e.type, e.ts, e.wellId, e.volumeLiters ?? ""].map((v) => (v == null ? "" : `"${String(v).replace(/"/g, '""')}"`)).join(","));
    });
  };
  pushRows("events", audit.events?.events || []);
  pushRows("settlements", audit.events?.settlements || []);
  pushRows("anchors", audit.events?.anchors || []);
  download(`audit-${(audit.snapshotAt || "").replace(/[:.]/g, "-")}.csv`, rows.join("\n"), "text/csv");
};

// Handlers — HTS
const handleCreateFT = async () => {
  try {
    const r = await api("/api/hts/token/create", { method: "POST", body: JSON.stringify({ name: "WaterCredit", symbol: "WCR", decimals: 6 }) });
    if (r?.tokenId) setBackend((p) => ({ ...p, tokenId: r.tokenId, status: r.status || p.status }));
  } catch (e) {
    console.warn("create FT failed", e);
  }
};

const handleMintFT = async () => {
  try {
    const tokenId = backend.tokenId;
    if (!tokenId) return;
    const r = await api("/api/hts/token/mint", { method: "POST", body: JSON.stringify({ tokenId, amount: 100000 }) });
    setBackend((p) => ({ ...p, status: r?.status || p.status }));
  } catch (e) {
    console.warn("mint FT failed", e);
  }
};

return (
  <div className="min-h-screen bg-white">
    <header className="mx-auto max-w-7xl px-6 py-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-xl bg-sky-600" />
        <div className="font-bold text-xl">Waternity</div>
        <span className="ml-3 text-xs rounded-full bg-slate-100 px-2 py-1">Hedera • HTS/HCS/HFS</span>
      </div>
      <div className="hidden md:flex items-center gap-2">
        <a className="px-3 py-2 text-slate-600 hover:text-slate-900" href="#pitch">
          Pitch
        </a>
        <a className="px-3 py-2 text-slate-600 hover:text-slate-900" href="#flow">
          Flow
        </a>
        <a className="px-3 py-2 text-slate-600 hover:text-slate-900" href="#proof">
          Proof
        </a>
        <button
          onClick={() => navigate("/investor-dashboard")}
          className="ml-2 rounded-xl bg-slate-900 text-white px-4 py-2"
        >
          Open Dashboard
        </button>
        <div className="ml-2" />
        {wallet.connected ? (
          <>
            <div className="mr-2">
              <RoleBadge role={getRoleByWallet(wallet.accountId)} size="sm" />
            </div>
            <button onClick={handleDisconnectWallet} className="rounded-xl border px-3 py-2 text-sm">
              {wallet.accountId ? `Connected ${wallet.accountId}` : "Connected"}
            </button>
          </>
        ) : (
          <button onClick={handleConnectWallet} className="rounded-xl bg-sky-600 text-white px-3 py-2 text-sm">
            Connect Wallet
          </button>
        )}
      </div>
    </header>

    <main className="mx-auto max-w-7xl px-6 py-8">
      {/* Hero */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
            On Hedera, <span className="text-sky-600">Every Liter = Yield + Impact</span>
          </h1>
          <p className="mt-4 text-lg text-slate-700">
            Unlock <b>1B liters</b> by 2030, hydrate <b>200M people</b>, deliver <b>5–12% APY real cash</b> — proven
            with sub‑cent fees & T+0 settlement.
          </p>
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label="1B+ Liters Unlocked" value={`${fmt(counterLiters)}+`} />
            <StatCard label="200M People Hydrated" value={`${fmt(counterFamilies)}+`} />
            <StatCard label="5–12% APY Yield" value="Live Sim" />
            <StatCard label="<$0.0001 Proof Cost" value="HCS" />
          </div>
          {/* KPI Hook (P0) */}
          {kpi && (
            <div className="mt-6 grid grid-cols-2 md:grid-cols-6 gap-3">
              <StatCard label="Tariff (USDC/L)" value={kpi.tariff} />
              <StatCard label="Liters Today" value={fmt(kpi.liters)} />
              <StatCard label="Gross (USDC)" value={fmt(kpi.gross)} />
              <StatCard label="Split Inv (40%)" value={fmt(kpi.split?.inv)} />
              <StatCard label="Split Op (50%)" value={fmt(kpi.split?.op)} />
              <StatCard label="Coverage" value={`${kpi.coverageRatio}×`} />
            </div>
          )}
          {kpi && (
            <div className="mt-4 rounded-xl border p-4 bg-white">
              <div className="font-medium">Settlement Preview</div>
              <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div>Gross: <b>{fmt(kpi.gross)} USDC</b></div>
                <div>Investors (40%): <b>{fmt(kpi.split?.inv)} USDC</b></div>
                <div>Operators (50%): <b>{fmt(kpi.split?.op)} USDC</b></div>
                <div>Platform (10%): <b>{fmt(kpi.split?.plat || (kpi.gross ? (kpi.gross * 0.1) : 0))} USDC</b></div>
              </div>
              <div className="mt-3 text-xs text-slate-600 flex items-center gap-2">
                <span>Coverage</span>
                <div className="flex-1 h-2 bg-slate-100 rounded">
                  <div className="h-2 bg-emerald-500 rounded" style={{ width: `${Math.min(100, Math.max(0, (kpi.coverageRatio || 0) * 100))}%` }} />
                </div>
                <span>{kpi.coverageRatio}×</span>
              </div>
              <div className="mt-2 text-xs text-slate-700">Next Anchor ETA: <b>{anchorETA}</b></div>
            </div>
          )}
          <div className="mt-6 flex gap-3">
            <button
              onClick={() => navigate("/investor-dashboard")}
              className="rounded-xl bg-sky-600 text-white px-4 py-2"
            >
              Start Funding Wells
            </button>
            <a href="#proof" className="rounded-xl border px-4 py-2">
              See Live Proofs
            </a>
            <button
              onClick={() => navigate('/well-detail-view?well=WL-001')}
              className="rounded-xl border px-4 py-2"
            >
              Explore WL-001
            </button>
          </div>
        </div>
        <div className="rounded-2xl border p-6 shadow-sm bg-gradient-to-br from-sky-50 to-white">
          <h3 className="font-semibold mb-3">ProofPill — Live Examples</h3>
          <div className="flex flex-wrap gap-2">
            <ProofPill type="HCS" label="METER_READING +50L" tx={demoTx[0]} link={hashscanTxLink(demoTx[0])} />
            <ProofPill type="HTS" label="POOL_DEPOSIT $100" tx={demoTx[1]} link={hashscanTxLink(demoTx[1])} />
            <ProofPill type="HCS" label="SETTLEMENT_RUN" tx={demoTx[2]} link={hashscanTxLink(demoTx[2])} />
            <ProofPill type="HTS" label="PAYOUT_INV $0.68" tx={demoTx[3]} link={hashscanTxLink(demoTx[3])} />
          </div>
          <p className="mt-4 text-sm text-slate-600">
            Klik pill untuk membuka HashScan (testnet). Semua aksi dalam demo akan memunculkan ProofPill serupa.
          </p>
        </div>
      </section>

      {/* Pitch blocks */}
      <section id="pitch" className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
        <PitchCard
          title="Problem"
          items={[
            "771M orang tanpa air bersih",
            "Proyek kecil tak bankable; revenue manual bocor",
            "Investor tidak percaya; tidak ada proof per liter",
          ]}
          color="red"
        />
        <PitchCard
          title="Solution"
          items={["Well NFT Funding (HTS) + Escrow", "Pay‑per‑liter (HCS) + Auto‑split", "ProofPill ke HashScan di tiap aksi"]}
          color="emerald"
        />
        <PitchCard
          title="Product"
          items={[
            "Landing + Dashboard (SPA)",
            "Tabs: Investor, Operator, Agent/Audit",
            "Device Simulator untuk demo, tanpa IoT fisik",
          ]}
        />
      </section>
      <section className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        <PitchCard title="Market Size" items={["TAM $20–40B/yr", "SAM awal $0.8–1.2B/yr", "SOM 24mo ≈ $8–12M GMV/yr"]} />
        <PitchCard
          title="Target Customer"
          items={["Field Operator/SME air, NGO/municipal kecil", "Investor ritel/impact, CVC utilitas", "CSR & donor butuh proof of impact"]}
        />
        <PitchCard
          title="Value Proposition"
          items={["Investor 5–12% real cash per liter", "Operator modal cepat + valve control", "Komunitas liter terjamin; audit‑ready"]}
        />
      </section>

      <section className="mt-6">
        <PitchCard
          title="Ask"
          items={[
            "Pilot 3 kota / 100 well",
            "Partner IoT + stablecoin issuers (HTS)",
            "$50k–$150k perangkat & ops awal; $1–$5M TVL komitmen",
          ]}
        />
      </section>

      {/* Flow & Proof */}
      <section id="flow" className="mt-12 rounded-2xl border p-6">
        <h3 className="font-semibold text-lg">Flow</h3>
        <div className="mt-4 grid grid-cols-2 md:grid-cols-6 gap-3 text-sm">
          {["Mint Well NFT", "Funding (Escrow)", "Build (QR)", "Go‑Live Liter", "Auto‑Settlement", "Anchor Proof"].map(
            (s, i) => (
              <div key={i} className="rounded-xl border p-3 text-center bg-white">
                {s}
              </div>
            )
          )}
        </div>
      </section>

      <section id="proof" className="mt-6 rounded-2xl border p-6">
        <h3 className="font-semibold text-lg">Proof</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          <a
            className="text-sm underline text-sky-700"
            href={hashscanTopicLink(SEED_WELL.topics.meter)}
            target="_blank"
            rel="noreferrer"
          >
            HCS • water.meter ({SEED_WELL.topics.meter})
          </a>
          <a
            className="text-sm underline text-sky-700"
            href={hashscanTopicLink(SEED_WELL.topics.settlement)}
            target="_blank"
            rel="noreferrer"
          >
            HCS • water.settlement ({SEED_WELL.topics.settlement})
          </a>
          <a
            className="text-sm underline text-sky-700"
            href={hashscanTopicLink(SEED_WELL.topics.audit)}
            target="_blank"
            rel="noreferrer"
          >
            HCS • water.audit ({SEED_WELL.topics.audit})
          </a>
          {/* Dynamic (ENV or runtime created) */}
          {config.events && (
            <a className="text-sm underline text-emerald-700" href={hashscanTopicLink(config.events)} target="_blank" rel="noreferrer">
              ENV • events ({config.events})
            </a>
          )}
          {config.settlements && (
            <a className="text-sm underline text-emerald-700" href={hashscanTopicLink(config.settlements)} target="_blank" rel="noreferrer">
              ENV • settlements ({config.settlements})
            </a>
          )}
          {config.anchors && (
            <a className="text-sm underline text-emerald-700" href={hashscanTopicLink(config.anchors)} target="_blank" rel="noreferrer">
              ENV • anchors ({config.anchors})
            </a>
          )}
        </div>
      </section>

      {/* MVP Demo Actions */}
      <section id="mvp" className="mt-6 rounded-2xl border p-6 bg-white">
        <h3 className="font-semibold text-lg">MVP Demo — Hedera Actions</h3>
        <p className="text-sm text-slate-600 mt-1">Server must be running on http://localhost:8787 with OPERATOR_ID/KEY (testnet).</p>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl border p-4">
            <div className="font-medium">HCS</div>
            <div className="mt-2 flex gap-2 flex-wrap">
              <button onClick={handleCreateTopic} className="rounded-lg bg-slate-900 text-white px-3 py-2 text-sm">Create Topic</button>
              <button onClick={handleSubmitMsg} className="rounded-lg border px-3 py-2 text-sm">Submit Meter +50/200L</button>
              {backend.topicId && (
                <a className="rounded-lg border px-3 py-2 text-sm text-sky-700 underline" href={hashscanTopicLink(backend.topicId)} target="_blank" rel="noreferrer">View Topic on HashScan</a>
              )}
              <button onClick={handleStartSeed} className="rounded-lg border px-3 py-2 text-sm">Start Seed</button>
              <button onClick={handleStopSeed} className="rounded-lg border px-3 py-2 text-sm">Stop Seed</button>
              <button onClick={handleAnchorPreview} className="rounded-lg border px-3 py-2 text-sm">Anchor Preview</button>
              <button onClick={handleAuditPreview} className="rounded-lg border px-3 py-2 text-sm">Audit Report</button>
              <button onClick={handleExecuteSettlement} className="rounded-lg bg-emerald-600 text-white px-3 py-2 text-sm">Execute Settlement</button>
              <button onClick={handleExecuteAnchor} className="rounded-lg bg-indigo-600 text-white px-3 py-2 text-sm">Execute Anchor</button>
            </div>
            <div className="mt-3 text-xs text-slate-600 space-y-1">
              <div>TopicId: <span className="font-mono">{backend.topicId || '-'}</span> {backend.topicId && (
                <a className="ml-2 underline text-sky-700" href={hashscanTopicLink(backend.topicId)} target="_blank" rel="noreferrer">View</a>
              )}</div>
              <div>Events Topic (ENV): <span className="font-mono">{config.events || '-'}</span> {config.events && (
                <a className="ml-2 underline text-sky-700" href={hashscanTopicLink(config.events)} target="_blank" rel="noreferrer">View</a>
              )}</div>
              <div>Anchors Topic (ENV): <span className="font-mono">{config.anchors || '-'}</span> {config.anchors && (
                <a className="ml-2 underline text-sky-700" href={hashscanTopicLink(config.anchors)} target="_blank" rel="noreferrer">View</a>
              )}</div>
              <div>Settlements Topic (ENV): <span className="font-mono">{config.settlements || '-'}</span> {config.settlements && (
                <a className="ml-2 underline text-sky-700" href={hashscanTopicLink(config.settlements)} target="_blank" rel="noreferrer">View</a>
              )}</div>
              <div>Last Tx: <span className="font-mono">{backend.lastTx || '-'}</span> {backend.lastTx && (
                <a className="ml-2 underline text-sky-700" href={`https://hashscan.io/testnet/transaction/${backend.lastTx}`} target="_blank" rel="noreferrer">Open</a>
              )}</div>
              <div>Status: {backend.status || '-'}</div>
              <div>Seeding: {backend.seeding ? 'ON' : 'OFF'}</div>
              {anchor && (
                <>
                  <div className="mt-2">Merkle: <span className="font-mono break-all">{anchor.merkleRoot}</span> • Leaves: {anchor.leaves}</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <ProofPill
                      type="HCS"
                      label={`ANCHOR • bundle ${anchor.leaves}`}
                      tx={(anchor.merkleRoot || '').slice(0, 18)}
                      link={hashscanTopicLink(config.anchors || backend.topicId)}
                    />
                  </div>
                </>
              )}
              {audit && (
                <div className="mt-3 p-3 border rounded-lg bg-slate-50">
                  <div className="font-medium mb-1">Audit Snapshot</div>
                  <div className="text-[11px] text-slate-600">at {audit.snapshotAt}</div>
                  <div className="mt-2 flex gap-4 text-[12px]">
                    <div>Events: <b>{audit?.counts?.events || 0}</b></div>
                    <div>Settlements: <b>{audit?.counts?.settlements || 0}</b></div>
                    <div>Anchors: <b>{audit?.counts?.anchors || 0}</b></div>
                  </div>
                  <div className="mt-2 flex gap-2">
                    <button onClick={handleExportAuditJSON} className="rounded-lg border px-3 py-1.5 text-xs">Download JSON</button>
                    <button onClick={handleExportAuditCSV} className="rounded-lg border px-3 py-1.5 text-xs">Download CSV</button>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="rounded-xl border p-4">
            <div className="font-medium">HTS (Fungible Token)</div>
            <div className="mt-2 flex gap-2">
              <button onClick={handleCreateFT} className="rounded-lg bg-slate-900 text-white px-3 py-2 text-sm">Create WCR</button>
              <button onClick={handleMintFT} className="rounded-lg border px-3 py-2 text-sm">Mint 100,000</button>
            </div>
            <div className="mt-3 text-xs text-slate-600 space-y-1">
              <div>TokenId: <span className="font-mono">{backend.tokenId || '-'}</span> {backend.tokenId && (
                <a className="ml-2 underline text-sky-700" href={hashscanTokenLink(backend.tokenId)} target="_blank" rel="noreferrer">View</a>
              )}</div>
              <div>Status: {backend.status || '-'}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Live Feed (Events) */}
      <section className="mt-6 rounded-2xl border p-6 bg-white">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg">Live Feed — Events</h3>
          <div className="text-xs text-slate-500">Topic: <span className="font-mono">{live.topicId || config.events || '-'}</span></div>
        </div>
        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
          {live.events?.slice(0, 10).map((e, i) => (
            <div key={i} className="rounded-lg border p-3 text-sm flex items-center justify-between">
              <div>
                <div className="font-medium">{e.type} • {e.payload?.volumeLiters ? `+${e.payload.volumeLiters} L` : ''}</div>
                <div className="text-xs text-slate-500">{e.ts} • {e.wellId}</div>
              </div>
              {e.txId && (
                <a href={hashscanTxLink(e.txId)} target="_blank" rel="noreferrer" className="text-xs underline text-sky-700">Open</a>
              )}
            </div>
          ))}
          {(!live.events || live.events.length === 0) && (
            <div className="text-sm text-slate-500">No events yet. Click Start Seed to simulate meter readings.</div>
          )}
        </div>
      </section>

      <div className="mt-10 flex justify-center">
        <button
          onClick={() => navigate("/investor-dashboard")}
          className="rounded-xl bg-slate-900 text-white px-5 py-3 text-lg"
        >
          Open Dashboard
        </button>
      </div>

      <div className="mt-4 flex justify-center">
        <button
          onClick={() => navigate("/audit")}
          className="rounded-xl bg-white border px-5 py-3 text-lg hover:bg-slate-50"
        >
          Open Audit
        </button>
      </div>
    </main>
  </div>
);
};

export default LandingPage;

// Fetch audit report
async function fetchAudit() {
  try {
    const res = await api('/api/audit/reports');
    return res;
  } catch (e) {
    console.warn('audit fetch failed', e);
    return null;
  }
}