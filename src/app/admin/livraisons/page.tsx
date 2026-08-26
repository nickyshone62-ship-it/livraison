'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Package, MapPin, User, Clock, ChevronRight } from 'lucide-react';

export default function AdminLivraisonsPage() {
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDeliveries();
  }, []);

  const fetchDeliveries = async () => {
    try {
      const res = await fetch('/api/deliveries');
      if (res.ok) {
        const data = await res.json();
        setDeliveries(data.requests || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-12">
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center space-x-4">
          <Link href="/admin" className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-bold text-white">Supervision Globale des Livraisons ({deliveries.length})</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {loading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : deliveries.length === 0 ? (
          <div className="p-12 rounded-3xl bg-slate-900/40 border border-slate-800 text-center text-slate-400 text-sm">
            Aucune livraison enregistrée.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {deliveries.map((d) => (
              <div key={d.id} className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold uppercase">
                    {d.status}
                  </span>
                  <span className="text-xs text-slate-500">{new Date(d.createdAt).toLocaleString('fr-FR')}</span>
                </div>

                <div>
                  <h3 className="font-bold text-white text-base">{d.packageDescription}</h3>
                  <p className="text-xs text-slate-400">Client: {d.client?.fullName || 'Client'} ({d.client?.phone || 'N/A'})</p>
                  <p className="text-xs text-slate-400">Destinataire: {d.recipientName} ({d.recipientPhone})</p>
                </div>

                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs space-y-1">
                  <div>De: <span className="text-white font-medium">{d.pickupAddress}</span></div>
                  <div>À: <span className="text-white font-medium">{d.destinationAddress}</span></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
