'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, User, Phone, Mail, MapPin, ShieldCheck, Camera, FileText, CheckCircle2, RefreshCw } from 'lucide-react';

export default function ClientProfilPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [cniRectoUrl, setCniRectoUrl] = useState<string>('');
  const [cniVersoUrl, setCniVersoUrl] = useState<string>('');

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        if (data.user?.avatarUrl) setAvatarUrl(data.user.avatarUrl);
        if (data.user?.cniRectoUrl) setCniRectoUrl(data.user.cniRectoUrl);
        if (data.user?.cniVersoUrl) setCniVersoUrl(data.user.cniVersoUrl);
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
      alert('La taille de l\'image ne doit pas dépasser 8 Mo.');
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
        }),
      });

      if (res.ok) {
        setSuccessMsg('Vos photos et pièces ont été enregistrées avec succès !');
        setTimeout(() => setSuccessMsg(null), 4000);
        fetchProfile();
      } else {
        alert('Erreur lors de l\'enregistrement des documents.');
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
        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-12">
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/client" className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-xl font-bold text-white">Mon Profil Client</h1>
          </div>

          <button
            onClick={handleSaveDocuments}
            disabled={saving}
            className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-extrabold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg transition-all"
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            <span>{saving ? 'Enregistrement...' : 'Sauvegarder'}</span>
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

        {/* Profil Header */}
        <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-center gap-6">
          <div className="relative group">
            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-2xl font-black text-white overflow-hidden border-2 border-amber-500/40 shadow-xl">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                user?.fullName?.slice(0, 2) || 'CL'
              )}
            </div>
            <label className="absolute bottom-0 right-0 p-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-full cursor-pointer shadow-lg transition-transform hover:scale-110">
              <Camera className="w-4 h-4" />
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleImageUpload(e, setAvatarUrl)}
              />
            </label>
          </div>

          <div className="text-center sm:text-left space-y-1">
            <h2 className="text-2xl font-bold text-white">{user?.fullName || 'Client'}</h2>
            <div className="text-xs text-emerald-400 font-bold flex items-center justify-center sm:justify-start gap-1">
              <ShieldCheck className="w-4 h-4" />
              <span>Compte Client • {user?.accountStatus || 'Actif'}</span>
            </div>
            <p className="text-xs text-slate-400">
              Cliquez sur l'icône caméra pour modifier votre photo de profil.
            </p>
          </div>
        </div>

        {/* Informations Personnelles */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
          <h3 className="font-bold text-slate-300 border-b border-slate-800 pb-3">Informations Personnelles</h3>

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
              <div className="text-xs text-slate-500">Ville</div>
              <div className="font-bold text-white">{user?.city || 'Ouagadougou'}</div>
            </div>

            <div>
              <div className="text-xs text-slate-500">Adresse</div>
              <div className="font-bold text-white">{user?.address || 'N/A'}</div>
            </div>
          </div>
        </div>

        {/* Pièces d'identité CNI */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 text-slate-200 font-bold">
              <FileText className="w-5 h-5 text-amber-400" />
              <span>Pièce d'Identité (CNIB / Passeport)</span>
            </div>
            <span className="text-xs text-slate-400 font-medium">Modifiable à tout moment</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* CNI RECTO */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-300">
                Pièce d'Identité - RECTO
              </label>

              <div className="relative rounded-2xl border-2 border-dashed border-slate-800 bg-slate-950 p-4 text-center hover:border-amber-500/50 transition-colors overflow-hidden group">
                {cniRectoUrl ? (
                  <div className="relative space-y-3">
                    <img src={cniRectoUrl} alt="CNI Recto" className="w-full h-44 object-cover rounded-xl border border-slate-800" />
                    <label className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-amber-400 rounded-xl cursor-pointer">
                      <Camera className="w-4 h-4" />
                      <span>Changer la photo RECTO</span>
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
                    <Camera className="w-8 h-8 text-slate-500 mx-auto group-hover:text-amber-400 transition-colors" />
                    <span className="text-xs font-bold text-slate-400 block">Téléverser la face RECTO</span>
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

              <div className="relative rounded-2xl border-2 border-dashed border-slate-800 bg-slate-950 p-4 text-center hover:border-amber-500/50 transition-colors overflow-hidden group">
                {cniVersoUrl ? (
                  <div className="relative space-y-3">
                    <img src={cniVersoUrl} alt="CNI Verso" className="w-full h-44 object-cover rounded-xl border border-slate-800" />
                    <label className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-amber-400 rounded-xl cursor-pointer">
                      <Camera className="w-4 h-4" />
                      <span>Changer la photo VERSO</span>
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
                    <Camera className="w-8 h-8 text-slate-500 mx-auto group-hover:text-amber-400 transition-colors" />
                    <span className="text-xs font-bold text-slate-400 block">Téléverser la face VERSO</span>
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

          <div className="pt-2 text-right">
            <button
              onClick={handleSaveDocuments}
              disabled={saving}
              className="py-3 px-8 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-extrabold text-xs uppercase tracking-wider inline-flex items-center gap-2 shadow-lg transition-all"
            >
              {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              <span>{saving ? 'Enregistrement...' : 'Enregistrer mes pièces'}</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

