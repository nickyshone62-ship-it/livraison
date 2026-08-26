import React from 'react';
import { MapPin, Navigation, Truck, ExternalLink, Compass } from 'lucide-react';

interface DeliveryMapProps {
  pickupAddress?: string;
  dropoffAddress?: string;
  pickupLat?: number;
  pickupLng?: number;
  dropoffLat?: number;
  dropoffLng?: number;
  driverLat?: number;
  driverLng?: number;
  driverName?: string;
  status?: string;
  showNavigationButtons?: boolean;
  pickedUpAt?: Date | string | null;
  deliveredAt?: Date | string | null;
}

export function DeliveryMap({ pickupAddress = 'Point A (Départ)', dropoffAddress = 'Point B (Arrivée)', driverName, status, showNavigationButtons = true, pickedUpAt, deliveredAt }: DeliveryMapProps) {

  const [elapsedSeconds, setElapsedSeconds] = React.useState<number>(0);

  React.useEffect(() => {
    if (!pickedUpAt || status === 'LIVRE') return;

    const startTime = new Date(pickedUpAt).getTime();

    const updateChrono = () => {
      const now = new Date().getTime();
      const diff = Math.max(0, Math.floor((now - startTime) / 1000));
      setElapsedSeconds(diff);
    };

    updateChrono();
    const interval = setInterval(updateChrono, 1000);
    return () => clearInterval(interval);
  }, [pickedUpAt, status]);

  const formatTimer = (secondsTotal: number) => {
    const hrs = Math.floor(secondsTotal / 3600);
    const mins = Math.floor((secondsTotal % 3600) / 60);
    const secs = secondsTotal % 60;

    if (hrs > 0) {
      return `${hrs}h ${mins}m ${secs.toString().padStart(2, '0')}s`;
    }
    return `${mins} min ${secs.toString().padStart(2, '0')} s`;
  };

  const getFinalDurationText = () => {
    if (!pickedUpAt || !deliveredAt) return null;
    const start = new Date(pickedUpAt).getTime();
    const end = new Date(deliveredAt).getTime();
    const totalSecs = Math.max(0, Math.floor((end - start) / 1000));
    return formatTimer(totalSecs);
  };

  const getGoogleMapsRouteUrl = () => {
    const origin = encodeURIComponent(`${pickupAddress || ''}, Ouagadougou, Burkina Faso`);
    const destination = encodeURIComponent(`${dropoffAddress || ''}, Ouagadougou, Burkina Faso`);
    return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}`;
  };

  const getGoogleMapsPointAUrl = () => {
    const query = encodeURIComponent(`${pickupAddress || ''}, Ouagadougou, Burkina Faso`);
    return `https://www.google.com/maps/search/?api=1&query=${query}`;
  };

  const getGoogleMapsPointBUrl = () => {
    const query = encodeURIComponent(`${dropoffAddress || ''}, Ouagadougou, Burkina Faso`);
    return `https://www.google.com/maps/search/?api=1&query=${query}`;
  };

  return (
    <div className="relative w-full h-72 sm:h-80 rounded-2xl overflow-hidden bg-slate-900 border-2 border-slate-800 shadow-xl flex flex-col justify-between p-3">
      
      {/* Map Background Grid Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-70 pointer-events-none"></div>
      
      {/* Decorative Ouagadougou Roads Overlay */}
      <svg className="absolute inset-0 w-full h-full stroke-slate-800/80 stroke-2 pointer-events-none">
        <line x1="10%" y1="20%" x2="90%" y2="80%" strokeDasharray="4 4" className="stroke-emerald-500/40" />
        <circle cx="20%" cy="30%" r="40" fill="none" className="stroke-slate-700/40" />
        <circle cx="80%" cy="70%" r="50" fill="none" className="stroke-slate-700/40" />
      </svg>

      {/* Map Header Overlay */}
      <div className="relative z-10 flex flex-col gap-2 w-full">
        <div className="flex justify-between items-center w-full">
          <span className="px-3 py-1 rounded-full bg-slate-950/90 text-emerald-400 text-xs font-mono font-bold border border-slate-800 backdrop-blur-md flex items-center gap-1.5 shadow-md">
            <Navigation className="w-3.5 h-3.5 animate-spin" /> Suivi GPS en Temps Réel • Ouaga
          </span>

          {status && (
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/40 backdrop-blur-md">
              {status}
            </span>
          )}
        </div>

        {/* LIVE CHRONOMETER & ETA TRACKER BANNER */}
        {pickedUpAt && status !== 'LIVRE' && (
          <div className="bg-gradient-to-r from-emerald-950 to-teal-900 border border-emerald-400/60 p-2.5 rounded-xl text-white flex items-center justify-between shadow-xl backdrop-blur-md animate-fadeIn">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping shrink-0" />
              <div>
                <div className="text-[10px] font-black uppercase text-emerald-300">Suivi Chrono Live • Colis en Route</div>
                <div className="text-[11px] font-bold text-slate-200">Temps écoulé depuis la récupération :</div>
              </div>
            </div>
            <div className="px-3 py-1 bg-emerald-400 text-slate-950 rounded-lg font-mono font-black text-sm shadow-md border border-white flex items-center gap-1.5 shrink-0">
              ⏱️ {formatTimer(elapsedSeconds)}
            </div>
          </div>
        )}

        {/* FINAL DURATION BANNER ONCE DELIVERED */}
        {status === 'LIVRE' && pickedUpAt && (
          <div className="bg-gradient-to-r from-emerald-900 to-teal-950 border border-emerald-400/60 p-2.5 rounded-xl text-white flex items-center justify-between shadow-xl backdrop-blur-md animate-fadeIn">
            <div className="flex items-center gap-2">
              <span className="text-lg">🥳</span>
              <div>
                <div className="text-[10px] font-black uppercase text-emerald-300">Course Terminée avec Succès</div>
                <div className="text-[11px] font-bold text-slate-200">Durée totale du trajet :</div>
              </div>
            </div>
            <div className="px-3 py-1 bg-emerald-400 text-slate-950 rounded-lg font-black text-xs shadow-md border border-white shrink-0">
              ⏱️ {getFinalDurationText() || 'Course Livrée'}
            </div>
          </div>
        )}
      </div>

      {/* Markers & Visual Trajectory */}
      <div className="relative w-full my-auto flex items-center justify-around px-4 sm:px-8 z-10">
        
        {/* Pickup Marker (Point A) */}
        <div className="flex flex-col items-center gap-1 group">
          <a
            href={getGoogleMapsPointAUrl()}
            target="_blank"
            rel="noopener noreferrer"
            title="Cliquez pour ouvrir Point A dans Google Maps"
            className="w-11 h-11 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center font-bold shadow-lg shadow-emerald-600/40 border-2 border-emerald-300 transform hover:scale-110 transition-all cursor-pointer"
          >
            <MapPin className="w-6 h-6" />
          </a>
          <div className="bg-slate-950/90 text-emerald-300 text-[11px] font-bold px-2.5 py-1 rounded-lg border border-emerald-500/40 max-w-[130px] text-center truncate shadow-sm">
            1. {pickupAddress || 'Point A'}
          </div>
        </div>

        {/* Animated Moving Driver Icon */}
        <div className="flex flex-col items-center gap-1 animate-pulse">
          <div className="w-12 h-12 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center font-black shadow-xl shadow-amber-500/50 border-2 border-white">
            <Truck className="w-6.5 h-6.5" />
          </div>
          <span className="bg-amber-500 text-slate-950 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
            {driverName || 'Livreur'}
          </span>
        </div>

        {/* Dropoff Marker (Point B) */}
        <div className="flex flex-col items-center gap-1 group">
          <a
            href={getGoogleMapsPointBUrl()}
            target="_blank"
            rel="noopener noreferrer"
            title="Cliquez pour ouvrir Point B dans Google Maps"
            className="w-11 h-11 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center font-bold shadow-lg shadow-blue-600/40 border-2 border-blue-300 transform hover:scale-110 transition-all cursor-pointer"
          >
            <MapPin className="w-6 h-6" />
          </a>
          <div className="bg-slate-950/90 text-blue-300 text-[11px] font-bold px-2.5 py-1 rounded-lg border border-blue-500/40 max-w-[130px] text-center truncate shadow-sm">
            2. {dropoffAddress || 'Point B'}
          </div>
        </div>

      </div>

      {/* GPS NAVIGATION LAUNCH BUTTONS OVERLAY FOR THE DRIVER */}
      {showNavigationButtons && (
        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 bg-slate-950/85 backdrop-blur-md p-2 rounded-xl">
          <a
            href={getGoogleMapsPointAUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-lg shadow-md transition-all flex items-center justify-center gap-1.5 border border-emerald-400"
          >
            <Compass className="w-3.5 h-3.5 shrink-0" />
            <span>🚀 Aller au Point A (Récupération)</span>
            <ExternalLink className="w-3 h-3 shrink-0 opacity-80" />
          </a>

          <a
            href={getGoogleMapsPointBUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-lg shadow-md transition-all flex items-center justify-center gap-1.5 border border-blue-400"
          >
            <Compass className="w-3.5 h-3.5 shrink-0" />
            <span>🏁 Aller au Point B (Destination)</span>
            <ExternalLink className="w-3 h-3 shrink-0 opacity-80" />
          </a>
        </div>
      )}

    </div>
  );
}

export default DeliveryMap;

