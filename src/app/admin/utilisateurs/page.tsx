'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  User,
  Bike,
  ExternalLink,
  Eye,
  ChevronDown,
  ChevronUp,
  Download,
  ZoomIn,
  X,
  FileImage,
  FolderDown
} from 'lucide-react';

export default function AdminUtilisateursPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<{ id: string; url: string; title: string; userName: string } | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUserAction = async (userId: string, action: 'approve' | 'reject' | 'suspend' | 'reactivate') => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur modification utilisateur');

      await fetchUsers();
    } catch (err: any) {
      alert(err.message || 'Erreur modification utilisateur');
    } finally {
      setActionLoading(false);
    }
  };

  const triggerServerDownload = (docId: string, fallbackUrl?: string, title?: string, userName?: string) => {
    if (docId) {
      const downloadUrl = `/api/admin/documents/${docId}/download`;
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = downloadUrl;
      document.body.appendChild(iframe);
      setTimeout(() => document.body.removeChild(iframe), 5000);
    } else if (fallbackUrl) {
      const cleanName = (userName || 'utilisateur').toLowerCase().replace(/[^a-z0-9]/g, '_');
      const cleanTitle = (title || 'photo').toLowerCase().replace(/[^a-z0-9]/g, '_');
      const filename = `${cleanName}_${cleanTitle}.jpg`;

      const a = document.createElement('a');
      a.href = fallbackUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const downloadAllUserPhotos = async (docs: any[], userName: string) => {
    if (!docs || docs.length === 0) return;
    for (const doc of docs) {
      triggerServerDownload(doc.id, doc.fileUrl, doc.documentType, userName);
      await new Promise(r => setTimeout(r, 600));
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-12">
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center space-x-4">
          <Link href="/admin" className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-bold text-white">Gestion Unifiée & Consultation Utilisateurs ({users.length})</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {loading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : (
          <div className="space-y-4">
            {users.map((u) => {
              const isExpanded = expandedUserId === u.id;
              const driverProfile = u.driverProfile;
              const vehicles = driverProfile?.vehicles || [];
              const docs = driverProfile?.documents || [];

              return (
                <div key={u.id} className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-amber-400">
                        {u.role === 'driver' ? <Bike className="w-6 h-6" /> : <User className="w-6 h-6" />}
                      </div>
                      <div>
                        <div className="font-bold text-white text-lg flex items-center space-x-2">
                          <span>{u.fullName || 'Utilisateur'}</span>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                            u.accountStatus === 'approved' || u.accountStatus === 'active' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                            u.accountStatus === 'suspended' ? 'bg-orange-500/10 border-orange-500/20 text-orange-400' :
                            u.accountStatus === 'rejected' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                            'bg-amber-500/10 border-amber-500/20 text-amber-400'
                          }`}>
                            {u.accountStatus}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400">Tél: <strong className="text-white">{u.phone || 'N/A'}</strong> | Email: {u.email || 'N/A'} | Ville: {u.city || 'Ouagadougou'}</div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => setExpandedUserId(isExpanded ? null : u.id)}
                        className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center space-x-1.5 border border-slate-700 cursor-pointer"
                      >
                        <Eye className="w-4 h-4 text-amber-400" />
                        <span>{isExpanded ? 'Masquer détails' : 'Voir tout le dossier'}</span>
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>

                      {u.accountStatus !== 'approved' && u.accountStatus !== 'active' && (
                        <button
                          onClick={() => handleUserAction(u.id, 'approve')}
                          disabled={actionLoading}
                          className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs flex items-center space-x-1.5 shadow-lg cursor-pointer"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Approuver</span>
                        </button>
                      )}

                      {u.accountStatus !== 'suspended' && (
                        <button
                          onClick={() => handleUserAction(u.id, 'suspend')}
                          disabled={actionLoading}
                          className="px-4 py-2 rounded-xl bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 font-bold text-xs border border-orange-500/20 cursor-pointer"
                        >
                          Suspendre
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Section Détails Complète */}
                  {isExpanded && (
                    <div className="pt-4 border-t border-slate-800 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                          <div className="font-bold text-amber-400 text-sm">Informations Profil :</div>
                          <div>Nom complet: <strong className="text-white">{u.fullName || 'N/A'}</strong></div>
                          <div>Téléphone: <strong className="text-white">{u.phone || 'N/A'}</strong></div>
                          <div>Email: <strong className="text-white">{u.email || 'N/A'}</strong></div>
                          <div>Ville: <strong className="text-white">{u.city || 'Ouagadougou'}</strong></div>
                          <div>Adresse / Quartier: <strong className="text-white">{u.address || 'Non renseignée'}</strong></div>
                          <div>Inscrit le: <strong className="text-white">{new Date(u.createdAt).toLocaleDateString('fr-FR')}</strong></div>
                        </div>

                        {u.role === 'driver' && (
                          <>
                            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                              <div className="font-bold text-orange-400 text-sm">Véhicule Déclaré :</div>
                              {vehicles.length > 0 ? (
                                <>
                                  <div>Type: <strong className="text-white uppercase">{vehicles[0].vehicleType}</strong></div>
                                  <div>Marque: <strong className="text-white">{vehicles[0].brand || 'N/A'}</strong></div>
                                  <div>Modèle: <strong className="text-white">{vehicles[0].model || 'N/A'}</strong></div>
                                  <div>Couleur: <strong className="text-white">{vehicles[0].color || 'N/A'}</strong></div>
                                </>
                              ) : (
                                <div className="text-slate-500">Aucun véhicule enregistré.</div>
                              )}
                            </div>

                            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                              <div className="font-bold text-cyan-400 text-sm flex items-center justify-between flex-wrap gap-2">
                                <span>Photos & Pièces KYC ({docs.length}) :</span>
                                {docs.length > 0 && (
                                  <button
                                    onClick={() => downloadAllUserPhotos(docs, u.fullName)}
                                    className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-[11px] flex items-center gap-1 border border-emerald-400/30 cursor-pointer shadow-sm"
                                  >
                                    <FolderDown className="w-3.5 h-3.5" />
                                    <span>💾 Tout télécharger</span>
                                  </button>
                                )}
                              </div>

                              {docs.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  {docs.map((doc: any) => {
                                    const labelMap: Record<string, string> = {
                                      identity_card_recto: "CNI (Face RECTO)",
                                      identity_card_verso: "CNI (Face VERSO)",
                                      vehicle_photo: "Photo Engin",
                                      photo: "Photo Profil",
                                    };
                                    const title = labelMap[doc.documentType] || doc.documentType;
                                    const fileUrl = doc.fileUrl;
                                    const viewUrl = doc.id ? `/api/admin/documents/${doc.id}/view` : fileUrl;

                                    return (
                                      <div key={doc.id} className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2 flex flex-col justify-between">
                                        <div className="text-[11px] font-bold text-slate-300 truncate">{title}</div>
                                        {fileUrl ? (
                                          <div className="relative group rounded-lg overflow-hidden border border-slate-800 bg-slate-950 h-28 flex items-center justify-center">
                                            <img
                                              src={viewUrl}
                                              alt={title}
                                              className="w-full h-full object-cover cursor-pointer"
                                              onClick={() => setSelectedPhoto({ id: doc.id, url: viewUrl, title, userName: u.fullName })}
                                            />
                                            <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                                              <button
                                                onClick={() => setSelectedPhoto({ id: doc.id, url: viewUrl, title, userName: u.fullName })}
                                                className="p-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold"
                                              >
                                                <ZoomIn className="w-3.5 h-3.5" />
                                              </button>
                                              <button
                                                onClick={() => triggerServerDownload(doc.id, doc.fileUrl, title, u.fullName)}
                                                className="p-1.5 rounded-lg bg-emerald-500 text-slate-950 font-bold"
                                              >
                                                <Download className="w-3.5 h-3.5" />
                                              </button>
                                            </div>
                                          </div>
                                        ) : (
                                          <div className="h-28 rounded-lg border border-dashed border-slate-800 bg-slate-950 flex items-center justify-center text-slate-600 text-xs">
                                            Sans photo
                                          </div>
                                        )}

                                        {fileUrl && (
                                          <div className="flex items-center gap-1 pt-1">
                                            <button
                                              onClick={() => setSelectedPhoto({ id: doc.id, url: viewUrl, title, userName: u.fullName })}
                                              className="flex-1 py-1 text-[10px] font-bold rounded bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center gap-1 cursor-pointer"
                                            >
                                              <Eye className="w-3 h-3 text-amber-400" />
                                              <span>Agrandir</span>
                                            </button>
                                            <button
                                              onClick={() => triggerServerDownload(doc.id, doc.fileUrl, title, u.fullName)}
                                              className="flex-1 py-1 text-[10px] font-bold rounded bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 flex items-center justify-center gap-1 cursor-pointer border border-emerald-500/20"
                                            >
                                              <Download className="w-3 h-3" />
                                              <span>Télécharger</span>
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                <div className="text-slate-500 italic text-xs">Aucune photo téléversée.</div>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* MODALE LIGHTBOX PHOTO POUR ADMIN UTILISATEURS */}
      {selectedPhoto && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="max-w-4xl w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-extrabold text-white text-base">{selectedPhoto.title}</h3>
                <p className="text-xs text-slate-400">Utilisateur : <strong className="text-amber-400">{selectedPhoto.userName}</strong></p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => triggerServerDownload(selectedPhoto.id, selectedPhoto.url, selectedPhoto.title, selectedPhoto.userName)}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Enregistrer en local</span>
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

            <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800">
              <span>La photo sera enregistrée directement dans vos fichiers locaux.</span>
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
