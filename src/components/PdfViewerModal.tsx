import React, { useState } from 'react';
import { 
  X, 
  Download, 
  Printer, 
  Maximize2, 
  FileText, 
  Calendar, 
  Hash, 
  Folder, 
  Clock, 
  AlertTriangle,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Edit3,
  Send,
  RotateCcw,
  ShieldCheck,
  Archive,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Layers,
  ChevronLeft,
  ChevronRight,
  Stamp,
  Copy,
  FileBadge,
  LayoutGrid,
  ScrollText,
  FileCheck2
} from 'lucide-react';
import { DocumentItem, FolderDefinition } from '../types';
import { calculateDaysRemaining, formatDateDisplay, formatRemainingDaysText, getUrgencySeverity } from '../utils/dateUtils';
import { TRANSMITTAL_STATUS_CONFIG } from '../utils/transmittalUtils';
import { DocumentRenderer } from './DocumentRenderer';

interface PdfViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: DocumentItem | null;
  folder?: FolderDefinition;
  onEditDocument: (doc: DocumentItem) => void;
  onDeleteDocument?: (docId: string) => void;
  onOpenTransmittal?: (doc: DocumentItem) => void;
}

export const PdfViewerModal: React.FC<PdfViewerModalProps> = ({
  isOpen,
  onClose,
  document: doc,
  folder,
  onEditDocument,
  onDeleteDocument,
  onOpenTransmittal,
}) => {
  const [zoomLevel, setZoomLevel] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [activePageIndex, setActivePageIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'single' | 'continuous'>('single');
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  if (!isOpen || !doc) return null;

  const daysRemaining = calculateDaysRemaining(doc.expirationDate);
  const urgency = getUrgencySeverity(daysRemaining);
  const transmittal = doc.transmittal;
  const transStatus = transmittal?.status || 'in_custody';
  const transConfig = TRANSMITTAL_STATUS_CONFIG[transStatus];

  // Resolve pages array
  const pagesList: string[] = (doc.pages && doc.pages.length > 0)
    ? doc.pages
    : (doc.fileData ? [doc.fileData] : []);
  
  const totalPages = pagesList.length || doc.pageCount || 1;
  const currentPageData = pagesList[activePageIndex] || doc.fileData;

  const copyType = doc.copyType || 'Original';

  const handleConfirmDelete = () => {
    if (onDeleteDocument && doc) {
      onDeleteDocument(doc.id);
      setShowConfirmDelete(false);
      onClose();
    }
  };

  const handleDownload = () => {
    const link = window.document.createElement('a');
    link.href = doc.fileData;
    link.download = doc.fileName.endsWith('.pdf') ? doc.fileName : `${doc.fileName}.pdf`;
    window.document.body.appendChild(link);
    link.click();
    window.document.body.removeChild(link);
  };

  const handlePrint = () => {
    try {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        if (pagesList.length > 1) {
          // Multi-page print layout
          const pagesHtml = pagesList.map((pageSrc, idx) => `
            <div style="page-break-after: always; display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:100vh; padding:20px; box-sizing:border-box;">
              ${pageSrc.startsWith('data:application/pdf')
                ? `<iframe src="${pageSrc}" style="width:100%; height:90vh; border:none;"></iframe>`
                : `<img src="${pageSrc}" style="max-width:100%; max-height:92vh; object-fit:contain;" />`
              }
              <p style="font-family:sans-serif; font-size:12px; color:#666; margin-top:10px;">Page ${idx + 1} of ${pagesList.length} - ${doc.fileName}</p>
            </div>
          `).join('');

          printWindow.document.write(`
            <html>
              <head>
                <title>${doc.fileName} (${pagesList.length} Pages)</title>
                <style>
                  @page { size: auto; margin: 10mm; }
                  body { margin: 0; padding: 0; background: white; }
                </style>
              </head>
              <body>
                ${pagesHtml}
              </body>
            </html>
          `);
        } else if (doc.fileType.includes('pdf') || doc.fileData.startsWith('data:application/pdf')) {
          printWindow.document.write(`
            <html>
              <head><title>${doc.fileName}</title></head>
              <body style="margin:0;padding:0;">
                <iframe src="${doc.fileData}" style="width:100vw;height:100vh;border:none;"></iframe>
              </body>
            </html>
          `);
        } else {
          printWindow.document.write(`
            <html>
              <head><title>${doc.fileName}</title></head>
              <body style="margin:0;display:flex;align-items:center;justify-content:center;min-height:100vh;">
                <img src="${doc.fileData}" style="max-width:100%;height:auto;" />
              </body>
            </html>
          `);
        }
        printWindow.document.close();
        setTimeout(() => {
          try {
            printWindow.print();
          } catch {
            // print blocked
          }
        }, 500);
      } else {
        handleDownload();
      }
    } catch {
      handleDownload();
    }
  };

  const isCurrentPagePdf = currentPageData ? (currentPageData.startsWith('data:application/pdf') || (!currentPageData.startsWith('data:image/') && doc.fileType.includes('pdf'))) : false;
  const isCurrentPageImage = currentPageData ? (currentPageData.startsWith('data:image/') || doc.fileType.startsWith('image/')) : false;

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-4 animate-fadeIn">
      <div className="bg-slate-900 rounded-2xl max-w-7xl w-full h-[94vh] shadow-2xl flex flex-col overflow-hidden border border-slate-800 text-slate-100">
        
        {/* Top Control Bar with App Branding & Back Navigation */}
        <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex items-center justify-between gap-4 flex-wrap shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={onClose}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 hover:text-white flex items-center gap-1.5 transition shrink-0"
              title="Return to Master List & Documents"
            >
              <span>&larr; Back</span>
            </button>

            <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-sky-400 bg-sky-950/80 px-2 py-0.5 rounded border border-sky-800/50">
                  IEN REALTY INC.
                </span>
                
                {/* Copy Type Classification Badge */}
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 ${
                  copyType === 'Original' ? 'bg-emerald-950 text-emerald-300 border-emerald-800' :
                  copyType === 'Certified True Copy' ? 'bg-purple-950 text-purple-300 border-purple-800' :
                  copyType === 'Photocopy' ? 'bg-amber-950 text-amber-300 border-amber-800' :
                  'bg-sky-950 text-sky-300 border-sky-800'
                }`}>
                  {copyType === 'Original' && <ShieldCheck className="w-3 h-3 text-emerald-400" />}
                  {copyType === 'Certified True Copy' && <FileBadge className="w-3 h-3 text-purple-400" />}
                  {copyType === 'Photocopy' && <Copy className="w-3 h-3 text-amber-400" />}
                  {copyType === 'Duplicate Copy' && <FileText className="w-3 h-3 text-sky-400" />}
                  <span>{copyType}</span>
                </span>

                {/* Page Count Badge */}
                <span className="text-[10px] font-bold bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700 flex items-center gap-1">
                  <Layers className="w-3 h-3 text-sky-400" />
                  <span>{totalPages} {totalPages === 1 ? 'Page' : 'Pages'}</span>
                </span>

                <span className="text-[11px] text-slate-400 hidden md:inline">
                  Folder {doc.folderCode || folder?.code}: {folder?.name || 'Compliance File'} &bull; {(doc.fileSize / 1024).toFixed(1)} KB
                </span>
              </div>
              <h3 className="font-bold text-sm sm:text-base text-white truncate max-w-md sm:max-w-xl mt-0.5" title={doc.fileName}>
                {doc.fileName}
              </h3>
            </div>
          </div>

          {/* Quick Tool Actions */}
          <div className="flex items-center gap-2 shrink-0">
            
            {/* Transmittal Action Button */}
            {onOpenTransmittal && (
              <button
                onClick={() => onOpenTransmittal(doc)}
                className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500 hover:text-slate-950 text-amber-300 border border-amber-500/40 text-xs font-bold transition flex items-center gap-1.5"
                title="Manage Document Transmittal & Return Slip"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Transmittal Slip / Status</span>
              </button>
            )}

            {/* Multi-Page Pagination Controls if > 1 page */}
            {totalPages > 1 && (
              <div className="flex items-center bg-slate-800 rounded-xl p-0.5 border border-slate-700 text-xs">
                <button
                  onClick={() => setActivePageIndex((prev) => Math.max(0, prev - 1))}
                  disabled={activePageIndex === 0}
                  className="p-1.5 hover:text-sky-400 disabled:opacity-30 text-slate-300 transition"
                  title="Previous Page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-2 font-mono text-[11px] text-sky-300 font-bold">
                  Page {activePageIndex + 1} of {totalPages}
                </span>
                <button
                  onClick={() => setActivePageIndex((prev) => Math.min(totalPages - 1, prev + 1))}
                  disabled={activePageIndex === totalPages - 1}
                  className="p-1.5 hover:text-sky-400 disabled:opacity-30 text-slate-300 transition"
                  title="Next Page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>

                {/* View Mode Toggle: Single Page vs Continuous Vertical */}
                <div className="border-l border-slate-700 pl-1 ml-1 flex items-center gap-0.5">
                  <button
                    onClick={() => setViewMode('single')}
                    className={`p-1 rounded transition ${viewMode === 'single' ? 'bg-sky-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
                    title="Single Page Carousel View"
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setViewMode('continuous')}
                    className={`p-1 rounded transition ${viewMode === 'continuous' ? 'bg-sky-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
                    title="Continuous Multi-Page Vertical Scroll"
                  >
                    <ScrollText className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Zoom Controls */}
            <div className="hidden sm:flex items-center bg-slate-800 rounded-xl p-0.5 border border-slate-700 text-xs">
              <button
                onClick={() => setZoomLevel((prev) => Math.max(50, prev - 25))}
                className="p-1.5 hover:text-sky-400 text-slate-300 transition"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="px-2 font-mono text-[11px]">{zoomLevel}%</span>
              <button
                onClick={() => setZoomLevel((prev) => Math.min(200, prev + 25))}
                className="p-1.5 hover:text-sky-400 text-slate-300 transition"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setRotation((prev) => (prev + 90) % 360)}
                className="p-1.5 hover:text-sky-400 text-slate-300 transition border-l border-slate-700 ml-1"
                title="Rotate 90°"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Edit details */}
            <button
              onClick={() => {
                onClose();
                onEditDocument(doc);
              }}
              className="px-3 py-1.5 bg-sky-600/20 hover:bg-sky-600 text-sky-300 hover:text-white rounded-xl transition border border-sky-500/40 text-xs font-bold flex items-center gap-1.5 shadow-2xs"
              title="Edit Document Info & Expiration"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit File</span>
            </button>

            {/* Erase / Delete File */}
            {onDeleteDocument && (
              <button
                onClick={() => setShowConfirmDelete(true)}
                className="px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white rounded-xl transition border border-rose-500/40 text-xs font-bold flex items-center gap-1.5 shadow-2xs"
                title="Erase / Delete Document"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Erase File</span>
              </button>
            )}

            {/* Print */}
            <button
              onClick={handlePrint}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition border border-slate-700"
              title="Print Document (All Pages)"
            >
              <Printer className="w-4 h-4" />
            </button>

            {/* Download */}
            <button
              onClick={handleDownload}
              className="px-3.5 py-2 bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-sm"
              title="Download PDF file"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Download</span>
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition ml-1"
              title="Close (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body: Preview & Metadata Sidebar */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0">
          
          {/* Main Viewer Area (Supports Continuous Vertical Scroll & Single Page Carousel) */}
          <div className="flex-1 bg-slate-950 flex flex-col overflow-hidden relative">
            
            {/* Viewport content */}
            <div className="flex-1 p-2 sm:p-4 overflow-auto flex items-center justify-center">
              <DocumentRenderer
                fileData={doc.fileData}
                pages={pagesList}
                activePageIndex={activePageIndex}
                zoom={zoomLevel}
                rotation={rotation}
                viewMode={viewMode}
                fileName={doc.fileName}
                onTotalPagesChange={(count, pageDataUrls) => {
                  // If extra pages were extracted by PDF.js, update parent state
                }}
                onActivePageChange={(idx) => setActivePageIndex(idx)}
              />
            </div>

            {/* Bottom Multi-Page Thumbnail Strip */}
            {pagesList.length > 1 && (
              <div className="bg-slate-900 px-4 py-2.5 border-t border-slate-800 flex items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-2 overflow-x-auto py-1">
                  <span className="text-[11px] font-bold text-slate-400 whitespace-nowrap flex items-center gap-1 mr-1">
                    <Layers className="w-3.5 h-3.5 text-sky-400" />
                    Pages ({pagesList.length}):
                  </span>
                  {pagesList.map((p, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setActivePageIndex(idx);
                        if (viewMode === 'continuous') setViewMode('single');
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
                        activePageIndex === idx
                          ? 'bg-sky-600 text-white shadow-md ring-2 ring-sky-400/40'
                          : 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700'
                      }`}
                    >
                      <span>Page {idx + 1}</span>
                      {activePageIndex === idx && <CheckCircle2 className="w-3 h-3 text-white" />}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[11px] text-slate-400 font-mono">
                    Viewing Page {activePageIndex + 1} of {pagesList.length}
                  </span>
                </div>
              </div>
            )}

          </div>

          {/* Document Details Sidebar */}
          <div className="w-full lg:w-80 bg-slate-900 border-t lg:border-t-0 lg:border-l border-slate-800 p-4 sm:p-5 overflow-y-auto space-y-4 text-xs shrink-0">
            <h4 className="font-bold text-sky-400 uppercase tracking-wider text-[11px] flex items-center justify-between">
              <span>Document Metadata & Custody</span>
              <span className="text-[10px] text-slate-400 font-mono">{totalPages} Pg</span>
            </h4>

            {/* Document Copy Classification (BAGONG FEATURE: Original vs Photocopy) */}
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Stamp className="w-3.5 h-3.5 text-sky-400" />
                Document Copy Classification
              </span>

              <div className={`p-2.5 rounded-xl border flex items-center gap-2.5 ${
                copyType === 'Original' ? 'bg-emerald-950/60 border-emerald-800/80 text-emerald-200' :
                copyType === 'Certified True Copy' ? 'bg-purple-950/60 border-purple-800/80 text-purple-200' :
                copyType === 'Photocopy' ? 'bg-amber-950/60 border-amber-800/80 text-amber-200' :
                'bg-sky-950/60 border-sky-800/80 text-sky-200'
              }`}>
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                  copyType === 'Original' ? 'bg-emerald-600 text-white' :
                  copyType === 'Certified True Copy' ? 'bg-purple-600 text-white' :
                  copyType === 'Photocopy' ? 'bg-amber-600 text-white' :
                  'bg-sky-600 text-white'
                }`}>
                  {copyType === 'Original' ? <ShieldCheck className="w-4 h-4" /> :
                   copyType === 'Certified True Copy' ? <FileBadge className="w-4 h-4" /> :
                   copyType === 'Photocopy' ? <Copy className="w-4 h-4" /> :
                   <FileText className="w-4 h-4" />}
                </div>
                <div>
                  <span className="font-extrabold text-xs block">{copyType}</span>
                  <p className="text-[10px] opacity-80">
                    {copyType === 'Original' ? 'Original wet-ink / official record' :
                     copyType === 'Certified True Copy' ? 'SEC / BIR / LGU certified copy' :
                     copyType === 'Photocopy' ? 'Regular photocopy / office duplicate' :
                     'Office duplicate archive'}
                  </p>
                </div>
              </div>
            </div>

            {/* Transmittal Status Card */}
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Transmittal / Custody
                </span>
                {onOpenTransmittal && (
                  <button
                    onClick={() => onOpenTransmittal(doc)}
                    className="text-[10px] text-amber-400 hover:text-amber-300 font-bold underline"
                  >
                    Update / Return
                  </button>
                )}
              </div>

              <div className={`p-2.5 rounded-lg border flex items-center gap-2.5 ${transConfig.badgeBg} ${transConfig.badgeBorder} ${transConfig.badgeText}`}>
                {transStatus === 'transmitted' ? (
                  <Send className="w-4 h-4 text-amber-600 animate-pulse shrink-0" />
                ) : transStatus === 'returned' ? (
                  <RotateCcw className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : transStatus === 'acknowledged' ? (
                  <ShieldCheck className="w-4 h-4 text-sky-600 shrink-0" />
                ) : (
                  <Archive className="w-4 h-4 text-slate-500 shrink-0" />
                )}
                <div>
                  <span className="font-bold text-xs block">{transConfig.label}</span>
                  <p className="text-[10px] opacity-90">{transConfig.description}</p>
                </div>
              </div>

              {transmittal && transmittal.status !== 'in_custody' && (
                <div className="mt-2.5 space-y-1.5 text-[11px] text-slate-300 border-t border-slate-800/80 pt-2">
                  {transmittal.currentTransmittalNo && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Control #:</span>
                      <span className="font-mono font-semibold text-amber-300">{transmittal.currentTransmittalNo}</span>
                    </div>
                  )}
                  {transmittal.transmittedTo && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Recipient:</span>
                      <span className="font-semibold text-slate-200">{transmittal.transmittedTo}</span>
                    </div>
                  )}
                  {transmittal.transmittedDate && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Sent Date:</span>
                      <span>{formatDateDisplay(transmittal.transmittedDate)}</span>
                    </div>
                  )}
                  {transmittal.carrier && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Handled By:</span>
                      <span>{transmittal.carrier}</span>
                    </div>
                  )}
                  {transmittal.returnedDate && (
                    <div className="flex justify-between text-emerald-400 font-semibold">
                      <span>Returned On:</span>
                      <span>{formatDateDisplay(transmittal.returnedDate)}</span>
                    </div>
                  )}
                </div>
              )}

              {onOpenTransmittal && (
                <button
                  onClick={() => onOpenTransmittal(doc)}
                  className="w-full mt-2.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500 hover:text-slate-950 text-amber-300 text-xs font-bold transition flex items-center justify-center gap-1.5 border border-amber-500/40"
                >
                  <Send className="w-3 h-3" />
                  <span>Generate Slip / Update Status</span>
                </button>
              )}
            </div>

            {/* Expiration Status Box */}
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Document Expiration Date
              </span>
              {doc.expirationDate ? (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-200">
                      {formatDateDisplay(doc.expirationDate)}
                    </span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      urgency === 'expired'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        : urgency === 'urgent'
                        ? 'bg-rose-500/20 text-rose-300'
                        : urgency === 'warning'
                        ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                        : 'bg-emerald-500/20 text-emerald-300'
                    }`}>
                      {formatRemainingDaysText(daysRemaining)}
                    </span>
                  </div>
                  {urgency === 'expired' && (
                    <p className="text-[11px] font-bold text-rose-400 flex items-center gap-1 mt-1">
                      <AlertTriangle className="w-3 h-3 text-rose-400" />
                      Document has expired! Renewal required.
                    </p>
                  )}
                </div>
              ) : (
                <span className="text-slate-400 italic">No Expiration / Permanent File</span>
              )}
            </div>

            {/* Reference Number */}
            {doc.referenceNumber && (
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                  Registration / Permit No.
                </span>
                <span className="font-mono font-bold text-sky-300 text-xs">
                  {doc.referenceNumber}
                </span>
              </div>
            )}

            {/* Folder & Category */}
            <div className="space-y-2">
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Assigned Folder</span>
                <span className="font-semibold text-slate-200">
                  Folder {doc.folderCode || folder?.code}: {folder?.name || 'General'}
                </span>
              </div>

              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Uploaded Timestamp</span>
                <span className="text-slate-300">{formatDateDisplay(doc.uploadedAt)}</span>
              </div>

              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block">File Type / Pages</span>
                <span className="text-slate-300 font-mono text-[11px] truncate block">
                  {doc.originalFileName} ({totalPages} {totalPages === 1 ? 'Page' : 'Pages'})
                </span>
              </div>
            </div>

            {/* Tags */}
            {doc.tags && doc.tags.length > 0 && (
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block mb-1">Tags</span>
                <div className="flex flex-wrap gap-1">
                  {doc.tags.map((t, idx) => (
                    <span key={idx} className="bg-slate-800 text-sky-300 text-[10px] px-2 py-0.5 rounded border border-slate-700">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            {doc.notes && (
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Internal Remarks
                </span>
                <p className="text-slate-300 leading-relaxed text-[11px]">{doc.notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CONFIRM ERASE / DELETE MODAL */}
      {showConfirmDelete && (
        <div className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-slate-900 animate-fade-in">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mb-4 border border-amber-200">
              <Trash2 className="w-6 h-6" />
            </div>

            <h3 className="text-base font-extrabold text-slate-900">
              Move Document to Recycle Bin?
            </h3>
            
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Are you sure you want to move this file to the <strong>Recycle Bin (Trash)</strong>? It will <strong>NOT be permanently deleted</strong> and can be restored back to its folder anytime.
            </p>

            <div className="my-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <p className="font-bold text-slate-900 truncate" title={doc.fileName}>
                {doc.fileName}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Folder {doc.folderCode || folder?.code || '00'} &bull; {(doc.fileSize / 1024).toFixed(1)} KB &bull; {copyType}
              </p>
            </div>

            <p className="text-[11px] text-sky-700 bg-sky-50 p-2.5 rounded-xl border border-sky-200 font-semibold flex items-center gap-1.5 mb-5">
              <CheckCircle2 className="w-4 h-4 text-sky-600 shrink-0" />
              <span>Safe Recycle: File can be restored from the Recycle Bin anytime.</span>
            </p>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowConfirmDelete(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
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

