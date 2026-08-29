'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Bike, Phone, Mail, MapPin, ShieldCheck, Star } from 'lucide-react';

import { fetchAuthMe } from '@/lib/sessionCache';

export default function DriverProfilPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAuthMe()
      .then(u => setUser(u))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const driverProfile = user?.driverProfile;

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-12">
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center space-x-4">
          <Link href="/driver" className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-bold text-white">Mon Profil Livreur</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 flex items-center space-x-6">
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-orange-500 to-amber-600 flex items-center justify-center text-2xl font-black text-white">
            {user?.fullName?.slice(0, 2) || 'LV'}
          </div>

          <div>
            <h2 className="text-2xl font-bold text-white">{user?.fullName || 'Livreur'}</h2>
            <div className="text-xs text-orange-400 font-bold mt-1">
              Vérification: {driverProfile?.verificationStatus || 'pending'} | Note: {driverProfile?.averageRating || '5.0'} ★
            </div>
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
          <h3 className="font-bold text-slate-300 border-b border-slate-800 pb-3">Informations de Livreur</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-xs text-slate-500">Téléphone</div>
              <div className="font-bold text-white">{user?.phone || 'N/A'}</div>
            </div>

            <div>
              <div className="text-xs text-slate-500">Email</div>
              <div className="font-bold text-white">{user?.email || 'N/A'}</div>
            </div>

            <div>
              <div className="text-xs text-slate-500">Livraisons effectuées</div>
              <div className="font-bold text-white">{driverProfile?.totalDeliveries || 0}</div>
            </div>

            <div>
              <div className="text-xs text-slate-500">Avis reçus</div>
              <div className="font-bold text-white">{driverProfile?.totalRatings || 0}</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Link href="/driver/vehicule" className="p-6 rounded-3xl bg-slate-900 border border-slate-800 hover:border-orange-500 text-center font-bold text-sm text-orange-400">
            Gérer mon véhicule →
          </Link>
          <Link href="/driver/documents" className="p-6 rounded-3xl bg-slate-900 border border-slate-800 hover:border-orange-500 text-center font-bold text-sm text-amber-400">
            Gérer mes documents KYC →
          </Link>
        </div>
      </main>
    </div>
  );
}
