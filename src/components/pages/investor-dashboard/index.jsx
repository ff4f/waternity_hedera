import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import GlobalHeader from '../../components/ui/GlobalHeader';
import SidebarLayout from '../../components/ui/SidebarLayout';
import WellDetailModal from '../../components/ui/WellDetailModal';
import KPIMetricsGrid from '../../components/ui/KPIMetricsGrid';
import WellCard from './components/WellCard';
import PortfolioSidebar from './components/PortfolioSidebar';
import FilterPanel from './components/FilterPanel';
import FundingModal from './components/FundingModal';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import WalletButton from '../../components/WalletButton';
import { WellsListSkeleton } from '../../Skeleton';
import { api } from '../../lib/api';

const InvestorDashboard = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [currentRole, setCurrentRole] = useState('investor');
  const [selectedWell, setSelectedWell] = useState(null);
  const [isWellDetailOpen, setIsWellDetailOpen] = useState(false);
  const [isFundingModalOpen, setIsFundingModalOpen] = useState(false);
  const [fundingWell, setFundingWell] = useState(null);
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  const [filters, setFilters] = useState({});
  const [wells, setWells] = useState([]);
  const [filteredWells, setFilteredWells] = useState([]);
  const [isLoadingWells, setIsLoadingWells] = useState(true);

  useEffect(() => {
    const fetchWells = async () => {
      try {
        setIsLoadingWells(true);
        const data = await api('/api/wells');
        setWells(data);
        setFilteredWells(data);
      } catch (error) {
        console.error('Failed to fetch wells', error);
      } finally {
        setIsLoadingWells(false);
      }
    };

    fetchWells();
  }, []);

  // Handle URL parameters for default routing
  useEffect(() => {
    const mode = searchParams?.get('mode');
    if (mode === 'cashflow') {
      // Focus on cashflow/yield generation view
      console.log('Cashflow mode activated');
    }
  }, [searchParams]);

  // Filter wells based on current filters
  useEffect(() => {
    let filtered = [...wells];

    // Apply location filter
    if (filters?.location) {
      filtered = filtered?.filter(well => 
        well?.location?.toLowerCase()?.includes(filters?.location?.toLowerCase())
      );
    }

    // Apply status filter
    if (filters?.status) {
      filtered = filtered?.filter(well => well?.status === filters?.status);
    }

    // Apply APY range filter
    if (filters?.apyRange?.min || filters?.apyRange?.max) {
      filtered = filtered?.filter(well => {
        const apy = parseFloat(well?.apy?.replace('%', ''));
        const min = filters?.apyRange?.min ? parseFloat(filters?.apyRange?.min) : 0;
        const max = filters?.apyRange?.max ? parseFloat(filters?.apyRange?.max) : 100;
        return apy >= min && apy <= max;
      });
    }

    // Apply funding range filter
    if (filters?.fundingRange?.min || filters?.fundingRange?.max) {
      filtered = filtered?.filter(well => {
        const min = filters?.fundingRange?.min ? parseFloat(filters?.fundingRange?.min) : 0;
        const max = filters?.fundingRange?.max ? parseFloat(filters?.fundingRange?.max) : Infinity;
        return well?.fundingGoal >= min && well?.fundingGoal <= max;
      });
    }

    // Apply sorting
    if (filters?.sortBy) {
      filtered?.sort((a, b) => {
        switch (filters?.sortBy) {
          case 'apy-desc':
            return parseFloat(b?.apy?.replace('%', '')) - parseFloat(a?.apy?.replace('%', ''));
          case 'apy-asc':
            return parseFloat(a?.apy?.replace('%', '')) - parseFloat(b?.apy?.replace('%', ''));
          case 'funding-desc':
            return (b?.currentFunding / b?.fundingGoal) - (a?.currentFunding / a?.fundingGoal);
          case 'funding-asc':
            return (a?.currentFunding / a?.fundingGoal) - (b?.currentFunding / b?.fundingGoal);
          default:
            return 0;
        }
      });
    }

    setFilteredWells(filtered);
  }, [filters, wells]);

  const handleRoleChange = (newRole) => {
    setCurrentRole(newRole);
  };

  const handleWellCardClick = (well) => {
    setSelectedWell(well);
    setIsWellDetailOpen(true);
  };

  const handleFundClick = (well) => {
    setFundingWell(well);
    setIsFundingModalOpen(true);
  };

  const handleFundingComplete = (fundingData) => {
    console.log('Funding completed:', fundingData);
    // Update well data or refresh from API
    setIsFundingModalOpen(false);
    setFundingWell(null);
  };

  const handleSettleYield = () => {
    console.log('Settling yield...');
    // Implement yield settlement logic
  };

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
  };

  // Sidebar navigation items
  const sidebarItems = [
    { id: 'investor', label: 'Investor Dashboard', icon: 'TrendingUp', path: '/investor-dashboard' },
    { id: 'operator', label: 'Operator Dashboard', icon: 'Settings', path: '/operator-dashboard' },
    { id: 'agent', label: 'Agent Dashboard', icon: 'Shield', path: '/agent-dashboard' },
    { id: 'wells', label: 'Well Explorer', icon: 'Compass', path: '/well-detail-view' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Global Header */}
      <GlobalHeader 
        isAuthenticated={true}
        userRole={currentRole}
        onRoleChange={handleRoleChange}
      />
      {/* Sidebar Layout */}
      <SidebarLayout items={sidebarItems} title="Investor Dashboard">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Investor Dashboard</h1>
              <p className="text-muted-foreground mt-1">
                Discover funding opportunities and track your water well investments
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <WalletButton />
              <Button
                variant="outline"
                iconName="Download"
                iconPosition="left"
              >
                Export Portfolio
              </Button>
              <Button
                variant="default"
                iconName="Plus"
                iconPosition="left"
                onClick={() => navigate('/well-detail-view')}
              >
                Explore Wells
              </Button>
            </div>
          </div>
        </div>

        {/* KPI Metrics Grid */}
        <div className="mb-8">
          <KPIMetricsGrid />
        </div>

        {/* Main Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Content - Wells and Filters */}
          <div className="lg:col-span-3 space-y-6">
            {/* Filter Panel */}
            <FilterPanel
              onFiltersChange={handleFiltersChange}
              isExpanded={isFilterExpanded}
              onToggle={() => setIsFilterExpanded(!isFilterExpanded)}
            />

            {/* Wells Grid */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-foreground">
                  Available Wells ({filteredWells?.length})
                </h2>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Icon name="Info" size={16} />
                  <span>All transactions verified on Hedera blockchain</span>
                </div>
              </div>

              {isLoadingWells ? (
                <WellsListSkeleton count={6} />
              ) : filteredWells?.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredWells?.map((well) => (
                    <WellCard
                      key={well?.id}
                      well={well}
                      onFundClick={handleFundClick}
                      onViewDetails={handleWellCardClick}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-card border border-border rounded-lg">
                  <Icon name="Search" size={48} className="mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">No wells found</h3>
                  <p className="text-muted-foreground mb-4">
                    Try adjusting your filters to see more results
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => setFilters({})}
                  >
                    Clear Filters
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar - Portfolio */}
          <div className="lg:col-span-1">
            <PortfolioSidebar onSettleYield={handleSettleYield} />
          </div>
        </div>
        </div>
      </SidebarLayout>
      {/* Modals */}
      <WellDetailModal
        isOpen={isWellDetailOpen}
        onClose={() => setIsWellDetailOpen(false)}
        wellData={selectedWell}
        userRole={currentRole}
      />
      <FundingModal
        isOpen={isFundingModalOpen}
        onClose={() => setIsFundingModalOpen(false)}
        wellData={fundingWell}
        onFundingComplete={handleFundingComplete}
      />
    </div>
  );
};

export default InvestorDashboard;