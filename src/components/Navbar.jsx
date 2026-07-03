import React, { useState } from 'react';
import { Bell, LogOut, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Navbar() {
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = () => {
    navigate('/login');
  };

  return (
    <nav className="bg-gradient-to-r from-slate-800 to-slate-900 border-b border-slate-700 px-6 py-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">BudgetPro Dashboard</h1>
        
        <div className="flex items-center gap-4">
          {/* Notification Bell */}
          <button className="p-2 hover:bg-slate-700 rounded-lg transition text-slate-300">
            <Bell className="w-5 h-5" />
          </button>

          {/* Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 px-3 py-2 hover:bg-slate-700 rounded-lg transition text-slate-300"
            >
              <div className="w-8 h-8 rounded-full bg-blue-500"></div>
              <span className="text-sm">Account</span>
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-lg">
                <button
                  onClick={() => navigate('/profile')}
                  className="w-full px-4 py-2 text-left text-sm text-slate-300 hover:bg-slate-700 flex items-center gap-2"
                >
                  <Settings className="w-4 h-4" />
                  Profile
                </button>
                <hr className="border-slate-700" />
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-slate-700 flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}