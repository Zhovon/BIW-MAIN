"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getSupabaseBrowserClient, getRoleFromUserMetadata } from "@/lib/supabase/client";
import type { AuthRole } from "@/lib/supabase/roles";
import { AuthMenu } from "@/components/auth-menu";

export function SiteHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const [role, setRole] = useState<AuthRole | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadSession = async () => {
      const supabase = getSupabaseBrowserClient();
      const { data } = await supabase.auth.getUser();
      const user = data.user;

      if (!mounted) return;

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
    setMobileMenuOpen(false);
    router.push("/login");
  };

  // Close mobile menu on navigate
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Close mobile menu on Escape keypress
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleDrawerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      setMobileMenuOpen(false);
    }
  };

  const getNavItems = () => {
    const items = [{ href: "/", label: "Home" }];

    if (!email) {
      return items;
    }

    if (role === "owner") {
      items.push(
        { href: "/dashboard/owner", label: "Owner Console" },
        { href: "/employees", label: "Manage Staff" },
        { href: "/services", label: "Services" },
        { href: "/branches", label: "Branches" }
      );
    } else if (role === "manager") {
      items.push(
        { href: "/dashboard/manager", label: "Manager Dashboard" },
        { href: "/services", label: "Services" },
        { href: "/branches", label: "Branches" }
      );
    } else if (role === "employee") {
      items.push(
        { href: "/dashboard/employee", label: "Therapist Dashboard" }
      );
    } else {
      items.push({ href: "/dashboard", label: "Dashboard" });
    }

    return items;
  };

  const navItems = getNavItems();

  if (pathname.startsWith("/book")) {
    return null;
  }

  return (
    <>
      <header className="site-header">
        <Link className="site-header__brand" href="/" aria-label="Beauty Intelligent Wellness — Home">
          <Image
            src="/biw-logo.jpeg"
            alt="BIW Logo"
            width={36}
            height={36}
            style={{ borderRadius: "6px", objectFit: "cover", display: "block" }}
            priority
          />
        </Link>
        <nav className="site-header__nav" aria-label="Primary">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                style={isActive ? {
                    background: "var(--surface-2)",
                    borderColor: "var(--gold-border)",
                    color: "var(--gold)",
                  } : undefined}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <AuthMenu />

        {/* Mobile Hamburger Toggle */}
        <button
          className={`site-header__toggle ${mobileMenuOpen ? "is-open" : ""}`}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle navigation menu"
          type="button"
        >
          <span />
          <span />
          <span />
        </button>
      </header>

      {/* Mobile Drawer Overlay */}
      <div 
        className={`site-header__mobile-drawer ${mobileMenuOpen ? "is-open" : ""}`}
        onClick={handleDrawerClick}
      >
        <nav className="site-header__mobile-nav" aria-label="Mobile">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={isActive ? "is-active" : ""}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Mobile Auth Action Info */}
        <div className="site-header__mobile-auth">
          {email ? (
            <>
              <div className="site-header__mobile-auth-details">
                <span className="site-header__auth-label" style={{ fontSize: "0.8rem", color: "var(--accent)" }}>
                  Role: {role ? role : "signed in"}
                </span>
                <span className="site-header__auth-email" style={{ fontSize: "0.95rem", color: "var(--text)", fontFamily: "monospace" }}>
                  {email}
                </span>
              </div>
              <button
                className="button button--secondary"
                type="button"
                onClick={handleSignOut}
                style={{ width: "100%", padding: "12px", borderRadius: "14px", marginTop: "10px" }}
              >
                Sign out
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="button button--primary"
              style={{ width: "100%", padding: "12px", borderRadius: "14px", textAlign: "center" }}
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </>
  );
}
