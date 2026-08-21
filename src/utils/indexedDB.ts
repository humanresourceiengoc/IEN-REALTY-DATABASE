import { ClientProfile, DocumentItem, FolderDefinition, CloudSyncState } from '../types';
import { INITIAL_CLIENTS, INITIAL_DOCUMENTS, INITIAL_CUSTOM_FOLDERS } from '../data/seedData';
import { db } from '../lib/firebase';
import { collection, doc, getDocs, setDoc, deleteDoc, onSnapshot, writeBatch } from 'firebase/firestore';

const DB_NAME = 'IEN_REALTY_COMPLIANCE_DB';
const DB_VERSION = 1;

const STORES = {
  CLIENTS: 'clients',
  DOCUMENTS: 'documents',
  CUSTOM_FOLDERS: 'custom_folders',
  SETTINGS: 'settings',
};

// Helper to remove any undefined properties before writing to Firestore
function cleanForFirestore<T>(data: T): T {
  if (data === null || data === undefined) return null as unknown as T;
  if (typeof data !== 'object') return data;
  if (Array.isArray(data)) {
    return data.map((item) => cleanForFirestore(item)) as unknown as T;
  }
  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      cleaned[key] = cleanForFirestore(value);
    }
  }
  return cleaned as T;
}

class StorageService {
  private dbPromise: Promise<IDBDatabase> | null = null;
  private memoryClients: ClientProfile[] = [...INITIAL_CLIENTS];
  private memoryDocs: DocumentItem[] = [...INITIAL_DOCUMENTS];
  private memoryFolders: FolderDefinition[] = [...INITIAL_CUSTOM_FOLDERS];
  private memorySettings: Record<string, unknown> = {};
  private useMemory = false;
  
  private dataChangeListeners: Array<(event: { type: 'clients' | 'documents' | 'folders' | 'all' }) => void> = [];
  private syncStateListeners: Array<(state: CloudSyncState) => void> = [];
  
  private syncState: CloudSyncState = {
    status: 'synced',
    lastSyncedAt: new Date().toISOString(),
    clientsCount: INITIAL_CLIENTS.length,
    documentsCount: INITIAL_DOCUMENTS.length,
    pendingRequestsCount: 0,
    mode: 'realtime',
  };

  private unsubscribeClients: (() => void) | null = null;
  private unsubscribeDocs: (() => void) | null = null;
  private unsubscribeFolders: (() => void) | null = null;
  private isRealtimeActive = false;

  private openDB(): Promise<IDBDatabase> {
    if (this.useMemory) {
      return Promise.reject(new Error('Using memory fallback'));
    }

    if (this.dbPromise) return this.dbPromise;

    if (typeof window === 'undefined' || !window.indexedDB) {
      this.useMemory = true;
      return Promise.reject(new Error('IndexedDB not supported'));
    }

    this.dbPromise = new Promise((resolve, reject) => {
      try {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
          try {
            const idb = (event.target as IDBOpenDBRequest).result;

            if (!idb.objectStoreNames.contains(STORES.CLIENTS)) {
              const clientStore = idb.createObjectStore(STORES.CLIENTS, { keyPath: 'id' });
              clientStore.createIndex('clientName', 'clientName', { unique: false });
              clientStore.createIndex('cifNo', 'cifNo', { unique: false });
            }

            if (!idb.objectStoreNames.contains(STORES.DOCUMENTS)) {
              const docStore = idb.createObjectStore(STORES.DOCUMENTS, { keyPath: 'id' });
              docStore.createIndex('clientId', 'clientId', { unique: false });
              docStore.createIndex('folderId', 'folderId', { unique: false });
              docStore.createIndex('expirationDate', 'expirationDate', { unique: false });
            }

            if (!idb.objectStoreNames.contains(STORES.CUSTOM_FOLDERS)) {
              idb.createObjectStore(STORES.CUSTOM_FOLDERS, { keyPath: 'id' });
            }

            if (!idb.objectStoreNames.contains(STORES.SETTINGS)) {
              idb.createObjectStore(STORES.SETTINGS, { keyPath: 'key' });
            }
          } catch (e) {
            console.warn('Error upgrading IndexedDB schema:', e);
          }
        };

        request.onsuccess = (event) => {
          const idb = (event.target as IDBOpenDBRequest).result;
          resolve(idb);
        };

        request.onerror = (event) => {
          this.useMemory = true;
          reject((event.target as IDBOpenDBRequest).error);
        };
      } catch (err) {
        this.useMemory = true;
        reject(err);
      }
    });

    return this.dbPromise;
  }

  // Initialize seed data and activate Firestore Real-Time Sync
  public async initialize(): Promise<void> {
    try {
      const idb = await this.openDB();
      const localClients = await this.getClients();

      if (localClients.length === 0) {
        // Seed initial local data
        const tx = idb.transaction([STORES.CLIENTS, STORES.DOCUMENTS, STORES.CUSTOM_FOLDERS], 'readwrite');
        const clientStore = tx.objectStore(STORES.CLIENTS);
        const docStore = tx.objectStore(STORES.DOCUMENTS);
        const folderStore = tx.objectStore(STORES.CUSTOM_FOLDERS);

        for (const client of INITIAL_CLIENTS) {
          clientStore.put(client);
        }
        for (const docItem of INITIAL_DOCUMENTS) {
          docStore.put(docItem);
        }
        for (const f of INITIAL_CUSTOM_FOLDERS) {
          folderStore.put(f);
        }

        await new Promise<void>((res, rej) => {
          tx.oncomplete = () => res();
          tx.onerror = () => rej(tx.error);
        });
      } else {
        // Ensure A.B Soterio is in local DB if not present
        const hasSoterio = localClients.some((c) => c.cifNo === '2021-0027' || c.clientName.includes('Soterio'));
        if (!hasSoterio) {
          const soterio = INITIAL_CLIENTS.find((c) => c.cifNo === '2021-0027');
          if (soterio) {
            await this.saveClientLocal(soterio);
          }
        }
      }

      // Activate real-time Firestore listeners & ensure cloud sync
      this.setupFirestoreRealtimeSync();
      // Proactively ensure cloud has all clients (including A.B Soterio)
      this.ensureInitialCloudSync().catch((e) => console.warn('Cloud sync init note:', e));
    } catch (e) {
      console.warn('Using memory fallback for data store:', e);
      this.useMemory = true;
      this.setupFirestoreRealtimeSync();
      this.ensureInitialCloudSync().catch((err) => console.warn('Cloud sync memory init note:', err));
    }
  }

  // Ensure all initial clients and documents are uploaded to Firestore
  private async ensureInitialCloudSync(): Promise<void> {
    try {
      this.updateSyncState({ status: 'syncing' });
      const snap = await getDocs(collection(db, 'clients'));
      const cloudClientIds = new Set(snap.docs.map((d) => d.id));

      for (const client of INITIAL_CLIENTS) {
        if (!cloudClientIds.has(client.id)) {
          await setDoc(doc(db, 'clients', client.id), cleanForFirestore(client));
        }
      }

      const docSnap = await getDocs(collection(db, 'documents'));
      const cloudDocIds = new Set(docSnap.docs.map((d) => d.id));

      for (const docItem of INITIAL_DOCUMENTS) {
        if (!cloudDocIds.has(docItem.id)) {
          await setDoc(doc(db, 'documents', docItem.id), cleanForFirestore(docItem));
        }
      }

      this.updateSyncState({
        status: 'synced',
        lastSyncedAt: new Date().toISOString(),
        clientsCount: Math.max(snap.size, INITIAL_CLIENTS.length),
        documentsCount: Math.max(docSnap.size, INITIAL_DOCUMENTS.length),
      });
      this.notifyDataChange({ type: 'clients' });
    } catch (err) {
      console.warn('Initial cloud sync verification notice:', err);
    }
  }

  // Cloud Real-Time Listeners setup
  public setupFirestoreRealtimeSync(): void {
    if (this.isRealtimeActive) return;
    this.isRealtimeActive = true;
    this.updateSyncState({ status: 'syncing', mode: 'realtime' });

    try {
      // 1. Real-time Listen to clients collection
      this.unsubscribeClients = onSnapshot(
        collection(db, 'clients'),
        async (snapshot) => {
          if (snapshot.empty) {
            // Seed Firestore with initial clients (including A.B Soterio) if cloud is empty
            await this.seedCloudIfEmpty();
            return;
          }

          const remoteClients: ClientProfile[] = [];
          snapshot.forEach((docSnap) => {
            remoteClients.push(docSnap.data() as ClientProfile);
          });

          // Check if A.B Soterio or any initial client is missing from remote
          const missingInitial = INITIAL_CLIENTS.filter(
            (initC) => !remoteClients.some((rc) => rc.id === initC.id || rc.cifNo === initC.cifNo)
          );
          if (missingInitial.length > 0) {
            for (const missing of missingInitial) {
              remoteClients.unshift(missing);
              // Asynchronously push missing initial to Firestore
              setDoc(doc(db, 'clients', missing.id), cleanForFirestore(missing)).catch((e) =>
                console.warn('Auto-sync missing initial client to cloud:', e)
              );
            }
          }

          // Update memory & local IndexedDB cache
          this.memoryClients = remoteClients;
          try {
            const idb = await this.openDB();
            const tx = idb.transaction(STORES.CLIENTS, 'readwrite');
            const store = tx.objectStore(STORES.CLIENTS);
            for (const c of remoteClients) {
              store.put(c);
            }
          } catch (e) {
            console.warn('IndexedDB mirror note:', e);
          }

          this.updateSyncState({
            status: 'synced',
            lastSyncedAt: new Date().toISOString(),
            clientsCount: remoteClients.length,
          });

          this.notifyDataChange({ type: 'clients' });
        },
        (error) => {
          console.warn('Clients real-time sync note:', error.message);
          this.updateSyncState({
            status: 'offline',
            errorMessage: error.message,
          });
          // Auto retry connection after 5 seconds
          setTimeout(() => {
            this.isRealtimeActive = false;
            this.setupFirestoreRealtimeSync();
          }, 5000);
        }
      );

      // 2. Real-time Listen to documents collection
      this.unsubscribeDocs = onSnapshot(
        collection(db, 'documents'),
        async (snapshot) => {
          if (!snapshot.empty) {
            const remoteDocs: DocumentItem[] = [];
            snapshot.forEach((docSnap) => {
              remoteDocs.push(docSnap.data() as DocumentItem);
            });

            // Check if any initial docs are missing from remote
            const missingDocs = INITIAL_DOCUMENTS.filter(
              (initD) => !remoteDocs.some((rd) => rd.id === initD.id)
            );
            if (missingDocs.length > 0) {
              for (const missing of missingDocs) {
                remoteDocs.push(missing);
                setDoc(doc(db, 'documents', missing.id), cleanForFirestore(missing)).catch((e) =>
                  console.warn('Auto-sync missing initial doc to cloud:', e)
                );
              }
            }

            this.memoryDocs = remoteDocs;
            try {
              const idb = await this.openDB();
              const tx = idb.transaction(STORES.DOCUMENTS, 'readwrite');
              const store = tx.objectStore(STORES.DOCUMENTS);
              for (const d of remoteDocs) {
                store.put(d);
              }
            } catch (e) {
              console.warn('IndexedDB doc mirror note:', e);
            }

            this.updateSyncState({
              status: 'synced',
              lastSyncedAt: new Date().toISOString(),
              documentsCount: remoteDocs.length,
            });

            this.notifyDataChange({ type: 'documents' });
          } else {
            // Seed cloud documents if empty
            await this.seedCloudDocsIfEmpty();
          }
        },
        (error) => {
          console.warn('Documents real-time sync note:', error.message);
        }
      );

    } catch (err) {
      console.warn('Real-time sync attachment notice:', err);
      this.updateSyncState({ status: 'offline' });
      setTimeout(() => {
        this.isRealtimeActive = false;
        this.setupFirestoreRealtimeSync();
      }, 5000);
    }
  }

  // Seed Cloud Firestore if newly opened
  private async seedCloudIfEmpty(): Promise<void> {
    try {
      const snap = await getDocs(collection(db, 'clients'));
      if (snap.empty) {
        for (const client of INITIAL_CLIENTS) {
          await setDoc(doc(db, 'clients', client.id), cleanForFirestore(client));
        }
      }
      await this.seedCloudDocsIfEmpty();
    } catch (e) {
      console.info('Cloud initial seeding notice:', e);
    }
  }

  private async seedCloudDocsIfEmpty(): Promise<void> {
    try {
      const snap = await getDocs(collection(db, 'documents'));
      if (snap.empty) {
        for (const docItem of INITIAL_DOCUMENTS) {
          await setDoc(doc(db, 'documents', docItem.id), cleanForFirestore(docItem));
        }
      }
    } catch (e) {
      console.info('Cloud doc seeding notice:', e);
    }
  }

  // Force Full Resync
  public async forceCloudResync(): Promise<void> {
    this.updateSyncState({ status: 'syncing' });
    try {
      const clientsSnapshot = await getDocs(collection(db, 'clients'));
      if (!clientsSnapshot.empty) {
        const cloudClients: ClientProfile[] = [];
        for (const docSnap of clientsSnapshot.docs) {
          cloudClients.push(docSnap.data() as ClientProfile);
        }
        this.memoryClients = cloudClients;
        for (const c of cloudClients) {
          await this.saveClientLocal(c);
        }
      } else {
        await this.seedCloudIfEmpty();
      }

      const docsSnapshot = await getDocs(collection(db, 'documents'));
      if (!docsSnapshot.empty) {
        const cloudDocs: DocumentItem[] = [];
        for (const docSnap of docsSnapshot.docs) {
          cloudDocs.push(docSnap.data() as DocumentItem);
        }
        this.memoryDocs = cloudDocs;
        for (const d of cloudDocs) {
          await this.saveDocumentLocal(d);
        }
      } else {
        await this.seedCloudDocsIfEmpty();
      }

      // Also ensure all local clients exist in cloud
      for (const client of this.memoryClients) {
        await setDoc(doc(db, 'clients', client.id), cleanForFirestore(client));
      }

      const totalClients = await this.getClients();
      const totalDocs = await this.getDocuments();

      this.updateSyncState({
        status: 'synced',
        lastSyncedAt: new Date().toISOString(),
        clientsCount: totalClients.length,
        documentsCount: totalDocs.length,
      });

      this.notifyDataChange({ type: 'all' });
    } catch (err) {
      console.warn('Force cloud resync note:', err);
      this.updateSyncState({ status: 'error', errorMessage: String(err) });
    }
  }

  // Local helper without triggering cloud loop
  private async saveClientLocal(client: ClientProfile): Promise<void> {
    const idx = this.memoryClients.findIndex((c) => c.id === client.id);
    if (idx >= 0) {
      this.memoryClients[idx] = client;
    } else {
      this.memoryClients.unshift(client);
    }

    if (!this.useMemory) {
      try {
        const idb = await this.openDB();
        const tx = idb.transaction(STORES.CLIENTS, 'readwrite');
        tx.objectStore(STORES.CLIENTS).put(client);
      } catch (err) {
        console.warn('Local saveClient failed:', err);
      }
    }
  }

  private async saveDocumentLocal(docItem: DocumentItem): Promise<void> {
    const idx = this.memoryDocs.findIndex((d) => d.id === docItem.id);
    if (idx >= 0) {
      this.memoryDocs[idx] = docItem;
    } else {
      this.memoryDocs.unshift(docItem);
    }

    if (!this.useMemory) {
      try {
        const idb = await this.openDB();
        const tx = idb.transaction(STORES.DOCUMENTS, 'readwrite');
        tx.objectStore(STORES.DOCUMENTS).put(docItem);
      } catch (err) {
        console.warn('Local saveDocument failed:', err);
      }
    }
  }

  // Clients API
  public async getClients(): Promise<ClientProfile[]> {
    if (this.useMemory) return [...this.memoryClients];
    try {
      const idb = await this.openDB();
      return await new Promise((resolve, reject) => {
        const tx = idb.transaction(STORES.CLIENTS, 'readonly');
        const store = tx.objectStore(STORES.CLIENTS);
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
      });
    } catch {
      return [...this.memoryClients];
    }
  }

  public async getClientById(id: string): Promise<ClientProfile | null> {
    if (this.useMemory) return this.memoryClients.find((c) => c.id === id) || null;
    try {
      const idb = await this.openDB();
      return await new Promise((resolve, reject) => {
        const tx = idb.transaction(STORES.CLIENTS, 'readonly');
        const store = tx.objectStore(STORES.CLIENTS);
        const request = store.get(id);
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
      });
    } catch {
      return this.memoryClients.find((c) => c.id === id) || null;
    }
  }

  public async saveClient(client: ClientProfile): Promise<void> {
    const updated: ClientProfile = {
      ...client,
      updatedAt: new Date().toISOString(),
    };
    await this.saveClientLocal(updated);

    // Save directly to Firestore Cloud
    try {
      await setDoc(doc(db, 'clients', client.id), cleanForFirestore(updated));
      this.updateSyncState({
        status: 'synced',
        lastSyncedAt: new Date().toISOString(),
      });
      this.notifyDataChange({ type: 'clients' });
    } catch (e) {
      console.warn('Cloud sync error for saveClient:', e);
    }
  }

  public async deleteClient(clientId: string): Promise<void> {
    this.memoryClients = this.memoryClients.filter((c) => c.id !== clientId);
    this.memoryDocs = this.memoryDocs.filter((d) => d.clientId !== clientId);

    if (!this.useMemory) {
      try {
        const idb = await this.openDB();
        const tx = idb.transaction([STORES.CLIENTS, STORES.DOCUMENTS], 'readwrite');
        const clientStore = tx.objectStore(STORES.CLIENTS);
        const docStore = tx.objectStore(STORES.DOCUMENTS);

        clientStore.delete(clientId);

        const docIndex = docStore.index('clientId');
        const docRequest = docIndex.getAllKeys(clientId);

        docRequest.onsuccess = () => {
          const keys = docRequest.result;
          keys.forEach((k) => docStore.delete(k));
        };

        await new Promise<void>((resolve, reject) => {
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
        });
      } catch (err) {
        console.warn('Local deleteClient failed:', err);
      }
    }

    // Delete in Firestore Cloud
    try {
      await deleteDoc(doc(db, 'clients', clientId));
      this.notifyDataChange({ type: 'clients' });
    } catch (e) {
      console.warn('Cloud delete client note:', e);
    }
  }

  // Documents API
  public async getDocuments(clientId?: string, folderId?: string): Promise<DocumentItem[]> {
    let docs: DocumentItem[] = [];
    if (this.useMemory) {
      docs = [...this.memoryDocs];
    } else {
      try {
        const idb = await this.openDB();
        docs = await new Promise((resolve, reject) => {
          const tx = idb.transaction(STORES.DOCUMENTS, 'readonly');
          const store = tx.objectStore(STORES.DOCUMENTS);
          const request = store.getAll();
          request.onsuccess = () => resolve(request.result || []);
          request.onerror = () => reject(request.error);
        });
      } catch {
        docs = [...this.memoryDocs];
      }
    }

    if (clientId && folderId) {
      return docs.filter((d) => d.clientId === clientId && d.folderId === folderId);
    }
    if (clientId) {
      return docs.filter((d) => d.clientId === clientId);
    }
    return docs;
  }

  public async getDocumentById(id: string): Promise<DocumentItem | null> {
    if (this.useMemory) return this.memoryDocs.find((d) => d.id === id) || null;
    try {
      const idb = await this.openDB();
      return await new Promise((resolve, reject) => {
        const tx = idb.transaction(STORES.DOCUMENTS, 'readonly');
        const store = tx.objectStore(STORES.DOCUMENTS);
        const request = store.get(id);
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
      });
    } catch {
      return this.memoryDocs.find((d) => d.id === id) || null;
    }
  }

  public async saveDocument(docItem: DocumentItem): Promise<void> {
    await this.saveDocumentLocal(docItem);

    // Save directly to Firestore Cloud
    try {
      await setDoc(doc(db, 'documents', docItem.id), cleanForFirestore(docItem));
      this.updateSyncState({
        status: 'synced',
        lastSyncedAt: new Date().toISOString(),
      });
      this.notifyDataChange({ type: 'documents' });
    } catch (e) {
      console.warn('Cloud sync error for saveDocument:', e);
    }
  }

  public async deleteDocument(documentId: string): Promise<void> {
    this.memoryDocs = this.memoryDocs.filter((d) => d.id !== documentId);

    if (!this.useMemory) {
      try {
        const idb = await this.openDB();
        const tx = idb.transaction(STORES.DOCUMENTS, 'readwrite');
        tx.objectStore(STORES.DOCUMENTS).delete(documentId);
      } catch (err) {
        console.warn('Local deleteDocument failed:', err);
      }
    }

    // Delete in Firestore Cloud
    try {
      await deleteDoc(doc(db, 'documents', documentId));
      this.notifyDataChange({ type: 'documents' });
    } catch (e) {
      console.warn('Cloud delete document note:', e);
    }
  }

  // Custom Folders API
  public async getCustomFolders(): Promise<FolderDefinition[]> {
    if (this.useMemory) return this.memoryFolders.filter((f) => f.id !== 'folder_cust_insurance' && f.code !== '09');
    try {
      const idb = await this.openDB();
      const rawFolders: FolderDefinition[] = await new Promise((resolve, reject) => {
        const tx = idb.transaction(STORES.CUSTOM_FOLDERS, 'readonly');
        const store = tx.objectStore(STORES.CUSTOM_FOLDERS);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      });

      // Purge legacy folder 09 if present
      const cleaned = rawFolders.filter((f) => f.id !== 'folder_cust_insurance' && f.code !== '09');
      if (rawFolders.some((f) => f.id === 'folder_cust_insurance' || f.code === '09')) {
        const delTx = idb.transaction(STORES.CUSTOM_FOLDERS, 'readwrite');
        delTx.objectStore(STORES.CUSTOM_FOLDERS).delete('folder_cust_insurance');
      }
      return cleaned;
    } catch {
      return this.memoryFolders.filter((f) => f.id !== 'folder_cust_insurance' && f.code !== '09');
    }
  }

  public async saveCustomFolder(folder: FolderDefinition): Promise<void> {
    const idx = this.memoryFolders.findIndex((f) => f.id === folder.id);
    if (idx >= 0) {
      this.memoryFolders[idx] = folder;
    } else {
      this.memoryFolders.push(folder);
    }

    if (!this.useMemory) {
      try {
        const idb = await this.openDB();
        await new Promise<void>((resolve, reject) => {
          const tx = idb.transaction(STORES.CUSTOM_FOLDERS, 'readwrite');
          const store = tx.objectStore(STORES.CUSTOM_FOLDERS);
          const req = store.put(folder);
          req.onsuccess = () => resolve();
          req.onerror = () => reject(req.error);
        });
      } catch (e) {
        console.warn('Falling back to memory for saveCustomFolder:', e);
      }
    }

    try {
      await setDoc(doc(db, 'custom_folders', folder.id), cleanForFirestore(folder));
    } catch (e) {
      console.warn('Custom folder cloud sync note:', e);
    }
  }

  public async deleteCustomFolder(folderId: string): Promise<void> {
    this.memoryFolders = this.memoryFolders.filter((f) => f.id !== folderId);

    if (!this.useMemory) {
      try {
        const idb = await this.openDB();
        await new Promise<void>((resolve, reject) => {
          const tx = idb.transaction(STORES.CUSTOM_FOLDERS, 'readwrite');
          const store = tx.objectStore(STORES.CUSTOM_FOLDERS);
          const req = store.delete(folderId);
          req.onsuccess = () => resolve();
          req.onerror = () => reject(req.error);
        });
      } catch (e) {
        console.warn('Falling back to memory for deleteCustomFolder:', e);
      }
    }

    try {
      await deleteDoc(doc(db, 'custom_folders', folderId));
    } catch (e) {
      console.warn('Custom folder cloud delete note:', e);
    }
  }

  // General Settings / App Logo
  public async getSetting<T>(key: string, defaultValue: T): Promise<T> {
    if (this.memorySettings[key] !== undefined) {
      return this.memorySettings[key] as T;
    }
    try {
      const idb = await this.openDB();
      return await new Promise((resolve) => {
        const tx = idb.transaction(STORES.SETTINGS, 'readonly');
        const store = tx.objectStore(STORES.SETTINGS);
        const req = store.get(key);
        req.onsuccess = () => {
          if (req.result && req.result.value !== undefined) {
            resolve(req.result.value);
          } else {
            resolve(defaultValue);
          }
        };
        req.onerror = () => resolve(defaultValue);
      });
    } catch {
      return (this.memorySettings[key] as T) !== undefined ? (this.memorySettings[key] as T) : defaultValue;
    }
  }

  public async setSetting<T>(key: string, value: T): Promise<void> {
    this.memorySettings[key] = value;

    if (!this.useMemory) {
      try {
        const idb = await this.openDB();
        await new Promise<void>((resolve, reject) => {
          const tx = idb.transaction(STORES.SETTINGS, 'readwrite');
          const store = tx.objectStore(STORES.SETTINGS);
          const req = store.put({ key, value });
          req.onsuccess = () => resolve();
          req.onerror = () => reject(req.error);
        });
      } catch (e) {
        console.warn('Falling back to memory for setSetting:', e);
      }
    }

    try {
      await setDoc(doc(db, 'settings', key), cleanForFirestore({ value }));
    } catch (e) {
      console.warn('Settings cloud sync note:', e);
    }
  }

  // Real-time Event Subscription API
  public subscribeToDataChanges(listener: (event: { type: 'clients' | 'documents' | 'folders' | 'all' }) => void): () => void {
    this.dataChangeListeners.push(listener);
    return () => {
      this.dataChangeListeners = this.dataChangeListeners.filter((l) => l !== listener);
    };
  }

  private notifyDataChange(event: { type: 'clients' | 'documents' | 'folders' | 'all' }): void {
    this.dataChangeListeners.forEach((l) => l(event));
  }

  public getSyncState(): CloudSyncState {
    return { ...this.syncState };
  }

  public subscribeToSyncState(listener: (state: CloudSyncState) => void): () => void {
    this.syncStateListeners.push(listener);
    listener(this.getSyncState());
    return () => {
      this.syncStateListeners = this.syncStateListeners.filter((l) => l !== listener);
    };
  }

  private updateSyncState(partial: Partial<CloudSyncState>): void {
    this.syncState = { ...this.syncState, ...partial };
    this.syncStateListeners.forEach((l) => l(this.getSyncState()));
  }
}

export const dbService = new StorageService();

