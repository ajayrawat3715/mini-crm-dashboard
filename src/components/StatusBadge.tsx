"use client";

import React, { useState, useRef, useEffect } from "react";
import { LeadStatus } from "@/types/lead";
import { ChevronDown, Check, Sparkles, PhoneCall, CheckCircle2 } from "lucide-react";

interface StatusBadgeProps {
  status: LeadStatus;
  leadId?: string;
  onStatusChange?: (newStatus: LeadStatus) => void;
  disabled?: boolean;
  interactive?: boolean;
}

export const statusConfig: Record<
  LeadStatus,
  {
    label: string;
    bg: string;
    text: string;
    border: string;
    dot: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  New: {
    label: "New",
    bg: "bg-blue-50 hover:bg-blue-100/80",
    text: "text-blue-700",
    border: "border-blue-200",
    dot: "bg-blue-500",
    icon: Sparkles,
  },
  Contacted: {
    label: "Contacted",
    bg: "bg-amber-50 hover:bg-amber-100/80",
    text: "text-amber-800",
    border: "border-amber-200",
    dot: "bg-amber-500",
    icon: PhoneCall,
  },
  Converted: {
    label: "Converted",
    bg: "bg-emerald-50 hover:bg-emerald-100/80",
    text: "text-emerald-800",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
    icon: CheckCircle2,
  },
};

export default function StatusBadge({
  status,
  onStatusChange,
  disabled = false,
  interactive = true,
}: StatusBadgeProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const config = statusConfig[status] || statusConfig.New;
  const IconComponent = config.icon;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  if (!interactive || !onStatusChange) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${config.bg} ${config.text} ${config.border}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
        <IconComponent className="w-3 h-3" />
        {config.label}
      </span>
    );
  }

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        title="Click to quickly change status"
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 active:scale-95 ${
          config.bg
        } ${config.text} ${config.border} ${
          disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"
        }`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
        <IconComponent className="w-3 h-3" />
        <span>{config.label}</span>
        <ChevronDown
          className={`w-3 h-3 transition-transform duration-150 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-1.5 w-36 rounded-xl bg-white shadow-xl ring-1 ring-slate-900/10 z-30 p-1 animate-fade-in">
          {(["New", "Contacted", "Converted"] as LeadStatus[]).map((option) => {
            const optConfig = statusConfig[option];
            const isSelected = option === status;
            return (
              <button
                key={option}
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  if (option !== status) {
                    onStatusChange(option);
                  }
                }}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  isSelected
                    ? "bg-slate-100 text-slate-900 font-semibold"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${optConfig.dot}`} />
                  {optConfig.label}
                </span>
                {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
