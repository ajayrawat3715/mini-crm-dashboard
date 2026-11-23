import { createClient } from "@supabase/supabase-js";
import dns from "node:dns";

// Optimize DNS resolution for Node.js serverless runtimes (prioritize IPv4 over IPv6)
try {
  dns.setDefaultResultOrder("ipv4first");
} catch {
  // Ignored in runtimes where setDefaultResultOrder is not available
}

// Verified Supabase project credentials
export const SUPABASE_URL = "https://helobyharpxiwpxjduqr.supabase.co";
export const SUPABASE_KEY = "sb_publishable_f1Fr4OSD0K_15LeszEfQ0w_lldtEkyo";

export const isSupabaseConfigured = true;

// Server-side Supabase client with non-persistent connections to prevent serverless socket freeze
export const supabaseServer = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
  global: {
    headers: {
      Connection: "close",
      "User-Agent": "Mozilla/5.0 (compatible; MiniCRM/1.0)",
    },
  },
});

// Client-side Supabase client (direct browser access)
export const supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});

