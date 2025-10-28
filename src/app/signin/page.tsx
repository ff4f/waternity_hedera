"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function getCsrfToken() {
    const response = await fetch('/api/auth/csrf');
    if (!response.ok) {
      throw new Error('Failed to get CSRF token');
    }
    const data = await response.json();
    return data.csrfToken;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      // Get CSRF token first
      const csrfToken = await getCsrfToken();
      
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken
        },
        body: JSON.stringify({ email, password })
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || 'Failed to login');
      }
      const data = await res.json();
      const role: string | undefined = data?.user?.role?.name;
      // Decide redirect based on role
      const target = role === 'ADMIN' ? '/admin'
        : role === 'OPERATOR' ? '/operator'
        : role === 'AGENT' ? '/agent'
        : role === 'INVESTOR' ? '/investor'
        : '/user';
      router.push(target);
    } catch (err: any) {
      setError(err?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-xl border p-6 shadow-sm bg-white">
        <h1 className="text-2xl font-semibold mb-2">Sign In</h1>
        <p className="text-sm text-gray-500 mb-6">Please sign in before connecting your wallet. If you don't have a Hedera account yet, the system will auto-provision one during login.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && (
            <div className="text-red-600 text-sm">{error}</div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-md px-3 py-2"
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
        <div className="mt-4 text-sm">
          Don't have an account?{' '}
          <button className="text-blue-600 hover:underline" onClick={() => router.push('/register')}>Register</button>
        </div>
      </div>
    </div>
  );
}