'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CreditCard, CheckCircle2, Clock, XCircle } from 'lucide-react';

export default function AdminAbonnementsPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/admin/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
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
          <h1 className="text-xl font-bold text-white">Suivi des Abonnements Mensuels (1 000 FCFA)</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {loading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {users.map((u) => {
              const activeSub = u.subscriptions?.find((s: any) => s.status === 'active');
              return (
                <div key={u.id} className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400 uppercase">{u.role}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      activeSub ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}>
                      {activeSub ? 'Abonnement Actif' : 'Abonnement Inactif'}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-white text-base">{u.fullName || 'Utilisateur'}</h3>
                    <p className="text-xs text-slate-400">Tél: {u.phone || 'N/A'}</p>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs space-y-1">
                    {activeSub ? (
                      <>
                        <div>Expire le: <strong className="text-emerald-400">{new Date(activeSub.expiresAt).toLocaleDateString('fr-FR')}</strong></div>
                        <div>Montant: <strong className="text-white">{activeSub.amount} FCFA</strong></div>
                      </>
                    ) : (
                      <div className="text-slate-500">Aucun abonnement actif enregistré.</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
