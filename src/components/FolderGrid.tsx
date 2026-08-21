import React, { useState } from 'react';
import { 
  Folder, 
  FolderOpen, 
  Plus, 
  FileText, 
  AlertTriangle, 
  Upload, 
  ChevronRight,
  ArrowLeft,
  Layers,
  Search,
  Filter,
  Eye,
  Edit3,
  Download,
  Trash2,
  Check,
  X,
  FilePlus,
  Clock,
  Sparkles,
  FileCheck2,
  Tag,
  Send,
  RotateCcw,
  ShieldCheck,
  Archive
} from 'lucide-react';
import { FolderDefinition, DocumentItem } from '../types';
import { calculateDaysRemaining, formatDateDisplay, formatRemainingDaysText, getUrgencySeverity } from '../utils/dateUtils';
import { TRANSMITTAL_STATUS_CONFIG } from '../utils/transmittalUtils';

interface FolderGridProps {
  folders: FolderDefinition[];
  selectedFolderId: string | null;
  onSelectFolder: (folderId: string | null) => void;
  documents: DocumentItem[];
  onOpenAddFolderModal: () => void;
  onOpenUploadModal: (defaultFolderId?: string) => void;
  onPreviewDocument: (doc: DocumentItem) => void;
  onEditDocument: (doc: DocumentItem) => void;
  onDeleteDocument: (docId: string) => void;
  onQuickRename: (docId: string, newName: string) => void;
  onOpenTransmittal?: (doc: DocumentItem) => void;
  onBackToDirectory?: () => void;
}

export const FolderGrid: React.FC<FolderGridProps> = ({
  folders,
  selectedFolderId,
  onSelectFolder,
  documents,
  onOpenAddFolderModal,
  onOpenUploadModal,
  onPreviewDocument,
  onEditDocument,
  onDeleteDocument,
  onQuickRename,
  onOpenTransmittal,
  onBackToDirectory,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'in_custody' | 'transmitted' | 'returned' | 'soon' | 'expired'>('all');
  const [editingDocId, setEditingDocId] = useState<string | null>(null);
  const [editingDocName, setEditingDocName] = useState('');
  const [docToDelete, setDocToDelete] = useState<DocumentItem | null>(null);

  // Active folder object
  const currentFolder = folders.find((f) => f.id === selectedFolderId);

  // Filter documents to active (non-deleted) items
  const activeDocuments = documents.filter((d) => !d.isDeleted);

  // Filter documents by active folder if one is selected
  const folderDocuments = selectedFolderId
    ? activeDocuments.filter((d) => d.folderId === selectedFolderId)
    : activeDocuments;

  // Filter by search text and status
  const filteredDocuments = folderDocuments.filter((doc) => {
    const trans = doc.transmittal;
    const docTransStatus = trans?.status || 'in_custody';

    const matchSearch =
      doc.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.referenceNumber && doc.referenceNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (doc.tags && doc.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))) ||
      (doc.notes && doc.notes.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (trans?.transmittedTo && trans.transmittedTo.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (trans?.currentTransmittalNo && trans.currentTransmittalNo.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchSearch) return false;

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
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden mb-8 transition" id="compliance-folders-section">
      
      {/* ------------------------------------------------------------- */}
      {/* VIEW A: ROOT VIEW - 01-08 FOLDERS OVERVIEW GRID               */}
      {/* ------------------------------------------------------------- */}
      {selectedFolderId === null ? (
        <div className="p-5 sm:p-6">
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 pb-4 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-sky-500 text-white flex items-center justify-center font-bold shadow-sm">
                  <Layers className="w-4 h-4" />
                </div>
                <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
                  Compliance Document Folders (01–08)
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Click any folder to open and view the PDF compliance documents stored inside.
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Back to Master List button */}
              {onBackToDirectory && (
                <button
                  onClick={onBackToDirectory}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white transition flex items-center gap-1.5 shadow-sm active:scale-95 group"
                  title="Return to Master List Directory"
                >
                  <ArrowLeft className="w-3.5 h-3.5 text-sky-400 group-hover:-translate-x-0.5 transition-transform" />
                  <span>Master List</span>
                </button>
              )}

              {/* View All Documents button */}
              <button
                onClick={() => onSelectFolder('all_files')}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-sky-50 hover:bg-sky-100 text-sky-900 border border-sky-200 transition flex items-center gap-1.5 shadow-2xs"
                title="View master table of all documents"
              >
                <FileText className="w-3.5 h-3.5 text-sky-600" />
                <span>View All Documents</span>
                <span className="px-1.5 py-0.2 rounded-full bg-sky-200 text-sky-900 text-[10px] font-bold">
                  {activeDocuments.length}
                </span>
              </button>

              {/* Add Custom Folder */}
              <button
                id="add-custom-folder-btn"
                onClick={onOpenAddFolderModal}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-sky-500 hover:bg-sky-400 active:bg-sky-600 text-white transition flex items-center gap-1.5 shadow-sm shadow-sky-500/20"
                title="Create Custom Folder"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Folder</span>
              </button>
            </div>
          </div>

          {/* 01-08 Folders Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {folders.map((folder) => {
              const folderDocs = activeDocuments.filter((d) => d.folderId === folder.id);
              const docCount = folderDocs.length;

              const expiredCount = folderDocs.filter((d) => {
                if (!d.expirationDate) return false;
                const days = calculateDaysRemaining(d.expirationDate);
                return days !== null && days < 0;
              }).length;

              const upcomingExpiryCount = folderDocs.filter((d) => {
                if (!d.expirationDate) return false;
                const days = calculateDaysRemaining(d.expirationDate);
                return days !== null && days >= 0 && days <= 30;
              }).length;

              return (
                <div
                  key={folder.id}
                  onClick={() => onSelectFolder(folder.id)}
                  className="group relative rounded-2xl border border-slate-200 bg-white hover:border-sky-400 hover:bg-sky-50/20 p-4.5 cursor-pointer transition-all duration-200 flex flex-col justify-between shadow-2xs hover:shadow-md"
                >
                  <div>
                    {/* Card Header: Code & Icon */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-800 group-hover:bg-sky-500 group-hover:text-white font-black text-xs flex items-center justify-center transition shadow-2xs">
                          {folder.code}
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-sky-600 uppercase tracking-wider block">
                            Folder {folder.code}
                          </span>
                          <h3 className="font-extrabold text-xs text-slate-900 group-hover:text-sky-700 leading-tight line-clamp-1">
                            {folder.name}
                          </h3>
                        </div>
                      </div>

                      <div className="p-1.5 rounded-lg bg-slate-100 text-slate-400 group-hover:bg-sky-100 group-hover:text-sky-600 transition">
                        <Folder className="w-5 h-5 shrink-0" />
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed mb-3">
                      {folder.description}
                    </p>

                    {/* Attached files preview with Edit and Erase actions */}
                    {folderDocs.length > 0 ? (
                      <div className="mb-3 space-y-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-sky-700 block flex items-center justify-between">
                          <span>Attached Files ({folderDocs.length})</span>
                          <span className="text-[9px] text-slate-400 font-normal">Direct Actions</span>
                        </span>
                        <div className="space-y-1">
                          {folderDocs.slice(0, 2).map((d) => (
                            <div
                              key={d.id}
                              onClick={(e) => e.stopPropagation()}
                              className="bg-slate-50 hover:bg-sky-50/50 p-1.5 rounded-lg border border-slate-200/80 flex items-center justify-between gap-1 text-[11px] group/file"
                            >
                              <div
                                onClick={() => onPreviewDocument(d)}
                                className="flex items-center gap-1.5 min-w-0 flex-1 cursor-pointer hover:text-sky-700"
                                title={`Click to preview "${d.fileName}"`}
                              >
                                <FileText className="w-3 h-3 text-sky-600 shrink-0" />
                                <span className="font-semibold text-slate-800 truncate block">
                                  {d.fileName}
                                </span>
                              </div>

                              <div className="flex items-center gap-0.5 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => onPreviewDocument(d)}
                                  className="p-1 text-slate-400 hover:text-sky-600 hover:bg-sky-100 rounded transition"
                                  title="Open / Preview PDF"
                                >
                                  <Eye className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onEditDocument(d)}
                                  className="p-1 text-slate-400 hover:text-amber-600 hover:bg-amber-100 rounded transition"
                                  title="Edit Document"
                                >
                                  <Edit3 className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDocToDelete(d)}
                                  className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-100 rounded transition"
                                  title="Erase / Delete Document"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          ))}
                          {folderDocs.length > 2 && (
                            <p className="text-[10px] text-sky-600 font-semibold pl-1">
                              +{folderDocs.length - 2} more document(s)
                            </p>
                          )}
                        </div>
                      </div>
                    ) : folder.suggestedDocs && folder.suggestedDocs.length > 0 ? (
                      <div className="mb-3 space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          Checklist
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {folder.suggestedDocs.slice(0, 2).map((item, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded truncate max-w-[140px]"
                              title={item}
                            >
                              &bull; {item}
                            </span>
                          ))}
                          {folder.suggestedDocs.length > 2 && (
                            <span className="text-[10px] text-slate-400 font-semibold px-1 py-0.5">
                              +{folder.suggestedDocs.length - 2} more
                            </span>
                          )}
                        </div>
                      </div>
                    ) : null}
                  </div>

                  {/* Card Footer: File count, Alerts & Open Button */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between mt-auto">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-700">
                        {docCount} {docCount === 1 ? 'file' : 'files'}
                      </span>

                      {expiredCount > 0 && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-rose-100 text-rose-700 flex items-center gap-0.5" title={`${expiredCount} expired document(s)`}>
                          <AlertTriangle className="w-2.5 h-2.5 text-rose-600" />
                          {expiredCount}
                        </span>
                      )}

                      {expiredCount === 0 && upcomingExpiryCount > 0 && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-sky-100 text-sky-800 flex items-center gap-0.5" title={`${upcomingExpiryCount} file(s) expiring within 30 days`}>
                          <AlertTriangle className="w-2.5 h-2.5 text-sky-600" />
                          {upcomingExpiryCount}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectFolder(folder.id);
                        }}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-sky-50 group-hover:bg-sky-500 group-hover:text-white text-sky-700 transition flex items-center gap-1 shadow-2xs"
                      >
                        <span>Open Folder</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenUploadModal(folder.id);
                        }}
                        className="p-1 text-slate-400 hover:text-sky-700 hover:bg-sky-100 rounded-lg transition"
                        title={`Upload PDF to ${folder.name}`}
                      >
                        <Upload className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* ------------------------------------------------------------- */
        /* VIEW B: INSIDE FOLDER VIEW (OR ALL DOCUMENTS VIEW)             */
        /* ------------------------------------------------------------- */
        <div>
          {/* Top Breadcrumb & Switcher Navigation Bar */}
          <div className="p-4 bg-slate-900 text-white flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Back to Master List Button */}
              {onBackToDirectory && (
                <button
                  onClick={onBackToDirectory}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs transition active:scale-95 shadow-sm"
                  title="Return to Master List Directory"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Master List</span>
                </button>
              )}

              {/* Back to All Folders Button */}
              <button
                onClick={() => onSelectFolder(null)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-300 font-bold text-xs transition border border-slate-700 active:scale-95 shadow-sm"
                title="Return to 01-08 Folders Overview"
              >
                <ArrowLeft className="w-4 h-4 text-sky-400" />
                <span>All Folders</span>
              </button>

              <div className="h-4 w-px bg-slate-700 hidden sm:block" />

              {/* Breadcrumb Path */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-slate-400">Folders</span>
                <span className="text-slate-600">/</span>
                <span className="font-extrabold text-white">
                  {selectedFolderId === 'all_files' ? 'All Compliance Documents' : `Folder ${currentFolder?.code || ''}: ${currentFolder?.name || ''}`}
                </span>
              </div>
            </div>

            {/* Folder Quick Switcher Tab Pills */}
            <div className="flex items-center gap-1 overflow-x-auto py-1 max-w-full text-xs">
              <button
                onClick={() => onSelectFolder('all_files')}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] whitespace-nowrap transition ${
                  selectedFolderId === 'all_files'
                    ? 'bg-sky-500 text-white shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                All Files ({documents.length})
              </button>

              {folders.map((f) => {
                const isThisSelected = selectedFolderId === f.id;
                const fCount = documents.filter((d) => d.folderId === f.id).length;
                return (
                  <button
                    key={f.id}
                    onClick={() => onSelectFolder(f.id)}
                    className={`px-2.5 py-1 rounded-lg font-bold text-[11px] whitespace-nowrap transition flex items-center gap-1 ${
                      isThisSelected
                        ? 'bg-sky-500 text-white shadow-sm'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                    title={f.name}
                  >
                    <span>{f.code}</span>
                    <span className={`text-[10px] px-1 rounded-full ${isThisSelected ? 'bg-sky-700 text-white' : 'bg-slate-800 text-slate-400'}`}>
                      {fCount}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Folder Interior Header Banner */}
          {currentFolder ? (
            <div className="bg-gradient-to-r from-sky-600 via-sky-700 to-sky-800 text-white p-5 sm:p-6 shadow-inner">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center font-black text-xl text-white shadow-sm shrink-0">
                    {currentFolder.code}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider bg-white/20 text-white px-2 py-0.5 rounded-full">
                        Active Folder
                      </span>
                      <span className="text-xs text-sky-100 font-semibold">
                        Folder {currentFolder.code}
                      </span>
                    </div>
                    <h3 className="text-lg sm:text-xl font-black text-white leading-tight mt-1">
                      {currentFolder.name}
                    </h3>
                    <p className="text-xs text-sky-100/90 mt-1 max-w-2xl leading-relaxed">
                      {currentFolder.description}
                    </p>

                    {/* Suggested checklist tags */}
                    {currentFolder.suggestedDocs && currentFolder.suggestedDocs.length > 0 && (
                      <div className="mt-3 flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-sky-200">
                          Recommended Docs:
                        </span>
                        {currentFolder.suggestedDocs.map((item, idx) => (
                          <span
                            key={idx}
                            className="text-[11px] bg-white/15 text-white px-2 py-0.5 rounded-md backdrop-blur-xs font-medium border border-white/10"
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => onOpenUploadModal(currentFolder.id)}
                    className="px-4 py-2.5 rounded-xl bg-white hover:bg-sky-50 text-sky-950 font-bold text-xs sm:text-sm shadow-md transition flex items-center gap-2 active:scale-95"
                  >
                    <Upload className="w-4 h-4 text-sky-600" />
                    <span>Upload PDF to Folder {currentFolder.code}</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-white">All Compliance & PDF Documents</h3>
                <p className="text-xs text-slate-300">Master repository of all client attachments across all folders.</p>
              </div>
              <button
                onClick={() => onOpenUploadModal()}
                className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs flex items-center gap-2 shadow-sm"
              >
                <Upload className="w-4 h-4" />
                <span>Upload New Document</span>
              </button>
            </div>
          )}

          {/* Search, Filter & Action Bar */}
          <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
              <h4 className="font-extrabold text-sm text-slate-900">
                {currentFolder ? `Documents in Folder ${currentFolder.code}` : 'All Documents'}
              </h4>
              <span className="text-xs font-bold text-sky-800 bg-sky-100 border border-sky-200 px-2.5 py-0.5 rounded-full">
                {filteredDocuments.length} {filteredDocuments.length === 1 ? 'file' : 'files'}
              </span>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Search Box */}
              <div className="relative flex-1 sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search file name, ref #, tags..."
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

              {/* Expiration and Transmittal Filter */}
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
                  <span>Transmitted</span>
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
                  className={`px-2.5 py-1 rounded-md transition ${
                    filterStatus === 'soon' ? 'bg-sky-100 text-sky-900 shadow-2xs font-bold' : 'hover:text-slate-900'
                  }`}
                >
                  Expiring Soon
                </button>
              </div>

              {/* Upload Button */}
              <button
                onClick={() => onOpenUploadModal(currentFolder?.id)}
                className="bg-sky-500 hover:bg-sky-400 active:bg-sky-600 text-white font-bold px-3.5 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition shadow-sm shadow-sky-500/20"
                title="Upload PDF Document"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload PDF</span>
              </button>
            </div>
          </div>

          {/* Documents Table INSIDE the Folder */}
          {filteredDocuments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100/80 text-[11px] font-bold text-slate-600 uppercase tracking-wider border-b border-slate-200">
                    <th className="py-3.5 px-4">Document Title / File Name</th>
                    {selectedFolderId === 'all_files' && <th className="py-3.5 px-4">Folder</th>}
                    <th className="py-3.5 px-4">Custody & Transmittal</th>
                    <th className="py-3.5 px-4">Expiration Date</th>
                    <th className="py-3.5 px-4">Size & Date Added</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredDocuments.map((doc) => {
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
                              title="Click to open in-app PDF preview"
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
                                    title="Rename document"
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

                        {/* Column 2: Folder Badge (if all files view) */}
                        {selectedFolderId === 'all_files' && (
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1.5 font-bold text-[11px] text-sky-900 bg-sky-50 border border-sky-200 px-2.5 py-1 rounded-lg">
                              <Folder className="w-3 h-3 text-sky-600" />
                              <span>{doc.folderCode || folderInfo?.code || '00'} - {folderInfo?.name || 'CUSTOM'}</span>
                            </span>
                          </td>
                        )}

                        {/* Column 3: Custody & Transmittal Status */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {onOpenTransmittal ? (
                            <div 
                              onClick={() => onOpenTransmittal(doc)}
                              className="cursor-pointer group/trans inline-block"
                              title="Click to manage transmittal slip or document return"
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
                            </div>
                          ) : (
                            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border ${transConfig.badgeBg} ${transConfig.badgeText} ${transConfig.badgeBorder}`}>
                              <span>{transConfig.shortLabel}</span>
                            </div>
                          )}
                        </td>

                        {/* Column 4: Expiration Date & Urgency Countdown */}
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

                        {/* Column 5: Size & Date */}
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
                              title="Open and Preview PDF Document"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Open PDF</span>
                            </button>

                            {/* Transmittal Quick Action */}
                            {onOpenTransmittal && (
                              <button
                                onClick={() => onOpenTransmittal(doc)}
                                className="px-2 py-1.5 bg-amber-50 hover:bg-amber-500 hover:text-white text-amber-800 font-bold rounded-lg border border-amber-200 transition text-xs flex items-center gap-1"
                                title="Open Transmittal Slip / Manage Dispatch & Return"
                              >
                                <Send className="w-3 h-3" />
                                <span className="hidden xl:inline">Transmittal</span>
                              </button>
                            )}

                            {/* EDIT FILE BUTTON */}
                            <button
                              onClick={() => onEditDocument(doc)}
                              className="px-2.5 py-1.5 bg-slate-100 hover:bg-sky-600 hover:text-white text-slate-700 font-bold rounded-lg border border-slate-200 transition text-xs flex items-center gap-1 shadow-2xs"
                              title="Edit Document Info & Expiration"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-sky-600 group-hover:text-white" />
                              <span>Edit</span>
                            </button>

                            {/* ERASE / DELETE FILE BUTTON */}
                            <button
                              onClick={() => setDocToDelete(doc)}
                              className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-700 font-bold rounded-lg border border-rose-200 hover:border-rose-600 transition text-xs flex items-center gap-1 shadow-2xs"
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
            /* Empty State inside Folder */
            <div className="p-12 text-center">
              <div className="w-14 h-14 bg-sky-50 text-sky-600 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-sky-200">
                <FilePlus className="w-7 h-7" />
              </div>
              <h4 className="font-extrabold text-slate-800 text-sm mb-1">
                {searchQuery || filterStatus !== 'all'
                  ? 'No documents matched your search filter'
                  : 'No documents in this folder yet'}
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
                {searchQuery || filterStatus !== 'all'
                  ? 'Try clearing your search query or selecting the All filter.'
                  : 'Click the button below to upload the first PDF document, permit, or certificate to this folder.'}
              </p>
              <button
                onClick={() => onOpenUploadModal(currentFolder?.id)}
                className="bg-sky-500 hover:bg-sky-400 active:bg-sky-600 text-white font-bold px-4 py-2 rounded-xl text-xs inline-flex items-center gap-2 shadow-md shadow-sky-500/20 transition"
              >
                <Upload className="w-4 h-4" />
                <span>Upload PDF Document Now</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* CONFIRM MOVE TO RECYCLE BIN / TRASH MODAL */}
      {docToDelete && (
        <div className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-slate-900 animate-fade-in">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mb-4 border border-amber-200">
              <Archive className="w-6 h-6" />
            </div>

            <h3 className="text-base font-extrabold text-slate-900">
              Move Document to Recycle Bin?
            </h3>
            
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              This document will be moved to the <strong>Recycle Bin (Trash)</strong>. It is <strong>NOT permanently deleted</strong> and can be restored back to Folder {docToDelete.folderCode || '00'} at any time.
            </p>

            <div className="my-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <p className="font-bold text-slate-900 truncate" title={docToDelete.fileName}>
                {docToDelete.fileName}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Folder {docToDelete.folderCode || '00'} &bull; {(docToDelete.fileSize / 1024).toFixed(1)} KB
              </p>
            </div>

            <div className="p-3 bg-sky-50 border border-sky-200 rounded-xl mb-5 flex items-start gap-2 text-xs text-sky-800">
              <ShieldCheck className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
              <div className="text-[11px] leading-relaxed">
                <span className="font-bold block">Safe Recycle Active (Not Permanent)</span>
                Deleted files are stored safely in the Recycle Bin where you or the Human Resource Administrator can review, preview, or restore them anytime.
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDocToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteDocument(docToDelete.id);
                  setDocToDelete(null);
                }}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 transition shadow-sm shadow-amber-500/20 flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Move to Recycle Bin</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
