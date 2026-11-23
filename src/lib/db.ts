import prisma from "@/lib/prisma";
import { supabaseServer, isSupabaseConfigured } from "@/lib/supabase";
import { Lead, LeadStatus, LeadStats } from "@/types/lead";
import { SAMPLE_LEADS } from "@/lib/seed-data";

export type DatabaseProvider = "supabase" | "sqlite";

export function getActiveDatabaseProvider(): DatabaseProvider {
  return isSupabaseConfigured ? "supabase" : "sqlite";
}

// Helper to convert Supabase snake_case row to Lead model
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapSupabaseRowToLead(row: any): Lead {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    businessName: row.business_name ?? row.businessName,
    status: row.status as LeadStatus,
    notes: row.notes,
    createdAt: row.created_at ?? row.createdAt,
    updatedAt: row.updated_at ?? row.updatedAt,
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

// ==========================================
// 1. Fetch leads & stats
// ==========================================
export async function getLeads(
  search = "",
  status = ""
): Promise<{ leads: Lead[]; stats: LeadStats; provider: DatabaseProvider }> {
  // -------- SUPABASE (Primary Cloud Database) --------
  if (supabaseServer) {
    let query = supabaseServer
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false });

    if (status && status !== "All") {
      query = query.eq("status", status);
    }

    if (search) {
      query = query.or(
        `name.ilike.%${search}%,email.ilike.%${search}%,business_name.ilike.%${search}%,phone.ilike.%${search}%`
      );
    }

    const [filteredRes, allRes] = await Promise.all([
      query,
      supabaseServer.from("leads").select("status"),
    ]);

    if (filteredRes.error) {
      console.error("Supabase getLeads error:", filteredRes.error);
      throw new Error(`Supabase query failed: ${filteredRes.error.message}`);
    }
    if (allRes.error) {
      console.error("Supabase count error:", allRes.error);
      throw new Error(`Supabase stats failed: ${allRes.error.message}`);
    }

    const leads: Lead[] = (filteredRes.data || []).map(mapSupabaseRowToLead);
    const allLeads = allRes.data || [];
    const stats = computeStats(allLeads);

    return { leads, stats, provider: "supabase" };
  }

  // -------- SQLITE FALLBACK --------
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};
  if (status && status !== "All") where.status = status;
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { email: { contains: search } },
      { businessName: { contains: search } },
      { phone: { contains: search } },
    ];
  }

  const [prismaLeads, allPrismaLeads] = await Promise.all([
    prisma.lead.findMany({ where, orderBy: { createdAt: "desc" } }),
    prisma.lead.findMany({ select: { status: true } }),
  ]);

  const leads: Lead[] = prismaLeads.map((l) => ({
    ...l,
    status: l.status as LeadStatus,
    createdAt: l.createdAt.toISOString(),
    updatedAt: l.updatedAt.toISOString(),
  }));

  const stats = computeStats(allPrismaLeads);
  return { leads, stats, provider: "sqlite" };
}

// ==========================================
// 2. Fetch single lead
// ==========================================
export async function getLeadById(id: string): Promise<Lead | null> {
  if (supabaseServer) {
    const { data, error } = await supabaseServer
      .from("leads")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) return null;
    return mapSupabaseRowToLead(data);
  }

  const lead = await prisma.lead.findUnique({ where: { id } });
  if (!lead) return null;
  return {
    ...lead,
    status: lead.status as LeadStatus,
    createdAt: lead.createdAt.toISOString(),
    updatedAt: lead.updatedAt.toISOString(),
  };
}

// ==========================================
// 3. Create lead (Direct to Supabase)
// ==========================================
export async function createLead(data: {
  name: string;
  email: string;
  phone: string;
  businessName: string;
  status: LeadStatus;
  notes?: string;
}): Promise<Lead> {
  if (supabaseServer) {
    const { data: inserted, error } = await supabaseServer
      .from("leads")
      .insert({
        name: data.name.trim(),
        email: data.email.trim().toLowerCase(),
        phone: data.phone.trim(),
        business_name: data.businessName.trim(),
        status: data.status || "New",
        notes: data.notes?.trim() || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Supabase createLead error:", error);
      throw new Error(`Failed to save to Supabase: ${error.message}`);
    }

    if (!inserted) {
      throw new Error("Supabase returned empty response on insert.");
    }

    return mapSupabaseRowToLead(inserted);
  }

  // SQLite fallback
  const created = await prisma.lead.create({
    data: {
      name: data.name.trim(),
      email: data.email.trim().toLowerCase(),
      phone: data.phone.trim(),
      businessName: data.businessName.trim(),
      status: data.status || "New",
      notes: data.notes?.trim() || null,
    },
  });

  return {
    ...created,
    status: created.status as LeadStatus,
    createdAt: created.createdAt.toISOString(),
    updatedAt: created.updatedAt.toISOString(),
  };
}

// ==========================================
// 4. Update lead
// ==========================================
export async function updateLead(
  id: string,
  data: Partial<{
    name: string;
    email: string;
    phone: string;
    businessName: string;
    status: LeadStatus;
    notes?: string;
  }>
): Promise<Lead> {
  if (supabaseServer) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updatePayload: any = {};
    if (data.name !== undefined) updatePayload.name = data.name.trim();
    if (data.email !== undefined) updatePayload.email = data.email.trim().toLowerCase();
    if (data.phone !== undefined) updatePayload.phone = data.phone.trim();
    if (data.businessName !== undefined) updatePayload.business_name = data.businessName.trim();
    if (data.status !== undefined) updatePayload.status = data.status;
    if (data.notes !== undefined) updatePayload.notes = data.notes?.trim() || null;

    const { data: updated, error } = await supabaseServer
      .from("leads")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Supabase updateLead error:", error);
      throw new Error(`Failed to update in Supabase: ${error.message}`);
    }

    return mapSupabaseRowToLead(updated);
  }

  // SQLite fallback
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updatePayload: any = {};
  if (data.name !== undefined) updatePayload.name = data.name.trim();
  if (data.email !== undefined) updatePayload.email = data.email.trim().toLowerCase();
  if (data.phone !== undefined) updatePayload.phone = data.phone.trim();
  if (data.businessName !== undefined) updatePayload.businessName = data.businessName.trim();
  if (data.status !== undefined) updatePayload.status = data.status;
  if (data.notes !== undefined) updatePayload.notes = data.notes?.trim() || null;

  const updated = await prisma.lead.update({
    where: { id },
    data: updatePayload,
  });

  return {
    ...updated,
    status: updated.status as LeadStatus,
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
  };
}

// ==========================================
// 5. Delete lead
// ==========================================
export async function deleteLead(id: string): Promise<void> {
  if (supabaseServer) {
    const { error } = await supabaseServer.from("leads").delete().eq("id", id);
    if (error) {
      console.error("Supabase deleteLead error:", error);
      throw new Error(`Failed to delete from Supabase: ${error.message}`);
    }
    return;
  }

  await prisma.lead.delete({ where: { id } });
}

// ==========================================
// 6. Seed sample demo leads
// ==========================================
export async function seedSampleLeads(): Promise<{ count: number; provider: DatabaseProvider }> {
  if (supabaseServer) {
    // Clear existing
    await supabaseServer.from("leads").delete().neq("id", "00000000-0000-0000-0000-000000000000");

    const rows = SAMPLE_LEADS.map((l) => ({
      name: l.name,
      email: l.email,
      phone: l.phone,
      business_name: l.businessName,
      status: l.status,
      notes: l.notes || null,
    }));

    const { error } = await supabaseServer.from("leads").insert(rows);
    if (error) {
      throw new Error(`Failed to seed Supabase: ${error.message}`);
    }

    const { count } = await supabaseServer.from("leads").select("*", { count: "exact", head: true });
    return { count: count || SAMPLE_LEADS.length, provider: "supabase" };
  }

  await prisma.lead.deleteMany({});
  for (const lead of SAMPLE_LEADS) {
    await prisma.lead.create({ data: lead });
  }
  const count = await prisma.lead.count();
  return { count, provider: "sqlite" };
}
