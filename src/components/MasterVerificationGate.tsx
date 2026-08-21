import React, { useState, useEffect } from 'react';
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
  Sparkles,
  Shield,
  Eye,
  EyeOff,
  LogIn
} from 'lucide-react';
import { UserSession } from '../types';
import { authService, maskEmail, MASTER_GOOGLE_EMAIL, MASTER_GOOGLE_NAME } from '../utils/authService';

interface MasterVerificationGateProps {
  currentUser: UserSession | null;
  onUserAuthenticated: (user: UserSession) => void;
}

export const MasterVerificationGate: React.FC<MasterVerificationGateProps> = ({
  currentUser,
  onUserAuthenticated,
}) => {
  const [authTab, setAuthTab] = useState<'email_login' | 'master_pass'>('email_login');
  const [inputEmail, setInputEmail] = useState('');
  const [inputName, setInputName] = useState('');
  const [requestReason, setRequestReason] = useState('');
  const [masterPasscode, setMasterPasscode] = useState('');
  const [showMasterPass, setShowMasterPass] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notificationMsg, setNotificationMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');

  // Subscribe to real-time auth changes when user is in pending verification state
  useEffect(() => {
    if (currentUser && currentUser.status === 'pending_approval') {
      const unsub = authService.subscribe((updated) => {
        if (updated && updated.status === 'active') {
          onUserAuthenticated(updated);
        }
      });
      return () => unsub();
    }
  }, [currentUser, onUserAuthenticated]);

  // Standard Email Login & Database Access Request
  const handleEmailLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');
    const cleanEmail = inputEmail.trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.includes('@') || cleanEmail.length < 5) {
      setErrorMsg('Pakilagay po ang inyong tamang email address.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const session = authService.loginWithGoogleEmail(
        cleanEmail,
        inputName.trim() || undefined,
        undefined,
        requestReason.trim() || 'Portal database access request'
      );
      onUserAuthenticated(session);
      setIsSubmitting(false);
    }, 300);
  };

  // Master Admin Passcode / Direct PIN
  const handleMasterPasscodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');
    if (!masterPasscode) {
      setErrorMsg('Pakilagay po ang Master Passcode o PIN.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const session = authService.loginWithMasterPass(masterPasscode);
      if (session) {
        onUserAuthenticated(session);
      } else {
        setErrorMsg('Invalid Master Passcode. Subukan ang default passcode (e.g. ien2026) o gamitin ang Email Log In.');
      }
      setIsSubmitting(false);
    }, 300);
  };

  const handleQuickMasterLogin = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      const session = authService.loginWithMasterAccount();
      onUserAuthenticated(session);
      setIsSubmitting(false);
    }, 250);
  };

  // Google Sign-in Handler with graceful fallback
  const handleFirebaseGoogleLogin = async () => {
    setIsSubmitting(true);
    setErrorMsg('');
    setInfoMsg('');
    try {
      const session = await authService.loginWithFirebasePopup();
      if (session) {
        onUserAuthenticated(session);
        return;
      }
    } catch (e: any) {
      console.warn('Google popup note (iframe constraint):', e);
      // Seamless graceful fallback: encourage email entry without harsh red error
      setInfoMsg('Dahil naka-iframe ang preview, mangyaring ilagay ang iyong email address sa itaas at i-click ang "Log In & Open Database".');
      const emailInputElem = document.getElementById('login-email-input');
      if (emailInputElem) {
        emailInputElem.focus();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check verification approval status manually
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
      setNotificationMsg('Approved na po ang inyong verification! Nabuksan na ang database.');
    } else {
      setNotificationMsg('Kasalukuyan pang naghihintay ng pag-apruba mula sa Master Administrator.');
      setTimeout(() => setNotificationMsg(''), 4000);
    }
  };

  const handleSendUpdatedReason = () => {
    if (!currentUser || !requestReason) return;
    authService.submitAccessRequest(currentUser.email, currentUser.name, requestReason, currentUser.picture);
    setNotificationMsg('Naipadala na ang inyong access reason sa Master Administrator!');
    setTimeout(() => setNotificationMsg(''), 3000);
  };

  // 1. Pending Master Verification Screen (When an unapproved user logs in)
  if (currentUser && (currentUser.status === 'pending_approval' || currentUser.status === 'rejected')) {
    const isRejected = currentUser.status === 'rejected';

    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-slate-100 relative overflow-hidden">
        {/* Ambient lighting */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-lg w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10">
          
          {/* Header */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                isRejected 
                  ? 'bg-rose-500/20 border border-rose-500/30 text-rose-400' 
                  : 'bg-amber-500/20 border border-amber-500/30 text-amber-400'
              }`}>
                {isRejected ? <ShieldAlert className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
              </div>
              <div>
                <h2 className="text-base font-extrabold text-white">
                  {isRejected ? 'Access Request Declined' : 'Naghihintay ng Verification'}
                </h2>
                <p className="text-xs text-slate-400">
                  IEN REALTY INC. Corporate Vault Security
                </p>
              </div>
            </div>

            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
              isRejected ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
            }`}>
              {isRejected ? 'Declined' : 'Awaiting Approval'}
            </span>
          </div>

          {/* User Info Card */}
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
                <p className="text-sm font-bold text-white truncate">{currentUser.name || 'Portal User'}</p>
                <p className="text-xs text-slate-400 truncate flex items-center gap-1">
                  <Mail className="w-3 h-3 text-sky-400 shrink-0" />
                  <span className="font-mono">{currentUser.email}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Status message */}
          <div className="bg-amber-950/40 border border-amber-500/30 rounded-2xl p-4 mb-5 text-xs space-y-2.5">
            <div className="flex items-center gap-2 text-amber-300 font-bold">
              <Clock className="w-4 h-4 shrink-0 text-amber-400 animate-spin" />
              <span>Kailangan ng Master Admin Verification</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              Ang inyong access request ay naipadala na sa <strong>Master Database Administrator</strong>.
            </p>
            <div className="p-2.5 bg-slate-900/90 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
              <span className="font-medium text-slate-300">Security Authority:</span>
              <span className="font-bold text-amber-400 font-mono">Master Administrator (Protected)</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Kapag na-verify at na-approve na ng Master Admin sa kanyang Gatekeeper dashboard, <strong>awtomatikong magbubukas</strong> ang database sa inyong screen nang hindi ninyo kailangang mag-refresh.
            </p>
          </div>

          {/* Optional reason / department note */}
          <div className="mb-5">
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Dahilan / Departamento para sa Database Access:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={requestReason}
                onChange={(e) => setRequestReason(e.target.value)}
                placeholder="Hal. Internal Audit / BIR 2303 Review"
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
              <button
                type="button"
                onClick={handleSendUpdatedReason}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-xl border border-slate-700 transition"
              >
                Ipadala
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
              <span>Suriin ang Status ng Verification</span>
            </button>

            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  authService.logout();
                  onUserAuthenticated(null as unknown as UserSession);
                }}
                className="flex-1 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4 text-slate-400" />
                <span>Mag-log in ng ibang Email</span>
              </button>

              <button
                type="button"
                onClick={handleQuickMasterLogin}
                className="py-2.5 px-4 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 shadow-md shadow-sky-600/20"
                title="Master Admin Direct Access"
              >
                <KeyRound className="w-4 h-4" />
                <span>Master Admin Mode</span>
              </button>
            </div>
          </div>

        </div>
      </div>
    );
  }

  // 2. Primary Log In & Access Gate
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-slate-100 relative overflow-hidden">
      
      {/* Background glowing gradients */}
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
            Corporate Client Compliance & File Database
          </p>
          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-[11px] text-slate-300">
            <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
            <span>Master Verification & Access Control</span>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex rounded-xl bg-slate-950 p-1 mb-5 border border-slate-800">
          <button
            type="button"
            onClick={() => {
              setAuthTab('email_login');
              setErrorMsg('');
              setInfoMsg('');
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${
              authTab === 'email_login'
                ? 'bg-sky-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Email Log In</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setAuthTab('master_pass');
              setErrorMsg('');
              setInfoMsg('');
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${
              authTab === 'master_pass'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Master Admin</span>
          </button>
        </div>

        {/* Error message */}
        {errorMsg && (
          <div className="mb-4 p-3 bg-rose-950/60 border border-rose-500/40 rounded-xl text-xs text-rose-300 flex items-center gap-2 animate-fade-in">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Informational message */}
        {infoMsg && (
          <div className="mb-4 p-3 bg-sky-950/70 border border-sky-500/40 rounded-xl text-xs text-sky-200 flex items-center gap-2 animate-fade-in">
            <Mail className="w-4 h-4 shrink-0 text-sky-400" />
            <span>{infoMsg}</span>
          </div>
        )}

        {/* TAB 1: Standard Direct Email Log In */}
        {authTab === 'email_login' && (
          <div className="space-y-4">
            <form onSubmit={handleEmailLoginSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Email Address <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="login-email-input"
                    type="email"
                    required
                    value={inputEmail}
                    onChange={(e) => setInputEmail(e.target.value)}
                    placeholder="Hal. humanresource.iengoc@gmail.com o staff@company.com"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Pangalan / Departamento (Optional)
                </label>
                <input
                  type="text"
                  value={inputName}
                  onChange={(e) => setInputName(e.target.value)}
                  placeholder="Hal. HR Department / Auditor"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Dahilan para sa Database Access (Optional)
                </label>
                <input
                  type="text"
                  value={requestReason}
                  onChange={(e) => setRequestReason(e.target.value)}
                  placeholder="Hal. Compliance & Contract Verification"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-400"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-400 hover:to-sky-500 active:from-sky-600 text-white font-extrabold text-xs sm:text-sm rounded-xl transition shadow-lg shadow-sky-500/20 flex items-center justify-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                <span>Log In & Open Database</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
              <button
                type="button"
                onClick={handleQuickMasterLogin}
                className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 transition"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Quick Master Owner Access</span>
              </button>

              <button
                type="button"
                onClick={handleFirebaseGoogleLogin}
                className="text-xs text-slate-400 hover:text-slate-200 transition flex items-center gap-1"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Google Sign-in</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: Master Administrator Access */}
        {authTab === 'master_pass' && (
          <div className="space-y-4">
            <div className="p-3.5 bg-amber-950/30 border border-amber-500/30 rounded-2xl text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-amber-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Master Administrator Verification</span>
                </span>
                <span className="text-[9px] bg-amber-500/20 text-amber-300 font-bold px-2 py-0.5 rounded-full border border-amber-500/30">
                  Protected
                </span>
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                Tanging ang authorized Master Owner lamang ang may access sa Gatekeeper controls at database verification. Nananatiling nakatago ang master email.
              </p>
            </div>

            <form onSubmit={handleMasterPasscodeSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Master Passcode o PIN
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showMasterPass ? 'text' : 'password'}
                    value={masterPasscode}
                    onChange={(e) => setMasterPasscode(e.target.value)}
                    placeholder="Ilagay ang Passcode (e.g. ien2026)"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-10 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowMasterPass(!showMasterPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showMasterPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-extrabold text-xs sm:text-sm rounded-xl transition shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Buksan ang Master Vault</span>
              </button>
            </form>

            <div className="pt-1">
              <button
                type="button"
                onClick={handleQuickMasterLogin}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold rounded-xl border border-slate-700 transition flex items-center justify-center gap-2"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>1-Click Owner Master Login</span>
              </button>
            </div>
          </div>
        )}

        {/* Security Footer Notice */}
        <div className="mt-6 pt-4 border-t border-slate-800 text-center">
          <p className="text-[10px] text-slate-500 leading-relaxed">
            Strict Database Verification Active &bull; Master Email is protected and masked under IEN Realty Inc. privacy protocols.
          </p>
        </div>

      </div>
    </div>
  );
};
