import React, { useState, useEffect } from 'react';
import { Plus, Target, TrendingUp, Trash2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import {
  getSavingsGoals,
  createSavingsGoal,
  deleteSavingsGoal,
  addToSavingsGoal,
} from '../services/savingsService';

export default function SavingsGoals() {
  const { user } = useAuth();
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [addFundsGoalId, setAddFundsGoalId] = useState(null);
  const [addFundsAmount, setAddFundsAmount] = useState('');

  const [formData, setFormData] = useState({
    goal_name: '',
    target_amount: '',
    current_amount: '',
    target_date: '',
  });

  const fetchGoals = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const data = await getSavingsGoals(user.id);
      setGoals(data);
    } catch (err) {
      console.error('Error fetching savings goals:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, [user]);

  const handleAddGoal = async (e) => {
    e.preventDefault();
    if (!user) return;

    try {
      setSaving(true);
      setError(null);

      await createSavingsGoal(user.id, {
        goal_name: formData.goal_name,
        target_amount: parseFloat(formData.target_amount),
        current_amount: parseFloat(formData.current_amount || 0),
        target_date: formData.target_date,
      });

      setFormData({ goal_name: '', target_amount: '', current_amount: '', target_date: '' });
      setShowForm(false);
      fetchGoals();
    } catch (err) {
      console.error('Error creating savings goal:', err);
      setError(err.message || 'Failed to create goal');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteGoal = async (id) => {
    try {
      await deleteSavingsGoal(id);
      setGoals(goals.filter((g) => g.id !== id));
    } catch (err) {
      console.error('Error deleting goal:', err);
    }
  };

  const handleAddFunds = async (goalId) => {
    const amount = parseFloat(addFundsAmount);
    if (!amount || amount <= 0) return;

    try {
      await addToSavingsGoal(goalId, amount);
      setAddFundsGoalId(null);
      setAddFundsAmount('');
      fetchGoals();
    } catch (err) {
      console.error('Error adding funds:', err);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-slate-800 rounded-2xl h-40 animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Savings Goals</h1>
        <p className="text-slate-400">Track your financial goals and milestones</p>
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-3">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Add Goal Button */}
      <button
        onClick={() => setShowForm(!showForm)}
        className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
      >
        <Plus className="w-5 h-5" />
        Create New Goal
      </button>

      {/* Add Goal Form */}
      {showForm && (
        <form onSubmit={handleAddGoal} className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 backdrop-blur-xl border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4">Create New Savings Goal</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Goal Name (e.g., Vacation)"
              value={formData.goal_name}
              onChange={(e) => setFormData({ ...formData, goal_name: e.target.value })}
              className="bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
              required
            />
            <input
              type="number"
              placeholder="Target Amount"
              value={formData.target_amount}
              onChange={(e) => setFormData({ ...formData, target_amount: e.target.value })}
              className="bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
              required
            />
            <input
              type="number"
              placeholder="Current Saved Amount"
              value={formData.current_amount}
              onChange={(e) => setFormData({ ...formData, current_amount: e.target.value })}
              className="bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />
            <input
              type="date"
              value={formData.target_date}
              onChange={(e) => setFormData({ ...formData, target_date: e.target.value })}
              className="bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
              required
            />
            <button
              type="submit"
              disabled={saving}
              className="md:col-span-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg px-6 py-2 font-medium transition"
            >
              {saving ? 'Creating...' : 'Create Goal'}
            </button>
          </div>
        </form>
      )}

      {/* Goals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {goals.map((goal) => {
          const progress = (goal.current_amount / goal.target_amount) * 100;
          const daysLeft = goal.target_date
            ? Math.ceil((new Date(goal.target_date) - new Date()) / (1000 * 60 * 60 * 24))
            : null;

          return (
            <div key={goal.id} className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 backdrop-blur-xl border border-slate-700 hover:border-blue-600/50 transition">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-600/20 rounded-lg">
                    <Target className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">{goal.goal_name}</h3>
                    <p className="text-xs text-slate-400">
                      {daysLeft !== null ? `${daysLeft} days left` : 'No deadline'}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDeleteGoal(goal.id)}
                    className="p-2 hover:bg-red-900/20 rounded-lg transition text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-slate-300">Progress</span>
                  <span className="text-sm font-bold text-blue-400">{progress.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500"
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  ></div>
                </div>
              </div>

              {/* Amount Info */}
              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span className="text-slate-400">Saved</span>
                  <span className="text-white font-bold">₹{Number(goal.current_amount).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Target</span>
                  <span className="text-white font-bold">₹{Number(goal.target_amount).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Remaining</span>
                  <span className="text-emerald-400 font-bold">
                    ₹{Math.max(goal.target_amount - goal.current_amount, 0).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Add Funds */}
              {addFundsGoalId === goal.id ? (
                <div className="flex gap-2">
                  <input
                    type="number"
                    autoFocus
                    placeholder="Amount"
                    value={addFundsAmount}
                    onChange={(e) => setAddFundsAmount(e.target.value)}
                    className="flex-1 bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                  />
                  <button
                    onClick={() => handleAddFunds(goal.id)}
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 font-medium transition"
                  >
                    Add
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setAddFundsGoalId(goal.id)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2 font-medium transition flex items-center justify-center gap-2"
                >
                  <TrendingUp className="w-4 h-4" />
                  Add Funds
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {goals.length === 0 && !showForm && (
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-12 text-center backdrop-blur-xl border border-slate-700">
          <Target className="w-12 h-12 text-slate-400 mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-semibold text-white mb-2">No Savings Goals</h3>
          <p className="text-slate-400 mb-6">Create your first savings goal to start tracking your financial milestones</p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
          >
            <Plus className="w-5 h-5" />
            Create Goal
          </button>
        </div>
      )}
    </div>
  );
}