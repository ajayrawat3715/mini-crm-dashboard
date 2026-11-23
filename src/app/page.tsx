"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Lead, LeadStatus, LeadStats } from "@/types/lead";
import { ToastProvider, useToast } from "@/components/Toast";
import { supabaseClient } from "@/lib/supabase-client";
import Header from "@/components/Header";
import StatsOverview from "@/components/StatsOverview";
import SearchAndFilter from "@/components/SearchAndFilter";
import LeadsTable from "@/components/LeadsTable";
import LeadModal from "@/components/LeadModal";
import DeleteConfirmModal from "@/components/DeleteConfirmModal";
import EmptyState from "@/components/EmptyState";
import { StatsSkeleton, TableSkeleton } from "@/components/SkeletonLoader";

// Helper to normalize Supabase row to Lead model
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRowToLead(row: any): Lead {
  return {
    id: String(row.id),
    name: row.name || "",
    email: row.email || "",
    phone: row.phone || "",
    businessName: row.business_name ?? row.businessName ?? "",
    status: (row.status as LeadStatus) || "New",
    notes: row.notes || undefined,
    createdAt: row.created_at ?? row.createdAt ?? new Date().toISOString(),
    updatedAt: row.updated_at ?? row.updatedAt ?? new Date().toISOString(),
  };
}

function computeStats(allLeads: { status: string }[]): LeadStats {
  const totalLeads = allLeads.length;
  const newLeads = allLeads.filter((l) => l.status === "New").length;
  const contactedLeads = allLeads.filter((l) => l.status === "Contacted").length;
  const convertedLeads = allLeads.filter((l) => l.status === "Converted").length;
  const conversionRate =
    totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0;

  return {
    totalLeads,
    newLeads,
    contactedLeads,
    convertedLeads,
    conversionRate,
  };
}

function DashboardContent() {
  const { success, error: toastError, info } = useToast();

  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<LeadStats>({
    totalLeads: 0,
    newLeads: 0,
    contactedLeads: 0,
    convertedLeads: 0,
    conversionRate: 0,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [databaseProvider, setDatabaseProvider] = useState<"supabase" | "sqlite">("supabase");

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<LeadStatus | "All">("All");

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);

  const [deletingLead, setDeletingLead] = useState<Lead | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);

  // Fetch leads from direct Supabase client or API route fallback
  const fetchLeads = useCallback(
    async (showRefreshIndicator = false) => {
      if (showRefreshIndicator) setIsRefreshing(true);
      setFetchError(null);

      let loaded = false;

      // 1. Direct Supabase browser client (Instant, bypasses serverless hops)
      if (supabaseClient) {
        try {
          const { data, error } = await supabaseClient
            .from("leads")
            .select("*")
            .order("created_at", { ascending: false });

          if (!error && Array.isArray(data)) {
            const mapped = data.map(mapRowToLead);
            setLeads(mapped);
            setStats(computeStats(mapped));
            setDatabaseProvider("supabase");
            loaded = true;
          } else if (error) {
            console.warn("Direct Supabase fetch returned error:", error.message);
          }
        } catch (clientErr) {
          console.warn("Direct Supabase query failed, falling back to API route:", clientErr);
        }
      }

      // 2. Fallback to API route if direct client was blocked
      if (!loaded) {
        try {
          const response = await fetch("/api/leads");
          if (response.ok) {
            const data = await response.json();
            if (data.success && Array.isArray(data.data)) {
              setLeads(data.data);
              if (data.stats) setStats(data.stats);
              if (data.database) setDatabaseProvider(data.database);
              loaded = true;
            }
          }
        } catch (apiErr) {
          console.error("API leads fetch failed:", apiErr);
        }
      }

      if (!loaded) {
        const msg = "Unable to connect to database. Please check your connection.";
        setFetchError(msg);
        toastError("Unable to load leads", msg);
      }

      setIsLoading(false);
      setIsRefreshing(false);
    },
    [toastError]
  );

  // Initial fetch on mount
  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  // Compute status counts for filter tabs
  const statusCounts = useMemo(() => {
    return {
      all: leads.length,
      new: leads.filter((l) => l.status === "New").length,
      contacted: leads.filter((l) => l.status === "Contacted").length,
      converted: leads.filter((l) => l.status === "Converted").length,
    };
  }, [leads]);

  // Filtered leads based on search query and status filter
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      // Status filter
      if (statusFilter !== "All" && lead.status !== statusFilter) {
        return false;
      }

      // Search query filter (matches name, email, business name, or phone)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = lead.name.toLowerCase().includes(q);
        const matchesEmail = lead.email.toLowerCase().includes(q);
        const matchesBusiness = lead.businessName.toLowerCase().includes(q);
        const matchesPhone = lead.phone.toLowerCase().includes(q);
        return matchesName || matchesEmail || matchesBusiness || matchesPhone;
      }

      return true;
    });
  }, [leads, statusFilter, searchQuery]);

  // Handle Add Lead
  const handleOpenAddModal = () => {
    setEditingLead(null);
    setIsModalOpen(true);
  };

  // Handle Edit Lead
  const handleOpenEditModal = (lead: Lead) => {
    setEditingLead(lead);
    setIsModalOpen(true);
  };

  // Handle Form Submission (Create or Update)
  const handleModalSubmit = async (formData: {
    name: string;
    email: string;
    phone: string;
    businessName: string;
    status: LeadStatus;
    notes?: string;
  }): Promise<boolean> => {
    try {
      if (editingLead) {
        let savedLead: Lead | null = null;

        // Try direct Supabase client first
        if (supabaseClient) {
          try {
            const { data, error } = await supabaseClient
              .from("leads")
              .update({
                name: formData.name.trim(),
                email: formData.email.trim().toLowerCase(),
                phone: formData.phone.trim(),
                business_name: formData.businessName.trim(),
                status: formData.status,
                notes: formData.notes?.trim() || null,
                updated_at: new Date().toISOString(),
              })
              .eq("id", editingLead.id)
              .select()
              .single();

            if (!error && data) {
              savedLead = mapRowToLead(data);
            } else if (error) {
              console.warn("Supabase direct update error:", error.message);
            }
          } catch (e) {
            console.warn("Direct Supabase update failed, falling back to API:", e);
          }
        }

        // Fallback to API route
        if (!savedLead) {
          const res = await fetch(`/api/leads/${editingLead.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData),
          });

          const data = await res.json();
          if (!res.ok || !data.success) {
            throw new Error(data.error || "Failed to update lead");
          }
          savedLead = data.data;
        }

        if (savedLead) {
          setLeads((prev) =>
            prev.map((l) => (l.id === editingLead.id ? savedLead! : l))
          );
          success("Lead updated successfully", `${savedLead.name} details have been saved.`);
        }
      } else {
        // Create new lead
        let createdLead: Lead | null = null;

        // Try direct Supabase client first
        if (supabaseClient) {
          try {
            const { data, error } = await supabaseClient
              .from("leads")
              .insert({
                name: formData.name.trim(),
                email: formData.email.trim().toLowerCase(),
                phone: formData.phone.trim(),
                business_name: formData.businessName.trim(),
                status: formData.status || "New",
                notes: formData.notes?.trim() || null,
              })
              .select()
              .single();

            if (!error && data) {
              createdLead = mapRowToLead(data);
            } else if (error) {
              console.warn("Supabase direct insert error:", error.message);
            }
          } catch (e) {
            console.warn("Direct Supabase insert failed, falling back to API:", e);
          }
        }

        // Fallback to API route
        if (!createdLead) {
          const res = await fetch("/api/leads", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData),
          });

          const data = await res.json();
          if (!res.ok || !data.success) {
            throw new Error(data.error || "Failed to create lead");
          }
          createdLead = data.data;
        }

        if (createdLead) {
          setLeads((prev) => [createdLead!, ...prev]);
          success("Lead created successfully", `${createdLead.name} has been added to Supabase.`);
        }
      }

      // Refresh leads & stats
      fetchLeads(false);
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An error occurred";
      toastError(editingLead ? "Update failed" : "Creation failed", msg);
      throw err;
    }
  };

  // Quick inline status change
  const handleQuickStatusChange = async (
    leadId: string,
    newStatus: LeadStatus
  ) => {
    const targetLead = leads.find((l) => l.id === leadId);
    if (!targetLead || targetLead.status === newStatus) return;

    setUpdatingStatusId(leadId);

    // Optimistic UI update
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l))
    );

    try {
      let updated = false;

      // Try direct Supabase client first
      if (supabaseClient) {
        try {
          const { error } = await supabaseClient
            .from("leads")
            .update({ status: newStatus, updated_at: new Date().toISOString() })
            .eq("id", leadId);
          if (!error) updated = true;
        } catch (e) {
          console.warn("Direct Supabase status update error:", e);
        }
      }

      // Fallback to API route
      if (!updated) {
        const res = await fetch(`/api/leads/${leadId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || "Failed to update status");
        }
      }

      success(
        "Status updated",
        `${targetLead.name} marked as "${newStatus}".`
      );
      fetchLeads(false);
    } catch (err: unknown) {
      // Revert optimistic update on failure
      setLeads((prev) =>
        prev.map((l) => (l.id === leadId ? targetLead : l))
      );
      const msg = err instanceof Error ? err.message : "Failed to update status";
      toastError("Status update failed", msg);
    } finally {
      setUpdatingStatusId(null);
    }
  };

  // Delete lead handler
  const handleDeleteConfirm = async () => {
    if (!deletingLead) return;

    setIsDeleting(true);
    try {
      let deleted = false;

      // Try direct Supabase client first
      if (supabaseClient) {
        try {
          const { error } = await supabaseClient
            .from("leads")
            .delete()
            .eq("id", deletingLead.id);
          if (!error) deleted = true;
        } catch (e) {
          console.warn("Direct Supabase delete error:", e);
        }
      }

      // Fallback to API route
      if (!deleted) {
        const res = await fetch(`/api/leads/${deletingLead.id}`, {
          method: "DELETE",
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || "Failed to delete lead");
        }
      }

      setLeads((prev) => prev.filter((l) => l.id !== deletingLead.id));
      success("Lead deleted", `Lead "${deletingLead.name}" has been removed.`);
      setDeletingLead(null);
      fetchLeads(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete lead";
      toastError("Delete failed", msg);
    } finally {
      setIsDeleting(false);
    }
  };

  // Seed / Reset sample leads
  const handleSeedData = async () => {
    info("Seeding data", "Populating database with sample leads...");
    try {
      const res = await fetch("/api/leads/seed", { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to seed demo data");
      }
      success("Demo data loaded", data.message);
      await fetchLeads(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to seed database";
      toastError("Seeding failed", msg);
    }
  };

  // Export filtered leads to CSV
  const handleExportCsv = () => {
    if (filteredLeads.length === 0) return;

    const headers = [
      "ID",
      "Name",
      "Email",
      "Phone",
      "Business Name",
      "Status",
      "Notes",
      "Created At",
    ];

    const rows = filteredLeads.map((lead) => [
      `"${lead.id}"`,
      `"${lead.name.replace(/"/g, '""')}"`,
      `"${lead.email.replace(/"/g, '""')}"`,
      `"${lead.phone.replace(/"/g, '""')}"`,
      `"${lead.businessName.replace(/"/g, '""')}"`,
      `"${lead.status}"`,
      `"${(lead.notes || "").replace(/"/g, '""')}"`,
      `"${lead.createdAt}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `crm-leads-${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    info("Export completed", `Exported ${filteredLeads.length} leads to CSV.`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Navigation Header */}
      <Header
        onAddLead={handleOpenAddModal}
        onSeedData={handleSeedData}
        onRefresh={() => fetchLeads(true)}
        isRefreshing={isRefreshing}
        totalLeads={stats.totalLeads}
        databaseProvider={databaseProvider}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
        {/* Section 1: Stats Overview */}
        <section aria-label="Dashboard Overview">
          {isLoading ? <StatsSkeleton /> : <StatsOverview stats={stats} />}
        </section>

        {/* Section 2: Search, Filters & Action Controls */}
        <section aria-label="Search and Filters">
          <SearchAndFilter
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            onExportCsv={handleExportCsv}
            leadsCount={filteredLeads.length}
            totalLeadsCount={leads.length}
            statusCounts={statusCounts}
          />
        </section>

        {/* Section 3: Leads Content View */}
        <section aria-label="Leads Directory">
          {isLoading ? (
            <TableSkeleton />
          ) : fetchError ? (
            <EmptyState
              type="error"
              onRetry={() => fetchLeads(true)}
            />
          ) : leads.length === 0 ? (
            <EmptyState
              type="no-leads"
              onAddLead={handleOpenAddModal}
              onSeedData={handleSeedData}
            />
          ) : filteredLeads.length === 0 ? (
            <EmptyState
              type="no-search-results"
              searchQuery={searchQuery}
              statusFilter={statusFilter}
              onClearFilters={() => {
                setSearchQuery("");
                setStatusFilter("All");
              }}
              onAddLead={handleOpenAddModal}
            />
          ) : (
            <LeadsTable
              leads={filteredLeads}
              onEdit={handleOpenEditModal}
              onDelete={setDeletingLead}
              onStatusChange={handleQuickStatusChange}
              updatingStatusId={updatingStatusId}
            />
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-auto py-6 border-t border-slate-200/80 bg-white text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>
            SHL Tech Internship &bull; Task 1: Mini CRM Dashboard
          </p>
          <p className="text-slate-400">
            Built with Next.js 15, TypeScript, Tailwind CSS &amp; Prisma SQLite
          </p>
        </div>
      </footer>

      {/* Add / Edit Modal */}
      <LeadModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
        initialData={editingLead}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!deletingLead}
        lead={deletingLead}
        onClose={() => setDeletingLead(null)}
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
      />
    </div>
  );
}

export default function Home() {
  return (
    <ToastProvider>
      <DashboardContent />
    </ToastProvider>
  );
}
