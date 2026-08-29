'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Truck, Plus, Package, Clock, CheckCircle2, MapPin, ChevronRight, Navigation, ArrowRight, User } from 'lucide-react';

import { AdminModeBanner } from '@/components/AdminModeBanner';
import { Navbar } from '@/components/Navbar';
import { fetchAuthMe } from '@/lib/sessionCache';

export default function ClientDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [currentUser, resDeliv] = await Promise.all([
        fetchAuthMe(),
        fetch('/api/deliveries')
      ]);

      if (!currentUser) {
        router.push('/connexion');
        return;
      }
      setUser(currentUser);

      if (currentUser?.accountStatus === 'pending') {
        router.push('/attente-validation');
        return;
      }

      if (resDeliv.ok) {
        const dataDeliv = await resDeliv.json();
        setRequests(dataDeliv.requests || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-semibold text-slate-700">Chargement de votre espace client...</span>
        </div>
      </div>
    );
  }

  const activeDeliveries = requests.filter(r => !['completed', 'cancelled', 'failed'].includes(r.status));
  const pendingDeliveries = requests.filter(r => r.status === 'searching_driver' || r.status === 'pending');
  const completedDeliveries = requests.filter(r => r.status === 'completed');

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
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20 sm:pb-12">
      {/* CONTENU PRINCIPAL */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* EN-TÊTE DASHBOARD CLIENT */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Bonjour {user?.fullName?.split(' ')[0] || user?.phone || 'Client'}
            </h1>
            <p className="text-slate-600 text-sm font-medium">
              Que souhaitez-vous faire aujourd'hui ?
            </p>
          </div>

          <Link
            href="/client/livraison/nouvelle"
            className="px-6 py-3.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-slate-950 font-bold rounded-xl shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 text-sm shrink-0 transition-all cursor-pointer"
          >
            <Plus className="w-5 h-5" />
            <span>Nouvelle livraison</span>
          </Link>
        </div>

        {/* SYNTHÈSE DES STATUTS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Livraisons en cours</div>
              <div className="text-2xl font-black text-amber-600 mt-1">{activeDeliveries.length}</div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Package className="w-5 h-5" />
            </div>
          </div>

          <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Livraisons en attente</div>
              <div className="text-2xl font-black text-sky-600 mt-1">{pendingDeliveries.length}</div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Livraisons terminées</div>
              <div className="text-2xl font-black text-emerald-600 mt-1">{completedDeliveries.length}</div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* MES LIVRAISONS EN COURS */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Mes livraisons en cours</h2>
            <Link href="/client/livraisons" className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1">
              <span>Voir l'historique complet</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {activeDeliveries.length === 0 ? (
            <div className="p-10 rounded-xl bg-white border border-slate-200 text-center space-y-3 shadow-sm">
              <Package className="w-10 h-10 text-slate-400 mx-auto" />
              <div className="text-slate-600 text-sm font-medium">Vous n'avez encore aucune livraison en cours.</div>
              <Link
                href="/client/livraison/nouvelle"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-sm transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Demander une livraison</span>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeDeliveries.map((req) => (
                <div
                  key={req.id}
                  className="p-5 rounded-xl bg-white border border-slate-200 hover:border-amber-400 transition-all shadow-sm space-y-4"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <span className="font-bold text-xs text-slate-900 bg-slate-100 px-2.5 py-1 rounded">
                      Livraison #{req.id.slice(0, 8).toUpperCase()}
                    </span>
                    <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{getElapsedTime(req.createdAt)}</span>
                    </span>
                  </div>

                  {/* TRAJET SIMPLIFIÉ */}
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center gap-2 text-slate-700 font-semibold">
                      <MapPin className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>📍 {req.pickupAddress || 'Ouagadougou Centre'}</span>
                    </div>
                    <div className="ml-2 pl-3 border-l-2 border-slate-200 text-slate-400 text-[11px] py-0.5">
                      ↓
                    </div>
                    <div className="flex items-center gap-2 text-slate-700 font-semibold">
                      <Navigation className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>🏁 {req.destinationAddress || 'Karpala'}</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <div className="text-[11px] text-slate-400">Livreur :</div>
                      <div className="text-xs font-bold text-slate-800">
                        {req.driver?.user?.fullName || req.driverName || 'Recherche en cours...'}
                      </div>
                    </div>

                    <Link
                      href={`/client/livraison/${req.id}`}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold rounded-lg text-xs transition-colors flex items-center gap-1 shadow-sm"
                    >
                      <span>Suivre</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* NAVIGATION MOBILIÈRE BAS DE PAGE */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 py-2.5 px-6 flex items-center justify-around z-50 text-slate-300">
        <Link href="/client" className="flex flex-col items-center gap-0.5 text-amber-400">
          <Truck className="w-5 h-5" />
          <span className="text-[10px] font-bold">Accueil</span>
        </Link>
        <Link href="/client/livraison/nouvelle" className="flex flex-col items-center gap-0.5 hover:text-white">
          <Plus className="w-5 h-5" />
          <span className="text-[10px] font-bold">Créer</span>
        </Link>
        <Link href="/client/livraisons" className="flex flex-col items-center gap-0.5 hover:text-white">
          <Package className="w-5 h-5" />
          <span className="text-[10px] font-bold">Livraisons</span>
        </Link>
        <Link href="/client/profil" className="flex flex-col items-center gap-0.5 hover:text-white">
          <User className="w-5 h-5 text-slate-400" />
          <span className="text-[10px] font-bold">Profil</span>
        </Link>
      </div>

    </div>
  );
}

