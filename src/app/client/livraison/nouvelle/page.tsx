'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  MapPin,
  User,
  Package,
  Calendar,
  Clock,
  Send,
  AlertCircle,
  Link2,
  CheckCircle2,
  Navigation,
  ChevronRight,
  ChevronLeft,
  Crosshair,
  Check
} from 'lucide-react';
import { extractCoordinatesFromMapUrl } from '@/lib/mapUtils';
import { Navbar } from '@/components/Navbar';
import { AdminModeBanner } from '@/components/AdminModeBanner';

export default function NouvelleLivraisonPage() {
  const router = useRouter();

  // Active step (1: Départ, 2: Arrivée, 3: Colis, 4: Destinataire, 5: Date/Heure, 6: Vérification)
  const [currentStep, setCurrentStep] = useState<number>(1);

  // ÉTAPE 1: Point de Départ (Lien 1)
  const [pickupAddress, setPickupAddress] = useState('');
  const [pickupCity, setPickupCity] = useState('Ouagadougou');
  const [pickupInstructions, setPickupInstructions] = useState('');
  const [pickupLatitude, setPickupLatitude] = useState<number | null>(null);
  const [pickupLongitude, setPickupLongitude] = useState<number | null>(null);
  const [pickupGpsExtracted, setPickupGpsExtracted] = useState<boolean>(false);

  // ÉTAPE 2: Point d'Arrivée (Lien 2)
  const [destinationAddress, setDestinationAddress] = useState('');
  const [destinationCity, setDestinationCity] = useState('Ouagadougou');
  const [destinationInstructions, setDestinationInstructions] = useState('');
  const [destinationLatitude, setDestinationLatitude] = useState<number | null>(null);
  const [destinationLongitude, setDestinationLongitude] = useState<number | null>(null);
  const [destinationGpsExtracted, setDestinationGpsExtracted] = useState<boolean>(false);

  // ÉTAPE 3: Colis
  const [packageDescription, setPackageDescription] = useState('');
  const [packageCategory, setPackageCategory] = useState('Colis Général');
  const [packageWeight, setPackageWeight] = useState('1');
  const [packageQuantity, setPackageQuantity] = useState('1');
  const [packageSize, setPackageSize] = useState('Moyen');
  const [additionalInstructions, setAdditionalInstructions] = useState('');

  // ÉTAPE 4: Destinataire
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');

  // ÉTAPE 5: Date/Heure
  const [requestedDate, setRequestedDate] = useState(new Date().toISOString().split('T')[0]);
  const [requestedTime, setRequestedTime] = useState('14:00');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdDelivery, setCreatedDelivery] = useState<any | null>(null);

  // Extraction GPS Départ (Lien 1)
  const handlePickupAddressChange = (val: string) => {
    setPickupAddress(val);
    const coords = extractCoordinatesFromMapUrl(val);
    if (coords) {
      setPickupLatitude(coords.latitude);
      setPickupLongitude(coords.longitude);
      setPickupGpsExtracted(true);
    } else {
      setPickupGpsExtracted(false);
    }
  };

  // GPS automatique position actuelle client
  const useCurrentLocationForPickup = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setPickupLatitude(lat);
        setPickupLongitude(lng);
        setPickupGpsExtracted(true);
        setPickupAddress(`https://maps.google.com/?q=${lat},${lng}`);
      });
    }
  };

  // Extraction GPS Arrivée (Lien 2)
  const handleDestinationAddressChange = (val: string) => {
    setDestinationAddress(val);
    const coords = extractCoordinatesFromMapUrl(val);
    if (coords) {
      setDestinationLatitude(coords.latitude);
      setDestinationLongitude(coords.longitude);
      setDestinationGpsExtracted(true);
    } else {
      setDestinationGpsExtracted(false);
    }
  };

  const useCurrentLocationForDestination = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setDestinationLatitude(lat);
        setDestinationLongitude(lng);
        setDestinationGpsExtracted(true);
        setDestinationAddress(`https://maps.google.com/?q=${lat},${lng}`);
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pickupAddress || !destinationAddress || !recipientName || !recipientPhone || !packageDescription) {
      setError('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/deliveries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pickupAddress,
          pickupCity,
          pickupInstructions,
          pickupLatitude,
          pickupLongitude,
          destinationAddress,
          destinationCity,
          destinationInstructions,
          destinationLatitude,
          destinationLongitude,
          recipientName,
          recipientPhone,
          packageDescription,
          packageCategory,
          packageWeight,
          packageQuantity,
          packageSize,
          requestedDate,
          requestedTime,
          additionalInstructions,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur lors de la création de la livraison');

      if (data.deliveryRequest) {
        setCreatedDelivery(data.deliveryRequest);
      } else {
        router.push('/client');
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la soumission');
    } finally {
      setLoading(false);
    }
  };

  const stepsList = [
    { num: 1, label: 'Départ' },
    { num: 2, label: 'Arrivée' },
    { num: 3, label: 'Colis' },
    { num: 4, label: 'Destinataire' },
    { num: 5, label: 'Date/Heure' },
    { num: 6, label: 'Vérification' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* En-tête */}
      <header className="bg-white border-b border-slate-200 py-4 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/client" className="p-2 rounded-lg bg-slate-100 text-slate-600 hover:text-slate-900">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-lg font-bold text-slate-900">Demande de livraison</h1>
          <span className="text-xs font-semibold text-slate-500">Étape {currentStep} / 6</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        
        {/* BARRE D'AVANCEMENT ÉTAPES */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="grid grid-cols-6 gap-1 text-center">
            {stepsList.map((st) => (
              <button
                key={st.num}
                onClick={() => setCurrentStep(st.num)}
                className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  currentStep === st.num
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : currentStep > st.num
                    ? 'bg-slate-100 text-slate-700'
                    : 'bg-slate-50 text-slate-400'
                }`}
              >
                <div>{st.num}</div>
                <div className="hidden sm:block text-[10px] uppercase tracking-wider">{st.label}</div>
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* ÉTAPE 1 : 📍 DÉPART */}
          {currentStep === 1 && (
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-amber-600" />
                  <span>ÉTAPE 1 : 📍 Point de Départ (Ramassage)</span>
                </h2>
                <span className="text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  Lien N°1 (Départ)
                </span>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Coller le 1er lien de localisation (Point de départ) *
                  </label>
                  <div className="relative">
                    <Link2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      required
                      value={pickupAddress}
                      onChange={(e) => handlePickupAddressChange(e.target.value)}
                      placeholder="Ex: https://maps.google.com/?q=12.3714,-1.5197 ou adresse à Ouaga"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={useCurrentLocationForPickup}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-slate-300"
                  >
                    <Crosshair className="w-3.5 h-3.5 text-amber-600" />
                    <span>Utiliser ma position actuelle</span>
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Instructions précises pour le livreur au départ</label>
                  <input
                    type="text"
                    value={pickupInstructions}
                    onChange={(e) => setPickupInstructions(e.target.value)}
                    placeholder="Ex: Appeler à l'arrivée, boutique à côté de la pharmacie"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    if (!pickupAddress) { setError("Veuillez saisir le point de départ."); return; }
                    setError(null);
                    setCurrentStep(2);
                  }}
                  className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold rounded-lg text-xs flex items-center gap-1 shadow-sm"
                >
                  <span>Suivant : Point d'Arrivée</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ÉTAPE 2 : 🏁 ARRIVÉE */}
          {currentStep === 2 && (
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Navigation className="w-5 h-5 text-emerald-600" />
                  <span>ÉTAPE 2 : 🏁 Point d'Arrivée (Livraison)</span>
                </h2>
                <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Lien N°2 (Arrivée)
                </span>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Coller le 2ème lien de localisation (Point d'arrivée) *
                  </label>
                  <div className="relative">
                    <Link2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      required
                      value={destinationAddress}
                      onChange={(e) => handleDestinationAddressChange(e.target.value)}
                      placeholder="Ex: https://maps.google.com/?q=12.3900,-1.4900 ou adresse à Karpala"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={useCurrentLocationForDestination}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-slate-300"
                  >
                    <Crosshair className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Utiliser ma position actuelle</span>
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Instructions précises pour la remise au destinataire</label>
                  <input
                    type="text"
                    value={destinationInstructions}
                    onChange={(e) => setDestinationInstructions(e.target.value)}
                    placeholder="Ex: Portail vert en face de l'école"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Retour</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!destinationAddress) { setError("Veuillez saisir le point d'arrivée."); return; }
                    setError(null);
                    setCurrentStep(3);
                  }}
                  className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold rounded-lg text-xs flex items-center gap-1 shadow-sm"
                >
                  <span>Suivant : Détails Colis</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ÉTAPE 3 : 📦 COLIS */}
          {currentStep === 3 && (
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                <Package className="w-5 h-5 text-amber-600" />
                <span>ÉTAPE 3 : 📦 Contenu du Colis</span>
              </h2>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Description exacte du colis *</label>
                  <input
                    type="text"
                    required
                    value={packageDescription}
                    onChange={(e) => setPackageDescription(e.target.value)}
                    placeholder="Ex: Sac de vêtements, smartphone ou cartons"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Catégorie</label>
                    <select
                      value={packageCategory}
                      onChange={(e) => setPackageCategory(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium"
                    >
                      <option value="Colis Général">Colis Général</option>
                      <option value="Documents">Documents & Papiers</option>
                      <option value="Repas / Nourriture">Repas / Nourriture</option>
                      <option value="Électronique">Matériel Électronique</option>
                      <option value="Colis Lourd">Colis Volumineux</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Taille</label>
                    <select
                      value={packageSize}
                      onChange={(e) => setPackageSize(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium"
                    >
                      <option value="Petit">Petit (Sachet / Enveloppe)</option>
                      <option value="Moyen">Moyen (Carton standard)</option>
                      <option value="Grand">Grand (Encombrant)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Retour</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!packageDescription) { setError("Veuillez décrire le colis."); return; }
                    setError(null);
                    setCurrentStep(4);
                  }}
                  className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold rounded-lg text-xs flex items-center gap-1 shadow-sm"
                >
                  <span>Suivant : Destinataire</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ÉTAPE 4 : 👤 DESTINATAIRE */}
          {currentStep === 4 && (
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                <User className="w-5 h-5 text-sky-600" />
                <span>ÉTAPE 4 : 👤 Coordonnées du Destinataire</span>
              </h2>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nom complet du destinataire *</label>
                  <input
                    type="text"
                    required
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="Ex: Ouédraogo Fatim"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Numéro de téléphone du destinataire *</label>
                  <input
                    type="text"
                    required
                    value={recipientPhone}
                    onChange={(e) => setRecipientPhone(e.target.value)}
                    placeholder="Ex: 70 00 00 00"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Retour</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!recipientName || !recipientPhone) { setError("Veuillez saisir le nom et numéro du destinataire."); return; }
                    setError(null);
                    setCurrentStep(5);
                  }}
                  className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold rounded-lg text-xs flex items-center gap-1 shadow-sm"
                >
                  <span>Suivant : Planning</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ÉTAPE 5 : 📅 DATE ET HEURE */}
          {currentStep === 5 && (
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                <Calendar className="w-5 h-5 text-purple-600" />
                <span>ÉTAPE 5 : 📅 Programmez l'Horaire</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Date souhaitée</label>
                  <input
                    type="date"
                    value={requestedDate}
                    onChange={(e) => setRequestedDate(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Heure souhaitée</label>
                  <input
                    type="time"
                    value={requestedTime}
                    onChange={(e) => setRequestedTime(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentStep(4)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Retour</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep(6)}
                  className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold rounded-lg text-xs flex items-center gap-1 shadow-sm"
                >
                  <span>Suivant : Vérification</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ÉTAPE 6 : ✓ VÉRATION & CONFIRMATION */}
          {currentStep === 6 && (
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>ÉTAPE 6 : Récapitulatif de votre demande</span>
                </h2>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
                  Prêt à publier
                </span>
              </div>

              {/* CARTE DE VÉRATION SIMPLIFIÉE */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <span className="text-slate-500 font-semibold block">📍 Point A (Départ) :</span>
                    <span className="font-bold text-slate-900 break-all">{pickupAddress}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-semibold block">🏁 Point B (Arrivée) :</span>
                    <span className="font-bold text-slate-900 break-all">{destinationAddress}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <span className="text-slate-500 font-semibold block">📦 Colis :</span>
                    <span className="font-bold text-slate-900">{packageDescription} ({packageSize})</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-semibold block">👤 Destinataire :</span>
                    <span className="font-bold text-slate-900">{recipientName} ({recipientPhone})</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => setCurrentStep(5)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Modifier</span>
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="px-8 py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-slate-950 font-bold rounded-xl shadow-md text-sm flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Confirmer et publier la livraison</span>
                      <Send className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

        </form>

      </main>

      {/* MODALE DE CONFIRMATION AVEC CODES OTP 1 ET OTP 2 POUR LE CLIENT */}
      {createdDelivery && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="max-w-lg w-full bg-white border border-slate-200 p-6 sm:p-8 rounded-3xl shadow-2xl space-y-6 text-[#004D40]">
            
            <div className="text-center space-y-2">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-3xl shadow-md border-2 border-emerald-300">
                🎉
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">Demande Publiée avec Succès !</h2>
              <p className="text-xs text-slate-600 font-medium">
                Votre demande de livraison est maintenant en ligne et visible par les livreurs à Ouagadougou.
              </p>
            </div>

            {/* BOX DES CODES OTP 1 & OTP 2 */}
            <div className="bg-slate-50 p-5 rounded-2xl border-2 border-amber-200 space-y-4">
              <div className="font-extrabold text-xs uppercase tracking-wider text-amber-900 flex items-center justify-between">
                <span>🔒 Vos Codes de Sécurité OTP (À conserver)</span>
                <span className="bg-amber-200 px-2 py-0.5 rounded text-[10px]">Confidentiels</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* OTP 1 */}
                <div className="p-3 rounded-xl bg-white border border-amber-300 text-center space-y-1 shadow-sm">
                  <div className="text-[11px] font-black text-amber-800 uppercase">OTP 1 — RAMASSAGE (Point A)</div>
                  <div className="font-mono text-2xl font-black text-slate-900 tracking-widest">
                    {createdDelivery.initialPickupOtp || '--- ---'}
                  </div>
                  <div className="text-[10px] text-slate-500 font-bold">À donner au livreur au départ</div>
                </div>

                {/* OTP 2 */}
                <div className="p-3 rounded-xl bg-white border border-sky-300 text-center space-y-1 shadow-sm">
                  <div className="text-[11px] font-black text-sky-800 uppercase">OTP 2 — LIVRAISON (Point B)</div>
                  <div className="font-mono text-2xl font-black text-slate-900 tracking-widest">
                    {createdDelivery.initialDeliveryOtp || '--- ---'}
                  </div>
                  <div className="text-[10px] text-slate-500 font-bold">À donner au livreur à l'arrivée</div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-amber-100/70 border border-amber-300 text-[11px] font-bold text-amber-950 leading-relaxed">
                ℹ️ <strong>Instructions :</strong>
                <ul className="list-disc list-inside mt-1 space-y-1 font-semibold text-slate-700">
                  <li><strong>OTP 1</strong> : Le livreur le saisira sur son téléphone lors de la collecte du colis. L'admin verra qu'il est arrivé au Point A.</li>
                  <li><strong>OTP 2</strong> : Le livreur le saisira lors de la remise au destinataire. L'admin saura que la tâche est terminée.</li>
                </ul>
              </div>
            </div>

            <button
              type="button"
              onClick={() => router.push(`/client/livraison/${createdDelivery.id}`)}
              className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-slate-950 font-black text-sm uppercase rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Accéder au Suivi & Choisir mon Livreur</span>
              <ChevronRight className="w-5 h-5" />
            </button>

          </div>
        </div>
      )}

    </div>
  );
}