'use client';

import React, { useEffect, useState, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, MessageSquare, Send, Phone, User, CheckCheck, RefreshCw } from 'lucide-react';

function ClientMessagesContent() {
  const searchParams = useSearchParams();
  const targetConvId = searchParams.get('convId');
  const targetDeliveryId = searchParams.get('deliveryId');

  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConv, setSelectedConv] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sendLoading, setSendLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesBoxRef = useRef<HTMLDivElement>(null);
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
      // Si un deliveryId est fourni dans l'URL, créer ou obtenir la conversation
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
        await fetchMessages(selectedConv.id, true);
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

  const otherParticipant = selectedConv?.otherParticipant || {};

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-12">
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/client" className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-amber-400" />
                <span>Messagerie en Direct</span>
              </h1>
              <p className="text-xs text-slate-400">Échangez des messages instantanés avec vos livreurs</p>
            </div>
          </div>
          <button
            onClick={initConversations}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-amber-400 transition-colors"
            title="Rafraîchir les conversations"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden min-h-[550px] shadow-2xl">
          {/* Conversation List */}
          <div className={`border-r border-slate-800 p-4 space-y-3 bg-slate-950/40 ${selectedConv ? 'hidden md:block' : 'block'}`}>
            <h2 className="font-bold text-slate-300 text-xs uppercase tracking-wider mb-3 px-1">Vos Discussions</h2>

            {loading ? (
              <div className="text-center py-12 text-slate-500 text-xs">Chargement des conversations...</div>
            ) : conversations.length === 0 ? (
              <div className="text-slate-500 text-xs text-center py-12 border border-dashed border-slate-800 rounded-2xl p-4">
                Aucune discussion en cours.<br />Elles apparaissent dès qu'un livreur accepte une course.
              </div>
            ) : (
              conversations.map((c) => {
                const partner = c.otherParticipant || {};
                const isSelected = selectedConv?.id === c.id;
                const lastMsg = c.messages?.[0]?.content || 'Nouvelle conversation';

                return (
                  <button
                    key={c.id}
                    onClick={() => handleSelectConv(c)}
                    className={`w-full p-3.5 rounded-2xl text-left border transition-all space-y-1 ${
                      isSelected
                        ? 'bg-amber-500/10 border-amber-500 text-white shadow-lg shadow-amber-500/5'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-sm text-white truncate flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>{partner.fullName || 'Livreur'}</span>
                      </div>
                      {partner.phone && (
                        <span className="text-[10px] text-slate-500 font-mono">{partner.phone}</span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400 truncate">{lastMsg}</div>
                  </button>
                );
              })
            )}
          </div>

          {/* Chat Window */}
          <div className={`md:col-span-2 p-4 md:p-6 flex flex-col justify-between bg-slate-900/60 ${selectedConv ? 'flex' : 'hidden md:flex'}`}>
            {selectedConv ? (
              <>
                {/* Header Chat */}
                <div className="border-b border-slate-800 pb-4 mb-4 flex items-center justify-between gap-2">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => setSelectedConv(null)}
                      className="md:hidden p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 hover:text-white flex items-center gap-1 text-xs shrink-0"
                      title="Retour aux discussions"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center font-bold text-amber-400 text-base shrink-0">
                      {otherParticipant.fullName ? otherParticipant.fullName[0].toUpperCase() : 'L'}
                    </div>
                    <div>
                      <div className="font-bold text-white text-sm">{otherParticipant.fullName || 'Livreur'}</div>
                      <div className="text-xs text-slate-400 flex items-center gap-2">
                        {otherParticipant.phone && (
                          <a href={`tel:${otherParticipant.phone}`} className="hover:text-amber-400 flex items-center gap-1">
                            <Phone className="w-3 h-3 text-emerald-400" />
                            <span>{otherParticipant.phone}</span>
                          </a>
                        )}
                        <span className="text-slate-600">•</span>
                        <span className="text-emerald-400 text-[11px] font-semibold">En direct</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Messages Box */}
                <div
                  ref={messagesBoxRef}
                  onScroll={handleScroll}
                  className="flex-1 overflow-y-auto space-y-3 mb-4 max-h-[380px] min-h-[300px] pr-2 scrollbar-thin"
                >
                  {messages.length === 0 ? (
                    <div className="text-center py-16 text-slate-500 text-xs">
                      Aucun message échangé. Écrivez ci-dessous pour démarrer la discussion !
                    </div>
                  ) : (
                    messages.map((m) => {
                      const isAdminMsg = m.senderId === 'admin';
                      const isMe = m.senderId === selectedConv.clientId;
                      const timeStr = new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                      if (isAdminMsg) {
                        return (
                          <div key={m.id} className="flex flex-col items-start w-full">
                            <div className="p-4 rounded-2xl w-full text-xs shadow-lg space-y-1.5 bg-cyan-950/80 border border-cyan-500/40 text-cyan-100">
                              <div className="font-extrabold text-cyan-300 flex items-center justify-between">
                                <span className="flex items-center gap-1.5">
                                  <span>👑</span>
                                  <span>ADMINISTRATION CENTRAL</span>
                                </span>
                                <span className="text-[10px] text-cyan-400/80 font-mono">{timeStr}</span>
                              </div>
                              <p className="leading-relaxed whitespace-pre-wrap">{m.content}</p>
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
                            className={`p-3.5 rounded-2xl max-w-[85%] text-xs shadow-md space-y-1 ${
                              isMe
                                ? 'bg-amber-500 text-slate-950 font-medium rounded-br-none'
                                : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-bl-none'
                            }`}
                          >
                            <p className="leading-relaxed whitespace-pre-wrap">{m.content}</p>
                            <div className={`text-[10px] text-right font-mono flex items-center justify-end gap-1 ${
                              isMe ? 'text-slate-900/70' : 'text-slate-500'
                            }`}>
                              <span>{timeStr}</span>
                              {isMe && <CheckCheck className="w-3 h-3 text-slate-950" />}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Formulaire Envoi */}
                {selectedConv?.isAdminChannel ? (
                  <div className="p-3.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs text-center font-bold">
                    📢 Canal officiel d'information de l'administration (Lecture seule).
                  </div>
                ) : (
                  <form onSubmit={handleSendMessage} className="flex items-center space-x-3 pt-3 border-t border-slate-800">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Écrivez votre message au livreur..."
                      className="flex-1 px-4 py-3.5 bg-slate-950 border border-slate-800 rounded-2xl text-white text-xs outline-none focus:ring-2 focus:ring-amber-500 placeholder-slate-500"
                    />
                    <button
                      type="submit"
                      disabled={sendLoading || !newMessage.trim()}
                      className="px-5 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg disabled:opacity-50 transition-all cursor-pointer"
                    >
                      <span>Envoyer</span>
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                )}
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-500 text-xs py-12">
                <MessageSquare className="w-12 h-12 mb-3 text-amber-500/40" />
                <span className="font-bold text-slate-400 text-sm">Messagerie Instantanée</span>
                <span className="mt-1 text-slate-500">Sélectionnez une discussion à gauche pour échanger en direct.</span>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function ClientMessagesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 text-white flex items-center justify-center text-xs">Chargement de la messagerie...</div>}>
      <ClientMessagesContent />
    </Suspense>
  );
}
