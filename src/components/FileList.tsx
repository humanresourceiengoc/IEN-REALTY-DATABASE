import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  Trash2, 
  Edit3, 
  Eye, 
  Calendar, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Search, 
  Filter, 
  Upload, 
  FilePlus, 
  Folder, 
  FolderOpen,
  Tag, 
  Check, 
  X,
  ExternalLink,
  ShieldCheck,
  ChevronRight,
  Send,
  RotateCcw,
  Archive
} from 'lucide-react';
import { DocumentItem, FolderDefinition } from '../types';
import { calculateDaysRemaining, formatDateDisplay, formatRemainingDaysText, getUrgencySeverity } from '../utils/dateUtils';
import { TRANSMITTAL_STATUS_CONFIG } from '../utils/transmittalUtils';

interface FileListProps {
  documents: DocumentItem[];
  folders: FolderDefinition[];
  selectedFolderId: string | null;
  onPreviewDocument: (doc: DocumentItem) => void;
  onEditDocument: (doc: DocumentItem) => void;
  onDeleteDocument: (docId: string) => void;
  onQuickRename: (docId: string, newName: string) => void;
  onOpenUploadModal: (defaultFolderId?: string) => void;
  onOpenTransmittal: (doc: DocumentItem) => void;
}

export const FileList: React.FC<FileListProps> = ({
  documents,
  folders,
  selectedFolderId,
  onPreviewDocument,
  onEditDocument,
  onDeleteDocument,
  onQuickRename,
  onOpenUploadModal,
  onOpenTransmittal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'in_custody' | 'transmitted' | 'returned' | 'soon' | 'expired'>('all');
  const [editingDocId, setEditingDocId] = useState<string | null>(null);
  const [editingDocName, setEditingDocName] = useState('');

  // Selected folder object
  const currentFolder = folders.find((f) => f.id === selectedFolderId);

  // Filter by active folder
  const folderFilteredDocs = selectedFolderId && selectedFolderId !== 'all_files'
    ? documents.filter((d) => d.folderId === selectedFolderId)
    : documents;

  // Filter by search and status
  const filteredDocs = folderFilteredDocs.filter((doc) => {
    const trans = doc.transmittal;
    const docTransStatus = trans?.status || 'in_custody';

    // Search match
    const matchSearch =
      doc.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.referenceNumber && doc.referenceNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (doc.tags && doc.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))) ||
      (doc.notes && doc.notes.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (trans?.transmittedTo && trans.transmittedTo.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (trans?.currentTransmittalNo && trans.currentTransmittalNo.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (trans?.purpose && trans.purpose.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchSearch) return false;

    // Status filter
    if (filterStatus === 'all') return true;

    if (filterStatus === 'in_custody') {
      return docTransStatus === 'in_custody';
    }
    if (filterStatus === 'transmitted') {
      return docTransStatus === 'transmitted';
    }
    if (filterStatus === 'returned') {
      return docTransStatus === 'returned';
    }

    if (filterStatus === 'expired') {
      if (!doc.expirationDate) return false;
      const days = calculateDaysRemaining(doc.expirationDate);
      return days !== null && days < 0;
    }

    if (filterStatus === 'soon') {
      if (!doc.expirationDate) return false;
      const days = calculateDaysRemaining(doc.expirationDate);
      return days !== null && days >= 0 && days <= 30;
    }

    return true;
  });

  const handleStartRename = (doc: DocumentItem) => {
    setEditingDocId(doc.id);
    setEditingDocName(doc.fileName);
  };

  const handleSaveRename = (docId: string) => {
    if (editingDocName.trim()) {
      onQuickRename(docId, editingDocName.trim());
      setEditingDocId(null);
    }
  };

  const handleDownload = (doc: DocumentItem) => {
    const link = document.createElement('a');
    link.href = doc.fileData;
    link.download = doc.fileName.endsWith('.pdf') ? doc.fileName : `${doc.fileName}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div id="client-file-explorer-section" className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden scroll-mt-20">
      
      {/* Active Folder Spotlight Banner */}
      {currentFolder && (
        <div className="bg-gradient-to-r from-sky-600 via-sky-700 to-sky-800 text-white p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-inner">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center font-black text-lg text-white shadow-sm shrink-0">
              {currentFolder.code}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider bg-white/20 text-white px-2 py-0.5 rounded-full">
                  Opened Folder
                </span>
                <span className="text-xs text-sky-100 font-semibold">
                  Folder {currentFolder.code}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-white leading-tight mt-0.5">
                {currentFolder.name}
              </h3>
              <p className="text-xs text-sky-100/90 mt-0.5 line-clamp-1 max-w-xl">
                {currentFolder.description}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onOpenUploadModal(currentFolder.id)}
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-sky-50 text-sky-950 font-bold text-xs shadow-md transition flex items-center gap-1.5 active:scale-95"
            >
              <Upload className="w-3.5 h-3.5 text-sky-600" />
              <span>Upload PDF to this Folder</span>
            </button>
          </div>
        </div>
      )}

      {/* Header Bar with Search & Filter Controls */}
      <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        
        {/* Title */}
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
            <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
              {currentFolder ? `Files in Folder ${currentFolder.code}` : 'All Compliance & PDF Documents'}
            </h3>
            <span className="text-xs font-bold text-sky-800 bg-sky-100 border border-sky-200 px-2 py-0.5 rounded-full">
              {filteredDocs.length} {filteredDocs.length === 1 ? 'file' : 'files'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Click any file name or "Open PDF" to view, inspect, or manage transmittal tracking.
          </p>
        </div>

        {/* Search, Filter & Insert Button */}
        <div className="flex flex-wrap items-center gap-2.5">
          
          {/* Search Box */}
          <div className="relative flex-1 sm:w-56">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search title, ref #, transmittal..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Status Selector with Transmittal states */}
          <div className="flex items-center bg-slate-200/80 p-0.5 rounded-lg text-[11px] font-medium text-slate-600 flex-wrap">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-2.5 py-1 rounded-md transition ${
                filterStatus === 'all' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'hover:text-slate-900'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterStatus('transmitted')}
              className={`px-2 py-1 rounded-md transition flex items-center gap-1 ${
                filterStatus === 'transmitted' ? 'bg-amber-100 text-amber-900 shadow-2xs font-bold' : 'hover:text-amber-900'
              }`}
            >
              <Send className="w-3 h-3 text-amber-600" />
              <span>Transmitted (Out)</span>
            </button>
            <button
              onClick={() => setFilterStatus('returned')}
              className={`px-2 py-1 rounded-md transition flex items-center gap-1 ${
                filterStatus === 'returned' ? 'bg-emerald-100 text-emerald-900 shadow-2xs font-bold' : 'hover:text-emerald-900'
              }`}
            >
              <RotateCcw className="w-3 h-3 text-emerald-600" />
              <span>Returned</span>
            </button>
            <button
              onClick={() => setFilterStatus('soon')}
              className={`px-2 py-1 rounded-md transition ${
                filterStatus === 'soon' ? 'bg-sky-100 text-sky-900 shadow-2xs font-bold' : 'hover:text-slate-900'
              }`}
            >
              Expiring Soon
            </button>
          </div>

          {/* Insert File Button */}
          <button
            id="file-list-insert-btn"
            onClick={() => onOpenUploadModal(selectedFolderId || undefined)}
            className="bg-sky-500 hover:bg-sky-400 active:bg-sky-600 text-white font-bold px-3.5 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition shadow-sm shadow-sky-500/20"
            title="Insert PDF file into this folder"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload PDF</span>
          </button>
        </div>
      </div>

      {/* File List Table */}
      {filteredDocs.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/75 text-[11px] font-bold text-slate-600 uppercase tracking-wider border-b border-slate-200">
                <th className="py-3.5 px-4">Document Title / PDF Name</th>
                <th className="py-3.5 px-4">Folder</th>
                <th className="py-3.5 px-4">Transmittal & Custody Status</th>
                <th className="py-3.5 px-4">Expiration Date</th>
                <th className="py-3.5 px-4">Size & Date</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredDocs.map((doc) => {
                const folderInfo = folders.find((f) => f.id === doc.folderId);
                const daysRemaining = calculateDaysRemaining(doc.expirationDate);
                const urgency = getUrgencySeverity(daysRemaining);
                const isEditingThis = editingDocId === doc.id;
                
                const transmittal = doc.transmittal;
                const transStatus = transmittal?.status || 'in_custody';
                const transConfig = TRANSMITTAL_STATUS_CONFIG[transStatus];

                return (
                  <tr key={doc.id} className="hover:bg-sky-50/50 transition group">
                    
                    {/* Column 1: Document Name & Reference */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-start gap-3">
                        <div 
                          onClick={() => onPreviewDocument(doc)}
                          className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600 shrink-0 cursor-pointer group-hover:bg-sky-500 group-hover:text-white transition shadow-2xs"
                          title="Click to open PDF preview"
                        >
                          <FileText className="w-5 h-5" />
                        </div>

                        <div className="min-w-0 flex-1">
                          {isEditingThis ? (
                            <div className="flex items-center gap-1.5">
                              <input
                                type="text"
                                value={editingDocName}
                                onChange={(e) => setEditingDocName(e.target.value)}
                                className="border border-sky-500 rounded px-2 py-1 text-xs font-semibold text-slate-900 bg-white w-full max-w-md focus:outline-none ring-2 ring-sky-500/20"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSaveRename(doc.id);
                                  if (e.key === 'Escape') setEditingDocId(null);
                                }}
                              />
                              <button
                                onClick={() => handleSaveRename(doc.id)}
                                className="p-1 bg-emerald-600 text-white rounded hover:bg-emerald-500"
                                title="Save name"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setEditingDocId(null)}
                                className="p-1 bg-slate-200 text-slate-700 rounded hover:bg-slate-300"
                                title="Cancel"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <span
                                onClick={() => onPreviewDocument(doc)}
                                className="font-bold text-slate-900 hover:text-sky-600 cursor-pointer truncate max-w-sm sm:max-w-md block group-hover:underline"
                                title={doc.fileName}
                              >
                                {doc.fileName}
                              </span>
                              <button
                                onClick={() => handleStartRename(doc)}
                                className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-400 hover:text-sky-600 rounded transition"
                                title="Rename file"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}

                          {/* Reference Number & Notes */}
                          <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-slate-500">
                            {doc.referenceNumber && (
                              <span className="font-mono font-medium bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200 text-slate-700">
                                Ref: {doc.referenceNumber}
                              </span>
                            )}
                            {doc.notes && (
                              <span className="text-slate-500 truncate max-w-xs" title={doc.notes}>
                                &bull; {doc.notes}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Column 2: Folder Badge */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 font-bold text-[11px] text-sky-900 bg-sky-50 border border-sky-200 px-2.5 py-1 rounded-lg">
                        <Folder className="w-3 h-3 text-sky-600" />
                        <span>{doc.folderCode || folderInfo?.code || '00'} - {folderInfo?.name || 'CUSTOM'}</span>
                      </span>
                    </td>

                    {/* Column 3: Transmittal & Custody Status Badge */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div 
                        onClick={() => onOpenTransmittal(doc)}
                        className="cursor-pointer group/trans inline-block"
                        title="Click to view transmittal slip, update status, or record document return"
                      >
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border transition ${transConfig.badgeBg} ${transConfig.badgeText} ${transConfig.badgeBorder} group-hover/trans:scale-105 shadow-2xs`}>
                          {transStatus === 'transmitted' ? (
                            <Send className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                          ) : transStatus === 'returned' ? (
                            <RotateCcw className="w-3.5 h-3.5 text-emerald-600" />
                          ) : transStatus === 'acknowledged' ? (
                            <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />
                          ) : (
                            <Archive className="w-3.5 h-3.5 text-slate-500" />
                          )}
                          <span>{transConfig.shortLabel}</span>
                        </div>

                        {transmittal?.transmittedTo && transStatus === 'transmitted' && (
                          <p className="text-[10px] text-amber-800 font-semibold truncate max-w-[170px] mt-0.5">
                            To: {transmittal.transmittedTo}
                          </p>
                        )}

                        {transmittal?.returnedDate && transStatus === 'returned' && (
                          <p className="text-[10px] text-emerald-800 font-semibold truncate max-w-[170px] mt-0.5">
                            Back: {formatDateDisplay(transmittal.returnedDate)}
                          </p>
                        )}
                      </div>
                    </td>

                    {/* Column 4: Expiration Date & Remaining Days Alert */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {doc.expirationDate ? (
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-slate-800 text-xs">
                              {formatDateDisplay(doc.expirationDate)}
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              urgency === 'expired'
                                ? 'bg-rose-100 text-rose-800 border border-rose-200 font-bold'
                                : urgency === 'urgent'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : urgency === 'warning'
                                ? 'bg-sky-50 text-sky-800 border border-sky-200'
                                : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            }`}>
                              {formatRemainingDaysText(daysRemaining)}
                            </span>
                          </div>
                          {urgency === 'expired' && (
                            <p className="text-[10px] font-bold text-rose-600 flex items-center gap-0.5 mt-0.5">
                              <AlertTriangle className="w-2.5 h-2.5" /> Renewal Overdue!
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px] italic">
                          Permanent / No Expiration
                        </span>
                      )}
                    </td>

                    {/* Column 5: Size & Upload Date */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-500 text-[11px]">
                      <div>
                        <span className="font-medium text-slate-700">{formatFileSize(doc.fileSize)}</span>
                        <p className="text-slate-400 text-[10px]">
                          {formatDateDisplay(doc.uploadedAt)}
                        </p>
                      </div>
                    </td>

                    {/* Column 6: Action Buttons */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        
                        {/* Primary OPEN / PREVIEW PDF Button */}
                        <button
                          onClick={() => onPreviewDocument(doc)}
                          className="px-2.5 py-1.5 bg-sky-50 hover:bg-sky-500 hover:text-white text-sky-700 font-bold rounded-lg border border-sky-200 hover:border-sky-500 transition text-xs flex items-center gap-1 shadow-2xs"
                          title="Open and Preview PDF"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Open PDF</span>
                        </button>

                        {/* Transmittal Quick Action */}
                        <button
                          onClick={() => onOpenTransmittal(doc)}
                          className="px-2 py-1.5 bg-amber-50 hover:bg-amber-500 hover:text-white text-amber-800 font-bold rounded-lg border border-amber-200 transition text-xs flex items-center gap-1"
                          title="Open Transmittal Slip, Log Dispatch, or Record Return"
                        >
                          <Send className="w-3 h-3" />
                          <span className="hidden sm:inline">Transmittal</span>
                        </button>

                        {/* Edit metadata */}
                        <button
                          onClick={() => onEditDocument(doc)}
                          className="px-2 py-1.5 bg-slate-100 hover:bg-sky-600 hover:text-white text-slate-700 font-bold rounded-lg border border-slate-200 transition text-xs flex items-center gap-1 shadow-2xs"
                          title="Edit Document Info & Expiration"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-sky-600 group-hover:text-white" />
                          <span>Edit</span>
                        </button>

                        {/* Erase / Delete */}
                        <button
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to permanently erase "${doc.fileName}"?`)) {
                              onDeleteDocument(doc.id);
                            }
                          }}
                          className="px-2 py-1.5 bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-700 font-bold rounded-lg border border-rose-200 hover:border-rose-600 transition text-xs flex items-center gap-1 shadow-2xs"
                          title="Erase / Delete Document"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-600 group-hover:text-white" />
                          <span>Erase</span>
                        </button>

                        {/* Download PDF */}
                        <button
                          onClick={() => handleDownload(doc)}
                          className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition"
                          title="Download PDF"
                        >
                          <Download className="w-4 h-4" />
                        </button>

                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* Empty State */
        <div className="p-12 text-center">
          <div className="w-14 h-14 bg-sky-50 text-sky-600 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-sky-200">
            <FilePlus className="w-7 h-7" />
          </div>
          <h4 className="font-extrabold text-slate-800 text-sm mb-1">
            {searchQuery || filterStatus !== 'all'
              ? 'No documents found matching your filter'
              : 'No documents in this folder currently'}
          </h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
            {searchQuery || filterStatus !== 'all'
              ? 'Try removing the search query or selecting the All filter.'
              : 'Click the button below to upload a PDF file, permit, or certificate.'}
          </p>
          <button
            onClick={() => onOpenUploadModal(selectedFolderId || undefined)}
            className="bg-sky-500 hover:bg-sky-400 active:bg-sky-600 text-white font-bold px-4 py-2 rounded-xl text-xs inline-flex items-center gap-2 shadow-md shadow-sky-500/20 transition"
          >
            <Upload className="w-4 h-4" />
            <span>Upload PDF / Document Now</span>
          </button>
        </div>
      )}
    </div>
  );
};
