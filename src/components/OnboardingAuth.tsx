'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Truck,
  Phone,
  Lock,
  User,
  Store,
  Building2,
  AlertCircle,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Info,
  X,
  CheckCircle2,
  Eye,
  EyeOff,
  Mail,
} from 'lucide-react';

interface OnboardingAuthProps {
  onSuccess?: () => void;
  redirectUrl?: string;
}

export function OnboardingAuth({ onSuccess, redirectUrl }: OnboardingAuthProps) {
  const router = useRouter();
  const [mode, setMode] = useState<'register' | 'login'>('register');
  const [role, setRole] = useState<'COMMERCANT' | 'LIVREUR'>('LIVREUR');

  // Form states
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('+226 ');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [companyName, setCompanyName] = useState('');

  // Driver KYC fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [idCardFileUrl, setIdCardFileUrl] = useState('');
  const [idCardNumber, setIdCardNumber] = useState('');
  const [vehicleType, setVehicleType] = useState('MOTO');
  const [brand, setBrand] = useState('Yamaha');
  const [vehiclePhotoUrl, setVehiclePhotoUrl] = useState('');

  // Complete Ouagadougou Arrondissements & Quartiers Dataset
  const OUAGA_ARRONDISSEMENTS = [
    {
      id: 1,
      name: 'Arrondissement 1',
      quartiers: ['Bilbalogo', 'Saint-Léon', 'Zangouettin', 'Tiedpalogo', 'Koulouba', 'Kamsonghin', 'Samandin', 'Gounghin Sud', 'Gandin (Petit Paris)', 'Kouritenga', 'Mankoudougou'],
    },
    {
      id: 2,
      name: 'Arrondissement 2',
      quartiers: ['Paspanga', 'Ouidi', 'Larlé', 'Kologh-Naba', 'Dapoya II', 'Nemnin', 'Niogsin', 'Hamdalaye', 'Gounghin Nord', 'Baoghin', 'Cité An III', 'Sankariaré'],
    },
    {
      id: 3,
      name: 'Arrondissement 3',
      quartiers: ['Camp militaire', 'Naab Pougo', 'Yaoghin', 'Zongo', 'Noncin/Nonsin', 'Rimkiéta', 'Toécin', 'Kilwin', 'Tampouy', 'Kienbaoghin', 'Koumdayonré'],
    },
    {
      id: 4,
      name: 'Arrondissement 4',
      quartiers: ['Tanghin', 'Sambin Barrage', 'Somgandé', 'Zone industrielle de Kossodo', 'Toudoubwéogo', 'Sogdin', 'Polesgo', 'Tabtenga', 'Toukin'],
    },
    {
      id: 5,
      name: 'Arrondissement 5',
      quartiers: ['ENAREF', 'Wayalghin', 'Zone du Bois', 'Zogona', '1200 Logements', 'Dagnoën', 'Wemtenga', 'Ronsin', 'Kalgondin', 'Ouaga Inter', 'SIAO', 'Silmissin', 'Toeyibin'],
    },
    {
      id: 6,
      name: 'Arrondissement 6',
      quartiers: ['Pagalayiri', 'Cissin', 'Pissy', 'Bongnaam', 'Kouritenga', 'Sonré', 'Song-Naaba', 'Azimo/Socogib'],
    },
    {
      id: 7,
      name: 'Arrondissement 7',
      quartiers: ['Nagrin', 'Yaoghin', 'Bonheur-Ville', 'Waa-Paasi', 'Belle-Ville', 'Sandogo', 'Boassa', 'Kankamsin', 'Zagtouli Sud', 'Zagtouli Nord'],
    },
    {
      id: 8,
      name: 'Arrondissement 8',
      quartiers: ['Darsalam', 'Zongo Nabitenga', 'Nonghin', 'Bassinko/Basseko', 'Sogpelcé', 'Bissighin', 'Silmiougou', 'Gantin'],
    },
    {
      id: 9,
      name: 'Arrondissement 9',
      quartiers: ['Silmiyiri', 'Marcoussis', 'Bissighin', 'Yagma', 'Ouapassi', 'Kamboincé', 'Zoodnoma', 'Watinonma', 'Kossoghin', 'Bangpooré', 'Wobriguéré', 'Babouang Rouanga', 'Toudwéogo', 'Kamboissin', 'Dapaweoghin'],
    },
    {
      id: 10,
      name: 'Arrondissement 10',
      quartiers: ['Kossodo', 'Nioko II', 'Bendogo', 'Wayalghin', 'Nioko I', 'Godin', 'Dassasgho', 'Goundrin', 'Quatorze-Yaar', 'Djikof', 'Taabtenga', 'Sakoula'],
    },
    {
      id: 11,
      name: 'Arrondissement 11',
      quartiers: ['Zone Une', 'Katr-Yaar', 'Rayongo', 'Yamtenga', 'Ouidtenga', 'Karpala', 'Balkuy', 'Lanoayiri', 'Dayongo', 'Sanyiri'],
    },
  ];

  const [selectedZones, setSelectedZones] = useState<string[]>(['Koulouba', 'Zogona', 'Tampouy', 'Pissy', 'Karpala']);
  const [quartierSearchQuery, setQuartierSearchQuery] = useState('');

  const toggleZone = (z: string) => {
    if (selectedZones.includes(z)) {
      setSelectedZones(selectedZones.filter(item => item !== z));
    } else {
      setSelectedZones([...selectedZones, z]);
    }
  };

  const toggleArrondissementQuartiers = (quartiers: string[]) => {
    const allSelected = quartiers.every(q => selectedZones.includes(q));
    if (allSelected) {
      setSelectedZones(selectedZones.filter(z => !quartiers.includes(z)));
    } else {
      const newSelected = new Set([...selectedZones, ...quartiers]);
      setSelectedZones(Array.from(newSelected));
    }
  };

  // Mobile Money Payment Method state (Orange Money, Moov Money, Wave)
  const [paymentMethod, setPaymentMethod] = useState<'ORANGE_MONEY' | 'MOOV_MONEY' | 'WAVE'>('ORANGE_MONEY');

  const getRegistrationAmount = (currentRole: string) => {
    if (currentRole === 'LIVREUR') return 1500;
    if (currentRole === 'COMMERCANT') return 2000;
    return 0;
  };

  const handleSelectOrangeMoney = () => {
    setPaymentMethod('ORANGE_MONEY');
  };

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Secret Admin Code Modal state (triggered by clicking Logo)
  const [showAdminSecretModal, setShowAdminSecretModal] = useState(false);
  const [adminCodeInput, setAdminCodeInput] = useState('');
  const [adminSecretError, setAdminSecretError] = useState('');
  const [adminSecretLoading, setAdminSecretLoading] = useState(false);

  const handleAdminSecretSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminSecretError('');
    setAdminSecretLoading(true);
    try {
      const res = await fetch('/api/auth/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: adminCodeInput.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setShowAdminSecretModal(false);
        if (onSuccess) onSuccess();
        router.push('/admin');
        router.refresh();
      } else {
        setAdminSecretError(data.error || 'Code secret administrateur invalide.');
      }
    } catch (err) {
      setAdminSecretError('Erreur de connexion réseau');
    } finally {
      setAdminSecretLoading(false);
    }
  };

  // Pending Approval State
  const [isWaitingApproval, setIsWaitingApproval] = useState(false);
  const [approvalStatus, setApprovalStatus] = useState<'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);
  const [pendingAccountData, setPendingAccountData] = useState<{
    phone: string;
    email?: string;
    role: string;
    fullName: string;
  } | null>(null);

  React.useEffect(() => {
    if (!isWaitingApproval) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            const driverStatus = data.user.driver?.verificationStatus;
            if (driverStatus === 'VERIFIE') {
              setApprovalStatus('APPROVED');
              clearInterval(interval);
            } else if (driverStatus === 'REJETE') {
              setApprovalStatus('REJECTED');
              setRejectionReason(data.user.driver?.rejectionReason || 'Dossier non conforme');
              clearInterval(interval);
            }
          }
        }
      } catch (err) {
        console.error('Polling status error:', err);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [isWaitingApproval]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Check if Admin passcode Nick2004 is submitted in password or phone field
      if (password.trim() === 'Nick2004' || phone.trim() === 'Nick2004') {
        const adminRes = await fetch('/api/auth/admin-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: 'Nick2004' }),
        });
        const adminData = await adminRes.json();
        if (adminRes.ok) {
          if (onSuccess) onSuccess();
          router.push('/admin');
          router.refresh();
          return;
        }
      }

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        // Fallback for Admin passcode
        if (password.trim() === 'Nick2004') {
          const fallbackRes = await fetch('/api/auth/admin-login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code: 'Nick2004' }),
          });
          if (fallbackRes.ok) {
            if (onSuccess) onSuccess();
            router.push('/admin');
            router.refresh();
            return;
          }
        }
        throw new Error(data.error || 'Erreur de connexion');
      }

      if (onSuccess) onSuccess();

      const target = redirectUrl || (data.user.role === 'ADMIN' ? '/admin' : data.user.role === 'LIVREUR' ? '/livreur' : '/client');
      router.push(target);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileRead = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      if (reader.result) {
        setter(reader.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!idCardNumber.trim()) {
        throw new Error('Le numéro de la CNIB ou du Passeport est obligatoire pour tous les utilisateurs.');
      }

      if (role === 'COMMERCANT') {
        if (!idCardFileUrl) {
          throw new Error('La photo de la pièce d\'identité (CNIB / Passeport) du gérant est obligatoire.');
        }
      }

      if (role === 'LIVREUR') {
        if (!firstName.trim() || !lastName.trim()) {
          throw new Error('Le nom et le prénom sont obligatoires.');
        }
        if (!photoUrl) {
          throw new Error('La photo de profil est obligatoire (Veuillez importer une image).');
        }
        if (!idCardFileUrl) {
          throw new Error('La photo de la pièce d\'identité (recto-verso) ou du passeport est obligatoire.');
        }
        if (!brand.trim()) {
          throw new Error('La marque et le modèle du véhicule sont obligatoires.');
        }
        if (!vehiclePhotoUrl) {
          throw new Error('La photo de la moto / véhicule est obligatoire.');
        }
        if (selectedZones.length === 0) {
          throw new Error('Veuillez sélectionner au moins un quartier desservi.');
        }
      }

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone,
          email: email || null,
          password,
          role,
          fullName: role === 'LIVREUR' ? `${firstName} ${lastName}`.trim() : fullName,
          firstName,
          lastName,
          companyName: companyName || null,
          photoUrl: photoUrl || null,
          idCardNumber: idCardNumber.trim(),
          idCardFileUrl: idCardFileUrl || null,
          vehicleType,
          brand,
          vehiclePhotoUrl: vehiclePhotoUrl || null,
          preferredZones: selectedZones.join(', '),
          paymentMethod,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors de l\'inscription');
      }

      if (paymentMethod === 'WAVE') {
        window.open('https://pay.wave.com', '_blank');
      }

      // Directly redirect user to their dashboard upon successful registration
      if (onSuccess) {
        onSuccess();
      } else {
        const destination = role === 'LIVREUR' ? '/livreur' : '/client';
        router.push(destination);
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const setDemoAccount = async (demoPhone: string) => {
    setLoading(true);
    try {
      const demoPass = (demoPhone === '+226 70 00 00 00' || demoPhone === 'Nick2004') ? 'Nick2004' : 'password123';
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: demoPhone, password: demoPass }),
      });

      const data = await res.json();
      if (res.ok && data.user) {
        if (onSuccess) onSuccess();
        const target = redirectUrl || (data.user.role === 'ADMIN' ? '/admin' : data.user.role === 'LIVREUR' ? '/livreur' : '/client');
        router.push(target);
        router.refresh();
      }
    } catch (e) {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  if (isWaitingApproval) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#00E5D9] via-[#00D2C4] to-[#009688] text-[#004D40] flex flex-col items-center justify-center p-4 sm:p-8 font-sans">
        <div className="max-w-xl w-full bg-white rounded-[2.5rem] p-6 sm:p-10 shadow-2xl space-y-6 text-center border-4 border-white/80 relative overflow-hidden">
          
          {approvalStatus === 'PENDING' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="w-24 h-24 mx-auto rounded-full bg-teal-100 flex items-center justify-center text-4xl shadow-xl border-4 border-teal-300 relative">
                <span className="animate-pulse">⌛</span>
                <span className="absolute -bottom-1 -right-1 flex h-6 w-6">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-6 w-6 bg-[#009688]"></span>
                </span>
              </div>

              <div>
                <span className="px-4 py-1.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 font-black text-xs uppercase tracking-wider animate-pulse inline-flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
                  EN VERIFICATION PAR L&apos;ADMINISTRATEUR
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-[#004D40] mt-3 uppercase tracking-tight">
                  Demande Transmise !
                </h2>
                <p className="text-xs sm:text-sm font-bold text-slate-600 mt-2 leading-relaxed">
                  Vos informations et votre paiement ({getRegistrationAmount(role)} FCFA via {paymentMethod.replace('_', ' ')}) ont été enregistrés avec succès.
                  <br />
                  <strong className="text-[#00796B]">Veuillez patienter sur cette page</strong> pendant que l&apos;administrateur vérifie votre dossier et approuve votre compte.
                </p>
              </div>

              {/* Submitted Account Details Card */}
              <div className="bg-[#E6FFFA] p-5 rounded-3xl border-2 border-teal-200 text-left space-y-3 text-xs font-bold text-[#004D40]">
                <div className="flex justify-between border-b border-teal-100 pb-2">
                  <span className="text-slate-500 uppercase font-black text-[10px]">Titulaire du compte :</span>
                  <span className="font-black text-sm">{pendingAccountData?.fullName}</span>
                </div>
                <div className="flex justify-between border-b border-teal-100 pb-2">
                  <span className="text-slate-500 uppercase font-black text-[10px]">Téléphone :</span>
                  <span className="font-mono font-black text-sm">{pendingAccountData?.phone}</span>
                </div>
                <div className="flex justify-between border-b border-teal-100 pb-2">
                  <span className="text-slate-500 uppercase font-black text-[10px]">Type de Compte :</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-teal-200 text-[#004D40] font-black text-[10px] uppercase">
                    {pendingAccountData?.role}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 uppercase font-black text-[10px]">Statut du Dossier :</span>
                  <span className="text-amber-700 font-black flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                    En cours de vérification par l&apos;admin...
                  </span>
                </div>
              </div>

              <div className="p-4 bg-teal-50 rounded-2xl border border-teal-200 text-xs font-black text-[#00796B] flex items-center justify-center gap-2">
                <span className="animate-spin text-base">🔄</span>
                <span>Vérification automatique en temps réel... (Ne fermez pas cette page)</span>
              </div>
            </div>
          )}

          {approvalStatus === 'APPROVED' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="w-24 h-24 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-5xl shadow-2xl border-4 border-emerald-400">
                🥳
              </div>
              <div>
                <span className="px-4 py-1.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 font-black text-xs uppercase tracking-wider">
                  ✓ COMPTE VÉRIFIÉ ET APPROUVÉ PAR L&apos;ADMIN !
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-emerald-950 mt-3 uppercase">
                  Félicitations !
                </h2>
                <p className="text-xs sm:text-sm font-bold text-slate-600 mt-2">
                  L&apos;administrateur vient de valider votre dossier. Votre compte est actif et prêt à l&apos;emploi.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (onSuccess) onSuccess();
                  const target = redirectUrl || (role === 'LIVREUR' ? '/livreur' : '/client');
                  router.push(target);
                  router.refresh();
                }}
                className="w-full py-4 px-6 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 text-white font-black text-base uppercase rounded-full shadow-2xl transform hover:scale-105 transition-all cursor-pointer border-2 border-white"
              >
                🚀 ACCÉDER À MON ESPACE DE SUITE
              </button>
            </div>
          )}

          {approvalStatus === 'REJECTED' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="w-24 h-24 mx-auto rounded-full bg-red-100 text-red-600 flex items-center justify-center text-5xl shadow-2xl border-4 border-red-300">
                ❌
              </div>
              <div>
                <span className="px-4 py-1.5 rounded-full bg-red-100 text-red-900 border border-red-300 font-black text-xs uppercase tracking-wider">
                  DOSSIER NON CONFORME
                </span>
                <h2 className="text-2xl font-black text-red-950 mt-3">
                  Votre demande n&apos;a pas été validée
                </h2>
                {rejectionReason && (
                  <p className="text-xs font-bold text-red-800 bg-red-50 p-4 rounded-2xl border border-red-200 mt-3">
                    Motif indiqué par l&apos;admin : <br />
                    <span className="font-extrabold text-sm">{rejectionReason}</span>
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => setIsWaitingApproval(false)}
                className="w-full py-4 px-6 bg-slate-800 hover:bg-slate-900 text-white font-black text-xs uppercase rounded-full shadow-lg transition-all cursor-pointer"
              >
                ← Modifier mes Informations &amp; Renvoyer
              </button>
            </div>
          )}

        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#00E5D9] via-[#00D2C4] to-[#009688] text-[#004D40] flex flex-col justify-between p-4 sm:p-8 md:p-12 relative overflow-hidden font-sans selection:bg-[#009688] selection:text-white">
      
      {/* Background Pattern */}
      <div 
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: 'repeating-linear-gradient(45deg, #ffffff 0, #ffffff 15px, transparent 0, transparent 30px)'
        }}
      />

      {/* Top Header Bar (FULL WIDTH SPACING) */}
      <div className="w-full max-w-5xl mx-auto flex flex-col items-center justify-center text-center relative z-10 pt-4 pb-2">
        <div 
          onClick={() => setShowAdminSecretModal(true)} 
          className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 bg-white/20 backdrop-blur-md p-4 sm:p-6 rounded-[2.5rem] border-2 border-white/40 shadow-2xl w-full cursor-pointer hover:bg-white/30 transition-all group"
          title="👑 Cliquer pour la Connexion Administrateur Secret"
        >
          {/* Highlighted Big Logo Icon */}
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-white text-[#009688] shadow-2xl p-1 flex items-center justify-center font-bold border-4 border-white transform group-hover:scale-105 transition-all shrink-0">
            <Truck className="w-11 h-11 sm:w-14 sm:h-14 text-[#009688]" />
          </div>
          {/* Highlighted Title + Badge */}
          <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
            <span className="font-black text-3xl sm:text-6xl tracking-tight text-white block drop-shadow-md">
              Livraison<span className="text-teal-100">Ouaga</span>
            </span>
            <span className="mt-1 text-xs sm:text-base uppercase font-black tracking-widest text-[#004D40] bg-white px-5 py-1.5 rounded-full shadow-md inline-block border border-teal-100 flex items-center gap-1.5">
              Burkina Faso 🇧🇫
            </span>
          </div>
        </div>
      </div>

      {/* Main Registration Card (TAKING FULL SPACE / MAX-W-5XL) */}
      <div className="w-full max-w-5xl mx-auto my-auto py-6 relative z-10">
        
        {/* Floating Top Avatar Icon Badge */}
        <div className="relative z-20 flex justify-center -mb-10">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#00E5D9] via-[#00B4D8] to-[#009688] border-4 border-white shadow-2xl flex items-center justify-center text-white">
            <User className="w-12 h-12 text-white" />
          </div>
        </div>

        <div className="bg-white text-[#004D40] rounded-[3rem] p-8 sm:p-14 md:p-16 shadow-2xl border-4 border-white/80 space-y-8 relative pt-16">
          
          {/* Main Title */}
          <div className="text-center space-y-2 max-w-3xl mx-auto">
            <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-wider text-[#004D40]">
              {mode === 'register' ? 'CRÉER VOTRE COMPTE' : 'CONNEXION À VOTRE ESPACE'}
            </h1>
            <div className="inline-block bg-[#E0F7F6] border border-teal-200 text-[#00695C] px-6 py-2 rounded-full text-xs sm:text-base font-extrabold shadow-sm">
              {mode === 'register'
                ? 'Accès rapide et gratuit à la plateforme de livraison à Ouagadougou'
                : 'Identifiez-vous pour gérer vos livraisons'}
            </div>
          </div>

          {/* Role Selector Tabs (WITH EXACT REGISTRATION PRICING BADGES) */}
          {mode === 'register' && (
            <div className="space-y-3 max-w-4xl mx-auto">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
                <label className="text-xs sm:text-base font-black uppercase tracking-wider text-[#004D40] block">
                  SELECTIONNEZ VOTRE PROFIL :
                </label>
                <span className="text-xs sm:text-sm font-black text-teal-800 bg-teal-100 px-4 py-1 rounded-full border border-teal-300 shadow-sm">
                  💳 Inscription : Livreur 1 500f • Boutique 2 000f | Abonnement : 1 000f/mois
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 p-3 bg-[#F0FDFB] rounded-3xl border-2 border-teal-200 shadow-inner">
                {/* LIVREUR - 1500 FCFA */}
                <button
                  type="button"
                  onClick={() => setRole('LIVREUR')}
                  className={`py-4 px-3 rounded-2xl text-xs sm:text-base font-black transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                    role === 'LIVREUR'
                      ? 'bg-gradient-to-r from-teal-600 to-cyan-700 text-white shadow-xl ring-2 ring-teal-400 scale-105'
                      : 'text-[#00695C] bg-white hover:bg-teal-100/60 border border-teal-100'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <Truck className="w-5 h-5 shrink-0" />
                    <span className="font-black">Livreur</span>
                  </div>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-black ${
                    role === 'LIVREUR' ? 'bg-white/25 text-white' : 'bg-teal-100 text-teal-900'
                  }`}>
                    1 500 FCFA (Inscription)
                  </span>
                </button>

                {/* BOUTIQUE - 2000 FCFA */}
                <button
                  type="button"
                  onClick={() => setRole('COMMERCANT')}
                  className={`py-4 px-3 rounded-2xl text-xs sm:text-base font-black transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                    role === 'COMMERCANT'
                      ? 'bg-gradient-to-r from-sky-600 to-blue-700 text-white shadow-xl ring-2 ring-blue-400 scale-105'
                      : 'text-[#00695C] bg-white hover:bg-teal-100/60 border border-teal-100'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <Store className="w-5 h-5 shrink-0" />
                    <span className="font-black">Boutique</span>
                  </div>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-black ${
                    role === 'COMMERCANT' ? 'bg-white/25 text-white' : 'bg-sky-100 text-sky-900'
                  }`}>
                    2 000 FCFA (Inscription)
                  </span>
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="p-5 bg-teal-50 text-teal-900 rounded-3xl text-xs sm:text-base font-black flex items-center gap-3 border-2 border-teal-300 shadow-md max-w-4xl mx-auto">
              <AlertCircle className="w-6 h-6 text-teal-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form Input Fields */}
          <form
            onSubmit={mode === 'register' ? handleRegisterSubmit : handleLoginSubmit}
            className="space-y-6 max-w-4xl mx-auto"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {mode === 'register' && role !== 'LIVREUR' && (
                <div className="md:col-span-2 space-y-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-black uppercase text-[#004D40] mb-2 ml-1">
                      Nom Complet ou Raison Sociale de la Boutique * :
                    </label>
                    <div className="relative">
                      <User className="w-6 h-6 absolute left-4.5 top-4.5 text-[#009688]" />
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="ex: Boutique Kaboré & Frères"
                        className="w-full bg-[#F0FDFB] text-[#004D40] placeholder-[#00796B]/70 rounded-full pl-14 pr-6 py-4.5 text-xs sm:text-base font-black outline-none shadow-sm border-2 border-teal-200 focus:border-[#009688] transition-all"
                      />
                    </div>
                  </div>

                  {/* NUMÉRO & PHOTO D'IDENTITE DU GERANT / BOUTIQUE */}
                  {role === 'COMMERCANT' && (
                    <div className="space-y-4 bg-[#E6FFFA] p-5 rounded-3xl border-2 border-teal-200">
                      <h4 className="font-black text-sm text-[#004D40] uppercase flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-[#009688]" /> Pièce d'Identité du Gérant (CNIB / Passeport)
                      </h4>

                      {/* Numéro CNIB ou Passeport du Gérant en premier */}
                      <div>
                        <label className="block text-xs font-black uppercase text-[#004D40] mb-1">
                          Numéro CNIB ou Passeport du Gérant * :
                        </label>
                        <input
                          type="text"
                          required
                          value={idCardNumber}
                          onChange={(e) => setIdCardNumber(e.target.value)}
                          placeholder="ex: B12345678 ou N° Passeport..."
                          className="w-full bg-white text-[#004D40] font-black rounded-2xl px-4 py-3.5 text-xs sm:text-sm outline-none border-2 border-teal-200"
                        />
                      </div>

                      {/* Photo de la pièce du gérant en second */}
                      <div className="space-y-2">
                        <label className="block text-xs font-black uppercase text-[#004D40]">
                          Photo de la Pièce d'Identité du Gérant (CNIB / Passeport) * :
                        </label>

                        <div className="space-y-2 bg-white p-4 rounded-2xl border border-teal-200">
                          {idCardFileUrl ? (
                            <div className="relative">
                              <img src={idCardFileUrl} alt="Aperçu Pièce Gérant" className="w-full max-h-48 object-cover rounded-xl border-2 border-[#009688] shadow-md" />
                              <button
                                type="button"
                                onClick={() => setIdCardFileUrl('')}
                                className="absolute top-2 right-2 bg-red-600 text-white rounded-full px-3 py-1 text-xs font-bold shadow-md"
                              >
                                ✕ Changer la photo
                              </button>
                            </div>
                          ) : (
                            <div className="p-6 text-center border-2 border-dashed border-teal-300 rounded-xl space-y-2 bg-teal-50/50">
                              <span className="text-2xl">🪪</span>
                              <div className="text-xs font-bold text-[#004D40]">Aucune photo de pièce sélectionnée *</div>
                            </div>
                          )}

                          <div className="pt-1">
                            <label className="w-full py-3.5 px-4 bg-[#009688] hover:bg-[#00796B] text-white font-black text-xs rounded-xl cursor-pointer flex items-center justify-center gap-2 shadow-sm transition-all border border-white">
                              <span>📷 Choisir la photo d'identité du gérant (CNIB / Passeport) *</span>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleFileRead(e, setIdCardFileUrl)}
                                className="hidden"
                              />
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* LIVREUR IDENTITE: NOM & PRENOM */}
              {mode === 'register' && role === 'LIVREUR' && (
                <React.Fragment>
                  <div>
                    <label className="block text-xs sm:text-sm font-black uppercase text-[#004D40] mb-2 ml-1">
                      Nom de Famille * :
                    </label>
                    <input
                      type="text"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="ex: KABORÉ"
                      className="w-full bg-[#F0FDFB] text-[#004D40] placeholder-[#00796B]/70 rounded-full px-6 py-4.5 text-xs sm:text-base font-black outline-none shadow-sm border-2 border-teal-200 focus:border-[#009688] transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-black uppercase text-[#004D40] mb-2 ml-1">
                      Prénom * :
                    </label>
                    <input
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="ex: Ousmane"
                      className="w-full bg-[#F0FDFB] text-[#004D40] placeholder-[#00796B]/70 rounded-full px-6 py-4.5 text-xs sm:text-base font-black outline-none shadow-sm border-2 border-teal-200 focus:border-[#009688] transition-all"
                    />
                  </div>

                  {/* PHOTO DE PROFIL DU LIVREUR (REQUIS) */}
                  <div className="md:col-span-2 space-y-2">
                    <label className="block text-xs sm:text-sm font-black uppercase text-[#004D40] ml-1">
                      Photo de Profil du Livreur * :
                    </label>
                    <div className="flex flex-col sm:flex-row items-center gap-4 bg-[#F0FDFB] p-4 rounded-3xl border-2 border-teal-200">
                      {photoUrl ? (
                        <div className="relative shrink-0">
                          <img src={photoUrl} alt="Aperçu Profil" className="w-16 h-16 rounded-full object-cover border-4 border-[#009688] shadow-md" />
                          <button
                            type="button"
                            onClick={() => setPhotoUrl('')}
                            className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full w-5 h-5 text-xs font-bold flex items-center justify-center shadow-md"
                            title="Supprimer la photo"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-teal-100 border-2 border-dashed border-[#009688] flex items-center justify-center text-[#00796B] font-bold text-xs shrink-0">
                          Profil
                        </div>
                      )}
                      <div className="w-full">
                        <label className="w-full py-3.5 px-4 bg-[#009688] hover:bg-[#00796B] text-white font-black text-xs rounded-2xl cursor-pointer flex items-center justify-center gap-2 shadow-sm transition-all border border-white">
                          <span>📷 Choisir la photo de profil depuis votre appareil *</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleFileRead(e, setPhotoUrl)}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                </React.Fragment>
              )}

              {mode === 'login' && (
                <div className="md:col-span-2 p-4 bg-amber-50 border-2 border-amber-300 text-amber-950 rounded-2xl text-xs font-black flex items-center gap-3 shadow-sm">
                  <ShieldCheck className="w-6 h-6 text-amber-600 shrink-0" />
                  <div>
                    <span>🔒 Accès Sécurisé :</span> Saisissez votre numéro de téléphone et votre mot de passe / code secret pour vous connecter.
                  </div>
                </div>
              )}

              {/* NOTIFICATION D'EXPÉDITION D'EMAIL À L'ADMINISTRATION & CHAMP EMAIL */}
              {mode === 'register' && (
                <div className="md:col-span-2 space-y-4">
                  <div className="p-4 bg-teal-50 border-2 border-teal-200 text-[#004D40] rounded-2xl text-xs font-bold flex items-center gap-3 shadow-xs">
                    <Mail className="w-6 h-6 text-[#009688] shrink-0" />
                    <div>
                      <span className="font-black">✉️ Notification Automatique à la Direction :</span> Dès validation, l&apos;ensemble de vos informations d&apos;inscription sera immédiatement transmis par e-mail à l&apos;administration (<strong className="text-[#00796B]">nickyshone62@gmail.com</strong>) avec un lien d&apos;approbation en 1 clic.
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-black uppercase text-[#004D40] mb-2 ml-1">
                      Adresse E-mail (Optionnelle) :
                    </label>
                    <div className="relative">
                      <Mail className="w-6 h-6 absolute left-4.5 top-4.5 text-[#009688]" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="ex: votre.nom@gmail.com"
                        className="w-full bg-[#F0FDFB] text-[#004D40] placeholder-[#00796B]/70 rounded-full pl-14 pr-6 py-4.5 text-xs sm:text-base font-black outline-none shadow-sm border-2 border-teal-200 focus:border-[#009688] transition-all"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className={mode === 'login' ? 'md:col-span-1' : ''}>
                <label className="block text-xs sm:text-sm font-black uppercase text-[#004D40] mb-2 ml-1">
                  Numéro Téléphone Burkina Faso * :
                </label>
                <div className="relative">
                  <Phone className="w-6 h-6 absolute left-4.5 top-4.5 text-[#009688]" />
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+226 70 00 00 00"
                    className="w-full bg-[#F0FDFB] text-[#004D40] placeholder-[#00796B]/70 rounded-full pl-14 pr-6 py-4.5 text-xs sm:text-base font-black outline-none shadow-sm border-2 border-teal-200 focus:border-[#009688] transition-all"
                  />
                </div>
              </div>

              <div className={mode === 'login' ? 'md:col-span-1' : ''}>
                <label className="block text-xs sm:text-sm font-black uppercase text-[#004D40] mb-2 ml-1">
                  Mot de Passe * :
                </label>
                <div className="relative">
                  <Lock className="w-6 h-6 absolute left-4.5 top-4.5 text-[#009688]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#F0FDFB] text-[#004D40] placeholder-[#00796B]/70 rounded-full pl-14 pr-12 py-4.5 text-xs sm:text-base font-black outline-none shadow-sm border-2 border-teal-200 focus:border-[#009688] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 text-[#00796B] hover:text-[#004D40] focus:outline-none transition-colors"
                    title={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* LIVREUR SPECIFIC FIELDS (PIECE RECTO-VERSO/PASSPORT, VEHICULE, ZONES) */}
              {mode === 'register' && role === 'LIVREUR' && (
                <div className="md:col-span-2 space-y-6 pt-4 border-t-2 border-teal-100">
                  
                  {/* SECTION 1: PIECE D'IDENTITE (CNIB / PASSPORT) */}
                  <div className="bg-[#E6FFFA] p-5 rounded-3xl border-2 border-teal-200 space-y-4">
                    <h4 className="font-black text-sm text-[#004D40] uppercase flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-[#009688]" /> 1. Pièce d'Identité (CNIB / Passeport)
                    </h4>
                    
                    {/* Numéro CNIB ou Passeport en premier */}
                    <div>
                      <label className="block text-xs font-black uppercase text-[#004D40] mb-1">
                        Numéro CNIB ou Passeport * :
                      </label>
                      <input
                        type="text"
                        required
                        value={idCardNumber}
                        onChange={(e) => setIdCardNumber(e.target.value)}
                        placeholder="ex: B12345678 ou N° Passeport..."
                        className="w-full bg-white text-[#004D40] font-black rounded-2xl px-4 py-3.5 text-xs sm:text-sm outline-none border-2 border-teal-200"
                      />
                    </div>

                    {/* Photo de la pièce en second */}
                    <div className="space-y-2">
                      <label className="block text-xs font-black uppercase text-[#004D40]">
                        Photo de la Pièce d'Identité (Recto-Verso) ou Passeport * :
                      </label>

                    <div className="space-y-2 bg-white p-4 rounded-2xl border border-teal-200">
                      {idCardFileUrl ? (
                        <div className="relative">
                          <img src={idCardFileUrl} alt="Aperçu Pièce d'identité" className="w-full max-h-48 object-cover rounded-xl border-2 border-[#009688] shadow-md" />
                          <button
                            type="button"
                            onClick={() => setIdCardFileUrl('')}
                            className="absolute top-2 right-2 bg-red-600 text-white rounded-full px-3 py-1 text-xs font-bold shadow-md"
                          >
                            ✕ Changer la photo
                          </button>
                        </div>
                      ) : (
                        <div className="p-6 text-center border-2 border-dashed border-teal-300 rounded-xl space-y-2 bg-teal-50/50">
                          <span className="text-2xl">🪪</span>
                          <div className="text-xs font-bold text-[#004D40]">Aucune photo de pièce sélectionnée</div>
                        </div>
                      )}

                      <div className="pt-1">
                        <label className="w-full py-3.5 px-4 bg-[#009688] hover:bg-[#00796B] text-white font-black text-xs rounded-xl cursor-pointer flex items-center justify-center gap-2 shadow-sm transition-all border border-white">
                          <span>📷 Choisir la photo de la pièce (Recto-Verso / Passeport) *</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleFileRead(e, setIdCardFileUrl)}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                  {/* SECTION 2: VEHICULE & PHOTO DE LA MOTO */}
                  <div className="bg-[#E6FFFA] p-5 rounded-3xl border-2 border-teal-200 space-y-4">
                    <h4 className="font-black text-sm text-[#004D40] uppercase flex items-center gap-2">
                      <Truck className="w-5 h-5 text-[#009688]" /> 2. Véhicule de Livraison *
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-black uppercase text-[#004D40] mb-1">
                          Type de Véhicule * :
                        </label>
                        <select
                          value={vehicleType}
                          onChange={(e) => setVehicleType(e.target.value)}
                          className="w-full bg-white text-[#004D40] font-black rounded-2xl px-4 py-3.5 text-xs sm:text-sm outline-none border-2 border-teal-200"
                        >
                          <option value="MOTO">Moto</option>
                          <option value="VOITURE">Voiture</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-black uppercase text-[#004D40] mb-1">
                          Marque / Modèle * :
                        </label>
                        <input
                          type="text"
                          required
                          value={brand}
                          onChange={(e) => setBrand(e.target.value)}
                          placeholder="ex: Yamaha, Ratto, Kaizer..."
                          className="w-full bg-white text-[#004D40] font-black rounded-2xl px-4 py-3.5 text-xs sm:text-sm outline-none border-2 border-teal-200"
                        />
                      </div>
                    </div>

                    <div className="space-y-2 bg-white p-4 rounded-2xl border border-teal-200">
                      <label className="block text-xs font-black uppercase text-[#004D40]">
                        Photo de la Moto / Véhicule * :
                      </label>
                      
                      {vehiclePhotoUrl ? (
                        <div className="relative">
                          <img src={vehiclePhotoUrl} alt="Aperçu Moto" className="w-full max-h-48 object-cover rounded-xl border-2 border-[#009688] shadow-md" />
                          <button
                            type="button"
                            onClick={() => setVehiclePhotoUrl('')}
                            className="absolute top-2 right-2 bg-red-600 text-white rounded-full px-3 py-1 text-xs font-bold shadow-md"
                          >
                            ✕ Changer la photo
                          </button>
                        </div>
                      ) : (
                        <div className="p-6 text-center border-2 border-dashed border-teal-300 rounded-xl space-y-2 bg-teal-50/50">
                          <span className="text-2xl">🏍️</span>
                          <div className="text-xs font-bold text-[#004D40]">Aucune photo de la moto sélectionnée *</div>
                        </div>
                      )}

                      <div className="pt-1">
                        <label className="w-full py-3.5 px-4 bg-[#009688] hover:bg-[#00796B] text-white font-black text-xs rounded-xl cursor-pointer flex items-center justify-center gap-2 shadow-sm transition-all border border-white">
                          <span>📷 Choisir la photo de la moto / véhicule *</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleFileRead(e, setVehiclePhotoUrl)}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* SECTION 3: ZONES & QUARTIERS DESSERVIS (LES 11 ARRONDISSEMENTS) */}
                  <div className="bg-[#E6FFFA] p-5 rounded-3xl border-2 border-teal-200 space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                      <div>
                        <h4 className="font-black text-sm text-[#004D40] uppercase flex items-center gap-2">
                          📍 3. Quartiers & Arrondissements Desservis à Ouagadougou
                        </h4>
                        <p className="text-xs text-[#00796B] font-bold mt-0.5">
                          Sélectionnez les quartiers spécifiques où vous souhaitez effectuer des livraisons. ({selectedZones.length} quartier(s) sélectionné(s))
                        </p>
                      </div>
                    </div>

                    {/* Quick Search for Quartier */}
                    <div className="relative">
                      <input
                        type="text"
                        value={quartierSearchQuery}
                        onChange={(e) => setQuartierSearchQuery(e.target.value)}
                        placeholder="🔍 Rechercher un quartier (ex: Pissy, Zogona, Karpala, Bilbalogo...)"
                        className="w-full bg-white text-[#004D40] placeholder-[#00796B]/60 font-black rounded-2xl px-5 py-3 text-xs sm:text-sm outline-none border-2 border-teal-200 shadow-xs"
                      />
                      {quartierSearchQuery && (
                        <button
                          type="button"
                          onClick={() => setQuartierSearchQuery('')}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-teal-700 hover:text-teal-900"
                        >
                          Effacer
                        </button>
                      )}
                    </div>

                    {/* Arrondissements 1 to 11 Accordion Grid */}
                    <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
                      {OUAGA_ARRONDISSEMENTS.map((arr) => {
                        const filteredQuartiers = quartierSearchQuery
                          ? arr.quartiers.filter(q => q.toLowerCase().includes(quartierSearchQuery.toLowerCase()))
                          : arr.quartiers;

                        if (quartierSearchQuery && filteredQuartiers.length === 0) return null;

                        const selectedCountInArr = arr.quartiers.filter(q => selectedZones.includes(q)).length;
                        const isAllSelectedInArr = selectedCountInArr === arr.quartiers.length;

                        return (
                          <div key={arr.id} className="bg-white p-4 rounded-2xl border border-teal-100 shadow-xs space-y-2.5">
                            <div className="flex justify-between items-center pb-2 border-b border-teal-50">
                              <div className="flex items-center gap-2">
                                <span className="font-black text-xs sm:text-sm text-[#004D40] uppercase">{arr.name}</span>
                                <span className="px-2 py-0.5 rounded-full bg-teal-100 text-[#004D40] font-bold text-[10px]">
                                  {selectedCountInArr} / {arr.quartiers.length} quartier(s)
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => toggleArrondissementQuartiers(arr.quartiers)}
                                className="text-[11px] font-black text-[#009688] hover:underline"
                              >
                                {isAllSelectedInArr ? 'Tout décocher' : 'Tout cocher'}
                              </button>
                            </div>

                            <div className="flex flex-wrap gap-1.5">
                              {filteredQuartiers.map((q) => {
                                const isSelected = selectedZones.includes(q);
                                return (
                                  <button
                                    type="button"
                                    key={q}
                                    onClick={() => toggleZone(q)}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer border ${
                                      isSelected
                                        ? 'bg-[#009688] text-white border-[#00796B] shadow-xs scale-102'
                                        : 'bg-[#F0FDFB] text-[#004D40] border-teal-200 hover:bg-teal-100'
                                    }`}
                                  >
                                    {isSelected ? '✓ ' : '+ '} {q}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                  </div>

                </div>
              )}
              {/* SUBSCRIPTION FEE NOTICE BANNER - ULTRA MOBILE OPTIMIZED */}
              {mode === 'register' && (
                <div className="md:col-span-2 p-4 sm:p-5 bg-gradient-to-br from-[#004D40] via-teal-900 to-[#00382E] text-white rounded-2xl border-2 border-emerald-400/80 space-y-3 shadow-xl">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-teal-700/60 pb-2.5">
                    <span className="text-xs sm:text-sm font-black uppercase text-emerald-300 tracking-wider flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
                      <span>Tarifs & Abonnement Mensuel :</span>
                    </span>
                    <span className="bg-amber-400 text-slate-950 text-[11px] font-black px-3 py-1 rounded-full shadow-md shrink-0 inline-flex items-center gap-1">
                      <span>🎁 1er Mois d'Utilisation OFFERT</span>
                    </span>
                  </div>

                  {role === 'LIVREUR' ? (
                    <div className="text-xs sm:text-sm text-emerald-100 space-y-2 font-medium leading-relaxed">
                      <div className="flex items-start gap-2">
                        <span className="text-amber-400 font-black text-sm shrink-0">✓</span>
                        <div>
                          <strong className="text-white font-bold">Frais d'Inscription Compte Livreur</strong> :{' '}
                          <strong className="text-amber-300 font-black text-sm">1 500 FCFA</strong>{' '}
                          <span className="text-emerald-200 text-[11px] font-normal">(À la création)</span>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-amber-400 font-black text-sm shrink-0">✓</span>
                        <div>
                          <strong className="text-white font-bold">Abonnement Mensuel</strong> :{' '}
                          <strong className="text-emerald-300 font-black text-sm">1 000 FCFA / mois</strong>{' '}
                          <span className="text-amber-300 font-extrabold text-[11px]">(🎁 1er mois OFFERT après validation Admin)</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs sm:text-sm text-emerald-100 space-y-2 font-medium leading-relaxed">
                      <div className="flex items-start gap-2">
                        <span className="text-amber-400 font-black text-sm shrink-0">✓</span>
                        <div>
                          <strong className="text-white font-bold">Frais d'Inscription Compte Boutique</strong> :{' '}
                          <strong className="text-amber-300 font-black text-sm">2 000 FCFA</strong>{' '}
                          <span className="text-emerald-200 text-[11px] font-normal">(À la création)</span>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-amber-400 font-black text-sm shrink-0">✓</span>
                        <div>
                          <strong className="text-white font-bold">Abonnement Mensuel</strong> :{' '}
                          <strong className="text-emerald-300 font-black text-sm">1 000 FCFA / mois</strong>{' '}
                          <span className="text-amber-300 font-extrabold text-[11px]">(🎁 1er mois OFFERT après validation Admin)</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* PAYMENT METHOD SELECTOR (ORANGE MONEY, MOOV MONEY, WAVE) */}
              {mode === 'register' && (
                <div className="md:col-span-2 space-y-3 pt-2">
                  <label className="block text-xs sm:text-sm font-black uppercase text-[#004D40] ml-1">
                    CHOISISSEZ VOTRE MOYEN DE PAIEMENT MOBILE MONEY :
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    
                    {/* ORANGE MONEY */}
                    <button
                      type="button"
                      onClick={handleSelectOrangeMoney}
                      className={`py-3.5 px-4 rounded-2xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-3 cursor-pointer border-2 shadow-md ${
                        paymentMethod === 'ORANGE_MONEY'
                          ? 'bg-gradient-to-r from-orange-500 via-amber-600 to-orange-600 text-white border-white ring-2 ring-orange-400 scale-105 shadow-xl'
                          : 'bg-[#F0FDFB] text-[#004D40] border-teal-200 hover:bg-teal-100/60'
                      }`}
                    >
                      {/* VRAI LOGO ORANGE MONEY ULTRA LISIBLE */}
                      <div className="w-11 h-11 rounded-2xl bg-[#FF7900] flex flex-col items-center justify-center p-1 shadow-md shrink-0 ring-2 ring-white border border-orange-700 overflow-hidden font-sans">
                        <div className="w-full bg-white py-0.5 rounded-[3px] flex items-center justify-center">
                          <span className="text-[10px] font-black text-black leading-none uppercase tracking-tighter">orange</span>
                        </div>
                        <div className="w-full bg-black py-0.5 rounded-[3px] mt-0.5 flex items-center justify-center">
                          <span className="text-[9px] font-black text-[#FF7900] leading-none uppercase tracking-tighter">money</span>
                        </div>
                      </div>
                      <span className="text-sm font-black">Orange Money</span>
                    </button>

                    {/* MOOV MONEY */}
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('MOOV_MONEY')}
                      className={`py-3.5 px-4 rounded-2xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-3 cursor-pointer border-2 shadow-md ${
                        paymentMethod === 'MOOV_MONEY'
                          ? 'bg-gradient-to-r from-blue-700 via-sky-700 to-blue-800 text-white border-white ring-2 ring-blue-400 scale-105 shadow-xl'
                          : 'bg-[#F0FDFB] text-[#004D40] border-teal-200 hover:bg-teal-100/60'
                      }`}
                    >
                      {/* VRAI LOGO MOOV AFRICA MONEY ULTRA LISIBLE */}
                      <div className="w-11 h-11 rounded-2xl bg-[#00519E] flex flex-col items-center justify-center p-1 shadow-md shrink-0 ring-2 ring-white border border-blue-900 overflow-hidden font-sans">
                        <div className="w-full bg-[#003B7A] py-0.5 rounded-[3px] flex items-center justify-center">
                          <span className="text-[10px] font-black text-white leading-none uppercase italic tracking-tighter">MOOV</span>
                        </div>
                        <div className="w-full bg-[#FF7900] py-0.5 rounded-[3px] mt-0.5 flex items-center justify-center">
                          <span className="text-[9px] font-black text-white leading-none uppercase tracking-tighter">MONEY</span>
                        </div>
                      </div>
                      <span className="text-sm font-black">Moov Money</span>
                    </button>

                    {/* WAVE */}
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('WAVE')}
                      className={`py-3.5 px-4 rounded-2xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-3 cursor-pointer border-2 shadow-md ${
                        paymentMethod === 'WAVE'
                          ? 'bg-gradient-to-r from-cyan-600 via-teal-600 to-emerald-600 text-white border-white ring-2 ring-cyan-400 scale-105 shadow-xl'
                          : 'bg-[#F0FDFB] text-[#004D40] border-teal-200 hover:bg-teal-100/60'
                      }`}
                    >
                      {/* VRAI LOGO WAVE MOBILE MONEY ULTRA LISIBLE */}
                      <div className="w-11 h-11 rounded-2xl bg-[#1DC3F6] flex items-center justify-center shadow-md shrink-0 ring-2 ring-white border border-cyan-600 relative overflow-hidden p-0.5">
                        <svg className="w-9 h-9" viewBox="0 0 100 100" fill="none">
                          <circle cx="50" cy="50" r="46" fill="#1DC3F6" />
                          <path d="M50 15C32 15 20 28 20 48C20 68 32 85 50 85C68 85 80 68 80 48C80 28 68 15 50 15Z" fill="#FFFFFF" />
                          <path d="M50 25C38 25 30 35 30 50C30 65 38 75 50 75C62 75 70 65 70 50C70 35 62 25 50 25Z" fill="#1DC3F6" />
                          <path d="M50 35C44 35 40 40 40 50C40 60 44 65 50 65C56 65 60 60 60 50C60 40 56 35 50 35Z" fill="#FFFFFF" />
                          <polygon points="50,42 57,48 43,48" fill="#FFC107" />
                        </svg>
                      </div>
                      <span className="text-sm font-black">Wave</span>
                    </button>

                  </div>

                  {/* ORANGE MONEY DIRECT BANNER */}
                  {paymentMethod === 'ORANGE_MONEY' && getRegistrationAmount(role) > 0 && (
                    <div className="p-4 bg-orange-50 border-2 border-orange-300 text-orange-950 rounded-2xl text-xs sm:text-sm font-extrabold flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md animate-fadeIn">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#FF7900] flex flex-col items-center justify-center p-1 shadow-sm shrink-0 border border-white font-sans">
                          <div className="w-full bg-white py-0.5 rounded-[2px] flex items-center justify-center">
                            <span className="text-[9px] font-black text-black leading-none uppercase tracking-tighter">orange</span>
                          </div>
                          <div className="w-full bg-black py-0.5 rounded-[2px] mt-0.5 flex items-center justify-center">
                            <span className="text-[8px] font-black text-[#FF7900] leading-none uppercase tracking-tighter">money</span>
                          </div>
                        </div>
                        <div>
                          <div className="text-xs sm:text-sm font-black text-orange-950">Code USSD Direct Orange Money</div>
                          <div className="text-[11px] font-bold text-orange-800">
                            Syntaxe : <span className="font-mono font-black underline bg-orange-100 px-1.5 py-0.5 rounded">*144*2*1*06887330*{getRegistrationAmount(role)}#</span>
                          </div>
                        </div>
                      </div>
                      <a
                        href={`tel:${encodeURIComponent(`*144*2*1*06887330*${getRegistrationAmount(role)}#`)}`}
                        className="px-5 py-2.5 rounded-full bg-[#FF7900] hover:bg-[#e66c00] text-white font-black text-xs transition-all shadow-md inline-flex items-center gap-1.5 shrink-0 border border-white"
                      >
                        <Phone className="w-4 h-4 text-white" />
                        <span>Composer le Code USSD</span>
                      </a>
                    </div>
                  )}

                  {/* MOOV MONEY DIRECT BANNER */}
                  {paymentMethod === 'MOOV_MONEY' && getRegistrationAmount(role) > 0 && (
                    <div className="p-4 bg-blue-50 border-2 border-blue-300 text-blue-950 rounded-2xl text-xs sm:text-sm font-extrabold flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md animate-fadeIn">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#00519E] flex flex-col items-center justify-center p-1 shadow-sm shrink-0 border border-white font-sans">
                          <div className="w-full bg-[#003B7A] py-0.5 rounded-[2px] flex items-center justify-center">
                            <span className="text-[9px] font-black text-white leading-none uppercase italic tracking-tighter">MOOV</span>
                          </div>
                          <div className="w-full bg-[#FF7900] py-0.5 rounded-[2px] mt-0.5 flex items-center justify-center">
                            <span className="text-[8px] font-black text-white leading-none uppercase tracking-tighter">MONEY</span>
                          </div>
                        </div>
                        <div>
                          <div className="text-xs sm:text-sm font-black text-blue-950">Code USSD Direct Moov Money</div>
                          <div className="text-[11px] font-bold text-blue-800">
                            Syntaxe : <span className="font-mono font-black underline bg-blue-100 px-1.5 py-0.5 rounded">*555*2*1*62017878*{getRegistrationAmount(role)}#</span>
                          </div>
                        </div>
                      </div>
                      <a
                        href={`tel:${encodeURIComponent(`*555*2*1*62017878*${getRegistrationAmount(role)}#`)}`}
                        className="px-5 py-2.5 rounded-full bg-[#00519E] hover:bg-[#004180] text-white font-black text-xs transition-all shadow-md inline-flex items-center gap-1.5 shrink-0 border border-white"
                      >
                        <Phone className="w-4 h-4 text-white" />
                        <span>Composer le Code USSD</span>
                      </a>
                    </div>
                  )}

                  {/* WAVE DIRECT BANNER WITH APP REDIRECT */}
                  {paymentMethod === 'WAVE' && getRegistrationAmount(role) > 0 && (
                    <div className="p-4 bg-cyan-50 border-2 border-cyan-300 text-cyan-950 rounded-2xl text-xs sm:text-sm font-extrabold flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md animate-fadeIn">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[#1DC3F6] flex items-center justify-center shadow-sm shrink-0 border border-white">
                          <svg className="w-7 h-7" viewBox="0 0 100 100" fill="none">
                            <circle cx="50" cy="50" r="46" fill="#1DC3F6" />
                            <path d="M50 15C32 15 20 28 20 48C20 68 32 85 50 85C68 85 80 68 80 48C80 28 68 15 50 15Z" fill="#FFFFFF" />
                            <path d="M50 25C38 25 30 35 30 50C30 65 38 75 50 75C62 75 70 65 70 50C70 35 62 25 50 25Z" fill="#1DC3F6" />
                            <path d="M50 35C44 35 40 40 40 50C40 60 44 65 50 65C56 65 60 60 60 50C60 40 56 35 50 35Z" fill="#FFFFFF" />
                            <polygon points="50,42 57,48 43,48" fill="#FFC107" />
                          </svg>
                        </div>
                        <div>
                          <div className="text-xs sm:text-sm font-black text-cyan-950">Application Wave Mobile Money</div>
                          <div className="text-[11px] font-bold text-cyan-800">
                            Transfert de {getRegistrationAmount(role)} FCFA vers le <span className="font-mono font-black underline bg-cyan-100 px-1.5 py-0.5 rounded">06 88 73 30</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <a
                          href="https://pay.wave.com"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full sm:w-auto px-5 py-2.5 rounded-full bg-[#1DC3F6] hover:bg-[#18a8d6] text-white font-black text-xs transition-all shadow-md flex items-center justify-center gap-1.5 shrink-0 border border-white"
                        >
                          <span>🌊 Ouvrir l'application Wave</span>
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              )}

            </div>

            {/* HIGH-CONTRAST VIBRANT SUBMIT BUTTON WITH PRICING & PAYMENT METHOD */}
            <div className="pt-4 flex justify-center">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-5 px-8 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 text-white font-black text-sm sm:text-lg uppercase tracking-wider rounded-full shadow-2xl shadow-emerald-600/40 transform hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-3 border-2 border-white disabled:opacity-50"
              >
                <span>
                  {loading
                    ? 'PATIENTEZ... ENVOI À NICKYSHONE62@GMAIL.COM...'
                    : mode === 'register'
                    ? `✉️ ENVOYER MON DOSSIER À NICKYSHONE62@GMAIL.COM & CRÉER MON COMPTE ${role === 'LIVREUR' ? 'LIVREUR' : 'BOUTIQUE'}`
                    : 'SE CONNECTER À L\'ESPACE'}
                </span>
                {!loading && <ArrowRight className="w-6 h-6 text-white" />}
              </button>
            </div>
          </form>

          {/* Mode Switcher Footer */}
          <div className="text-center pt-4 border-t-2 border-teal-100 max-w-4xl mx-auto">
            {mode === 'register' ? (
              <p className="text-xs sm:text-base text-[#004D40] font-black flex items-center justify-center flex-wrap gap-3">
                <span>Vous avez déjà un compte ?</span>
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white px-6 py-2.5 rounded-full font-black text-xs sm:text-base shadow-xl shadow-blue-600/30 transition-all cursor-pointer inline-flex items-center gap-2 border border-white/40"
                >
                  <span>Se connecter</span>
                  <ArrowRight className="w-5 h-5 text-white" />
                </button>
              </p>
            ) : (
              <p className="text-xs sm:text-base text-[#004D40] font-black flex items-center justify-center flex-wrap gap-3">
                <span>Nouveau sur LivraisonOuaga ?</span>
                <button
                  type="button"
                  onClick={() => setMode('register')}
                  className="bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white px-6 py-2.5 rounded-full font-black text-xs sm:text-base shadow-xl shadow-blue-600/30 transition-all cursor-pointer inline-flex items-center gap-2 border border-white/40"
                >
                  <span>S'inscrire gratuitement</span>
                  <ArrowRight className="w-5 h-5 text-white" />
                </button>
              </p>
            )}
          </div>

        </div>
      </div>

      {/* SECRET ADMIN CODE MODAL */}
      {showAdminSecretModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl border-4 border-amber-400 space-y-6 text-center animate-fadeIn relative">
            <button
              onClick={() => setShowAdminSecretModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 font-black text-xl cursor-pointer"
            >
              ✕
            </button>

            <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-amber-400 via-orange-500 to-amber-600 flex items-center justify-center text-slate-950 shadow-xl border-4 border-white">
              <ShieldCheck className="w-10 h-10 text-slate-950" />
            </div>

            <div className="space-y-2">
              <span className="px-3 py-1 bg-amber-100 text-amber-900 rounded-full text-[10px] font-black uppercase tracking-widest border border-amber-300">
                👑 Accès Secret Super-Administrateur
              </span>
              <h3 className="text-xl font-black text-slate-900">
                Connexion Administrateur
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Saisissez votre code secret confidentiel pour accéder directement au panneau d&apos;administration.
              </p>
            </div>

            {adminSecretError && (
              <div className="p-3 bg-red-50 text-red-700 text-xs font-bold rounded-xl border border-red-200">
                {adminSecretError}
              </div>
            )}

            <form onSubmit={handleAdminSecretSubmit} className="space-y-4">
              <div>
                <input
                  type="password"
                  required
                  autoFocus
                  value={adminCodeInput}
                  onChange={(e) => setAdminCodeInput(e.target.value)}
                  placeholder="Code Secret..."
                  className="w-full px-4 py-3 text-center text-lg font-bold font-mono border-2 border-slate-300 rounded-2xl outline-none focus:border-amber-500 transition-all bg-slate-50 text-slate-900"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAdminSecretModal(false)}
                  className="w-1/3 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={adminSecretLoading}
                  className="w-2/3 py-3.5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black rounded-xl text-xs sm:text-sm shadow-xl cursor-pointer uppercase tracking-wider border border-amber-300"
                >
                  {adminSecretLoading ? 'Connexion...' : '🚀 Valider & Accéder'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
