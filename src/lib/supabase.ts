import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Service-role client for server-side API routes only.
// Never import this in client components.
//
// Created lazily so the app can build and run in demo mode (no Supabase
// env vars). It only throws if a route actually tries to use the database
// without credentials configured.
let client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (!client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new Error(
        "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY, or run in demo mode."
      );
    }
    client = createClient(url, key);
  }
  return client;
}

export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const c = getClient();
    const value = Reflect.get(c, prop, c);
    return typeof value === "function" ? value.bind(c) : value;
  },
});
