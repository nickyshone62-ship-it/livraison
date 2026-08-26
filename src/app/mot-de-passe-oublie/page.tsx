'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Truck, Mail, ArrowRight, CheckCircle } from 'lucide-react';

export default function MotDePasseOubliePage() {
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-center items-center px-4 relative overflow-hidden">
      <div className="max-w-md w-full bg-slate-900/80 backdrop-blur-xl border border-slate-800 p-8 rounded-3xl text-center shadow-2xl z-10 space-y-6">
        <Link href="/" className="inline-flex items-center space-x-3 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center">
            <Truck className="w-7 h-7 text-white" />
          </div>
          <span className="text-2xl font-black bg-gradient-to-r from-amber-400 to-white bg-clip-text text-transparent">
            LIVRAISON OUAGA
          </span>
        </Link>

        <h1 className="text-2xl font-extrabold">Réinitialisation du mot de passe</h1>

        {submitted ? (
          <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 space-y-3">
            <CheckCircle className="w-10 h-10 mx-auto" />
            <div className="font-bold">Demande transmise !</div>
            <p className="text-xs text-slate-300">
              Un message avec les instructions de réinitialisation vous a été envoyé si le numéro ou l'email est associé à un compte.
            </p>
            <Link href="/connexion" className="inline-block mt-4 text-xs font-bold text-amber-400 hover:text-amber-300">
              Retour à la connexion
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Numéro de téléphone ou Email
              </label>
              <input
                type="text"
                required
                value={emailOrPhone}
                onChange={(e) => setEmailOrPhone(e.target.value)}
                placeholder="ex: 70000000 ou email@exemple.bf"
                className="w-full px-4 py-3.5 bg-slate-950 border border-slate-800 rounded-2xl text-white outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 text-white font-bold transition-all shadow-lg flex items-center justify-center space-x-2"
            >
              <span>Envoyer le lien de réinitialisation</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </form>
        )}

        <div className="pt-2">
          <Link href="/connexion" className="text-xs font-semibold text-slate-400 hover:text-white">
            ← Annuler et revenir à la connexion
          </Link>
        </div>
      </div>
    </div>
  );
}
