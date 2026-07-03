import React from 'react';
import { LayoutDashboard, CreditCard, BarChart3, Target, Settings } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export default function Sidebar() {
  const location = useLocation();

  const navItems = [
    { title: 'Dashboard', icon: LayoutDashboard, path: '/' },
    { title: 'Transactions', icon: CreditCard, path: '/transactions' },
    { title: 'Analytics', icon: BarChart3, path: '/analytics' },
    { title: 'Savings Goals', icon: Target, path: '/savings-goals' },
    { title: 'Settings', icon: Settings, path: '/profile' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <aside className="w-64 bg-gradient-to-b from-slate-800 to-slate-900 border-r border-slate-700 h-screen p-6 fixed hidden md:block">
      {/* Logo */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white">BudgetPro</h2>
        <p className="text-xs text-slate-400">Finance Manager</p>
      </div>

      {/* Navigation */}
      <nav className="space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                active
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.title}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}