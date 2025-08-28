import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import GlobalHeader from '../../components/ui/GlobalHeader';
import RoleTabNavigation from '../../components/ui/RoleTabNavigation';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import WellHeroCarousel from './components/WellHeroCarousel';
import WellOverviewTab from './components/WellOverviewTab';
import WellTechnicalTab from './components/WellTechnicalTab';
import WellInvestmentPanel from './components/WellInvestmentPanel';
import WellCommentsSection from './components/WellCommentsSection';
import WellRecommendations from './components/WellRecommendations';
import { useWalletContext } from "../../lib/wallet-context";
import { canAccess } from '../../lib/rbac';

const WellDetailView = () => {
  const { wallet } = useWalletContext();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [userRole, setUserRole] = useState('investor');
  const [isLoading, setIsLoading] = useState(true);

  // Get well ID from URL params
  const wellId = searchParams?.get('id') || 'WELL-NE-001';

  // Mock well data - in real app this would come from API
  const wellData = {
    id: wellId,
    name: 'Ngong Hills Community Water Project',
    location: 'Ngong Hills, Kajiado County, Kenya',
    coordinates: '-1.3833, 36.6500',
    description: `This water infrastructure project aims to provide clean, sustainable water access to underserved communities in the Ngong Hills region. The project utilizes advanced solar-powered pumping systems and modern filtration technology to ensure reliable water delivery while generating stable returns for investors through our innovative blockchain-verified impact measurement system.\n\nThe well serves over 1,250 families across 15 villages, providing essential water access for drinking, cooking, and small-scale agriculture. All operations are transparently tracked on the Hedera blockchain, ensuring accountability and trust in the investment process.`,
    status: 'Operational',
    fundingGoal: '$50,000',
    currentFunding: '$32,500',
    fundingProgress: '65%',
    apy: '8.5%',
    dailyCapacity: '5,000L',
    familiesServed: '1,250',
    beneficiaries: '1,250',
    investorCount: '47',
    coverageArea: '15 km²',
    operationalHours: '24/7',
    elevation: '1,800m above sea level',
    depth: '150 meters',
    casingDiameter: '6 inches',
    waterTableDepth: '45 meters',
    staticWaterLevel: '38 meters',
    pumpType: 'Solar Submersible',
    pumpCapacity: '2.5 HP',
    flowRate: '15 L/min',
    headPressure: '120 meters',
    phLevel: '7.2',
    tdsLevel: '180 ppm',
    chlorineResidual: '0.5 mg/L',
    bacterialCount: '< 1 CFU/100ml',
    maintenanceScore: '95%',
    rating: '4.8/5',
    startDate: 'March 2024',
    targetDate: 'December 2024',
    installDate: 'July 2024',
    contractAddress: '0x742d35Cc6634C0532925a3b8D4C9db4C4b8b8b8b',
    transactionHash: '0x742d35Cc6634C0532925a3b8D4C9db4C4b8b8b8b',
    lastVerification: '2024-08-25 18:30:15 UTC'
  };

  // Hero carousel images
  const heroImages = [
    {
      id: 1,
      src: "https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=1200&h=600&fit=crop",
      alt: "Well construction site overview showing drilling equipment and community members",
      caption: "Construction Progress - Phase 3 Complete"
    },
    {
      id: 2,
      src: "https://images.pexels.com/photos/1108572/pexels-photo-1108572.jpeg?w=1200&h=600&fit=crop",
      alt: "Community members accessing clean water from the new well",
      caption: "Community Impact - 1,250 Families Served Daily"
    },
    {
      id: 3,
      src: "https://images.pixabay.com/photo/2016/11/29/12/30/water-1869206_1280.jpg?w=1200&h=600&fit=crop",
      alt: "Solar-powered water pump and filtration system",
      caption: "Technical Infrastructure - 5,000L Daily Capacity"
    },
    {
      id: 4,
      src: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1200&h=600&fit=crop",
      alt: "Local children with access to clean water",
      caption: "Sustainable Impact - Clean Water Access for All"
    }
  ];

  useEffect(() => {
    // Simulate loading data
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [wellId]);

  const handleRoleChange = (newRole) => {
    setUserRole(newRole);
  };

  const handleBackToExplore = () => {
    navigate('/investor-dashboard');
  };

  const tabs = [
    {
      id: 'overview',
      label: 'Overview',
      icon: 'Info',
      description: 'Project summary and impact metrics'
    },
    {
      id: 'technical',
      label: 'Technical',
      icon: 'Settings',
      description: 'Specifications and construction details'
    }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <GlobalHeader isAuthenticated={true} userRole={userRole} onRoleChange={handleRoleChange} />
        <RoleTabNavigation currentRole={userRole} onRoleChange={handleRoleChange} />
        
        <div className="pt-32 pb-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="animate-pulse space-y-6">
              <div className="h-8 bg-muted rounded w-1/3"></div>
              <div className="h-64 md:h-80 lg:h-96 bg-muted rounded-lg"></div>
              <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                  <div className="h-64 bg-muted rounded-lg"></div>
                  <div className="h-96 bg-muted rounded-lg"></div>
                </div>
                <div className="space-y-6">
                  <div className="h-80 bg-muted rounded-lg"></div>
                  <div className="h-64 bg-muted rounded-lg"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <GlobalHeader isAuthenticated={true} userRole={userRole} onRoleChange={handleRoleChange} />
      <RoleTabNavigation currentRole={userRole} onRoleChange={handleRoleChange} />
      <div className="pt-32 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb Navigation */}
          <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-6">
            <button 
              onClick={handleBackToExplore}
              className="hover:text-primary transition-smooth"
            >
              Dashboard
            </button>
            <Icon name="ChevronRight" size={14} />
            <span className="text-foreground">Well Details</span>
            <Icon name="ChevronRight" size={14} />
            <span className="text-foreground font-medium">{wellData?.id}</span>
          </div>

          {/* Page Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                {wellData?.name}
              </h1>
              <div className="flex items-center text-muted-foreground">
                <Icon name="MapPin" size={16} className="mr-2" />
                <span>{wellData?.location}</span>
              </div>
            </div>
            <div className="mt-4 md:mt-0 flex items-center space-x-3">
              <Button variant="outline" iconName="Share" iconPosition="left">
                Share Project
              </Button>
              <Button variant="outline" iconName="Heart" iconPosition="left">
                Save
              </Button>
            </div>
          </div>

          {/* Hero Carousel */}
          <div className="mb-8">
            <WellHeroCarousel images={heroImages} wellName={wellData?.name} />
          </div>

          {/* Main Content Grid */}
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column - Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Tab Navigation */}
              <div className="bg-card border border-border rounded-lg">
                {/* Desktop Tabs */}
                <div className="hidden md:flex border-b border-border">
                  {tabs?.map((tab) => (
                    <button
                      key={tab?.id}
                      onClick={() => setActiveTab(tab?.id)}
                      className={`
                        flex items-center px-6 py-4 text-sm font-medium transition-smooth
                        ${activeTab === tab?.id
                          ? 'text-primary border-b-2 border-primary bg-primary/5' :'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                        }
                      `}
                    >
                      <Icon name={tab?.icon} size={16} className="mr-2" />
                      <div className="flex flex-col items-start">
                        <span>{tab?.label}</span>
                        <span className="text-xs opacity-75">{tab?.description}</span>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Mobile Tab Selector */}
                <div className="md:hidden p-4 border-b border-border">
                  <select
                    value={activeTab}
                    onChange={(e) => setActiveTab(e?.target?.value)}
                    className="w-full appearance-none bg-card border border-border rounded-lg px-4 py-3 pr-10 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                  >
                    {tabs?.map((tab) => (
                      <option key={tab?.id} value={tab?.id}>
                        {tab?.label} - {tab?.description}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Tab Content */}
                <div className="p-6">
                  {activeTab === 'overview' && <WellOverviewTab wellData={wellData} />}
                  {activeTab === 'technical' && <WellTechnicalTab wellData={wellData} />}
                </div>
              </div>

              {/* Comments Section */}
              <WellCommentsSection userRole={userRole} />
            </div>

            {/* Right Column - Sidebar */}
            <div className="space-y-6">
              {/* Investment/Action Panel */}
              {canAccess(wallet?.accountId, userRole, 'investment_actions') ? (
                <WellInvestmentPanel wellData={wellData} userRole={userRole} />
              ) : (
                <div className="bg-card border border-border rounded-lg p-6 text-center">
                  <Icon name="Lock" size={48} className="mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">Access Restricted</h3>
                  <p className="text-muted-foreground">Connect wallet to access investment actions</p>
                </div>
              )}

              {/* Recommendations */}
              <WellRecommendations />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WellDetailView;