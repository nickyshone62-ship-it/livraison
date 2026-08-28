'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertCircle,
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

  // Modal de Rejet avec Motif
  const [rejectModalUser, setRejectModalUser] = useState<{ id: string; name: string } | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [customReason, setCustomReason] = useState('');

  const PRESET_REASONS = [
    "Pièce d'identité (CNI) floue, illisible ou expirée",
    "Paiement d'inscription non reçu ou référence de transaction invalide",
    "Photo du document d'identité / engin non conforme",
    "Informations du profil incomplètes ou inexactes",
  ];

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

  const handleUserAction = async (userId: string, action: 'approve' | 'reject' | 'suspend' | 'reactivate', reason?: string) => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action, reason }),
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
                            u.isResubmitted ? 'bg-purple-500/20 border-purple-500/50 text-purple-300 animate-pulse' :
                            u.accountStatus === 'approved' || u.accountStatus === 'active' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                            u.accountStatus === 'suspended' ? 'bg-orange-500/10 border-orange-500/20 text-orange-400' :
                            u.accountStatus === 'rejected' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                            'bg-amber-500/10 border-amber-500/20 text-amber-400'
                          }`}>
                            {u.isResubmitted ? '🔄 Pièce modifiée (Re-soumis)' : u.accountStatus}
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

                      {u.accountStatus !== 'rejected' && (
                        <button
                          onClick={() => setRejectModalUser({ id: u.id, name: u.fullName || 'Utilisateur' })}
                          disabled={actionLoading}
                          className="px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold text-xs border border-red-500/20 cursor-pointer flex items-center gap-1.5"
                        >
                          <XCircle className="w-4 h-4" />
                          <span>Rejeter avec Motif</span>
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
                        )}

                        {/* Photos & Pièces d'identité Client ou Livreur */}
                        {(() => {
                          const userDocs = u.role === 'driver' ? docs : [
                            ...(u.cniRectoUrl ? [{ id: '', documentType: 'identity_card_recto', fileUrl: u.cniRectoUrl }] : []),
                            ...(u.cniVersoUrl ? [{ id: '', documentType: 'identity_card_verso', fileUrl: u.cniVersoUrl }] : []),
                          ];

                          return (
                            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 md:col-span-2 lg:col-span-1">
                              <div className="font-bold text-cyan-400 text-sm flex items-center justify-between flex-wrap gap-2">
                                <span>Pièces d'identité CNI ({userDocs.length}) :</span>
                                {userDocs.length > 0 && (
                                  <button
                                    onClick={() => downloadAllUserPhotos(userDocs, u.fullName)}
                                    className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-[11px] flex items-center gap-1 border border-emerald-400/30 cursor-pointer shadow-sm"
                                  >
                                    <FolderDown className="w-3.5 h-3.5" />
                                    <span>💾 Tout télécharger</span>
                                  </button>
                                )}
                              </div>

                              {userDocs.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  {userDocs.map((doc: any, idx: number) => {
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
                                      <div key={doc.id || idx} className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2 flex flex-col justify-between">
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
                          );
                        })()}
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

      {/* MODALE REJET UTILISATEUR AVEC MOTIF */}
      {rejectModalUser && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="max-w-lg w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2 text-red-400">
                <XCircle className="w-5 h-5" />
                <h3 className="font-extrabold text-white text-base">Rejeter le compte utilisateur</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setRejectModalUser(null);
                  setRejectReason('');
                  setCustomReason('');
                }}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Veuillez indiquer à <strong className="text-amber-400">{rejectModalUser.name}</strong> le motif exact du refus de son compte :
            </p>

            {/* CHOIX MOTIFS PRÉDÉFINIS */}
            <div className="space-y-2 text-xs">
              {PRESET_REASONS.map((r, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setRejectReason(r);
                    setCustomReason('');
                  }}
                  className={`w-full p-3 rounded-2xl border text-left transition-all flex items-start gap-2 cursor-pointer ${
                    rejectReason === r
                      ? 'bg-red-500/20 border-red-500 text-white font-bold'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <span>{r}</span>
                </button>
              ))}
            </div>

            {/* CHAMP MOTIF PERSONNALISÉ */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-400">Ou saisissez un motif personnalisé :</label>
              <textarea
                rows={3}
                value={customReason}
                onChange={(e) => {
                  setCustomReason(e.target.value);
                  setRejectReason('');
                }}
                placeholder="ex: Merci de télécharger une photo bien lisible de votre pièce d'identité..."
                className="w-full p-3 bg-slate-950 border border-slate-800 rounded-2xl text-xs text-white placeholder-slate-500 focus:ring-2 focus:ring-red-500 outline-none"
              />
            </div>

            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  const finalReason = customReason.trim() || rejectReason || "Document non conforme ou informations incomplètes.";
                  handleUserAction(rejectModalUser.id, 'reject', finalReason);
                  setRejectModalUser(null);
                  setRejectReason('');
                  setCustomReason('');
                }}
                disabled={actionLoading}
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-red-500/20 cursor-pointer"
              >
                <XCircle className="w-4 h-4" />
                <span>Confirmer le Rejet avec Motif</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setRejectModalUser(null);
                  setRejectReason('');
                  setCustomReason('');
                }}
                className="py-3 px-4 rounded-xl bg-slate-800 text-slate-300 hover:text-white font-bold text-xs cursor-pointer border border-slate-700"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
