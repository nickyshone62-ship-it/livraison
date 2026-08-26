'use client';

import React, { useState } from 'react';
import {
  Truck,
  ShieldCheck,
  Zap,
  MapPin,
  CreditCard,
  PhoneCall,
  CheckCircle2,
  HelpCircle,
  Smartphone,
  Award,
  Users,
  Store,
  FileText,
  Clock,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface PlatformGuideSectionProps {
  onClose?: () => void;
  onStartDelivery?: () => void;
}

export function PlatformGuideSection({ onClose, onStartDelivery }: PlatformGuideSectionProps) {
  const [activeTab, setActiveTab] = useState<'FEATURES' | 'STEPS' | 'PRICING' | 'SAFETY'>('STEPS');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const faqs = [
    {
      question: "Comment est garantie la sécurité de mes colis à Ouagadougou ?",
      answer: "Chaque livraison sur la plateforme est sécurisée par un code PIN OTP à 4 chiffres généré automatiquement. Le livreur ne peut valider la fin de la course que si le destinataire lui communique ce code lors de la remise physique du colis."
    },
    {
      question: "Quels sont les modes de paiement acceptés ?",
      answer: "Nous acceptons les paiements via Mobile Money (Orange Money, Moov Money, Wave) directement dans l'application, ainsi que le paiement en espèces à la livraison (Cash On Delivery) selon vos préférences."
    },
    {
      question: "Tous les livreurs sont-ils vérifiés ?",
      answer: "Oui ! Tous les livreurs inscrits sur LivraisonOuaga passent un contrôle d'identité KYC obligatoire (vérification de la CNIB, du permis de conduire et des pièces du véhicule) validé par notre équipe avant de recevoir des propositions."
    },
    {
      question: "Que faire en cas de problème ou retard de livraison ?",
      answer: "Vous pouvez ouvrir un litige en 1-clic depuis votre historique ou contacter immédiatement notre centre d'assistance Ouaga par téléphone/WhatsApp au +226 70 00 00 00."
    }
  ];

  return (
    <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl p-6 sm:p-8 shadow-2xl space-y-8 relative overflow-hidden">
      
      {/* Background Decorative Glow */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-b border-slate-800 pb-6 relative z-10">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-blue-950/80 border border-blue-800 text-blue-400 font-bold text-[11px] rounded-full uppercase tracking-wider">
              Guide officiel • Ouagadougou 🇧🇫
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
            <span>Tout savoir sur LivraisonOuaga</span>
            <SparklesIcon className="w-6 h-6 text-blue-400" />
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl font-medium">
            Découvrez comment notre réseau interconnecte clients et livreurs professionnels à travers la capitale en toute transparence et sécurité.
          </p>
        </div>

        {onStartDelivery && (
          <button
            onClick={onStartDelivery}
            className="px-6 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-2xl text-xs uppercase tracking-wider shadow-lg shadow-blue-600/30 transition-all shrink-0 cursor-pointer"
          >
            🚀 Publier une livraison
          </button>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-4">
        <button
          onClick={() => setActiveTab('STEPS')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'STEPS'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
              : 'bg-slate-800/80 text-slate-400 hover:text-white'
          }`}
        >
          <Zap className="w-4 h-4" />
          <span>Comment ça marche</span>
        </button>

        <button
          onClick={() => setActiveTab('FEATURES')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'FEATURES'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
              : 'bg-slate-800/80 text-slate-400 hover:text-white'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Services & Rôles</span>
        </button>

        <button
          onClick={() => setActiveTab('PRICING')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'PRICING'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
              : 'bg-slate-800/80 text-slate-400 hover:text-white'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Tarifs & Paiements</span>
        </button>

        <button
          onClick={() => setActiveTab('SAFETY')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'SAFETY'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
              : 'bg-slate-800/80 text-slate-400 hover:text-white'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Sécurité & Support</span>
        </button>
      </div>

      {/* Tab Content 1: How it Works */}
      {activeTab === 'STEPS' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-5 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-900/60 text-blue-400 font-extrabold flex items-center justify-center text-sm border border-blue-800/60">
              1
            </div>
            <h3 className="font-extrabold text-white text-base">Publiez votre besoin</h3>
            <p className="text-xs text-slate-400 leading-relaxed font-medium">
              Indiquez l'adresse de départ et d'arrivée (ex: Koulouba ➡️ Ouaga 2000), le type de colis (pli, vêtement, marchandise) et l'urgence souhaitée.
            </p>
          </div>

          <div className="p-5 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-900/60 text-indigo-400 font-extrabold flex items-center justify-center text-sm border border-indigo-800/60">
              2
            </div>
            <h3 className="font-extrabold text-white text-base">Sélectionnez votre livreur</h3>
            <p className="text-xs text-slate-400 leading-relaxed font-medium">
              Des livreurs vérifiés situés à proximité reçoivent votre demande et vous envoient leurs propositions. Choisissez l'offre qui vous convient.
            </p>
          </div>

          <div className="p-5 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-900/60 text-emerald-400 font-extrabold flex items-center justify-center text-sm border border-emerald-800/60">
              3
            </div>
            <h3 className="font-extrabold text-white text-base">Validation OTP & Paiement</h3>
            <p className="text-xs text-slate-400 leading-relaxed font-medium">
              Suivez le parcours en temps réel. À l'arrivée, communiquez le code secret OTP au livreur pour certifier la bonne réception de la course.
            </p>
          </div>
        </div>
      )}

      {/* Tab Content 2: Features & Roles */}
      {activeTab === 'FEATURES' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-5 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-3">
            <div className="flex items-center gap-2 text-blue-400">
              <Users className="w-5 h-5" />
              <h3 className="font-bold text-white text-sm">Pour les Clients</h3>
            </div>
            <ul className="text-xs text-slate-400 space-y-2 font-medium">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" /> Envoi de colis, plis et commandes à domicile</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" /> Choix libre du livreur et des tarifs proposés</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" /> Sécurité maximale grâce au double code OTP</li>
            </ul>
          </div>

          <div className="p-5 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-3">
            <div className="flex items-center gap-2 text-emerald-400">
              <Truck className="w-5 h-5" />
              <h3 className="font-bold text-white text-sm">Pour les Livreurs</h3>
            </div>
            <ul className="text-xs text-slate-400 space-y-2 font-medium">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Inscription rapide avec contrôle KYC administrateur</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Alertes en temps réel sur les courses à proximité</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Formule unique d'abonnement à 1 000 FCFA / mois sans commission</li>
            </ul>
          </div>
        </div>
      )}

      {/* Tab Content 3: Pricing & Payments */}
      {activeTab === 'PRICING' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl text-center space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Zone 1 • Centre-Ville</span>
              <div className="text-xl font-extrabold text-blue-400">500 - 1 000 FCFA</div>
              <p className="text-[10px] text-slate-500">Koulouba, Zone du Bois, Paspanga</p>
            </div>
            <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl text-center space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Zone 2 • Périphérie Proche</span>
              <div className="text-xl font-extrabold text-indigo-400">1 000 - 1 500 FCFA</div>
              <p className="text-[10px] text-slate-500">Ouaga 2000, Dassasgho, Wemtenga</p>
            </div>
            <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl text-center space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Zone 3 • Grande Périphérie</span>
              <div className="text-xl font-extrabold text-emerald-400">1 500 - 2 500 FCFA</div>
              <p className="text-[10px] text-slate-500">Tampouy, Saaba, Kamboinsin, Pissy</p>
            </div>
          </div>

          <div className="p-4 bg-blue-950/40 border border-blue-800/60 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-3">
              <CreditCard className="w-6 h-6 text-blue-400 shrink-0" />
              <div>
                <span className="font-bold text-white block">Paiements Mobile Money 100% Intégrés</span>
                <span className="text-slate-400">Rechargez ou payez directement avec Orange Money, Moov Money et Wave.</span>
              </div>
            </div>
            <div className="flex items-center gap-2 font-bold text-blue-300">
              <span>🧡 Orange</span> • <span>💙 Moov</span> • <span>🌊 Wave</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content 4: Safety & Support */}
      {activeTab === 'SAFETY' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-blue-400">
                <ShieldCheck className="w-5 h-5" />
                <span className="font-bold text-white text-sm">Protection par Code OTP</span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                Aucun colis ne peut être marqué comme livré tant que le destinataire n'a pas vérifié l'état du colis et remis le code sécurisé au livreur.
              </p>
            </div>

            <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-emerald-400">
                <PhoneCall className="w-5 h-5" />
                <span className="font-bold text-white text-sm">Assistance Ouagadougou 24/7</span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                Notre équipe locale basée à Ouagadougou répond immédiatement au <strong className="text-white">+226 70 00 00 00</strong> (Appel & WhatsApp).
              </p>
            </div>
          </div>
        </div>
      )}

      {/* FAQ Accordion */}
      <div className="space-y-3 pt-4 border-t border-slate-800">
        <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-blue-400" />
          Foire Aux Questions (FAQ)
        </h3>
        
        <div className="space-y-2">
          {faqs.map((faq, idx) => (
            <div key={idx} className="bg-slate-950/80 border border-slate-800/80 rounded-2xl overflow-hidden transition-all">
              <button
                onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                className="w-full p-4 text-left font-bold text-xs sm:text-sm text-slate-200 flex items-center justify-between gap-4 cursor-pointer hover:text-white"
              >
                <span>{faq.question}</span>
                {openFaqIndex === idx ? <ChevronUp className="w-4 h-4 text-blue-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />}
              </button>
              {openFaqIndex === idx && (
                <div className="px-4 pb-4 pt-1 text-xs text-slate-400 leading-relaxed border-t border-slate-900 font-medium">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Close or Action Footer */}
      {onClose && (
        <div className="text-center pt-2">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl cursor-pointer transition-all"
          >
            Fermer le guide
          </button>
        </div>
      )}

    </div>
  );
}

function SparklesIcon(props: any) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  );
}
