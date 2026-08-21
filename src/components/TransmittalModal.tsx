import React, { useState, useEffect } from 'react';
import {
  Send,
  RotateCcw,
  CheckCircle2,
  FileText,
  Printer,
  X,
  Calendar,
  Building2,
  User,
  Truck,
  Hash,
  Clock,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  Archive,
  ArrowRight,
  PlusCircle,
  History,
  FileCheck
} from 'lucide-react';
import { DocumentItem, ClientProfile, TransmittalInfo, TransmittalStatus, TransmittalMovement } from '../types';
import { formatDateDisplay, getTodayDateString } from '../utils/dateUtils';
import { TRANSMITTAL_STATUS_CONFIG, generateTransmittalNumber } from '../utils/transmittalUtils';

interface TransmittalModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: DocumentItem | null;
  client: ClientProfile | null;
  appLogo?: string;
  onSaveTransmittal: (docId: string, updatedTransmittal: TransmittalInfo) => void;
}

const COMMON_RECIPIENTS = [
  'BIR RDO 044 (Taguig / Pateros)',
  'BIR RDO 043 (Pasig City)',
  'BIR RDO 050 (South Makati)',
  'Taguig City Hall - Business Permits & Licensing (BPLO)',
  'Makati City Hall - Licensing & Treasury',
  'Pasig City Hall - Business Permits Office',
  'Securities & Exchange Commission (SEC)',
  'Registry of Deeds (RD)',
  'Notary Public / Legal Counsel',
  'Bank / Financing Institution',
  'Client Corporate Office (Authorized Signatory)',
];

const COMMON_PURPOSES = [
  'For Annual Business Permit renewal & inspection assessment',
  'For BIR official receiving stamp & tax compliance clearance',
  'For notarization, dry seal, and consular authentication',
  'For SEC GIS submission and board resolution attachment',
  'For title deed verification & certified true copy issuance',
  'Original document return to client custody',
  'For lease agreement signing & witness execution',
];

export const TransmittalModal: React.FC<TransmittalModalProps> = ({
  isOpen,
  onClose,
  document: doc,
  client,
  appLogo,
  onSaveTransmittal,
}) => {
  const [activeTab, setActiveTab] = useState<'status_form' | 'printable_slip' | 'history'>('status_form');
  
  const [status, setStatus] = useState<TransmittalStatus>('in_custody');
  const [transmittalNo, setTransmittalNo] = useState('');
  const [transmittedTo, setTransmittedTo] = useState('');
  const [transmittedDate, setTransmittedDate] = useState('');
  const [carrierOrMessenger, setCarrierOrMessenger] = useState('');
  const [receivedBy, setReceivedBy] = useState('');
  const [returnedDate, setReturnedDate] = useState('');
  const [purpose, setPurpose] = useState('');
  const [remarks, setRemarks] = useState('');
  const [movementHistory, setMovementHistory] = useState<TransmittalMovement[]>([]);

  useEffect(() => {
    if (doc) {
      const trans = doc.transmittal;
      if (trans) {
        setStatus(trans.status || 'in_custody');
        setTransmittalNo(trans.currentTransmittalNo || generateTransmittalNumber());
        setTransmittedTo(trans.transmittedTo || '');
        setTransmittedDate(trans.transmittedDate || '');
        setCarrierOrMessenger(trans.carrierOrMessenger || '');
        setReceivedBy(trans.receivedBy || '');
        setReturnedDate(trans.returnedDate || '');
        setPurpose(trans.purpose || '');
        setRemarks(trans.remarks || '');
        setMovementHistory(trans.history || []);
      } else {
        setStatus('in_custody');
        setTransmittalNo(generateTransmittalNumber());
        setTransmittedTo('');
        setTransmittedDate('');
        setCarrierOrMessenger('IEN Realty Liaison Officer');
        setReceivedBy('');
        setReturnedDate('');
        setPurpose('');
        setRemarks('');
        setMovementHistory([]);
      }
      setActiveTab('status_form');
    }
  }, [doc, isOpen]);

  if (!isOpen || !doc) return null;

  const clientProfile: ClientProfile = client || {
    id: doc.clientId || 'client_default',
    clientName: 'IEN Client Entity',
    cifNo: 'CIF-0000',
    industry: 'Real Estate / Corporate',
    contactPerson: 'Authorized Officer',
    email: '',
    phone: '',
    address: 'Metro Manila, Philippines',
    assignedOfficer: 'Compliance Officer',
    riskRating: 'low',
    status: 'active',
    createdAt: '',
    updatedAt: '',
  };

  const handleStatusChange = (newStatus: TransmittalStatus) => {
    setStatus(newStatus);
    const today = getTodayDateString();
    
    if (newStatus === 'transmitted') {
      if (!transmittedDate) setTransmittedDate(today);
      if (!transmittalNo) setTransmittalNo(generateTransmittalNumber());
    } else if (newStatus === 'returned') {
      if (!returnedDate) setReturnedDate(today);
    } else if (newStatus === 'acknowledged') {
      if (!transmittedDate) setTransmittedDate(today);
    }
  };

  const handleSave = () => {
    const today = getTodayDateString();
    
    // Create audit movement entry if there was a status transition
    const prevStatus = doc.transmittal?.status || 'in_custody';
    let newHistory = [...movementHistory];

    if (prevStatus !== status || !doc.transmittal) {
      let action: TransmittalMovement['action'] = 'TRANSMITTED';
      if (status === 'returned') action = 'RETURNED';
      else if (status === 'acknowledged') action = 'ACKNOWLEDGED';
      else if (status === 'in_custody') action = 'CUSTODY_REVERTED';

      const newMovement: TransmittalMovement = {
        id: `mov_${Date.now()}`,
        date: today,
        action,
        recipientOrSource: transmittedTo || 'IEN Realty Office Archive',
        courierOrPersonnel: carrierOrMessenger || 'Staff',
        receivedBy: receivedBy || undefined,
        transmittalNo: transmittalNo || undefined,
        purpose: purpose || undefined,
        remarks: remarks || `Status updated to ${TRANSMITTAL_STATUS_CONFIG[status].label}`,
      };

      newHistory = [newMovement, ...newHistory];
    }

    const updatedTransmittal: TransmittalInfo = {
      status,
      currentTransmittalNo: transmittalNo || generateTransmittalNumber(),
      transmittedTo: transmittedTo.trim() || undefined,
      transmittedDate: transmittedDate || undefined,
      carrierOrMessenger: carrierOrMessenger.trim() || undefined,
      receivedBy: receivedBy.trim() || undefined,
      returnedDate: returnedDate || undefined,
      purpose: purpose.trim() || undefined,
      remarks: remarks.trim() || undefined,
      history: newHistory,
    };

    onSaveTransmittal(doc.id, updatedTransmittal);
    onClose();
  };

  const handlePrintSlip = () => {
    window.print();
  };

  const currentConfig = TRANSMITTAL_STATUS_CONFIG[status];

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-start sm:items-center justify-center p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden border border-slate-200 my-4 sm:my-6 flex flex-col max-h-[94vh] print:max-h-none print:border-none print:shadow-none print:my-0">
        
        {/* Header Bar (Hidden on Print) */}
        <div className="bg-slate-900 text-white px-5 sm:px-6 py-4 flex items-center justify-between gap-3 shrink-0 print:hidden border-b border-slate-800">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-sky-500 text-white flex items-center justify-center font-bold shadow-sm shrink-0">
              <Send className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-extrabold text-sm sm:text-base text-white truncate">
                  Document Transmittal & Return Tracker
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  Folder {doc.folderCode}
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate mt-0.5">
                Client: <span className="text-sky-300 font-semibold">{clientProfile.clientName}</span> &bull; {doc.fileName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setActiveTab('printable_slip')}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-300 hover:text-white font-bold text-xs flex items-center gap-1.5 transition border border-slate-700"
              title="Preview and Print Official Transmittal Slip"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Transmittal Slip</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs (Hidden on Print) */}
        <div className="bg-slate-100 px-5 sm:px-6 py-2 border-b border-slate-200 flex items-center justify-between gap-2 shrink-0 print:hidden text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('status_form')}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                activeTab === 'status_form'
                  ? 'bg-white text-sky-950 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileCheck className="w-3.5 h-3.5 text-sky-600" />
              <span>Transmittal & Return Form</span>
            </button>

            <button
              onClick={() => setActiveTab('printable_slip')}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                activeTab === 'printable_slip'
                  ? 'bg-white text-sky-950 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Printer className="w-3.5 h-3.5 text-sky-600" />
              <span>Official Transmittal Slip</span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                activeTab === 'history'
                  ? 'bg-white text-sky-950 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <History className="w-3.5 h-3.5 text-sky-600" />
              <span>Movement History ({movementHistory.length})</span>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-1.5">
            <span className="text-[11px] text-slate-500 font-medium">Current Status:</span>
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${currentConfig.badgeBg} ${currentConfig.badgeText} border ${currentConfig.badgeBorder}`}>
              {currentConfig.label}
            </span>
          </div>
        </div>

        {/* Modal Body Container */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 min-h-0 bg-white">
          
          {/* TAB 1: TRANSMITTAL STATUS & DISPATCH FORM */}
          {activeTab === 'status_form' && (
            <div className="space-y-5 text-xs">
              
              {/* Document Summary Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-bold shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-extrabold text-slate-900 text-sm block">
                      {doc.fileName}
                    </span>
                    <div className="flex items-center gap-2 text-slate-500 text-[11px] mt-0.5 flex-wrap">
                      <span>Folder {doc.folderCode}</span>
                      {doc.referenceNumber && (
                        <span>&bull; Ref No: <strong className="text-slate-700">{doc.referenceNumber}</strong></span>
                      )}
                      {doc.expirationDate && (
                        <span>&bull; Expiration: <strong className="text-slate-700">{formatDateDisplay(doc.expirationDate)}</strong></span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveTab('printable_slip')}
                  className="px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-800 font-bold rounded-lg border border-sky-200 text-xs flex items-center gap-1.5 shrink-0 transition"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Generate Slip</span>
                </button>
              </div>

              {/* Status Selector: 4 Visual Cards */}
              <div>
                <label className="block font-extrabold text-slate-900 mb-2 text-xs uppercase tracking-wider">
                  Select Document Transmittal Status <span className="text-rose-500">*</span>
                </label>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                  
                  {/* Option 1: In Custody */}
                  <button
                    type="button"
                    onClick={() => handleStatusChange('in_custody')}
                    className={`text-left p-3 rounded-xl border-2 transition ${
                      status === 'in_custody'
                        ? 'border-slate-800 bg-slate-100 ring-2 ring-slate-800/10'
                        : 'border-slate-200 hover:border-slate-300 bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="w-7 h-7 rounded-lg bg-slate-200 text-slate-800 flex items-center justify-center font-bold">
                        <Archive className="w-4 h-4" />
                      </div>
                      {status === 'in_custody' && (
                        <CheckCircle2 className="w-4 h-4 text-slate-800" />
                      )}
                    </div>
                    <span className="font-bold text-slate-900 block text-xs">In Custody</span>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Document is safely in IEN Realty physical file archive.
                    </p>
                  </button>

                  {/* Option 2: Transmitted (Out for processing) */}
                  <button
                    type="button"
                    onClick={() => handleStatusChange('transmitted')}
                    className={`text-left p-3 rounded-xl border-2 transition ${
                      status === 'transmitted'
                        ? 'border-amber-500 bg-amber-50/70 ring-2 ring-amber-500/20'
                        : 'border-slate-200 hover:border-amber-300 bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                        <Send className="w-4 h-4" />
                      </div>
                      {status === 'transmitted' && (
                        <CheckCircle2 className="w-4 h-4 text-amber-600" />
                      )}
                    </div>
                    <span className="font-bold text-amber-950 block text-xs">Transmitted (Out)</span>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Dispatched to government agency, bank, or client.
                    </p>
                  </button>

                  {/* Option 3: Returned / Received Back */}
                  <button
                    type="button"
                    onClick={() => handleStatusChange('returned')}
                    className={`text-left p-3 rounded-xl border-2 transition ${
                      status === 'returned'
                        ? 'border-emerald-500 bg-emerald-50/70 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 hover:border-emerald-300 bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                        <RotateCcw className="w-4 h-4" />
                      </div>
                      {status === 'returned' && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      )}
                    </div>
                    <span className="font-bold text-emerald-950 block text-xs">Returned & Received</span>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Returned to office after official receiving stamp or assessment.
                    </p>
                  </button>

                  {/* Option 4: Acknowledged by Recipient */}
                  <button
                    type="button"
                    onClick={() => handleStatusChange('acknowledged')}
                    className={`text-left p-3 rounded-xl border-2 transition ${
                      status === 'acknowledged'
                        ? 'border-sky-500 bg-sky-50/70 ring-2 ring-sky-500/20'
                        : 'border-slate-200 hover:border-sky-300 bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-800 flex items-center justify-center font-bold">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      {status === 'acknowledged' && (
                        <CheckCircle2 className="w-4 h-4 text-sky-600" />
                      )}
                    </div>
                    <span className="font-bold text-sky-950 block text-xs">Acknowledged</span>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Received & retained permanently by recipient with signed receipt.
                    </p>
                  </button>

                </div>
              </div>

              {/* Transmittal Details Form */}
              <div className="bg-slate-50 p-4 sm:p-5 rounded-xl border border-slate-200 space-y-3.5">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                    <Send className="w-3.5 h-3.5 text-sky-600" />
                    Transmittal Information & Tracking Details
                  </h4>
                  <button
                    type="button"
                    onClick={() => setTransmittalNo(generateTransmittalNumber())}
                    className="text-[10px] font-semibold text-sky-700 hover:underline flex items-center gap-1"
                  >
                    <Hash className="w-3 h-3" />
                    Generate New Control #
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1 text-[11px]">
                      Transmittal Control No.
                    </label>
                    <input
                      type="text"
                      value={transmittalNo}
                      onChange={(e) => setTransmittalNo(e.target.value)}
                      placeholder="e.g. TR-2026-8891"
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-mono text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1 text-[11px]">
                      Date Transmitted / Dispatched
                    </label>
                    <input
                      type="date"
                      value={transmittedDate}
                      onChange={(e) => setTransmittedDate(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1 text-[11px]">
                      Carrier / Dispatched By
                    </label>
                    <input
                      type="text"
                      value={carrierOrMessenger}
                      onChange={(e) => setCarrierOrMessenger(e.target.value)}
                      placeholder="e.g. Liaison Officer Juan / LBC"
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Transmitted To (Recipient Agency or Office) */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1 text-[11px]">
                    Transmitted To (Recipient Agency, Office, or Person)
                  </label>
                  <input
                    type="text"
                    value={transmittedTo}
                    onChange={(e) => setTransmittedTo(e.target.value)}
                    placeholder="e.g. BIR RDO 044 (Taguig / Pateros) - Assessment Section"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />

                  {/* Fast Suggested Recipient Chips */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    <span className="text-[10px] font-semibold text-slate-400">Quick suggestions:</span>
                    {COMMON_RECIPIENTS.slice(0, 5).map((rec, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setTransmittedTo(rec)}
                        className="text-[10px] bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded-md transition"
                      >
                        {rec.split('(')[0]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Purpose of Transmittal */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1 text-[11px]">
                    Purpose of Transmission / Instructions
                  </label>
                  <input
                    type="text"
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    placeholder="e.g. For annual business permit assessment and official receiving stamp"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />

                  {/* Fast Purpose Chips */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    <span className="text-[10px] font-semibold text-slate-400">Quick purposes:</span>
                    {COMMON_PURPOSES.slice(0, 4).map((purp, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setPurpose(purp)}
                        className="text-[10px] bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded-md transition"
                      >
                        {purp.length > 35 ? `${purp.substring(0, 35)}...` : purp}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Return Details (Shown especially if status is 'returned' or 'acknowledged') */}
                {(status === 'returned' || status === 'acknowledged') && (
                  <div className="bg-emerald-50/80 p-3.5 rounded-xl border border-emerald-200 mt-3 space-y-3">
                    <h5 className="font-extrabold text-emerald-950 text-xs flex items-center gap-1.5">
                      <RotateCcw className="w-3.5 h-3.5 text-emerald-700" />
                      Return & Receiving Acknowledgment Details
                    </h5>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-emerald-900 mb-1 text-[11px]">
                          Date Received Back in Office
                        </label>
                        <input
                          type="date"
                          value={returnedDate}
                          onChange={(e) => setReturnedDate(e.target.value)}
                          className="w-full bg-white border border-emerald-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-emerald-900 mb-1 text-[11px]">
                          Received By / Receiving Signatory
                        </label>
                        <input
                          type="text"
                          value={receivedBy}
                          onChange={(e) => setReceivedBy(e.target.value)}
                          placeholder="e.g. Officer Santos / Legal Staff"
                          className="w-full bg-white border border-emerald-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Remarks & Notes */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1 text-[11px]">
                    Internal Transmittal Notes / Tracking Remarks
                  </label>
                  <textarea
                    rows={2}
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="e.g. Dispatched original copy for dry seal. Duplicate copy kept in physical folder. Expected return on Friday."
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none resize-none"
                  />
                </div>

              </div>

              {/* Transfer Movement History Snapshot (Kanino na-transfer & Date) */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5 text-sky-600" />
                    <span>Transfer Record & History (Date & Kanino Na-Transfer)</span>
                  </h4>
                  <button
                    type="button"
                    onClick={() => setActiveTab('history')}
                    className="text-[11px] font-bold text-sky-600 hover:text-sky-700 underline"
                  >
                    View All {movementHistory.length} Movement Logs
                  </button>
                </div>

                {/* Current Active Transfer details summary */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 bg-white p-3 rounded-lg border border-slate-200 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Status</span>
                    <span className={`inline-block mt-0.5 text-[11px] font-bold px-2 py-0.5 rounded ${currentConfig.badgeBg} ${currentConfig.badgeText} border ${currentConfig.badgeBorder}`}>
                      {currentConfig.label}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Date of Transfer</span>
                    <span className="font-bold text-slate-800 text-[11px] block mt-0.5">
                      {transmittedDate ? formatDateDisplay(transmittedDate) : 'Not transferred yet'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Kanino Na-Transfer</span>
                    <span className="font-bold text-slate-900 text-[11px] block mt-0.5 truncate" title={transmittedTo || 'In IEN Custody'}>
                      {transmittedTo || 'IEN Realty Office Archive'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Carrier / Dispatched By</span>
                    <span className="font-semibold text-slate-700 text-[11px] block mt-0.5 truncate">
                      {carrierOrMessenger || 'IEN Staff'}
                    </span>
                  </div>
                </div>

                {/* Past Movement logs preview */}
                {movementHistory.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                      Past Document Transfers ({movementHistory.length}):
                    </span>
                    <div className="divide-y divide-slate-200 border border-slate-200 rounded-lg bg-white overflow-hidden max-h-36 overflow-y-auto text-[11px]">
                      {movementHistory.map((mov, idx) => (
                        <div key={mov.id || idx} className="p-2.5 flex items-center justify-between gap-3 hover:bg-slate-50">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                                mov.action === 'TRANSMITTED'
                                  ? 'bg-amber-100 text-amber-900'
                                  : mov.action === 'RETURNED'
                                  ? 'bg-emerald-100 text-emerald-900'
                                  : mov.action === 'ACKNOWLEDGED'
                                  ? 'bg-sky-100 text-sky-900'
                                  : 'bg-slate-100 text-slate-800'
                              }`}>
                                {mov.action}
                              </span>
                              <span className="font-bold text-slate-900 truncate">
                                {mov.recipientOrSource}
                              </span>
                            </div>
                            {mov.purpose && (
                              <p className="text-slate-500 text-[10px] truncate mt-0.5">
                                Purpose: {mov.purpose}
                              </p>
                            )}
                          </div>
                          <div className="text-right shrink-0">
                            <span className="font-mono text-slate-600 text-[10px] block">
                              {formatDateDisplay(mov.date)}
                            </span>
                            {mov.courierOrPersonnel && (
                              <span className="text-slate-400 text-[9px] block">
                                By: {mov.courierOrPersonnel}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="px-5 py-2.5 rounded-xl font-bold bg-sky-500 hover:bg-sky-400 active:bg-sky-600 text-white shadow-md shadow-sky-500/20 flex items-center gap-1.5 transition"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Update Transmittal Record</span>
                </button>
              </div>

            </div>
          )}

          {/* TAB 2: OFFICIAL PRINTABLE TRANSMITTAL SLIP */}
          {activeTab === 'printable_slip' && (
            <div className="space-y-4">
              
              {/* Slip Toolbar */}
              <div className="flex items-center justify-between bg-slate-900 text-white p-3 rounded-xl print:hidden">
                <div className="flex items-center gap-2">
                  <Printer className="w-4 h-4 text-sky-400" />
                  <span className="font-bold text-xs">Official IEN Realty Inc. Transmittal Slip & Receiving Copy</span>
                </div>
                <button
                  type="button"
                  onClick={handlePrintSlip}
                  className="px-3.5 py-1.5 bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 shadow-sm transition"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Transmittal Slip</span>
                </button>
              </div>

              {/* Printable Transmittal Sheet */}
              <div className="p-6 sm:p-8 bg-white border-2 border-slate-800 rounded-xl space-y-5 text-slate-900 font-sans print:border-none print:p-0" id="printable-transmittal-slip">
                
                {/* Transmittal Header */}
                <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-xl bg-slate-900 text-sky-400 flex items-center justify-center font-bold overflow-hidden border border-slate-700 shrink-0">
                      {appLogo ? (
                        <img src={appLogo} alt="IEN Realty" className="w-full h-full object-cover" />
                      ) : (
                        <Building2 className="w-7 h-7 text-sky-400" />
                      )}
                    </div>
                    <div>
                      <h1 className="text-xl font-black tracking-wider text-slate-950 uppercase">
                        IEN REALTY INC.
                      </h1>
                      <p className="text-xs text-slate-600 font-bold uppercase tracking-wider">
                        DOCUMENT TRANSMITTAL SLIP & RECEIVING ACKNOWLEDGEMENT
                      </p>
                      <p className="text-[10px] text-slate-400">
                        Official Compliance & Corporate Secretary Division
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-mono font-black text-sm text-sky-950 block bg-slate-100 px-3 py-1 rounded border border-slate-300">
                      CONTROL NO: {transmittalNo || 'TR-2026-0001'}
                    </span>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Date: <strong>{formatDateDisplay(transmittedDate || getTodayDateString())}</strong>
                    </p>
                  </div>
                </div>

                {/* Recipient & Client Info Box */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-300">
                    <span className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                      TRANSMITTED TO (RECEIVING ENTITY)
                    </span>
                    <p className="font-extrabold text-slate-900 text-sm">
                      {transmittedTo || 'Government Agency / Client Office'}
                    </p>
                    <p className="text-slate-600 mt-1">
                      Attention: Receiving Officer / Document Custodian
                    </p>
                  </div>

                  <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-300">
                    <span className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                      FOR ACCOUNT / CLIENT NAME
                    </span>
                    <p className="font-extrabold text-slate-900 text-sm">
                      {clientProfile.clientName}
                    </p>
                    <p className="text-slate-600 mt-0.5">
                      CIF No: <span className="font-mono font-bold text-slate-800">{clientProfile.cifNo}</span> {clientProfile.tin ? `• TIN: ${clientProfile.tin}` : ''}
                    </p>
                  </div>
                </div>

                {/* Transmitted Items Table */}
                <div>
                  <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider mb-2">
                    DISPATCHED DOCUMENTS & ATTACHMENTS
                  </h4>
                  <table className="w-full border border-slate-300 text-xs">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-300 text-left font-bold text-slate-700">
                        <th className="p-2.5 border-r border-slate-300 w-12 text-center">Item</th>
                        <th className="p-2.5 border-r border-slate-300">Document Title & Description</th>
                        <th className="p-2.5 border-r border-slate-300">Reference / Permit No.</th>
                        <th className="p-2.5 border-r border-slate-300">Folder</th>
                        <th className="p-2.5 text-center">Copies / Type</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-slate-200">
                        <td className="p-2.5 border-r border-slate-300 text-center font-bold">1</td>
                        <td className="p-2.5 border-r border-slate-300">
                          <span className="font-extrabold text-slate-950 block">{doc.fileName}</span>
                          <span className="text-[10px] text-slate-500 block mt-0.5">Original File: {doc.originalFileName}</span>
                        </td>
                        <td className="p-2.5 border-r border-slate-300 font-mono text-slate-800">
                          {doc.referenceNumber || 'N/A'}
                        </td>
                        <td className="p-2.5 border-r border-slate-300 font-semibold text-slate-700">
                          Folder {doc.folderCode}
                        </td>
                        <td className="p-2.5 text-center font-bold text-slate-800">
                          1 Original Copy
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Purpose & Special Instructions */}
                <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-300 text-xs space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-500 block">
                    PURPOSE OF TRANSMITTAL & INSTRUCTIONS
                  </span>
                  <p className="font-semibold text-slate-900">
                    {purpose || 'For official review, stamping, assessment, and record compliance.'}
                  </p>
                  {remarks && (
                    <p className="text-slate-600 text-[11px] mt-1">
                      Remarks: {remarks}
                    </p>
                  )}
                </div>

                {/* Dual Signature / Receiving Area */}
                <div className="grid grid-cols-2 gap-6 pt-4 border-t-2 border-slate-900 text-xs">
                  
                  {/* Left: Dispatched By */}
                  <div className="space-y-8">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">
                      DISPATCHED BY (IEN REALTY INC.)
                    </span>
                    <div className="pt-8 border-b border-slate-400 text-center">
                      <p className="font-extrabold text-slate-950 uppercase">
                        {carrierOrMessenger || 'Authorized Liaison Representative'}
                      </p>
                      <p className="text-[10px] text-slate-500">Corporate Compliance & Legal Department</p>
                    </div>
                    <div className="text-[10px] text-slate-500 flex justify-between">
                      <span>Date Dispatched: {formatDateDisplay(transmittedDate || getTodayDateString())}</span>
                    </div>
                  </div>

                  {/* Right: Received In Good Condition */}
                  <div className="space-y-8">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">
                      RECEIVED IN GOOD CONDITION BY (RECIPIENT)
                    </span>
                    <div className="pt-8 border-b border-slate-400 text-center">
                      <p className="font-extrabold text-slate-950">
                        {receivedBy || '_______________________________________'}
                      </p>
                      <p className="text-[10px] text-slate-500">Printed Name & Official Signature</p>
                    </div>
                    <div className="text-[10px] text-slate-500 flex justify-between">
                      <span>Date & Time Received: ______________</span>
                      <span>Receiving Stamp Box: [ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ]</span>
                    </div>
                  </div>

                </div>

                <div className="text-center pt-2 text-[10px] text-slate-400 border-t border-slate-200">
                  IEN REALTY INC. DATABASE MASTER LIST &bull; Please sign and return duplicate receiving copy.
                </div>

              </div>

            </div>
          )}

          {/* TAB 3: MOVEMENT HISTORY & AUDIT TRAIL */}
          {activeTab === 'history' && (
            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm">
                    Complete Movement Audit Trail
                  </h4>
                  <p className="text-xs text-slate-500">
                    Track the lifecycle of this document when it was dispatched, stamped, returned, or acknowledged.
                  </p>
                </div>
              </div>

              {movementHistory.length > 0 ? (
                <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  {movementHistory.map((mov, idx) => (
                    <div key={mov.id || idx} className="relative">
                      {/* Timeline Dot */}
                      <div className={`absolute -left-6 top-1 w-3.5 h-3.5 rounded-full border-2 border-white shadow-xs ${
                        mov.action === 'TRANSMITTED'
                          ? 'bg-amber-500'
                          : mov.action === 'RETURNED'
                          ? 'bg-emerald-500'
                          : mov.action === 'ACKNOWLEDGED'
                          ? 'bg-sky-500'
                          : 'bg-slate-500'
                      }`} />

                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1.5">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded ${
                            mov.action === 'TRANSMITTED'
                              ? 'bg-amber-100 text-amber-900'
                              : mov.action === 'RETURNED'
                              ? 'bg-emerald-100 text-emerald-900'
                              : mov.action === 'ACKNOWLEDGED'
                              ? 'bg-sky-100 text-sky-900'
                              : 'bg-slate-200 text-slate-800'
                          }`}>
                            {mov.action}
                          </span>
                          <span className="font-mono text-slate-500 text-[11px]">
                            {formatDateDisplay(mov.date)}
                          </span>
                        </div>

                        <p className="font-bold text-slate-900 text-xs">
                          {mov.recipientOrSource}
                        </p>

                        {mov.purpose && (
                          <p className="text-slate-600 text-[11px]">
                            Purpose: <span className="font-medium text-slate-800">{mov.purpose}</span>
                          </p>
                        )}

                        {mov.remarks && (
                          <p className="text-slate-500 text-[11px] italic bg-white p-2 rounded border border-slate-200">
                            {mov.remarks}
                          </p>
                        )}

                        <div className="flex items-center gap-3 text-[10px] text-slate-400 pt-1">
                          {mov.transmittalNo && <span>Ref: {mov.transmittalNo}</span>}
                          {mov.courierOrPersonnel && <span>By: {mov.courierOrPersonnel}</span>}
                          {mov.receivedBy && <span>Received By: {mov.receivedBy}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200">
                  <History className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="font-bold text-slate-700 text-xs">No Movement Logged Yet</p>
                  <p className="text-[11px] text-slate-500 mt-1 max-w-sm mx-auto">
                    When you mark this document as Transmitted or Returned, a permanent audit trail will be saved here automatically.
                  </p>
                </div>
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
