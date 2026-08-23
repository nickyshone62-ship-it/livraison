'use client';

import React, { useEffect, useState } from 'react';
import { Download, Smartphone, X } from 'lucide-react';

export function PWAInstaller() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Register Service Worker
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => console.log('PWA Service Worker enregistré :', reg.scope))
        .catch((err) => console.error('PWA SW erreur :', err));
    }

    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('Utilisateur a accepté l\'installation PWA');
    }
    setDeferredPrompt(null);
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50 bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-emerald-500/50 flex items-center justify-between gap-3 animate-pulse-slow">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl gradient-burkina flex items-center justify-center font-bold text-white shrink-0">
          <Smartphone className="w-5 h-5" />
        </div>
        <div>
          <h4 className="font-bold text-xs text-white">Installer l'Application</h4>
          <p className="text-[11px] text-slate-300">Ajoutez LivraisonOuaga sur votre téléphone en 1 clic.</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={handleInstallClick}
          className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold rounded-xl text-xs flex items-center gap-1 shrink-0"
        >
          <Download className="w-3.5 h-3.5" /> Installer
        </button>
        <button
          onClick={() => setShowBanner(false)}
          className="text-slate-400 hover:text-white p-1"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
