'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, User, Mail, Phone, MapPin } from 'lucide-react';

export default function AdminClientsPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const res = await fetch('/api/admin/users');
      if (res.ok) {
        const data = await res.json();
        const filtered = (data.users || []).filter((u: any) => u.role === 'client');
        setClients(filtered);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-12">
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center space-x-4">
          <Link href="/admin" className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-bold text-white">Gestion des Clients ({clients.length})</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {loading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : clients.length === 0 ? (
          <div className="p-12 rounded-3xl bg-slate-900/40 border border-slate-800 text-center text-slate-400 text-sm">
            Aucun client enregistré.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {clients.map((c) => (
              <div key={c.id} className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold">
                    {c.fullName?.slice(0, 2) || 'CL'}
                  </div>
                  <div>
                    <div className="font-bold text-white text-base">{c.fullName || 'Client'}</div>
                    <div className="text-xs text-slate-400">Statut: <span className="text-emerald-400 font-bold">{c.accountStatus}</span></div>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs space-y-1">
                  <div>Tél: <span className="text-white font-medium">{c.phone || 'N/A'}</span></div>
                  <div>Email: <span className="text-white font-medium">{c.email || 'N/A'}</span></div>
                  <div>Ville: <span className="text-white font-medium">{c.city || 'Ouagadougou'}</span></div>
                  {c.address && <div>Adresse: <span className="text-white font-medium">{c.address}</span></div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
