'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, XCircle, DollarSign, Clock, ShieldCheck } from 'lucide-react';

export default function AdminPaiementsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const res = await fetch('/api/admin/payments');
      if (res.ok) {
        const data = await res.json();
        setPayments(data.payments || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleProcessPayment = async (paymentId: string, action: 'approve' | 'reject') => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/payments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentId,
          action,
          rejectionReason: action === 'reject' ? rejectionReason : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur traitement paiement');

      setRejectingId(null);
      setRejectionReason('');
      await fetchPayments();
    } catch (err: any) {
      alert(err.message || 'Erreur traitement paiement');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-12">
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center space-x-4">
          <Link href="/admin" className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-bold text-white">Gestion & Vérification des Paiements</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {loading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : payments.length === 0 ? (
          <div className="p-12 rounded-3xl bg-slate-900/40 border border-slate-800 text-center text-slate-400 text-sm">
            Aucun paiement enregistré.
          </div>
        ) : (
          <div className="space-y-4">
            {payments.map((p) => (
              <div key={p.id} className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase border ${
                        p.status === 'approved' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                        p.status === 'rejected' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                        'bg-amber-500/10 border-amber-500/20 text-amber-400'
                      }`}>
                        {p.status}
                      </span>
                      <span className="text-xs text-slate-500">{new Date(p.createdAt).toLocaleString('fr-FR')}</span>
                    </div>

                    <h3 className="font-bold text-white text-base mt-2">
                      Utilisateur: {p.user?.fullName || 'Inconnu'} ({p.user?.phone || 'N/A'}) — Rôle: {p.user?.role}
                    </h3>
                    <p className="text-xs text-slate-400">
                      Type: <strong className="text-amber-400">{p.paymentType}</strong> | Méthode: <strong className="text-white">{p.paymentMethod}</strong> | Réf: <code className="text-amber-300 font-bold">{p.transactionReference || 'Non renseignée'}</code>
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-2xl font-black text-emerald-400">{p.amount} FCFA</div>
                    <div className="text-[10px] text-slate-500">{p.currency || 'XOF'}</div>
                  </div>
                </div>

                {/* Actions if status is pending */}
                {p.status === 'pending' && (
                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-end space-y-2 sm:space-y-0 sm:space-x-3">
                    <button
                      onClick={() => handleProcessPayment(p.id, 'approve')}
                      disabled={actionLoading}
                      className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-lg"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Approuver & Activer</span>
                    </button>

                    <button
                      onClick={() => setRejectingId(rejectingId === p.id ? null : p.id)}
                      disabled={actionLoading}
                      className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 font-bold text-xs flex items-center justify-center space-x-2"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Rejeter</span>
                    </button>
                  </div>
                )}

                {rejectingId === p.id && (
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                    <label className="block text-xs font-semibold text-slate-300">Motif du rejet</label>
                    <input
                      type="text"
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="ex: Référence introuvable ou montant incorrect"
                      className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs outline-none"
                    />
                    <button
                      onClick={() => handleProcessPayment(p.id, 'reject')}
                      disabled={actionLoading}
                      className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs"
                    >
                      Confirmer le rejet
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
