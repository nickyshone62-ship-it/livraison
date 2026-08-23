'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Users,
  User,
  Truck,
  Package,
  AlertCircle,
  CheckCircle2,
  XCircle,
  MapPin,
  DollarSign,
  FileText,
  History,
  TrendingUp,
  Settings,
  Sparkles,
  Bell,
} from 'lucide-react';

export default function AdminDashboard() {
  const [session, setSession] = useState<any>(null);
  const [adminPinCode, setAdminPinCode] = useState('');
  const [pinError, setPinError] = useState('');

  const [stats, setStats] = useState<any>(null);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [zones, setZones] = useState<any[]>([]);
  const [disputes, setDisputes] = useState<any[]>([]);
  const [adminDeliveries, setAdminDeliveries] = useState<any[]>([]);
  const [adminPayments, setAdminPayments] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [driverFee, setDriverFee] = useState('5000');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'kyc' | 'users' | 'payments' | 'deliveries' | 'pricing' | 'zones' | 'disputes' | 'audit'>('users');

  // Dynamic pricing form state
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [editingPrice, setEditingPrice] = useState('');

  // Zone creation form state
  const [newZoneName, setNewZoneName] = useState('');
  const [newZonePrice, setNewZonePrice] = useState('2000');
  const [newZoneQuartiers, setNewZoneQuartiers] = useState('');

  const formatDuration = (startStr?: string, endStr?: string) => {
    if (!startStr || !endStr) return 'En cours...';
    const start = new Date(startStr).getTime();
    const end = new Date(endStr).getTime();
    const diffMs = Math.max(0, end - start);
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffSecs = Math.floor((diffMs % (1000 * 60)) / 1000);
    if (diffMins >= 60) {
      const hours = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      return `${hours}h ${mins}min`;
    }
    return `${diffMins} min ${diffSecs} s`;
  };

  const fetchAdminData = async () => {
    try {
      const meRes = await fetch('/api/auth/me');
      if (meRes.ok) {
        const meData = await meRes.json();
        setSession(meData.user);
      } else {
        setSession(null);
      }

      const statsRes = await fetch('/api/admin/stats');
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.stats);
      }

      const usersRes = await fetch('/api/admin/users');
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setAllUsers(usersData.users || []);
      }

      const driversRes = await fetch('/api/admin/drivers');
      if (driversRes.ok) {
        const driversData = await driversRes.json();
        setDrivers(driversData.drivers || []);
      }

      const payRes = await fetch('/api/admin/payments');
      if (payRes.ok) {
        const payData = await payRes.json();
        setAdminPayments(payData.payments || []);
      }

      const delivRes = await fetch('/api/deliveries');
      if (delivRes.ok) {
        const delivData = await delivRes.json();
        setAdminDeliveries(delivData.deliveries || []);
      }

      const subRes = await fetch('/api/admin/subscriptions');
      if (subRes.ok) {
        const subData = await subRes.json();
        setPlans(subData.plans || []);
        setDriverFee(subData.driverFeeFcfa || '5000');
      }

      const zonesRes = await fetch('/api/admin/zones');
      if (zonesRes.ok) {
        const zonesData = await zonesRes.json();
        setZones(zonesData.zones || []);
      }

      const dispRes = await fetch('/api/admin/disputes');
      if (dispRes.ok) {
        const dispData = await dispRes.json();
        setDisputes(dispData.disputes || []);
      }

      const logsRes = await fetch('/api/admin/audit-logs');
      if (logsRes.ok) {
        const logsData = await logsRes.json();
        setAuditLogs(logsData.auditLogs || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
    const interval = setInterval(fetchAdminData, 10000);
    return () => clearInterval(interval);
  }, []);

  const [selectedDriverForModal, setSelectedDriverForModal] = useState<any>(null);

  const handleDriverKycAction = async (driverId: string, action: 'APPROVE' | 'REJECT' | 'SUSPEND' | 'START_VERIFICATION' | 'SET_PENDING') => {
    const notes = action === 'REJECT' ? prompt('Motif du rejet du dossier (sera affiché au livreur) :') : '';
    if (action === 'REJECT' && notes === null) return;

    try {
      const res = await fetch('/api/admin/drivers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driverId, action, reviewNotes: notes }),
      });

      if (res.ok) {
        alert(`Statut du livreur mis à jour avec succès (${action}) !`);
        fetchAdminData();
        if (selectedDriverForModal?.id === driverId) {
          setSelectedDriverForModal(null);
        }
      } else {
        const data = await res.json();
        alert(data.error || 'Erreur');
      }
    } catch (e) {
      alert('Erreur réseau');
    }
  };

  const handleSavePlanPrice = async (planId: string) => {
    try {
      const res = await fetch('/api/admin/subscriptions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, priceFcfa: parseInt(editingPrice) }),
      });

      if (res.ok) {
        setEditingPlanId(null);
        alert('Tarif d\'abonnement mis à jour en base de données !');
        fetchAdminData();
      }
    } catch (e) {
      alert('Erreur réseau');
    }
  };

  const handleSaveDriverFee = async () => {
    try {
      const res = await fetch('/api/admin/subscriptions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driverVerificationFeeFcfa: parseInt(driverFee) }),
      });

      if (res.ok) {
        alert('Frais uniques d\'inscription livreur mis à jour !');
        fetchAdminData();
      }
    } catch (e) {
      alert('Erreur réseau');
    }
  };

  const handleAdminPaymentAction = async (paymentId: string, action: 'APPROVE' | 'REJECT') => {
    try {
      const res = await fetch('/api/admin/payments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId, action }),
      });

      const data = await res.json();
      if (res.ok) {
        alert(data.message || 'Action exécutée avec succès !');
        fetchAdminData();
      } else {
        alert(data.error || 'Erreur lors de l\'action');
      }
    } catch (e) {
      alert('Erreur réseau');
    }
  };

  const handleCreateZone = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/zones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newZoneName,
          associatedQuartiers: newZoneQuartiers,
        }),
      });

      if (res.ok) {
        setNewZoneName('');
        setNewZoneQuartiers('');
        alert('Nouvelle zone créée !');
        fetchAdminData();
      }
    } catch (e) {
      alert('Erreur réseau');
    }
  };

  const handleResolveDispute = async (disputeId: string, status: 'RESOLU' | 'REJETE') => {
    const notes = prompt('Notes de résolution du litige par l\'administrateur :');
    if (notes === null) return;

    try {
      const res = await fetch('/api/admin/disputes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ disputeId, status, resolutionNotes: notes }),
      });

      if (res.ok) {
        alert(`Litige marqué comme ${status} !`);
        fetchAdminData();
      }
    } catch (e) {
      alert('Erreur réseau');
    }
  };

  const handleUpdateUserApproval = async (userId: string, action: 'APPROVE' | 'REJECT') => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action }),
      });
      if (res.ok) {
        alert(action === 'APPROVE' ? '✅ Compte utilisateur approuvé et validé avec succès !' : '⚠️ Statut de l\'utilisateur mis à jour');
        fetchAdminData();
      } else {
        const data = await res.json();
        alert(data.error || 'Erreur lors de la mise à jour');
      }
    } catch (e) {
      alert('Erreur réseau');
    }
  };

  const handleVerifyAdminPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPinCode.trim() === 'Nick2004') {
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: '+226 06 88 73 30', password: 'Nick2004' }),
        });
        if (res.ok) {
          fetchAdminData();
        } else {
          setPinError('Erreur de validation du code administrateur');
        }
      } catch (err) {
        setPinError('Erreur réseau');
      }
    } else {
      setPinError('⚠️ Code Administrateur Incorrect ! Veuillez vérifier votre code secret.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F0FDFB] gap-4">
        <div className="w-12 h-12 border-4 border-[#009688] border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-black text-[#004D40] uppercase tracking-wider">Chargement Espace Administrateur...</span>
      </div>
    );
  }

  // ADMIN SECURITY CODE GATE
  if (!session || session.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#004D40] via-teal-950 to-[#004D40] text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white/10 backdrop-blur-xl border-2 border-white/20 p-8 rounded-3xl shadow-2xl space-y-6 text-center">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-r from-amber-400 via-orange-500 to-amber-600 flex items-center justify-center shadow-2xl border-4 border-white animate-pulse">
            <ShieldCheck className="w-10 h-10 text-slate-950" />
          </div>

          <div className="space-y-2">
            <span className="px-3 py-1 bg-amber-400/20 text-amber-300 border border-amber-400/40 rounded-full text-[10px] font-black uppercase tracking-widest">
              🔒 Espace Administrateur Protégé
            </span>
            <h2 className="text-2xl font-black uppercase tracking-wide text-white">
              Vérification Code Sécurité
            </h2>
            <p className="text-xs text-teal-200 font-bold leading-relaxed">
              Veuillez entrer votre Code de Sécurité Administrateur pour débloquer l'accès au Panneau Administrateur.
            </p>
          </div>

          <form onSubmit={handleVerifyAdminPin} className="space-y-4">
            <div>
              <input
                type="password"
                required
                value={adminPinCode}
                onChange={(e) => {
                  setAdminPinCode(e.target.value);
                  setPinError('');
                }}
                placeholder="Entrez votre Code Secret..."
                className="w-full text-center text-xl font-black tracking-widest px-4 py-4 bg-white text-slate-950 rounded-2xl outline-none border-4 border-amber-400 focus:ring-4 focus:ring-amber-400/40 shadow-inner placeholder:text-slate-400 placeholder:tracking-normal placeholder:text-xs"
              />
            </div>

            {pinError && (
              <div className="p-3 bg-red-600/30 border border-red-400 text-red-100 text-xs font-black rounded-xl animate-shake">
                {pinError}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-4 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black rounded-2xl text-xs sm:text-sm shadow-xl shadow-amber-500/30 transition-all cursor-pointer uppercase tracking-wider border-2 border-white flex items-center justify-center gap-2"
            >
              <span>🔓 Déverrouiller l'Espace Administrateur</span>
            </button>
          </form>

          <div className="pt-3 text-[11px] text-teal-200/90 font-bold border-t border-white/10 flex items-center justify-center gap-1.5">
            <span>🛡️ Accès Restreint Réservé à la Direction</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#00E5D9] via-[#00B4D8] to-[#009688] border-4 border-white text-[#004D40] shadow-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5 text-[#004D40] text-xs font-black uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-[#004D40]" />
            <span className="bg-white/80 px-3 py-0.5 rounded-full border border-white/60 shadow-xs">Panneau d'Administration Central</span> • <span>Ouagadougou 🇧🇫</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#004D40] tracking-tight">LivraisonOuaga Administration</h1>
          <p className="text-xs text-[#004D40]/90 font-bold mt-1">
            Contrôle des livreurs KYC, abonnements dynamiques, litiges et journal d'audit en temps réel.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="px-4 py-2 rounded-2xl bg-white/90 border-2 border-white text-xs font-black text-[#004D40] shadow-md">
            🟢 Serveur : Actif (Ouagadougou DB)
          </span>
        </div>
      </div>

      {/* PENDING USERS REGISTRATION ALERT BANNER */}
      {allUsers.filter(u => !u.isActive).length > 0 && (
        <div className="p-5 bg-gradient-to-r from-amber-500 via-amber-600 to-orange-500 text-slate-950 rounded-2xl shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-2 border-white animate-pulse">
          <div className="flex items-center gap-3">
            <Bell className="w-8 h-8 text-slate-950 shrink-0" />
            <div>
              <h3 className="font-black text-sm uppercase">📢 NOUVELLES INSCRIPTIONS EN ATTENTE D'APPROBATION !</h3>
              <p className="text-xs font-bold text-slate-900 mt-0.5">
                {allUsers.filter(u => !u.isActive).length} utilisateur(s) (Boutiques, Livreurs, Clients) attendent la validation administrative de leur compte.
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('users')}
            className="px-5 py-2.5 bg-slate-950 text-white font-black rounded-xl text-xs shadow-md shrink-0 cursor-pointer uppercase tracking-wider hover:bg-slate-800"
          >
            👥 Approuver les comptes ({allUsers.filter(u => !u.isActive).length}) ↗
          </button>
        </div>
      )}

      {/* PENDING PAYMENTS ALERT BANNER */}
      {adminPayments.filter(p => p.status === 'PENDING').length > 0 && (
        <div className="p-5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-slate-950 rounded-2xl shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-2 border-white animate-pulse">
          <div className="flex items-center gap-3">
            <Bell className="w-8 h-8 text-slate-950 shrink-0" />
            <div>
              <h3 className="font-black text-sm uppercase">📢 PAIEMENTS D'ABONNEMENT EN ATTENTE DE VALIDATION !</h3>
              <p className="text-xs font-bold text-slate-900 mt-0.5">
                {adminPayments.filter(p => p.status === 'PENDING').length} utilisateur(s) ont payé leur abonnement mensuel (1 000 FCFA Livreur / 1 000 FCFA Boutique).
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('payments')}
            className="px-5 py-2.5 bg-slate-950 text-white font-black rounded-xl text-xs shadow-md shrink-0 cursor-pointer uppercase tracking-wider hover:bg-slate-800"
          >
            💳 Valider les paiements ({adminPayments.filter(p => p.status === 'PENDING').length}) ↗
          </button>
        </div>
      )}

      {/* Global Realtime Statistics */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
          <div className="bg-white p-4 rounded-2xl border-2 border-teal-100 shadow-sm space-y-1">
            <span className="text-[11px] text-teal-800 font-extrabold uppercase">Utilisateurs</span>
            <div className="text-2xl font-black text-[#004D40]">{stats.totalUsers}</div>
          </div>
          <div className="bg-white p-4 rounded-2xl border-2 border-teal-100 shadow-sm space-y-1">
            <span className="text-[11px] text-teal-800 font-extrabold uppercase">Livreurs Vérifiés</span>
            <div className="text-2xl font-black text-[#009688]">{stats.verifiedDrivers}</div>
          </div>
          <div className="bg-white p-4 rounded-2xl border-2 border-teal-100 shadow-sm space-y-1">
            <span className="text-[11px] text-amber-800 font-extrabold uppercase">KYC En Attente</span>
            <div className="text-2xl font-black text-amber-600">{stats.pendingDrivers}</div>
          </div>
          <div className="bg-white p-4 rounded-2xl border-2 border-teal-100 shadow-sm space-y-1">
            <span className="text-[11px] text-blue-800 font-extrabold uppercase">Livraisons Réussies</span>
            <div className="text-2xl font-black text-blue-600">{stats.completedDeliveries}</div>
          </div>
          <div className="bg-white p-4 rounded-2xl border-2 border-teal-100 shadow-sm space-y-1">
            <span className="text-[11px] text-red-800 font-extrabold uppercase">Litiges Ouverts</span>
            <div className="text-2xl font-black text-red-600">{stats.openDisputes}</div>
          </div>
          <div className="bg-white p-4 rounded-2xl border-2 border-teal-100 shadow-sm space-y-1">
            <span className="text-[11px] text-purple-800 font-extrabold uppercase">Volume Total FCFA</span>
            <div className="text-xl font-black text-purple-700">{stats.totalVolumeFcfa} FCFA</div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b-2 border-teal-200 gap-3 font-black text-xs sm:text-sm overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'users' ? 'bg-[#009688] text-white shadow-md' : 'bg-white text-[#004D40] border border-teal-200 hover:bg-teal-50'
          }`}
        >
          <User className="w-4 h-4" /> Validation Inscriptions ({allUsers.filter(u => !u.isActive).length})
        </button>

        <button
          onClick={() => setActiveTab('kyc')}
          className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'kyc' ? 'bg-[#009688] text-white shadow-md' : 'bg-white text-[#004D40] border border-teal-200 hover:bg-teal-50'
          }`}
        >
          <Truck className="w-4 h-4" /> Validation KYC Livreurs ({drivers.length})
        </button>

        <button
          onClick={() => setActiveTab('payments')}
          className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'payments' ? 'bg-[#009688] text-white shadow-md' : 'bg-white text-[#004D40] border border-teal-200 hover:bg-teal-50'
          }`}
        >
          <DollarSign className="w-4 h-4" /> Validation Abonnements ({adminPayments.filter(p => p.status === 'PENDING').length})
        </button>

        <button
          onClick={() => setActiveTab('deliveries')}
          className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'deliveries' ? 'bg-[#009688] text-white shadow-md' : 'bg-white text-[#004D40] border border-teal-200 hover:bg-teal-50'
          }`}
        >
          <Package className="w-4 h-4" /> Suivi Livraisons ({adminDeliveries.length})
        </button>

        <button
          onClick={() => setActiveTab('pricing')}
          className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'pricing' ? 'bg-[#009688] text-white shadow-md' : 'bg-white text-[#004D40] border border-teal-200 hover:bg-teal-50'
          }`}
        >
          <DollarSign className="w-4 h-4" /> Tarifs Dynamiques
        </button>

        <button
          onClick={() => setActiveTab('zones')}
          className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'zones' ? 'bg-[#009688] text-white shadow-md' : 'bg-white text-[#004D40] border border-teal-200 hover:bg-teal-50'
          }`}
        >
          <MapPin className="w-4 h-4" /> Zones & Quartiers
        </button>

        <button
          onClick={() => setActiveTab('disputes')}
          className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'disputes' ? 'bg-red-600 text-white shadow-md' : 'bg-white text-red-700 border border-red-200 hover:bg-red-50'
          }`}
        >
          <AlertCircle className="w-4 h-4" /> Litiges ({disputes.length})
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'audit' ? 'bg-slate-800 text-white shadow-md' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <History className="w-4 h-4" /> Journal d'Audit
        </button>
      </div>

      {/* TAB 0: USER REGISTRATION APPROVALS */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-3xl border-2 border-teal-100 p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-teal-100 pb-4">
            <div>
              <h2 className="text-xl font-black text-[#004D40] flex items-center gap-2">
                👥 Validation des Inscriptions Utilisateurs ({allUsers.length})
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Approuvez les demandes d'inscription pour autoriser l'accès des comptes à la plateforme LivraisonOuaga.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-amber-100 text-amber-900 border border-amber-300 rounded-full text-xs font-black">
                {allUsers.filter(u => !u.isActive).length} En Attente d'Approbation
              </span>
              <span className="px-3 py-1 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-full text-xs font-black">
                {allUsers.filter(u => u.isActive).length} Approuvés
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {allUsers.length === 0 ? (
              <p className="text-xs text-slate-500 italic p-4 text-center">Aucune inscription enregistrée.</p>
            ) : (
              allUsers.map((u) => (
                <div key={u.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-teal-300 transition-all">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-black text-sm text-[#004D40]">{u.profile?.fullName || u.phone}</span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-teal-100 text-teal-800 border border-teal-200">
                        {u.role}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        u.isActive ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-amber-100 text-amber-800 border border-amber-300 animate-pulse'
                      }`}>
                        {u.isActive ? '✅ COMPTE VALIDÉ' : '⏳ EN ATTENTE DE VALIDATION ADMIN'}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 font-medium">
                      📱 Téléphone : <span className="font-bold text-slate-800">{u.phone}</span> • Inscrit le : <span className="font-bold text-slate-800">{new Date(u.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {!u.isActive ? (
                      <button
                        onClick={() => handleUpdateUserApproval(u.id, 'APPROVE')}
                        className="px-4 py-2 bg-[#009688] hover:bg-[#00796B] text-white font-black rounded-xl text-xs shadow-md transition-all cursor-pointer uppercase tracking-wider flex items-center gap-1.5 border border-teal-300"
                      >
                        <CheckCircle2 className="w-4 h-4" /> Approuver l'Inscription
                      </button>
                    ) : (
                      <button
                        onClick={() => handleUpdateUserApproval(u.id, 'REJECT')}
                        className="px-3.5 py-2 bg-slate-200 hover:bg-red-100 text-slate-700 hover:text-red-700 font-bold rounded-xl text-xs transition-all cursor-pointer"
                      >
                        🚫 Désactiver le Compte
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 1: DRIVER KYC VALIDATION */}
      {activeTab === 'kyc' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-900">Gestion des Livreurs & Vérification des Documents</h2>
            <span className="text-xs text-slate-500 font-bold">Total : {drivers.length} livreur(s)</span>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold">
                  <tr>
                    <th className="p-4">Livreur</th>
                    <th className="p-4">Date d'Inscription</th>
                    <th className="p-4">Téléphone</th>
                    <th className="p-4">CNIB / Passeport</th>
                    <th className="p-4">Véhicule</th>
                    <th className="p-4">Zones Desservies</th>
                    <th className="p-4">Statut KYC</th>
                    <th className="p-4 text-right">Actions Admin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {drivers.map((drv) => (
                    <tr key={drv.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 font-bold text-slate-900 flex items-center gap-2">
                        {drv.user?.profile?.avatarUrl && (
                          <img src={drv.user.profile.avatarUrl} alt="" className="w-7 h-7 rounded-full object-cover border border-slate-300" />
                        )}
                        <span>{drv.user?.profile?.fullName}</span>
                      </td>
                      <td className="p-4 font-semibold text-slate-600">
                        {drv.user?.createdAt ? new Date(drv.user.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Indéterminée'}
                      </td>
                      <td className="p-4 font-mono">{drv.user?.phone}</td>
                      <td className="p-4 font-mono font-bold text-slate-700">{drv.idCardNumber || 'Non renseigné'}</td>
                      <td className="p-4 font-semibold text-slate-700">
                        {drv.vehicles?.[0]?.vehicleType || 'MOTO'} ({drv.vehicles?.[0]?.brand || 'Yamaha'})
                      </td>
                      <td className="p-4 text-[#004D40] font-medium max-w-xs truncate">{drv.preferredZones || 'Ouagadougou'}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full font-black text-[10px] uppercase border ${
                          drv.verificationStatus === 'VERIFIE' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                          drv.verificationStatus === 'EN_VERIFICATION' ? 'bg-blue-100 text-blue-800 border-blue-300' :
                          drv.verificationStatus === 'REJETE' ? 'bg-red-100 text-red-800 border-red-300' :
                          drv.verificationStatus === 'SUSPENDU' ? 'bg-slate-200 text-slate-800 border-slate-400' :
                          'bg-amber-100 text-amber-800 border-amber-300'
                        }`}>
                          {drv.verificationStatus}
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <button
                          onClick={() => setSelectedDriverForModal(drv)}
                          className="px-3 py-1.5 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-xl text-xs shadow-xs"
                        >
                          🔍 Examiner Dossier
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB: DELIVERIES & OTP VERIFICATION MONITORING */}
      {activeTab === 'deliveries' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Suivi Administrateur des Livraisons & Saisie des Codes OTP</h2>
              <p className="text-xs text-slate-500">Contrôle en direct de la saisie des codes de ramassage (Code 1) et de livraison finale (Code 2) par les livreurs.</p>
            </div>
            <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-3.5 py-1.5 rounded-full border border-emerald-300 shadow-xs">
              {adminDeliveries.length} course(s) au total
            </span>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 uppercase font-black tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Course / Tracking</th>
                    <th className="px-4 py-3">Client</th>
                    <th className="px-4 py-3">Livreur Désigné</th>
                    <th className="px-4 py-3">Code 1 : Récupération (Colis Ramassé)</th>
                    <th className="px-4 py-3">Code 2 : Confirmation (Livraison)</th>
                    <th className="px-4 py-3">Statut Global</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                  {adminDeliveries.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-400 italic">
                        Aucune course enregistrée dans le système pour le moment.
                      </td>
                    </tr>
                  ) : (
                    adminDeliveries.map((req) => {
                      const deliv = req.delivery;
                      const codes = deliv?.codes;
                      const isPickedUp = !!deliv?.pickedUpAt || req.status === 'EN_COURS_LIVRAISON' || req.status === 'LIVRE';
                      const isDelivered = !!deliv?.deliveredAt || req.status === 'LIVRE';

                      return (
                        <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3 font-mono font-bold text-emerald-700">
                            <div>{req.trackingNumber}</div>
                            <div className="text-[10px] text-slate-500 font-sans font-normal">{req.packageType}</div>
                          </td>

                          <td className="px-4 py-3">
                            <div className="font-bold text-slate-900">{req.customer?.profile?.fullName || 'Client'}</div>
                            <div className="text-[10px] text-slate-500">{req.customer?.phone}</div>
                          </td>

                          <td className="px-4 py-3">
                            {deliv?.driver ? (
                              <div>
                                <div className="font-bold text-slate-900">{deliv.driver.profile?.fullName}</div>
                                <div className="text-[10px] text-slate-500">{deliv.driver.phone}</div>
                              </div>
                            ) : (
                              <span className="text-slate-400 italic">Non attribué</span>
                            )}
                          </td>

                          {/* CODE 1: OTP RÉCUPÉRATION / RAMASSAGE */}
                          <td className="px-4 py-3">
                            {codes ? (
                              <div className="space-y-1">
                                <span className="font-mono text-sm font-black bg-amber-100 text-amber-900 px-2 py-0.5 rounded border border-amber-300">
                                  {codes.pickupCode}
                                </span>
                                <div>
                                  {isPickedUp ? (
                                    <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                                      ✓ SAISI ET VALIDÉ PAR LE LIVREUR
                                      {deliv?.pickedUpAt && ` (${new Date(deliv.pickedUpAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`}
                                    </span>
                                  ) : (
                                    <span className="text-[10px] font-bold text-amber-600 animate-pulse">
                                      ⏳ EN ATTENTE DE SAISIE PAR LE LIVREUR
                                    </span>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <span className="text-slate-400 text-[10px] italic">N/A</span>
                            )}
                          </td>

                          {/* CODE 2: OTP LIVRAISON FINALE */}
                          <td className="px-4 py-3">
                            {codes ? (
                              <div className="space-y-1">
                                <span className="font-mono text-sm font-black bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded border border-emerald-300">
                                  {codes.deliveryCode}
                                </span>
                                <div>
                                  {isDelivered ? (
                                    <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                                      ✓ LIVRAISON CONFIRMÉE
                                      {deliv?.deliveredAt && ` (${new Date(deliv.deliveredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`}
                                    </span>
                                  ) : (
                                    <span className="text-slate-400 text-[10px]">
                                      En cours de transport
                                    </span>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <span className="text-slate-400 text-[10px] italic">N/A</span>
                            )}
                          </td>

                          <td className="px-4 py-3">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border ${
                              req.status === 'LIVRE' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                              req.status === 'EN_COURS_LIVRAISON' ? 'bg-amber-100 text-amber-950 border-amber-300' :
                              req.status === 'LIVREUR_SELECTIONNE' ? 'bg-blue-100 text-blue-900 border-blue-300' : 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}>
                              {req.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* DRIVER DOSSIER INSPECTION MODAL */}
      {selectedDriverForModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                {selectedDriverForModal.user?.profile?.avatarUrl && (
                  <img src={selectedDriverForModal.user.profile.avatarUrl} alt="" className="w-12 h-12 rounded-full object-cover border-2 border-purple-500" />
                )}
                <div>
                  <h3 className="text-xl font-black text-slate-900">{selectedDriverForModal.user?.profile?.fullName}</h3>
                  <p className="text-xs text-slate-500">Téléphone : {selectedDriverForModal.user?.phone}</p>
                </div>
              </div>
              <button onClick={() => setSelectedDriverForModal(null)} className="text-slate-400 hover:text-slate-600 font-black text-xl">✕</button>
            </div>

            {/* Current Status Badge */}
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <span className="text-xs font-bold text-slate-600">Statut Actuel :</span>
              <span className="px-3 py-1 rounded-full text-xs font-black bg-purple-100 text-purple-900 border border-purple-300">
                {selectedDriverForModal.verificationStatus}
              </span>
            </div>

            {/* Informations du Livreur */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-slate-50 rounded-2xl space-y-2 border border-slate-100">
                <div className="font-bold text-slate-500 uppercase text-[10px]">🪪 Pièce d'Identité</div>
                <div><strong>Numéro CNIB/Passeport :</strong> {selectedDriverForModal.idCardNumber || 'Non renseigné'}</div>
                <div><strong>Zones Desservies :</strong> {selectedDriverForModal.preferredZones || 'Non renseigné'}</div>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl space-y-2 border border-slate-100">
                <div className="font-bold text-slate-500 uppercase text-[10px]">🏍️ Informations Véhicule</div>
                <div><strong>Type :</strong> {selectedDriverForModal.vehicles?.[0]?.vehicleType || 'MOTO'}</div>
                <div><strong>Marque / Modèle :</strong> {selectedDriverForModal.vehicles?.[0]?.brand || ''} {selectedDriverForModal.vehicles?.[0]?.model || ''}</div>
                <div><strong>Immatriculation :</strong> {selectedDriverForModal.vehicles?.[0]?.licensePlate || 'Non renseigné'}</div>
                <div><strong>Couleur :</strong> {selectedDriverForModal.vehicles?.[0]?.color || 'Non renseigné'}</div>
              </div>
            </div>

            {/* Documents Transmis */}
            <div className="space-y-3">
              <h4 className="font-bold text-xs text-slate-700 uppercase">Documents Transmis ({selectedDriverForModal.documents?.length || 0})</h4>
              {selectedDriverForModal.documents?.length ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedDriverForModal.documents.map((doc: any) => (
                    <a
                      key={doc.id}
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="p-3 rounded-2xl bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 font-bold text-xs flex items-center justify-between transition-colors"
                    >
                      <span>📄 {doc.docType}</span>
                      <span className="text-[10px] underline">Ouvrir Document ↗</span>
                    </a>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-amber-50 text-amber-900 rounded-2xl text-xs font-medium">
                  Aucun fichier scanné n'a été transmis par ce livreur lors de son inscription.
                </div>
              )}
            </div>

            {/* Admin Action Buttons for Statuts: EN_ATTENTE, EN_VERIFICATION, VERIFIE, REJETE, SUSPENDU */}
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <h4 className="font-bold text-xs text-slate-700 uppercase">Changer le Statut du Livreur</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <button
                  onClick={() => handleDriverKycAction(selectedDriverForModal.id, 'APPROVE')}
                  className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-xs"
                >
                  ✓ Valider (VERIFIE)
                </button>
                <button
                  onClick={() => handleDriverKycAction(selectedDriverForModal.id, 'START_VERIFICATION')}
                  className="py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-xs"
                >
                  🔍 En Examen (EN_VERIFICATION)
                </button>
                <button
                  onClick={() => handleDriverKycAction(selectedDriverForModal.id, 'REJECT')}
                  className="py-2.5 px-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs shadow-xs"
                >
                  ✕ Rejeter (REJETE)
                </button>
                <button
                  onClick={() => handleDriverKycAction(selectedDriverForModal.id, 'SUSPEND')}
                  className="py-2.5 px-3 bg-slate-700 hover:bg-slate-800 text-white font-bold rounded-xl text-xs shadow-xs"
                >
                  ⛔ Suspendre (SUSPENDU)
                </button>
                <button
                  onClick={() => handleDriverKycAction(selectedDriverForModal.id, 'SET_PENDING')}
                  className="py-2.5 px-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs shadow-xs"
                >
                  ⏳ Remettre EN_ATTENTE
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* TAB PAYMENTS: VALIDATION PAIEMENTS & ABONNEMENTS */}
      {activeTab === 'payments' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-black text-slate-900">Validations des Paiements & Abonnements Mensuels</h2>
              <p className="text-xs text-slate-500">
                Vérifiez la réception Mobile Money et validez les abonnements des boutiques (1 000 FCFA) et des livreurs (500 FCFA).
              </p>
            </div>
            <span className="text-xs font-black bg-amber-100 text-amber-900 border border-amber-300 px-3 py-1 rounded-full">
              ⏳ {adminPayments.filter(p => p.status === 'PENDING').length} En Attente de Validation
            </span>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold">
                  <tr>
                    <th className="p-4">Utilisateur & Rôle</th>
                    <th className="p-4">Date d'Inscription</th>
                    <th className="p-4">Téléphone</th>
                    <th className="p-4">Montant & Mode</th>
                    <th className="p-4">Référence Tx</th>
                    <th className="p-4">Statut</th>
                    <th className="p-4 text-right">Action Administrateur</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {adminPayments.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400 font-medium">
                        Aucun paiement d'abonnement n'a été soumis pour le moment.
                      </td>
                    </tr>
                  ) : (
                    adminPayments.map((pay: any) => {
                      const isPending = pay.status === 'PENDING';
                      const isCompleted = pay.status === 'COMPLETED';
                      return (
                        <tr key={pay.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-4 font-bold text-slate-900">
                            <div>{pay.user?.profile?.fullName || pay.user?.phone}</div>
                            <span className="text-[10px] font-black text-purple-700 uppercase bg-purple-100 px-2 py-0.5 rounded">
                              {pay.user?.role === 'LIVREUR' ? '🏍️ LIVREUR' : '🏪 BOUTIQUE'}
                            </span>
                          </td>
                          <td className="p-4 font-medium text-slate-600">
                            {pay.user?.createdAt ? new Date(pay.user.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
                          </td>
                          <td className="p-4 font-mono font-bold text-slate-800">{pay.user?.phone}</td>
                          <td className="p-4 font-extrabold text-emerald-800">
                            <span className="text-sm">{pay.amountFcfa} FCFA</span>
                            <div className="text-[10px] font-bold text-slate-500 uppercase">{pay.paymentMethod}</div>
                          </td>
                          <td className="p-4 font-mono text-xs text-slate-500">{pay.transactionReference}</td>
                          <td className="p-4">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border ${
                              isPending ? 'bg-amber-100 text-amber-900 border-amber-300' :
                              isCompleted ? 'bg-emerald-100 text-emerald-900 border-emerald-300' :
                              'bg-red-100 text-red-900 border-red-300'
                            }`}>
                              {isPending ? '⏳ EN ATTENTE ADMIN' : isCompleted ? '✓ VALIDÉ (30J)' : '✕ REJETÉ'}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            {isPending ? (
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleAdminPaymentAction(pay.id, 'APPROVE')}
                                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-xs cursor-pointer"
                                >
                                  ✓ Valider & Activer
                                </button>
                                <button
                                  onClick={() => handleAdminPaymentAction(pay.id, 'REJECT')}
                                  className="px-2.5 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
                                >
                                  ✕ Rejeter
                                </button>
                              </div>
                            ) : (
                              <span className="text-[11px] text-slate-400 font-semibold">Traitée</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 1.5: SUPERVISED DELIVERIES & GPS LIVE TRACKING */}
      {activeTab === 'deliveries' && (
        <div className="bg-white rounded-3xl border-2 border-teal-100 p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-teal-100 pb-4">
            <div>
              <h2 className="text-xl font-black text-[#004D40] flex items-center gap-2">
                📦 Central Suivi Administrateur des Demandes & Livraisons ({adminDeliveries.length})
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Contrôle en temps réel : propositions des livreurs, choix client, verrouillage tâche unique, chronomètre de récupération/remise et carte GPS.
              </p>
            </div>
            <span className="px-3 py-1 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-full text-xs font-black">
              👑 Super-Vue Admin Active
            </span>
          </div>

          <div className="space-y-6">
            {adminDeliveries.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-xs italic bg-slate-50 rounded-2xl border border-slate-200">
                Aucune demande de livraison enregistrée sur la plateforme.
              </div>
            ) : (
              adminDeliveries.map((req) => {
                const selectedProposal = req.proposals?.find((p: any) => p.status === 'ACCEPTED') || req.proposals?.[0];
                const selectedDriver = req.delivery?.driver || selectedProposal?.driver;
                const isFinished = req.status === 'LIVRE';
                const isInProgress = req.status === 'EN_COURS_LIVRAISON' || req.status === 'LIVREUR_SELECTIONNE';

                return (
                  <div key={req.id} className="bg-slate-50 rounded-3xl border-2 border-slate-200 p-5 space-y-5 shadow-sm hover:border-teal-400 transition-all">
                    
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-slate-200">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-base font-black text-[#004D40] bg-teal-100 px-3 py-0.5 rounded-full border border-teal-300">
                            {req.trackingNumber}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-slate-200 text-slate-800">
                            {req.packageType}
                          </span>
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-black border ${
                            req.urgencyLevel === 'URGENT' ? 'bg-red-100 text-red-800 border-red-300' : 'bg-blue-100 text-blue-800 border-blue-300'
                          }`}>
                            {req.urgencyLevel}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-slate-700 mt-1">
                          Client : <span className="text-slate-900">{req.customer?.profile?.fullName || req.customer?.phone}</span> ({req.customer?.phone})
                        </p>
                      </div>

                      <span className={`px-3 py-1 rounded-full text-xs font-black border ${
                        req.status === 'LIVRE' ? 'bg-emerald-100 text-emerald-900 border-emerald-300' :
                        req.status === 'EN_COURS_LIVRAISON' ? 'bg-amber-100 text-amber-900 border-amber-300 animate-pulse' :
                        req.status === 'LIVREUR_SELECTIONNE' ? 'bg-blue-100 text-blue-900 border-blue-300' :
                        'bg-slate-200 text-slate-800 border-slate-300'
                      }`}>
                        Statut : {req.status}
                      </span>
                    </div>

                    {/* Points A / B & Destinataire Obligatoire */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                      <div className="p-3.5 bg-white rounded-2xl border border-teal-200 space-y-1">
                        <span className="font-black text-[10px] text-[#004D40] uppercase flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-emerald-600" /> Point A (Récupération) *
                        </span>
                        <div className="font-extrabold text-slate-900">{req.pickupAddress}</div>
                      </div>

                      <div className="p-3.5 bg-white rounded-2xl border border-teal-200 space-y-1">
                        <span className="font-black text-[10px] text-[#004D40] uppercase flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-blue-600" /> Point B (Destination Client) *
                        </span>
                        <div className="font-extrabold text-slate-900">{req.dropoffAddress}</div>
                      </div>

                      <div className="p-3.5 bg-white rounded-2xl border border-teal-200 space-y-1">
                        <span className="font-black text-[10px] text-[#004D40] uppercase flex items-center gap-1">
                          📱 Téléphone Destinataire (Obligatoire)
                        </span>
                        <div className="font-mono font-black text-emerald-700 text-sm">{req.recipientPhone || 'Non renseigné'}</div>
                        <div className="text-[10px] text-slate-500 font-semibold truncate">Contenu: {req.description}</div>
                      </div>
                    </div>

                    {/* Livreurs qui se proposent */}
                    <div className="space-y-2 p-4 bg-white rounded-2xl border border-slate-200">
                      <h4 className="text-xs font-black text-slate-800 uppercase flex items-center justify-between">
                        <span>🛵 Livreurs qui se proposent ({req.proposals?.length || 0})</span>
                        <span className="text-[10px] text-slate-500 font-bold">Propositions de prix</span>
                      </h4>

                      {req.proposals?.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                          {req.proposals.map((prop: any) => {
                            const isAccepted = prop.status === 'ACCEPTED';
                            return (
                              <div
                                key={prop.id}
                                className={`p-3 rounded-xl border text-xs space-y-1 ${
                                  isAccepted
                                    ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold'
                                    : 'bg-slate-50 border-slate-200 text-slate-700'
                                }`}
                              >
                                <div className="flex justify-between items-center">
                                  <span className="font-black">{prop.driver?.profile?.fullName || prop.driver?.phone}</span>
                                  <span className="font-mono font-black text-emerald-700">{prop.proposedPriceFcfa} FCFA</span>
                                </div>
                                <div className="text-[10px] text-slate-500">📱 Tél: {prop.driver?.phone}</div>
                                {isAccepted && (
                                  <span className="inline-block px-2 py-0.5 bg-emerald-600 text-white text-[9px] font-black rounded-md uppercase">
                                    👑 Retenu par le client
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500 italic">En attente de propositions de livreurs vérifiés...</p>
                      )}
                    </div>

                    {/* Livreur Choisi & Statut de Verrouillage Tâche Unique */}
                    {selectedDriver && (
                      <div className="p-4 bg-gradient-to-r from-emerald-900 to-teal-900 text-white rounded-2xl space-y-3 shadow-md">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                          <div>
                            <span className="text-[10px] font-black uppercase text-emerald-300 tracking-wider">
                              👑 Livreur sélectionné pour cette livraison :
                            </span>
                            <h4 className="text-sm font-black text-white">
                              {selectedDriver?.profile?.fullName || selectedDriver?.phone} (Tél: {selectedDriver?.phone})
                            </h4>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-black uppercase border ${
                            isInProgress ? 'bg-amber-400 text-slate-950 border-amber-200 animate-pulse' :
                            isFinished ? 'bg-emerald-400 text-slate-950 border-emerald-200' : 'bg-slate-200 text-slate-900'
                          }`}>
                            {isInProgress ? '🔒 OCCUPÉ — TÂCHE EN COURS (BLOCAGE AUTRES COURSES)' : '🟢 TÂCHE TERMINÉE'}
                          </span>
                        </div>

                        {/* CHRONOMÈTRES & MESURE DU TEMPS DE RÉCUPÉRATION ET DE REMISE */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-white/20 text-xs">
                          <div className="bg-white/10 p-2.5 rounded-xl border border-white/10">
                            <span className="text-[10px] text-emerald-200 font-bold block">⏱️ 1. Temps d'Aller (Récupération Point A) :</span>
                            <span className="font-mono font-black text-amber-300 text-sm">
                              {formatDuration(req.delivery?.startedAt || req.createdAt, req.delivery?.pickedUpAt)}
                            </span>
                          </div>

                          <div className="bg-white/10 p-2.5 rounded-xl border border-white/10">
                            <span className="text-[10px] text-emerald-200 font-bold block">⏱️ 2. Temps de Remise (Trajet vers Point B) :</span>
                            <span className="font-mono font-black text-cyan-300 text-sm">
                              {formatDuration(req.delivery?.pickedUpAt, req.delivery?.deliveredAt)}
                            </span>
                          </div>

                          <div className="bg-white/10 p-2.5 rounded-xl border border-white/10">
                            <span className="text-[10px] text-emerald-200 font-bold block">⏱️ Temps Total d'Exécution :</span>
                            <span className="font-mono font-black text-emerald-300 text-sm">
                              {formatDuration(req.delivery?.startedAt || req.createdAt, req.delivery?.deliveredAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* LIVE MAP GPS TRACKING */}
                    <div className="space-y-1.5 pt-1">
                      <span className="text-xs font-black text-[#004D40] uppercase flex items-center gap-1.5">
                        <Navigation className="w-4 h-4 text-emerald-600" /> Carte de Suivi GPS du Livreur en Direct (Point A ➔ Point B) :
                      </span>
                      <DeliveryMap
                        pickupAddress={req.pickupAddress}
                        dropoffAddress={req.dropoffAddress}
                        driverLocation={selectedDriver ? { lat: 12.3714, lng: -1.5197, address: 'Ouagadougou' } : undefined}
                      />
                    </div>

                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 2: DYNAMIC PRICING & SUBSCRIPTIONS */}
      {activeTab === 'pricing' && (
        <div className="space-y-8">
          
          {/* Driver Registration Fee Config */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-600" /> Frais uniques d'inscription & vérification Livreur
            </h3>
            <p className="text-xs text-slate-500">
              Règle du projet : Les livreurs ne paient AUCUN abonnement mensuel, uniquement des frais de vérification uniques configurables depuis ce panneau.
            </p>
            <div className="flex gap-3 items-center max-w-md">
              <input
                type="number"
                value={driverFee}
                onChange={(e) => setDriverFee(e.target.value)}
                className="px-3 py-2 text-sm border border-slate-300 rounded-xl font-bold text-emerald-700 outline-none w-full"
              />
              <span className="text-xs font-bold text-slate-500">FCFA</span>
              <button
                onClick={handleSaveDriverFee}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shrink-0"
              >
                Enregistrer
              </button>
            </div>
          </div>

          {/* Subscription Plans Config */}
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-900">Tarification des Abonnements Mensuels Clients</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {plans.map((plan) => (
                <div key={plan.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <div className="font-extrabold text-sm text-slate-900">{plan.name} ({plan.code})</div>
                  <div className="text-xs text-slate-500">{plan.description}</div>
                  
                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    <div className="text-xs font-bold text-slate-400">Prix Mensuel Actuel :</div>
                    {editingPlanId === plan.id ? (
                      <div className="flex gap-2">
                        <input
                          type="number"
                          value={editingPrice}
                          onChange={(e) => setEditingPrice(e.target.value)}
                          className="px-2 py-1 text-xs border border-slate-300 rounded-lg w-full font-bold"
                        />
                        <button
                          onClick={() => handleSavePlanPrice(plan.id)}
                          className="px-2 py-1 bg-emerald-600 text-white text-xs font-bold rounded-lg"
                        >
                          OK
                        </button>
                      </div>
                    ) : (
                      <div className="flex justify-between items-center">
                        <span className="text-xl font-black text-slate-900">{plan.priceFcfa} FCFA</span>
                        <button
                          onClick={() => {
                            setEditingPlanId(plan.id);
                            setEditingPrice(String(plan.priceFcfa));
                          }}
                          className="text-xs font-bold text-purple-600 hover:underline"
                        >
                          Modifier
                        </button>
                      </div>
                    )}
                  </div>

                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* TAB 3: ZONES & QUARTIERS DE OUAGADOUGOU */}
      {activeTab === 'zones' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-900">Gestion des Zones & Quartiers à Ouagadougou</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Create Zone Form */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-bold text-sm text-slate-900">Ajouter un Arrondissement & Quartiers</h3>
              <form onSubmit={handleCreateZone} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Arrondissement *</label>
                  <input
                    type="text"
                    required
                    value={newZoneName}
                    onChange={(e) => setNewZoneName(e.target.value)}
                    placeholder="ex: Arrondissement 12"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Quartier(s) *</label>
                  <input
                    type="text"
                    required
                    value={newZoneQuartiers}
                    onChange={(e) => setNewZoneQuartiers(e.target.value)}
                    placeholder="ex: Patte d'Oie, Dassasgho, Rimkiéta..."
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-xl text-xs cursor-pointer"
                >
                  Ajouter l'Arrondissement
                </button>
              </form>
            </div>

            {/* Zones List */}
            <div className="lg:col-span-2 space-y-3">
              {zones.map((z) => (
                <div key={z.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">{z.name}</h4>
                    <p className="text-xs text-slate-600 font-medium">Quartiers : {z.associatedQuartiers || 'Non renseignés'}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                      Ouagadougou 🇧🇫
                    </span>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
      )}

      {/* TAB 4: DISPUTES MANAGEMENT */}
      {activeTab === 'disputes' && (
        <div className="space-y-6">
          <h2 className="text-lg font-bold text-slate-900">Gestion des Litiges et Réclamations</h2>

          {disputes.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-500 text-xs">
              Aucun litige ouvert actuellement.
            </div>
          ) : (
            <div className="space-y-4">
              {disputes.map((disp) => (
                <div key={disp.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-mono text-xs font-bold text-red-600">{disp.disputeNumber}</span>
                      <h4 className="font-bold text-slate-900 text-sm">{disp.category}</h4>
                      <p className="text-xs text-slate-600 mt-1">"{disp.description}"</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800">
                      {disp.status}
                    </span>
                  </div>

                  <div className="text-xs text-slate-500 pt-2 border-t border-slate-100 flex justify-between items-center">
                    <span>Ouvert par : {disp.openedByUser?.profile?.fullName}</span>
                    <div className="space-x-2">
                      <button
                        onClick={() => handleResolveDispute(disp.id, 'RESOLU')}
                        className="px-3 py-1 bg-emerald-600 text-white font-bold rounded-lg text-xs"
                      >
                        Résoudre
                      </button>
                      <button
                        onClick={() => handleResolveDispute(disp.id, 'REJETE')}
                        className="px-3 py-1 bg-slate-600 text-white font-bold rounded-lg text-xs"
                      >
                        Rejeter
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: AUDIT LOGS */}
      {activeTab === 'audit' && (
        <div className="space-y-6">
          <h2 className="text-lg font-bold text-slate-900">Journal d'Audit des Actions Sensibles (`audit_logs`)</h2>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold">
                  <tr>
                    <th className="p-3">Horodatage</th>
                    <th className="p-3">Utilisateur / Admin</th>
                    <th className="p-3">Action</th>
                    <th className="p-3">Entité Cible</th>
                    <th className="p-3">Détails JSON</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50">
                      <td className="p-3 text-slate-500">{new Date(log.createdAt).toLocaleString('fr-FR')}</td>
                      <td className="p-3 font-sans font-bold">{log.user?.profile?.fullName || log.userId || 'Système'}</td>
                      <td className="p-3 font-bold text-purple-700">{log.action}</td>
                      <td className="p-3 text-slate-700">{log.targetEntity} ({log.targetId})</td>
                      <td className="p-3 text-slate-500 truncate max-w-xs">{log.detailsJson}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
