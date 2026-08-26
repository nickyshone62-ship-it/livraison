'use client';

import React from 'react';
import Link from 'next/link';
import { Truck, ShieldCheck, Zap, Users, ArrowRight, CheckCircle } from 'lucide-react';

export default function EntreprisePage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white relative overflow-hidden">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center">
              <Truck className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-black bg-gradient-to-r from-amber-400 to-white bg-clip-text text-transparent">
              LIVRAISON OUAGA
            </span>
          </Link>

          <div className="flex items-center space-x-4">
            <Link href="/connexion" className="text-sm font-semibold text-slate-300 hover:text-white">
              Connexion
            </Link>
            <Link href="/inscription" className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm">
              S'inscrire
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center max-w-3xl mx-auto space-y-6">
          <span className="px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold uppercase tracking-wider">
            À propos de notre entreprise
          </span>

          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white">
            La Première Plateforme Directe Clients & Livreurs au Burkina Faso
          </h1>

          <p className="text-slate-400 text-lg leading-relaxed">
            Notre mission est de connecter directement et en toute transparence les particuliers et entreprises avec des livreurs indépendants vérifiés à Ouagadougou et dans toutes les villes du pays.
          </p>
        </div>

        {/* Key Points */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
          <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold">0 FCFA de Commission</h3>
            <p className="text-slate-400 text-sm">
              Le montant total convenu pour la livraison est payé directement au livreur à la réception du colis. La plateforme ne retient aucune commission sur vos livraisons.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-400 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold">Vérification & Sécurité</h3>
            <p className="text-slate-400 text-sm">
              Tous nos livreurs font l'objet d'une vérification rigoureuse de leurs pièces d'identité, permis et véhicules avant toute activation par l'administration.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold">Mise en Relation Transparente</h3>
            <p className="text-slate-400 text-sm">
              Comparez plusieurs propositions de prix, consultez les notes des livreurs et suivez votre colis en temps réel sur la carte GPS.
            </p>
          </div>
        </div>

        <div className="mt-16 p-8 rounded-3xl bg-gradient-to-r from-amber-500/10 to-orange-600/10 border border-amber-500/20 text-center space-y-6">
          <h2 className="text-2xl font-bold">Prêt à démarrer avec nous ?</h2>
          <div className="flex items-center justify-center space-x-4">
            <Link href="/inscription" className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold text-sm shadow-lg flex items-center space-x-2">
              <span>Créer un compte</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
