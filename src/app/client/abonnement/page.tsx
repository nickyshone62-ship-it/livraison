'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, CreditCard, ShieldCheck, CheckCircle2, Clock, AlertTriangle, RefreshCw, Calendar, Sparkles, Check, ArrowRight } from 'lucide-react';
import { Navbar } from '@/components/Navbar';

export default function ClientAbonnementPage() {
  const [subData, setSubData] = useState<any>(null);
  const [loadingSub, setLoadingSub] = useState(true);

  const [paymentMethod, setPaymentMethod] = useState<'orange_money' | 'moov_money' | 'wave'>('orange_money');
  const [transactionReference, setTransactionReference] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscriptionData = async () => {
    setLoadingSub(true);
    try {
      const res = await fetch(`/api/subscriptions/me?t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        setSubData(data);
      }
    } catch (err) {
      console.error('Erreur chargement abonnement:', err);
    } finally {
      setLoadingSub(false);
    }
  };

  useEffect(() => {
    fetchSubscriptionData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch('/api/subscriptions/renew', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentMethod,
          userTxRef: transactionReference,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur soumission abonnement');

      setSuccessMsg('Paiement d\'abonnement soumis avec succès ! Il est en cours de vérification par l\'administration.');
      setTransactionReference('');
      fetchSubscriptionData();
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la soumission de l\'abonnement');
    } finally {
      setSubmitting(false);
    }
  };

  const currentSub = subData?.currentSubscription;
  const paymentsList = subData?.payments || [];
  const pendingPayment = paymentsList.find((p: any) => p.status === 'pending');

  let daysLeft = 0;
  let isSubActive = false;
  let expiresFormatted = '';

  if (currentSub && currentSub.status === 'active' && currentSub.expiresAt) {
    const expDate = new Date(currentSub.expiresAt);
    const now = new Date();
    if (expDate > now) {
      isSubActive = true;
      daysLeft = Math.max(1, Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
      expiresFormatted = expDate.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    }
  }

  const progressPercentage = Math.min(100, Math.max(0, Math.round((daysLeft / 30) * 100)));

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-amber-500 selection:text-white flex flex-col justify-between">
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* EN-TÊTE PAGE */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center space-x-4">
            <Link href="/client" className="p-2.5 rounded-2xl bg-slate-100 border border-slate-200 text-slate-700 hover:text-slate-950 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-950">Suivi de Mon Abonnement Client</h1>
              <p className="text-xs text-slate-600 font-medium mt-0.5">Accès illimité à la publication de demandes de livraison géolocalisées</p>
            </div>
          </div>

          <button
            onClick={fetchSubscriptionData}
            disabled={loadingSub}
            className="self-start sm:self-auto px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-2 border border-slate-200 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 text-amber-600 ${loadingSub ? 'animate-spin' : ''}`} />
            <span>Actualiser le statut</span>
          </button>
        </div>

        {/* 1. CARTE PRINCIPALE DE SUIVI DU STATUT */}
        {loadingSub ? (
          <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center py-12 space-y-3 shadow-sm">
            <div className="w-8 h-8 border-3 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm font-semibold text-slate-600">Chargement des données d'abonnement...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* CARTE STATUT ACTUEL */}
            <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Statut de votre abonnement</span>
                {isSubActive ? (
                  <span className="px-3.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-extrabold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>ABONNEMENT ACTIF</span>
                  </span>
                ) : pendingPayment ? (
                  <span className="px-3.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-extrabold flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-600 animate-spin" />
                    <span>EN COURS DE VÉRIFICATION</span>
                  </span>
                ) : (
                  <span className="px-3.5 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-extrabold flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                    <span>ABONNEMENT EXPIRÉ / INACTIF</span>
                  </span>
                )}
              </div>

              {isSubActive ? (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <h2 className="text-3xl font-black text-slate-950">Abonnement Mensuel Client</h2>
                    <p className="text-sm text-slate-600 font-medium">
                      Valide jusqu'au <strong className="text-slate-900">{expiresFormatted}</strong>
                    </p>
                  </div>

                  {/* BARRE DE PROGRESSION DE VALIDITÉ */}
                  <div className="space-y-2 pt-2">
                    <div className="flex justify-between text-xs font-bold text-slate-700">
                      <span>Accès illimité actif</span>
                      <span className="text-amber-600">{daysLeft} jours restants</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden border border-slate-200">
                      <div
                        className="bg-gradient-to-r from-amber-500 to-orange-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${progressPercentage}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Un mois complet d'accès continu pour toutes vos courses à Ouagadougou.
                    </p>
                  </div>
                </div>
              ) : pendingPayment ? (
                <div className="space-y-4 p-5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900">
                  <div className="flex items-center gap-2 font-extrabold text-sm text-amber-800">
                    <Clock className="w-5 h-5 text-amber-600" />
                    <span>Paiement de 1 000 FCFA transmis le {new Date(pendingPayment.createdAt).toLocaleDateString('fr-FR')}</span>
                  </div>
                  <p className="text-xs text-amber-950 leading-relaxed">
                    Votre paiement de référence <strong>"{pendingPayment.transactionReference}"</strong> via <strong>{pendingPayment.paymentMethod.toUpperCase()}</strong> est en cours d'examen par l'administrateur. Dès confirmation, votre abonnement sera automatiquement activé pour 30 jours.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 p-5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900">
                  <div className="flex items-center gap-2 font-extrabold text-sm text-rose-800">
                    <AlertTriangle className="w-5 h-5 text-rose-600" />
                    <span>Aucun abonnement actif enregistré</span>
                  </div>
                  <p className="text-xs text-rose-950 leading-relaxed">
                    Abonnez-vous pour seulement 1 000 FCFA / mois pour bénéficier de la publication de vos demandes de livraisons et la mise en relation avec tous les livreurs géolocalisés.
                  </p>
                </div>
              )}

              {/* AVANTAGES DE L'ABONNEMENT */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Ce que comprend votre abonnement :</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-700 font-medium">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Publication illimitée de courses</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Suivi en direct sur la carte interactive</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Mise en relation sans intermédiaire</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Remise de colis sécurisée avec code OTP</span>
                  </div>
                </div>
              </div>

            </div>

            {/* CARTE DE PAIEMENT RAPIDE (1 000 FCFA) */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center font-bold">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-950 text-base">Frais d'Abonnement</h3>
                  <div className="text-xs text-amber-600 font-bold">1 000 FCFA / 30 jours</div>
                </div>
              </div>

              {successMsg && (
                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-emerald-700">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Transmis !</span>
                  </div>
                  <p>{successMsg}</p>
                </div>
              )}

              {error && (
                <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2">Choisir le mode de paiement :</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('orange_money')}
                      className={`p-2.5 rounded-xl border text-center font-bold text-xs transition-all cursor-pointer ${
                        paymentMethod === 'orange_money' ? 'bg-orange-500 border-2 border-orange-500 text-white shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      Orange
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('moov_money')}
                      className={`p-2.5 rounded-xl border text-center font-bold text-xs transition-all cursor-pointer ${
                        paymentMethod === 'moov_money' ? 'bg-blue-600 border-2 border-blue-600 text-white shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      Moov
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('wave')}
                      className={`p-2.5 rounded-xl border text-center font-bold text-xs transition-all cursor-pointer ${
                        paymentMethod === 'wave' ? 'bg-cyan-500 border-2 border-cyan-500 text-white shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      Wave
                    </button>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1.5 text-slate-800">
                  <div className="font-bold text-slate-900">Numéro de dépôt officiel :</div>
                  {paymentMethod === 'orange_money' && (
                    <div>
                      <span className="font-extrabold text-slate-950 text-sm">06887330</span> (Orange Money)
                      <div className="mt-1"><code className="bg-slate-200 text-amber-700 px-1.5 py-0.5 rounded font-mono font-bold">*144*2*1*06887330*1000#</code></div>
                    </div>
                  )}
                  {paymentMethod === 'moov_money' && (
                    <div>
                      <span className="font-extrabold text-slate-950 text-sm">62017878</span> (Moov Money)
                      <div className="mt-1"><code className="bg-slate-200 text-blue-700 px-1.5 py-0.5 rounded font-mono font-bold">*555*2*1*62017878*1000#</code></div>
                    </div>
                  )}
                  {paymentMethod === 'wave' && (
                    <div>
                      <span className="font-extrabold text-slate-950 text-sm">06887330</span> (Wave)
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Référence de Transaction *</label>
                  <input
                    type="text"
                    required
                    value={transactionReference}
                    onChange={(e) => setTransactionReference(e.target.value)}
                    placeholder="ex: OM-98765432"
                    className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs outline-none focus:bg-white focus:ring-2 focus:ring-amber-500 transition-all placeholder-slate-400"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer group"
                >
                  {submitting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>{isSubActive ? 'Renouveler mon abonnement' : 'Activer mon abonnement'}</span>
                      <ArrowRight className="w-4 h-4 text-amber-400 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>
            </div>

          </div>
        )}

        {/* 2. HISTORIQUE DES PAIEMENTS D'ABONNEMENT */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-xl font-extrabold text-slate-950">Historique des Paiements d'Abonnement</h2>
              <p className="text-xs text-slate-500 mt-0.5">Suivi de toutes vos transactions d'abonnement soumises</p>
            </div>
            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
              {paymentsList.length} transaction(s)
            </span>
          </div>

          {paymentsList.length === 0 ? (
            <div className="text-center py-10 text-slate-500 space-y-2">
              <Calendar className="w-10 h-10 mx-auto text-slate-300" />
              <p className="text-sm font-semibold">Aucune transaction d'abonnement enregistrée pour le moment.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Référence</th>
                    <th className="py-3 px-4">Moyen</th>
                    <th className="py-3 px-4">Montant</th>
                    <th className="py-3 px-4 text-right">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
                  {paymentsList.map((p: any) => (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        {new Date(p.createdAt).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-700">
                        {p.transactionReference || 'N/A'}
                      </td>
                      <td className="py-3.5 px-4 uppercase font-bold text-slate-600">
                        {p.paymentMethod}
                      </td>
                      <td className="py-3.5 px-4 font-extrabold text-slate-950">
                        {Number(p.amount).toLocaleString('fr-FR')} FCFA
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {p.status === 'approved' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Validé</span>
                          </span>
                        ) : p.status === 'pending' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-bold">
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>En attente</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 text-[11px] font-bold">
                            <AlertTriangle className="w-3 h-3 text-red-600" />
                            <span>Refusé</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
