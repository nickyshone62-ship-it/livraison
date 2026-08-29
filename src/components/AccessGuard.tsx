'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { AlertTriangle, CreditCard, ShieldAlert, Lock, ArrowRight, RefreshCw } from 'lucide-react';

import { fetchAuthMe } from '@/lib/sessionCache';

interface AccessGuardProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export function AccessGuard({ children, allowedRoles }: AccessGuardProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    checkUserAccess();
  }, [pathname]);

  const checkUserAccess = async () => {
    try {
      const currentUser = await fetchAuthMe();
      if (!currentUser) {
        router.push('/connexion');
        return;
      }

      setUser(currentUser);
      const role = (currentUser.role || '').toLowerCase();

      // Admin has full access
      if (role === 'admin') {
        setLoading(false);
        return;
      }

      // Check allowed role if specified
      if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(role)) {
        if (role === 'client') router.push('/client');
        else if (role === 'driver') router.push('/driver');
        else router.push('/');
        return;
      }

      // Condition 1: Registration payment / account approval
      const accountStatus = (currentUser.accountStatus || 'pending').toLowerCase();
      const isPaymentApproved = currentUser.isPaymentApproved ?? (accountStatus === 'active' || accountStatus === 'approved');

      if (!isPaymentApproved) {
        if (accountStatus === 'rejected') {
          if (pathname !== '/compte-rejete') router.push('/compte-rejete');
        } else {
          if (pathname !== '/attente-validation') router.push('/attente-validation');
        }
        setLoading(false);
        return;
      }

      setLoading(false);
    } catch (err) {
      console.error('Error checking user access:', err);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
        <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 rounded-2xl px-6 py-4 shadow-xl">
          <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-semibold text-slate-300">Vérification de vos accès en cours...</span>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const role = (user.role || '').toLowerCase();
  const isAdmin = role === 'admin';
  const isSubscriptionActive = user.isSubscriptionActive ?? true;
  const isSubscriptionPage = pathname.endsWith('/abonnement');

  // Condition 2: Subscription Check for non-admin users
  if (!isAdmin && !isSubscriptionActive && !isSubscriptionPage) {
    const renewUrl = role === 'driver' ? '/driver/abonnement' : '/client/abonnement';

    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4 relative overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-500/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-10 left-1/3 w-80 h-80 bg-orange-500/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="bg-slate-900/90 backdrop-blur-xl border border-amber-500/30 rounded-3xl p-8 max-w-lg w-full text-center shadow-2xl relative z-10 space-y-6 animate-in fade-in zoom-in duration-300">
          
          <div className="w-20 h-20 mx-auto rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
            <Lock className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-full text-xs font-black uppercase tracking-widest">
              Accès Restreint • Abonnement Expiré
            </span>
            <h1 className="text-2xl font-black tracking-tight text-white">
              Abonnement Inactif
            </h1>
            <p className="text-sm text-slate-400 font-medium leading-relaxed">
              Désolé <strong className="text-white">{user.fullName || user.phone}</strong>, votre abonnement mensuel (1 000 FCFA/mois) n'est plus actif.
            </p>
            <p className="text-xs text-amber-200/80 bg-amber-950/40 border border-amber-500/20 rounded-xl p-3 mt-2 text-left">
              💡 Conformément à la politique de la plateforme, tous les utilisateurs doivent disposer d'un abonnement mensuel actif approuvé par l'administration pour effectuer des courses ou proposer des services.
            </p>
          </div>

          <div className="pt-2 space-y-3">
            <Link
              href={renewUrl}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-extrabold text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-orange-600/30 transition-all duration-200 hover:scale-[1.02]"
            >
              <CreditCard className="w-5 h-5" />
              <span>Renouveler Mon Abonnement</span>
              <ArrowRight className="w-5 h-5" />
            </Link>

            <button
              onClick={() => checkUserAccess()}
              className="w-full py-3 px-6 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Vérifier mon paiement</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
