"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, LoaderCircle } from "lucide-react";
import AuthFrame from "@/components/auth/AuthFrame";
import { useAuth } from "@/context/AuthContext";

export default function SignupPage() {
  const router = useRouter();
  const { register, loading, user } = useAuth();
  const [name, setName] = useState("");
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
      await register(name, email, password);
      router.replace("/");
      router.refresh();
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Unable to create your account.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthFrame
      title="Create your account"
      subtitle="Start with reviewed questions and a secure baseline for Class XII Electrostatics."
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
            Full name
          </span>
          <input
            required
            minLength={2}
            maxLength={100}
            autoComplete="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Your name"
            className="w-full rounded-xl border border-hairline bg-canvas px-4 py-3 text-[15px] text-ink transition duration-200 placeholder:text-ink-mute focus:border-primary/40 focus:bg-surface"
          />
        </label>
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
            minLength={12}
            maxLength={128}
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="At least 12 characters"
            className="w-full rounded-xl border border-hairline bg-canvas px-4 py-3 text-[15px] text-ink transition duration-200 placeholder:text-ink-mute focus:border-primary/40 focus:bg-surface"
          />
          <span className="mt-2 block text-xs leading-5 text-ink-mute">
            Use at least 12 characters with uppercase, lowercase, and a number.
          </span>
        </label>
        <button
          type="submit"
          disabled={submitting}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3.5 text-[15px] font-semibold text-white transition duration-200 hover:bg-primary-strong disabled:cursor-not-allowed disabled:opacity-70"
        >
          {submitting ? (
            <span className="flex items-center gap-2">
              <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
              Creating account…
            </span>
          ) : (
            <>
              Create account{" "}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </>
          )}
        </button>
      </form>
      <p className="mt-8 text-center text-sm text-ink-soft">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-semibold text-primary transition hover:text-primary-strong"
        >
          Sign in
        </Link>
      </p>
    </AuthFrame>
  );
}
