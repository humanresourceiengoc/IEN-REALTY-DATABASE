import React, { useState } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Lock, 
  Mail, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  LogOut, 
  RefreshCw, 
  KeyRound, 
  Building2, 
  UserCheck, 
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { UserSession } from '../types';
import { authService, MASTER_GOOGLE_EMAIL, MASTER_GOOGLE_NAME } from '../utils/authService';

interface MasterVerificationGateProps {
  currentUser: UserSession | null;
  onUserAuthenticated: (user: UserSession) => void;
}

export const MasterVerificationGate: React.FC<MasterVerificationGateProps> = ({
  currentUser,
  onUserAuthenticated,
}) => {
  const [inputEmail, setInputEmail] = useState('');
  const [inputName, setInputName] = useState('');
  const [requestReason, setRequestReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customMode, setCustomMode] = useState(false);
  const [notificationMsg, setNotificationMsg] = useState('');

  const handleMasterOneClickLogin = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      const session = authService.loginWithMasterAccount();
      onUserAuthenticated(session);
      setIsSubmitting(false);
    }, 300);
  };

  const handleFirebaseGoogleLogin = async () => {
    setIsSubmitting(true);
    try {
      const session = await authService.loginWithFirebasePopup();
      if (session) {
        onUserAuthenticated(session);
      }
    } catch (e) {
      console.warn('Login note:', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleCustomLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputEmail || !inputEmail.includes('@')) {
      alert('Please enter a valid Google email address.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const session = authService.loginWithGoogleEmail(
        inputEmail,
        inputName || undefined,
        undefined,
        requestReason || undefined
      );
      onUserAuthenticated(session);
      setIsSubmitting(false);
    }, 300);
  };

  const handleRefreshStatus = () => {
    if (!currentUser) return;
    const isApproved = authService.isEmailApproved(currentUser.email);
    if (isApproved) {
      const upgraded: UserSession = {
        ...currentUser,
        role: 'approved_staff',
        status: 'active',
      };
      authService.setCurrentUser(upgraded);
      onUserAuthenticated(upgraded);
      setNotificationMsg('Verification approved! Access granted.');
    } else {
      setNotificationMsg('Verification still pending master approval from humanresource.iengoc@gmail.com');
      setTimeout(() => setNotificationMsg(''), 4000);
    }
  };

  const handleSendUpdatedReason = () => {
    if (!currentUser || !requestReason) return;
    authService.submitAccessRequest(currentUser.email, currentUser.name, requestReason, currentUser.picture);
    setNotificationMsg('Access request note sent to Master Owner!');
    setTimeout(() => setNotificationMsg(''), 3000);
  };

  // 1. If user is logged in but pending master verification
  if (currentUser && (currentUser.status === 'pending_approval' || currentUser.status === 'rejected')) {
    const isRejected = currentUser.status === 'rejected';

    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-slate-100 relative overflow-hidden">
        {/* Background ambient lighting */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-lg w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10">
          
          {/* Header icon & badge */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                {isRejected ? <ShieldAlert className="w-6 h-6 text-rose-400" /> : <Lock className="w-6 h-6" />}
              </div>
              <div>
                <h2 className="text-base font-extrabold text-white">
                  {isRejected ? 'Access Authorization Declined' : 'Master Verification Required'}
                </h2>
                <p className="text-xs text-slate-400">
                  IEN REALTY INC. Corporate Vault Security
                </p>
              </div>
            </div>

            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
              isRejected ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
            }`}>
              {isRejected ? 'Declined' : 'Pending Verification'}
            </span>
          </div>

          {/* Current Google Account Details */}
          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 mb-5">
            <div className="flex items-center gap-3">
              {currentUser.picture ? (
                <img src={currentUser.picture} alt={currentUser.name} className="w-11 h-11 rounded-xl object-cover border border-slate-700" />
              ) : (
                <div className="w-11 h-11 rounded-xl bg-slate-800 flex items-center justify-center font-bold text-sky-400 border border-slate-700">
                  {currentUser.email.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-white truncate">{currentUser.name}</p>
                <p className="text-xs text-slate-400 truncate flex items-center gap-1">
                  <Mail className="w-3 h-3 text-sky-400 shrink-0" />
                  <span>{currentUser.email}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Notification explanation */}
          <div className="bg-amber-950/40 border border-amber-500/30 rounded-2xl p-4 mb-5 text-xs space-y-2">
            <div className="flex items-start gap-2 text-amber-300 font-bold">
              <Clock className="w-4 h-4 shrink-0 mt-0.5" />
              <span>Master Gatekeeper Verification Protocol</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              This document portal is exclusively restricted. An access request has been sent to the Master Owner Google Account:
            </p>
            <div className="p-2.5 bg-slate-900/90 rounded-xl border border-slate-800 flex items-center justify-between text-xs font-mono text-sky-300">
              <span className="font-bold">{MASTER_GOOGLE_EMAIL}</span>
              <span className="text-[10px] bg-sky-500/20 text-sky-300 px-2 py-0.5 rounded font-sans font-semibold">Master Admin</span>
            </div>
            <p className="text-slate-400 text-[11px]">
              Once <span className="text-slate-200 font-semibold">{MASTER_GOOGLE_EMAIL}</span> approves your request from their Master Dashboard, your access will be granted instantly.
            </p>
          </div>

          {/* Request purpose / note field */}
          <div className="mb-5">
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Reason / Department for Access (Optional Note for Master Admin)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={requestReason}
                onChange={(e) => setRequestReason(e.target.value)}
                placeholder="e.g., Compliance Officer / Legal Auditor"
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
              <button
                type="button"
                onClick={handleSendUpdatedReason}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-xl border border-slate-700 transition"
              >
                Send Note
              </button>
            </div>
          </div>

          {notificationMsg && (
            <div className="mb-4 p-3 bg-sky-950/60 border border-sky-500/40 rounded-xl text-xs text-sky-300 flex items-center gap-2 animate-fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{notificationMsg}</span>
            </div>
          )}

          {/* Action buttons */}
          <div className="space-y-2.5 pt-2">
            <button
              type="button"
              onClick={handleRefreshStatus}
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-xl transition shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Check Verification Approval Status</span>
            </button>

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  authService.logout();
                  onUserAuthenticated(null as unknown as UserSession);
                }}
                className="flex-1 py-3 px-4 bg-rose-600/90 hover:bg-rose-500 active:bg-rose-700 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 shadow-md shadow-rose-600/20"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out / Back to Sign In</span>
              </button>

              <button
                type="button"
                onClick={handleMasterOneClickLogin}
                className="py-3 px-4 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 shadow-md shadow-sky-600/20"
                title={`Switch directly to Master Owner: ${MASTER_GOOGLE_EMAIL}`}
              >
                <KeyRound className="w-4 h-4" />
                <span>Master Admin Login</span>
              </button>
            </div>
          </div>

        </div>
      </div>
    );
  }

  // 2. Login Screen (when not logged in)
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-slate-100 relative overflow-hidden">
      
      {/* Background glow effects */}
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10">
        
        {/* Brand Banner */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-sky-500/20 border border-sky-300/30">
            <Building2 className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-xl font-extrabold bg-gradient-to-r from-sky-200 via-sky-300 to-white bg-clip-text text-transparent">
            IEN REALTY INC.
          </h1>
          <p className="text-xs font-semibold text-sky-400 tracking-wider uppercase mt-0.5">
            Corporate Client Compliance & File Registry
          </p>
          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-[11px] text-slate-300">
            <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
            <span>Master Protected Vault</span>
          </div>
        </div>

        {/* Master Account Info Card */}
        <div className="bg-slate-950/80 border border-sky-500/30 rounded-2xl p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-sky-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-sky-400" />
              Master Super Admin Google Account
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/40">
              Gatekeeper
            </span>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-sm shrink-0">
              HR
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-white truncate">{MASTER_GOOGLE_NAME}</p>
              <p className="text-[11px] text-sky-300 truncate font-mono">{MASTER_GOOGLE_EMAIL}</p>
            </div>
          </div>
        </div>

        {/* Primary Master Google Sign-in */}
        <div className="space-y-3">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleMasterOneClickLogin}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 active:from-amber-600 active:to-amber-500 text-slate-950 font-extrabold text-xs sm:text-sm rounded-xl transition shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2.5 group"
          >
            {/* Google Vector Icon */}
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#0f172a"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#0f172a"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#0f172a"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#0f172a"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue as Master Owner ({MASTER_GOOGLE_EMAIL})</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleFirebaseGoogleLogin}
            className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-750 text-white font-bold text-xs sm:text-sm rounded-xl border border-slate-700 hover:border-slate-600 transition flex items-center justify-center gap-2.5"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Sign In with Google Account</span>
          </button>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase">
              <span className="bg-slate-900 px-3 text-slate-500 font-semibold tracking-wider">
                Or Submit Access Request
              </span>
            </div>
          </div>

          {!customMode ? (
            <button
              type="button"
              onClick={() => setCustomMode(true)}
              className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl border border-slate-700 transition flex items-center justify-center gap-2"
            >
              <UserCheck className="w-3.5 h-3.5 text-slate-400" />
              <span>Sign in with other Google Email (Requires Master Verification)</span>
            </button>
          ) : (
            <form onSubmit={handleGoogleCustomLogin} className="space-y-3 p-3.5 bg-slate-950 rounded-2xl border border-slate-800">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Google Account Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="your.email@gmail.com"
                  value={inputEmail}
                  onChange={(e) => setInputEmail(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Full Name / Position
                </label>
                <input
                  type="text"
                  placeholder="e.g. Maria Santos (Senior Auditor)"
                  value={inputName}
                  onChange={(e) => setInputName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Reason / Purpose for Access Request
                </label>
                <input
                  type="text"
                  placeholder="e.g. Quarterly BIR Form 2303 & DTI compliance review"
                  value={requestReason}
                  onChange={(e) => setRequestReason(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-400"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setCustomMode(false)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs rounded-xl transition shadow-sm"
                >
                  Submit & Request Access
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Security Footer Notice */}
        <div className="mt-6 pt-4 border-t border-slate-800 text-center">
          <p className="text-[10px] text-slate-500 leading-relaxed">
            Strict Multi-Tier Verification &bull; All logins and file requests are audited and monitored under IEN Realty Inc. corporate privacy policies.
          </p>
        </div>

      </div>
    </div>
  );
};
