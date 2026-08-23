'use client';

import React, { useState, useEffect } from 'react';
import {
  Truck,
  ShieldCheck,
  Package,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  Lock,
  DollarSign,
  Star,
  Send,
  RefreshCw,
  TrendingUp,
  Navigation,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function DriverDashboard() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [openRequests, setOpenRequests] = useState<any[]>([]);
  const [myDeliveries, setMyDeliveries] = useState<any[]>([]);
  const [myProposals, setMyProposals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'available' | 'active' | 'proposals' | 'revenue'>('available');

  // Proposal modal state
  const [proposeRequestId, setProposeRequestId] = useState<string | null>(null);
  const [proposedPriceFcfa, setProposedPriceFcfa] = useState('2000');
  const [estimatedDurationMinutes, setEstimatedDurationMinutes] = useState('25');
  const [proposalComment, setProposalComment] = useState('');
  const [submittingProposal, setSubmittingProposal] = useState(false);

  // OTP Verification state
  const [otpCode, setOtpCode] = useState('');
  const [otpType, setOtpType] = useState<'PICKUP' | 'DELIVERY'>('PICKUP');
  const [verifyingOtpDeliveryId, setVerifyingOtpDeliveryId] = useState<string | null>(null);

  // Subscription Renewal & Tracker State
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [showTrackerModal, setShowTrackerModal] = useState(false);
  const [renewPaymentMethod, setRenewPaymentMethod] = useState<'ORANGE_MONEY' | 'MOOV_MONEY' | 'WAVE'>('ORANGE_MONEY');
  const [userTxRef, setUserTxRef] = useState('');
  const [payerPhone, setPayerPhone] = useState('');
  const [renewing, setRenewing] = useState(false);

  // Dispute modal state for Livreur
  const [disputeRequestId, setDisputeRequestId] = useState<string | null>(null);
  const [disputeCategory, setDisputeCategory] = useState('CLIENT_ABSENT');
  const [disputeDescription, setDisputeDescription] = useState('');
  const [submittingDispute, setSubmittingDispute] = useState(false);

  const handleSubmitDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disputeRequestId) return;
    setSubmittingDispute(true);
    try {
      const res = await fetch(`/api/deliveries/${disputeRequestId}/dispute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: disputeCategory, description: disputeDescription }),
      });
      const data = await res.json();
      if (res.ok) {
        alert('🚨 Litige signalé avec succès à l\'administration !');
        setDisputeRequestId(null);
        setDisputeDescription('');
        fetchData();
      } else {
        alert(data.error || 'Erreur lors du signalement du litige');
      }
    } catch (e) {
      alert('Erreur réseau');
    } finally {
      setSubmittingDispute(false);
    }
  };

  const handleRenewSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    setRenewing(true);
    try {
      const res = await fetch('/api/subscriptions/renew', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentMethod: renewPaymentMethod, userTxRef, payerPhone }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || 'Abonnement mensuel renouvelé avec succès !');
        setShowRenewModal(false);
        fetchData();
      } else {
        alert(data.error || 'Erreur lors du renouvellement');
      }
    } catch (e) {
      alert('Erreur réseau');
    } finally {
      setRenewing(false);
    }
  };

  const fetchData = async () => {
    try {
      const meRes = await fetch('/api/auth/me');
      if (meRes.ok) {
        const meData = await meRes.json();
        const user = meData.user;
        setCurrentUser(user);

        // Strict Access Control Rule: Client / Boutique cannot access Espace Livreur (/livreur)
        if (user && user.role === 'CLIENT') {
          router.push('/client');
          return;
        }
      }

      // Fetch open requests
      const openRes = await fetch('/api/deliveries');
      if (openRes.ok) {
        const openData = await openRes.json();
        setOpenRequests(openData.requests || []);
      }

      // Fetch my active deliveries
      const delivRes = await fetch('/api/deliveries?filter=my_deliveries');
      if (delivRes.ok) {
        const delivData = await delivRes.json();
        setMyDeliveries(delivData.deliveries || []);
      }

      // Fetch my proposals
      const propRes = await fetch('/api/deliveries?filter=my_proposals');
      if (propRes.ok) {
        const propData = await propRes.json();
        setMyProposals(propData.proposals || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      fetchData();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmitProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proposeRequestId) return;

    setSubmittingProposal(true);
    try {
      const res = await fetch(`/api/deliveries/${proposeRequestId}/propose`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proposedPriceFcfa: parseInt(proposedPriceFcfa),
          estimatedDurationMinutes: parseInt(estimatedDurationMinutes),
          comment: proposalComment,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setProposeRequestId(null);
        setProposalComment('');
        fetchData();
        setActiveTab('proposals');
      } else {
        alert(data.error || 'Erreur lors de l\'envoi de la proposition');
      }
    } catch (e) {
      alert('Erreur réseau');
    } finally {
      setSubmittingProposal(false);
    }
  };

  const handleVerifyOtp = async (requestId: string, type: 'PICKUP' | 'DELIVERY') => {
    if (!otpCode || otpCode.length < 4) {
      alert('Veuillez entrer le code OTP à 4 chiffres');
      return;
    }

    try {
      const res = await fetch(`/api/deliveries/${requestId}/verify-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, code: otpCode }),
      });

      const data = await res.json();
      if (res.ok) {
        setOtpCode('');
        setVerifyingOtpDeliveryId(null);
        alert(type === 'PICKUP' ? '✅ Colis récupéré avec succès !' : '🎉 Livraison terminée avec succès !');
        fetchData();
      } else {
        alert(data.error || 'Code OTP incorrect');
      }
    } catch (e) {
      alert('Erreur réseau');
    }
  };

  const driverInfo = currentUser?.driver;
  const isVerified = driverInfo?.verificationStatus === 'VERIFIE';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Driver Status Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#00E5D9] via-[#00B4D8] to-[#009688] border-4 border-white text-[#004D40] shadow-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5 text-[#004D40] text-xs font-black uppercase tracking-wider">
            <span className="bg-white/80 px-3 py-0.5 rounded-full border border-white/60 shadow-xs">Espace Livreur Indépendant</span> • <span>Ouagadougou 🇧🇫</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#004D40] flex flex-wrap items-center gap-2 tracking-tight">
            {currentUser?.profile?.fullName || 'Livreur Partner'}
            <span className={`px-3 py-1 rounded-full text-xs font-black border flex items-center gap-1 ${
              driverInfo?.verificationStatus === 'VERIFIE' ? 'bg-[#004D40] text-white border-teal-300' :
              driverInfo?.verificationStatus === 'EN_VERIFICATION' ? 'bg-blue-600 text-white border-blue-300' :
              driverInfo?.verificationStatus === 'REJETE' ? 'bg-red-600 text-white border-red-300' :
              driverInfo?.verificationStatus === 'SUSPENDU' ? 'bg-slate-700 text-white border-slate-400' :
              'bg-amber-600 text-white border-amber-300'
            }`}>
              {driverInfo?.verificationStatus === 'VERIFIE' && <ShieldCheck className="w-4 h-4 text-[#00E5D9]" />}
              STATUT : {driverInfo?.verificationStatus || 'EN_ATTENTE'}
            </span>
          </h1>
          <p className="text-xs text-[#004D40]/90 font-bold mt-1">
            Véhicule : <strong className="text-[#004D40] font-black">{driverInfo?.vehicles?.[0]?.vehicleType || 'MOTO'} ({driverInfo?.vehicles?.[0]?.brand || 'Yamaha'})</strong>
          </p>
        </div>

        {/* Available Toggle */}
        <div className="flex items-center gap-3 bg-white/90 p-2.5 rounded-2xl border-2 border-white shadow-md">
          <span className="text-xs font-black text-[#004D40]">Statut :</span>
          <span className={`px-3 py-1.5 rounded-xl text-xs font-black ${driverInfo?.isAvailable ? 'bg-[#004D40] text-white' : 'bg-red-600 text-white'}`}>
            {driverInfo?.isAvailable ? '🟢 DISPONIBLE' : '🔴 INDISPONIBLE'}
          </span>
        </div>
      </div>

      {/* ADMIN SUPER-USER CONTROL BANNER */}
      {currentUser?.role === 'ADMIN' && (
        <div className="p-4 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-slate-950 rounded-2xl shadow-xl border-2 border-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-7 h-7 text-slate-950 shrink-0" />
            <div>
              <h3 className="font-black text-xs uppercase tracking-wider">👑 VUE ADMINISTRATEUR EN DIRECT — ESPACE LIVREURS PARTNERS</h3>
              <p className="text-[11px] font-bold text-slate-900">
                Vous surveillez en temps réel toutes les propositions de prix et les offres faites par les livreurs.
              </p>
            </div>
          </div>
          <a
            href="/admin"
            className="px-4 py-2 bg-slate-950 text-white font-black rounded-xl text-xs shadow-md shrink-0 uppercase tracking-wider hover:bg-slate-800"
          >
            🛡️ Retour au Panneau Admin ↗
          </a>
        </div>
      )}

      {/* LIVREUR REGISTRATION & SUBSCRIPTION STATUS LOCKOUT BANNERS */}
      {currentUser && currentUser.role !== 'ADMIN' && (currentUser.isActive === false ? (
        <div className="p-8 bg-gradient-to-br from-amber-950 via-slate-900 to-amber-950 text-white border-2 border-amber-500/80 rounded-3xl space-y-6 shadow-2xl relative overflow-hidden">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-600/20 border-2 border-amber-500 flex items-center justify-center text-amber-400 shrink-0 shadow-inner">
              <Clock className="w-8 h-8 animate-pulse text-amber-400" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-900/80 text-amber-200 text-xs font-black uppercase tracking-wider mb-1 border border-amber-500/50">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                Inscription Livreur en Attente de Validation Admin
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white">
                Compte Livreur en cours d'approbation administrative
              </h3>
            </div>
          </div>
          <div className="p-4 bg-slate-950/80 border border-amber-900/60 rounded-2xl text-xs text-amber-200/90 leading-relaxed font-medium space-y-2">
            <p>
              ⏳ <strong>Vérification du Profil Livreur :</strong> Votre demande d'inscription et vos pièces jointes ont bien été transmises. L'Administrateur doit vérifier et approuver votre profil avant que vous puissiez postuler aux courses.
            </p>
            <p className="text-[11px] text-amber-300 font-bold">
              Votre accès aux livraisons sera automatiquement activé dès validation de votre dossier.
            </p>
          </div>
        </div>
      ) : currentUser.isSubscriptionActive === false ? (
        currentUser.pendingPayment ? (
          <div className="p-8 bg-gradient-to-br from-amber-950 via-slate-900 to-amber-950 text-white border-2 border-amber-500/80 rounded-3xl space-y-6 shadow-2xl relative overflow-hidden">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-amber-600/20 border-2 border-amber-500 flex items-center justify-center text-amber-400 shrink-0 shadow-inner">
                  <Clock className="w-8 h-8 animate-pulse text-amber-400" />
                </div>
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-900/80 text-amber-200 text-xs font-black uppercase tracking-wider mb-1 border border-amber-500/50">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    Paiement Livreur Soumis • En Attente de Validation Admin
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-white">
                    Paiement de {currentUser.pendingPayment.amountFcfa} FCFA en cours de vérification
                  </h3>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                <button
                  onClick={() => setShowTrackerModal(true)}
                  className="w-full sm:w-auto px-6 py-3.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs sm:text-sm shadow-xl shadow-amber-500/20 shrink-0 border border-white cursor-pointer uppercase tracking-wider"
                >
                  📊 Suivre l'État de Validation
                </button>
              </div>
            </div>

            <div className="p-4 bg-slate-950/80 border border-amber-900/60 rounded-2xl text-xs text-amber-200/90 leading-relaxed font-medium space-y-2">
              <p>
                ⏳ <strong>Information importante :</strong> Votre paiement de {currentUser.pendingPayment.amountFcfa} FCFA via {currentUser.pendingPayment.paymentMethod} (Réf: {currentUser.pendingPayment.transactionReference}) a bien été transmis.
              </p>
              <p className="text-[11px] text-amber-300 font-bold">
                🔒 Votre compte livreur et l'accès aux courses seront débloqués dès approbation et validation finale par l'Administrateur.
              </p>
            </div>
          </div>
        ) : (
          <div className="p-8 bg-gradient-to-br from-red-950 via-slate-900 to-red-950 text-white border-2 border-red-500/80 rounded-3xl space-y-6 shadow-2xl relative overflow-hidden">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-red-600/20 border-2 border-red-500 flex items-center justify-center text-red-400 shrink-0 shadow-inner">
                  <Lock className="w-8 h-8 animate-pulse" />
                </div>
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-900/80 text-red-200 text-xs font-black uppercase tracking-wider mb-1 border border-red-500/50">
                    <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                    Accès Restreint • Compte Livreur Inactif
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-white">
                    Abonnement Mensuel Expiré (500 FCFA / mois)
                  </h3>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                <button
                  onClick={() => setShowTrackerModal(true)}
                  className="w-full sm:w-auto px-4 py-3 bg-slate-900 hover:bg-slate-800 text-white font-extrabold rounded-xl text-xs border border-slate-700 cursor-pointer shadow-md transition-all"
                >
                  📊 Suivi & Reçus
                </button>
                <button
                  onClick={() => setShowRenewModal(true)}
                  className="w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black rounded-xl text-xs sm:text-sm shadow-xl shadow-emerald-500/20 shrink-0 border border-white cursor-pointer uppercase tracking-wider"
                >
                  💳 Renouveler Mon Abonnement (500 FCFA)
                </button>
              </div>
            </div>

            <div className="p-4 bg-slate-950/80 border border-red-900/60 rounded-2xl text-xs text-red-200/90 leading-relaxed font-medium space-y-2">
              <p>
                🔒 <strong>Règle de Sécurité de la Plateforme :</strong> Votre premier mois d'accès gratuit est expiré. Conformément aux règles de la plateforme, la réception des demandes de livraisons et la soumission d'offres tarifaires à Ouagadougou sont bloquées.
              </p>
              <p className="text-[11px] text-slate-400">
                Réglez via Mobile Money (Orange Money, Moov Money, Wave). La réactivation de votre compte sera effective dès validation par l'Administrateur.
              </p>
            </div>
          </div>
        )
      ) : (
        <div className="p-4 bg-emerald-950/80 text-emerald-200 border border-emerald-500/40 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs shadow-sm">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span>Abonnement Mensuel Livreur Actif (500 FCFA/mois) • <strong>{currentUser.daysRemaining || 30} jour(s) restant(s)</strong></span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowTrackerModal(true)}
              className="px-3.5 py-1.5 bg-emerald-900/80 hover:bg-emerald-800/80 text-white font-bold rounded-lg border border-emerald-600/50 cursor-pointer transition-all flex items-center gap-1.5 text-xs"
            >
              <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
              Suivre mon abonnement 📊
            </button>
            <button
              onClick={() => setShowRenewModal(true)}
              className="text-[11px] text-emerald-300 font-bold hover:underline cursor-pointer"
            >
              Recharger ↗
            </button>
          </div>
        </div>
      ))}

      {/* Verification Status Alerts */}
      {driverInfo?.verificationStatus === 'EN_ATTENTE' && (
        <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-2xl flex items-center gap-4 text-amber-950 text-sm shadow-sm">
          <AlertCircle className="w-8 h-8 text-amber-600 shrink-0" />
          <div>
            <h4 className="font-extrabold">Compte En Attente de Vérification (EN_ATTENTE)</h4>
            <p className="text-xs text-amber-900 mt-0.5">
              Vos informations et vos documents ont été enregistrés avec succès. L'administration va procéder à la vérification sous peu. Vous ne pourrez proposer vos tarifs qu'une fois votre compte validé.
            </p>
          </div>
        </div>
      )}

      {driverInfo?.verificationStatus === 'EN_VERIFICATION' && (
        <div className="p-4 bg-blue-50 border-2 border-blue-300 rounded-2xl flex items-center gap-4 text-blue-950 text-sm shadow-sm">
          <AlertCircle className="w-8 h-8 text-blue-600 shrink-0" />
          <div>
            <h4 className="font-extrabold">Examen des pièces en cours (EN_VERIFICATION)</h4>
            <p className="text-xs text-blue-900 mt-0.5">
              Un administrateur est en train d'examiner vos pièces d'identité et votre véhicule. Le statut passera à <strong>VERIFIE</strong> sous très peu de temps.
            </p>
          </div>
        </div>
      )}

      {driverInfo?.verificationStatus === 'REJETE' && (
        <div className="p-4 bg-red-50 border-2 border-red-300 rounded-2xl flex items-center gap-4 text-red-950 text-sm shadow-sm">
          <AlertCircle className="w-8 h-8 text-red-600 shrink-0" />
          <div>
            <h4 className="font-extrabold">Dossier Livreur Rejeté (REJETE)</h4>
            <p className="text-xs text-red-900 mt-0.5">
              Motif indiqué par l'administration : <strong>{driverInfo?.rejectionReason || 'Documents non conformes ou incomplets.'}</strong>
            </p>
          </div>
        </div>
      )}

      {driverInfo?.verificationStatus === 'SUSPENDU' && (
        <div className="p-4 bg-slate-100 border-2 border-slate-400 rounded-2xl flex items-center gap-4 text-slate-950 text-sm shadow-sm">
          <Lock className="w-8 h-8 text-slate-700 shrink-0" />
          <div>
            <h4 className="font-extrabold">Compte Livreur Suspendu (SUSPENDU)</h4>
            <p className="text-xs text-slate-700 mt-0.5">
              Votre compte a été temporairement suspendu par l'administration. Veuillez contacter le support administratif pour plus de renseignements.
            </p>
          </div>
        </div>
      )}

      {/* Stat Quick Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs text-slate-500 font-medium">Revenus cumulés</span>
          <div className="text-2xl font-black text-emerald-600">
            {myDeliveries.filter(d => d.status === 'LIVRE').reduce((acc, d) => acc + d.agreedPriceFcfa, 0)} FCFA
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs text-slate-500 font-medium">Livraisons réussies</span>
          <div className="text-2xl font-black text-slate-900">{driverInfo?.successfulDeliveries || 0}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs text-slate-500 font-medium">Note Moyenne</span>
          <div className="text-2xl font-black text-amber-500 flex items-center gap-1">
            <Star className="w-5 h-5 fill-amber-500" /> {driverInfo?.ratingAvg || 5.0}
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs text-slate-500 font-medium">Taux de succès</span>
          <div className="text-2xl font-black text-blue-600">{driverInfo?.successRate || 100}%</div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-4 font-bold text-sm">
        <button
          onClick={() => setActiveTab('available')}
          className={`pb-3 transition-all flex items-center gap-2 ${
            activeTab === 'available' ? 'border-b-2 border-emerald-600 text-emerald-700' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Package className="w-4 h-4" /> Demandes Disponibles ({openRequests.length})
        </button>

        <button
          onClick={() => setActiveTab('active')}
          className={`pb-3 transition-all flex items-center gap-2 ${
            activeTab === 'active' ? 'border-b-2 border-emerald-600 text-emerald-700' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Truck className="w-4 h-4" /> En cours & Validations OTP ({myDeliveries.filter(d => d.status !== 'LIVRE').length})
        </button>

        <button
          onClick={() => setActiveTab('proposals')}
          className={`pb-3 transition-all flex items-center gap-2 ${
            activeTab === 'proposals' ? 'border-b-2 border-emerald-600 text-emerald-700' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Send className="w-4 h-4" /> Mes Offres ({myProposals.length})
        </button>
      </div>

      {/* TAB 1: AVAILABLE REQUESTS */}
      {activeTab === 'available' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-900">Demandes de livraison ouvertes à Ouagadougou</h2>
            <button onClick={fetchData} className="p-2 text-slate-500 hover:text-emerald-600 rounded-lg">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {openRequests.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-2">
              <Package className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="font-bold text-slate-700">Aucune demande disponible pour le moment</h3>
              <p className="text-xs text-slate-500">Les nouvelles demandes publiées par les clients apparaîtront ici automatiquement.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {openRequests.map((req) => {
                const hasMyProposal = req.proposals && req.proposals.length > 0;
                return (
                  <div key={req.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs hover:shadow-md transition-all space-y-4">
                    
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-mono text-xs font-bold text-emerald-700">{req.trackingNumber}</span>
                        <h3 className="font-extrabold text-slate-900 text-base mt-0.5">{req.packageType}</h3>
                        <p className="text-xs text-slate-600 line-clamp-2 mt-1">{req.description}</p>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold">
                        {req.urgencyLevel}
                      </span>
                    </div>

                    {/* High-visibility locations block: Point A (Récupération) & Point B (Destination) */}
                    <div className="space-y-3 bg-[#F0FDFB] p-4 rounded-2xl border-2 border-teal-200">
                      <div className="flex items-center justify-between text-xs font-black text-[#004D40] pb-2 border-b border-teal-100">
                        <span className="flex items-center gap-1.5 uppercase tracking-wider">
                          <Navigation className="w-4 h-4 text-emerald-600" /> Itinéraire Complet de la Course
                        </span>
                        <span className="bg-teal-100 text-teal-900 px-2.5 py-0.5 rounded-full text-[10px] font-black">
                          📍 2 Localisations Définies
                        </span>
                      </div>

                      {/* Point A: Lieu de Récupération */}
                      <div className="p-3 bg-white rounded-xl border-2 border-emerald-300 space-y-1 shadow-xs">
                        <div className="text-[10px] font-black text-emerald-700 uppercase flex items-center gap-1">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" /> 1. Lieu de Récupération (Point A)
                        </div>
                        <div className="text-sm font-black text-slate-900 flex items-center gap-2">
                          <MapPin className="w-4.5 h-4.5 text-emerald-600 shrink-0" />
                          <span>{req.pickupAddress || 'Ouagadougou'}</span>
                        </div>
                      </div>

                      {/* Point B: Destination Finale */}
                      <div className="p-3 bg-white rounded-xl border-2 border-blue-300 space-y-1 shadow-xs">
                        <div className="text-[10px] font-black text-blue-700 uppercase flex items-center gap-1">
                          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" /> 2. Destination Finale (Point B)
                        </div>
                        <div className="text-sm font-black text-slate-900 flex items-center gap-2">
                          <MapPin className="w-4.5 h-4.5 text-blue-600 shrink-0" />
                          <span>{req.dropoffAddress || 'Ouagadougou'}</span>
                        </div>
                      </div>

                      {/* Interactive Route Map Preview */}
                      <DeliveryMap pickupAddress={req.pickupAddress} dropoffAddress={req.dropoffAddress} />
                    </div>

                    <div className="pt-2 flex items-center justify-between">
                      <div className="text-xs text-slate-500">
                        Client : <strong className="text-slate-800">{req.customer?.profile?.fullName}</strong>
                      </div>

                      {hasMyProposal ? (
                        <span className="px-3 py-1 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-300">
                          ✓ Proposition Envoyée ({req.proposals[0].proposedPriceFcfa} FCFA)
                        </span>
                      ) : (
                        <button
                          disabled={!isVerified}
                          onClick={() => {
                            setProposeRequestId(req.id);
                            setProposedPriceFcfa('2000');
                          }}
                          className={`px-4 py-2 rounded-xl text-xs font-bold text-white transition-all ${
                            isVerified ? 'bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20' : 'bg-slate-300 cursor-not-allowed'
                          }`}
                        >
                          {isVerified ? 'Je me propose' : 'Compte non vérifié'}
                        </button>
                      )}
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ACTIVE DELIVERIES & OTP VERIFICATION */}
      {activeTab === 'active' && (
        <div className="space-y-6">
          <h2 className="text-lg font-bold text-slate-900">Mes Livraisons Acceptées & Validation des Codes OTP</h2>

          {myDeliveries.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-2">
              <Truck className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="font-bold text-slate-700">Aucune livraison active actuellement</h3>
            </div>
          ) : (
            <div className="space-y-6">
              {myDeliveries.map((deliv) => (
                <div key={deliv.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
                  
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 pb-4 border-b border-slate-100">
                    <div>
                      <span className="font-mono text-sm font-bold text-emerald-700">{deliv.trackingNumber}</span>
                      <h3 className="font-bold text-slate-900 text-base">{deliv.deliveryRequest?.packageType}</h3>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-black text-emerald-600">{deliv.agreedPriceFcfa} FCFA</span>
                      <div className="text-xs text-slate-500">Statut : <strong className="text-slate-800">{deliv.status}</strong></div>
                    </div>
                  </div>

                  {/* Active delivery locations block */}
                  <div className="space-y-3 bg-[#F0FDFB] p-4 rounded-2xl border-2 border-teal-200">
                    <div className="flex items-center justify-between text-xs font-black text-[#004D40] pb-2 border-b border-teal-100">
                      <span className="flex items-center gap-1.5 uppercase tracking-wider">
                        <Navigation className="w-4 h-4 text-emerald-600" /> Trajet de Livraison en Cours
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      {/* Point A */}
                      <div className="p-3 bg-white rounded-xl border-2 border-emerald-300 space-y-1 shadow-xs">
                        <div className="text-[10px] font-black text-emerald-700 uppercase flex items-center gap-1">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" /> 1. Lieu de Récupération (Point A)
                        </div>
                        <div className="text-sm font-black text-slate-900 flex items-center gap-2">
                          <MapPin className="w-4.5 h-4.5 text-emerald-600 shrink-0" />
                          <span>{deliv.deliveryRequest?.pickupAddress}</span>
                        </div>
                        <div className="text-xs text-slate-600 font-bold pt-1">
                          👤 Client : <strong className="text-slate-900">{deliv.customer?.profile?.fullName}</strong> ({deliv.customer?.phone})
                        </div>
                      </div>

                      {/* Point B */}
                      <div className="p-3 bg-white rounded-xl border-2 border-blue-300 space-y-1 shadow-xs">
                        <div className="text-[10px] font-black text-blue-700 uppercase flex items-center gap-1">
                          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" /> 2. Destination Finale (Point B)
                        </div>
                        <div className="text-sm font-black text-slate-900 flex items-center gap-2">
                          <MapPin className="w-4.5 h-4.5 text-blue-600 shrink-0" />
                          <span>{deliv.deliveryRequest?.dropoffAddress}</span>
                        </div>
                      </div>
                    </div>

                    {/* Interactive Map */}
                    <DeliveryMap 
                      pickupAddress={deliv.deliveryRequest?.pickupAddress} 
                      dropoffAddress={deliv.deliveryRequest?.dropoffAddress}
                      driverName={currentUser?.profile?.fullName}
                      status={deliv.status}
                      pickedUpAt={deliv.pickedUpAt}
                      deliveredAt={deliv.deliveredAt}
                    />
                  </div>

                  {/* TWO-STEP OTP CODE VERIFICATION PANEL FOR LIVREUR */}
                  <div className="p-5 bg-gradient-to-br from-emerald-950 via-slate-900 to-teal-950 text-white rounded-2xl border-2 border-emerald-500/40 shadow-xl space-y-4">
                    <div className="flex items-center justify-between border-b border-emerald-800/60 pb-3">
                      <div className="flex items-center gap-2">
                        <Lock className="w-5 h-5 text-emerald-400" />
                        <h4 className="font-extrabold text-sm text-white uppercase tracking-wider">
                          Procédure de Sécurité OTP (2 Étapes Majeures)
                        </h4>
                      </div>
                      <span className="text-xs bg-emerald-900/80 text-emerald-300 font-mono font-bold px-3 py-1 rounded-full border border-emerald-700">
                        {deliv.status === 'LIVRE' ? '✅ Course Finalisée' : '🔒 Double Validation Requise'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      
                      {/* ÉTAPE 1: CODE DE RÉCUPÉRATION (RAMASSAGE POINT A) */}
                      <div className={`p-4 rounded-xl border-2 transition-all space-y-3 ${
                        deliv.pickedUpAt || deliv.status === 'EN_COURS_LIVRAISON' || deliv.status === 'LIVRE'
                          ? 'bg-emerald-900/40 border-emerald-400 text-emerald-200'
                          : 'bg-amber-950/40 border-amber-400 text-amber-100'
                      }`}>
                        <div className="flex justify-between items-start">
                          <span className="font-black text-xs uppercase tracking-wider flex items-center gap-1.5">
                            {deliv.pickedUpAt || deliv.status === 'EN_COURS_LIVRAISON' || deliv.status === 'LIVRE' ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <span className="w-4 h-4 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center text-[10px] font-black">1</span>
                            )}
                            Étape 1 : Code de Récupération (Point A)
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            deliv.pickedUpAt || deliv.status === 'EN_COURS_LIVRAISON' || deliv.status === 'LIVRE'
                              ? 'bg-emerald-500 text-slate-950 font-black'
                              : 'bg-amber-400 text-slate-950 font-black animate-pulse'
                          }`}>
                            {deliv.pickedUpAt || deliv.status === 'EN_COURS_LIVRAISON' || deliv.status === 'LIVRE' ? '✓ VALIDÉ' : 'EN ATTENTE'}
                          </span>
                        </div>

                        {deliv.pickedUpAt || deliv.status === 'EN_COURS_LIVRAISON' || deliv.status === 'LIVRE' ? (
                          <div className="p-3 bg-emerald-950/80 rounded-lg border border-emerald-600 text-xs space-y-1">
                            <div className="font-extrabold text-emerald-300">📦 Colis récupéré au Point A</div>
                            <div className="text-[11px] text-emerald-400">
                              Validé avec succès le {deliv.pickedUpAt ? new Date(deliv.pickedUpAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <p className="text-[11px] text-amber-200">
                              Saisissez le **Code à 4 chiffres (Code 1)** fourni par le client au ramassage :
                            </p>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                maxLength={4}
                                placeholder="Code 1"
                                value={verifyingOtpDeliveryId === deliv.deliveryRequestId ? otpCode : ''}
                                onChange={(e) => {
                                  setVerifyingOtpDeliveryId(deliv.deliveryRequestId);
                                  setOtpCode(e.target.value);
                                }}
                                className="px-3 py-2 text-sm font-mono font-black bg-white text-slate-900 rounded-lg outline-none w-28 text-center border border-amber-300"
                              />
                              <button
                                onClick={() => handleVerifyOtp(deliv.deliveryRequestId, 'PICKUP')}
                                className="px-3.5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-lg text-xs transition-all shadow-md shrink-0 cursor-pointer"
                              >
                                Valider Étape 1
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* ÉTAPE 2: CODE DE CONFIRMATION (LIVRAISON FINALE POINT B) */}
                      <div className={`p-4 rounded-xl border-2 transition-all space-y-3 ${
                        deliv.status === 'LIVRE'
                          ? 'bg-emerald-900/40 border-emerald-400 text-emerald-200'
                          : deliv.pickedUpAt || deliv.status === 'EN_COURS_LIVRAISON'
                          ? 'bg-blue-950/40 border-blue-400 text-blue-100'
                          : 'bg-slate-900/40 border-slate-700 text-slate-400 opacity-60'
                      }`}>
                        <div className="flex justify-between items-start">
                          <span className="font-black text-xs uppercase tracking-wider flex items-center gap-1.5">
                            {deliv.status === 'LIVRE' ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <span className="w-4 h-4 rounded-full bg-blue-400 text-slate-950 flex items-center justify-center text-[10px] font-black">2</span>
                            )}
                            Étape 2 : Code de Confirmation (Point B)
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            deliv.status === 'LIVRE'
                              ? 'bg-emerald-500 text-slate-950 font-black'
                              : deliv.pickedUpAt || deliv.status === 'EN_COURS_LIVRAISON'
                              ? 'bg-blue-400 text-slate-950 font-black animate-pulse'
                              : 'bg-slate-700 text-slate-300 font-bold'
                          }`}>
                            {deliv.status === 'LIVRE' ? '✓ LIVRÉ' : deliv.pickedUpAt || deliv.status === 'EN_COURS_LIVRAISON' ? 'EN COURS' : 'VERROUILLÉ'}
                          </span>
                        </div>

                        {deliv.status === 'LIVRE' ? (
                          <div className="p-3 bg-emerald-950/80 rounded-lg border border-emerald-600 text-xs space-y-1">
                            <div className="font-extrabold text-emerald-300">🥳 Course livrée avec succès !</div>
                            <div className="text-[11px] text-emerald-400">
                              Validé le {deliv.deliveredAt ? new Date(deliv.deliveredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                            </div>
                          </div>
                        ) : deliv.pickedUpAt || deliv.status === 'EN_COURS_LIVRAISON' ? (
                          <div className="space-y-2">
                            <p className="text-[11px] text-blue-200">
                              Saisissez le **Code à 4 chiffres (Code 2)** fourni par le destinataire à l'arrivée :
                            </p>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                maxLength={4}
                                placeholder="Code 2"
                                value={verifyingOtpDeliveryId === deliv.deliveryRequestId ? otpCode : ''}
                                onChange={(e) => {
                                  setVerifyingOtpDeliveryId(deliv.deliveryRequestId);
                                  setOtpCode(e.target.value);
                                }}
                                className="px-3 py-2 text-sm font-mono font-black bg-white text-slate-900 rounded-lg outline-none w-28 text-center border border-blue-300"
                              />
                              <button
                                onClick={() => handleVerifyOtp(deliv.deliveryRequestId, 'DELIVERY')}
                                className="px-3.5 py-2 bg-blue-500 hover:bg-blue-400 text-white font-black rounded-lg text-xs transition-all shadow-md shrink-0 cursor-pointer"
                              >
                                Valider Étape 2 (Fin)
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-[11px] text-slate-400 italic">
                            Complétez d'abord l'Étape 1 (Code de Récupération) pour débloquer cette étape.
                          </p>
                        )}
                      </div>

                    </div>

                    {/* Action Bar for Driver: Signaler un Litige */}
                    <div className="pt-3 border-t border-slate-100 flex justify-end">
                      <button
                        type="button"
                        onClick={() => setDisputeRequestId(deliv.deliveryRequestId)}
                        className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 font-bold rounded-xl text-xs flex items-center gap-1.5 border border-red-200 cursor-pointer transition-all shadow-xs"
                      >
                        <AlertCircle className="w-4 h-4 text-red-600" />
                        <span>🚨 Signaler un Litige sur cette Course</span>
                      </button>
                    </div>

                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* PROPOSAL SUBMISSION MODAL */}
      {proposeRequestId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Soumettre ma proposition</h3>
              <button onClick={() => setProposeRequestId(null)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            {(() => {
              const targetReq = openRequests.find(r => r.id === proposeRequestId);
              if (!targetReq) return null;
              return (
                <div className="space-y-2">
                  <div className="text-xs font-black text-slate-700 uppercase">Aperçu Visuel du Trajet :</div>
                  <DeliveryMap pickupAddress={targetReq.pickupAddress} dropoffAddress={targetReq.dropoffAddress} />
                </div>
              );
            })()}

            <form onSubmit={handleSubmitProposal} className="space-y-4">
              
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Prix Proposé (en FCFA) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    required
                    step="100"
                    min="500"
                    value={proposedPriceFcfa}
                    onChange={(e) => setProposedPriceFcfa(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl font-bold text-emerald-700 outline-none"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-bold">FCFA</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Délai estimé de livraison (en minutes) *
                </label>
                <input
                  type="number"
                  required
                  min="5"
                  value={estimatedDurationMinutes}
                  onChange={(e) => setEstimatedDurationMinutes(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Commentaire pour le client (facultatif)
                </label>
                <textarea
                  rows={2}
                  value={proposalComment}
                  onChange={(e) => setProposalComment(e.target.value)}
                  placeholder="ex: Je suis à 5 minutes du lieu de ramassage."
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setProposeRequestId(null)}
                  className="w-1/2 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submittingProposal}
                  className="w-1/2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md shadow-emerald-600/20"
                >
                  {submittingProposal ? 'Envoi...' : 'Envoyer l\'offre'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* RENEWAL MODAL */}
      {showRenewModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                💳 Renouvellement Abonnement Livreur
              </h3>
              <button onClick={() => setShowRenewModal(false)} className="text-slate-400 hover:text-slate-600 font-black text-xl">✕</button>
            </div>

            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs space-y-1">
              <div className="font-extrabold text-emerald-950">Abonnement Mensuel Livreur : 1 000 FCFA / mois</div>
              <p className="text-emerald-800">
                Le renouvellement ajoute **30 jours d'accès complet** pour continuer à recevoir des courses et soumettre vos tarifs.
              </p>
            </div>

            <form onSubmit={handleRenewSubscription} className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase text-slate-700 mb-2">
                  Choisissez le moyen de paiement (1 000 FCFA) :
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {/* ORANGE MONEY */}
                  <button
                    type="button"
                    onClick={() => setRenewPaymentMethod('ORANGE_MONEY')}
                    className={`py-2.5 px-2 rounded-xl text-xs font-black transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer border-2 shadow-xs ${
                      renewPaymentMethod === 'ORANGE_MONEY'
                        ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white border-orange-600 ring-2 ring-orange-400 scale-102 shadow-md'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-orange-50'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-[#FF7900] flex flex-col items-center justify-center p-0.5 shadow-sm shrink-0 border border-white font-sans">
                      <div className="w-full bg-white py-0.5 rounded-[2px] flex items-center justify-center">
                        <span className="text-[7px] font-black text-black leading-none uppercase tracking-tighter">orange</span>
                      </div>
                      <div className="w-full bg-black py-0.5 rounded-[2px] mt-0.5 flex items-center justify-center">
                        <span className="text-[6px] font-black text-[#FF7900] leading-none uppercase tracking-tighter">money</span>
                      </div>
                    </div>
                    <span className="text-[11px] font-extrabold leading-none">Orange Money</span>
                  </button>

                  {/* MOOV MONEY */}
                  <button
                    type="button"
                    onClick={() => setRenewPaymentMethod('MOOV_MONEY')}
                    className={`py-2.5 px-2 rounded-xl text-xs font-black transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer border-2 shadow-xs ${
                      renewPaymentMethod === 'MOOV_MONEY'
                        ? 'bg-gradient-to-r from-blue-600 to-sky-700 text-white border-blue-700 ring-2 ring-blue-400 scale-102 shadow-md'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-blue-50'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-[#00519E] flex flex-col items-center justify-center p-0.5 shadow-sm shrink-0 border border-white font-sans">
                      <div className="w-full bg-[#003B7A] py-0.5 rounded-[2px] flex items-center justify-center">
                        <span className="text-[7px] font-black text-white leading-none uppercase italic tracking-tighter">MOOV</span>
                      </div>
                      <div className="w-full bg-[#FF7900] py-0.5 rounded-[2px] mt-0.5 flex items-center justify-center">
                        <span className="text-[6px] font-black text-white leading-none uppercase tracking-tighter">MONEY</span>
                      </div>
                    </div>
                    <span className="text-[11px] font-extrabold leading-none">Moov Money</span>
                  </button>

                  {/* WAVE */}
                  <button
                    type="button"
                    onClick={() => setRenewPaymentMethod('WAVE')}
                    className={`py-2.5 px-2 rounded-xl text-xs font-black transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer border-2 shadow-xs ${
                      renewPaymentMethod === 'WAVE'
                        ? 'bg-gradient-to-r from-cyan-500 to-teal-600 text-white border-cyan-600 ring-2 ring-cyan-400 scale-102 shadow-md'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-cyan-50'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-[#1DC3F6] flex items-center justify-center shadow-sm shrink-0 border border-white relative overflow-hidden p-0.5">
                      <svg className="w-6 h-6" viewBox="0 0 100 100" fill="none">
                        <circle cx="50" cy="50" r="46" fill="#1DC3F6" />
                        <path d="M50 15C32 15 20 28 20 48C20 68 32 85 50 85C68 85 80 68 80 48C80 28 68 15 50 15Z" fill="#FFFFFF" />
                        <path d="M50 25C38 25 30 35 30 50C30 65 38 75 50 75C62 75 70 65 70 50C70 35 62 25 50 25Z" fill="#1DC3F6" />
                        <path d="M50 35C44 35 40 40 40 50C40 60 44 65 50 65C56 65 60 60 60 50C60 40 56 35 50 35Z" fill="#FFFFFF" />
                        <polygon points="50,42 57,48 43,48" fill="#FFC107" />
                      </svg>
                    </div>
                    <span className="text-[11px] font-extrabold leading-none">Wave</span>
                  </button>
                </div>
              </div>

              {/* DYNAMIC PAYMENT USSD CODE & WAVE DIRECT REDIRECT GUIDE */}
              {renewPaymentMethod === 'ORANGE_MONEY' && (
                <div className="p-3.5 bg-orange-50 border-2 border-orange-300 rounded-2xl space-y-2 text-xs text-orange-950">
                  <div className="flex items-center justify-between font-black">
                    <span className="flex items-center gap-2 text-orange-900">
                      <div className="w-6 h-6 rounded-md bg-[#FF7900] flex flex-col items-center justify-center p-0.5 shadow-xs border border-white font-sans shrink-0">
                        <div className="w-full bg-white py-0.2 rounded-[1px] flex items-center justify-center">
                          <span className="text-[5px] font-black text-black leading-none uppercase">orange</span>
                        </div>
                        <div className="w-full bg-black py-0.2 rounded-[1px] mt-0.2 flex items-center justify-center">
                          <span className="text-[4px] font-black text-[#FF7900] leading-none uppercase">money</span>
                        </div>
                      </div>
                      Code USSD Orange Money
                    </span>
                    <span className="bg-orange-600 text-white px-2 py-0.5 rounded-md font-mono text-[11px] font-extrabold">
                      *144*2*1*06887330*1000#
                    </span>
                  </div>
                  <p className="text-[11px] text-orange-900 leading-relaxed font-medium">
                    Composez le <strong>*144*2*1*06887330*1000#</strong> sur votre téléphone pour régler votre abonnement mensuel livreur de <strong>1 000 FCFA</strong> (Marchand : 06887330).
                  </p>
                  <a
                    href={`tel:${encodeURIComponent('*144*2*1*06887330*1000#')}`}
                    className="inline-flex items-center justify-center gap-1.5 w-full py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-black shadow-sm transition-all"
                  >
                    📞 Lancer le Code USSD (*144*2*1*06887330*1000#)
                  </a>
                </div>
              )}

              {renewPaymentMethod === 'MOOV_MONEY' && (
                <div className="p-3.5 bg-blue-50 border-2 border-blue-300 rounded-2xl space-y-2 text-xs text-blue-950">
                  <div className="flex items-center justify-between font-black">
                    <span className="flex items-center gap-2 text-blue-900">
                      <div className="w-6 h-6 rounded-md bg-[#00519E] flex flex-col items-center justify-center p-0.5 shadow-xs border border-white font-sans shrink-0">
                        <div className="w-full bg-[#003B7A] py-0.2 rounded-[1px] flex items-center justify-center">
                          <span className="text-[5px] font-black text-white leading-none uppercase italic">MOOV</span>
                        </div>
                        <div className="w-full bg-[#FF7900] py-0.2 rounded-[1px] mt-0.2 flex items-center justify-center">
                          <span className="text-[4px] font-black text-white leading-none uppercase">MONEY</span>
                        </div>
                      </div>
                      Code USSD Moov Money
                    </span>
                    <span className="bg-blue-600 text-white px-2 py-0.5 rounded-md font-mono text-[11px] font-extrabold">
                      *555*2*1*62017878*1000#
                    </span>
                  </div>
                  <p className="text-[11px] text-blue-900 leading-relaxed font-medium">
                    Composez le <strong>*555*2*1*62017878*1000#</strong> sur votre téléphone pour effectuer le règlement de <strong>1 000 FCFA</strong> (Marchand : 62017878).
                  </p>
                  <a
                    href={`tel:${encodeURIComponent('*555*2*1*62017878*1000#')}`}
                    className="inline-flex items-center justify-center gap-1.5 w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-sm transition-all"
                  >
                    📞 Lancer le Code USSD (*555*2*1*62017878*1000#)
                  </a>
                </div>
              )}

              {renewPaymentMethod === 'WAVE' && (
                <div className="p-4 bg-gradient-to-br from-cyan-50 via-teal-50 to-cyan-100 border-2 border-cyan-400 rounded-2xl space-y-3 text-xs text-cyan-950 shadow-xs">
                  <div className="flex items-center justify-between font-black">
                    <span className="flex items-center gap-2 text-cyan-900 text-xs">
                      <div className="w-6 h-6 rounded-md bg-[#1DC3F6] flex items-center justify-center shadow-xs shrink-0 border border-white relative overflow-hidden p-0.5">
                        <svg className="w-5 h-5" viewBox="0 0 100 100" fill="none">
                          <circle cx="50" cy="50" r="46" fill="#1DC3F6" />
                          <path d="M50 15C32 15 20 28 20 48C20 68 32 85 50 85C68 85 80 68 80 48C80 28 68 15 50 15Z" fill="#FFFFFF" />
                          <path d="M50 25C38 25 30 35 30 50C30 65 38 75 50 75C62 75 70 65 70 50C70 35 62 25 50 25Z" fill="#1DC3F6" />
                          <path d="M50 35C44 35 40 40 40 50C40 60 44 65 50 65C56 65 60 60 60 50C60 40 56 35 50 35Z" fill="#FFFFFF" />
                          <polygon points="50,42 57,48 43,48" fill="#FFC107" />
                        </svg>
                      </div>
                      Paiement Direct via Application Wave
                    </span>
                    <span className="bg-cyan-600 text-white px-2 py-0.5 rounded-md font-bold text-[10px] uppercase tracking-wider">
                      Lien Direct
                    </span>
                  </div>
                  <p className="text-[11px] text-cyan-950 leading-relaxed font-semibold">
                    Cliquez sur le bouton ci-dessous pour ouvrir directement votre application <strong>Wave</strong> et régler <strong>1 000 FCFA</strong> vers le numéro <strong>+226 06 88 73 30</strong>.
                  </p>
                  <a
                    href="https://pay.wave.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-cyan-500 to-teal-600 hover:from-cyan-600 hover:to-teal-700 text-white rounded-xl text-xs font-black shadow-lg shadow-cyan-500/30 transition-all uppercase tracking-wider cursor-pointer border border-cyan-300"
                  >
                    📲 Ouvrir Mon Application Wave pour Payer (1 000 FCFA) ↗
                  </a>
                </div>
              )}

              {/* PAYER PHONE & SMS TX REF */}
              <div className="space-y-3 pt-1 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Numéro de Téléphone Mobile Money qui a payé :
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ex: +226 70 12 34 56"
                    value={payerPhone}
                    onChange={(e) => setPayerPhone(e.target.value)}
                    className="w-full px-3 me-2 py-2 text-xs border border-slate-300 rounded-xl outline-none focus:border-emerald-600 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ID / Référence SMS de la Transaction :
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ex: OM.2026.88991 / TxRef-12345"
                    value={userTxRef}
                    onChange={(e) => setUserTxRef(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl outline-none focus:border-emerald-600 font-mono font-bold"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Copiez l'ID figurant dans le SMS de confirmation reçu sur votre téléphone pour que l'admin vérifie le dépôt.
                  </p>
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowRenewModal(false)}
                  className="w-1/2 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={renewing}
                  className="w-1/2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs shadow-md shadow-emerald-600/30 cursor-pointer"
                >
                  {renewing ? 'Paiement...' : 'Payer 500 FCFA (30J)'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* Subscription Tracker Modal */}
      {showTrackerModal && (
        <SubscriptionTrackerModal
          onClose={() => setShowTrackerModal(false)}
          onOpenRenewModal={() => {
            setShowTrackerModal(false);
            setShowRenewModal(true);
          }}
          role="LIVREUR"
        />
      )}

      {/* LIVREUR DISPUTE MODAL */}
      {disputeRequestId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-red-600 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" /> Signaler un Litige / Problème (Livreur)
            </h3>
            
            <form onSubmit={handleSubmitDispute} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-500 font-bold uppercase mb-1">Motif du Litige</label>
                <select
                  value={disputeCategory}
                  onChange={(e) => setDisputeCategory(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl outline-none font-bold text-slate-800"
                >
                  <option value="CLIENT_ABSENT">Client / Destinataire absent ou injoignable</option>
                  <option value="PAIEMENT_REFUSE">Refus de paiement ou litige financier</option>
                  <option value="ADRESSE_INCORRECTE">Adresse introuvable ou incorrecte</option>
                  <option value="COLIS_SUSPECT">Contenu suspect / non conforme</option>
                  <option value="COMPORTEMENT_INAPPROPRIE">Comportement inapproprié du client</option>
                  <option value="AUTRE">Autre motif de litige</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-500 font-bold uppercase mb-1">Description détaillée du problème *</label>
                <textarea
                  required
                  rows={3}
                  value={disputeDescription}
                  onChange={(e) => setDisputeDescription(e.target.value)}
                  placeholder="Expliquez la situation rencontrée lors de la course..."
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl outline-none font-bold text-slate-800"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setDisputeRequestId(null)}
                  className="w-1/2 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submittingDispute}
                  className="w-1/2 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-md"
                >
                  {submittingDispute ? 'Envoi...' : 'Signaler le Litige'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
