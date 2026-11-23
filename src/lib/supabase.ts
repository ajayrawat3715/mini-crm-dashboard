import { createClient } from "@supabase/supabase-js";

export const DEFAULT_SUPABASE_URL = "https://helobyharpxiwpxjduqr.supabase.co";
export const DEFAULT_SUPABASE_ANON_KEY = "sb_publishable_f1Fr4OSD0K_15LeszEfQ0w_lldtEkyo";

function sanitizeUrl(val?: string): string {
  if (!val) return "";
  let s = val.trim().replace(/^["']|["']$/g, "");
  if (!s || s === "undefined" || s === "null" || s === '""' || s === "''") return "";
  if (!s.startsWith("http://") && !s.startsWith("https://")) {
    s = `https://${s}`;
  }
  s = s.replace(/\/+$/, "");
  try {
    const parsed = new URL(s);
    if (!parsed.hostname || parsed.hostname === "undefined" || parsed.hostname === "null" || !parsed.hostname.includes(".")) {
      return "";
    }
    return s;
  } catch {
    return "";
  }
}

function sanitizeKey(val?: string): string {
  if (!val) return "";
  const s = val.trim().replace(/^["']|["']$/g, "");
  if (!s || s === "undefined" || s === "null" || s.length < 25) return "";
  return s;
}

// Supabase project verified credentials
const resolvedUrl =
  sanitizeUrl(process.env.NEXT_PUBLIC_SUPABASE_URL) ||
  sanitizeUrl(process.env.SUPABASE_URL) ||
  sanitizeUrl(process.env.SHL_CRM_SUPABASE_URL) ||
  sanitizeUrl(process.env.NEXT_PUBLIC_SHL_CRM_SUPABASE_URL) ||
  sanitizeUrl(process.env.NEXT_PUBLIC_SUPABASE_PROJECT_URL);

export const SUPABASE_URL =
  resolvedUrl && resolvedUrl.includes("supabase.co")
    ? resolvedUrl
    : DEFAULT_SUPABASE_URL;

const resolvedKey =
  sanitizeKey(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) ||
  sanitizeKey(process.env.SUPABASE_ANON_KEY) ||
  sanitizeKey(process.env.SHL_CRM_SUPABASE_ANON_KEY) ||
  sanitizeKey(process.env.NEXT_PUBLIC_SHL_CRM_SUPABASE_ANON_KEY) ||
  sanitizeKey(process.env.SUPABASE_SERVICE_ROLE_KEY) ||
  sanitizeKey(process.env.SHL_CRM_SUPABASE_SECRET_KEY);

export const SUPABASE_KEY =
  resolvedKey && (resolvedKey.startsWith("sb_") || resolvedKey.startsWith("eyJ"))
    ? resolvedKey
    : DEFAULT_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_KEY);

// Server-side Supabase client
export const supabaseServer = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});

// Client-side Supabase client (direct browser access)
export const supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});
