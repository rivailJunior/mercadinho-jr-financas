import { env } from "@/config/env";
import type { Database } from "@/types/database";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Creates a Supabase client bound to the current request's auth session.
 *
 * All usages in this codebase are server-side (Server Components data layer
 * and Server Actions), so this reads the session from cookies. In Server
 * Components cookies are read-only — the middleware refreshes the session —
 * while Server Actions may also set them, hence the guarded setAll.
 */
export const createSupabaseClient = async () => {
  const cookieStore = await cookies();
  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Called from a Server Component — session refresh is the
            // middleware's job, so it is safe to ignore here.
          }
        },
      },
    },
  );
};
