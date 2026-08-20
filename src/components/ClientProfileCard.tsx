import React, { useState } from 'react';
import { 
  Building, 
  MapPin, 
  Phone, 
  Mail, 
  Calendar, 
  FileCheck2, 
  Clock, 
  AlertCircle, 
  Edit3, 
  Copy, 
  Check, 
  CreditCard, 
  ShieldCheck, 
  Hash,
  Upload,
  FileText,
  UserCheck,
  Building2,
  CalendarCheck,
  AlertTriangle
} from 'lucide-react';
import { ClientProfile } from '../types';
import { calculateDaysRemaining, formatDateDisplay, formatRemainingDaysText, getUrgencySeverity } from '../utils/dateUtils';

interface ClientProfileCardProps {
  client: ClientProfile;
  onEditClient: () => void;
  onQuickUpdateName: (newName: string) => void;
  onOpenUploadModal: () => void;
  onOpenComplianceSummary: () => void;
}

export const ClientProfileCard: React.FC<ClientProfileCardProps> = ({
  client,
  onEditClient,
  onQuickUpdateName,
  onOpenUploadModal,
  onOpenComplianceSummary,
}) => {
  const [isEditingNameInline, setIsEditingNameInline] = useState(false);
  const [inlineName, setInlineName] = useState(client.clientName);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const daysRemaining = calculateDaysRemaining(client.maturityDate);
  const urgency = getUrgencySeverity(daysRemaining);
  const annualDaysRemaining = calculateDaysRemaining(client.annualSubDate);

  const handleSaveInlineName = () => {
    if (inlineName.trim()) {
      onQuickUpdateName(inlineName.trim());
      setIsEditingNameInline(false);
    }
  };

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Remaining days progress calculation (assuming 1 to 3 year contracts)
  const getProgressPercentage = () => {
    if (daysRemaining === null) return 100;
    if (daysRemaining <= 0) return 0;
    // Cap at 365 days base for visual scale
    const percentage = Math.min(100, Math.max(5, (daysRemaining / 365) * 100));
    return percentage;
  };

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'Active Renewal':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'Expired':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      case 'Terminated':
        return 'bg-slate-700/60 text-slate-300 border-slate-600';
      default:
        return 'bg-slate-500/20 text-slate-300 border-slate-500/40';
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-6 transition">
      
      {/* Top Banner / Client Title */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 text-white p-5 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          
          {/* Left: Client Logo & Name Section */}
          <div className="flex items-start gap-4 flex-1">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-slate-800 border-2 border-sky-400/40 p-1 flex items-center justify-center overflow-hidden shrink-0 shadow-md">
              {client.logoUrl ? (
                <img src={client.logoUrl} alt={client.clientName} className="w-full h-full object-cover rounded-xl" />
              ) : (
                <Building2 className="w-8 h-8 text-sky-400" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-sky-300 bg-sky-950/80 px-2.5 py-0.5 rounded-md border border-sky-700/50">
                  CIF: {client.cifNo}
                </span>
                <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-md border ${getStatusBadgeStyle(client.status)}`}>
                  {client.status}
                </span>

                {/* Business Registration Type Badge */}
                {client.registrationType && (
                  <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-md bg-indigo-500/20 text-indigo-200 border border-indigo-500/40 flex items-center gap-1">
                    <Building className="w-3 h-3 text-indigo-400" />
                    <span>{client.registrationType}</span>
                  </span>
                )}

                {/* Service Category Badge */}
                {client.serviceCategory && (
                  <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-md bg-amber-500/20 text-amber-200 border border-amber-500/40 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-amber-400" />
                    <span>{client.serviceCategory}</span>
                  </span>
                )}

                {daysRemaining !== null && daysRemaining <= 30 && (
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    {daysRemaining < 0 ? 'MATURED / EXPIRED' : 'MATURITY APPROACHING'}
                  </span>
                )}
              </div>

              {/* Editable Client Name */}
              {isEditingNameInline ? (
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="text"
                    value={inlineName}
                    onChange={(e) => setInlineName(e.target.value)}
                    className="bg-slate-800 border border-sky-400 text-white font-bold text-lg sm:text-xl rounded-lg px-2.5 py-1 w-full focus:outline-none ring-2 ring-sky-400/30"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveInlineName();
                      if (e.key === 'Escape') setIsEditingNameInline(false);
                    }}
                  />
                  <button
                    onClick={handleSaveInlineName}
                    className="px-3.5 py-1.5 bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs rounded-lg transition"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setInlineName(client.clientName);
                      setIsEditingNameInline(false);
                    }}
                    className="px-2.5 py-1.5 text-slate-400 hover:text-white text-xs"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 group">
                  <h1 className="text-lg sm:text-2xl font-extrabold text-white tracking-tight leading-snug">
                    {client.clientName}
                  </h1>
                  <button
                    onClick={() => {
                      setInlineName(client.clientName);
                      setIsEditingNameInline(true);
                    }}
                    className="opacity-60 group-hover:opacity-100 p-1 text-sky-400 hover:text-sky-300 hover:bg-slate-800 rounded-lg transition"
                    title="Click to edit client name"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Trade Name */}
              {client.tradeName && (
                <p className="text-xs sm:text-sm text-slate-300 font-medium mt-0.5 flex items-center gap-1.5">
                  <span className="text-slate-400">Trade Name:</span>
                  <span className="text-sky-200 font-semibold">{client.tradeName}</span>
                </p>
              )}
            </div>
          </div>

          {/* Right: Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={onEditClient}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium px-3.5 py-2 rounded-xl text-xs sm:text-sm flex items-center gap-1.5 transition shadow-sm"
              title="Edit Full Client Profile & Registration Numbers"
            >
              <Edit3 className="w-4 h-4 text-sky-400" />
              <span>Edit Details</span>
            </button>
            
            <button
              onClick={onOpenUploadModal}
              className="bg-sky-500 hover:bg-sky-400 active:bg-sky-600 text-white font-bold px-3.5 py-2 rounded-xl text-xs sm:text-sm flex items-center gap-1.5 transition shadow-sm shadow-sky-500/20"
              title="Upload New PDF or Document into Folders"
            >
              <Upload className="w-4 h-4" />
              <span>Insert File</span>
            </button>

            <button
              onClick={onOpenComplianceSummary}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium px-3 py-2 rounded-xl text-xs sm:text-sm flex items-center gap-1.5 transition"
              title="Audit Dossier Sheet"
            >
              <FileText className="w-4 h-4 text-slate-300" />
              <span className="hidden sm:inline">Dossier</span>
            </button>
          </div>
        </div>

        {/* Contract Maturity & Days Remaining Live Gauge */}
        <div className="mt-5 pt-4 border-t border-slate-800 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          
          {/* Contract Date vs Maturity Date */}
          <div className="md:col-span-4 flex items-center gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <Calendar className="w-8 h-8 text-sky-400 shrink-0" />
            <div>
              <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                Engagement & Contract Period
              </p>
              <p className="text-xs font-bold text-slate-200">
                {formatDateDisplay(client.contractDate)} &rarr;{' '}
                <span className={daysRemaining !== null && daysRemaining <= 30 ? 'text-rose-400' : 'text-sky-300'}>
                  {formatDateDisplay(client.maturityDate)}
                </span>
              </p>
              <p className="text-[10px] text-slate-400">
                Engaged: {formatDateDisplay(client.dateOfEngagement)}
              </p>
            </div>
          </div>

          {/* Maturity Countdown Badge & Progress */}
          <div className="md:col-span-5 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-sky-400" />
                <span className="text-[11px] uppercase tracking-wider text-slate-300 font-semibold">
                  Maturity Countdown:
                </span>
              </div>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                urgency === 'expired'
                  ? 'bg-rose-600 text-white animate-pulse'
                  : urgency === 'urgent'
                  ? 'bg-rose-500/30 text-rose-300 border border-rose-500/50'
                  : urgency === 'warning'
                  ? 'bg-sky-500/30 text-sky-300 border border-sky-500/50'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              }`}>
                {formatRemainingDaysText(daysRemaining)}
              </span>
            </div>

            {/* Visual Progress Bar */}
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  urgency === 'expired'
                    ? 'bg-rose-600 w-full'
                    : urgency === 'urgent'
                    ? 'bg-rose-500'
                    : urgency === 'warning'
                    ? 'bg-sky-500'
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${urgency === 'expired' ? 100 : getProgressPercentage()}%` }}
              />
            </div>
          </div>

          {/* Annual Submission Tracker */}
          <div className="md:col-span-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1">
              <CalendarCheck className="w-3.5 h-3.5 text-sky-400" />
              Annual Sub Due:
            </p>
            <p className="text-xs font-bold text-slate-200 mt-0.5">
              {formatDateDisplay(client.annualSubDate)}
            </p>
            <p className="text-[10px] text-slate-400 truncate" title={client.annualSubNotes}>
              {client.annualSubNotes || 'Annual BIR / LGU compliance'}
            </p>
          </div>
        </div>
      </div>

      {/* Corporate Registration & Contact Grid */}
      <div className="p-5 sm:p-6 bg-slate-50 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
        
        {/* Box 1: Office Address */}
        <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="font-bold uppercase tracking-wider text-[10px] flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" /> Office Address
              </span>
              <button
                onClick={() => copyToClipboard(client.officeAddress, 'address')}
                className="text-slate-400 hover:text-slate-600 p-0.5"
                title="Copy Address"
              >
                {copiedField === 'address' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
            <p className="text-slate-800 font-medium leading-relaxed">
              {client.officeAddress || 'No office address recorded.'}
            </p>
          </div>
        </div>

        {/* Box 2: Contact Person & Info */}
        <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="font-bold uppercase tracking-wider text-[10px] flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5 text-slate-400" /> Contact Details
              </span>
            </div>
            <p className="text-slate-900 font-bold mb-1">{client.contactPerson || 'N/A'}</p>
            <div className="space-y-1 text-slate-600">
              <p className="flex items-center gap-1.5 truncate">
                <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                <span>{client.contactNumber || 'No phone'}</span>
              </p>
              <p className="flex items-center gap-1.5 min-w-0">
                <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                <span className="text-sky-700 hover:underline break-all truncate font-medium" title={client.contactEmail}>
                  {client.contactEmail || 'No email'}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Box 3: TIN & BIR Registration */}
        <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="font-bold uppercase tracking-wider text-[10px] flex items-center gap-1">
                <CreditCard className="w-3.5 h-3.5 text-slate-400" /> Tax Identification (TIN)
              </span>
              <button
                onClick={() => copyToClipboard(client.tin, 'tin')}
                className="text-slate-400 hover:text-slate-600 p-0.5"
                title="Copy TIN"
              >
                {copiedField === 'tin' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
            <p className="text-slate-900 font-bold text-sm tracking-wide font-mono">
              {client.tin || 'N/A'}
            </p>
            <p className="text-[10px] text-slate-500 mt-1">
              Registered BIR TIN on Certificate Form 2303
            </p>
          </div>
        </div>

        {/* Box 4: OCN & ATP OCN */}
        <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="font-bold uppercase tracking-wider text-[10px] flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-slate-400" /> OCN & ATP Numbers
              </span>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-500 font-medium">OCN No.:</span>
                <span className="font-mono font-bold text-slate-800 text-[11px] truncate max-w-[130px]" title={client.ocnNumber}>
                  {client.ocnNumber || 'N/A'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-500 font-medium">ATP OCN:</span>
                <span className="font-mono font-bold text-slate-800 text-[11px] truncate max-w-[130px]" title={client.atpOcn}>
                  {client.atpOcn || 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
