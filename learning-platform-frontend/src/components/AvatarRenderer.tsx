'use client';

import { Bot, Volume2 } from 'lucide-react';

/**
 * Lightweight, local tutor presence indicator. The former third-party avatar
 * renderer accepted browser tokens; this component deliberately does not.
 */
export default function AvatarRenderer({
  isSpeaking = false,
  tutorMessage,
}: {
  isSpeaking?: boolean;
  tutorMessage?: string;
}) {
  return (
    <section className="relative flex aspect-video w-full flex-col justify-between overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 p-5 text-white shadow-xl">
      <div aria-hidden="true" className={`absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.25),transparent_42%)] transition-opacity ${isSpeaking ? 'opacity-100' : 'opacity-40'}`} />
      <div className="relative flex items-center justify-between">
        <span className="flex items-center gap-2 text-[13px] font-medium text-cyan-200"><span className={`h-2.5 w-2.5 rounded-full ${isSpeaking ? 'animate-pulse bg-emerald-400' : 'bg-slate-500'}`} /> {isSpeaking ? 'Tutor speaking' : 'Tutor ready'}</span>
        <Volume2 className="h-4 w-4 text-slate-400" aria-hidden="true" />
      </div>
      <div className="relative grid place-items-center"><span className={`grid h-24 w-24 place-items-center rounded-full border border-cyan-100/20 bg-cyan-300/10 ${isSpeaking ? 'scale-105 shadow-[0_0_40px_rgba(34,211,238,0.35)]' : ''} transition`}><Bot className="h-11 w-11 text-cyan-100" aria-hidden="true" /></span></div>
      <p className="relative line-clamp-2 min-h-10 text-center text-sm leading-5 text-slate-300">{tutorMessage ?? 'Your study guidance will appear here when the tutor is available.'}</p>
    </section>
  );
}
