import { ClientProfile, DocumentItem, FolderDefinition } from '../types';
import { INITIAL_CLIENTS, INITIAL_DOCUMENTS, INITIAL_CUSTOM_FOLDERS } from '../data/seedData';

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
            const db = (event.target as IDBOpenDBRequest).result;

            if (!db.objectStoreNames.contains(STORES.CLIENTS)) {
              const clientStore = db.createObjectStore(STORES.CLIENTS, { keyPath: 'id' });
              clientStore.createIndex('clientName', 'clientName', { unique: false });
              clientStore.createIndex('cifNo', 'cifNo', { unique: false });
            }

            if (!db.objectStoreNames.contains(STORES.DOCUMENTS)) {
              const docStore = db.createObjectStore(STORES.DOCUMENTS, { keyPath: 'id' });
              docStore.createIndex('clientId', 'clientId', { unique: false });
              docStore.createIndex('folderId', 'folderId', { unique: false });
              docStore.createIndex('expirationDate', 'expirationDate', { unique: false });
            }

            if (!db.objectStoreNames.contains(STORES.CUSTOM_FOLDERS)) {
              db.createObjectStore(STORES.CUSTOM_FOLDERS, { keyPath: 'id' });
            }

            if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
              db.createObjectStore(STORES.SETTINGS, { keyPath: 'key' });
            }
          } catch (e) {
            console.warn('Error upgrading IndexedDB schema:', e);
          }
        };

        request.onsuccess = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          resolve(db);
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

  // Initialize seed data if database is new
  public async initialize(): Promise<void> {
    try {
      const db = await this.openDB();
      const clients = await this.getClients();
      if (clients.length === 0) {
        // Seed clients
        const tx = db.transaction([STORES.CLIENTS, STORES.DOCUMENTS, STORES.CUSTOM_FOLDERS], 'readwrite');
        const clientStore = tx.objectStore(STORES.CLIENTS);
        const docStore = tx.objectStore(STORES.DOCUMENTS);
        const folderStore = tx.objectStore(STORES.CUSTOM_FOLDERS);

        for (const client of INITIAL_CLIENTS) {
          clientStore.put(client);
        }
        for (const doc of INITIAL_DOCUMENTS) {
          docStore.put(doc);
        }
        for (const f of INITIAL_CUSTOM_FOLDERS) {
          folderStore.put(f);
        }

        await new Promise<void>((res, rej) => {
          tx.oncomplete = () => res();
          tx.onerror = () => rej(tx.error);
        });
      }
    } catch (e) {
      console.warn('Using memory fallback for data store:', e);
      this.useMemory = true;
    }
  }

  // Clients API
  public async getClients(): Promise<ClientProfile[]> {
    if (this.useMemory) return [...this.memoryClients];
    try {
      const db = await this.openDB();
      return await new Promise((resolve, reject) => {
        const tx = db.transaction(STORES.CLIENTS, 'readonly');
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
      const db = await this.openDB();
      return await new Promise((resolve, reject) => {
        const tx = db.transaction(STORES.CLIENTS, 'readonly');
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
    const idx = this.memoryClients.findIndex((c) => c.id === client.id);
    if (idx >= 0) {
      this.memoryClients[idx] = updated;
    } else {
      this.memoryClients.unshift(updated);
    }

    if (!this.useMemory) {
      try {
        const db = await this.openDB();
        await new Promise<void>((resolve, reject) => {
          const tx = db.transaction(STORES.CLIENTS, 'readwrite');
          const store = tx.objectStore(STORES.CLIENTS);
          const request = store.put(updated);
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
      } catch (e) {
        console.warn('Falling back to memory for saveClient:', e);
      }
    }
  }

  public async deleteClient(clientId: string): Promise<void> {
    this.memoryClients = this.memoryClients.filter((c) => c.id !== clientId);
    this.memoryDocs = this.memoryDocs.filter((d) => d.clientId !== clientId);

    if (!this.useMemory) {
      try {
        const db = await this.openDB();
        const tx = db.transaction([STORES.CLIENTS, STORES.DOCUMENTS], 'readwrite');
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
  }

  // Documents API
  public async getDocuments(clientId?: string): Promise<DocumentItem[]> {
    if (this.useMemory) {
      return clientId ? this.memoryDocs.filter((d) => d.clientId === clientId) : [...this.memoryDocs];
    }
    try {
      const db = await this.openDB();
      return await new Promise((resolve, reject) => {
        const tx = db.transaction(STORES.DOCUMENTS, 'readonly');
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

  public async saveDocument(doc: DocumentItem): Promise<void> {
    const idx = this.memoryDocs.findIndex((d) => d.id === doc.id);
    if (idx >= 0) {
      this.memoryDocs[idx] = doc;
    } else {
      this.memoryDocs.unshift(doc);
    }

    if (!this.useMemory) {
      try {
        const db = await this.openDB();
        await new Promise<void>((resolve, reject) => {
          const tx = db.transaction(STORES.DOCUMENTS, 'readwrite');
          const store = tx.objectStore(STORES.DOCUMENTS);
          const req = store.put(doc);
          req.onsuccess = () => resolve();
          req.onerror = () => reject(req.error);
        });
      } catch (e) {
        console.warn('Falling back to memory for saveDocument:', e);
      }
    }
  }

  public async deleteDocument(docId: string): Promise<void> {
    this.memoryDocs = this.memoryDocs.filter((d) => d.id !== docId);

    if (!this.useMemory) {
      try {
        const db = await this.openDB();
        await new Promise<void>((resolve, reject) => {
          const tx = db.transaction(STORES.DOCUMENTS, 'readwrite');
          const store = tx.objectStore(STORES.DOCUMENTS);
          const req = store.delete(docId);
          req.onsuccess = () => resolve();
          req.onerror = () => reject(req.error);
        });
      } catch (e) {
        console.warn('Falling back to memory for deleteDocument:', e);
      }
    }
  }

  // Custom Folders API
  public async getCustomFolders(): Promise<FolderDefinition[]> {
    if (this.useMemory) {
      return this.memoryFolders.filter((f) => f.id !== 'folder_cust_insurance' && f.code !== '09');
    }
    try {
      const db = await this.openDB();
      const rawFolders: FolderDefinition[] = await new Promise((resolve, reject) => {
        const tx = db.transaction(STORES.CUSTOM_FOLDERS, 'readonly');
        const store = tx.objectStore(STORES.CUSTOM_FOLDERS);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      });

      // Purge legacy folder 09 if present
      const cleaned = rawFolders.filter((f) => f.id !== 'folder_cust_insurance' && f.code !== '09');
      if (rawFolders.some((f) => f.id === 'folder_cust_insurance' || f.code === '09')) {
        const delTx = db.transaction(STORES.CUSTOM_FOLDERS, 'readwrite');
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
        const db = await this.openDB();
        await new Promise<void>((resolve, reject) => {
          const tx = db.transaction(STORES.CUSTOM_FOLDERS, 'readwrite');
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
        const db = await this.openDB();
        await new Promise<void>((resolve, reject) => {
          const tx = db.transaction(STORES.CUSTOM_FOLDERS, 'readwrite');
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
    if (this.useMemory) {
      return (this.memorySettings[key] as T) !== undefined ? (this.memorySettings[key] as T) : defaultValue;
    }
    try {
      const db = await this.openDB();
      return await new Promise((resolve) => {
        const tx = db.transaction(STORES.SETTINGS, 'readonly');
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
        const db = await this.openDB();
        await new Promise<void>((resolve, reject) => {
          const tx = db.transaction(STORES.SETTINGS, 'readwrite');
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
