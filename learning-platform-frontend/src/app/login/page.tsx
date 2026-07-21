'use client';

import Link from 'next/link';
import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, LoaderCircle } from 'lucide-react';
import AuthFrame from '@/components/auth/AuthFrame';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { login, loading, user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) router.replace('/');
  }, [loading, router, user]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      router.replace('/');
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to sign in.');
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
        <div className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700" role="alert">
          {error}
        </div>
      )}
      <form className="space-y-5" onSubmit={(event) => void handleSubmit(event)}>
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-[#313337]">Email address</span>
          <input
            required
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-xl border border-[#dfe0e3] bg-white px-4 py-3 text-sm text-[#313337] shadow-sm transition focus:border-[#e31540] focus:ring-4 focus:ring-[#e31540]/10"
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-[#313337]">Password</span>
          <input
            required
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Your password"
            className="w-full rounded-xl border border-[#dfe0e3] bg-white px-4 py-3 text-sm text-[#313337] shadow-sm transition focus:border-[#e31540] focus:ring-4 focus:ring-[#e31540]/10"
          />
        </label>
        <button
          type="submit"
          disabled={submitting}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#e31540] px-4 py-3.5 text-sm font-bold text-white shadow-[0_12px_24px_rgba(227,21,64,0.22)] transition hover:bg-[#c61137] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {submitting ? <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" /> : <>Sign in <ArrowRight className="h-4 w-4" aria-hidden="true" /></>}
        </button>
      </form>
      <p className="mt-7 text-center text-sm text-[#6b6e75]">
        New to JEE AI?{' '}
        <Link href="/signup" className="font-bold text-[#e31540] hover:text-[#c61137] hover:underline">Create your account</Link>
      </p>
    </AuthFrame>
  );
}
