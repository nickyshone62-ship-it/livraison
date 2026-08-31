'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Truck, Mail, ArrowRight, CheckCircle } from 'lucide-react';
import { Navbar } from '@/components/Navbar';

export default function MotDePasseOubliePage() {
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-amber-500 selection:text-white flex flex-col justify-between">
      <Navbar />

      <main className="flex-1 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-orange-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-md w-full bg-white border border-slate-200/80 p-8 rounded-3xl text-center shadow-xl z-10 space-y-6">
          <Link href="/" className="inline-flex items-center space-x-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Truck className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl font-black text-slate-950">
              LIVRAISON <span className="text-amber-600">OUAGA</span>
            </span>
          </Link>

          <h1 className="text-2xl font-extrabold text-slate-950">Réinitialisation du mot de passe</h1>

          {submitted ? (
            <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 space-y-3">
              <CheckCircle className="w-10 h-10 mx-auto text-emerald-600" />
              <div className="font-bold">Demande transmise !</div>
              <p className="text-xs text-slate-600">
                Un message avec les instructions de réinitialisation vous a été envoyé si le numéro ou l'email est associé à un compte.
              </p>
              <Link href="/connexion" className="inline-block mt-4 text-xs font-bold text-amber-600 hover:text-amber-700">
                Retour à la connexion
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-left">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Numéro de téléphone ou Email
                </label>
                <input
                  type="text"
                  required
                  value={emailOrPhone}
                  onChange={(e) => setEmailOrPhone(e.target.value)}
                  placeholder="ex: 70000000 ou email@exemple.bf"
                  className="w-full px-4 py-3.5 bg-slate-50 border border-slate-300 rounded-2xl text-slate-900 placeholder-slate-400 outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
                />
              </div>

              <button
                type="submit"
                className="w-full py-4 px-6 rounded-2xl bg-slate-900 hover:bg-slate-800 active:scale-[0.99] text-white font-bold transition-all shadow-xl shadow-slate-900/20 flex items-center justify-center space-x-2 cursor-pointer group"
              >
                <span className="text-base">Envoyer le lien de réinitialisation</span>
                <ArrowRight className="w-5 h-5 text-amber-400 group-hover:translate-x-1 transition-transform" />
              </button>
            </form>
          )}

          <div className="pt-2">
            <Link href="/connexion" className="text-xs font-semibold text-slate-500 hover:text-slate-800">
              ← Annuler et revenir à la connexion
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

