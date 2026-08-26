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
  AlertCircle
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

  const selectedOffer = delivery.offers?.find((o: any) => o.status === 'accepted');

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
        return 4;
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
            <div className={`p-2 rounded-lg ${currentStepNum >= 2 ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-100 text-slate-400'}`}>
              2. Récupéré
            </div>
            <div className={`p-2 rounded-lg ${currentStepNum >= 3 ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-100 text-slate-400'}`}>
              3. En route
            </div>
            <div className={`p-2 rounded-lg ${currentStepNum >= 4 ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-100 text-slate-400'}`}>
              4. Arrivée
            </div>
            <div className={`p-2 rounded-lg ${currentStepNum >= 5 ? 'bg-emerald-600 text-white font-bold' : 'bg-slate-100 text-slate-400'}`}>
              5. Livré
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

        {/* BOUTONS D'ACTION DU WORKFLOW */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Action suivante</div>

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

          {delivery.status === 'driver_arriving' && (
            <button
              onClick={() => handleUpdateStatus('package_picked_up')}
              disabled={actionLoading}
              className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-sm rounded-xl shadow-md cursor-pointer"
            >
              Colis récupéré au départ
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

          {delivery.status === 'in_transit' && (
            <button
              onClick={() => handleUpdateStatus('delivered')}
              disabled={actionLoading}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-md cursor-pointer"
            >
              Colis remis au destinataire
            </button>
          )}

          {delivery.status === 'delivered' && (
            <button
              onClick={() => handleUpdateStatus('completed')}
              disabled={actionLoading}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-emerald-400 font-bold text-sm rounded-xl shadow-md cursor-pointer"
            >
              Paiement reçu & Clôturer la livraison
            </button>
          )}

          {delivery.status === 'completed' && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold text-center flex items-center justify-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>Livraison terminée et clôturée avec succès !</span>
            </div>
          )}
        </div>

      </main>

    </div>
  );
}

