"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { getSupabaseBrowserClient, getRoleFromUserMetadata } from "@/lib/supabase/client";
import type { AuthRole } from "@/lib/supabase/roles";

export function AuthMenu() {
  const router = useRouter();
  const pathname = usePathname();
  const [role, setRole] = useState<AuthRole | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadSession = async () => {
      const supabase = getSupabaseBrowserClient();
      const { data } = await supabase.auth.getUser();
      const user = data.user;

      if (!mounted) {
        return;
      }

      if (!user) {
        setRole(null);
        setEmail(null);
        return;
      }

      setEmail(user.email ?? null);
      setRole(getRoleFromUserMetadata(user.user_metadata, user.app_metadata));
    };

    loadSession();

    return () => {
      mounted = false;
    };
  }, [pathname]);

  const handleSignOut = async () => {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (!email) {
    return (
      <Link className="site-header__auth" href="/login">
        Login
      </Link>
    );
  }

  return (
    <button className="site-header__auth site-header__auth--button" type="button" onClick={handleSignOut}>
      <span className="site-header__auth-label">{role ? role : "signed in"}</span>
      <span className="site-header__auth-email">{email}</span>
      <span className="site-header__auth-action">Sign out</span>
    </button>
  );
}