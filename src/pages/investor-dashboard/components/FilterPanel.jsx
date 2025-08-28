import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';

const FilterPanel = ({ onFiltersChange, isExpanded, onToggle }) => {
  const [filters, setFilters] = useState({
    location: '',
    status: '',
    apyRange: { min: '', max: '' },
    fundingRange: { min: '', max: '' },
    sortBy: 'apy-desc'
  });

  const locationOptions = [
    { value: '', label: 'All Locations' },
    { value: 'kenya', label: 'Kenya' },
    { value: 'tanzania', label: 'Tanzania' },
    { value: 'uganda', label: 'Uganda' },
    { value: 'ethiopia', label: 'Ethiopia' }
  ];

  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'funding', label: 'Open for Funding' },
    { value: 'active', label: 'Active' },
    { value: 'building', label: 'Under Construction' },
    { value: 'completed', label: 'Completed' }
  ];

  const sortOptions = [
    { value: 'apy-desc', label: 'Highest APY' },
    { value: 'apy-asc', label: 'Lowest APY' },
    { value: 'funding-desc', label: 'Most Funded' },
    { value: 'funding-asc', label: 'Least Funded' },
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' }
  ];

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleRangeChange = (rangeType, field, value) => {
    const newFilters = {
      ...filters,
      [rangeType]: {
        ...filters?.[rangeType],
        [field]: value
      }
    };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const clearFilters = () => {
    const clearedFilters = {
      location: '',
      status: '',
      apyRange: { min: '', max: '' },
      fundingRange: { min: '', max: '' },
      sortBy: 'apy-desc'
    };
    setFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  const hasActiveFilters = () => {
    return filters?.location || filters?.status || 
           filters?.apyRange?.min || filters?.apyRange?.max ||
           filters?.fundingRange?.min || filters?.fundingRange?.max ||
           filters?.sortBy !== 'apy-desc';
  };

  return (
    <div className="bg-card border border-border rounded-lg shadow-card">
      {/* Filter Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center">
          <Icon name="Filter" size={20} className="mr-2 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Filters</h3>
          {hasActiveFilters() && (
            <span className="ml-2 px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
              Active
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {hasActiveFilters() && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              iconName="X"
              iconPosition="left"
            >
              Clear
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="lg:hidden"
          >
            <Icon name={isExpanded ? "ChevronUp" : "ChevronDown"} size={16} />
          </Button>
        </div>
      </div>
      {/* Filter Content */}
      <div className={`p-4 space-y-4 ${isExpanded ? 'block' : 'hidden lg:block'}`}>
        {/* Sort By */}
        <div>
          <Select
            label="Sort By"
            options={sortOptions}
            value={filters?.sortBy}
            onChange={(value) => handleFilterChange('sortBy', value)}
          />
        </div>

        {/* Location Filter */}
        <div>
          <Select
            label="Location"
            options={locationOptions}
            value={filters?.location}
            onChange={(value) => handleFilterChange('location', value)}
          />
        </div>

        {/* Status Filter */}
        <div>
          <Select
            label="Status"
            options={statusOptions}
            value={filters?.status}
            onChange={(value) => handleFilterChange('status', value)}
          />
        </div>

        {/* APY Range */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            APY Range (%)
          </label>
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="number"
              placeholder="Min"
              value={filters?.apyRange?.min}
              onChange={(e) => handleRangeChange('apyRange', 'min', e?.target?.value)}
            />
            <Input
              type="number"
              placeholder="Max"
              value={filters?.apyRange?.max}
              onChange={(e) => handleRangeChange('apyRange', 'max', e?.target?.value)}
            />
          </div>
        </div>

        {/* Funding Range */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Funding Goal ($)
          </label>
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="number"
              placeholder="Min"
              value={filters?.fundingRange?.min}
              onChange={(e) => handleRangeChange('fundingRange', 'min', e?.target?.value)}
            />
            <Input
              type="number"
              placeholder="Max"
              value={filters?.fundingRange?.max}
              onChange={(e) => handleRangeChange('fundingRange', 'max', e?.target?.value)}
            />
          </div>
        </div>

        {/* Quick Filters */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Quick Filters
          </label>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={filters?.status === 'funding' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleFilterChange('status', filters?.status === 'funding' ? '' : 'funding')}
            >
              Open for Funding
            </Button>
            <Button
              variant={filters?.apyRange?.min === '10' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleRangeChange('apyRange', 'min', filters?.apyRange?.min === '10' ? '' : '10')}
            >
              High Yield (10%+)
            </Button>
            <Button
              variant={filters?.location === 'kenya' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleFilterChange('location', filters?.location === 'kenya' ? '' : 'kenya')}
            >
              Kenya Only
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterPanel;