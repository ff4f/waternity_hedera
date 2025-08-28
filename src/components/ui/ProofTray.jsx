import React, { useState, useMemo } from 'react';

function ProofPill({ type, label, tx, link, time, pinned, onPin }) {
  const color = type === 'HTS' 
    ? 'bg-blue-100 text-blue-700 border-blue-300' 
    : type === 'HCS' 
    ? 'bg-purple-100 text-purple-700 border-purple-300'
    : type === 'HFS'
    ? 'bg-green-100 text-green-700 border-green-300'
    : 'bg-slate-100 text-slate-700 border-slate-300';

  const short = (s) => s ? `${s.slice(0, 6)}...${s.slice(-4)}` : '';

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs ${color} ${pinned ? 'ring-2 ring-yellow-300' : ''}`}>
      <span className="font-semibold">{type}</span>
      <span className="opacity-80">{label}</span>
      <a 
        href={link} 
        target="_blank" 
        rel="noreferrer" 
        className="font-mono opacity-60 hover:opacity-100"
      >
        {short(tx)}
      </a>
      {time && (
        <span className="text-xs opacity-50">
          {new Date(time).toLocaleTimeString()}
        </span>
      )}
      {onPin && (
        <button 
          onClick={() => onPin(tx)} 
          className="ml-1 opacity-60 hover:opacity-100"
          title={pinned ? 'Unpin proof' : 'Pin proof'}
        >
          {pinned ? '📌' : '📍'}
        </button>
      )}
    </div>
  );
}

export default function ProofTray({ 
  proofs = [], 
  onPin, 
  onExport, 
  onClear,
  searchable = true,
  filterable = true,
  exportable = true,
  pinnedProofs = new Set()
}) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('time');
  const [sortOrder, setSortOrder] = useState('desc');

  const filteredAndSortedProofs = useMemo(() => {
    let result = proofs;

    // Apply search filter
    if (search && searchable) {
      result = result.filter(proof => 
        proof.label.toLowerCase().includes(search.toLowerCase()) ||
        proof.tx.toLowerCase().includes(search.toLowerCase()) ||
        proof.type.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Apply type filter
    if (filter !== 'all' && filterable) {
      if (filter === 'pinned') {
        result = result.filter(proof => pinnedProofs.has(proof.tx));
      } else {
        result = result.filter(proof => proof.type === filter);
      }
    }

    // Apply sorting
    result = [...result].sort((a, b) => {
      let aVal, bVal;
      
      switch (sortBy) {
        case 'time':
          aVal = a.time || 0;
          bVal = b.time || 0;
          break;
        case 'type':
          aVal = a.type;
          bVal = b.type;
          break;
        case 'label':
          aVal = a.label;
          bVal = b.label;
          break;
        default:
          aVal = a.time || 0;
          bVal = b.time || 0;
      }

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        const comparison = aVal.localeCompare(bVal);
        return sortOrder === 'asc' ? comparison : -comparison;
      }
      
      const comparison = aVal - bVal;
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [proofs, search, filter, sortBy, sortOrder, searchable, filterable, pinnedProofs]);

  const proofStats = useMemo(() => {
    const stats = {
      total: proofs.length,
      pinned: Array.from(pinnedProofs).length,
      types: {}
    };

    proofs.forEach(proof => {
      stats.types[proof.type] = (stats.types[proof.type] || 0) + 1;
    });

    return stats;
  }, [proofs, pinnedProofs]);

  const exportProofsJSON = () => {
    const json = JSON.stringify(filteredAndSortedProofs, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `proofs-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    if (onExport) onExport('json', filteredAndSortedProofs);
  };

  const exportProofsCSV = () => {
    const headers = ['Type', 'Label', 'Transaction', 'Time', 'Pinned'];
    const csvContent = [
      headers.join(','),
      ...filteredAndSortedProofs.map(proof => [
        proof.type,
        `"${proof.label}"`,
        proof.tx,
        proof.time ? new Date(proof.time).toISOString() : '',
        pinnedProofs.has(proof.tx) ? 'Yes' : 'No'
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `proofs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    if (onExport) onExport('csv', filteredAndSortedProofs);
  };

  return (
    <div className="bg-white border rounded-lg p-4 space-y-4">
      {/* Header with Stats */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Blockchain Proofs</h3>
          <div className="flex gap-4 text-sm text-slate-600">
            <span>Total: {proofStats.total}</span>
            <span>Pinned: {proofStats.pinned}</span>
            {Object.entries(proofStats.types).map(([type, count]) => (
              <span key={type}>{type}: {count}</span>
            ))}
          </div>
        </div>
        
        {exportable && (
          <div className="flex gap-2">
            <button
              onClick={exportProofsJSON}
              className="px-3 py-1 bg-slate-100 rounded hover:bg-slate-200 text-sm"
              title="Export as JSON"
            >
              📄 JSON
            </button>
            <button
              onClick={exportProofsCSV}
              className="px-3 py-1 bg-slate-100 rounded hover:bg-slate-200 text-sm"
              title="Export as CSV"
            >
              📊 CSV
            </button>
            {onClear && (
              <button
                onClick={onClear}
                className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-sm"
                title="Clear all proofs"
              >
                🗑️ Clear
              </button>
            )}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-4">
        {searchable && (
          <input
            type="text"
            placeholder="Search proofs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3 py-2 border rounded flex-1 min-w-[200px]"
          />
        )}
        
        {filterable && (
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 border rounded"
          >
            <option value="all">All Types</option>
            <option value="HTS">HTS</option>
            <option value="HCS">HCS</option>
            <option value="HFS">HFS</option>
            <option value="pinned">Pinned Only</option>
          </select>
        )}
        
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-3 py-2 border rounded"
        >
          <option value="time">Sort by Time</option>
          <option value="type">Sort by Type</option>
          <option value="label">Sort by Label</option>
        </select>
        
        <button
          onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          className="px-3 py-2 border rounded hover:bg-slate-50"
          title={`Currently: ${sortOrder === 'asc' ? 'Ascending' : 'Descending'}`}
        >
          {sortOrder === 'asc' ? '↑' : '↓'}
        </button>
      </div>

      {/* Proofs Grid */}
      <div className="space-y-2">
        {filteredAndSortedProofs.length > 0 ? (
          <div className="grid grid-cols-1 gap-2">
            {filteredAndSortedProofs.map((proof, i) => (
              <ProofPill
                key={`${proof.tx}-${i}`}
                {...proof}
                pinned={pinnedProofs.has(proof.tx)}
                onPin={onPin}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-500">
            {search || filter !== 'all' 
              ? 'No proofs found matching your criteria' 
              : 'No proofs available yet'}
          </div>
        )}
      </div>

      {/* Footer Info */}
      {filteredAndSortedProofs.length > 0 && (
        <div className="text-xs text-slate-500 border-t pt-2">
          Showing {filteredAndSortedProofs.length} of {proofs.length} proofs
          {search && ` • Filtered by: "${search}"`}
          {filter !== 'all' && ` • Type: ${filter}`}
        </div>
      )}
    </div>
  );
}