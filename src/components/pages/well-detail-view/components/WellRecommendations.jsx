import React from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';
import Button from '../../../components/ui/Button';
import ProofPillComponent from '../../../components/ui/ProofPillComponent';

const WellRecommendations = () => {
  const navigate = useNavigate();

  const recommendedWells = [
    {
      id: 'WELL-NE-002',
      name: 'Maasai Mara Community Well',
      location: 'Narok County, Kenya',
      image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop',
      fundingGoal: '$45,000',
      currentFunding: '$28,500',
      fundingProgress: '63%',
      apy: '9.2%',
      familiesServed: '980',
      status: 'funding',
      transactionHash: '0x8b8b8b8b4C9db4C4b8b8b8b742d35Cc6634C0532'
    },
    {
      id: 'WELL-NE-003',
      name: 'Samburu Water Access Project',
      location: 'Samburu County, Kenya',
      image: 'https://images.pexels.com/photos/1108572/pexels-photo-1108572.jpeg?w=400&h=300&fit=crop',
      fundingGoal: '$60,000',
      currentFunding: '$15,000',
      fundingProgress: '25%',
      apy: '11.5%',
      familiesServed: '1,500',
      status: 'funding',
      transactionHash: '0x532925a3b8D4C9db4C4b8b8b8b742d35Cc6634C0'
    },
    {
      id: 'WELL-NE-004',
      name: 'Turkana Solar Well Initiative',
      location: 'Turkana County, Kenya',
      image: 'https://images.pixabay.com/photo/2016/11/29/12/30/water-1869206_1280.jpg?w=400&h=300&fit=crop',
      fundingGoal: '$75,000',
      currentFunding: '$67,500',
      fundingProgress: '90%',
      apy: '7.8%',
      familiesServed: '2,100',
      status: 'nearly-funded',
      transactionHash: '0xC0532925a3b8D4C9db4C4b8b8b8b742d35Cc6634'
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'funding':
        return 'text-primary bg-primary/10';
      case 'nearly-funded':
        return 'text-warning bg-warning/10';
      case 'operational':
        return 'text-success bg-success/10';
      default:
        return 'text-muted-foreground bg-muted';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'funding':
        return 'Open for Funding';
      case 'nearly-funded':
        return 'Nearly Funded';
      case 'operational':
        return 'Operational';
      default:
        return 'Unknown';
    }
  };

  const handleWellClick = (wellId) => {
    // In a real app, this would navigate to the specific well detail page
    navigate(`/well-detail-view?id=${wellId}`);
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">Related Projects</h3>
        <Button variant="ghost" size="sm" iconName="ArrowRight" iconPosition="right">
          View All
        </Button>
      </div>
      <div className="space-y-4">
        {recommendedWells?.map((well) => (
          <div
            key={well?.id}
            className="border border-border rounded-lg p-4 hover:shadow-card transition-smooth cursor-pointer"
            onClick={() => handleWellClick(well?.id)}
          >
            <div className="flex space-x-4">
              {/* Well Image */}
              <div className="flex-shrink-0">
                <div className="w-20 h-20 rounded-lg overflow-hidden">
                  <Image
                    src={well?.image}
                    alt={well?.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              {/* Well Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-medium text-foreground text-sm line-clamp-1">
                      {well?.name}
                    </h4>
                    <p className="text-xs text-muted-foreground flex items-center mt-1">
                      <Icon name="MapPin" size={12} className="mr-1" />
                      {well?.location}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(well?.status)}`}>
                    {getStatusLabel(well?.status)}
                  </span>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="text-xs">
                    <span className="text-muted-foreground">APY:</span>
                    <span className="text-primary font-medium ml-1">{well?.apy}</span>
                  </div>
                  <div className="text-xs">
                    <span className="text-muted-foreground">Families:</span>
                    <span className="text-foreground font-medium ml-1">{well?.familiesServed}</span>
                  </div>
                </div>

                {/* Funding Progress */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">
                      {well?.currentFunding} of {well?.fundingGoal}
                    </span>
                    <span className="text-foreground font-medium">{well?.fundingProgress}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1.5">
                    <div 
                      className="bg-primary h-1.5 rounded-full transition-all duration-300"
                      style={{ width: well?.fundingProgress }}
                    />
                  </div>
                </div>

                {/* Verification */}
                <div className="flex items-center justify-between mt-3">
                  <ProofPillComponent 
                    transactionHash={well?.transactionHash}
                    status="verified"
                    size="sm"
                    onVerificationClick={() => {}}
                  />
                  <Button variant="ghost" size="sm" iconName="ExternalLink" iconPosition="right">
                    View Details
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      {/* Investment Opportunity Banner */}
      <div className="mt-6 p-4 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg border border-primary/20">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <Icon name="TrendingUp" size={20} className="text-primary-foreground" />
            </div>
          </div>
          <div className="flex-1">
            <h4 className="font-medium text-foreground">Diversify Your Impact Portfolio</h4>
            <p className="text-sm text-muted-foreground">
              Invest across multiple water projects to maximize returns and community impact.
            </p>
          </div>
          <Button variant="default" size="sm" iconName="Plus" iconPosition="left">
            Explore More
          </Button>
        </div>
      </div>
    </div>
  );
};

export default WellRecommendations;