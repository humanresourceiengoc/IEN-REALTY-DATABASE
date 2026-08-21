import React from 'react';
import { 
  X, 
  Printer, 
  Download, 
  Building2, 
  ShieldCheck, 
  Calendar, 
  CheckCircle2, 
  AlertTriangle,
  FileText,
  ArrowLeft,
  Database
} from 'lucide-react';
import { ClientProfile, DocumentItem, FolderDefinition } from '../types';
import { formatDateDisplay, calculateDaysRemaining, formatRemainingDaysText } from '../utils/dateUtils';

interface ComplianceSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: ClientProfile | null;
  documents: DocumentItem[];
  folders: FolderDefinition[];
  appLogo: string;
}

export const ComplianceSummaryModal: React.FC<ComplianceSummaryModalProps> = ({
  isOpen,
  onClose,
  client,
  documents,
  folders,
  appLogo,
}) => {
  if (!isOpen || !client) return null;

  const daysRemaining = calculateDaysRemaining(client.maturityDate);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-start sm:items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto print:p-0 print:bg-white">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden border border-slate-200 my-4 sm:my-8 flex flex-col max-h-[94vh] print:max-h-none print:border-none print:shadow-none print:my-0">
        
        {/* Top Controls with Prominent Back Button (Hidden on Print) */}
        <div className="bg-slate-900 text-white px-4 sm:px-6 py-3.5 flex items-center justify-between gap-3 shrink-0 print:hidden border-b border-slate-800">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-300 hover:text-white font-bold text-xs flex items-center gap-1.5 transition border border-slate-700 active:scale-95"
              title="Return to client workspace"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <div className="h-5 w-px bg-slate-700 hidden sm:block" />
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-sky-400 shrink-0" />
              <h3 className="font-bold text-xs sm:text-sm text-white truncate">
                IEN REALTY INC. DATABASE MASTER LIST &bull; Dossier
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-sm active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Print / Save PDF</span>
              <span className="sm:hidden">Print</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              title="Close Dossier"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body - Scrollable Viewport */}
        <div className="p-5 sm:p-8 space-y-6 text-slate-900 font-sans overflow-y-auto flex-1 print:p-6 print:overflow-visible" id="printable-compliance-sheet">
          
          {/* Header Brand */}
          <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4">
            <div className="flex items-center gap-3.5">
              <div className="w-14 h-14 rounded-xl bg-slate-900 text-sky-400 flex items-center justify-center font-bold overflow-hidden border border-slate-700 shrink-0">
                {appLogo ? (
                  <img src={appLogo} alt="IEN Realty" className="w-full h-full object-cover" />
                ) : (
                  <Building2 className="w-8 h-8 text-sky-400" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-black tracking-wider text-slate-950 uppercase">
                    IEN REALTY INC.
                  </h1>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-sky-100 text-sky-900 border border-sky-300">
                    DATABASE MASTER LIST
                  </span>
                </div>
                <p className="text-xs text-slate-600 font-bold uppercase tracking-wider mt-0.5">
                  Corporate Compliance & Client Dossier System
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Official Verification Dossier &bull; Generated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-slate-100 border border-slate-300 text-slate-800 inline-block">
                STATUS: {client.status.toUpperCase()}
              </span>
              <p className="font-mono font-bold text-xs text-sky-900 mt-1">
                CIF: {client.cifNo}
              </p>
            </div>
          </div>

          {/* Client Profile Box */}
          <div className="bg-slate-50 border border-slate-300 rounded-xl p-4 sm:p-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Registered Client Name</span>
                <span className="text-sm sm:text-base font-extrabold text-slate-950 block">{client.clientName}</span>
                {client.tradeName && (
                  <p className="text-slate-600 text-xs font-medium mt-0.5">
                    Trade Name / DBA: <span className="font-semibold text-slate-900">{client.tradeName}</span>
                  </p>
                )}
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Office Address</span>
                <p className="text-slate-800 font-medium leading-relaxed">{client.officeAddress || 'N/A'}</p>
              </div>
            </div>

            {/* Contact Details Grid - Responsive & with break-all to prevent text clipping */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mt-4 pt-3.5 border-t border-slate-200 text-xs">
              <div className="min-w-0">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Contact Person</span>
                <span className="font-bold text-slate-900 break-words">{client.contactPerson || 'N/A'}</span>
              </div>
              <div className="min-w-0">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Contact Number</span>
                <span className="font-medium text-slate-800 break-words">{client.contactNumber || 'N/A'}</span>
              </div>
              <div className="min-w-0">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Contact Email</span>
                <span className="font-medium text-slate-800 break-all text-sky-800">{client.contactEmail || 'N/A'}</span>
              </div>
              <div className="min-w-0">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Date of Engagement</span>
                <span className="font-semibold text-slate-900">{formatDateDisplay(client.dateOfEngagement)}</span>
              </div>
            </div>
          </div>

          {/* Registration & Contract Matrix */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            
              {/* Tax & Registration Details */}
              <div className="border border-slate-300 rounded-xl p-4 bg-white">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-2.5 pb-1 border-b border-slate-200">
                  Tax & Regulatory Identifiers
                </h4>
                <div className="space-y-2">
                  {client.codeName && (
                    <div className="flex justify-between">
                      <span className="text-slate-600 font-medium">Code Name:</span>
                      <span className="font-bold text-amber-900">{client.codeName}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-600 font-medium">Registration Type:</span>
                    <span className="font-bold text-indigo-900">{client.registrationType || 'Corporation'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 font-medium">Service Category:</span>
                    <span className="font-bold text-amber-900">{client.serviceCategory || 'Retainer'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 font-medium">TIN Number:</span>
                    <span className="font-mono font-bold text-slate-950">{client.tin || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 font-medium">OCN Number:</span>
                    <span className="font-mono font-bold text-slate-950">{client.ocnNumber || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 font-medium">ATP OCN:</span>
                    <span className="font-mono font-bold text-slate-950">{client.atpOcn || 'N/A'}</span>
                  </div>
                </div>
              </div>

            {/* Contract Period & Maturity */}
            <div className="border border-slate-300 rounded-xl p-4 bg-white">
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-2.5 pb-1 border-b border-slate-200">
                Contract Period & Maturity Status
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-600 font-medium">Contract Start:</span>
                  <span className="font-bold text-slate-950">{formatDateDisplay(client.contractDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 font-medium">Maturity Date:</span>
                  <span className="font-bold text-slate-950">{formatDateDisplay(client.maturityDate)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 font-medium">Remaining Days:</span>
                  <span className="font-bold text-sky-900 bg-sky-100 px-2 py-0.5 rounded">
                    {formatRemainingDaysText(daysRemaining)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 font-medium">Total Files Archived:</span>
                  <span className="font-bold text-slate-950">{documents.length} Files</span>
                </div>
              </div>
            </div>
          </div>

          {/* Document Inventory Table Across Folders */}
          <div>
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-2">
              Compliance Folder Inventory & Expiration Audit
            </h4>

            <div className="border border-slate-300 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300 text-[11px]">
                    <th className="py-2.5 px-3">Folder</th>
                    <th className="py-2.5 px-3">Document Title</th>
                    <th className="py-2.5 px-3">Reference / Permit No.</th>
                    <th className="py-2.5 px-3">Expiration Date</th>
                    <th className="py-2.5 px-3">Audit Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {documents.length > 0 ? (
                    documents.map((doc) => {
                      const folderInfo = folders.find((f) => f.id === doc.folderId);
                      const days = calculateDaysRemaining(doc.expirationDate);
                      const isExpired = days !== null && days < 0;

                      return (
                        <tr key={doc.id} className="hover:bg-slate-50">
                          <td className="py-2 px-3 font-semibold text-slate-700 whitespace-nowrap">
                            Folder {doc.folderCode || folderInfo?.code || '00'}
                          </td>
                          <td className="py-2 px-3 font-bold text-slate-950">
                            {doc.fileName}
                          </td>
                          <td className="py-2 px-3 font-mono text-slate-600">
                            {doc.referenceNumber || '-'}
                          </td>
                          <td className="py-2 px-3 text-slate-800 whitespace-nowrap">
                            {doc.expirationDate ? formatDateDisplay(doc.expirationDate) : 'Permanent'}
                          </td>
                          <td className="py-2 px-3 whitespace-nowrap">
                            {doc.expirationDate ? (
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                isExpired ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                              }`}>
                                {isExpired ? 'EXPIRED' : 'VALID'}
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                                ACTIVE
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-4 text-center text-slate-400 italic">
                        No documents recorded for this client.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Signature & Verification Footer */}
          <div className="pt-8 border-t border-slate-300 grid grid-cols-2 gap-8 text-xs">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-500 mb-8">Prepared By (Compliance Officer):</p>
              <div className="border-t border-slate-900 pt-1 font-bold text-slate-900">
                IEN REALTY INC. COMPLIANCE DESK
              </div>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-500 mb-8">Client Acknowledgment / Verified By:</p>
              <div className="border-t border-slate-900 pt-1 font-bold text-slate-900">
                {client.contactPerson || client.clientName}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
