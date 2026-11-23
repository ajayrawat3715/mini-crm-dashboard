import { createClient } from "@supabase/supabase-js";

// Supabase project defaults (publishable keys are safe for client-side use)
const DEFAULT_SUPABASE_URL = "https://helobyharpxiwpxjduqr.supabase.co";
const DEFAULT_SUPABASE_KEY = "sb_publishable_f1Fr4OSD0K_15LeszEfQ0w_lldtEkyo";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  process.env.SHL_CRM_SUPABASE_URL ||
  DEFAULT_SUPABASE_URL;

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.SHL_CRM_SUPABASE_ANON_KEY ||
  DEFAULT_SUPABASE_KEY;

const supabaseServiceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SHL_CRM_SUPABASE_SECRET_KEY ||
  "";

export const isSupabaseConfigured = Boolean(
  supabaseUrl && (supabaseServiceRoleKey || supabaseAnonKey)
);

// Server-side Supabase client (prefers service role, falls back to anon key)
export const supabaseServer = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseServiceRoleKey || supabaseAnonKey, {
      auth: { persistSession: false },
    })
  : null;

// Client-side Supabase client
export const supabaseClient = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
