'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  Users,
  Truck,
  DollarSign,
  CreditCard,
  Package,
  AlertTriangle,
  Settings,
  LogOut,
  CheckCircle2,
  XCircle,
  MapPin,
  Clock,
  Eye,
  MessageSquare,
  Activity,
  ArrowRight
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { AdminModeBanner } from '@/components/AdminModeBanner';
import DeliveryMap from '@/components/DeliveryMap';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 6000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const resUsers = await fetch('/api/admin/users');
      if (resUsers.ok) {
        const data = await resUsers.json();
        setUsers(data.users || []);
      }

      const resPay = await fetch('/api/admin/payments');
      if (resPay.ok) {
        const data = await resPay.json();
        setPayments(data.payments || []);
      }

      const resDeliv = await fetch('/api/deliveries');
      if (resDeliv.ok) {
        const data = await resDeliv.json();
        setDeliveries(data.requests || []);
      }

      const resReports = await fetch('/api/reports');
      if (resReports.ok) {
        const data = await resReports.json();
        setReports(data.reports || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyDriver = async (userId: string, status: 'approved' | 'rejected') => {
    try {
      await fetch(`/api/admin/users/${userId}/verify-driver`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      await fetchData();
    } catch (e) {
      alert('Erreur lors de la validation du livreur');
    }
  };

  const handleVerifyPayment = async (paymentId: string, status: 'approved' | 'rejected') => {
    try {
      await fetch(`/api/admin/payments/${paymentId}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      await fetchData();
    } catch (e) {
      alert('Erreur lors de la vérification du paiement');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-semibold text-slate-700">Chargement du centre de contrôle administration...</span>
        </div>
      </div>
    );
  }

  const clientsCount = users.filter(u => u.role === 'client').length;
  const driversCount = users.filter(u => u.role === 'driver').length;
  const activeDriversCount = users.filter(u => u.role === 'driver' && u.driverProfile?.isAvailable).length;
  const pendingPayments = payments.filter(p => p.status === 'pending');
  const pendingDrivers = users.filter(u => u.role === 'driver' && u.driverProfile?.verificationStatus === 'pending');
  const activeDeliveries = deliveries.filter(d => !['completed', 'cancelled', 'failed'].includes(d.status));

  const firstActiveDelivery = activeDeliveries[0];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      
      <Navbar />
      <AdminModeBanner />

      {/* EN-TÊTE ET NAVIGATION ADMINISTRATEUR */}
      <header className="bg-slate-900 text-white border-b border-slate-800 py-4 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 font-black flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight">Centre de Contrôle Administratif</h1>
              <p className="text-xs text-slate-400">Supervision plateforme de livraison — Ouagadougou 🇧🇫</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold">
            <Link
              href="/client"
              className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 transition-colors"
            >
              <span>👤 Tester espace Client</span>
            </Link>
            <Link
              href="/driver"
              className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 transition-colors"
            >
              <span>🚚 Tester espace Livreur</span>
            </Link>
          </div>
        </div>

        {/* SUB-NAVIGATION 11 SECTIONS */}
        <div className="max-w-7xl mx-auto mt-4 pt-3 border-t border-slate-800 flex items-center gap-4 overflow-x-auto text-xs font-bold text-slate-400 scrollbar-none">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-2 whitespace-nowrap cursor-pointer ${activeTab === 'overview' ? 'text-amber-400 border-b-2 border-amber-400' : 'hover:text-white'}`}
          >
            1. Tableau de bord
          </button>
          <Link href="/admin/utilisateurs" className="pb-2 whitespace-nowrap hover:text-white">
            2. Utilisateurs ({users.length})
          </Link>
          <Link href="/admin/clients" className="pb-2 whitespace-nowrap hover:text-white">
            3. Clients ({clientsCount})
          </Link>
          <Link href="/admin/livreurs" className="pb-2 whitespace-nowrap hover:text-white flex items-center gap-1">
            <span>4. Livreurs ({driversCount})</span>
            {pendingDrivers.length > 0 && <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />}
          </Link>
          <Link href="/admin/livraisons" className="pb-2 whitespace-nowrap hover:text-white">
            5. Livraisons ({deliveries.length})
          </Link>
          <button
            onClick={() => setActiveTab('gps')}
            className={`pb-2 whitespace-nowrap cursor-pointer ${activeTab === 'gps' ? 'text-amber-400 border-b-2 border-amber-400' : 'hover:text-white'}`}
          >
            6. Suivi GPS ({activeDeliveries.length})
          </button>
          <Link href="/admin/paiements" className="pb-2 whitespace-nowrap hover:text-white flex items-center gap-1">
            <span>7. Paiements</span>
            {pendingPayments.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black">
                {pendingPayments.length}
              </span>
            )}
          </Link>
          <Link href="/admin/abonnements" className="pb-2 whitespace-nowrap hover:text-white">
            8. Abonnements
          </Link>
          <Link href="/admin/signalements" className="pb-2 whitespace-nowrap hover:text-white">
            9. Signalements ({reports.length})
          </Link>
          <Link href="/admin/messages" className="pb-2 whitespace-nowrap hover:text-white">
            10. Messages
          </Link>
          <Link href="/admin/parametres" className="pb-2 whitespace-nowrap hover:text-white flex items-center gap-1">
            <Settings className="w-3.5 h-3.5" />
            <span>11. Paramètres</span>
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* TOP 4 KPIS OPÉRATIONNELS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Clients Inscrits</div>
              <div className="text-2xl font-black text-slate-900 mt-1">{clientsCount}</div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
          </div>

          <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Livreurs Actifs</div>
              <div className="text-2xl font-black text-emerald-600 mt-1">{activeDriversCount} / {driversCount}</div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Truck className="w-5 h-5" />
            </div>
          </div>

          <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Livraisons En Cours</div>
              <div className="text-2xl font-black text-amber-600 mt-1">{activeDeliveries.length}</div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Activity className="w-5 h-5" />
            </div>
          </div>

          <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Paiements à Vérifier</div>
              <div className="text-2xl font-black text-rose-600 mt-1">{pendingPayments.length}</div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* SUIVI GPS TEMPS RÉEL INTERACTIF */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-amber-600" />
              <span>Carte des Livraisons en Temps Réel à Ouagadougou</span>
            </h2>
            <span className="text-xs font-bold text-slate-500">{activeDeliveries.length} course(s) géolocalisée(s)</span>
          </div>

          <div className="h-96 rounded-xl overflow-hidden border border-slate-200 shadow-inner">
            <DeliveryMap
              pickupLat={firstActiveDelivery?.pickupLatitude || 12.3714}
              pickupLng={firstActiveDelivery?.pickupLongitude || -1.5197}
              dropoffLat={firstActiveDelivery?.destinationLatitude || 12.3900}
              dropoffLng={firstActiveDelivery?.destinationLongitude || -1.4900}
              driverLat={firstActiveDelivery?.driverLatitude}
              driverLng={firstActiveDelivery?.driverLongitude}
              driverName={firstActiveDelivery?.driverName || 'Livreur GPS'}
            />
          </div>
        </div>

        {/* FILES D'ATTENTE DES ACTIONS ADMINISTRATIVES */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* FILE 1 : PAIEMENTS À VALIDER */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-amber-600" />
                <span>Paiements à Valider ({pendingPayments.length})</span>
              </h3>
            </div>

            {pendingPayments.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">Aucun paiement en attente de vérification.</p>
            ) : (
              <div className="space-y-3">
                {pendingPayments.map((p) => (
                  <div key={p.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-slate-900">{p.amountFcfa} FCFA — {p.paymentMethod}</div>
                      <div className="text-slate-500">Réf: {p.transactionRef || 'N/A'} ({p.user?.fullName})</div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleVerifyPayment(p.id, 'approved')}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded text-[11px]"
                      >
                        Valider
                      </button>
                      <button
                        onClick={() => handleVerifyPayment(p.id, 'rejected')}
                        className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded text-[11px]"
                      >
                        Refuser
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* FILE 2 : LIVREURS À VÉRIFIER (KYC) */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Dossiers Livreurs KYC à Vérifier ({pendingDrivers.length})</span>
              </h3>
            </div>

            {pendingDrivers.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">Tous les compte livreurs sont vérifiés.</p>
            ) : (
              <div className="space-y-3">
                {pendingDrivers.map((d) => (
                  <div key={d.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-slate-900">{d.fullName} ({d.phone})</div>
                      <div className="text-slate-500">CNIB / Permis soumis</div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleVerifyDriver(d.id, 'approved')}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded text-[11px]"
                      >
                        Approuver
                      </button>
                      <button
                        onClick={() => handleVerifyDriver(d.id, 'rejected')}
                        className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded text-[11px]"
                      >
                        Rejeter
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </main>

    </div>
  );
}