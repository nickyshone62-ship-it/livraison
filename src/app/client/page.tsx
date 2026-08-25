'use client';

import React, { useState, useEffect } from 'react';
import {
  Plus,
  Package,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  Truck,
  Star,
  ShieldCheck,
  Lock,
  MessageSquare,
  Sparkles,
  ChevronRight,
  FileText,
  Info,
  ChevronDown,
  ChevronUp,
  Navigation,
  Compass,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { SubscriptionTrackerModal } from '@/components/SubscriptionTrackerModal';

const DeliveryMap = dynamic(
  () => import('@/components/DeliveryMap').then((mod) => mod.DeliveryMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-64 bg-teal-50/50 rounded-2xl animate-pulse flex items-center justify-center text-xs font-bold text-[#004D40]">
        🗺️ Chargement de la carte GPS...
      </div>
    ),
  }
);

import { useRouter } from 'next/navigation';

const POPULAR_QUARTIERS = [
  'Zogona', 'Gounghin', 'Ouaga 2000', 'Karpala', 'Patte d\'Oie', 
  'Dassasgho', 'Wemtenga', 'Tampouy', 'Saaba', 'Kamboinsin', 
  'Cissin', 'Somgandé', 'Wayalghin', 'Paspanga', 'Larlé', 'Koulweogo'
];

export default function ClientDashboard() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewModal, setShowNewModal] = useState(false);
  const [showPlatformGuide, setShowPlatformGuide] = useState(true);
  const [showTrackerModal, setShowTrackerModal] = useState(false);

  // Request Form State
  const [pickupAddress, setPickupAddress] = useState('');
  const [dropoffAddress, setDropoffAddress] = useState('');
  const [packageType, setPackageType] = useState('Colis Vêtements & Chaussures');
  const [description, setDescription] = useState('');
  const [urgencyLevel, setUrgencyLevel] = useState('NORMAL');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Unified Multi-Destination Form State (dans un seul espace)
  interface DestinationItem {
    dropoffAddress: string;
    packageType: string;
    description: string;
    recipientPhone: string;
    additionalNotes: string;
  }

  const [destinations, setDestinations] = useState<DestinationItem[]>([
    {
      dropoffAddress: '',
      packageType: 'Colis Vêtements & Chaussures',
      description: '',
      recipientPhone: '',
      additionalNotes: '',
    }
  ]);

  const handleAddDestination = () => {
    setDestinations(prev => [
      ...prev,
      {
        dropoffAddress: '',
        packageType: 'Colis Vêtements & Chaussures',
        description: '',
        recipientPhone: '',
        additionalNotes: '',
      }
    ]);
  };

  const handleRemoveDestination = (index: number) => {
    if (destinations.length <= 1) return;
    setDestinations(prev => prev.filter((_, i) => i !== index));
  };

  const handleDestinationChange = (index: number, field: keyof DestinationItem, value: string) => {
    setDestinations(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // GPS Location detection states
  const [detectingPickupGps, setDetectingPickupGps] = useState(false);
  const [detectingDropoffGps, setDetectingDropoffGps] = useState(false);

  const handleDetectGps = (target: 'pickup' | 'dropoff') => {
    if (!navigator.geolocation) {
      alert('La géolocalisation n\'est pas supportée par votre navigateur.');
      return;
    }

    if (target === 'pickup') setDetectingPickupGps(true);
    else setDetectingDropoffGps(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude.toFixed(4);
        const lng = position.coords.longitude.toFixed(4);
        const addressStr = `Ouagadougou (GPS: ${lat}, ${lng})`;

        if (target === 'pickup') {
          setPickupAddress(addressStr);
          setDetectingPickupGps(false);
        } else {
          setDropoffAddress(addressStr);
          setDetectingDropoffGps(false);
        }
      },
      (error) => {
        alert('Impossible de récupérer votre position GPS. Veuillez autoriser l\'accès à la localisation.');
        if (target === 'pickup') setDetectingPickupGps(false);
        else setDetectingDropoffGps(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Review modal state
  const [reviewDeliveryId, setReviewDeliveryId] = useState<string | null>(null);
  const [rating, setRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  // Dispute modal state
  const [disputeRequestId, setDisputeRequestId] = useState<string | null>(null);
  const [disputeCategory, setDisputeCategory] = useState('COLIS_NON_LIVRE');
  const [disputeDescription, setDisputeDescription] = useState('');

  // Subscription renewal state
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [renewPaymentMethod, setRenewPaymentMethod] = useState<'ORANGE_MONEY' | 'MOOV_MONEY' | 'WAVE'>('ORANGE_MONEY');
  const [userTxRef, setUserTxRef] = useState('');
  const [payerPhone, setPayerPhone] = useState('');
  const [renewing, setRenewing] = useState(false);

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
        alert(data.message || 'Abonnement mensuel boutique renouvelé avec succès !');
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

  const fetchDeliveriesOnly = async () => {
    try {
      const reqRes = await fetch('/api/deliveries');
      if (reqRes.ok) {
        const reqData = await reqRes.json();
        setRequests(reqData.requests || []);
      }
    } catch (e) {
      console.error('Error fetching client deliveries:', e);
    }
  };

  const initClientDashboard = async () => {
    try {
      const [meRes, reqRes] = await Promise.all([
        fetch('/api/auth/me'),
        fetch('/api/deliveries'),
      ]);

      if (meRes.ok) {
        const meData = await meRes.json();
        const user = meData.user;

        if (!user || user.approvalStatus !== 'APPROVED' || !user.isActive) {
          router.push('/');
          return;
        }

        setCurrentUser(user);

        if (user.role === 'LIVREUR') {
          router.push('/livreur');
          return;
        }
      } else {
        router.push('/');
        return;
      }

      if (reqRes.ok) {
        const reqData = await reqRes.json();
        setRequests(reqData.requests || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async () => {
    await fetchDeliveriesOnly();
  };

  useEffect(() => {
    initClientDashboard();
    const interval = setInterval(() => {
      fetchDeliveriesOnly();
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleCreateDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      let createdCount = 0;
      for (const dest of destinations) {
        if (!dest.dropoffAddress.trim()) continue;

        const res = await fetch('/api/deliveries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pickupAddress,
            dropoffAddress: dest.dropoffAddress,
            packageType: dest.packageType,
            description: dest.description || 'Colis',
            urgencyLevel,
            recipientPhone: dest.recipientPhone,
            additionalNotes: dest.additionalNotes,
          }),
        });

        if (res.ok) createdCount++;
      }

      if (createdCount > 0) {
        alert(`🎉 ${createdCount} demande(s) de livraison lancée(s) avec succès dans votre espace !`);
        setShowNewModal(false);
        setPickupAddress('');
        setDestinations([
          {
            dropoffAddress: '',
            packageType: 'Colis Vêtements & Chaussures',
            description: '',
            recipientPhone: '',
            additionalNotes: '',
          }
        ]);
        fetchData();
      } else {
        alert('Veuillez renseigner au moins une adresse de destination valide.');
      }
    } catch (e) {
      alert('Erreur réseau');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSelectDriver = async (requestId: string, proposalId: string, driverName?: string, price?: number) => {
    const confirmMessage = driverName && price
      ? `Confirmez-vous la sélection de ${driverName} au tarif de ${price} FCFA pour cette livraison ?`
      : 'Confirmez-vous le choix de ce livreur ?';
    if (!confirm(confirmMessage)) return;

    try {
      const res = await fetch(`/api/deliveries/${requestId}/select-driver`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proposalId }),
      });

      const data = await res.json();
      if (res.ok) {
        alert('🎉 Livreur sélectionné avec succès ! Vos codes de sécurité OTP de livraison ont été générés.');
        fetchData();
      } else {
        alert(data.error || 'Erreur lors de la sélection du livreur');
      }
    } catch (e) {
      alert('Erreur réseau');
    }
  };

  const handleChangeDriver = async (requestId: string, trackingNumber?: string) => {
    const reason = prompt(`⚠️ Souhaitez-vous réouvrir la livraison ${trackingNumber || ''} et changer de livreur ?\n\nPrécisez le motif du changement (optionnel) :`);
    if (reason === null) return;

    try {
      const res = await fetch(`/api/deliveries/${requestId}/change-driver`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });

      const data = await res.json();
      if (res.ok) {
        alert(data.message || 'Demande réouverte avec succès ! Vous pouvez à présent choisir un autre livreur.');
        fetchData();
      } else {
        alert(data.error || 'Erreur lors du changement de livreur');
      }
    } catch (e) {
      alert('Erreur réseau');
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewDeliveryId) return;

    try {
      const res = await fetch(`/api/deliveries/${reviewDeliveryId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, comment: reviewComment }),
      });

      if (res.ok) {
        setReviewDeliveryId(null);
        setReviewComment('');
        fetchData();
      } else {
        const d = await res.json();
        alert(d.error || 'Erreur');
      }
    } catch (e) {
      alert('Erreur réseau');
    }
  };

  const handleSubmitDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disputeRequestId) return;

    try {
      const res = await fetch(`/api/deliveries/${disputeRequestId}/dispute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: disputeCategory, description: disputeDescription }),
      });

      if (res.ok) {
        setDisputeRequestId(null);
        setDisputeDescription('');
        alert('Votre signalement a été transmis à l\'administration avec création d\'un dossier de litige.');
        fetchData();
      } else {
        const d = await res.json();
        alert(d.error || 'Erreur');
      }
    } catch (e) {
      alert('Erreur réseau');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#00E5D9] via-[#00B4D8] to-[#009688] border-4 border-white text-[#004D40] shadow-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5 text-[#004D40] text-xs font-black uppercase tracking-wider">
            <span className="bg-white/80 px-3 py-0.5 rounded-full border border-white/60 shadow-xs">Espace Client / Commerçant</span> • <span>Ouagadougou 🇧🇫</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#004D40] tracking-tight">
            Bienvenue, {currentUser?.profile?.fullName || 'Client'}
          </h1>
          <p className="text-xs text-[#004D40]/90 font-bold mt-1">
            {currentUser?.activeSubscription
              ? `Abonnement ${currentUser.activeSubscription.plan.name} ACTIF (Jusqu'au ${new Date(currentUser.activeSubscription.endsAt).toLocaleDateString('fr-FR')})`
              : 'Formule Standard Gratuite'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowPlatformGuide(!showPlatformGuide)}
            className="px-4 py-3 bg-white/90 hover:bg-white text-[#004D40] font-black rounded-xl text-xs flex items-center gap-2 border border-white shadow-md transition-all cursor-pointer"
          >
            <Info className="w-4 h-4 text-[#009688]" />
            <span>{showPlatformGuide ? 'Masquer la Présentation' : '📍 Tout sur la plateforme'}</span>
            {showPlatformGuide ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={() => setShowNewModal(true)}
            className="px-6 py-3.5 bg-[#004D40] hover:bg-[#00382E] text-white font-black rounded-xl shadow-xl transition-all flex items-center gap-2 text-xs sm:text-sm cursor-pointer border border-teal-300 uppercase tracking-wider"
          >
            <Plus className="w-5 h-5 text-[#00E5D9]" />
            Demander une Livraison
          </button>
        </div>
      </div>

      {/* ADMIN SUPER-USER CONTROL BANNER */}
      {currentUser?.role === 'ADMIN' && (
        <div className="p-4 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-slate-950 rounded-2xl shadow-xl border-2 border-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-7 h-7 text-slate-950 shrink-0" />
            <div>
              <h3 className="font-black text-xs uppercase tracking-wider">👑 VUE ADMINISTRATEUR EN DIRECT — ESPACE BOUTIQUE & CLIENTS</h3>
              <p className="text-[11px] font-bold text-slate-900">
                Vous avez un accès superviseur complet sur toutes les demandes de livraison créées à Ouagadougou.
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

      {/* BOUTIQUE REGISTRATION & SUBSCRIPTION STATUS LOCKOUT BANNERS */}
      {currentUser && currentUser.role !== 'ADMIN' && (currentUser.isActive === false ? (
        <div className="p-8 bg-gradient-to-br from-amber-950 via-slate-900 to-amber-950 text-white border-2 border-amber-500/80 rounded-3xl space-y-6 shadow-2xl relative overflow-hidden">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-600/20 border-2 border-amber-500 flex items-center justify-center text-amber-400 shrink-0 shadow-inner">
              <Clock className="w-8 h-8 animate-pulse text-amber-400" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-900/80 text-amber-200 text-xs font-black uppercase tracking-wider mb-1 border border-amber-500/50">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                Inscription en Attente de Validation par l'Administrateur
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white">
                Compte en cours de vérification administrative
              </h3>
            </div>
          </div>
          <div className="p-4 bg-slate-950/80 border border-amber-900/60 rounded-2xl text-xs text-amber-200/90 leading-relaxed font-medium space-y-2">
            <p>
              ⏳ <strong>Règle de Sécurité de la Plateforme :</strong> Votre demande d'inscription a été enregistrée avec succès. Conformément aux règles de sécurité de la plateforme, l'Administrateur doit approuver votre compte avant que vous puissiez valider des livraisons.
            </p>
            <p className="text-[11px] text-amber-300 font-bold">
              Votre compte sera instantanément débloqué dès la validation par l'Administrateur.
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
                    Paiement Soumis • En Attente de Validation Admin
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
                🔒 L'abonnement et le déblocage de votre compte seront activés dès approbation et validation finale par l'Administrateur.
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
                    Accès Restreint • Compte Inactif
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-white">
                    Abonnement Mensuel Expiré (1 000 FCFA / mois)
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
                  💳 Renouveler Mon Abonnement (1 000 FCFA)
                </button>
              </div>
            </div>

            <div className="p-4 bg-slate-950/80 border border-red-900/60 rounded-2xl text-xs text-red-200/90 leading-relaxed font-medium space-y-2">
              <p>
                🔒 <strong>Règle de Sécurité de la Plateforme :</strong> Votre premier mois d'utilisation est arrivé à terme. Pour continuer à émettre des demandes de livraison à Ouagadougou, sélectionner des livreurs et utiliser les outils de la plateforme, votre abonnement mensuel doit être actif.
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
            <span>Abonnement Mensuel Boutique Actif (1 000 FCFA/mois) • <strong>{currentUser.daysRemaining || 30} jour(s) restant(s)</strong></span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowTrackerModal(true)}
              className="px-3.5 py-1.5 bg-emerald-900/80 hover:bg-emerald-800/80 text-white font-bold rounded-lg border border-emerald-600/50 cursor-pointer transition-all flex items-center gap-1.5 text-xs"
            >
              <FileText className="w-3.5 h-3.5 text-emerald-400" />
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
      {/* Stats Quick Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs text-slate-500 font-medium">Demandes Totales</span>
          <div className="text-2xl font-black text-slate-900">{requests.length}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs text-slate-500 font-medium">En cours de livraison</span>
          <div className="text-2xl font-black text-amber-600">
            {requests.filter(r => ['EN_COURS_LIVRAISON', 'COLIS_RECUPERE', 'LIVREUR_SELECTIONNE'].includes(r.status)).length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs text-slate-500 font-medium">Propositions à comparer</span>
          <div className="text-2xl font-black text-blue-600">
            {requests.filter(r => r.status === 'PROPOSITIONS_RECUES' || r.status === 'DEMANDE_PUBLIEE').length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs text-slate-500 font-medium">Livraisons Réussies</span>
          <div className="text-2xl font-black text-emerald-600">
            {requests.filter(r => r.status === 'LIVRE').length}
          </div>
        </div>
      </div>

      {/* Main Delivery Requests List */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
              <Package className="w-6 h-6 text-emerald-600" />
              <span>Vos Demandes de Livraison ({requests.length})</span>
            </h2>
            <p className="text-xs text-slate-600 font-semibold mt-1">
              Vous pouvez émettre plusieurs demandes simultanées vers différents quartiers de Ouagadougou.
            </p>
          </div>
          <button
            onClick={() => setShowNewModal(true)}
            className="px-5 py-3 bg-[#004D40] hover:bg-[#00382E] text-white font-black rounded-xl text-xs sm:text-sm shadow-lg flex items-center gap-2 cursor-pointer transition-all uppercase tracking-wider shrink-0 border border-teal-300"
          >
            <Plus className="w-5 h-5 text-[#00E5D9]" />
            <span>Publier une Autre Livraison</span>
          </button>
        </div>

        {requests.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-4">
            <Package className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-lg font-bold text-slate-700">Aucune demande enregistrée</h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              Cliquez sur "Nouvelle Livraison" pour publier votre première course et recevoir des propositions de nos livreurs vérifiés.
            </p>
            <button
              onClick={() => setShowNewModal(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs"
            >
              Publier un colis
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {requests.map((req) => (
              <div key={req.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                
                {/* Request Header */}
                <div className="p-4 sm:p-6 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm font-bold text-emerald-700">{req.trackingNumber}</span>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-200 text-slate-800">
                        {req.packageType}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-slate-800 mt-1">{req.description}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                      req.status === 'LIVRE' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                      req.status === 'EN_COURS_LIVRAISON' ? 'bg-amber-100 text-amber-800 border-amber-300 animate-pulse' :
                      req.status === 'LIVREUR_SELECTIONNE' ? 'bg-blue-100 text-blue-800 border-blue-300' :
                      req.status === 'PROPOSITIONS_RECUES' ? 'bg-indigo-100 text-indigo-800 border-indigo-300' :
                      req.status === 'LITIGE' ? 'bg-red-100 text-red-800 border-red-300' : 'bg-slate-100 text-slate-700 border-slate-300'
                    }`}>
                      {req.status}
                    </span>

                    {req.delivery && req.status !== 'LIVRE' && req.status !== 'LITIGE' && (
                      <button
                        onClick={() => setDisputeRequestId(req.id)}
                        className="px-2.5 py-1 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-200"
                      >
                        Signaler
                      </button>
                    )}
                  </div>
                </div>

                {/* Details Section */}
                <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-6 border-b border-slate-100">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <div className="text-xs text-slate-400 font-bold uppercase">Lieu de récupération</div>
                        <div className="text-sm font-semibold text-slate-800">{req.pickupAddress}</div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <div className="text-xs text-slate-400 font-bold uppercase">Destination</div>
                        <div className="text-sm font-semibold text-slate-800">{req.dropoffAddress}</div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Date & Heure :</span>
                      <span className="font-semibold">{req.scheduledDate} à {req.scheduledTime}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Niveau d'urgence :</span>
                      <span className="font-bold text-amber-600">{req.urgencyLevel}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Quantité :</span>
                      <span className="font-semibold">{req.quantity} article(s)</span>
                    </div>
                    {req.additionalNotes && (
                      <div className="pt-1 text-slate-500 italic">
                        Note: "{req.additionalNotes}"
                      </div>
                    )}
                  </div>
                </div>

                {/* OTP Security Codes Block (If driver selected) */}
                {req.delivery && req.delivery.codes && (
                  <div className="p-4 sm:p-6 bg-emerald-900 text-white space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Lock className="w-5 h-5 text-emerald-400" />
                        <span className="font-bold text-sm">Codes de Sécurité OTP (À garder confidentiels)</span>
                      </div>
                      <span className="text-xs bg-emerald-800 text-emerald-200 px-2.5 py-0.5 rounded-full">
                        Validation Requis
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                      <div className="p-3 bg-emerald-950/80 rounded-xl border border-emerald-700/50 space-y-1">
                        <div className="text-xs text-emerald-300 font-semibold">1. Code de Récupération (Colis Ramassé)</div>
                        <div className="text-2xl font-mono font-black text-amber-300 tracking-wider">
                          {req.delivery.codes.pickupCode}
                        </div>
                        <div className="text-[11px] text-emerald-400">Donnez ce code au livreur lorsqu'il prend le colis.</div>
                      </div>

                      <div className="p-3 bg-emerald-950/80 rounded-xl border border-emerald-700/50 space-y-1">
                        <div className="text-xs text-emerald-300 font-semibold">2. Code de Confirmation (Colis Livré)</div>
                        <div className="text-2xl font-mono font-black text-emerald-300 tracking-wider">
                          {req.delivery.codes.deliveryCode}
                        </div>
                        <div className="text-[11px] text-emerald-400">Communiquement ce code à l'arrivée finale.</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Selected Driver Info OR Proposals Comparison Table */}
                <div className="p-4 sm:p-6">
                  {req.delivery ? (
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center">
                          <Truck className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-xs text-slate-400">Livreur Sélectionné</div>
                          <div className="text-sm font-extrabold text-slate-900 flex items-center gap-1">
                            {req.delivery.driver?.profile?.fullName || 'Livreur Partner'}
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-300">
                              ✓ VÉRIFIÉ
                            </span>
                          </div>
                          <div className="text-xs text-slate-500">Prix convenu : <strong className="text-emerald-700 font-bold">{req.delivery.agreedPriceFcfa} FCFA</strong></div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {req.status !== 'LIVRE' && (
                          <button
                            type="button"
                            onClick={() => handleChangeDriver(req.id, req.trackingNumber)}
                            className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white font-extrabold rounded-xl text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer border border-amber-300"
                            title="Réouvrir la demande et choisir un autre livreur"
                          >
                            <RefreshCw className="w-4 h-4" />
                            <span>🔄 Changer de Livreur</span>
                          </button>
                        )}

                        {req.status === 'LIVRE' && !req.delivery.reviews?.length && (
                          <button
                            onClick={() => setReviewDeliveryId(req.id)}
                            className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs transition-colors flex items-center gap-1 shadow-sm"
                          >
                            <Star className="w-4 h-4 fill-white" /> Évaluer la course
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                          Propositions Reçues ({req.proposals.length})
                        </h4>
                        <span className="text-xs text-slate-500">Comparez les tarifs et choisissez librement</span>
                      </div>

                      {req.proposals.length === 0 ? (
                        <div className="p-6 bg-slate-50 rounded-xl text-center text-slate-500 text-xs italic border border-slate-200">
                          En attente des propositions des livreurs disponibles à Ouagadougou...
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {req.proposals.map((prop: any) => (
                            <div key={prop.id} className="p-4 rounded-xl border border-slate-200 bg-white hover:border-emerald-500 transition-all space-y-3 shadow-xs">
                              
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs">
                                    {prop.driver?.profile?.fullName?.substring(0, 2).toUpperCase() || 'LV'}
                                  </div>
                                  <div>
                                    <div className="text-xs font-bold text-slate-900 flex items-center gap-1">
                                      {prop.driver?.profile?.fullName}
                                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold">
                                        ✓ VÉRIFIÉ
                                      </span>
                                    </div>
                                    <div className="text-[11px] text-slate-500 flex items-center gap-1">
                                      <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                                      {prop.driver?.driver?.ratingAvg || 5.0} ({prop.driver?.driver?.totalDeliveries || 0} courses)
                                    </div>
                                  </div>
                                </div>

                                <div className="text-right">
                                  <div className="text-base font-black text-emerald-600">
                                    {prop.proposedPriceFcfa} FCFA
                                  </div>
                                  <div className="text-[11px] text-slate-500 font-medium">
                                    Délai : ~{prop.estimatedDurationMinutes} min
                                  </div>
                                </div>
                              </div>

                              {prop.comment && (
                                <p className="text-xs text-slate-600 italic bg-slate-50 p-2 rounded-lg border border-slate-100">
                                  "{prop.comment}"
                                </p>
                              )}

                              <button
                                onClick={() => handleSelectDriver(req.id, prop.id, prop.driver?.profile?.fullName, prop.proposedPriceFcfa)}
                                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs shadow-md shadow-emerald-600/20 cursor-pointer uppercase tracking-wider transition-all"
                              >
                                🎯 Choisir ce livreur ({prop.proposedPriceFcfa} FCFA)
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* LIVE TRACKING MAP & CHRONOMETER SECTION */}
                <div className="p-4 sm:p-6 bg-slate-50 border-t border-slate-200 space-y-2">
                  <div className="text-xs font-black text-[#004D40] uppercase tracking-wider flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Navigation className="w-4 h-4 text-emerald-600" /> Suivi GPS en Temps Réel & Chronomètre :
                    </span>
                    {req.delivery?.pickedUpAt && req.status !== 'LIVRE' && (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black animate-pulse border border-emerald-300">
                        🟢 CHRONO EN COURS
                      </span>
                    )}
                  </div>
                  <DeliveryMap
                    pickupAddress={req.pickupAddress}
                    dropoffAddress={req.dropoffAddress}
                    driverName={req.delivery?.driver?.profile?.fullName}
                    status={req.status}
                    pickedUpAt={req.delivery?.pickedUpAt}
                    deliveredAt={req.delivery?.deliveredAt}
                  />
                </div>

              </div>
            ))}
          </div>
        )}

      </div>

      {/* NEW DELIVERY MODAL */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Package className="w-5 h-5 text-emerald-600" /> Nouvelle Demande de Livraison
              </h3>
              <button onClick={() => setShowNewModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <form onSubmit={handleCreateDelivery} className="space-y-4">
              
              {/* Point A: LIEU DE RÉCUPÉRATION */}
              <div className="space-y-2 bg-[#F0FDFB] p-4 rounded-2xl border border-teal-200 shadow-xs">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-black text-[#004D40] uppercase tracking-wider flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-emerald-600" /> Lieu de Récupération (Point A / Départ) *
                  </label>
                  <button
                    type="button"
                    onClick={() => handleDetectGps('pickup')}
                    disabled={detectingPickupGps}
                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-black flex items-center gap-1 shadow-xs transition-all cursor-pointer"
                  >
                    <Compass className={`w-3 h-3 ${detectingPickupGps ? 'animate-spin' : ''}`} />
                    {detectingPickupGps ? 'Détection...' : '📍 GPS Actuel'}
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={pickupAddress}
                  onChange={(e) => setPickupAddress(e.target.value)}
                  placeholder="ex: Zogona, pharmacie de la Paix ou Stand Marché"
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-teal-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-bold outline-none shadow-xs text-slate-800"
                />
                
                <div className="space-y-1 pt-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Quartiers populaires (cliquez pour insérer) :</span>
                  <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto">
                    {POPULAR_QUARTIERS.map((q) => (
                      <button
                        type="button"
                        key={q}
                        onClick={() => setPickupAddress(q)}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md border transition-all cursor-pointer ${
                          pickupAddress === q || pickupAddress.includes(q)
                            ? 'bg-emerald-600 text-white border-emerald-700 font-black'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-teal-50'
                        }`}
                      >
                        + {q}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* LISTE DYNAMIQUE DES DESTINATIONS (DANS UN SEUL FORMULAIRE / ESPACE) */}
              <div className="space-y-4 pt-2">
                <div className="flex flex-wrap items-center justify-between gap-2 bg-emerald-50 p-3 rounded-2xl border border-emerald-200">
                  <div className="flex items-center gap-2 text-emerald-950 font-black text-xs sm:text-sm">
                    <Package className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span>Destinations & Courses à Réaliser ({destinations.length})</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddDestination}
                    className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md transition-all cursor-pointer border border-white"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Ajouter une Autre Destination</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {destinations.map((dest, idx) => (
                    <div key={idx} className="p-4 bg-[#F0FDFB] rounded-2xl border-2 border-teal-200 space-y-3 shadow-xs relative">
                      <div className="flex items-center justify-between gap-2 border-b border-teal-100 pb-2">
                        <span className="text-xs font-black text-[#004D40] bg-white px-3 py-1 rounded-full border border-teal-300 shadow-xs flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-blue-600" />
                          <span>📍 Destination N° {idx + 1}</span>
                        </span>
                        {destinations.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveDestination(idx)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                            title="Supprimer cette destination"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Supprimer</span>
                          </button>
                        )}
                      </div>

                      {/* Adresse de Destination (Point B) */}
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Adresse / Quartier du Client Destinataire *
                        </label>
                        <input
                          type="text"
                          required
                          value={dest.dropoffAddress}
                          onChange={(e) => handleDestinationChange(idx, 'dropoffAddress', e.target.value)}
                          placeholder="ex: Ouaga 2000, près du canal ou Karpala"
                          className="w-full px-3.5 py-2.5 text-sm bg-white border border-teal-200 rounded-xl focus:ring-2 focus:ring-blue-500 font-bold outline-none shadow-xs text-slate-800"
                        />

                        <div className="space-y-1 pt-1">
                          <span className="text-[10px] font-bold text-slate-500 uppercase">Raccourcis Quartiers :</span>
                          <div className="flex flex-wrap gap-1 max-h-14 overflow-y-auto">
                            {POPULAR_QUARTIERS.map((q) => (
                              <button
                                type="button"
                                key={q}
                                onClick={() => handleDestinationChange(idx, 'dropoffAddress', q)}
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-md border transition-all cursor-pointer ${
                                  dest.dropoffAddress === q || dest.dropoffAddress.includes(q)
                                    ? 'bg-blue-600 text-white border-blue-700 font-black'
                                    : 'bg-white text-slate-700 border-slate-200 hover:bg-blue-50'
                                }`}
                              >
                                + {q}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                            Type de Colis
                          </label>
                          <select
                            value={dest.packageType}
                            onChange={(e) => handleDestinationChange(idx, 'packageType', e.target.value)}
                            className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl outline-none font-bold"
                          >
                            <option value="Colis Vêtements & Chaussures">Vêtements & Chaussures</option>
                            <option value="Documents & Pli urgent">Documents & Pli urgent</option>
                            <option value="Électronique & High-Tech">Électronique & High-Tech</option>
                            <option value="Repas & Alimentaire">Repas & Alimentaire</option>
                            <option value="Marchandise Lourde (Tricycle)">Marchandise Lourde</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                            Téléphone du Destinataire * (Obligatoire)
                          </label>
                          <input
                            type="text"
                            required
                            value={dest.recipientPhone}
                            onChange={(e) => handleDestinationChange(idx, 'recipientPhone', e.target.value)}
                            placeholder="ex: +226 78 00 11 22"
                            className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl outline-none font-bold"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                          Description des articles pour cette destination *
                        </label>
                        <input
                          type="text"
                          required
                          value={dest.description}
                          onChange={(e) => handleDestinationChange(idx, 'description', e.target.value)}
                          placeholder="ex: 2 boubous noirs en sachet + 1 paire de chaussures"
                          className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl outline-none font-bold"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Urgence globale */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Niveau d'Urgence des Livraisons
                </label>
                <select
                  value={urgencyLevel}
                  onChange={(e) => setUrgencyLevel(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl outline-none font-bold"
                >
                  <option value="NORMAL">Normal</option>
                  <option value="URGENT">Urgent (Immédiat)</option>
                  <option value="PROGRAMME">Programmé</option>
                </select>
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="w-1/3 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-2/3 py-3.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 text-white font-black rounded-xl text-xs sm:text-sm shadow-xl shadow-emerald-600/30 cursor-pointer uppercase tracking-wider border-2 border-white flex items-center justify-center gap-2"
                >
                  <span>{submitting ? 'Publication...' : `🚀 Lancer les ${destinations.length} livraison(s) en 1-Clic`}</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* REVIEW MODAL */}
      {reviewDeliveryId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Évaluer le livreur</h3>
            
            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-500 font-bold uppercase mb-2">Note globale (1 à 5 étoiles)</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setRating(star)}
                      className={`p-2 rounded-lg transition-colors ${rating >= star ? 'text-amber-500' : 'text-slate-300'}`}
                    >
                      <Star className="w-7 h-7 fill-current" />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-500 font-bold uppercase mb-1">Commentaire</label>
                <textarea
                  rows={3}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Livreur très ponctuel et très courtois !"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl outline-none"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setReviewDeliveryId(null)}
                  className="w-1/2 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2 bg-emerald-600 text-white font-bold rounded-xl text-xs"
                >
                  Enregistrer l'évaluation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DISPUTE MODAL */}
      {disputeRequestId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-red-600 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" /> Signaler un problème / Litige
            </h3>
            
            <form onSubmit={handleSubmitDispute} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-500 font-bold uppercase mb-1">Motif du signalement</label>
                <select
                  value={disputeCategory}
                  onChange={(e) => setDisputeCategory(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl outline-none"
                >
                  <option value="COLIS_NON_LIVRE">Colis non livré</option>
                  <option value="COLIS_ENDOMMAGE">Colis endommagé</option>
                  <option value="RETARD">Retard important</option>
                  <option value="COMPORTEMENT_INAPPROPRIE">Comportement inapproprié</option>
                  <option value="FRAUDE">Suspicion de fraude</option>
                  <option value="AUTRE">Autre motif</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-500 font-bold uppercase mb-1">Description détaillée *</label>
                <textarea
                  required
                  rows={3}
                  value={disputeDescription}
                  onChange={(e) => setDisputeDescription(e.target.value)}
                  placeholder="Expliquez en détail ce qu'il s'est passé..."
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl outline-none"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setDisputeRequestId(null)}
                  className="w-1/2 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2 bg-red-600 text-white font-bold rounded-xl text-xs"
                >
                  Ouvrir le litige
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BOUTIQUE SUBSCRIPTION RENEWAL MODAL */}
      {showRenewModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                💳 Renouvellement Abonnement Boutique
              </h3>
              <button onClick={() => setShowRenewModal(false)} className="text-slate-400 hover:text-slate-600 font-black text-xl">✕</button>
            </div>

            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs space-y-1">
              <div className="font-extrabold text-emerald-950">Abonnement Mensuel Boutique : 1 000 FCFA / mois</div>
              <p className="text-emerald-800">
                Le renouvellement ajoute **30 jours d'accès illimité** pour publier et faire livrer vos articles sur Ouagadougou.
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
                    Composez le <strong>*144*2*1*06887330*1000#</strong> sur votre téléphone pour régler votre abonnement mensuel de <strong>1 000 FCFA</strong> (Marchand : 06887330).
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
                    placeholder="ex: +226 78 44 55 66"
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
                  {renewing ? 'Paiement...' : 'Payer 1 000 FCFA (30J)'}
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
          role={currentUser?.role || 'COMMERCANT'}
        />
      )}

    </div>
  );
}
