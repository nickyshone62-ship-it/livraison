'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, MessageSquare, Send, Phone, User, Package, Clock, RefreshCw } from 'lucide-react';

export default function DriverMessagesPage() {
  const searchParams = useSearchParams();
  const targetConvId = searchParams.get('conv');

  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConv, setSelectedConv] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sendLoading, setSendLoading] = useState(false);

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedConv) {
      fetchMessages(selectedConv.id);
      const interval = setInterval(() => fetchMessages(selectedConv.id), 3000);
      return () => clearInterval(interval);
    }
  }, [selectedConv]);

  const fetchConversations = async () => {
    try {
      const res = await fetch('/api/conversations');
      if (res.ok) {
        const data = await res.json();
        const list = data.conversations || [];
        setConversations(list);

        if (targetConvId && !selectedConv) {
          const match = list.find((c: any) => c.id === targetConvId);
          if (match) handleSelectConv(match);
        } else if (list.length > 0 && !selectedConv) {
          handleSelectConv(list[0]);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (convId: string) => {
    try {
      const res = await fetch(`/api/conversations/${convId}/messages`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectConv = (conv: any) => {
    setSelectedConv(conv);
    fetchMessages(conv.id);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConv || !newMessage.trim()) return;

    setSendLoading(true);
    try {
      const res = await fetch(`/api/conversations/${selectedConv.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newMessage }),
      });

      if (res.ok) {
        setNewMessage('');
        await fetchMessages(selectedConv.id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSendLoading(false);
    }
  };

  const clientInfo = selectedConv?.otherParticipant || {};

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-16">
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/driver" className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-white">Messagerie Directe Client</h1>
              <p className="text-xs text-slate-400">Échangez en direct avec vos clients pour coordonner la livraison</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden min-h-[550px]">
          
          {/* Liste des conversations */}
          <div className="border-r border-slate-800 p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="font-bold text-slate-300 text-xs uppercase tracking-wider">Discussions en cours</h2>
              <span className="text-[11px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                {conversations.length}
              </span>
            </div>

            {loading ? (
              <div className="text-center py-12 text-slate-500 text-xs flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                <span>Chargement des conversations...</span>
              </div>
            ) : conversations.length === 0 ? (
              <div className="text-slate-500 text-xs text-center py-12 space-y-2">
                <MessageSquare className="w-8 h-8 mx-auto text-slate-600" />
                <div>Aucune conversation enregistrée.</div>
              </div>
            ) : (
              <div className="space-y-2">
                {conversations.map((c) => {
                  const part = c.otherParticipant || {};
                  const lastMsg = c.messages?.[0]?.content || 'Nouvelle conversation';
                  const isSelected = selectedConv?.id === c.id;

                  return (
                    <button
                      key={c.id}
                      onClick={() => handleSelectConv(c)}
                      className={`w-full p-3.5 rounded-2xl text-left border transition-all ${
                        isSelected
                          ? 'bg-amber-500/10 border-amber-500 text-white'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="font-bold text-sm text-white truncate max-w-[160px]">
                          {part.fullName || 'Client'}
                        </div>
                        {c.messages?.[0] && (
                          <span className="text-[10px] text-slate-500 shrink-0">
                            {new Date(c.messages[0].createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-amber-400/80 font-medium truncate mb-1">
                        📦 {c.delivery?.packageDescription || 'Livraison'}
                      </div>

                      <div className="text-[11px] text-slate-400 truncate">
                        {lastMsg}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Fenêtre de Chat */}
          <div className="md:col-span-2 p-6 flex flex-col justify-between max-w-full overflow-hidden">
            {selectedConv ? (
              <>
                {/* En-tête du Chat */}
                <div className="border-b border-slate-800 pb-4 mb-4 flex items-center justify-between gap-4">
                  <div className="flex items-center space-x-3 truncate">
                    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center font-bold text-amber-400 shrink-0">
                      <User className="w-5 h-5" />
                    </div>
                    <div className="truncate">
                      <div className="font-bold text-white text-base truncate">{clientInfo.fullName || 'Client'}</div>
                      <div className="text-xs text-slate-400 truncate">
                        Colis : <strong className="text-amber-400">{selectedConv.delivery?.packageDescription || 'Livraison'}</strong>
                      </div>
                    </div>
                  </div>

                  {clientInfo.phone && (
                    <a
                      href={`tel:${clientInfo.phone}`}
                      className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold text-xs flex items-center space-x-1.5 border border-slate-700 shrink-0"
                    >
                      <Phone className="w-4 h-4" />
                      <span>Appeler ({clientInfo.phone})</span>
                    </a>
                  )}
                </div>

                {/* Bulle des Messages */}
                <div className="flex-1 overflow-y-auto space-y-3 mb-4 max-h-[350px] pr-2">
                  {messages.length === 0 ? (
                    <div className="text-center py-12 text-slate-500 text-xs">
                      Aucun message échangé pour le moment. Écrivez votre premier message ci-dessous !
                    </div>
                  ) : (
                    messages.map((m) => {
                      const isMe = m.senderId !== selectedConv.clientId;
                      return (
                        <div
                          key={m.id}
                          className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                        >
                          <div
                            className={`p-3.5 rounded-2xl max-w-[80%] text-xs font-medium break-words ${
                              isMe
                                ? 'bg-amber-500 text-slate-950 font-semibold rounded-br-none'
                                : 'bg-slate-800 text-slate-100 rounded-bl-none border border-slate-700'
                            }`}
                          >
                            {m.content}
                          </div>
                          <span className="text-[10px] text-slate-500 mt-1 px-1">
                            {new Date(m.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Formulaire d'envoi */}
                <form onSubmit={handleSendMessage} className="flex items-center space-x-2 pt-3 border-t border-slate-800">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Tapez votre message au client..."
                    className="flex-1 px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-white text-xs outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <button
                    type="submit"
                    disabled={sendLoading || !newMessage.trim()}
                    className="px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center space-x-1.5 disabled:opacity-50 transition-colors shadow-md cursor-pointer"
                  >
                    <span>Envoyer</span>
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-500 text-xs space-y-2">
                <MessageSquare className="w-12 h-12 opacity-40 text-amber-500" />
                <span>Sélectionnez une discussion à gauche pour contacter le client.</span>
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}
