'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Truck, ShieldCheck, User, LogOut, Package, Store, Building2, LayoutDashboard, CheckCircle2 } from 'lucide-react';

export function Navbar() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Secret Admin Code Modal state for Navbar Logo Click
  const [showAdminSecretModal, setShowAdminSecretModal] = useState(false);
  const [adminCodeInput, setAdminCodeInput] = useState('');
  const [adminSecretError, setAdminSecretError] = useState('');
  const [adminSecretLoading, setAdminSecretLoading] = useState(false);

  const handleAdminSecretSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminSecretError('');
    setAdminSecretLoading(false);
    try {
      const res = await fetch('/api/auth/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: adminCodeInput.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setShowAdminSecretModal(false);
        router.push('/admin');
        router.refresh();
      } else {
        setAdminSecretError(data.error || 'Code secret administrateur invalide.');
      }
    } catch (err) {
      setAdminSecretError('Erreur de connexion réseau');
    } finally {
      setAdminSecretLoading(false);
    }
  };

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
          
          {/* Logo with Secret Admin Trigger */}
          <div 
            onClick={() => setShowAdminSecretModal(true)} 
            className="flex items-center gap-2 group cursor-pointer"
            title="👑 Cliquer pour la Connexion Administrateur Secret"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00E5D9] via-[#00B4D8] to-[#009688] flex items-center justify-center text-white font-bold shadow-md group-hover:scale-105 transition-transform">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <span className="font-black text-xl tracking-tight text-[#004D40]">Livraison<span className="text-[#009688]">Ouaga</span></span>
              <span className="hidden sm:inline-block ml-2 text-xs font-black px-2 py-0.5 rounded-full bg-[#E0F2F1] text-[#004D40] border border-teal-300">
                Burkina Faso 🇧🇫
              </span>
            </div>
          </div>

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
                      Client/Boutique
                    </Link>
                    <Link
                      href="/livreur"
                      className="px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1 bg-white hover:bg-teal-50 text-[#004D40] border border-teal-100 shadow-xs"
                    >
                      Livreur
                    </Link>
                    <Link
                      href="/admin"
                      className="px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1 bg-[#004D40] text-white border border-teal-400 shadow-xs"
                    >
                      Admin Central
                    </Link>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
                      👤 {currentUser.profile?.fullName || currentUser.phone} ({currentUser.role})
                    </span>
                    <Link
                      href={currentUser.role === 'LIVREUR' ? '/livreur' : '/client'}
                      className="px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-black hover:bg-emerald-700 transition-colors shadow-xs"
                    >
                      Mon Espace
                    </Link>
                  </div>
                )}

                <button
                  onClick={handleLogout}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
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

      {/* SECRET ADMIN CODE MODAL IN NAVBAR */}
      {showAdminSecretModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl border-4 border-amber-400 space-y-6 text-center animate-fadeIn relative">
            <button
              onClick={() => setShowAdminSecretModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 font-black text-xl cursor-pointer"
            >
              ✕
            </button>

            <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-amber-400 via-orange-500 to-amber-600 flex items-center justify-center text-slate-950 shadow-xl border-4 border-white">
              <ShieldCheck className="w-10 h-10 text-slate-950" />
            </div>

            <div className="space-y-2">
              <span className="px-3 py-1 bg-amber-100 text-amber-900 rounded-full text-[10px] font-black uppercase tracking-widest border border-amber-300">
                👑 Accès Secret Super-Administrateur
              </span>
              <h3 className="text-xl font-black text-slate-900">
                Connexion Administrateur
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Saisissez votre code secret confidentiel pour accéder directement au panneau d'administration.
              </p>
            </div>

            {adminSecretError && (
              <div className="p-3 bg-red-50 text-red-700 text-xs font-bold rounded-xl border border-red-200">
                {adminSecretError}
              </div>
            )}

            <form onSubmit={handleAdminSecretSubmit} className="space-y-4">
              <div>
                <input
                  type="password"
                  required
                  autoFocus
                  value={adminCodeInput}
                  onChange={(e) => setAdminCodeInput(e.target.value)}
                  placeholder="Code Secret..."
                  className="w-full px-4 py-3 text-center text-lg font-bold font-mono border-2 border-slate-300 rounded-2xl outline-none focus:border-amber-500 transition-all bg-slate-50 text-slate-900"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAdminSecretModal(false)}
                  className="w-1/3 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={adminSecretLoading}
                  className="w-2/3 py-3.5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black rounded-xl text-xs sm:text-sm shadow-xl cursor-pointer uppercase tracking-wider border border-amber-300"
                >
                  {adminSecretLoading ? 'Connexion...' : '🚀 Valider & Accéder'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </nav>
  );
}
