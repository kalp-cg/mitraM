import React from "react";
import { Search, Bell, HelpCircle, HeartHandshake, LogOut } from "lucide-react";

interface HeaderProps {
  currentYear: string;
  searchTerm: string;
  onSearchChange: (val: string) => void;
  onLogout: () => void;
  lastSyncTime?: string;
}

export default function Header({ currentYear, searchTerm, onSearchChange, onLogout, lastSyncTime }: HeaderProps) {
  return (
    <header className="bg-white border-b border-brand-border px-6 py-4 flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center relative z-10 select-none">
      {/* Brand & Devotional Small Header */}
      <div className="flex items-center gap-3">
        {/* Lord Hanuman Avatar Icon */}
        <div className="size-11 bg-gradient-to-br from-[#FF9933] to-[#B3541E] rounded-xl p-1 shadow-md flex items-center justify-center border border-brand-border">
          <svg viewBox="0 0 100 100" className="w-full h-full text-white" fill="currentColor">
            <path d="M 38,40 C 38,28 62,28 62,40 C 62,48 58,54 50,54 C 42,54 38,48 38,40 Z" />
            <polygon points="50,12 55,24 45,24" fill="#FBBF24" />
            <circle cx="50" cy="18" r="2.5" fill="#EF4444" />
            <path d="M 45,43 Q 50,47 55,43" stroke="#2C1810" strokeWidth="2.5" fill="none" />
            <circle cx="34" cy="40" r="3" fill="#FBBF24" />
            <circle cx="66" cy="40" r="3" fill="#FBBF24" />
          </svg>
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <h1 className="text-xl font-bold text-brand-soil font-sans tracking-tight">શુભ વ્યાપાર</h1>
            <span className="text-xs font-semibold bg-brand-wheat text-brand-orange px-2 py-0.5 rounded-full border border-brand-border">ચોપડા પૂજન</span>
          </div>
          <p className="text-xs text-brand-orange/80 font-medium">ડિજિટલ ખાતાવહી પ્લેટફોર્મ</p>
        </div>
      </div>

      {/* Global Search and Actions controls */}
      <div className="flex flex-wrap items-center gap-4 ml-auto">
        {/* Search input field */}
        <div className="relative min-w-[200px] md:min-w-[280px]">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-brand-soil/40">
            <Search className="size-4.5" />
          </span>
          <input
            type="text"
            placeholder="સભ્ય શોધો..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="block w-full pl-9 pr-4 py-2 bg-brand-cream border border-brand-border text-sm rounded-lg focus:ring-1 focus:ring-brand-orange focus:border-brand-orange placeholder:text-brand-soil/40 font-medium text-brand-soil"
          />
        </div>

        {/* Traditional Year Badge */}
        <div className="bg-brand-lightcream text-brand-soil border border-brand-border px-3.5 py-1.5 rounded-lg flex items-center gap-2 shadow-sm font-semibold text-sm">
          <span>📅</span>
          <span>ચાલુ વર્ષ: {currentYear}</span>
        </div>

        {/* Live Auto-Sync Status Indicator */}
        <div className="bg-emerald-50/80 text-emerald-800 border border-emerald-200/60 px-3 py-1.5 rounded-lg flex items-center gap-2 shadow-sm font-semibold text-xs select-none">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
          </span>
          <span>લાઈવ સિંક ચાલુ</span>
          {lastSyncTime && (
            <span className="font-mono text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-200">
              {lastSyncTime}
            </span>
          )}
        </div>

        {/* Control group buttons */}
        <div className="flex items-center gap-1 border-l border-brand-border pl-3">
          {/* Notifications panel toggle button */}
          <button
            title="નોટિફિકેશન"
            className="size-9 bg-brand-cream/50 hover:bg-brand-lightcream transition-all rounded-lg text-brand-soil flex items-center justify-center relative cursor-pointer"
          >
            <Bell className="size-5 shrink-0" />
            <span className="absolute top-1 right-1.5 size-2 bg-red-600 rounded-full animate-ping" />
            <span className="absolute top-1 right-1.5 size-2 bg-red-600 rounded-full" />
          </button>

          {/* Help modal indicator */}
          <button
            title="મદદ અને વિગતો"
            className="size-9 bg-brand-cream/50 hover:bg-brand-lightcream transition-all rounded-lg text-brand-soil flex items-center justify-center cursor-pointer"
          >
            <HelpCircle className="size-5 shrink-0" />
          </button>

          {/* Quick Logout Button */}
          <button
            onClick={onLogout}
            title="લૉગઆઉટ કરો"
            className="size-9 bg-red-50 hover:bg-red-100 transition-all rounded-lg text-red-700 flex items-center justify-center cursor-pointer ml-1"
          >
            <LogOut className="size-5 shrink-0" />
          </button>
        </div>
      </div>
    </header>
  );
}
