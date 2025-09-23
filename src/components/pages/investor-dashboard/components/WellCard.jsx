import React from 'react';
import { Droplet, TrendingUp, Users, MapPin } from 'lucide-react';

const WellCard = ({ well, onFund }) => {
  const { name, location, totalValueLocked, avgApy, members } = well;

  const handleFundClick = (e) => {
    e.stopPropagation();
    onFund(well);
  };

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden shadow-card hover:border-primary transition-all duration-300 cursor-pointer">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-1">{name}</h3>
            <div className="flex items-center text-sm text-muted-foreground">
              <MapPin size={14} className="mr-2" />
              <span>{location}</span>
            </div>
          </div>
          <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-1 rounded-full">Active</span>
        </div>

        <div className="grid grid-cols-2 gap-x-6 gap-y-4 mb-6 text-sm">
          <div className="flex items-center">
            <div className="p-2 bg-primary/10 rounded-md mr-3">
              <Droplet size={18} className="text-primary" />
            </div>
            <div>
              <p className="text-muted-foreground">TVL</p>
              <p className="font-semibold text-foreground">${totalValueLocked.toLocaleString()}</p>
            </div>
          </div>
          <div className="flex items-center">
            <div className="p-2 bg-green-500/10 rounded-md mr-3">
              <TrendingUp size={18} className="text-green-500" />
            </div>
            <div>
              <p className="text-muted-foreground">Avg. APY</p>
              <p className="font-semibold text-foreground">{avgApy}%</p>
            </div>
          </div>
          <div className="flex items-center">
            <div className="p-2 bg-blue-500/10 rounded-md mr-3">
              <Users size={18} className="text-blue-500" />
            </div>
            <div>
              <p className="text-muted-foreground">Investors</p>
              <p className="font-semibold text-foreground">{members}</p>
            </div>
          </div>
        </div>

        <button 
          onClick={handleFundClick}
          className="w-full bg-primary text-primary-foreground font-semibold py-2.5 rounded-lg hover:bg-primary/90 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary focus:ring-offset-background"
        >
          Fund Well
        </button>
      </div>
    </div>
  );
};

export default WellCard;