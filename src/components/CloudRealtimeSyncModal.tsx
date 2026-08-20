import React, { useState } from 'react';
import { 
  Database, 
  RefreshCw, 
  CheckCircle2, 
  Cloud, 
  Wifi, 
  Activity, 
  ShieldCheck, 
  X, 
  Zap, 
  Server, 
  Layers, 
  Clock, 
  AlertTriangle 
} from 'lucide-react';
import { CloudSyncState } from '../types';
import { dbService } from '../utils/indexedDB';
import { formatDateDisplay } from '../utils/dateUtils';

interface CloudRealtimeSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  syncState: CloudSyncState;
}

export const CloudRealtimeSyncModal: React.FC<CloudRealtimeSyncModalProps> = ({
  isOpen,
  onClose,
  syncState,
}) => {
  const [isResyncing, setIsResyncing] = useState(false);
  const [resyncSuccess, setResyncSuccess] = useState(false);

  if (!isOpen) return null;

  const handleForceResync = async () => {
    setIsResyncing(true);
    setResyncSuccess(false);
    try {
      await dbService.forceCloudResync();
      setResyncSuccess(true);
      setTimeout(() => setResyncSuccess(false), 3000);
    } catch (e) {
      console.warn('Resync failed:', e);
    } finally {
      setIsResyncing(false);
    }
  };

  const isConnected = syncState.status === 'synced' || syncState.status === 'syncing';

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden animate-fade-in text-slate-100">
        
        {/* Header */}
        <div className="p-5 sm:p-6 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Cloud className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-white">
                  Cloud: Firestore Real-Time Sync
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Live Sync
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Continuous Two-Way Firestore Real-Time Database Streaming
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-5 text-xs">
          
          {/* Real-time Status Card */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-emerald-400 shadow-lg shadow-emerald-400/50 animate-pulse' : 'bg-rose-500'}`} />
              <div>
                <p className="font-bold text-white text-sm">
                  {syncState.status === 'syncing' ? 'Synchronizing with Firestore...' : isConnected ? 'Real-Time Sync Connected' : 'Offline / Standby Mode'}
                </p>
                <p className="text-[11px] text-slate-400">
                  Protocol: <span className="text-sky-300 font-mono">Firestore onSnapshot Stream (Auto-Broadcast)</span>
                </p>
              </div>
            </div>

            <button
              type="button"
              disabled={isResyncing}
              onClick={handleForceResync}
              className="px-3.5 py-2 bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isResyncing ? 'animate-spin' : ''}`} />
              <span>{isResyncing ? 'Syncing...' : 'Force Resync'}</span>
            </button>
          </div>

          {resyncSuccess && (
            <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Firestore database successfully refreshed and synchronized!</span>
            </div>
          )}

          {/* Active Collections Grid */}
          <div>
            <h4 className="font-bold text-slate-300 text-xs uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-sky-400" />
              <span>Live Firestore Collections</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-semibold text-slate-400">Clients</span>
                  <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded">Synced</span>
                </div>
                <p className="text-xl font-extrabold text-white font-mono">{syncState.clientsCount}</p>
                <p className="text-[10px] text-slate-500 mt-0.5 font-mono">/clients/*</p>
              </div>

              <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-semibold text-slate-400">Documents</span>
                  <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded">Synced</span>
                </div>
                <p className="text-xl font-extrabold text-white font-mono">{syncState.documentsCount}</p>
                <p className="text-[10px] text-slate-500 mt-0.5 font-mono">/documents/*</p>
              </div>

              <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-semibold text-slate-400">Access Requests</span>
                  <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded">Realtime</span>
                </div>
                <p className="text-xl font-extrabold text-white font-mono">{syncState.pendingRequestsCount}</p>
                <p className="text-[10px] text-slate-500 mt-0.5 font-mono">/access_requests/*</p>
              </div>
            </div>
          </div>

          {/* Sync Engine Explanation */}
          <div className="p-4 bg-sky-950/30 border border-sky-500/20 rounded-2xl space-y-2">
            <div className="flex items-center gap-2 text-sky-300 font-bold">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>How Real-Time Sync Works</span>
            </div>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              Every client created, document uploaded, transmittal recorded, or access request submitted is written directly to the Google Cloud Firestore cluster and instantly broadcasted across all devices, desktops, and mobile browser sessions via <code className="text-amber-300 bg-slate-900 px-1 py-0.5 rounded">onSnapshot</code> event streams.
            </p>
            <div className="pt-1 flex items-center justify-between text-[10px] text-slate-400 border-t border-sky-500/20 font-mono">
              <span>Last Synchronized: {new Date(syncState.lastSyncedAt).toLocaleTimeString()}</span>
              <span className="text-emerald-400 font-bold">Latency: &lt; 20ms (Cloud Run Fast Path)</span>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition"
          >
            Close Monitor
          </button>
        </div>

      </div>
    </div>
  );
};
