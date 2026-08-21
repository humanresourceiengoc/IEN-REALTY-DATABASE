import React from 'react';
import { 
  ShieldCheck, 
  CheckCircle2, 
  Mail, 
  X, 
  Sparkles, 
  LogOut
} from 'lucide-react';
import { UserSession } from '../types';
import { MASTER_GOOGLE_EMAIL, maskEmail } from '../utils/authService';

interface AccountVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserSession | null;
  onSignOut: () => void;
  onOpenGatekeeper: () => void;
}

export const AccountVerificationModal: React.FC<AccountVerificationModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSignOut,
  onOpenGatekeeper,
}) => {
  if (!isOpen || !currentUser) return null;

  const isMaster = currentUser.isMaster;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden animate-fade-in text-slate-100">
        
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold ${
              isMaster ? 'bg-amber-500/20 border border-amber-500/30 text-amber-400' : 'bg-sky-500/20 border border-sky-500/30 text-sky-400'
            }`}>
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-white">
                  Account Verification & Security Inspector
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle2 className="w-2.5 h-2.5" />
                  Verified
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Identity and access control audit details
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

        {/* Modal Content */}
        <div className="p-5 sm:p-6 space-y-5 text-xs">
          
          {/* Active Account Identity Card */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                Currently Authenticated Session
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                isMaster 
                  ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30' 
                  : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
              }`}>
                {isMaster ? '👑 Master Super Admin' : 'Verified Staff'}
              </span>
            </div>

            <div className="flex items-center gap-3.5">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-base overflow-hidden shrink-0 ${
                isMaster ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 shadow-md shadow-amber-500/20' : 'bg-sky-500 text-white'
              }`}>
                {currentUser.picture ? (
                  <img src={currentUser.picture} alt={currentUser.name} className="w-full h-full object-cover" />
                ) : (
                  <span>{currentUser.name.charAt(0).toUpperCase()}</span>
                )}
              </div>

              <div className="min-w-0 flex-1 space-y-0.5">
                <p className="text-sm font-bold text-white truncate">{currentUser.name}</p>
                <p className="text-xs text-sky-300 font-mono truncate flex items-center gap-1">
                  <Mail className="w-3 h-3 shrink-0 text-sky-400" />
                  <span>{isMaster ? 'Master Administrator (Protected & Confidential)' : currentUser.email}</span>
                </p>
                <p className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Authentication Status: Active & Verified</span>
                </p>
              </div>
            </div>
          </div>

          {/* Verification Protocol Explanation in English */}
          <div className="space-y-2.5">
            <h4 className="font-bold text-slate-200 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>3-Step Security & Access Control Protocol:</span>
            </h4>

            <div className="space-y-2">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30 flex items-center justify-center font-bold shrink-0 text-[10px]">
                  1
                </span>
                <div>
                  <p className="font-bold text-white text-xs">Direct Credentials & Human Resource Verification</p>
                  <p className="text-[11px] text-slate-400 leading-relaxed mt-0.5">
                    Authorized users log in with their email and secure password. Only pre-approved staff and authorized accounts gain immediate access.
                  </p>
                </div>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center justify-center font-bold shrink-0 text-[10px]">
                  2
                </span>
                <div>
                  <p className="font-bold text-white text-xs">Master Authority & Identity Masking</p>
                  <p className="text-[11px] text-slate-400 leading-relaxed mt-0.5">
                    The Human Resource master email is protected and hidden across all application interfaces: <code className="text-amber-300 bg-slate-900 px-1 py-0.5 rounded font-mono font-bold">Master Administrator (Protected &amp; Confidential)</code>.
                  </p>
                </div>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center justify-center font-bold shrink-0 text-[10px]">
                  3
                </span>
                <div>
                  <p className="font-bold text-white text-xs">Real-Time Gatekeeper Access Approval</p>
                  <p className="text-[11px] text-slate-400 leading-relaxed mt-0.5">
                    If unapproved staff or guest accounts sign in, the database remains strictly locked until the Human Resource Administrator reviews and approves the request in the Gatekeeper modal.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-2.5 border-t border-slate-800">
            <button
              type="button"
              onClick={() => {
                onClose();
                onSignOut();
              }}
              className="w-full sm:w-auto px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 shadow-sm"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out Current Account</span>
            </button>

            {isMaster && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenGatekeeper();
                }}
                className="w-full sm:w-auto px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-xl transition flex items-center justify-center gap-1.5 shadow-sm"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Open Security Gatekeeper</span>
              </button>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
