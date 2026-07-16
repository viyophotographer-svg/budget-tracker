import React, { useState, useEffect } from 'react';
import { User, Mail, Save, LogOut, Wallet } from 'lucide-react';
import { getUserProfile, updateUserProfile } from '../services/authService';
import { getBudget, saveBudget, getBudgetHistory } from '../services/budgetService';
import { supabase } from '../supabase';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    currency: "INR",
    timezone: "Asia/Kolkata",
    financial_goal: 0,
  });
  const [monthlyBudget, setMonthlyBudget] = useState("");
  const [budgetHistory, setBudgetHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingBudget, setSavingBudget] = useState(false);
  const [message, setMessage] = useState(null);
  const [budgetMessage, setBudgetMessage] = useState(null);

  useEffect(() => {
    if (!user) return;

    const fetchProfile = async () => {
      try {
        setLoading(true);
        const profileData = await getUserProfile(user.id);
        if (profileData) {
          setProfile(profileData);
          setFormData({
            full_name: profileData.full_name || "",
            email: profileData.email || user.email || "",
            currency: profileData.currency || "INR",
            timezone: profileData.timezone || "Asia/Kolkata",
            financial_goal: profileData.financial_goal || 0,
          });
        } else {
          setFormData(prev => ({
            ...prev,
            email: user.email || '',
          }));
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
        setFormData(prev => ({
          ...prev,
          email: user.email || '',
        }));
      } finally {
        setLoading(false);
      }
    };

    const fetchBudget = async () => {
      try {
        const data = await getBudget(user.id);
        setMonthlyBudget(data.budget ? String(data.budget) : "");
      } catch (err) {
        console.error('Error fetching budget:', err);
      }
    };

    const fetchBudgetHistory = async () => {
      try {
        setHistoryLoading(true);
        const history = await getBudgetHistory(user.id);

        // For each past budget entry, compute how much was actually spent that month
        const withSpent = await Promise.all(
          history.map(async (entry) => {
            const start = `${entry.month_year}-01`;
            const endDate = new Date(`${entry.month_year}-01`);
            endDate.setMonth(endDate.getMonth() + 1);
            const end = endDate.toISOString().slice(0, 7) + "-01";

            const { data: transactions, error } = await supabase
              .from("transactions")
              .select("amount")
              .eq("user_id", user.id)
              .eq("type", "expense")
              .gte("transaction_date", start)
              .lt("transaction_date", end);

            if (error) {
              console.error("Error fetching spend for", entry.month_year, error);
            }

            const spent = (transactions || []).reduce(
              (sum, t) => sum + Number(t.amount),
              0
            );

            return {
              ...entry,
              spent,
            };
          })
        );

        setBudgetHistory(withSpent);
      } catch (err) {
        console.error('Error fetching budget history:', err);
      } finally {
        setHistoryLoading(false);
      }
    };

    fetchProfile();
    fetchBudget();
    fetchBudgetHistory();
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!user) return;

    try {
      setSaving(true);
      setMessage(null);

      await updateUserProfile(user.id, {
        full_name: formData.full_name,
        currency: formData.currency,
        timezone: formData.timezone,
        financial_goal: formData.financial_goal,
      });

      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to update profile' });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveBudget = async (e) => {
    e.preventDefault();
    if (!user) return;

    const amount = parseFloat(monthlyBudget);
    if (isNaN(amount) || amount < 0) {
      setBudgetMessage({ type: 'error', text: 'Enter a valid budget amount' });
      return;
    }

    try {
      setSavingBudget(true);
      setBudgetMessage(null);

      await saveBudget(user.id, amount);

      setBudgetMessage({ type: 'success', text: 'Monthly budget updated!' });
      setTimeout(() => setBudgetMessage(null), 3000);

      // Refresh history so the current month's entry reflects the new amount
      const history = await getBudgetHistory(user.id);
      setBudgetHistory((prev) =>
        history.map((entry) => {
          const existing = prev.find((p) => p.month_year === entry.month_year);
          return { ...entry, spent: existing?.spent ?? 0 };
        })
      );
    } catch (err) {
      setBudgetMessage({ type: 'error', text: err.message || 'Failed to update budget' });
    } finally {
      setSavingBudget(false);
    }
  };

  const formatMonthYear = (monthYear) => {
    const date = new Date(`${monthYear}-01`);
    return date.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Error logging out:', err);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="bg-slate-800 rounded-2xl h-96"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <User className="w-8 h-8 text-blue-400" />
          <h1 className="text-3xl font-bold text-white">Profile Settings</h1>
        </div>
        <p className="text-slate-400">Manage your account and preferences</p>
      </div>

      {/* Messages */}
      {message && (
        <div className={`rounded-2xl p-4 backdrop-blur-xl border ${
          message.type === 'success'
            ? 'bg-green-900/20 border-green-700/50 text-green-400'
            : 'bg-red-900/20 border-red-700/50 text-red-400'
        }`}>
          {message.text}
        </div>
      )}

      {/* Profile Form */}
      <form onSubmit={handleSaveProfile} className="space-y-6">

        {/* Profile Card */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 backdrop-blur-xl border border-slate-700">

          <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <User className="w-5 h-5 text-blue-400" />
            Personal Information
          </h2>

          <div className="space-y-5">

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Full Name
              </label>

              <input
                type="text"
                name="full_name"
                value={formData.full_name || ""}
                onChange={handleInputChange}
                placeholder="Enter your full name"
                className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email Address
              </label>

              <input
                type="email"
                value={formData.email || ""}
                disabled
                className="w-full bg-slate-700/30 border border-slate-600 rounded-lg px-4 py-3 text-slate-400 cursor-not-allowed opacity-60"
              />

              <p className="text-xs text-slate-400 mt-1">
                Email cannot be changed
              </p>
            </div>

            {/* Currency */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Currency
              </label>

              <select
                name="currency"
                value={formData.currency || "INR"}
                onChange={handleInputChange}
                className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 text-white"
              >
                <option value="INR">Indian Rupee (₹)</option>
              
              </select>
            </div>

          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">

          <button
            type="submit"
            disabled={saving}
            className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2"
          >
            <Save className="w-5 h-5" />
            {saving ? "Saving..." : "Save Changes"}
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="flex-1 bg-gradient-to-r from-red-600/20 to-red-700/20 border border-red-600/30 text-red-400 font-semibold py-3 rounded-lg flex items-center justify-center gap-2"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>

        </div>

      </form>

      {/* Monthly Budget Card */}
      <form onSubmit={handleSaveBudget} className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 backdrop-blur-xl border border-slate-700 space-y-5">
        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
          <Wallet className="w-5 h-5 text-emerald-400" />
          Monthly Budget
        </h2>

        {budgetMessage && (
          <div className={`rounded-lg p-3 border ${
            budgetMessage.type === 'success'
              ? 'bg-green-900/20 border-green-700/50 text-green-400'
              : 'bg-red-900/20 border-red-700/50 text-red-400'
          }`}>
            <p className="text-sm">{budgetMessage.text}</p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Set this month's spending limit
          </label>
          <input
            type="number"
            min="0"
            value={monthlyBudget}
            onChange={(e) => setMonthlyBudget(e.target.value)}
            placeholder="e.g. 20000"
            className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition"
          />
          <p className="text-xs text-slate-400 mt-1">
            This updates the Monthly Budget card on your Dashboard.
          </p>
        </div>

        <button
          type="submit"
          disabled={savingBudget}
          className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2"
        >
          <Save className="w-5 h-5" />
          {savingBudget ? "Saving..." : "Save Budget"}
        </button>
      </form>

      {/* Budget History */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 backdrop-blur-xl border border-slate-700">
        <h2 className="text-xl font-semibold text-white mb-6">
          Budget History
        </h2>

        {historyLoading ? (
          <p className="text-slate-400 text-sm">Loading history...</p>
        ) : budgetHistory.length === 0 ? (
          <p className="text-slate-400 text-sm">No past budgets yet.</p>
        ) : (
          <div className="space-y-3">
            {budgetHistory.map((entry) => {
              const percentage = entry.monthly_limit > 0
                ? (entry.spent / entry.monthly_limit) * 100
                : 0;
              const overBudget = entry.spent > entry.monthly_limit;

              return (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-4 bg-slate-900/40 border border-slate-700/50 rounded-xl"
                >
                  <div>
                    <p className="text-white font-medium">
                      {formatMonthYear(entry.month_year)}
                    </p>
                    <p className="text-xs text-slate-400">
                      Budget: ₹{Number(entry.monthly_limit).toLocaleString()} · Spent: ₹{entry.spent.toLocaleString()}
                    </p>
                  </div>
                  <span
                    className={`text-sm font-semibold px-3 py-1 rounded-full ${
                      overBudget
                        ? "bg-red-900/30 text-red-400"
                        : "bg-emerald-900/30 text-emerald-400"
                    }`}
                  >
                    {percentage.toFixed(0)}%
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Account Info */}
      <div className="bg-slate-700/30 border border-slate-600 rounded-2xl p-6">

        <h3 className="text-sm font-semibold text-slate-300 mb-3">
          Account Information
        </h3>

        <div className="space-y-2 text-sm text-slate-400">

          <p>
            User ID:
            <span className="text-slate-300 font-mono">
              {" "}
              {user?.id?.substring(0, 12)}...
            </span>
          </p>

          <p>
            Account Type:
            <span className="text-slate-300"> Free User</span>
          </p>

          {profile?.created_at && (
            <p>
              Member Since:
              <span className="text-slate-300">
                {" "}
                {new Date(profile.created_at).toLocaleDateString()}
              </span>
            </p>
          )}

        </div>

      </div>

    </div>
  );
}