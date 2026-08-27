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
  ExternalLink
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { AdminModeBanner } from '@/components/AdminModeBanner';
import { buildNavigationUrl } from '@/lib/mapUtils';

export default function DriverDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [openRequests, setOpenRequests] = useState<any[]>([]);
  const [myOffers, setMyOffers] = useState<any[]>([]);
  const [activeDelivery, setActiveDelivery] = useState<any>(null);
  const [isAvailable, setIsAvailable] = useState<boolean>(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const resMe = await fetch('/api/auth/me');
      if (!resMe.ok) {
        router.push('/connexion');
        return;
      }
      const dataMe = await resMe.json();
      setUser(dataMe.user);
      setIsAvailable(dataMe.user?.driverProfile?.isAvailable ?? true);

      if (dataMe.user?.accountStatus === 'pending') {
        router.push('/attente-validation');
        return;
      }

      const resReq = await fetch('/api/deliveries');
      if (resReq.ok) {
        const dataReq = await resReq.json();
        const allReqs = dataReq.requests || [];
        setOpenRequests(allReqs.filter((r: any) => r.status === 'searching_driver'));
        
        // Find if driver has an active delivery assigned to them
        const driverId = dataMe.user?.id;
        const currentActive = allReqs.find(
          (r: any) => (r.driverId === driverId || r.driver?.user?.id === driverId) && !['completed', 'cancelled', 'failed'].includes(r.status)
        );
        setActiveDelivery(currentActive || null);
      }

      const resOffers = await fetch('/api/deliveries?filter=my_offers');
      if (resOffers.ok) {
        const dataOffers = await resOffers.json();
        setMyOffers(dataOffers.offers || []);
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
            className={`px-5 py-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm ${
              isAvailable
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100'
                : 'bg-rose-50 border-rose-300 text-rose-800 hover:bg-rose-100'
            }`}
          >
            <span className={`w-2.5 h-2.5 rounded-full ${isAvailable ? 'bg-emerald-600 animate-pulse' : 'bg-rose-600'}`}></span>
            <span>STATUT : {isAvailable ? '🟢 DISPONIBLE' : '🔴 OCCUPÉ'}</span>
          </button>
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

