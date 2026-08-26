'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CreditCard, ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function DriverAbonnementPage() {
  const [paymentMethod, setPaymentMethod] = useState<'orange_money' | 'moov_money' | 'wave'>('orange_money');
  const [transactionReference, setTransactionReference] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch('/api/subscriptions/renew', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentMethod,
          userTxRef: transactionReference,
        }),
      });

      if (!res.ok) throw new Error('Erreur soumission abonnement');
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Erreur soumission abonnement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-12">
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center space-x-4">
          <Link href="/driver" className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-bold text-white">Mon Abonnement Mensuel Livreur</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <div className="p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-orange-950/40 border border-slate-800 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-orange-500/10 text-orange-400 flex items-center justify-center mx-auto">
            <CreditCard className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black">Abonnement Livreur — 1 000 FCFA / mois</h2>
          <p className="text-slate-400 text-xs max-w-md mx-auto">
            Conservez 100% de vos gains de livraison sans aucune commission.
          </p>
        </div>

        {success ? (
          <div className="p-6 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 mx-auto" />
            <div className="font-bold text-lg">Paiement d'abonnement transmis !</div>
            <p className="text-xs text-slate-300">Votre paiement de 1 000 FCFA est en cours de vérification par l'administration.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-6">
            {error && <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">{error}</div>}

            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod('orange_money')}
                className={`p-3 rounded-2xl border text-center font-bold text-xs ${paymentMethod === 'orange_money' ? 'bg-orange-500/20 border-orange-500 text-orange-400' : 'bg-slate-950 border-slate-800 text-slate-400'}`}
              >
                Orange Money
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('moov_money')}
                className={`p-3 rounded-2xl border text-center font-bold text-xs ${paymentMethod === 'moov_money' ? 'bg-blue-500/20 border-blue-500 text-blue-400' : 'bg-slate-950 border-slate-800 text-slate-400'}`}
              >
                Moov Money
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('wave')}
                className={`p-3 rounded-2xl border text-center font-bold text-xs ${paymentMethod === 'wave' ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400' : 'bg-slate-950 border-slate-800 text-slate-400'}`}
              >
                Wave
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs space-y-2">
              <div className="font-bold text-orange-400">Paiement Mobile Money (1 000 FCFA) :</div>
              {paymentMethod === 'orange_money' && <div>Orange Money : <strong className="text-white">06887330</strong> (*144*2*1*06887330*1000#)</div>}
              {paymentMethod === 'moov_money' && <div>Moov Money : <strong className="text-white">62017878</strong> (*555*2*1*62017878*1000#)</div>}
              {paymentMethod === 'wave' && <div>Wave : <strong className="text-white">06887330</strong></div>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Référence de transaction</label>
              <input
                type="text"
                required
                value={transactionReference}
                onChange={(e) => setTransactionReference(e.target.value)}
                placeholder="ex: OM-12345678"
                className="w-full p-3 bg-slate-950 border border-slate-800 rounded-2xl text-white text-xs outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 text-white font-bold text-sm shadow-lg"
            >
              Soumettre mon paiement d'abonnement
            </button>
          </form>
        )}
      </main>
    </div>
  );
}
