import React, { useState, useMemo } from 'react';
import { 
  Building2, 
  Search, 
  Plus, 
  FolderOpen, 
  FileText, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  Phone, 
  Mail, 
  MapPin, 
  ExternalLink, 
  ChevronRight, 
  ShieldCheck, 
  Filter, 
  FileCheck,
  Building,
  UserCheck,
  Edit3,
  Printer
} from 'lucide-react';
import { ClientProfile, DocumentItem, DeadlineAlert, ClientStatus } from '../types';
import { 
  calculateDaysRemaining, 
  formatDateDisplay, 
  formatRemainingDaysText, 
  getUrgencySeverity,
  getContractStatusDisplay
} from '../utils/dateUtils';

interface ClientDirectoryProps {
  clients: ClientProfile[];
  documents: DocumentItem[];
  alerts: DeadlineAlert[];
  onSelectClientAndDrillDown: (client: ClientProfile) => void;
  onOpenNewClientModal: () => void;
  onEditClient: (client: ClientProfile) => void;
  onOpenComplianceSummary: () => void;
  onOpenAlertCenter: () => void;
}

export const ClientDirectory: React.FC<ClientDirectoryProps> = ({
  clients,
  documents,
  alerts,
  onSelectClientAndDrillDown,
  onOpenNewClientModal,
  onEditClient,
  onOpenComplianceSummary,
  onOpenAlertCenter,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ClientStatus>('all');

  // Stats calculation
  const totalClients = clients.length;
  const totalDocs = documents.length;
  const activeCount = clients.filter(c => c.status === 'Active').length;
  const urgentCount = alerts.filter(a => a.severity === 'urgent' || a.severity === 'expired').length;

  // Filtered clients list
  const filteredClients = useMemo(() => {
    return clients.filter((client) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = 
        !q ||
        client.clientName.toLowerCase().includes(q) ||
        (client.codeName && client.codeName.toLowerCase().includes(q)) ||
        (client.tradeName && client.tradeName.toLowerCase().includes(q)) ||
        (client.cifNo && client.cifNo.toLowerCase().includes(q)) ||
        (client.tin && client.tin.toLowerCase().includes(q)) ||
        (client.registrationType && client.registrationType.toLowerCase().includes(q)) ||
        (client.serviceCategory && client.serviceCategory.toLowerCase().includes(q)) ||
        (client.contactPerson && client.contactPerson.toLowerCase().includes(q)) ||
        (client.officeAddress && client.officeAddress.toLowerCase().includes(q));

      const matchesStatus = statusFilter === 'all' || client.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [clients, searchQuery, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome Matrix */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700/80 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-gradient-to-l from-sky-500/10 to-transparent pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-sky-500/20 text-sky-300 border border-sky-500/40 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" />
                OFFICIAL DATABASE
              </span>
              <span className="text-xs text-slate-400">Corporate Compliance & Document Filing System</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white">
              IEN REALTY INC. DATABASE MASTER LIST
            </h1>
            <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
              Complete corporate client master list. Click <strong className="text-sky-300 font-bold">"Open Files & Folders"</strong> to manage 01–08 compliance folders, preview PDF attachments, track tax identifiers (TIN/OCN/ATP), and monitor maturity deadlines.
            </p>
          </div>

          {/* Quick Action Button */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={onOpenNewClientModal}
              id="btn-add-client-directory"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-sky-500 hover:bg-sky-400 active:bg-sky-600 text-white font-bold text-sm shadow-lg shadow-sky-500/20 hover:shadow-sky-500/30 transition active:scale-95"
            >
              <Plus className="w-5 h-5 stroke-[2.5]" />
              Add New Client
            </button>
            <button
              onClick={onOpenComplianceSummary}
              className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-600 font-semibold text-sm transition"
            >
              <Printer className="w-4 h-4 text-sky-400" />
              Print Audit Matrix
            </button>
          </div>
        </div>

        {/* 4 Stat Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-700/60">
          <div className="bg-slate-800/60 rounded-2xl p-4 border border-slate-700/50">
            <p className="text-xs font-medium text-slate-400">Total Clients</p>
            <p className="text-2xl font-black text-white mt-1">{totalClients}</p>
            <span className="text-[11px] text-slate-400">Corporate accounts</span>
          </div>

          <div className="bg-slate-800/60 rounded-2xl p-4 border border-slate-700/50">
            <p className="text-xs font-medium text-slate-400">Total Documents</p>
            <p className="text-2xl font-black text-sky-400 mt-1">{totalDocs}</p>
            <span className="text-[11px] text-slate-400">Archived compliance files</span>
          </div>

          <div className="bg-slate-800/60 rounded-2xl p-4 border border-slate-700/50">
            <p className="text-xs font-medium text-slate-400">Active Contracts</p>
            <p className="text-2xl font-black text-emerald-400 mt-1">{activeCount}</p>
            <span className="text-[11px] text-slate-400">Active status</span>
          </div>

          <div 
            onClick={onOpenAlertCenter}
            className="bg-slate-800/60 rounded-2xl p-4 border border-slate-700/50 cursor-pointer hover:border-sky-500/60 transition group"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-slate-400">Deadline Alerts</p>
              {urgentCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              )}
            </div>
            <p className="text-2xl font-black text-rose-400 mt-1 flex items-center gap-1.5">
              {urgentCount}
              <AlertTriangle className="w-4 h-4 text-rose-400 group-hover:scale-110 transition" />
            </p>
            <span className="text-[11px] text-slate-400">Urgent / Expiring soon</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar Controls */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full md:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Client Name, CIF, TIN, Contact, Address..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 hover:text-slate-600 bg-slate-200/80 px-1.5 py-0.5 rounded"
            >
              Clear
            </button>
          )}
        </div>

        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          {(['all', 'Active', 'Active Renewal', 'Expired', 'Terminated'] as const).map((status) => {
            const isActive = statusFilter === status;
            const count = status === 'all' 
              ? clients.length 
              : clients.filter(c => c.status === status).length;

            return (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-sky-500 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                <span>{status === 'all' ? 'All Clients' : status}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  isActive ? 'bg-white text-sky-700' : 'bg-slate-200 text-slate-700'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid of Client Cards */}
      {filteredClients.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center shadow-sm">
          <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
            <Building2 className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No Clients Matching Filter</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
            {statusFilter !== 'all' 
              ? `There are currently no clients under the "${statusFilter}" status tab.`
              : `No corporate records matching "${searchQuery}".`}
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => {
                setStatusFilter('all');
                setSearchQuery('');
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition"
            >
              <FolderOpen className="w-4 h-4 text-sky-400" />
              Show All Clients ({clients.length})
            </button>
            <button
              onClick={onOpenNewClientModal}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs transition shadow-sm"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              Add New Client
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filteredClients.map((client) => {
            const clientDocs = documents.filter((d) => d.clientId === client.id);
            const daysRemaining = calculateDaysRemaining(client.maturityDate);
            const urgency = getUrgencySeverity(daysRemaining);
            const remainingText = formatRemainingDaysText(daysRemaining);

            const urgencyBadgeClasses = 
              urgency === 'expired' 
                ? 'bg-rose-100 text-rose-800 border-rose-300' 
                : urgency === 'urgent'
                ? 'bg-rose-50 text-rose-700 border-rose-200'
                : urgency === 'warning'
                ? 'bg-sky-50 text-sky-700 border-sky-200'
                : urgency === 'notice'
                ? 'bg-sky-50 text-sky-700 border-sky-200'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200';

            const statusBadgeClasses = 
              client.status === 'Active'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : client.status === 'Active Renewal'
                ? 'bg-amber-50 text-amber-800 border-amber-300'
                : client.status === 'Expired'
                ? 'bg-rose-50 text-rose-700 border-rose-200'
                : 'bg-slate-100 text-slate-700 border-slate-300';

            return (
              <div
                key={client.id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group hover:border-sky-400/80"
              >
                {/* Client Card Header */}
                <div className="p-5 sm:p-6 pb-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-600 to-sky-800 text-white flex items-center justify-center shrink-0 font-black text-lg shadow-sm border border-sky-400/30">
                        {client.clientName.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug group-hover:text-sky-600 transition">
                          {client.clientName}
                        </h3>
                        <p className="text-xs font-semibold text-slate-500 mt-0.5">
                          DBA: {client.tradeName || 'Standard Commercial'}
                        </p>

                        {/* Registration Type & Service Category Badges */}
                        <div className="flex flex-wrap items-center gap-1.5 mt-2">
                          {client.codeName && (
                            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                              CODE: {client.codeName}
                            </span>
                          )}
                          {client.registrationType && (
                            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1">
                              <Building className="w-2.5 h-2.5" />
                              {client.registrationType}
                            </span>
                          )}
                          {client.serviceCategory && (
                            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                              <ShieldCheck className="w-2.5 h-2.5" />
                              {client.serviceCategory}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold shrink-0 border ${statusBadgeClasses}`}>
                      {client.status}
                    </span>
                  </div>

                  {/* CIF, TIN, and Contract Details Strip */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mt-4 pt-4 border-t border-slate-100 text-xs">
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">CIF Number</span>
                      <span className="font-mono font-bold text-slate-800 truncate block mt-0.5">{client.cifNo || 'N/A'}</span>
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">TIN / Tax ID</span>
                      <span className="font-mono font-semibold text-slate-800 truncate block mt-0.5">{client.tin || 'N/A'}</span>
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 col-span-2 sm:col-span-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Contract Maturity</span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border truncate ${urgencyBadgeClasses}`}>
                          {remainingText}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Address & Contact Person */}
                  <div className="mt-3.5 space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span className="line-clamp-1 text-slate-600">{client.officeAddress}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <UserCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-medium text-slate-700">{client.contactPerson}</span>
                      <span className="text-slate-300">•</span>
                      <span className="text-slate-500">{client.contactNumber}</span>
                    </div>
                  </div>
                </div>

                {/* Card Footer with Total Files & Primary "DRILL DOWN INSIDE" Action */}
                <div className="bg-slate-50 px-5 sm:px-6 py-3.5 border-t border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-sky-100 text-sky-800 border border-sky-200 text-xs font-bold">
                      <FolderOpen className="w-3.5 h-3.5 text-sky-600" />
                      <span>{clientDocs.length} Compliance Files</span>
                    </div>
                    <span className="text-xs text-slate-500">Folders 01-08</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onEditClient(client)}
                      title="Edit Client Information"
                      className="p-2 rounded-xl bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 text-xs font-semibold transition"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    {/* MAIN DRILL DOWN BUTTON */}
                    <button
                      onClick={() => onSelectClientAndDrillDown(client)}
                      id={`btn-open-client-files-${client.id}`}
                      className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 active:bg-sky-600 text-white font-bold text-xs sm:text-sm shadow-sm transition-all duration-150 active:scale-95 group/btn"
                    >
                      <FolderOpen className="w-4 h-4 text-white" />
                      <span>Open Files & Folders</span>
                      <ChevronRight className="w-4 h-4 stroke-[2.5] group-hover/btn:translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
