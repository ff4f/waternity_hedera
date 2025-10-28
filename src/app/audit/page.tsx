"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { api } from "@/lib/api";

interface EventItem {
  stream?: string;
  txId?: string;
  type?: string;
  ts?: string;
  wellId?: string;
  volumeLiters?: number;
}

interface KPIData {
  liters?: number;
  tariff?: number;
  gross?: number;
  split?: { inv?: number; op?: number; plat?: number };
  coverageRatio?: number;
  coverageTarget?: number;
}

interface AuditLinks {
  hcs?: { events?: string; settlements?: string; anchors?: string };
  hfs?: { manifestUri?: string; gateway?: string };
  hts?: { tokenId?: string; tokenLink?: string; nftTokenId?: string; nftTokenLink?: string };
}

interface AuditData {
  network?: string;
  counts?: { events?: number; settlements?: number; anchors?: number };
  kpi?: KPIData;
  snapshotAt?: string;
  topics?: { events?: string; settlements?: string; anchors?: string };
  links?: AuditLinks;
  latest?: { events?: any; settlements?: any; anchors?: any };
  events?: { events?: EventItem[]; settlements?: EventItem[]; anchors?: EventItem[] };
}

const hashscanTopicLink = (network?: string, topicId?: string) => {
  if (!topicId) return "#";
  const net = network === "mainnet" ? "mainnet" : "testnet";
  return `https://hashscan.io/${net}/topic/${topicId}`;
};

export default function AuditPage() {
  const [data, setData] = useState<AuditData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [wells, setWells] = useState<any[]>([]);
  const [wellId, setWellId] = useState<string>("");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [query, setQuery] = useState<string>("");

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const r = await api("/api/audit/reports");
      setData(r as AuditData);
    } catch (e: any) {
      setError(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  };

  const loadWells = async () => {
    try {
      const res = await fetch("/api/wells?limit=50");
      const json = await res.json();
      setWells(json.wells || []);
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    load();
    loadWells();
  }, []);

  const eventsCombined: EventItem[] = useMemo(() => {
    if (!data?.events) return [];
    const addStream = (arr: EventItem[] | undefined, name: string) => (arr || []).map((e) => ({ stream: name, ...e }));
    return [
      ...addStream(data.events.events, "events"),
      ...addStream(data.events.settlements, "settlements"),
      ...addStream(data.events.anchors, "anchors"),
    ];
  }, [data]);

  const filteredEvents = useMemo(() => {
    const q = query.toLowerCase().trim();
    return eventsCombined.filter((e) => {
      if (wellId && e.wellId !== wellId) return false;
      if (q) {
        return (
          String(e.txId || "").toLowerCase().includes(q) ||
          String(e.type || "").toLowerCase().includes(q) ||
          String(e.wellId || "").toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [eventsCombined, query, wellId]);

  const download = (filename: string, content: BlobPart, type = "application/octet-stream") => {
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

  const handleExportJSON = () => {
    if (!data) return;
    download(`audit_${new Date().toISOString()}.json`, JSON.stringify(data, null, 2), "application/json");
  };

  const handleExportCSV = async () => {
    if (!wellId || !fromDate || !toDate) {
      alert("Please select Well ID and date range before exporting CSV.");
      return;
    }
    try {
      const url = `/api/audit/reports?wellId=${encodeURIComponent(wellId)}&from=${encodeURIComponent(fromDate)}&to=${encodeURIComponent(toDate)}&format=csv`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Failed to export CSV: ${res.status}`);
      const blob = await res.blob();
      download(`audit_${wellId}_${fromDate}_${toDate}.csv`, blob, "text/csv");
    } catch (e: any) {
      alert(String(e?.message || e));
    }
  };

  const kpi = data?.kpi;
  const links = data?.links || {} as AuditLinks;
  const hfsLinks = links?.hfs || { manifestUri: undefined, gateway: undefined };
  const coverageRatio = Number(kpi?.coverageRatio || 0);
  const coveragePct = Math.max(0, Math.min(coverageRatio * 100, 200));
  const coverageColor = coverageRatio >= 1 ? "bg-emerald-500" : coverageRatio >= 0.8 ? "bg-amber-500" : "bg-rose-500";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Audit Reports</h1>
          <p className="text-gray-600 mt-1">Immutable audit trails and anchors from Hedera. Exportable for compliance.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={load}>Refresh</Button>
          <Button variant="outline" onClick={handleExportCSV}>Export CSV</Button>
          <Button onClick={handleExportJSON}>Export JSON</Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Select well and date range to refine the audit view and enable CSV export.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm text-gray-600">Well</label>
              <select
                className="mt-1 w-full border rounded-md h-10 px-3"
                value={wellId}
                onChange={(e) => setWellId(e.target.value)}
              >
                <option value="">All Wells</option>
                {wells.map((w: any) => (
                  <option key={w.id} value={w.id}>{w.name || w.code || w.id}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm text-gray-600">From</label>
              <input
                type="datetime-local"
                className="mt-1 w-full border rounded-md h-10 px-3"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm text-gray-600">To</label>
              <input
                type="datetime-local"
                className="mt-1 w-full border rounded-md h-10 px-3"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm text-gray-600">Search</label>
              <input
                type="text"
                placeholder="txId, type, wellId"
                className="mt-1 w-full border rounded-md h-10 px-3"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Overview */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Overview</CardTitle>
            <CardDescription>Network and event snapshot</CardDescription>
          </div>
          {!loading && (
            <span className="text-xs text-gray-500">Snapshot at {data?.snapshotAt}</span>
          )}
        </CardHeader>
        <CardContent>
          {loading && <div className="text-gray-600">Loading...</div>}
          {error && <div className="text-red-600">{error}</div>}
          {!loading && !error && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="border rounded-lg p-4 bg-white">
                <div className="text-xs text-gray-500 uppercase">Network</div>
                <div className="text-2xl font-bold">{data?.network || '-'}</div>
              </div>
              <div className="border rounded-lg p-4 bg-white">
                <div className="text-xs text-gray-500 uppercase">Events</div>
                <div className="text-2xl font-bold text-emerald-700">{data?.counts?.events ?? 0}</div>
              </div>
              <div className="border rounded-lg p-4 bg-white">
                <div className="text-xs text-gray-500 uppercase">Settlements</div>
                <div className="text-2xl font-bold text-blue-700">{data?.counts?.settlements ?? 0}</div>
              </div>
              <div className="border rounded-lg p-4 bg-white">
                <div className="text-xs text-gray-500 uppercase">Anchors</div>
                <div className="text-2xl font-bold text-purple-700">{data?.counts?.anchors ?? 0}</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* KPI & Financials */}
      {kpi && (
        <Card>
          <CardHeader>
            <CardTitle>KPI & Financials</CardTitle>
            <CardDescription>Liquidity, tariff, gross and split</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="border rounded-lg p-4 bg-white">
                <div className="text-xs uppercase text-gray-500">Liters (sum)</div>
                <div className="text-2xl font-bold text-emerald-700">{(kpi.liters || 0).toLocaleString()} L</div>
              </div>
              <div className="border rounded-lg p-4 bg-white">
                <div className="text-xs uppercase text-gray-500">Tariff</div>
                <div className="text-2xl font-bold text-blue-700">${Number(kpi.tariff || 0).toFixed(4)} / L</div>
              </div>
              <div className="border rounded-lg p-4 bg-white">
                <div className="text-xs uppercase text-gray-500">Gross</div>
                <div className="text-2xl font-bold">${Number(kpi.gross || 0).toFixed(4)}</div>
              </div>
              <div className="border rounded-lg p-4 bg-white">
                <div className="text-xs uppercase text-gray-500">Split (USDC)</div>
                <div className="mt-1 text-sm text-gray-700 space-y-1">
                  <div>Investor: <span className="font-semibold">${Number(kpi.split?.inv || 0).toFixed(4)}</span></div>
                  <div>Operator: <span className="font-semibold">${Number(kpi.split?.op || 0).toFixed(4)}</span></div>
                  <div>Platform: <span className="font-semibold">${Number(kpi.split?.plat || 0).toFixed(4)}</span></div>
                </div>
              </div>
              <div className="border rounded-lg p-4 bg-white">
                <div className="text-xs uppercase text-gray-500">Coverage</div>
                <div className={`text-2xl font-bold ${coverageRatio >= 1 ? "text-emerald-700" : coverageRatio >= 0.8 ? "text-amber-600" : "text-rose-600"}`}>{coverageRatio.toFixed(2)}x</div>
                <div className="mt-3 h-2 bg-gray-100 rounded">
                  <div className={`h-2 ${coverageColor} rounded transition-all`} style={{ width: `${coveragePct}%` }} />
                </div>
                <div className="mt-2 text-xs text-gray-500">Target: {Number(kpi.coverageTarget || 1).toFixed(2)}x</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Topics & Assets */}
      <Tabs defaultValue="topics" className="space-y-4">
        <TabsList>
          <TabsTrigger value="topics">Topics</TabsTrigger>
          <TabsTrigger value="assets">Assets</TabsTrigger>
          <TabsTrigger value="latest">Latest</TabsTrigger>
          <TabsTrigger value="streams">Streams</TabsTrigger>
        </TabsList>

        <TabsContent value="topics">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Events</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="font-mono text-sm break-all">{data?.topics?.events || "-"}</div>
                {data?.topics?.events && (
                  <Link href={hashscanTopicLink(data?.network, data?.topics?.events)} target="_blank" className="text-xs underline text-blue-700 mt-2 inline-block">Open in HashScan</Link>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Settlements</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="font-mono text-sm break-all">{data?.topics?.settlements || "-"}</div>
                {data?.topics?.settlements && (
                  <Link href={hashscanTopicLink(data?.network, data?.topics?.settlements)} target="_blank" className="text-xs underline text-blue-700 mt-2 inline-block">Open in HashScan</Link>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Anchors</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="font-mono text-sm break-all">{data?.topics?.anchors || "-"}</div>
                {data?.topics?.anchors && (
                  <Link href={hashscanTopicLink(data?.network, data?.topics?.anchors)} target="_blank" className="text-xs underline text-blue-700 mt-2 inline-block">Open in HashScan</Link>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="assets">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">HTS</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <div className="text-gray-500">Fungible Token</div>
                  {links?.hts?.tokenId ? (
                    <Link href={links?.hts?.tokenLink || "#"} target="_blank" className="text-blue-700 underline font-mono">{links?.hts?.tokenId}</Link>
                  ) : (
                    <div className="text-gray-400">—</div>
                  )}
                </div>
                <div>
                  <div className="text-gray-500">Project NFT</div>
                  {links?.hts?.nftTokenId ? (
                    <Link href={links?.hts?.nftTokenLink || "#"} target="_blank" className="text-blue-700 underline font-mono">{links?.hts?.nftTokenId}</Link>
                  ) : (
                    <div className="text-gray-400">—</div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">HCS Topics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-500">Events: </span>
                  {links?.hcs?.events ? <Link href={links.hcs.events} target="_blank" className="text-blue-700 underline">HashScan</Link> : <span className="text-gray-400">—</span>}
                </div>
                <div>
                  <span className="text-gray-500">Settlements: </span>
                  {links?.hcs?.settlements ? <Link href={links.hcs.settlements} target="_blank" className="text-blue-700 underline">HashScan</Link> : <span className="text-gray-400">—</span>}
                </div>
                <div>
                  <span className="text-gray-500">Anchors: </span>
                  {links?.hcs?.anchors ? <Link href={links.hcs.anchors} target="_blank" className="text-blue-700 underline">HashScan</Link> : <span className="text-gray-400">—</span>}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">HFS (IPFS)</CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                {hfsLinks?.manifestUri ? (
                  <div>
                    <div className="text-gray-500">Manifest URI</div>
                    <div className="font-mono break-all">{hfsLinks?.manifestUri}</div>
                    {hfsLinks?.gateway && (
                      <Link href={hfsLinks.gateway} target="_blank" className="mt-2 inline-flex items-center text-blue-700 underline">Open Manifest</Link>
                    )}
                  </div>
                ) : (
                  <div className="text-gray-400">—</div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="latest">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Latest Event</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-xs bg-gray-50 p-3 rounded overflow-auto">{JSON.stringify(data?.latest?.events, null, 2)}</pre>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Latest Settlement</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-xs bg-gray-50 p-3 rounded overflow-auto">{JSON.stringify(data?.latest?.settlements, null, 2)}</pre>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Latest Anchor</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-xs bg-gray-50 p-3 rounded overflow-auto">{JSON.stringify(data?.latest?.anchors, null, 2)}</pre>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="streams">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(["events", "settlements", "anchors"] as const).map((key) => (
              <Card key={key}>
                <CardHeader>
                  <CardTitle className="text-sm capitalize">{key}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-64 overflow-auto">
                    {loading ? (
                      <div className="text-sm text-gray-600">Loading...</div>
                    ) : (
                      <>
                        {(data?.events?.[key] || []).map((e: any, i: number) => (
                          <div key={i} className="p-3 border rounded-lg text-sm">
                            <div className="font-medium">{e.type} {e.volumeLiters ? `• +${e.volumeLiters} L` : ""}</div>
                            <div className="text-xs text-gray-500">{e.ts} • {e.wellId}</div>
                            {e.txId && (
                              <Link href={`https://hashscan.io/${data?.network || "testnet"}/transaction/${e.txId}`} target="_blank" className="text-xs underline text-blue-700">Open</Link>
                            )}
                          </div>
                        ))}
                        {(!data?.events?.[key] || (data?.events?.[key] || []).length === 0) && (
                          <div className="text-sm text-gray-500">No {key}.</div>
                        )}
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <div className="mt-6 flex justify-center text-xs text-gray-500">Demo only • Generated from server-side buffers</div>
    </div>
  );
}