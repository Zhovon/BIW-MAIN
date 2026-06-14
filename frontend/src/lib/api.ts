import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export function getApiBaseUrl(): string {
  if (typeof window === "undefined") {
    // When executing on the Next.js server, call the backend container directly
    return process.env.INTERNAL_API_BASE_URL ?? "http://backend:8000";
  }
  // When executing in the client browser, call the public API URL
  return process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";
}

/**
 * Authenticated fetch — automatically attaches the Supabase JWT as a
 * Bearer token on every request. Drop-in replacement for `fetch()`.
 */
export async function authFetch(
  url: string,
  options?: RequestInit
): Promise<Response> {
  let token: string | undefined;
  try {
    const supabase = getSupabaseBrowserClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    token = session?.access_token;
  } catch {
    // If Supabase client is unavailable, proceed without token.
    // The backend will respond with 401.
  }

  const headers: Record<string, string> = {
    ...(options?.headers as Record<string, string> ?? {}),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return fetch(url, { ...options, headers });
}
