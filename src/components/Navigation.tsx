'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Droplets, Menu, X, ChevronDown, FileText, Code, ExternalLink, User, LogOut, Settings, Key } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuPortal,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useUser } from '@/lib/auth/user-context';

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, loading, logout } = useUser();

  const formatHbarBalance = (balance: string | null | undefined) => {
    if (!balance) return 'N/A';
    const num = parseFloat(balance);
    return num.toFixed(2) + ' ℏ';
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 relative overflow-visible">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Droplets className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">Waternity</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              href="/"
              className="text-gray-700 hover:text-blue-600 transition-colors font-medium"
            >
              Home
            </Link>

            {/* Platform Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-1 text-gray-700 hover:text-blue-600 transition-colors font-medium">
                Platform
                <ChevronDown className="w-4 h-4" />
              </DropdownMenuTrigger>
              <DropdownMenuPortal>
                <DropdownMenuContent
                  align="start"
                  sideOffset={8}
                  className="z-[70] w-80 rounded-xl border bg-white p-2 shadow-xl"
                >
                <DropdownMenuItem asChild>
                  <Link href="/dashboard" className="w-full">
                    Dashboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/investor-dashboard" className="w-full">
                    Investor Dashboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/operator" className="w-full">
                    Operator Panel
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/audit" className="w-full">
                    Audit Reports
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/smart-contract" className="w-full">
                    Smart Contract
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/identity" className="flex items-center space-x-2">
                    <FileText className="w-4 h-4" />
                    THG Identity
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/tokens" className="w-full">
                    Token Dashboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/rewards" className="w-full">
                    Conservation Rewards
                  </Link>
                </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenuPortal>
            </DropdownMenu>

            {/* Developer Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-1 text-gray-700 hover:text-blue-600 transition-colors font-medium">
                <Code className="w-4 h-4" />
                Developer
                <ChevronDown className="w-4 h-4" />
              </DropdownMenuTrigger>
              <DropdownMenuPortal>
                <DropdownMenuContent
                  align="start"
                  sideOffset={8}
                  className="z-[70] w-80 rounded-xl border bg-white p-2 shadow-xl"
                >
                <DropdownMenuItem asChild>
                  <Link href="/api/docs" className="w-full flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    API Documentation
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/api/docs?format=yaml" className="w-full flex items-center gap-2">
                    <Code className="w-4 h-4" />
                    OpenAPI YAML
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a 
                    href="https://docs.hedera.com" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="w-full flex items-center gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Hedera Docs
                  </a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a 
                    href="https://testnet.mirrornode.hedera.com" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="w-full flex items-center gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Mirror Node
                  </a>
                </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenuPortal>
            </DropdownMenu>

            <Link
              href="/demo"
              className="text-gray-700 hover:text-blue-600 transition-colors font-medium"
            >
              Demo
            </Link>
          </div>

          {/* CTA Buttons / User Profile */}
          <div className="hidden md:flex items-center space-x-4">
            {loading ? (
              <div className="text-sm text-gray-500">Loading...</div>
            ) : user ? (
              /* User Profile Dropdown */
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
                  <User className="w-4 h-4" />
                  <div className="text-left">
                    <div className="text-sm font-medium text-gray-900">
                      {user.name || user.email}
                    </div>
                    <div className="text-xs text-gray-500">
                      {user.role.name}
                    </div>
                  </div>
                  <ChevronDown className="w-4 h-4" />
                </DropdownMenuTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuContent
                    align="end"
                    sideOffset={8}
                    className="z-[70] min-w-[280px] rounded-xl border bg-white p-2 shadow-xl"
                  >
                    {/* User Info Section */}
                    <div className="px-3 py-2 border-b border-gray-100">
                      <div className="text-sm font-medium text-gray-900">
                        {user.name || 'User'}
                      </div>
                      <div className="text-xs text-gray-500 mb-2">
                        {user.email}
                      </div>
                      {user.hederaAccountId && (
                        <div className="space-y-1">
                          <div className="text-xs text-gray-600">
                            <span className="font-medium">Account ID:</span> {user.hederaAccountId}
                          </div>
                          <div className="text-xs text-gray-600">
                            <span className="font-medium">HBAR Balance:</span> {formatHbarBalance(user.hbarBalance)}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Profile Actions */}
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="w-full flex items-center gap-2">
                        <Settings className="w-4 h-4" />
                        Edit Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/change-password" className="w-full flex items-center gap-2">
                        <Key className="w-4 h-4" />
                        Change Password
                      </Link>
                    </DropdownMenuItem>
                    
                    <DropdownMenuSeparator />
                    
                    <DropdownMenuItem 
                      onClick={logout}
                      className="w-full flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenuPortal>
              </DropdownMenu>
            ) : (
              /* Sign In / Register Buttons */
              <>
                <Button variant="ghost" asChild>
                  <Link href="/signin">Sign In</Link>
                </Button>
                <Button asChild>
                  <Link href="/register">Get Started</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t border-gray-200">
              <Link
                href="/"
                className="text-gray-700 hover:text-blue-600 transition-colors font-medium py-2 block"
                onClick={() => setIsOpen(false)}
              >
                Home
              </Link>

              {/* Mobile Platform Section */}
              <div>
                <div className="text-gray-900 font-medium py-2">Platform</div>
                <div className="pl-4 flex flex-col gap-2">
                  <Link
                    href="/dashboard"
                    className="text-gray-600 hover:text-blue-600 transition-colors py-1"
                    onClick={() => setIsOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/investor-dashboard"
                    className="text-gray-600 hover:text-blue-600 transition-colors py-1"
                    onClick={() => setIsOpen(false)}
                  >
                    Investor Dashboard
                  </Link>
                  <Link
                    href="/operator"
                    className="text-gray-600 hover:text-blue-600 transition-colors py-1"
                    onClick={() => setIsOpen(false)}
                  >
                    Operator Panel
                  </Link>
                  <Link
                    href="/audit"
                    className="text-gray-600 hover:text-blue-600 transition-colors py-1"
                    onClick={() => setIsOpen(false)}
                  >
                    Audit Reports
                  </Link>
                  <Link
                    href="/smart-contract"
                    className="text-gray-600 hover:text-blue-600 transition-colors py-1"
                    onClick={() => setIsOpen(false)}
                  >
                    Smart Contract
                  </Link>
                  <Link
                    href="/identity"
                    className="text-gray-600 hover:text-blue-600 transition-colors py-1"
                    onClick={() => setIsOpen(false)}
                  >
                    THG Identity
                  </Link>
                  <Link
                    href="/tokens"
                    className="text-gray-600 hover:text-blue-600 transition-colors py-1"
                    onClick={() => setIsOpen(false)}
                  >
                    Token Dashboard
                  </Link>
                </div>
              </div>

              {/* Mobile Developer Section */}
              <div>
                <div className="text-gray-900 font-medium py-2 flex items-center gap-2">
                  <Code className="w-4 h-4" />
                  Developer Tools
                </div>
                <div className="pl-4 flex flex-col gap-2">
                  <Link
                    href="/api/docs"
                    className="text-gray-600 hover:text-blue-600 transition-colors py-1 flex items-center gap-2"
                    onClick={() => setIsOpen(false)}
                  >
                    <FileText className="w-4 h-4" />
                    API Documentation
                  </Link>
                  <Link
                    href="/api/docs?format=yaml"
                    className="text-gray-600 hover:text-blue-600 transition-colors py-1 flex items-center gap-2"
                    onClick={() => setIsOpen(false)}
                  >
                    <Code className="w-4 h-4" />
                    OpenAPI YAML
                  </Link>
                  <a
                    href="https://docs.hedera.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-600 hover:text-blue-600 transition-colors py-1 flex items-center gap-2"
                    onClick={() => setIsOpen(false)}
                  >
                    <ExternalLink className="w-4 h-4" />
                    Hedera Docs
                  </a>
                  <a
                    href="https://testnet.mirrornode.hedera.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-600 hover:text-blue-600 transition-colors py-1 flex items-center gap-2"
                    onClick={() => setIsOpen(false)}
                  >
                    <ExternalLink className="w-4 h-4" />
                    Mirror Node
                  </a>
                </div>
              </div>

              <Link
                href="/demo"
                className="text-gray-700 hover:text-blue-600 transition-colors font-medium py-2 block"
                onClick={() => setIsOpen(false)}
              >
                Demo
              </Link>

              {/* Mobile User Section */}
              {loading ? (
                <div className="text-sm text-gray-500 py-2">Loading...</div>
              ) : user ? (
                <div className="pt-4 border-t border-gray-200">
                  <div className="px-3 py-2 bg-gray-50 rounded-lg mb-3">
                    <div className="text-sm font-medium text-gray-900">
                      {user.name || user.email}
                    </div>
                    <div className="text-xs text-gray-500 mb-2">
                      {user.role.name}
                    </div>
                    {user.hederaAccountId && (
                      <div className="space-y-1">
                        <div className="text-xs text-gray-600">
                          <span className="font-medium">Account:</span> {user.hederaAccountId}
                        </div>
                        <div className="text-xs text-gray-600">
                          <span className="font-medium">Balance:</span> {formatHbarBalance(user.hbarBalance)}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <Button
                      variant="ghost"
                      className="text-gray-700 justify-start"
                      asChild
                    >
                      <Link href="/profile" onClick={() => setIsOpen(false)}>
                        <Settings className="w-4 h-4 mr-2" />
                        Edit Profile
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      className="text-gray-700 justify-start"
                      asChild
                    >
                      <Link href="/change-password" onClick={() => setIsOpen(false)}>
                        <Key className="w-4 h-4 mr-2" />
                        Change Password
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 justify-start"
                      onClick={() => {
                        setIsOpen(false);
                        logout();
                      }}
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </Button>
                  </div>
                </div>
              ) : (
                /* Mobile CTA Buttons */
                <div className="flex flex-col gap-3 pt-4 border-t border-gray-200">
                  <Button
                    variant="ghost"
                    className="text-gray-700 justify-start"
                    asChild
                  >
                    <Link href="/signin" onClick={() => setIsOpen(false)}>Sign In</Link>
                  </Button>
                  <Button
                    className="bg-blue-600 hover:bg-blue-700 justify-start"
                    asChild
                  >
                    <Link href="/register" onClick={() => setIsOpen(false)}>Get Started</Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}