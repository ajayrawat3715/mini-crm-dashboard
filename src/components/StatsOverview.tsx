"use client";

import React from "react";
import { LeadStats } from "@/types/lead";
import { Users, Sparkles, PhoneCall, CheckCircle2, TrendingUp } from "lucide-react";

interface StatsOverviewProps {
  stats: LeadStats;
}

export default function StatsOverview({ stats }: StatsOverviewProps) {
  const cards = [
    {
      label: "Total Leads",
      value: stats.totalLeads,
      description: "All recorded business enquiries",
      icon: Users,
      color: "indigo",
      bgGradient: "from-indigo-500/10 to-indigo-500/5",
      iconBg: "bg-indigo-100 text-indigo-600",
      borderColor: "border-slate-200 hover:border-indigo-300",
      badge: "Active Pipeline",
    },
    {
      label: "New Leads",
      value: stats.newLeads,
      description: "Awaiting first response",
      icon: Sparkles,
      color: "blue",
      bgGradient: "from-blue-500/10 to-blue-500/5",
      iconBg: "bg-blue-100 text-blue-600",
      borderColor: "border-slate-200 hover:border-blue-300",
      badge: `${stats.totalLeads > 0 ? Math.round((stats.newLeads / stats.totalLeads) * 100) : 0}% of pipeline`,
    },
    {
      label: "Contacted",
      value: stats.contactedLeads,
      description: "Follow-ups & discussions underway",
      icon: PhoneCall,
      color: "amber",
      bgGradient: "from-amber-500/10 to-amber-500/5",
      iconBg: "bg-amber-100 text-amber-600",
      borderColor: "border-slate-200 hover:border-amber-300",
      badge: "In Discussion",
    },
    {
      label: "Converted",
      value: stats.convertedLeads,
      description: `${stats.conversionRate}% conversion rate`,
      icon: CheckCircle2,
      color: "emerald",
      bgGradient: "from-emerald-500/10 to-emerald-500/5",
      iconBg: "bg-emerald-100 text-emerald-600",
      borderColor: "border-slate-200 hover:border-emerald-300",
      badge: "Closed Customers",
      showTrend: true,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className={`bg-white p-5 rounded-2xl border ${card.borderColor} shadow-sm hover:shadow-md transition-all duration-200 relative overflow-hidden group`}
          >
            {/* Subtle background glow */}
            <div
              className={`absolute -right-8 -bottom-8 w-24 h-24 rounded-full bg-gradient-to-br ${card.bgGradient} blur-xl group-hover:scale-125 transition-transform duration-300 pointer-events-none`}
            />

            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {card.label}
              </span>
              <div
                className={`w-9 h-9 rounded-xl ${card.iconBg} flex items-center justify-center transition-transform group-hover:scale-110 duration-200`}
              >
                <Icon className="w-4 h-4" />
              </div>
            </div>

            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold tracking-tight text-slate-900">
                {card.value}
              </span>
              {card.showTrend && (
                <span className="inline-flex items-center text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <TrendingUp className="w-3 h-3 mr-0.5" />
                  {stats.conversionRate}% Rate
                </span>
              )}
            </div>

            <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
              <span className="truncate">{card.description}</span>
              <span className="hidden group-hover:inline-block font-medium text-slate-400">
                {card.badge}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
