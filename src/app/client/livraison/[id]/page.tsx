'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  MapPin,
  User,
  Package,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Star,
  MessageSquare,
  AlertCircle,
  Navigation,
  Phone,
  Truck,
  Check,
  Copy
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { AdminModeBanner } from '@/components/AdminModeBanner';
import DeliveryMap from '@/components/DeliveryMap';

export default function DetailLivraisonClientPage() {
  const params = useParams();
  const router = useRouter();
  const deliveryId = params.id as string;

  const [delivery, setDelivery] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // OTP Visibility & Copy states
  const [showOtp1, setShowOtp1] = useState(false);
  const [showOtp2, setShowOtp2] = useState(false);
  const [copiedOtp, setCopiedOtp] = useState<string | null>(null);

  const handleCopyOtp = (code: string, label: string) => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopiedOtp(label);
    setTimeout(() => setCopiedOtp(null), 2000);
  };

  // Formulaire d'avis
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState(false);


  useEffect(() => {
    fetchDelivery();
    // Rafraîchissement automatique toutes les 4s pour le suivi GPS temps réel
    const interval = setInterval(fetchDelivery, 4000);
    return () => clearInterval(interval);
  }, [deliveryId]);

  const fetchDelivery = async () => {
    try {
      const res = await fetch('/api/deliveries');
      if (res.ok) {
        const data = await res.json();
        const found = (data.requests || []).find((r: any) => r.id === deliveryId);
        setDelivery(found || null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDriver = async (offerId: string) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/deliveries/${deliveryId}/select-driver`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offerId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur lors de la sélection');

      await fetchDelivery();
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la sélection du livreur');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await fetch(`/api/deliveries/${deliveryId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, comment }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur lors de l\'évaluation');

      setReviewSuccess(true);
      await fetchDelivery();
    } catch (err: any) {
      alert(err.message || 'Erreur soumission avis');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-semibold text-slate-700">Chargement de la livraison...</span>
        </div>
      </div>
    );
  }

  if (!delivery) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 p-8 text-center space-y-4">
        <p className="text-slate-600 text-sm">Demande de livraison introuvable.</p>
        <Link href="/client" className="text-amber-600 font-bold hover:underline text-sm">
          Retour à l'accueil client
        </Link>
      </div>
    );
  }

  const offers = delivery.offers || [];
  const hasSelectedDriver = delivery.driver || delivery.driverName;
  const isCompleted = delivery.status === 'completed';

  const getElapsedTime = (createdAt: string) => {
    const start = new Date(createdAt).getTime();
    const now = new Date().getTime();
    const diffMins = Math.max(1, Math.floor((now - start) / (1000 * 60)));
    if (diffMins < 60) return `${diffMins} min`;
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* EN-TÊTE PAGE SUIVI */}
      <header className="bg-white border-b border-slate-200 py-4 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/client" className="p-2 rounded-lg bg-slate-100 text-slate-600 hover:text-slate-900">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="font-bold text-slate-900 text-base">Livraison #{delivery.id.slice(0, 8).toUpperCase()}</h1>
              <p className="text-xs text-slate-500">{delivery.packageDescription}</p>
            </div>
          </div>

          <span className="px-3 py-1 rounded bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold uppercase">
            {delivery.status === 'searching_driver' ? 'En recherche' : delivery.status === 'in_transit' ? 'En transit' : delivery.status}
          </span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        
        {/* CARTE DE SUIVI EN TEMPS RÉEL (SI LIVREUR SÉLECTIONNÉ OU EN TRANSIT) */}
        {hasSelectedDriver && (
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Truck className="w-5 h-5 text-amber-600" />
                <span>Votre livraison est en cours</span>
              </h2>
              <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>Temps écoulé : {getElapsedTime(delivery.createdAt)}</span>
              </span>
            </div>

            {/* GRANDE CARTE GPS INTERACTIVE */}
            <div className="h-80 rounded-xl overflow-hidden border border-slate-200 shadow-inner">
              <DeliveryMap
                pickupLat={delivery.pickupLatitude || 12.3714}
                pickupLng={delivery.pickupLongitude || -1.5197}
                dropoffLat={delivery.destinationLatitude || 12.3900}
                dropoffLng={delivery.destinationLongitude || -1.4900}
                driverLat={delivery.driverLatitude}
                driverLng={delivery.driverLongitude}
                driverName={delivery.driverName || 'Livreur'}
              />
            </div>

            {/* INFORMATIONS DU LIVREUR & CONTACT */}
            <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-slate-900 text-amber-400 font-bold text-sm flex items-center justify-center border border-slate-800">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-slate-500 font-medium">Livreur assigné :</div>
                  <div className="text-sm font-bold text-slate-900">{delivery.driverName || delivery.assignments?.[0]?.driver?.profile?.fullName || 'Livreur Ouaga'}</div>
                  <div className="text-xs text-amber-600 font-semibold flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                    <span>4.9 / 5</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3">
                {delivery.driverPhone && (
                  <a
                    href={`tel:${delivery.driverPhone}`}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs flex items-center gap-2 shadow-sm"
                  >
                    <Phone className="w-4 h-4" />
                    <span>Contacter le livreur ({delivery.driverPhone})</span>
                  </a>
                )}
              </div>
            </div>

            {/* SECTION SÉCURITÉ DE VOTRE LIVRAISON (CODES OTP 1 & OTP 2) */}
            <div className="mt-6 pt-6 border-t border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  <span>Sécurité de votre livraison — Codes OTP Confidentialité</span>
                </h3>
                <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded">
                  2-Factor Auth
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* CODE 1 : RÉCUPÉRATION */}
                <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-900 text-xs uppercase tracking-wider">
                      CODE 1 — RÉCUPÉRATION DU COLIS
                    </span>
                    <span className={`text-[11px] font-black px-2 py-0.5 rounded ${
                      delivery.assignments?.[0]?.pickupOtpVerified
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-amber-200/80 text-amber-900'
                    }`}>
                      {delivery.assignments?.[0]?.pickupOtpVerified ? '✓ Validé au départ' : '⏳ À donner au ramassage'}
                    </span>
                  </div>

                  <p className="text-slate-600 text-xs font-medium leading-relaxed">
                    Communiquez ce code au livreur <strong>uniquement lorsque celui-ci récupère votre colis</strong> au point de départ.
                  </p>

                  <div className="flex items-center gap-2 bg-white p-2.5 rounded-lg border border-amber-300">
                    <div className="font-mono text-xl font-black text-slate-900 tracking-widest flex-1 text-center">
                      {showOtp1 ? (delivery.assignments?.[0]?.pickupOtp || '----') : '••••••'}
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowOtp1(!showOtp1)}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold text-xs rounded-md transition-colors"
                    >
                      {showOtp1 ? 'Masquer' : 'Afficher'}
                    </button>
                    {delivery.assignments?.[0]?.pickupOtp && (
                      <button
                        type="button"
                        onClick={() => handleCopyOtp(delivery.assignments[0].pickupOtp, 'OTP1')}
                        className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-md transition-colors flex items-center gap-1 cursor-pointer"
                        title="Copier le code OTP 1"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>{copiedOtp === 'OTP1' ? 'Copié !' : 'Copier'}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* CODE 2 : LIVRAISON FINALE */}
                <div className="p-4 rounded-xl bg-sky-50/60 border border-sky-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sky-900 text-xs uppercase tracking-wider">
                      CODE 2 — LIVRAISON FINALE (Point B)
                    </span>
                    <span className={`text-[11px] font-black px-2 py-0.5 rounded ${
                      delivery.assignments?.[0]?.deliveryOtpVerified
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-sky-200/80 text-sky-900'
                    }`}>
                      {delivery.assignments?.[0]?.deliveryOtpVerified ? '✓ Validé à l\'arrivée' : '🔒 À donner à la réception'}
                    </span>
                  </div>

                  <p className="text-slate-600 text-xs font-medium leading-relaxed">
                    Communiquez ce code au livreur <strong>uniquement lorsque votre colis est arrivé à destination</strong>.
                  </p>

                  <div className="flex items-center gap-2 bg-white p-2.5 rounded-lg border border-sky-300">
                    <div className="font-mono text-xl font-black text-slate-900 tracking-widest flex-1 text-center">
                      {showOtp2 ? (delivery.assignments?.[0]?.deliveryOtp || '----') : '••••••'}
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowOtp2(!showOtp2)}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-sky-300 font-bold text-xs rounded-md transition-colors"
                    >
                      {showOtp2 ? 'Masquer' : 'Afficher'}
                    </button>
                    {delivery.assignments?.[0]?.deliveryOtp && (
                      <button
                        type="button"
                        onClick={() => handleCopyOtp(delivery.assignments[0].deliveryOtp, 'OTP2')}
                        className="px-2.5 py-1.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-md transition-colors flex items-center gap-1 cursor-pointer"
                        title="Copier le code OTP 2"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>{copiedOtp === 'OTP2' ? 'Copié !' : 'Copier'}</span>
                      </button>
                    )}
                  </div>

                  <div className="p-2 rounded bg-amber-100/80 border border-amber-300 text-[11px] font-bold text-amber-900 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                    <span>Ne communiquez jamais le deuxième code avant l'arrivée du colis.</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* 4. PROPOSITIONS DES LIVREURS (COMPARAISON) */}
        {!hasSelectedDriver && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-extrabold text-slate-900">Choisissez votre livreur</h2>
              <span className="text-xs font-bold text-slate-500">{offers.length} proposition(s) reçue(s)</span>
            </div>

            {offers.length === 0 ? (
              <div className="p-8 rounded-xl bg-white border border-slate-200 text-center space-y-3 shadow-sm">
                <div className="w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-slate-600 text-sm font-medium">
                  Recherche de livreurs à proximité en cours à Ouagadougou...
                </p>
                <p className="text-xs text-slate-400">Les propositions vont s'afficher automatiquement ici dès que les livreurs soumettent leurs tarifs.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {offers.map((offer: any) => (
                  <div
                    key={offer.id}
                    className="p-5 rounded-xl bg-white border border-slate-200 hover:border-amber-500 transition-all shadow-sm space-y-4"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-sm border border-slate-200">
                          👤
                        </div>
                        <div>
                          <div className="font-bold text-sm text-slate-900">{offer.driverName || 'Livreur Indépendant'}</div>
                          <div className="text-xs text-amber-600 font-semibold flex items-center gap-1">
                            <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                            <span>4.8 (34 livraisons)</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-lg font-black text-amber-600">{offer.price} FCFA</div>
                        <div className="text-[11px] text-slate-500">{offer.estimatedTime || 25} min estimé</div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleSelectDriver(offer.id)}
                      disabled={actionLoading}
                      className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold rounded-lg text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {actionLoading ? 'Validation...' : 'Choisir ce livreur'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* DÉTAILS DU TRAJET */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-700 border-b border-slate-100 pb-2">Résumé de la course</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <div className="text-slate-400 font-semibold mb-1">📍 Départ (Point A)</div>
              <div className="font-bold text-slate-900 break-all">{delivery.pickupAddress}</div>
            </div>
            <div>
              <div className="text-slate-400 font-semibold mb-1">🏁 Arrivée (Point B)</div>
              <div className="font-bold text-slate-900 break-all">{delivery.destinationAddress}</div>
            </div>
          </div>
        </div>

      </main>

    </div>
  );
}