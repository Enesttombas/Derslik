import type { WorkspaceDocument } from "./pdf-workspace";

export interface StoredLocalWorkspace {
  key: string; // `${userId}:${pdfId}`
  userId: string;
  pdfId: string;
  baseRevision: number;
  mutationId: string;
  document: WorkspaceDocument;
  savedAt: string;
  isPendingSync: boolean;
}

const DB_NAME = "derslik_pdf_workspace_db";
const DB_VERSION = 1;
const STORE_NAME = "workspaces";

let dbPromise: Promise<IDBDatabase> | null = null;

function getDbInstance(): Promise<IDBDatabase> {
  if (typeof window === "undefined" || !window.indexedDB) {
    return Promise.reject(new Error("IndexedDB is not available in this environment"));
  }

  if (dbPromise) return dbPromise;

  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "key" });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      dbPromise = null;
      reject(request.error || new Error("Failed to open IndexedDB"));
    };
  });

  return dbPromise;
}

export function buildWorkspaceKey(userId: string, pdfId: string): string {
  return `${userId}:${pdfId}`;
}

export async function getLocalWorkspace(
  userId: string,
  pdfId: string
): Promise<StoredLocalWorkspace | null> {
  try {
    const db = await getDbInstance();
    const key = buildWorkspaceKey(userId, pdfId);

    return new Promise<StoredLocalWorkspace | null>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);

      req.onsuccess = () => {
        const result = req.result as StoredLocalWorkspace | undefined;
        if (!result) {
          resolve(null);
          return;
        }
        // Verify user isolation: never leak another user's workspace
        if (result.userId !== userId || result.pdfId !== pdfId) {
          resolve(null);
          return;
        }
        resolve(result);
      };

      req.onerror = () => {
        reject(req.error || new Error("Failed to read from IndexedDB"));
      };
    });
  } catch {
    return null;
  }
}

export async function saveLocalWorkspace(
  userId: string,
  pdfId: string,
  data: Omit<StoredLocalWorkspace, "key">
): Promise<void> {
  const db = await getDbInstance();
  const key = buildWorkspaceKey(userId, pdfId);
  const record: StoredLocalWorkspace = {
    key,
    ...data,
  };

  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    store.put(record);

    tx.oncomplete = () => {
      // "Only show local saved after IDB transaction commit"
      resolve();
    };

    tx.onerror = () => {
      reject(tx.error || new Error("Failed to commit IndexedDB transaction"));
    };

    tx.onabort = () => {
      reject(new Error("IndexedDB transaction was aborted"));
    };
  });
}

export async function setLocalWorkspace(
  record: {
    pdfId: string;
    userId: string;
    document: WorkspaceDocument;
    baseRevision: number;
    mutationId: string;
    isPendingSync: boolean;
    savedAt: string;
  }
): Promise<void> {
  return saveLocalWorkspace(record.userId, record.pdfId, {
    userId: record.userId,
    pdfId: record.pdfId,
    document: record.document,
    baseRevision: record.baseRevision,
    mutationId: record.mutationId,
    isPendingSync: record.isPendingSync,
    savedAt: record.savedAt,
  });
}

export async function markLocalWorkspaceSynced(
  userId: string,
  pdfId: string,
  mutationId: string,
  serverRevision: number,
  successorMutationId?: string
): Promise<void> {
  try {
    const db = await getDbInstance();
    const key = buildWorkspaceKey(userId, pdfId);

    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);

      req.onsuccess = () => {
        const current = req.result as StoredLocalWorkspace | undefined;
        if (!current) {
          resolve();
          return;
        }

        // Stale acks may NOT clear newer pending snapshot!
        if (current.mutationId === mutationId) {
          current.isPendingSync = false;
          current.baseRevision = serverRevision;
          store.put(current);
        } else if (current.mutationId === successorMutationId && current.isPendingSync) {
          // Rebase only this session's known successor; never another tab's work.
          current.baseRevision = Math.max(current.baseRevision, serverRevision);
          store.put(current);
        }
      };

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error || new Error("Failed to mark synced in IndexedDB"));
    });
  } catch {
    // Ignore sync mark errors locally
  }
}

export async function clearLocalWorkspace(
  userId: string,
  pdfId: string
): Promise<void> {
  try {
    const db = await getDbInstance();
    const key = buildWorkspaceKey(userId, pdfId);

    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      store.delete(key);

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error || new Error("Failed to delete from IndexedDB"));
    });
  } catch {
    // Ignore clear errors
  }
}
