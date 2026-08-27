'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  XCircle,
  Package,
  MapPin,
  Navigation,
  Phone,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  User,
  ShieldCheck
} from 'lucide-react';
import { buildNavigationUrl } from '@/lib/mapUtils';

export default function MesPropositionsDriverPage() {
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOfferId, setExpandedOfferId] = useState<string | null>(null);

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
    <div className="min-h-screen bg-slate-950 text-white pb-16">
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/driver" className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-white">Mes Propositions Soumises ({offers.length})</h1>
              <p className="text-xs text-slate-400">Consultez vos offres et accédez aux détails des livraisons acceptées</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {loading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : offers.length === 0 ? (
          <div className="p-12 rounded-3xl bg-slate-900/40 border border-slate-800 text-center space-y-3">
            <Package className="w-12 h-12 text-slate-600 mx-auto" />
            <div className="text-slate-400 text-sm">Vous n'avez pas encore soumis de proposition de tarif.</div>
            <Link href="/driver/demandes" className="inline-block px-5 py-3 rounded-2xl bg-amber-500 text-slate-950 font-bold text-xs">
              Voir les demandes disponibles
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {offers.map((offer) => {
              const req = offer.deliveryRequest || {};
              const client = req.client || {};
              const isAccepted = offer.status === 'accepted';
              const isRejected = offer.status === 'rejected';
              const isExpanded = expandedOfferId === offer.id || isAccepted;

              const pickupNavUrl = buildNavigationUrl(req.pickupLatitude, req.pickupLongitude, req.pickupAddress);
              const destinationNavUrl = buildNavigationUrl(req.destinationLatitude, req.destinationLongitude, req.destinationAddress);

              return (
                <div
                  key={offer.id}
                  className={`p-6 rounded-3xl border transition-all space-y-4 ${
                    isAccepted
                      ? 'bg-slate-900 border-amber-500/50 shadow-xl shadow-amber-500/5'
                      : 'bg-slate-900 border-slate-800'
                  }`}
                >
                  {/* EN-TÊTE DE CARTE PROPOSITION */}
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${
                          isAccepted ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                          isRejected ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                          'bg-amber-500/10 border-amber-500/20 text-amber-400'
                        }`}>
                          {isAccepted ? '🎉 Offre Acceptée par le Client' : isRejected ? 'Refusée' : '⏳ En attente de validation'}
                        </span>
                        <span className="text-xs text-slate-500">
                          {new Date(offer.createdAt).toLocaleDateString('fr-FR')}
                        </span>
                      </div>

                      <h3 className="font-extrabold text-white text-lg mt-1">{req.packageDescription || 'Colis'}</h3>
                      <p className="text-xs text-slate-400">Catégorie: <strong className="text-slate-200">{req.packageCategory || 'Colis Général'}</strong></p>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="text-2xl font-black text-amber-400">{offer.proposedPrice} FCFA</div>
                        <div className="text-xs text-slate-500">Durée estimée: ~{offer.estimatedDuration || 20} min</div>
                      </div>

                      <button
                        onClick={() => setExpandedOfferId(isExpanded && !isAccepted ? null : offer.id)}
                        className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white border border-slate-700"
                      >
                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  {/* BANNIÈRE ACCEPTATION SI PROPOSITION ACCEPTÉE */}
                  {isAccepted && (
                    <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold flex flex-col md:flex-row items-center justify-between gap-3">
                      <div className="flex items-center space-x-2">
                        <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0" />
                        <span>Félicitations ! Le client a accepté votre tarif de {offer.proposedPrice} FCFA.</span>
                      </div>
                      <Link
                        href={`/driver/livraison/${offer.deliveryId}`}
                        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-slate-950 font-black text-xs flex items-center space-x-2 shadow-lg shrink-0"
                      >
                        <span>🚀 EXÉCUTER ET DÉMARRER LA COURSE</span>
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  )}

                  {/* DÉTAILS COMPLETS DE LA LIVRAISON ACCEPTÉE OU DE L'OFFRE */}
                  {isExpanded && (
                    <div className="space-y-4 pt-2">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        
                        {/* ADRESSE DÉPART POINT A */}
                        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                          <div className="font-bold text-amber-400 flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                              <MapPin className="w-4 h-4" />
                              <span>📍 Point de Départ (Ramassage Point A)</span>
                            </span>
                          </div>
                          <div className="text-slate-200 font-bold text-sm">{req.pickupAddress}</div>
                          {req.pickupInstructions && <div className="text-slate-400">Note: {req.pickupInstructions}</div>}
                          
                          <a
                            href={pickupNavUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-amber-400 hover:underline font-bold pt-1"
                          >
                            <span>🗺️ Ouvrir localisation Google Maps (Point A)</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>

                        {/* ADRESSE ARRIVÉE POINT B */}
                        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                          <div className="font-bold text-emerald-400 flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                              <Navigation className="w-4 h-4" />
                              <span>🏁 Point d'Arrivée (Destination Point B)</span>
                            </span>
                          </div>
                          <div className="text-slate-200 font-bold text-sm">{req.destinationAddress}</div>
                          {req.destinationInstructions && <div className="text-slate-400">Note: {req.destinationInstructions}</div>}

                          <a
                            href={destinationNavUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-emerald-400 hover:underline font-bold pt-1"
                          >
                            <span>🗺️ Ouvrir localisation Google Maps (Point B)</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>

                      </div>

                      {/* INFORMATIONS CONTACT CLIENT & DESTINATAIRE */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                          <div className="font-bold text-slate-300 uppercase text-[11px] tracking-wider">Contact Client (Émetteur)</div>
                          <div>Nom: <strong className="text-white">{client.fullName || 'Client'}</strong></div>
                          <div>Téléphone: <strong className="text-white">{client.phone || 'N/A'}</strong></div>
                          {client.phone && (
                            <a
                              href={`tel:${client.phone}`}
                              className="mt-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold text-[11px] inline-flex items-center space-x-1.5 border border-slate-700"
                            >
                              <Phone className="w-3.5 h-3.5" />
                              <span>Appeler le client ({client.phone})</span>
                            </a>
                          )}
                        </div>

                        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                          <div className="font-bold text-slate-300 uppercase text-[11px] tracking-wider">Contact Destinataire (Récepteur)</div>
                          <div>Nom: <strong className="text-white">{req.recipientName || 'Destinataire'}</strong></div>
                          <div>Téléphone: <strong className="text-white">{req.recipientPhone || 'N/A'}</strong></div>
                          {req.recipientPhone && (
                            <a
                              href={`tel:${req.recipientPhone}`}
                              className="mt-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold text-[11px] inline-flex items-center space-x-1.5 border border-slate-700"
                            >
                              <Phone className="w-3.5 h-3.5" />
                              <span>Appeler le destinataire ({req.recipientPhone})</span>
                            </a>
                          )}
                        </div>
                      </div>

                      {/* INFORMATIONS COMPLÉMENTAIRES SUR LE COLIS */}
                      <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs space-y-1 text-slate-400">
                        <div>Quantité: <strong className="text-white">{req.packageQuantity || 1}</strong> | Poids: <strong className="text-white">{req.packageWeight ? `${req.packageWeight} kg` : 'Non renseigné'}</strong> | Taille: <strong className="text-white">{req.packageSize || 'Standard'}</strong></div>
                        {req.additionalInstructions && <div>Instructions spéciales: <span className="text-amber-300">{req.additionalInstructions}</span></div>}
                        {offer.message && <div>Votre message transmis: <span className="text-slate-300">"{offer.message}"</span></div>}
                      </div>

                      {/* BOUTON D'ACTION PRINCIPAL POUR COURSE ACCEPTÉE */}
                      {isAccepted && (
                        <div className="pt-2">
                          <Link
                            href={`/driver/livraison/${offer.deliveryId}`}
                            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-slate-950 font-black text-sm flex items-center justify-center space-x-2 shadow-xl cursor-pointer text-center"
                          >
                            <span>🚀 EXÉCUTER ET DÉMARRER CETTE LIVRAISON</span>
                            <ArrowRight className="w-5 h-5" />
                          </Link>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
