'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, FileText, Camera, CheckCircle2, RefreshCw, Bike, User, ShieldCheck } from 'lucide-react';
import { fetchAuthMe } from '@/lib/sessionCache';

export default function DriverDocumentsPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [cniRectoUrl, setCniRectoUrl] = useState<string>('');
  const [cniVersoUrl, setCniVersoUrl] = useState<string>('');
  const [vehiclePhotoUrl, setVehiclePhotoUrl] = useState<string>('');

  const fetchProfile = async () => {
    try {
      const me = await fetchAuthMe();
      if (me) {
        setUser(me);
        if (me.avatarUrl) setAvatarUrl(me.avatarUrl);
        if (me.cniRectoUrl) setCniRectoUrl(me.cniRectoUrl);
        if (me.cniVersoUrl) setCniVersoUrl(me.cniVersoUrl);
        if (me.vehiclePhotoUrl) setVehiclePhotoUrl(me.vehiclePhotoUrl);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (val: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      alert('La taille de la photo ne doit pas dépasser 8 Mo.');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setter(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveDocuments = async () => {
    setSaving(true);
    setSuccessMsg(null);
    try {
      const res = await fetch('/api/auth/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          avatarUrl,
          cniRectoUrl,
          cniVersoUrl,
          vehiclePhotoUrl,
        }),
      });

      if (res.ok) {
        setSuccessMsg('Vos photos et pièces justificatives ont été enregistrées avec succès !');
        setTimeout(() => setSuccessMsg(null), 4000);
        fetchProfile();
      } else {
        alert('Erreur lors de l\'enregistrement des pièces.');
      }
    } catch (err) {
      console.error(err);
      alert('Erreur réseau lors de la sauvegarde.');
    } finally {
      setSaving(false);
    }
  };

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
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/driver/profil" className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-xl font-bold text-white">Gestion de mes Photos & Pièces</h1>
          </div>

          <button
            onClick={handleSaveDocuments}
            disabled={saving}
            className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-400 hover:to-amber-500 text-white font-extrabold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg transition-all"
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            <span>{saving ? 'Enregistrement...' : 'Sauvegarder tout'}</span>
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {successMsg && (
          <div className="p-4 bg-emerald-950/80 border border-emerald-500/50 rounded-2xl text-emerald-300 text-xs font-bold flex items-center gap-3 animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-2">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-orange-400" />
            <span>Documents & Photos de Validation Livreur</span>
          </h2>
          <p className="text-xs text-slate-400">
            Vous pouvez modifier votre photo de profil, votre pièce d'identité (recto/verso) ainsi que la photo de votre engin à tout moment après l'inscription.
          </p>
        </div>

        {/* 1. PHOTO DE PROFIL & PHOTO DE L'ENGIN */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* PHOTO DE PROFIL */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center gap-2 text-slate-200 font-bold border-b border-slate-800 pb-3">
              <User className="w-5 h-5 text-orange-400" />
              <span>Photo de Profil</span>
            </div>

            <div className="relative rounded-2xl border-2 border-dashed border-slate-800 bg-slate-950 p-4 text-center hover:border-orange-500/50 transition-colors overflow-hidden group">
              {avatarUrl ? (
                <div className="relative space-y-3">
                  <img src={avatarUrl} alt="Photo profil" className="w-full h-44 object-cover rounded-xl border border-slate-800" />
                  <label className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-orange-400 rounded-xl cursor-pointer">
                    <Camera className="w-4 h-4" />
                    <span>Changer la photo de profil</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleImageUpload(e, setAvatarUrl)}
                    />
                  </label>
                </div>
              ) : (
                <label className="cursor-pointer block py-8 space-y-2">
                  <Camera className="w-8 h-8 text-slate-500 mx-auto group-hover:text-orange-400 transition-colors" />
                  <span className="text-xs font-bold text-slate-400 block">Ajouter une photo de profil</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleImageUpload(e, setAvatarUrl)}
                  />
                </label>
              )}
            </div>
          </div>

          {/* PHOTO DE L'ENGIN */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center gap-2 text-slate-200 font-bold border-b border-slate-800 pb-3">
              <Bike className="w-5 h-5 text-amber-400" />
              <span>Photo de l'Engin / Véhicule</span>
            </div>

            <div className="relative rounded-2xl border-2 border-dashed border-slate-800 bg-slate-950 p-4 text-center hover:border-amber-500/50 transition-colors overflow-hidden group">
              {vehiclePhotoUrl ? (
                <div className="relative space-y-3">
                  <img src={vehiclePhotoUrl} alt="Photo engin" className="w-full h-44 object-cover rounded-xl border border-slate-800" />
                  <label className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-amber-400 rounded-xl cursor-pointer">
                    <Camera className="w-4 h-4" />
                    <span>Changer la photo de l'engin</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleImageUpload(e, setVehiclePhotoUrl)}
                    />
                  </label>
                </div>
              ) : (
                <label className="cursor-pointer block py-8 space-y-2">
                  <Camera className="w-8 h-8 text-slate-500 mx-auto group-hover:text-amber-400 transition-colors" />
                  <span className="text-xs font-bold text-slate-400 block">Téléverser la photo de votre engin</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleImageUpload(e, setVehiclePhotoUrl)}
                  />
                </label>
              )}
            </div>
          </div>
        </div>

        {/* 2. PIÈCE D'IDENTITÉ RECTO ET VERSO */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 text-slate-200 font-bold">
              <FileText className="w-5 h-5 text-orange-400" />
              <span>Pièce d'Identité (CNIB / Passeport)</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* CNI RECTO */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-300">
                Pièce d'Identité - RECTO
              </label>

              <div className="relative rounded-2xl border-2 border-dashed border-slate-800 bg-slate-950 p-4 text-center hover:border-orange-500/50 transition-colors overflow-hidden group">
                {cniRectoUrl ? (
                  <div className="relative space-y-3">
                    <img src={cniRectoUrl} alt="CNI Recto" className="w-full h-44 object-cover rounded-xl border border-slate-800" />
                    <label className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-orange-400 rounded-xl cursor-pointer">
                      <Camera className="w-4 h-4" />
                      <span>Changer la CNI RECTO</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleImageUpload(e, setCniRectoUrl)}
                      />
                    </label>
                  </div>
                ) : (
                  <label className="cursor-pointer block py-8 space-y-2">
                    <Camera className="w-8 h-8 text-slate-500 mx-auto group-hover:text-orange-400 transition-colors" />
                    <span className="text-xs font-bold text-slate-400 block">Téléverser CNI Face RECTO</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleImageUpload(e, setCniRectoUrl)}
                    />
                  </label>
                )}
              </div>
            </div>

            {/* CNI VERSO */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-300">
                Pièce d'Identité - VERSO
              </label>

              <div className="relative rounded-2xl border-2 border-dashed border-slate-800 bg-slate-950 p-4 text-center hover:border-orange-500/50 transition-colors overflow-hidden group">
                {cniVersoUrl ? (
                  <div className="relative space-y-3">
                    <img src={cniVersoUrl} alt="CNI Verso" className="w-full h-44 object-cover rounded-xl border border-slate-800" />
                    <label className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-orange-400 rounded-xl cursor-pointer">
                      <Camera className="w-4 h-4" />
                      <span>Changer la CNI VERSO</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleImageUpload(e, setCniVersoUrl)}
                      />
                    </label>
                  </div>
                ) : (
                  <label className="cursor-pointer block py-8 space-y-2">
                    <Camera className="w-8 h-8 text-slate-500 mx-auto group-hover:text-orange-400 transition-colors" />
                    <span className="text-xs font-bold text-slate-400 block">Téléverser CNI Face VERSO</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleImageUpload(e, setCniVersoUrl)}
                    />
                  </label>
                )}
              </div>
            </div>
          </div>

          <div className="pt-4 text-right">
            <button
              onClick={handleSaveDocuments}
              disabled={saving}
              className="py-3.5 px-8 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-400 hover:to-amber-500 text-white font-extrabold text-xs uppercase tracking-wider inline-flex items-center gap-2 shadow-lg transition-all"
            >
              {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              <span>{saving ? 'Enregistrement...' : 'Enregistrer toutes mes photos'}</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
