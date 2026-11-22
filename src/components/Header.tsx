"use client";

import React from "react";
import { UserPlus, Database, RefreshCw, BarChart3 } from "lucide-react";

interface HeaderProps {
  onAddLead: () => void;
  onSeedData: () => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
  totalLeads: number;
}

export default function Header({
  onAddLead,
  onSeedData,
  onRefresh,
  isRefreshing = false,
  totalLeads,
}: HeaderProps) {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-20 backdrop-blur-md bg-white/95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-4">
          {/* Logo & App Branding */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 ring-2 ring-indigo-500/10">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900">
                  Mini CRM
                </h1>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  SHL Task 1
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                Lead Management & Enquiry Tracking Dashboard
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Refresh Button */}
            <button
              type="button"
              onClick={onRefresh}
              disabled={isRefreshing}
              title="Refresh leads list"
              className="p-2 sm:px-3 sm:py-2 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all duration-150 flex items-center gap-1.5 active:scale-95 disabled:opacity-60"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-indigo-600" : ""}`}
              />
              <span className="hidden md:inline">Refresh</span>
            </button>

            {/* Seed Demo Data Button */}
            <button
              type="button"
              onClick={onSeedData}
              title="Reset or populate realistic sample leads for demonstration"
              className="p-2 sm:px-3 sm:py-2 text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 rounded-xl transition-all duration-150 flex items-center gap-1.5 active:scale-95"
            >
              <Database className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden sm:inline">
                {totalLeads === 0 ? "Load Demo Leads" : "Reset Demo Data"}
              </span>
            </button>

            {/* Add Lead Primary Button */}
            <button
              type="button"
              onClick={onAddLead}
              className="px-3.5 py-2 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl shadow-sm hover:shadow transition-all duration-150 flex items-center gap-2 active:scale-95"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Lead</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
