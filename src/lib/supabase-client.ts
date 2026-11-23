"use client";

import { createClient } from "@supabase/supabase-js";

export const SUPABASE_URL = "https://helobyharpxiwpxjduqr.supabase.co";
export const SUPABASE_KEY = "sb_publishable_f1Fr4OSD0K_15LeszEfQ0w_lldtEkyo";

export const supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});
