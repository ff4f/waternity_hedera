'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  role: {
    id: string;
    name: string;
  };
  hederaAccountId: string | null;
  hbarBalance?: string | null;
  createdAt: Date;
}

interface UserContextType {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
  updateHederaAccount: (accountId: string) => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshUser = async () => {
    try {
      setError(null);
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      setError('Failed to fetch user information');
      setUser(null);
    }
  };

  const logout = async () => {
    try {
      setError(null);
      const res = await fetch('/api/auth/logout', {
        method: 'POST',
      });
      
      if (res.ok) {
        setUser(null);
        // Redirect to login page or home
        window.location.href = '/';
      } else {
        throw new Error('Logout failed');
      }
    } catch (error) {
      console.error('Error during logout:', error);
      setError('Failed to logout');
    }
  };

  const updateHederaAccount = async (accountId: string) => {
    try {
      setError(null);
      const res = await fetch('/api/auth/update-hedera-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ hederaAccountId: accountId }),
      });

      if (res.ok) {
        // Refresh user data to get updated account info
        await refreshUser();
      } else {
        const data = await res.json();
        throw new Error(data.message || 'Failed to update Hedera account');
      }
    } catch (error) {
      console.error('Error updating Hedera account:', error);
      setError(error instanceof Error ? error.message : 'Failed to update Hedera account');
      throw error;
    }
  };

  useEffect(() => {
    const checkAuthStatus = async () => {
      setLoading(true);
      await refreshUser();
      setLoading(false);
    };

    checkAuthStatus();
  }, []);

  const value: UserContextType = {
    user,
    loading,
    error,
    refreshUser,
    logout,
    updateHederaAccount,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}