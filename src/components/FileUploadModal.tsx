import React, { useState, useEffect } from 'react';
import { 
  Upload, 
  X, 
  FileText, 
  Calendar, 
  Hash, 
  Folder, 
  Tag, 
  Check, 
  AlertCircle, 
  Sparkles, 
  FileCheck,
  Eye,
  Maximize2,
  ZoomIn,
  ZoomOut,
  RotateCw,
  RefreshCw,
  FileCheck2,
  ExternalLink,
  ShieldCheck,
  Trash2,
  Layers,
  ChevronLeft,
  ChevronRight,
  Plus,
  Stamp,
  Copy,
  FileBadge
} from 'lucide-react';
import { DocumentItem, FolderDefinition, DocumentCopyType } from '../types';
import { addMonthsToDate, addYearsToDate, getTodayDateString } from '../utils/dateUtils';
import { generateSamplePdfDataUri, generateSamplePageImage } from '../data/seedData';

interface FileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  folders: FolderDefinition[];
  clientId: string;
  clientName: string;
  defaultFolderId?: string;
  editingDoc?: DocumentItem | null;
  onSaveDocument: (doc: DocumentItem) => void;
  onDeleteDocument?: (docId: string) => void;
}

export const FileUploadModal: React.FC<FileUploadModalProps> = ({
  isOpen,
  onClose,
  folders,
  clientId,
  clientName,
  defaultFolderId,
  editingDoc,
  onSaveDocument,
  onDeleteDocument,
}) => {
  const [selectedFolderId, setSelectedFolderId] = useState<string>(
    defaultFolderId || folders[0]?.id || 'folder_01_engagement'
  );
  const [fileName, setFileName] = useState('');
  const [originalFileName, setOriginalFileName] = useState('');
  const [fileType, setFileType] = useState('application/pdf');
  const [fileSize, setFileSize] = useState(0);
  const [fileData, setFileData] = useState('');
  const [pages, setPages] = useState<string[]>([]);
  const [activePageIndex, setActivePageIndex] = useState(0);
  const [copyType, setCopyType] = useState<DocumentCopyType>('Original');
  const [startDate, setStartDate] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [isPermanent, setIsPermanent] = useState(false);
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Live preview interactive controls
  const [previewZoom, setPreviewZoom] = useState(100);
  const [previewRotation, setPreviewRotation] = useState(0);
  const [isFullscreenPreview, setIsFullscreenPreview] = useState(false);

  useEffect(() => {
    if (editingDoc) {
      setSelectedFolderId(editingDoc.folderId);
      setFileName(editingDoc.fileName);
      setOriginalFileName(editingDoc.originalFileName);
      setFileType(editingDoc.fileType);
      setFileSize(editingDoc.fileSize);
      setFileData(editingDoc.fileData);
      setPages(editingDoc.pages && editingDoc.pages.length > 0 ? editingDoc.pages : (editingDoc.fileData ? [editingDoc.fileData] : []));
      setActivePageIndex(0);
      setCopyType(editingDoc.copyType || 'Original');
      setStartDate(editingDoc.startDate || '');
      setExpirationDate(editingDoc.expirationDate || '');
      setIsPermanent(!!editingDoc.isPermanent);
      setReferenceNumber(editingDoc.referenceNumber || '');
      setNotes(editingDoc.notes || '');
    } else {
      setSelectedFolderId(defaultFolderId || folders[0]?.id || 'folder_01_engagement');
      setFileName('');
      setOriginalFileName('');
      setFileType('application/pdf');
      setFileSize(0);
      setFileData('');
      setPages([]);
      setActivePageIndex(0);
      setCopyType('Original');
      setStartDate(getTodayDateString());
      setExpirationDate('');
      setIsPermanent(false);
      setReferenceNumber('');
      setNotes('');
    }
    setPreviewZoom(100);
    setPreviewRotation(0);
    setIsFullscreenPreview(false);
    setErrorMsg('');
  }, [editingDoc, defaultFolderId, folders, isOpen]);

  if (!isOpen) return null;

  const handleFileChange = (fileList: FileList | File[]) => {
    const files = Array.from(fileList);
    if (files.length === 0) return;

    if (files.length === 1) {
      const file = files[0];
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        setFileData(base64);
        setPages((prev) => (prev.length === 0 ? [base64] : [base64, ...prev.slice(1)]));
        setOriginalFileName(file.name);
        if (!fileName || fileName.trim() === '') {
          const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
          setFileName(nameWithoutExt);
        }
        setFileType(file.type || 'application/pdf');
        setFileSize(file.size);
        setErrorMsg('');
      };
      reader.readAsDataURL(file);
    } else {
      // Multiple files uploaded as multi-page document
      const loadedPages: string[] = [];
      let totalSize = 0;
      let loadedCount = 0;

      files.forEach((file, idx) => {
        totalSize += file.size;
        const reader = new FileReader();
        reader.onload = () => {
          loadedPages[idx] = reader.result as string;
          loadedCount++;
          if (loadedCount === files.length) {
            setPages(loadedPages.filter(Boolean));
            setFileData(loadedPages[0]);
            setOriginalFileName(`${files.length} Pages Document (${files[0].name})`);
            if (!fileName || fileName.trim() === '') {
              const nameWithoutExt = files[0].name.replace(/\.[^/.]+$/, '');
              setFileName(`${nameWithoutExt} (${files.length} Pages)`);
            }
            setFileType(files[0].type || 'application/pdf');
            setFileSize(totalSize);
            setActivePageIndex(0);
            setErrorMsg('');
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleAddAdditionalPage = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        setPages((prev) => {
          const updated = [...prev, base64];
          setActivePageIndex(updated.length - 1);
          return updated;
        });
        setFileSize((prev) => prev + file.size);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePage = (indexToRemove: number) => {
    setPages((prev) => {
      const updated = prev.filter((_, i) => i !== indexToRemove);
      if (activePageIndex >= updated.length) {
        setActivePageIndex(Math.max(0, updated.length - 1));
      }
      if (updated.length > 0) {
        setFileData(updated[0]);
      }
      return updated;
    });
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files);
    }
  };

  const handleGenerateSamplePdf = () => {
    const titleToUse = fileName || 'IEN REALTY INC. COMPLIANCE ATTACHMENT';
    const sampleUri = generateSamplePdfDataUri(titleToUse, `Client: ${clientName}`, 3);
    const samplePage1 = generateSamplePageImage(titleToUse, `Client: ${clientName} - Page 1 of 3`, 1, 3);
    const samplePage2 = generateSamplePageImage(titleToUse, `Client: ${clientName} - Page 2 of 3`, 2, 3);
    const samplePage3 = generateSamplePageImage(titleToUse, `Client: ${clientName} - Page 3 of 3`, 3, 3);

    setFileData(sampleUri);
    setPages([samplePage1, samplePage2, samplePage3]);
    setActivePageIndex(0);
    setOriginalFileName(`${titleToUse.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
    if (!fileName) setFileName(titleToUse);
    setFileType('application/pdf');
    setFileSize(420000);
    setErrorMsg('');
  };

  const handlePresetExpiration = (preset: 'none' | '30days' | '6months' | '1year' | '2years' | '5years') => {
    const today = getTodayDateString();
    switch (preset) {
      case 'none':
        setExpirationDate('');
        break;
      case '30days':
        setExpirationDate(addMonthsToDate(1, today));
        break;
      case '6months':
        setExpirationDate(addMonthsToDate(6, today));
        break;
      case '1year':
        setExpirationDate(addYearsToDate(1, today));
        break;
      case '2years':
        setExpirationDate(addYearsToDate(2, today));
        break;
      case '5years':
        setExpirationDate(addYearsToDate(5, today));
        break;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!fileName.trim()) {
      setErrorMsg('Please provide a Document Name / Title.');
      return;
    }

    if (!fileData && pages.length === 0) {
      setErrorMsg('Please upload a file or click "Generate Sample PDF" to preview.');
      return;
    }

    const selectedFolder = folders.find((f) => f.id === selectedFolderId);
    const resolvedPages = pages.length > 0 ? pages : (fileData ? [fileData] : []);

    const docToSave: DocumentItem = {
      id: editingDoc ? editingDoc.id : `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      clientId,
      folderId: selectedFolderId,
      folderCode: selectedFolder?.code || '08',
      fileName: fileName.trim(),
      originalFileName: originalFileName || `${fileName.trim()}.pdf`,
      fileType: fileType || 'application/pdf',
      fileSize: fileSize || 350000,
      fileData: fileData || resolvedPages[0],
      pages: resolvedPages,
      pageCount: resolvedPages.length,
      copyType: copyType,
      uploadedAt: editingDoc ? editingDoc.uploadedAt : new Date().toISOString(),
      startDate: startDate || undefined,
      expirationDate: isPermanent ? undefined : (expirationDate || undefined),
      isPermanent: isPermanent,
      referenceNumber: referenceNumber.trim() || undefined,
      notes: notes.trim() || undefined,
    };

    onSaveDocument(docToSave);
    onClose();
  };

  const currentDisplayData = pages.length > 0 ? pages[activePageIndex] : fileData;
  const isCurrentPdf = currentDisplayData ? (currentDisplayData.startsWith('data:application/pdf') || (!currentDisplayData.startsWith('data:image/') && fileType.includes('pdf'))) : false;
  const isCurrentImage = currentDisplayData ? (currentDisplayData.startsWith('data:image/') || fileType.startsWith('image/')) : false;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className={`bg-white rounded-2xl w-full shadow-2xl overflow-hidden border border-slate-200 my-4 flex flex-col transition-all duration-300 ${
        isFullscreenPreview ? 'max-w-7xl h-[94vh]' : 'max-w-6xl max-h-[94vh]'
      }`}>
        
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sky-500 text-white flex items-center justify-center font-bold shadow-sm">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white">
                {editingDoc ? 'Edit Document & Multi-Page Manager' : 'Insert / Upload Document with Multi-Page Live Preview'}
              </h3>
              <p className="text-xs text-slate-400">
                Client: <span className="text-sky-300 font-semibold">{clientName}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-sky-300 text-xs font-bold rounded-xl border border-slate-700 transition flex items-center gap-1.5"
            >
              <span>&larr; Back</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body: 2-Column Split (Form on Left, Multi-Page Preview on Right) */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-0">
          
          {/* LEFT COLUMN: Metadata Form */}
          <div className="lg:col-span-5 p-5 sm:p-6 overflow-y-auto space-y-4 text-xs border-b lg:border-b-0 lg:border-r border-slate-200 bg-white">
            
            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center gap-2 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Document Copy Type: PHOTOCOPY OR ORIGINAL (BAGONG FEATURE) */}
            <div>
              <label className="block font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Stamp className="w-4 h-4 text-sky-600" />
                  Document Copy Classification <span className="text-rose-500">*</span>
                </span>
                <span className="text-[10px] text-slate-500 font-semibold">Photocopy vs Original</span>
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setCopyType('Original')}
                  className={`p-2.5 rounded-xl border text-left transition flex items-start gap-2 ${
                    copyType === 'Original'
                      ? 'bg-emerald-50/80 border-emerald-500 text-emerald-950 ring-2 ring-emerald-500/20'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                    copyType === 'Original' ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'
                  }`}>
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-extrabold text-xs flex items-center gap-1">
                      <span>Original</span>
                      {copyType === 'Original' && <Check className="w-3 h-3 text-emerald-600 shrink-0" />}
                    </div>
                    <p className="text-[10px] text-slate-500 leading-tight mt-0.5">Wet-ink signed / Official</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setCopyType('Certified True Copy')}
                  className={`p-2.5 rounded-xl border text-left transition flex items-start gap-2 ${
                    copyType === 'Certified True Copy'
                      ? 'bg-purple-50/80 border-purple-500 text-purple-950 ring-2 ring-purple-500/20'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                    copyType === 'Certified True Copy' ? 'bg-purple-600 text-white' : 'bg-slate-200 text-slate-500'
                  }`}>
                    <FileBadge className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-extrabold text-xs flex items-center gap-1">
                      <span>Certified True Copy</span>
                      {copyType === 'Certified True Copy' && <Check className="w-3 h-3 text-purple-600 shrink-0" />}
                    </div>
                    <p className="text-[10px] text-slate-500 leading-tight mt-0.5">SEC/BIR/LGU stamped</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setCopyType('Photocopy')}
                  className={`p-2.5 rounded-xl border text-left transition flex items-start gap-2 ${
                    copyType === 'Photocopy'
                      ? 'bg-amber-50/80 border-amber-500 text-amber-950 ring-2 ring-amber-500/20'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                    copyType === 'Photocopy' ? 'bg-amber-600 text-white' : 'bg-slate-200 text-slate-500'
                  }`}>
                    <Copy className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-extrabold text-xs flex items-center gap-1">
                      <span>Photocopy</span>
                      {copyType === 'Photocopy' && <Check className="w-3 h-3 text-amber-600 shrink-0" />}
                    </div>
                    <p className="text-[10px] text-slate-500 leading-tight mt-0.5">Regular scan / Copy</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setCopyType('Duplicate Copy')}
                  className={`p-2.5 rounded-xl border text-left transition flex items-start gap-2 ${
                    copyType === 'Duplicate Copy'
                      ? 'bg-sky-50/80 border-sky-500 text-sky-950 ring-2 ring-sky-500/20'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                    copyType === 'Duplicate Copy' ? 'bg-sky-600 text-white' : 'bg-slate-200 text-slate-500'
                  }`}>
                    <FileText className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-extrabold text-xs flex items-center gap-1">
                      <span>Duplicate Copy</span>
                      {copyType === 'Duplicate Copy' && <Check className="w-3 h-3 text-sky-600 shrink-0" />}
                    </div>
                    <p className="text-[10px] text-slate-500 leading-tight mt-0.5">Office / Client duplicate</p>
                  </div>
                </button>
              </div>
            </div>

            {/* File Dropzone / Uploader with Multi-Page support */}
            <div>
              <label className="block font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                <span>Select PDF or Multi-Page Scans <span className="text-rose-500">*</span></span>
                {pages.length > 0 && (
                  <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                    <FileCheck2 className="w-3.5 h-3.5" /> {pages.length} {pages.length === 1 ? 'Page' : 'Pages'} Loaded
                  </span>
                )}
              </label>

              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-xl p-3.5 text-center transition ${
                  dragActive
                    ? 'border-sky-500 bg-sky-50/70 ring-2 ring-sky-500/20'
                    : pages.length > 0
                    ? 'border-sky-400 bg-sky-50/30'
                    : 'border-slate-300 hover:border-sky-400 bg-slate-50'
                }`}
              >
                <input
                  type="file"
                  multiple
                  accept="application/pdf,image/*,.doc,.docx,.xls,.xlsx"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      handleFileChange(e.target.files);
                    }
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />

                {pages.length > 0 ? (
                  <div className="flex items-center justify-between gap-2 text-left">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center shrink-0 font-extrabold text-xs">
                        <Layers className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 text-xs truncate max-w-[180px]" title={originalFileName}>
                          {originalFileName || 'Document Attached'}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {pages.length} {pages.length === 1 ? 'Page' : 'Pages'} &bull; {(fileSize / 1024).toFixed(1)} KB &bull; <span className="text-sky-700 font-semibold underline">Click to replace</span>
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleGenerateSamplePdf();
                      }}
                      className="text-[10px] text-slate-500 hover:text-sky-700 bg-white border border-slate-200 px-2 py-1 rounded-md"
                      title="Regenerate Test Multi-Page PDF"
                    >
                      Sample PDF
                    </button>
                  </div>
                ) : (
                  <div>
                    <Upload className="w-6 h-6 text-sky-600 mx-auto mb-1" />
                    <p className="font-bold text-slate-800 text-xs">
                      Drag & drop PDF / Page scans here or <span className="text-sky-600 underline">Browse</span>
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Supports multiple page uploads (PDF, PNG, JPG scans)
                    </p>
                  </div>
                )}
              </div>

              {/* Multi-Page thumbnail strip in form if multiple pages */}
              {pages.length > 1 && (
                <div className="mt-2 p-2 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-slate-700 flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5 text-sky-600" />
                      Document Pages ({pages.length})
                    </span>
                    <label className="text-[10px] font-bold text-sky-700 hover:text-sky-800 cursor-pointer flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-slate-200">
                      <Plus className="w-3 h-3" /> Add Next Page
                      <input
                        type="file"
                        accept="application/pdf,image/*"
                        onChange={handleAddAdditionalPage}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                    {pages.map((p, idx) => (
                      <div
                        key={idx}
                        onClick={() => setActivePageIndex(idx)}
                        className={`relative group shrink-0 cursor-pointer rounded-lg overflow-hidden border-2 transition ${
                          activePageIndex === idx
                            ? 'border-sky-500 ring-2 ring-sky-500/30'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="w-12 h-14 bg-white flex flex-col items-center justify-center p-1 text-[9px] font-bold text-slate-600">
                          <span>Pg {idx + 1}</span>
                          <FileText className="w-3.5 h-3.5 text-slate-400 mt-0.5" />
                        </div>
                        {pages.length > 1 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemovePage(idx);
                            }}
                            className="absolute -top-1 -right-1 bg-rose-600 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition shadow"
                            title="Remove this page"
                          >
                            <X className="w-2.5 h-2.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {pages.length === 0 && (
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">Need a sample compliance file?</span>
                  <button
                    type="button"
                    onClick={handleGenerateSamplePdf}
                    className="text-[11px] font-bold text-sky-700 hover:text-sky-800 bg-sky-50 hover:bg-sky-100 px-2.5 py-1 rounded-md border border-sky-200 inline-flex items-center gap-1 transition"
                  >
                    <Sparkles className="w-3 h-3 text-sky-600" />
                    <span>Generate 3-Page Test PDF</span>
                  </button>
                </div>
              )}
            </div>

            {/* Target Compliance Folder */}
            <div>
              <label className="block font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                <Folder className="w-3.5 h-3.5 text-sky-600" />
                Target Compliance Folder <span className="text-rose-500">*</span>
              </label>
              <select
                value={selectedFolderId}
                onChange={(e) => setSelectedFolderId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-sky-500 focus:bg-white focus:outline-none"
              >
                {folders.map((f) => (
                  <option key={f.id} value={f.id}>
                    Folder {f.code}: {f.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Document Display Name / Rename field */}
            <div>
              <label className="block font-bold text-slate-800 mb-1 flex items-center justify-between">
                <span>Document Display Name / Title <span className="text-rose-500">*</span></span>
                <span className="text-[10px] text-sky-700 font-bold bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200">
                  Renamable
                </span>
              </label>
              <input
                type="text"
                placeholder="e.g. BIR Form 2303 Certificate of Registration 2026.pdf"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-semibold focus:ring-2 focus:ring-sky-500 focus:bg-white focus:outline-none"
                required
              />
            </div>

            {/* Validity Period: START - END & PERMANENT Toggle */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                  <Calendar className="w-3.5 h-3.5 text-sky-600" />
                  Validity Period (Start &ndash; End)
                </label>
                
                {/* Permanent Checkbox Toggle */}
                <label className="flex items-center gap-1.5 cursor-pointer bg-white px-2 py-1 rounded-lg border border-slate-300 hover:border-amber-400 select-none transition">
                  <input
                    type="checkbox"
                    checked={isPermanent}
                    onChange={(e) => {
                      setIsPermanent(e.target.checked);
                      if (e.target.checked) {
                        setExpirationDate('');
                      }
                    }}
                    className="w-3.5 h-3.5 rounded text-amber-600 focus:ring-amber-500 accent-amber-600 cursor-pointer"
                  />
                  <span className="text-[11px] font-black text-amber-900">
                    Permanent / Non-Expiring
                  </span>
                </label>
              </div>

              {/* Start Date & End Date Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <span className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                    Start Date / Date Issued
                  </span>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <span className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                    End Date / Expiration Date
                  </span>
                  {isPermanent ? (
                    <div className="w-full bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-amber-800 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>Permanent (No Expiry)</span>
                    </div>
                  ) : (
                    <input
                      type="date"
                      value={expirationDate}
                      onChange={(e) => setExpirationDate(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    />
                  )}
                </div>
              </div>

              {/* Expiration Presets (Only when not permanent) */}
              {!isPermanent && (
                <div className="flex flex-wrap items-center gap-1 pt-1 border-t border-slate-200">
                  <span className="text-[10px] font-semibold text-slate-400 mr-0.5">Quick Presets:</span>
                  <button
                    type="button"
                    onClick={() => handlePresetExpiration('1year')}
                    className="px-2 py-0.5 rounded bg-white hover:bg-slate-100 border border-slate-200 text-[10px] font-semibold text-slate-700 transition"
                  >
                    +1 Year
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePresetExpiration('2years')}
                    className="px-2 py-0.5 rounded bg-white hover:bg-slate-100 border border-slate-200 text-[10px] font-semibold text-slate-700 transition"
                  >
                    +2 Years
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePresetExpiration('5years')}
                    className="px-2 py-0.5 rounded bg-white hover:bg-slate-100 border border-slate-200 text-[10px] font-semibold text-slate-700 transition"
                  >
                    +5 Years
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsPermanent(true);
                      setExpirationDate('');
                    }}
                    className="px-2 py-0.5 rounded bg-amber-100 hover:bg-amber-200 text-amber-900 text-[10px] font-bold transition border border-amber-300"
                  >
                    Mark Permanent
                  </button>
                </div>
              )}
            </div>

            {/* Reference Number */}
            <div>
              <label className="block font-bold text-slate-800 mb-1 flex items-center gap-1">
                <Hash className="w-3 h-3 text-slate-500" />
                Reference / Permit / Document Number
              </label>
              <input
                type="text"
                placeholder="e.g. BIR-2303-2026 or SEC-CS202100892"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:ring-2 focus:ring-sky-500 focus:bg-white focus:outline-none"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block font-bold text-slate-800 mb-1">
                Internal Remarks & Compliance Notes
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Duly notarized certificate, signed by authorized signatory."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:ring-2 focus:ring-sky-500 focus:bg-white focus:outline-none resize-none"
              />
            </div>

            {/* Action Buttons for Left Column */}
            <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-2">
              {editingDoc && onDeleteDocument ? (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`Move "${editingDoc.fileName}" to the Recycle Bin (Trash)? You can restore it anytime.`)) {
                      onDeleteDocument(editingDoc.id);
                      onClose();
                    }
                  }}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-50 hover:bg-amber-500 hover:text-slate-950 text-amber-800 border border-amber-200 hover:border-amber-500 transition flex items-center gap-1.5 shadow-2xs"
                  title="Move Document to Recycle Bin (Trash)"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Move to Trash</span>
                </button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-sky-500 hover:bg-sky-400 active:bg-sky-600 text-white transition shadow-sm shadow-sky-500/20 flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingDoc ? 'Save Document' : 'Insert Document'}</span>
                </button>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: MULTI-PAGE LIVE PREVIEW VIEWER */}
          <div className="lg:col-span-7 bg-slate-950 flex flex-col overflow-hidden text-slate-100 min-h-[440px]">
            
            {/* Live Preview Toolbar Header */}
            <div className="bg-slate-900 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-sky-400 animate-pulse" />
                <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-sky-400" />
                  Live Document Preview
                </span>
                {copyType && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                    copyType === 'Original' ? 'bg-emerald-950 text-emerald-300 border-emerald-800' :
                    copyType === 'Certified True Copy' ? 'bg-purple-950 text-purple-300 border-purple-800' :
                    copyType === 'Photocopy' ? 'bg-amber-950 text-amber-300 border-amber-800' :
                    'bg-sky-950 text-sky-300 border-sky-800'
                  }`}>
                    {copyType}
                  </span>
                )}
              </div>

              {/* Viewer Tools */}
              {currentDisplayData && (
                <div className="flex items-center gap-1.5">
                  {/* Multi-page navigation if > 1 page */}
                  {pages.length > 1 && (
                    <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700 text-xs mr-1">
                      <button
                        type="button"
                        onClick={() => setActivePageIndex((prev) => Math.max(0, prev - 1))}
                        disabled={activePageIndex === 0}
                        className="p-1 hover:text-sky-400 disabled:opacity-40 text-slate-300 transition"
                        title="Previous Page"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-1.5 font-mono text-[10px] text-sky-300 font-bold">
                        Pg {activePageIndex + 1}/{pages.length}
                      </span>
                      <button
                        type="button"
                        onClick={() => setActivePageIndex((prev) => Math.min(pages.length - 1, prev + 1))}
                        disabled={activePageIndex === pages.length - 1}
                        className="p-1 hover:text-sky-400 disabled:opacity-40 text-slate-300 transition"
                        title="Next Page"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700 text-xs">
                    <button
                      type="button"
                      onClick={() => setPreviewZoom((prev) => Math.max(50, prev - 20))}
                      className="p-1 hover:text-sky-400 text-slate-300 transition"
                      title="Zoom Out"
                    >
                      <ZoomOut className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-1.5 font-mono text-[10px] text-slate-300">{previewZoom}%</span>
                    <button
                      type="button"
                      onClick={() => setPreviewZoom((prev) => Math.min(200, prev + 20))}
                      className="p-1 hover:text-sky-400 text-slate-300 transition"
                      title="Zoom In"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewRotation((prev) => (prev + 90) % 360)}
                      className="p-1 hover:text-sky-400 text-slate-300 transition border-l border-slate-700 ml-0.5"
                      title="Rotate 90°"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsFullscreenPreview((prev) => !prev)}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-sky-400 rounded-lg border border-slate-700 transition"
                    title={isFullscreenPreview ? 'Normal View' : 'Expand Preview'}
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Preview Viewport */}
            <div className="flex-1 bg-slate-950 p-3 sm:p-4 flex items-center justify-center overflow-auto relative">
              {currentDisplayData ? (
                isCurrentImage ? (
                  <div className="flex items-center justify-center w-full h-full overflow-auto">
                    <img
                      src={currentDisplayData}
                      alt={fileName || `Page ${activePageIndex + 1}`}
                      className="max-h-full max-w-full object-contain rounded-xl shadow-2xl border border-slate-800 bg-white"
                      style={{
                        transform: `scale(${previewZoom / 100}) rotate(${previewRotation}deg)`,
                        transformOrigin: 'center center',
                        transition: 'transform 0.15s ease',
                      }}
                    />
                  </div>
                ) : isCurrentPdf ? (
                  <div className="w-full h-full rounded-xl overflow-hidden shadow-2xl border border-slate-800 bg-white flex flex-col">
                    <iframe
                      src={`${currentDisplayData}#toolbar=1&navpanes=0&scrollbar=1&zoom=${previewZoom}`}
                      title={fileName || 'File Preview'}
                      className="w-full flex-1 border-0"
                      style={{
                        transform: `scale(${previewZoom / 100}) rotate(${previewRotation}deg)`,
                        transformOrigin: 'center center',
                        transition: 'transform 0.15s ease',
                      }}
                    />
                  </div>
                ) : (
                  <div className="text-center p-8 bg-slate-900 rounded-2xl border border-slate-800 max-w-sm">
                    <FileText className="w-12 h-12 text-sky-400 mx-auto mb-2" />
                    <p className="font-bold text-white text-xs">{originalFileName}</p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      {(fileSize / 1024).toFixed(1)} KB &bull; Document ready to attach.
                    </p>
                  </div>
                )
              ) : (
                /* Empty Preview Placeholder Guide */
                <div className="text-center p-8 border-2 border-dashed border-slate-800 rounded-2xl max-w-md">
                  <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 text-sky-400 flex items-center justify-center mx-auto mb-3 shadow-inner">
                    <Eye className="w-7 h-7" />
                  </div>
                  <h4 className="font-extrabold text-white text-sm">
                    No File Selected Yet
                  </h4>
                  <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                    Select or drop a PDF document or scan on the left, and its complete live multi-page interactive preview with text, stamps, and layout will display right here.
                  </p>
                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={handleGenerateSamplePdf}
                      className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-md shadow-sky-500/20 transition"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Preview 3-Page Test PDF</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Preview Footer Bar with multi-page tabs */}
            {currentDisplayData && (
              <div className="bg-slate-900 px-4 py-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400 shrink-0">
                <div className="flex items-center gap-2 truncate">
                  <span className="text-slate-500">File:</span>
                  <span className="font-semibold text-slate-200 truncate">{originalFileName || fileName}</span>
                  {pages.length > 1 && (
                    <span className="text-sky-400 font-bold bg-sky-950 px-2 py-0.5 rounded border border-sky-900">
                      Viewing Page {activePageIndex + 1} of {pages.length}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] text-sky-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                    {(fileSize / 1024).toFixed(1)} KB
                  </span>
                </div>
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
};
