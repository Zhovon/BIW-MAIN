"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { getSupabaseBrowserClient, getRoleFromUserMetadata } from "@/lib/supabase/client";
import { getRoleRoute } from "@/lib/supabase/roles";

export const dynamic = "force-dynamic";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") ?? "";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("Sign in with your corporate portal credentials.");

  useEffect(() => {
    let mounted = true;

    const redirectIfSignedIn = async () => {
      const supabase = getSupabaseBrowserClient();
      const { data } = await supabase.auth.getUser();
      const user = data.user;

      if (!mounted || !user) {
        return;
      }

      const role = getRoleFromUserMetadata(user.user_metadata, user.app_metadata);
      router.replace(nextPath || (role ? getRoleRoute(role) : "/dashboard"));
    };

    redirectIfSignedIn();

    return () => {
      mounted = false;
    };
  }, [nextPath, router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setMessage("Authenticating secure portal...");

    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setMessage(error.message);
        return;
      }

      const { data } = await supabase.auth.getUser();
      const user = data.user;
      const role = user ? getRoleFromUserMetadata(user.user_metadata, user.app_metadata) : null;

      if (nextPath) {
        router.replace(nextPath);
        return;
      }

      router.replace(role ? getRoleRoute(role) : "/dashboard");
    } catch {
      setMessage("Unable to sign in right now.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="page-shell login-shell">
      <section className="content-grid login-grid">
        <article className="glass-card auth-card">
          <p className="section-label">Portal Sign In</p>
          <h1>Access the BIW Dashboard.</h1>
          <p className="dashboard-lead">
            Access privileges are role-based. Staff, branch managers, and owners can sign in below.
          </p>
          <form className="login-form" onSubmit={handleSubmit}>
            <label>
              <span>Email Address</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="name@clinic.com"
                required
              />
            </label>
            <label>
              <span>Password</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••••••"
                required
              />
            </label>
            <button className="button button--primary login-button" type="submit" disabled={loading}>
              {loading ? "Authenticating..." : "Sign in"}
            </button>
          </form>
          <p className="auth-note">{message}</p>
        </article>

        <article className="glass-card capability-card">
          <h3>Security Notice</h3>
          <p>This is a secure, private corporate network intended solely for authorized personnel of Beauty Intelligent Wellness.</p>
          <p>Access privileges are dynamically audited. System activity is logged to protect partner and client data.</p>
          <p>For credentials recovery or technical assistance, contact the BIW Administration desk.</p>
        </article>
      </section>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <main className="page-shell">
        <section className="content-grid">
          <article className="glass-card auth-card">
            <p className="section-label">Security Gateway</p>
            <h1>Loading portal...</h1>
          </article>
        </section>
      </main>
    }>
      <LoginContent />
    </Suspense>
  );
}