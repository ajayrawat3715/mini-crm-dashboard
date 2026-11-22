"use client";

import React from "react";
import { LeadStatus } from "@/types/lead";
import { Search, X, Filter, Download } from "lucide-react";

interface SearchAndFilterProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  statusFilter: LeadStatus | "All";
  onStatusFilterChange: (status: LeadStatus | "All") => void;
  onExportCsv?: () => void;
  leadsCount: number;
  totalLeadsCount: number;
  statusCounts: {
    all: number;
    new: number;
    contacted: number;
    converted: number;
  };
}

export default function SearchAndFilter({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  onExportCsv,
  leadsCount,
  totalLeadsCount,
  statusCounts,
}: SearchAndFilterProps) {
  const filterTabs: { id: LeadStatus | "All"; label: string; count: number }[] = [
    { id: "All", label: "All Leads", count: statusCounts.all },
    { id: "New", label: "New", count: statusCounts.new },
    { id: "Contacted", label: "Contacted", count: statusCounts.contacted },
    { id: "Converted", label: "Converted", count: statusCounts.converted },
  ];

  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3.5">
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Bar */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search leads by name, email, business or phone..."
            className="w-full pl-10 pr-9 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Right side controls: Match Counter + Export CSV */}
        <div className="flex items-center justify-between md:justify-end gap-2.5">
          <div className="text-xs text-slate-500 px-1">
            Showing <span className="font-semibold text-slate-900">{leadsCount}</span> of{" "}
            <span className="font-semibold text-slate-900">{totalLeadsCount}</span>
          </div>

          {onExportCsv && (
            <button
              type="button"
              onClick={onExportCsv}
              disabled={leadsCount === 0}
              title="Export visible leads to CSV"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
          )}
        </div>
      </div>

      {/* Status Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none pt-1 border-t border-slate-100">
        <span className="text-xs font-semibold text-slate-400 mr-1 flex items-center gap-1">
          <Filter className="w-3 h-3" /> Filter:
        </span>
        {filterTabs.map((tab) => {
          const isSelected = statusFilter === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onStatusFilterChange(tab.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 whitespace-nowrap ${
                isSelected
                  ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/20"
                  : "text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200/80"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  isSelected
                    ? "bg-indigo-700/60 text-white"
                    : "bg-slate-200/70 text-slate-600"
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
