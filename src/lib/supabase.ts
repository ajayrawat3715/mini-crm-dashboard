import { createClient } from "@supabase/supabase-js";

// Supabase project verified credentials
export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  "https://helobyharpxiwpxjduqr.supabase.co";

export const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  "sb_publishable_f1Fr4OSD0K_15LeszEfQ0w_lldtEkyo";

export const isSupabaseConfigured = true;

// Server-side Supabase client
export const supabaseServer = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});

// Client-side Supabase client
export const supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);
