'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  Truck,
  LogOut,
  User,
  PlusCircle,
  Package,
  MessageSquare,
  Bell,
  CreditCard,
  HelpCircle,
  Home,
  FileText,
  ShieldAlert,
  ChevronDown,
  Menu,
  X,
  Activity,
  Compass
} from 'lucide-react';
import { AdminSecretModal } from './AdminSecretModal';
import { fetchAuthMe, clearAuthCache } from '@/lib/sessionCache';

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAdminSecretModal, setShowAdminSecretModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [driverAvailable, setDriverAvailable] = useState<boolean>(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [showNotifDropdown, setShowNotifDropdown] = useState<boolean>(false);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (e) {
      // Ignore fallback
    }
  };

  const fetchUser = async () => {
    try {
      const user = await fetchAuthMe();
      if (user) {
        setCurrentUser(user);
        if (user.driverProfile) {
          setDriverAvailable(user.driverProfile.isAvailable ?? true);
        }
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
  }, [pathname]);

  useEffect(() => {
    if (currentUser) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 10000);
      return () => clearInterval(interval);
    }
  }, [currentUser]);

  const markAllNotifsRead = async () => {
    try {
      await fetch('/api/notifications', { method: 'PATCH' });
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (e) {
      // Ignore
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    clearAuthCache();
    setCurrentUser(null);
    router.push('/');
    router.refresh();
  };

  const toggleDriverAvailability = async () => {
    if (updatingStatus) return;
    setUpdatingStatus(true);
    const newStatus = !driverAvailable;
    setDriverAvailable(newStatus);
    try {
      await fetch('/api/auth/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAvailable: newStatus })
      }).catch(() => {});
    } catch (e) {
      // Ignore fallback
    } finally {
      setUpdatingStatus(false);
    }
  };

  const role = (currentUser?.role || '').toLowerCase();
  const isAdmin = role === 'admin';
  const isDriver = role === 'driver' || role === 'livreur';
  const isClient = role === 'client' || role === 'particulier' || role === 'commercant' || role === 'entreprise';

  return (
    <>
      <nav className="sticky top-0 z-50 bg-slate-900 border-b border-slate-800 text-slate-100 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div 
                onClick={() => setShowAdminSecretModal(true)} 
                className="flex items-center gap-2.5 group cursor-pointer"
                title="👑 Cliquer sur le logo pour saisir le Code Secret Administrateur"
              >
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-bold shadow-md group-hover:scale-105 transition-transform">
                  <Truck className="w-5 h-5 text-white" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-lg tracking-tight text-white">
                    Livraison<span className="text-amber-500">Ouaga</span>
                  </span>
                  <span className="hidden sm:inline-block text-[10px] font-extrabold px-2 py-0.5 rounded bg-slate-800 text-amber-400 border border-amber-500/20">
                    BF 🇧🇫
                  </span>
                </div>
              </div>
            </div>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center gap-4">
              
              {/* UNAUTHENTICATED / PUBLIC NAV */}
              {!currentUser && (
                <div className="flex items-center gap-6 text-sm font-medium text-slate-300">
                  <Link href="/" className={`hover:text-amber-400 transition-colors ${pathname === '/' ? 'text-amber-400 font-semibold' : ''}`}>
                    Accueil
                  </Link>
                  <a href="/#comment-ca-marche" className="hover:text-amber-400 transition-colors">
                    Comment ça marche
                  </a>
                  <a href="/#entreprise" className="hover:text-amber-400 transition-colors">
                    Entreprise
                  </a>
                  <a href="/#aide" className="hover:text-amber-400 transition-colors">
                    Aide
                  </a>
                  <div className="flex items-center gap-2 ml-4">
                    <Link
                      href="/connexion"
                      className="px-4 py-2 text-xs font-semibold text-slate-200 hover:text-white hover:bg-slate-800 rounded-lg transition-colors border border-slate-700"
                    >
                      Connexion
                    </Link>
                    <Link
                      href="/inscription"
                      className="px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 rounded-lg shadow-sm transition-all"
                    >
                      Demander une livraison
                    </Link>
                    <Link
                      href="/inscription?role=LIVREUR"
                      className="px-3.5 py-2 text-xs font-bold text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-all border border-slate-700"
                    >
                      Devenir livreur
                    </Link>
                  </div>
                </div>
              )}

              {/* CLIENT SPACE NAVIGATION */}
              {currentUser && isClient && !isAdmin && (
                <div className="flex items-center gap-3 text-xs font-medium text-slate-300">
                  <Link href="/client" className={`px-3 py-1.5 rounded-lg transition-colors ${pathname === '/client' ? 'bg-slate-800 text-amber-400 font-semibold' : 'hover:bg-slate-800 hover:text-white'}`}>
                    Accueil
                  </Link>
                  <Link href="/client/livraison/nouvelle" className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg transition-all flex items-center gap-1">
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Nouvelle livraison</span>
                  </Link>
                  <Link href="/client/livraisons" className={`px-3 py-1.5 rounded-lg transition-colors ${pathname.includes('/livraisons') ? 'bg-slate-800 text-amber-400 font-semibold' : 'hover:bg-slate-800 hover:text-white'}`}>
                    Mes livraisons
                  </Link>
                  <Link href="/client/messages" className={`px-3 py-1.5 rounded-lg transition-colors ${pathname.includes('/messages') ? 'bg-slate-800 text-amber-400 font-semibold' : 'hover:bg-slate-800 hover:text-white'}`}>
                    Messages
                  </Link>
                  <Link href="/client/abonnement" className={`px-3 py-1.5 rounded-lg transition-colors ${pathname.includes('/abonnement') ? 'bg-slate-800 text-amber-400 font-semibold' : 'hover:bg-slate-800 hover:text-white'}`}>
                    Abonnement
                  </Link>
                  <Link href="/client/profil" className={`px-3 py-1.5 rounded-lg transition-colors ${pathname.includes('/profil') ? 'bg-slate-800 text-amber-400 font-semibold' : 'hover:bg-slate-800 hover:text-white'}`}>
                    Profil
                  </Link>
                </div>
              )}

              {/* DRIVER SPACE NAVIGATION */}
              {currentUser && isDriver && !isAdmin && (
                <div className="flex items-center gap-3 text-xs font-medium text-slate-300">
                  
                  {/* Availability Toggle Switch */}
                  <button
                    onClick={toggleDriverAvailability}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                      driverAvailable 
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                        : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                    }`}
                    title="Cliquer pour changer votre disponibilité en direct"
                  >
                    <span className={`w-2 h-2 rounded-full ${driverAvailable ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`}></span>
                    <span>{driverAvailable ? '🟢 Disponible' : '🔴 Occupé'}</span>
                  </button>

                  <Link href="/driver" className={`px-3 py-1.5 rounded-lg transition-colors ${pathname === '/driver' || pathname === '/livreur' ? 'bg-slate-800 text-amber-400 font-semibold' : 'hover:bg-slate-800 hover:text-white'}`}>
                    Tableau de bord
                  </Link>
                  <Link href="/driver/demandes" className={`px-3 py-1.5 rounded-lg transition-colors ${pathname.includes('/demandes') ? 'bg-slate-800 text-amber-400 font-semibold' : 'hover:bg-slate-800 hover:text-white'}`}>
                    Demandes
                  </Link>
                  <Link href="/driver/propositions" className={`px-3 py-1.5 rounded-lg transition-colors ${pathname.includes('/propositions') ? 'bg-slate-800 text-amber-400 font-semibold' : 'hover:bg-slate-800 hover:text-white'}`}>
                    Mes propositions
                  </Link>
                  <Link href="/driver/vehicule" className={`px-3 py-1.5 rounded-lg transition-colors ${pathname.includes('/vehicule') ? 'bg-slate-800 text-amber-400 font-semibold' : 'hover:bg-slate-800 hover:text-white'}`}>
                    Véhicule
                  </Link>
                  <Link href="/driver/abonnement" className={`px-3 py-1.5 rounded-lg transition-colors ${pathname.includes('/abonnement') ? 'bg-slate-800 text-amber-400 font-semibold' : 'hover:bg-slate-800 hover:text-white'}`}>
                    Abonnement
                  </Link>
                  <Link href="/driver/profil" className={`px-3 py-1.5 rounded-lg transition-colors ${pathname.includes('/profil') ? 'bg-slate-800 text-amber-400 font-semibold' : 'hover:bg-slate-800 hover:text-white'}`}>
                    Profil
                  </Link>
                </div>
              )}

              {/* ADMIN SPACE NAVIGATION */}
              {currentUser && isAdmin && (
                <div className="flex items-center gap-3 text-xs font-semibold">
                  <span className="bg-amber-500/10 text-amber-400 border border-amber-500/30 px-3 py-1 rounded-lg flex items-center gap-1.5">
                    👑 Administration Central
                  </span>
                  <Link
                    href="/admin"
                    className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg text-xs font-bold transition-all shadow-sm"
                  >
                    Tableau de bord Admin
                  </Link>
                </div>
              )}

              {/* LOGGED IN USER ACTIONS */}
              {currentUser && (
                <div className="flex items-center gap-3 border-l border-slate-800 pl-4 relative">
                  {/* Direct Link to Messagerie */}
                  <Link
                    href={isDriver ? '/driver/messages' : '/client/messages'}
                    className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors relative flex items-center justify-center cursor-pointer"
                    title="Accéder à vos messages et notifications"
                  >
                    <MessageSquare className="w-4.5 h-4.5 text-amber-400" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full bg-rose-500 text-white font-extrabold text-[10px] min-w-[18px] text-center animate-pulse shadow-md">
                        {unreadCount}
                      </span>
                    )}
                  </Link>

                  <div className="text-right hidden xl:block">
                    <div className="text-xs font-semibold text-slate-200">{currentUser.fullName || currentUser.phone}</div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-wide">{currentUser.role}</div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                    title="Déconnexion"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              )}

            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center gap-2">
              {currentUser && isDriver && (
                <button
                  onClick={toggleDriverAvailability}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold flex items-center gap-1.5 ${
                    driverAvailable ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${driverAvailable ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
                  <span>{driverAvailable ? 'Disponible' : 'Occupé'}</span>
                </button>
              )}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>

          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-slate-900 border-b border-slate-800 px-4 pt-3 pb-6 space-y-3">
            {!currentUser && (
              <div className="flex flex-col gap-2 pt-1 text-sm font-medium">
                <Link href="/" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 text-slate-300 hover:bg-slate-800 rounded-lg">Accueil</Link>
                <a href="/#comment-ca-marche" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 text-slate-300 hover:bg-slate-800 rounded-lg">Comment ça marche</a>
                <a href="/#entreprise" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 text-slate-300 hover:bg-slate-800 rounded-lg">Entreprise</a>
                <a href="/#aide" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 text-slate-300 hover:bg-slate-800 rounded-lg">Aide</a>
                <div className="flex flex-col gap-2 pt-3 border-t border-slate-800">
                  <Link href="/connexion" onClick={() => setMobileMenuOpen(false)} className="w-full py-2 text-center text-xs font-semibold text-slate-200 border border-slate-700 rounded-lg">Connexion</Link>
                  <Link href="/inscription" onClick={() => setMobileMenuOpen(false)} className="w-full py-2 text-center text-xs font-bold text-white bg-amber-500 rounded-lg">Demander une livraison</Link>
                  <Link href="/inscription?role=LIVREUR" onClick={() => setMobileMenuOpen(false)} className="w-full py-2 text-center text-xs font-bold text-slate-200 bg-slate-800 border border-slate-700 rounded-lg">Devenir livreur</Link>
                </div>
              </div>
            )}

            {currentUser && isClient && (
              <div className="flex flex-col gap-1 text-sm font-medium">
                <div className="px-3 py-2 text-xs font-bold text-amber-400 uppercase tracking-wide border-b border-slate-800">Espace Client</div>
                <Link href="/client" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 text-slate-300 hover:bg-slate-800 rounded-lg">Accueil</Link>
                <Link href="/client/livraison/nouvelle" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 text-amber-400 font-bold hover:bg-slate-800 rounded-lg flex items-center gap-2">
                  <PlusCircle className="w-4 h-4" />
                  <span>Nouvelle livraison</span>
                </Link>
                <Link href="/client/livraisons" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 text-slate-300 hover:bg-slate-800 rounded-lg">Mes livraisons</Link>
                <Link href="/client/messages" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 text-slate-300 hover:bg-slate-800 rounded-lg">Messages</Link>
                <Link href="/client/abonnement" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 text-slate-300 hover:bg-slate-800 rounded-lg">Abonnement</Link>
                <Link href="/client/profil" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 text-slate-300 hover:bg-slate-800 rounded-lg">Profil</Link>
                <button onClick={() => { setMobileMenuOpen(false); handleLogout(); }} className="w-full text-left px-3 py-2 text-rose-400 hover:bg-slate-800 rounded-lg flex items-center gap-2 mt-2 border-t border-slate-800">
                  <LogOut className="w-4 h-4" />
                  <span>Déconnexion</span>
                </button>
              </div>
            )}

            {currentUser && isDriver && (
              <div className="flex flex-col gap-1 text-sm font-medium">
                <div className="px-3 py-2 text-xs font-bold text-amber-400 uppercase tracking-wide border-b border-slate-800">Espace Livreur</div>
                <Link href="/driver" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 text-slate-300 hover:bg-slate-800 rounded-lg">Tableau de bord</Link>
                <Link href="/driver/demandes" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 text-slate-300 hover:bg-slate-800 rounded-lg">Demandes disponibles</Link>
                <Link href="/driver/propositions" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 text-slate-300 hover:bg-slate-800 rounded-lg">Mes propositions</Link>
                <Link href="/driver/vehicule" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 text-slate-300 hover:bg-slate-800 rounded-lg">Véhicule</Link>
                <Link href="/driver/abonnement" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 text-slate-300 hover:bg-slate-800 rounded-lg">Abonnement</Link>
                <Link href="/driver/profil" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 text-slate-300 hover:bg-slate-800 rounded-lg">Profil</Link>
                <button onClick={() => { setMobileMenuOpen(false); handleLogout(); }} className="w-full text-left px-3 py-2 text-rose-400 hover:bg-slate-800 rounded-lg flex items-center gap-2 mt-2 border-t border-slate-800">
                  <LogOut className="w-4 h-4" />
                  <span>Déconnexion</span>
                </button>
              </div>
            )}

            {currentUser && isAdmin && (
              <div className="flex flex-col gap-1 text-sm font-medium">
                <div className="px-3 py-2 text-xs font-bold text-amber-400 uppercase tracking-wide border-b border-slate-800">Administration</div>
                <Link href="/admin" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 text-amber-400 font-bold hover:bg-slate-800 rounded-lg">Tableau de bord Admin</Link>
                <button onClick={() => { setMobileMenuOpen(false); handleLogout(); }} className="w-full text-left px-3 py-2 text-rose-400 hover:bg-slate-800 rounded-lg flex items-center gap-2 mt-2 border-t border-slate-800">
                  <LogOut className="w-4 h-4" />
                  <span>Déconnexion</span>
                </button>
              </div>
            )}
          </div>
        )}
      </nav>

      {/* Admin secret trigger modal */}
      <AdminSecretModal
        isOpen={showAdminSecretModal}
        onClose={() => setShowAdminSecretModal(false)}
      />
    </>
  );
}

