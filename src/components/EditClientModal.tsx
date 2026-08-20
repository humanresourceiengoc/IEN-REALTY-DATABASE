import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  X, 
  Check, 
  Calendar, 
  MapPin, 
  User, 
  Phone, 
  Mail, 
  CreditCard, 
  ShieldCheck, 
  Image as ImageIcon,
  Clock,
  AlertCircle
} from 'lucide-react';
import { ClientProfile, ClientStatus } from '../types';
import { getTodayDateString, addYearsToDate } from '../utils/dateUtils';

interface EditClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  client?: ClientProfile | null;
  onSaveClient: (client: ClientProfile) => void;
}

export const EditClientModal: React.FC<EditClientModalProps> = ({
  isOpen,
  onClose,
  client,
  onSaveClient,
}) => {
  const [clientName, setClientName] = useState('');
  const [tradeName, setTradeName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [dateOfEngagement, setDateOfEngagement] = useState('');
  const [cifNo, setCifNo] = useState('');
  const [officeAddress, setOfficeAddress] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [tin, setTin] = useState('');
  const [ocnNumber, setOcnNumber] = useState('');
  const [atpOcn, setAtpOcn] = useState('');
  const [annualSubDate, setAnnualSubDate] = useState('');
  const [annualSubNotes, setAnnualSubNotes] = useState('');
  const [contractDate, setContractDate] = useState('');
  const [maturityDate, setMaturityDate] = useState('');
  const [status, setStatus] = useState<ClientStatus>('Active');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (client) {
      setClientName(client.clientName);
      setTradeName(client.tradeName || '');
      setLogoUrl(client.logoUrl || '');
      setDateOfEngagement(client.dateOfEngagement || getTodayDateString());
      setCifNo(client.cifNo || `IEN-CIF-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
      setOfficeAddress(client.officeAddress || '');
      setContactPerson(client.contactPerson || '');
      setContactNumber(client.contactNumber || '');
      setContactEmail(client.contactEmail || '');
      setTin(client.tin || '');
      setOcnNumber(client.ocnNumber || '');
      setAtpOcn(client.atpOcn || '');
      setAnnualSubDate(client.annualSubDate || '');
      setAnnualSubNotes(client.annualSubNotes || '');
      setContractDate(client.contractDate || getTodayDateString());
      setMaturityDate(client.maturityDate || addYearsToDate(1, getTodayDateString()));
      setStatus(client.status || 'Active');
      setNotes(client.notes || '');
    } else {
      const today = getTodayDateString();
      setClientName('');
      setTradeName('');
      setLogoUrl('');
      setDateOfEngagement(today);
      setCifNo(`IEN-CIF-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
      setOfficeAddress('');
      setContactPerson('');
      setContactNumber('');
      setContactEmail('');
      setTin('');
      setOcnNumber('');
      setAtpOcn('');
      setAnnualSubDate(addYearsToDate(1, today));
      setAnnualSubNotes('BIR Form 1702 Annual Income Tax & LGU Business Permit Renewal');
      setContractDate(today);
      setMaturityDate(addYearsToDate(1, today));
      setStatus('Active');
      setNotes('');
    }
    setErrorMsg('');
  }, [client, isOpen]);

  if (!isOpen) return null;

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setLogoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!clientName.trim()) {
      setErrorMsg('Client Name is required.');
      return;
    }

    if (!cifNo.trim()) {
      setErrorMsg('CIF No. is required.');
      return;
    }

    const savedClient: ClientProfile = {
      id: client ? client.id : `client_${Date.now()}_${Math.random().toString(36).substr(2, 7)}`,
      clientName: clientName.trim(),
      tradeName: tradeName.trim(),
      logoUrl: logoUrl.trim(),
      dateOfEngagement: dateOfEngagement || getTodayDateString(),
      cifNo: cifNo.trim(),
      officeAddress: officeAddress.trim(),
      contactPerson: contactPerson.trim(),
      contactNumber: contactNumber.trim(),
      contactEmail: contactEmail.trim(),
      tin: tin.trim(),
      ocnNumber: ocnNumber.trim(),
      atpOcn: atpOcn.trim(),
      annualSubDate: annualSubDate.trim(),
      annualSubNotes: annualSubNotes.trim(),
      contractDate: contractDate.trim(),
      maturityDate: maturityDate.trim(),
      status,
      notes: notes.trim(),
      customFolders: client?.customFolders || [],
      createdAt: client ? client.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSaveClient(savedClient);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl overflow-hidden border border-slate-200 my-6">
        
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-500 text-white flex items-center justify-center font-bold shadow-md shadow-sky-500/20">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-white">
                {client ? 'Edit Client Compliance Profile' : 'Add New Client Profile'}
              </h3>
              <p className="text-xs text-slate-400">
                IEN REALTY INC. &bull; Corporate Client Registry & Document Vault
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-7 space-y-6 text-xs max-h-[80vh] overflow-y-auto">
          
          {errorMsg && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center gap-2.5 font-semibold text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Section 1: Client Identity & Logo */}
          <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-sky-950 text-xs uppercase tracking-wider flex items-center gap-2">
                <Building2 className="w-4 h-4 text-sky-600" />
                <span>Client Identity & Corporate Branding</span>
              </h4>
              <span className="text-[11px] font-semibold text-slate-500">
                Master Database Record
              </span>
            </div>

            <div className="flex flex-col md:flex-row gap-5 items-start">
              {/* Logo Preview & Upload */}
              <div className="w-full md:w-44 shrink-0 flex flex-col items-center text-center p-3.5 bg-white rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-[11px] font-bold text-slate-700 mb-2">Client Logo</span>
                <div className="w-24 h-24 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden mb-2.5 relative group">
                  {logoUrl ? (
                    <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-400 gap-1">
                      <ImageIcon className="w-8 h-8 opacity-60" />
                      <span className="text-[9px] font-semibold">No Logo</span>
                    </div>
                  )}
                </div>
                <label className="cursor-pointer text-xs font-bold text-sky-700 hover:text-sky-800 bg-sky-50 hover:bg-sky-100 px-3 py-1.5 rounded-xl border border-sky-200 transition shadow-xs">
                  {logoUrl ? 'Change Logo' : 'Upload Logo'}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </label>
                {logoUrl && (
                  <button
                    type="button"
                    onClick={() => setLogoUrl('')}
                    className="text-[10px] text-rose-600 hover:underline mt-1.5 font-semibold"
                  >
                    Remove Logo
                  </button>
                )}
              </div>

              {/* Client Name, Trade Name, CIF & Status */}
              <div className="flex-1 w-full space-y-3.5">
                {/* Full Width Registered Name */}
                <div>
                  <label className="block font-bold text-slate-800 text-xs mb-1.5">
                    Client Name (Registered Corporate / Entity Name) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. SOLARIS PRIME COMMERCIAL TOWER HOLDINGS"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="w-full bg-white border border-slate-300 focus:border-sky-500 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-bold text-slate-900 focus:ring-2 focus:ring-sky-500/20 focus:outline-none shadow-xs transition"
                    required
                  />
                </div>

                {/* 3 Columns: Trade Name, CIF, Status */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-800 mb-1">
                      Trade Name / DBA (Business Name)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Solaris Commercial Plaza - BGC"
                      value={tradeName}
                      onChange={(e) => setTradeName(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 focus:outline-none shadow-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-800 mb-1">
                      CIF No. (Customer File No.) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="IEN-CIF-2024-8891"
                      value={cifNo}
                      onChange={(e) => setCifNo(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 focus:outline-none shadow-xs"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-800 mb-1">
                      Account Status
                    </label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as ClientStatus)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 focus:outline-none shadow-xs"
                    >
                      <option value="Active">Active</option>
                      <option value="Under Review">Under Review</option>
                      <option value="Pending Renewal">Pending Renewal</option>
                      <option value="Matured/Expired">Matured / Expired</option>
                      <option value="Dormant">Dormant</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Engagement, Contract & Maturity Dates (Drives Remaining Days) */}
          <div className="bg-sky-50/40 p-4 rounded-xl border border-sky-200 space-y-3">
            <h4 className="font-bold text-sky-950 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-sky-600" />
              Contract Dates & Maturity Countdown Tracker
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Date of Engagement
                </label>
                <input
                  type="date"
                  value={dateOfEngagement}
                  onChange={(e) => setDateOfEngagement(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Contract Date
                </label>
                <input
                  type="date"
                  value={contractDate}
                  onChange={(e) => setContractDate(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1 flex items-center justify-between">
                  <span>Maturity Date</span>
                  <span className="text-[10px] text-sky-700 font-semibold">Remaining Days Alert</span>
                </label>
                <input
                  type="date"
                  value={maturityDate}
                  onChange={(e) => setMaturityDate(e.target.value)}
                  className="w-full bg-white border border-sky-400 rounded-lg px-3 py-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            {/* Annual Submission Tracker */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-sky-200/60">
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Annual Submission (Annual Sub) Deadline
                </label>
                <input
                  type="date"
                  value={annualSubDate}
                  onChange={(e) => setAnnualSubDate(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Annual Sub Details / Requirements
                </label>
                <input
                  type="text"
                  placeholder="e.g. BIR Form 1702-RT, Audited Financials, LGU Permit"
                  value={annualSubNotes}
                  onChange={(e) => setAnnualSubNotes(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Tax & Registration Numbers (TIN, OCN, ATP OCN) */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Tax & Regulatory Registrations
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Registration TIN (Tax ID)
                </label>
                <input
                  type="text"
                  placeholder="000-000-000-000"
                  value={tin}
                  onChange={(e) => setTin(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  OCN Number (Official Confirmation)
                </label>
                <input
                  type="text"
                  placeholder="OCN-BIR-RR8-2026-..."
                  value={ocnNumber}
                  onChange={(e) => setOcnNumber(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  ATP OCN (Authority to Print)
                </label>
                <input
                  type="text"
                  placeholder="ATP-2026-098811-BIR"
                  value={atpOcn}
                  onChange={(e) => setAtpOcn(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Address & Contact Person */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-sky-600" />
              Office Address & Contact Information
            </h4>

            <div>
              <label className="block font-bold text-slate-800 mb-1">
                Office Address (Physical / Registered)
              </label>
              <textarea
                rows={2}
                placeholder="Unit, Building, Street, Barangay, City, Postal Code"
                value={officeAddress}
                onChange={(e) => setOfficeAddress(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Contact Person
                </label>
                <input
                  type="text"
                  placeholder="Atty. Rafael Gomez"
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Contact Number (Phone / Mobile)
                </label>
                <input
                  type="text"
                  placeholder="+63 (02) 8876-4321"
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Contact Email
                </label>
                <input
                  type="email"
                  placeholder="contact@company.ph"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-sky-500 hover:bg-sky-400 active:bg-sky-600 text-white transition shadow-sm flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{client ? 'Update Client Record' : 'Create Client Record'}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
