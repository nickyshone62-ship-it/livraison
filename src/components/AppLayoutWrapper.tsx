'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { AdminModeBanner } from '@/components/AdminModeBanner';
import { PWAInstaller } from '@/components/PWAInstaller';
import { Truck, ShieldCheck, Phone, Heart, User, Store, MapPin } from 'lucide-react';

import { fetchAuthMe } from '@/lib/sessionCache';

export function AppLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkSession() {
      try {
        const user = await fetchAuthMe();
        setSession(user);
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
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 antialiased selection:bg-amber-500 selection:text-slate-950">
      <Navbar />
      <AdminModeBanner />
      <main className="flex-1">{children}</main>
      <PWAInstaller />

      {/* Footer Sobriété Ouagadougou */}
      <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 mt-16 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            
            {/* Brand Info */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 font-bold flex items-center justify-center">
                  <Truck className="w-4 h-4" />
                </div>
                <span className="font-extrabold text-base text-white">
                  Livraison<span className="text-amber-400">Ouaga</span>
                </span>
                <span className="text-[10px] text-slate-400 font-semibold bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                  Burkina Faso 🇧🇫
                </span>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed">
                Plateforme burkinabè de mise en relation directe pour la livraison de colis à Ouagadougou.
              </p>
            </div>

            {/* Assistance Clientèle */}
            <div className="space-y-2">
              <div className="font-bold text-white uppercase text-[11px] tracking-wider mb-2">Assistance & Support</div>
              <div className="flex items-center gap-2 text-slate-300">
                <Phone className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Téléphone : +226 06 88 73 30</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <span className="text-emerald-400">💬</span>
                <a href="https://wa.me/22606887330" target="_blank" rel="noopener noreferrer" className="hover:text-amber-400 underline">
                  WhatsApp Support 24/7 (+226 06 88 73 30)
                </a>
              </div>
            </div>

            {/* Localisation */}
            <div className="space-y-2">
              <div className="font-bold text-white uppercase text-[11px] tracking-wider mb-2">Siège Social</div>
              <p className="text-slate-400">Ouagadougou, Burkina Faso</p>
              <div className="inline-flex items-center gap-1.5 text-emerald-400 font-semibold text-[11px] bg-emerald-950/40 px-2.5 py-1 rounded border border-emerald-800/40">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>100% Sécurisé par Codes OTP</span>
              </div>
            </div>

          </div>

          <div className="border-t border-slate-800 pt-6 flex flex-col sm:flex-row justify-between items-center text-slate-500 gap-3">
            <p>© 2026 LivraisonOuaga. Tous droits réservés. Développé pour le Burkina Faso 🇧🇫.</p>
            <p className="flex items-center gap-1">
              Fait avec <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" /> à Ouagadougou
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

