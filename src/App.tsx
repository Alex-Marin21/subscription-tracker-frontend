import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import './App.css';

interface Subscription {
  id?: number;
  name: string;
  price: number;
  currency: string;
  billingCycle: string;
  nextRenewalDate: string;
  category: string;
}

const API_URL = 'https://subscription-tracker-backend-jd5g.onrender.com/api/subscriptions';

const emptyForm: Subscription = {
  name: '',
  price: 0,
  currency: 'USD',
  billingCycle: 'MONTHLY',
  nextRenewalDate: '',
  category: 'Streaming',
};

const CATEGORY_ICONS: Record<string, string> = {
  Streaming: '🎬',
  Music: '🎵',
  Productivity: '⚙️',
  Gaming: '🎮',
  Fitness: '💪',
  Cloud: '☁️',
  News: '📰',
  Other: '📦',
};

function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

function App() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [formData, setFormData] = useState<Subscription>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSubscriptions = async () => {
    const response = await axios.get<Subscription[]>(API_URL);
    setSubscriptions(response.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId !== null) {
      await axios.put(`${API_URL}/${editingId}`, formData);
    } else {
      await axios.post(API_URL, formData);
    }
    setFormData(emptyForm);
    setEditingId(null);
    fetchSubscriptions();
  };

  const handleEdit = (sub: Subscription) => {
    setFormData({ ...sub });
    setEditingId(sub.id ?? null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setFormData(emptyForm);
    setEditingId(null);
  };

  const handleDelete = async (id?: number) => {
    if (!id) return;
    await axios.delete(`${API_URL}/${id}`);
    if (editingId === id) handleCancelEdit();
    fetchSubscriptions();
  };

  const sortedSubs = useMemo(
    () => [...subscriptions].sort((a, b) => daysUntil(a.nextRenewalDate) - daysUntil(b.nextRenewalDate)),
    [subscriptions]
  );

  const totalsByCurrency = useMemo(() => {
    return subscriptions.reduce<Record<string, number>>((acc, sub) => {
      const monthly = sub.billingCycle === 'YEARLY' ? sub.price / 12 : sub.price;
      acc[sub.currency] = (acc[sub.currency] || 0) + monthly;
      return acc;
    }, {});
  }, [subscriptions]);

  const categoryBreakdown = useMemo(() => {
    return subscriptions.reduce<Record<string, number>>((acc, sub) => {
      const monthly = sub.billingCycle === 'YEARLY' ? sub.price / 12 : sub.price;
      acc[sub.category || 'Other'] = (acc[sub.category || 'Other'] || 0) + monthly;
      return acc;
    }, {});
  }, [subscriptions]);

  const upcomingCount = subscriptions.filter((s) => daysUntil(s.nextRenewalDate) <= 7 && daysUntil(s.nextRenewalDate) >= 0).length;

  const maxCategoryValue = Math.max(...Object.values(categoryBreakdown), 1);

  return (
    <div className="app-container">
      <header className="hero">
        <h1><span className="hero-emoji">💳</span> <span className="hero-text">SubTrack</span></h1>
        <p className="tagline">Never get surprised by a renewal again.</p>
      </header>

      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-label">Active Subscriptions</span>
          <span className="stat-value">{subscriptions.length}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Monthly Spend</span>
          <span className="stat-value">
            {Object.keys(totalsByCurrency).length === 0
              ? '0.00'
              : Object.entries(totalsByCurrency).map(([c, v]) => `${v.toFixed(2)} ${c}`).join(' + ')}
          </span>
        </div>
        <div className={`stat-card ${upcomingCount > 0 ? 'stat-alert' : ''}`}>
          <span className="stat-label">Renewing Soon (7d)</span>
          <span className="stat-value">{upcomingCount}</span>
        </div>
      </div>

      {Object.keys(categoryBreakdown).length > 0 && (
        <div className="category-panel">
          <h3>Spending by Category</h3>
          {Object.entries(categoryBreakdown)
            .sort((a, b) => b[1] - a[1])
            .map(([cat, val]) => (
              <div className="category-row" key={cat}>
                <span className="category-name">
                  {CATEGORY_ICONS[cat] || '📦'} {cat}
                </span>
                <div className="category-bar-track">
                  <div
                    className="category-bar-fill"
                    style={{ width: `${(val / maxCategoryValue) * 100}%` }}
                  />
                </div>
                <span className="category-value">{val.toFixed(2)}</span>
              </div>
            ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="sub-form">
        <h3>{editingId !== null ? '✏️ Edit Subscription' : '➕ Add Subscription'}</h3>
        <div className="form-grid">
          <input
            type="text"
            placeholder="Name (e.g. Netflix)"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <input
            type="number"
            step="0.01"
            placeholder="Price"
            value={formData.price || ''}
            onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
            required
          />
          <select
            value={formData.currency}
            onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
          >
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="RON">RON</option>
          </select>
          <select
            value={formData.billingCycle}
            onChange={(e) => setFormData({ ...formData, billingCycle: e.target.value })}
          >
            <option value="MONTHLY">Monthly</option>
            <option value="YEARLY">Yearly</option>
          </select>
          <input
            type="date"
            value={formData.nextRenewalDate}
            onChange={(e) => setFormData({ ...formData, nextRenewalDate: e.target.value })}
            required
          />
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          >
            {Object.keys(CATEGORY_ICONS).map((cat) => (
              <option key={cat} value={cat}>
                {CATEGORY_ICONS[cat]} {cat}
              </option>
            ))}
          </select>
        </div>
        <div className="form-actions">
          <button type="submit" className="btn-primary">
            {editingId !== null ? 'Update' : 'Add Subscription'}
          </button>
          {editingId !== null && (
            <button type="button" onClick={handleCancelEdit} className="btn-secondary">
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="sub-list">
        {loading ? (
          <p className="empty-state">Loading...</p>
        ) : sortedSubs.length === 0 ? (
          <p className="empty-state">No subscriptions yet. Add your first one above 👆</p>
        ) : (
          sortedSubs.map((sub) => {
            const days = daysUntil(sub.nextRenewalDate);
            const urgent = days <= 3 && days >= 0;
            const soon = days > 3 && days <= 7;
            return (
              <div
                key={sub.id}
                className={`sub-card ${editingId === sub.id ? 'editing' : ''} ${urgent ? 'urgent' : ''}`}
              >
                <div className="sub-icon">{CATEGORY_ICONS[sub.category] || '📦'}</div>
                <div className="sub-info">
                  <strong>{sub.name}</strong>
                  <div className="sub-meta">
                    {sub.price} {sub.currency} · {sub.billingCycle === 'MONTHLY' ? 'monthly' : 'yearly'}
                  </div>
                  <div className={`sub-renewal ${urgent ? 'text-urgent' : soon ? 'text-soon' : ''}`}>
                    {days < 0
                      ? `Overdue by ${Math.abs(days)}d`
                      : days === 0
                      ? 'Renews today!'
                      : `Renews in ${days}d (${sub.nextRenewalDate})`}
                  </div>
                </div>
                <div className="card-actions">
                  <button onClick={() => handleEdit(sub)} className="edit-btn">Edit</button>
                  <button onClick={() => handleDelete(sub.id)} className="delete-btn">✕</button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default App;
