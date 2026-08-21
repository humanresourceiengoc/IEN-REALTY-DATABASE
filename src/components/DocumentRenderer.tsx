import React, { useEffect, useState, useRef } from 'react';
import { Loader2, AlertCircle, ExternalLink, Download, FileText, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';
import { renderPdfToPageImages, RenderedPdfPage } from '../utils/pdfRenderer';

interface DocumentRendererProps {
  fileData?: string;
  pages?: string[];
  activePageIndex?: number;
  zoom?: number;
  rotation?: number;
  viewMode?: 'single' | 'continuous';
  fileName?: string;
  onTotalPagesChange?: (count: number, pageDataUrls: string[]) => void;
  onActivePageChange?: (pageIndex: number) => void;
  className?: string;
}

export const DocumentRenderer: React.FC<DocumentRendererProps> = ({
  fileData,
  pages = [],
  activePageIndex = 0,
  zoom = 100,
  rotation = 0,
  viewMode = 'single',
  fileName = 'Document',
  onTotalPagesChange,
  onActivePageChange,
  className = '',
}) => {
  const [renderedPages, setRenderedPages] = useState<string[]>(pages);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const lastRenderedKeyRef = useRef<string>('');

  // Determine if content is PDF
  const isPdf = Boolean(
    fileData && (
      fileData.startsWith('data:application/pdf') ||
      fileData.includes('application/pdf') ||
      (fileData.startsWith('data:') && fileData.includes('JVBERi0')) // %PDF in base64
    )
  );

  const isImage = Boolean(
    fileData && (
      fileData.startsWith('data:image/') ||
      fileData.startsWith('blob:') ||
      (!isPdf && fileData.length > 50)
    )
  );

  useEffect(() => {
    // If we already have explicit pages provided (e.g. image scans or pre-extracted pages)
    if (pages && pages.length > 0) {
      setRenderedPages(pages);
      setErrorMessage(null);
      return;
    }

    if (!fileData) {
      setRenderedPages([]);
      setErrorMessage(null);
      return;
    }

    // Check if it's a PDF needing client-side canvas rendering
    if (isPdf) {
      const currentKey = `${fileData.slice(0, 100)}_${fileData.length}`;
      if (lastRenderedKeyRef.current === currentKey && renderedPages.length > 0) {
        return;
      }
      lastRenderedKeyRef.current = currentKey;

      setIsLoading(true);
      setErrorMessage(null);

      renderPdfToPageImages(fileData, 2.0)
        .then((pagesResult: RenderedPdfPage[]) => {
          const dataUrls = pagesResult.map((p) => p.dataUrl);
          setRenderedPages(dataUrls);
          setIsLoading(false);
          if (onTotalPagesChange) {
            onTotalPagesChange(dataUrls.length, dataUrls);
          }
        })
        .catch((err) => {
          console.warn('PDF.js rendering fallback triggered:', err);
          setIsLoading(false);
          // Fallback: If PDF.js encounters an issue (e.g. encrypted or invalid), provide data URI as single item
          setRenderedPages([fileData]);
          setErrorMessage('Notice: Displaying PDF via standard viewer engine.');
        });
    } else if (isImage) {
      setRenderedPages([fileData]);
      setIsLoading(false);
      setErrorMessage(null);
    } else {
      setRenderedPages([fileData]);
      setIsLoading(false);
    }
  }, [fileData, pages, isPdf, isImage]);

  const handleDownload = () => {
    if (!fileData) return;
    const a = document.createElement('a');
    a.href = fileData;
    a.download = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleOpenNewTab = () => {
    if (!fileData) return;
    const newWindow = window.open();
    if (newWindow) {
      newWindow.document.write(
        `<iframe src="${fileData}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`
      );
    }
  };

  if (!fileData && renderedPages.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center p-8 text-center text-slate-400 ${className}`}>
        <FileText className="w-12 h-12 text-slate-600 mb-3" />
        <p className="text-sm font-semibold text-slate-300">No Document Data</p>
        <p className="text-xs text-slate-500 mt-1">Select or upload a document to view</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={`flex flex-col items-center justify-center p-8 text-center text-slate-300 ${className}`}>
        <div className="relative mb-3">
          <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center animate-pulse">
            <Loader2 className="w-6 h-6 text-sky-400 animate-spin" />
          </div>
        </div>
        <p className="text-sm font-bold text-slate-200">Rendering PDF Document...</p>
        <p className="text-xs text-slate-400 mt-1">Extracting high-resolution pages via PDF engine</p>
      </div>
    );
  }

  const effectivePages = renderedPages.length > 0 ? renderedPages : (fileData ? [fileData] : []);
  const safeActiveIndex = Math.min(Math.max(0, activePageIndex), effectivePages.length - 1);
  const currentDisplaySrc = effectivePages[safeActiveIndex];

  // Check if current display src is an image data URI or native PDF
  const isCurrentSrcImage = currentDisplaySrc?.startsWith('data:image/') || currentDisplaySrc?.startsWith('blob:');
  const isCurrentSrcPdf = currentDisplaySrc?.startsWith('data:application/pdf');

  return (
    <div className={`w-full h-full flex flex-col overflow-hidden relative ${className}`}>
      {errorMessage && (
        <div className="bg-amber-950/80 border-b border-amber-800/80 px-3 py-1.5 text-xs text-amber-200 flex items-center justify-between shrink-0">
          <span className="flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
            {errorMessage}
          </span>
          <button
            onClick={handleOpenNewTab}
            className="text-[11px] underline hover:text-white flex items-center gap-1"
          >
            <ExternalLink className="w-3 h-3" /> Open In Tab
          </button>
        </div>
      )}

      {/* CONTINUOUS VERTICAL SCROLL MODE */}
      {viewMode === 'continuous' && effectivePages.length > 1 ? (
        <div className="flex-1 overflow-y-auto p-4 space-y-6 flex flex-col items-center">
          {effectivePages.map((pageSrc, idx) => (
            <div
              key={idx}
              className="w-full max-w-3xl bg-white rounded-xl p-3 shadow-2xl border border-slate-700/60 flex flex-col items-center"
            >
              <div className="w-full flex items-center justify-between pb-2 mb-2 border-b border-slate-200 text-xs font-bold text-slate-600">
                <span className="text-sky-700">Page {idx + 1} of {effectivePages.length}</span>
                <span className="text-slate-400 font-mono text-[11px]">{fileName}</span>
              </div>

              {pageSrc.startsWith('data:image/') ? (
                <img
                  src={pageSrc}
                  alt={`Page ${idx + 1}`}
                  className="max-w-full h-auto object-contain rounded transition-transform"
                  style={{
                    transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                    transformOrigin: 'top center',
                  }}
                />
              ) : (
                <object
                  data={`${pageSrc}#toolbar=0`}
                  type="application/pdf"
                  className="w-full h-[650px] rounded"
                >
                  <div className="p-6 text-center text-slate-700">
                    <p className="font-bold text-sm">PDF Page {idx + 1}</p>
                    <button
                      onClick={handleDownload}
                      className="mt-2 px-3 py-1.5 bg-sky-600 text-white rounded text-xs font-bold"
                    >
                      Download Document
                    </button>
                  </div>
                </object>
              )}
            </div>
          ))}
        </div>
      ) : (
        /* SINGLE PAGE CAROUSEL / MAIN DISPLAY */
        <div className="flex-1 overflow-auto flex items-center justify-center p-3 relative">
          {isCurrentSrcImage ? (
            <div className="flex items-center justify-center w-full h-full min-h-0 overflow-auto">
              <img
                src={currentDisplaySrc}
                alt={`${fileName} - Page ${safeActiveIndex + 1}`}
                className="max-h-full max-w-full object-contain rounded-xl shadow-2xl bg-white border border-slate-800"
                style={{
                  transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                  transformOrigin: 'center center',
                  transition: 'transform 0.15s ease-out',
                }}
              />
            </div>
          ) : isCurrentSrcPdf ? (
            <div className="w-full h-full rounded-xl overflow-hidden shadow-2xl bg-white border border-slate-800 flex flex-col">
              <object
                data={`${currentDisplaySrc}#toolbar=1&navpanes=0&scrollbar=1&zoom=${zoom}`}
                type="application/pdf"
                className="w-full flex-1 border-0"
              >
                <div className="h-full flex flex-col items-center justify-center p-6 text-slate-800 text-center">
                  <FileText className="w-12 h-12 text-sky-600 mb-2" />
                  <p className="font-bold text-sm">PDF Document Ready</p>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs">
                    If this browser does not support inline PDF object frames, you can open or download it below.
                  </p>
                  <div className="flex items-center gap-2 mt-4">
                    <button
                      onClick={handleOpenNewTab}
                      className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-lg flex items-center gap-1.5"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Open in New Tab
                    </button>
                    <button
                      onClick={handleDownload}
                      className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-lg flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" /> Download
                    </button>
                  </div>
                </div>
              </object>
            </div>
          ) : (
            <div className="text-center p-8 bg-slate-900 rounded-2xl border border-slate-800 max-w-md">
              <FileText className="w-14 h-14 text-sky-400 mx-auto mb-2" />
              <p className="font-bold text-slate-200 text-sm">{fileName}</p>
              <p className="text-xs text-slate-400 mt-1 mb-4">
                Attached file ready for viewing and compliance verification.
              </p>
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={handleDownload}
                  className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs rounded-xl shadow"
                >
                  Download File
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
