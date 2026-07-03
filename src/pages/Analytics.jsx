import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { BarChart3, TrendingDown, DollarSign, Target, Download } from 'lucide-react';
import { getAnalytics } from '../services/analyticsService';
import { useAuth } from '../hooks/useAuth';

export default function Analytics() {
  const { user } = useAuth();
  const [categoryData, setCategoryData] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

  // Sort "month" entries chronologically (oldest -> newest), regardless of
  // the order the backend returns them in. Expects a "month" field like
  // "Jul 2026" or an ISO-style "2026-07".
  const sortMonthlyData = (data) => {
    return [...data].sort((a, b) => {
      const dateA = new Date(`1 ${a.month}`);
      const dateB = new Date(`1 ${b.month}`);

      // Fallback for ISO-style "YYYY-MM" strings if "1 <month>" doesn't parse
      const parsedA = isNaN(dateA) ? new Date(a.month) : dateA;
      const parsedB = isNaN(dateB) ? new Date(b.month) : dateB;

      return parsedA - parsedB;
    });
  };

  useEffect(() => {
    if (!user) return;

    const fetchAnalyticsData = async () => {
      try {
        setLoading(true);
        const data = await getAnalytics(user.id);
        setCategoryData(data.categoryData || []);
        setMonthlyData(sortMonthlyData(data.monthlyData || []));
      } catch (err) {
        setError(err.message);
        console.error('Error fetching analytics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalyticsData();
  }, [user]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-800 rounded-2xl h-80 animate-pulse"></div>
          <div className="bg-slate-800 rounded-2xl h-80 animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-700/50 rounded-2xl p-6">
        <p className="text-red-400">Error loading analytics: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <BarChart3 className="w-8 h-8 text-blue-400" />
          <h1 className="text-3xl font-bold text-white">Analytics</h1>
        </div>
        <p className="text-slate-400">Track your spending patterns and insights</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 backdrop-blur-xl border border-slate-700">
          <div className="flex items-center justify-between mb-2">
            <p className="text-slate-400 text-sm">Total Spent</p>
            <TrendingDown className="w-5 h-5 text-red-400" />
          </div>
          <p className="text-2xl font-bold text-white">
            ₹{categoryData.reduce((sum, cat) => sum + (cat.value || 0), 0).toLocaleString()}
          </p>
        </div>

        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 backdrop-blur-xl border border-slate-700">
          <div className="flex items-center justify-between mb-2">
            <p className="text-slate-400 text-sm">Categories</p>
            <Target className="w-5 h-5 text-blue-400" />
          </div>
          <p className="text-2xl font-bold text-white">{categoryData.length}</p>
        </div>

        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 backdrop-blur-xl border border-slate-700">
          <div className="flex items-center justify-between mb-2">
            <p className="text-slate-400 text-sm">Avg Monthly</p>
            <DollarSign className="w-5 h-5 text-green-400" />
          </div>
          <p className="text-2xl font-bold text-white">
            ₹{monthlyData.length > 0
              ? (monthlyData.reduce((sum, month) => sum + (month.expense || 0), 0) / monthlyData.length).toLocaleString()
              : '0'}
          </p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 backdrop-blur-xl border border-slate-700">
          <h2 className="text-xl font-semibold text-white mb-6">Spending by Category</h2>
          <div className="w-full h-80">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: '1px solid #475569',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                    formatter={(value) => `₹${value.toLocaleString()}`}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400">
                No spending data available
              </div>
            )}
          </div>
        </div>

        {/* Line Chart */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 backdrop-blur-xl border border-slate-700">
          <h2 className="text-xl font-semibold text-white mb-6">Monthly Spending Trend</h2>
          <div className="w-full h-80">
            {monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                  <XAxis dataKey="month" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: '1px solid #475569',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                    formatter={(value) => `₹${value.toLocaleString()}`}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="expense"
                    stroke="#ef4444"
                    strokeWidth={2}
                    dot={{ fill: '#ef4444', r: 4 }}
                    activeDot={{ r: 6 }}
                    name="Expenses"
                  />
                  <Line
                    type="monotone"
                    dataKey="income"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ fill: '#10b981', r: 4 }}
                    activeDot={{ r: 6 }}
                    name="Income"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400">
                No monthly data available
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 backdrop-blur-xl border border-slate-700">
        <h2 className="text-xl font-semibold text-white mb-6">Income vs Expense Comparison</h2>
        <div className="w-full h-80">
          {monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                <XAxis dataKey="month" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #475569',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                  formatter={(value) => `₹${value.toLocaleString()}`}
                />
                <Legend />
                <Bar dataKey="income" fill="#10b981" name="Income" radius={[8, 8, 0, 0]} />
                <Bar dataKey="expense" fill="#ef4444" name="Expense" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-400">
              No comparison data available
            </div>
          )}
        </div>
      </div>
    </div>
  );
}