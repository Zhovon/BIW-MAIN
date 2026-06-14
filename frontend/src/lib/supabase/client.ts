import { createClient } from "@supabase/supabase-js";

import type { AuthRole } from "./roles";

let supabaseBrowserClient: ReturnType<typeof createClient> | null = null;

export function getSupabaseBrowserClient() {
  if (supabaseBrowserClient) {
    return supabaseBrowserClient;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Supabase environment variables are missing.");
  }

  supabaseBrowserClient = createClient(supabaseUrl, supabaseKey);

  return supabaseBrowserClient;
}

export function getRoleFromUserMetadata(userMetadata: Record<string, unknown> | undefined, appMetadata: Record<string, unknown> | undefined): AuthRole | null {
  const role = userMetadata?.role ?? appMetadata?.role;

  if (role === "owner" || role === "manager" || role === "employee") {
    return role;
  }

  return null;
}