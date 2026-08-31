'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Truck,
  Clock,
  CheckCircle2,
  Star,
  Package,
  ChevronRight,
  AlertCircle,
  MapPin,
  Navigation,
  ShieldCheck,
  User,
  ArrowRight,
  ExternalLink,
  CreditCard
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { AdminModeBanner } from '@/components/AdminModeBanner';
import { buildNavigationUrl } from '@/lib/mapUtils';
import { fetchAuthMe } from '@/lib/sessionCache';

export default function DriverDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [openRequests, setOpenRequests] = useState<any[]>([]);
  const [myOffers, setMyOffers] = useState<any[]>([]);
  const [activeDelivery, setActiveDelivery] = useState<any>(null);
  const [isAvailable, setIsAvailable] = useState<boolean>(true);
  const [subData, setSubData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      if (!document.hidden) {
        fetchData();
      }
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [currentUser, resReq, resOffers, resSub] = await Promise.all([
        fetchAuthMe(),
        fetch('/api/deliveries'),
        fetch('/api/deliveries?filter=my_offers'),
        fetch('/api/subscriptions/me')
      ]);

      if (!currentUser) {
        router.push('/connexion');
        return;
      }

      setUser(currentUser);
      setIsAvailable(currentUser?.driverProfile?.isAvailable ?? true);

      if (currentUser?.accountStatus === 'pending') {
        router.push('/attente-validation');
        return;
      }

      if (resReq.ok) {
        const dataReq = await resReq.json();
        const allReqs = dataReq.requests || [];
        setOpenRequests(allReqs.filter((r: any) => ['searching_driver', 'pending'].includes(r.status)));
        
        const driverId = currentUser?.id;
        const currentActive = allReqs.find(
          (r: any) => (r.driverId === driverId || r.driver?.user?.id === driverId) && !['completed', 'cancelled', 'failed'].includes(r.status)
        );
        setActiveDelivery(currentActive || null);
      }

      if (resOffers.ok) {
        const dataOffers = await resOffers.json();
        setMyOffers(dataOffers.offers || []);
      }

      if (resSub.ok) {
        const dataSub = await resSub.json();
        setSubData(dataSub);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleAvailability = async () => {
    const newStatus = !isAvailable;
    setIsAvailable(newStatus);
    try {
      await fetch('/api/auth/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAvailable: newStatus })
      });
    } catch (e) {}
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-semibold text-slate-700">Chargement de l'espace livreur...</span>
        </div>
      </div>
    );
  }

  const driverProfile = user?.driverProfile;

  const currentSub = subData?.currentSubscription;
  let isSubActive = false;
  let subDaysLeft = 0;
  if (currentSub && currentSub.status === 'active' && currentSub.expiresAt) {
    const exp = new Date(currentSub.expiresAt);
    if (exp > new Date()) {
      isSubActive = true;
      subDaysLeft = Math.max(1, Math.ceil((exp.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20 sm:pb-12">
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* VERROUILLAGE SI LIVRAISON EN COURS */}
        {activeDelivery && (
          <div className="p-6 rounded-xl bg-amber-50 border border-amber-300 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-base">
                <AlertCircle className="w-5 h-5 text-amber-600" />
                <span>Vous êtes actuellement en livraison.</span>
              </div>
              <p className="text-xs text-amber-800 font-medium">
                Vous devez terminer et livrer la course #{activeDelivery.id.slice(0, 8).toUpperCase()} avant d'accepter une autre demande.
              </p>
            </div>
            <Link
              href={`/driver/livraison/${activeDelivery.id}`}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold rounded-lg text-xs flex items-center justify-center gap-2 shadow-sm shrink-0"
            >
              <span>Continuer la course actuelle</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {/* EN-TÊTE DASHBOARD LIVREUR */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
                Compte Livreur Validé
              </span>
              <span className="text-xs font-semibold text-slate-500">Note : 4.9 ★</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Bonjour {user?.fullName?.split(' ')[0] || 'Livreur'}
            </h1>
            <p className="text-slate-600 text-sm font-medium">
              Consultez les demandes de livraisons disponibles à Ouagadougou et soumettez vos tarifs.
            </p>
          </div>

          <button
            onClick={toggleAvailability}
            className={`px-6 py-3.5 rounded-xl font-bold text-sm shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
              isAvailable
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-rose-600 hover:bg-rose-700 text-white'
            }`}
          >
            <span className={`w-2.5 h-2.5 rounded-full ${isAvailable ? 'bg-white animate-pulse' : 'bg-white'}`}></span>
            <span>{isAvailable ? '🟢 Vous êtes Disponible' : '🔴 Vous êtes Occupé'}</span>
          </button>
        </div>

        {/* SUIVI ABONNEMENT LIVREUR WIDGET */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold shrink-0 ${isSubActive ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-orange-50 text-orange-600 border border-orange-200'}`}>
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-slate-900 text-sm">Abonnement Mensuel Livreur</h3>
                {isSubActive ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">Actif ({subDaysLeft}j restants)</span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-800 text-[11px] font-bold">En attente / À renouveler</span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">0% de commission sur vos revenus de livraison à Ouagadougou.</p>
            </div>
          </div>

          <Link
            href="/driver/abonnement"
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5 shrink-0"
          >
            <span>Suivre mon abonnement</span>
            <ChevronRight className="w-4 h-4 text-orange-400" />
          </Link>
        </div>

        {/* SYNTHÈSE STATISTIQUES */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Demandes disponibles</div>
              <div className="text-2xl font-black text-amber-600 mt-1">{openRequests.length}</div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Package className="w-5 h-5" />
            </div>
          </div>

          <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Mes propositions</div>
              <div className="text-2xl font-black text-sky-600 mt-1">{myOffers.length}</div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Livraisons effectuées</div>
              <div className="text-2xl font-black text-emerald-600 mt-1">{driverProfile?.totalDeliveries || 0}</div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* DEMANDES DISPONIBLES */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Demandes de livraisons récentes</h2>
            <Link href="/driver/demandes" className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1">
              <span>Voir toutes les demandes ({openRequests.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {openRequests.length === 0 ? (
            <div className="p-10 rounded-xl bg-white border border-slate-200 text-center space-y-3 shadow-sm">
              <Package className="w-10 h-10 text-slate-400 mx-auto" />
              <div className="text-slate-600 text-sm font-medium">Aucune nouvelle demande de livraison disponible pour le moment.</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {openRequests.slice(0, 4).map((req) => (
                <div
                  key={req.id}
                  className="p-5 rounded-xl bg-white border border-slate-200 hover:border-amber-400 transition-all shadow-sm space-y-4"
                >
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
                    <div className="flex items-center justify-between">
                      <a
                        href={buildNavigationUrl(req.pickupLatitude, req.pickupLongitude, req.pickupAddress)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-amber-700 font-bold hover:underline"
                      >
                        <MapPin className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>📍 {req.pickupAddress || 'Ouagadougou Centre'}</span>
                        <ExternalLink className="w-3 h-3 shrink-0" />
                      </a>
                    </div>
                    <div className="ml-2 pl-3 border-l-2 border-slate-200 text-slate-400 text-[11px] py-0.5">
                      ↓
                    </div>
                    <div className="flex items-center justify-between">
                      <a
                        href={buildNavigationUrl(req.destinationLatitude, req.destinationLongitude, req.destinationAddress)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-emerald-700 font-bold hover:underline"
                      >
                        <Navigation className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>🏁 {req.destinationAddress || 'Karpala'}</span>
                        <ExternalLink className="w-3 h-3 shrink-0" />
                      </a>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100">
                    <Link
                      href={`/driver/demandes?req=${req.id}`}
                      className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold rounded-lg text-xs transition-colors flex items-center justify-center gap-1 shadow-sm block text-center"
                    >
                      <span>Faire une proposition</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </main>

      {/* NAVIGATION MOBILIÈRE LIVREUR */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 py-2.5 px-6 flex items-center justify-around z-50 text-slate-300">
        <Link href="/driver" className="flex flex-col items-center gap-0.5 text-amber-400">
          <Truck className="w-5 h-5" />
          <span className="text-[10px] font-bold">Accueil</span>
        </Link>
        <Link href="/driver/demandes" className="flex flex-col items-center gap-0.5 hover:text-white">
          <Package className="w-5 h-5" />
          <span className="text-[10px] font-bold">Demandes</span>
        </Link>
        <Link href="/driver/propositions" className="flex flex-col items-center gap-0.5 hover:text-white">
          <Star className="w-5 h-5" />
          <span className="text-[10px] font-bold">Propositions</span>
        </Link>
        <Link href="/driver/profil" className="flex flex-col items-center gap-0.5 hover:text-white">
          <User className="w-5 h-5 text-slate-400" />
          <span className="text-[10px] font-bold">Profil</span>
        </Link>
      </div>

    </div>
  );
}

