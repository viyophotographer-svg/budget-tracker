import React, { useState, useEffect } from 'react';
import { TrendingUp } from 'lucide-react';
import { getBudget } from '../services/budgetService';
import { useAuth } from '../hooks/useAuth';

export default function BudgetProgress() {
  const { user } = useAuth();
  const [budget, setBudget] = useState(null);
  const [spent, setSpent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) return;

    const fetchBudgetData = async () => {
      try {
        setLoading(true);
        const data = await getBudget(user.id);
        if (data) {
          setBudget(data.budget);
          setSpent(data.spent || 0);
        }
      } catch (err) {
        setError(err.message);
        console.error('Error fetching budget:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBudgetData();
  }, [user]);

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 backdrop-blur-xl border border-slate-700/80 h-40 flex items-center justify-center">
        <p className="text-slate-400">Loading budget...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gradient-to-br from-red-900/20 to-red-800/20 rounded-2xl p-6 backdrop-blur-xl border border-red-700/50">
        <p className="text-red-400">Error: {error}</p>
      </div>
    );
  }

  const percentage = budget ? (spent / budget) * 100 : 0;
  const remaining = budget ? budget - spent : 0;

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 backdrop-blur-xl border border-slate-700/80 hover:border-slate-600 transition-all duration-300">
      <div className="pointer-events-none absolute -top-16 -left-16 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl" />

      <div className="relative flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2 tracking-tight">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-blue-400" />
          </div>
          Monthly Budget
        </h3>
        <span className="text-sm font-medium text-slate-300 bg-slate-900/60 px-2.5 py-1 rounded-full tabular-nums">
          {percentage.toFixed(0)}%
        </span>
      </div>

      <div className="relative space-y-4">
        <div>
          <div className="flex justify-between mb-2 text-sm">
            <span className="text-slate-300">Budget: ₹{budget?.toLocaleString() || '0'}</span>
            <span className="text-slate-400">Spent: ₹{spent.toLocaleString()}</span>
          </div>
          <div className="w-full bg-slate-900/60 rounded-full h-3 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                percentage > 90
                  ? 'bg-gradient-to-r from-red-500 to-red-600'
                  : percentage > 70
                  ? 'bg-gradient-to-r from-yellow-500 to-orange-500'
                  : 'bg-gradient-to-r from-green-500 to-emerald-500'
              }`}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-900/40 border border-slate-700/50 rounded-xl p-3">
            <p className="text-xs text-slate-400 mb-1">Remaining</p>
            <p className="text-lg font-semibold text-emerald-400 tabular-nums">
              ₹{Math.max(remaining, 0).toLocaleString()}
            </p>
          </div>
          <div className="bg-slate-900/40 border border-slate-700/50 rounded-xl p-3">
            <p className="text-xs text-slate-400 mb-1">Left</p>
            <p className="text-lg font-semibold text-blue-400 tabular-nums">
              {Math.max(100 - percentage, 0).toFixed(1)}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}