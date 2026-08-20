import { ClientProfile, DocumentItem, FolderDefinition } from '../types';
import { INITIAL_CLIENTS, INITIAL_DOCUMENTS, INITIAL_CUSTOM_FOLDERS } from '../data/seedData';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, doc, getDocs, setDoc, deleteDoc } from 'firebase/firestore';

const DB_NAME = 'IEN_REALTY_COMPLIANCE_DB';
const DB_VERSION = 1;

const STORES = {
  CLIENTS: 'clients',
  DOCUMENTS: 'documents',
  CUSTOM_FOLDERS: 'custom_folders',
  SETTINGS: 'settings',
};

class StorageService {
  private dbPromise: Promise<IDBDatabase> | null = null;
  private memoryClients: ClientProfile[] = [...INITIAL_CLIENTS];
  private memoryDocs: DocumentItem[] = [...INITIAL_DOCUMENTS];
  private memoryFolders: FolderDefinition[] = [...INITIAL_CUSTOM_FOLDERS];
  private memorySettings: Record<string, unknown> = {};
  private useMemory = false;
  private isCloudSynced = false;

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

  // Initialize seed data and sync with Firestore
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
      }

      // Sync with Firestore in background
      this.syncFromCloud().catch((err) => {
        console.warn('Cloud sync deferred:', err);
      });
    } catch (e) {
      console.warn('Using memory fallback for data store:', e);
      this.useMemory = true;
    }
  }

  // Cloud Synchronization
  public async syncFromCloud(): Promise<void> {
    if (this.isCloudSynced) return;
    try {
      // Sync clients
      const clientsSnapshot = await getDocs(collection(db, 'clients'));
      if (!clientsSnapshot.empty) {
        for (const docSnap of clientsSnapshot.docs) {
          const cloudClient = docSnap.data() as ClientProfile;
          await this.saveClientLocal(cloudClient);
        }
      }

      // Sync documents
      const docsSnapshot = await getDocs(collection(db, 'documents'));
      if (!docsSnapshot.empty) {
        for (const docSnap of docsSnapshot.docs) {
          const cloudDoc = docSnap.data() as DocumentItem;
          await this.saveDocumentLocal(cloudDoc);
        }
      }
      this.isCloudSynced = true;
    } catch (e) {
      // Offline or first run fallback
      console.info('Firestore initial fetch status:', e);
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
    const updated = { ...client, updatedAt: new Date().toISOString() };
    await this.saveClientLocal(updated);

    // Save to Firestore Cloud
    try {
      await setDoc(doc(db, 'clients', client.id), updated);
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
      } catch (e) {
        console.warn('Falling back to memory for deleteClient:', e);
      }
    }

    // Delete from Firestore Cloud
    try {
      await deleteDoc(doc(db, 'clients', clientId));
    } catch (e) {
      console.warn('Cloud sync error for deleteClient:', e);
    }
  }

  // Documents API
  public async getDocuments(clientId?: string): Promise<DocumentItem[]> {
    if (this.useMemory) {
      return clientId ? this.memoryDocs.filter((d) => d.clientId === clientId) : [...this.memoryDocs];
    }
    try {
      const idb = await this.openDB();
      return await new Promise((resolve, reject) => {
        const tx = idb.transaction(STORES.DOCUMENTS, 'readonly');
        const store = tx.objectStore(STORES.DOCUMENTS);

        if (clientId) {
          const index = store.index('clientId');
          const req = index.getAll(clientId);
          req.onsuccess = () => resolve(req.result || []);
          req.onerror = () => reject(req.error);
        } else {
          const req = store.getAll();
          req.onsuccess = () => resolve(req.result || []);
          req.onerror = () => reject(req.error);
        }
      });
    } catch {
      return clientId ? this.memoryDocs.filter((d) => d.clientId === clientId) : [...this.memoryDocs];
    }
  }

  public async saveDocument(docItem: DocumentItem): Promise<void> {
    await this.saveDocumentLocal(docItem);

    // Save to Firestore Cloud
    try {
      await setDoc(doc(db, 'documents', docItem.id), docItem);
    } catch (e) {
      console.warn('Cloud sync error for saveDocument:', e);
    }
  }

  public async deleteDocument(docId: string): Promise<void> {
    this.memoryDocs = this.memoryDocs.filter((d) => d.id !== docId);

    if (!this.useMemory) {
      try {
        const idb = await this.openDB();
        await new Promise<void>((resolve, reject) => {
          const tx = idb.transaction(STORES.DOCUMENTS, 'readwrite');
          const store = tx.objectStore(STORES.DOCUMENTS);
          const req = store.delete(docId);
          req.onsuccess = () => resolve();
          req.onerror = () => reject(req.error);
        });
      } catch (e) {
        console.warn('Falling back to memory for deleteDocument:', e);
      }
    }

    // Delete from Firestore Cloud
    try {
      await deleteDoc(doc(db, 'documents', docId));
    } catch (e) {
      console.warn('Cloud sync error for deleteDocument:', e);
    }
  }

  // Custom Folders API
  public async getCustomFolders(): Promise<FolderDefinition[]> {
    if (this.useMemory) {
      return this.memoryFolders.filter((f) => f.id !== 'folder_cust_insurance' && f.code !== '09');
    }
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
  }
}

export const dbService = new StorageService();

