'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Truck, ShieldCheck, User, LogOut, Package, Store, Building2, LayoutDashboard, CheckCircle2 } from 'lucide-react';

export function Navbar() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
      } else {
        setCurrentUser(null);
      }
    } catch (e) {
      setCurrentUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setCurrentUser(null);
    router.push('/');
    router.refresh();
  };

  const handleQuickLogin = async (phone: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password: 'password123' }),
      });
      const data = await res.json();
      if (res.ok) {
        await fetchUser();
        if (data.user.role === 'ADMIN') router.push('/admin');
        else if (data.user.role === 'LIVREUR') router.push('/livreur');
        else router.push('/client');
      } else {
        alert(data.error || 'Erreur de connexion rapide');
      }
    } catch (e) {
      alert('Erreur réseau');
    } finally {
      setLoading(false);
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b-2 border-teal-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00E5D9] via-[#00B4D8] to-[#009688] flex items-center justify-center text-white font-bold shadow-md group-hover:scale-105 transition-transform">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <span className="font-black text-xl tracking-tight text-[#004D40]">Livraison<span className="text-[#009688]">Ouaga</span></span>
              <span className="hidden sm:inline-block ml-2 text-xs font-black px-2 py-0.5 rounded-full bg-[#E0F2F1] text-[#004D40] border border-teal-300">
                Burkina Faso 🇧🇫
              </span>
            </div>
          </Link>



          {/* Navigation Links */}
          <div className="flex items-center gap-3">
            {currentUser ? (
              <div className="flex items-center gap-3">
                {currentUser.role === 'ADMIN' ? (
                  <div className="flex items-center gap-1.5 bg-[#E0F7F6] p-1 rounded-xl border border-teal-200 shadow-sm">
                    <span className="text-[10px] uppercase font-black px-2 text-[#004D40] hidden lg:inline-block">👑 Vue Admin :</span>
                    <Link
                      href="/client"
                      className="px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1 bg-white hover:bg-teal-50 text-[#004D40] border border-teal-100 shadow-xs"
                    >
                      🛍️ Espace Boutique
                    </Link>
                    <Link
                      href="/livreur"
                      className="px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1 bg-white hover:bg-teal-50 text-[#004D40] border border-teal-100 shadow-xs"
                    >
                      🛵 Espace Livreur
                    </Link>
                    <Link
                      href="/admin"
                      className="px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1 bg-[#009688] text-white shadow-sm hover:bg-[#00796B]"
                    >
                      🛡️ Admin Central
                    </Link>
                  </div>
                ) : (
                  <Link
                    href={currentUser.role === 'LIVREUR' ? '/livreur' : '/client'}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold text-sm hover:bg-emerald-100 transition-colors"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    Espace {currentUser.role === 'LIVREUR' ? 'Livreur' : 'Boutique'}
                  </Link>
                )}

                <div className="hidden md:flex items-center gap-2 text-sm text-slate-700 font-medium bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                  <User className="w-4 h-4 text-slate-500" />
                  <span>{currentUser.profile?.fullName || currentUser.phone}</span>
                </div>

                <button
                  onClick={handleLogout}
                  className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Déconnexion"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/auth/login"
                  className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Connexion
                </Link>
                <Link
                  href="/auth/register"
                  className="px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm shadow-emerald-600/20 transition-all hover:scale-[1.02]"
                >
                  Créer un compte
                </Link>
              </div>
            )}
          </div>

        </div>
      </div>
    </nav>
  );
}
