/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { User } from './types';
import LandingPage from './components/LandingPage';
import AgentDashboard from './components/AgentDashboard';
import AdminDashboard from './components/AdminDashboard';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user session is persisted in localStorage
    const savedUser = localStorage.getItem('solar_portal_user');
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch (e) {
        console.error('Failed to parse saved user session', e);
        localStorage.removeItem('solar_portal_user');
      }
    }
    setLoading(false);
  }, []);

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('solar_portal_user', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('solar_portal_user');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="mt-4 text-sm text-slate-500 font-semibold">Initializing Solar Installation Portal...</p>
      </div>
    );
  }

  if (!currentUser) {
    return <LandingPage onLoginSuccess={handleLoginSuccess} />;
  }

  if (currentUser.role === 'admin' || currentUser.role === 'view_only_admin') {
    return <AdminDashboard user={currentUser} onLogout={handleLogout} />;
  }

  return <AgentDashboard user={currentUser} onLogout={handleLogout} />;
}

