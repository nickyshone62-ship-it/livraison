'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, XCircle, ShieldAlert, RefreshCw, User, Bike } from 'lucide-react';

export default function AdminUtilisateursPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

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

  const handleUserAction = async (userId: string, action: 'approve' | 'reject' | 'suspend' | 'reactivate') => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action }),
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

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-12">
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center space-x-4">
          <Link href="/admin" className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-bold text-white">Gestion Unifiée des Utilisateurs ({users.length})</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {loading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {users.map((u) => (
              <div key={u.id} className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center font-bold text-amber-400">
                      {u.role === 'driver' ? <Bike className="w-5 h-5" /> : <User className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="font-bold text-white">{u.fullName || 'Utilisateur'}</div>
                      <div className="text-xs text-slate-400">Tél: {u.phone || 'N/A'} | Email: {u.email || 'N/A'}</div>
                    </div>
                  </div>

                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${
                    u.accountStatus === 'approved' || u.accountStatus === 'active' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                    u.accountStatus === 'suspended' ? 'bg-orange-500/10 border-orange-500/20 text-orange-400' :
                    u.accountStatus === 'rejected' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                    'bg-amber-500/10 border-amber-500/20 text-amber-400'
                  }`}>
                    {u.accountStatus}
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-400 flex items-center justify-between">
                  <div>Rôle: <strong className="text-white uppercase">{u.role}</strong></div>
                  <div>Inscrit le: {new Date(u.createdAt).toLocaleDateString('fr-FR')}</div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-2 pt-2">
                  {u.accountStatus !== 'approved' && u.accountStatus !== 'active' && (
                    <button
                      onClick={() => handleUserAction(u.id, 'approve')}
                      disabled={actionLoading}
                      className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs"
                    >
                      Approuver
                    </button>
                  )}

                  {u.accountStatus !== 'suspended' && (
                    <button
                      onClick={() => handleUserAction(u.id, 'suspend')}
                      disabled={actionLoading}
                      className="px-4 py-2 rounded-xl bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 font-bold text-xs border border-orange-500/20"
                    >
                      Suspendre
                    </button>
                  )}

                  {u.accountStatus === 'suspended' && (
                    <button
                      onClick={() => handleUserAction(u.id, 'reactivate')}
                      disabled={actionLoading}
                      className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs"
                    >
                      Réactiver
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
