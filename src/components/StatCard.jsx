import React from "react";

const colorStyles = {
  blue: {
    iconBg: "bg-blue-500/10",
    iconColor: "text-blue-400",
    glow: "bg-blue-500/10",
    ring: "hover:border-blue-500/30",
  },
  green: {
    iconBg: "bg-emerald-500/10",
    iconColor: "text-emerald-400",
    glow: "bg-emerald-500/10",
    ring: "hover:border-emerald-500/30",
  },
  red: {
    iconBg: "bg-red-500/10",
    iconColor: "text-red-400",
    glow: "bg-red-500/10",
    ring: "hover:border-red-500/30",
  },
  purple: {
    iconBg: "bg-purple-500/10",
    iconColor: "text-purple-400",
    glow: "bg-purple-500/10",
    ring: "hover:border-purple-500/30",
  },
};

export default function StatCard({ title, value, icon: Icon, color = "blue", change, prefix = "₹" }) {
  const styles = colorStyles[color] || colorStyles.blue;

  return (
    <div
      className={`relative overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-700/80 ${styles.ring} transition-all duration-300 group`}
    >
      <div
        className={`pointer-events-none absolute -top-10 -right-10 w-28 h-28 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${styles.glow}`}
      />

      <div className="relative flex items-start justify-between mb-3">
        <p className="text-sm text-slate-400 tracking-wide">{title}</p>
        {Icon && (
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${styles.iconBg}`}>
            <Icon className={`w-4.5 h-4.5 ${styles.iconColor}`} />
          </div>
        )}
      </div>

      <p className="relative text-3xl font-bold text-white tracking-tight tabular-nums">
        {prefix}{value}
      </p>

      {change && (
        <p className={`relative text-xs mt-2 ${styles.iconColor}`}>{change}</p>
      )}
    </div>
  );
}