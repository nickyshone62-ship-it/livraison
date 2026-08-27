'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Bike,
  ShieldCheck,
  FileText,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Download,
  Eye,
  X,
  FileImage,
  ZoomIn,
  FolderDown
} from 'lucide-react';

export default function AdminLivreursPage() {
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<{ url: string; title: string; driverName: string } | null>(null);

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

  // Convert Base64 data URL or HTTP URL to a Blob URL to avoid about:blank#blocked browser security policy
  const downloadPhoto = async (fileUrl: string, title: string, driverName: string) => {
    if (!fileUrl) return;
    const cleanDriverName = (driverName || 'livreur').toLowerCase().replace(/[^a-z0-9]/g, '_');
    const cleanTitle = (title || 'photo').toLowerCase().replace(/[^a-z0-9]/g, '_');
    const filename = `${cleanDriverName}_${cleanTitle}.jpg`;

    try {
      let blobUrl = fileUrl;
      let isBlobCreated = false;

      if (fileUrl.startsWith('data:')) {
        const parts = fileUrl.split(';base64,');
        const contentType = parts[0].split(':')[1] || 'image/jpeg';
        const raw = window.atob(parts[1]);
        const rawLength = raw.length;
        const uInt8Array = new Uint8Array(rawLength);
        for (let i = 0; i < rawLength; ++i) {
          uInt8Array[i] = raw.charCodeAt(i);
        }
        const blob = new Blob([uInt8Array], { type: contentType });
        blobUrl = URL.createObjectURL(blob);
        isBlobCreated = true;
      } else if (fileUrl.startsWith('http')) {
        const res = await fetch(fileUrl, { mode: 'cors' });
        const blob = await res.blob();
        blobUrl = URL.createObjectURL(blob);
        isBlobCreated = true;
      }

      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      if (isBlobCreated) {
        setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
      }
    } catch (e) {
      console.error('Erreur téléchargement photo:', e);
      const a = document.createElement('a');
      a.href = fileUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const downloadAllDriverPhotos = async (docs: any[], driverName: string) => {
    if (!docs || docs.length === 0) return;
    const labelMap: Record<string, string> = {
      identity_card_recto: "CNI (Face RECTO)",
      identity_card_verso: "CNI (Face VERSO)",
      vehicle_photo: "Photo Engin",
      photo: "Photo Profil",
    };

    for (const doc of docs) {
      if (doc.fileUrl) {
        const title = labelMap[doc.documentType] || doc.documentType;
        await downloadPhoto(doc.fileUrl, title, driverName);
        await new Promise(r => setTimeout(r, 400));
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-16">
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/admin" className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-white">Validation & Enregistrement Photos Livreurs ({drivers.length})</h1>
              <p className="text-xs text-slate-400">Examinez les pièces KYC, prévisualisez et enregistrez toutes les photos en local</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {loading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : drivers.length === 0 ? (
          <div className="p-12 rounded-3xl bg-slate-900/40 border border-slate-800 text-center text-slate-400 text-sm">
            Aucun livreur enregistré.
          </div>
        ) : (
          <div className="space-y-6">
            {drivers.map((d) => {
              const driverProfile = d.driverProfile;
              const verificationStatus = driverProfile?.verificationStatus || 'pending';
              const vehicles = driverProfile?.vehicles || [];
              const docs = driverProfile?.documents || [];

              return (
                <div key={d.id} className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-6">
                  {/* EN-TÊTE LIVREUR */}
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${
                          verificationStatus === 'approved' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                          verificationStatus === 'rejected' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                          'bg-amber-500/10 border-amber-500/20 text-amber-400'
                        }`}>
                          Statut: {verificationStatus}
                        </span>
                        <span className="text-xs text-slate-400 font-semibold">Note: {driverProfile?.averageRating || '5.0'} ★</span>
                      </div>

                      <h3 className="font-extrabold text-white text-xl mt-1">{d.fullName || 'Livreur'}</h3>
                      <p className="text-xs text-slate-400">Tél: <strong className="text-white">{d.phone || 'N/A'}</strong> | Email: {d.email || 'N/A'} | Ville: {d.city || 'Ouagadougou'}</p>
                    </div>

                    <div className="flex items-center space-x-3">
                      {verificationStatus !== 'approved' && (
                        <button
                          onClick={() => handleVerifyDriver(d.id, 'approve')}
                          disabled={actionLoading}
                          className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs flex items-center space-x-2 shadow-lg cursor-pointer"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Approuver ce livreur</span>
                        </button>
                      )}

                      {verificationStatus !== 'rejected' && (
                        <button
                          onClick={() => handleVerifyDriver(d.id, 'reject')}
                          disabled={actionLoading}
                          className="px-5 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 font-bold text-xs flex items-center space-x-2 cursor-pointer hover:bg-red-500/20"
                        >
                          <XCircle className="w-4 h-4" />
                          <span>Rejeter</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* DÉTAILS VÉHICULE */}
                    <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                      <div className="font-bold text-amber-400 text-sm flex items-center gap-2">
                        <Bike className="w-4 h-4" />
                        <span>Véhicule Déclaré</span>
                      </div>
                      {vehicles.length > 0 ? (
                        <div className="space-y-1 text-slate-300">
                          <div>Type: <strong className="text-white uppercase">{vehicles[0].vehicleType}</strong></div>
                          <div>Marque: <strong className="text-white">{vehicles[0].brand || 'N/A'}</strong></div>
                          <div>Modèle: <strong className="text-white">{vehicles[0].model || 'N/A'}</strong></div>
                          <div>Couleur: <strong className="text-white">{vehicles[0].color || 'N/A'}</strong></div>
                        </div>
                      ) : (
                        <div className="text-slate-500 italic">Aucun véhicule enregistré.</div>
                      )}
                    </div>

                    {/* GALERIE DE PHOTOS ET PIÈCES KYC DES LIVREURS (TÉLÉCHARGEABLES EN LOCAL) */}
                    <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                        <span className="flex items-center gap-2 font-bold text-cyan-400 text-sm">
                          <FileImage className="w-4 h-4" />
                          <span>Photos & Pièces KYC Téléchargeables ({docs.length})</span>
                        </span>

                        {docs.length > 0 && (
                          <button
                            onClick={() => downloadAllDriverPhotos(docs, d.fullName)}
                            className="px-3.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 font-bold text-xs flex items-center gap-1.5 border border-amber-500/30 cursor-pointer shadow-sm"
                            title="Télécharger l'ensemble des photos de ce livreur en 1 clic"
                          >
                            <FolderDown className="w-4 h-4" />
                            <span>💾 Enregistrer TOUTES les photos du livreur</span>
                          </button>
                        )}
                      </div>

                      {docs.length === 0 ? (
                        <div className="text-slate-500 text-xs italic py-4 text-center border border-dashed border-slate-800 rounded-xl">
                          Aucune photo téléversée par ce livreur.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-1">
                          {docs.map((doc: any) => {
                            const labelMap: Record<string, string> = {
                              identity_card_recto: "CNI (Face RECTO)",
                              identity_card_verso: "CNI (Face VERSO)",
                              vehicle_photo: "Photo Engin / Véhicule",
                              photo: "Photo de Profil",
                              identity_card: "Pièce d'identité",
                              driver_license: "Permis de conduire",
                              vehicle_document: "Document véhicule",
                            };
                            const title = labelMap[doc.documentType] || doc.documentType;
                            const fileUrl = doc.fileUrl;

                            return (
                              <div
                                key={doc.id}
                                className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2 flex flex-col justify-between"
                              >
                                <div className="space-y-2">
                                  <div className="text-[11px] font-bold text-slate-300 truncate" title={title}>
                                    {title}
                                  </div>

                                  {/* APERÇU DE LA PHOTO / MINIATURE */}
                                  {fileUrl ? (
                                    <div className="relative group rounded-lg overflow-hidden border border-slate-800 bg-slate-950 h-32 flex items-center justify-center">
                                      <img
                                        src={fileUrl}
                                        alt={title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform cursor-pointer"
                                        onClick={() => setSelectedPhoto({ url: fileUrl, title, driverName: d.fullName })}
                                      />
                                      <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                        <button
                                          onClick={() => setSelectedPhoto({ url: fileUrl, title, driverName: d.fullName })}
                                          className="p-2 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs flex items-center gap-1 shadow-md"
                                          title="Agrandir"
                                        >
                                          <ZoomIn className="w-4 h-4" />
                                        </button>
                                        <button
                                          onClick={() => downloadPhoto(fileUrl, title, d.fullName)}
                                          className="p-2 rounded-lg bg-slate-800 text-white font-bold text-xs flex items-center gap-1 shadow-md hover:bg-slate-700"
                                          title="Enregistrer en local sur mon PC / Téléphone"
                                        >
                                          <Download className="w-4 h-4" />
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="h-32 rounded-lg border border-dashed border-slate-800 bg-slate-950 flex items-center justify-center text-slate-600 text-xs">
                                      Photo indisponible
                                    </div>
                                  )}
                                </div>

                                {/* BOUTONS D'ACTION INDIVIDUELS */}
                                {fileUrl && (
                                  <div className="flex items-center gap-2 pt-1">
                                    <button
                                      onClick={() => setSelectedPhoto({ url: fileUrl, title, driverName: d.fullName })}
                                      className="flex-1 py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold rounded-lg flex items-center justify-center gap-1 border border-slate-700 cursor-pointer"
                                    >
                                      <Eye className="w-3 h-3 text-amber-400" />
                                      <span>Agrandir</span>
                                    </button>

                                    <button
                                      onClick={() => downloadPhoto(fileUrl, title, d.fullName)}
                                      className="flex-1 py-1.5 px-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-[10px] font-bold rounded-lg flex items-center justify-center gap-1 border border-amber-500/20 cursor-pointer"
                                    >
                                      <Download className="w-3 h-3" />
                                      <span>Enregistrer</span>
                                    </button>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* MODALE LIGHTBOX POUR VISUALISATION HIGH-RES ET ENREGISTREMENT LOCAL */}
      {selectedPhoto && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="max-w-4xl w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-extrabold text-white text-base">{selectedPhoto.title}</h3>
                <p className="text-xs text-slate-400">Livreur : <strong className="text-amber-400">{selectedPhoto.driverName}</strong></p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => downloadPhoto(selectedPhoto.url, selectedPhoto.title, selectedPhoto.driverName)}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md cursor-pointer transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Enregistrer cette photo en local</span>
                </button>

                <button
                  onClick={() => setSelectedPhoto(null)}
                  className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white border border-slate-700 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* CONTENEUR DE L'IMAGE FULL RESOLUTION */}
            <div className="flex-1 overflow-auto flex items-center justify-center p-2 rounded-2xl bg-slate-950 border border-slate-800 min-h-[300px]">
              <img
                src={selectedPhoto.url}
                alt={selectedPhoto.title}
                className="max-h-[60vh] w-auto max-w-full object-contain rounded-xl shadow-lg"
              />
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800">
              <span>La photo sera enregistrée directement dans votre dossier de téléchargements.</span>
              <button
                onClick={() => setSelectedPhoto(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white font-bold cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
