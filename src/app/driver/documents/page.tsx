'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, FileText, ExternalLink, ShieldCheck } from 'lucide-react';

export default function DriverDocumentsPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => setUser(data.user))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const docs = user?.driverProfile?.documents || [];

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-12">
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center space-x-4">
          <Link href="/driver/profil" className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-bold text-white">Mes Documents KYC & Permis</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-4">
        {docs.length === 0 ? (
          <div className="p-12 rounded-3xl bg-slate-900/40 border border-slate-800 text-center text-slate-400 text-sm">
            Aucun document téléversé.
          </div>
        ) : (
          docs.map((doc: any) => (
            <div key={doc.id} className="p-6 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-between">
              <div className="space-y-1">
                <div className="font-bold text-white text-base">{doc.documentType}</div>
                <div className="text-xs text-slate-400">Numéro: {doc.documentNumber || 'N/A'}</div>
                <div className="text-[10px] text-emerald-400 font-bold uppercase">Statut: {doc.status}</div>
              </div>

              {doc.fileUrl && (
                <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold text-xs flex items-center space-x-2">
                  <span>Visualiser</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          ))
        )}
      </main>
    </div>
  );
}
