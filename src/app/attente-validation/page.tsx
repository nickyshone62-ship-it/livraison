'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Clock, ShieldCheck, CheckCircle2, ArrowRight, RefreshCw, AlertTriangle, Sparkles, User, Bike } from 'lucide-react';

export default function AttenteValidationPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'pending' | 'active' | 'rejected' | 'suspended' | 'loading'>('loading');
  const [user, setUser] = useState<any>(null);
  const [checking, setChecking] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  const checkAccountStatus = async () => {
    setChecking(true);
    try {
      const res = await fetch(`/api/auth/me?t=${Date.now()}`, {
        headers: { 'Cache-Control': 'no-cache' },
      });

      if (res.ok) {
        const data = await res.json();
        const me = data.user;
        if (me) {
          setUser(me);
          const currentStatus = (me.accountStatus || 'pending').toLowerCase();

          if (currentStatus === 'active' || currentStatus === 'approved') {
            setStatus('active');
            if (!redirecting) {
              setRedirecting(true);
              const targetRoute = (me.role || '').toLowerCase() === 'driver' ? '/driver' : (me.role || '').toLowerCase() === 'admin' ? '/admin' : '/client';
              setTimeout(() => {
                router.push(targetRoute);
              }, 1800);
            }
          } else if (currentStatus === 'rejected') {
            setStatus('rejected');
          } else if (currentStatus === 'suspended') {
            setStatus('suspended');
          } else {
            setStatus('pending');
          }
        }
      }
    } catch (err) {
      console.error('Erreur vérification statut compte:', err);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    checkAccountStatus();
    const interval = setInterval(checkAccountStatus, 2500);
    return () => clearInterval(interval);
  }, []);

  const targetSpaceLabel = (user?.role || '').toLowerCase() === 'driver' ? 'Espace Livreur' : 'Espace Client';
  const targetSpaceRoute = (user?.role || '').toLowerCase() === 'driver' ? '/driver' : (user?.role || '').toLowerCase() === 'admin' ? '/admin' : '/client';

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-center items-center px-4 relative overflow-hidden">
      {/* GLOWING BACKGROUND ORBS */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-orange-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full bg-slate-900/80 backdrop-blur-xl border border-slate-800 p-8 rounded-3xl text-center shadow-2xl z-10 space-y-6">
        
        {/* COMPTE APPROUVÉ : REDIRECTION AUTOMATIQUE */}
        {status === 'active' || redirecting ? (
          <div className="space-y-6 animate-fadeIn">
            <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 p-1 shadow-2xl shadow-emerald-500/30 animate-bounce">
              <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center">
                <CheckCircle2 className="w-14 h-14 text-emerald-400" />
              </div>
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-black">
                <Sparkles className="w-3.5 h-3.5" />
                <span>COMPTE APPROUVÉ AVEC SUCCÈS</span>
              </div>
              <h1 className="text-2xl font-black text-white">Félicitations {user?.fullName ? `${user.fullName}` : ''} !</h1>
              <p className="text-slate-300 text-sm">
                Votre compte a été validé par l'administration. Redirection automatique vers votre <strong className="text-emerald-400">{targetSpaceLabel}</strong>...
              </p>
            </div>

            {/* PROGRESS BAR REDIRECTION */}
            <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
              <div className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full animate-pulse w-full" />
            </div>

            <Link
              href={targetSpaceRoute}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black transition-all flex items-center justify-center space-x-2 text-sm shadow-lg shadow-emerald-500/20"
            >
              <span>Accéder directement à {targetSpaceLabel}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : status === 'rejected' ? (
          /* COMPTE REJETÉ AVEC MOTIF CLAIR */
          <div className="space-y-6 animate-fadeIn">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
              <AlertTriangle className="w-10 h-10 text-red-400" />
            </div>

            <div className="space-y-1">
              <h1 className="text-2xl font-black text-white">Inscription Non Validée</h1>
              <p className="text-xs text-red-400 font-bold uppercase tracking-wider">Demande refusée par l'administration</p>
            </div>

            {/* BLOC MOTIF DU REFUS EXPLICITE */}
            <div className="p-4 rounded-2xl bg-red-950/40 border border-red-500/30 text-left space-y-2">
              <div className="text-xs font-black text-red-400 uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Motif du refus de votre compte :</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-red-900/50 text-white font-bold text-sm">
                "{user?.rejectionReason || 'Document non conforme ou informations incomplètes.'}"
              </div>
              <p className="text-[11px] text-slate-400">
                Vous pouvez soumettre un nouveau dossier ou corriger vos pièces justificatives.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <Link
                href="/inscription"
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 text-slate-950 font-black transition-all flex items-center justify-center space-x-2 text-sm shadow-lg shadow-amber-500/20 block text-center"
              >
                <span>S'inscrire à nouveau / Corriger mon dossier</span>
              </Link>

              <a
                href="https://wa.me/22606887330?text=Bonjour,%20mon%20compte%20a%20%C3%A9t%C3%A9%20refus%C3%A9."
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full py-3 px-6 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold transition-all text-xs border border-slate-700 text-center"
              >
                💬 Contacter le support d'administration
              </a>
            </div>
          </div>
        ) : status === 'suspended' ? (
          /* COMPTE SUSPENDU */
          <div className="space-y-6">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
              <AlertTriangle className="w-10 h-10" />
            </div>

            <h1 className="text-2xl font-black text-white">Compte Suspendu</h1>
            <p className="text-slate-400 text-sm leading-relaxed">
              Ce compte utilisateur a été temporairement suspendu par l'administration.
            </p>

            <Link
              href="/connexion"
              className="block w-full py-3.5 px-6 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition-all text-sm border border-slate-700"
            >
              Retour à l'accueil
            </Link>
          </div>
        ) : (
          /* EN ATTENTE DE VALIDATION (POLLING EN DIRECT) */
          <div className="space-y-6">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 relative">
              <Clock className="w-10 h-10 animate-pulse" />
              {checking && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-slate-900 animate-ping" />
              )}
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-black text-white">Compte en attente de validation</h1>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950 border border-slate-800 text-emerald-400 text-[11px] font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>Vérification automatique en direct...</span>
              </div>
            </div>

            <p className="text-slate-400 text-sm leading-relaxed">
              Merci {user?.fullName ? <strong className="text-amber-400">{user.fullName}</strong> : ''} ! Vos documents et votre paiement sont en cours d'examen par l'administrateur. Dès que votre compte sera approuvé, vous serez **automatiquement redirigé**.
            </p>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-2 text-left">
              <div className="flex items-center space-x-2 text-amber-400 font-bold">
                <ShieldCheck className="w-4 h-4" />
                <span>Étapes de vérification en cours :</span>
              </div>
              <ul className="list-disc pl-4 space-y-1 text-slate-400">
                <li>Vérification du paiement Mobile Money</li>
                <li>Contrôle de conformité de la pièce d'identité CNI</li>
                <li>Validation de votre compte par l'administration</li>
              </ul>
            </div>

            <div className="pt-2 space-y-3">
              <button
                type="button"
                onClick={checkAccountStatus}
                disabled={checking}
                className="w-full py-3.5 px-6 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition-all flex items-center justify-center space-x-2 text-sm border border-slate-700 cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 text-amber-400 ${checking ? 'animate-spin' : ''}`} />
                <span>Vérifier le statut maintenant</span>
              </button>

              <Link
                href="/connexion"
                className="block w-full py-3 px-6 rounded-2xl text-slate-400 hover:text-white transition-all text-xs font-semibold"
              >
                Retour à la page de connexion
              </Link>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

