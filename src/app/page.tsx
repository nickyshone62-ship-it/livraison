'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Truck,
  ShieldCheck,
  Zap,
  MapPin,
  CheckCircle2,
  HelpCircle,
  Award,
  Users,
  Store,
  Sparkles,
  ArrowRight,
  ChevronDown,
  Clock,
  Search,
  Check,
  Star,
  User,
  Lock,
  Phone,
  Building2,
  AlertCircle,
  FileText,
  Menu,
  X,
  Package,
  ShoppingBag,
  Shirt,
  Smartphone,
  MessageCircle,
  Mail,
  Share2,
  DollarSign,
  TrendingUp,
  Calendar,
  Navigation,
} from 'lucide-react';
import { OnboardingAuth } from '@/components/OnboardingAuth';

function HomePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || undefined;

  const [loadingAuth, setLoadingAuth] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authInitialRole, setAuthInitialRole] = useState<'PARTICULIER' | 'COMMERCANT' | 'ENTREPRISE' | 'LIVREUR'>('PARTICULIER');

  // Quick Action Block State
  const [quickPickup, setQuickPickup] = useState('Karpala');
  const [quickDropoff, setQuickDropoff] = useState('Ouaga 2000');

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        if (data.user) setUser(data.user);
        else setUser(null);
      } else {
        setUser(null);
      }
    } catch (e) {
      setUser(null);
    } finally {
      setLoadingAuth(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  if (loadingAuth) {
    return (
      <div className="min-h-screen bg-[#E0F7F6] flex items-center justify-center text-[#004D40]">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 border-3 border-[#009688] border-t-transparent rounded-full animate-spin"></div>
          <span className="text-base font-black text-[#004D40]">Vérification de votre compte...</span>
        </div>
      </div>
    );
  }

  // REQUIRE REGISTRATION / LOGIN BEFORE ACCESSING THE HOMEPAGE
  if (!user) {
    return (
      <OnboardingAuth
        redirectUrl={redirectUrl}
        onSuccess={() => checkAuth()}
      />
    );
  }

  const scrollToInscription = (role?: 'PARTICULIER' | 'COMMERCANT' | 'ENTREPRISE' | 'LIVREUR') => {
    if (user) {
      if (user.role === 'ADMIN') router.push('/admin');
      else if (user.role === 'LIVREUR') router.push('/livreur');
      else router.push('/client');
    } else {
      const el = document.getElementById('inscription');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      } else {
        if (role) setAuthInitialRole(role);
        setShowAuthModal(true);
      }
    }
  };

  const handleQuickCreateDelivery = (e: React.FormEvent) => {
    e.preventDefault();
    scrollToInscription('PARTICULIER');
  };

  return (
    <div className="min-h-screen bg-[#F0FDFB] text-[#004D40] font-sans selection:bg-[#009688] selection:text-white relative overflow-x-hidden">
      
      {/* 1. TOP ANNOUNCEMENT BAR (ULTRA HIGHLIGHTED & VISIBLE) */}
      <div className="bg-gradient-to-r from-[#00E5D9] via-[#00B4D8] to-[#009688] text-[#004D40] py-3.5 px-6 text-center font-black flex flex-wrap items-center justify-center gap-3 border-b-4 border-white shadow-xl relative z-50">
        <span className="bg-white text-[#004D40] text-xs sm:text-sm uppercase font-black px-4 py-1.5 rounded-full shadow-lg border-2 border-teal-100 flex items-center gap-1.5 shrink-0 scale-105">
          <Sparkles className="w-4 h-4 text-[#009688]" />
          OUAGADOUGOU 🇧🇫
        </span>
        <span className="text-sm sm:text-base font-black tracking-tight text-[#004D40]">
          Plateforme officielle de mise en relation directe : <strong className="bg-white/40 px-3 py-1 rounded-full border border-white/60 inline-block shadow-sm">Clients ↔ Livreurs Indépendants à Ouagadougou</strong>
        </span>
      </div>

      {/* 3. NAVIGATION BAR */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b-2 border-teal-100 px-6 sm:px-12 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          {/* Logo & Platform Name (Spaced out to the far left) */}
          <a href="#" className="flex items-center gap-3.5 shrink-0 mr-8 lg:mr-16">
            <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-[#00E5D9] via-[#00B4D8] to-[#009688] text-white shadow-lg p-0.5 flex items-center justify-center font-bold">
              <Truck className="w-7.5 h-7.5 text-white" />
            </div>
            <div>
              <span className="font-black text-2xl sm:text-3xl tracking-tight text-[#004D40] block">
                Livraison<span className="text-[#009688]">Ouaga</span>
              </span>
              <span className="text-xs uppercase font-extrabold tracking-widest text-[#00796B] block">Burkina Faso 🇧🇫</span>
            </div>
          </a>

          {/* Desktop Navigation Menu (Every item is a distinct, colorful, styled button) */}
          <nav className="hidden lg:flex items-center gap-2.5 sm:gap-3 text-xs sm:text-sm font-black text-[#004D40] ml-4 lg:ml-8">
            <a
              href="#"
              className="px-4 py-2 rounded-full bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white shadow-md hover:scale-105 transition-all cursor-pointer border border-white/20"
            >
              Accueil
            </a>
            <a
              href="#comment-ca-marche"
              className="px-4 py-2 rounded-full bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-white shadow-md hover:scale-105 transition-all cursor-pointer border border-white/20"
            >
              Comment ça marche
            </a>
            <a
              href="#comparez"
              className="px-4 py-2 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-md hover:scale-105 transition-all cursor-pointer border border-white/20"
            >
              Trouver un livreur
            </a>
            <a
              href="#livreurs"
              className="px-4 py-2 rounded-full bg-gradient-to-r from-[#00E5D9] via-[#00B4D8] to-[#009688] hover:from-[#00D2C4] hover:to-[#00796B] text-white shadow-md hover:scale-105 transition-all cursor-pointer border border-white/20"
            >
              Devenir livreur
            </a>
            <a
              href="#ouagadougou"
              className="px-4 py-2 rounded-full bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white shadow-md hover:scale-105 transition-all cursor-pointer border border-white/20"
            >
              Tarifs
            </a>
            <a
              href="#securite"
              className="px-4 py-2 rounded-full bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white shadow-md hover:scale-105 transition-all cursor-pointer border border-white/20"
            >
              Aide
            </a>
          </nav>

          {/* Right Action Buttons */}
          <div className="hidden lg:flex items-center gap-3.5">
            {user ? (
              <button
                onClick={() => router.push(user.role === 'ADMIN' ? '/admin' : user.role === 'LIVREUR' ? '/livreur' : '/client')}
                className="px-6 py-3 rounded-full bg-gradient-to-r from-teal-600 via-emerald-600 to-teal-700 hover:from-teal-700 hover:to-emerald-700 text-white font-black text-sm shadow-xl shadow-teal-600/30 transition-all cursor-pointer flex items-center gap-2"
              >
                <span>Mon Espace</span>
                <ArrowRight className="w-5 h-5 text-white" />
              </button>
            ) : (
              <>
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="px-5 py-2.5 rounded-full text-[#004D40] hover:bg-teal-50 border-2 border-[#009688] font-black text-sm transition-colors cursor-pointer"
                >
                  Se connecter
                </button>
                <button
                  onClick={() => scrollToInscription('PARTICULIER')}
                  className="px-6 py-2.5 rounded-full bg-gradient-to-r from-[#00E5D9] to-[#009688] hover:from-[#00D2C4] hover:to-[#00796B] text-white font-black text-sm shadow-lg shadow-teal-500/30 transition-all cursor-pointer"
                >
                  Créer un compte
                </button>
              </>
            )}
          </div>

          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-3 rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 text-white hover:opacity-90 cursor-pointer shadow-md"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden mt-3 pt-3 border-t-2 border-teal-100 space-y-3 pb-2 text-base font-bold bg-white p-5 rounded-3xl shadow-2xl">
            <a href="#" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-2.5 rounded-full bg-gradient-to-r from-teal-600 to-emerald-600 text-white font-black text-center shadow-md">Accueil</a>
            <a href="#comment-ca-marche" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-2.5 rounded-full bg-gradient-to-r from-sky-600 to-blue-600 text-white font-black text-center shadow-md">Comment ça marche</a>
            <a href="#comparez" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-2.5 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black text-center shadow-md">Trouver un livreur</a>
            <a href="#livreurs" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-2.5 rounded-full bg-gradient-to-r from-[#00E5D9] to-[#009688] text-white font-black text-center shadow-md">Devenir livreur</a>
            <a href="#ouagadougou" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-2.5 rounded-full bg-gradient-to-r from-teal-500 to-cyan-600 text-white font-black text-center shadow-md">Tarifs</a>
            <a href="#securite" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-2.5 rounded-full bg-gradient-to-r from-emerald-600 to-teal-700 text-white font-black text-center shadow-md">Aide</a>

            <div className="pt-3 border-t-2 border-teal-100 grid grid-cols-2 gap-2">
              <button
                onClick={() => { setMobileMenuOpen(false); setShowAuthModal(true); }}
                className="w-full py-3 bg-white border-2 border-[#009688] text-[#004D40] rounded-full font-bold text-sm"
              >
                Se connecter
              </button>
              <button
                onClick={() => { setMobileMenuOpen(false); scrollToInscription('PARTICULIER'); }}
                className="w-full py-3 bg-gradient-to-r from-[#00E5D9] to-[#009688] text-white rounded-full font-extrabold text-sm shadow-md"
              >
                Créer un compte
              </button>
            </div>
          </div>
        )}
      </header>

      {/* 4. HERO SECTION */}
      <section className="bg-gradient-to-br from-[#00E5D9] via-[#00D2C4] to-[#009688] text-white pt-20 pb-28 px-6 sm:px-12 relative overflow-hidden">
        
        {/* Pattern Overlay */}
        <div 
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage: 'repeating-linear-gradient(45deg, #ffffff 0, #ffffff 15px, transparent 0, transparent 30px)'
          }}
        />

        {/* Floating Glowing Color Orbs */}
        <div className="absolute top-10 left-10 w-96 h-96 bg-cyan-300/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-400/25 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/3 w-80 h-80 bg-teal-300/20 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-16 items-center relative z-10">
          
          {/* Left Hero Text Block */}
          <div className="lg:col-span-7 space-y-8 text-center lg:text-left">
            
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[#00E5D9] to-[#009688] text-white text-xs sm:text-sm font-black uppercase tracking-wider shadow-lg border border-white/30">
              <Sparkles className="w-5 h-5 text-white" />
              <span>Ouagadougou, Burkina Faso 🇧🇫</span>
            </div>

            {/* Slogan Principal EXACT */}
            <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black tracking-tight text-white leading-[1.1] drop-shadow-sm">
              « Votre livraison. <br />
              <span className="text-teal-100 drop-shadow-md">
                Votre choix. Votre livreur. »
              </span>
            </h1>

            {/* Description Card */}
            <div className="p-6 sm:p-8 bg-white/95 backdrop-blur-md rounded-3xl border-2 border-white shadow-2xl max-w-2xl mx-auto lg:mx-0">
              <p className="text-base sm:text-xl text-[#004D40] font-black leading-relaxed">
                Publiez votre demande de livraison, recevez plusieurs propositions de livreurs vérifiés, comparez les prix et les délais, puis choisissez librement le livreur qui vous convient.
              </p>
            </div>

            {/* Action Bar */}
            <div className="pt-2 max-w-xl mx-auto lg:mx-0">
              <form onSubmit={handleQuickCreateDelivery} className="flex flex-col sm:flex-row gap-3 bg-white/25 p-3 rounded-full border-2 border-white/40 backdrop-blur-md shadow-xl">
                <input
                  type="text"
                  placeholder="Quartier de livraison (ex: Karpala, Ouaga 2000)..."
                  className="flex-1 px-6 py-4 rounded-full bg-white text-[#004D40] placeholder-[#00796B] text-sm font-black outline-none shadow-md"
                />
                <button
                  type="submit"
                  className="px-8 py-4 bg-gradient-to-r from-[#00E5D9] via-[#00C4B4] to-[#009688] hover:from-[#00D2C4] hover:to-[#00796B] text-white font-black text-sm uppercase tracking-wider rounded-full shadow-2xl transition-all cursor-pointer shrink-0 flex items-center justify-center gap-2 border-2 border-white"
                >
                  <span>Créer une livraison</span>
                  <ArrowRight className="w-5 h-5 text-white" />
                </button>
              </form>

              <div className="flex items-center justify-center lg:justify-start gap-4 mt-4 text-xs sm:text-sm font-black text-white bg-white/20 backdrop-blur-md px-5 py-2.5 rounded-full inline-flex border border-white/30 shadow-sm">
                <span>✓ Sans engagement</span>
                <span>•</span>
                <span>✓ Choix libre du tarif</span>
                <span>•</span>
                <span>✓ Code OTP Sécurisé</span>
              </div>
            </div>

            {/* Secondary Option Link */}
            <div className="pt-2">
              <button
                onClick={() => scrollToInscription('LIVREUR')}
                className="inline-flex items-center gap-2 text-xs sm:text-sm uppercase font-black text-white hover:text-teal-200 underline tracking-wider cursor-pointer drop-shadow-sm"
              >
                <span>Vous êtes livreur ? Inscrivez-vous comme indépendant ➡️</span>
              </button>
            </div>

          </div>

          {/* Right Visual Element */}
          <div className="lg:col-span-5">
            <div className="p-8 bg-white text-[#004D40] rounded-[2.5rem] shadow-2xl space-y-6 relative border-4 border-white">
              
              <div className="flex items-center justify-between border-b-2 border-teal-100 pb-4">
                <div className="flex items-center gap-2 text-xs sm:text-sm font-black uppercase tracking-wider text-[#00695C]">
                  <MapPin className="w-5 h-5 text-[#009688]" />
                  <span>Flux de Livraison • Ouagadougou</span>
                </div>
                <span className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs font-black rounded-full uppercase shadow-md">
                  Service Ouaga 🟢
                </span>
              </div>

              {/* Delivery Step Cards */}
              <div className="space-y-4">
                
                <div className="p-5 bg-gradient-to-r from-teal-50 to-emerald-50 rounded-2xl border-2 border-teal-200 flex items-center justify-between gap-3 shadow-sm">
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md font-bold">
                      <Package className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-sm font-black text-[#004D40] block">📦 1. Client Publie sa demande</span>
                      <span className="text-xs text-[#00695C] font-extrabold block">Karpala ➡️ Ouaga 2000</span>
                    </div>
                  </div>
                  <span className="text-xs font-black text-white bg-gradient-to-r from-teal-500 to-emerald-600 px-3.5 py-1 rounded-full shadow-sm">Demande</span>
                </div>

                <div className="p-5 bg-gradient-to-r from-sky-50 to-blue-50 rounded-2xl border-2 border-sky-200 flex items-center justify-between gap-3 shadow-sm">
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 text-white flex items-center justify-center shrink-0 shadow-md font-bold">
                      <Truck className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-sm font-black text-[#004D40] block">🛵 2. Livreurs Proposent leurs prix</span>
                      <span className="text-xs text-[#00695C] font-extrabold block">Propositions reçues en direct</span>
                    </div>
                  </div>
                  <span className="text-xs font-black text-white bg-gradient-to-r from-sky-500 to-blue-600 px-3.5 py-1 rounded-full shadow-sm">Offres</span>
                </div>

                <div className="p-5 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl border-2 border-emerald-300 flex items-center justify-between gap-3 shadow-sm">
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex items-center justify-center shrink-0 shadow-md font-bold">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-sm font-black text-emerald-950 block">📍 3. Livraison Sécurisée OTP</span>
                      <span className="text-xs text-emerald-800 font-black block">Code de confirmation à l'arrivée</span>
                    </div>
                  </div>
                  <span className="text-xs font-black text-white bg-gradient-to-r from-emerald-600 to-teal-700 px-3.5 py-1 rounded-full shadow-sm">100% Sûr</span>
                </div>

              </div>

            </div>
          </div>

        </div>

        {/* WAVY SVG DIVIDER */}
        <div className="absolute bottom-0 left-0 right-0 w-full overflow-hidden leading-none z-10 pointer-events-none">
          <svg className="relative block w-full h-12 text-[#F0FDFB]" viewBox="0 0 1200 120" preserveAspectRatio="none" fill="currentColor">
            <path d="M0,0 C150,90 350,-40 500,45 C650,130 900,10 1200,60 L1200,120 L0,120 Z"></path>
          </svg>
        </div>

      </section>

      {/* 5. BLOC D’ACTION RAPIDE */}
      <section className="py-12 px-6 sm:px-12 max-w-5xl mx-auto">
        <div className="p-8 sm:p-12 bg-gradient-to-br from-white via-teal-50/60 to-emerald-50/60 border-2 border-teal-200 rounded-[2.5rem] shadow-2xl space-y-6">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-teal-100 pb-5">
            <div>
              <span className="text-xs sm:text-sm font-black text-emerald-600 uppercase tracking-widest block mb-1">Simulateur de Livraison</span>
              <h2 className="text-3xl sm:text-4xl font-black text-[#004D40] flex items-center gap-2">
                <span>Besoin d’un livreur ?</span>
              </h2>
            </div>

            <span className="text-xs sm:text-sm text-white bg-gradient-to-r from-teal-600 to-emerald-600 px-4 py-2 rounded-full font-black self-start sm:self-auto shadow-md">
              💡 Le client choisit librement son livreur
            </span>
          </div>

          <form onSubmit={handleQuickCreateDelivery} className="grid grid-cols-1 sm:grid-cols-3 gap-5 pt-2">
            
            {/* QUARTIER DE DÉPART */}
            <div>
              <label className="block text-xs sm:text-sm font-black uppercase text-emerald-900 mb-2 ml-1 flex items-center gap-1.5">
                <span>Quartier de Départ :</span>
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-3.5 w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md">
                  <MapPin className="w-4 h-4" />
                </div>
                <select
                  value={quickPickup}
                  onChange={(e) => setQuickPickup(e.target.value)}
                  className="w-full bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-300 rounded-full pl-12 pr-4 py-4 text-xs sm:text-sm text-emerald-950 outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/20 font-black shadow-md transition-all cursor-pointer"
                >
                  <option value="Karpala">Karpala</option>
                  <option value="Koulouba">Koulouba (Centre-Ville)</option>
                  <option value="Ouaga 2000">Ouaga 2000</option>
                  <option value="Dassasgho">Dassasgho</option>
                  <option value="Wemtenga">Wemtenga</option>
                  <option value="Tampouy">Tampouy</option>
                  <option value="Gounghin">Gounghin</option>
                  <option value="Saaba">Saaba</option>
                  <option value="Pissy">Pissy</option>
                </select>
              </div>
            </div>

            {/* QUARTIER DE DESTINATION */}
            <div>
              <label className="block text-xs sm:text-sm font-black uppercase text-sky-900 mb-2 ml-1 flex items-center gap-1.5">
                <span>Quartier de Destination :</span>
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-3.5 w-7 h-7 rounded-full bg-sky-500 text-white flex items-center justify-center shadow-md">
                  <Navigation className="w-4 h-4" />
                </div>
                <select
                  value={quickDropoff}
                  onChange={(e) => setQuickDropoff(e.target.value)}
                  className="w-full bg-gradient-to-r from-sky-50 to-blue-50 border-2 border-sky-300 rounded-full pl-12 pr-4 py-4 text-xs sm:text-sm text-sky-950 outline-none focus:border-sky-600 focus:ring-4 focus:ring-sky-500/20 font-black shadow-md transition-all cursor-pointer"
                >
                  <option value="Ouaga 2000">Ouaga 2000</option>
                  <option value="Koulouba">Koulouba (Centre-Ville)</option>
                  <option value="Karpala">Karpala</option>
                  <option value="Dassasgho">Dassasgho</option>
                  <option value="Wemtenga">Wemtenga</option>
                  <option value="Tampouy">Tampouy</option>
                  <option value="Gounghin">Gounghin</option>
                  <option value="Saaba">Saaba</option>
                  <option value="Pissy">Pissy</option>
                </select>
              </div>
            </div>

            {/* ACTION BUTTON */}
            <div className="flex items-end">
              <button
                type="submit"
                className="w-full py-4.5 bg-gradient-to-r from-[#00E5D9] via-[#00C4B4] to-[#009688] hover:from-[#00D2C4] hover:to-[#00796B] text-white font-black text-xs sm:text-sm uppercase tracking-wider rounded-full shadow-2xl transition-all transform hover:scale-105 cursor-pointer flex items-center justify-center gap-2 border-2 border-white"
              >
                <span>Créer une livraison</span>
                <ArrowRight className="w-5 h-5 text-white" />
              </button>
            </div>
          </form>

        </div>
      </section>

      {/* 6. SECTION « COMMENT ÇA MARCHE ? » */}
      <section id="comment-ca-marche" className="py-24 px-6 sm:px-12 max-w-7xl mx-auto space-y-16">
        <div className="text-center space-y-4">
          <span className="text-xs sm:text-sm font-black text-white bg-gradient-to-r from-teal-500 to-emerald-600 px-5 py-1.5 rounded-full shadow-md inline-block">
            Simplicité & Transparence
          </span>
          <h2 className="text-4xl sm:text-6xl font-black text-[#004D40]">Livrer n’a jamais été aussi simple.</h2>
        </div>

        {/* 5 Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          
          <div className="p-8 bg-gradient-to-b from-white to-teal-50/50 border-2 border-teal-200 rounded-[2rem] space-y-4 flex flex-col justify-between shadow-lg">
            <div>
              <span className="text-4xl font-black text-[#009688] block mb-2">01</span>
              <h3 className="font-black text-[#004D40] text-lg mb-2">Publiez votre demande</h3>
              <p className="text-xs sm:text-sm text-[#00695C] font-extrabold leading-relaxed">
                Indiquez le lieu de récupération, la destination, le type de colis, la date et l'heure.
              </p>
            </div>
            <div className="pt-4 text-[#009688]">
              <Package className="w-8 h-8" />
            </div>
          </div>

          <div className="p-8 bg-gradient-to-b from-white to-sky-50/50 border-2 border-sky-200 rounded-[2rem] space-y-4 flex flex-col justify-between shadow-lg">
            <div>
              <span className="text-4xl font-black text-sky-600 block mb-2">02</span>
              <h3 className="font-black text-[#004D40] text-lg mb-2">Recevez des propositions</h3>
              <p className="text-xs sm:text-sm text-[#00695C] font-extrabold leading-relaxed">
                Les livreurs disponibles et compatibles avec votre demande peuvent se proposer.
              </p>
            </div>
            <div className="pt-4 text-sky-600">
              <Users className="w-8 h-8" />
            </div>
          </div>

          <div className="p-8 bg-gradient-to-b from-white to-purple-50/50 border-2 border-purple-200 rounded-[2rem] space-y-4 flex flex-col justify-between shadow-lg">
            <div>
              <span className="text-4xl font-black text-purple-600 block mb-2">03</span>
              <h3 className="font-black text-[#004D40] text-lg mb-2">Comparez</h3>
              <p className="text-xs sm:text-sm text-[#00695C] font-extrabold leading-relaxed">
                Le client peut comparer : prix, délai, note, nombre de livraisons, véhicule et badge vérifié.
              </p>
            </div>
            <div className="pt-4 text-purple-600">
              <Star className="w-8 h-8" />
            </div>
          </div>

          <div className="p-8 bg-gradient-to-b from-white to-indigo-50/50 border-2 border-indigo-200 rounded-[2rem] space-y-4 flex flex-col justify-between shadow-lg">
            <div>
              <span className="text-4xl font-black text-indigo-600 block mb-2">04</span>
              <h3 className="font-black text-[#004D40] text-lg mb-2">Choisissez</h3>
              <p className="text-xs sm:text-sm text-[#00695C] font-extrabold leading-relaxed">
                Vous choisissez librement le livreur qui vous convient.
              </p>
            </div>
            <div className="pt-4 text-indigo-600">
              <CheckCircle2 className="w-8 h-8" />
            </div>
          </div>

          <div className="p-8 bg-gradient-to-b from-white to-emerald-50/50 border-2 border-emerald-200 rounded-[2rem] space-y-4 flex flex-col justify-between shadow-lg">
            <div>
              <span className="text-4xl font-black text-emerald-600 block mb-2">05</span>
              <h3 className="font-black text-[#004D40] text-lg mb-2">Suivez votre livraison</h3>
              <p className="text-xs sm:text-sm text-[#00695C] font-extrabold leading-relaxed">
                Suivez l'évolution de votre livraison jusqu'à sa confirmation.
              </p>
            </div>
            <div className="pt-4 text-emerald-600">
              <ShieldCheck className="w-8 h-8" />
            </div>
          </div>

        </div>
      </section>

      {/* 7. SECTION POUR LES CLIENTS */}
      <section className="py-24 px-6 sm:px-12 max-w-7xl mx-auto">
        <div className="p-10 sm:p-16 bg-white border-2 border-teal-100 rounded-[2.5rem] space-y-12 shadow-xl">
          
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <span className="text-xs sm:text-sm font-black text-[#009688] uppercase tracking-widest">Colis & Livraisons</span>
            <h2 className="text-4xl sm:text-5xl font-black text-[#004D40]">Vous avez un colis à envoyer ?</h2>
            <p className="text-base sm:text-lg text-[#00695C] font-extrabold">
              Que vous soyez particulier, commerçant ou entreprise, trouvez facilement un livreur adapté à votre besoin.
            </p>
          </div>

          {/* 6 Examples Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6">
            
            <div className="p-6 bg-gradient-to-b from-teal-50 to-emerald-50 border-2 border-teal-200 rounded-3xl text-center space-y-3 shadow-md hover:scale-105 transition-all">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-600 text-white flex items-center justify-center mx-auto shadow-lg">
                <Package className="w-7 h-7" />
              </div>
              <span className="text-xs sm:text-sm font-black text-[#004D40] block">📦 Colis personnel</span>
            </div>

            <div className="p-6 bg-gradient-to-b from-sky-50 to-blue-50 border-2 border-sky-200 rounded-3xl text-center space-y-3 shadow-md hover:scale-105 transition-all">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 text-white flex items-center justify-center mx-auto shadow-lg">
                <ShoppingBag className="w-7 h-7" />
              </div>
              <span className="text-xs sm:text-sm font-black text-[#004D40] block">🛍️ Commande client</span>
            </div>

            <div className="p-6 bg-gradient-to-b from-cyan-50 to-teal-50 border-2 border-cyan-200 rounded-3xl text-center space-y-3 shadow-md hover:scale-105 transition-all">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-r from-cyan-500 to-teal-600 text-white flex items-center justify-center mx-auto shadow-lg">
                <Shirt className="w-7 h-7" />
              </div>
              <span className="text-xs sm:text-sm font-black text-[#004D40] block">👗 Vêtement</span>
            </div>

            <div className="p-6 bg-gradient-to-b from-purple-50 to-indigo-50 border-2 border-purple-200 rounded-3xl text-center space-y-3 shadow-md hover:scale-105 transition-all">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-600 text-white flex items-center justify-center mx-auto shadow-lg">
                <Sparkles className="w-7 h-7" />
              </div>
              <span className="text-xs sm:text-sm font-black text-[#004D40] block">💄 Cosmétique</span>
            </div>

            <div className="p-6 bg-gradient-to-b from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-3xl text-center space-y-3 shadow-md hover:scale-105 transition-all">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex items-center justify-center mx-auto shadow-lg">
                <FileText className="w-7 h-7" />
              </div>
              <span className="text-xs sm:text-sm font-black text-[#004D40] block">📄 Document</span>
            </div>

            <div className="p-6 bg-gradient-to-b from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-3xl text-center space-y-3 shadow-md hover:scale-105 transition-all">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white flex items-center justify-center mx-auto shadow-lg">
                <Smartphone className="w-7 h-7" />
              </div>
              <span className="text-xs sm:text-sm font-black text-[#004D40] block">📱 Petit colis</span>
            </div>

          </div>

          <div className="text-center pt-4">
            <button
              onClick={() => scrollToInscription('PARTICULIER')}
              className="px-10 py-5 bg-gradient-to-r from-[#00E5D9] via-[#00B4D8] to-[#009688] hover:from-[#00D2C4] hover:to-[#00796B] text-white font-black text-xs sm:text-sm uppercase tracking-wider rounded-full shadow-xl shadow-teal-500/30 transition-all cursor-pointer inline-flex items-center gap-2"
            >
              <span>Publier une livraison</span>
              <ArrowRight className="w-5 h-5 text-white" />
            </button>
          </div>

        </div>
      </section>

      {/* 8. SECTION POUR LES LIVREURS */}
      <section id="livreurs" className="py-24 px-6 sm:px-12 max-w-7xl mx-auto">
        <div className="p-10 sm:p-16 bg-gradient-to-br from-[#00E5D9] via-[#00D2C4] to-[#009688] text-white rounded-[2.5rem] space-y-12 shadow-2xl border-4 border-white/40">
          
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <span className="text-xs sm:text-sm font-black uppercase tracking-widest text-[#004D40] bg-white px-5 py-1.5 rounded-full border border-white inline-block shadow-sm">
              Espace Indépendants
            </span>
            <h2 className="text-4xl sm:text-6xl font-black text-white drop-shadow-sm">Vous êtes livreur ?</h2>
            <p className="text-base sm:text-lg text-teal-50 font-black">
              Trouvez des missions près de vous, choisissez les livraisons qui vous intéressent et proposez votre propre tarif.
            </p>
          </div>

          {/* 5 COLORFUL ADVANTAGE CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
            
            {/* CARD 1 */}
            <div className="p-7 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 border-2 border-emerald-300 rounded-[2rem] space-y-4 shadow-xl hover:scale-105 transition-all text-[#004D40]">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md flex items-center justify-center">
                <Check className="w-7 h-7 text-white" />
              </div>
              <h3 className="font-black text-emerald-950 text-lg leading-snug">Choisissez vos courses</h3>
              <p className="text-xs sm:text-sm text-emerald-900 font-extrabold leading-relaxed">
                Vous choisissez les demandes auxquelles vous souhaitez répondre.
              </p>
            </div>

            {/* CARD 2 */}
            <div className="p-7 bg-gradient-to-br from-sky-50 via-blue-50 to-cyan-50 border-2 border-sky-300 rounded-[2rem] space-y-4 shadow-xl hover:scale-105 transition-all text-[#004D40]">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md flex items-center justify-center">
                <Calendar className="w-7 h-7 text-white" />
              </div>
              <h3 className="font-black text-sky-950 text-lg leading-snug">Selon vos disponibilités</h3>
              <p className="text-xs sm:text-sm text-sky-900 font-extrabold leading-relaxed">
                Activez ou désactivez votre disponibilité en 1 clic.
              </p>
            </div>

            {/* CARD 3 */}
            <div className="p-7 bg-gradient-to-br from-cyan-50 via-teal-50 to-emerald-50 border-2 border-cyan-300 rounded-[2rem] space-y-4 shadow-xl hover:scale-105 transition-all text-[#004D40]">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-cyan-500 to-teal-600 text-white shadow-md flex items-center justify-center">
                <DollarSign className="w-7 h-7 text-white" />
              </div>
              <h3 className="font-black text-cyan-950 text-lg leading-snug">Proposez votre prix</h3>
              <p className="text-xs sm:text-sm text-cyan-900 font-extrabold leading-relaxed">
                Vous pouvez proposer votre tarif pour chaque livraison.
              </p>
            </div>

            {/* CARD 4 */}
            <div className="p-7 bg-gradient-to-br from-purple-50 via-indigo-50 to-violet-50 border-2 border-purple-300 rounded-[2rem] space-y-4 shadow-xl hover:scale-105 transition-all text-[#004D40]">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-md flex items-center justify-center">
                <Star className="w-7 h-7 text-white" />
              </div>
              <h3 className="font-black text-purple-950 text-lg leading-snug">Votre réputation</h3>
              <p className="text-xs sm:text-sm text-purple-900 font-extrabold leading-relaxed">
                Accumulez des évaluations et développez votre profil.
              </p>
            </div>

            {/* CARD 5 */}
            <div className="p-7 bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-50 border-2 border-violet-300 rounded-[2rem] space-y-4 shadow-xl hover:scale-105 transition-all text-[#004D40]">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-md flex items-center justify-center">
                <TrendingUp className="w-7 h-7 text-white" />
              </div>
              <h3 className="font-black text-violet-950 text-lg leading-snug">Consultez vos revenus</h3>
              <p className="text-xs sm:text-sm text-violet-900 font-extrabold leading-relaxed">
                Suivez vos livraisons et vos revenus en temps réel.
              </p>
            </div>

          </div>

          <div className="text-center pt-4">
            <button
              onClick={() => scrollToInscription('LIVREUR')}
              className="px-10 py-5 bg-gradient-to-r from-[#00E5D9] via-[#00C4B4] to-[#009688] hover:from-[#00D2C4] hover:to-[#00796B] text-white font-black text-xs sm:text-sm uppercase tracking-wider rounded-full shadow-2xl transition-all cursor-pointer inline-flex items-center gap-2 border-2 border-white"
            >
              <span>Devenir livreur</span>
              <ArrowRight className="w-5 h-5 text-white" />
            </button>
          </div>

        </div>
      </section>

      {/* 9. SECTION SÉCURITÉ */}
      <section id="securite" className="py-24 px-6 sm:px-12 max-w-7xl mx-auto space-y-16">
        <div className="text-center space-y-4">
          <span className="text-xs sm:text-sm font-black text-white bg-gradient-to-r from-teal-600 to-emerald-600 px-5 py-1.5 rounded-full shadow-md inline-block">
            Confiance & Sérénité
          </span>
          <h2 className="text-4xl sm:text-6xl font-black text-[#004D40]">Des livraisons pensées pour être plus sûres.</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          
          <div className="p-8 bg-gradient-to-b from-white to-teal-50/60 border-2 border-teal-200 rounded-3xl space-y-4 shadow-lg">
            <div className="text-4xl mb-2">🛡️</div>
            <h3 className="font-black text-[#004D40] text-xl">Livreurs vérifiés</h3>
            <p className="text-xs sm:text-sm text-[#00695C] font-extrabold leading-relaxed">
              Les livreurs doivent passer par un processus de vérification avant de pouvoir proposer des livraisons.
            </p>
          </div>

          <div className="p-8 bg-gradient-to-b from-white to-sky-50/60 border-2 border-sky-200 rounded-3xl space-y-4 shadow-lg">
            <div className="text-4xl mb-2">⭐</div>
            <h3 className="font-black text-[#004D40] text-xl">Évaluations</h3>
            <p className="text-xs sm:text-sm text-[#00695C] font-extrabold leading-relaxed">
              Consultez les notes et les avis avant de choisir votre livreur.
            </p>
          </div>

          <div className="p-8 bg-gradient-to-b from-white to-purple-50/60 border-2 border-purple-200 rounded-3xl space-y-4 shadow-lg">
            <div className="text-4xl mb-2">🔐</div>
            <h3 className="font-black text-[#004D40] text-xl">Livraison sécurisée</h3>
            <p className="text-xs sm:text-sm text-[#00695C] font-extrabold leading-relaxed">
              Des codes de récupération et de livraison peuvent être utilisés pour sécuriser les étapes importantes.
            </p>
          </div>

          <div className="p-8 bg-gradient-to-b from-white to-emerald-50/60 border-2 border-emerald-200 rounded-3xl space-y-4 shadow-lg">
            <div className="text-4xl mb-2">📦</div>
            <h3 className="font-black text-[#004D40] text-xl">Suivi</h3>
            <p className="text-xs sm:text-sm text-[#00695C] font-extrabold leading-relaxed">
              Suivez l'état de votre livraison jusqu'à sa confirmation.
            </p>
          </div>

        </div>
      </section>

      {/* 10. SECTION « COMPAREZ LES LIVREURS » */}
      <section id="comparez" className="py-24 px-6 sm:px-12 max-w-7xl mx-auto space-y-12">
        <div className="text-center space-y-4">
          <span className="text-xs sm:text-sm font-black text-white bg-gradient-to-r from-teal-600 to-emerald-600 px-5 py-1.5 rounded-full shadow-md inline-block">
            Choix Libre par le Client
          </span>
          <h2 className="text-4xl sm:text-6xl font-black text-[#004D40]">Plusieurs livreurs. Un seul choix.</h2>
          <p className="text-base sm:text-lg text-[#00695C] font-extrabold max-w-xl mx-auto">
            Comparez les propositions et choisissez le livreur qui correspond le mieux à vos besoins.
          </p>
        </div>

        {/* Realistic Request Simulation Box */}
        <div className="p-8 sm:p-12 bg-white border-2 border-teal-100 rounded-[2.5rem] space-y-8 max-w-5xl mx-auto shadow-xl">
          
          <div className="p-5 bg-gradient-to-r from-teal-50 to-emerald-50 border-2 border-teal-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="px-4 py-1.5 bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-black text-xs sm:text-sm rounded-full uppercase shadow-sm">
                Demande exemple
              </span>
              <div className="flex items-center gap-2 text-base font-black text-[#004D40]">
                <MapPin className="w-5 h-5 text-[#009688]" />
                <span>📍 Karpala ➡️ Ouaga 2000</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs sm:text-sm font-black text-[#00695C]">
              <Package className="w-5 h-5 text-[#009688]" />
              <span>📦 Petit colis</span>
            </div>
          </div>

          {/* 3 Driver Proposal Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* LIVREUR 1 */}
            <div className="p-6 sm:p-8 bg-gradient-to-b from-[#F0FDFB] to-emerald-50/50 border-2 border-teal-200 rounded-3xl space-y-5 flex flex-col justify-between shadow-md">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b-2 border-teal-200 pb-4">
                  <div>
                    <h4 className="font-black text-[#004D40] text-xl">Ibrahim</h4>
                    <span className="text-xs sm:text-sm font-black text-[#009688] flex items-center gap-1 mt-0.5">
                      ✓ Livreur vérifié
                    </span>
                  </div>
                  <div className="text-xs sm:text-sm font-black text-[#004D40] bg-teal-100 px-3 py-1.5 rounded-full border border-teal-300">
                    ⭐ 4,9/5
                  </div>
                </div>

                <div className="space-y-2 text-xs sm:text-sm text-[#00695C] font-extrabold">
                  <div className="flex justify-between">
                    <span className="text-[#00796B]">Livraisons :</span>
                    <span className="font-black text-[#004D40]">🚚 325 livraisons</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#00796B]">Délai estimé :</span>
                    <span className="font-black text-[#009688]">⏱️ 30 minutes</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t-2 border-teal-200 flex items-center justify-between">
                <div>
                  <span className="text-xs uppercase text-[#00796B] font-black block">Tarif</span>
                  <span className="text-2xl font-black text-[#004D40]">💰 1 500 FCFA</span>
                </div>
                <button
                  onClick={() => scrollToInscription('PARTICULIER')}
                  className="px-6 py-3 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white text-xs sm:text-sm font-black rounded-full shadow-md transition-all cursor-pointer"
                >
                  Choisir
                </button>
              </div>
            </div>

            {/* LIVREUR 2 */}
            <div className="p-6 sm:p-8 bg-gradient-to-b from-[#F0FDFB] to-sky-50/50 border-2 border-teal-200 rounded-3xl space-y-5 flex flex-col justify-between shadow-md">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b-2 border-teal-200 pb-4">
                  <div>
                    <h4 className="font-black text-[#004D40] text-xl">Karim</h4>
                    <span className="text-xs sm:text-sm font-black text-[#009688] flex items-center gap-1 mt-0.5">
                      ✓ Livreur vérifié
                    </span>
                  </div>
                  <div className="text-xs sm:text-sm font-black text-[#004D40] bg-teal-100 px-3 py-1.5 rounded-full border border-teal-300">
                    ⭐ 4,7/5
                  </div>
                </div>

                <div className="space-y-2 text-xs sm:text-sm text-[#00695C] font-extrabold">
                  <div className="flex justify-between">
                    <span className="text-[#00796B]">Livraisons :</span>
                    <span className="font-black text-[#004D40]">🚚 180 livraisons</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#00796B]">Délai estimé :</span>
                    <span className="font-black text-[#009688]">⏱️ 45 minutes</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t-2 border-teal-200 flex items-center justify-between">
                <div>
                  <span className="text-xs uppercase text-[#00796B] font-black block">Tarif</span>
                  <span className="text-2xl font-black text-[#004D40]">💰 1 300 FCFA</span>
                </div>
                <button
                  onClick={() => scrollToInscription('PARTICULIER')}
                  className="px-6 py-3 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white text-xs sm:text-sm font-black rounded-full shadow-md transition-all cursor-pointer"
                >
                  Choisir
                </button>
              </div>
            </div>

            {/* LIVREUR 3 */}
            <div className="p-6 sm:p-8 bg-gradient-to-b from-[#F0FDFB] to-purple-50/50 border-2 border-teal-200 rounded-3xl space-y-5 flex flex-col justify-between shadow-md">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b-2 border-teal-200 pb-4">
                  <div>
                    <h4 className="font-black text-[#004D40] text-xl">Moussa</h4>
                    <span className="text-xs sm:text-sm font-black text-[#009688] flex items-center gap-1 mt-0.5">
                      ✓ Livreur vérifié
                    </span>
                  </div>
                  <div className="text-xs sm:text-sm font-black text-[#004D40] bg-teal-100 px-3 py-1.5 rounded-full border border-teal-300">
                    ⭐ 5,0/5
                  </div>
                </div>

                <div className="space-y-2 text-xs sm:text-sm text-[#00695C] font-extrabold">
                  <div className="flex justify-between">
                    <span className="text-[#00796B]">Livraisons :</span>
                    <span className="font-black text-[#004D40]">🚚 90 livraisons</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#00796B]">Délai estimé :</span>
                    <span className="font-black text-[#009688]">⏱️ 20 minutes</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t-2 border-teal-200 flex items-center justify-between">
                <div>
                  <span className="text-xs uppercase text-[#00796B] font-black block">Tarif</span>
                  <span className="text-2xl font-black text-[#004D40]">💰 1 700 FCFA</span>
                </div>
                <button
                  onClick={() => scrollToInscription('PARTICULIER')}
                  className="px-6 py-3 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white text-xs sm:text-sm font-black rounded-full shadow-md transition-all cursor-pointer"
                >
                  Choisir
                </button>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 11. SECTION OUAGADOUGOU */}
      <section id="ouagadougou" className="py-24 px-6 sm:px-12 max-w-7xl mx-auto">
        <div className="p-10 sm:p-16 bg-white border-2 border-teal-100 rounded-[2.5rem] text-center space-y-8 relative overflow-hidden shadow-xl">
          
          <div className="space-y-4 max-w-2xl mx-auto">
            <h2 className="text-4xl sm:text-6xl font-black text-[#004D40]">Pensé pour Ouagadougou</h2>

            <p className="text-base sm:text-lg text-[#00695C] font-extrabold leading-relaxed">
              Commencez à envoyer vos colis facilement dans les quartiers de Ouagadougou grâce à une plateforme conçue pour les besoins locaux.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-teal-700 to-emerald-700 text-white text-xs sm:text-sm font-black uppercase tracking-wider shadow-md">
            <span>Ouagadougou 🇧🇫</span>
          </div>

          {/* VIBRANT COLORFUL DISTRICT BUTTONS */}
          <div className="flex flex-wrap justify-center gap-3.5 max-w-4xl mx-auto text-sm sm:text-base font-black pt-2">
            <span className="px-6 py-3 bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-full shadow-lg hover:scale-105 transition-all cursor-pointer border border-white/30">
              Koulouba
            </span>
            <span className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-full shadow-lg hover:scale-105 transition-all cursor-pointer border border-white/30">
              Ouaga 2000
            </span>
            <span className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-full shadow-lg hover:scale-105 transition-all cursor-pointer border border-white/30">
              Karpala
            </span>
            <span className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-full shadow-lg hover:scale-105 transition-all cursor-pointer border border-white/30">
              Dassasgho
            </span>
            <span className="px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-full shadow-lg hover:scale-105 transition-all cursor-pointer border border-white/30">
              Wemtenga
            </span>
            <span className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-cyan-500 text-white rounded-full shadow-lg hover:scale-105 transition-all cursor-pointer border border-white/30">
              Tampouy
            </span>
            <span className="px-6 py-3 bg-gradient-to-r from-sky-500 to-cyan-500 text-white rounded-full shadow-lg hover:scale-105 transition-all cursor-pointer border border-white/30">
              Gounghin
            </span>
            <span className="px-6 py-3 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-full shadow-lg hover:scale-105 transition-all cursor-pointer border border-white/30">
              Saaba
            </span>
            <span className="px-6 py-3 bg-gradient-to-r from-teal-400 to-cyan-600 text-white rounded-full shadow-lg hover:scale-105 transition-all cursor-pointer border border-white/30">
              Pissy
            </span>
          </div>

          <div className="pt-4 text-xs sm:text-sm font-black text-[#00796B]">
            « Bientôt disponible dans d'autres villes. »
          </div>

        </div>
      </section>

      {/* 12. SECTION APPEL À L’ACTION */}
      <section className="py-28 px-6 sm:px-12 max-w-5xl mx-auto text-center">
        <div className="p-12 sm:p-16 bg-gradient-to-br from-[#00E5D9] via-[#00D2C4] to-[#009688] text-white rounded-[2.5rem] space-y-8 shadow-2xl border-4 border-white/40 relative overflow-hidden">
          
          <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-300/30 rounded-full blur-3xl pointer-events-none" />

          <h2 className="text-4xl sm:text-6xl font-black text-white tracking-tight relative z-10">
            Prêt à envoyer votre prochain colis ?
          </h2>

          <p className="text-lg sm:text-xl text-teal-50 font-extrabold max-w-xl mx-auto relative z-10">
            Publiez votre livraison et laissez les livreurs vous proposer leurs services.
          </p>

          <div className="pt-2 relative z-10">
            <button
              onClick={() => scrollToInscription('PARTICULIER')}
              className="px-10 py-5 bg-gradient-to-r from-[#00E5D9] via-[#00C4B4] to-[#009688] hover:from-[#00D2C4] hover:to-[#00796B] text-white font-black text-sm sm:text-base uppercase tracking-wider rounded-full shadow-2xl transition-all cursor-pointer inline-flex items-center gap-3 border-2 border-white"
            >
              <span>Créer ma livraison</span>
              <ArrowRight className="w-5 h-5 text-white" />
            </button>
          </div>

          <div className="pt-6 border-t border-white/30 max-w-md mx-auto flex items-center justify-center gap-3 text-sm sm:text-base relative z-10">
            <span className="text-white font-bold">Vous êtes livreur ?</span>
            <button
              onClick={() => scrollToInscription('LIVREUR')}
              className="text-white hover:text-cyan-200 font-black underline transition-colors cursor-pointer"
            >
              Devenir livreur ➡️
            </button>
          </div>

        </div>
      </section>

      {/* 13. FOOTER */}
      <footer className="bg-gradient-to-br from-[#00E5D9] via-[#009688] to-[#004D40] text-white py-16 px-6 sm:px-12 text-sm font-sans relative overflow-hidden shadow-2xl border-t-4 border-[#00E5D9]">
        
        {/* Ambient Glowing Orbs */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-300/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-teal-400/20 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 pb-14 border-b-2 border-white/30 relative z-10">
          
          {/* Logo + Description */}
          <div className="space-y-4">
            <div className="flex items-center gap-3.5">
              <div className="w-13 h-13 rounded-2xl bg-gradient-to-r from-[#00E5D9] to-[#009688] text-white p-1 flex items-center justify-center font-bold shadow-xl border-2 border-white">
                <Truck className="w-7 h-7 text-white" />
              </div>
              <div>
                <span className="font-black text-2xl text-white block drop-shadow-md">LivraisonOuaga</span>
                <span className="text-xs uppercase font-black text-[#004D40] bg-cyan-200 px-2 py-0.5 rounded-md inline-block shadow-sm">Burkina Faso 🇧🇫</span>
              </div>
            </div>
            <p className="text-white font-extrabold leading-relaxed text-sm drop-shadow-sm">
              La plateforme de référence qui vous permet de trouver, comparer et choisir votre livreur en toute sécurité à Ouagadougou.
            </p>
          </div>

          {/* Col 1: Plateforme */}
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-[#00E5D9] via-[#00B4D8] to-[#009688] text-white font-black text-sm uppercase tracking-wider shadow-lg border border-white/40">
              <MapPin className="w-5 h-5 text-white" />
              <span>Plateforme</span>
            </div>
            <ul className="space-y-3 font-black text-sm text-white">
              <li>
                <a href="#" className="w-full px-4 py-2.5 rounded-2xl bg-white/15 hover:bg-white/30 text-white font-black transition-all flex items-center justify-between shadow-sm border border-white/20">
                  <span>Accueil</span>
                  <ArrowRight className="w-4 h-4 text-cyan-200" />
                </a>
              </li>
              <li>
                <a href="#comment-ca-marche" className="w-full px-4 py-2.5 rounded-2xl bg-white/15 hover:bg-white/30 text-white font-black transition-all flex items-center justify-between shadow-sm border border-white/20">
                  <span>Comment ça marche</span>
                  <ArrowRight className="w-4 h-4 text-cyan-200" />
                </a>
              </li>
              <li>
                <a href="#ouagadougou" className="w-full px-4 py-2.5 rounded-2xl bg-white/15 hover:bg-white/30 text-white font-black transition-all flex items-center justify-between shadow-sm border border-white/20">
                  <span>Tarifs & Quartiers</span>
                  <ArrowRight className="w-4 h-4 text-cyan-200" />
                </a>
              </li>
              <li>
                <a href="#livreurs" className="w-full px-4 py-2.5 rounded-2xl bg-white/15 hover:bg-white/30 text-white font-black transition-all flex items-center justify-between shadow-sm border border-white/20">
                  <span>Devenir livreur indépendant</span>
                  <ArrowRight className="w-4 h-4 text-cyan-200" />
                </a>
              </li>
            </ul>
          </div>

          {/* Col 2: Aide & Sécurité */}
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-sky-500 to-blue-600 text-white font-black text-sm uppercase tracking-wider shadow-lg border border-white/40">
              <ShieldCheck className="w-5 h-5 text-white" />
              <span>Aide & Sécurité</span>
            </div>
            <ul className="space-y-3 font-black text-sm text-white">
              <li>
                <a href="#securite" className="w-full px-4 py-2.5 rounded-2xl bg-white/15 hover:bg-white/30 text-white font-black transition-all flex items-center justify-between shadow-sm border border-white/20">
                  <span>Centre d'aide</span>
                  <ArrowRight className="w-4 h-4 text-cyan-200" />
                </a>
              </li>
              <li>
                <a href="#securite" className="w-full px-4 py-2.5 rounded-2xl bg-white/15 hover:bg-white/30 text-white font-black transition-all flex items-center justify-between shadow-sm border border-white/20">
                  <span>Code OTP Sécurisé</span>
                  <ArrowRight className="w-4 h-4 text-cyan-200" />
                </a>
              </li>
              <li>
                <a href="#" className="w-full px-4 py-2.5 rounded-2xl bg-white/15 hover:bg-white/30 text-white font-black transition-all flex items-center justify-between shadow-sm border border-white/20">
                  <span>Conditions d'utilisation</span>
                  <ArrowRight className="w-4 h-4 text-cyan-200" />
                </a>
              </li>
              <li>
                <a href="#" className="w-full px-4 py-2.5 rounded-2xl bg-white/15 hover:bg-white/30 text-white font-black transition-all flex items-center justify-between shadow-sm border border-white/20">
                  <span>Politique de confidentialité</span>
                  <ArrowRight className="w-4 h-4 text-cyan-200" />
                </a>
              </li>
              <li>
                <a href="#" className="w-full px-4 py-2.5 rounded-2xl bg-white/15 hover:bg-white/30 text-white font-black transition-all flex items-center justify-between shadow-sm border border-white/20">
                  <span>Signaler un problème</span>
                  <ArrowRight className="w-4 h-4 text-cyan-200" />
                </a>
              </li>
            </ul>
          </div>

          {/* Col 3: Contact Direct */}
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-black text-sm uppercase tracking-wider shadow-lg border border-white/40">
              <MessageCircle className="w-5 h-5 text-white" />
              <span>Contact Direct</span>
            </div>
            <ul className="space-y-3 font-black text-sm text-white">
              <li className="flex items-center gap-3 bg-white/20 hover:bg-white/30 p-3 rounded-2xl border border-white/30 shadow-md transition-all">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <MessageCircle className="w-5 h-5 text-white" />
                </div>
                <span>WhatsApp : <strong className="text-white font-black block">+226 06 88 73 30</strong></span>
              </li>
              <li className="flex items-center gap-3 bg-white/20 hover:bg-white/30 p-3 rounded-2xl border border-white/30 shadow-md transition-all">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Phone className="w-5 h-5 text-white" />
                </div>
                <span>Téléphone : <strong className="text-white font-black block">+226 06 88 73 30</strong></span>
              </li>
              <li className="flex items-center gap-3 bg-white/20 hover:bg-white/30 p-3 rounded-2xl border border-white/30 shadow-md transition-all">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Mail className="w-5 h-5 text-white" />
                </div>
                <span>Email : <strong className="text-white font-black block">contact@livraisonouaga.bf</strong></span>
              </li>
            </ul>
          </div>

        </div>

        <div className="max-w-7xl mx-auto pt-8 text-center text-white font-black text-sm relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span>© 2026 LivraisonOuaga 🇧🇫 — Tous droits réservés.</span>
          <div className="flex flex-wrap items-center gap-3">
            {/* Real Facebook Button */}
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-full bg-[#1877F2] hover:bg-[#166fe5] text-white font-black text-xs sm:text-sm shadow-lg flex items-center gap-2 transform hover:scale-105 transition-all border border-white/30"
            >
              <svg className="w-4.5 h-4.5 fill-current" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              <span>Facebook</span>
            </a>

            {/* Real WhatsApp Button */}
            <a
              href="https://wa.me/22670000000"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-black text-xs sm:text-sm shadow-lg flex items-center gap-2 transform hover:scale-105 transition-all border border-white/30"
            >
              <svg className="w-4.5 h-4.5 fill-current" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
              </svg>
              <span>WhatsApp</span>
            </a>

            {/* Real Instagram Button */}
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-full bg-gradient-to-tr from-[#833AB4] via-[#C13584] to-[#405DE6] hover:opacity-95 text-white font-black text-xs sm:text-sm shadow-lg flex items-center gap-2 transform hover:scale-105 transition-all border border-white/30"
            >
              <svg className="w-4.5 h-4.5 fill-current" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
              <span>Instagram</span>
            </a>
          </div>
        </div>
      </footer>

      {/* AUTH MODAL OVERLAY */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 bg-[#004D40]/90 backdrop-blur-md p-6 sm:p-10 flex items-center justify-center overflow-y-auto">
          <div className="w-full max-w-2xl relative bg-[#00C4B4] rounded-[2.5rem] border-4 border-white overflow-hidden shadow-2xl">
            <button
              onClick={() => setShowAuthModal(false)}
              className="absolute top-4 right-4 z-20 px-4 py-2 rounded-full bg-white text-[#004D40] text-xs sm:text-sm font-black shadow-md cursor-pointer"
            >
              ✕ Fermer
            </button>
            <OnboardingAuth redirectUrl={redirectUrl} onSuccess={() => setShowAuthModal(false)} />
          </div>
        </div>
      )}

    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#E0F7F6] flex items-center justify-center text-[#004D40]">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 border-3 border-[#009688] border-t-transparent rounded-full animate-spin"></div>
          <span className="text-base font-black text-[#004D40]">Initialisation de LivraisonOuaga...</span>
        </div>
      </div>
    }>
      <HomePageContent />
    </Suspense>
  );
}
