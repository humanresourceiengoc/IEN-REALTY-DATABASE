import React, { useState } from 'react';
import { FolderPlus, X, Check, Tag } from 'lucide-react';
import { FolderDefinition } from '../types';

interface AddFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddFolder: (folder: FolderDefinition) => void;
  existingFoldersCount: number;
}

export const AddFolderModal: React.FC<AddFolderModalProps> = ({
  isOpen,
  onClose,
  onAddFolder,
  existingFoldersCount,
}) => {
  const nextCode = String(existingFoldersCount + 1).padStart(2, '0');
  const [code, setCode] = useState(nextCode);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [suggestedDocsInput, setSuggestedDocsInput] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const suggestedDocs = suggestedDocsInput
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const newFolder: FolderDefinition = {
      id: `folder_cust_${Date.now()}`,
      code: code.trim() || nextCode,
      name: name.trim().toUpperCase(),
      color: 'sky',
      badgeBg: 'bg-sky-50 text-sky-800 border-sky-200',
      description: description.trim() || 'Custom client compliance and document records.',
      suggestedDocs: suggestedDocs.length > 0 ? suggestedDocs : ['Custom PDF Attachment'],
      isDefault: false,
    };

    onAddFolder(newFolder);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-sky-500 text-white flex items-center justify-center font-bold">
              <FolderPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-white">
                Add Custom Compliance Folder
              </h3>
              <p className="text-xs text-slate-400">IEN REALTY INC. File Registry</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-800 mb-1">
                Folder Code
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono font-bold text-slate-900 text-center focus:ring-2 focus:ring-sky-500 focus:outline-none"
                required
              />
            </div>

            <div className="col-span-2">
              <label className="block font-bold text-slate-800 mb-1">
                Folder Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. INSURANCE & BONDS"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none uppercase"
                required
                autoFocus
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-800 mb-1">
              Description / Purpose
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Comprehensive General Liability (CGL) policies, fire insurance, and surety bonds."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none resize-none"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-800 mb-1">
              Suggested Documents (Comma-separated)
            </label>
            <input
              type="text"
              placeholder="e.g. Policy Schedule, Receipt Proof, Bond Certificate"
              value={suggestedDocsInput}
              onChange={(e) => setSuggestedDocsInput(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
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
              <span>Create Folder</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
