'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, User, Phone, Mail, MapPin, ShieldCheck } from 'lucide-react';

export default function ClientProfilPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => setUser(data.user))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-12">
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center space-x-4">
          <Link href="/client" className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-bold text-white">Mon Profil Client</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 flex items-center space-x-6">
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-2xl font-black text-white">
            {user?.fullName?.slice(0, 2) || 'CL'}
          </div>

          <div>
            <h2 className="text-2xl font-bold text-white">{user?.fullName || 'Client'}</h2>
            <div className="text-xs text-emerald-400 font-bold mt-1">Compte Approuvé (Client)</div>
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
          <h3 className="font-bold text-slate-300 border-b border-slate-800 pb-3">Informations Personnelles</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-xs text-slate-500">Téléphone</div>
              <div className="font-bold text-white">{user?.phone || 'N/A'}</div>
            </div>

            <div>
              <div className="text-xs text-slate-500">Email</div>
              <div className="font-bold text-white">{user?.email || 'N/A'}</div>
            </div>

            <div>
              <div className="text-xs text-slate-500">Ville</div>
              <div className="font-bold text-white">{user?.city || 'Ouagadougou'}</div>
            </div>

            <div>
              <div className="text-xs text-slate-500">Adresse</div>
              <div className="font-bold text-white">{user?.address || 'N/A'}</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
