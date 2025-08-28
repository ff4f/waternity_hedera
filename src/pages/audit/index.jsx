import React, { useEffect, useMemo, useState } from 'react';
import GlobalHeader from '../../components/ui/GlobalHeader';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import { api } from '../../lib/api';

const hashscanTopicLink = (network, topicId) => {
  if (!topicId) return '#';
  const net = network === 'mainnet' ? 'mainnet' : 'testnet';
  return `https://hashscan.io/${net}/topic/${topicId}`;
};

const Section = ({ title, children, right }) => (
  <section className="mt-6 rounded-2xl border p-6 bg-white">
    <div className="flex items-center justify-between mb-4">
      <h3 className="font-semibold text-lg">{title}</h3>
      {right}
    </div>
    {children}
  </section>
);

const Stat = ({ label, value, accent = 'text-slate-900' }) => (
  <div className="rounded-xl border p-4 bg-gradient-to-br from-slate-50 to-white">
    <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
    <div className={`text-2xl font-bold ${accent}`}>{value}</div>
  </div>
);

const AuditPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const r = await api('/api/audit/reports');
      setData(r);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const eventsCombined = useMemo(() => {
    if (!data?.events) return [];
    const addStream = (arr, name) => (arr || []).map((e) => ({ stream: name, ...e }));
    return [
      ...addStream(data.events.events, 'events'),
      ...addStream(data.events.settlements, 'settlements'),
      ...addStream(data.events.anchors, 'anchors'),
    ];
  }, [data]);

  const download = (filename, content, type = 'application/octet-stream') => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      URL.revokeObjectURL(url);
      a.remove();
    }, 0);
  };

  const handleExportJSON = () => {
    if (!data) return;
    download(`audit_${new Date().toISOString()}.json`, JSON.stringify(data, null, 2), 'application/json');
  };

  const handleExportCSV = () => {
    if (!eventsCombined?.length) return;
    const header = ['stream', 'txId', 'type', 'ts', 'wellId', 'volumeLiters'];
    const rows = eventsCombined.map((e) => header.map((h) => e[h] ?? '').join(','));
    const csv = [header.join(','), ...rows].join('\n');
    download(`audit_${new Date().toISOString()}.csv`, csv, 'text/csv');
  };

  const kpi = data?.kpi;
  const links = data?.links || {};
  const hfsLinks = links?.hfs || { manifestUri: 'ipfs://bafybeigdyrhk7yxxwellswl001manifest/manifest.json', gateway: 'https://ipfs.io/ipfs/bafybeigdyrhk7yxxwellswl001manifest/manifest.json' };
  const coverageRatio = Number(kpi?.coverageRatio || 0);
  const coveragePct = Math.max(0, Math.min(coverageRatio * 100, 200));
  const coverageColor = coverageRatio >= 1 ? 'bg-emerald-500' : coverageRatio >= 0.8 ? 'bg-amber-500' : 'bg-rose-500';

  return (
    <div className="min-h-screen bg-slate-50">
      <GlobalHeader />
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Audit & Anchors</h1>
            <p className="text-slate-600 mt-1">Live snapshot from Hedera Consensus Service topics. Exportable for compliance.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={load}>
              <Icon name="RefreshCw" className="mr-2" /> Refresh
            </Button>
            <Button variant="outline" onClick={handleExportCSV}>
              <Icon name="FileDown" className="mr-2" /> Export CSV
            </Button>
            <Button variant="primary" onClick={handleExportJSON}>
              <Icon name="FileType2" className="mr-2" /> Export JSON
            </Button>
          </div>
        </div>

        <Section title="Overview">
          {loading && <div className="text-slate-600">Loading...</div>}
          {error && <div className="text-red-600">{error}</div>}
          {!loading && !error && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Stat label="Network" value={data?.network || '-'} />
              <Stat label="Events" value={data?.counts?.events ?? 0} accent="text-emerald-700" />
              <Stat label="Settlements" value={data?.counts?.settlements ?? 0} accent="text-blue-700" />
              <Stat label="Anchors" value={data?.counts?.anchors ?? 0} accent="text-purple-700" />
            </div>
          )}
        </Section>

        {/* KPI & Financials */}
        {kpi && (
          <Section
            title="KPI & Financials"
            right={<div className="text-sm text-slate-600">Snapshot at {data?.snapshotAt}</div>}
          >
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <Stat label="Liters (sum)" value={`${(kpi.liters || 0).toLocaleString()} L`} accent="text-emerald-700" />
              <Stat label="Tariff" value={`$${Number(kpi.tariff || 0).toFixed(4)} / L`} accent="text-blue-700" />
              <Stat label="Gross" value={`$${Number(kpi.gross || 0).toFixed(4)}`} accent="text-slate-900" />
              <div className="rounded-xl border p-4 bg-gradient-to-br from-slate-50 to-white">
                <div className="text-xs uppercase tracking-wide text-slate-500">Split (USDC)</div>
                <div className="mt-1 text-sm text-slate-700 space-y-1">
                  <div>Investor: <span className="font-semibold">${Number(kpi.split?.inv || 0).toFixed(4)}</span></div>
                  <div>Operator: <span className="font-semibold">${Number(kpi.split?.op || 0).toFixed(4)}</span></div>
                  <div>Platform: <span className="font-semibold">${Number(kpi.split?.plat || 0).toFixed(4)}</span></div>
                </div>
              </div>
              <div className="rounded-xl border p-4 bg-gradient-to-br from-slate-50 to-white">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs uppercase tracking-wide text-slate-500">Coverage</div>
                    <div className={`text-2xl font-bold ${coverageRatio >= 1 ? 'text-emerald-700' : coverageRatio >= 0.8 ? 'text-amber-600' : 'text-rose-600'}`}>{coverageRatio.toFixed(2)}x</div>
                  </div>
                  <Icon name="ShieldCheck" className={`${coverageRatio >= 1 ? 'text-emerald-600' : 'text-slate-400'} w-6 h-6`} />
                </div>
                <div className="mt-3 h-2 bg-slate-100 rounded">
                  <div className={`h-2 ${coverageColor} rounded transition-all`} style={{ width: `${coveragePct}%` }} />
                </div>
                <div className="mt-2 text-xs text-slate-500">Target: {Number(kpi.coverageTarget || 1).toFixed(2)}x</div>
              </div>
            </div>
          </Section>
        )}

        <Section
          title="Topics"
          right={
            data?.topics ? (
              <div className="text-sm text-slate-600">Snapshot at {data?.snapshotAt}</div>
            ) : null
          }
        >
          <div className="grid grid-cols-1 md-grid-cols-3 md:grid-cols-3 gap-4">
            <div className="rounded-xl border p-4">
              <div className="text-xs uppercase text-slate-500">Events</div>
              <div className="font-mono">{data?.topics?.events || '-'}</div>
              {data?.topics?.events && (
                <a
                  href={hashscanTopicLink(data?.network, data?.topics?.events)}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs underline text-sky-700 mt-1 inline-block"
                >
                  Open in HashScan
                </a>
              )}
            </div>
            <div className="rounded-xl border p-4">
              <div className="text-xs uppercase text-slate-500">Settlements</div>
              <div className="font-mono">{data?.topics?.settlements || '-'}</div>
              {data?.topics?.settlements && (
                <a
                  href={hashscanTopicLink(data?.network, data?.topics?.settlements)}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs underline text-sky-700 mt-1 inline-block"
                >
                  Open in HashScan
                </a>
              )}
            </div>
            <div className="rounded-xl border p-4">
              <div className="text-xs uppercase text-slate-500">Anchors</div>
              <div className="font-mono">{data?.topics?.anchors || '-'}</div>
              {data?.topics?.anchors && (
                <a
                  href={hashscanTopicLink(data?.network, data?.topics?.anchors)}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs underline text-sky-700 mt-1 inline-block"
                >
                  Open in HashScan
                </a>
              )}
            </div>
          </div>
        </Section>

        {/* Assets & Links */}
        {links && (
          <Section title="Assets & Links">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-xl border p-4">
                <div className="text-xs uppercase text-slate-500 mb-1">HTS</div>
                <div className="space-y-2 text-sm">
                  <div>
                    <div className="text-slate-500">Fungible Token</div>
                    {links.hts?.tokenId ? (
                      <a href={links.hts?.tokenLink} target="_blank" rel="noreferrer" className="text-sky-700 underline font-mono">{links.hts?.tokenId}</a>
                    ) : (
                      <div className="text-slate-400">—</div>
                    )}
                  </div>
                  <div>
                    <div className="text-slate-500">Project NFT</div>
                    {links.hts?.nftTokenId ? (
                      <a href={links.hts?.nftTokenLink} target="_blank" rel="noreferrer" className="text-sky-700 underline font-mono">{links.hts?.nftTokenId}</a>
                    ) : (
                      <div className="text-slate-400">—</div>
                    )}
                  </div>
                </div>
              </div>
              <div className="rounded-xl border p-4">
                <div className="text-xs uppercase text-slate-500 mb-1">HCS Topics</div>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-slate-500">Events: </span>
                    {links.hcs?.events ? <a href={links.hcs?.events} target="_blank" rel="noreferrer" className="text-sky-700 underline">HashScan</a> : <span className="text-slate-400">—</span>}
                  </div>
                  <div>
                    <span className="text-slate-500">Settlements: </span>
                    {links.hcs?.settlements ? <a href={links.hcs?.settlements} target="_blank" rel="noreferrer" className="text-sky-700 underline">HashScan</a> : <span className="text-slate-400">—</span>}
                  </div>
                  <div>
                    <span className="text-slate-500">Anchors: </span>
                    {links.hcs?.anchors ? <a href={links.hcs?.anchors} target="_blank" rel="noreferrer" className="text-sky-700 underline">HashScan</a> : <span className="text-slate-400">—</span>}
                  </div>
                </div>
              </div>
              <div className="rounded-xl border p-4">
                <div className="text-xs uppercase text-slate-500 mb-1">HFS (IPFS)</div>
                {hfsLinks?.manifestUri ? (
                  <div className="text-sm">
                    <div className="text-slate-500">Manifest URI</div>
                    <div className="font-mono break-all">{hfsLinks?.manifestUri}</div>
                    {hfsLinks?.gateway && (
                      <a href={hfsLinks?.gateway} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center text-sky-700 underline">
                        <Icon name="ExternalLink" className="mr-1" /> Open Manifest
                      </a>
                    )}
                  </div>
                ) : (
                  <div className="text-slate-400 text-sm">—</div>
                )}
              </div>
            </div>
          </Section>
        )}

        <Section title="Latest">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-xl border p-4">
              <div className="text-xs uppercase text-slate-500">Latest Event</div>
              <pre className="text-xs mt-2 bg-slate-50 p-3 rounded overflow-auto">{JSON.stringify(data?.latest?.events, null, 2)}</pre>
            </div>
            <div className="rounded-xl border p-4">
              <div className="text-xs uppercase text-slate-500">Latest Settlement</div>
              <pre className="text-xs mt-2 bg-slate-50 p-3 rounded overflow-auto">{JSON.stringify(data?.latest?.settlements, null, 2)}</pre>
            </div>
            <div className="rounded-xl border p-4">
              <div className="text-xs uppercase text-slate-500">Latest Anchor</div>
              <pre className="text-xs mt-2 bg-slate-50 p-3 rounded overflow-auto">{JSON.stringify(data?.latest?.anchors, null, 2)}</pre>
            </div>
          </div>
        </Section>

        <Section title="Event Streams">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-xl border p-4">
              <div className="font-semibold mb-2">Events</div>
              <div className="space-y-2 max-h-64 overflow-auto">
                {(data?.events?.events || []).map((e, i) => (
                  <div key={i} className="p-3 border rounded-lg text-sm">
                    <div className="font-medium">{e.type} {e.volumeLiters ? `• +${e.volumeLiters} L` : ''}</div>
                    <div className="text-xs text-slate-500">{e.ts} • {e.wellId}</div>
                    {e.txId && (
                      <a href={`https://hashscan.io/${data?.network || 'testnet'}/transaction/${e.txId}`} target="_blank" rel="noreferrer" className="text-xs underline text-sky-700">Open</a>
                    )}
                  </div>
                ))}
                {(!data?.events?.events || data?.events?.events?.length === 0) && (
                  <div className="text-sm text-slate-500">No events.</div>
                )}
              </div>
            </div>
            <div className="rounded-xl border p-4">
              <div className="font-semibold mb-2">Settlements</div>
              <div className="space-y-2 max-h-64 overflow-auto">
                {(data?.events?.settlements || []).map((e, i) => (
                  <div key={i} className="p-3 border rounded-lg text-sm">
                    <div className="font-medium">{e.type}</div>
                    <div className="text-xs text-slate-500">{e.ts} • {e.wellId}</div>
                    {e.txId && (
                      <a href={`https://hashscan.io/${data?.network || 'testnet'}/transaction/${e.txId}`} target="_blank" rel="noreferrer" className="text-xs underline text-sky-700">Open</a>
                    )}
                  </div>
                ))}
                {(!data?.events?.settlements || data?.events?.settlements?.length === 0) && (
                  <div className="text-sm text-slate-500">No settlements.</div>
                )}
              </div>
            </div>
            <div className="rounded-xl border p-4">
              <div className="font-semibold mb-2">Anchors</div>
              <div className="space-y-2 max-h-64 overflow-auto">
                {(data?.events?.anchors || []).map((e, i) => (
                  <div key={i} className="p-3 border rounded-lg text-sm">
                    <div className="font-medium">{e.type}</div>
                    <div className="text-xs text-slate-500">{e.ts} • {e.wellId}</div>
                    {e.txId && (
                      <a href={`https://hashscan.io/${data?.network || 'testnet'}/transaction/${e.txId}`} target="_blank" rel="noreferrer" className="text-xs underline text-sky-700">Open</a>
                    )}
                  </div>
                ))}
                {(!data?.events?.anchors || data?.events?.anchors?.length === 0) && (
                  <div className="text-sm text-slate-500">No anchors.</div>
                )}
              </div>
            </div>
          </div>
        </Section>

        <div className="mt-10 flex justify-center text-xs text-slate-500">Demo only • Generated from server-side buffers</div>
      </main>
    </div>
  );
};

export default AuditPage;