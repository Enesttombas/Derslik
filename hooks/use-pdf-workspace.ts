"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type {
  Annotation,
  WorkspaceDocument,
  WorkspaceSnapshot,
} from "@/lib/pdf-workspace";
import { workspaceDocumentSchema } from "@/lib/pdf-workspace";
import {
  getLocalWorkspace,
  saveLocalWorkspace,
  markLocalWorkspaceSynced,
  type StoredLocalWorkspace,
} from "@/lib/pdf-workspace-storage";

export type SyncStatus =
  | "saving"
  | "local_saved"
  | "synced"
  | "error"
  | "conflict";

export interface UsePdfWorkspaceReturn {
  document: WorkspaceDocument;
  revision: number;
  syncStatus: SyncStatus;
  syncStatusText: string;
  isLoading: boolean;
  loadError: string | null;
  isConflict: boolean;
  conflictWorkspace: WorkspaceSnapshot | null;
  isOnline: boolean;
  setPage: (page: number) => void;
  setZoom: (zoom: number) => void;
  toggleBookmark: (page: number) => void;
  addAnnotation: (annotation: Annotation) => void;
  updateAnnotation: (id: string, updates: Partial<Annotation>) => void;
  deleteAnnotation: (id: string) => void;
  undoLastAnnotation: (kind?: "pen" | "highlight") => void;
  retrySync: () => void;
  resolveConflictUseServer: () => Promise<void>;
  exportWorkspaceJson: () => void;
}

const DEFAULT_DOCUMENT: WorkspaceDocument = {
  page: 1,
  zoom: 1,
  bookmarks: [],
  annotations: [],
};

export const SYNC_STATUS_TEXTS: Record<SyncStatus, string> = {
  saving: "Kaydediliyor...",
  local_saved: "Bu cihazda kaydedildi, senkron bekliyor",
  synced: "Hesabına kaydedildi",
  error: "Kaydedilemedi, tekrar dene",
  conflict: "Çakışma: Sunucu sürümü güncellenmiş",
};

export function usePdfWorkspace(
  pdfId: string,
  userId: string
): UsePdfWorkspaceReturn {
  const [document, setDocument] = useState<WorkspaceDocument>(DEFAULT_DOCUMENT);
  const [revision, setRevision] = useState<number>(0);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("synced");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [isConflict, setIsConflict] = useState<boolean>(false);
  const [conflictWorkspace, setConflictWorkspace] =
    useState<WorkspaceSnapshot | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );

  const isMountedRef = useRef(true);
  const docRef = useRef(document);
  const revRef = useRef(revision);
  const isConflictRef = useRef(isConflict);

  useEffect(() => {
    docRef.current = document;
  }, [document]);

  useEffect(() => {
    revRef.current = revision;
  }, [revision]);

  useEffect(() => {
    isConflictRef.current = isConflict;
  }, [isConflict]);

  const pendingMutationRef = useRef<{
    mutationId: string;
    document: WorkspaceDocument;
  } | null>(null);

  const isSyncInFlightRef = useRef(false);
  const localWriteRef = useRef<Promise<void>>(Promise.resolve());
  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Server PUT execution logic
  const triggerServerSyncRef = useRef<() => Promise<void>>(() => Promise.resolve());

  const scheduleDebouncedSync = useCallback(() => {
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }
    syncTimeoutRef.current = setTimeout(() => {
      triggerServerSyncRef.current();
    }, 600);
  }, []);

  const triggerServerSync = useCallback(async () => {
    if (isSyncInFlightRef.current || isConflictRef.current) return;
    if (!pendingMutationRef.current) return;
    if (!navigator.onLine) return;

    isSyncInFlightRef.current = true;
    const currentMutation = pendingMutationRef.current;
    let acknowledged = false;

    try {
      const res = await fetch(`/api/pdfs/${pdfId}/workspace`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          baseRevision: revRef.current,
          mutationId: currentMutation.mutationId,
          document: currentMutation.document,
        }),
      });

      if (!isMountedRef.current) return;

      if (res.ok) {
        const data = (await res.json()) as { workspace: WorkspaceSnapshot };
        const newRev = data.workspace.revision;
        revRef.current = newRev;
        setRevision(newRev);
        acknowledged = true;

        // Mark local IDB as synced for this specific mutationId
        await localWriteRef.current.catch(() => {});
        await markLocalWorkspaceSynced(
          userId,
          pdfId,
          currentMutation.mutationId,
          newRev,
          pendingMutationRef.current?.mutationId
        );

        if (
          pendingMutationRef.current &&
          pendingMutationRef.current.mutationId === currentMutation.mutationId
        ) {
          pendingMutationRef.current = null;
          setSyncStatus("synced");
        }
      } else if (res.status === 409) {
        // Conflict! Freeze auto-sync
        const conflictData = (await res.json()) as { workspace?: WorkspaceSnapshot };
        isConflictRef.current = true;
        setIsConflict(true);
        setConflictWorkspace(conflictData.workspace || null);
        setSyncStatus("conflict");
      } else {
        setSyncStatus("error");
      }
    } catch {
      if (isMountedRef.current) {
        setSyncStatus("error");
      }
    } finally {
      isSyncInFlightRef.current = false;
      // If a newer mutation queued while sync was in flight and not in conflict, schedule next sync
      if (
        pendingMutationRef.current &&
        acknowledged &&
        pendingMutationRef.current.mutationId !== currentMutation.mutationId &&
        !isConflictRef.current &&
        isMountedRef.current
      ) {
        scheduleDebouncedSync();
      }
    }
  }, [pdfId, userId, scheduleDebouncedSync]);

  useEffect(() => {
    triggerServerSyncRef.current = triggerServerSync;
  }, [triggerServerSync]);

  // Online / offline listeners
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (loadError) setLoadAttempt((attempt) => attempt + 1);
      if (pendingMutationRef.current && !isConflictRef.current) {
        triggerServerSyncRef.current();
      }
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [loadError]);

  // Persist a document change locally immediately, then schedule server sync
  const commitDocChange = useCallback(
    async (newDoc: WorkspaceDocument) => {
      if (isLoading || loadError || isConflictRef.current) return;
      if (!workspaceDocumentSchema.safeParse(newDoc).success) {
        setSyncStatus("error");
        return;
      }
      setDocument(newDoc);
      docRef.current = newDoc;

      if (isConflictRef.current) {
        // Auto-sync is frozen on conflict; user can still inspect or export
        return;
      }

      const mutationId = `mut_${Date.now()}_${Math.random()
        .toString(36)
        .substring(2, 9)}`;
      pendingMutationRef.current = {
        mutationId,
        document: newDoc,
      };

      setSyncStatus("saving");

      try {
        const localWrite = localWriteRef.current.catch(() => {}).then(() => saveLocalWorkspace(userId, pdfId, {
          userId,
          pdfId,
          baseRevision: revRef.current,
          mutationId,
          document: newDoc,
          savedAt: new Date().toISOString(),
          isPendingSync: true,
        }));
        localWriteRef.current = localWrite;
        await localWrite;

        if (isMountedRef.current && !isConflictRef.current) {
          setSyncStatus("local_saved");
        }
      } catch (err) {
        console.warn("IndexedDB save failed, proceeding with server sync", err);
        if (isMountedRef.current) setSyncStatus("error");
      }

      scheduleDebouncedSync();
    },
    [pdfId, userId, scheduleDebouncedSync, isLoading, loadError]
  );

  // Initial Load & Reconcile
  useEffect(() => {
    isMountedRef.current = true;
    let cancelled = false;

    async function loadWorkspace() {
      setIsLoading(true);
      setLoadError(null);

      let localRecord: StoredLocalWorkspace | null = null;
      try {
        localRecord = await getLocalWorkspace(userId, pdfId);
      } catch {
        // ignore IDB read error
      }

      let serverData: WorkspaceSnapshot | null = null;
      let serverFetchFailed = false;

      try {
        const res = await fetch(`/api/pdfs/${pdfId}/workspace`, {
          cache: "no-store",
        });
        if (res.ok) {
          const body = (await res.json()) as { workspace: WorkspaceSnapshot };
          serverData = body.workspace;
        } else {
          serverFetchFailed = true;
        }
      } catch {
        serverFetchFailed = true;
      }

      if (cancelled) return;

      if (serverFetchFailed) {
        if (localRecord) {
          setDocument(localRecord.document);
          setRevision(localRecord.baseRevision);
          revRef.current = localRecord.baseRevision;
          if (localRecord.isPendingSync) {
            pendingMutationRef.current = {
              mutationId: localRecord.mutationId,
              document: localRecord.document,
            };
            scheduleDebouncedSync();
          }
          setSyncStatus(localRecord.isPendingSync ? "local_saved" : "synced");
        } else {
          setLoadError(
            "Çalışma alanı yüklenemedi. Lütfen internet bağlantınızı kontrol edip tekrar deneyin."
          );
        }
        setIsLoading(false);
        return;
      }

      if (!serverData) {
        setIsLoading(false);
        return;
      }

      // Reconcile local vs server
      if (localRecord && localRecord.isPendingSync) {
        if (serverData.revision === localRecord.baseRevision) {
          // Local changes pending on matching baseRevision -> keep local and sync to server
          setDocument(localRecord.document);
          setRevision(localRecord.baseRevision);
          revRef.current = localRecord.baseRevision;
          pendingMutationRef.current = {
            mutationId: localRecord.mutationId,
            document: localRecord.document,
          };
          setSyncStatus("local_saved");
          scheduleDebouncedSync();
        } else {
          // Retry the original mutation first: its response may have been lost.
          // The server distinguishes an idempotent retry from a genuine conflict.
          setDocument(localRecord.document);
          setRevision(localRecord.baseRevision);
          revRef.current = localRecord.baseRevision;
          pendingMutationRef.current = {
            mutationId: localRecord.mutationId,
            document: localRecord.document,
          };
          setSyncStatus("local_saved");
          scheduleDebouncedSync();
        }
      } else {
        // Local has no pending changes; use server data
        const docFromServer: WorkspaceDocument = {
          page: serverData.page,
          zoom: serverData.zoom,
          bookmarks: serverData.bookmarks,
          annotations: serverData.annotations,
        };
        setDocument(docFromServer);
        setRevision(serverData.revision);
        revRef.current = serverData.revision;
        setSyncStatus("synced");

        // Cache server state in IDB
        saveLocalWorkspace(userId, pdfId, {
          userId,
          pdfId,
          baseRevision: serverData.revision,
          mutationId: `init_${Date.now()}`,
          document: docFromServer,
          savedAt: new Date().toISOString(),
          isPendingSync: false,
        }).catch(() => {});
      }

      setIsLoading(false);
    }

    loadWorkspace();

    return () => {
      cancelled = true;
      isMountedRef.current = false;
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [pdfId, userId, scheduleDebouncedSync, loadAttempt]);

  // Actions
  const setPage = useCallback(
    (page: number) => {
      const validPage = Math.max(1, Math.min(10000, Math.round(page)));
      if (validPage === docRef.current.page) return;
      commitDocChange({ ...docRef.current, page: validPage });
    },
    [commitDocChange]
  );

  const setZoom = useCallback(
    (zoom: number) => {
      const validZoom = Math.max(0.5, Math.min(3, Math.round(zoom * 100) / 100));
      if (validZoom === docRef.current.zoom) return;
      commitDocChange({ ...docRef.current, zoom: validZoom });
    },
    [commitDocChange]
  );

  const toggleBookmark = useCallback(
    (page: number) => {
      const current = docRef.current.bookmarks;
      const next = current.includes(page)
        ? current.filter((p) => p !== page)
        : [...current, page].sort((a, b) => a - b);
      commitDocChange({ ...docRef.current, bookmarks: next });
    },
    [commitDocChange]
  );

  const addAnnotation = useCallback(
    (annotation: Annotation) => {
      const next = [...docRef.current.annotations, annotation];
      commitDocChange({ ...docRef.current, annotations: next });
    },
    [commitDocChange]
  );

  const updateAnnotation = useCallback(
    (id: string, updates: Partial<Annotation>) => {
      const next = docRef.current.annotations.map((ann) => {
        if (ann.id !== id) return ann;
        return { ...ann, ...updates } as Annotation;
      });
      commitDocChange({ ...docRef.current, annotations: next });
    },
    [commitDocChange]
  );

  const deleteAnnotation = useCallback(
    (id: string) => {
      const next = docRef.current.annotations.filter((ann) => ann.id !== id);
      commitDocChange({ ...docRef.current, annotations: next });
    },
    [commitDocChange]
  );

  const undoLastAnnotation = useCallback(
    (kind?: "pen" | "highlight") => {
      const list = docRef.current.annotations;
      for (let i = list.length - 1; i >= 0; i--) {
        const item = list[i];
        if (item.page === docRef.current.page && item.kind !== "note" && (!kind || item.kind === kind)) {
          const next = list.filter((_, idx) => idx !== i);
          commitDocChange({ ...docRef.current, annotations: next });
          break;
        }
      }
    },
    [commitDocChange]
  );

  const retrySync = useCallback(() => {
    if (isConflictRef.current) return;
    if (loadError) {
      setLoadAttempt((attempt) => attempt + 1);
      return;
    }
    setSyncStatus("saving");
    triggerServerSync();
  }, [triggerServerSync, loadError]);

  const resolveConflictUseServer = useCallback(async () => {
    if (!conflictWorkspace) return;
    const serverDoc: WorkspaceDocument = {
      page: conflictWorkspace.page,
      zoom: conflictWorkspace.zoom,
      bookmarks: conflictWorkspace.bookmarks,
      annotations: conflictWorkspace.annotations,
    };

    setDocument(serverDoc);
    setRevision(conflictWorkspace.revision);
    revRef.current = conflictWorkspace.revision;
    setIsConflict(false);
    isConflictRef.current = false;
    setConflictWorkspace(null);
    pendingMutationRef.current = null;
    setSyncStatus("synced");

    await saveLocalWorkspace(userId, pdfId, {
      userId,
      pdfId,
      baseRevision: conflictWorkspace.revision,
      mutationId: `resolve_${Date.now()}`,
      document: serverDoc,
      savedAt: new Date().toISOString(),
      isPendingSync: false,
    });
  }, [conflictWorkspace, pdfId, userId]);

  const exportWorkspaceJson = useCallback(() => {
    const dataToExport = {
      pdfId,
      userId,
      exportedAt: new Date().toISOString(),
      revision: revRef.current,
      document: docRef.current,
      conflict: conflictWorkspace,
    };
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = window.document.createElement("a");
    a.href = url;
    a.download = `pdf-workspace-backup-${pdfId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [pdfId, userId, conflictWorkspace]);

  return {
    document,
    revision,
    syncStatus,
    syncStatusText: SYNC_STATUS_TEXTS[syncStatus],
    isLoading,
    loadError,
    isConflict,
    conflictWorkspace,
    isOnline,
    setPage,
    setZoom,
    toggleBookmark,
    addAnnotation,
    updateAnnotation,
    deleteAnnotation,
    undoLastAnnotation,
    retrySync,
    resolveConflictUseServer,
    exportWorkspaceJson,
  };
}
