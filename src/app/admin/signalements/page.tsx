'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';

export default function AdminSignalementsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const res = await fetch('/api/reports');
      if (res.ok) {
        const data = await res.json();
        setReports(data.reports || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-12">
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center space-x-4">
          <Link href="/admin" className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-bold text-white">Gestion des Signalements & Litiges ({reports.length})</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {loading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : reports.length === 0 ? (
          <div className="p-12 rounded-3xl bg-slate-900/40 border border-slate-800 text-center text-slate-400 text-sm">
            Aucun signalement enregistré.
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((r) => (
              <div key={r.id} className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold uppercase">
                    Statut: {r.status}
                  </span>
                  <span className="text-xs text-slate-500">{new Date(r.createdAt).toLocaleString('fr-FR')}</span>
                </div>

                <div>
                  <h3 className="font-bold text-white text-base">Raison: {r.reason}</h3>
                  <p className="text-xs text-slate-400">Signalé par: {r.reporter?.fullName || 'Utilisateur'} ({r.reporter?.role})</p>
                  {r.reportedUser && <p className="text-xs text-slate-400">Utilisateur incriminé: {r.reportedUser?.fullName} ({r.reportedUser?.role})</p>}
                </div>

                {r.description && (
                  <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-300 italic">
                    "{r.description}"
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
