import { env } from "@/config/env";
import type { Database } from "@/types/database";
import { createClient } from "@supabase/supabase-js";

/**
 * Creates a Supabase client typed with the generated database schema.
 * Uses the public anon key — no auth, direct table access (see RLS note).
 */
export const createSupabaseClient = () =>
  createClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
