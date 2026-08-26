'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Clock, CheckCircle2, XCircle, Package } from 'lucide-react';

export default function MesPropositionsDriverPage() {
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    try {
      const res = await fetch('/api/deliveries?filter=my_offers');
      if (res.ok) {
        const data = await res.json();
        setOffers(data.offers || []);
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
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center space-x-4">
          <Link href="/driver" className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-bold text-white">Mes Propositions Soumises</h1>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {loading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : offers.length === 0 ? (
          <div className="p-12 rounded-3xl bg-slate-900/40 border border-slate-800 text-center space-y-3">
            <Package className="w-12 h-12 text-slate-600 mx-auto" />
            <div className="text-slate-400 text-sm">Vous n'avez pas encore soumis de proposition de tarif.</div>
            <Link href="/driver/demandes" className="inline-block px-5 py-3 rounded-2xl bg-orange-500 text-white font-bold text-xs">
              Voir les demandes disponibles
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {offers.map((offer) => (
              <div key={offer.id} className="p-6 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center space-x-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${
                      offer.status === 'accepted' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                      offer.status === 'rejected' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                      'bg-amber-500/10 border-amber-500/20 text-amber-400'
                    }`}>
                      {offer.status === 'accepted' ? 'Acceptée par le client' : offer.status === 'rejected' ? 'Refusée' : 'En attente'}
                    </span>
                    <span className="text-xs text-slate-500">{new Date(offer.createdAt).toLocaleDateString('fr-FR')}</span>
                  </div>

                  <h3 className="font-bold text-white text-base mt-2">{offer.deliveryRequest?.packageDescription || 'Livraison'}</h3>
                  <p className="text-xs text-slate-400">Client: {offer.deliveryRequest?.client?.fullName || 'Client'}</p>
                  <p className="text-xs text-slate-500">Trajet: {offer.deliveryRequest?.pickupAddress} → {offer.deliveryRequest?.destinationAddress}</p>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-2xl font-black text-orange-400">{offer.proposedPrice} FCFA</div>
                  <div className="text-xs text-slate-500">Durée: ~{offer.estimatedDuration || 20} min</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
