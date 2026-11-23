import prisma from "@/lib/prisma";
import { supabaseServer, isSupabaseConfigured, SUPABASE_URL, SUPABASE_KEY } from "@/lib/supabase";
import { Lead, LeadStatus, LeadStats } from "@/types/lead";
import { SAMPLE_LEADS } from "@/lib/seed-data";

export type DatabaseProvider = "supabase" | "sqlite";

export function getActiveDatabaseProvider(): DatabaseProvider {
  return isSupabaseConfigured ? "supabase" : "sqlite";
}

// Helper for raw PostgREST requests with connection-close to prevent serverless socket issues
async function rawSupabaseRequest(endpoint: string, options: RequestInit = {}) {
  const url = `${SUPABASE_URL}/rest/v1/${endpoint}`;
  return fetch(url, {
    ...options,
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      Connection: "close",
      "User-Agent": "Mozilla/5.0 (compatible; MiniCRM/1.0)",
      ...options.headers,
    },
  });
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

      if (!filteredRes.error && !allRes.error) {
        const leads: Lead[] = (filteredRes.data || []).map(mapSupabaseRowToLead);
        const allLeads = allRes.data || [];
        const stats = computeStats(allLeads);

        return { leads, stats, provider: "supabase" };
      }
    } catch (err) {
      console.warn("Supabase getLeads exception, trying raw REST:", err);
    }

    // Raw REST fallback
    try {
      let endpoint = "leads?select=*&order=created_at.desc";
      if (status && status !== "All") endpoint += `&status=eq.${encodeURIComponent(status)}`;
      const res = await rawSupabaseRequest(endpoint);
      if (res.ok) {
        const rows = await res.json();
        const leads: Lead[] = rows.map(mapSupabaseRowToLead);
        const stats = computeStats(leads);
        return { leads, stats, provider: "supabase" };
      }
    } catch (rawErr) {
      console.warn("Raw REST getLeads failed:", rawErr);
    }
  }

  // -------- SQLITE FALLBACK (local development) --------
  if (process.env.DATABASE_URL) {
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

  return { leads: [], stats: computeStats([]), provider: "supabase" };
}

// ==========================================
// 2. Fetch single lead
// ==========================================
export async function getLeadById(id: string): Promise<Lead | null> {
  if (supabaseServer) {
    try {
      const { data, error } = await supabaseServer
        .from("leads")
        .select("*")
        .eq("id", id)
        .single();

      if (!error && data) return mapSupabaseRowToLead(data);
    } catch (err) {
      console.warn("getLeadById exception, trying raw REST:", err);
    }

    try {
      const res = await rawSupabaseRequest(`leads?id=eq.${id}&select=*`);
      if (res.ok) {
        const rows = await res.json();
        if (Array.isArray(rows) && rows.length > 0) {
          return mapSupabaseRowToLead(rows[0]);
        }
      }
    } catch (rawErr) {
      console.warn("Raw REST getLeadById failed:", rawErr);
    }
  }

  if (process.env.DATABASE_URL) {
    const lead = await prisma.lead.findUnique({ where: { id } });
    if (!lead) return null;
    return {
      ...lead,
      status: lead.status as LeadStatus,
      createdAt: lead.createdAt.toISOString(),
      updatedAt: lead.updatedAt.toISOString(),
    };
  }

  return null;
}

// ==========================================
// 3. Create lead (Direct to Supabase with fallback)
// ==========================================
export async function createLead(data: {
  name: string;
  email: string;
  phone: string;
  businessName: string;
  status: LeadStatus;
  notes?: string;
}): Promise<Lead> {
  const payload = {
    name: data.name.trim(),
    email: data.email.trim().toLowerCase(),
    phone: data.phone.trim(),
    business_name: data.businessName.trim(),
    status: data.status || "New",
    notes: data.notes?.trim() || null,
  };

  if (supabaseServer) {
    try {
      const { data: inserted, error } = await supabaseServer
        .from("leads")
        .insert(payload)
        .select()
        .single();

      if (!error && inserted) {
        return mapSupabaseRowToLead(inserted);
      }
    } catch (err) {
      console.warn("supabaseServer.insert threw, attempting raw REST fallback:", err);
    }

    // Direct Raw REST fallback to PostgREST
    try {
      const res = await rawSupabaseRequest("leads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const rows = await res.json();
        if (Array.isArray(rows) && rows.length > 0) {
          return mapSupabaseRowToLead(rows[0]);
        }
      } else {
        const errText = await res.text();
        console.warn("Raw REST insert returned non-ok:", res.status, errText);
      }
    } catch (rawErr) {
      console.warn("rawSupabaseRequest insert failed:", rawErr);
    }
  }

  // SQLite fallback only if DATABASE_URL exists (local dev)
  if (process.env.DATABASE_URL) {
    const created = await prisma.lead.create({
      data: {
        name: payload.name,
        email: payload.email,
        phone: payload.phone,
        businessName: payload.business_name,
        status: payload.status as LeadStatus,
        notes: payload.notes,
      },
    });

    return {
      ...created,
      status: created.status as LeadStatus,
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString(),
    };
  }

  throw new Error("Unable to save lead: Supabase cloud service unavailable.");
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updatePayload: any = {};
  if (data.name !== undefined) updatePayload.name = data.name.trim();
  if (data.email !== undefined) updatePayload.email = data.email.trim().toLowerCase();
  if (data.phone !== undefined) updatePayload.phone = data.phone.trim();
  if (data.businessName !== undefined) updatePayload.business_name = data.businessName.trim();
  if (data.status !== undefined) updatePayload.status = data.status;
  if (data.notes !== undefined) updatePayload.notes = data.notes?.trim() || null;

  if (supabaseServer) {
    try {
      const { data: updated, error } = await supabaseServer
        .from("leads")
        .update(updatePayload)
        .eq("id", id)
        .select()
        .single();

      if (!error && updated) {
        return mapSupabaseRowToLead(updated);
      }
    } catch (err) {
      console.warn("supabaseServer.update threw, attempting raw REST fallback:", err);
    }

    try {
      const res = await rawSupabaseRequest(`leads?id=eq.${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify(updatePayload),
      });

      if (res.ok) {
        const rows = await res.json();
        if (Array.isArray(rows) && rows.length > 0) {
          return mapSupabaseRowToLead(rows[0]);
        }
      }
    } catch (rawErr) {
      console.warn("rawSupabaseRequest update failed:", rawErr);
    }
  }

  if (process.env.DATABASE_URL) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const prismaPayload: any = { ...updatePayload };
    if (prismaPayload.business_name) {
      prismaPayload.businessName = prismaPayload.business_name;
      delete prismaPayload.business_name;
    }

    const updated = await prisma.lead.update({
      where: { id },
      data: prismaPayload,
    });

    return {
      ...updated,
      status: updated.status as LeadStatus,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  throw new Error("Unable to update lead: Supabase cloud service unavailable.");
}

// ==========================================
// 5. Delete lead
// ==========================================
export async function deleteLead(id: string): Promise<void> {
  if (supabaseServer) {
    try {
      const { error } = await supabaseServer.from("leads").delete().eq("id", id);
      if (!error) return;
    } catch (err) {
      console.warn("supabaseServer.delete threw, trying raw REST:", err);
    }

    try {
      const res = await rawSupabaseRequest(`leads?id=eq.${id}`, {
        method: "DELETE",
      });
      if (res.ok) return;
    } catch (rawErr) {
      console.warn("rawSupabaseRequest delete failed:", rawErr);
    }
  }

  if (process.env.DATABASE_URL) {
    await prisma.lead.delete({ where: { id } });
    return;
  }

  throw new Error("Unable to delete lead: Supabase cloud service unavailable.");
}

// ==========================================
// 6. Seed sample demo leads
// ==========================================
export async function seedSampleLeads(): Promise<{ count: number; provider: DatabaseProvider }> {
  if (supabaseServer) {
    const rows = SAMPLE_LEADS.map((l) => ({
      name: l.name,
      email: l.email,
      phone: l.phone,
      business_name: l.businessName,
      status: l.status,
      notes: l.notes || null,
    }));

    try {
      await supabaseServer.from("leads").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      const { error } = await supabaseServer.from("leads").insert(rows);
      if (!error) {
        const { count } = await supabaseServer.from("leads").select("*", { count: "exact", head: true });
        return { count: count || SAMPLE_LEADS.length, provider: "supabase" };
      }
    } catch (err) {
      console.warn("supabaseServer.seed threw, trying raw REST:", err);
    }

    try {
      await rawSupabaseRequest("leads?id=neq.00000000-0000-0000-0000-000000000000", { method: "DELETE" });
      const res = await rawSupabaseRequest("leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rows),
      });
      if (res.ok) {
        return { count: SAMPLE_LEADS.length, provider: "supabase" };
      }
    } catch (rawErr) {
      console.warn("rawSupabaseRequest seed failed:", rawErr);
    }
  }

  if (process.env.DATABASE_URL) {
    await prisma.lead.deleteMany({});
    for (const lead of SAMPLE_LEADS) {
      await prisma.lead.create({ data: lead });
    }
    const count = await prisma.lead.count();
    return { count, provider: "sqlite" };
  }

  return { count: 0, provider: "supabase" };
}
