'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Mail, CheckCircle2, AlertCircle, ArrowRight, Truck } from 'lucide-react';
import Link from 'next/link';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  const email = searchParams.get('email');

  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setError('Lien de vérification d\'email manquant ou invalide.');
      return;
    }

    const verify = async () => {
      try {
        const res = await fetch(`/api/auth/verify-email?token=${token}&email=${encodeURIComponent(email || '')}`);
        const data = await res.json();
        if (res.ok) {
          setSuccess(true);
          setUserData(data.user);
        } else {
          setError(data.error || 'Erreur lors de la validation de votre adresse e-mail.');
        }
      } catch (err: any) {
        setError('Erreur de connexion réseau lors de la validation.');
      } finally {
        setLoading(false);
      }
    };

    verify();
  }, [token, email]);

  return (
    <div className="max-w-md w-full bg-white rounded-[2.5rem] p-8 sm:p-10 shadow-2xl space-y-6 text-center border-4 border-white/80 relative overflow-hidden">
      
      {/* Brand Header */}
      <div className="flex items-center justify-center gap-2">
        <div className="w-12 h-12 rounded-2xl bg-[#009688] text-white flex items-center justify-center shadow-lg">
          <Truck className="w-7 h-7" />
        </div>
        <span className="font-black text-2xl tracking-tight text-[#004D40]">
          Livraison<span className="text-[#009688]">Ouaga</span>
        </span>
      </div>

      {loading && (
        <div className="space-y-4 py-8">
          <div className="w-16 h-16 border-4 border-[#009688] border-t-transparent rounded-full animate-spin mx-auto" />
          <h2 className="text-xl font-black text-[#004D40]">Validation de votre e-mail en cours...</h2>
          <p className="text-xs text-slate-500 font-medium">Veuillez patienter un court instant.</p>
        </div>
      )}

      {!loading && success && (
        <div className="space-y-6 animate-fadeIn">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-4xl shadow-xl border-4 border-emerald-300">
            <CheckCircle2 className="w-12 h-12 text-emerald-600" />
          </div>

          <div className="space-y-2">
            <span className="px-4 py-1.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 font-black text-xs uppercase tracking-wider">
              ✓ EMAIL CONFIRMÉ AVEC SUCCÈS !
            </span>
            <h2 className="text-2xl font-black text-slate-900 mt-2">
              Compte Validé !
            </h2>
            <p className="text-xs sm:text-sm font-bold text-slate-600 leading-relaxed">
              Votre adresse e-mail <strong className="text-[#00796B]">{email || userData?.email}</strong> a été confirmée avec succès.
            </p>
          </div>

          <Link
            href="/auth/login"
            className="w-full py-4 px-6 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 text-white font-black text-sm uppercase rounded-full shadow-2xl transition-all cursor-pointer border-2 border-white flex items-center justify-center gap-2"
          >
            <span>🚀 SE CONNECTER À MON COMPTE</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {!loading && error && (
        <div className="space-y-6 animate-fadeIn">
          <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto text-4xl shadow-xl border-4 border-red-300">
            <AlertCircle className="w-12 h-12 text-red-600" />
          </div>

          <div className="space-y-2">
            <span className="px-4 py-1.5 rounded-full bg-red-100 text-red-900 border border-red-300 font-black text-xs uppercase tracking-wider">
              ÉCHEC DE LA VALIDATION
            </span>
            <h2 className="text-xl font-black text-slate-900 mt-2">
              Lien Invalide ou Expiré
            </h2>
            <p className="text-xs font-bold text-slate-600 bg-red-50 p-4 rounded-2xl border border-red-200">
              {error}
            </p>
          </div>

          <Link
            href="/auth/login"
            className="w-full py-4 px-6 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase rounded-full shadow-lg transition-all cursor-pointer inline-block"
          >
            ← Retour à la Page de Connexion
          </Link>
        </div>
      )}

    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#00E5D9] via-[#00D2C4] to-[#009688] text-[#004D40] flex flex-col items-center justify-center p-4 font-sans selection:bg-[#009688] selection:text-white">
      <Suspense fallback={
        <div className="max-w-md w-full bg-white rounded-[2.5rem] p-10 shadow-2xl text-center space-y-4">
          <div className="w-12 h-12 border-4 border-[#009688] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-black text-[#004D40]">Chargement de la page de vérification...</p>
        </div>
      }>
        <VerifyEmailContent />
      </Suspense>
    </div>
  );
}
