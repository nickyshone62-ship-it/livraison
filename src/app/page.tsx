'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Truck,
  MapPin,
  CheckCircle2,
  Clock,
  ShieldCheck,
  ArrowRight,
  UserCheck,
  Navigation,
  Sparkles,
  PhoneCall,
  ChevronRight,
  Smartphone,
  Star,
  Users
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';

import { fetchAuthMe } from '@/lib/sessionCache';

export default function HomePage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAuthMe()
      .then((user) => {
        if (user) setCurrentUser(user);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handlePrimaryCTA = () => {
    if (!currentUser) {
      router.push('/inscription');
    } else {
      const role = (currentUser.role || '').toLowerCase();
      if (role === 'admin') router.push('/admin');
      else if (role === 'driver' || role === 'livreur') router.push('/driver');
      else router.push('/client/livraison/nouvelle');
    }
  };

  const handleDriverCTA = () => {
    if (!currentUser) {
      router.push('/inscription?role=LIVREUR');
    } else {
      const role = (currentUser.role || '').toLowerCase();
      if (role === 'admin') router.push('/admin');
      else if (role === 'driver' || role === 'livreur') router.push('/driver');
      else router.push('/client');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-amber-500 selection:text-white flex flex-col">
      
      {/* BANNER RECOGNITION OUAGADOUGOU */}
      <div className="bg-slate-900 border-b border-slate-800 py-2.5 px-4 text-center text-xs font-semibold text-slate-300 flex items-center justify-center gap-2">
        <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-0.5 rounded text-[11px] font-bold">
          🇧🇫 OUAGADOUGOU
        </span>
        <span>Plateforme officielle de mise en relation directe Clients ↔ Livreurs à Ouagadougou</span>
      </div>

      {/* 1. HERO SECTION SOBRE & PROFESSIONNELLE */}
      <section className="relative pt-12 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-3xl mx-auto space-y-6">
          
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-200/80 border border-slate-300 text-slate-700 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>La référence de la livraison géolocalisée au Burkina Faso</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-950 tracking-tight leading-tight">
            Votre livraison, <span className="text-amber-600">simplement.</span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-600 font-normal leading-relaxed">
            Demandez une livraison, choisissez votre livreur et suivez votre colis en temps réel sur la carte interactive de Ouagadougou.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <button
              onClick={handlePrimaryCTA}
              className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 text-base cursor-pointer"
            >
              <span>Demander une livraison</span>
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={handleDriverCTA}
              className="w-full sm:w-auto px-7 py-3.5 bg-white hover:bg-slate-100 text-slate-800 font-bold rounded-xl border border-slate-300 shadow-sm transition-all flex items-center justify-center gap-2 text-base cursor-pointer"
            >
              <span>Devenir livreur</span>
            </button>
          </div>

        </div>

        {/* 2. REPRÉSENTATION VISUELLE MODERNE DU TRAJET */}
        <div className="mt-16 bg-white rounded-2xl border border-slate-200/80 shadow-xl p-6 sm:p-10 max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">Suivi direct de coursier</h2>
            <p className="text-sm font-semibold text-slate-700 mt-1">Visibilité totale du point de collecte au point de remise</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center relative">
            
            {/* POINT DE DÉPART */}
            <div className="flex flex-col items-center text-center p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 flex items-center justify-center font-bold mb-3 shadow-sm">
                <MapPin className="w-6 h-6" />
              </div>
              <div className="text-xs font-extrabold text-amber-600 uppercase tracking-wide">Point A</div>
              <h3 className="font-bold text-slate-900 mt-1 text-base">Point de Départ</h3>
              <p className="text-xs text-slate-500 mt-1">Colis préparé par le client</p>
            </div>

            {/* LIVREUR EN COURS */}
            <div className="flex flex-col items-center text-center p-4 rounded-xl bg-amber-50 border border-amber-200 relative">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-slate-950 flex items-center justify-center font-bold mb-3 shadow-md">
                <Truck className="w-6 h-6 text-white" />
              </div>
              <div className="text-xs font-extrabold text-amber-700 uppercase tracking-wide">En Transit GPS</div>
              <h3 className="font-bold text-slate-900 mt-1 text-base">Livreur Dédié</h3>
              <p className="text-xs text-slate-600 mt-1">Course directe sans arrêt</p>
            </div>

            {/* POINT D'ARRIVÉE */}
            <div className="flex flex-col items-center text-center p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 flex items-center justify-center font-bold mb-3 shadow-sm">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="text-xs font-extrabold text-emerald-600 uppercase tracking-wide">Point B</div>
              <h3 className="font-bold text-slate-900 mt-1 text-base">Point d'Arrivée</h3>
              <p className="text-xs text-slate-500 mt-1">Remise sécurisée avec code OTP</p>
            </div>

          </div>
        </div>
      </section>

      {/* 3. SECTION COMMENT ÇA MARCHE */}
      <section id="comment-ca-marche" className="py-16 bg-white border-y border-slate-200/80 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Comment ça marche ?</h2>
            <p className="text-sm sm:text-base text-slate-600 mt-2">Trois étapes simples pour expédier et recevoir vos colis à Ouagadougou.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-3 p-6 rounded-xl border border-slate-200 bg-slate-50/50">
              <div className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 font-black text-sm flex items-center justify-center">1</div>
              <h3 className="text-lg font-bold text-slate-900">Demandez votre course</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Indiquez simplement le point de ramassage (Point A) et le lieu de livraison (Point B) avec les détails du colis.
              </p>
            </div>

            <div className="space-y-3 p-6 rounded-xl border border-slate-200 bg-slate-50/50">
              <div className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 font-black text-sm flex items-center justify-center">2</div>
              <h3 className="text-lg font-bold text-slate-900">Comparez et choisissez</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Recevez les propositions des livreurs à proximité. Choisissez la meilleure offre selon la note et le prix.
              </p>
            </div>

            <div className="space-y-3 p-6 rounded-xl border border-slate-200 bg-slate-50/50">
              <div className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 font-black text-sm flex items-center justify-center">3</div>
              <h3 className="text-lg font-bold text-slate-900">Suivez en temps réel</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Visualisez votre coursier sur la carte GPS et validez la remise finale en toute sécurité grâce au code OTP.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. ENTREPRISE & GARANTIES */}
      <section id="entreprise" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-200 text-slate-800 text-xs font-semibold">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Plateforme Sécurisée & Vérifiée</span>
            </div>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight leading-snug">
              Des livreurs de confiance contrôlés par l'administration
            </h2>
            <p className="text-slate-600 text-base leading-relaxed">
              Tous les livreurs inscrits sur LivraisonOuaga sont soumis à une vérification rigoureuse (CNIB, permis, carte grise) validée par notre centre de contrôle avant toute prise en charge.
            </p>
            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <span className="text-sm text-slate-700 font-medium">Codes secrets OTP pour sécuriser le ramassage et la livraison.</span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <span className="text-sm text-slate-700 font-medium">Paiements d'abonnements simples via Orange Money, Moov Money et Wave.</span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <span className="text-sm text-slate-700 font-medium">Support administrateur en direct 7j/7 à Ouagadougou.</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 text-slate-100 p-8 rounded-2xl border border-slate-800 shadow-xl space-y-6">
            <h3 className="text-xl font-bold text-white">Tarification d'Abonnement Transparente</h3>
            <p className="text-xs text-slate-400">Aucune commission prélevée sur vos courses. Tarifs d'abonnement uniques :</p>
            
            <div className="space-y-4 pt-2">
              <div className="p-4 rounded-xl bg-slate-800 border border-slate-700 flex justify-between items-center">
                <div>
                  <div className="font-bold text-white text-sm">Abonnement Livreur</div>
                  <div className="text-xs text-slate-400">Accès illimité aux demandes de courses</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-black text-amber-400">1 000 FCFA</div>
                  <div className="text-[10px] text-slate-400">/ mois</div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-800 border border-slate-700 flex justify-between items-center">
                <div>
                  <div className="font-bold text-white text-sm">Abonnement Client</div>
                  <div className="text-xs text-slate-400">Création et suivi illimité de livraisons</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-black text-amber-400">1 000 FCFA</div>
                  <div className="text-[10px] text-slate-400">/ mois</div>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={handlePrimaryCTA}
                className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl transition-colors text-sm cursor-pointer"
              >
                Rejoindre la plateforme
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer id="aide" className="mt-auto bg-slate-900 text-slate-400 py-10 border-t border-slate-800 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-amber-500" />
            <span className="font-bold text-slate-200">LivraisonOuaga 🇧🇫</span>
            <span>— Plateforme de livraison à Ouagadougou</span>
          </div>
          <div>
            <span>© 2026 LivraisonOuaga. Tous droits réservés.</span>
          </div>
        </div>
      </footer>

    </div>
  );
}