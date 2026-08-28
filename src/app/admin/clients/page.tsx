'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  User,
  Eye,
  Download,
  ZoomIn,
  X,
  Image as ImageIcon,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Filter,
  FolderDown,
  Phone,
  Mail,
  MapPin,
  Calendar,
  CreditCard,
  RefreshCw,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';

export default function AdminClientsPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'pending' | 'resubmitted' | 'active' | 'suspended'>('all');
  const [selectedPhoto, setSelectedPhoto] = useState<{ url: string; title: string; clientName: string } | null>(null);

  // Modal de Rejet avec Motif
  const [rejectModalUser, setRejectModalUser] = useState<{ id: string; name: string } | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [customReason, setCustomReason] = useState('');

  const PRESET_REASONS = [
    "Pièce d'identité (CNI) floue, illisible ou expirée",
    "Paiement d'inscription non reçu ou référence de transaction invalide",
    "Photo du document d'identité non conforme",
    "Informations du profil incomplètes ou inexactes",
  ];

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users');
      if (res.ok) {
        const data = await res.json();
        const filtered = (data.users || []).filter((u: any) => u.role === 'client');
        setClients(filtered);
      }
    } catch (err) {
      console.error('Erreur chargement clients:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClientAction = async (userId: string, action: 'approve' | 'reject' | 'suspend' | 'reactivate', reason?: string) => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action, reason }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur lors de la modification');

      await fetchClients();
    } catch (err: any) {
      alert(err.message || 'Erreur lors de l\'action sur le client');
    } finally {
      setActionLoading(false);
    }
  };

  const triggerDownload = async (fileUrl: string, title: string, clientName: string) => {
    if (!fileUrl) return;
    const cleanName = (clientName || 'client').toLowerCase().replace(/[^a-z0-9]/g, '_');
    const cleanTitle = (title || 'cni').toLowerCase().replace(/[^a-z0-9]/g, '_');
    const extension = fileUrl.startsWith('data:image/png') ? 'png' : 'jpg';
    const filename = `${cleanName}_${cleanTitle}.${extension}`;

    try {
      if (fileUrl.startsWith('data:')) {
        const a = document.createElement('a');
        a.href = fileUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else {
        const res = await fetch(fileUrl);
        const blob = await res.blob();
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);
      }
    } catch (err) {
      const a = document.createElement('a');
      a.href = fileUrl;
      a.download = filename;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const downloadAllClientPhotos = async (client: any) => {
    const photos: { url: string; title: string }[] = [];
    if (client.cniRectoUrl) photos.push({ url: client.cniRectoUrl, title: 'CNI_Recto' });
    if (client.cniVersoUrl) photos.push({ url: client.cniVersoUrl, title: 'CNI_Verso' });
    if (client.avatarUrl) photos.push({ url: client.avatarUrl, title: 'Photo_Profil' });

    if (photos.length === 0) {
      alert('Aucune photo disponible pour ce client.');
      return;
    }

    for (const p of photos) {
      await triggerDownload(p.url, p.title, client.fullName);
      await new Promise((r) => setTimeout(r, 600));
    }
  };

  // Filter & Search Logic
  const filteredClients = clients.filter((c) => {
    const matchesSearch =
      (c.fullName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.phone || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.city || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.address || '').toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (filterTab === 'resubmitted') return Boolean(c.isResubmitted);
    if (filterTab === 'pending') return c.accountStatus === 'pending';
    if (filterTab === 'active') return c.accountStatus === 'active' || c.accountStatus === 'approved';
    if (filterTab === 'suspended') return c.accountStatus === 'suspended' || c.accountStatus === 'rejected';

    return true;
  });

  const stats = {
    total: clients.length,
    pending: clients.filter((c) => c.accountStatus === 'pending').length,
    resubmitted: clients.filter((c) => Boolean(c.isResubmitted)).length,
    active: clients.filter((c) => c.accountStatus === 'active' || c.accountStatus === 'approved').length,
    suspended: clients.filter((c) => c.accountStatus === 'suspended' || c.accountStatus === 'rejected').length,
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-16">
      {/* HEADER */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <Link href="/admin" className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                <span>Gestion & Inspection des Clients</span>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-black">
                  {clients.length} inscrits
                </span>
              </h1>
              <p className="text-xs text-slate-400">Consultez les dossiers d'inscription, vérifiez les CNI et validez les comptes clients</p>
            </div>
          </div>

          <button
            onClick={fetchClients}
            disabled={loading}
            className="self-start md:self-auto px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-2 border border-slate-700 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 text-amber-400 ${loading ? 'animate-spin' : ''}`} />
            <span>Actualiser</span>
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {/* STATS CARDS */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <button
            onClick={() => setFilterTab('all')}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
              filterTab === 'all' ? 'bg-amber-500/10 border-amber-500/50 shadow-lg shadow-amber-500/5' : 'bg-slate-900/60 border-slate-800 hover:bg-slate-900'
            }`}
          >
            <div className="text-xs text-slate-400 font-medium">Total Clients</div>
            <div className="text-2xl font-black text-white mt-1">{stats.total}</div>
            <div className="text-[10px] text-slate-500 mt-1">Tous les comptes</div>
          </button>

          <button
            onClick={() => setFilterTab('pending')}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
              filterTab === 'pending' ? 'bg-amber-500/20 border-amber-500 shadow-lg shadow-amber-500/10' : 'bg-slate-900/60 border-slate-800 hover:bg-slate-900'
            }`}
          >
            <div className="text-xs text-amber-400 font-bold flex items-center justify-between">
              <span>En attente</span>
              {stats.pending > 0 && <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />}
            </div>
            <div className="text-2xl font-black text-amber-400 mt-1">{stats.pending}</div>
            <div className="text-[10px] text-slate-400 mt-1">CNI & Paiement à vérifier</div>
          </button>

          <button
            onClick={() => setFilterTab('resubmitted')}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
              filterTab === 'resubmitted' ? 'bg-purple-500/20 border-purple-500 shadow-lg shadow-purple-500/10' : 'bg-slate-900/60 border-purple-900/40 hover:bg-slate-900'
            }`}
          >
            <div className="text-xs text-purple-400 font-bold flex items-center justify-between">
              <span>Pièces Modifiées</span>
              {stats.resubmitted > 0 && <span className="w-2.5 h-2.5 rounded-full bg-purple-400 animate-ping" />}
            </div>
            <div className="text-2xl font-black text-purple-300 mt-1">{stats.resubmitted}</div>
            <div className="text-[10px] text-purple-400/80 mt-1">Re-soumis suite au rejet</div>
          </button>

          <button
            onClick={() => setFilterTab('active')}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
              filterTab === 'active' ? 'bg-emerald-500/10 border-emerald-500/50 shadow-lg shadow-emerald-500/5' : 'bg-slate-900/60 border-slate-800 hover:bg-slate-900'
            }`}
          >
            <div className="text-xs text-emerald-400 font-bold">Comptes Actifs</div>
            <div className="text-2xl font-black text-emerald-400 mt-1">{stats.active}</div>
            <div className="text-[10px] text-slate-400 mt-1">Clients autorisés</div>
          </button>

          <button
            onClick={() => setFilterTab('suspended')}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
              filterTab === 'suspended' ? 'bg-red-500/10 border-red-500/50 shadow-lg shadow-red-500/5' : 'bg-slate-900/60 border-slate-800 hover:bg-slate-900'
            }`}
          >
            <div className="text-xs text-red-400 font-bold">Suspendus</div>
            <div className="text-2xl font-black text-red-400 mt-1">{stats.suspended}</div>
            <div className="text-[10px] text-slate-400 mt-1">Accès restreint</div>
          </button>
        </div>

        {/* SEARCH BAR & FILTERS */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher par nom, tél, email, ville..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:ring-2 focus:ring-amber-500 outline-none"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* FILTER TABS */}
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto text-xs font-semibold">
            <button
              onClick={() => setFilterTab('all')}
              className={`px-3 py-2 rounded-xl transition-colors cursor-pointer ${
                filterTab === 'all' ? 'bg-amber-500 text-slate-950 font-black' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Tous ({stats.total})
            </button>

            <button
              onClick={() => setFilterTab('pending')}
              className={`px-3 py-2 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 ${
                filterTab === 'pending' ? 'bg-amber-500 text-slate-950 font-black' : 'bg-slate-800 text-amber-400 hover:bg-slate-700'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>En attente ({stats.pending})</span>
            </button>

            <button
              onClick={() => setFilterTab('resubmitted')}
              className={`px-3 py-2 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 ${
                filterTab === 'resubmitted' ? 'bg-purple-600 text-white font-black shadow-lg shadow-purple-600/30' : 'bg-purple-950/60 border border-purple-500/30 text-purple-300 hover:bg-purple-900/60'
              }`}
            >
              <RefreshCw className="w-3.5 h-3.5 text-purple-400" />
              <span>Pièces Modifiées ({stats.resubmitted})</span>
            </button>

            <button
              onClick={() => setFilterTab('active')}
              className={`px-3 py-2 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 ${
                filterTab === 'active' ? 'bg-emerald-500 text-slate-950 font-black' : 'bg-slate-800 text-emerald-400 hover:bg-slate-700'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Actifs ({stats.active})</span>
            </button>

            <button
              onClick={() => setFilterTab('suspended')}
              className={`px-3 py-2 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 ${
                filterTab === 'suspended' ? 'bg-red-500 text-slate-950 font-black' : 'bg-slate-800 text-red-400 hover:bg-slate-700'
              }`}
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Suspendus ({stats.suspended})</span>
            </button>
          </div>
        </div>

        {/* LISTING CLIENTS */}
        {loading ? (
          <div className="text-center py-16">
            <div className="w-10 h-10 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-slate-400 font-medium">Chargement des dossiers clients...</p>
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="p-16 rounded-3xl bg-slate-900/40 border border-slate-800 text-center space-y-3">
            <User className="w-12 h-12 text-slate-600 mx-auto" />
            <div className="text-base font-bold text-white">Aucun client trouvé</div>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {searchTerm
                ? `Aucun résultat ne correspond à la recherche "${searchTerm}".`
                : filterTab === 'pending'
                ? 'Aucune inscription client en attente de vérification pour le moment.'
                : 'Aucun client enregistré dans la base de données.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredClients.map((c) => {
              const hasCniRecto = Boolean(c.cniRectoUrl);
              const hasCniVerso = Boolean(c.cniVersoUrl);
              const totalCni = (hasCniRecto ? 1 : 0) + (hasCniVerso ? 1 : 0);

              // Payment info if available
              const regPayment = (c.payments || []).find(
                (p: any) => p.paymentType === 'client_registration' || p.paymentType === 'registration'
              ) || (c.payments || [])[0];

              return (
                <div
                  key={c.id}
                  className={`p-6 rounded-3xl bg-slate-900 border transition-all flex flex-col justify-between space-y-6 ${
                    c.accountStatus === 'pending'
                      ? 'border-amber-500/40 shadow-xl shadow-amber-500/5'
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-4">
                    {/* TOP USER HEADER */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center space-x-3">
                        {c.avatarUrl ? (
                          <img
                            src={c.avatarUrl}
                            alt={c.fullName || 'Client'}
                            className="w-12 h-12 rounded-2xl object-cover border border-slate-700"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-orange-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center font-black text-lg">
                            {c.fullName?.slice(0, 2).toUpperCase() || 'CL'}
                          </div>
                        )}
                        <div>
                          <div className="font-extrabold text-white text-lg flex items-center gap-2">
                            <span>{c.fullName || 'Client Sans Nom'}</span>
                          </div>
                          <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                            <span className="flex items-center gap-1 text-slate-300">
                              <Phone className="w-3 h-3 text-amber-400" />
                              <a href={`tel:${c.phone}`} className="hover:underline font-semibold">
                                {c.phone || 'Tél N/A'}
                              </a>
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-cyan-400" />
                              <span>{c.city || 'Ouagadougou'}</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* STATUS BADGE */}
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border flex items-center gap-1.5 ${
                          c.accountStatus === 'active' || c.accountStatus === 'approved'
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                            : c.accountStatus === 'pending'
                            ? 'bg-amber-500/20 border-amber-500/50 text-amber-400 animate-pulse'
                            : c.accountStatus === 'suspended'
                            ? 'bg-orange-500/10 border-orange-500/30 text-orange-400'
                            : 'bg-red-500/10 border-red-500/30 text-red-400'
                        }`}
                      >
                        {c.accountStatus === 'pending' && <Clock className="w-3.5 h-3.5" />}
                        {c.accountStatus === 'active' && <CheckCircle2 className="w-3.5 h-3.5" />}
                        {c.accountStatus}
                      </span>
                    </div>

                    {/* DETAILS BOX */}
                    <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs space-y-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-300">
                        <div className="flex items-center gap-1.5 truncate">
                          <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{c.email || 'Email non fourni'}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>Inscrit le {new Date(c.createdAt || Date.now()).toLocaleDateString('fr-FR')}</span>
                        </div>
                      </div>

                      {c.address && (
                        <div className="pt-2 border-t border-slate-900 text-slate-300 flex items-start gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                          <span>Adresse : <strong className="text-white">{c.address}</strong></span>
                        </div>
                      )}

                      {/* REGISTRATION PAYMENT DETAILS */}
                      {regPayment && (
                        <div className="pt-2 border-t border-slate-900 flex items-center justify-between text-[11px]">
                          <div className="flex items-center gap-1.5 text-slate-400">
                            <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                            <span>
                              Paiement inscription :{' '}
                              <strong className="text-emerald-400">
                                {regPayment.amount ? `${Number(regPayment.amount).toLocaleString('fr-FR')} FCFA` : '2,000 FCFA'}
                              </strong>
                              {regPayment.paymentMethod && ` (${regPayment.paymentMethod.replace('_', ' ').toUpperCase()})`}
                            </span>
                          </div>
                          {regPayment.transactionReference && (
                            <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-amber-400">
                              Ref: {regPayment.transactionReference}
                            </span>
                          )}
                        </div>
                      )}

                      {/* ALERTE PIÈCE MIS À JOUR / RE-SOUMIS APRÈS REJET */}
                      {c.isResubmitted && (
                        <div className="p-3 rounded-xl bg-purple-950/60 border border-purple-500/50 text-purple-200 text-xs space-y-1 shadow-lg shadow-purple-500/10">
                          <div className="font-extrabold text-purple-300 flex items-center gap-1.5">
                            <RefreshCw className="w-4 h-4 text-purple-400 animate-spin" />
                            <span>🔄 PIÈCE MIS À JOUR (DOSSIER RE-SOUMIS)</span>
                          </div>
                          {c.previousRejectionReason && (
                            <div className="text-[11px] text-slate-300">
                              Précédent motif du rejet : <strong className="text-amber-300 font-semibold">"{c.previousRejectionReason}"</strong>
                            </div>
                          )}
                          {c.documentUpdatedAt && (
                            <div className="text-[10px] text-purple-400">
                              Mise à jour le {new Date(c.documentUpdatedAt).toLocaleString('fr-FR')}
                            </div>
                          )}
                        </div>
                      )}

                      {/* AFFICHAGE DU MOTIF DE REFUS SI COMPTE REJETÉ */}
                      {c.accountStatus === 'rejected' && (
                        <div className="pt-2 border-t border-slate-900 text-[11px] text-red-300 space-y-0.5">
                          <div className="font-bold text-red-400 flex items-center gap-1">
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Compte Rejeté par l'Admin</span>
                          </div>
                          <div>Motif : <strong className="text-white">"{c.rejectionReason || 'Document non conforme ou incomplet.'}"</strong></div>
                        </div>
                      )}
                    </div>

                    {/* SECTION CNI (PIÈCES D'IDENTITÉ RECTO ET VERSO) */}
                    <div className="pt-3 border-t border-slate-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                          <ImageIcon className="w-4 h-4" />
                          <span>Pièce d'identité Client (CNI / Passeport)</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              totalCni === 2
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                : totalCni === 1
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                                : 'bg-red-500/10 text-red-400 border border-red-500/30'
                            }`}
                          >
                            {totalCni === 2 ? 'Complète (2/2)' : totalCni === 1 ? 'Partielle (1/2)' : 'Non fournie (0/2)'}
                          </span>

                          {totalCni > 0 && (
                            <button
                              type="button"
                              onClick={() => downloadAllClientPhotos(c)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold text-[11px] flex items-center gap-1 shadow-sm transition-colors cursor-pointer"
                              title="Télécharger toutes les pièces jointes du client"
                            >
                              <FolderDown className="w-3.5 h-3.5" />
                              <span>💾 Tout enregistrer</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* PHOTO GRID RECTO / VERSO */}
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        {/* 1. RECTO */}
                        <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 flex flex-col justify-between">
                          <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
                            <span>FACE RECTO</span>
                            {hasCniRecto && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                          </div>

                          {c.cniRectoUrl ? (
                            <div className="relative group rounded-xl overflow-hidden border border-slate-800 bg-slate-900 h-32 flex items-center justify-center">
                              <img
                                src={c.cniRectoUrl}
                                alt="CNI Face Recto"
                                className="w-full h-full object-cover cursor-pointer"
                                onClick={() =>
                                  setSelectedPhoto({
                                    url: c.cniRectoUrl,
                                    title: 'CNI Face RECTO',
                                    clientName: c.fullName,
                                  })
                                }
                              />
                              <div className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setSelectedPhoto({
                                      url: c.cniRectoUrl,
                                      title: 'CNI Face RECTO',
                                      clientName: c.fullName,
                                    })
                                  }
                                  className="p-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-lg cursor-pointer"
                                  title="Agrandir"
                                >
                                  <ZoomIn className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => triggerDownload(c.cniRectoUrl, 'CNI_Face_Recto', c.fullName)}
                                  className="p-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold shadow-lg cursor-pointer"
                                  title="Télécharger localement"
                                >
                                  <Download className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="h-32 rounded-xl border border-dashed border-slate-800 bg-slate-900/30 flex flex-col items-center justify-center text-slate-600 text-[11px] p-2 text-center">
                              <ImageIcon className="w-6 h-6 mb-1 text-slate-700" />
                              <span>Photo Recto non fournie</span>
                            </div>
                          )}

                          {c.cniRectoUrl && (
                            <div className="flex items-center gap-1.5 pt-1">
                              <button
                                type="button"
                                onClick={() =>
                                  setSelectedPhoto({
                                    url: c.cniRectoUrl,
                                    title: 'CNI Face RECTO',
                                    clientName: c.fullName,
                                  })
                                }
                                className="flex-1 py-1.5 text-[10px] font-bold rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center gap-1 cursor-pointer border border-slate-800"
                              >
                                <Eye className="w-3 h-3 text-amber-400" />
                                <span>Agrandir</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => triggerDownload(c.cniRectoUrl, 'CNI_Face_Recto', c.fullName)}
                                className="flex-1 py-1.5 text-[10px] font-bold rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 flex items-center justify-center gap-1 cursor-pointer border border-emerald-500/20"
                              >
                                <Download className="w-3 h-3" />
                                <span>Enregistrer</span>
                              </button>
                            </div>
                          )}
                        </div>

                        {/* 2. VERSO */}
                        <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 flex flex-col justify-between">
                          <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
                            <span>FACE VERSO</span>
                            {hasCniVerso && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                          </div>

                          {c.cniVersoUrl ? (
                            <div className="relative group rounded-xl overflow-hidden border border-slate-800 bg-slate-900 h-32 flex items-center justify-center">
                              <img
                                src={c.cniVersoUrl}
                                alt="CNI Face Verso"
                                className="w-full h-full object-cover cursor-pointer"
                                onClick={() =>
                                  setSelectedPhoto({
                                    url: c.cniVersoUrl,
                                    title: 'CNI Face VERSO',
                                    clientName: c.fullName,
                                  })
                                }
                              />
                              <div className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setSelectedPhoto({
                                      url: c.cniVersoUrl,
                                      title: 'CNI Face VERSO',
                                      clientName: c.fullName,
                                    })
                                  }
                                  className="p-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-lg cursor-pointer"
                                  title="Agrandir"
                                >
                                  <ZoomIn className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => triggerDownload(c.cniVersoUrl, 'CNI_Face_Verso', c.fullName)}
                                  className="p-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold shadow-lg cursor-pointer"
                                  title="Télécharger localement"
                                >
                                  <Download className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="h-32 rounded-xl border border-dashed border-slate-800 bg-slate-900/30 flex flex-col items-center justify-center text-slate-600 text-[11px] p-2 text-center">
                              <ImageIcon className="w-6 h-6 mb-1 text-slate-700" />
                              <span>Photo Verso non fournie</span>
                            </div>
                          )}

                          {c.cniVersoUrl && (
                            <div className="flex items-center gap-1.5 pt-1">
                              <button
                                type="button"
                                onClick={() =>
                                  setSelectedPhoto({
                                    url: c.cniVersoUrl,
                                    title: 'CNI Face VERSO',
                                    clientName: c.fullName,
                                  })
                                }
                                className="flex-1 py-1.5 text-[10px] font-bold rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center gap-1 cursor-pointer border border-slate-800"
                              >
                                <Eye className="w-3 h-3 text-amber-400" />
                                <span>Agrandir</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => triggerDownload(c.cniVersoUrl, 'CNI_Face_Verso', c.fullName)}
                                className="flex-1 py-1.5 text-[10px] font-bold rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 flex items-center justify-center gap-1 cursor-pointer border border-emerald-500/20"
                              >
                                <Download className="w-3 h-3" />
                                <span>Enregistrer</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ADMIN ACTIONS BAR FOR CLIENT */}
                  <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
                    {c.accountStatus !== 'active' && c.accountStatus !== 'approved' ? (
                      <button
                        type="button"
                        onClick={() => handleClientAction(c.id, 'approve')}
                        disabled={actionLoading}
                        className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Approuver & Activer le Client</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleClientAction(c.id, 'suspend')}
                        disabled={actionLoading}
                        className="flex-1 py-2.5 px-4 rounded-xl bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 font-bold text-xs flex items-center justify-center gap-2 border border-orange-500/30 cursor-pointer"
                      >
                        <AlertTriangle className="w-4 h-4" />
                        <span>Suspendre le Compte</span>
                      </button>
                    )}

                    {c.accountStatus !== 'rejected' && c.accountStatus !== 'active' && (
                      <button
                        type="button"
                        onClick={() => setRejectModalUser({ id: c.id, name: c.fullName || 'Client' })}
                        disabled={actionLoading}
                        className="py-2.5 px-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold text-xs flex items-center justify-center gap-1.5 border border-red-500/20 cursor-pointer"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Rejeter avec Motif</span>
                      </button>
                    )}

                    {c.accountStatus === 'suspended' && (
                      <button
                        type="button"
                        onClick={() => handleClientAction(c.id, 'reactivate')}
                        disabled={actionLoading}
                        className="py-2.5 px-3 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 font-bold text-xs flex items-center justify-center gap-1.5 border border-cyan-500/30 cursor-pointer"
                      >
                        <RefreshCw className="w-4 h-4" />
                        <span>Réactiver</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* MODALE REJET AVEC MOTIF */}
      {rejectModalUser && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="max-w-lg w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2 text-red-400">
                <XCircle className="w-5 h-5" />
                <h3 className="font-extrabold text-white text-base">Rejeter l'inscription du client</h3>
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
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
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
                placeholder="ex: Merci de télécharger une photo bien lisible de votre CNIB (Recto & Verso)..."
                className="w-full p-3 bg-slate-950 border border-slate-800 rounded-2xl text-xs text-white placeholder-slate-500 focus:ring-2 focus:ring-red-500 outline-none"
              />
            </div>

            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  const finalReason = customReason.trim() || rejectReason || "Document non conforme ou informations incomplètes.";
                  handleClientAction(rejectModalUser.id, 'reject', finalReason);
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

      {/* MODALE LIGHTBOX PHOTO CLIENT */}
      {selectedPhoto && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="max-w-4xl w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-extrabold text-white text-base">{selectedPhoto.title}</h3>
                <p className="text-xs text-slate-400">
                  Client : <strong className="text-amber-400">{selectedPhoto.clientName}</strong>
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => triggerDownload(selectedPhoto.url, selectedPhoto.title, selectedPhoto.clientName)}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold text-xs rounded-xl flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Enregistrer l'image</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedPhoto(null)}
                  className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white border border-slate-700 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto flex items-center justify-center p-3 rounded-2xl bg-slate-950 border border-slate-800 min-h-[350px]">
              <img
                src={selectedPhoto.url}
                alt={selectedPhoto.title}
                className="max-h-[65vh] w-auto max-w-full object-contain rounded-xl shadow-2xl"
              />
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800">
              <span>Photo d'identité client en haute résolution pour vérification KYC.</span>
              <button
                type="button"
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

