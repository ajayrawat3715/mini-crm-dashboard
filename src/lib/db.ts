import prisma from "@/lib/prisma";
import { supabaseServer, isSupabaseConfigured } from "@/lib/supabase";
import { Lead, LeadStatus, LeadStats } from "@/types/lead";
import { SAMPLE_LEADS } from "@/lib/seed-data";

export type DatabaseProvider = "supabase" | "sqlite";

export function getActiveDatabaseProvider(): DatabaseProvider {
  return isSupabaseConfigured ? "supabase" : "sqlite";
}

// In-memory fallback for serverless environments (like Vercel) if SQLite file is read-only or absent
let memoryLeads: Lead[] = SAMPLE_LEADS.map((l, index) => ({
  id: `mem-${index + 1}`,
  name: l.name,
  email: l.email,
  phone: l.phone,
  businessName: l.businessName,
  status: l.status,
  notes: l.notes || null,
  createdAt: new Date(Date.now() - index * 86400000).toISOString(),
  updatedAt: new Date(Date.now() - index * 86400000).toISOString(),
}));

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
  const provider = getActiveDatabaseProvider();

  // -------- SUPABASE IMPLEMENTATION --------
  if (provider === "supabase" && supabaseServer) {
    try {
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

      if (filteredRes.error) throw new Error(filteredRes.error.message);
      if (allRes.error) throw new Error(allRes.error.message);

      const leads: Lead[] = (filteredRes.data || []).map(mapSupabaseRowToLead);
      const allLeads = allRes.data || [];
      const stats = computeStats(allLeads);

      return { leads, stats, provider: "supabase" };
    } catch (err) {
      console.error("Supabase query error:", err);
      // Fall through to SQLite/fallback
    }
  }

  // -------- SQLITE / PRISMA IMPLEMENTATION --------
  try {
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
      prisma.lead.findMany({
        where,
        orderBy: { createdAt: "desc" },
      }),
      prisma.lead.findMany({
        select: { status: true },
      }),
    ]);

    const leads: Lead[] = prismaLeads.map((l) => ({
      ...l,
      status: l.status as LeadStatus,
      createdAt: l.createdAt.toISOString(),
      updatedAt: l.updatedAt.toISOString(),
    }));

    const stats = computeStats(allPrismaLeads);
    return { leads, stats, provider: "sqlite" };
  } catch (dbError) {
    console.warn("Prisma SQLite unavailable (serverless environment), using in-memory store:", dbError);

    // Fallback: In-memory filtering
    let filtered = [...memoryLeads];
    if (status && status !== "All") {
      filtered = filtered.filter((l) => l.status === status);
    }
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (l) =>
          l.name.toLowerCase().includes(q) ||
          l.email.toLowerCase().includes(q) ||
          l.businessName.toLowerCase().includes(q) ||
          l.phone.toLowerCase().includes(q)
      );
    }

    const stats = computeStats(memoryLeads);
    return { leads: filtered, stats, provider: "sqlite" };
  }
}

// ==========================================
// 2. Fetch single lead
// ==========================================
export async function getLeadById(id: string): Promise<Lead | null> {
  const provider = getActiveDatabaseProvider();

  if (provider === "supabase" && supabaseServer) {
    try {
      const { data, error } = await supabaseServer
        .from("leads")
        .select("*")
        .eq("id", id)
        .single();

      if (!error && data) return mapSupabaseRowToLead(data);
    } catch {
      // Fallback
    }
  }

  try {
    const lead = await prisma.lead.findUnique({ where: { id } });
    if (lead) {
      return {
        ...lead,
        status: lead.status as LeadStatus,
        createdAt: lead.createdAt.toISOString(),
        updatedAt: lead.updatedAt.toISOString(),
      };
    }
  } catch {
    // Fallback
  }

  return memoryLeads.find((l) => l.id === id) || null;
}

// ==========================================
// 3. Create lead
// ==========================================
export async function createLead(data: {
  name: string;
  email: string;
  phone: string;
  businessName: string;
  status: LeadStatus;
  notes?: string;
}): Promise<Lead> {
  const provider = getActiveDatabaseProvider();

  if (provider === "supabase" && supabaseServer) {
    try {
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

      if (!error && inserted) return mapSupabaseRowToLead(inserted);
    } catch (err) {
      console.error("Supabase create error:", err);
    }
  }

  try {
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
  } catch {
    // Fallback in-memory create
    const newLead: Lead = {
      id: `mem-${Date.now()}`,
      name: data.name.trim(),
      email: data.email.trim().toLowerCase(),
      phone: data.phone.trim(),
      businessName: data.businessName.trim(),
      status: data.status || "New",
      notes: data.notes?.trim() || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    memoryLeads.unshift(newLead);
    return newLead;
  }
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
  const provider = getActiveDatabaseProvider();

  if (provider === "supabase" && supabaseServer) {
    try {
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

      if (!error && updated) return mapSupabaseRowToLead(updated);
    } catch {
      // Fallback
    }
  }

  try {
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
  } catch {
    // Fallback in-memory update
    const index = memoryLeads.findIndex((l) => l.id === id);
    if (index !== -1) {
      const existing = memoryLeads[index];
      const updated: Lead = {
        ...existing,
        name: data.name !== undefined ? data.name.trim() : existing.name,
        email: data.email !== undefined ? data.email.trim().toLowerCase() : existing.email,
        phone: data.phone !== undefined ? data.phone.trim() : existing.phone,
        businessName: data.businessName !== undefined ? data.businessName.trim() : existing.businessName,
        status: data.status !== undefined ? data.status : existing.status,
        notes: data.notes !== undefined ? data.notes?.trim() || null : existing.notes,
        updatedAt: new Date().toISOString(),
      };
      memoryLeads[index] = updated;
      return updated;
    }
    throw new Error("Lead not found");
  }
}

// ==========================================
// 5. Delete lead
// ==========================================
export async function deleteLead(id: string): Promise<void> {
  const provider = getActiveDatabaseProvider();

  if (provider === "supabase" && supabaseServer) {
    try {
      const { error } = await supabaseServer.from("leads").delete().eq("id", id);
      if (!error) return;
    } catch {
      // Fallback
    }
  }

  try {
    await prisma.lead.delete({ where: { id } });
    return;
  } catch {
    // Fallback in-memory delete
    memoryLeads = memoryLeads.filter((l) => l.id !== id);
  }
}

// ==========================================
// 6. Seed sample demo leads
// ==========================================
export async function seedSampleLeads(): Promise<{ count: number; provider: DatabaseProvider }> {
  const provider = getActiveDatabaseProvider();

  if (provider === "supabase" && supabaseServer) {
    try {
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
      if (!error) {
        const { count } = await supabaseServer.from("leads").select("*", { count: "exact", head: true });
        return { count: count || SAMPLE_LEADS.length, provider: "supabase" };
      }
    } catch {
      // Fallback
    }
  }

  try {
    await prisma.lead.deleteMany({});
    for (const lead of SAMPLE_LEADS) {
      await prisma.lead.create({ data: lead });
    }
    const count = await prisma.lead.count();
    return { count, provider: "sqlite" };
  } catch {
    memoryLeads = SAMPLE_LEADS.map((l, index) => ({
      id: `mem-${Date.now()}-${index}`,
      name: l.name,
      email: l.email,
      phone: l.phone,
      businessName: l.businessName,
      status: l.status,
      notes: l.notes || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
    return { count: memoryLeads.length, provider: "sqlite" };
  }
}
