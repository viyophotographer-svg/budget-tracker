import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  TrendingUp,
  TrendingDown,
  Target,
  Wallet,
  Plus,
  X,
} from "lucide-react";

import { useAuth } from "../hooks/useAuth";
import { supabase } from "../supabase";
import { createTransaction } from "../services/transactionService";
import { getSavingsGoals } from "../services/savingsService";
import { getUserProfile } from "../services/authService";
import { getBudget } from "../services/budgetService";
import BudgetProgress from "../components/BudgetProgress";
import StatCard from "../components/StatCard";

// Quick-add modal for creating a transaction without leaving the Dashboard
function QuickAddTransactionModal({ onClose, onSaved, userId }) {
  const [formData, setFormData] = useState({
    notes: "",
    amount: "",
    category: "Food",
    type: "expense",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userId) return;

    try {
      setSaving(true);
      setError(null);

      await createTransaction(userId, {
        notes: formData.notes,
        amount: Number(formData.amount),
        category: formData.category,
        type: formData.type,
      });

      onSaved?.();
      onClose();
    } catch (err) {
      setError(err.message || "Failed to save transaction");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-gradient-to-b from-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-700/80 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.6)] space-y-5"
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white tracking-tight">
              Add Transaction
            </h3>
            <p className="text-sm text-slate-400">
              Log an expense or income entry
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white transition rounded-lg p-1.5 hover:bg-slate-700/60"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-3">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <div>
          <label className="block text-sm text-slate-300 mb-2">Notes</label>
          <textarea
            value={formData.notes}
            onChange={(e) =>
              setFormData({ ...formData, notes: e.target.value })
            }
            className="w-full bg-slate-900/60 border border-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-lg p-3 text-white outline-none transition"
            placeholder="Enter transaction notes..."
            rows={2}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-slate-300 mb-2">
              Amount
            </label>
            <input
              type="number"
              value={formData.amount}
              onChange={(e) =>
                setFormData({ ...formData, amount: e.target.value })
              }
              className="w-full bg-slate-900/60 border border-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-lg p-3 text-white outline-none transition"
              placeholder="0.00"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-2">Type</label>
            <select
              value={formData.type}
              onChange={(e) =>
                setFormData({ ...formData, type: e.target.value })
              }
              className="w-full bg-slate-900/60 border border-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-lg p-3 text-white outline-none transition"
            >
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm text-slate-300 mb-2">
            Category
          </label>
          <select
            value={formData.category}
            onChange={(e) =>
              setFormData({ ...formData, category: e.target.value })
            }
            className="w-full bg-slate-900/60 border border-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-lg p-3 text-white outline-none transition"
          >
            <option value="Food">Food</option>
            <option value="Transport">Transport</option>
            <option value="Shopping">Shopping</option>
            <option value="Bills">Bills</option>
            <option value="Salary">Salary</option>
            <option value="Entertainment">Entertainment</option>
            <option value="Healthcare">Healthcare</option>
            <option value="Education">Education</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 disabled:opacity-50 rounded-lg py-3 text-white font-semibold transition shadow-[0_8px_24px_-8px_rgba(59,130,246,0.6)]"
        >
          {saving ? "Saving..." : "Save Transaction"}
        </button>
      </form>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [displayName, setDisplayName] = useState("");

  const [stats, setStats] = useState({
    totalBalance: 0,
    totalIncome: 0,
    totalExpenses: 0,
    savingsGoals: 0,
  });

  const [recentTransactions, setRecentTransactions] = useState([]);

  const formatRelativeDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.setHours(0, 0, 0, 0) - new Date(date).setHours(0, 0, 0, 0);
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    return `${diffDays} days ago`;
  };

  const fetchStats = async () => {
    if (!user) return;

    try {
      // Only count transactions from the current calendar month, to match
      // the Monthly Budget card's scope.
      const now = new Date();
      const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      const monthEnd = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, "0")}-01`;

      const { data, error } = await supabase
        .from("transactions")
        .select("amount, type")
        .eq("user_id", user.id)
        .gte("transaction_date", monthStart)
        .lt("transaction_date", monthEnd);

      if (error) throw error;

      const transactionIncome = (data || [])
        .filter((t) => t.type === "income")
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const totalExpenses = (data || [])
        .filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + Number(t.amount), 0);

      // Include this month's budget allocation as part of income/balance,
      // in addition to actual income transactions.
      let budgetAmount = 0;
      try {
        const budgetData = await getBudget(user.id);
        budgetAmount = budgetData?.budget || 0;
      } catch (budgetErr) {
        console.error("Error fetching budget for stats:", budgetErr);
      }

      const totalIncome = transactionIncome + budgetAmount;

      setStats((prev) => ({
        ...prev,
        totalIncome,
        totalExpenses,
        totalBalance: totalIncome - totalExpenses,
      }));
    } catch (err) {
      console.error("Error fetching dashboard stats:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDisplayName = async () => {
    if (!user) return;

    try {
      const profile = await getUserProfile(user.id);
      setDisplayName(profile?.full_name || user.email?.split("@")[0] || "");
    } catch (err) {
      console.error("Error fetching profile name:", err);
      setDisplayName(user.email?.split("@")[0] || "");
    }
  };

  const fetchSavingsGoalsCount = async () => {
    if (!user) return;

    try {
      const goals = await getSavingsGoals(user.id);
      setStats((prev) => ({
        ...prev,
        savingsGoals: goals.length,
      }));
    } catch (err) {
      console.error("Error fetching savings goals count:", err);
    }
  };

  const fetchRecentTransactions = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("transaction_date", { ascending: false })
        .limit(5);

      if (error) throw error;

      setRecentTransactions(data || []);
    } catch (err) {
      console.error("Error fetching recent transactions:", err);
    }
  };

  useEffect(() => {
    if (!user) return;

    fetchStats();
    fetchRecentTransactions();
    fetchSavingsGoalsCount();
    fetchDisplayName();

    const profileChannel = supabase
      .channel("dashboard-profile")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${user.id}`,
        },
        () => {
          fetchDisplayName();
        }
      )
      .subscribe();

    const budgetChannel = supabase
      .channel("dashboard-budget")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "budgets",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchStats();
        }
      )
      .subscribe();

    const transactionsChannel = supabase
      .channel("dashboard-transactions")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "transactions",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchStats();
          fetchRecentTransactions();
        }
      )
      .subscribe();

    const savingsChannel = supabase
      .channel("dashboard-savings-goals")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "savings_goals",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchSavingsGoalsCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(transactionsChannel);
      supabase.removeChannel(savingsChannel);
      supabase.removeChannel(profileChannel);
      supabase.removeChannel(budgetChannel);
    };
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="mb-8 flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
            Welcome back, {displayName || user?.email?.split("@")[0]}! 👋
          </h1>
          <p className="text-slate-400">
            Here's your financial overview
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

        <StatCard
          title="This Month's Balance"
          value={stats.totalBalance.toLocaleString()}
          icon={Wallet}
          color="blue"
        />

        <StatCard
          title="This Month's Income"
          value={stats.totalIncome.toLocaleString()}
          icon={TrendingUp}
          color="green"
        />

        <StatCard
          title="This Month's Expenses"
          value={stats.totalExpenses.toLocaleString()}
          icon={TrendingDown}
          color="red"
        />

        <StatCard
          title="Savings Goals"
          value={stats.savingsGoals}
          icon={Target}
          color="purple"
          change="Active"
          prefix=""
        />

      </div>


      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Budget Progress */}
        <div className="lg:col-span-2">
          <BudgetProgress />
        </div>


        {/* Quick Actions */}
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-700/80 shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset]">
          <div className="pointer-events-none absolute -top-16 -right-16 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl" />

          <h3 className="text-lg font-semibold text-white mb-4 tracking-tight">
            Quick Actions
          </h3>

          <div className="space-y-3 relative">

            <button
              onClick={() => setShowQuickAdd(true)}
              className="w-full flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 rounded-lg text-white font-medium transition shadow-[0_8px_20px_-8px_rgba(59,130,246,0.55)]"
            >
              <Plus className="w-5 h-5" />
              Add Transaction
            </button>

            <button
              onClick={() => navigate("/savings-goals")}
              className="w-full flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 rounded-lg text-white font-medium transition shadow-[0_8px_20px_-8px_rgba(168,85,247,0.55)]"
            >
              <Target className="w-5 h-5" />
              New Savings Goal
            </button>

            <button
              onClick={() => navigate("/analytics")}
              className="w-full flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 rounded-lg text-white font-medium transition shadow-[0_8px_20px_-8px_rgba(16,185,129,0.55)]"
            >
              <Wallet className="w-5 h-5" />
              View Budget
            </button>

          </div>

        </div>

      </div>

      {/* Recent Transactions */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-700/80">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white tracking-tight">
            Recent Transactions
          </h3>

          <Link
            to="/transactions"
            className="text-blue-400 hover:text-blue-300 text-sm font-medium transition"
          >
            View All →
          </Link>
        </div>

        <div className="space-y-3">
          {recentTransactions.length > 0 ? (
            recentTransactions.map((trans) => (
              <div
                key={trans.id}
                className="flex items-center justify-between p-4 bg-slate-900/40 hover:bg-slate-900/70 border border-transparent hover:border-slate-700 rounded-xl transition"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center ${
                      trans.type === "income"
                        ? "bg-green-500/10"
                        : "bg-red-500/10"
                    }`}
                  >
                    {trans.type === "income" ? (
                      <TrendingUp className="w-4 h-4 text-green-400" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-400" />
                    )}
                  </div>
                  <div>
                    <p className="text-white font-medium">
                      {trans.notes}
                    </p>
                    <p className="text-xs text-slate-400">
                      {formatRelativeDate(trans.transaction_date)}
                    </p>
                  </div>
                </div>

                <p
                  className={`font-semibold tabular-nums ${
                    trans.type === "income"
                      ? "text-green-400"
                      : "text-red-400"
                  }`}
                >
                  {trans.type === "income" ? "+" : "-"}₹
                  {Number(trans.amount).toLocaleString()}
                </p>
              </div>
            ))
          ) : (
            <p className="text-center py-6 text-slate-400">
              No transactions yet
            </p>
          )}
        </div>
      </div>

      {showQuickAdd && (
        <QuickAddTransactionModal
          userId={user?.id}
          onClose={() => setShowQuickAdd(false)}
          onSaved={() => {
            fetchStats();
            fetchRecentTransactions();
          }}
        />
      )}

    </div>
  );
}