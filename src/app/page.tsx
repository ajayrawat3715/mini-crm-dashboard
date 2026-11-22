"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Lead, LeadStatus, LeadStats } from "@/types/lead";
import { ToastProvider, useToast } from "@/components/Toast";
import Header from "@/components/Header";
import StatsOverview from "@/components/StatsOverview";
import SearchAndFilter from "@/components/SearchAndFilter";
import LeadsTable from "@/components/LeadsTable";
import LeadModal from "@/components/LeadModal";
import DeleteConfirmModal from "@/components/DeleteConfirmModal";
import EmptyState from "@/components/EmptyState";
import { StatsSkeleton, TableSkeleton } from "@/components/SkeletonLoader";

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
  const [databaseProvider, setDatabaseProvider] = useState<"supabase" | "sqlite">("sqlite");

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<LeadStatus | "All">("All");

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);

  const [deletingLead, setDeletingLead] = useState<Lead | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);

  // Fetch leads from backend API
  const fetchLeads = useCallback(
    async (showRefreshIndicator = false) => {
      if (showRefreshIndicator) setIsRefreshing(true);
      setFetchError(null);

      try {
        const response = await fetch("/api/leads");
        if (!response.ok) {
          throw new Error(`Server returned HTTP ${response.status}`);
        }

        const data = await response.json();
        if (data.success) {
          setLeads(data.data || []);
          if (data.stats) {
            setStats(data.stats);
          }
          if (data.database) {
            setDatabaseProvider(data.database);
          }
        } else {
          throw new Error(data.error || "Failed to load leads");
        }
      } catch (err: unknown) {
        console.error("Fetch error:", err);
        const msg = err instanceof Error ? err.message : "Failed to load leads";
        setFetchError(msg);
        toastError("Unable to load leads", msg);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
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
        // Update existing lead
        const res = await fetch(`/api/leads/${editingLead.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || "Failed to update lead");
        }

        // Optimistically update local state
        setLeads((prev) =>
          prev.map((l) => (l.id === editingLead.id ? data.data : l))
        );
        success("Lead updated successfully", `${data.data.name} details have been saved.`);
      } else {
        // Create new lead
        const res = await fetch("/api/leads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || "Failed to create lead");
        }

        // Add to local state
        setLeads((prev) => [data.data, ...prev]);
        success("Lead created successfully", `${data.data.name} has been added to your CRM.`);
      }

      // Refresh stats from backend
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
      const res = await fetch(`/api/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to update status");
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
      const res = await fetch(`/api/leads/${deletingLead.id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to delete lead");
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
