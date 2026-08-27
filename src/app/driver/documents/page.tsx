'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, FileText, ExternalLink, ShieldCheck, Image as ImageIcon } from 'lucide-react';

const formatDocTitle = (type: string) => {
  switch (type) {
    case 'identity_card_recto':
      return "Pièce d'identité (Face RECTO)";
    case 'identity_card_verso':
      return "Pièce d'identité (Face VERSO)";
    case 'vehicle_photo':
      return "Photo de l'Engin / Véhicule";
    case 'photo':
      return 'Photo de Profil';
    case 'identity_card':
      return "Pièce d'identité (CNIB/Passeport)";
    case 'driver_license':
      return 'Permis de Conduire';
    case 'vehicle_document':
      return 'Document Véhicule / Carte Grise';
    default:
      return type;
  }
};

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
          <h1 className="text-xl font-bold text-white">Mes Photos & Documents KYC</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-4">
        {docs.length === 0 ? (
          <div className="p-12 rounded-3xl bg-slate-900/40 border border-slate-800 text-center text-slate-400 text-sm">
            Aucun document téléversé.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {docs.map((doc: any) => (
              <div key={doc.id} className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-white text-base">{formatDocTitle(doc.documentType)}</div>
                  <span className="text-[10px] px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold uppercase">
                    {doc.status}
                  </span>
                </div>

                {doc.fileUrl && (
                  <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950">
                    <img src={doc.fileUrl} alt={doc.documentType} className="w-full h-44 object-cover" />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
