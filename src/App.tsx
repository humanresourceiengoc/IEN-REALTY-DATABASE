/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Building2, 
  Plus, 
  CheckCircle2, 
  AlertTriangle, 
  Bell, 
  Upload, 
  Search, 
  FileText, 
  Filter, 
  Layers, 
  Sparkles,
  ShieldCheck,
  Lock,
  LogOut,
  ArrowLeft, 
  ChevronRight, 
  FolderOpen, 
  Users
} from 'lucide-react';
import { ClientProfile, DocumentItem, FolderDefinition, DeadlineAlert, UserSession, TransmittalInfo } from './types';
import { DEFAULT_FOLDERS } from './data/defaultFolders';
import { dbService } from './utils/indexedDB';
import { generateAllAlerts } from './utils/alertEngine';
import { notificationService } from './utils/notificationService';
import { authService, MASTER_GOOGLE_EMAIL } from './utils/authService';

// Subcomponents
import { Header } from './components/Header';
import { ClientDirectory } from './components/ClientDirectory';
import { ClientProfileCard } from './components/ClientProfileCard';
import { FolderGrid } from './components/FolderGrid';
import { FileList } from './components/FileList';
import { FileUploadModal } from './components/FileUploadModal';
import { EditClientModal } from './components/EditClientModal';
import { PdfViewerModal } from './components/PdfViewerModal';
import { AlertCenterModal } from './components/AlertCenterModal';
import { ComplianceSummaryModal } from './components/ComplianceSummaryModal';
import { AddFolderModal } from './components/AddFolderModal';
import { TransmittalModal } from './components/TransmittalModal';
import { MasterVerificationGate } from './components/MasterVerificationGate';
import { SecurityGatekeeperModal } from './components/SecurityGatekeeperModal';
import { CloudRealtimeSyncModal } from './components/CloudRealtimeSyncModal';
import { AccountVerificationModal } from './components/AccountVerificationModal';
import { RecycleBinModal } from './components/RecycleBinModal';
import { CloudSyncState } from './types';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserSession | null>(() => authService.getCurrentUser());
  const [clients, setClients] = useState<ClientProfile[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<'directory' | 'client-detail'>('directory');
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [customFolders, setCustomFolders] = useState<FolderDefinition[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [appLogo, setAppLogo] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [pendingRequestsCount, setPendingRequestsCount] = useState<number>(0);
  const [syncState, setSyncState] = useState<CloudSyncState>(() => dbService.getSyncState());

  // Modals state
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const [isRecycleBinOpen, setIsRecycleBinOpen] = useState(false);
  const [isEditClientModalOpen, setIsEditClientModalOpen] = useState(false);
  const [editingClientData, setEditingClientData] = useState<ClientProfile | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadDefaultFolderId, setUploadDefaultFolderId] = useState<string | undefined>(undefined);
  const [editingDoc, setEditingDoc] = useState<DocumentItem | null>(null);
  const [previewDoc, setPreviewDoc] = useState<DocumentItem | null>(null);
  const [isAlertCenterOpen, setIsAlertCenterOpen] = useState(false);
  const [isComplianceSummaryOpen, setIsComplianceSummaryOpen] = useState(false);
  const [isAddFolderModalOpen, setIsAddFolderModalOpen] = useState(false);
  const [isTransmittalModalOpen, setIsTransmittalModalOpen] = useState(false);
  const [transmittalDoc, setTransmittalDoc] = useState<DocumentItem | null>(null);

  // Toast banner notification
  const [toastMessage, setToastMessage] = useState<{ title: string; type: 'success' | 'alert' | 'info' } | null>(null);

  const showToast = useCallback((title: string, type: 'success' | 'alert' | 'info' = 'success') => {
    setToastMessage({ title, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  }, []);

  // Sync auth state listener & pending count
  useEffect(() => {
    const updateAuth = (u: UserSession | null) => {
      setCurrentUser(u);
      const reqs = authService.getAccessRequests();
      setPendingRequestsCount(reqs.filter((r) => r.status === 'pending').length);
    };

    const unsub = authService.subscribe(updateAuth);
    const reqs = authService.getAccessRequests();
    setPendingRequestsCount(reqs.filter((r) => r.status === 'pending').length);

    // Subscribe to Firestore Real-Time Cloud Sync state and Data changes
    const unsubSync = dbService.subscribeToSyncState((state) => {
      setSyncState(state);
    });

    const unsubData = dbService.subscribeToDataChanges(async () => {
      try {
        const [loadedClients, loadedDocs, loadedFolders] = await Promise.all([
          dbService.getClients(),
          dbService.getDocuments(),
          dbService.getCustomFolders(),
        ]);
        setClients(loadedClients);
        setDocuments(loadedDocs);
        setCustomFolders(loadedFolders.filter((f) => f.id !== 'folder_cust_insurance' && f.code !== '09'));
      } catch (e) {
        console.warn('Real-time data update notice:', e);
      }
    });

    return () => {
      unsub();
      unsubSync();
      unsubData();
    };
  }, []);

  // Load all initial data from IndexedDB
  const loadData = useCallback(async () => {
    try {
      await dbService.initialize();
      const [loadedClients, loadedDocs, loadedFolders, savedLogo] = await Promise.all([
        dbService.getClients(),
        dbService.getDocuments(),
        dbService.getCustomFolders(),
        dbService.getSetting<string>('appLogo', ''),
      ]);

      // Scrub out legacy folder 09
      const cleanedCustom = loadedFolders.filter((f) => f.id !== 'folder_cust_insurance' && f.code !== '09');

      setClients(loadedClients);
      setDocuments(loadedDocs);
      setCustomFolders(cleanedCustom);
      setAppLogo(savedLogo);

      if (loadedClients.length > 0 && !selectedClientId) {
        setSelectedClientId(loadedClients[0].id);
      }
    } catch (err) {
      console.error('Failed to load database:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedClientId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Selected client object
  const selectedClient = useMemo(() => {
    return clients.find((c) => c.id === selectedClientId) || clients[0] || null;
  }, [clients, selectedClientId]);

  // Combined list of all folders (default 01-08 + custom)
  const allFolders = useMemo(() => {
    return [...DEFAULT_FOLDERS, ...customFolders];
  }, [customFolders]);

  // Documents for the current active client (active, non-deleted)
  const clientDocuments = useMemo(() => {
    if (!selectedClient) return [];
    return documents.filter((d) => d.clientId === selectedClient.id && !d.isDeleted);
  }, [documents, selectedClient]);

  // Recycled / Soft-deleted documents across the system
  const deletedDocuments = useMemo(() => {
    return documents.filter((d) => d.isDeleted);
  }, [documents]);

  // Compute all deadlines & alerts (active non-deleted only)
  const allAlerts = useMemo(() => {
    const activeDocs = documents.filter((d) => !d.isDeleted);
    return generateAllAlerts(clients, activeDocs);
  }, [clients, documents]);

  // Handle Client Selection & Drill Down into Files/Folders
  const handleSelectClientAndDrillDown = (client: ClientProfile) => {
    setSelectedClientId(client.id);
    setSelectedFolderId(null);
    setCurrentView('client-detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle Client Selection from Dropdown or Switcher
  const handleSelectClient = (client: ClientProfile) => {
    setSelectedClientId(client.id);
    setSelectedFolderId(null);
  };

  // Quick Client Name Update
  const handleQuickUpdateName = async (newName: string) => {
    if (!selectedClient) return;
    const updated: ClientProfile = {
      ...selectedClient,
      clientName: newName,
      updatedAt: new Date().toISOString(),
    };
    await dbService.saveClient(updated);
    setClients((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    showToast(`Updated Client Name to "${newName}"`, 'success');
  };

  // Save / Update Client
  const handleSaveClient = async (client: ClientProfile) => {
    await dbService.saveClient(client);
    setClients((prev) => {
      const exists = prev.some((c) => c.id === client.id);
      if (exists) {
        return prev.map((c) => (c.id === client.id ? client : c));
      }
      return [client, ...prev];
    });
    setSelectedClientId(client.id);
    setCurrentView('client-detail');
    showToast(`Client "${client.clientName}" saved successfully.`, 'success');
  };

  // Save Document (Insert / Edit)
  const handleSaveDocument = async (doc: DocumentItem) => {
    await dbService.saveDocument(doc);
    setDocuments((prev) => {
      const exists = prev.some((d) => d.id === doc.id);
      if (exists) {
        return prev.map((d) => (d.id === doc.id ? doc : d));
      }
      return [doc, ...prev];
    });

    const targetFolder = allFolders.find((f) => f.id === doc.folderId);
    showToast(`Document "${doc.fileName}" saved to ${targetFolder?.name || 'Folder'}.`, 'success');
    notificationService.playAlertChime('info');
  };

  // Quick Rename Document
  const handleQuickRenameDocument = async (docId: string, newName: string) => {
    const doc = documents.find((d) => d.id === docId);
    if (doc) {
      const updated: DocumentItem = { ...doc, fileName: newName };
      await dbService.saveDocument(updated);
      setDocuments((prev) => prev.map((d) => (d.id === docId ? updated : d)));
      showToast(`Renamed file to "${newName}"`, 'success');
    }
  };

  // Soft Delete Document (Move to Recycle Bin - NOT Permanent)
  const handleDeleteDocument = async (docId: string) => {
    const doc = documents.find((d) => d.id === docId);
    if (doc) {
      const updated: DocumentItem = {
        ...doc,
        isDeleted: true,
        deletedAt: new Date().toISOString(),
      };
      await dbService.saveDocument(updated);
      setDocuments((prev) => prev.map((d) => (d.id === docId ? updated : d)));
      showToast(`Moved "${doc.fileName}" to Recycle Bin (Trash).`, 'info');
    }
  };

  // Restore Document from Recycle Bin back to active folder
  const handleRestoreDocument = async (docId: string) => {
    const doc = documents.find((d) => d.id === docId);
    if (doc) {
      const updated: DocumentItem = {
        ...doc,
        isDeleted: false,
      };
      delete updated.deletedAt;
      await dbService.saveDocument(updated);
      setDocuments((prev) => prev.map((d) => (d.id === docId ? updated : d)));
      showToast(`Restored "${doc.fileName}" to active folder.`, 'success');
    }
  };

  // Restore All Documents from Recycle Bin
  const handleRestoreAllDocuments = async () => {
    const deletedDocs = documents.filter((d) => d.isDeleted);
    for (const doc of deletedDocs) {
      const updated: DocumentItem = {
        ...doc,
        isDeleted: false,
      };
      delete updated.deletedAt;
      await dbService.saveDocument(updated);
    }
    setDocuments((prev) =>
      prev.map((d) => (d.isDeleted ? { ...d, isDeleted: false, deletedAt: undefined } : d))
    );
    showToast(`Restored ${deletedDocs.length} documents to active folders.`, 'success');
  };

  // Permanently Purge Document from Recycle Bin
  const handlePermanentlyDeleteDocument = async (docId: string) => {
    await dbService.permanentlyDeleteDocument(docId);
    setDocuments((prev) => prev.filter((d) => d.id !== docId));
    showToast('Document permanently purged.', 'info');
  };

  // Add Custom Folder
  const handleAddCustomFolder = async (folder: FolderDefinition) => {
    await dbService.saveCustomFolder(folder);
    setCustomFolders((prev) => [...prev, folder]);
    showToast(`Created Folder ${folder.code}: ${folder.name}`, 'success');
  };

  // Update App Logo
  const handleUpdateAppLogo = async (logoUrl: string) => {
    setAppLogo(logoUrl);
    await dbService.setSetting('appLogo', logoUrl);
    showToast('IEN Realty Inc. logo updated successfully.', 'success');
  };

  // Open Insert Document Modal
  const handleOpenUploadModal = (folderId?: string) => {
    setEditingDoc(null);
    setUploadDefaultFolderId(folderId || selectedFolderId || undefined);
    setIsUploadModalOpen(true);
  };

  // Open Edit Document Modal
  const handleOpenEditDocModal = (doc: DocumentItem) => {
    setEditingDoc(doc);
    setIsUploadModalOpen(true);
  };

  // Preview Document
  const handlePreviewDoc = (doc: DocumentItem) => {
    setPreviewDoc(doc);
  };

  // Open Transmittal Modal
  const handleOpenTransmittal = (doc: DocumentItem) => {
    setTransmittalDoc(doc);
    setIsTransmittalModalOpen(true);
  };

  // Save / Update Transmittal Status & History
  const handleSaveTransmittal = async (docId: string, updatedTransmittal: TransmittalInfo) => {
    const targetDoc = documents.find((d) => d.id === docId) || (transmittalDoc?.id === docId ? transmittalDoc : null);
    if (!targetDoc) return;

    const updatedDoc: DocumentItem = {
      ...targetDoc,
      transmittal: updatedTransmittal,
    };

    await dbService.saveDocument(updatedDoc);
    setDocuments((prev) => prev.map((d) => (d.id === docId ? updatedDoc : d)));
    
    // Also sync previewDoc if currently open
    if (previewDoc && previewDoc.id === docId) {
      setPreviewDoc(updatedDoc);
    }
    if (transmittalDoc && transmittalDoc.id === docId) {
      setTransmittalDoc(updatedDoc);
    }

    const statusLabel = updatedTransmittal.status === 'returned'
      ? 'Returned to Custody'
      : updatedTransmittal.status === 'transmitted'
      ? 'Transmitted & Dispatched'
      : updatedTransmittal.status === 'acknowledged'
      ? 'Acknowledged by Recipient'
      : 'In Custody';

    showToast(`Updated transmittal status to "${statusLabel}" for ${targetDoc.fileName}`, 'success');
  };

  // Select Client & Doc from Alert Center
  const handleSelectClientAndDocFromAlert = (clientId: string, docId?: string) => {
    setSelectedClientId(clientId);
    setCurrentView('client-detail');
    if (docId) {
      const doc = documents.find((d) => d.id === docId);
      if (doc) {
        setSelectedFolderId(doc.folderId);
        setPreviewDoc(doc);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
        <div className="w-12 h-12 rounded-xl bg-sky-500 text-white flex items-center justify-center font-bold animate-bounce mb-3 shadow-lg">
          <Building2 className="w-7 h-7" />
        </div>
        <p className="font-extrabold text-lg text-sky-400 tracking-wider">IEN REALTY INC.</p>
        <p className="text-xs text-slate-400 mt-1">Loading corporate compliance registry & files...</p>
      </div>
    );
  }

  // If user is not authenticated or is awaiting Master Admin Verification
  if (!currentUser || currentUser.status === 'pending_approval' || currentUser.status === 'rejected') {
    return (
      <MasterVerificationGate
        currentUser={currentUser}
        onUserAuthenticated={(session) => {
          setCurrentUser(session);
          if (session && session.status === 'active') {
            showToast(`Welcome! Database access verified & unlocked.`, 'success');
          }
        }}
      />
    );
  }

  // Active Application Workspace (Multi-Device Live Sync Enabled)
  return (
    <div className="min-h-screen bg-slate-100/90 text-slate-900 font-sans antialiased selection:bg-sky-400 selection:text-slate-950 overflow-x-hidden">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 animate-fade-in">
          <div className={`px-4 py-3 rounded-xl shadow-2xl border text-xs font-bold flex items-center gap-2.5 ${
            toastMessage.type === 'alert'
              ? 'bg-rose-900 text-white border-rose-700'
              : toastMessage.type === 'info'
              ? 'bg-slate-900 text-white border-slate-700'
              : 'bg-slate-900 text-sky-300 border-sky-500/50'
          }`}>
            <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />
            <span>{toastMessage.title}</span>
          </div>
        </div>
      )}

      {/* Main Header */}
      <Header
        clients={clients}
        selectedClient={selectedClient}
        currentView={currentView}
        currentUser={currentUser}
        pendingRequestsCount={pendingRequestsCount}
        syncState={syncState}
        deletedDocsCount={deletedDocuments.length}
        onNavigateToDirectory={() => setCurrentView('directory')}
        onNavigateToClientDetail={() => setCurrentView('client-detail')}
        onSelectClient={handleSelectClient}
        onOpenNewClientModal={() => {
          setEditingClientData(null);
          setIsEditClientModalOpen(true);
        }}
        onOpenAlertCenter={() => setIsAlertCenterOpen(true)}
        onOpenComplianceSummary={() => setIsComplianceSummaryOpen(true)}
        onOpenUploadModal={() => handleOpenUploadModal()}
        onOpenSecurityModal={() => setIsSecurityModalOpen(true)}
        onOpenRecycleBin={() => setIsRecycleBinOpen(true)}
        onOpenSyncModal={() => setIsSyncModalOpen(true)}
        onOpenVerificationModal={() => setIsVerificationModalOpen(true)}
        onLogout={() => {
          authService.logout();
          setCurrentUser(null);
          showToast('Database locked. Signed out successfully.', 'info');
        }}
        onUpdateAppLogo={handleUpdateAppLogo}
        appLogo={appLogo}
        alerts={allAlerts}
      />

      {/* Main Content Area */}
      <main className="max-w-[1700px] mx-auto px-3 sm:px-5 lg:px-8 py-4 sm:py-6">
        
        {/* VIEW 1: MASTER CLIENT DIRECTORY (All Clients Overview) */}
        {currentView === 'directory' ? (
          <ClientDirectory
            clients={clients}
            documents={documents}
            alerts={allAlerts}
            onSelectClientAndDrillDown={handleSelectClientAndDrillDown}
            onOpenNewClientModal={() => {
              setEditingClientData(null);
              setIsEditClientModalOpen(true);
            }}
            onEditClient={(c) => {
              setEditingClientData(c);
              setIsEditClientModalOpen(true);
            }}
            onOpenComplianceSummary={() => {
              if (selectedClient) {
                setIsComplianceSummaryOpen(true);
              }
            }}
            onOpenAlertCenter={() => setIsAlertCenterOpen(true)}
          />
        ) : (
          /* VIEW 2: INSIDE CLIENT WORKSPACE & FILES (Drill-Down View) */
          selectedClient ? (
            <div className="space-y-6">
              
              {/* Back to Master List Breadcrumb & Action Strip */}
              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-wrap">
                  <button
                    onClick={() => setCurrentView('directory')}
                    id="btn-back-to-directory"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white text-xs sm:text-sm font-bold shadow-md transition active:scale-95 group"
                    title="Return to IEN Realty Inc. Database Master List"
                  >
                    <ArrowLeft className="w-4 h-4 text-sky-400 group-hover:-translate-x-1 transition-transform" />
                    <span>Back to Database Master List</span>
                  </button>

                  <div className="h-6 w-px bg-slate-200 hidden sm:block" />

                  <div className="flex items-center gap-2 text-xs flex-wrap">
                    <span className="text-slate-400 font-medium hidden md:inline">Viewing:</span>
                    <span className="font-bold text-slate-900 bg-sky-50 text-sky-900 px-3 py-1.5 rounded-lg border border-sky-200">
                      {selectedClient.clientName}
                    </span>
                    <span className="font-mono text-slate-500 bg-slate-100 px-2.5 py-1 rounded">
                      {selectedClient.cifNo}
                    </span>
                  </div>
                </div>

                {/* Right controls inside client */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenUploadModal()}
                    id="btn-upload-file-inside"
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs sm:text-sm shadow-sm transition active:scale-95"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Upload Document</span>
                  </button>

                  <button
                    onClick={() => setIsComplianceSummaryOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs sm:text-sm transition"
                    title="Print Client Compliance Summary Sheet"
                  >
                    <FileText className="w-4 h-4 text-slate-500" />
                    <span className="hidden md:inline">Print Dossier</span>
                  </button>
                </div>
              </div>

              {/* Client Profile Summary & Registration Matrix */}
              <ClientProfileCard
                client={selectedClient}
                onEditClient={() => {
                  setEditingClientData(selectedClient);
                  setIsEditClientModalOpen(true);
                }}
                onQuickUpdateName={handleQuickUpdateName}
                onOpenUploadModal={() => handleOpenUploadModal()}
                onOpenComplianceSummary={() => setIsComplianceSummaryOpen(true)}
                onBackToDirectory={() => setCurrentView('directory')}
              />

              {/* Compliance Folder Directory & In-Folder PDF Document Explorer */}
              <FolderGrid
                folders={allFolders}
                selectedFolderId={selectedFolderId}
                onSelectFolder={(folderId) => setSelectedFolderId(folderId)}
                documents={clientDocuments}
                onOpenAddFolderModal={() => setIsAddFolderModalOpen(true)}
                onOpenUploadModal={(folderId) => handleOpenUploadModal(folderId)}
                onPreviewDocument={handlePreviewDoc}
                onEditDocument={handleOpenEditDocModal}
                onDeleteDocument={handleDeleteDocument}
                onQuickRename={handleQuickRenameDocument}
                onOpenTransmittal={handleOpenTransmittal}
                onBackToDirectory={() => setCurrentView('directory')}
              />
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
              <Building2 className="w-16 h-16 text-sky-500 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-slate-900">No Client Selected</h3>
              <p className="text-xs text-slate-500 mb-5 max-w-md mx-auto">
                Return to the client directory to select an entity and access their compliance folders.
              </p>
              <button
                onClick={() => setCurrentView('directory')}
                className="px-5 py-2.5 bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs rounded-xl shadow-sm transition inline-flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Return to Client Directory</span>
              </button>
            </div>
          )
        )}

      </main>

      {/* Footer */}
      <footer className="mt-16 bg-slate-900 border-t border-slate-800 text-slate-400 py-8 px-4 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-sky-400 tracking-wider">IEN REALTY INC.</span>
            <span>&bull;</span>
            <span>Client Compliance & Document Management Portal</span>
          </div>
          <p className="text-[11px] text-slate-500">
            Automated Deadlines Alert System &bull; 01-08 Folders &bull; PDF Registry &copy; {new Date().getFullYear()}
          </p>
        </div>
      </footer>

      {/* Modals */}
      
      {/* Insert / Edit File Modal */}
      {isUploadModalOpen && selectedClient && (
        <FileUploadModal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          folders={allFolders}
          clientId={selectedClient.id}
          clientName={selectedClient.clientName}
          defaultFolderId={uploadDefaultFolderId}
          editingDoc={editingDoc}
          onSaveDocument={handleSaveDocument}
          onDeleteDocument={handleDeleteDocument}
        />
      )}

      {/* Edit / New Client Modal */}
      {isEditClientModalOpen && (
        <EditClientModal
          isOpen={isEditClientModalOpen}
          onClose={() => setIsEditClientModalOpen(false)}
          client={editingClientData}
          onSaveClient={handleSaveClient}
        />
      )}

      {/* In-App PDF Previewer Modal */}
      {previewDoc && (
        <PdfViewerModal
          isOpen={Boolean(previewDoc)}
          onClose={() => setPreviewDoc(null)}
          document={previewDoc}
          folder={allFolders.find((f) => f.id === previewDoc.folderId)}
          onEditDocument={handleOpenEditDocModal}
          onDeleteDocument={handleDeleteDocument}
          onOpenTransmittal={handleOpenTransmittal}
        />
      )}

      {/* Transmittal & Custody Tracking Modal */}
      {isTransmittalModalOpen && transmittalDoc && (
        <TransmittalModal
          isOpen={isTransmittalModalOpen}
          onClose={() => {
            setIsTransmittalModalOpen(false);
            setTransmittalDoc(null);
          }}
          document={transmittalDoc}
          client={clients.find((c) => c.id === transmittalDoc.clientId) || selectedClient || null}
          appLogo={appLogo}
          onSaveTransmittal={handleSaveTransmittal}
        />
      )}

      {/* Push Notification & Alert Center Modal */}
      {isAlertCenterOpen && (
        <AlertCenterModal
          isOpen={isAlertCenterOpen}
          onClose={() => setIsAlertCenterOpen(false)}
          alerts={allAlerts}
          clients={clients}
          onSelectClientAndDoc={handleSelectClientAndDocFromAlert}
        />
      )}

      {/* Printable Compliance Summary Sheet */}
      {isComplianceSummaryOpen && selectedClient && (
        <ComplianceSummaryModal
          isOpen={isComplianceSummaryOpen}
          onClose={() => setIsComplianceSummaryOpen(false)}
          client={selectedClient}
          documents={clientDocuments}
          folders={allFolders}
          appLogo={appLogo}
        />
      )}

      {/* Add Custom Folder Modal */}
      {isAddFolderModalOpen && (
        <AddFolderModal
          isOpen={isAddFolderModalOpen}
          onClose={() => setIsAddFolderModalOpen(false)}
          onAddFolder={handleAddCustomFolder}
          existingFoldersCount={allFolders.length}
        />
      )}

      {/* Master Gatekeeper & Access Verification Center Modal */}
      {isSecurityModalOpen && currentUser && (
        <SecurityGatekeeperModal
          currentUser={currentUser}
          onClose={() => setIsSecurityModalOpen(false)}
        />
      )}

      {/* Cloud Firestore Real-Time Sync Diagnostic Modal */}
      {isSyncModalOpen && (
        <CloudRealtimeSyncModal
          isOpen={isSyncModalOpen}
          onClose={() => setIsSyncModalOpen(false)}
          syncState={syncState}
        />
      )}

      {/* Account Verification Inspector Modal */}
      {isVerificationModalOpen && currentUser && (
        <AccountVerificationModal
          isOpen={isVerificationModalOpen}
          onClose={() => setIsVerificationModalOpen(false)}
          currentUser={currentUser}
          onSignOut={() => {
            authService.logout();
            setCurrentUser(null);
            showToast('Signed out successfully.', 'info');
          }}
          onOpenGatekeeper={() => setIsSecurityModalOpen(true)}
        />
      )}

      {/* Recycle Bin & Soft Deleted Documents Modal */}
      <RecycleBinModal
        isOpen={isRecycleBinOpen}
        onClose={() => setIsRecycleBinOpen(false)}
        deletedDocuments={deletedDocuments}
        clients={clients}
        folders={allFolders}
        onRestoreDocument={handleRestoreDocument}
        onRestoreAllDocuments={handleRestoreAllDocuments}
        onPermanentlyDeleteDocument={handlePermanentlyDeleteDocument}
        onPreviewDocument={handlePreviewDoc}
        currentClientId={currentView === 'client-detail' ? selectedClientId : null}
      />

    </div>
  );
}
