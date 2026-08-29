'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShieldCheck, ArrowLeft } from 'lucide-react';

import { fetchAuthMe } from '@/lib/sessionCache';

export function AdminModeBanner() {
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    fetchAuthMe()
      .then((user) => {
        if (user) setCurrentUser(user);
      })
      .catch(() => {});
  }, [pathname]);

  if (!currentUser || (currentUser.role || '').toLowerCase() !== 'admin') {
    return null;
  }

  // Only show banner when admin is viewing /client or /driver spaces (outside /admin)
  if (pathname.startsWith('/admin')) {
    return null;
  }

  const spaceName = pathname.startsWith('/driver') ? 'LIVREUR' : 'CLIENT';

  return (
    <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white px-4 py-2.5 shadow-xl border-b border-amber-400/30 text-xs sm:text-sm font-bold flex flex-wrap items-center justify-between gap-3 sticky top-16 z-40">
      <div className="flex items-center gap-2">
        <span className="w-7 h-7 rounded-lg bg-slate-950/30 flex items-center justify-center text-amber-300">
          <ShieldCheck className="w-4 h-4" />
        </span>
        <div className="flex items-center gap-2">
          <span className="bg-slate-950/40 text-amber-200 px-2.5 py-0.5 rounded-md uppercase text-[11px] font-black tracking-wider border border-amber-300/30">
            MODE ADMINISTRATEUR
          </span>
          <span className="hidden sm:inline text-amber-100 font-medium">
            Consultation de l'espace <strong className="text-white uppercase">{spaceName}</strong> en tant que Super Administrateur.
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Link
          href="/admin"
          className="px-3.5 py-1.5 bg-slate-950 hover:bg-slate-900 text-amber-300 hover:text-amber-200 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-lg border border-amber-500/40"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour à l'administration</span>
        </Link>
      </div>
    </div>
  );
}
