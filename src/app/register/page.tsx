"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [roleId, setRoleId] = useState('INVESTOR');
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
      
      const messageId = crypto.randomUUID();
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken
        },
        body: JSON.stringify({ messageId, name, email, password, roleId })
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData?.message || 'Failed to register');
      }
      // Success: redirect to signin page
      router.push('/signin');
    } catch (err: any) {
      setError(err?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-xl border p-6 shadow-sm bg-white">
        <h1 className="text-2xl font-semibold mb-2">Register</h1>
        <p className="text-sm text-gray-500 mb-6">Create a new account. If you don't have a Hedera account yet, the system will auto-provision one during registration or login.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="name">Full Name</label>
            <input
              id="name"
              type="text"
              className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
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
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="role">Role</label>
            <select
              id="role"
              className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={roleId}
              onChange={(e) => setRoleId(e.target.value)}
            >
              <option value="INVESTOR">Investor</option>
              <option value="OPERATOR">Operator</option>
              <option value="AGENT">Agent</option>
              <option value="USER">User</option>
            </select>
          </div>
          {error && (
            <div className="text-red-600 text-sm">{error}</div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-md px-3 py-2"
          >
            {loading ? 'Registering…' : 'Register'}
          </button>
        </form>
        <div className="mt-4 text-sm">
          Already have an account?{' '}
          <button className="text-blue-600 hover:underline" onClick={() => router.push('/signin')}>Sign In</button>
        </div>
      </div>
    </div>
  );
}