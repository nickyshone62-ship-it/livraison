'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, User, Eye, Download, ZoomIn, X, Image as ImageIcon } from 'lucide-react';

export default function AdminClientsPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<{ url: string; title: string; clientName: string } | null>(null);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const res = await fetch('/api/admin/users');
      if (res.ok) {
        const data = await res.json();
        const filtered = (data.users || []).filter((u: any) => u.role === 'client');
        setClients(filtered);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (fileUrl: string, title: string, clientName: string) => {
    if (!fileUrl) return;
    const cleanName = (clientName || 'client').toLowerCase().replace(/[^a-z0-9]/g, '_');
    const cleanTitle = (title || 'cni').toLowerCase().replace(/[^a-z0-9]/g, '_');
    const filename = `${cleanName}_${cleanTitle}.jpg`;

    const a = document.createElement('a');
    a.href = fileUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-12">
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center space-x-4">
          <Link href="/admin" className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-bold text-white">Gestion des Clients ({clients.length})</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {loading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : clients.length === 0 ? (
          <div className="p-12 rounded-3xl bg-slate-900/40 border border-slate-800 text-center text-slate-400 text-sm">
            Aucun client enregistré.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {clients.map((c) => (
              <div key={c.id} className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold">
                      {c.fullName?.slice(0, 2) || 'CL'}
                    </div>
                    <div>
                      <div className="font-bold text-white text-base">{c.fullName || 'Client'}</div>
                      <div className="text-xs text-slate-400">Statut: <span className="text-emerald-400 font-bold">{c.accountStatus}</span></div>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs space-y-1">
                    <div>Tél: <span className="text-white font-medium">{c.phone || 'N/A'}</span></div>
                    <div>Email: <span className="text-white font-medium">{c.email || 'N/A'}</span></div>
                    <div>Ville: <span className="text-white font-medium">{c.city || 'Ouagadougou'}</span></div>
                    {c.address && <div>Adresse: <span className="text-white font-medium">{c.address}</span></div>}
                  </div>

                  {/* Section CNI Client Recto / Verso */}
                  <div className="pt-2 border-t border-slate-800 space-y-2">
                    <div className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4" />
                      <span>Pièce d'identité Client (CNI) :</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {/* Recto */}
                      <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5 flex flex-col justify-between">
                        <div className="text-[10px] font-bold text-slate-400">CNI RECTO</div>
                        {c.cniRectoUrl ? (
                          <div className="relative group rounded-lg overflow-hidden border border-slate-800 bg-slate-900 h-24">
                            <img src={c.cniRectoUrl} alt="CNI Recto" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                              <button
                                onClick={() => setSelectedPhoto({ url: c.cniRectoUrl, title: 'CNI Face RECTO', clientName: c.fullName })}
                                className="p-1 rounded bg-amber-500 text-slate-950 font-bold"
                              >
                                <ZoomIn className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDownload(c.cniRectoUrl, 'CNI_Recto', c.fullName)}
                                className="p-1 rounded bg-emerald-500 text-slate-950 font-bold"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="h-24 rounded-lg border border-dashed border-slate-800 flex items-center justify-center text-slate-600 text-[10px]">
                            Non fournie
                          </div>
                        )}
                      </div>

                      {/* Verso */}
                      <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5 flex flex-col justify-between">
                        <div className="text-[10px] font-bold text-slate-400">CNI VERSO</div>
                        {c.cniVersoUrl ? (
                          <div className="relative group rounded-lg overflow-hidden border border-slate-800 bg-slate-900 h-24">
                            <img src={c.cniVersoUrl} alt="CNI Verso" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                              <button
                                onClick={() => setSelectedPhoto({ url: c.cniVersoUrl, title: 'CNI Face VERSO', clientName: c.fullName })}
                                className="p-1 rounded bg-amber-500 text-slate-950 font-bold"
                              >
                                <ZoomIn className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDownload(c.cniVersoUrl, 'CNI_Verso', c.fullName)}
                                className="p-1 rounded bg-emerald-500 text-slate-950 font-bold"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="h-24 rounded-lg border border-dashed border-slate-800 flex items-center justify-center text-slate-600 text-[10px]">
                            Non fournie
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* MODALE LIGHTBOX PHOTO CLIENT */}
      {selectedPhoto && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="max-w-4xl w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-extrabold text-white text-base">{selectedPhoto.title}</h3>
                <p className="text-xs text-slate-400">Client : <strong className="text-amber-400">{selectedPhoto.clientName}</strong></p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleDownload(selectedPhoto.url, selectedPhoto.title, selectedPhoto.clientName)}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Télécharger</span>
                </button>

                <button
                  onClick={() => setSelectedPhoto(null)}
                  className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white border border-slate-700 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto flex items-center justify-center p-2 rounded-2xl bg-slate-950 border border-slate-800 min-h-[300px]">
              <img
                src={selectedPhoto.url}
                alt={selectedPhoto.title}
                className="max-h-[60vh] w-auto max-w-full object-contain rounded-xl shadow-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
