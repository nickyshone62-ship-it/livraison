'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { AdminModeBanner } from '@/components/AdminModeBanner';
import { PWAInstaller } from '@/components/PWAInstaller';
import { Truck, ShieldCheck, Phone, Heart, User, Store, MapPin } from 'lucide-react';

export function AppLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setSession(data.user);
        } else {
          setSession(null);
        }
      } catch (e) {
        setSession(null);
      } finally {
        setLoading(false);
      }
    }
    checkSession();
  }, [pathname]);

  // Hide Navbar & Footer if user is not authenticated OR on auth pages
  const isAuthPage = pathname === '/' || pathname.startsWith('/auth');
  const hideNavigation = !session || isAuthPage;

  if (hideNavigation) {
    // Pure Full-Screen Onboarding Wall without Navbar or Footer or Grey borders
    return (
      <div className="min-h-screen w-full bg-white flex flex-col justify-between overflow-x-hidden">
        <main className="flex-1 flex flex-col w-full">{children}</main>
        <PWAInstaller />
      </div>
    );
  }

  // Full Authenticated App Layout with Navbar & Footer
  return (
    <div className="flex flex-col min-h-screen bg-[#F0FDFB] text-[#004D40] antialiased selection:bg-[#009688] selection:text-white">
      <Navbar />
      <AdminModeBanner />
      <main className="flex-1">{children}</main>
      <PWAInstaller />

      {/* Footer */}
      <footer className="bg-[#004D40] text-white border-t-4 border-[#009688] mt-16 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            
            {/* Platform Brand Info */}
            <div className="md:col-span-1 space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-r from-[#00E5D9] via-[#00B4D8] to-[#009688] flex items-center justify-center text-white font-black shadow-lg border-2 border-white">
                  <Truck className="w-6 h-6" />
                </div>
                <div>
                  <span className="font-black text-2xl tracking-tight text-white block leading-none">
                    Livraison<span className="text-[#00E5D9]">Ouaga</span>
                  </span>
                  <span className="text-[10px] uppercase font-extrabold tracking-widest text-teal-200">Burkina Faso 🇧🇫</span>
                </div>
              </div>
              <p className="text-xs text-teal-100/80 leading-relaxed font-medium">
                La 1ère plateforme burkinabè de mise en relation directe entre commerçants, particuliers et livreurs vérifiés à Ouagadougou.
              </p>
              <div className="inline-flex items-center gap-2 text-xs font-black text-[#00E5D9] bg-white/10 px-3 py-1.5 rounded-full border border-white/20 shadow-sm">
                <ShieldCheck className="w-4 h-4 text-[#00E5D9]" /> 100% Sécurisé par Codes OTP
              </div>
            </div>

            {/* 1. Bouton / Section Utilisateurs */}
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs font-black uppercase tracking-wider shadow-md border border-white/30">
                <User className="w-4 h-4" />
                <span>Utilisateurs</span>
              </div>
              <ul className="space-y-2.5 text-xs font-black">
                <li>
                  <a
                    href="/client"
                    className="group w-full p-3 rounded-2xl bg-white/10 hover:bg-white/25 text-white transition-all flex items-center justify-between border border-white/20 shadow-sm hover:scale-102 cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-xl bg-teal-500/30 flex items-center justify-center text-[#00E5D9] group-hover:scale-110 transition-transform">
                        <Store className="w-4 h-4" />
                      </div>
                      <span>Espace Client</span>
                    </div>
                    <span className="text-[10px] bg-teal-400/20 text-[#00E5D9] px-2 py-0.5 rounded-full border border-teal-300/30">Accéder ↗</span>
                  </a>
                </li>
                <li>
                  <a
                    href="/livreur"
                    className="group w-full p-3 rounded-2xl bg-white/10 hover:bg-white/25 text-white transition-all flex items-center justify-between border border-white/20 shadow-sm hover:scale-102 cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-xl bg-emerald-500/30 flex items-center justify-center text-emerald-300 group-hover:scale-110 transition-transform">
                        <Truck className="w-4 h-4" />
                      </div>
                      <span>Espace Livreur Partner</span>
                    </div>
                    <span className="text-[10px] bg-emerald-400/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-300/30">Accéder ↗</span>
                  </a>
                </li>
                <li>
                  <a
                    href="/admin"
                    className="group w-full p-3 rounded-2xl bg-white/10 hover:bg-white/25 text-white transition-all flex items-center justify-between border border-white/20 shadow-sm hover:scale-102 cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-xl bg-amber-500/30 flex items-center justify-center text-amber-300 group-hover:scale-110 transition-transform">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <span>Administration Central</span>
                    </div>
                    <span className="text-[10px] bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-300/30">Accéder ↗</span>
                  </a>
                </li>
              </ul>
            </div>

            {/* 2. Bouton / Section Zones Desservies */}
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-sky-500 to-blue-600 text-white text-xs font-black uppercase tracking-wider shadow-md border border-white/30">
                <MapPin className="w-4 h-4" />
                <span>Zones Desservies</span>
              </div>
              <ul className="space-y-2 text-xs font-bold text-teal-100">
                <li className="p-2.5 bg-white/10 rounded-xl border border-white/15 flex items-center gap-2 hover:bg-white/20 transition-all">
                  <span className="text-amber-300">📍</span>
                  <span>Ouaga-Centre, Zogona & Koulouba</span>
                </li>
                <li className="p-2.5 bg-white/10 rounded-xl border border-white/15 flex items-center gap-2 hover:bg-white/20 transition-all">
                  <span className="text-amber-300">📍</span>
                  <span>Ouaga 2000, Patte d'Oie & Karpala</span>
                </li>
                <li className="p-2.5 bg-white/10 rounded-xl border border-white/15 flex items-center gap-2 hover:bg-white/20 transition-all">
                  <span className="text-amber-300">📍</span>
                  <span>Kamboinse, Tampouy & Larlé</span>
                </li>
                <li className="p-2.5 bg-white/10 rounded-xl border border-white/15 flex items-center gap-2 hover:bg-white/20 transition-all">
                  <span className="text-amber-300">📍</span>
                  <span>Pissy, Gounghin & Dassasgho</span>
                </li>
              </ul>
            </div>

            {/* 3. Bouton / Section Assistance Clientèle */}
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white text-xs font-black uppercase tracking-wider shadow-md border border-white/30">
                <Phone className="w-4 h-4 text-white" />
                <span>Assistance Clientèle</span>
              </div>
              <ul className="space-y-2.5 text-xs font-black">
                <li>
                  <a
                    href="tel:+22606887330"
                    className="p-3 rounded-2xl bg-white/10 hover:bg-white/25 text-white transition-all flex items-center gap-3 border border-white/20 shadow-sm cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/30 flex items-center justify-center text-emerald-300 shrink-0">
                      <Phone className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] text-teal-200 block uppercase font-extrabold">Téléphone Direct</span>
                      <span className="font-mono text-sm text-white font-black">+226 06 88 73 30</span>
                    </div>
                  </a>
                </li>
                <li>
                  <a
                    href="https://wa.me/22606887330"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 rounded-2xl bg-emerald-600/40 hover:bg-emerald-600/60 text-white transition-all flex items-center gap-3 border border-emerald-400/40 shadow-sm cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-xl bg-emerald-500 flex items-center justify-center text-white shrink-0 shadow-md">
                      💬
                    </div>
                    <div>
                      <span className="text-[10px] text-emerald-200 block uppercase font-extrabold">WhatsApp Support 24/7</span>
                      <span className="font-mono text-sm text-white font-black">+226 06 88 73 30 ↗</span>
                    </div>
                  </a>
                </li>
                <li className="p-2.5 bg-white/10 rounded-xl border border-white/15 text-[11px] text-teal-200 flex items-center gap-2">
                  <span>🏢</span>
                  <span>Siège social : Ouagadougou, Burkina Faso 🇧🇫</span>
                </li>
              </ul>
            </div>

          </div>

          <div className="border-t border-white/15 pt-8 flex flex-col sm:flex-row justify-between items-center text-xs text-teal-200/90 font-extrabold gap-4">
            <p>© 2026 LivraisonOuaga. Tous droits réservés. Développé pour le Burkina Faso 🇧🇫.</p>
            <p className="flex items-center gap-1">
              Fait avec <Heart className="w-3.5 h-3.5 text-red-400 fill-red-400" /> à Ouagadougou
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
