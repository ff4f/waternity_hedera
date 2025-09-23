import React from 'react';
import { SlidersHorizontal, RotateCcw } from 'lucide-react';

const FilterPanel = ({ filters, setFilters, locations, sortOptions }) => {
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleReset = () => {
    setFilters({
      location: 'all',
      sortBy: 'apy-desc',
      search: '',
    });
  };

  return (
    <div className="bg-card p-6 rounded-lg border border-border">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <SlidersHorizontal size={20} className="mr-3 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Filters & Sort</h3>
        </div>
        <button 
          onClick={handleReset}
          className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <RotateCcw size={14} className="mr-2" />
          Reset
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Search Input */}
        <div className="md:col-span-3">
          <label htmlFor="search" className="text-sm font-medium text-muted-foreground mb-2 block">Search Well</label>
          <input
            type="text"
            id="search"
            name="search"
            value={filters.search}
            onChange={handleInputChange}
            placeholder="Search by name or location..."
            className="w-full bg-input border border-border rounded-lg px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Location Filter */}
        <div>
          <label htmlFor="location" className="text-sm font-medium text-muted-foreground mb-2 block">Location</label>
          <select
            id="location"
            name="location"
            value={filters.location}
            onChange={handleInputChange}
            className="w-full bg-input border border-border rounded-lg px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary appearance-none"
          >
            <option value="all">All Locations</option>
            {locations.map(loc => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>
        </div>

        {/* Sort By */}
        <div>
          <label htmlFor="sortBy" className="text-sm font-medium text-muted-foreground mb-2 block">Sort By</label>
          <select
            id="sortBy"
            name="sortBy"
            value={filters.sortBy}
            onChange={handleInputChange}
            className="w-full bg-input border border-border rounded-lg px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary appearance-none"
          >
            {sortOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default FilterPanel;