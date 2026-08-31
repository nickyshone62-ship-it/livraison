'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Truck, User, Bike, ArrowRight, Upload, CheckCircle2, Image as ImageIcon, Trash2, Camera, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { AdminSecretModal } from '@/components/AdminSecretModal';

export default function InscriptionPage() {
  const router = useRouter();

  const [role, setRole] = useState<'client' | 'driver'>('client');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('Ouagadougou');
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Rejection Correction Mode State
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);
  const [isRejectedFixMode, setIsRejectedFixMode] = useState(false);

  // Driver fields (Immatriculation retirée)
  const [vehicleType, setVehicleType] = useState('motorcycle');
  const [brand, setBrand] = useState('Yamaha');
  const [model, setModel] = useState('Sirius');
  const [color, setColor] = useState('');
  const [year, setYear] = useState('2024');

  // Documents obligatoires livreur (Photos au lieu de simples URLs)
  const [photoUrl, setPhotoUrl] = useState(''); // Photo de profil
  const [idCardRectoUrl, setIdCardRectoUrl] = useState(''); // CNI Recto
  const [idCardVersoUrl, setIdCardVersoUrl] = useState(''); // CNI Verso
  const [vehiclePhotoUrl, setVehiclePhotoUrl] = useState(''); // Photo de l'engin

  // Payment
  const [paymentMethod, setPaymentMethod] = useState<'orange_money' | 'moov_money' | 'wave'>('orange_money');
  const [transactionReference, setTransactionReference] = useState('');
  const [hasPaid, setHasPaid] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pré-remplissage automatique des informations existantes si dossier rejeté ou session active
  React.useEffect(() => {
    const checkExistingProfile = async () => {
      try {
        const res = await fetch('/api/auth/rejected-info');
        if (res.ok) {
          const data = await res.json();
          if (data.exists) {
            if (data.isApproved) {
              setError('Ce numéro est déjà associé à un compte actif ou validé.');
              return;
            }
            if (data.user) {
              if (data.user.fullName) setFullName(data.user.fullName);
              if (data.user.phone) setPhone(data.user.phone);
              if (data.user.email) setEmail(data.user.email);
              if (data.user.city) setCity(data.user.city);
              if (data.user.address) setAddress(data.user.address);
              if (data.user.role) setRole(data.user.role);
              if (data.user.cniRectoUrl) setIdCardRectoUrl(data.user.cniRectoUrl);
              if (data.user.cniVersoUrl) setIdCardVersoUrl(data.user.cniVersoUrl);
              if (data.user.avatarUrl) setPhotoUrl(data.user.avatarUrl);
              setHasPaid(true);

              if (data.isRejected) {
                setRejectionReason(data.user.rejectionReason || 'Document non conforme ou informations incomplètes.');
                setIsRejectedFixMode(true);
              }
            }
          }
        }
      } catch (err) {}
    };
    checkExistingProfile();
  }, []);

  const handlePhoneBlur = async () => {
    if (!phone || phone.trim().length < 8) return;
    try {
      const res = await fetch(`/api/auth/rejected-info?phone=${encodeURIComponent(phone.trim())}`);
      if (res.ok) {
        const data = await res.json();
        if (data.exists) {
          if (data.isApproved) {
            setError('Ce numéro de téléphone appartient déjà à un compte validé ou actif. Vous ne pouvez pas créer un nouveau compte avec ce numéro.');
            return;
          }
          if (data.user) {
            if (data.user.fullName) setFullName(data.user.fullName);
            if (data.user.email) setEmail(data.user.email);
            if (data.user.city) setCity(data.user.city);
            if (data.user.address) setAddress(data.user.address);
            if (data.user.role) setRole(data.user.role);
            if (data.user.cniRectoUrl) setIdCardRectoUrl(data.user.cniRectoUrl);
            if (data.user.cniVersoUrl) setIdCardVersoUrl(data.user.cniVersoUrl);
            if (data.user.avatarUrl) setPhotoUrl(data.user.avatarUrl);
            setHasPaid(true);

            if (data.isRejected) {
              setRejectionReason(data.user.rejectionReason || 'Document non conforme ou informations incomplètes.');
              setIsRejectedFixMode(true);
              setError(null);
            }
          }
        }
      }
    } catch (e) {}
  };

  // Helper file upload -> Base64 Data URL
  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (value: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      setError('La photo ne doit pas dépasser 8 Mo.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setter(reader.result as string);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (role === 'client') {
      if (!photoUrl) {
        setError('Une photo de profil est obligatoire pour le client.');
        return;
      }
      if (!idCardRectoUrl || !idCardVersoUrl) {
        setError('La pièce d\'identité (Recto ET Verso) est obligatoire pour le client.');
        return;
      }
    }

    if (role === 'driver') {
      if (!photoUrl) {
        setError('Une photo de profil est obligatoire pour le livreur.');
        return;
      }
      if (!idCardRectoUrl || !idCardVersoUrl) {
        setError('La pièce d\'identité (Recto ET Verso) est obligatoire pour le livreur.');
        return;
      }
      if (!vehiclePhotoUrl) {
        setError('La photo de l\'engin (véhicule) est obligatoire pour le livreur.');
        return;
      }
    }

    if (!transactionReference || !transactionReference.trim()) {
      setError('La référence de transaction Mobile Money (ID de transaction) est obligatoire.');
      return;
    }

    if (!hasPaid) {
      setError('Veuillez effectuer le paiement et cocher "J\'ai effectué le paiement"');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          phone,
          email,
          city,
          address,
          password,
          role,
          vehicleType,
          brand,
          model,
          color,
          year,
          photoUrl,
          idCardRectoUrl,
          idCardVersoUrl,
          vehiclePhotoUrl,
          paymentMethod,
          transactionReference,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur lors de l\'inscription');

      router.push('/attente-validation');
    } catch (err: any) {
      setError(err.message || 'Erreur d\'inscription');
    } finally {
      setLoading(false);
    }
  };

  const [showAdminModal, setShowAdminModal] = useState(false);
  const fee = role === 'driver' ? 1500 : 2000;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-amber-500 selection:text-white flex flex-col justify-between">
      <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-orange-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-3xl mx-auto z-10 relative">
          <div className="text-center mb-8">
            <div
              onClick={() => setShowAdminModal(true)}
              className="inline-flex items-center space-x-3 mb-4 group cursor-pointer"
              title="👑 Cliquer pour saisir le Code Secret Administrateur"
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
                <Truck className="w-7 h-7 text-white" />
              </div>
              <span className="text-2xl font-black text-slate-950">
                LIVRAISON <span className="text-amber-600">OUAGA</span>
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">Créer votre compte</h1>
            <p className="text-slate-600 mt-2 font-medium">Choisissez votre profil pour commencer</p>
          </div>

          {/* Role Selector */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <button
              type="button"
              onClick={() => setRole('client')}
              className={`p-6 rounded-3xl border text-left transition-all flex flex-col items-center justify-center space-y-3 cursor-pointer ${
                role === 'client'
                  ? 'bg-slate-900 border-2 border-slate-900 text-white shadow-xl shadow-slate-900/10'
                  : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <User className={`w-8 h-8 ${role === 'client' ? 'text-amber-400' : 'text-amber-600'}`} />
              <div className="text-center">
                <div className={`font-bold text-lg ${role === 'client' ? 'text-white' : 'text-slate-900'}`}>Je suis Client</div>
                <div className={`text-xs mt-1 ${role === 'client' ? 'text-slate-300' : 'text-slate-500'}`}>Je souhaite faire livrer des colis</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setRole('driver')}
              className={`p-6 rounded-3xl border text-left transition-all flex flex-col items-center justify-center space-y-3 cursor-pointer ${
                role === 'driver'
                  ? 'bg-slate-900 border-2 border-slate-900 text-white shadow-xl shadow-slate-900/10'
                  : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <Bike className={`w-8 h-8 ${role === 'driver' ? 'text-orange-400' : 'text-orange-600'}`} />
              <div className="text-center">
                <div className={`font-bold text-lg ${role === 'driver' ? 'text-white' : 'text-slate-900'}`}>Je suis Livreur</div>
                <div className={`text-xs mt-1 ${role === 'driver' ? 'text-slate-300' : 'text-slate-500'}`}>Je souhaite effectuer des livraisons</div>
              </div>
            </button>
          </div>

          {/* Form Container */}
          <form onSubmit={handleSubmit} className="bg-white border border-slate-200/80 p-6 sm:p-10 rounded-3xl shadow-xl space-y-6">
            {isRejectedFixMode && (
              <div className="p-5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 space-y-2.5 animate-fadeIn">
                <div className="flex items-center gap-2 text-amber-700 font-extrabold text-sm">
                  <AlertTriangle className="w-5 h-5 shrink-0" />
                  <span>Correction de votre dossier rejeté</span>
                </div>
                <div className="text-xs space-y-1">
                  <strong className="text-amber-800">Motif du refus précédent :</strong>
                  <div className="p-3 rounded-xl bg-white border border-amber-200 text-slate-900 font-bold text-xs">
                    "{rejectionReason || 'Document non conforme ou informations incomplètes.'}"
                  </div>
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  💡 <strong>Toutes vos informations enregistrées ont été conservées.</strong> Corrigez simplement les pièces ou informations erronées ci-dessous, puis validez.
                </p>
              </div>
            )}

            {error && (
              <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium">
                {error}
              </div>
            )}

            <div className="border-b border-slate-200 pb-4">
              <h2 className="text-xl font-bold text-amber-600">Informations Personnelles</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Nom complet *</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="ex: Ouedraogo Moussa"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-2xl text-slate-900 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Téléphone *</label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  onBlur={handlePhoneBlur}
                  placeholder="ex: 70000000"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-2xl text-slate-900 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@exemple.bf"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-2xl text-slate-900 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Ville</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-2xl text-slate-900 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-slate-700 mb-2">Adresse / Quartier</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="ex: Ouaga 2000, Secteur 15"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-2xl text-slate-900 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Mot de passe *</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-300 rounded-2xl text-slate-900 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                    title={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Confirmation mot de passe *</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-300 rounded-2xl text-slate-900 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                    title={showConfirmPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Client Specific ID Card & Photo Section */}
            {role === 'client' && (
              <>
                <div className="border-b border-slate-200 pb-4 pt-6">
                  <h2 className="text-xl font-bold text-amber-600">Photo de Profil & Pièce d'identité Client (Obligatoires)</h2>
                  <p className="text-xs text-slate-500 mt-1">Veuillez fournir votre photo de profil ainsi que la photo RECTO et VERSO de votre pièce d'identité (CNIB, Passeport ou Permis).</p>
                </div>

                {/* Photo de profil Client */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-bold text-slate-800 flex items-center space-x-2">
                      <Camera className="w-4 h-4 text-amber-600" />
                      <span>Photo de Profil Client *</span>
                    </label>
                    {photoUrl && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                  </div>

                  {photoUrl ? (
                    <div className="relative rounded-xl overflow-hidden border border-slate-200 group max-w-xs">
                      <img src={photoUrl} alt="Photo de Profil Client" className="w-full h-40 object-cover" />
                      <button
                        type="button"
                        onClick={() => setPhotoUrl('')}
                        className="absolute top-2 right-2 p-1.5 rounded-lg bg-red-600/80 text-white hover:bg-red-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="border-2 border-dashed border-slate-300 hover:border-amber-500 hover:bg-amber-50/50 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer bg-white transition-all text-center max-w-xs">
                      <Upload className="w-8 h-8 text-amber-600 mb-2" />
                      <span className="text-xs font-bold text-slate-700">Prendre / Choisir Photo de Profil</span>
                      <span className="text-[10px] text-slate-500 mt-1">Format JPG, PNG (Max 8 Mo)</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileChange(e, setPhotoUrl)}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* 1. CNI Recto */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-bold text-slate-800 flex items-center space-x-2">
                        <ImageIcon className="w-4 h-4 text-amber-600" />
                        <span>1. Pièce d'identité - Face RECTO *</span>
                      </label>
                      {idCardRectoUrl && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                    </div>

                    {idCardRectoUrl ? (
                      <div className="relative rounded-xl overflow-hidden border border-slate-200 group">
                        <img src={idCardRectoUrl} alt="CNI Recto Client" className="w-full h-40 object-cover" />
                        <button
                          type="button"
                          onClick={() => setIdCardRectoUrl('')}
                          className="absolute top-2 right-2 p-1.5 rounded-lg bg-red-600/80 text-white hover:bg-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <label className="border-2 border-dashed border-slate-300 hover:border-amber-500 hover:bg-amber-50/50 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer bg-white transition-all text-center">
                        <Upload className="w-8 h-8 text-amber-600 mb-2" />
                        <span className="text-xs font-bold text-slate-700">Scanner / Photo CNI (RECTO)</span>
                        <span className="text-[10px] text-slate-500 mt-1">CNIB, Passeport ou Permis</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileChange(e, setIdCardRectoUrl)}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>

                  {/* 2. CNI Verso */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-bold text-slate-800 flex items-center space-x-2">
                        <ImageIcon className="w-4 h-4 text-amber-600" />
                        <span>2. Pièce d'identité - Face VERSO *</span>
                      </label>
                      {idCardVersoUrl && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                    </div>

                    {idCardVersoUrl ? (
                      <div className="relative rounded-xl overflow-hidden border border-slate-200 group">
                        <img src={idCardVersoUrl} alt="CNI Verso Client" className="w-full h-40 object-cover" />
                        <button
                          type="button"
                          onClick={() => setIdCardVersoUrl('')}
                          className="absolute top-2 right-2 p-1.5 rounded-lg bg-red-600/80 text-white hover:bg-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <label className="border-2 border-dashed border-slate-300 hover:border-amber-500 hover:bg-amber-50/50 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer bg-white transition-all text-center">
                        <Upload className="w-8 h-8 text-amber-600 mb-2" />
                        <span className="text-xs font-bold text-slate-700">Scanner / Photo CNI (VERSO)</span>
                        <span className="text-[10px] text-slate-500 mt-1">CNIB ou Pièce d'identité</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileChange(e, setIdCardVersoUrl)}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Driver Specific Section */}
            {role === 'driver' && (
              <>
                <div className="border-b border-slate-200 pb-4 pt-6">
                  <h2 className="text-xl font-bold text-orange-600">Informations Véhicule</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Type Véhicule *</label>
                    <select
                      value={vehicleType}
                      onChange={(e) => setVehicleType(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-2xl text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 outline-none transition-all"
                    >
                      <option value="motorcycle">Moto</option>
                      <option value="car">Tricycle / Voiture</option>
                      <option value="van">Camionnette / Camion</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Marque / Modèle</label>
                    <input
                      type="text"
                      value={brand}
                      onChange={(e) => setBrand(e.target.value)}
                      placeholder="Yamaha, Honda, Rato..."
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-2xl text-slate-900 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-amber-500 outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Photos & Documents KYC pour Livreur */}
                <div className="border-b border-slate-200 pb-4 pt-6">
                  <h2 className="text-xl font-bold text-orange-600">Photos & Pièces d'identité (Obligatoires)</h2>
                  <p className="text-xs text-slate-500 mt-1">Prenez en photo ou téléversez des images claires depuis votre téléphone.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* 1. Photo de profil */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-bold text-slate-800 flex items-center space-x-2">
                        <Camera className="w-4 h-4 text-amber-600" />
                        <span>1. Photo de Profil *</span>
                      </label>
                      {photoUrl && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                    </div>

                    {photoUrl ? (
                      <div className="relative rounded-xl overflow-hidden border border-slate-200 group">
                        <img src={photoUrl} alt="Photo de Profil" className="w-full h-40 object-cover" />
                        <button
                          type="button"
                          onClick={() => setPhotoUrl('')}
                          className="absolute top-2 right-2 p-1.5 rounded-lg bg-red-600/80 text-white hover:bg-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <label className="border-2 border-dashed border-slate-300 hover:border-amber-500 hover:bg-amber-50/50 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer bg-white transition-all text-center">
                        <Upload className="w-8 h-8 text-amber-600 mb-2" />
                        <span className="text-xs font-bold text-slate-700">Prendre / Choisir Photo</span>
                        <span className="text-[10px] text-slate-500 mt-1">Format JPG, PNG (Max 8 Mo)</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileChange(e, setPhotoUrl)}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>

                  {/* 2. Photo de l'engin */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-bold text-slate-800 flex items-center space-x-2">
                        <Bike className="w-4 h-4 text-orange-600" />
                        <span>2. Photo de l'Engin (Véhicule) *</span>
                      </label>
                      {vehiclePhotoUrl && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                    </div>

                    {vehiclePhotoUrl ? (
                      <div className="relative rounded-xl overflow-hidden border border-slate-200 group">
                        <img src={vehiclePhotoUrl} alt="Photo Engin" className="w-full h-40 object-cover" />
                        <button
                          type="button"
                          onClick={() => setVehiclePhotoUrl('')}
                          className="absolute top-2 right-2 p-1.5 rounded-lg bg-red-600/80 text-white hover:bg-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <label className="border-2 border-dashed border-slate-300 hover:border-orange-500 hover:bg-orange-50/50 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer bg-white transition-all text-center">
                        <Upload className="w-8 h-8 text-orange-600 mb-2" />
                        <span className="text-xs font-bold text-slate-700">Prendre / Choisir Photo Engin</span>
                        <span className="text-[10px] text-slate-500 mt-1">Format JPG, PNG (Max 8 Mo)</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileChange(e, setVehiclePhotoUrl)}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>

                  {/* 3. CNI Recto */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-bold text-slate-800 flex items-center space-x-2">
                        <ImageIcon className="w-4 h-4 text-amber-600" />
                        <span>3. Pièce d'identité - Face RECTO *</span>
                      </label>
                      {idCardRectoUrl && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                    </div>

                    {idCardRectoUrl ? (
                      <div className="relative rounded-xl overflow-hidden border border-slate-200 group">
                        <img src={idCardRectoUrl} alt="CNI Recto" className="w-full h-40 object-cover" />
                        <button
                          type="button"
                          onClick={() => setIdCardRectoUrl('')}
                          className="absolute top-2 right-2 p-1.5 rounded-lg bg-red-600/80 text-white hover:bg-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <label className="border-2 border-dashed border-slate-300 hover:border-amber-500 hover:bg-amber-50/50 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer bg-white transition-all text-center">
                        <Upload className="w-8 h-8 text-amber-600 mb-2" />
                        <span className="text-xs font-bold text-slate-700">Scanner / Photo CNI (RECTO)</span>
                        <span className="text-[10px] text-slate-500 mt-1">CNIB, Passeport ou Permis</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileChange(e, setIdCardRectoUrl)}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>

                  {/* 4. CNI Verso */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-bold text-slate-800 flex items-center space-x-2">
                        <ImageIcon className="w-4 h-4 text-amber-600" />
                        <span>4. Pièce d'identité - Face VERSO *</span>
                      </label>
                      {idCardVersoUrl && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                    </div>

                    {idCardVersoUrl ? (
                      <div className="relative rounded-xl overflow-hidden border border-slate-200 group">
                        <img src={idCardVersoUrl} alt="CNI Verso" className="w-full h-40 object-cover" />
                        <button
                          type="button"
                          onClick={() => setIdCardVersoUrl('')}
                          className="absolute top-2 right-2 p-1.5 rounded-lg bg-red-600/80 text-white hover:bg-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <label className="border-2 border-dashed border-slate-300 hover:border-amber-500 hover:bg-amber-50/50 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer bg-white transition-all text-center">
                        <Upload className="w-8 h-8 text-amber-600 mb-2" />
                        <span className="text-xs font-bold text-slate-700">Scanner / Photo CNI (VERSO)</span>
                        <span className="text-[10px] text-slate-500 mt-1">CNIB ou Pièce d'identité</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileChange(e, setIdCardVersoUrl)}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Payment Section */}
            <div className="border-b border-slate-200 pb-4 pt-6">
              <h2 className="text-xl font-bold text-amber-600">Paiement Frais d'Inscription ({fee} FCFA)</h2>
              <p className="text-xs text-slate-500 mt-1">Le paiement est vérifié et approuvé par l'administration avant l'activation du compte.</p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <button
                type="button"
                onClick={() => setPaymentMethod('orange_money')}
                className={`p-4 rounded-2xl border text-center font-bold transition-all cursor-pointer ${
                  paymentMethod === 'orange_money' ? 'bg-orange-500 border-2 border-orange-500 text-white shadow-md shadow-orange-500/20' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                Orange Money
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('moov_money')}
                className={`p-4 rounded-2xl border text-center font-bold transition-all cursor-pointer ${
                  paymentMethod === 'moov_money' ? 'bg-blue-600 border-2 border-blue-600 text-white shadow-md shadow-blue-600/20' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                Moov Money
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('wave')}
                className={`p-4 rounded-2xl border text-center font-bold transition-all cursor-pointer ${
                  paymentMethod === 'wave' ? 'bg-cyan-500 border-2 border-cyan-500 text-white shadow-md shadow-cyan-500/20' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                Wave
              </button>
            </div>

            {/* Payment Instructions Box */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 text-sm text-slate-800">
              <div className="font-bold text-slate-900 flex items-center justify-between">
                <span>Instructions de paiement Mobile Money :</span>
                <span className="text-amber-600 text-base font-extrabold">{fee} FCFA</span>
              </div>

              {paymentMethod === 'orange_money' && (
                <div>
                  <p className="text-slate-700">Numéro Orange Money : <span className="font-bold text-slate-900">06887330</span></p>
                  <p className="text-xs text-slate-500 mt-1">Code USSD : <code className="bg-slate-200 px-2 py-1 rounded text-amber-700 font-mono font-bold">*144*2*1*06887330*{fee}#</code></p>
                </div>
              )}

              {paymentMethod === 'moov_money' && (
                <div>
                  <p className="text-slate-700">Numéro Moov Money : <span className="font-bold text-slate-900">62017878</span></p>
                  <p className="text-xs text-slate-500 mt-1">Code USSD : <code className="bg-slate-200 px-2 py-1 rounded text-blue-700 font-mono font-bold">*555*2*1*62017878*{fee}#</code></p>
                </div>
              )}

              {paymentMethod === 'wave' && (
                <div>
                  <p className="text-slate-700">Numéro Wave : <span className="font-bold text-slate-900">06887330</span></p>
                </div>
              )}

              <div className="pt-2">
                <label className="block text-xs font-bold text-slate-900 mb-1">
                  Référence / ID de Transaction Mobile Money * <span className="text-amber-600 font-extrabold">(Obligatoire)</span>
                </label>
                <input
                  type="text"
                  required
                  value={transactionReference}
                  onChange={(e) => setTransactionReference(e.target.value)}
                  placeholder="ex: OM-98765432 ou MP-12345678"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs outline-none focus:ring-2 focus:ring-amber-500 font-mono transition-all placeholder-slate-400"
                />
              </div>
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <input
                type="checkbox"
                id="hasPaid"
                checked={hasPaid}
                onChange={(e) => setHasPaid(e.target.checked)}
                className="w-5 h-5 accent-amber-500 rounded cursor-pointer"
              />
              <label htmlFor="hasPaid" className="text-sm font-semibold text-slate-800 cursor-pointer">
                J'ai effectué le paiement de {fee} FCFA sur le numéro indiqué
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 px-6 rounded-2xl bg-slate-900 hover:bg-slate-800 active:scale-[0.99] text-white font-bold shadow-xl shadow-slate-900/20 hover:shadow-slate-900/30 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer group"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span className="text-base">{isRejectedFixMode ? 'Soumettre à nouveau mon dossier corrigé' : 'Créer mon compte'}</span>
                  <ArrowRight className="w-5 h-5 text-amber-400 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>

            <div className="text-center pt-4">
              <p className="text-sm text-slate-600">
                Déjà un compte ?{' '}
                <Link href="/connexion" className="font-bold text-amber-600 hover:text-amber-700">
                  Se connecter
                </Link>
              </p>
            </div>
          </form>
        </div>
      </main>

      <AdminSecretModal
        isOpen={showAdminModal}
        onClose={() => setShowAdminModal(false)}
      />
    </div>
  );
}

