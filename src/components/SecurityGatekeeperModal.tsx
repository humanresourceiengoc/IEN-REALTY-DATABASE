import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Check, 
  X, 
  Trash2, 
  UserPlus, 
  Users, 
  Clock, 
  Lock, 
  Mail, 
  Building2, 
  AlertCircle,
  KeyRound,
  Shield,
  Search,
  CheckCircle2
} from 'lucide-react';
import { AccessRequest, UserRole, UserSession } from '../types';
import { authService, MASTER_GOOGLE_EMAIL } from '../utils/authService';

interface SecurityGatekeeperModalProps {
  currentUser: UserSession;
  onClose: () => void;
}

export const SecurityGatekeeperModal: React.FC<SecurityGatekeeperModalProps> = ({
  currentUser,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'add'>('pending');
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [approvedEmails, setApprovedEmails] = useState<string[]>([]);
  const [newEmailInput, setNewEmailInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  const loadData = () => {
    setRequests(authService.getAccessRequests());
    setApprovedEmails(authService.getApprovedEmails());
  };

  useEffect(() => {
    loadData();
  }, []);

  const pendingRequests = requests.filter((r) => r.status === 'pending');
  const historyRequests = requests.filter((r) => r.status !== 'pending');

  const handleApprove = (requestId: string, role: UserRole = 'approved_staff') => {
    authService.approveAccessRequest(requestId, role);
    loadData();
    setActionSuccess('Access request approved! User is now verified.');
    setTimeout(() => setActionSuccess(''), 3000);
  };

  const handleReject = (requestId: string) => {
    authService.rejectAccessRequest(requestId);
    loadData();
    setActionSuccess('Access request rejected.');
    setTimeout(() => setActionSuccess(''), 3000);
  };

  const handleDeleteRequest = (requestId: string) => {
    authService.deleteAccessRequest(requestId);
    loadData();
  };

  const handleAddEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmailInput || !newEmailInput.includes('@')) {
      alert('Please enter a valid email.');
      return;
    }
    authService.addApprovedEmail(newEmailInput);
    setNewEmailInput('');
    loadData();
    setActionSuccess(`Added "${newEmailInput}" to approved whitelist!`);
    setTimeout(() => setActionSuccess(''), 3000);
  };

  const handleRevokeEmail = (email: string) => {
    if (email.toLowerCase() === MASTER_GOOGLE_EMAIL.toLowerCase()) {
      alert('Cannot revoke access for the Master Owner.');
      return;
    }
    if (window.confirm(`Revoke verification access for "${email}"? They will no longer be able to open the portal.`)) {
      authService.removeApprovedEmail(email);
      loadData();
      setActionSuccess(`Access revoked for ${email}.`);
      setTimeout(() => setActionSuccess(''), 3000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl text-slate-100 max-h-[90vh] flex flex-col">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-white">
                  Master Gatekeeper & Verification Center
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  Master Owner Controls
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Master Account: <span className="text-sky-300 font-mono font-medium">{MASTER_GOOGLE_EMAIL}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 py-3 border-b border-slate-800 shrink-0">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'pending'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Pending Requests</span>
            {pendingRequests.length > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                activeTab === 'pending' ? 'bg-slate-950 text-amber-300' : 'bg-rose-600 text-white'
              }`}>
                {pendingRequests.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('approved')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'approved'
                ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Verified Accounts ({approvedEmails.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('add')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'add'
                ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Pre-Approve Email</span>
          </button>
        </div>

        {/* Action success alert */}
        {actionSuccess && (
          <div className="my-2 p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 flex items-center gap-2 animate-fade-in shrink-0">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto py-3 space-y-3">
          
          {/* TAB 1: PENDING REQUESTS */}
          {activeTab === 'pending' && (
            <div className="space-y-3">
              {pendingRequests.length > 0 ? (
                pendingRequests.map((req) => (
                  <div
                    key={req.id}
                    className="p-4 bg-slate-950 rounded-2xl border border-amber-500/30 space-y-3 hover:border-amber-500/50 transition"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={req.picture || `https://api.dicebear.com/7.x/initials/svg?seed=${req.email}`}
                          alt={req.name}
                          className="w-10 h-10 rounded-xl object-cover border border-slate-700"
                        />
                        <div>
                          <p className="text-xs font-bold text-white">{req.name}</p>
                          <p className="text-[11px] text-sky-400 font-mono">{req.email}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            Requested on: {new Date(req.requestedAt).toLocaleString()}
                          </p>
                        </div>
                      </div>

                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 shrink-0">
                        Awaiting Approval
                      </span>
                    </div>

                    {req.reason && (
                      <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 text-xs">
                        <span className="text-[10px] font-semibold uppercase text-slate-400 block mb-0.5">
                          Purpose / Dept Note:
                        </span>
                        <p className="text-slate-200">{req.reason}</p>
                      </div>
                    )}

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleReject(req.id)}
                        className="px-3 py-1.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/60 rounded-xl text-xs font-semibold transition flex items-center gap-1"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Decline</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleApprove(req.id, 'approved_staff')}
                        className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-1.5"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Approve & Verify Access</span>
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center bg-slate-950 rounded-2xl border border-slate-800 text-slate-400">
                  <ShieldCheck className="w-10 h-10 text-emerald-400 mx-auto mb-2 opacity-80" />
                  <p className="text-sm font-bold text-slate-200">No Pending Access Requests</p>
                  <p className="text-xs mt-1 text-slate-400">
                    All incoming access requests have been reviewed and verified.
                  </p>
                </div>
              )}

              {/* History / Previous reviews */}
              {historyRequests.length > 0 && (
                <div className="mt-6 pt-4 border-t border-slate-800">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Recent Verification Activity Log
                  </h4>
                  <div className="space-y-1.5">
                    {historyRequests.slice(0, 5).map((h) => (
                      <div
                        key={h.id}
                        className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800/80 flex items-center justify-between text-xs"
                      >
                        <div className="truncate pr-2">
                          <span className="font-semibold text-slate-200">{h.email}</span>
                          <span className="text-[11px] text-slate-400 ml-2">
                            &bull; {h.status === 'approved' ? 'Approved' : 'Declined'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            h.status === 'approved' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                          }`}>
                            {h.status.toUpperCase()}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDeleteRequest(h.id)}
                            className="text-slate-500 hover:text-rose-400 p-1"
                            title="Delete log"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: APPROVED ACCOUNTS */}
          {activeTab === 'approved' && (
            <div className="space-y-3">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter verified emails..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none w-full"
                />
              </div>

              <div className="space-y-2">
                {approvedEmails
                  .filter((email) => email.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((email) => {
                    const isMaster = email.toLowerCase() === MASTER_GOOGLE_EMAIL.toLowerCase();

                    return (
                      <div
                        key={email}
                        className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                            isMaster ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                          }`}>
                            {isMaster ? '👑' : email.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-white truncate flex items-center gap-1.5">
                              <span>{email}</span>
                              {isMaster && (
                                <span className="text-[10px] font-extrabold px-2 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                  Master Owner
                                </span>
                              )}
                            </p>
                            <p className="text-[11px] text-emerald-400 flex items-center gap-1 mt-0.5">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>{isMaster ? 'Full Root Vault Ownership' : 'Verified Staff Access'}</span>
                            </p>
                          </div>
                        </div>

                        {!isMaster && (
                          <button
                            type="button"
                            onClick={() => handleRevokeEmail(email)}
                            className="px-3 py-1.5 bg-rose-950/40 hover:bg-rose-600 hover:text-white text-rose-300 border border-rose-800/60 rounded-xl text-xs font-semibold transition shrink-0 flex items-center gap-1"
                            title="Revoke Verification"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Revoke</span>
                          </button>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* TAB 3: PRE-APPROVE EMAIL */}
          {activeTab === 'add' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                <h4 className="text-xs font-extrabold text-white flex items-center gap-1.5">
                  <UserPlus className="w-4 h-4 text-emerald-400" />
                  Pre-Authorize a Google Account
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Enter a Google email address to pre-approve their access. When this user logs in with this Google account, they will automatically bypass the pending gate and gain immediate entry.
                </p>

                <form onSubmit={handleAddEmail} className="space-y-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Google Email to Whitelist
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="colleague@gmail.com"
                      value={newEmailInput}
                      onChange={(e) => setNewEmailInput(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>Authorize & Whitelist Email</span>
                  </button>
                </form>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between shrink-0">
          <p className="text-[11px] text-slate-500">
            Protected under Master Key: <span className="text-slate-400">{MASTER_GOOGLE_EMAIL}</span>
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
