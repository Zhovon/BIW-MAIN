"use client";

import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";

import { getSupabaseBrowserClient, getRoleFromUserMetadata } from "@/lib/supabase/client";
import { getRoleFromPathname, getRoleRoute } from "@/lib/supabase/roles";

type AuthGuardProps = {
  children: ReactNode;
};

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState("Checking Supabase session.");

  useEffect(() => {
    let mounted = true;

    const verifyAccess = async () => {
      const supabase = getSupabaseBrowserClient();
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      const requiredRole = getRoleFromPathname(pathname);

      if (!mounted) {
        return;
      }

      if (!user) {
        router.replace(`/login?next=${encodeURIComponent(pathname)}`);
        return;
      }

      const currentRole = getRoleFromUserMetadata(user.user_metadata, user.app_metadata);

      if (requiredRole && currentRole !== requiredRole) {
        if (currentRole) {
          router.replace(getRoleRoute(currentRole));
          return;
        }

        router.replace("/dashboard");
        return;
      }

      setStatus(currentRole ? `Authenticated as ${currentRole}.` : "Authenticated through Supabase.");
      setReady(true);
    };

    verifyAccess();

    return () => {
      mounted = false;
    };
  }, [pathname, router]);

  if (!ready) {
    return (
      <main className="page-shell">
        <section className="content-grid">
          <article className="glass-card auth-card">
            <p className="section-label">Supabase auth</p>
            <h1>Checking your session.</h1>
            <p className="dashboard-lead">{status}</p>
          </article>
        </section>
      </main>
    );
  }

  return <>{children}</>;
}