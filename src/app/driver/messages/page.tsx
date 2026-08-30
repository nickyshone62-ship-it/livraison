'use client';

import React, { useEffect, useState, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  MessageSquare,
  Send,
  Phone,
  User,
  CheckCheck,
  RefreshCw,
  Volume2,
  VolumeX,
  Search,
  Plus,
  Camera,
  FileText,
  Image as ImageIcon,
  MapPin,
  Video,
  X,
  MoreVertical,
  ShieldCheck,
  Check
} from 'lucide-react';
import { playNotificationSound } from '@/lib/soundNotification';

function DriverMessagesContent() {
  const searchParams = useSearchParams();
  const targetConvId = searchParams.get('convId');
  const targetDeliveryId = searchParams.get('deliveryId');

  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConv, setSelectedConv] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sendLoading, setSendLoading] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAttachMenu, setShowAttachMenu] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesBoxRef = useRef<HTMLDivElement>(null);
  const prevMsgsCountRef = useRef<number>(0);
  const [isUserScrolledUp, setIsUserScrolledUp] = useState(false);

  useEffect(() => {
    initConversations();
  }, []);

  // Polling automatique des messages toutes les 3 secondes si une conversation est ouverte
  useEffect(() => {
    if (!selectedConv?.id) return;

    fetchMessages(selectedConv.id);
    const interval = setInterval(() => {
      fetchMessages(selectedConv.id, true);
    }, 3000);

    return () => clearInterval(interval);
  }, [selectedConv?.id]);

  useEffect(() => {
    if (!isUserScrolledUp) {
      scrollToBottom();
    }
  }, [messages]);

  const scrollToBottom = (force = false) => {
    if (force || !isUserScrolledUp) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleScroll = () => {
    if (!messagesBoxRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = messagesBoxRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    setIsUserScrolledUp(distanceFromBottom > 100);
  };

  const ADMIN_CONV_ID = 'admin-support-channel';

  const initConversations = async () => {
    setLoading(true);
    try {
      if (targetDeliveryId) {
        const createRes = await fetch('/api/conversations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ deliveryId: targetDeliveryId }),
        });
        if (createRes.ok) {
          const createData = await createRes.json();
          if (createData.conversation) {
            setSelectedConv(createData.conversation);
            setIsUserScrolledUp(false);
          }
        }
      }

      const [res, resNotif] = await Promise.all([
        fetch('/api/conversations'),
        fetch('/api/notifications')
      ]);

      let adminNotifs: any[] = [];
      if (resNotif.ok) {
        const notifData = await resNotif.json();
        adminNotifs = (notifData.notifications || []).filter((n: any) => n.type === 'admin_message');
      }

      if (res.ok) {
        const data = await res.json();
        let convs = data.conversations || [];

        if (adminNotifs.length > 0) {
          const adminConv = {
            id: ADMIN_CONV_ID,
            isAdminChannel: true,
            otherParticipant: {
              fullName: "👑 Administration Central",
              phone: "Canal Officiel Admin",
            },
            messages: adminNotifs.map((n) => ({
              id: n.id,
              content: `${n.title}\n${n.message}`,
              createdAt: n.createdAt,
              senderId: 'admin',
            })),
          };
          convs = [adminConv, ...convs];
        }

        setConversations(convs);

        if (targetConvId) {
          const found = convs.find((c: any) => c.id === targetConvId);
          if (found) {
            setSelectedConv(found);
            setIsUserScrolledUp(false);
            if (found.isAdminChannel) setMessages(found.messages || []);
          }
        } else if (!selectedConv && convs.length > 0 && !targetDeliveryId) {
          setSelectedConv(convs[0]);
          setIsUserScrolledUp(false);
          if (convs[0].isAdminChannel) setMessages(convs[0].messages || []);
        }
      }
    } catch (err) {
      console.error('Erreur chargement messagerie:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (convId: string, silent = false) => {
    if (convId === ADMIN_CONV_ID) return;
    try {
      const res = await fetch(`/api/conversations/${convId}/messages`);
      if (res.ok) {
        const data = await res.json();
        const newMsgs = data.messages || [];

        if (prevMsgsCountRef.current > 0 && newMsgs.length > prevMsgsCountRef.current) {
          const lastMsg = newMsgs[newMsgs.length - 1];
          if (lastMsg && lastMsg.senderId === selectedConv?.clientId && soundEnabled) {
            playNotificationSound();
          }
        }
        prevMsgsCountRef.current = newMsgs.length;

        setMessages((prevMsgs) => {
          if (
            prevMsgs.length === newMsgs.length &&
            (prevMsgs.length === 0 || prevMsgs[prevMsgs.length - 1]?.id === newMsgs[newMsgs.length - 1]?.id)
          ) {
            return prevMsgs;
          }
          return newMsgs;
        });
      }
    } catch (err) {
      if (!silent) console.error(err);
    }
  };

  const handleSelectConv = (conv: any) => {
    setSelectedConv(conv);
    setIsUserScrolledUp(false);
    if (conv.isAdminChannel) {
      setMessages(conv.messages || []);
    } else {
      fetchMessages(conv.id);
    }
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
    }, 150);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConv || !newMessage.trim()) return;

    const contentToSend = newMessage.trim();
    setNewMessage('');
    setSendLoading(true);

    try {
      const res = await fetch(`/api/conversations/${selectedConv.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: contentToSend }),
      });

      if (res.ok) {
        setIsUserScrolledUp(false);
        await fetchMessages(selectedConv.id, true);
        scrollToBottom(true);
        initConversations();
      } else {
        const data = await res.json();
        alert(data.error || 'Erreur lors de l\'envoi du message');
      }
    } catch (err: any) {
      alert(err.message || 'Erreur d\'envoi');
    } finally {
      setSendLoading(false);
    }
  };

  const handleAttachmentClick = (type: string) => {
    setShowAttachMenu(false);
    if (type === 'location') {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setNewMessage(`📍 Position GPS : https://maps.google.com/?q=${pos.coords.latitude},${pos.coords.longitude}`);
          },
          () => alert('Géolocalisation indisponible.')
        );
      }
    } else {
      alert(`Pièce jointe (${type}) : Veuillez joindre votre document ou photo.`);
    }
  };

  const filteredConvs = conversations.filter((c) => {
    const name = c.otherParticipant?.fullName || '';
    const phone = c.otherParticipant?.phone || '';
    const query = searchTerm.toLowerCase();
    return name.toLowerCase().includes(query) || phone.toLowerCase().includes(query);
  });

  const otherParticipant = selectedConv?.otherParticipant || {};

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-orange-50/30 text-slate-900 pb-12">
      {/* NAVBAR HEADER */}
      <header className="border-b border-slate-200/80 bg-white/90 backdrop-blur-xl sticky top-0 z-40 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link href="/driver" className="p-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span>Messagerie Livreur</span>
                <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
              </h1>
              <p className="text-xs text-slate-500 font-medium">Vos échanges en direct avec les clients</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const next = !soundEnabled;
                setSoundEnabled(next);
                if (next) playNotificationSound();
              }}
              className={`p-2 px-3 rounded-2xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                soundEnabled
                  ? 'bg-orange-50 border-orange-200 text-orange-600 shadow-sm'
                  : 'bg-slate-100 border-slate-200 text-slate-400'
              }`}
              title={soundEnabled ? 'Son actif' : 'Mode silencieux'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-orange-600" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
              <span className="hidden sm:inline">{soundEnabled ? 'Son' : 'Mute'}</span>
            </button>

            <button
              onClick={initConversations}
              className="p-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
              title="Rafraîchir"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* CONTAINER PRINCIPAL */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden min-h-[600px] shadow-xl grid grid-cols-1 md:grid-cols-3">
          
          {/* CONVERSATION LIST (GAUCHE) */}
          <div className={`border-r border-slate-200/80 p-4 space-y-4 bg-slate-50/50 ${selectedConv ? 'hidden md:flex flex-col' : 'flex flex-col'}`}>
            
            {/* Header + Search */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-extrabold text-slate-900 text-lg tracking-tight">Discussions</h2>
                <span className="px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-700 text-xs font-black">
                  {conversations.length}
                </span>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Rechercher un client..."
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs outline-none focus:ring-2 focus:ring-orange-500 shadow-sm placeholder-slate-400"
                />
              </div>
            </div>

            {/* Quick Contacts Avatar Carousel */}
            {conversations.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">Clients récents</div>
                <div className="pb-2 border-b border-slate-200/60 overflow-x-auto scrollbar-none flex items-center space-x-3 pr-2">
                  {conversations.slice(0, 6).map((c) => {
                    const p = c.otherParticipant || {};
                    const initial = p.fullName ? p.fullName[0].toUpperCase() : 'C';
                    const isSelected = selectedConv?.id === c.id;

                    return (
                      <button
                        key={'story-' + c.id}
                        onClick={() => handleSelectConv(c)}
                        className="flex flex-col items-center space-y-1 min-w-[56px] group cursor-pointer"
                      >
                        <div className="relative">
                          <div className={`w-12 h-12 rounded-full p-0.5 shadow-sm transition-transform group-hover:scale-105 ${
                            isSelected ? 'bg-gradient-to-tr from-orange-500 to-amber-500 ring-2 ring-orange-500 ring-offset-2' : 'bg-gradient-to-tr from-orange-400 to-amber-400'
                          }`}>
                            <div className="w-full h-full rounded-full bg-white flex items-center justify-center font-extrabold text-orange-600 text-sm">
                              {initial}
                            </div>
                          </div>
                          <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white"></span>
                        </div>
                        <span className="text-[10px] font-semibold text-slate-700 truncate w-14 text-center">
                          {p.fullName?.split(' ')[0] || 'Client'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Conversation Items List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
              {loading ? (
                <div className="text-center py-16 text-slate-400 text-xs">
                  <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <span>Chargement des conversations...</span>
                </div>
              ) : filteredConvs.length === 0 ? (
                <div className="text-slate-400 text-xs text-center py-16 border border-dashed border-slate-200 rounded-3xl p-4 bg-white">
                  Aucune discussion en cours.<br />Elles apparaissent dès qu'un client vous confie une livraison.
                </div>
              ) : (
                filteredConvs.map((c) => {
                  const partner = c.otherParticipant || {};
                  const isSelected = selectedConv?.id === c.id;
                  const lastMsg = c.messages?.[0]?.content || 'Nouvelle conversation';
                  const initial = partner.fullName ? partner.fullName[0].toUpperCase() : 'C';
                  const isDbAdmin = c.isAdminChannel;

                  return (
                    <button
                      key={c.id}
                      onClick={() => handleSelectConv(c)}
                      className={`w-full p-3.5 rounded-2xl text-left transition-all flex items-center gap-3.5 border cursor-pointer ${
                        isSelected
                          ? 'bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-500/20'
                          : 'bg-white border-slate-200/80 text-slate-800 hover:border-orange-300 hover:shadow-sm'
                      }`}
                    >
                      <div className="relative shrink-0">
                        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-sm ${
                          isSelected ? 'bg-white/20 text-white' : isDbAdmin ? 'bg-amber-100 text-amber-700' : 'bg-orange-50 text-orange-600'
                        }`}>
                          {isDbAdmin ? '👑' : initial}
                        </div>
                        <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white"></span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className={`font-bold text-xs truncate ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                            {partner.fullName || 'Client'}
                          </span>
                          <span className={`text-[10px] font-mono ${isSelected ? 'text-orange-100' : 'text-slate-400'}`}>
                            12:30
                          </span>
                        </div>
                        <p className={`text-xs truncate ${isSelected ? 'text-orange-100 font-medium' : 'text-slate-500'}`}>
                          {lastMsg}
                        </p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* CHAT WINDOW (DROITE) */}
          <div className={`md:col-span-2 p-4 md:p-6 flex flex-col justify-between bg-slate-50/30 ${selectedConv ? 'flex' : 'hidden md:flex'}`}>
            {selectedConv ? (
              <>
                {/* Header Chat Window */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 mb-4 flex items-center justify-between shadow-sm">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => setSelectedConv(null)}
                      className="md:hidden p-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 flex items-center gap-1 text-xs shrink-0 cursor-pointer"
                      title="Retour"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </button>

                    <div className="relative shrink-0">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center font-black text-white text-sm shadow-sm">
                        {otherParticipant.fullName ? otherParticipant.fullName[0].toUpperCase() : 'C'}
                      </div>
                      <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white"></span>
                    </div>

                    <div>
                      <div className="font-extrabold text-slate-900 text-sm">{otherParticipant.fullName || 'Client'}</div>
                      <div className="text-xs text-slate-500 flex items-center gap-2">
                        {otherParticipant.phone && (
                          <a href={`tel:${otherParticipant.phone}`} className="hover:text-orange-600 flex items-center gap-1 font-semibold">
                            <Phone className="w-3 h-3 text-emerald-500" />
                            <span>{otherParticipant.phone}</span>
                          </a>
                        )}
                        <span className="text-slate-300">•</span>
                        <span className="text-emerald-600 text-[11px] font-bold">En ligne</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1">
                    {otherParticipant.phone && (
                      <a
                        href={`tel:${otherParticipant.phone}`}
                        className="p-2.5 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors"
                        title="Appeler"
                      >
                        <Phone className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>

                {/* Messages Box */}
                <div
                  ref={messagesBoxRef}
                  onScroll={handleScroll}
                  className="flex-1 overflow-y-auto space-y-3.5 mb-4 max-h-[420px] min-h-[320px] pr-2 scrollbar-thin"
                >
                  {messages.length === 0 ? (
                    <div className="text-center py-20 text-slate-400 text-xs">
                      <MessageSquare className="w-10 h-10 text-orange-500/30 mx-auto mb-2" />
                      <span>Aucun message échangé. Écrivez ci-dessous pour démarrer la discussion !</span>
                    </div>
                  ) : (
                    messages.map((m) => {
                      const isAdminMsg = m.senderId === 'admin';
                      const isMe = m.senderId !== selectedConv.clientId;
                      const timeStr = new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                      if (isAdminMsg) {
                        return (
                          <div key={m.id} className="flex flex-col items-start w-full">
                            <div className="p-4 rounded-3xl w-full text-xs shadow-md space-y-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white border border-amber-400/30">
                              <div className="font-black text-amber-100 flex items-center justify-between text-xs">
                                <span className="flex items-center gap-1.5">
                                  <span>👑</span>
                                  <span>ADMINISTRATION CENTRAL</span>
                                </span>
                                <span className="text-[10px] text-white/80 font-mono">{timeStr}</span>
                              </div>
                              <p className="leading-relaxed whitespace-pre-wrap font-medium">{m.content}</p>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={m.id}
                          className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                        >
                          <div
                            className={`p-3.5 px-4 rounded-3xl max-w-[82%] text-xs shadow-sm space-y-1.5 ${
                              isMe
                                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white font-medium rounded-tr-sm shadow-orange-500/10'
                                : 'bg-white border border-slate-200/80 text-slate-800 rounded-tl-sm'
                            }`}
                          >
                            <p className="leading-relaxed whitespace-pre-wrap">{m.content}</p>
                            <div className={`text-[10px] text-right font-mono flex items-center justify-end gap-1 ${
                              isMe ? 'text-orange-100' : 'text-slate-400'
                            }`}>
                              <span>{timeStr}</span>
                              {isMe && <CheckCheck className="w-3.5 h-3.5 text-white" />}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Formulaire Envoi / Input Dock */}
                {selectedConv?.isAdminChannel ? (
                  <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs text-center font-bold shadow-sm">
                    📢 Canal officiel d'information de l'administration (Lecture seule).
                  </div>
                ) : (
                  <div className="relative">
                    {/* Attachment Popup Menu */}
                    {showAttachMenu && (
                      <div className="absolute bottom-16 left-0 bg-white border border-slate-200 rounded-3xl shadow-2xl p-3 z-30 w-56 animate-fadeIn space-y-1">
                        <button
                          type="button"
                          onClick={() => handleAttachmentClick('camera')}
                          className="w-full p-2.5 rounded-2xl hover:bg-slate-100 text-slate-700 font-semibold text-xs flex items-center gap-3 transition-colors cursor-pointer"
                        >
                          <div className="p-2 rounded-xl bg-orange-50 text-orange-600">
                            <Camera className="w-4 h-4" />
                          </div>
                          <span>Appareil photo</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAttachmentClick('document')}
                          className="w-full p-2.5 rounded-2xl hover:bg-slate-100 text-slate-700 font-semibold text-xs flex items-center gap-3 transition-colors cursor-pointer"
                        >
                          <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
                            <FileText className="w-4 h-4" />
                          </div>
                          <span>Document</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAttachmentClick('photo')}
                          className="w-full p-2.5 rounded-2xl hover:bg-slate-100 text-slate-700 font-semibold text-xs flex items-center gap-3 transition-colors cursor-pointer"
                        >
                          <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                            <ImageIcon className="w-4 h-4" />
                          </div>
                          <span>Photo & Vidéo</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAttachmentClick('location')}
                          className="w-full p-2.5 rounded-2xl hover:bg-slate-100 text-slate-700 font-semibold text-xs flex items-center gap-3 transition-colors cursor-pointer"
                        >
                          <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
                            <MapPin className="w-4 h-4" />
                          </div>
                          <span>Localisation GPS</span>
                        </button>
                      </div>
                    )}

                    <form onSubmit={handleSendMessage} className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setShowAttachMenu(!showAttachMenu)}
                        className="w-11 h-11 rounded-full bg-orange-500 hover:bg-orange-600 text-white flex items-center justify-center shadow-md shrink-0 transition-transform active:scale-95 cursor-pointer"
                        title="Ajouter une pièce jointe"
                      >
                        {showAttachMenu ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                      </button>

                      <div className="flex-1 bg-white border border-slate-200 focus-within:border-orange-500 rounded-full px-4 py-2.5 flex items-center gap-2 shadow-sm transition-all">
                        <input
                          type="text"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Écrivez votre message..."
                          className="w-full bg-transparent text-slate-900 text-base sm:text-xs outline-none placeholder-slate-400 font-medium"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={sendLoading || !newMessage.trim()}
                        className="w-11 h-11 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white flex items-center justify-center shadow-md shrink-0 disabled:opacity-40 transition-all active:scale-95 cursor-pointer"
                      >
                        <Send className="w-4 h-4 ml-0.5" />
                      </button>
                    </form>
                  </div>
                )}
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-xs py-16 bg-white border border-slate-200/80 rounded-2xl">
                <div className="w-16 h-16 rounded-full bg-orange-50 flex items-center justify-center text-orange-600 mb-3 shadow-inner">
                  <MessageSquare className="w-8 h-8" />
                </div>
                <span className="font-extrabold text-slate-900 text-base">Messagerie Livreur</span>
                <span className="mt-1 text-slate-500 max-w-xs text-center">Sélectionnez une discussion dans la liste pour échanger en direct.</span>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function DriverMessagesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-100 text-slate-900 flex items-center justify-center text-xs">Chargement de la messagerie...</div>}>
      <DriverMessagesContent />
    </Suspense>
  );
}
