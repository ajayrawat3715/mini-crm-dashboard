"use client";

import React from "react";
import { Lead, LeadStatus } from "@/types/lead";
import StatusBadge from "./StatusBadge";
import {
  Mail,
  Phone,
  Building2,
  Calendar,
  Pencil,
  Trash2,
  FileText,
} from "lucide-react";

interface LeadsTableProps {
  leads: Lead[];
  onEdit: (lead: Lead) => void;
  onDelete: (lead: Lead) => void;
  onStatusChange: (leadId: string, newStatus: LeadStatus) => void;
  updatingStatusId?: string | null;
}

// Generate deterministic avatar gradient from string
function getAvatarColor(name: string) {
  const gradients = [
    "from-blue-500 to-indigo-600",
    "from-violet-500 to-purple-600",
    "from-emerald-500 to-teal-600",
    "from-rose-500 to-pink-600",
    "from-amber-500 to-orange-600",
    "from-cyan-500 to-blue-600",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return gradients[Math.abs(hash) % gradients.length];
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatDate(dateString: string) {
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  } catch {
    return dateString;
  }
}

export default function LeadsTable({
  leads,
  onEdit,
  onDelete,
  onStatusChange,
  updatingStatusId,
}: LeadsTableProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* ================= DESKTOP TABLE VIEW ================= */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <th className="py-3.5 px-5">Lead</th>
              <th className="py-3.5 px-4">Business</th>
              <th className="py-3.5 px-4">Contact</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4">Created</th>
              <th className="py-3.5 px-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {leads.map((lead) => {
              const initials = getInitials(lead.name);
              const gradient = getAvatarColor(lead.name);
              const isUpdating = updatingStatusId === lead.id;

              return (
                <tr
                  key={lead.id}
                  className="hover:bg-slate-50/70 transition-colors duration-150 group"
                >
                  {/* Lead Name & Notes */}
                  <td className="py-4 px-5">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${gradient} flex items-center justify-center text-white text-xs font-bold shadow-sm flex-shrink-0`}
                      >
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                          {lead.name}
                        </div>
                        {lead.notes && (
                          <div
                            className="text-xs text-slate-400 flex items-center gap-1 mt-0.5 max-w-[200px] truncate"
                            title={lead.notes}
                          >
                            <FileText className="w-3 h-3 flex-shrink-0 text-slate-400" />
                            <span className="truncate">{lead.notes}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Business Name */}
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                      <Building2 className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <span className="truncate max-w-[180px]">
                        {lead.businessName}
                      </span>
                    </div>
                  </td>

                  {/* Contact Info (Email & Phone) */}
                  <td className="py-4 px-4">
                    <div className="space-y-1">
                      <a
                        href={`mailto:${lead.email}`}
                        className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-indigo-600 transition-colors truncate max-w-[220px]"
                        title={`Send email to ${lead.email}`}
                      >
                        <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span className="truncate">{lead.email}</span>
                      </a>
                      <a
                        href={`tel:${lead.phone}`}
                        className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-indigo-600 transition-colors"
                        title={`Call ${lead.phone}`}
                      >
                        <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span>{lead.phone}</span>
                      </a>
                    </div>
                  </td>

                  {/* Status Badge with Quick Dropdown */}
                  <td className="py-4 px-4">
                    <StatusBadge
                      status={lead.status}
                      leadId={lead.id}
                      disabled={isUpdating}
                      onStatusChange={(newStatus) =>
                        onStatusChange(lead.id, newStatus)
                      }
                    />
                  </td>

                  {/* Date Created */}
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 whitespace-nowrap">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span>{formatDate(lead.createdAt)}</span>
                    </div>
                  </td>

                  {/* Action Buttons */}
                  <td className="py-4 px-5 text-right whitespace-nowrap">
                    <div className="inline-flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onEdit(lead)}
                        title="Edit lead details"
                        className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(lead)}
                        title="Delete lead"
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ================= MOBILE CARDS VIEW ================= */}
      <div className="block md:hidden divide-y divide-slate-100">
        {leads.map((lead) => {
          const initials = getInitials(lead.name);
          const gradient = getAvatarColor(lead.name);
          const isUpdating = updatingStatusId === lead.id;

          return (
            <div key={lead.id} className="p-4 space-y-3">
              {/* Card Header: Avatar, Name, Status */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${gradient} flex items-center justify-center text-white text-xs font-bold shadow-sm flex-shrink-0`}
                  >
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-semibold text-slate-900 text-sm truncate">
                      {lead.name}
                    </h4>
                    <p className="text-xs text-slate-500 flex items-center gap-1 truncate">
                      <Building2 className="w-3 h-3 text-slate-400 flex-shrink-0" />
                      <span className="truncate">{lead.businessName}</span>
                    </p>
                  </div>
                </div>

                <StatusBadge
                  status={lead.status}
                  leadId={lead.id}
                  disabled={isUpdating}
                  onStatusChange={(newStatus) =>
                    onStatusChange(lead.id, newStatus)
                  }
                />
              </div>

              {/* Contact info links */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 bg-slate-50 p-2.5 rounded-xl text-xs">
                <a
                  href={`mailto:${lead.email}`}
                  className="flex items-center gap-1.5 text-slate-600 hover:text-indigo-600 truncate"
                >
                  <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  <span className="truncate">{lead.email}</span>
                </a>
                <a
                  href={`tel:${lead.phone}`}
                  className="flex items-center gap-1.5 text-slate-600 hover:text-indigo-600"
                >
                  <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  <span>{lead.phone}</span>
                </a>
              </div>

              {lead.notes && (
                <p className="text-xs text-slate-500 bg-slate-50/50 p-2 rounded-lg italic">
                  &ldquo;{lead.notes}&rdquo;
                </p>
              )}

              {/* Card Footer: Date and Actions */}
              <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
                <span className="text-slate-400 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatDate(lead.createdAt)}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onEdit(lead)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                  >
                    <Pencil className="w-3 h-3 text-slate-500" />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(lead)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-3 h-3 text-rose-500" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
