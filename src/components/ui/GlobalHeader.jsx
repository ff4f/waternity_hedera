import React, { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Icon from '../AppIcon';
import Button from './Button';
import RoleBadge from './RoleBadge';
import { getRoleByWallet, filterTabsByRole } from '../../lib/rbac';
import { useWalletContext } from '../../lib/wallet-context';

const GlobalHeader = ({ isAuthenticated = false, userRole = null, onRoleChange }) => {
  const { wallet } = useWalletContext?.() || { wallet: { connected: false, accountId: '', state: 'Disconnected' } };
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const isLandingPage = pathname === '/landing-page' || pathname === '/';
  
  // Get role from wallet if not explicitly provided
  const effectiveRole = userRole || (wallet?.accountId ? getRoleByWallet(wallet.accountId) : 'investor');
  
  const roleNavigation = [
    {
      id: 'investor',
      label: 'Investor Dashboard',
      path: '/investor-dashboard',
      icon: 'TrendingUp',
      description: 'Portfolio management and funding opportunities'
    },
    {
      id: 'operator',
      label: 'Operator Dashboard', 
      path: '/operator-dashboard',
      icon: 'Settings',
      description: 'Project lifecycle and operations management',
      requireRole: 'operator'
    },
    {
      id: 'agent',
      label: 'Agent Dashboard',
      path: '/agent-dashboard', 
      icon: 'Shield',
      description: 'Settlement and audit verification tools',
      requireRole: 'agent'
    }
  ];

  // Filter navigation based on role
  const filteredNavigation = filterTabsByRole(effectiveRole, roleNavigation);

  const handleRoleSwitch = (roleId, path) => {
    if (onRoleChange) {
      onRoleChange(roleId);
    }
    router.push(path);
    setIsMobileMenuOpen(false);
  };

  const handleLogoClick = () => {
    if (isAuthenticated) {
      // Navigate to appropriate dashboard based on user role
      const currentRole = roleNavigation?.find(role => role?.id === userRole);
      if (currentRole) {
        router.push(currentRole?.path);
      } else {
        router.push('/investor-dashboard'); // Default fallback
      }
    } else {
      router.push('/landing-page');
    }
  };

  const Logo = () => (
    <div 
      className="flex items-center cursor-pointer transition-smooth hover:opacity-80"
      onClick={handleLogoClick}
    >
      <div className="flex items-center justify-center w-10 h-10 bg-primary rounded-lg mr-3">
        <svg
          viewBox="0 0 24 24"
          className="w-6 h-6 text-primary-foreground"
          fill="currentColor"
        >
          <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1H5C3.89 1 3 1.89 3 3V19C3 20.1 3.9 21 5 21H11V19H5V3H13V9H21ZM14 15.5L16.5 18L14 20.5V19H10V18H14V15.5ZM20 15C18.9 15 18 15.9 18 17S18.9 19 20 19 22 18.1 22 17 21.1 15 20 15Z"/>
        </svg>
      </div>
      <div className="flex flex-col">
        <span className="text-xl font-bold text-foreground">Waternity</span>
        <span className="text-xs text-muted-foreground -mt-1">Water Infrastructure</span>
      </div>
    </div>
  );

  return (
    <header className="fixed top-0 left-0 right-0 bg-card border-b border-border z-header">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Logo />

          {/* Desktop Navigation */}
          {isAuthenticated && !isLandingPage && (
            <nav className="hidden md:flex items-center space-x-1">
              {filteredNavigation?.map((role) => {
                const isActive = pathname === role?.path;
                return (
                  <button
                    key={role?.id}
                    onClick={() => handleRoleSwitch(role?.id, role?.path)}
                    className={`
                      flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-smooth
                      ${isActive 
                        ? 'bg-primary text-primary-foreground shadow-card' 
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                      }
                    `}
                    title={role?.description}
                  >
                    <Icon name={role?.icon} size={16} className="mr-2" />
                    {role?.label}
                  </button>
                );
              })}
            </nav>
          )}

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-3">
            {isLandingPage ? (
              <div className="flex items-center space-x-3">
                <Button variant="ghost" onClick={() => router.push('/investor-dashboard')}>
                  Sign In
                </Button>
                <Button variant="default" onClick={() => router.push('/investor-dashboard')}>
                  Get Started
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <RoleBadge role={effectiveRole} />
                <Button variant="ghost" size="icon">
                  <Icon name="Bell" size={18} />
                </Button>
                <Button variant="ghost" size="icon">
                  <Icon name="User" size={18} />
                </Button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <Icon name={isMobileMenuOpen ? "X" : "Menu"} size={20} />
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-card">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {isAuthenticated && !isLandingPage ? (
                <>
                  {filteredNavigation?.map((role) => {
                    const isActive = pathname === role?.path;
                    return (
                      <button
                        key={role?.id}
                        onClick={() => handleRoleSwitch(role?.id, role?.path)}
                        className={`
                          flex items-center w-full px-3 py-2 rounded-lg text-sm font-medium transition-smooth
                          ${isActive 
                            ? 'bg-primary text-primary-foreground' 
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                          }
                        `}
                      >
                        <Icon name={role?.icon} size={16} className="mr-3" />
                        <div className="text-left">
                          <div>{role?.label}</div>
                          <div className="text-xs opacity-75">{role?.description}</div>
                        </div>
                      </button>
                    );
                  })}
                  <div className="border-t border-border pt-2 mt-2">
                    <div className="px-3 py-2">
                      <RoleBadge role={effectiveRole} />
                    </div>
                    <button className="flex items-center w-full px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-smooth">
                      <Icon name="Bell" size={16} className="mr-3" />
                      Notifications
                    </button>
                    <button className="flex items-center w-full px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-smooth">
                      <Icon name="User" size={16} className="mr-3" />
                      Profile
                    </button>
                  </div>
                </>
              ) : (
                <div className="space-y-2">
                  <Button 
                    variant="ghost" 
                    fullWidth 
                    onClick={() => {
                      router.push('/investor-dashboard');
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    Sign In
                  </Button>
                  <Button 
                    variant="default" 
                    fullWidth
                    onClick={() => {
                      router.push('/investor-dashboard');
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    Get Started
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default GlobalHeader;