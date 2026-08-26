'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Bike, Save } from 'lucide-react';

export default function DriverVehiculePage() {
  const [user, setUser] = useState<any>(null);
  const [vehicleType, setVehicleType] = useState('motorcycle');
  const [brand, setBrand] = useState('Yamaha');
  const [model, setModel] = useState('Sirius');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [color, setColor] = useState('Rouge');
  const [year, setYear] = useState(2024);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        setUser(data.user);
        const v = data.user?.driverProfile?.vehicles?.[0];
        if (v) {
          setVehicleType(v.vehicleType || 'motorcycle');
          setBrand(v.brand || '');
          setModel(v.model || '');
          setRegistrationNumber(v.registrationNumber || '');
          setColor(v.color || '');
          if (v.year) setYear(v.year);
        }
      })
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

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-12">
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center space-x-4">
          <Link href="/driver/profil" className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-bold text-white">Gestion de mon Véhicule</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-6">
          <div className="flex items-center space-x-3 text-orange-400 font-bold border-b border-slate-800 pb-3">
            <Bike className="w-6 h-6" />
            <span>Informations du Véhicule Déclaré</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Type de véhicule</label>
              <input type="text" disabled value={vehicleType} className="w-full p-3 bg-slate-950 border border-slate-800 rounded-2xl text-white font-bold uppercase" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Marque / Modèle</label>
              <input type="text" disabled value={`${brand} ${model}`} className="w-full p-3 bg-slate-950 border border-slate-800 rounded-2xl text-white font-bold" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Numéro d'immatriculation</label>
              <input type="text" disabled value={registrationNumber || 'Non renseigné'} className="w-full p-3 bg-slate-950 border border-slate-800 rounded-2xl text-amber-300 font-bold" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Couleur</label>
              <input type="text" disabled value={color || 'N/A'} className="w-full p-3 bg-slate-950 border border-slate-800 rounded-2xl text-white font-bold" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
