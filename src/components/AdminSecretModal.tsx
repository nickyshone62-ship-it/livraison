'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Truck, KeyRound, Eye, EyeOff } from 'lucide-react';

interface AdminSecretModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AdminSecretModal({ isOpen, onClose }: AdminSecretModalProps) {
  const router = useRouter();
  const [adminCodeInput, setAdminCodeInput] = useState('');
  const [showCode, setShowCode] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: adminCodeInput.trim() }),
      });

      const data = await res.json();

      if (res.ok) {
        onClose();
        router.push('/admin');
        router.refresh();
      } else {
        setError(data.error || 'Code secret administrateur invalide');
      }
    } catch (err) {
      setError('Erreur de connexion réseau');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border-2 border-amber-500/50 rounded-3xl max-w-md w-full p-8 shadow-2xl space-y-6 text-center animate-fadeIn relative text-white">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white font-bold text-xl cursor-pointer w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center transition-colors"
        >
          ✕
        </button>

        <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 flex items-center justify-center text-slate-950 shadow-xl shadow-amber-500/20 border-4 border-amber-400">
          <ShieldCheck className="w-10 h-10 text-slate-950" />
        </div>

        <div className="space-y-2">
          <span className="px-3.5 py-1 bg-amber-500/20 text-amber-300 rounded-full text-[11px] font-extrabold uppercase tracking-wider border border-amber-500/40">
            👑 Accès Administrateur Central
          </span>
          <h3 className="text-2xl font-extrabold tracking-tight text-white pt-1">
            Espace Secret Administrateur
          </h3>
          <p className="text-xs text-slate-400 font-medium">
            Entrez votre code secret administrateur pour déverrouiller et accéder directement au panneau d'administration.
          </p>
        </div>

        {error && (
          <div className="p-3.5 bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold rounded-2xl">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-amber-500">
              <KeyRound className="w-5 h-5" />
            </div>
            <input
              type={showCode ? 'text' : 'password'}
              required
              autoFocus
              value={adminCodeInput}
              onChange={(e) => setAdminCodeInput(e.target.value)}
              placeholder="Code secret..."
              className="w-full pl-12 pr-12 py-3.5 text-center text-lg font-bold font-mono bg-slate-950 border border-slate-700 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
            />
            <button
              type="button"
              onClick={() => setShowCode(!showCode)}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-white transition-colors cursor-pointer"
              title={showCode ? 'Masquer le code secret' : 'Afficher le code secret'}
            >
              {showCode ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="w-1/3 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-2xl text-xs cursor-pointer transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-2/3 py-3.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold rounded-2xl text-xs sm:text-sm shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <span>Déverrouiller l'accès 🔓</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
