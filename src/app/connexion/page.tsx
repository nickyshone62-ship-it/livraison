'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Truck, ArrowRight, Lock, UserCheck, Eye, EyeOff } from 'lucide-react';
import { AdminSecretModal } from '@/components/AdminSecretModal';

function ConnexionForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '';

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, phone: identifier, email: identifier, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.accountStatus === 'pending') {
          router.push('/attente-validation');
          return;
        }
        throw new Error(data.error || 'Erreur lors de la connexion');
      }

      if (redirect) {
        router.push(redirect);
      } else if (data.redirectUrl) {
        router.push(data.redirectUrl);
      } else {
        router.push('/client');
      }
    } catch (err: any) {
      setError(err.message || 'Identifiants incorrects');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 py-8 px-6 shadow-2xl rounded-3xl sm:px-10">
      {error && (
        <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium">
          {error}
        </div>
      )}

      <form className="space-y-6" onSubmit={handleSubmit}>
        <div>
          <label className="block text-sm font-semibold text-slate-300 mb-2">
            Email ou Numéro de Téléphone
          </label>
          <div className="relative rounded-2xl shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500">
              <UserCheck className="w-5 h-5" />
            </div>
            <input
              type="text"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="ex: nickyshone62@gmail.com ou 06887330"
              className="block w-full pl-12 pr-4 py-3.5 bg-slate-950 border border-slate-800 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-semibold text-slate-300">
              Mot de passe
            </label>
            <Link href="/mot-de-passe-oublie" className="text-xs font-medium text-amber-400 hover:text-amber-300">
              Mot de passe oublié ?
            </Link>
          </div>
          <div className="relative rounded-2xl shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500">
              <Lock className="w-5 h-5" />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="block w-full pl-12 pr-12 py-3.5 bg-slate-950 border border-slate-800 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-white transition-colors cursor-pointer"
              title={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
        >
          {loading ? (
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <span>Se connecter</span>
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </form>

      <div className="mt-8 pt-6 border-t border-slate-800 text-center">
        <p className="text-sm text-slate-400">
          Vous n'avez pas encore de compte ?{' '}
          <Link href="/inscription" className="font-bold text-amber-400 hover:text-amber-300">
            S'inscrire gratuitement
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function ConnexionPage() {
  const [showAdminModal, setShowAdminModal] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-orange-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10">
        <div
          onClick={() => setShowAdminModal(true)}
          className="inline-flex items-center space-x-3 mb-6 group cursor-pointer"
          title="👑 Cliquer pour saisir le Code Secret Administrateur"
        >
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
            <Truck className="w-7 h-7 text-white" />
          </div>
          <span className="text-2xl font-black tracking-tight bg-gradient-to-r from-amber-400 via-orange-300 to-white bg-clip-text text-transparent">
            LIVRAISON OUAGA
          </span>
        </div>

        <h2 className="text-3xl font-extrabold tracking-tight">Connexion à votre espace</h2>
        <p className="mt-2 text-sm text-slate-400">
          Mise en relation directe Clients & Livreurs au Burkina Faso
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10 px-4">
        <Suspense fallback={<div className="text-center py-8 text-slate-400 text-sm">Chargement...</div>}>
          <ConnexionForm />
        </Suspense>
      </div>

      <AdminSecretModal
        isOpen={showAdminModal}
        onClose={() => setShowAdminModal(false)}
      />
    </div>
  );
}
