import React, { useState } from 'react';
import { 
  Archive, 
  RotateCcw, 
  Trash2, 
  Search, 
  X, 
  FileText, 
  Eye, 
  AlertTriangle, 
  CheckCircle2, 
  Calendar, 
  Folder, 
  Building2,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { DocumentItem, ClientProfile, FolderDefinition } from '../types';
import { formatDateDisplay } from '../utils/dateUtils';

interface RecycleBinModalProps {
  isOpen: boolean;
  onClose: () => void;
  deletedDocuments: DocumentItem[];
  clients: ClientProfile[];
  folders: FolderDefinition[];
  onRestoreDocument: (docId: string) => void;
  onRestoreAllDocuments?: () => void;
  onPermanentlyDeleteDocument: (docId: string) => void;
  onPreviewDocument: (doc: DocumentItem) => void;
  currentClientId?: string | null;
}

export const RecycleBinModal: React.FC<RecycleBinModalProps> = ({
  isOpen,
  onClose,
  deletedDocuments,
  clients,
  folders,
  onRestoreDocument,
  onRestoreAllDocuments,
  onPermanentlyDeleteDocument,
  onPreviewDocument,
  currentClientId,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [scope, setScope] = useState<'current_client' | 'all_clients'>(
    currentClientId ? 'current_client' : 'all_clients'
  );
  const [docToPurge, setDocToPurge] = useState<DocumentItem | null>(null);

  if (!isOpen) return null;

  // Filter based on scope
  const scopedDocs = scope === 'current_client' && currentClientId
    ? deletedDocuments.filter((d) => d.clientId === currentClientId)
    : deletedDocuments;

  // Filter based on search query
  const filteredDocs = scopedDocs.filter((doc) => {
    const client = clients.find((c) => c.id === doc.clientId);
    const clientName = client?.clientName || '';
    const folder = folders.find((f) => f.id === doc.folderId);
    const folderName = folder?.name || '';
    
    return (
      doc.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      folderName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.referenceNumber && doc.referenceNumber.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  const getClientName = (clientId: string) => {
    const c = clients.find((item) => item.id === clientId);
    return c ? c.clientName : 'Unknown Client';
  };

  const getFolderName = (folderId: string, folderCode: string) => {
    const f = folders.find((item) => item.id === folderId);
    return f ? `Folder ${f.code}: ${f.name}` : `Folder ${folderCode || '00'}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 text-slate-900 animate-fade-in overflow-hidden">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center">
              <Archive className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-white">
                  Recycle Bin &amp; Soft-Deleted Vault
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  {scopedDocs.length} Recycled {scopedDocs.length === 1 ? 'Item' : 'Items'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Files are kept safe and non-destructive. Restore files back to original folders anytime.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="Close Recycle Bin"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action & Filter Toolbar */}
        <div className="p-3 sm:p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          
          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search recycled files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8.5 pr-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
            />
          </div>

          {/* Scope Controls & Restore All */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {currentClientId && (
              <div className="flex items-center bg-white rounded-xl border border-slate-200 p-0.5 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setScope('current_client')}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    scope === 'current_client'
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Current Client
                </button>
                <button
                  type="button"
                  onClick={() => setScope('all_clients')}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    scope === 'all_clients'
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All Clients
                </button>
              </div>
            )}

            {filteredDocs.length > 0 && onRestoreAllDocuments && (
              <button
                type="button"
                onClick={onRestoreAllDocuments}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition flex items-center gap-1.5 shadow-2xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restore All</span>
              </button>
            )}
          </div>
        </div>

        {/* Content List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 divide-y divide-slate-100">
          {filteredDocs.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200 text-slate-400 flex items-center justify-center mx-auto mb-3">
                <ShieldCheck className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">
                Recycle Bin is Empty
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                No soft-deleted documents found. All compliance and corporate files are active in their respective folders.
              </p>
            </div>
          ) : (
            filteredDocs.map((doc) => (
              <div
                key={doc.id}
                className="py-3.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 p-2 rounded-xl transition"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 border border-amber-200 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-xs text-slate-900 truncate" title={doc.fileName}>
                        {doc.fileName}
                      </h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                        {getFolderName(doc.folderId, doc.folderCode)}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1 flex-wrap">
                      <span className="flex items-center gap-1 font-semibold text-slate-700">
                        <Building2 className="w-3 h-3 text-slate-400" />
                        {getClientName(doc.clientId)}
                      </span>
                      <span>&bull;</span>
                      <span>{(doc.fileSize / 1024).toFixed(1)} KB</span>
                      {doc.deletedAt && (
                        <>
                          <span>&bull;</span>
                          <span className="text-amber-700 font-medium">
                            Deleted: {formatDateDisplay(doc.deletedAt.split('T')[0])}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                  <button
                    type="button"
                    onClick={() => onPreviewDocument(doc)}
                    className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition flex items-center gap-1 shadow-2xs"
                    title="Preview Document Content"
                  >
                    <Eye className="w-3.5 h-3.5 text-sky-600" />
                    <span>Preview</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onRestoreDocument(doc.id)}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition flex items-center gap-1.5 shadow-2xs"
                    title="Restore Document to Active Folder"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Restore File</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDocToPurge(doc)}
                    className="p-1.5 rounded-xl text-rose-500 hover:bg-rose-50 hover:text-rose-700 border border-transparent hover:border-rose-200 transition"
                    title="Permanently Purge (Cannot be undone)"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Info */}
        <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600 shrink-0">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span className="text-[11px]">
              Non-permanent deletion enabled. Documents are never lost unless explicitly purged.
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold transition text-xs"
          >
            Close
          </button>
        </div>

        {/* PERMANENT PURGE CONFIRMATION MODAL */}
        {docToPurge && (
          <div className="fixed inset-0 z-60 bg-slate-950/85 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-slate-900 animate-fade-in">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mb-4 border border-rose-200">
                <AlertTriangle className="w-6 h-6" />
              </div>

              <h3 className="text-base font-extrabold text-slate-900">
                Permanently Purge Document?
              </h3>
              
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Are you completely sure you want to permanently erase <strong>"{docToPurge.fileName}"</strong>? This will permanently delete the binary file and cannot be undone.
              </p>

              <div className="my-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <p className="font-bold text-slate-900 truncate">
                  {docToPurge.fileName}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Client: {getClientName(docToPurge.clientId)} &bull; {(docToPurge.fileSize / 1024).toFixed(1)} KB
                </p>
              </div>

              <div className="flex items-center justify-end gap-2.5 mt-5">
                <button
                  type="button"
                  onClick={() => setDocToPurge(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
                >
                  Cancel (Keep in Recycle Bin)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onPermanentlyDeleteDocument(docToPurge.id);
                    setDocToPurge(null);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white transition shadow-sm shadow-rose-600/20 flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Purge Forever</span>
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
