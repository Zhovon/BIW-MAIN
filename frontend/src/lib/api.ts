export function getApiBaseUrl() {
  if (typeof window === "undefined") {
    // When executing on the Next.js server, call the backend container directly
    return process.env.INTERNAL_API_BASE_URL ?? "http://backend:8000";
  }
  // When executing in the client browser, call the host mapped port
  return process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";
}

