'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Truck, User, Bike, ShieldCheck, ArrowRight, Phone, Mail, MapPin, Lock, CreditCard, Upload } from 'lucide-react';
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

  // Driver fields
  const [vehicleType, setVehicleType] = useState('motorcycle');
  const [brand, setBrand] = useState('Yamaha');
  const [model, setModel] = useState('Sirius');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [color, setColor] = useState('');
  const [year, setYear] = useState('2024');

  // Documents
  const [idCardFileUrl, setIdCardFileUrl] = useState('');
  const [driverLicenseUrl, setDriverLicenseUrl] = useState('');
  const [vehicleDocUrl, setVehicleDocUrl] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');

  // Payment
  const [paymentMethod, setPaymentMethod] = useState<'orange_money' | 'moov_money' | 'wave'>('orange_money');
  const [transactionReference, setTransactionReference] = useState('');
  const [hasPaid, setHasPaid] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
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
          registrationNumber,
          color,
          year,
          idCardFileUrl,
          driverLicenseUrl,
          vehicleDocUrl,
          photoUrl,
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
    <div className="min-h-screen bg-slate-950 text-white py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
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
            <span className="text-2xl font-black bg-gradient-to-r from-amber-400 to-white bg-clip-text text-transparent">
              LIVRAISON OUAGA
            </span>
          </div>
          <h1 className="text-3xl font-black">Créer votre compte</h1>
          <p className="text-slate-400 mt-2">Choisissez votre profil pour commencer</p>
        </div>

        {/* Role Selector */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <button
            type="button"
            onClick={() => setRole('client')}
            className={`p-6 rounded-3xl border text-left transition-all flex flex-col items-center justify-center space-y-3 ${
              role === 'client'
                ? 'bg-amber-500/10 border-amber-500 text-amber-400 shadow-lg shadow-amber-500/10'
                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <User className="w-8 h-8" />
            <div className="text-center">
              <div className="font-bold text-lg text-white">Je suis Client</div>
              <div className="text-xs text-slate-400 mt-1">Je souhaite faire livrer des colis</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setRole('driver')}
            className={`p-6 rounded-3xl border text-left transition-all flex flex-col items-center justify-center space-y-3 ${
              role === 'driver'
                ? 'bg-orange-500/10 border-orange-500 text-orange-400 shadow-lg shadow-orange-500/10'
                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <Bike className="w-8 h-8" />
            <div className="text-center">
              <div className="font-bold text-lg text-white">Je suis Livreur</div>
              <div className="text-xs text-slate-400 mt-1">Je souhaite effectuer des livraisons</div>
            </div>
          </button>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 p-8 rounded-3xl shadow-2xl space-y-6">
          {error && (
            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium">
              {error}
            </div>
          )}

          <div className="border-b border-slate-800 pb-4">
            <h2 className="text-xl font-bold text-amber-400">Informations Personnelles</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Nom complet *</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="ex: Ouedraogo Moussa"
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-white focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Téléphone *</label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="ex: 70000000"
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-white focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@exemple.bf"
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-white focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Ville</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-white focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-300 mb-2">Adresse / Quartier</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="ex: Ouaga 2000, Secteur 15"
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-white focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Mot de passe *</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-white focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Confirmation mot de passe *</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-white focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>
          </div>

          {/* Driver Specific Section */}
          {role === 'driver' && (
            <>
              <div className="border-b border-slate-800 pb-4 pt-6">
                <h2 className="text-xl font-bold text-orange-400">Informations Véhicule & Documents</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Type Véhicule</label>
                  <select
                    value={vehicleType}
                    onChange={(e) => setVehicleType(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-white focus:ring-2 focus:ring-amber-500 outline-none"
                  >
                    <option value="motorcycle">Moto</option>
                    <option value="car">Tricycle / Voiture</option>
                    <option value="van">Camionnette / Camion</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Marque</label>
                  <input
                    type="text"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    placeholder="Yamaha, Honda..."
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-white focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Immatriculation</label>
                  <input
                    type="text"
                    value={registrationNumber}
                    onChange={(e) => setRegistrationNumber(e.target.value)}
                    placeholder="11-JJ-0000"
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-white focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">URL Pièce d'identité (CNIB/Passeport)</label>
                  <input
                    type="url"
                    value={idCardFileUrl}
                    onChange={(e) => setIdCardFileUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-white focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">URL Permis / Carte Grise</label>
                  <input
                    type="url"
                    value={driverLicenseUrl}
                    onChange={(e) => setDriverLicenseUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-white focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>
              </div>
            </>
          )}

          {/* Payment Section */}
          <div className="border-b border-slate-800 pb-4 pt-6">
            <h2 className="text-xl font-bold text-amber-400">Paiement Frais d'Inscription ({fee} FCFA)</h2>
            <p className="text-xs text-slate-400 mt-1">Le paiement est vérifié et approuvé par l'administration avant l'activation du compte.</p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <button
              type="button"
              onClick={() => setPaymentMethod('orange_money')}
              className={`p-4 rounded-2xl border text-center font-bold transition-all ${
                paymentMethod === 'orange_money' ? 'bg-orange-500/20 border-orange-500 text-orange-400' : 'bg-slate-950 border-slate-800 text-slate-400'
              }`}
            >
              Orange Money
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod('moov_money')}
              className={`p-4 rounded-2xl border text-center font-bold transition-all ${
                paymentMethod === 'moov_money' ? 'bg-blue-500/20 border-blue-500 text-blue-400' : 'bg-slate-950 border-slate-800 text-slate-400'
              }`}
            >
              Moov Money
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod('wave')}
              className={`p-4 rounded-2xl border text-center font-bold transition-all ${
                paymentMethod === 'wave' ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400' : 'bg-slate-950 border-slate-800 text-slate-400'
              }`}
            >
              Wave
            </button>
          </div>

          {/* Payment Instructions Box */}
          <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 text-sm">
            <div className="font-bold text-amber-400 flex items-center justify-between">
              <span>Instructions de paiement Mobile Money :</span>
              <span className="text-white text-base">{fee} FCFA</span>
            </div>

            {paymentMethod === 'orange_money' && (
              <div>
                <p className="text-slate-300">Numéro Orange Money : <span className="font-bold text-white">06887330</span></p>
                <p className="text-xs text-slate-400 mt-1">Code USSD : <code className="bg-slate-900 px-2 py-1 rounded text-amber-300">*144*2*1*06887330*{fee}#</code></p>
              </div>
            )}

            {paymentMethod === 'moov_money' && (
              <div>
                <p className="text-slate-300">Numéro Moov Money : <span className="font-bold text-white">62017878</span></p>
                <p className="text-xs text-slate-400 mt-1">Code USSD : <code className="bg-slate-900 px-2 py-1 rounded text-blue-300">*555*2*1*62017878*{fee}#</code></p>
              </div>
            )}

            {paymentMethod === 'wave' && (
              <div>
                <p className="text-slate-300">Numéro Wave : <span className="font-bold text-white">06887330</span></p>
              </div>
            )}

            <div className="pt-2">
              <label className="block text-xs font-semibold text-slate-400 mb-1">Référence de Transaction (Facultatif)</label>
              <input
                type="text"
                value={transactionReference}
                onChange={(e) => setTransactionReference(e.target.value)}
                placeholder="ex: OM-98765432"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs outline-none"
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
            <label htmlFor="hasPaid" className="text-sm font-semibold text-white cursor-pointer">
              J'ai effectué le paiement de {fee} FCFA sur le numéro indiqué
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {loading ? (
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Créer mon compte</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>

          <div className="text-center pt-4">
            <p className="text-sm text-slate-400">
              Déjà un compte ?{' '}
              <Link href="/connexion" className="font-bold text-amber-400 hover:text-amber-300">
                Se connecter
              </Link>
            </p>
          </div>
        </form>
      </div>

      <AdminSecretModal
        isOpen={showAdminModal}
        onClose={() => setShowAdminModal(false)}
      />
    </div>
  );
}
