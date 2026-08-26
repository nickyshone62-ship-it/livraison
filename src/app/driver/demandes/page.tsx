'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, MapPin, Package, Clock, Send, AlertCircle, CheckCircle2, Navigation, X } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { AdminModeBanner } from '@/components/AdminModeBanner';

export default function DemandesDisponiblesDriverPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Proposal Modal State
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [proposedPrice, setProposedPrice] = useState('');
  const [estimatedDuration, setEstimatedDuration] = useState('20');
  const [message, setMessage] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const res = await fetch('/api/deliveries');
      if (res.ok) {
        const data = await res.json();
        setRequests(data.requests || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenProposalModal = (req: any) => {
    setSelectedRequest(req);
    setProposedPrice('1500');
    setMessage('');
    setError(null);
    setSuccessMessage(null);
  };

  const handleSubmitProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest || !proposedPrice) return;

    setSubmitLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/deliveries/${selectedRequest.id}/propose`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proposedPrice,
          estimatedDuration,
          message,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur lors de l\'envoi de la proposition');

      setSuccessMessage('🎉 Proposition envoyée avec succès au client !');
      setTimeout(() => {
        setSelectedRequest(null);
        fetchRequests();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la soumission');
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* En-tête */}
      <header className="bg-white border-b border-slate-200 py-4 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <Link href="/driver" className="p-2 rounded-lg bg-slate-100 text-slate-600 hover:text-slate-900">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-slate-900">Demandes de livraisons disponibles</h1>
            <p className="text-xs text-slate-500">Ouagadougou 🇧🇫 — Soumettez vos propositions directement aux clients</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {loading ? (
          <div className="text-center py-12">
            <div className="w-6 h-6 border-2 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <span className="text-xs font-semibold text-slate-500 mt-2 block">Chargement des demandes...</span>
          </div>
        ) : requests.length === 0 ? (
          <div className="p-10 rounded-xl bg-white border border-slate-200 text-center space-y-3 shadow-sm">
            <Package className="w-10 h-10 text-slate-400 mx-auto" />
            <div className="text-slate-600 text-sm font-medium">Aucune demande de livraison disponible pour le moment.</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {requests.map((req) => {
              const hasOffered = req.offers && req.offers.length > 0;
              return (
                <div key={req.id} className="p-5 rounded-xl bg-white border border-slate-200 hover:border-amber-400 transition-all shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <span className="font-bold text-xs text-slate-900 bg-slate-100 px-2.5 py-1 rounded">
                      {req.packageCategory || 'Colis Général'}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">{new Date(req.createdAt).toLocaleDateString('fr-FR')}</span>
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-900 text-base">{req.packageDescription}</h3>
                    <p className="text-xs text-slate-500 mt-1">Client: {req.client?.fullName || 'Client'}</p>
                  </div>

                  <div className="space-y-1.5 text-xs bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <div className="flex items-center gap-2 text-slate-700 font-semibold">
                      <MapPin className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>📍 Départ: {req.pickupAddress}</span>
                    </div>
                    <div className="ml-2 pl-3 border-l-2 border-slate-200 text-slate-400 text-[11px] py-0.5">↓</div>
                    <div className="flex items-center gap-2 text-slate-700 font-semibold">
                      <Navigation className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>🏁 Arrivée: {req.destinationAddress}</span>
                    </div>
                  </div>

                  {hasOffered ? (
                    <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold text-center">
                      ✓ Offre de {req.offers[0].proposedPrice} FCFA envoyée
                    </div>
                  ) : (
                    <button
                      onClick={() => handleOpenProposalModal(req)}
                      className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold rounded-lg text-xs transition-colors flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                    >
                      <Send className="w-4 h-4" />
                      <span>Faire une proposition</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* MODALE SOUMISSION PROPOSITION */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="max-w-md w-full bg-white border border-slate-200 p-6 rounded-2xl shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Proposer un tarif au client</h3>
              <button onClick={() => setSelectedRequest(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-600 space-y-1 bg-slate-50 p-3 rounded-lg border border-slate-100">
              <div><strong className="text-slate-900">Colis :</strong> {selectedRequest.packageDescription}</div>
              <div><strong className="text-slate-900">Trajet :</strong> {selectedRequest.pickupAddress} $\rightarrow$ {selectedRequest.destinationAddress}</div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                {error}
              </div>
            )}

            {successMessage && (
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold text-center">
                {successMessage}
              </div>
            )}

            <form onSubmit={handleSubmitProposal} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Prix proposé (FCFA) *</label>
                <input
                  type="number"
                  required
                  min="500"
                  step="100"
                  value={proposedPrice}
                  onChange={(e) => setProposedPrice(e.target.value)}
                  placeholder="Ex: 1500"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 outline-none focus:ring-2 focus:ring-amber-500 font-extrabold text-base"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Durée estimée (minutes)</label>
                <input
                  type="number"
                  value={estimatedDuration}
                  onChange={(e) => setEstimatedDuration(e.target.value)}
                  placeholder="Ex: 20"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 outline-none focus:ring-2 focus:ring-amber-500 text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Message optionnel</label>
                <textarea
                  rows={2}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Ex: Prêt à démarrer immédiatement à Ouaga"
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 text-xs outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <button
                type="submit"
                disabled={submitLoading}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
              >
                {submitLoading ? (
                  <div className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Envoyer ma proposition</span>
                    <Send className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

