"use client";

import React from "react";

export function StatsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div className="w-20 h-4 bg-slate-200 rounded" />
            <div className="w-9 h-9 bg-slate-100 rounded-xl" />
          </div>
          <div className="w-16 h-8 bg-slate-200 rounded mt-3" />
          <div className="w-28 h-3 bg-slate-100 rounded mt-2" />
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-pulse">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <div className="w-32 h-4 bg-slate-200 rounded" />
        <div className="w-24 h-4 bg-slate-100 rounded" />
      </div>
      <div className="divide-y divide-slate-100">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-200 rounded-full" />
              <div className="space-y-1.5">
                <div className="w-36 h-4 bg-slate-200 rounded" />
                <div className="w-24 h-3 bg-slate-100 rounded" />
              </div>
            </div>
            <div className="hidden sm:block w-32 h-4 bg-slate-100 rounded" />
            <div className="hidden md:block w-40 h-4 bg-slate-100 rounded" />
            <div className="w-20 h-6 bg-slate-200 rounded-full" />
            <div className="flex gap-2">
              <div className="w-8 h-8 bg-slate-100 rounded-lg" />
              <div className="w-8 h-8 bg-slate-100 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
