"use client";

import React from "react";
import { UserPlus, SearchX, Database, RefreshCw } from "lucide-react";

interface EmptyStateProps {
  type: "no-leads" | "no-search-results" | "error";
  onAddLead?: () => void;
  onClearFilters?: () => void;
  onSeedData?: () => void;
  onRetry?: () => void;
  searchQuery?: string;
  statusFilter?: string;
}

export default function EmptyState({
  type,
  onAddLead,
  onClearFilters,
  onSeedData,
  onRetry,
  searchQuery,
  statusFilter,
}: EmptyStateProps) {
  if (type === "no-search-results") {
    return (
      <div className="text-center py-16 px-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
          <SearchX className="w-7 h-7" />
        </div>
        <h3 className="text-base font-semibold text-slate-800">
          No matching leads found
        </h3>
        <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
          {searchQuery && statusFilter && statusFilter !== "All"
            ? `No leads with status "${statusFilter}" match "${searchQuery}".`
            : searchQuery
            ? `No leads found matching your search "${searchQuery}".`
            : `No leads currently have the status "${statusFilter}".`}
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {onClearFilters && (
            <button
              type="button"
              onClick={onClearFilters}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Clear filters
            </button>
          )}
          {onAddLead && (
            <button
              type="button"
              onClick={onAddLead}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Add new lead
            </button>
          )}
        </div>
      </div>
    );
  }

  if (type === "error") {
    return (
      <div className="text-center py-16 px-4 bg-white rounded-2xl border border-rose-200 shadow-sm">
        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-500">
          <RefreshCw className="w-7 h-7" />
        </div>
        <h3 className="text-base font-semibold text-slate-800">
          Failed to load leads
        </h3>
        <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
          We encountered an issue communicating with the database. Please verify your connection or try again.
        </p>
        {onRetry && (
          <div className="mt-6">
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Retry loading
            </button>
          </div>
        )}
      </div>
    );
  }

  // "no-leads" state
  return (
    <div className="text-center py-16 px-4 bg-white rounded-2xl border border-dashed border-slate-300 shadow-sm">
      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
        <UserPlus className="w-8 h-8" />
      </div>
      <h3 className="text-lg font-semibold text-slate-900">
        No leads in your CRM yet
      </h3>
      <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
        Start tracking your business enquiries by adding your first lead, or populate with realistic sample data to explore all features.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        {onAddLead && (
          <button
            type="button"
            onClick={onAddLead}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-sm hover:shadow"
          >
            <UserPlus className="w-4 h-4" />
            Add First Lead
          </button>
        )}
        {onSeedData && (
          <button
            type="button"
            onClick={onSeedData}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
          >
            <Database className="w-4 h-4 text-slate-500" />
            Load Sample Leads
          </button>
        )}
      </div>
    </div>
  );
}
