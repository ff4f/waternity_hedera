"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

interface Well {
  id: string;
  code: string;
  name: string;
  location: string;
  topicId: string;
  tokenId?: string;
  operator?: {
    id: string;
    name: string;
  };
  _count?: {
    events: number;
    settlements: number;
  };
}

interface WellsResponse {
  wells: Well[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasMore: boolean;
  };
}

export default function WellsPage() {
  const [wells, setWells] = useState<Well[]>([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(12);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedWell, setSelectedWell] = useState<Well | null>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);

  const fetchWells = async (pageNum = 1) => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/wells?page=${pageNum}&limit=${limit}`);
      if (!res.ok) throw new Error("Failed to load wells");
      const data: WellsResponse = await res.json();
      setWells(data.wells || []);
      setTotal(data.pagination?.total || 0);
    } catch (e: any) {
      setError(e?.message || "Unexpected error");
    } finally {
      setLoading(false);
    }
  };

  const openEvents = async (well: Well) => {
    setSelectedWell(well);
    setEvents([]);
    setEventsLoading(true);
    try {
      const res = await fetch(`/api/wells/${well.id}/events`);
      if (res.ok) {
        const data = await res.json();
        setEvents(Array.isArray(data.events) ? data.events.slice(0, 10) : []);
      }
    } catch (e) {
      // ignore for UI demo
    } finally {
      setEventsLoading(false);
    }
  };

  useEffect(() => {
    fetchWells(page);
  }, [page]);

  const filteredWells = useMemo(() => {
    if (!search.trim()) return wells;
    const q = search.toLowerCase();
    return wells.filter(
      (w) =>
        (w.code || "").toLowerCase().includes(q) ||
        (w.name || "").toLowerCase().includes(q) ||
        (w.location || "").toLowerCase().includes(q)
    );
  }, [wells, search]);

  const totalEvents = useMemo(
    () => wells.reduce((sum, w) => sum + (w._count?.events || 0), 0),
    [wells]
  );
  const totalSettlements = useMemo(
    () => wells.reduce((sum, w) => sum + (w._count?.settlements || 0), 0),
    [wells]
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Wells Directory</h1>
            <p className="text-sm text-gray-600 mt-1">
              A curated list of tokenized water wells. Designed for judges: quick to scan, easy to evaluate.
            </p>
          </div>
          <Link
            href="/dashboard"
            className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-blue-700"
          >
            Back to Dashboard
          </Link>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by code, name, or location"
              className="w-72 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={() => fetchWells(page)}
              className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm hover:bg-gray-50"
            >
              Refresh
            </button>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-700">
            <div className="rounded-lg bg-white px-3 py-2 shadow">
              Total Wells: <span className="font-semibold">{total}</span>
            </div>
            <div className="rounded-lg bg-white px-3 py-2 shadow">
              Events: <span className="font-semibold">{totalEvents}</span>
            </div>
            <div className="rounded-lg bg-white px-3 py-2 shadow">
              Settlements: <span className="font-semibold">{totalSettlements}</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow">
          {loading ? (
            <div className="p-12 text-center text-gray-500">Loading wells…</div>
          ) : error ? (
            <div className="p-6 text-red-600">
              Failed to load wells. {error}
            </div>
          ) : filteredWells.length === 0 ? (
            <div className="p-12 text-center text-gray-600">
              No wells match your search.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
              {filteredWells.map((well) => (
                <div key={well.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <h3 className="font-semibold text-gray-900">
                        {well.code} — {well.name}
                      </h3>
                      <p className="text-sm text-gray-600">{well.location}</p>
                      <p className="text-xs text-gray-500">Topic: {well.topicId}</p>
                      <p className="text-xs text-gray-500">
                        Operator: <span className="font-medium">{well.operator?.name ?? "N/A"}</span>
                      </p>
                    </div>
                    <div className="text-right text-xs text-gray-600">
                      <div>{well._count?.events ?? 0} events</div>
                      <div>{well._count?.settlements ?? 0} settlements</div>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <button
                      onClick={() => openEvents(well)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      View Events
                    </button>
                    <Link
                      href={`/well/${well.id}`}
                      className="text-gray-600 hover:text-gray-900 text-sm"
                    >
                      Explore
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-6">
          <div className="text-sm text-gray-600">
            Page {page} of {Math.max(1, Math.ceil(total / limit))}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => (p * limit < total ? p + 1 : p))}
              disabled={page * limit >= total}
              className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Modal: Well Events */}
      {selectedWell && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSelectedWell(null)} />
          <div className="relative z-10 w-full max-w-2xl rounded-lg bg-white shadow-lg">
            <div className="flex items-center justify-between p-4 border-b">
              <div>
                <h2 className="text-lg font-semibold">Events — {selectedWell.code}</h2>
                <p className="text-xs text-gray-500">Latest 10 events from consensus</p>
              </div>
              <button
                onClick={() => setSelectedWell(null)}
                className="rounded-md border border-gray-300 bg-white px-3 py-1 text-sm hover:bg-gray-50"
              >
                Close
              </button>
            </div>
            <div className="p-4 max-h-[60vh] overflow-y-auto">
              {eventsLoading ? (
                <div className="text-center text-gray-500 py-8">Loading events…</div>
              ) : events.length === 0 ? (
                <div className="text-center text-gray-600 py-8">No events found.</div>
              ) : (
                <div className="space-y-3">
                  {events.map((ev, idx) => (
                    <div key={idx} className="border rounded-md p-3">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <div className="text-sm font-medium">{ev.type || "EVENT"}</div>
                          <div className="text-xs text-gray-600 break-words">{
                            typeof ev.payload === 'string'
                              ? ev.payload
                              : ev.payload
                                ? ([ev.payload?.details, ev.payload?.by].filter(Boolean).join(' — ') || JSON.stringify(ev.payload))
                                : (ev.hash || "—")
                          }</div>
                        </div>
                        <div className="text-xs text-gray-500 text-right">
                          {(ev.consensusTimestamp || ev.consensusTime || ev.createdAt) || ""}
                        </div>
                      </div>
                      {ev.transactionId && (
                        <div className="mt-2 text-[11px] text-gray-500">tx: {ev.transactionId}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}