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
  Trash2
} from 'lucide-react';
import { DocumentItem, FolderDefinition } from '../types';
import { addMonthsToDate, addYearsToDate, getTodayDateString } from '../utils/dateUtils';
import { generateSamplePdfDataUri } from '../data/seedData';

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
  const [expirationDate, setExpirationDate] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [tagsInput, setTagsInput] = useState('');
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
      setExpirationDate(editingDoc.expirationDate || '');
      setReferenceNumber(editingDoc.referenceNumber || '');
      setNotes(editingDoc.notes || '');
      setTagsInput(editingDoc.tags ? editingDoc.tags.join(', ') : '');
    } else {
      setSelectedFolderId(defaultFolderId || folders[0]?.id || 'folder_01_engagement');
      setFileName('');
      setOriginalFileName('');
      setFileType('application/pdf');
      setFileSize(0);
      setFileData('');
      setExpirationDate('');
      setReferenceNumber('');
      setNotes('');
      setTagsInput('');
    }
    setPreviewZoom(100);
    setPreviewRotation(0);
    setIsFullscreenPreview(false);
    setErrorMsg('');
  }, [editingDoc, defaultFolderId, folders, isOpen]);

  if (!isOpen) return null;

  const handleFileChange = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setFileData(base64);
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
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleGenerateSamplePdf = () => {
    const titleToUse = fileName || 'IEN REALTY INC. COMPLIANCE ATTACHMENT';
    const sampleUri = generateSamplePdfDataUri(titleToUse, `Client: ${clientName}`);
    setFileData(sampleUri);
    setOriginalFileName(`${titleToUse.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
    if (!fileName) setFileName(titleToUse);
    setFileType('application/pdf');
    setFileSize(350000);
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

    if (!fileData) {
      setErrorMsg('Please upload a file or click "Generate Sample PDF" to preview.');
      return;
    }

    const selectedFolder = folders.find((f) => f.id === selectedFolderId);
    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const docToSave: DocumentItem = {
      id: editingDoc ? editingDoc.id : `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      clientId,
      folderId: selectedFolderId,
      folderCode: selectedFolder?.code || '08',
      fileName: fileName.trim(),
      originalFileName: originalFileName || `${fileName.trim()}.pdf`,
      fileType: fileType || 'application/pdf',
      fileSize: fileSize || 350000,
      fileData,
      uploadedAt: editingDoc ? editingDoc.uploadedAt : new Date().toISOString(),
      expirationDate: expirationDate || undefined,
      referenceNumber: referenceNumber.trim() || undefined,
      notes: notes.trim() || undefined,
      tags: tags.length > 0 ? tags : undefined,
    };

    onSaveDocument(docToSave);
    onClose();
  };

  const isPdf = fileType.includes('pdf') || fileData.startsWith('data:application/pdf');
  const isImage = fileType.startsWith('image/') || fileData.startsWith('data:image/');

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className={`bg-white rounded-2xl w-full shadow-2xl overflow-hidden border border-slate-200 my-4 flex flex-col transition-all duration-300 ${
        isFullscreenPreview ? 'max-w-7xl h-[94vh]' : 'max-w-5xl max-h-[92vh]'
      }`}>
        
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sky-500 text-white flex items-center justify-center font-bold shadow-sm">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white">
                {editingDoc ? 'Edit Document & Inspect File' : 'Insert / Upload Document with Live Preview'}
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

        {/* Modal Body: 2-Column Split (Form on Left, Live PDF/File Preview on Right) */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-0">
          
          {/* LEFT COLUMN: Metadata Form */}
          <div className="lg:col-span-5 p-5 sm:p-6 overflow-y-auto space-y-4 text-xs border-b lg:border-b-0 lg:border-r border-slate-200 bg-white">
            
            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center gap-2 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* File Dropzone / Uploader */}
            <div>
              <label className="block font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                <span>Select or Drop PDF File <span className="text-rose-500">*</span></span>
                {fileData && (
                  <span className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
                    <FileCheck2 className="w-3.5 h-3.5" /> File Loaded
                  </span>
                )}
              </label>

              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-xl p-4 text-center transition ${
                  dragActive
                    ? 'border-sky-500 bg-sky-50/70 ring-2 ring-sky-500/20'
                    : fileData
                    ? 'border-sky-400 bg-sky-50/30'
                    : 'border-slate-300 hover:border-sky-400 bg-slate-50'
                }`}
              >
                <input
                  type="file"
                  accept="application/pdf,image/*,.doc,.docx,.xls,.xlsx"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileChange(e.target.files[0]);
                    }
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />

                {fileData ? (
                  <div className="flex items-center justify-between gap-2 text-left">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 text-xs truncate max-w-[200px]" title={originalFileName}>
                          {originalFileName || 'Document Attached'}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {(fileSize / 1024).toFixed(1)} KB &bull; <span className="text-sky-700 font-semibold underline">Click to change</span>
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
                      title="Regenerate Test PDF"
                    >
                      Sample PDF
                    </button>
                  </div>
                ) : (
                  <div>
                    <Upload className="w-6 h-6 text-sky-600 mx-auto mb-1" />
                    <p className="font-bold text-slate-800 text-xs">
                      Drag & drop PDF here or <span className="text-sky-600 underline">Browse</span>
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Supports PDF, PNG, JPG, Word & Excel files
                    </p>
                  </div>
                )}
              </div>

              {!fileData && (
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">Need a sample compliance file?</span>
                  <button
                    type="button"
                    onClick={handleGenerateSamplePdf}
                    className="text-[11px] font-bold text-sky-700 hover:text-sky-800 bg-sky-50 hover:bg-sky-100 px-2.5 py-1 rounded-md border border-sky-200 inline-flex items-center gap-1 transition"
                  >
                    <Sparkles className="w-3 h-3 text-sky-600" />
                    <span>Generate Test PDF</span>
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

            {/* Document Display Name */}
            <div>
              <label className="block font-bold text-slate-800 mb-1 flex items-center justify-between">
                <span>Document Display Name / Title <span className="text-rose-500">*</span></span>
                <span className="text-[10px] text-slate-400 font-normal">Editable anytime</span>
              </label>
              <input
                type="text"
                placeholder="e.g. BIR Form 2303 Certificate of Registration 2026.pdf"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-sky-500 focus:bg-white focus:outline-none"
                required
              />
            </div>

            {/* Document Expiration Date with Fast Presets */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between mb-1.5">
                <label className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                  <Calendar className="w-3.5 h-3.5 text-sky-600" />
                  Document Expiration Date
                </label>
                <span className="text-[10px] font-semibold text-sky-700">
                  Deadline alert tracking
                </span>
              </div>

              <input
                type="date"
                value={expirationDate}
                onChange={(e) => setExpirationDate(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />

              {/* Fast Expiration Presets */}
              <div className="flex flex-wrap items-center gap-1 mt-2">
                <span className="text-[10px] font-semibold text-slate-400 mr-0.5">Presets:</span>
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
                  onClick={() => handlePresetExpiration('none')}
                  className="px-2 py-0.5 rounded bg-slate-200 hover:bg-slate-300 text-[10px] font-semibold text-slate-700 transition"
                >
                  No Expiration
                </button>
              </div>
            </div>

            {/* Reference Number & Tags */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block font-bold text-slate-800 mb-1 flex items-center gap-1">
                  <Hash className="w-3 h-3 text-slate-500" />
                  Reference / Permit No.
                </label>
                <input
                  type="text"
                  placeholder="e.g. BIR-2303-2026"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:ring-2 focus:ring-sky-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1 flex items-center gap-1">
                  <Tag className="w-3 h-3 text-slate-500" />
                  Category Tags
                </label>
                <input
                  type="text"
                  placeholder="e.g. Tax, LGU, Audit"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:ring-2 focus:ring-sky-500 focus:bg-white focus:outline-none"
                />
              </div>
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

          {/* RIGHT COLUMN: LIVE FILE PREVIEW VIEWER (DPAT NA VIVIEW UNG FILE NA ILALAGAY) */}
          <div className="lg:col-span-7 bg-slate-950 flex flex-col overflow-hidden text-slate-100 min-h-[420px]">
            
            {/* Live Preview Toolbar Header */}
            <div className="bg-slate-900 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-sky-400 animate-pulse" />
                <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-sky-400" />
                  Live Document Preview
                </span>
                {fileData && (
                  <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md border border-slate-700">
                    {isPdf ? 'PDF Format' : isImage ? 'Image Scan' : 'Attachment'}
                  </span>
                )}
              </div>

              {/* Viewer Tools */}
              {fileData && (
                <div className="flex items-center gap-1.5">
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
              {fileData ? (
                isPdf ? (
                  <div className="w-full h-full rounded-xl overflow-hidden shadow-2xl border border-slate-800 bg-white flex flex-col">
                    <iframe
                      src={`${fileData}#toolbar=1&navpanes=0&scrollbar=1&zoom=${previewZoom}`}
                      title={fileName || 'File Preview'}
                      className="w-full flex-1 border-0"
                      style={{
                        transform: `scale(${previewZoom / 100}) rotate(${previewRotation}deg)`,
                        transformOrigin: 'center center',
                        transition: 'transform 0.15s ease',
                      }}
                    />
                  </div>
                ) : isImage ? (
                  <div className="flex items-center justify-center w-full h-full overflow-auto">
                    <img
                      src={fileData}
                      alt={fileName || 'Preview'}
                      className="max-h-full max-w-full object-contain rounded-xl shadow-2xl border border-slate-800 bg-white"
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
                    Select or drop a PDF document on the left, and its complete live interactive preview with text, stamps, and layout will display right here.
                  </p>
                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={handleGenerateSamplePdf}
                      className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-md shadow-sky-500/20 transition"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Preview Sample Test PDF</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Preview Footer Bar */}
            {fileData && (
              <div className="bg-slate-900 px-4 py-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400 shrink-0">
                <div className="flex items-center gap-2 truncate">
                  <span className="text-slate-500">File:</span>
                  <span className="font-semibold text-slate-200 truncate">{originalFileName || fileName}</span>
                </div>
                <span className="font-mono text-[10px] text-sky-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                  {(fileSize / 1024).toFixed(1)} KB
                </span>
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
};
