import type { Database } from "../supabase/database.types";

import { createBrowserClient } from "@supabase/ssr";

export const createAuthClient = () =>
  createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    },
  );

export type AuthClient = ReturnType<typeof createAuthClient>;
