import React, { useMemo, useRef, useState, useEffect } from "react";
import ProofTray from '../../components/ui/ProofTray';
import GlobalHeader from '../../components/ui/GlobalHeader';
import { api } from '../../lib/api';
import { getRoleByWallet, canAccess } from '../../lib/rbac';

// utilities
function fmt(n, opt = {}) {
  if (typeof n === "number") return n.toLocaleString(undefined, { maximumFractionDigits: 2, ...opt });
  return n;
}

function nowTxRef() {
  const d = new Date();
  const sec = Math.floor(d.getTime() / 1000);
  const nano = String(d.getMilliseconds() * 1_000_000).padStart(9, '0');
  return `${sec}.${nano}`;
}

function short(s) {
  if (!s) return '';
  return s.length > 14 ? `${s.slice(0, 6)}…${s.slice(-6)}` : s;
}

function hashscanTxLink(ref) {
  return `https://hashscan.io/testnet/transaction/${ref}`;
}

function ipfs(cid) {
  return `https://ipfs.io/ipfs/${cid}`;
}

function fakeCid() {
  return `bafy${Math.random().toString(36).slice(2, 10)}${Math.random().toString(36).slice(2, 10)}`;
}

// steps
const STEPS_WELL = [
  { key: 1, label: 'Permit & Site Ready', pct: 0.15 },
  { key: 2, label: 'Drilling Done (IoT)', pct: 0.25 },
  { key: 3, label: 'Pump Installed (IoT)', pct: 0.20 },
  { key: 4, label: 'Meter+Valve Ready (IoT)', pct: 0.20 },
];

const STEPS_KIOSK = [
  { key: 1, label: 'License & Site Ready', pct: 0.20 },
  { key: 2, label: 'Pump & Tank Setup (IoT)', pct: 0.30 },
  { key: 3, label: 'Dispenser Installed (IoT)', pct: 0.25 },
  { key: 4, label: 'Meter+Valve Ready (IoT)', pct: 0.15 },
];

const SEED_DEALS = [
  { id: 'DL-001', name: 'Ngong Hills Well', type: 'Well', apr: 10.5, tenor: 180, target: 12000, raised: 3500, operator: 'AquaTech Ltd', tariff: 0.05, forecast: 2000 },
  { id: 'DL-002', name: 'Kajiado Solar Pump Kiosk', type: 'Kiosk', apr: 9.2, tenor: 210, target: 14500, raised: 6200, operator: 'HydroFlow Inc', tariff: 0.03, forecast: 1500 },
  { id: 'DL-003', name: 'Makueni Borehole', type: 'Well', apr: 11.8, tenor: 150, target: 9800, raised: 2700, operator: 'CleanWater Co', tariff: 0.06, forecast: 2500 },
  { id: 'DL-004', name: 'PureSource Well #2', type: 'Well', apr: 12.8, tenor: 165, target: 18000, raised: 8500, operator: 'PureSource Ltd', tariff: 0.04, forecast: 1800 },
  { id: 'DL-005', name: 'AquaPoint Kiosk B', type: 'Kiosk', apr: 8.5, tenor: 195, target: 16000, raised: 11200, operator: 'AquaPoint Inc', tariff: 0.035, forecast: 1200 },
  { id: 'DL-006', name: 'BlueWave Well #4', type: 'Well', apr: 13.7, tenor: 140, target: 22000, raised: 15500, operator: 'BlueWave Co', tariff: 0.055, forecast: 2200 },
];

const INIT_PROJECT = {
  type: 'well',
  wellId: 'WELL-NE-001',
  operator: 'Ngong Hills Water Co‑op',
  location: '-1.2921,36.8219',
  capexTarget: 12000,
  raised: 3500,
  tariff: 0.0008, // USDC / L
  forecastLitersDay: 5200,
  split: { inv: 0.4, op: 0.5, plat: 0.1 },
  status: 'DRAFT',
  topics: { build: '0.0.8801', meter: '0.0.8802', settlement: '0.0.8803', audit: '0.0.8804' },
};

const STATUS_ORDER = ['DRAFT', 'NFT_MINTED', 'FUNDING_OPEN', 'FUNDED', 'BUILD_DONE', 'LIVE', 'ANCHORED'];

const WATCHLIST_ITEMS = [
  { id: 'WL-001', name: 'Ngong Hills Well', type: 'well', price: 1.25, change: 0.08, volume: 2400 },
  { id: 'WL-002', name: 'Kajiado Solar Kiosk', type: 'kiosk', price: 0.95, change: -0.03, volume: 1800 },
  { id: 'WL-003', name: 'Makueni Borehole', type: 'well', price: 1.15, change: 0.12, volume: 3200 },
  { id: 'WL-004', name: 'Mombasa Desalination', type: 'plant', price: 2.40, change: 0.25, volume: 5600 }
];

const PERFORMANCE_METRICS = [
  { period: 'Today', revenue: 1240, volume: 3200, efficiency: 94.2 },
  { period: 'This Week', revenue: 8680, volume: 22400, efficiency: 92.8 },
  { period: 'This Month', revenue: 34200, volume: 89600, efficiency: 93.5 },
  { period: 'YTD', revenue: 156800, volume: 412000, efficiency: 91.7 }
];

const RISK_METRICS = [
  { category: 'Operational', score: 85, trend: 'stable', issues: 2 },
  { category: 'Financial', score: 92, trend: 'improving', issues: 1 },
  { category: 'Environmental', score: 78, trend: 'declining', issues: 4 },
  { category: 'Regulatory', score: 96, trend: 'stable', issues: 0 }
];

const TRANSACTION_HISTORY = [
  { id: 'TX-001', type: 'deposit', amount: 5000, date: '2024-01-15', status: 'completed' },
  { id: 'TX-002', type: 'yield', amount: 125.50, date: '2024-01-14', status: 'completed' },
  { id: 'TX-003', type: 'deposit', amount: 2500, date: '2024-01-12', status: 'completed' },
  { id: 'TX-004', type: 'withdrawal', amount: 1000, date: '2024-01-10', status: 'pending' }
];

const PROJECT_PERFORMANCE = [
  { project: 'Ngong Hills Well', apy: 10.5, tvl: 12000, utilization: 87.3, status: 'active' },
  { project: 'Kajiado Solar Kiosk', apy: 9.2, tvl: 14500, utilization: 92.1, status: 'active' },
  { project: 'Makueni Borehole', apy: 11.8, tvl: 9800, utilization: 78.5, status: 'building' },
  { project: 'Mombasa Desalination', apy: 8.7, tvl: 25000, utilization: 95.2, status: 'active' }
];

const BUILD_METRICS = [
  { metric: 'Active Projects', value: 4, change: '+1', trend: 'up' },
  { metric: 'Total Capex', value: 61300, change: '+8.2%', trend: 'up' },
  { metric: 'Avg Build Time', value: 45, change: '-3 days', trend: 'down' },
  { metric: 'Success Rate', value: 94.5, change: '+2.1%', trend: 'up' }
];

const PROJECT_TEMPLATES = [
  { id: 'TPL-001', name: 'Standard Well Template', type: 'well', capex: 12000, timeline: 60, success_rate: 95.2 },
  { id: 'TPL-002', name: 'Solar Kiosk Template', type: 'kiosk', capex: 14500, timeline: 45, success_rate: 92.8 },
  { id: 'TPL-003', name: 'Borehole Template', type: 'well', capex: 9800, timeline: 50, success_rate: 96.1 },
  { id: 'TPL-004', name: 'Desalination Plant', type: 'plant', capex: 25000, timeline: 90, success_rate: 89.3 }
];

const MILESTONE_HISTORY = [
  { id: 'MS-001', project: 'Ngong Hills Well', milestone: 'Permit & Site Ready', date: '2024-01-10', status: 'completed' },
  { id: 'MS-002', project: 'Kajiado Solar Kiosk', milestone: 'Pump & Tank Setup', date: '2024-01-12', status: 'completed' },
  { id: 'MS-003', project: 'Makueni Borehole', milestone: 'Drilling Done', date: '2024-01-15', status: 'in_progress' },
  { id: 'MS-004', project: 'Mombasa Desalination', milestone: 'License & Site Ready', date: '2024-01-18', status: 'pending' }
];

const DOCUMENT_LIBRARY = [
  { id: 'DOC-001', name: 'Environmental Impact Assessment', type: 'permit', project: 'Ngong Hills Well', size: '2.4 MB', date: '2024-01-08' },
  { id: 'DOC-002', name: 'Construction Blueprint', type: 'technical', project: 'Kajiado Solar Kiosk', size: '5.1 MB', date: '2024-01-10' },
  { id: 'DOC-003', name: 'Water Quality Report', type: 'compliance', project: 'Makueni Borehole', size: '1.8 MB', date: '2024-01-12' },
  { id: 'DOC-004', name: 'Safety Protocol', type: 'safety', project: 'Mombasa Desalination', size: '3.2 MB', date: '2024-01-14' }
];

const OPERATE_METRICS = [
  { metric: 'Flow Rate', value: 125.4, change: '+2.3%', trend: 'up' },
  { metric: 'Pressure (PSI)', value: 45.2, change: '-0.8%', trend: 'down' },
  { metric: 'Efficiency', value: 94.7, change: '+1.2%', trend: 'up' },
  { metric: 'Uptime', value: 99.2, change: '+0.5%', trend: 'up' }
];

const VALVE_HISTORY = [
  { id: 'VH-001', action: 'Open', timestamp: '2024-01-15 14:30:22', operator: 'System Auto', reason: 'Coverage threshold met' },
  { id: 'VH-002', action: 'Close', timestamp: '2024-01-15 12:15:45', operator: 'John Doe', reason: 'Maintenance required' },
  { id: 'VH-003', action: 'Open', timestamp: '2024-01-15 09:22:10', operator: 'System Auto', reason: 'Build milestone completed' },
  { id: 'VH-004', action: 'Close', timestamp: '2024-01-14 18:45:33', operator: 'Jane Smith', reason: 'Emergency shutdown' }
];

const METER_READINGS = [
  { id: 'MR-001', timestamp: '2024-01-15 15:45:22', volume: 200, cumulative: 15420, device_id: 'METER-001', status: 'active' },
  { id: 'MR-002', timestamp: '2024-01-15 15:30:18', volume: 50, cumulative: 15220, device_id: 'METER-001', status: 'active' },
  { id: 'MR-003', timestamp: '2024-01-15 15:15:45', volume: 200, cumulative: 15170, device_id: 'METER-001', status: 'active' },
  { id: 'MR-004', timestamp: '2024-01-15 15:00:12', volume: 50, cumulative: 14970, device_id: 'METER-001', status: 'active' }
];

const TARIFF_HISTORY = [
  { id: 'TH-001', old_rate: 0.0007, new_rate: 0.0008, timestamp: '2024-01-15 10:30:00', operator: 'Admin', reason: 'Market adjustment' },
  { id: 'TH-002', old_rate: 0.0006, new_rate: 0.0007, timestamp: '2024-01-10 14:15:30', operator: 'System', reason: 'Automated increase' },
  { id: 'TH-003', old_rate: 0.0008, new_rate: 0.0006, timestamp: '2024-01-05 09:45:15', operator: 'Admin', reason: 'Promotional rate' },
  { id: 'TH-004', old_rate: 0.0005, new_rate: 0.0008, timestamp: '2024-01-01 00:00:00', operator: 'System', reason: 'New year adjustment' }
];

function Progress({ value, color = 'sky' }) {
  const c = color === 'emerald' ? 'bg-emerald-500' : color === 'rose' ? 'bg-rose-500' : 'bg-sky-500';
  return <div className="w-full h-2 rounded bg-slate-100 overflow-hidden"><div className={`${c} h-2`} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} /></div>;
}

function Sparkline({ data = [], width = 260, height = 44, color = 'sky' }) {
  const min = Math.min(...data, 0);
  const max = Math.max(...data, 1);
  const pts = data.map((v, i) => `${(i / (Math.max(1, data.length - 1))) * width},${height - (((v - min) / (max - min || 1)) * height)}`).join(' ');
  const colorClass = color === 'emerald' ? 'text-emerald-600' : color === 'rose' ? 'text-rose-600' : 'text-sky-600';
return (
    <svg width={width} height={height} className={colorClass}>
      <polyline fill="none" stroke="currentColor" strokeWidth="2" points={pts} />
    </svg>
  );
}



function KpiCard({ label, value, sub, change, sparkData }) {
  const getChangeDisplay = (change) => {
    if (typeof change === 'number') {
      return `${change > 0 ? '+' : ''}${change.toFixed(1)}%`;
    }
    return change; // Already formatted string
  };

  const getChangeColor = (change) => {
    if (typeof change === 'number') {
      return change > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700';
    }
    // For string values, check if it starts with '+' or '-'
    const isPositive = change && (change.startsWith('+') || (!change.startsWith('-') && !change.includes('-')));
    return isPositive ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700';
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="text-2xl font-bold text-slate-900 leading-tight">{value}</div>
          <div className="text-sm text-slate-600 mt-2 font-medium">{label}</div>
          {sub && <div className="text-xs text-slate-500 mt-1">{sub}</div>}
        </div>
        {change && (
          <div className={`text-xs px-3 py-1.5 rounded-full font-medium ${getChangeColor(change)}`}>
            {getChangeDisplay(change)}
          </div>
        )}
      </div>
      {sparkData && (
        <div className="mt-4 pt-2 border-t border-slate-100">
          <Sparkline data={sparkData} width={180} height={32} />
        </div>
      )}
    </div>
  );
}

// Enhanced Table component
function DataTable({ data, columns, searchable = true, sortable = true, filters = [] }) {
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState('');
  const [sortDirection, setSortDirection] = useState('asc');
  const [activeFilters, setActiveFilters] = useState({});

  const filteredData = useMemo(() => {
    let result = data;
    
    // Apply search
    if (search && searchable) {
      result = result.filter(item => {
        return columns.some(col => {
          const value = item[col.key];
          return value && value.toString().toLowerCase().includes(search.toLowerCase());
        });
      });
    }
    
    // Apply filters
    Object.entries(activeFilters).forEach(([filterKey, filterValue]) => {
      if (filterValue && filterValue !== 'all') {
        result = result.filter(item => item[filterKey] === filterValue);
      }
    });
    
    // Apply sorting
    if (sortField && sortable) {
      result = [...result].sort((a, b) => {
        const aVal = a[sortField];
        const bVal = b[sortField];
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
        }
        const aStr = String(aVal).toLowerCase();
        const bStr = String(bVal).toLowerCase();
        if (sortDirection === 'asc') {
          return aStr < bStr ? -1 : aStr > bStr ? 1 : 0;
        } else {
          return aStr > bStr ? -1 : aStr < bStr ? 1 : 0;
        }
      });
    }
    
    return result;
  }, [data, search, sortField, sortDirection, activeFilters, columns, searchable, sortable]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap gap-3 items-center">
        {searchable && (
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm flex-1 min-w-0 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          />
        )}
        {filters.map(filter => (
          <select
            key={filter.key}
            value={activeFilters[filter.key] || 'all'}
            onChange={(e) => setActiveFilters(prev => ({ ...prev, [filter.key]: e.target.value }))}
            className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          >
            <option value="all">All {filter.label}</option>
            {filter.options.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-white rounded-xl border border-slate-200 shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-600 text-xs bg-slate-50 border-b border-slate-200">
              {columns.map(col => (
                <th key={col.key} className="px-6 py-4 font-medium">
                  {sortable ? (
                    <button 
                      onClick={() => handleSort(col.key)}
                      className="flex items-center gap-2 hover:text-slate-800 transition-colors duration-200"
                    >
                      {col.label}
                      {sortField === col.key && (
                        <span className="text-blue-500">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </button>
                  ) : (
                    col.label
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center text-slate-500">
                  {search || Object.values(activeFilters).some(f => f && f !== 'all') 
                    ? 'No results found' 
                    : 'No data available'}
                </td>
              </tr>
            ) : (
              filteredData.map((row, i) => (
                <tr key={row.id || row.key || `row-${i}`} className="border-t border-slate-100 hover:bg-slate-50 transition-colors duration-150">
                  {columns.map(col => (
                    <td key={col.key} className="px-6 py-4 text-slate-700">
                      {col.render ? col.render(row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
export default function WaternityProDashboard() {
  // global state
  const [active, setActive] = useState('invest_overview');
  const [project, setProject] = useState(INIT_PROJECT);
  const [deals, setDeals] = useState(SEED_DEALS);
  const [docs, setDocs] = useState([]);
  const [proofs, setProofs] = useState([]);
  const [buildIdx, setBuildIdx] = useState(0);
  const [escrow, setEscrow] = useState(INIT_PROJECT.raised);
  const [deposited, setDeposited] = useState(0);
  const [liters, setLiters] = useState(0);
  const [pendingLiters, setPendingLiters] = useState(0);
  const [payoutInv, setPayoutInv] = useState(0);
  const [payoutOp, setPayoutOp] = useState(0);
  const [payoutPlat, setPayoutPlat] = useState(0);
  const [settlements, setSettlements] = useState([]);
  const [disbHistory, setDisbHistory] = useState([]);
  
  // Enhanced state for new features
  const [pinnedProofs, setPinnedProofs] = useState(new Set());
  const [watchlist, setWatchlist] = useState(WATCHLIST_ITEMS);
  const [activeSection, setActiveSection] = useState('invest');
  const [activeTab, setActiveTab] = useState('overview');
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [showDealDetail, setShowDealDetail] = useState(null);
  const [dealSearch, setDealSearch] = useState('');
  const [dealTypeFilter, setDealTypeFilter] = useState('all');
  const [dealSort, setDealSort] = useState('apr_desc');
  
  // Mint form state
  const [mintForm, setMintForm] = useState({
    type: 'well',
    wellId: 'WL-007',
    operator: 'HydroTech Solutions',
    capexTarget: 15000,
    forecastLitersDay: 1800,
    tariff: 0.045,
    split: { inv: 70, op: 25, plat: 5 }
  });
  const [newTariff, setNewTariff] = useState(project.tariff);

  // RBAC: Mock wallet for demo, would be replaced with real wallet state
  const wallet = { accountId: '0.0.123456', connected: true };
  const effectiveRole = getRoleByWallet(wallet.accountId);

  const steps = useMemo(() => project.type === 'kiosk' ? STEPS_KIOSK : STEPS_WELL, [project.type]);
  const buildPct = useMemo(() => steps.slice(0, buildIdx).reduce((a, b) => a + b.pct, 0) * 100, [steps, buildIdx]);
  const coverage = useMemo(() => {
    const denom = (project.forecastLitersDay * project.tariff) || 1; // daily gross potential
    return (escrow / denom);
  }, [escrow, project]);

  // Enhanced computed values
  const totalTVL = useMemo(() => deals.reduce((sum, d) => sum + d.raised, 0), [deals]);
  const avgAPY = useMemo(() => {
    const weightedSum = deals.reduce((sum, d) => sum + (d.apr * d.raised), 0);
    return totalTVL > 0 ? weightedSum / totalTVL : 0;
  }, [deals, totalTVL]);
  


  // helpers
  function pushProof(p) { setProofs(prev => [{ ...p, time: Date.now() }, ...prev]); }

  function togglePinProof(tx) {
    setPinnedProofs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(tx)) {
        newSet.delete(tx);
      } else {
        newSet.add(tx);
      }
      return newSet;
    });
  }

  function fundDeal(dealId, amount) {
    if (!amount || amount <= 0) return;
    const tx = nowTxRef();
    setDeals(prev => prev.map(d => d.id === dealId ? { ...d, raised: Math.min(d.target, d.raised + amount) } : d));
    setEscrow(v => v + amount);
    setDeposited(v => v + amount);
    pushProof({ type: 'HTS', label: `FUND_${dealId} $${amount}`, tx, link: hashscanTxLink(tx) });
    if (escrow + amount >= project.capexTarget) setProject(p => ({ ...p, status: 'FUNDED' }));
  }

  async function mintNFT(newMeta) {
    try {
      // 1) Create NFT class
      const name = (newMeta?.type || project.type) === 'kiosk' ? 'Kiosk NFT' : 'Well NFT';
      const symbol = (newMeta?.type || project.type) === 'kiosk' ? 'KIOSK' : 'WELL';
      const memo = `${(newMeta?.wellId || project.wellId)} • ${newMeta?.operator || project.operator}`;
      const r1 = await api('/api/hts/nft/create', { method: 'POST', body: JSON.stringify({ name, symbol, memo }) });
      if (!r1?.ok && !r1?.tokenId) throw new Error('NFT create failed');
      const tokenId = r1.tokenId || '';

      // 2) Mint one NFT with manifest URI from backend environment
      const r2 = await api('/api/hts/nft/mint', { method: 'POST', body: JSON.stringify({ tokenId }) });
      if (!r2?.ok) throw new Error('NFT mint failed');

      const tx = nowTxRef();
      const meta = { ...newMeta, nftTokenId: tokenId };
      setProject(p => ({ ...p, ...meta, status: 'NFT_MINTED' }));
      pushProof({ type: 'HTS', label: `${(meta?.type || project.type).toUpperCase()}_NFT_CREATED ${tokenId}`, tx, link: hashscanTxLink(tx) });
      pushProof({ type: 'HTS', label: `${(meta?.type || project.type).toUpperCase()}_NFT_MINTED serial #${(r2?.serials?.[0] || '1')}`, tx: tx + '-2', link: hashscanTxLink(tx) });
    } catch (e) {
      console.error(e);
      alert(`Mint failed: ${e?.message || e}`);
    }
  }

  function openFunding() { setProject(p => ({ ...p, status: 'FUNDING_OPEN' })); }

  function triggerMilestone() {
    if (buildIdx >= steps.length) return;
    const s = steps[buildIdx];
    const hcs = nowTxRef();
    pushProof({ type: 'HCS', label: `DEVICE_EVENT ${s.label}`, tx: hcs, link: hashscanTxLink(hcs) });
    const release = (project.capexTarget || 0) * s.pct;
    const hts = nowTxRef();
    setEscrow(v => Math.max(0, v - release));
    setDisbHistory(h => [{ step: s.label, pct: s.pct, amount: release, tx: hts, time: Date.now() }, ...h]);
    pushProof({ type: 'HTS', label: `DISBURSE_${Math.round(s.pct * 100)}% $${fmt(release)}`, tx: hts, link: hashscanTxLink(hts) });
    const next = buildIdx + 1;
    setBuildIdx(next);
    if (next === steps.length) setProject(p => ({ ...p, status: 'BUILD_DONE' }));
  }

  function setTariff(v) {
    const tx = nowTxRef();
    setProject(p => ({ ...p, tariff: v }));
    pushProof({ type: 'HCS', label: `TARIFF_SET ${v.toFixed(4)} USDC/L`, tx, link: hashscanTxLink(tx) });
  }

  async function toggleValve() {
    if (project.status !== 'BUILD_DONE' && project.status !== 'LIVE') return;
    
    const isOpening = project.status !== 'LIVE';
    const percent = isOpening ? 100 : 0;
    const reason = isOpening ? 'Coverage threshold met' : 'Manual shutdown';
    
    if (isOpening && coverage < 1) {
      alert('Coverage < 1.0 — deposit more to open valve.');
      return;
    }

    try {
      // Call dry-run first
      const dryRunResponse = await api('/api/operate/valve/dryrun', {
        method: 'POST',
        body: JSON.stringify({
          topicId: project.topics.meter,
          percent,
          reason,
          wellId: project.wellId,
        }),
      });

      if (!dryRunResponse?.ok) {
        alert('Valve dry-run failed. Please try again.');
        return;
      }

      // If dry-run successful, proceed with actual toggle
      const tx = nowTxRef();
      if (isOpening) {
        setProject(p => ({ ...p, status: 'LIVE' }));
        pushProof({ type: 'HCS', label: 'VALVE_OPEN', tx, link: hashscanTxLink(tx) });
      } else {
        setProject(p => ({ ...p, status: 'BUILD_DONE' }));
        pushProof({ type: 'HCS', label: 'VALVE_CLOSE', tx, link: hashscanTxLink(tx) });
      }
    } catch (error) {
      console.error('Valve operation failed:', error);
      alert('Valve operation failed. Please try again.');
    }
  }

  function pulse(q) {
    if (project.status !== 'LIVE') return;
    const tx = nowTxRef();
    pushProof({ type: 'HCS', label: `METER_READING +${q}L`, tx, link: hashscanTxLink(tx) });
    setLiters(v => v + q);
    setPendingLiters(v => v + q);
  }

  function settleNow() {
    if (pendingLiters <= 0) return;
    const gross = pendingLiters * project.tariff;
    const inv = gross * project.split.inv;
    const op = gross * project.split.op;
    const plat = gross * project.split.plat;
    const tx1 = nowTxRef();
    const tx2 = nowTxRef();
    const tx3 = nowTxRef();
    const hcs = nowTxRef();
    pushProof({ type: 'HTS', label: `PAYOUT_INV $${inv.toFixed(4)}`, tx: tx1, link: hashscanTxLink(tx1) });
    pushProof({ type: 'HTS', label: `PAYOUT_OP $${op.toFixed(4)}`, tx: tx2, link: hashscanTxLink(tx2) });
    pushProof({ type: 'HTS', label: `PLATFORM_FEE $${plat.toFixed(4)}`, tx: tx3, link: hashscanTxLink(tx3) });
    pushProof({ type: 'HCS', label: `SETTLEMENT_RUN gross $${gross.toFixed(4)}`, tx: hcs, link: hashscanTxLink(hcs) });
    setPayoutInv(v => v + inv);
    setPayoutOp(v => v + op);
    setPayoutPlat(v => v + plat);
    setSettlements(s => [{ tx: hcs, time: Date.now(), gross, inv, op, plat }, ...s]);
    setPendingLiters(0);
  }

  function anchorBundle() {
    const tx = nowTxRef();
    const cid = 'bafybeigdyrhk7yxxwellswl001manifest';
    pushProof({ type: 'HCS', label: 'ANCHOR_MERKLE_ROOT', tx, link: hashscanTxLink(tx) });
    pushProof({ type: 'HFS', label: `AUDIT_REPORT ${short(cid)}`, tx: cid, link: `${ipfs(cid)}/manifest.json` });
    setProject(p => ({ ...p, status: 'ANCHORED' }));
  }

  // Enhanced data for sparklines
  const yieldSpark = useMemo(() => {
    if (settlements.length < 2) return [0, 0, 0, 0, 0];
    const recent = settlements.slice(0, 5).reverse();
    return recent.map(s => s.inv);
  }, [settlements]);



  function clearProofs() {
    setProofs([]);
    setPinnedProofs(new Set());
  }

  // Quick actions
  const quickActions = [
    { label: 'Fund Random Deal', action: () => {
      const randomDeal = deals[Math.floor(Math.random() * deals.length)];
      if (randomDeal) fundDeal(randomDeal.id, Math.floor(Math.random() * 2000) + 500);
    }},
    { 
      label: 'Trigger Milestone', 
      action: triggerMilestone,
      disabled: !canAccess(effectiveRole, 'operator'),
      tooltip: !canAccess(effectiveRole, 'operator') ? 'Operator role required' : null
    },
    { label: 'Record 100L', action: () => pulse(100) },
    { 
      label: 'Settle Now', 
      action: settleNow,
      disabled: !canAccess(effectiveRole, 'agent'),
      tooltip: !canAccess(effectiveRole, 'agent') ? 'Agent role required' : null
    },
    { 
      label: 'Anchor Proofs', 
      action: anchorBundle,
      disabled: !canAccess(effectiveRole, 'agent'),
      tooltip: !canAccess(effectiveRole, 'agent') ? 'Agent role required' : null
    },
  ];

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.ctrlKey) {
        const index = parseInt(e.key) - 1;
        if (index >= 0 && index < quickActions.length) {
          e.preventDefault();
          quickActions[index]?.action();
        }
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [quickActions]);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-slate-200 flex flex-col shadow-sm">
        <div className="p-6 border-b border-slate-200">
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Waternity Pro</h1>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed">Every liter on Hedera — yield & impact, instantly verifiable.</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          {/* INVEST Section */}
          <div className="space-y-1">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 py-2">INVEST</div>
            {[
              { key: 'overview', label: 'Overview', icon: '📊' },
              { key: 'deals', label: 'Deals', icon: '💰' },
              { key: 'portfolio', label: 'Portfolio', icon: '📈' }
            ].map(item => (
              <button
                key={item.key}
                onClick={() => { setActiveSection('invest'); setActiveTab(item.key); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-left transition-all duration-200 ${
                  activeSection === 'invest' && activeTab === item.key
                    ? 'bg-sky-100 text-sky-700 font-medium shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <span className="text-base">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </div>

          {/* BUILD Section */}
          <div className="space-y-1 mt-6">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 py-2">BUILD</div>
            {[
              { key: 'mint', label: 'Mint Project NFT', icon: '🏗️' },
              { key: 'documents', label: 'Documents', icon: '📄' },
              { key: 'milestones', label: 'Milestones', icon: '🎯' }
            ].map(item => (
              <button
                key={item.key}
                onClick={() => { setActiveSection('build'); setActiveTab(item.key); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-left transition-all duration-200 ${
                  activeSection === 'build' && activeTab === item.key
                    ? 'bg-sky-100 text-sky-700 font-medium shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <span className="text-base">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </div>

          {/* OPERATE Section */}
          <div className="space-y-1 mt-6">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 py-2">OPERATE</div>
            {[
              { key: 'tariff', label: 'Tariff & Valve', icon: '⚙️' },
              { key: 'meter', label: 'Meter Console', icon: '📡' }
            ].map(item => (
              <button
                key={item.key}
                onClick={() => { setActiveSection('operate'); setActiveTab(item.key); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-left transition-all duration-200 ${
                  activeSection === 'operate' && activeTab === item.key
                    ? 'bg-sky-100 text-sky-700 font-medium shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <span className="text-base">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </div>

          {/* SETTLE Section */}
          <div className="space-y-1 mt-6">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 py-2">SETTLE</div>
            {[
              { key: 'escrow', label: 'Escrow & Settlement', icon: '💳' },
              { key: 'anchor', label: 'Anchor Proofs', icon: '⚓' }
            ].map(item => (
              <button
                key={item.key}
                onClick={() => { setActiveSection('settle'); setActiveTab(item.key); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-left transition-all duration-200 ${
                  activeSection === 'settle' && activeTab === item.key
                    ? 'bg-sky-100 text-sky-700 font-medium shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <span className="text-base">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </div>

          {/* AUDIT Section */}
          <div className="space-y-1 mt-6">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 py-2">AUDIT</div>
            <button
              onClick={() => { setActiveSection('audit'); setActiveTab('reports'); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-left transition-all duration-200 ${
                activeSection === 'audit'
                  ? 'bg-sky-100 text-sky-700 font-medium shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <span className="text-base">📋</span>
              <span className="font-medium">Reports</span>
            </button>
          </div>
        </nav>

        {/* Quick Actions */}
        <div className="p-4 border-t border-slate-200">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Quick Actions</div>
          <div className="space-y-2">
            <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all duration-200">
              <span className="text-base">🎬</span>
              <span className="font-medium">Run Demo</span>
            </button>
            <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all duration-200">
              <span className="text-base">🌱</span>
              <span className="font-medium">Seed Data</span>
            </button>
            <button onClick={clearProofs} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all duration-200">
              <span className="text-base">🗑️</span>
              <span className="font-medium">Clear Proofs</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <GlobalHeader 
          isAuthenticated={true}
          userRole="investor"
          wallet={wallet}
        />
        {/* Header */}
        <div className="bg-white border-b border-slate-200 px-6 py-5 shadow-sm mt-16">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-slate-900 capitalize tracking-tight">
                {activeSection} {activeTab !== 'overview' && activeTab !== 'reports' ? `• ${activeTab}` : ''}
              </h1>
            </div>
            
            {/* Quick Actions */}
            <div className="flex gap-3">
              {quickActions.map((action, i) => (
                <button
                  key={i}
                  onClick={action.disabled ? undefined : action.action}
                  disabled={action.disabled}
                  className={`px-4 py-2.5 rounded-lg relative group text-sm font-medium transition-all duration-200 shadow-sm ${
                    action.disabled 
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      : 'bg-slate-100 hover:bg-slate-200'
                  }`}
                  title={action.tooltip || `Shortcut: Ctrl+${i+1}`}
                >
                  {action.label}
                  <span className="invisible group-hover:visible absolute bottom-full mb-2 px-2 py-1 text-xs bg-slate-700 text-white rounded whitespace-nowrap z-10">
                    {action.tooltip || `Ctrl+${i+1}`}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="p-6 bg-slate-50 flex-1 overflow-auto">
          {activeSection === 'invest' && activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Main KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <KpiCard
                  label="TVL ($)"
                  value={`$${fmt(totalTVL)}`}
                  sub="Total Value Locked"
                  change="+12.5%"
                  sparkData={[totalTVL * 0.8, totalTVL * 0.9, totalTVL * 0.95, totalTVL]}
                />
                <KpiCard
                  label="Avg APY (sim)"
                  value={`${avgAPY.toFixed(1)}%`}
                  sub="Weighted average"
                  change="+0.8%"
                  sparkData={[8.5, 9.2, 9.8, avgAPY]}
                />
                <KpiCard
                  label="Active Deals"
                  value={deals.length}
                  sub="Currently funding"
                  change="+2"
                  sparkData={[deals.length - 2, deals.length - 1, deals.length, deals.length]}
                />
                <KpiCard
                  label="Next Settlement"
                  value="3 days"
                  sub="ETA estimate"
                  change="-1 day"
                  sparkData={[7, 5, 4, 3]}
                />
              </div>

              {/* Impact Today & Coverage Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-lg hover:shadow-xl transition-all duration-300">
                  <h3 className="text-xl font-bold mb-6 text-blue-600">Impact Today</h3>
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 font-semibold">Liters Dispensed</span>
                      <span className="font-bold text-2xl text-slate-900">{fmt(liters + 15420)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 font-semibold">People Hydrated</span>
                      <span className="font-bold text-2xl text-green-600">{Math.floor((liters + 15420) / 20)}</span>
                    </div>
                    <div className="text-xs text-slate-500 mt-3 pt-3 border-t border-slate-100">Based on 20L per person daily</div>
                  </div>
                </div>
                
                <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-lg hover:shadow-xl transition-all duration-300">
                  <h3 className="text-xl font-bold mb-6 text-purple-600">Coverage Ratio</h3>
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 font-semibold">Current Ratio</span>
                      <span className={`font-bold text-2xl ${coverage >= 1.0 ? 'text-green-600' : 'text-red-600'}`}>
                        {coverage.toFixed(2)}
                      </span>
                    </div>
                    <Progress value={Math.min(coverage * 100, 100)} color={coverage >= 1.0 ? 'green' : 'red'} />
                    <div className="text-xs text-slate-500 mt-4 pt-4 border-t border-slate-100">Escrow ÷ (Tariff × Forecast/day)</div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-lg hover:shadow-xl transition-all duration-300">
                  <h3 className="text-xl font-bold mb-6 text-orange-600">Yield Sparkline</h3>
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 font-semibold">7-Day Trend</span>
                      <span className="font-bold text-2xl text-slate-900">${payoutInv.toFixed(2)}</span>
                    </div>
                    <Sparkline data={[45, 52, 48, 61, 58, 67, payoutInv]} color="orange" />
                    <div className="text-xs text-slate-500 mt-4 pt-4 border-t border-slate-100">Daily yield performance</div>
                  </div>
                </div>
              </div>

              {/* Funding Activity Table */}
              <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-lg">
                <h3 className="text-xl font-bold mb-8 text-slate-900">Funding Activity</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b-2 border-slate-200 bg-slate-50">
                        <th className="text-left py-4 px-6 font-semibold text-slate-700">Deal</th>
                        <th className="text-left py-4 px-6 font-semibold text-slate-700">Amount</th>
                        <th className="text-left py-4 px-6 font-semibold text-slate-700">Time</th>
                        <th className="text-left py-4 px-6 font-semibold text-slate-700">Proof</th>
                      </tr>
                    </thead>
                    <tbody>
                      {deals.slice(0, 5).map((deal, i) => (
                        <tr key={deal.id} className="border-t border-slate-100 hover:bg-slate-50 transition-colors duration-200">
                          <td className="py-4 px-6 text-slate-700 font-medium">{deal.name}</td>
                          <td className="py-4 px-6 text-slate-700 font-semibold">${fmt(deal.raised)}</td>
                          <td className="py-4 px-6 text-slate-600">{new Date(Date.now() - i * 3600000).toLocaleTimeString()}</td>
                          <td className="py-4 px-6">
                            <a href={hashscanTxLink(`FUND_${deal.id}`)} className="text-blue-600 hover:text-blue-700 hover:underline text-sm font-semibold transition-colors duration-200">
                              HashScan ↗
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Watchlist Mini */}
              <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-lg">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-xl font-bold text-slate-900">Watchlist - Top Opportunities</h3>
                  <button className="bg-blue-600 text-white px-6 py-3 rounded-xl text-sm font-semibold hover:bg-blue-700 hover:shadow-lg transition-all duration-200">
                    Fund Now
                  </button>
                </div>
                <div className="space-y-6">
                  {deals.slice(0, 3).map(deal => {
                    const remaining = deal.target - deal.raised;
                    const progress = (deal.raised / deal.target) * 100;
                    return (
                      <div key={deal.id} className="flex justify-between items-center p-6 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-slate-100 hover:shadow-md transition-all duration-200">
                        <div className="flex-1">
                          <div className="font-semibold text-slate-900 text-lg">{deal.name}</div>
                          <div className="text-sm text-slate-600 mt-2 font-medium">{deal.apr}% APR • ${fmt(remaining)} left</div>
                          <div className="mt-4">
                            <Progress value={progress} color="blue" />
                          </div>
                        </div>
                        <div className="ml-8">
                          <button className="bg-green-600 text-white px-6 py-3 rounded-xl text-sm font-semibold hover:bg-green-700 hover:shadow-lg transition-all duration-200">
                            Fund
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {deals.length === 0 && (
                  <div className="text-center py-16 text-slate-500">
                    <div className="text-xl mb-3 font-semibold">Belum ada funding</div>
                    <div className="text-sm">Buka tab Deals untuk mulai berinvestasi</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeSection === 'audit' && (
            <div className="space-y-6">
              <ProofTray
                proofs={proofs}
                onPin={togglePinProof}
                onExport={(format, data) => {
                  console.log(`Exported ${data.length} proofs as ${format}`);
                }}
                onClear={clearProofs}
                pinnedProofs={pinnedProofs}
                searchable={true}
                filterable={true}
                exportable={true}
              />
            </div>
          )}

          {/* Deals Section */}
           {activeSection === 'invest' && activeTab === 'deals' && (
             <div className="space-y-6">
               {/* Search and Filters */}
               <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                 <div className="flex items-center justify-between mb-6">
                   <h3 className="text-lg font-semibold text-slate-900">Investment Deals Gallery</h3>
                   <div className="flex gap-3">
                     <input
                       type="text"
                       placeholder="Search deals..."
                       value={dealSearch}
                       onChange={(e) => setDealSearch(e.target.value)}
                       className="px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                     />
                     <select 
                       value={dealTypeFilter} 
                       onChange={(e) => setDealTypeFilter(e.target.value)}
                       className="px-6 py-3 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm hover:shadow-md"
                     >
                       <option value="all">All Types</option>
                       <option value="Well">Well</option>
                       <option value="Kiosk">Kiosk</option>
                     </select>
                     <select 
                       value={dealSort} 
                       onChange={(e) => setDealSort(e.target.value)}
                       className="px-6 py-3 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm hover:shadow-md"
                     >
                       <option value="apr_desc">APR (High to Low)</option>
                       <option value="target_left">Target Left (Low to High)</option>
                       <option value="newest">Newest First</option>
                     </select>
                   </div>
                 </div>
                 
                 {/* Deal Cards Grid */}
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                   {deals
                     .filter(deal => {
                       const matchesSearch = deal.name.toLowerCase().includes(dealSearch.toLowerCase()) || 
                                           deal.operator.toLowerCase().includes(dealSearch.toLowerCase());
                       const matchesType = dealTypeFilter === 'all' || deal.type === dealTypeFilter;
                       return matchesSearch && matchesType;
                     })
                     .sort((a, b) => {
                       switch(dealSort) {
                         case 'apr_desc': return b.apr - a.apr;
                         case 'target_left': return (a.target - a.raised) - (b.target - b.raised);
                         case 'newest': return b.id.localeCompare(a.id);
                         default: return 0;
                       }
                     })
                     .map(deal => {
                       const remaining = deal.target - deal.raised;
                       const progress = (deal.raised / deal.target) * 100;
                       const peopleServed = Math.floor(deal.forecast / 20);
                       return (
                         <div key={deal.id} className="border border-slate-200 rounded-2xl p-8 hover:shadow-xl transition-all duration-300 bg-white hover:border-slate-300 hover:-translate-y-1">
                           {/* Hero Image Placeholder */}
                           <div className="w-full h-40 bg-gradient-to-r from-blue-400 to-green-400 rounded-2xl mb-6 flex items-center justify-center shadow-lg">
                             <div className="text-white text-center">
                               <div className="text-4xl mb-3">{deal.type === 'Well' ? '🏗️' : '🏪'}</div>
                               <div className="text-sm opacity-90 font-semibold">{deal.type} Project</div>
                             </div>
                           </div>
                           
                           <div className="flex items-center justify-between mb-4">
                             <span className={`text-sm px-4 py-2 rounded-full font-semibold ${
                               deal.type === 'Well' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                             }`}>{deal.type}</span>
                             <span className="text-2xl font-bold text-green-600">{deal.apr}% APR</span>
                           </div>
                           
                           <h4 className="font-bold mb-4 text-slate-900 text-xl">{deal.name}</h4>
                           
                           <div className="space-y-3 text-sm text-slate-600 mb-6">
                             <div className="flex justify-between">
                               <span className="font-medium">Tenor:</span>
                               <span className="font-semibold text-slate-900">{deal.tenor} days</span>
                             </div>
                             <div className="flex justify-between">
                               <span className="font-medium">Tariff:</span>
                               <span className="font-semibold text-slate-900">${deal.tariff} USDC/L</span>
                             </div>
                             <div className="flex justify-between">
                               <span className="font-medium">Forecast:</span>
                               <span className="font-semibold text-slate-900">{fmt(deal.forecast)}L/day</span>
                             </div>
                             <div className="flex justify-between">
                               <span className="font-medium">Operator:</span>
                               <span className="font-semibold text-blue-600">{deal.operator}</span>
                             </div>
                           </div>
                           
                           {/* Progress Bar */}
                           <div className="mb-6">
                             <div className="flex justify-between text-sm mb-3">
                               <span className="text-slate-600 font-medium">Raised / Target</span>
                               <span className="font-semibold text-slate-900">${fmt(deal.raised)} / ${fmt(deal.target)}</span>
                             </div>
                             <div className="w-full bg-slate-200 rounded-full h-3 shadow-inner">
                               <div 
                                 className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-500 shadow-sm" 
                                 style={{width: `${progress}%`}}
                               ></div>
                             </div>
                             <div className="text-xs text-slate-500 mt-3 font-medium">
                               ${fmt(remaining)} remaining • {peopleServed} people/day served
                             </div>
                           </div>
                           
                           {/* Action Buttons */}
                           <div className="flex gap-4">
                             <button 
                               onClick={() => {
                                 pushProof({ type: 'HTS', label: `FUND_${deal.id}`, ref: nowTxRef(), amount: 250 });
                               }}
                               className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-xl text-sm font-semibold hover:bg-blue-700 hover:shadow-lg transition-all duration-200"
                             >
                               Fund $250
                             </button>
                             <button 
                               onClick={() => setShowDealDetail(deal)}
                               className="flex-1 border-2 border-blue-600 text-blue-600 py-3 px-6 rounded-xl text-sm font-semibold hover:bg-blue-50 hover:shadow-lg transition-all duration-200"
                             >
                               View Details
                             </button>
                           </div>
                         </div>
                       );
                     })}
                 </div>
                 
                 {/* Empty State */}
                 {deals.filter(deal => {
                   const matchesSearch = deal.name.toLowerCase().includes(dealSearch.toLowerCase()) || 
                                       deal.operator.toLowerCase().includes(dealSearch.toLowerCase());
                   const matchesType = dealTypeFilter === 'all' || deal.type === dealTypeFilter;
                   return matchesSearch && matchesType;
                 }).length === 0 && (
                   <div className="text-center py-16">
                     <div className="text-slate-400 text-6xl mb-4">🔍</div>
                     <div className="text-lg text-slate-600 mb-2 font-medium">No deals found</div>
                     <div className="text-sm text-slate-500">Try adjusting your search or filters</div>
                   </div>
                 )}
               </div>
               
               {/* Deal Detail Drawer */}
               {showDealDetail && (
                 <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                   <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                     <div className="p-8">
                       <div className="flex justify-between items-center mb-8">
                         <h2 className="text-2xl font-bold text-slate-900">{showDealDetail.name}</h2>
                         <button 
                           onClick={() => setShowDealDetail(null)}
                           className="text-slate-500 hover:text-slate-700 text-3xl font-light transition-colors duration-200"
                         >
                           ×
                         </button>
                       </div>
                       
                       <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                         {/* Left Column - Deal Info */}
                         <div className="space-y-6">
                           <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                             <h3 className="font-semibold mb-4 text-slate-900">Deal Overview</h3>
                             <div className="space-y-3 text-sm">
                               <div className="flex justify-between">
                                 <span className="text-slate-600">Type:</span>
                                 <span className="font-medium text-slate-900">{showDealDetail.type}</span>
                               </div>
                               <div className="flex justify-between">
                                 <span className="text-slate-600">APR:</span>
                                 <span className="font-medium text-green-600">{showDealDetail.apr}%</span>
                               </div>
                               <div className="flex justify-between">
                                 <span className="text-slate-600">Tenor:</span>
                                 <span className="font-medium text-slate-900">{showDealDetail.tenor} days</span>
                               </div>
                               <div className="flex justify-between">
                                 <span className="text-slate-600">Operator:</span>
                                 <span className="font-medium text-slate-900">{showDealDetail.operator}</span>
                               </div>
                               <div className="flex justify-between">
                                 <span className="text-slate-600">Risk Score:</span>
                                 <span className="font-medium text-yellow-600">B+ (Seed)</span>
                               </div>
                             </div>
                           </div>
                           
                           <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                             <h3 className="font-semibold mb-4 text-slate-900">Financial Details</h3>
                             <div className="space-y-3 text-sm">
                               <div className="flex justify-between">
                                 <span className="text-slate-600">Target:</span>
                                 <span className="font-medium text-slate-900">${fmt(showDealDetail.target)}</span>
                               </div>
                               <div className="flex justify-between">
                                 <span className="text-slate-600">Raised:</span>
                                 <span className="font-medium text-slate-900">${fmt(showDealDetail.raised)}</span>
                               </div>
                               <div className="flex justify-between">
                                 <span className="text-slate-600">Remaining:</span>
                                 <span className="font-medium text-slate-900">${fmt(showDealDetail.target - showDealDetail.raised)}</span>
                               </div>
                               <div className="flex justify-between">
                                 <span className="text-slate-600">Platform Fee:</span>
                                 <span className="font-medium text-slate-900">2.5%</span>
                               </div>
                               <div className="flex justify-between">
                                 <span className="text-slate-600">Token/NFT ID:</span>
                                 <span className="font-medium text-blue-600">NFT-{showDealDetail.id}</span>
                               </div>
                             </div>
                           </div>
                         </div>
                         
                         {/* Right Column - Milestones & Proofs */}
                         <div className="space-y-6">
                           <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                             <h3 className="font-semibold mb-4 text-slate-900">Milestone Timeline</h3>
                             <div className="space-y-4">
                               {(showDealDetail.type === 'Well' ? STEPS_WELL : STEPS_KIOSK).map((step, i) => (
                                 <div key={step.key} className="flex items-center gap-4">
                                   <div className={`w-4 h-4 rounded-full ${
                                     i < 2 ? 'bg-green-500' : i === 2 ? 'bg-yellow-500' : 'bg-slate-300'
                                   }`}></div>
                                   <div className="flex-1">
                                     <div className="text-sm font-medium text-slate-900">{step.label}</div>
                                     <div className="text-xs text-slate-500">{(step.pct * 100)}% release</div>
                                   </div>
                                   <div className="text-xs text-slate-500">
                                     {i < 2 ? 'Completed' : i === 2 ? 'In Progress' : 'Pending'}
                                   </div>
                                 </div>
                               ))}
                             </div>
                           </div>
                           
                           <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                             <h3 className="font-semibold mb-4 text-slate-900">Documents (HFS)</h3>
                             <div className="space-y-3">
                               <div className="flex justify-between items-center text-sm">
                                 <span className="text-slate-700">permit.pdf</span>
                                 <a href={ipfs('QmX1...')} className="text-blue-600 hover:text-blue-700 transition-colors duration-200">IPFS ↗</a>
                               </div>
                               <div className="flex justify-between items-center text-sm">
                                 <span className="text-slate-700">drilling_log.pdf</span>
                                 <a href={ipfs('QmY2...')} className="text-blue-600 hover:text-blue-700 transition-colors duration-200">IPFS ↗</a>
                               </div>
                               <div className="flex justify-between items-center text-sm text-slate-500">
                                 <span>water_quality.pdf</span>
                                 <span>Pending</span>
                               </div>
                             </div>
                           </div>
                           
                           {/* Mini ProofTray Scoped */}
                           <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                             <h3 className="font-semibold mb-4 text-slate-900">Recent Proofs</h3>
                             <div className="space-y-3 max-h-40 overflow-y-auto">
                               {proofs.filter(p => p.label.includes(showDealDetail.id)).slice(0, 5).map((proof, i) => (
                                 <div key={i} className="flex justify-between items-center text-sm p-3 bg-white rounded-lg border border-slate-100">
                                   <span className="font-mono text-xs text-slate-700">{proof.label}</span>
                                   <a href={hashscanTxLink(proof.ref)} className="text-blue-600 hover:text-blue-700 transition-colors duration-200 text-xs">
                                     {proof.type} ↗
                                   </a>
                                 </div>
                               ))}
                               {proofs.filter(p => p.label.includes(showDealDetail.id)).length === 0 && (
                                 <div className="text-sm text-slate-500 text-center py-6">
                                   No proofs yet for this deal
                                 </div>
                               )}
                             </div>
                           </div>
                         </div>
                       </div>
                       
                       {/* Action Buttons */}
                       <div className="flex gap-4 mt-8 pt-6 border-t border-slate-200">
                         <button 
                           onClick={() => {
                             pushProof({ type: 'HTS', label: `FUND_${showDealDetail.id}`, ref: nowTxRef(), amount: 500 });
                             setShowDealDetail(null);
                           }}
                           className="bg-green-600 text-white px-8 py-3 rounded-xl hover:bg-green-700 transition-colors duration-200 font-medium shadow-lg hover:shadow-xl"
                         >
                           Fund $500
                         </button>
                         <button 
                           onClick={() => {
                             pushProof({ type: 'HTS', label: `FUND_${showDealDetail.id}`, ref: nowTxRef(), amount: 250 });
                             setShowDealDetail(null);
                           }}
                           className="bg-blue-600 text-white px-8 py-3 rounded-xl hover:bg-blue-700 transition-colors duration-200 font-medium shadow-lg hover:shadow-xl"
                         >
                           Fund $250
                         </button>
                         <button 
                           onClick={() => setShowDealDetail(null)}
                           className="border border-slate-300 text-slate-700 px-8 py-3 rounded-xl hover:bg-slate-50 transition-colors duration-200 font-medium"
                         >
                           Close
                         </button>
                       </div>
                     </div>
                   </div>
                 </div>
               )}
             </div>
           )}

           {/* Portfolio Section */}
           {activeSection === 'invest' && activeTab === 'portfolio' && (
             <div className="space-y-6">
               {/* Portfolio KPIs */}
               <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                 <KpiCard
                   label="Deposited"
                   value={`$${fmt(totalTVL * 0.6)}`}
                   sub="Total invested"
                   change="+8.2%"
                 />
                 <KpiCard
                   label="Yield Accrued"
                   value={`$${payoutInv.toFixed(2)}`}
                   sub="Total earnings"
                   change="+12.1%"
                 />
                 <KpiCard
                   label="Positions"
                   value={deals.length}
                   sub="Active investments"
                   change="+1"
                 />
                 <KpiCard
                   label="Last Settlement"
                   value="2 days ago"
                   sub="Most recent payout"
                   change=""
                 />
               </div>

               {/* Payout Trend & Alerts Row */}
               <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                 {/* Payout Trend Sparkline */}
                 <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                   <h3 className="text-lg font-semibold mb-4 text-slate-900">Payout Trend (30 Days)</h3>
                   <div className="flex items-center justify-between mb-6">
                     <div>
                       <div className="text-2xl font-bold text-green-600">${(payoutInv * 1.2).toFixed(2)}</div>
                       <div className="text-sm text-slate-500">Total payouts this month</div>
                     </div>
                     <div className="text-right">
                       <div className="text-lg font-semibold text-blue-600">+18.5%</div>
                       <div className="text-sm text-slate-500">vs last month</div>
                     </div>
                   </div>
                   <Sparkline 
                     data={[45, 52, 48, 61, 55, 67, 73, 69, 82, 78, 85, 91, 88, 95, 102, 98, 105, 112, 108, 115, 122, 118, 125, 132, 128, 135, 142, 138, 145, 152]} 
                     width={400} 
                     height={60} 
                     color="green" 
                   />
                   <div className="flex justify-between text-xs text-slate-500 mt-3">
                     <span>30 days ago</span>
                     <span>Today</span>
                   </div>
                 </div>

                 {/* Alerts Mini */}
                 <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                   <h3 className="text-lg font-semibold mb-4 text-slate-900">Portfolio Alerts</h3>
                   <div className="space-y-4">
                     <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                       <div className="flex items-center gap-2 mb-2">
                         <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                         <span className="text-sm font-medium text-yellow-800">Funding Alert</span>
                       </div>
                       <div className="text-xs text-yellow-700 mb-2">
                         Deal DL-003 needs $1.2k to reach goal
                       </div>
                       <button className="text-xs text-yellow-600 hover:text-yellow-700 transition-colors duration-200">
                         View Deal →
                       </button>
                     </div>
                     
                     <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                       <div className="flex items-center gap-2 mb-2">
                         <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                         <span className="text-sm font-medium text-green-800">Settlement Ready</span>
                       </div>
                       <div className="text-xs text-green-700 mb-2">
                         DL-001 has 2,400L pending settlement
                       </div>
                       <button className="text-xs text-green-600 hover:text-green-700 transition-colors duration-200">
                         Settle Now →
                       </button>
                     </div>
                     
                     <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                       <div className="flex items-center gap-2 mb-2">
                         <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                         <span className="text-sm font-medium text-blue-800">Milestone Update</span>
                       </div>
                       <div className="text-xs text-blue-700 mb-2">
                         DL-002 completed pump installation
                       </div>
                       <button className="text-xs text-blue-600 hover:text-blue-700 transition-colors duration-200">
                         View Progress →
                       </button>
                     </div>
                   </div>
                 </div>
               </div>

               {/* Positions Table */}
               <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                 <div className="flex items-center justify-between mb-6">
                   <h3 className="text-lg font-semibold text-slate-900">My Positions</h3>
                   <button 
                     onClick={() => {
                       const csvData = deals.map(deal => ({
                         Deal: deal.name,
                         Type: deal.type,
                         'Deposited ($)': (deal.raised * 0.3).toFixed(0),
                         'Est. APY (%)': deal.apr,
                         'Liters Credited': (deal.forecast * 30).toFixed(0),
                         Operator: deal.operator,
                         'Last Proof': '2 hours ago'
                       }));
                       
                       const csvContent = [
                         Object.keys(csvData[0]).join(','),
                         ...csvData.map(row => Object.values(row).join(','))
                       ].join('\n');
                       
                       const blob = new Blob([csvContent], { type: 'text/csv' });
                       const url = window.URL.createObjectURL(blob);
                       const a = document.createElement('a');
                       a.href = url;
                       a.download = 'portfolio.csv';
                       a.click();
                       window.URL.revokeObjectURL(url);
                       
                       pushProof({ type: 'HFS', label: 'EXPORT_PORTFOLIO_CSV', ref: 'bafybeigdyrhk7yxxwellswl001manifest' });
                     }}
                     className="px-4 py-2 bg-slate-100 rounded-xl hover:bg-slate-200 text-sm transition-colors duration-200 font-medium"
                   >
                     Export CSV
                   </button>
                 </div>
                 <DataTable
                   data={deals.map(deal => ({
                     ...deal,
                     deposited: (deal.raised * 0.3).toFixed(0),
                     liters: (deal.forecast * 30).toFixed(0),
                     lastProof: '2 hours ago'
                   }))}
                   columns={[
                     { key: 'name', label: 'Deal' },
                     { key: 'deposited', label: 'Deposited ($)' },
                     { key: 'apr', label: 'Est. APY (%)' },
                     { key: 'liters', label: 'Liters Credited' },
                     { key: 'lastProof', label: 'Last Proof' }
                   ]}
                   searchable={true}
                   sortable={true}
                 />
               </div>
             </div>
           )}

           {/* Build Section */}
           {activeSection === 'build' && activeTab === 'mint' && (
             <div className="space-y-6">
               <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                 <h3 className="text-lg font-semibold mb-6 text-slate-900">Mint Project NFT</h3>
                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                   <div className="lg:col-span-2 space-y-6">
                     {/* Project Type Toggle */}
                     <div>
                       <label className="block text-sm font-medium mb-3 text-slate-700">Project Type</label>
                       <div className="flex gap-3">
                         <button
                           onClick={() => setMintForm((p) => ({ ...p, type: 'well' }))}
                           className={`px-6 py-3 rounded-xl transition-colors duration-200 font-medium shadow-lg ${mintForm.type === 'well' ? 'bg-blue-500 text-white hover:bg-blue-600' : 'border border-slate-300 text-slate-700 hover:bg-slate-50'}`}
                         >
                           Well
                         </button>
                         <button
                           onClick={() => setMintForm((p) => ({ ...p, type: 'kiosk' }))}
                           className={`px-6 py-3 rounded-xl transition-colors duration-200 font-medium ${mintForm.type === 'kiosk' ? 'bg-blue-500 text-white hover:bg-blue-600' : 'border border-slate-300 text-slate-700 hover:bg-slate-50'}`}
                         >
                           Kiosk
                         </button>
                       </div>
                     </div>

                     {/* Basic Info */}
                     <div className="grid grid-cols-2 gap-4">
                       <div>
                         <label className="block text-sm font-medium mb-2 text-slate-700">Well ID</label>
                         <input 
                           type="text" 
                           className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200" 
                           placeholder="WL-001" 
                           value={mintForm.wellId}
                           onChange={(e) => setMintForm((p) => ({ ...p, wellId: e.target.value }))}
                         />
                       </div>
                       <div>
                         <label className="block text-sm font-medium mb-2 text-slate-700">Operator</label>
                         <input 
                           type="text" 
                           className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200" 
                           placeholder="AquaTech Ltd" 
                           value={mintForm.operator}
                           onChange={(e) => setMintForm((p) => ({ ...p, operator: e.target.value }))}
                         />
                       </div>
                     </div>

                     {/* Financial Info */}
                     <div className="grid grid-cols-2 gap-4">
                       <div>
                         <label className="block text-sm font-medium mb-2 text-slate-700">Capex Target ($)</label>
                         <input 
                           type="number" 
                           className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200" 
                           placeholder="50000" 
                           value={mintForm.capexTarget}
                           onChange={(e) => setMintForm((p) => ({ ...p, capexTarget: Number(e.target.value) }))}
                         />
                       </div>
                       <div>
                         <label className="block text-sm font-medium mb-2 text-slate-700">Forecast (L/day)</label>
                         <input 
                           type="number" 
                           className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200" 
                           placeholder="2000" 
                           value={mintForm.forecastLitersDay}
                           onChange={(e) => setMintForm((p) => ({ ...p, forecastLitersDay: Number(e.target.value) }))}
                         />
                       </div>
                     </div>

                     <div>
                       <label className="block text-sm font-medium mb-2 text-slate-700">Tariff (USDC/L)</label>
                       <input 
                         type="number" 
                         step="0.001" 
                         className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200" 
                         placeholder="0.05" 
                         value={mintForm.tariff}
                         onChange={(e) => setMintForm((p) => ({ ...p, tariff: Number(e.target.value) }))}
                       />
                     </div>

                     {/* Revenue Split */}
                     <div>
                       <label className="block text-sm font-medium mb-3 text-slate-700">Revenue Split (%)</label>
                       <div className="grid grid-cols-3 gap-4">
                         <div>
                           <label className="text-xs text-slate-600 mb-2 block font-medium">Investor</label>
                           <input 
                             type="number" 
                             className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200" 
                             value={mintForm.split.inv}
                             min="0" 
                             max="100"
                             onChange={(e) => setMintForm((p) => ({ ...p, split: { ...p.split, inv: Number(e.target.value) } }))}
                           />
                         </div>
                         <div>
                           <label className="text-xs text-slate-600 mb-2 block font-medium">Operator</label>
                           <input 
                             type="number" 
                             className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200" 
                             value={mintForm.split.op}
                             min="0" 
                             max="100"
                             onChange={(e) => setMintForm((p) => ({ ...p, split: { ...p.split, op: Number(e.target.value) } }))}
                           />
                         </div>
                         <div>
                           <label className="text-xs text-slate-600 mb-2 block font-medium">Platform</label>
                           <input 
                             type="number" 
                             className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200" 
                             value={mintForm.split.plat}
                             min="0" 
                             max="100"
                             onChange={(e) => setMintForm((p) => ({ ...p, split: { ...p.split, plat: Number(e.target.value) } }))}
                           />
                         </div>
                       </div>
                       <div className="text-xs text-slate-500 mt-2">Total must equal 100%</div>
                     </div>

                     {/* Action Buttons */}
                     <div className="flex gap-3 pt-6">
                       <button
                         onClick={() => {
                           const split100 = mintForm.split.inv + mintForm.split.op + mintForm.split.plat;
                           if (split100 !== 100) {
                             alert('Split must total 100%');
                             return;
                           }
                           const meta = {
                             type: mintForm.type,
                             wellId: mintForm.wellId,
                             operator: mintForm.operator,
                             capexTarget: Number(mintForm.capexTarget),
                             forecastLitersDay: Number(mintForm.forecastLitersDay),
                             tariff: Number(mintForm.tariff),
                             split: { inv: mintForm.split.inv / 100, op: mintForm.split.op / 100, plat: mintForm.split.plat / 100 },
                           };
                           mintNFT(meta);
                         }}
                         className="px-8 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors duration-200 font-medium shadow-lg">
                         🪙 Mint NFT
                       </button>
                       <button
                         onClick={() => setMintForm({ type: 'well', wellId: 'WL-007', operator: 'HydroTech Solutions', capexTarget: 15000, forecastLitersDay: 1800, tariff: 0.045, split: { inv: 70, op: 25, plat: 5 } })}
                         className="px-6 py-3 border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors duration-200 font-medium text-slate-700">
                         Use Demo Data
                       </button>
                       <button
                         onClick={() => setMintForm({ type: 'well', wellId: '', operator: '', capexTarget: 0, forecastLitersDay: 0, tariff: 0, split: { inv: 0, op: 0, plat: 0 } })}
                         className="px-6 py-3 border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors duration-200 font-medium text-slate-700">
                         Clear Form
                       </button>
                     </div>
                   </div>

                   {/* Status Panel */}
                   <div className="space-y-6">
                     {/* Status Machine */}
                     <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                       <h4 className="font-semibold mb-4 text-slate-900">Status Machine</h4>
                       <div className="space-y-3">
                         {STATUS_ORDER.map((status, idx) => {
                           const isActive = idx === 0; // DRAFT is active
                           const isCompleted = false;
                           return (
                             <div key={status} className={`flex items-center gap-3 text-sm ${
                               isActive ? 'text-blue-600 font-medium' : 
                               isCompleted ? 'text-green-600' : 'text-slate-500'
                             }`}>
                               <div className={`w-3 h-3 rounded-full ${
                                 isActive ? 'bg-blue-500 shadow-lg' : 
                                 isCompleted ? 'bg-green-500 shadow-lg' : 'bg-slate-300'
                               }`} />
                               <span>{status.replace('_', ' ')}</span>
                             </div>
                           );
                         })}
                       </div>
                     </div>

                     {/* TVL Coverage Badge */}
                     <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                       <h4 className="font-semibold mb-4 text-slate-900">Coverage Analysis</h4>
                       <div className="space-y-4">
                         <div className="flex justify-between items-center">
                           <span className="text-sm text-slate-600 font-medium">TVL Coverage:</span>
                           <span className="text-lg font-bold text-green-600">1.35x</span>
                         </div>
                         <div className="w-full bg-slate-200 rounded-full h-3">
                           <div className="bg-green-500 h-3 rounded-full shadow-sm" style={{width: '100%'}}></div>
                         </div>
                         <div className="text-xs text-slate-500">
                           Escrow: $15,000 / Required: $11,100
                         </div>
                         <div className="text-xs text-green-600 font-medium bg-green-50 px-3 py-2 rounded-lg">
                           ✓ Sufficient coverage for operations
                         </div>
                       </div>
                     </div>

                     {/* Project Preview */}
                     <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                       <h4 className="font-semibold mb-4 text-slate-900">Project Preview</h4>
                       <div className="space-y-3 text-sm">
                         <div className="flex justify-between items-center">
                           <span className="text-slate-600 font-medium">Est. APY:</span>
                           <span className="font-semibold text-slate-900">11.2%</span>
                         </div>
                         <div className="flex justify-between items-center">
                           <span className="text-slate-600 font-medium">Daily Revenue:</span>
                           <span className="font-semibold text-slate-900">$81</span>
                         </div>
                         <div className="flex justify-between items-center">
                           <span className="text-slate-600 font-medium">People Served:</span>
                           <span className="font-semibold text-slate-900">90/day</span>
                         </div>
                         <div className="flex justify-between items-center">
                           <span className="text-slate-600 font-medium">ROI Period:</span>
                           <span className="font-semibold text-slate-900">185 days</span>
                         </div>
                       </div>
                     </div>

                     {/* Tips */}
                     <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                       <div className="text-xs text-blue-700 leading-relaxed">
                         💡 <strong>Tip:</strong> Higher tariffs increase APY but may reduce demand. Optimal range: $0.03-0.06/L
                       </div>
                     </div>
                   </div>
                 </div>
               </div>
             </div>
           )}

           {activeSection === 'build' && activeTab === 'documents' && (
             <div className="space-y-6">
               <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                 <h3 className="text-lg font-semibold mb-5 text-slate-800">Documents (HFS)</h3>
                 
                 {/* Upload Tiles */}
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
                   {[
                     { name: 'permit.pdf', icon: '📋', required: true, uploaded: true },
                     { name: 'drilling_log.pdf', icon: '🔧', required: true, uploaded: false },
                     { name: 'pump_invoice.pdf', icon: '💰', required: true, uploaded: true },
                     { name: 'water_quality.pdf', icon: '🧪', required: false, uploaded: false }
                   ].map(doc => (
                     <div key={doc.name} className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all duration-200 hover:shadow-md ${
                       doc.uploaded 
                         ? 'border-green-300 bg-green-50 hover:border-green-500 hover:bg-green-100' 
                         : doc.required 
                           ? 'border-red-300 bg-red-50 hover:border-red-500 hover:bg-red-100'
                           : 'border-slate-300 bg-slate-50 hover:border-blue-400 hover:bg-blue-50'
                     }`}>
                       <div className="text-2xl mb-3">{doc.uploaded ? '✅' : doc.icon}</div>
                       <div className="text-sm font-medium mb-1">{doc.name}</div>
                       <div className="text-xs">
                         {doc.uploaded ? (
                           <span className="text-green-600 font-medium">✓ Uploaded</span>
                         ) : (
                           <span className={`font-medium ${doc.required ? 'text-red-600' : 'text-slate-500'}`}>
                             {doc.required ? 'Required' : 'Optional'}
                           </span>
                         )}
                       </div>
                       <div className="text-xs text-slate-400 mt-2">Drag & drop or click</div>
                     </div>
                   ))}
                 </div>

                 {/* Action Buttons */}
                 <div className="flex flex-wrap gap-3 mb-6">
                   <button className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 font-medium shadow-sm hover:shadow">
                     📦 Bulk Import Demo
                   </button>
                   <button className="px-4 py-2.5 border border-slate-200 rounded-lg hover:bg-slate-50 transition-all duration-200 text-slate-700 hover:text-slate-900 hover:border-slate-300 shadow-sm">
                     🔄 Refresh Status
                   </button>
                   <button className="px-4 py-2.5 border border-slate-200 rounded-lg hover:bg-slate-50 transition-all duration-200 text-slate-700 hover:text-slate-900 hover:border-slate-300 shadow-sm">
                     📋 Checklist
                   </button>
                 </div>

                 {/* Documents Tray */}
                 <div className="border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                   <div className="bg-slate-50 px-5 py-3.5 border-b border-slate-200 flex justify-between items-center">
                     <h4 className="font-medium text-slate-800">Documents Tray (HFS)</h4>
                     <div className="text-sm text-slate-600 font-medium">2 of 3 required uploaded</div>
                   </div>
                   <div className="overflow-x-auto">
                     <table className="w-full">
                       <thead className="bg-slate-50 border-b border-slate-200">
                         <tr>
                           <th className="text-left p-3.5 text-sm font-semibold text-slate-700">Type</th>
                           <th className="text-left p-3.5 text-sm font-semibold text-slate-700">CID</th>
                           <th className="text-left p-3.5 text-sm font-semibold text-slate-700">SHA-256</th>
                           <th className="text-left p-3.5 text-sm font-semibold text-slate-700">Size</th>
                           <th className="text-left p-3.5 text-sm font-semibold text-slate-700">Timestamp</th>
                           <th className="text-left p-3.5 text-sm font-semibold text-slate-700">Validity</th>
                           <th className="text-left p-3.5 text-sm font-semibold text-slate-700">Actions</th>
                         </tr>
                       </thead>
                       <tbody>
                         <tr className="border-b border-slate-200 hover:bg-slate-50 transition-colors duration-150">
                           <td className="p-3.5">
                             <div className="flex items-center gap-2">
                               <span className="text-lg">📋</span>
                               <span className="text-sm font-medium text-slate-800">permit.pdf</span>
                             </div>
                           </td>
                           <td className="p-3.5">
                             <div className="flex items-center gap-2">
                               <code className="text-xs bg-slate-100 px-2 py-1 rounded-md font-mono">QmX7Y8Z9...</code>
                               <button className="text-blue-600 hover:text-blue-800 text-xs hover:bg-blue-50 p-1 rounded transition-colors duration-150">📋</button>
                             </div>
                           </td>
                           <td className="p-3.5">
                             <div className="flex items-center gap-2">
                               <code className="text-xs bg-slate-100 px-2 py-1 rounded-md font-mono">a1b2c3d4...</code>
                               <button className="text-blue-600 hover:text-blue-800 text-xs hover:bg-blue-50 p-1 rounded transition-colors duration-150">📋</button>
                             </div>
                           </td>
                           <td className="p-3.5 text-sm text-slate-700">2.4 MB</td>
                           <td className="p-3.5 text-sm text-slate-700">2024-01-15 14:30</td>
                           <td className="p-3.5">
                             <span className="bg-green-100 text-green-700 px-2.5 py-1 rounded-full text-xs font-medium">
                               ✓ Passed
                             </span>
                           </td>
                           <td className="p-3.5">
                             <div className="flex gap-2">
                               <button className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-1.5 rounded transition-colors duration-150">🔗</button>
                               <button className="text-slate-600 hover:text-slate-800 hover:bg-slate-100 p-1.5 rounded transition-colors duration-150">📥</button>
                             </div>
                           </td>
                         </tr>
                         <tr className="border-b border-slate-200 hover:bg-slate-50 transition-colors duration-150">
                           <td className="p-3.5">
                             <div className="flex items-center gap-2">
                               <span className="text-lg">💰</span>
                               <span className="text-sm font-medium text-slate-800">pump_invoice.pdf</span>
                             </div>
                           </td>
                           <td className="p-3.5">
                             <div className="flex items-center gap-2">
                               <code className="text-xs bg-slate-100 px-2 py-1 rounded-md font-mono">QmA1B2C3...</code>
                               <button className="text-blue-600 hover:text-blue-800 text-xs hover:bg-blue-50 p-1 rounded transition-colors duration-150">📋</button>
                             </div>
                           </td>
                           <td className="p-3.5">
                             <div className="flex items-center gap-2">
                               <code className="text-xs bg-slate-100 px-2 py-1 rounded-md font-mono">e5f6g7h8...</code>
                               <button className="text-blue-600 hover:text-blue-800 text-xs hover:bg-blue-50 p-1 rounded transition-colors duration-150">📋</button>
                             </div>
                           </td>
                           <td className="p-3.5 text-sm text-slate-700">1.8 MB</td>
                           <td className="p-3.5 text-sm text-slate-700">2024-01-14 09:15</td>
                           <td className="p-3.5">
                             <span className="bg-yellow-100 text-yellow-700 px-2.5 py-1 rounded-full text-xs font-medium">
                               ⏳ Pending
                             </span>
                           </td>
                           <td className="p-3.5">
                             <div className="flex gap-2">
                               <button className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-1.5 rounded transition-colors duration-150">🔗</button>
                               <button className="text-slate-600 hover:text-slate-800 hover:bg-slate-100 p-1.5 rounded transition-colors duration-150">📥</button>
                             </div>
                           </td>
                         </tr>
                         <tr className="border-b border-slate-200 hover:bg-slate-50 transition-colors duration-150 bg-red-50">
                           <td className="p-3.5">
                             <div className="flex items-center gap-2">
                               <span className="text-lg">🔧</span>
                               <span className="text-sm font-medium text-red-600">drilling_log.pdf</span>
                               <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-md font-medium">REQUIRED</span>
                             </div>
                           </td>
                           <td className="p-3.5 text-sm text-slate-400">Not uploaded</td>
                           <td className="p-3.5 text-sm text-slate-400">-</td>
                           <td className="p-3.5 text-sm text-slate-400">-</td>
                           <td className="p-3.5 text-sm text-slate-400">-</td>
                           <td className="p-3.5">
                             <span className="bg-red-100 text-red-700 px-2.5 py-1 rounded-full text-xs font-medium">
                               ❌ Missing
                             </span>
                           </td>
                           <td className="p-3.5">
                             <button className="text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-md text-sm font-medium transition-colors duration-150">Upload</button>
                           </td>
                         </tr>
                       </tbody>
                     </table>
                   </div>
                 </div>

                 {/* Compliance Summary */}
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-6">
                   <div className="bg-green-50 border border-green-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow duration-200">
                     <div className="flex items-center gap-2 mb-3">
                       <span className="text-green-600 text-lg">✅</span>
                       <span className="font-semibold text-green-800">Compliant</span>
                     </div>
                     <div className="text-2xl font-bold text-green-600 mb-1">67%</div>
                     <div className="text-sm text-green-600 font-medium">2 of 3 required docs</div>
                   </div>
                   <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow duration-200">
                     <div className="flex items-center gap-2 mb-3">
                       <span className="text-yellow-600 text-lg">⏳</span>
                       <span className="font-semibold text-yellow-800">Pending Review</span>
                     </div>
                     <div className="text-2xl font-bold text-yellow-600 mb-1">1</div>
                     <div className="text-sm text-yellow-600 font-medium">Document under review</div>
                   </div>
                   <div className="bg-red-50 border border-red-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow duration-200">
                     <div className="flex items-center gap-2 mb-3">
                       <span className="text-red-600 text-lg">❌</span>
                       <span className="font-semibold text-red-800">Missing</span>
                     </div>
                     <div className="text-2xl font-bold text-red-600 mb-1">1</div>
                     <div className="text-sm text-red-600 font-medium">Required document missing</div>
                   </div>
                 </div>

                 {/* Checklist */}
                 <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mt-5 shadow-sm hover:shadow-md transition-shadow duration-200">
                   <h5 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">📋 Document Checklist</h5>
                   <div className="text-sm text-blue-700 space-y-2 font-medium">
                     <div className="flex items-center gap-2">✅ <span>Environmental permit (required)</span></div>
                     <div className="flex items-center gap-2">❌ <span>Drilling completion log (required)</span></div>
                     <div className="flex items-center gap-2">⏳ <span>Equipment purchase invoice (required)</span></div>
                     <div className="flex items-center gap-2">⚪ <span>Water quality test report (optional)</span></div>
                   </div>
                 </div>
               </div>
             </div>
           )}

           {activeSection === 'build' && activeTab === 'milestones' && (
             <div className="space-y-6">
               {/* Project Overview */}
               <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                 <div className="flex flex-wrap justify-between items-center mb-5">
                   <h3 className="text-lg font-semibold text-slate-800">Project: Ngong Hills Well (WELL-NE-001)</h3>
                   <div className="flex gap-2">
                     <span className="bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full text-xs font-medium">BUILD PHASE</span>
                     <span className="bg-green-100 text-green-700 px-2.5 py-1 rounded-full text-xs font-medium">AUTO-GUARD: ON</span>
                   </div>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                   <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-200">
                     <div className="text-sm text-slate-600 font-medium mb-1">Total Capex</div>
                     <div className="text-lg font-bold text-slate-800">$12,000</div>
                   </div>
                   <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-200">
                     <div className="text-sm text-slate-600 font-medium mb-1">Escrow Balance</div>
                     <div className="text-lg font-bold text-slate-800">$11,250</div>
                   </div>
                   <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-200">
                     <div className="text-sm text-slate-600 font-medium mb-1">Released</div>
                     <div className="text-lg font-bold text-slate-800">$750</div>
                   </div>
                   <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-200">
                     <div className="text-sm text-slate-600 font-medium mb-1">Progress</div>
                     <div className="text-lg font-bold text-slate-800">25%</div>
                   </div>
                 </div>
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 {/* Milestones Progress */}
                 <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                   <div className="flex justify-between items-center mb-5">
                     <h3 className="text-lg font-semibold text-slate-800">Milestones Progress</h3>
                     <button className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-150">🔄 Refresh IoT</button>
                   </div>
                   <div className="space-y-5">
                     {[
                       { 
                         step: 'Permit & Site Ready', 
                         pct: 25, 
                         status: 'completed', 
                         amount: 3000,
                         iot: 'GPS confirmed',
                         date: '2024-01-10'
                       },
                       { 
                         step: 'Drilling Done (IoT)', 
                         pct: 35, 
                         status: 'pending', 
                         amount: 4200,
                         iot: 'Depth sensor pending',
                         date: null
                       },
                       { 
                         step: 'Pump Installed (IoT)', 
                         pct: 25, 
                         status: 'locked', 
                         amount: 3000,
                         iot: 'Flow sensor required',
                         date: null
                       },
                       { 
                         step: 'Meter+Valve Ready (IoT)', 
                         pct: 15, 
                         status: 'locked', 
                         amount: 1800,
                         iot: 'Valve controller required',
                         date: null
                       }
                     ].map((milestone, i) => (
                       <div key={i} className={`p-5 border rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 ${
                         milestone.status === 'completed' ? 'bg-green-50 border-green-200' :
                         milestone.status === 'pending' ? 'bg-yellow-50 border-yellow-200' :
                         'bg-slate-50 border-slate-200'
                       }`}>
                         <div className="flex items-center justify-between mb-3">
                           <div className="flex items-center gap-3">
                             <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium shadow-sm ${
                               milestone.status === 'completed' ? 'bg-green-500 text-white' :
                               milestone.status === 'pending' ? 'bg-yellow-500 text-white' :
                               'bg-slate-300 text-slate-600'
                             }`}>
                               {milestone.status === 'completed' ? '✓' : i + 1}
                             </div>
                             <div>
                               <div className="font-medium text-slate-800">{milestone.step}</div>
                               <div className="text-sm text-slate-600 font-medium">{milestone.pct}% • ${milestone.amount.toLocaleString()}</div>
                             </div>
                           </div>
                           <div className="text-right">
                             {milestone.status === 'completed' && (
                               <div className="text-xs text-green-600 font-medium mb-1">✅ {milestone.date}</div>
                             )}
                             <button 
                               className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-150 shadow-sm ${
                                 milestone.status === 'pending' 
                                   ? 'bg-blue-600 text-white hover:bg-blue-700' 
                                   : milestone.status === 'completed'
                                     ? 'bg-green-100 text-green-700 cursor-default'
                                     : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                               }`}
                               disabled={milestone.status === 'locked' || milestone.status === 'completed'}
                             >
                               {milestone.status === 'completed' ? 'Released' :
                                milestone.status === 'pending' ? 'Trigger' : 'Locked'}
                             </button>
                           </div>
                         </div>
                         <div className="text-xs text-slate-600 font-medium flex items-center gap-2 mt-3">
                           <span className="text-blue-600 inline-flex items-center justify-center w-5 h-5 bg-blue-50 rounded-full">🔗</span>
                           <span>IoT: {milestone.iot}</span>
                         </div>
                       </div>
                     ))}
                   </div>
                 </div>
                 
                 {/* Escrow & Disbursement */}
                 <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                   <h3 className="text-lg font-semibold text-slate-800 mb-5">Escrow & Disbursement</h3>
                   <div className="space-y-5">
                     {/* Balance Cards */}
                     <div className="grid grid-cols-2 gap-5">
                       <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200">
                         <div className="text-sm text-blue-600 font-medium mb-1">Escrow Balance</div>
                         <div className="text-lg font-bold text-blue-700">$11,250</div>
                         <div className="text-xs text-blue-500 font-medium mt-1">93.75% remaining</div>
                       </div>
                       <div className="bg-green-50 border border-green-200 p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200">
                         <div className="text-sm text-green-600 font-medium mb-1">Total Released</div>
                         <div className="text-lg font-bold text-green-700">$750</div>
                         <div className="text-xs text-green-500 font-medium mt-1">6.25% of total</div>
                       </div>
                     </div>

                     {/* Auto-Guard Settings */}
                     <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200">
                       <div className="flex justify-between items-center mb-3">
                         <span className="text-sm font-medium text-slate-800">Auto-Guard System</span>
                         <span className="bg-green-100 text-green-700 px-2.5 py-1 rounded-full text-xs font-medium">ACTIVE</span>
                       </div>
                       <div className="text-xs text-slate-600 font-medium space-y-2">
                         <div>✅ IoT verification required for releases</div>
                         <div>✅ Multi-signature approval enabled</div>
                         <div>✅ Time-lock protection: 24h delay</div>
                       </div>
                     </div>

                     {/* Release History */}
                     <div className="border border-slate-200 rounded-xl shadow-sm">
                       <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 text-sm font-medium flex justify-between items-center rounded-t-xl">
                         <span className="text-slate-800">Release History</span>
                         <button className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors duration-150">📊 Export</button>
                       </div>
                       <div className="max-h-48 overflow-y-auto">
                         <table className="w-full text-sm">
                           <thead className="bg-slate-50 border-b border-slate-200">
                             <tr>
                               <th className="text-left p-3 text-xs font-medium text-slate-700">Milestone</th>
                               <th className="text-left p-3 text-xs font-medium text-slate-700">Amount</th>
                               <th className="text-left p-3 text-xs font-medium text-slate-700">Date</th>
                               <th className="text-left p-3 text-xs font-medium text-slate-700">Tx</th>
                             </tr>
                           </thead>
                           <tbody>
                             <tr className="border-b border-slate-200 hover:bg-slate-50 transition-colors duration-150">
                               <td className="p-3 text-slate-800">Permit & Site Ready</td>
                               <td className="p-3 font-medium text-slate-800">$3,000</td>
                               <td className="p-3 text-slate-600">2024-01-10</td>
                               <td className="p-3">
                                 <button className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-1 rounded-lg text-xs transition-colors duration-150">🔗</button>
                               </td>
                             </tr>
                             <tr className="text-slate-400 border-b border-slate-200 hover:bg-slate-50 transition-colors duration-150">
                               <td className="p-3">Drilling Done</td>
                               <td className="p-3">$4,200</td>
                               <td className="p-3">Pending</td>
                               <td className="p-3">-</td>
                             </tr>
                             <tr className="text-slate-400 border-b border-slate-200 hover:bg-slate-50 transition-colors duration-150">
                               <td className="p-3">Pump Installed</td>
                               <td className="p-3">$3,000</td>
                               <td className="p-3">Pending</td>
                               <td className="p-3">-</td>
                             </tr>
                             <tr className="text-slate-400 hover:bg-slate-50 transition-colors duration-150">
                               <td className="p-3">Meter+Valve Ready</td>
                               <td className="p-3">$1,800</td>
                               <td className="p-3">Pending</td>
                               <td className="p-3">-</td>
                             </tr>
                           </tbody>
                         </table>
                       </div>
                     </div>
                   </div>
                 </div>
               </div>

               {/* IoT Monitoring Panel */}
               <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                 <div className="flex justify-between items-center mb-5">
                   <h3 className="text-lg font-semibold text-slate-800">IoT Monitoring Panel</h3>
                   <div className="flex gap-2">
                     <span className="bg-green-100 text-green-700 px-2.5 py-1 rounded-full text-xs font-medium">🟢 ONLINE</span>
                     <button className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-3 py-1 rounded-lg text-sm font-medium transition-colors duration-150">⚙️ Settings</button>
                   </div>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                   {/* GPS Tracker */}
                   <div className="bg-slate-50 border border-slate-200 p-5 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200">
                     <div className="flex items-center gap-2 mb-4">
                       <span className="text-lg inline-flex items-center justify-center w-8 h-8 bg-blue-50 rounded-full text-blue-600">📍</span>
                       <span className="font-medium text-slate-800">GPS Tracker</span>
                       <span className="bg-green-100 text-green-700 px-2.5 py-1 rounded-full text-xs font-medium">ACTIVE</span>
                     </div>
                     <div className="space-y-3 text-sm">
                       <div className="flex justify-between">
                         <span className="text-slate-600 font-medium">Location:</span>
                         <span className="font-mono text-slate-800">-1.2921, 36.8219</span>
                       </div>
                       <div className="flex justify-between">
                         <span className="text-slate-600 font-medium">Last Update:</span>
                         <span className="text-slate-800">2 min ago</span>
                       </div>
                       <div className="flex justify-between">
                         <span className="text-slate-600 font-medium">Accuracy:</span>
                         <span className="text-green-600 font-medium">±2.1m</span>
                       </div>
                     </div>
                   </div>

                   {/* Depth Sensor */}
                   <div className="bg-slate-50 border border-slate-200 p-5 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200">
                     <div className="flex items-center gap-2 mb-4">
                       <span className="text-lg inline-flex items-center justify-center w-8 h-8 bg-yellow-50 rounded-full text-yellow-600">📏</span>
                       <span className="font-medium text-slate-800">Depth Sensor</span>
                       <span className="bg-yellow-100 text-yellow-700 px-2.5 py-1 rounded-full text-xs font-medium">PENDING</span>
                     </div>
                     <div className="space-y-3 text-sm">
                       <div className="flex justify-between">
                         <span className="text-slate-600 font-medium">Target Depth:</span>
                         <span className="text-slate-800">45m</span>
                       </div>
                       <div className="flex justify-between">
                         <span className="text-slate-600 font-medium">Current:</span>
                         <span className="text-yellow-600 font-medium">Installing...</span>
                       </div>
                       <div className="flex justify-between">
                         <span className="text-slate-600 font-medium">Status:</span>
                         <span className="text-yellow-600 font-medium">Awaiting signal</span>
                       </div>
                     </div>
                   </div>

                   {/* Flow Meter */}
                   <div className="bg-slate-50 border border-slate-200 p-5 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200">
                     <div className="flex items-center gap-2 mb-4">
                       <span className="text-lg inline-flex items-center justify-center w-8 h-8 bg-slate-100 rounded-full text-slate-500">💧</span>
                       <span className="font-medium text-slate-800">Flow Meter</span>
                       <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full text-xs font-medium">NOT INSTALLED</span>
                     </div>
                     <div className="space-y-3 text-sm text-slate-400">
                       <div className="flex justify-between">
                         <span>Flow Rate:</span>
                         <span>-</span>
                       </div>
                       <div className="flex justify-between">
                         <span>Total Volume:</span>
                         <span>-</span>
                       </div>
                       <div className="flex justify-between">
                         <span>Status:</span>
                         <span>Awaiting pump installation</span>
                       </div>
                     </div>
                   </div>
                 </div>

                 {/* IoT Timeline */}
                 <div className="mt-6 pt-5 border-t border-slate-200">
                   <h4 className="font-medium text-slate-800 mb-4">IoT Installation Timeline</h4>
                   <div className="space-y-3 text-sm">
                     <div className="flex items-center gap-3">
                       <span className="w-3 h-3 bg-green-500 rounded-full shadow-sm"></span>
                       <span className="text-slate-600 font-medium">2024-01-10 14:30</span>
                       <span className="text-slate-800">GPS tracker installed and verified</span>
                     </div>
                     <div className="flex items-center gap-3">
                       <span className="w-3 h-3 bg-yellow-500 rounded-full shadow-sm"></span>
                       <span className="text-slate-600 font-medium">2024-01-15 (Est.)</span>
                       <span className="text-yellow-600 font-medium">Depth sensor installation in progress</span>
                     </div>
                     <div className="flex items-center gap-3">
                       <span className="w-3 h-3 bg-slate-300 rounded-full shadow-sm"></span>
                       <span className="text-slate-400 font-medium">TBD</span>
                       <span className="text-slate-400 font-medium">Flow meter installation pending</span>
                     </div>
                     <div className="flex items-center gap-3">
                       <span className="w-3 h-3 bg-slate-300 rounded-full shadow-sm"></span>
                       <span className="text-slate-400 font-medium">TBD</span>
                       <span className="text-slate-400 font-medium">Valve controller installation pending</span>
                     </div>
                   </div>
                 </div>
               </div>
             </div>
           )}

           {/* Operate Section */}
           {activeSection === 'operate' && activeTab === 'tariff' && (
             <div className="space-y-6">
               {/* Tariff Control Panel */}
               <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
                 <div className="flex items-center justify-between mb-8">
                   <h3 className="text-xl font-bold text-slate-900">Tariff & Valve Control</h3>
                   <div className="flex items-center gap-3">
                     <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-sm"></div>
                     <span className="text-sm text-green-700 font-semibold tracking-wide">LIVE</span>
                   </div>
                 </div>
                 
                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                   {/* Tariff Setting */}
                   <div className="space-y-6">
                     <div>
                       <label className="block text-sm font-semibold text-slate-700 mb-3">Current Tariff</label>
                       <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-5 rounded-xl border border-slate-200 shadow-sm">
                         <div className="text-3xl font-bold text-blue-600">$0.05</div>
                         <div className="text-sm text-slate-600 font-medium">per Liter</div>
                       </div>
                     </div>
                     
                     <div>
                       <label className="block text-sm font-semibold text-slate-700 mb-3">Set New Tariff (USDC/L)</label>
                       <div className="flex gap-3">
                         <input 
                           type="number" 
                           step="0.001" 
                           className="flex-1 px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 font-medium" 
                           value={newTariff}
                           onChange={(e) => setNewTariff(Number(e.target.value))}
                           placeholder="0.000"
                         />
                         <button 
                           onClick={() => setTariff(newTariff)}
                           className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 font-semibold shadow-sm hover:shadow-md">
                           Update
                         </button>
                       </div>
                       <div className="text-xs text-slate-600 mt-2 font-medium">
                         Min: $0.001 | Max: $1.000 | Suggested: $0.045-$0.055
                       </div>
                     </div>
                     
                     <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 shadow-sm">
                       <div className="text-sm font-bold text-amber-800 mb-2">⚠️ Impact Preview</div>
                       <div className="text-sm text-amber-700 font-medium">
                         New tariff will affect coverage ratio and valve status
                       </div>
                     </div>
                   </div>
                   
                   {/* Coverage Meter */}
                   <div className="space-y-6">
                     <div className="text-sm font-semibold text-slate-700">Coverage Ratio</div>
                     <div className="relative">
                       <div className="w-36 h-36 mx-auto">
                         <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                           <circle
                             cx="50"
                             cy="50"
                             r="40"
                             stroke="#e2e8f0"
                             strokeWidth="8"
                             fill="none"
                           />
                           <circle
                             cx="50"
                             cy="50"
                             r="40"
                             stroke="#10b981"
                             strokeWidth="8"
                             fill="none"
                             strokeDasharray={`${2.51 * 120} ${2.51 * (100 - 120)}`}
                             className="transition-all duration-500 drop-shadow-sm"
                           />
                         </svg>
                         <div className="absolute inset-0 flex items-center justify-center">
                           <div className="text-center">
                             <div className="text-2xl font-bold text-green-600">1.2x</div>
                             <div className="text-xs text-slate-600 font-medium">Coverage</div>
                           </div>
                         </div>
                       </div>
                     </div>
                     
                     <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-4 rounded-xl border border-slate-200 text-sm shadow-sm">
                       <div className="font-bold mb-3 text-slate-700">Formula:</div>
                       <div className="text-slate-600 font-medium">
                         Escrow ($45,000) ÷ (Tariff × Forecast × 30 days)
                       </div>
                       <div className="text-slate-600 mt-2 font-medium">
                         = $45,000 ÷ ($0.05 × 2,000 × 30) = 1.2x
                       </div>
                     </div>
                     
                     <div className="flex items-center gap-3">
                       <div className="w-3 h-3 bg-green-500 rounded-full shadow-sm"></div>
                       <span className="text-sm text-green-700 font-semibold">Healthy Coverage (≥1.0)</span>
                     </div>
                   </div>
                   
                   {/* Valve Control */}
                   <div className="space-y-6">
                     <div className="text-sm font-semibold text-slate-700">Valve Status</div>
                     
                     <div className="bg-green-50 border border-green-200 rounded-xl p-5 shadow-sm">
                       <div className="flex items-center justify-between mb-4">
                         <div className="flex items-center gap-3">
                           <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse shadow-sm"></div>
                           <span className="font-bold text-green-800 text-lg">OPEN</span>
                         </div>
                         <span className="text-sm text-green-700 font-medium">Active 2h 15m</span>
                       </div>
                       
                       <button className="w-full py-4 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all duration-200 font-bold shadow-sm hover:shadow-md">
                         🔴 CLOSE VALVE
                       </button>
                     </div>
                     
                     <div className="space-y-3">
                       <div className="text-sm font-bold text-slate-700">Prerequisites:</div>
                       <div className="space-y-2 text-sm">
                         <div className="flex items-center gap-3">
                           <span className="text-green-500 font-bold">✓</span>
                           <span className="font-medium">Coverage ≥ 1.0</span>
                         </div>
                         <div className="flex items-center gap-3">
                           <span className="text-green-500 font-bold">✓</span>
                           <span className="font-medium">BUILD_DONE</span>
                         </div>
                         <div className="flex items-center gap-3">
                           <span className="text-green-500 font-bold">✓</span>
                           <span className="font-medium">IoT Connected</span>
                         </div>
                         <div className="flex items-center gap-3">
                           <span className="text-green-500 font-bold">✓</span>
                           <span className="font-medium">Operator Approved</span>
                         </div>
                       </div>
                     </div>
                     
                     <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 shadow-sm">
                       <div className="text-sm font-bold text-blue-800 mb-2">💡 Auto-Guard</div>
                       <div className="text-sm text-blue-700 font-medium">
                         Valve will auto-close if coverage drops below 0.8x
                       </div>
                     </div>
                   </div>
                 </div>
               </div>
               
               {/* Project Facts & Analytics */}
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                 <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
                   <h3 className="text-xl font-bold text-slate-900 mb-6">Project Facts</h3>
                   <div className="grid grid-cols-2 gap-6">
                     <div className="space-y-4">
                       <div>
                         <div className="text-xs text-slate-600 uppercase tracking-wider font-semibold">Well ID</div>
                         <div className="font-bold text-slate-900">WL-001</div>
                       </div>
                       <div>
                         <div className="text-xs text-slate-600 uppercase tracking-wider font-semibold">Operator</div>
                         <div className="font-bold text-slate-900">AquaTech Ltd</div>
                       </div>
                       <div>
                         <div className="text-xs text-slate-600 uppercase tracking-wider font-semibold">Location</div>
                         <div className="font-bold text-slate-900">Jakarta, Indonesia</div>
                       </div>
                       <div>
                         <div className="text-xs text-slate-600 uppercase tracking-wider font-semibold">Depth</div>
                         <div className="font-bold text-slate-900">45m</div>
                       </div>
                     </div>
                     
                     <div className="space-y-4">
                       <div>
                         <div className="text-xs text-slate-600 uppercase tracking-wider font-semibold">Escrow Balance</div>
                         <div className="font-bold text-green-600">$45,000</div>
                       </div>
                       <div>
                         <div className="text-xs text-slate-600 uppercase tracking-wider font-semibold">Daily Forecast</div>
                         <div className="font-bold text-slate-900">2,000 L/day</div>
                       </div>
                       <div>
                         <div className="text-xs text-slate-600 uppercase tracking-wider font-semibold">Revenue Split</div>
                         <div className="font-bold text-slate-900">70% / 30%</div>
                       </div>
                       <div>
                         <div className="text-xs text-slate-600 uppercase tracking-wider font-semibold">Project Type</div>
                         <div className="font-bold text-slate-900">Community Well</div>
                       </div>
                     </div>
                   </div>
                   
                   <div className="mt-8 pt-6 border-t border-slate-200">
                     <div className="flex items-center justify-between mb-4">
                       <div className="text-sm font-bold text-slate-900">Performance Today</div>
                       <div className="text-xs text-slate-600 font-medium">Last updated: 2 min ago</div>
                     </div>
                     <div className="grid grid-cols-3 gap-6">
                       <div className="text-center">
                         <div className="text-xl font-bold text-blue-600">1,847L</div>
                         <div className="text-xs text-slate-600 font-semibold">Dispensed</div>
                       </div>
                       <div className="text-center">
                         <div className="text-xl font-bold text-green-600">$92.35</div>
                         <div className="text-xs text-slate-600 font-semibold">Revenue</div>
                       </div>
                       <div className="text-center">
                         <div className="text-xl font-bold text-purple-600">92%</div>
                         <div className="text-xs text-slate-600 font-semibold">Forecast</div>
                       </div>
                     </div>
                   </div>
                 </div>
                 
                 <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
                   <div className="flex items-center justify-between mb-6">
                     <h3 className="text-xl font-bold text-slate-900">Tariff History</h3>
                     <button className="text-sm text-blue-600 hover:text-blue-800 font-semibold transition-colors duration-200">Export CSV</button>
                   </div>
                   
                   <div className="space-y-4">
                     <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-xl shadow-sm">
                       <div>
                         <div className="font-bold text-blue-800 text-lg">$0.050/L</div>
                         <div className="text-sm text-blue-600 font-semibold">Current Active</div>
                       </div>
                       <div className="text-right">
                         <div className="text-sm text-blue-600 font-medium">Set 2 days ago</div>
                         <div className="text-sm text-blue-500 font-medium">by AquaTech Ltd</div>
                       </div>
                     </div>
                     
                     <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200 shadow-sm">
                       <div>
                         <div className="font-bold text-slate-900">$0.045/L</div>
                         <div className="text-sm text-slate-600 font-semibold">Previous</div>
                       </div>
                       <div className="text-right">
                         <div className="text-sm text-slate-600 font-medium">5 days ago</div>
                         <div className="text-sm text-slate-500 font-medium">by AquaTech Ltd</div>
                       </div>
                     </div>
                     
                     <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200 shadow-sm">
                       <div>
                         <div className="font-bold text-slate-900">$0.040/L</div>
                         <div className="text-sm text-slate-600 font-semibold">Initial</div>
                       </div>
                       <div className="text-right">
                         <div className="text-sm text-slate-600 font-medium">12 days ago</div>
                         <div className="text-sm text-slate-500 font-medium">by System</div>
                       </div>
                     </div>
                   </div>
                   
                   <div className="mt-4 pt-4 border-t">
                     <div className="text-sm font-medium mb-3">Tariff Analytics</div>
                     <div className="grid grid-cols-2 gap-4">
                       <div>
                         <div className="text-xs text-slate-500">Avg Tariff (7d)</div>
                         <div className="font-medium">$0.047/L</div>
                       </div>
                       <div>
                         <div className="text-xs text-slate-500">Price Volatility</div>
                         <div className="font-medium text-green-600">Low (±2.1%)</div>
                       </div>
                       <div>
                         <div className="text-xs text-slate-500">Optimal Range</div>
                         <div className="font-medium">$0.045-$0.055</div>
                       </div>
                       <div>
                         <div className="text-xs text-slate-500">Market Position</div>
                         <div className="font-medium text-blue-600">Competitive</div>
                       </div>
                     </div>
                   </div>
                 </div>
               </div>
             </div>
           )}

           {activeSection === 'operate' && activeTab === 'meter' && (
             <div className="space-y-8">
               {/* Meter Console Header */}
               <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
                 <div className="flex items-center justify-between mb-8">
                   <h3 className="text-xl font-bold text-slate-900">Meter Console (IoT DePIN)</h3>
                   <div className="flex items-center gap-6">
                     <div className="flex items-center gap-3">
                       <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-sm"></div>
                       <span className="text-sm text-green-600 font-bold">CONNECTED</span>
                     </div>
                     <div className="text-sm text-slate-600 font-medium">Last sync: 12s ago</div>
                   </div>
                 </div>
                 
                 {/* Manual Meter Controls */}
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                   <div>
                     <div className="text-sm font-bold text-slate-900 mb-4">Manual Meter Input</div>
                     <div className="grid grid-cols-3 gap-4 mb-6">
                       <button className="py-5 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all duration-200 font-bold shadow-md hover:shadow-lg transform hover:scale-105">
                         <div className="text-xl font-bold">+50L</div>
                         <div className="text-sm opacity-90 font-medium">Small</div>
                       </button>
                       <button className="py-5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 font-bold shadow-md hover:shadow-lg transform hover:scale-105">
                         <div className="text-xl font-bold">+200L</div>
                         <div className="text-sm opacity-90 font-medium">Medium</div>
                       </button>
                       <button className="py-5 bg-blue-700 text-white rounded-xl hover:bg-blue-800 transition-all duration-200 font-bold shadow-md hover:shadow-lg transform hover:scale-105">
                         <div className="text-xl font-bold">+1000L</div>
                         <div className="text-sm opacity-90 font-medium">Large</div>
                       </button>
                     </div>
                     
                     <div className="flex gap-3">
                       <input 
                         type="number" 
                         placeholder="Custom amount" 
                         className="flex-1 px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 font-medium"
                       />
                       <button className="px-6 py-3 bg-slate-600 text-white rounded-xl hover:bg-slate-700 transition-all duration-200 font-bold shadow-md hover:shadow-lg">
                         Add
                       </button>
                     </div>
                     
                     <div className="mt-4 text-sm text-slate-600 font-medium">
                       💡 Manual inputs are for testing/calibration purposes
                     </div>
                   </div>
                   
                   {/* Current Session Stats */}
                   <div>
                     <div className="text-sm font-bold text-slate-900 mb-4">Current Session</div>
                     <div className="grid grid-cols-2 gap-4">
                       <div className="bg-blue-50 p-4 rounded-xl border border-blue-200 shadow-sm">
                         <div className="text-xs text-blue-600 uppercase tracking-wider font-semibold">Session Start</div>
                         <div className="font-bold text-slate-900">08:15 AM</div>
                       </div>
                       <div className="bg-green-50 p-4 rounded-xl border border-green-200 shadow-sm">
                         <div className="text-xs text-green-600 uppercase tracking-wider font-semibold">Duration</div>
                         <div className="font-bold text-slate-900">2h 45m</div>
                       </div>
                       <div className="bg-purple-50 p-4 rounded-xl border border-purple-200 shadow-sm">
                         <div className="text-xs text-purple-600 uppercase tracking-wider font-semibold">Avg Flow</div>
                         <div className="font-bold text-slate-900">45 L/min</div>
                       </div>
                       <div className="bg-orange-50 p-4 rounded-xl border border-orange-200 shadow-sm">
                         <div className="text-xs text-orange-600 uppercase tracking-wider font-semibold">Peak Flow</div>
                         <div className="font-bold text-slate-900">120 L/min</div>
                       </div>
                     </div>
                   </div>
                 </div>
               </div>
               
               {/* Totals & Analytics */}
               <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                 {/* Meter Totals */}
                 <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
                   <h3 className="text-xl font-bold text-slate-900 mb-6">Meter Totals</h3>
                   <div className="space-y-6">
                     <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 shadow-sm">
                       <div className="text-sm text-slate-700 mb-2 font-semibold">Total Liters (All Time)</div>
                       <div className="text-3xl font-bold text-blue-600">15,420 L</div>
                       <div className="text-sm text-slate-600 mt-2 font-medium">Since deployment</div>
                     </div>
                     
                     <div className="grid grid-cols-2 gap-4">
                       <div className="bg-orange-50 border border-orange-200 p-4 rounded-xl shadow-sm">
                         <div className="text-xs text-orange-600 uppercase tracking-wider font-semibold">Pending</div>
                         <div className="text-xl font-bold text-orange-700">1,250 L</div>
                         <div className="text-sm text-orange-600 mt-1 font-medium">Awaiting settlement</div>
                       </div>
                       <div className="bg-green-50 border border-green-200 p-4 rounded-xl shadow-sm">
                         <div className="text-xs text-green-600 uppercase tracking-wider font-semibold">Settled</div>
                         <div className="text-xl font-bold text-green-700">14,170 L</div>
                         <div className="text-sm text-green-600 mt-1 font-medium">Completed</div>
                       </div>
                     </div>
                     
                     <div className="grid grid-cols-2 gap-4">
                       <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-sm">
                         <div className="text-xs text-slate-600 uppercase tracking-wider font-semibold">Current Tariff</div>
                         <div className="text-xl font-bold text-slate-900">$0.05/L</div>
                       </div>
                       <div className="bg-green-50 p-4 rounded-xl border border-green-200 shadow-sm">
                         <div className="text-xs text-green-600 uppercase tracking-wider font-semibold">Est. Gross</div>
                         <div className="text-xl font-bold text-green-600">$62.50</div>
                       </div>
                     </div>
                   </div>
                 </div>
                 
                 {/* Liters Sparkline */}
                 <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
                   <div className="flex items-center justify-between mb-6">
                     <h3 className="text-xl font-bold text-slate-900">Liters Trend (24h)</h3>
                     <div className="text-sm text-slate-600 font-medium">Updated 12s ago</div>
                   </div>
                   
                   <div className="space-y-6">
                     <div className="h-36 bg-slate-50 rounded-xl p-4 border border-slate-200 shadow-sm">
                       <div className="h-full flex items-end justify-between gap-1">
                         {[120, 85, 95, 110, 75, 130, 90, 105, 125, 80, 115, 100, 140, 95, 110, 85, 120, 105, 90, 125, 110, 95, 130, 115].map((val, i) => (
                           <div 
                             key={i} 
                             className="bg-gradient-to-t from-blue-500 to-blue-300 w-2 rounded-t transition-all duration-300 hover:from-blue-600 hover:to-blue-400" 
                             style={{height: `${(val/140) * 100}%`}}
                             title={`Hour ${i}: ${val}L`}
                           ></div>
                         ))}
                       </div>
                     </div>
                     
                     <div className="grid grid-cols-3 gap-4 text-center">
                       <div>
                         <div className="text-sm text-slate-600 font-semibold">24h Total</div>
                         <div className="font-bold text-blue-600 text-lg">2,485 L</div>
                       </div>
                       <div>
                         <div className="text-sm text-slate-600 font-semibold">24h Avg</div>
                         <div className="font-bold text-slate-900 text-lg">103.5 L/h</div>
                       </div>
                       <div>
                         <div className="text-sm text-slate-600 font-semibold">24h Peak</div>
                         <div className="font-bold text-green-600 text-lg">140 L/h</div>
                       </div>
                     </div>
                     
                     <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 shadow-sm">
                       <div className="text-sm font-bold text-blue-800 mb-2">📊 Trend Analysis</div>
                       <div className="text-sm text-blue-700 font-medium">
                         Peak usage: 2-4 PM | Low usage: 10 PM-6 AM
                       </div>
                     </div>
                   </div>
                 </div>
                 
                 {/* Device Health */}
                 <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
                   <div className="flex items-center justify-between mb-6">
                     <h3 className="text-xl font-bold text-slate-900">Device Health</h3>
                     <div className="flex items-center gap-2">
                       <div className="w-3 h-3 bg-green-500 rounded-full shadow-sm"></div>
                       <span className="text-sm text-green-600 font-bold">HEALTHY</span>
                     </div>
                   </div>
                   
                   <div className="space-y-6">
                     <div className="grid grid-cols-2 gap-4">
                       <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-sm">
                         <div className="text-xs text-slate-600 uppercase tracking-wider font-semibold">Device ID</div>
                         <div className="font-bold text-slate-900">HB-001</div>
                       </div>
                       <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-sm">
                         <div className="text-xs text-slate-600 uppercase tracking-wider font-semibold">Gateway</div>
                         <div className="font-bold text-slate-900">Helium #A1B2</div>
                       </div>
                       <div className="bg-green-50 p-4 rounded-xl border border-green-200 shadow-sm">
                         <div className="text-xs text-green-600 uppercase tracking-wider font-semibold">Battery</div>
                         <div className="font-bold text-green-700">87%</div>
                       </div>
                       <div className="bg-blue-50 p-4 rounded-xl border border-blue-200 shadow-sm">
                         <div className="text-xs text-blue-600 uppercase tracking-wider font-semibold">RSSI</div>
                         <div className="font-bold text-blue-700">-65 dBm</div>
                       </div>
                     </div>
                     
                     <div>
                       <div className="text-sm font-bold text-slate-900 mb-3">Packet Success Rate</div>
                       <div className="flex items-center gap-3">
                         <div className="flex-1 bg-slate-200 rounded-full h-4">
                           <div className="bg-gradient-to-r from-green-500 to-green-400 h-4 rounded-full transition-all duration-500 shadow-sm" style={{width: '94%'}}></div>
                         </div>
                         <span className="text-sm font-bold text-green-600">94%</span>
                       </div>
                       <div className="text-sm text-slate-600 mt-2 font-medium">Excellent connectivity</div>
                     </div>
                     
                     <div>
                       <div className="text-sm font-medium mb-2">Last 10 Pulses (L)</div>
                       <div className="h-16 bg-slate-50 rounded flex items-end justify-center gap-1 p-2">
                         {[50, 75, 100, 80, 120, 90, 110, 85, 95, 105].map((val, i) => (
                           <div 
                             key={i} 
                             className="bg-gradient-to-t from-blue-500 to-blue-300 w-3 rounded-t transition-all duration-300 hover:from-blue-600 hover:to-blue-400" 
                             style={{height: `${(val/120) * 48}px`}}
                             title={`Pulse ${i+1}: ${val}L`}
                           ></div>
                         ))}
                       </div>
                       <div className="text-xs text-slate-500 mt-1 text-center">
                         Avg: 91L | Range: 50-120L
                       </div>
                     </div>
                     
                     <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                       <div className="text-xs font-medium text-amber-800 mb-1">⚡ Power Status</div>
                       <div className="text-xs text-amber-700">
                         Solar charging active | Est. 15 days backup
                       </div>
                     </div>
                   </div>
                 </div>
               </div>
               
               {/* Pending Settlement Window */}
               <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-lg p-6">
                 <div className="flex items-start justify-between">
                   <div className="flex items-start gap-3">
                     <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                       <span className="text-white text-sm font-bold">!</span>
                     </div>
                     <div>
                       <h4 className="font-semibold text-orange-800 mb-1">Pending Settlement Window</h4>
                       <p className="text-sm text-orange-700 mb-3">
                         You have <span className="font-bold">1,250 L</span> pending settlement worth <span className="font-bold text-green-600">$62.50</span> gross revenue.
                       </p>
                       <div className="flex items-center gap-4 text-xs text-orange-600">
                         <div className="flex items-center gap-1">
                           <span>⏰</span>
                           <span>Settlement window: 2h 15m remaining</span>
                         </div>
                         <div className="flex items-center gap-1">
                           <span>📊</span>
                           <span>Auto-settle at 2,000L or 24h</span>
                         </div>
                       </div>
                     </div>
                   </div>
                   
                   <div className="flex gap-2">
                     <button className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm font-medium">
                       Settle Now
                     </button>
                     <button className="px-4 py-2 bg-white border border-orange-300 text-orange-700 rounded-lg hover:bg-orange-50 transition-colors text-sm">
                       View Details
                     </button>
                   </div>
                 </div>
                 
                 <div className="mt-4 pt-4 border-t border-orange-200">
                   <div className="grid grid-cols-4 gap-4 text-center">
                     <div>
                       <div className="text-xs text-orange-600">Investor Share (70%)</div>
                       <div className="font-bold text-orange-800">$43.75</div>
                     </div>
                     <div>
                       <div className="text-xs text-orange-600">Operator Share (25%)</div>
                       <div className="font-bold text-orange-800">$15.63</div>
                     </div>
                     <div>
                       <div className="text-xs text-orange-600">Platform Fee (5%)</div>
                       <div className="font-bold text-orange-800">$3.12</div>
                     </div>
                     <div>
                       <div className="text-xs text-orange-600">Settlement Progress</div>
                       <div className="font-bold text-orange-800">62.5%</div>
                     </div>
                   </div>
                 </div>
               </div>
             </div>
           )}

           {/* Settle Section */}
           {activeSection === 'settle' && activeTab === 'escrow' && (
             <div className="space-y-6">
               {/* Settlement Overview */}
               <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-xl p-6 shadow-sm">
                 <div className="flex items-center justify-between mb-5">
                   <h3 className="text-xl font-bold text-green-800">Escrow & Settlement Dashboard</h3>
                   <div className="flex items-center gap-2">
                     <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                     <span className="text-sm text-green-600 font-semibold">ACTIVE</span>
                   </div>
                 </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                   <div className="bg-white/80 backdrop-blur-sm p-5 rounded-xl border border-white/60 shadow-sm hover:shadow-md transition-all duration-200">
                     <div className="text-xs text-slate-600 uppercase tracking-wide mb-2 font-medium">Pending Volume</div>
                     <div className="text-2xl font-bold text-green-700">1,250 L</div>
                     <div className="text-xs text-green-600 font-medium">Ready for settlement</div>
                   </div>
                   <div className="bg-white/80 backdrop-blur-sm p-5 rounded-xl border border-white/60 shadow-sm hover:shadow-md transition-all duration-200">
                     <div className="text-xs text-slate-600 uppercase tracking-wide mb-2 font-medium">Gross Revenue</div>
                     <div className="text-2xl font-bold text-blue-700">$62.50</div>
                     <div className="text-xs text-blue-600 font-medium">At $0.05/L tariff</div>
                   </div>
                   <div className="bg-white/80 backdrop-blur-sm p-5 rounded-xl border border-white/60 shadow-sm hover:shadow-md transition-all duration-200">
                     <div className="text-xs text-slate-600 uppercase tracking-wide mb-2 font-medium">Settlement Window</div>
                     <div className="text-2xl font-bold text-orange-700">2h 15m</div>
                     <div className="text-xs text-orange-600 font-medium">Auto-settle remaining</div>
                   </div>
                   <div className="bg-white/80 backdrop-blur-sm p-5 rounded-xl border border-white/60 shadow-sm hover:shadow-md transition-all duration-200">
                     <div className="text-xs text-slate-600 uppercase tracking-wide mb-2 font-medium">Next Auto-Reset</div>
                     <div className="text-2xl font-bold text-purple-700">6h 45m</div>
                     <div className="text-xs text-purple-600 font-medium">Daily cycle</div>
                   </div>
                 </div>
               </div>
               
               {/* Settlement Calculator & Controls */}
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                   <div className="flex items-center justify-between mb-4">
                     <h3 className="text-lg font-semibold">Settlement Calculator</h3>
                     <div className="flex items-center gap-2">
                       <button className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200 transition-colors">
                         Refresh
                       </button>
                       <button className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-xs hover:bg-gray-200 transition-colors">
                         Settings
                       </button>
                     </div>
                   </div>
                   
                   <div className="space-y-4">
                     {/* Calculation Breakdown */}
                     <div className="bg-slate-50 p-4 rounded-lg border">
                       <div className="text-sm text-slate-600 mb-3">Current Settlement Calculation</div>
                       <div className="space-y-2">
                         <div className="flex justify-between items-center">
                           <span className="text-sm">Volume:</span>
                           <span className="font-medium">1,250 L</span>
                         </div>
                         <div className="flex justify-between items-center">
                           <span className="text-sm">Tariff Rate:</span>
                           <span className="font-medium">$0.05/L</span>
                         </div>
                         <div className="border-t pt-2 mt-2">
                           <div className="flex justify-between items-center">
                             <span className="font-medium">Gross Revenue:</span>
                             <span className="text-xl font-bold text-green-600">$62.50</span>
                           </div>
                         </div>
                       </div>
                     </div>
                     
                     {/* Split Distribution */}
                     <div className="space-y-3">
                       <div className="text-sm font-medium text-slate-700">Revenue Distribution</div>
                       <div className="grid grid-cols-1 gap-3">
                         <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                           <div className="flex justify-between items-center">
                             <div>
                               <div className="text-sm font-medium text-blue-800">Investor Share</div>
                               <div className="text-xs text-blue-600">70% of gross revenue</div>
                             </div>
                             <div className="text-right">
                               <div className="text-lg font-bold text-blue-700">$43.75</div>
                               <div className="text-xs text-blue-600">To wallet</div>
                             </div>
                           </div>
                         </div>
                         
                         <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
                           <div className="flex justify-between items-center">
                             <div>
                               <div className="text-sm font-medium text-green-800">Operator Share</div>
                               <div className="text-xs text-green-600">25% of gross revenue</div>
                             </div>
                             <div className="text-right">
                               <div className="text-lg font-bold text-green-700">$15.63</div>
                               <div className="text-xs text-green-600">To operator</div>
                             </div>
                           </div>
                         </div>
                         
                         <div className="bg-purple-50 border border-purple-200 p-3 rounded-lg">
                           <div className="flex justify-between items-center">
                             <div>
                               <div className="text-sm font-medium text-purple-800">Platform Fee</div>
                               <div className="text-xs text-purple-600">5% of gross revenue</div>
                             </div>
                             <div className="text-right">
                               <div className="text-lg font-bold text-purple-700">$3.12</div>
                               <div className="text-xs text-purple-600">To platform</div>
                             </div>
                           </div>
                         </div>
                       </div>
                     </div>
                     
                     {/* Settlement Actions */}
                     <div className="space-y-3">
                       <button className="w-full py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 font-medium transition-all duration-200 shadow-sm hover:shadow-md">
                         🚀 Settle Now ($62.50)
                       </button>
                       
                       <div className="grid grid-cols-2 gap-2">
                         <button className="py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium">
                           Schedule Settlement
                         </button>
                         <button className="py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium">
                           Preview Transaction
                         </button>
                       </div>
                     </div>
                     
                     {/* Auto-Settlement Settings */}
                     <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                       <div className="text-xs font-medium text-amber-800 mb-2">⚙️ Auto-Settlement Rules</div>
                       <div className="text-xs text-amber-700 space-y-1">
                         <div>• Trigger at 2,000L or 24h window</div>
                         <div>• Daily reset at 00:00 UTC</div>
                         <div>• Min settlement: 100L ($5.00)</div>
                       </div>
                     </div>
                   </div>
                 </div>
                 
                 {/* Cumulative Analytics */}
                 <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                   <div className="flex items-center justify-between mb-5">
                     <h3 className="text-lg font-semibold text-slate-800">Cumulative Analytics</h3>
                     <div className="text-xs text-slate-500 font-medium">All-time totals</div>
                   </div>
                   
                   <div className="space-y-4">
                     {/* Total Volume & Revenue */}
                     <div className="bg-gradient-to-r from-blue-50 to-green-50 p-5 rounded-xl border border-slate-200 shadow-sm">
                       <div className="grid grid-cols-2 gap-6">
                         <div className="text-center">
                           <div className="text-xs text-slate-600 uppercase tracking-wide mb-2 font-medium">Total Volume</div>
                           <div className="text-2xl font-bold text-blue-600">47,850 L</div>
                           <div className="text-xs text-blue-600 font-medium">Since inception</div>
                         </div>
                         <div className="text-center">
                           <div className="text-xs text-slate-600 uppercase tracking-wide mb-2 font-medium">Total Revenue</div>
                           <div className="text-2xl font-bold text-green-600">$2,392.50</div>
                           <div className="text-xs text-green-600 font-medium">Gross settled</div>
                         </div>
                       </div>
                     </div>
                     
                     {/* Cumulative Distribution */}
                     <div className="space-y-3">
                       <div className="text-sm font-medium text-slate-700">Cumulative Payouts</div>
                       
                       <div className="bg-blue-50 border border-blue-200 p-5 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200">
                         <div className="flex justify-between items-center mb-3">
                           <div className="text-sm font-semibold text-blue-800">Total to Investors</div>
                           <div className="text-lg font-bold text-blue-700">$1,674.75</div>
                         </div>
                         <div className="w-full bg-blue-200 rounded-full h-2.5">
                           <div className="bg-blue-500 h-2.5 rounded-full" style={{width: '70%'}}></div>
                         </div>
                         <div className="text-xs text-blue-600 mt-2 font-medium">70% of total revenue</div>
                       </div>
                       
                       <div className="bg-green-50 border border-green-200 p-5 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200">
                         <div className="flex justify-between items-center mb-3">
                           <div className="text-sm font-semibold text-green-800">Total to Operators</div>
                           <div className="text-lg font-bold text-green-700">$598.13</div>
                         </div>
                         <div className="w-full bg-green-200 rounded-full h-2.5">
                           <div className="bg-green-500 h-2.5 rounded-full" style={{width: '25%'}}></div>
                         </div>
                         <div className="text-xs text-green-600 mt-2 font-medium">25% of total revenue</div>
                       </div>
                       
                       <div className="bg-purple-50 border border-purple-200 p-5 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200">
                         <div className="flex justify-between items-center mb-3">
                           <div className="text-sm font-semibold text-purple-800">Platform Fees</div>
                           <div className="text-lg font-bold text-purple-700">$119.63</div>
                         </div>
                         <div className="w-full bg-purple-200 rounded-full h-2.5">
                           <div className="bg-purple-500 h-2.5 rounded-full" style={{width: '5%'}}></div>
                         </div>
                         <div className="text-xs text-purple-600 mt-2 font-medium">5% of total revenue</div>
                       </div>
                     </div>
                     
                     {/* Export & Analytics */}
                     <div className="space-y-4">
                       <div className="text-sm font-semibold text-slate-700">Export & Reports</div>
                       <div className="grid grid-cols-2 gap-3">
                         <button className="px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 hover:shadow-sm transition-all duration-150 text-sm font-medium">
                           📊 Export CSV
                         </button>
                         <button className="px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 hover:shadow-sm transition-all duration-150 text-sm font-medium">
                           📋 Export JSON
                         </button>
                       </div>
                       <button className="w-full px-4 py-2.5 bg-blue-100 text-blue-700 rounded-xl hover:bg-blue-200 hover:shadow-sm transition-all duration-150 text-sm font-medium">
                         📈 Generate Analytics Report
                       </button>
                     </div>
                   </div>
                 </div>
               </div>
               
               {/* Settlement History */}
               <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                 <div className="flex items-center justify-between mb-5">
                   <h3 className="text-2xl font-bold text-slate-800">Settlement History</h3>
                   <div className="flex items-center gap-3">
                     <button className="px-3 py-1.5 bg-green-100 text-green-800 rounded-lg text-sm font-bold hover:bg-green-200 hover:shadow-md transition-all duration-200">
                       Auto-Reset: ON
                     </button>
                     <button className="px-3 py-1.5 bg-blue-100 text-blue-800 rounded-lg text-sm font-bold hover:bg-blue-200 hover:shadow-md transition-all duration-200">
                       Filter
                     </button>
                   </div>
                 </div>
                 
                 <DataTable
                   data={[
                     { 
                       id: 1, 
                       timestamp: '2024-01-15 14:30:25', 
                       time: '2 hours ago', 
                       volume: '1,750 L',
                       gross: '$87.50', 
                       inv: '$61.25', 
                       op: '$21.88', 
                       plat: '$4.37', 
                       proof: 'HCS_001',
                       status: 'Completed',
                       txHash: '0x1a2b3c...'
                     },
                     { 
                       id: 2, 
                       timestamp: '2024-01-14 09:15:42', 
                       time: '1 day ago', 
                       volume: '2,500 L',
                       gross: '$125.00', 
                       inv: '$87.50', 
                       op: '$31.25', 
                       plat: '$6.25', 
                       proof: 'HCS_002',
                       status: 'Completed',
                       txHash: '0x4d5e6f...'
                     },
                     { 
                       id: 3, 
                       timestamp: '2024-01-12 16:45:18', 
                       time: '3 days ago', 
                       volume: '1,915 L',
                       gross: '$95.75', 
                       inv: '$67.03', 
                       op: '$23.94', 
                       plat: '$4.78', 
                       proof: 'HCS_003',
                       status: 'Completed',
                       txHash: '0x7g8h9i...'
                     },
                     { 
                       id: 4, 
                       timestamp: '2024-01-11 11:20:33', 
                       time: '4 days ago', 
                       volume: '3,200 L',
                       gross: '$160.00', 
                       inv: '$112.00', 
                       op: '$40.00', 
                       plat: '$8.00', 
                       proof: 'HCS_004',
                       status: 'Completed',
                       txHash: '0xjklmno...'
                     },
                     { 
                       id: 5, 
                       timestamp: '2024-01-10 08:55:07', 
                       time: '5 days ago', 
                       volume: '2,850 L',
                       gross: '$142.50', 
                       inv: '$99.75', 
                       op: '$35.63', 
                       plat: '$7.12', 
                       proof: 'HCS_005',
                       status: 'Completed',
                       txHash: '0xpqrstu...'
                     }
                   ]}
                   columns={[
                     { key: 'timestamp', label: 'Timestamp' },
                     { key: 'volume', label: 'Volume' },
                     { key: 'gross', label: 'Gross Revenue' },
                     { key: 'inv', label: 'Investor' },
                     { key: 'op', label: 'Operator' },
                     { key: 'plat', label: 'Platform' },
                     { key: 'proof', label: 'HCS Proof' },
                     { key: 'status', label: 'Status' }
                   ]}
                   searchable={true}
                   sortable={true}
                 />
                 
                 {/* Settlement Statistics */}
                 <div className="mt-6 pt-6 border-t border-slate-200">
                   <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                     <div className="bg-blue-50 p-4 rounded-xl border border-blue-200 shadow-sm hover:shadow-md transition-shadow duration-200">
                       <div className="text-xs text-blue-600 uppercase tracking-wide font-medium mb-1">Avg Settlement</div>
                       <div className="font-bold text-blue-700 text-lg">$122.15</div>
                       <div className="text-xs text-blue-600 font-medium">Per transaction</div>
                     </div>
                     <div className="bg-green-50 p-4 rounded-xl border border-green-200 shadow-sm hover:shadow-md transition-shadow duration-200">
                       <div className="text-xs text-green-600 uppercase tracking-wide font-medium mb-1">Settlement Frequency</div>
                       <div className="font-bold text-green-700 text-lg">1.2/day</div>
                       <div className="text-xs text-green-600 font-medium">Average rate</div>
                     </div>
                     <div className="bg-purple-50 p-4 rounded-xl border border-purple-200 shadow-sm hover:shadow-md transition-shadow duration-200">
                       <div className="text-xs text-purple-600 uppercase tracking-wide font-medium mb-1">Largest Settlement</div>
                       <div className="font-bold text-purple-700 text-lg">$160.00</div>
                       <div className="text-xs text-purple-600 font-medium">Single transaction</div>
                     </div>
                     <div className="bg-orange-50 p-4 rounded-xl border border-orange-200 shadow-sm hover:shadow-md transition-shadow duration-200">
                       <div className="text-xs text-orange-600 uppercase tracking-wide font-medium mb-1">Auto-Reset Count</div>
                       <div className="font-bold text-orange-700 text-lg">47</div>
                       <div className="text-xs text-orange-600">Daily cycles</div>
                     </div>
                   </div>
                 </div>
               </div>
             </div>
           )}

           {activeSection === 'settle' && activeTab === 'anchor' && (
             <div className="space-y-6">
               {/* Anchor Proof Dashboard */}
               <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-6">
                 <div className="flex items-center justify-between mb-4">
                   <h3 className="text-lg font-semibold text-purple-800">Hedera Consensus Service (HCS) Anchor Proofs</h3>
                   <div className="flex items-center gap-2">
                     <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                     <span className="text-sm text-purple-600 font-medium">ANCHORING</span>
                   </div>
                 </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                   <div className="bg-white/70 backdrop-blur-sm p-4 rounded-lg border border-white/50">
                     <div className="text-xs text-slate-600 uppercase tracking-wide mb-1">Total Anchors</div>
                     <div className="text-xl font-bold text-purple-700">47</div>
                     <div className="text-xs text-purple-600">Proof bundles</div>
                   </div>
                   <div className="bg-white/70 backdrop-blur-sm p-4 rounded-lg border border-white/50">
                     <div className="text-xs text-slate-600 uppercase tracking-wide mb-1">Last Anchor</div>
                     <div className="text-xl font-bold text-indigo-700">2h ago</div>
                     <div className="text-xs text-indigo-600">Auto-anchored</div>
                   </div>
                   <div className="bg-white/70 backdrop-blur-sm p-4 rounded-lg border border-white/50">
                     <div className="text-xs text-slate-600 uppercase tracking-wide mb-1">Verification</div>
                     <div className="text-xl font-bold text-green-700">100%</div>
                     <div className="text-xs text-green-600">Success rate</div>
                   </div>
                   <div className="bg-white/70 backdrop-blur-sm p-4 rounded-lg border border-white/50">
                     <div className="text-xs text-slate-600 uppercase tracking-wide mb-1">Next Anchor</div>
                     <div className="text-xl font-bold text-orange-700">4h 15m</div>
                     <div className="text-xs text-orange-600">Scheduled</div>
                   </div>
                 </div>
               </div>
               
               {/* HCS Proof Viewer & Controls */}
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 {/* Current Proof Bundle */}
                 <div className="bg-white rounded-lg border p-6">
                   <div className="flex items-center justify-between mb-4">
                     <h3 className="text-lg font-semibold">Current Proof Bundle</h3>
                     <div className="flex items-center gap-2">
                       <button className="px-3 py-1 bg-purple-100 text-purple-700 rounded text-xs hover:bg-purple-200 transition-colors">
                         Refresh
                       </button>
                       <button className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200 transition-colors">
                         Verify
                       </button>
                     </div>
                   </div>
                   
                   <div className="space-y-4">
                     {/* Bundle Composition */}
                     <div className="bg-slate-50 border rounded-lg p-4">
                       <h4 className="font-medium mb-3 text-slate-800">📦 Bundle Composition</h4>
                       <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-2 text-sm">
                           <div className="flex justify-between items-center">
                             <span className="text-slate-600">🗂️ HFS Documents:</span>
                             <span className="font-medium bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">12</span>
                           </div>
                           <div className="flex justify-between items-center">
                             <span className="text-slate-600">💰 HTS Transactions:</span>
                             <span className="font-medium bg-green-100 text-green-700 px-2 py-1 rounded text-xs">8</span>
                           </div>
                           <div className="flex justify-between items-center">
                             <span className="text-slate-600">📨 HCS Messages:</span>
                             <span className="font-medium bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs">24</span>
                           </div>
                         </div>
                         <div className="space-y-2 text-sm">
                           <div className="flex justify-between items-center">
                             <span className="text-slate-600">⚖️ Settlements:</span>
                             <span className="font-medium bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs">5</span>
                           </div>
                           <div className="flex justify-between items-center">
                             <span className="text-slate-600">🔧 IoT Events:</span>
                             <span className="font-medium bg-cyan-100 text-cyan-700 px-2 py-1 rounded text-xs">156</span>
                           </div>
                           <div className="flex justify-between items-center">
                             <span className="text-slate-600">📊 Metrics:</span>
                             <span className="font-medium bg-pink-100 text-pink-700 px-2 py-1 rounded text-xs">89</span>
                           </div>
                         </div>
                       </div>
                     </div>
                     
                     {/* Merkle Root & Timestamp */}
                     <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-4">
                       <h4 className="font-medium mb-3 text-purple-800">🌳 Merkle Root & Timestamp</h4>
                       <div className="space-y-3">
                         <div>
                           <div className="text-xs text-slate-600 uppercase tracking-wide mb-1">Merkle Root Hash</div>
                           <div className="font-mono text-sm bg-white/70 p-2 rounded border break-all">0x7a8b9c4d5e6f7a8b9c4d5e6f7a8b9c4d5e6f7a8b9c4d5e6f7a8b9c4d5e6f</div>
                         </div>
                         <div className="grid grid-cols-2 gap-3">
                           <div>
                             <div className="text-xs text-slate-600 uppercase tracking-wide mb-1">HCS Topic ID</div>
                             <div className="font-mono text-sm bg-white/70 p-2 rounded border">0.0.123456</div>
                           </div>
                           <div>
                             <div className="text-xs text-slate-600 uppercase tracking-wide mb-1">Consensus Timestamp</div>
                             <div className="font-mono text-sm bg-white/70 p-2 rounded border">1705234567.123456789</div>
                           </div>
                         </div>
                       </div>
                     </div>
                     
                     {/* Anchor Actions */}
                     <div className="space-y-3">
                       <button className="w-full py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg hover:from-purple-600 hover:to-indigo-700 font-medium transition-all duration-200 shadow-sm hover:shadow-md">
                         ⚓ Anchor Proof Bundle to HCS
                       </button>
                       
                       <div className="grid grid-cols-2 gap-2">
                         <button className="py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium">
                           📋 Export Proof
                         </button>
                         <button className="py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm font-medium">
                           🔍 View on Explorer
                         </button>
                       </div>
                     </div>
                     
                     {/* Last Successful Anchor */}
                     <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                       <div className="text-sm font-medium text-green-800 mb-2">✅ Last Successful Anchor</div>
                       <div className="space-y-1 text-xs">
                         <div className="flex justify-between">
                           <span className="text-green-700">Root Hash:</span>
                           <span className="font-mono text-green-600">0x7a8b9c...</span>
                         </div>
                         <div className="flex justify-between">
                           <span className="text-green-700">HCS Message:</span>
                           <span className="font-mono text-green-600">HCS_A047</span>
                         </div>
                         <div className="flex justify-between">
                           <span className="text-green-700">IPFS Report:</span>
                           <span className="font-mono text-green-600">QmX7Y8Z...</span>
                         </div>
                         <div className="flex justify-between">
                           <span className="text-green-700">Timestamp:</span>
                           <span className="text-green-600">2 hours ago</span>
                         </div>
                       </div>
                     </div>
                   </div>
                 </div>
                 
                 {/* Verification Status & Analytics */}
                 <div className="bg-white rounded-lg border p-6">
                   <div className="flex items-center justify-between mb-4">
                     <h3 className="text-lg font-semibold">Verification & Analytics</h3>
                     <div className="text-xs text-slate-500">Real-time status</div>
                   </div>
                   
                   <div className="space-y-4">
                     {/* Verification Status */}
                     <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4">
                       <h4 className="font-medium mb-3 text-green-800">🔐 Verification Status</h4>
                       <div className="space-y-3">
                         <div className="flex items-center justify-between">
                           <span className="text-sm text-green-700">Merkle Tree Integrity</span>
                           <div className="flex items-center gap-2">
                             <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                             <span className="text-sm font-medium text-green-600">VERIFIED</span>
                           </div>
                         </div>
                         <div className="flex items-center justify-between">
                           <span className="text-sm text-green-700">HCS Consensus</span>
                           <div className="flex items-center gap-2">
                             <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                             <span className="text-sm font-medium text-green-600">CONFIRMED</span>
                           </div>
                         </div>
                         <div className="flex items-center justify-between">
                           <span className="text-sm text-green-700">Timestamp Validity</span>
                           <div className="flex items-center gap-2">
                             <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                             <span className="text-sm font-medium text-green-600">VALID</span>
                           </div>
                         </div>
                         <div className="flex items-center justify-between">
                           <span className="text-sm text-green-700">IPFS Availability</span>
                           <div className="flex items-center gap-2">
                             <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                             <span className="text-sm font-medium text-green-600">ACCESSIBLE</span>
                           </div>
                         </div>
                       </div>
                     </div>
                     
                     {/* Anchor Analytics */}
                     <div className="space-y-3">
                       <h4 className="font-medium text-slate-800">📊 Anchor Analytics</h4>
                       
                       <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                         <div className="flex justify-between items-center mb-2">
                           <div className="text-sm font-medium text-blue-800">Anchor Frequency</div>
                           <div className="text-lg font-bold text-blue-700">2.3/day</div>
                         </div>
                         <div className="w-full bg-blue-200 rounded-full h-2">
                           <div className="bg-blue-500 h-2 rounded-full" style={{width: '85%'}}></div>
                         </div>
                         <div className="text-xs text-blue-600 mt-1">Above target (2.0/day)</div>
                       </div>
                       
                       <div className="bg-purple-50 border border-purple-200 p-3 rounded-lg">
                         <div className="flex justify-between items-center mb-2">
                           <div className="text-sm font-medium text-purple-800">Avg Bundle Size</div>
                           <div className="text-lg font-bold text-purple-700">294 items</div>
                         </div>
                         <div className="w-full bg-purple-200 rounded-full h-2">
                           <div className="bg-purple-500 h-2 rounded-full" style={{width: '70%'}}></div>
                         </div>
                         <div className="text-xs text-purple-600 mt-1">Optimal range (200-400)</div>
                       </div>
                       
                       <div className="bg-orange-50 border border-orange-200 p-3 rounded-lg">
                         <div className="flex justify-between items-center mb-2">
                           <div className="text-sm font-medium text-orange-800">Verification Time</div>
                           <div className="text-lg font-bold text-orange-700">1.2s</div>
                         </div>
                         <div className="w-full bg-orange-200 rounded-full h-2">
                           <div className="bg-orange-500 h-2 rounded-full" style={{width: '95%'}}></div>
                         </div>
                         <div className="text-xs text-orange-600 mt-1">Excellent performance</div>
                       </div>
                     </div>
                     
                     {/* Export & Tools */}
                     <div className="space-y-3">
                       <h4 className="font-medium text-slate-800">🛠️ Tools & Export</h4>
                       <div className="grid grid-cols-1 gap-2">
                         <button className="px-3 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-sm font-medium">
                           📄 Export Proof Certificate (PDF)
                         </button>
                         <button className="px-3 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-sm font-medium">
                           📋 Export Merkle Tree (JSON)
                         </button>
                         <button className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium">
                           🔗 Open Hedera Explorer
                         </button>
                       </div>
                     </div>
                   </div>
                 </div>
               </div>
               
               {/* Anchor History & Timeline */}
               <div className="bg-white rounded-lg border p-6">
                 <div className="flex items-center justify-between mb-4">
                   <h3 className="text-lg font-semibold">Anchor History & Timeline</h3>
                   <div className="flex items-center gap-2">
                     <button className="px-3 py-1 bg-purple-100 text-purple-700 rounded text-xs hover:bg-purple-200 transition-colors">
                       Auto-Anchor: ON
                     </button>
                     <button className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200 transition-colors">
                       Filter by Date
                     </button>
                   </div>
                 </div>
                 
                 {/* Timeline View */}
                 <div className="space-y-4">
                   {[
                     { 
                       id: 'HCS_A047',
                       root: '0x7a8b9c4d5e6f7a8b9c4d5e6f7a8b9c4d5e6f7a8b9c4d5e6f7a8b9c4d5e6f', 
                       tx: 'HCS_A047', 
                       cid: 'QmX7Y8Z9A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q7R8S9T0U1V2W3X4Y5Z6', 
                       timestamp: '2024-01-15 16:45:23',
                       time: '2 hours ago',
                       items: 294,
                       status: 'verified',
                       consensusTime: '1705234567.123456789',
                       topicId: '0.0.123456'
                     },
                     { 
                       id: 'HCS_A046',
                       root: '0x5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6', 
                       tx: 'HCS_A046', 
                       cid: 'QmU5V6W7X8Y9Z0A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q7R8S9T0U1V2W3X4', 
                       timestamp: '2024-01-14 12:30:15',
                       time: '1 day ago',
                       items: 267,
                       status: 'verified',
                       consensusTime: '1705148567.987654321',
                       topicId: '0.0.123456'
                     },
                     { 
                       id: 'HCS_A045',
                       root: '0x3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5', 
                       tx: 'HCS_A045', 
                       cid: 'QmS3T4U5V6W7X8Y9Z0A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q7R8S9T0U1V2W', 
                       timestamp: '2024-01-12 09:15:42',
                       time: '3 days ago',
                       items: 312,
                       status: 'verified',
                       consensusTime: '1704976567.456789123',
                       topicId: '0.0.123456'
                     },
                     { 
                       id: 'HCS_A044',
                       root: '0x1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3', 
                       tx: 'HCS_A044', 
                       cid: 'QmQ1R2S3T4U5V6W7X8Y9Z0A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q7R8S9T0U1', 
                       timestamp: '2024-01-11 14:20:18',
                       time: '4 days ago',
                       items: 289,
                       status: 'verified',
                       consensusTime: '1704890567.789123456',
                       topicId: '0.0.123456'
                     },
                     { 
                       id: 'HCS_A043',
                       root: '0x9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1', 
                       tx: 'HCS_A043', 
                       cid: 'QmO7P8Q9R0S1T2U3V4W5X6Y7Z8A9B0C1D2E3F4G5H6I7J8K9L0M1N2O3P4Q5R6S7', 
                       timestamp: '2024-01-10 11:45:33',
                       time: '5 days ago',
                       items: 276,
                       status: 'verified',
                       consensusTime: '1704804567.321654987',
                       topicId: '0.0.123456'
                     }
                   ].map((anchor, i) => (
                     <div key={i} className="border border-slate-200 rounded-lg p-4 hover:border-purple-300 transition-colors">
                       <div className="flex justify-between items-start mb-3">
                         <div className="flex items-center gap-3">
                           <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                             <span className="text-purple-600 font-bold text-sm">#{47 - i}</span>
                           </div>
                           <div>
                             <div className="font-medium text-slate-800">{anchor.id}</div>
                             <div className="text-xs text-slate-500">{anchor.timestamp}</div>
                           </div>
                         </div>
                         <div className="text-right">
                           <div className="text-sm text-slate-600">{anchor.time}</div>
                           <div className="flex items-center gap-1 mt-1">
                             <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                             <span className="text-xs text-green-600 font-medium uppercase">{anchor.status}</span>
                           </div>
                         </div>
                       </div>
                       
                       <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                         <div className="space-y-2">
                           <div>
                             <div className="text-xs text-slate-600 uppercase tracking-wide mb-1">Merkle Root Hash</div>
                             <div className="font-mono text-xs bg-slate-50 p-2 rounded border break-all">{anchor.root}</div>
                           </div>
                           <div className="grid grid-cols-2 gap-2">
                             <div>
                               <div className="text-xs text-slate-600 uppercase tracking-wide mb-1">HCS Topic</div>
                               <div className="font-mono text-xs bg-slate-50 p-2 rounded border">{anchor.topicId}</div>
                             </div>
                             <div>
                               <div className="text-xs text-slate-600 uppercase tracking-wide mb-1">Items</div>
                               <div className="font-mono text-xs bg-slate-50 p-2 rounded border">{anchor.items}</div>
                             </div>
                           </div>
                         </div>
                         
                         <div className="space-y-2">
                           <div>
                             <div className="text-xs text-slate-600 uppercase tracking-wide mb-1">IPFS Report CID</div>
                             <div className="font-mono text-xs bg-slate-50 p-2 rounded border break-all">{anchor.cid}</div>
                           </div>
                           <div>
                             <div className="text-xs text-slate-600 uppercase tracking-wide mb-1">Consensus Timestamp</div>
                             <div className="font-mono text-xs bg-slate-50 p-2 rounded border">{anchor.consensusTime}</div>
                           </div>
                         </div>
                       </div>
                       
                       <div className="flex gap-2 mt-3 pt-3 border-t">
                         <button className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200 transition-colors">
                           🔍 View on Explorer
                         </button>
                         <button className="px-3 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200 transition-colors">
                           📄 Download Proof
                         </button>
                         <button className="px-3 py-1 bg-purple-100 text-purple-700 rounded text-xs hover:bg-purple-200 transition-colors">
                           🔗 View IPFS Report
                         </button>
                         <button className="px-3 py-1 bg-orange-100 text-orange-700 rounded text-xs hover:bg-orange-200 transition-colors">
                           ✅ Verify Proof
                         </button>
                       </div>
                     </div>
                   ))}
                 </div>
                 
                 {/* Anchor Statistics */}
                 <div className="mt-6 pt-6 border-t">
                   <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                     <div className="bg-purple-50 p-3 rounded-lg">
                       <div className="text-xs text-purple-600 uppercase tracking-wide">Total Anchors</div>
                       <div className="font-bold text-purple-700">47</div>
                       <div className="text-xs text-purple-600">Since inception</div>
                     </div>
                     <div className="bg-green-50 p-3 rounded-lg">
                       <div className="text-xs text-green-600 uppercase tracking-wide">Avg Items/Bundle</div>
                       <div className="font-bold text-green-700">287</div>
                       <div className="text-xs text-green-600">Optimal size</div>
                     </div>
                     <div className="bg-blue-50 p-3 rounded-lg">
                       <div className="text-xs text-blue-600 uppercase tracking-wide">Verification Rate</div>
                       <div className="font-bold text-blue-700">100%</div>
                       <div className="text-xs text-blue-600">All verified</div>
                     </div>
                     <div className="bg-orange-50 p-3 rounded-lg">
                       <div className="text-xs text-orange-600 uppercase tracking-wide">Avg Anchor Time</div>
                       <div className="font-bold text-orange-700">10.4h</div>
                       <div className="text-xs text-orange-600">Between anchors</div>
                     </div>
                   </div>
                 </div>
               </div>
             </div>
           )}

           {/* Audit Section */}
           {activeSection === 'audit' && (
             <div className="space-y-6">
               {/* Audit Dashboard Header */}
               <div className="bg-gradient-to-r from-slate-50 to-blue-50 border border-slate-200 rounded-xl p-6 shadow-sm">
                 <div className="flex items-center justify-between mb-5">
                   <h2 className="text-2xl font-bold text-slate-800">🔍 Audit & Compliance Dashboard</h2>
                   <div className="flex items-center gap-2">
                     <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></div>
                     <span className="text-sm font-semibold text-green-600">REAL-TIME MONITORING</span>
                   </div>
                 </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                   <div className="bg-white/70 backdrop-blur-sm p-4 rounded-lg border border-white/50">
                     <div className="text-xs text-slate-600 uppercase tracking-wide mb-1">Audit Score</div>
                     <div className="text-2xl font-bold text-green-700">98.5%</div>
                     <div className="text-xs text-green-600">Excellent compliance</div>
                   </div>
                   <div className="bg-white/70 backdrop-blur-sm p-4 rounded-lg border border-white/50">
                     <div className="text-xs text-slate-600 uppercase tracking-wide mb-1">Last Audit</div>
                     <div className="text-2xl font-bold text-blue-700">3h ago</div>
                     <div className="text-xs text-blue-600">Auto-generated</div>
                   </div>
                   <div className="bg-white/70 backdrop-blur-sm p-4 rounded-lg border border-white/50">
                     <div className="text-xs text-slate-600 uppercase tracking-wide mb-1">Open Issues</div>
                     <div className="text-2xl font-bold text-orange-700">2</div>
                     <div className="text-xs text-orange-600">Minor findings</div>
                   </div>
                   <div className="bg-white/70 backdrop-blur-sm p-4 rounded-lg border border-white/50">
                     <div className="text-xs text-slate-600 uppercase tracking-wide mb-1">Next Review</div>
                     <div className="text-2xl font-bold text-purple-700">5 days</div>
                     <div className="text-xs text-purple-600">Scheduled</div>
                   </div>
                 </div>
               </div>

               {/* Enhanced KPIs */}
               <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                 <div className="bg-white rounded-lg border p-4">
                   <div className="flex items-center justify-between mb-2">
                     <div className="text-xs text-slate-600 uppercase tracking-wide">HCS Anchors</div>
                     <div className="text-green-500">⚓</div>
                   </div>
                   <div className="text-xl font-bold text-slate-800">47</div>
                   <div className="text-xs text-green-600">+3 this week</div>
                   <div className="text-xs text-slate-500 mt-1">Proof bundles</div>
                 </div>
                 
                 <div className="bg-white rounded-lg border p-4">
                   <div className="flex items-center justify-between mb-2">
                     <div className="text-xs text-slate-600 uppercase tracking-wide">Settlements</div>
                     <div className="text-blue-500">💰</div>
                   </div>
                   <div className="text-xl font-bold text-slate-800">156</div>
                   <div className="text-xs text-blue-600">+12 this week</div>
                   <div className="text-xs text-slate-500 mt-1">On-chain records</div>
                 </div>
                 
                 <div className="bg-white rounded-lg border p-4">
                   <div className="flex items-center justify-between mb-2">
                     <div className="text-xs text-slate-600 uppercase tracking-wide">HFS Documents</div>
                     <div className="text-purple-500">📄</div>
                   </div>
                   <div className="text-xl font-bold text-slate-800">289</div>
                   <div className="text-xs text-purple-600">+18 this week</div>
                   <div className="text-xs text-slate-500 mt-1">Stored files</div>
                 </div>
                 
                 <div className="bg-white rounded-lg border p-4">
                   <div className="flex items-center justify-between mb-2">
                     <div className="text-xs text-slate-600 uppercase tracking-wide">IoT Events</div>
                     <div className="text-cyan-500">📡</div>
                   </div>
                   <div className="text-xl font-bold text-slate-800">1,247</div>
                   <div className="text-xs text-cyan-600">+89 today</div>
                   <div className="text-xs text-slate-500 mt-1">Sensor readings</div>
                 </div>
                 
                 <div className="bg-white rounded-lg border p-4">
                   <div className="flex items-center justify-between mb-2">
                     <div className="text-xs text-slate-600 uppercase tracking-wide">Compliance</div>
                     <div className="text-green-500">✅</div>
                   </div>
                   <div className="text-xl font-bold text-slate-800">98.5%</div>
                   <div className="text-xs text-green-600">+0.3% this month</div>
                   <div className="text-xs text-slate-500 mt-1">Overall score</div>
                 </div>
               </div>

               {/* Audit Reports & Analytics */}
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 {/* Audit Reports Table */}
                 <div className="bg-white rounded-xl border p-6 shadow-sm">
                   <div className="flex items-center justify-between mb-5">
                     <h3 className="text-xl font-bold">📊 Audit Reports</h3>
                     <div className="flex gap-2">
                       <select className="px-3 py-1.5 border rounded-lg text-xs font-medium bg-slate-50">
                         <option>All Wells</option>
                         <option>WL-001</option>
                         <option>WL-002</option>
                         <option>WL-003</option>
                       </select>
                       <select className="px-3 py-1.5 border rounded-lg text-xs font-medium bg-slate-50">
                         <option>All Types</option>
                         <option>Financial</option>
                         <option>Operational</option>
                         <option>Compliance</option>
                         <option>Technical</option>
                       </select>
                       <button className="px-3 py-1.5 bg-blue-100 text-blue-800 rounded-lg text-sm font-bold hover:bg-blue-200 transition-colors">
                         📥 Export
                       </button>
                     </div>
                   </div>
                   
                   <div className="space-y-3 max-h-96 overflow-y-auto">
                     {[
                       { 
                         id: 'RPT-047', 
                         type: 'Financial', 
                         wellId: 'WL-001', 
                         timestamp: '2024-01-15 16:45:23',
                         time: '3 hours ago', 
                         hcsTx: 'HCS_A047', 
                         reportCid: 'QmX7Y8Z9A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q7R8S9T0U1V2W3X4Y5Z6', 
                         status: 'verified',
                         score: 98.5,
                         issues: 0,
                         size: '2.4 MB'
                       },
                       { 
                         id: 'RPT-046', 
                         type: 'Operational', 
                         wellId: 'WL-002', 
                         timestamp: '2024-01-15 12:30:15',
                         time: '7 hours ago', 
                         hcsTx: 'HCS_A046', 
                         reportCid: 'QmU5V6W7X8Y9Z0A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q7R8S9T0U1V2W3X4', 
                         status: 'verified',
                         score: 97.2,
                         issues: 1,
                         size: '1.8 MB'
                       },
                       { 
                         id: 'RPT-045', 
                         type: 'Compliance', 
                         wellId: 'WL-001', 
                         timestamp: '2024-01-14 09:15:42',
                         time: '1 day ago', 
                         hcsTx: 'HCS_A045', 
                         reportCid: 'QmS3T4U5V6W7X8Y9Z0A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q7R8S9T0U1V2W', 
                         status: 'verified',
                         score: 99.1,
                         issues: 0,
                         size: '3.1 MB'
                       },
                       { 
                         id: 'RPT-044', 
                         type: 'Technical', 
                         wellId: 'WL-003', 
                         timestamp: '2024-01-13 14:20:18',
                         time: '2 days ago', 
                         hcsTx: 'HCS_A044', 
                         reportCid: 'QmQ1R2S3T4U5V6W7X8Y9Z0A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q7R8S9T0U1', 
                         status: 'verified',
                         score: 96.8,
                         issues: 2,
                         size: '4.2 MB'
                       },
                       { 
                         id: 'RPT-043', 
                         type: 'Financial', 
                         wellId: 'WL-002', 
                         timestamp: '2024-01-12 11:45:33',
                         time: '3 days ago', 
                         hcsTx: 'HCS_A043', 
                         reportCid: 'QmO7P8Q9R0S1T2U3V4W5X6Y7Z8A9B0C1D2E3F4G5H6I7J8K9L0M1N2O3P4Q5R6S7', 
                         status: 'verified',
                         score: 98.9,
                         issues: 0,
                         size: '2.7 MB'
                       }
                     ].map((report, i) => (
                       <div key={i} className="border border-slate-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                         <div className="flex justify-between items-start mb-3">
                           <div className="flex items-center gap-3">
                             <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                               <span className="text-blue-600 font-bold text-xs">{report.type.charAt(0)}</span>
                             </div>
                             <div>
                               <div className="font-medium text-slate-800">{report.id}</div>
                               <div className="text-xs text-slate-500">{report.type} • {report.wellId}</div>
                             </div>
                           </div>
                           <div className="text-right">
                             <div className="text-sm text-slate-600">{report.time}</div>
                             <div className="flex items-center gap-1 mt-1">
                               <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                               <span className="text-xs text-green-600 font-medium uppercase">{report.status}</span>
                             </div>
                           </div>
                         </div>
                         
                         <div className="grid grid-cols-2 gap-3 mb-3">
                           <div>
                             <div className="text-xs text-slate-600 uppercase tracking-wide mb-1">Audit Score</div>
                             <div className="flex items-center gap-2">
                               <div className="text-lg font-bold text-green-700">{report.score}%</div>
                               <div className="w-12 bg-slate-200 rounded-full h-2">
                                 <div className="bg-green-500 h-2 rounded-full" style={{width: `${report.score}%`}}></div>
                               </div>
                             </div>
                           </div>
                           <div>
                             <div className="text-xs text-slate-600 uppercase tracking-wide mb-1">Issues Found</div>
                             <div className="text-lg font-bold text-slate-700">
                               {report.issues === 0 ? (
                                 <span className="text-green-600">✅ None</span>
                               ) : (
                                 <span className="text-orange-600">⚠️ {report.issues}</span>
                               )}
                             </div>
                           </div>
                         </div>
                         
                         <div className="space-y-2">
                           <div>
                             <div className="text-xs text-slate-600 uppercase tracking-wide mb-1">HCS Transaction</div>
                             <div className="font-mono text-xs bg-slate-50 p-2 rounded border">{report.hcsTx}</div>
                           </div>
                           <div>
                             <div className="text-xs text-slate-600 uppercase tracking-wide mb-1">IPFS Report CID</div>
                             <div className="font-mono text-xs bg-slate-50 p-2 rounded border break-all">{report.reportCid}</div>
                           </div>
                         </div>
                         
                         <div className="flex gap-2 mt-3 pt-3 border-t">
                           <button className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200 transition-colors">
                             📄 Download PDF
                           </button>
                           <button className="px-3 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200 transition-colors">
                             🔍 View Details
                           </button>
                           <button className="px-3 py-1 bg-purple-100 text-purple-700 rounded text-xs hover:bg-purple-200 transition-colors">
                             🔗 HCS Explorer
                           </button>
                           <div className="ml-auto text-xs text-slate-500">{report.size}</div>
                         </div>
                       </div>
                     ))}
                   </div>
                 </div>
                 
                 {/* Compliance Analytics */}
                 <div className="bg-white rounded-xl border p-6 shadow-sm">
                   <div className="flex items-center justify-between mb-5">
                     <h3 className="text-xl font-bold">📈 Compliance Analytics</h3>
                     <button className="px-3 py-1.5 bg-green-100 text-green-800 rounded-lg text-sm font-bold hover:bg-green-200 transition-colors">
                       📊 Full Report
                     </button>
                   </div>
                   
                   <div className="space-y-4">
                     {/* Overall Compliance Score */}
                     <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4">
                       <div className="flex items-center justify-between mb-3">
                         <h4 className="font-medium text-green-800">🎯 Overall Compliance Score</h4>
                         <div className="text-2xl font-bold text-green-700">98.5%</div>
                       </div>
                       <div className="w-full bg-green-200 rounded-full h-3 mb-2">
                         <div className="bg-green-500 h-3 rounded-full" style={{width: '98.5%'}}></div>
                       </div>
                       <div className="text-xs text-green-600">Excellent compliance • Target: 95%</div>
                     </div>
                     
                     {/* Compliance Categories */}
                     <div className="space-y-3">
                       <h4 className="font-medium text-slate-800">📋 Compliance Categories</h4>
                       
                       {[
                         { category: 'Financial Reporting', score: 99.2, status: 'excellent', color: 'green' },
                         { category: 'Operational Standards', score: 97.8, status: 'good', color: 'blue' },
                         { category: 'Environmental Compliance', score: 98.9, status: 'excellent', color: 'green' },
                         { category: 'Safety Protocols', score: 96.5, status: 'good', color: 'blue' },
                         { category: 'Data Integrity', score: 99.8, status: 'excellent', color: 'green' },
                         { category: 'Regulatory Requirements', score: 98.1, status: 'excellent', color: 'green' }
                       ].map((item, i) => (
                         <div key={i} className="bg-slate-50 border rounded-lg p-3">
                           <div className="flex justify-between items-center mb-2">
                             <div className="text-sm font-medium text-slate-700">{item.category}</div>
                             <div className={`text-sm font-bold text-${item.color}-700`}>{item.score}%</div>
                           </div>
                           <div className="w-full bg-slate-200 rounded-full h-2">
                             <div className={`bg-${item.color}-500 h-2 rounded-full`} style={{width: `${item.score}%`}}></div>
                           </div>
                           <div className={`text-xs text-${item.color}-600 mt-1 capitalize`}>{item.status}</div>
                         </div>
                       ))}
                     </div>
                     
                     {/* Recent Issues */}
                     <div className="space-y-3">
                       <h4 className="font-medium text-slate-800">⚠️ Recent Issues & Actions</h4>
                       
                       <div className="space-y-2">
                         <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                           <div className="flex justify-between items-start mb-2">
                             <div className="text-sm font-medium text-orange-800">Chlorination Log Delay</div>
                             <div className="text-xs text-orange-600">WL-002</div>
                           </div>
                           <div className="text-xs text-orange-700 mb-2">Daily chlorination log submission 4 hours overdue</div>
                           <div className="flex gap-2">
                             <button className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs hover:bg-orange-200 transition-colors">
                               📄 View Log
                             </button>
                             <button className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200 transition-colors">
                               📞 Contact Operator
                             </button>
                           </div>
                         </div>
                         
                         <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                           <div className="flex justify-between items-start mb-2">
                             <div className="text-sm font-medium text-yellow-800">Meter Calibration Due</div>
                             <div className="text-xs text-yellow-600">WL-001</div>
                           </div>
                           <div className="text-xs text-yellow-700 mb-2">Annual meter calibration due in 7 days</div>
                           <div className="flex gap-2">
                             <button className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs hover:bg-yellow-200 transition-colors">
                               📅 Schedule
                             </button>
                             <button className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200 transition-colors">
                               📋 View Requirements
                             </button>
                           </div>
                         </div>
                       </div>
                     </div>
                     
                     {/* Compliance Trend */}
                     <div className="space-y-3">
                       <h4 className="font-medium text-slate-800">📊 Compliance Trend (30 days)</h4>
                       <div className="bg-slate-50 border rounded-lg p-3">
                         <div className="flex justify-between items-center mb-2">
                           <div className="text-sm text-slate-600">Average Score</div>
                           <div className="text-lg font-bold text-green-700">98.2%</div>
                         </div>
                         <div className="text-xs text-green-600">↗️ +0.8% improvement this month</div>
                         <div className="mt-2 text-xs text-slate-500">
                           Trend: Consistently above 95% target
                         </div>
                       </div>
                     </div>
                   </div>
                 </div>
               </div>
               
               {/* Audit Trail & Export */}
               <div className="bg-white rounded-xl border p-6 shadow-sm">
                 <div className="flex items-center justify-between mb-5">
                   <h3 className="text-xl font-bold">🔍 Audit Trail & Export</h3>
                   <div className="flex gap-2">
                     <button className="px-3 py-1.5 bg-blue-100 text-blue-800 rounded-lg text-sm font-bold hover:bg-blue-200 transition-colors">
                       📊 Generate Compliance Report
                     </button>
                     <button className="px-3 py-1.5 bg-green-100 text-green-800 rounded-lg text-sm font-bold hover:bg-green-200 transition-colors">
                       📥 Export Audit Data
                     </button>
                     <button className="px-3 py-1.5 bg-purple-100 text-purple-800 rounded-lg text-sm font-bold hover:bg-purple-200 transition-colors">
                       📋 Schedule Audit
                     </button>
                   </div>
                 </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                   {/* Export Options */}
                   <div className="space-y-3">
                     <h4 className="font-medium text-slate-800">📤 Export Options</h4>
                     <div className="space-y-2">
                       <button className="w-full px-3 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-sm">
                         📄 PDF Compliance Report
                       </button>
                       <button className="w-full px-3 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-sm">
                         📊 Excel Audit Summary
                       </button>
                       <button className="w-full px-3 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-sm">
                         📋 JSON Raw Data
                       </button>
                       <button className="w-full px-3 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-sm">
                         🔗 Blockchain Proofs
                       </button>
                     </div>
                   </div>
                   
                   {/* Audit Schedule */}
                   <div className="space-y-3">
                     <h4 className="font-medium text-slate-800">📅 Audit Schedule</h4>
                     <div className="space-y-2 text-sm">
                       <div className="flex justify-between items-center p-2 bg-blue-50 rounded">
                         <span className="text-blue-700">Daily Auto-Audit</span>
                         <span className="text-blue-600 font-medium">✅ Active</span>
                       </div>
                       <div className="flex justify-between items-center p-2 bg-green-50 rounded">
                         <span className="text-green-700">Weekly Summary</span>
                         <span className="text-green-600 font-medium">📅 Fridays</span>
                       </div>
                       <div className="flex justify-between items-center p-2 bg-purple-50 rounded">
                         <span className="text-purple-700">Monthly Review</span>
                         <span className="text-purple-600 font-medium">📋 1st of month</span>
                       </div>
                       <div className="flex justify-between items-center p-2 bg-orange-50 rounded">
                         <span className="text-orange-700">Annual Audit</span>
                         <span className="text-orange-600 font-medium">🗓️ Q4 2024</span>
                       </div>
                     </div>
                   </div>
                   
                   {/* Audit Statistics */}
                   <div className="space-y-3">
                     <h4 className="font-medium text-slate-800">📈 Audit Statistics</h4>
                     <div className="space-y-2">
                       <div className="bg-slate-50 p-3 rounded-lg">
                         <div className="text-xs text-slate-600 uppercase tracking-wide">Total Audits</div>
                         <div className="font-bold text-slate-700">1,247</div>
                         <div className="text-xs text-slate-600">Since inception</div>
                       </div>
                       <div className="bg-green-50 p-3 rounded-lg">
                         <div className="text-xs text-green-600 uppercase tracking-wide">Pass Rate</div>
                         <div className="font-bold text-green-700">98.9%</div>
                         <div className="text-xs text-green-600">Above industry avg</div>
                       </div>
                       <div className="bg-blue-50 p-3 rounded-lg">
                         <div className="text-xs text-blue-600 uppercase tracking-wide">Avg Score</div>
                         <div className="font-bold text-blue-700">97.8%</div>
                         <div className="text-xs text-blue-600">Last 30 days</div>
                       </div>
                     </div>
                   </div>
                 </div>
               </div>
               
               <ProofTray
                 proofs={proofs}
                 onPin={togglePinProof}
                 onExport={(format, data) => {
                   console.log(`Exported ${data.length} proofs as ${format}`);
                 }}
                 onClear={clearProofs}
                 pinnedProofs={pinnedProofs}
                 searchable={true}
                 filterable={true}
                 exportable={true}
               />
             </div>
           )}
        </main>
      </div>
    </div>
  );
}