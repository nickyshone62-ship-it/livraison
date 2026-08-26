'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Bike, ShieldCheck, FileText, CheckCircle2, XCircle, ExternalLink } from 'lucide-react';

export default function AdminLivreursPage() {
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    try {
      const res = await fetch('/api/admin/users');
      if (res.ok) {
        const data = await res.json();
        const filtered = (data.users || []).filter((u: any) => u.role === 'driver');
        setDrivers(filtered);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyDriver = async (userId: string, action: 'approve' | 'reject') => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur mise à jour livreur');

      await fetchDrivers();
    } catch (err: any) {
      alert(err.message || 'Erreur mise à jour livreur');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-12">
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center space-x-4">
          <Link href="/admin" className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-bold text-white">Validation Administrative des Livreurs ({drivers.length})</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {loading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : drivers.length === 0 ? (
          <div className="p-12 rounded-3xl bg-slate-900/40 border border-slate-800 text-center text-slate-400 text-sm">
            Aucun livreur enregistré.
          </div>
        ) : (
          <div className="space-y-4">
            {drivers.map((d) => {
              const driverProfile = d.driverProfile;
              const verificationStatus = driverProfile?.verificationStatus || 'pending';
              const vehicles = driverProfile?.vehicles || [];
              const docs = driverProfile?.documents || [];

              return (
                <div key={d.id} className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase border ${
                          verificationStatus === 'approved' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                          verificationStatus === 'rejected' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                          'bg-amber-500/10 border-amber-500/20 text-amber-400'
                        }`}>
                          Vérification: {verificationStatus}
                        </span>
                        <span className="text-xs text-slate-500">Note: {driverProfile?.averageRating || '5.0'} ★</span>
                      </div>

                      <h3 className="font-bold text-white text-lg mt-1">{d.fullName || 'Livreur'}</h3>
                      <p className="text-xs text-slate-400">Tél: {d.phone || 'N/A'} | Email: {d.email || 'N/A'} | Ville: {d.city || 'Ouagadougou'}</p>
                    </div>

                    <div className="flex items-center space-x-3">
                      {verificationStatus !== 'approved' && (
                        <button
                          onClick={() => handleVerifyDriver(d.id, 'approve')}
                          disabled={actionLoading}
                          className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs flex items-center space-x-2 shadow-lg"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Approuver ce livreur</span>
                        </button>
                      )}

                      {verificationStatus !== 'rejected' && (
                        <button
                          onClick={() => handleVerifyDriver(d.id, 'reject')}
                          disabled={actionLoading}
                          className="px-5 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 font-bold text-xs flex items-center space-x-2"
                        >
                          <XCircle className="w-4 h-4" />
                          <span>Rejeter</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Vehicle Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                      <div className="font-bold text-orange-400">Véhicule Déclaré :</div>
                      {vehicles.length > 0 ? (
                        <div>
                          <div>Type: <strong className="text-white uppercase">{vehicles[0].vehicleType}</strong></div>
                          <div>Marque/Modèle: <strong className="text-white">{vehicles[0].brand} {vehicles[0].model}</strong></div>
                          <div>Immatriculation: <code className="text-amber-300">{vehicles[0].registrationNumber || 'N/A'}</code></div>
                        </div>
                      ) : (
                        <div className="text-slate-500">Aucun véhicule enregistré.</div>
                      )}
                    </div>

                    {/* Documents */}
                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                      <div className="font-bold text-cyan-400">Documents Fournis :</div>
                      {docs.length > 0 ? (
                        <div className="space-y-1">
                          {docs.map((doc: any) => (
                            <div key={doc.id} className="flex items-center justify-between">
                              <span>{doc.documentType} ({doc.documentNumber || 'N/A'})</span>
                              {doc.fileUrl && (
                                <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="text-amber-400 hover:underline flex items-center space-x-1">
                                  <span>Voir le fichier</span>
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-slate-500">Aucun document téléversé.</div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
