import type { Database } from "./database";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

let _supabaseClient: ReturnType<typeof createSupabaseClient<Database>> | null = null;
let _initializationError: Error | null = null;

// Lazy initialization function with error handling
const getSupabaseClient = () => {
  if (_supabaseClient) return _supabaseClient;

  if (_initializationError) {
    throw _initializationError;
  }

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    if (!supabaseUrl || !supabaseAnonKey) {
      const error = new Error("Missing Supabase environment variables");
      _initializationError = error;
      console.error('🚨 GameGen Supabase client initialization failed:', error.message);
      throw error;
    }

    _supabaseClient = createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    });

    return _supabaseClient;
  } catch (error) {
    _initializationError = error as Error;
    console.error('🚨 GameGen Supabase client creation failed:', error);
    throw error;
  }
};

// Check if Supabase is available without throwing
export function isSupabaseAvailable(): boolean {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    return !!(supabaseUrl && supabaseAnonKey);
  } catch {
    return false;
  }
}

// Safe client that won't throw during initialization
export function getSupabaseSafely() {
  try {
    return getSupabaseClient();
  } catch (error) {
    console.warn('🚧 GameGen Supabase not available, returning null:', error);
    return null;
  }
}

// Export the lazy-initialized client with safer error handling
export const supabase = new Proxy({} as ReturnType<typeof createSupabaseClient<Database>>, {
  get(target, prop) {
    try {
      const client = getSupabaseClient();
      const value = client[prop as keyof typeof client];
      return typeof value === 'function' ? value.bind(client) : value;
    } catch (error) {
      console.error('🚨 GameGen Supabase proxy access failed:', error);
      // Return mock auth methods to prevent app crashes
      if (prop === 'auth') {
        return {
          getSession: () => Promise.resolve({ data: { session: null }, error: null }),
          onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
          signInWithPassword: () => Promise.resolve({ data: { user: null }, error: new Error('Supabase not available') }),
          signUp: () => Promise.resolve({ data: { user: null }, error: new Error('Supabase not available') }),
          signOut: () => Promise.resolve({ error: null }),
          signInWithOAuth: () => Promise.resolve({ data: { user: null }, error: new Error('Supabase not available') }),
          resetPasswordForEmail: () => Promise.resolve({ error: new Error('Supabase not available') }),
        };
      }
      return null;
    }
  }
});

// Export a function that creates a new client instance
export const createClientInstance = () => {
  return getSupabaseClient();
};

// Server-side Supabase client for API routes and server components
export const createServerSupabaseClient = async () => {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: "", ...options });
          } catch (error) {
            // The `delete` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    },
  );
};

// Alternative export for backwards compatibility
export const createClient = createServerSupabaseClient;

// Get current session server-side
export const getSession = async () => {
  const supabase = await createServerSupabaseClient();

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    return session;
  } catch (error) {
    console.error("Error getting session:", error);
    return null;
  }
};

// Get current user server-side
export const getUser = async () => {
  const supabase = await createServerSupabaseClient();

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    return user;
  } catch (error) {
    console.error("Error getting user:", error);
    return null;
  }
};