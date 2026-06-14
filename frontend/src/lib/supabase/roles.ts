export type AuthRole = "owner" | "manager" | "employee";

export function normalizeRole(value: unknown): AuthRole | null {
  if (value === "owner" || value === "manager" || value === "employee") {
    return value;
  }

  return null;
}

export function getRoleRoute(role: AuthRole) {
  return `/dashboard/${role}`;
}

export function getRoleFromPathname(pathname: string): AuthRole | null {
  if (pathname.startsWith("/dashboard/owner")) {
    return "owner";
  }

  if (pathname.startsWith("/dashboard/manager")) {
    return "manager";
  }

  if (pathname.startsWith("/dashboard/employee")) {
    return "employee";
  }

  return null;
}