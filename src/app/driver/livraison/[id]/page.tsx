'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  MapPin,
  User,
  Package,
  ShieldCheck,
  CheckCircle2,
  Navigation,
  Phone,
  Clock,
  ExternalLink,
  Send,
  AlertCircle,
  KeyRound,
  X
} from 'lucide-react';
import { buildNavigationUrl } from '@/lib/mapUtils';
import { Navbar } from '@/components/Navbar';
import { AdminModeBanner } from '@/components/AdminModeBanner';

export default function ExecutionLivraisonDriverPage() {
  const params = useParams();
  const router = useRouter();
  const deliveryId = params.id as string;

  const [delivery, setDelivery] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Modales OTP
  const [otpModalType, setOtpModalType] = useState<'PICKUP' | 'DELIVERY' | null>(null);
  const [otpInput, setOtpInput] = useState('');
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpSuccess, setOtpSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchDelivery();
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

  const handleUpdateStatus = async (nextStatus: string) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/deliveries/${deliveryId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur mise à jour statut');

      await fetchDelivery();
    } catch (err: any) {
      alert(err.message || 'Erreur mise à jour statut');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenOtpModal = (type: 'PICKUP' | 'DELIVERY') => {
    setOtpModalType(type);
    setOtpInput('');
    setOtpError(null);
    setOtpSuccess(null);
  };

  const handleVerifyOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpModalType || !otpInput) return;

    setActionLoading(true);
    setOtpError(null);
    setOtpSuccess(null);

    try {
      const res = await fetch(`/api/deliveries/${deliveryId}/verify-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: otpModalType,
          code: otpInput,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur de vérification');

      setOtpSuccess(data.message || 'Code validé avec succès !');
      setTimeout(async () => {
        setOtpModalType(null);
        await fetchDelivery();
      }, 1200);
    } catch (err: any) {
      setOtpError(err.message || 'Code incorrect');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEmitGps = () => {
    if (!navigator.geolocation) {
      alert('La géolocalisation n\'est pas disponible.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          await fetch(`/api/deliveries/${deliveryId}/tracking`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              accuracy: pos.coords.accuracy,
            }),
          });
          alert('📍 Position GPS transmise avec succès au client !');
        } catch (err) {
          console.error(err);
        }
      },
      (err) => alert('Erreur GPS: ' + err.message)
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-semibold text-slate-700">Chargement de la course...</span>
        </div>
      </div>
    );
  }

  if (!delivery) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 p-8 text-center space-y-4">
        <p className="text-slate-600 text-sm">Livraison introuvable.</p>
        <Link href="/driver" className="text-amber-600 font-bold hover:underline text-sm">
          Retour au tableau de bord
        </Link>
      </div>
    );
  }

  const assignment = delivery.assignments?.[0];
  const pickupNavUrl = buildNavigationUrl(delivery.pickupLatitude, delivery.pickupLongitude, delivery.pickupAddress);
  const destinationNavUrl = buildNavigationUrl(delivery.destinationLatitude, delivery.destinationLongitude, delivery.destinationAddress);

  const getStepNumber = (status: string) => {
    switch (status) {
      case 'driver_selected':
      case 'driver_accepted':
      case 'driver_arriving':
        return 1;
      case 'package_picked_up':
        return 2;
      case 'in_transit':
        return 3;
      case 'delivered':
      case 'completed':
        return 5;
      default:
        return 1;
    }
  };

  const currentStepNum = getStepNumber(delivery.status);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      
      <Navbar />
      <AdminModeBanner />

      {/* EN-TÊTE */}
      <header className="bg-white border-b border-slate-200 py-4 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/driver" className="p-2 rounded-lg bg-slate-100 text-slate-600 hover:text-slate-900">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="font-bold text-slate-900 text-base">Course #{delivery.id.slice(0, 8).toUpperCase()}</h1>
              <p className="text-xs text-slate-500">{delivery.packageDescription}</p>
            </div>
          </div>

          <span className="px-3 py-1 rounded bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold uppercase">
            {delivery.status}
          </span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        
        {/* PARCOURS ACTION 5 ÉTAPES */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Progression de la course</div>
          
          <div className="grid grid-cols-5 gap-2 text-center text-xs font-semibold">
            <div className={`p-2 rounded-lg ${currentStepNum >= 1 ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-100 text-slate-400'}`}>
              1. Départ
            </div>
            <div className={`p-2 rounded-lg ${assignment?.pickupOtpVerified ? 'bg-emerald-600 text-white font-bold' : 'bg-slate-100 text-slate-400'}`}>
              2. OTP 1 ✓
            </div>
            <div className={`p-2 rounded-lg ${currentStepNum >= 3 ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-100 text-slate-400'}`}>
              3. En route
            </div>
            <div className={`p-2 rounded-lg ${currentStepNum >= 4 ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-100 text-slate-400'}`}>
              4. Arrivée
            </div>
            <div className={`p-2 rounded-lg ${assignment?.deliveryOtpVerified ? 'bg-emerald-600 text-white font-bold' : 'bg-slate-100 text-slate-400'}`}>
              5. OTP 2 ✓
            </div>
          </div>
        </div>

        {/* CARTES DE ITINÉRAIRE UNIQUES (POINT A & POINT B STRICTS) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* LIEN 1 : POINT DE DÉPART UNIQUEMENT */}
          <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm space-y-3">
            <div className="text-xs font-extrabold text-amber-600 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-4 h-4" />
              <span>📍 1. Aller au point de départ (Point A)</span>
            </div>
            <div className="text-sm font-bold text-slate-900 break-all">{delivery.pickupAddress}</div>
            {delivery.pickupInstructions && <div className="text-xs text-slate-500">Note: {delivery.pickupInstructions}</div>}

            <a
              href={pickupNavUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold text-xs rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm block text-center"
            >
              <span>Aller au point de départ</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>

          {/* LIEN 2 : POINT D'ARRIVÉE UNIQUEMENT */}
          <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm space-y-3">
            <div className="text-xs font-extrabold text-emerald-600 uppercase tracking-wider flex items-center gap-1.5">
              <Navigation className="w-4 h-4" />
              <span>🏁 2. Aller au point d'arrivée (Point B)</span>
            </div>
            <div className="text-sm font-bold text-slate-900 break-all">{delivery.destinationAddress}</div>
            {delivery.destinationInstructions && <div className="text-xs text-slate-500">Note: {delivery.destinationInstructions}</div>}

            <a
              href={destinationNavUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-emerald-400 font-bold text-xs rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm block text-center"
            >
              <span>Aller au point d'arrivée</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>

        </div>

        {/* ÉMETTEUR DE POSITION GPS */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="text-xs text-slate-600 font-medium">Partage GPS temps réel activé</div>
          <button
            onClick={handleEmitGps}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-lg text-xs flex items-center gap-1.5"
          >
            <Navigation className="w-3.5 h-3.5 text-amber-600" />
            <span>Actualiser ma position GPS</span>
          </button>
        </div>

        {/* BOUTONS D'ACTION DU WORKFLOW D'ÉTAPES AVEC OTP 1 ET OTP 2 */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Action suivante de la course</div>

          {delivery.status === 'driver_selected' && (
            <button
              onClick={() => handleUpdateStatus('driver_accepted')}
              disabled={actionLoading}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold text-sm rounded-xl shadow-md cursor-pointer"
            >
              Accepter la course
            </button>
          )}

          {delivery.status === 'driver_accepted' && (
            <button
              onClick={() => handleUpdateStatus('driver_arriving')}
              disabled={actionLoading}
              className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-sm rounded-xl shadow-md cursor-pointer"
            >
              En route vers le point de ramassage (Point A)
            </button>
          )}

          {/* ÉTAPE OTP 1 : RAMASSAGE AU POINT A */}
          {(delivery.status === 'driver_arriving' || (delivery.status === 'driver_accepted' && !assignment?.pickupOtpVerified)) && (
            <button
              onClick={() => handleOpenOtpModal('PICKUP')}
              disabled={actionLoading}
              className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-sm rounded-xl shadow-md cursor-pointer flex items-center justify-center gap-2"
            >
              <KeyRound className="w-5 h-5" />
              <span>Saisir le Code OTP 1 — Récupération du colis</span>
            </button>
          )}

          {delivery.status === 'package_picked_up' && (
            <button
              onClick={() => handleUpdateStatus('in_transit')}
              disabled={actionLoading}
              className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-sm rounded-xl shadow-md cursor-pointer"
            >
              En cours de livraison vers le destinataire (Point B)
            </button>
          )}

          {/* ÉTAPE OTP 2 : CONFIRMATION FINALE AU POINT B */}
          {(delivery.status === 'in_transit' || (delivery.status === 'package_picked_up' && assignment?.pickupOtpVerified)) && !assignment?.deliveryOtpVerified && (
            <button
              onClick={() => handleOpenOtpModal('DELIVERY')}
              disabled={actionLoading}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm rounded-xl shadow-md cursor-pointer flex items-center justify-center gap-2"
            >
              <KeyRound className="w-5 h-5" />
              <span>Saisir le Code OTP 2 — Valider la livraison finale</span>
            </button>
          )}

          {(delivery.status === 'completed' || assignment?.deliveryOtpVerified) && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold text-center flex items-center justify-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>Livraison confirmée et clôturée avec succès grâce aux deux OTP !</span>
            </div>
          )}
        </div>

      </main>

      {/* MODALE SAISIE ET VÉRIFICATION DES CODES OTP 1 & OTP 2 */}
      {otpModalType && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="max-w-md w-full bg-white border border-slate-200 p-6 rounded-2xl shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
                <KeyRound className="w-5 h-5 text-amber-600" />
                <span>
                  {otpModalType === 'PICKUP' ? 'OTP 1 — Récupération du colis' : 'OTP 2 — Confirmation de livraison'}
                </span>
              </div>
              <button onClick={() => setOtpModalType(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-slate-600 text-xs font-medium">
              {otpModalType === 'PICKUP'
                ? 'Demandez le code à 6 chiffres au client au point de ramassage.'
                : 'Demandez le deuxième code à 6 chiffres au destinataire à l\'arrivée.'}
            </p>

            {otpError && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold text-center">
                {otpError}
              </div>
            )}

            {otpSuccess && (
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold text-center">
                {otpSuccess}
              </div>
            )}

            <form onSubmit={handleVerifyOtpSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Entrez le code OTP 6 chiffres *
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                  placeholder="Ex: 482731"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-center text-2xl font-mono font-black tracking-widest text-slate-900 outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <button
                type="submit"
                disabled={actionLoading || otpInput.length < 6}
                className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 shadow-md disabled:opacity-50 cursor-pointer"
              >
                {actionLoading ? (
                  <div className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>{otpModalType === 'PICKUP' ? 'Valider le code de récupération' : 'Confirmer la livraison'}</span>
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


