'use client';

import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (email === 'admin@school.edu' && password === 'password123') {
      router.push('/');
    } else {
      setError('Invalid email or password. Please try again.');
    }
  };
  return (
    <div className="relative min-h-screen w-full overflow-x-clip bg-[#fafafa] font-sans selection:bg-[#111214] selection:text-white flex items-center justify-center">
      
      {/* Background Decorators from Chatpress */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-x-0 top-[-12rem] h-[34rem] bg-[radial-gradient(circle_at_top,rgba(49,51,55,0.08),transparent_58%)]"></div>
        <div className="absolute left-[8%] top-48 h-72 w-72 rounded-full bg-[rgba(49,51,55,0.04)] blur-3xl"></div>
        <div className="absolute right-[6%] top-24 h-60 w-60 rounded-full bg-[rgba(91,94,98,0.06)] blur-3xl"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(49,51,55,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(49,51,55,0.04)_1px,transparent_1px)] bg-[size:72px_72px] [mask-image:linear-gradient(to_bottom,white,transparent_92%)]"></div>
      </div>

      <div className="relative z-10 w-full max-w-md px-6">
        
        <div className="flex flex-col items-center mb-8">
          <h1 className="font-heading text-3xl font-bold tracking-tight text-[#111214] sm:text-4xl text-center">
            Welcome back
          </h1>
        </div>

        <div className="rounded-[2rem] border border-[rgba(49,51,55,0.08)] bg-[linear-gradient(180deg,rgba(255,255,255,0.8),rgba(249,249,250,0.72))] p-8 shadow-[0_18px_48px_rgba(49,51,55,0.06)] ring-1 ring-white/45 backdrop-blur-xl">
          
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-xs font-semibold">
              {error}
            </div>
          )}

          <form className="space-y-5" onSubmit={handleLogin}>
            <div>
              <label htmlFor="email" className="block text-xs font-bold uppercase tracking-widest text-[#8f939b] mb-2">
                Email Address
              </label>
              <input 
                type="email" 
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@school.edu" 
                className="w-full rounded-xl border border-[rgba(49,51,55,0.1)] bg-white px-4 py-3 text-sm font-medium text-[#111214] placeholder-[#a1a5ab] shadow-[0_2px_10px_rgba(49,51,55,0.02)] outline-none transition-[border-color,box-shadow] focus:border-[#111214] focus:ring-1 focus:ring-[#111214]"
              />
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="password" className="block text-xs font-bold uppercase tracking-widest text-[#8f939b]">
                  Password
                </label>
                <a href="#" className="text-xs font-bold text-[#111214] hover:underline">
                  Forgot password?
                </a>
              </div>
              <input 
                type="password" 
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••" 
                className="w-full rounded-xl border border-[rgba(49,51,55,0.1)] bg-white px-4 py-3 text-sm font-medium text-[#111214] placeholder-[#a1a5ab] shadow-[0_2px_10px_rgba(49,51,55,0.02)] outline-none transition-[border-color,box-shadow] focus:border-[#111214] focus:ring-1 focus:ring-[#111214]"
              />
            </div>

            <button 
              type="submit"
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-[#111214] px-5 py-3.5 text-sm font-bold text-white shadow-[0_14px_28px_rgba(49,51,55,0.16)] transition-[background-color,transform,box-shadow] duration-200 hover:-translate-y-px hover:bg-[#313337] hover:shadow-[0_18px_32px_rgba(49,51,55,0.2)]"
            >
              Sign In <ArrowRight size={16} />
            </button>
          </form>

          <div className="mt-8 relative flex items-center py-2">
            <div className="flex-grow border-t border-[rgba(49,51,55,0.08)]"></div>
            <span className="flex-shrink-0 mx-4 text-xs font-bold uppercase tracking-widest text-[#8f939b]">or</span>
            <div className="flex-grow border-t border-[rgba(49,51,55,0.08)]"></div>
          </div>

          <button className="mt-6 w-full rounded-full border border-[rgba(49,51,55,0.1)] bg-[rgba(255,255,255,0.66)] px-5 py-3 text-sm font-bold text-[#111214] shadow-[0_6px_18px_rgba(49,51,55,0.04)] transition-[transform,box-shadow,background-color] duration-200 hover:-translate-y-px hover:bg-white hover:shadow-[0_12px_24px_rgba(49,51,55,0.08)]">
            Continue with Google
          </button>
        </div>

      </div>
    </div>
  );
}
