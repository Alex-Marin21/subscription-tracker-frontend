import React, { useState, useEffect } from 'react';
import { CreditCard, Plus, Trash2, LogOut, Lock, Mail, Calendar, DollarSign, Layers, Clock } from 'lucide-react';

interface Subscription {
  id?: number;
  name: string;
  price: number;
  currency: string;
  billingCycle: string;
  nextRenewalDate: string;
  category: string;
}

const API_BASE = 'https://subscription-tracker-backend-jd5g.onrender.com/api';

export default function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [email, setEmail] = useState<string>(localStorage.getItem('userEmail') || '');
  
  const [isRegister, setIsRegister] = useState(false);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');

  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Subscription>({
    name: '',
    price: 0,
    currency: 'USD',
    billingCycle: 'MONTHLY',
    nextRenewalDate: '',
    category: 'Streaming'
  });

  useEffect(() => {
    if (token) {
      fetchSubscriptions();
    }
  }, [token]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    if (isRegister) {
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
      if (!passwordRegex.test(authPassword)) {
        setAuthError('Password must be at least 8 characters long, with an uppercase, a lowercase, and a number.');
        return;
      }
    }

    const endpoint = isRegister ? '/auth/register' : '/auth/login';

    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: authEmail, password: authPassword })
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || 'Authentication failed');
      }

      const data = await res.json();
      localStorage.setItem('token', data.token);
      localStorage.setItem('userEmail', data.email);
      setToken(data.token);
      setEmail(data.email);
    } catch (err: any) {
      setAuthError(err.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userEmail');
    setToken(null);
    setEmail('');
    setSubscriptions([]);
  };

  const fetchSubscriptions = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/subscriptions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSubscriptions(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/subscriptions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        fetchSubscriptions();
        setFormData({ name: '', price: 0, currency: 'USD', billingCycle: 'MONTHLY', nextRenewalDate: '', category: 'Streaming' });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id?: number) => {
    if (!id) return;
    try {
      const res = await fetch(`${API_BASE}/subscriptions/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) fetchSubscriptions();
    } catch (err) {
      console.error(err);
    }
  };

  const totalMonthlySpend = subscriptions.reduce((acc, sub) => {
    const monthlyPrice = sub.billingCycle === 'YEARLY' ? sub.price / 12 : sub.price;
    return acc + monthlyPrice;
  }, 0);

  const upcomingRenewal = subscriptions.length > 0 
    ? [...subscriptions].sort((a, b) => new Date(a.nextRenewalDate).getTime() - new Date(b.nextRenewalDate).getTime())[0]
    : null;

  if (!token) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
        <div className="bg-slate-800 p-8 rounded-xl max-w-md w-full border border-slate-700 shadow-xl">
          <div className="flex items-center justify-center gap-2 mb-6">
            <CreditCard className="w-8 h-8 text-indigo-500" />
            <h1 className="text-2xl font-bold">SubTrack</h1>
          </div>
          <h2 className="text-xl font-semibold mb-4 text-center">
            {isRegister ? 'Create an Account' : 'Welcome Back'}
          </h2>
          {authError && <p className="text-red-400 text-sm mb-4 text-center bg-red-950/50 p-2 rounded border border-red-800/50">{authError}</p>}
          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Email</label>
              <div className="relative">
                <Mail className="w-5 h-5 absolute left-3 top-2.5 text-slate-500" />
                <input
                  type="email"
                  required
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-indigo-500"
                  placeholder="you@example.com"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-5 h-5 absolute left-3 top-2.5 text-slate-500" />
                <input
                  type="password"
                  required
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-indigo-500"
                  placeholder="••••••••"
                />
              </div>
              {isRegister && (
                <p className="text-xs text-slate-500 mt-1">
                  Must be 8+ chars, with 1 uppercase, 1 lowercase, and 1 number.
                </p>
              )}
            </div>
            <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 rounded-lg transition">
              {isRegister ? 'Sign Up' : 'Log In'}
            </button>
          </form>
          <div className="mt-4 text-center">
            <button
              onClick={() => { setIsRegister(!isRegister); setAuthError(''); }}
              className="text-sm text-indigo-400 hover:underline"
            >
              {isRegister ? 'Already have an account? Log In' : "Don't have an account? Sign Up"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <header className="flex justify-between items-center bg-slate-800 p-4 rounded-xl border border-slate-700">
          <div className="flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-indigo-500" />
            <h1 className="text-xl font-bold">SubTrack</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-400">{email}</span>
            <button onClick={handleLogout} className="flex items-center gap-1 bg-slate-700 hover:bg-slate-600 text-sm px-3 py-1.5 rounded-lg transition">
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 font-medium">Estimated Monthly Spend</p>
              <p className="text-2xl font-bold text-emerald-400 mt-1">{totalMonthlySpend.toFixed(2)}</p>
            </div>
            <div className="bg-emerald-950/60 p-3 rounded-lg border border-emerald-800/50">
              <DollarSign className="w-6 h-6 text-emerald-400" />
            </div>
          </div>

          <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 font-medium">Active Subscriptions</p>
              <p className="text-2xl font-bold text-indigo-400 mt-1">{subscriptions.length}</p>
            </div>
            <div className="bg-indigo-950/60 p-3 rounded-lg border border-indigo-800/50">
              <Layers className="w-6 h-6 text-indigo-400" />
            </div>
          </div>

          <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 font-medium">Next Renewal</p>
              <p className="text-sm font-semibold text-slate-200 mt-1">
                {upcomingRenewal ? `${upcomingRenewal.name} (${upcomingRenewal.nextRenewalDate})` : 'None'}
              </p>
            </div>
            <div className="bg-amber-950/60 p-3 rounded-lg border border-amber-800/50">
              <Clock className="w-6 h-6 text-amber-400" />
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-slate-800 p-6 rounded-xl border border-slate-700 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Service Name</label>
            <input
              type="text"
              placeholder="e.g. Netflix, Steam, Spotify"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 p-2 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Price</label>
            <input
              type="number"
              step="0.01"
              placeholder="0.00"
              required
              value={formData.price || ''}
              onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
              className="w-full bg-slate-900 border border-slate-700 p-2 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Currency</label>
            <select
              value={formData.currency}
              onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 p-2 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="RON">RON</option>
            </select>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Billing Cycle</label>
            <select
              value={formData.billingCycle}
              onChange={(e) => setFormData({ ...formData, billingCycle: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 p-2 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="MONTHLY">Monthly</option>
              <option value="YEARLY">Yearly</option>
            </select>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Category</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 p-2 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="Streaming">Streaming</option>
              <option value="Gaming">Gaming</option>
              <option value="Work / Productivity">Work / Productivity</option>
              <option value="Utilities / Software">Utilities / Software</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Renewal Date</label>
            <input
              type="date"
              required
              value={formData.nextRenewalDate}
              onChange={(e) => setFormData({ ...formData, nextRenewalDate: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 p-2 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <button type="submit" className="md:col-span-3 bg-indigo-600 hover:bg-indigo-700 p-2.5 rounded-lg font-medium flex items-center justify-center gap-2 transition">
            <Plus className="w-5 h-5" /> Add Subscription
          </button>
        </form>

        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Your Subscriptions</h2>
          {loading ? (
            <p className="text-slate-400">Loading...</p>
          ) : subscriptions.length === 0 ? (
            <p className="text-slate-400 bg-slate-800/50 p-6 rounded-xl border border-slate-800 text-center">No subscriptions added yet.</p>
          ) : (
            subscriptions.map((sub) => (
              <div key={sub.id} className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex justify-between items-center hover:border-slate-600 transition">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-lg text-white">{sub.name}</h3>
                    <span className="text-xs bg-indigo-950 text-indigo-300 border border-indigo-800/60 px-2.5 py-0.5 rounded-full font-medium">
                      {sub.category || 'Streaming'}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-slate-400">
                    <span className="font-semibold text-emerald-400">
                      {sub.price} {sub.currency} {sub.billingCycle === 'YEARLY' ? '/ yr' : '/ mo'}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      Renews on: {sub.nextRenewalDate}
                    </span>
                  </div>
                </div>
                <button onClick={() => handleDelete(sub.id)} className="text-slate-500 hover:text-red-400 p-2 transition">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
