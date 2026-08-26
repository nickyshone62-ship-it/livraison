'use client';

import React from 'react';
import Link from 'next/link';
import { Clock, ShieldCheck, Truck, ArrowLeft, RefreshCw } from 'lucide-react';

export default function AttenteValidationPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-center items-center px-4 relative overflow-hidden">
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-orange-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full bg-slate-900/80 backdrop-blur-xl border border-slate-800 p-8 rounded-3xl text-center shadow-2xl z-10 space-y-6">
        <div className="w-20 h-20 mx-auto rounded-3xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
          <Clock className="w-10 h-10 animate-pulse" />
        </div>

        <h1 className="text-2xl font-black text-white">Votre compte est en attente de validation.</h1>

        <p className="text-slate-400 text-sm leading-relaxed">
          Merci pour votre inscription ! Votre paiement et vos informations ont bien été enregistrés et sont actuellement en cours de vérification par l'équipe d'administration.
        </p>

        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-2 text-left">
          <div className="flex items-center space-x-2 text-amber-400 font-bold">
            <ShieldCheck className="w-4 h-4" />
            <span>Processus de vérification obligatoire :</span>
          </div>
          <ul className="list-disc pl-4 space-y-1 text-slate-400">
            <li>Vérification du paiement Mobile Money</li>
            <li>Vérification des pièces fournies</li>
            <li>Validation administrative de votre profil</li>
          </ul>
        </div>

        <div className="pt-4 space-y-3">
          <button
            onClick={() => window.location.reload()}
            className="w-full py-3.5 px-6 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition-all flex items-center justify-center space-x-2 text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Vérifier à nouveau</span>
          </button>

          <Link
            href="/connexion"
            className="block w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 text-white font-bold transition-all text-sm"
          >
            Retour à la connexion
          </Link>
        </div>
      </div>
    </div>
  );
}
