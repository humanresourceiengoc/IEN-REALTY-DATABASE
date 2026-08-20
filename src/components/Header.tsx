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
  Sparkles
} from 'lucide-react';
import { ClientProfile, DeadlineAlert, UserSession } from '../types';
import { formatDateDisplay } from '../utils/dateUtils';
import { notificationService } from '../utils/notificationService';
import { MASTER_GOOGLE_EMAIL } from '../utils/authService';

interface HeaderProps {
  clients: ClientProfile[];
  selectedClient: ClientProfile | null;
  currentView: 'directory' | 'client-detail';
  currentUser: UserSession | null;
  pendingRequestsCount: number;
  onNavigateToDirectory: () => void;
  onNavigateToClientDetail: () => void;
  onSelectClient: (client: ClientProfile) => void;
  onOpenNewClientModal: () => void;
  onOpenAlertCenter: () => void;
  onOpenComplianceSummary: () => void;
  onOpenUploadModal: () => void;
  onOpenSecurityModal: () => void;
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
  onNavigateToDirectory,
  onNavigateToClientDetail,
  onSelectClient,
  onOpenNewClientModal,
  onOpenAlertCenter,
  onOpenComplianceSummary,
  onOpenUploadModal,
  onOpenSecurityModal,
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
        setShowLogoModal(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const filteredClients = clients.filter(
    (c) =>
      c.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.cifNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.tin.includes(searchQuery)
  );

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30 shadow-md">
      {/* Top Brand Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo & Company Name */}
          <div className="flex items-center gap-3 shrink-0">
            <div 
              onClick={() => setShowLogoModal(true)}
              className="relative group cursor-pointer w-10 h-10 rounded-xl bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center text-white font-bold overflow-hidden shadow-sm border border-sky-300/30 transition hover:ring-2 hover:ring-sky-400"
              title="Click to customize IEN Realty logo"
            >
              {appLogo ? (
                <img src={appLogo} alt="IEN Realty Logo" className="w-full h-full object-cover" />
              ) : (
                <Building2 className="w-6 h-6 text-white" />
              )}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <ImageIcon className="w-4 h-4 text-white" />
              </div>
            </div>

            <div 
              onClick={onNavigateToDirectory}
              className="cursor-pointer group flex items-center gap-3"
              title="Return to IEN Realty Inc. Database Master List"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold tracking-wider text-base sm:text-lg bg-gradient-to-r from-sky-200 via-sky-300 to-white bg-clip-text text-transparent group-hover:opacity-90">
                    IEN REALTY INC.
                  </span>
                  <span className="text-[10px] font-extrabold tracking-wider uppercase px-2 py-0.5 rounded-md bg-sky-500/20 text-sky-300 border border-sky-500/40 flex items-center gap-1">
                    <Database className="w-3 h-3 text-sky-400" />
                    DATABASE MASTER LIST
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
                  Corporate Client Database & Compliance Management
                </p>
              </div>
            </div>
          </div>

          {/* Navigation View Switcher with prominent Back Button */}
          <div className="flex items-center gap-2">
            {currentView === 'client-detail' && (
              <button
                onClick={onNavigateToDirectory}
                id="header-back-to-master-list"
                className="px-3.5 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold shadow-md shadow-sky-500/20 flex items-center gap-1.5 transition active:scale-95 group"
                title="Go back to Database Master List"
              >
                <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                <span>Back to Master List</span>
              </button>
            )}

            <div className="hidden lg:flex items-center bg-slate-800/90 p-1 rounded-xl border border-slate-700">
              <button
                onClick={onNavigateToDirectory}
                id="header-nav-all-clients"
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
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
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                    currentView === 'client-detail'
                      ? 'bg-slate-700 text-sky-300 shadow-sm border border-slate-600'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span className="max-w-[150px] truncate">{selectedClient.clientName}</span>
                </button>
              )}
            </div>
          </div>

          {/* Client Switcher & Search Bar */}
          <div className="flex-1 max-w-sm relative hidden md:block">
            <div className="relative">
              <div 
                onClick={() => setIsClientDropdownOpen(!isClientDropdownOpen)}
                className="w-full bg-slate-800/90 border border-slate-700 hover:border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 cursor-pointer flex items-center justify-between transition focus:ring-2 focus:ring-sky-500/50"
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="text-xs font-bold text-sky-400 uppercase tracking-wider">Client:</span>
                  <span className="font-medium truncate text-white">
                    {selectedClient ? selectedClient.clientName : 'Select a Client...'}
                  </span>
                </div>
                <span className="text-xs text-slate-400 shrink-0 bg-slate-700/60 px-2 py-0.5 rounded">
                  {selectedClient?.cifNo || `${clients.length} Clients`}
                </span>
              </div>

              {isClientDropdownOpen && (
                <div className="absolute left-0 right-0 top-full mt-1.5 bg-slate-800 border border-slate-700 rounded-lg shadow-2xl z-50 overflow-hidden">
                  <div className="p-2 border-b border-slate-700 bg-slate-850">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search client name, CIF or TIN..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 pl-8 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-sky-500"
                        autoFocus
                      />
                    </div>
                  </div>
                  <div className="max-h-60 overflow-y-auto divide-y divide-slate-700/50">
                    {filteredClients.length > 0 ? (
                      filteredClients.map((c) => (
                        <div
                          key={c.id}
                          onClick={() => {
                            onSelectClient(c);
                            onNavigateToClientDetail();
                            setIsClientDropdownOpen(false);
                            setSearchQuery('');
                          }}
                          className={`p-3 hover:bg-slate-700/60 cursor-pointer transition flex items-center justify-between ${
                            selectedClient?.id === c.id ? 'bg-sky-950/40 border-l-2 border-sky-400' : ''
                          }`}
                        >
                          <div className="min-w-0 pr-2">
                            <p className="text-xs font-semibold text-slate-100 truncate">{c.clientName}</p>
                            <p className="text-[11px] text-slate-400 truncate">
                              CIF: <span className="text-slate-300">{c.cifNo}</span> &bull; TIN: {c.tin}
                            </p>
                          </div>
                          <span className={`text-[10px] px-2 py-0.5 rounded font-medium shrink-0 ${
                            c.status === 'Active' 
                              ? 'bg-emerald-500/20 text-emerald-300' 
                              : c.status === 'Pending Renewal'
                              ? 'bg-sky-500/20 text-sky-300'
                              : 'bg-slate-700 text-slate-300'
                          }`}>
                            {c.status}
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

          {/* Quick Actions & Notification Bell */}
          <div className="flex items-center gap-2.5">
            
            {/* Insert File Button */}
            <button
              id="header-insert-file-btn"
              onClick={onOpenUploadModal}
              className="bg-sky-500 hover:bg-sky-400 active:bg-sky-600 text-white font-bold px-3.5 py-1.5 rounded-xl text-xs sm:text-sm flex items-center gap-1.5 transition shadow-sm shadow-sky-500/20"
              title="Insert PDF or Document File"
            >
              <Upload className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Insert File</span>
              <span className="sm:hidden">Upload</span>
            </button>

            {/* New Client Button */}
            <button
              id="header-new-client-btn"
              onClick={onOpenNewClientModal}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium px-3 py-1.5 rounded-xl text-xs sm:text-sm flex items-center gap-1.5 border border-slate-700 transition"
              title="Add New Client Profile"
            >
              <Plus className="w-3.5 h-3.5 text-sky-400" />
              <span className="hidden lg:inline">Add Client</span>
            </button>

            {/* Export Summary Dossier */}
            <button
              id="header-export-dossier-btn"
              onClick={onOpenComplianceSummary}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium p-2 rounded-xl text-xs sm:text-sm flex items-center gap-1.5 border border-slate-700 transition"
              title="View & Print Compliance Dossier Summary"
            >
              <FileText className="w-4 h-4 text-slate-300" />
              <span className="hidden xl:inline">Dossier Sheet</span>
            </button>

            {/* Master Security Gatekeeper Button (Prominent for Master Owner) */}
            {currentUser?.isMaster && (
              <button
                id="header-gatekeeper-btn"
                onClick={onOpenSecurityModal}
                className="relative px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-amber-600/20 hover:from-amber-500/30 hover:to-amber-600/30 border border-amber-400/50 text-amber-300 text-xs font-bold transition flex items-center gap-1.5 shadow-sm shadow-amber-500/10"
                title="Open Master Gatekeeper & Access Verification Center"
              >
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span className="hidden xl:inline">Master Gatekeeper</span>
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
              className="relative p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition focus:outline-none focus:ring-2 focus:ring-sky-400"
              title="Deadline Alerts & Push Notifications"
            >
              <Bell className="w-4 h-4 text-sky-300" />
              {urgentAlertsCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white shadow-lg animate-pulse">
                  {urgentAlertsCount > 9 ? '9+' : urgentAlertsCount}
                </span>
              )}
            </button>

            {/* Google User Profile & Switcher */}
            {currentUser && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className={`flex items-center gap-2.5 p-1 pl-1.5 pr-3 rounded-2xl border transition shadow-sm ${
                    currentUser.isMaster
                      ? 'bg-slate-800/95 hover:bg-slate-750 border-amber-400/50 text-slate-100 shadow-amber-500/10 ring-1 ring-amber-400/30'
                      : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
                  }`}
                  title={`Logged in as ${currentUser.email} (${currentUser.isMaster ? 'Master Super Admin' : 'Verified Staff'})`}
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs overflow-hidden shrink-0 ${
                    currentUser.isMaster ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 ring-1 ring-amber-300/40 shadow-xs' : 'bg-sky-500 text-white'
                  }`}>
                    {currentUser.picture ? (
                      <img src={currentUser.picture} alt={currentUser.name} className="w-full h-full object-cover" />
                    ) : (
                      <span>{currentUser.isMaster ? '👑' : currentUser.email.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="text-left hidden md:block max-w-[130px] truncate">
                    <div className="flex items-center gap-1">
                      <p className="text-[11px] font-extrabold text-white truncate leading-tight">
                        {currentUser.isMaster ? 'Master Owner' : currentUser.name}
                      </p>
                      {currentUser.isMaster && (
                        <span className="text-[9px] bg-amber-400/20 text-amber-300 font-bold px-1 py-0.2 rounded border border-amber-400/30">
                          ROOT
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-300 font-mono truncate leading-tight mt-0.5">
                      {currentUser.email}
                    </p>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 top-full mt-2 w-72 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-3.5 z-50 text-slate-200 animate-fade-in divide-y divide-slate-800">
                    <div className="pb-3 mb-2">
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                          currentUser.isMaster ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40' : 'bg-sky-500/20 text-sky-300'
                        }`}>
                          {currentUser.isMaster ? '👑 MASTER SUPER ADMIN' : 'VERIFIED ACCESS'}
                        </span>
                        <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Active</span>
                        </span>
                      </div>
                      <p className="text-xs font-bold text-white truncate">{currentUser.name}</p>
                      <p className="text-[11px] text-sky-300 font-mono truncate">{currentUser.email}</p>
                    </div>

                    <div className="space-y-1.5 pt-2">
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
                            <span>Verification Requests</span>
                          </span>
                          {pendingRequestsCount > 0 && (
                            <span className="bg-rose-600 text-white text-[10px] px-2 py-0.5 rounded-full font-extrabold">
                              {pendingRequestsCount} new
                            </span>
                          )}
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setShowUserMenu(false);
                          onLogout();
                        }}
                        className="w-full px-3 py-2 text-xs text-left font-semibold text-rose-400 hover:bg-rose-950/40 rounded-xl transition flex items-center gap-2"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out / Switch Account</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Push notification fast enable */}
            {notificationPermission !== 'granted' && (
              <button
                onClick={handleRequestPush}
                className="hidden lg:flex items-center gap-1.5 bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/30 text-xs px-2.5 py-1.5 rounded-xl transition"
                title="Enable browser push notifications for deadline alerts"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Enable Push</span>
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
            className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white truncate max-w-[200px]"
          >
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.clientName} ({c.cifNo})
              </option>
            ))}
          </select>
        </div>
        {urgentAlertsCount > 0 && (
          <div 
            onClick={onOpenAlertCenter}
            className="flex items-center gap-1 text-[11px] font-semibold text-rose-400 bg-rose-950/60 border border-rose-800/60 px-2 py-0.5 rounded cursor-pointer"
          >
            <AlertTriangle className="w-3 h-3 text-rose-400" />
            <span>{urgentAlertsCount} Alert{urgentAlertsCount > 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      {/* Modal for Customizing App / Company Logo */}
      {showLogoModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl text-slate-100">
            <h3 className="text-lg font-bold text-sky-400 mb-1 flex items-center gap-2">
              <ImageIcon className="w-5 h-5" />
              Customize IEN Realty Inc. Logo
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Upload your company official logo or provide an image link. This will appear on all client compliance headers and exports.
            </p>

            <div className="space-y-4">
              {/* Preview */}
              <div className="flex items-center gap-4 p-3 bg-slate-950 rounded-xl border border-slate-800">
                <div className="w-16 h-16 rounded-xl bg-slate-800 flex items-center justify-center overflow-hidden border border-slate-700">
                  {logoInput ? (
                    <img src={logoInput} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <Building2 className="w-8 h-8 text-sky-400" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-slate-200">IEN REALTY INC.</p>
                  <p className="text-[11px] text-slate-400">Official Brand Mark</p>
                </div>
              </div>

              {/* Upload Local Image */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Upload Logo File (PNG, JPG, SVG)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="block w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-sky-500 file:text-white hover:file:bg-sky-400 cursor-pointer bg-slate-950 rounded-lg border border-slate-800"
                />
              </div>

              {/* Image URL option */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Or Paste Image URL
                </label>
                <input
                  type="url"
                  placeholder="https://example.com/logo.png"
                  value={logoInput}
                  onChange={(e) => setLogoInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-400"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 mt-6 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setLogoInput('');
                  onUpdateAppLogo('');
                  setShowLogoModal(false);
                }}
                className="text-xs text-rose-400 hover:text-rose-300 mr-auto"
              >
                Reset to Default
              </button>
              <button
                type="button"
                onClick={() => setShowLogoModal(false)}
                className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onUpdateAppLogo(logoInput);
                  setShowLogoModal(false);
                }}
                className="px-4 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs shadow-sm"
              >
                Save Logo
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
