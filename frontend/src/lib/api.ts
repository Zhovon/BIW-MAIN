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
let cachedToken: string | undefined;
let tokenExpiresAt = 0;
let tokenFetchPromise: Promise<string | undefined> | null = null;

export async function authFetch(
  url: string,
  options?: RequestInit
): Promise<Response> {
  const now = Date.now();

  if (!cachedToken || now > tokenExpiresAt) {
    if (!tokenFetchPromise) {
      tokenFetchPromise = (async () => {
        try {
          const supabase = getSupabaseBrowserClient();
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.access_token) {
            cachedToken = session.access_token;
            tokenExpiresAt = Date.now() + 60 * 1000;
          } else {
            cachedToken = undefined;
            tokenExpiresAt = 0;
          }
        } catch (err) {
          console.error("Auth fetch getSession error", err);
          cachedToken = undefined;
          tokenExpiresAt = 0;
        } finally {
          tokenFetchPromise = null;
        }
        return cachedToken;
      })();
    }
    await tokenFetchPromise;
  }

  const token = cachedToken;

  const headers: Record<string, string> = {
    ...(options?.headers as Record<string, string> ?? {}),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(url, { ...options, headers });
  
  if (res.status === 401) {
    // If the server rejected the token, immediately clear our cache 
    // so the next request is forced to ask Supabase for a fresh token
    cachedToken = undefined;
    tokenExpiresAt = 0;
  }
  
  return res;
}
