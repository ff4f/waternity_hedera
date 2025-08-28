import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Icon from '../AppIcon';

const RoleTabNavigation = ({ currentRole, onRoleChange }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const roles = [
    {
      id: 'investor',
      label: 'Investor',
      path: '/investor-dashboard',
      icon: 'TrendingUp',
      description: 'Portfolio & Funding',
      color: 'text-success'
    },
    {
      id: 'operator', 
      label: 'Operator',
      path: '/operator-dashboard',
      icon: 'Settings',
      description: 'Operations & Projects',
      color: 'text-primary'
    },
    {
      id: 'agent',
      label: 'Agent',
      path: '/agent-dashboard',
      icon: 'Shield', 
      description: 'Settlement & Audit',
      color: 'text-secondary'
    }
  ];

  const handleRoleSwitch = (role) => {
    if (onRoleChange) {
      onRoleChange(role?.id);
    }
    navigate(role?.path);
  };

  const isActive = (rolePath) => location?.pathname === rolePath;

  return (
    <div className="bg-card border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Desktop Tab Navigation */}
        <div className="hidden md:flex">
          {roles?.map((role) => (
            <button
              key={role?.id}
              onClick={() => handleRoleSwitch(role)}
              className={`
                relative flex items-center px-6 py-4 text-sm font-medium transition-smooth
                ${isActive(role?.path)
                  ? 'text-primary border-b-2 border-primary bg-primary/5' :'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }
              `}
            >
              <Icon 
                name={role?.icon} 
                size={16} 
                className={`mr-2 ${isActive(role?.path) ? role?.color : ''}`}
              />
              <div className="flex flex-col items-start">
                <span>{role?.label}</span>
                <span className="text-xs opacity-75">{role?.description}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Mobile Dropdown Navigation */}
        <div className="md:hidden py-3">
          <div className="relative">
            <select
              value={location?.pathname}
              onChange={(e) => {
                const selectedRole = roles?.find(role => role?.path === e?.target?.value);
                if (selectedRole) {
                  handleRoleSwitch(selectedRole);
                }
              }}
              className="w-full appearance-none bg-card border border-border rounded-lg px-4 py-3 pr-10 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            >
              {roles?.map((role) => (
                <option key={role?.id} value={role?.path}>
                  {role?.label} - {role?.description}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <Icon name="ChevronDown" size={16} className="text-muted-foreground" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoleTabNavigation;