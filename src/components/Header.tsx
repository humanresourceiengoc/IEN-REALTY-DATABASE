import React, { useState } from 'react';
import { 
  Building2, 
  Bell, 
  Plus, 
  Search, 
  FileText, 
  ShieldCheck, 
  Calendar, 
  AlertTriangle, 
  Upload, 
  Image as ImageIcon, 
  CheckCircle2, 
  Volume2, 
  VolumeX, 
  Smartphone,
  ArrowLeft,
  Database,
  Lock,
  LogOut,
  UserCheck,
  ChevronDown,
  Sparkles,
  Cloud,
  RefreshCw,
  HelpCircle
} from 'lucide-react';
import { ClientProfile, DeadlineAlert, UserSession, CloudSyncState } from '../types';
import { formatDateDisplay } from '../utils/dateUtils';
import { notificationService } from '../utils/notificationService';
import { MASTER_GOOGLE_EMAIL } from '../utils/authService';

interface HeaderProps {
  clients: ClientProfile[];
  selectedClient: ClientProfile | null;
  currentView: 'directory' | 'client-detail';
  currentUser: UserSession | null;
  pendingRequestsCount: number;
  syncState?: CloudSyncState;
  onNavigateToDirectory: () => void;
  onNavigateToClientDetail: () => void;
  onSelectClient: (client: ClientProfile) => void;
  onOpenNewClientModal: () => void;
  onOpenAlertCenter: () => void;
  onOpenComplianceSummary: () => void;
  onOpenUploadModal: () => void;
  onOpenSecurityModal: () => void;
  onOpenSyncModal?: () => void;
  onOpenVerificationModal?: () => void;
  onLogout: () => void;
  onUpdateAppLogo: (logoUrl: string) => void;
  appLogo: string;
  alerts: DeadlineAlert[];
}

export const Header: React.FC<HeaderProps> = ({
  clients,
  selectedClient,
  currentView,
  currentUser,
  pendingRequestsCount,
  syncState,
  onNavigateToDirectory,
  onNavigateToClientDetail,
  onSelectClient,
  onOpenNewClientModal,
  onOpenAlertCenter,
  onOpenComplianceSummary,
  onOpenUploadModal,
  onOpenSecurityModal,
  onOpenSyncModal,
  onOpenVerificationModal,
  onLogout,
  onUpdateAppLogo,
  appLogo,
  alerts,
}) => {
  const [showLogoModal, setShowLogoModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [logoInput, setLogoInput] = useState(appLogo);
  const [searchQuery, setSearchQuery] = useState('');
  const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
    notificationService.getPermissionStatus()
  );

  const urgentAlertsCount = alerts.filter(
    (a) => a.severity === 'expired' || a.severity === 'urgent'
  ).length;

  const handleRequestPush = async () => {
    const perm = await notificationService.requestPermission();
    setNotificationPermission(perm);
    if (perm === 'granted') {
      notificationService.playAlertChime('info');
      notificationService.sendPushNotification('IEN REALTY INC. - Alert System Activated', {
        body: 'Push notifications are now enabled for upcoming compliance deadlines & contract maturities.',
      });
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        setLogoInput(result);
        onUpdateAppLogo(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveCustomLogo = () => {
    if (logoInput.trim()) {
      onUpdateAppLogo(logoInput.trim());
      setShowLogoModal(false);
    }
  };

  const filteredClients = clients.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      c.clientName.toLowerCase().includes(q) ||
      c.cifNo.toLowerCase().includes(q) ||
      (c.tin && c.tin.toLowerCase().includes(q))
    );
  });

  const isConnected = !syncState || syncState.status === 'synced' || syncState.status === 'syncing';

  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 shadow-xl">
      {/* Top Main Bar */}
      <div className="max-w-[1600px] mx-auto px-3 sm:px-4 lg:px-6">
        <div className="flex items-center justify-between h-16 gap-2 lg:gap-4">
          
          {/* Brand Logo & Master List Title */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            <div className="relative group cursor-pointer" onClick={() => setShowLogoModal(true)} title="Click to Change Company Logo">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-sky-500/20 via-slate-800 to-sky-900/30 border border-sky-500/40 p-1.5 flex items-center justify-center shadow-lg shadow-sky-500/10 group-hover:border-sky-400 transition-all overflow-hidden">
                {appLogo ? (
                  <img
                    src={appLogo}
                    alt="IEN Realty Inc."
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <Building2 className="w-6 h-6 text-sky-400 group-hover:scale-110 transition-transform" />
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 bg-slate-900 rounded-full p-0.5 border border-sky-500/50 shadow-xs group-hover:bg-sky-500 group-hover:text-white text-sky-400 transition">
                <ImageIcon className="w-2.5 h-2.5" />
              </div>
            </div>

            <div 
              onClick={onNavigateToDirectory}
              className="cursor-pointer group select-none"
              title="Return to IEN Realty Inc. Database Master List"
            >
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold tracking-wider text-sm sm:text-base bg-gradient-to-r from-sky-200 via-sky-300 to-white bg-clip-text text-transparent group-hover:opacity-90">
                    IEN REALTY INC.
                  </span>
                  <span className="hidden sm:inline-flex text-[9px] font-extrabold tracking-wider uppercase px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/40 items-center gap-1">
                    <Database className="w-2.5 h-2.5 text-sky-400" />
                    MASTER LIST
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-medium hidden md:block leading-tight">
                  Corporate Client Database & Compliance Management
                </p>
              </div>
            </div>
          </div>

          {/* Navigation View Switcher with Back Button */}
          <div className="flex items-center gap-1.5 shrink-0">
            {currentView === 'client-detail' && (
              <button
                onClick={onNavigateToDirectory}
                id="header-back-to-master-list"
                className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold shadow-md shadow-sky-500/20 flex items-center gap-1 transition active:scale-95 group"
                title="Go back to Database Master List"
              >
                <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                <span className="hidden sm:inline">Master List</span>
              </button>
            )}

            <div className="hidden lg:flex items-center bg-slate-800/90 p-0.5 rounded-xl border border-slate-700">
              <button
                onClick={onNavigateToDirectory}
                id="header-nav-all-clients"
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  currentView === 'directory'
                    ? 'bg-sky-500 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Master List ({clients.length})</span>
              </button>

              {selectedClient && (
                <button
                  onClick={onNavigateToClientDetail}
                  id="header-nav-client-files"
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                    currentView === 'client-detail'
                      ? 'bg-slate-700 text-sky-300 shadow-sm border border-slate-600'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span className="max-w-[110px] xl:max-w-[160px] truncate">{selectedClient.clientName}</span>
                </button>
              )}
            </div>
          </div>

          {/* Cloud: Firestore Real-Time Sync Status Pill */}
          <div className="hidden xl:flex items-center shrink-0">
            <button
              type="button"
              onClick={onOpenSyncModal}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border transition flex items-center gap-1.5 shadow-sm ${
                isConnected
                  ? 'bg-emerald-950/40 hover:bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                  : 'bg-rose-950/40 hover:bg-rose-950/60 border-rose-500/40 text-rose-300'
              }`}
              title="Click to view Cloud Firestore Real-Time Database Sync Center"
            >
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isConnected ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                <span className={`relative inline-flex rounded-full h-2 w-2 ${isConnected ? 'bg-emerald-500' : 'bg-rose-500'}`} />
              </span>
              <Cloud className="w-3.5 h-3.5 text-emerald-400" />
              <span>Cloud: Firestore Real-Time Sync</span>
            </button>
          </div>

          {/* Client Switcher & Search Bar */}
          <div className="flex-1 max-w-[180px] xl:max-w-xs relative hidden md:block">
            <div className="relative">
              <div 
                onClick={() => setIsClientDropdownOpen(!isClientDropdownOpen)}
                className="w-full bg-slate-800/90 border border-slate-700 hover:border-slate-600 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 cursor-pointer flex items-center justify-between transition focus:ring-2 focus:ring-sky-500/50"
              >
                <div className="flex items-center gap-1.5 truncate">
                  <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider">Client:</span>
                  <span className="font-medium truncate text-white max-w-[90px] xl:max-w-[130px]">
                    {selectedClient ? selectedClient.clientName : 'Select Client...'}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 shrink-0 bg-slate-700/60 px-1.5 py-0.5 rounded">
                  {selectedClient?.cifNo || `${clients.length}`}
                </span>
              </div>

              {/* Client Dropdown Panel */}
              {isClientDropdownOpen && (
                <div className="absolute left-0 right-0 top-full mt-1.5 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50 animate-fade-in text-slate-200">
                  <div className="p-2 border-b border-slate-800 bg-slate-950">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search Client Name, CIF, TIN..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        autoFocus
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-500"
                      />
                    </div>
                  </div>

                  <div className="max-h-64 overflow-y-auto divide-y divide-slate-800/60">
                    {filteredClients.length > 0 ? (
                      filteredClients.map((client) => (
                        <div
                          key={client.id}
                          onClick={() => {
                            onSelectClient(client);
                            setIsClientDropdownOpen(false);
                            setSearchQuery('');
                          }}
                          className={`p-2.5 hover:bg-slate-800 cursor-pointer flex items-center justify-between transition text-xs ${
                            selectedClient?.id === client.id ? 'bg-sky-500/10 border-l-2 border-sky-400' : ''
                          }`}
                        >
                          <div className="min-w-0 pr-2">
                            <p className="font-semibold text-white truncate">{client.clientName}</p>
                            <p className="text-[10px] text-slate-400 font-mono">CIF: {client.cifNo}</p>
                          </div>
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase shrink-0 bg-slate-800 text-slate-300">
                            {client.status}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-xs text-slate-400">
                        No clients found matching "{searchQuery}"
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions & Always-Visible Sign Out Button */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            
            {/* Insert File Button */}
            <button
              id="header-insert-file-btn"
              onClick={onOpenUploadModal}
              className="bg-sky-500 hover:bg-sky-400 active:bg-sky-600 text-white font-bold px-2 sm:px-2.5 lg:px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 transition shadow-sm shadow-sky-500/20 shrink-0"
              title="Insert PDF or Document File"
            >
              <Upload className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">Insert File</span>
            </button>

            {/* New Client Button */}
            <button
              id="header-new-client-btn"
              onClick={onOpenNewClientModal}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium px-2 sm:px-2.5 lg:px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 border border-slate-700 transition shrink-0"
              title="Add New Client Profile"
            >
              <Plus className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <span className="hidden md:inline">Add Client</span>
            </button>

            {/* Master Security Gatekeeper Button */}
            {currentUser?.isMaster && (
              <button
                id="header-gatekeeper-btn"
                onClick={onOpenSecurityModal}
                className="relative px-2 sm:px-2.5 lg:px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-amber-600/20 hover:from-amber-500/30 hover:to-amber-600/30 border border-amber-400/50 text-amber-300 text-xs font-bold transition flex items-center gap-1 shadow-sm shadow-amber-500/10 shrink-0"
                title="Open Master Gatekeeper & Access Verification Center"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="hidden sm:inline">Gatekeeper</span>
                {pendingRequestsCount > 0 && (
                  <span className="flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-rose-600 text-[9px] font-extrabold text-white animate-pulse">
                    {pendingRequestsCount}
                  </span>
                )}
              </button>
            )}

            {/* Notification & Deadline Alert Bell */}
            <button
              id="header-alert-bell-btn"
              onClick={onOpenAlertCenter}
              className="relative p-1.5 sm:p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition focus:outline-none focus:ring-2 focus:ring-sky-400 shrink-0"
              title="Deadline Alerts & Push Notifications"
            >
              <Bell className="w-4 h-4 text-sky-300 shrink-0" />
              {urgentAlertsCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-rose-600 text-[9px] font-bold text-white shadow-lg animate-pulse">
                  {urgentAlertsCount > 9 ? '9+' : urgentAlertsCount}
                </span>
              )}
            </button>

            {/* Google User Profile & Menu */}
            {currentUser && (
              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className={`flex items-center gap-1.5 p-1 pl-1.5 pr-2 rounded-xl border transition shadow-sm ${
                    currentUser.isMaster
                      ? 'bg-slate-800/95 hover:bg-slate-750 border-amber-400/50 text-slate-100 shadow-amber-500/10 ring-1 ring-amber-400/30'
                      : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
                  }`}
                  title={`Logged in as ${currentUser.email} (${currentUser.isMaster ? 'Master Super Admin' : 'Verified Staff'})`}
                >
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-[11px] overflow-hidden shrink-0 ${
                    currentUser.isMaster ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 ring-1 ring-amber-300/40 shadow-xs' : 'bg-sky-500 text-white'
                  }`}>
                    {currentUser.picture ? (
                      <img src={currentUser.picture} alt={currentUser.name} className="w-full h-full object-cover" />
                    ) : (
                      <span>{currentUser.isMaster ? '👑' : currentUser.email.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="text-left hidden 2xl:block max-w-[140px] min-w-0">
                    <p className="text-[10px] font-extrabold text-white truncate leading-tight">
                      {currentUser.isMaster ? 'Master Owner' : currentUser.name}
                    </p>
                    <p className="text-[9px] text-slate-300 font-mono truncate leading-tight" title={currentUser.email}>
                      {currentUser.email}
                    </p>
                  </div>
                  <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 top-full mt-2 w-80 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-4 z-50 text-slate-200 animate-fade-in divide-y divide-slate-800">
                    <div className="pb-3 mb-2">
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                          currentUser.isMaster ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40' : 'bg-sky-500/20 text-sky-300'
                        }`}>
                          {currentUser.isMaster ? '👑 MASTER SUPER ADMIN' : 'VERIFIED ACCESS'}
                        </span>
                        <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Google Verified</span>
                        </span>
                      </div>
                      <p className="text-xs font-bold text-white truncate">{currentUser.name}</p>
                      <p className="text-[11px] text-sky-300 font-mono truncate">{currentUser.email}</p>
                    </div>

                    <div className="space-y-1.5 pt-2.5">
                      {/* Account Verification Inspector */}
                      <button
                        type="button"
                        onClick={() => {
                          setShowUserMenu(false);
                          if (onOpenVerificationModal) onOpenVerificationModal();
                        }}
                        className="w-full px-3 py-2 text-xs text-left font-bold text-sky-300 hover:bg-slate-800 rounded-xl transition flex items-center justify-between border border-sky-500/20 bg-sky-950/20"
                      >
                        <span className="flex items-center gap-2">
                          <HelpCircle className="w-4 h-4 text-sky-400" />
                          <span>Account Verification Proof</span>
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">Inspect</span>
                      </button>

                      {/* Cloud Firestore Sync Center */}
                      <button
                        type="button"
                        onClick={() => {
                          setShowUserMenu(false);
                          if (onOpenSyncModal) onOpenSyncModal();
                        }}
                        className="w-full px-3 py-2 text-xs text-left font-bold text-emerald-300 hover:bg-slate-800 rounded-xl transition flex items-center justify-between border border-emerald-500/20 bg-emerald-950/20"
                      >
                        <span className="flex items-center gap-2">
                          <Cloud className="w-4 h-4 text-emerald-400" />
                          <span>Firestore Real-Time Sync</span>
                        </span>
                        <span className="text-[10px] text-emerald-400 font-mono">Live</span>
                      </button>

                      {currentUser.isMaster && (
                        <button
                          type="button"
                          onClick={() => {
                            setShowUserMenu(false);
                            onOpenSecurityModal();
                          }}
                          className="w-full px-3 py-2 text-xs text-left font-bold text-amber-300 hover:bg-slate-800 rounded-xl transition flex items-center justify-between border border-amber-500/20 bg-amber-950/20"
                        >
                          <span className="flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-amber-400" />
                            <span>Security Gatekeeper</span>
                          </span>
                          {pendingRequestsCount > 0 && (
                            <span className="bg-rose-600 text-white text-[10px] px-2 py-0.5 rounded-full font-extrabold">
                              {pendingRequestsCount} new
                            </span>
                          )}
                        </button>
                      )}

                      {/* Sign Out Button inside dropdown */}
                      <button
                        type="button"
                        id="user-menu-signout-btn"
                        onClick={() => {
                          setShowUserMenu(false);
                          onLogout();
                        }}
                        className="w-full px-3 py-2 text-xs text-left font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-xl transition flex items-center justify-between shadow-sm shadow-rose-600/30"
                      >
                        <span className="flex items-center gap-2">
                          <LogOut className="w-4 h-4 text-white" />
                          <span>Sign Out Account</span>
                        </span>
                        <span className="text-[10px] font-extrabold uppercase bg-rose-700/80 px-2 py-0.5 rounded text-white">Log Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Direct Always-Visible Header Sign Out Button */}
            {currentUser && (
              <button
                type="button"
                id="header-direct-signout-btn"
                onClick={onLogout}
                className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white text-xs font-extrabold transition flex items-center gap-1.5 shadow-md shadow-rose-600/30 shrink-0 border border-rose-500/50"
                title="Sign Out from IEN Realty Inc. Database"
              >
                <LogOut className="w-3.5 h-3.5 shrink-0" />
                <span className="inline">Sign Out</span>
              </button>
            )}

          </div>
        </div>
      </div>

      {/* Mobile Client Selector Bar */}
      <div className="md:hidden bg-slate-950 px-4 py-2 border-t border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2 truncate">
          <span className="text-[11px] font-semibold text-amber-400 uppercase">Client:</span>
          <select
            value={selectedClient?.id || ''}
            onChange={(e) => {
              const found = clients.find((c) => c.id === e.target.value);
              if (found) onSelectClient(found);
            }}
            className="bg-slate-900 border border-slate-700 text-xs text-white rounded-lg px-2 py-1 focus:outline-none focus:border-sky-500 max-w-[200px] truncate"
          >
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.clientName} ({c.cifNo})
              </option>
            ))}
          </select>
        </div>

        {/* Mobile Cloud sync pill */}
        <button
          type="button"
          onClick={onOpenSyncModal}
          className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-1 rounded-lg flex items-center gap-1 shrink-0"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Firestore Sync</span>
        </button>
      </div>

      {/* Change Logo Modal */}
      {showLogoModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-fade-in text-slate-100">
            <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-sky-400" />
              Customize Company Logo
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Upload an image from your computer or provide an image web URL for IEN REALTY INC.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Upload Image File:
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="w-full text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-sky-500 file:text-white hover:file:bg-sky-400 cursor-pointer bg-slate-950 p-1.5 rounded-xl border border-slate-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Or Image Web URL:
                </label>
                <input
                  type="url"
                  placeholder="https://example.com/logo.png"
                  value={logoInput}
                  onChange={(e) => setLogoInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-500"
                />
              </div>

              {logoInput && (
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center gap-3">
                  <div className="w-12 h-12 bg-slate-900 rounded-lg p-1 border border-slate-700 flex items-center justify-center overflow-hidden">
                    <img src={logoInput} alt="Preview" className="max-w-full max-h-full object-contain" />
                  </div>
                  <div className="text-xs">
                    <p className="font-bold text-white">Logo Preview</p>
                    <p className="text-[10px] text-emerald-400">Ready to update header & dossiers</p>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLogoModal(false)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveCustomLogo}
                  className="px-4 py-1.5 bg-sky-500 hover:bg-sky-400 text-white rounded-xl text-xs font-bold transition shadow-sm"
                >
                  Apply Logo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
