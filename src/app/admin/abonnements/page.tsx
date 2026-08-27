'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CreditCard, CheckCircle2, Clock, Calendar, Bike, User, ShieldCheck } from 'lucide-react';

export default function AdminAbonnementsPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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

  const handleGrantSubscription = async (userId: string, months: number = 1) => {
    setActionLoading(true);
    setSuccessMessage(null);

    try {
      const res = await fetch('/api/admin/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, months }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur lors de l\'activation');

      setSuccessMessage(data.message || 'Abonnement activé avec succès !');
      await fetchData();
    } catch (err: any) {
      alert(err.message || 'Erreur lors de l\'activation');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-12">
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/admin" className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-xl font-bold text-white">Gestion des Abonnements (1er mois offert + 1 000 FCFA/mois)</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {successMessage && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-sm flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {users.map((u) => {
              const activeSub = u.subscriptions?.find((s: any) => s.status === 'active');
              const creationDate = new Date(u.createdAt);
              const oneMonthDate = new Date(creationDate.getTime() + 30 * 24 * 60 * 60 * 1000);
              const isFirstMonthOffered = new Date() <= oneMonthDate;

              return (
                <div key={u.id} className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center font-bold text-amber-400 text-xs">
                          {u.role === 'driver' ? <Bike className="w-4 h-4" /> : <User className="w-4 h-4" />}
                        </div>
                        <span className="text-xs font-bold text-slate-300 uppercase">{u.role}</span>
                      </div>

                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${
                        activeSub ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                        isFirstMonthOffered ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' :
                        'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      }`}>
                        {activeSub ? 'Abonnement Actif' : isFirstMonthOffered ? '1er Mois Offert (Gratuit)' : 'Abonnement Expiré'}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-bold text-white text-base">{u.fullName || 'Utilisateur'}</h3>
                      <p className="text-xs text-slate-400">Tél: {u.phone || 'N/A'} | Email: {u.email || 'N/A'}</p>
                      <p className="text-[11px] text-slate-500 mt-1">Inscrit le: {creationDate.toLocaleDateString('fr-FR')}</p>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs space-y-1.5">
                      {activeSub ? (
                        <>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400">Expire le :</span>
                            <strong className="text-emerald-400 font-bold">{new Date(activeSub.expiresAt).toLocaleDateString('fr-FR')}</strong>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400">Montant :</span>
                            <strong className="text-white">{activeSub.amount} FCFA</strong>
                          </div>
                        </>
                      ) : isFirstMonthOffered ? (
                        <div className="text-cyan-400 font-medium space-y-0.5">
                          <div>🎉 Période de 1er mois offert active !</div>
                          <div className="text-[11px] text-slate-400">Valide jusqu'au: {oneMonthDate.toLocaleDateString('fr-FR')}</div>
                        </div>
                      ) : (
                        <div className="text-amber-400 font-medium">
                          ⚠️ Abonnement expiré depuis le {oneMonthDate.toLocaleDateString('fr-FR')}.
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80">
                    <button
                      onClick={() => handleGrantSubscription(u.id, 1)}
                      disabled={actionLoading}
                      className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold text-xs shadow-md flex items-center justify-center space-x-2 disabled:opacity-50"
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>{activeSub ? 'Prolonger de 1 Mois (+30 jours)' : 'Activer 1 Mois (1 000 FCFA)'}</span>
                    </button>
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
