'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, MessageSquare, Send } from 'lucide-react';

export default function ClientMessagesPage() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConv, setSelectedConv] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sendLoading, setSendLoading] = useState(false);

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      const res = await fetch('/api/conversations');
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);
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

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-12">
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center space-x-4">
          <Link href="/client" className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-bold text-white">Messagerie Intégrée</h1>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden min-h-[500px]">
          {/* Conversation List */}
          <div className="border-r border-slate-800 p-4 space-y-3">
            <h2 className="font-bold text-slate-300 text-xs uppercase tracking-wider mb-2">Conversations</h2>

            {loading ? (
              <div className="text-center py-8 text-slate-500 text-xs">Chargement...</div>
            ) : conversations.length === 0 ? (
              <div className="text-slate-500 text-xs text-center py-8">Aucune conversation.</div>
            ) : (
              conversations.map((c) => (
                <button
                  key={c.id}
                  onClick={() => handleSelectConv(c)}
                  className={`w-full p-3 rounded-2xl text-left border transition-all ${
                    selectedConv?.id === c.id ? 'bg-amber-500/10 border-amber-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="font-bold text-sm text-white">{c.driver?.profile?.fullName || 'Livreur'}</div>
                  <div className="text-[10px] text-slate-500 truncate">{c.delivery?.packageDescription || 'Livraison'}</div>
                </button>
              ))
            )}
          </div>

          {/* Chat Window */}
          <div className="md:col-span-2 p-6 flex flex-col justify-between">
            {selectedConv ? (
              <>
                <div className="border-b border-slate-800 pb-3 mb-4">
                  <div className="font-bold text-white text-base">{selectedConv.driver?.profile?.fullName || 'Livreur'}</div>
                  <div className="text-xs text-slate-400">Tél: {selectedConv.driver?.profile?.phone || 'N/A'}</div>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3 mb-4 max-h-[350px] pr-2">
                  {messages.map((m) => (
                    <div key={m.id} className={`p-3 rounded-2xl max-w-[80%] text-xs ${
                      m.senderId === selectedConv.clientId ? 'ml-auto bg-amber-500 text-white font-medium' : 'bg-slate-800 text-slate-200'
                    }`}>
                      {m.content}
                    </div>
                  ))}
                </div>

                <form onSubmit={handleSendMessage} className="flex items-center space-x-2 pt-2 border-t border-slate-800">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Écrivez votre message..."
                    className="flex-1 px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-white text-xs outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <button
                    type="submit"
                    disabled={sendLoading}
                    className="p-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-500 text-xs">
                <MessageSquare className="w-10 h-10 mb-2 opacity-50" />
                <span>Sélectionnez une conversation pour échanger des messages.</span>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
