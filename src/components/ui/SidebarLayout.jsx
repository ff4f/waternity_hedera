import React, { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Icon from '../AppIcon';
import Button from './Button';

const SidebarLayout = ({ items = [], children, title }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (path) => pathname === path;

  const handleNav = (path) => {
    router.push(path);
    setMobileOpen(false);
  };

  return (
    <div className="pt-16">
      {/* Mobile top bar for opening sidebar */}
      <div className="md:hidden px-4 py-2 border-b bg-card">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium text-foreground">
            {title || 'Dashboard'}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setMobileOpen(true)}
            iconName="Menu"
            iconPosition="left"
          >
            Menu
          </Button>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden md:block fixed top-16 left-0 bottom-0 w-64 bg-card border-r border-border overflow-y-auto">
        <nav className="p-3 space-y-1">
          {items?.map((item) => (
            <button
              key={item?.id}
              onClick={() => handleNav(item?.path)}
              className={`w-full flex items-center px-3 py-2 rounded-md text-sm transition-smooth ${
                isActive(item?.path)
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              <Icon name={item?.icon} size={16} className="mr-3" />
              <span>{item?.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Mobile Sidebar (Drawer) */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <div className="absolute top-0 left-0 bottom-0 w-64 bg-card border-r border-border p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">Navigation</span>
              <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)}>
                <Icon name="X" size={18} />
              </Button>
            </div>
            <nav className="space-y-1">
              {items?.map((item) => (
                <button
                  key={item?.id}
                  onClick={() => handleNav(item?.path)}
                  className={`w-full flex items-center px-3 py-2 rounded-md text-sm transition-smooth ${
                    isActive(item?.path)
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  <Icon name={item?.icon} size={16} className="mr-3" />
                  <span>{item?.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Content */}
      <main className="md:ml-64">
        {children}
      </main>
    </div>
  );
};

export default SidebarLayout;