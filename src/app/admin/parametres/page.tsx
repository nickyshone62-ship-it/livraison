'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Settings, Save, CheckCircle2 } from 'lucide-react';

export default function AdminParametresPage() {
  const [clientRegFee, setClientRegFee] = useState('2000');
  const [driverRegFee, setDriverRegFee] = useState('1500');
  const [monthlySubFee, setMonthlySubFee] = useState('1000');
  const [orangeMoneyNumber, setOrangeMoneyNumber] = useState('06887330');
  const [moovMoneyNumber, setMoovMoneyNumber] = useState('62017878');
  const [waveNumber, setWaveNumber] = useState('06887330');

  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings');
      if (res.ok) {
        const data = await res.json();
        const settingsMap: any = {};
        (data.settings || []).forEach((s: any) => {
          settingsMap[s.settingKey] = s.settingValue;
        });

        if (settingsMap.client_registration_fee) setClientRegFee(String(settingsMap.client_registration_fee));
        if (settingsMap.driver_registration_fee) setDriverRegFee(String(settingsMap.driver_registration_fee));
        if (settingsMap.monthly_subscription_fee) setMonthlySubFee(String(settingsMap.monthly_subscription_fee));
        if (settingsMap.orange_money_number) setOrangeMoneyNumber(String(settingsMap.orange_money_number));
        if (settingsMap.moov_money_number) setMoovMoneyNumber(String(settingsMap.moov_money_number));
        if (settingsMap.wave_number) setWaveNumber(String(settingsMap.wave_number));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveLoading(true);
    setSuccess(false);

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: [
            { settingKey: 'client_registration_fee', settingValue: clientRegFee, description: 'Frais inscription client (FCFA)' },
            { settingKey: 'driver_registration_fee', settingValue: driverRegFee, description: 'Frais inscription livreur (FCFA)' },
            { settingKey: 'monthly_subscription_fee', settingValue: monthlySubFee, description: 'Frais abonnement mensuel (FCFA)' },
            { settingKey: 'orange_money_number', settingValue: orangeMoneyNumber, description: 'Numéro d encaisser Orange Money' },
            { settingKey: 'moov_money_number', settingValue: moovMoneyNumber, description: 'Numéro d encaisser Moov Money' },
            { settingKey: 'wave_number', settingValue: waveNumber, description: 'Numéro d encaisser Wave' },
          ],
        }),
      });

      if (!res.ok) throw new Error('Erreur sauvegarde');
      setSuccess(true);
    } catch (err: any) {
      alert(err.message || 'Erreur sauvegarde paramètres');
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-12">
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center space-x-4">
          <Link href="/admin" className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-bold text-white">Paramètres Généraux de la Plateforme</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <form onSubmit={handleSaveSettings} className="space-y-8">
          {success && (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-bold flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5" />
              <span>Paramètres enregistrés et appliqués avec succès !</span>
            </div>
          )}

          {/* Tarifs */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
            <h2 className="text-lg font-bold text-amber-400 border-b border-slate-800 pb-3">Tarification & Abonnements (FCFA)</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Inscription Client (FCFA)</label>
                <input
                  type="number"
                  value={clientRegFee}
                  onChange={(e) => setClientRegFee(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-white outline-none focus:ring-2 focus:ring-amber-500 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Inscription Livreur (FCFA)</label>
                <input
                  type="number"
                  value={driverRegFee}
                  onChange={(e) => setDriverRegFee(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-white outline-none focus:ring-2 focus:ring-amber-500 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Abonnement Mensuel (FCFA)</label>
                <input
                  type="number"
                  value={monthlySubFee}
                  onChange={(e) => setMonthlySubFee(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-white outline-none focus:ring-2 focus:ring-amber-500 font-bold"
                />
              </div>
            </div>
          </div>

          {/* Numéros de Paiement */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
            <h2 className="text-lg font-bold text-orange-400 border-b border-slate-800 pb-3">Numéros d'Encaissement Mobile Money</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Orange Money</label>
                <input
                  type="text"
                  value={orangeMoneyNumber}
                  onChange={(e) => setOrangeMoneyNumber(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-white outline-none focus:ring-2 focus:ring-orange-500 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Moov Money</label>
                <input
                  type="text"
                  value={moovMoneyNumber}
                  onChange={(e) => setMoovMoneyNumber(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-white outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Wave</label>
                <input
                  type="text"
                  value={waveNumber}
                  onChange={(e) => setWaveNumber(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-white outline-none focus:ring-2 focus:ring-cyan-500 font-bold"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={saveLoading}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 text-white font-bold text-sm shadow-xl flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {saveLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Save className="w-5 h-5" />
                <span>Enregistrer les modifications</span>
              </>
            )}
          </button>
        </form>
      </main>
    </div>
  );
}
