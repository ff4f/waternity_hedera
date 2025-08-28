import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import GlobalHeader from '../../components/ui/GlobalHeader';
import SidebarLayout from '../../components/ui/SidebarLayout';
import WellDetailModal from '../../components/ui/WellDetailModal';
import KPIMetricsGrid from './components/KPIMetricsGrid';
import WellCard from './components/WellCard';
import PortfolioSidebar from './components/PortfolioSidebar';
import FilterPanel from './components/FilterPanel';
import FundingModal from './components/FundingModal';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';

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
  const [filteredWells, setFilteredWells] = useState([]);

  // Mock wells data
  const wellsData = [
    {
      id: 'WELL-NE-001',
      name: 'Ngong Hills Water Co-op',
      location: 'Ngong Hills, Kenya',
      image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop',
      fundingGoal: 50000,
      currentFunding: 32500,
      apy: '9.2%',
      status: 'funding',
      beneficiaries: '1,250',
      transactionHash: '0x742d35Cc6634C0532925a3b8D4C9db4C4b8b8b8b',
      description: `This community-driven water project will provide clean, sustainable water access to over 1,250 families in the Ngong Hills region. The well features modern filtration systems and IoT monitoring for transparent impact measurement.`,
      depth: '180 meters',
      capacity: '8,000 L/day',
      installDate: 'March 2024',
      maintenanceScore: '98%',
      rating: '4.9/5',
      contractAddress: '0x742d35Cc6634C0532925a3b8D4C9db4C4b8b8b8b',
      lastVerification: '2025-08-25 18:30:15 UTC'
    },
    {
      id: 'WELL-KB-002',
      name: 'Kibera Community Well',
      location: 'Kibera, Nairobi',
      image: 'https://images.pexels.com/photos/1108572/pexels-photo-1108572.jpeg?w=400&h=300&fit=crop',
      fundingGoal: 35000,
      currentFunding: 28000,
      apy: '8.7%',
      status: 'funding',
      beneficiaries: '850',
      transactionHash: '0x8b8b8b4C4b8b8b8b532925a3b8D4C9db4C6634C0',
      description: `Serving one of Nairobi's largest informal settlements, this well project will dramatically improve water access and reduce waterborne diseases in the Kibera community.`,
      depth: '150 meters',capacity: '6,500 L/day',installDate: 'April 2024',maintenanceScore: '95%',rating: '4.7/5',contractAddress: '0x8b8b8b4C4b8b8b8b532925a3b8D4C9db4C6634C0',
      lastVerification: '2025-08-25 17:45:22 UTC'
    },
    {
      id: 'WELL-MM-003',name: 'Maasai Mara Well #1',location: 'Maasai Mara, Kenya',image: 'https://images.pixabay.com/photo/2019/07/25/18/58/well-4363447_1280.jpg?w=400&h=300&fit=crop',fundingGoal: 75000,currentFunding: 45000,apy: '10.1%',status: 'building',beneficiaries: '2,100',transactionHash: '0x4C9db4C4b8b8b8b532925a3b8D4C6634C0742d35C',
      description: `Supporting pastoral communities in the Maasai Mara ecosystem with reliable water access while maintaining environmental sustainability and traditional land use practices.`,
      depth: '200 meters',capacity: '12,000 L/day',installDate: 'February 2024',maintenanceScore: '92%',rating: '4.8/5',contractAddress: '0x4C9db4C4b8b8b8b532925a3b8D4C6634C0742d35C',
      lastVerification: '2025-08-25 16:20:08 UTC'
    },
    {
      id: 'WELL-TZ-004',name: 'Arusha Village Well',location: 'Arusha, Tanzania',image: 'https://images.unsplash.com/photo-1541919329513-35f7af297129?w=400&h=300&fit=crop',fundingGoal: 42000,currentFunding: 42000,apy: '8.9%',status: 'active',beneficiaries: '980',transactionHash: '0x35C742d35Cc6634C0532925a3b8D4C9db4C4b8b8b',
      description: `Fully operational well serving rural communities near Arusha with consistent water supply and generating steady returns for investors through pay-per-liter revenue model.`,
      depth: '165 meters',capacity: '7,200 L/day',installDate: 'January 2024',maintenanceScore: '97%',rating: '4.9/5',contractAddress: '0x35C742d35Cc6634C0532925a3b8D4C9db4C4b8b8b',
      lastVerification: '2025-08-25 19:15:33 UTC'
    },
    {
      id: 'WELL-UG-005',name: 'Kampala Outskirts Well',location: 'Kampala, Uganda',image: 'https://images.pexels.com/photos/1108101/pexels-photo-1108101.jpeg?w=400&h=300&fit=crop',fundingGoal: 38000,currentFunding: 15000,apy: '9.5%',status: 'funding',beneficiaries: '720',transactionHash: '0x6634C0532925a3b8D4C9db4C4b8b8b742d35Cc',
      description: `Expanding water access to growing peri-urban communities around Kampala with modern infrastructure and community-managed operations for long-term sustainability.`,
      depth: '140 meters',capacity: '5,800 L/day',installDate: 'May 2024',maintenanceScore: '94%',rating: '4.6/5',contractAddress: '0x6634C0532925a3b8D4C9db4C4b8b8b742d35Cc',
      lastVerification: '2025-08-25 18:05:17 UTC'
    },
    {
      id: 'WELL-ET-006',name: 'Addis Ababa Rural Well',location: 'Addis Ababa, Ethiopia',image: 'https://images.pixabay.com/photo/2018/03/03/20/02/water-well-3196456_1280.jpg?w=400&h=300&fit=crop',fundingGoal: 55000,currentFunding: 55000,apy: '11.2%',status: 'completed',beneficiaries: '1,450',transactionHash: '0x925a3b8D4C9db4C4b8b8b742d35Cc6634C0532',
      description: `Successfully completed well project providing clean water to rural communities outside Addis Ababa, now generating consistent returns through established water distribution network.`,
      depth: '175 meters',capacity: '9,500 L/day',installDate: 'December 2023',maintenanceScore: '99%',rating: '5.0/5',contractAddress: '0x925a3b8D4C9db4C4b8b8b742d35Cc6634C0532',
      lastVerification: '2025-08-25 19:45:41 UTC'
    }
  ];

  // Initialize filtered wells
  useEffect(() => {
    setFilteredWells(wellsData);
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
    let filtered = [...wellsData];

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
  }, [filters]);

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

              {filteredWells?.length > 0 ? (
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