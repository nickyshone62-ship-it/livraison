'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Truck,
  ShieldCheck,
  Zap,
  CreditCard,
  PhoneCall,
  CheckCircle2,
  HelpCircle,
  Award,
  Users,
  Store,
  Sparkles,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  MapPin,
} from 'lucide-react';

export default function WelcomeGuidePage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'STEPS' | 'FEATURES' | 'PRICING' | 'SAFETY'>('STEPS');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) setCurrentUser(data.user);
      })
      .catch((e) => console.error(e));
  }, []);

  const handleContinueToDashboard = () => {
    if (currentUser?.role === 'LIVREUR') {
      router.push('/livreur');
    } else if (currentUser?.role === 'ADMIN') {
      router.push('/admin');
    } else {
      router.push('/client');
    }
  };

  const faqs = [
    {
      question: "Comment est garantie la sécurité de mes colis à Ouagadougou ?",
      answer: "Chaque course sur LivraisonOuaga est protégée par un code secret OTP à 4 chiffres. Le livreur ne peut clôturer la livraison qu'après avoir reçu ce code fourni par le destinataire lors de la remise en main propre."
    },
    {
      question: "Quels sont les moyens de paiement acceptés ?",
      answer: "Vous pouvez régler vos livraisons par Mobile Money (Orange Money, Moov Money, Wave) directement dans l'application ou en espèces à la livraison (Cash On Delivery)."
    },
    {
      question: "Comment fonctionne la vérification des livreurs ?",
      answer: "Chaque livreur inscrit est rigoureusement identifié avec vérification manuelle de sa pièce d'identité (CNIB), de son permis et des documents de son véhicule par l'équipe d'administration."
    },
    {
      question: "Que faire en cas de question ou d'urgence ?",
      answer: "Notre centre d'assistance à Ouagadougou est joignable 24h/7 par téléphone et WhatsApp au +226 70 00 00 00."
    }
  ];

  return (
    <div className="min-h-screen w-full bg-slate-950 text-white p-6 sm:p-10 lg:p-14 flex flex-col justify-between overflow-x-hidden selection:bg-blue-600 selection:text-white relative">
      
      {/* Background Ambient Orbs */}
      <div className="absolute -top-32 -left-32 w-[500px] h-[500px] bg-blue-600/15 rounded-full blur-[140px] pointer-events-none"></div>
      <div className="absolute -bottom-32 -right-32 w-[500px] h-[500px] bg-indigo-600/15 rounded-full blur-[140px] pointer-events-none"></div>

      {/* Top Header Bar */}
      <div className="w-full max-w-4xl mx-auto flex items-center justify-between relative z-10 pb-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 p-0.5 shadow-lg shadow-blue-600/30 flex items-center justify-center text-white">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <span className="font-extrabold text-xl tracking-tight text-white block">
              Livraison<span className="text-blue-400">Ouaga</span>
            </span>
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block">Guide Officiel d'Accueil 🇧🇫</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-blue-950/80 border border-blue-800/60 text-blue-300 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4 text-blue-400" />
            <span className="hidden sm:inline">Compte Créé avec Succès</span>
          </div>
        </div>
      </div>

      {/* Main Guide Content */}
      <div className="w-full max-w-4xl mx-auto my-auto space-y-8 py-8 relative z-10">
        
        {/* Welcome Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-800/80 text-emerald-300 text-xs font-bold uppercase tracking-wider">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Félicitations ! Votre compte est prêt</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white flex items-center justify-center gap-2">
            <span>Bienvenue sur la plateforme</span>
            <Sparkles className="w-7 h-7 text-blue-400" />
          </h1>

          <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto font-medium">
            {currentUser?.profile?.fullName ? `Bonjour ${currentUser.profile.fullName}, ` : ''}
            voici tout ce que vous devez savoir pour expedier et recevoir vos colis en toute sérénité à Ouagadougou.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap justify-center gap-2 border-b border-slate-800/80 pb-4">
          <button
            onClick={() => setActiveTab('STEPS')}
            className={`px-5 py-3 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'STEPS'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'bg-slate-900/90 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>1. Comment ça marche</span>
          </button>

          <button
            onClick={() => setActiveTab('FEATURES')}
            className={`px-5 py-3 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'FEATURES'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'bg-slate-900/90 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>2. Profils & Services</span>
          </button>

          <button
            onClick={() => setActiveTab('PRICING')}
            className={`px-5 py-3 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'PRICING'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'bg-slate-900/90 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>3. Tarifs & Mobile Money</span>
          </button>

          <button
            onClick={() => setActiveTab('SAFETY')}
            className={`px-5 py-3 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'SAFETY'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'bg-slate-900/90 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>4. Sécurité & Support</span>
          </button>
        </div>

        {/* Tab 1: Steps */}
        {activeTab === 'STEPS' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-3xl space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-950 border border-blue-800 text-blue-400 font-extrabold flex items-center justify-center text-base">
                1
              </div>
              <h3 className="font-extrabold text-white text-lg">Publiez votre besoin</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-medium">
                Saisissez vos adresses de départ et de destination à Ouagadougou (Koulouba, Ouaga 2000, Tampouy...), indiquez le type de colis et l'urgence.
              </p>
            </div>

            <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-3xl space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-950 border border-indigo-800 text-indigo-400 font-extrabold flex items-center justify-center text-base">
                2
              </div>
              <h3 className="font-extrabold text-white text-lg">Choisissez votre livreur</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-medium">
                Des livreurs de proximité qualifiés reçoivent votre offre et vous proposent leurs tarifs. Choisissez librement l'offre idéale.
              </p>
            </div>

            <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-3xl space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-950 border border-emerald-800 text-emerald-400 font-extrabold flex items-center justify-center text-base">
                3
              </div>
              <h3 className="font-extrabold text-white text-lg">Validation OTP & Remise</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-medium">
                Suivez la course sur carte. Remettez le code secret OTP à 4 chiffres au livreur uniquement lors de la livraison effective.
              </p>
            </div>
          </div>
        )}

        {/* Tab 2: Features */}
        {activeTab === 'FEATURES' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-3xl space-y-4">
              <div className="flex items-center gap-2 text-blue-400">
                <Users className="w-6 h-6" />
                <h3 className="font-extrabold text-white text-base">Espace Particulier</h3>
              </div>
              <ul className="text-xs text-slate-400 space-y-3 font-medium">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" /> Envois express de plis & cadeaux</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" /> Estimation instantanée du prix</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" /> Historique et suivi direct</li>
              </ul>
            </div>

            <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-3xl space-y-4">
              <div className="flex items-center gap-2 text-amber-400">
                <Store className="w-6 h-6" />
                <h3 className="font-extrabold text-white text-base">Espace Commerçant</h3>
              </div>
              <ul className="text-xs text-slate-400 space-y-3 font-medium">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" /> Cash On Delivery (Espèces à la livraison)</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" /> Formules d'abonnements mensuels</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" /> Factures & preuves numériques</li>
              </ul>
            </div>

            <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-3xl space-y-4">
              <div className="flex items-center gap-2 text-emerald-400">
                <Truck className="w-6 h-6" />
                <h3 className="font-extrabold text-white text-base">Espace Livreur</h3>
              </div>
              <ul className="text-xs text-slate-400 space-y-3 font-medium">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Authentification KYC obligatoire</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Réception de courses en temps réel</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Portefeuille et virements réguliers</li>
              </ul>
            </div>
          </div>
        )}

        {/* Tab 3: Pricing */}
        {activeTab === 'PRICING' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-2xl text-center space-y-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Zone 1 • Centre-Ville</span>
                <div className="text-2xl font-black text-blue-400">500 - 1 000 FCFA</div>
                <p className="text-xs text-slate-500 font-medium">Koulouba, Zone du Bois, Paspanga, Gounghin</p>
              </div>

              <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-2xl text-center space-y-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Zone 2 • Périphérie Proche</span>
                <div className="text-2xl font-black text-indigo-400">1 000 - 1 500 FCFA</div>
                <p className="text-xs text-slate-500 font-medium">Ouaga 2000, Dassasgho, Wemtenga, Patte d'Oie</p>
              </div>

              <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-2xl text-center space-y-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Zone 3 • Grande Périphérie</span>
                <div className="text-2xl font-black text-emerald-400">1 500 - 2 500 FCFA</div>
                <p className="text-xs text-slate-500 font-medium">Tampouy, Saaba, Kamboinsin, Pissy, Somgandé</p>
              </div>
            </div>

            <div className="p-5 bg-blue-950/50 border border-blue-800/80 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-3">
                <CreditCard className="w-7 h-7 text-blue-400 shrink-0" />
                <div>
                  <span className="font-extrabold text-white text-sm block">Paiements Mobile Money Burkina Faso</span>
                  <span className="text-slate-400 font-medium">Effectuez vos recharges et règlements sans tracas.</span>
                </div>
              </div>
              <div className="flex items-center gap-2 font-bold text-blue-300">
                <span className="px-3 py-1 bg-amber-950/80 border border-amber-800 text-amber-300 rounded-lg">🟠 Orange Money</span>
                <span className="px-3 py-1 bg-blue-950/80 border border-blue-800 text-blue-300 rounded-lg">💙 Moov Money</span>
                <span className="px-3 py-1 bg-sky-950/80 border border-sky-800 text-sky-300 rounded-lg">🌊 Wave</span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Safety & Support */}
        {activeTab === 'SAFETY' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-3xl space-y-3">
              <div className="flex items-center gap-2 text-blue-400">
                <ShieldCheck className="w-6 h-6" />
                <h3 className="font-extrabold text-white text-base">Sécurité par Code OTP</h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed font-medium">
                Toutes les livraisons génèrent un code confidentiel. Aucun livreur ne peut empocher la livraison sans la confirmation physique du destinataire à la réception.
              </p>
            </div>

            <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-3xl space-y-3">
              <div className="flex items-center gap-2 text-emerald-400">
                <PhoneCall className="w-6 h-6" />
                <h3 className="font-extrabold text-white text-base">Support Client 24/7</h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed font-medium">
                Une équipe locale basée à Ouagadougou vous assiste en direct sur WhatsApp ou appel direct au <strong className="text-white">+226 70 00 00 00</strong>.
              </p>
            </div>
          </div>
        )}

        {/* FAQ Section */}
        <div className="space-y-4 pt-4 border-t border-slate-800">
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-blue-400" />
            Questions Fréquentes (FAQ)
          </h3>

          <div className="space-y-2">
            {faqs.map((faq, idx) => (
              <div key={idx} className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden">
                <button
                  onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                  className="w-full p-4 text-left font-bold text-xs sm:text-sm text-slate-200 flex items-center justify-between gap-4 cursor-pointer hover:text-white"
                >
                  <span>{faq.question}</span>
                  {openFaqIndex === idx ? <ChevronUp className="w-4 h-4 text-blue-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />}
                </button>
                {openFaqIndex === idx && (
                  <div className="px-4 pb-4 pt-1 text-xs text-slate-400 leading-relaxed border-t border-slate-800 font-medium">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Dedicated Main Call to Action Button */}
        <div className="pt-6 text-center space-y-3">
          <button
            onClick={handleContinueToDashboard}
            className="w-full sm:w-auto px-10 py-5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-sm sm:text-base uppercase tracking-wider rounded-2xl shadow-xl shadow-blue-600/40 transition-all cursor-pointer inline-flex items-center justify-center gap-3 group"
          >
            <span>ACCÉDER À MON ESPACE & COMMENCER</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
          
          <p className="text-xs text-slate-500 font-medium">
            Vous pourrez consulter ce guide à tout moment dans votre espace d'administration ou client.
          </p>
        </div>

      </div>

    </div>
  );
}
