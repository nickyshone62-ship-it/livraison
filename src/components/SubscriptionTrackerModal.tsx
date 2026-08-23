'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Clock,
  Calendar,
  Sparkles,
  RefreshCw,
  Receipt,
  Download,
  ShieldCheck,
  Zap,
} from 'lucide-react';

interface SubscriptionTrackerModalProps {
  onClose: () => void;
  onOpenRenewModal: () => void;
  role: 'COMMERCANT' | 'LIVREUR' | 'CLIENT' | string;
}

export function SubscriptionTrackerModal({
  onClose,
  onOpenRenewModal,
  role,
}: SubscriptionTrackerModalProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  const fetchSubscriptionData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/subscriptions/me');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptionData();
  }, []);

  const sub = data?.currentSubscription;
  const pendingPayment = data?.pendingPayment;
  const history = data?.paymentHistory || [];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl text-white shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-blue-900/60 via-indigo-900/60 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shadow-inner">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold tracking-tight flex items-center gap-2">
                <span>Suivi de Mon Abonnement</span>
                <Sparkles className="w-4 h-4 text-blue-400" />
              </h2>
              <p className="text-xs text-slate-400 font-medium">
                Gérez la validité de votre accès et consultez l'historique de vos abonnements
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-3">
              <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-bold">Chargement de votre statut d'abonnement...</span>
            </div>
          ) : (
            <>
              {/* Alert Pending Admin Validation */}
              {pendingPayment && (
                <div className="p-4 bg-amber-950/70 border border-amber-500/60 rounded-2xl flex items-start gap-3 text-amber-200 text-xs">
                  <Clock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5 animate-pulse" />
                  <div>
                    <h4 className="font-extrabold text-amber-300">Paiement en attente de validation administrative</h4>
                    <p className="mt-1 font-medium text-amber-100/90">
                      Un paiement de <strong>{pendingPayment.amountFcfa} FCFA</strong> (Réf: {pendingPayment.transactionReference}) a été soumis par {pendingPayment.paymentMethod}. L'administrateur valide la réception Mobile Money dans les plus brefs délais.
                    </p>
                  </div>
                </div>
              )}

              {/* Active / Expired Subscription Status Card */}
              <div className="p-6 bg-slate-950 border border-slate-800 rounded-2xl space-y-5 relative overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Formule Actuelle
                    </span>
                    <h3 className="text-xl font-black text-white mt-0.5">
                      {sub ? sub.planName : (role === 'LIVREUR' ? 'Plan Livreur Mensuel' : 'Plan Boutique Mensuel')}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    {sub?.status === 'ACTIVE' ? (
                      <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-950/90 text-emerald-300 border border-emerald-500/50 text-xs font-extrabold">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                        Abonnement Actif
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-red-950/90 text-red-300 border border-red-500/50 text-xs font-extrabold">
                        <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                        Abonnement Expiré
                      </span>
                    )}
                  </div>
                </div>

                {/* Progress bar and dates */}
                {sub && (
                  <div className="space-y-2 pt-2 border-t border-slate-800/80">
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-blue-400" />
                        Temps Restant :
                      </span>
                      <span className={sub.daysRemaining > 5 ? 'text-emerald-400 font-extrabold' : 'text-amber-400 font-extrabold'}>
                        {sub.daysRemaining} jour(s) restant(s)
                      </span>
                    </div>

                    <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden p-0.5">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          sub.daysRemaining > 5
                            ? 'bg-gradient-to-r from-blue-500 to-emerald-400'
                            : 'bg-gradient-to-r from-amber-500 to-red-500'
                        }`}
                        style={{ width: `${Math.max(5, 100 - sub.progressPercentage)}%` }}
                      />
                    </div>

                    <div className="flex justify-between items-center text-[11px] text-slate-400 pt-1 font-medium">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-500" />
                        Début : {new Date(sub.startsAt).toLocaleDateString('fr-FR')}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-500" />
                        Expiration : {new Date(sub.endsAt).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  </div>
                )}

                {/* Call to action renew button */}
                <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="text-xs text-slate-400 font-medium">
                    Tarif mensuel : <strong className="text-white font-extrabold">{sub?.priceFcfa || 1000} FCFA / mois</strong>
                  </div>
                  <button
                    onClick={() => {
                      onClose();
                      onOpenRenewModal();
                    }}
                    className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-extrabold rounded-xl shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Recharger / Prolongé mon abonnement</span>
                  </button>
                </div>
              </div>

              {/* Payment History List */}
              <div className="space-y-3">
                <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-blue-400" />
                  Historique des Règlements d'Abonnement ({history.length})
                </h3>

                {history.length === 0 ? (
                  <div className="p-6 bg-slate-950/50 border border-slate-800 rounded-2xl text-center text-xs text-slate-500 font-medium">
                    Aucun paiement d'abonnement archivé pour l'instant. Votre premier mois d'utilisation vous est gracieusement offert.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {history.map((pay: any) => (
                      <div
                        key={pay.id}
                        className="p-4 bg-slate-950 border border-slate-800/80 rounded-2xl flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="space-y-1">
                          <div className="font-extrabold text-white flex items-center gap-2">
                            <span>{pay.amountFcfa} FCFA</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-bold border border-slate-700">
                              {pay.paymentMethod}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            Réf : {pay.transactionReference}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            Effectué le {new Date(pay.createdAt).toLocaleDateString('fr-FR')} à {new Date(pay.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {pay.status === 'COMPLETED' ? (
                            <span className="px-3 py-1 bg-emerald-950 border border-emerald-800 text-emerald-300 rounded-lg font-bold text-[11px] flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              Validé
                            </span>
                          ) : pay.status === 'PENDING' ? (
                            <span className="px-3 py-1 bg-amber-950 border border-amber-800 text-amber-300 rounded-lg font-bold text-[11px] flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-amber-400" />
                              En Attente
                            </span>
                          ) : (
                            <span className="px-3 py-1 bg-red-950 border border-red-800 text-red-300 rounded-lg font-bold text-[11px]">
                              Rejeté
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Paiements sécurisés Orange Money, Moov Money, Wave
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl"
          >
            Fermer
          </button>
        </div>

      </div>
    </div>
  );
}
