"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, LoaderCircle } from "lucide-react";
import AuthFrame from "@/components/auth/AuthFrame";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { login, loading, user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) router.replace("/");
  }, [loading, router, user]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      router.replace("/");
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to sign in.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthFrame
      title="Welcome back"
      subtitle="Sign in to continue your personalised learning journey."
    >
      {error && (
        <div
          className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700"
          role="alert"
        >
          {error}
        </div>
      )}
      <form
        className="space-y-4"
        onSubmit={(event) => void handleSubmit(event)}
      >
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-ink">
            Email address
          </span>
          <input
            required
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-xl border border-hairline bg-canvas px-4 py-3 text-[15px] text-ink transition duration-200 placeholder:text-ink-mute focus:border-primary/40 focus:bg-surface"
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-ink">
            Password
          </span>
          <input
            required
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Your password"
            className="w-full rounded-xl border border-hairline bg-canvas px-4 py-3 text-[15px] text-ink transition duration-200 placeholder:text-ink-mute focus:border-primary/40 focus:bg-surface"
          />
        </label>
        <button
          type="submit"
          disabled={submitting}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3.5 text-[15px] font-semibold text-white transition duration-200 hover:bg-primary-strong disabled:cursor-not-allowed disabled:opacity-70"
        >
          {submitting ? (
            <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" />
          ) : (
            <>
              Sign in <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </>
          )}
        </button>
      </form>
      <p className="mt-8 text-center text-sm text-ink-soft">
        New to JEE AI?{" "}
        <Link
          href="/signup"
          className="font-semibold text-primary transition hover:text-primary-strong"
        >
          Create your account
        </Link>
      </p>
    </AuthFrame>
  );
}
