import { createClient } from "@supabase/supabase-js";

function cleanStr(val?: string): string {
  if (!val) return "";
  return val.trim().replace(/^["']|["']$/g, "");
}

function cleanUrl(val?: string): string {
  let s = cleanStr(val);
  if (!s) return "";
  if (!s.startsWith("http://") && !s.startsWith("https://")) {
    s = `https://${s}`;
  }
  return s.replace(/\/+$/, "");
}

// Supabase project verified credentials - check all standard & Vercel-integration environment variable variants
export const SUPABASE_URL =
  cleanUrl(process.env.NEXT_PUBLIC_SUPABASE_URL) ||
  cleanUrl(process.env.SUPABASE_URL) ||
  cleanUrl(process.env.SHL_CRM_SUPABASE_URL) ||
  cleanUrl(process.env.NEXT_PUBLIC_SHL_CRM_SUPABASE_URL) ||
  "https://helobyharpxiwpxjduqr.supabase.co";

export const SUPABASE_KEY =
  cleanStr(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) ||
  cleanStr(process.env.SUPABASE_ANON_KEY) ||
  cleanStr(process.env.SHL_CRM_SUPABASE_ANON_KEY) ||
  cleanStr(process.env.NEXT_PUBLIC_SHL_CRM_SUPABASE_ANON_KEY) ||
  cleanStr(process.env.SUPABASE_SERVICE_ROLE_KEY) ||
  cleanStr(process.env.SHL_CRM_SUPABASE_SECRET_KEY) ||
  "sb_publishable_f1Fr4OSD0K_15LeszEfQ0w_lldtEkyo";

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_KEY);

// Server-side Supabase client
export const supabaseServer = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: false },
    })
  : null;

// Client-side Supabase client (direct browser access)
export const supabaseClient = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_KEY)
  : null;
