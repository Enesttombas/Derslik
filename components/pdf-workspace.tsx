"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  AlertTriangle,
  FileDown,
  RefreshCw,
  StickyNote,
} from "lucide-react";
import {
  usePdfWorkspace,
} from "@/hooks/use-pdf-workspace";
import type {
  PenAnnotation,
  HighlightAnnotation,
  NoteAnnotation,
} from "@/lib/pdf-workspace";
import {
  PdfWorkspaceToolbar,
  type WorkspaceTool,
  PALETTE_COLORS,
} from "./pdf-workspace-toolbar";
import { PdfWorkspaceNotes } from "./pdf-workspace-notes";

export interface PdfWorkspaceProps {
  pdfId: string;
  userId: string;
  fileName?: string;
  onClose?: () => void;
}

interface Point {
  x: number;
  y: number;
}

export function PdfWorkspace({ pdfId, userId }: PdfWorkspaceProps) {
  // Persistence Hook
  const {
    document: workspaceDoc,
    syncStatus,
    syncStatusText,
    isLoading: isWorkspaceLoading,
    loadError: workspaceLoadError,
    isConflict,
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
  } = usePdfWorkspace(pdfId, userId);

  // PDF.js State
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfDocRef = useRef<any>(null);
  const [numPages, setNumPages] = useState<number>(1);
  const [isPdfLoading, setIsPdfLoading] = useState<boolean>(true);
  const [pdfLoadError, setPdfLoadError] = useState<string | null>(null);
  const [pdfAttempt, setPdfAttempt] = useState(0);

  // Active Tool & Style State
  const [activeTool, setActiveTool] = useState<WorkspaceTool>("hand");
  const [selectedColor, setSelectedColor] = useState<string>(PALETTE_COLORS[0]);
  const [isNotesOpen, setIsNotesOpen] = useState<boolean>(false);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);

  // Drawing State (Points accumulated during in-progress stroke)
  const [currentStroke, setCurrentStroke] = useState<Point[] | null>(null);
  const strokeRef = useRef<Point[] | null>(null);
  const isDrawingRef = useRef(false);

  // Canvas & Container Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const currentRenderTaskRef = useRef<any>(null);
  const [availableWidth, setAvailableWidth] = useState(0);
  const [pageSize, setPageSize] = useState<{ width: number; height: number }>({
    width: 600,
    height: 800,
  });

  const currentPage = workspaceDoc.page || 1;
  const zoom = workspaceDoc.zoom || 1.0;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver(([entry]) => {
      setAvailableWidth(Math.max(0, entry.contentRect.width));
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // 1. Dynamic client-only import and PDF loading
  useEffect(() => {
    let cancelled = false;
    let dispose: (() => void) | undefined;

    async function loadPdf() {
      setIsPdfLoading(true);
      setPdfLoadError(null);
      try {
        const pdfjs = await import("pdfjs-dist");
        // Same-origin worker script
        pdfjs.GlobalWorkerOptions.workerSrc = "/pdfjs/pdf.worker.min.mjs";

        const loadingTask = pdfjs.getDocument({
          url: `/api/pdfs/${pdfId}`,
          withCredentials: true,
          cMapUrl: "/pdfjs/cmaps/",
          cMapPacked: true,
          standardFontDataUrl: "/pdfjs/standard_fonts/",
        });
        dispose = () => { void loadingTask.destroy(); };

        const doc = await loadingTask.promise;
        if (cancelled) {
          doc.cleanup();
          loadingTask.destroy();
          return;
        }

        pdfDocRef.current = doc;
        setNumPages(doc.numPages);
        setIsPdfLoading(false);
      } catch (err) {
        if (!cancelled) {
          console.error("PDF loading error:", err);
          setPdfLoadError(
            err instanceof Error ? err.message : "PDF yüklenirken bir hata oluştu."
          );
          setIsPdfLoading(false);
        }
      }
    }

    loadPdf();

    return () => {
      cancelled = true;
      if (currentRenderTaskRef.current) {
        currentRenderTaskRef.current.cancel();
      }
      if (pdfDocRef.current) {
        pdfDocRef.current = null;
      }
      dispose?.();
    };
  }, [pdfId, pdfAttempt]);

  // 2. Render Page on Canvas
  const renderCurrentPage = useCallback(async () => {
    if (!pdfDocRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    try {
      if (currentRenderTaskRef.current) {
        currentRenderTaskRef.current.cancel();
      }

      const pageNumber = Math.max(
        1,
        Math.min(pdfDocRef.current.numPages, currentPage)
      );
      const page = await pdfDocRef.current.getPage(pageNumber);

      // Fit narrow screens locally; retain the saved zoom and normalized ink coordinates.
      const naturalWidth = page.getViewport({ scale: 1 }).width;
      const fitScale = availableWidth > 0 ? Math.min(1, availableWidth / naturalWidth) : 1;
      const viewport = page.getViewport({ scale: zoom * fitScale });
      const dpr = window.devicePixelRatio || 1;

      canvas.width = Math.floor(viewport.width * dpr);
      canvas.height = Math.floor(viewport.height * dpr);
      canvas.style.width = `${viewport.width}px`;
      canvas.style.height = `${viewport.height}px`;

      setPageSize({ width: viewport.width, height: viewport.height });

      const transform = dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : null;

      const renderContext = {
        canvasContext: ctx,
        viewport,
        transform: transform ?? undefined,
      };

      const renderTask = page.render(renderContext);
      currentRenderTaskRef.current = renderTask;
      await renderTask.promise;
    } catch (err: unknown) {
      if (
        err &&
        typeof err === "object" &&
        "name" in err &&
        err.name === "RenderingCancelledException"
      ) {
        // Expected when rapid navigation cancels prior render
        return;
      }
      console.warn("PDF render warning:", err);
    }
  }, [currentPage, zoom, availableWidth]);

  useEffect(() => {
    if (!isPdfLoading && pdfDocRef.current) {
      renderCurrentPage();
    }
  }, [isPdfLoading, currentPage, zoom, renderCurrentPage]);

  // Fit to Width calculation
  const handleFitWidth = useCallback(async () => {
    if (!containerRef.current || !pdfDocRef.current) return;
    try {
      const page = await pdfDocRef.current.getPage(currentPage);
      const defaultViewport = page.getViewport({ scale: 1.0 });
      const containerWidth = availableWidth;
      if (containerWidth > 0 && defaultViewport.width > 0) {
        const computedZoom = Math.min(3, Math.max(1, containerWidth / defaultViewport.width));
        setZoom(computedZoom);
      }
    } catch {
      // fallback
    }
  }, [currentPage, setZoom, availableWidth]);

  // 3. Pointer & Drawing handlers
  const getNormalizedPoint = (e: React.PointerEvent<SVGSVGElement>): Point => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    return {
      x: Math.round(x * 10000) / 10000,
      y: Math.round(y * 10000) / 10000,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (isConflict) return;
    if (activeTool !== "pen" && activeTool !== "highlight") return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    isDrawingRef.current = true;
    const pt = getNormalizedPoint(e);
    strokeRef.current = [pt];
    setCurrentStroke([pt]);
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!isDrawingRef.current || !strokeRef.current) return;
    e.preventDefault();
    const pt = getNormalizedPoint(e);
    if (strokeRef.current.length >= 10000) return;
    strokeRef.current = [...strokeRef.current, pt];
    setCurrentStroke(strokeRef.current);
  };

  const handlePointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!isDrawingRef.current || !strokeRef.current) return;
    const completedStroke = strokeRef.current;
    isDrawingRef.current = false;
    e.currentTarget.releasePointerCapture(e.pointerId);

    if (completedStroke.length > 0) {
      // If single click, duplicate point so stroke is visible
      const points =
        completedStroke.length === 1
          ? [completedStroke[0], { ...completedStroke[0], x: Math.min(1, completedStroke[0].x + 0.0001) }]
          : completedStroke;

      const strokeWidth = activeTool === "highlight" ? 0.03 : 0.004;

      const newAnnotation: PenAnnotation | HighlightAnnotation = {
        id: `${activeTool}_${Date.now()}_${Math.random()
          .toString(36)
          .substring(2, 7)}`,
        page: currentPage,
        kind: activeTool as "pen" | "highlight",
        color: selectedColor,
        width: strokeWidth,
        points,
      };

      addAnnotation(newAnnotation);
    }

    setCurrentStroke(null);
    strokeRef.current = null;
  };

  // 4. Note creation by canvas click
  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (isConflict) return;
    if (activeTool !== "note") return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(0.95, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(0.95, (e.clientY - rect.top) / rect.height));

    const newNoteId = `note_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 7)}`;

    const newNote: NoteAnnotation = {
      id: newNoteId,
      page: currentPage,
      kind: "note",
      x: Math.round(x * 10000) / 10000,
      y: Math.round(y * 10000) / 10000,
      color: selectedColor,
      text: "Yeni Not",
    };

    addAnnotation(newNote);
    setSelectedNoteId(newNoteId);
    setIsNotesOpen(true);
  };

  const handleAddAccessibleNote = () => {
    if (isConflict) return;
    const newNoteId = `note_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 7)}`;

    const newNote: NoteAnnotation = {
      id: newNoteId,
      page: currentPage,
      kind: "note",
      x: 0.1,
      y: 0.1,
      color: selectedColor,
      text: "Yeni Not",
    };

    addAnnotation(newNote);
    setSelectedNoteId(newNoteId);
    setIsNotesOpen(true);
  };

  // Filter current page annotations
  const pageAnnotations = workspaceDoc.annotations.filter(
    (a) => a.page === currentPage
  );

  const noteAnnotations = workspaceDoc.annotations.filter(
    (a): a is NoteAnnotation => a.kind === "note"
  );

  const isCurrentBookmarked = workspaceDoc.bookmarks.includes(currentPage);
  const canUndo = pageAnnotations.some(
    (a) => a.kind === "pen" || a.kind === "highlight"
  );

  // SVG path generator for strokes
  const generatePathData = (points: Point[]) => {
    if (points.length === 0) return "";
    const [first, ...rest] = points;
    const startX = first.x * pageSize.width;
    const startY = first.y * pageSize.height;
    let d = `M ${startX} ${startY}`;
    for (const p of rest) {
      d += ` L ${p.x * pageSize.width} ${p.y * pageSize.height}`;
    }
    return d;
  };

  return (
    <div className="flex h-full w-full flex-col bg-stone-100 font-sans select-none">
      {/* Conflict Warning Banner */}
      {isConflict && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-rose-300 bg-rose-50 px-4 py-2 text-xs text-rose-800">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
            <span className="font-semibold">
              Senkronizasyon Çakışması: Bu belgenin sunucudaki sürümü başka bir
              cihazda güncellenmiş.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={exportWorkspaceJson}
              className="flex items-center gap-1 rounded-lg border border-rose-300 bg-white px-2.5 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50"
            >
              <FileDown className="h-3.5 w-3.5" />
              <span>Yerel Kopyayı İndir</span>
            </button>
            <button
              type="button"
              onClick={resolveConflictUseServer}
              className="rounded-lg bg-rose-600 px-3 py-1 text-xs font-bold text-white hover:bg-rose-700"
            >
              Sunucu Sürümünü Yükle
            </button>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <PdfWorkspaceToolbar
        activeTool={activeTool}
        setActiveTool={setActiveTool}
        selectedColor={selectedColor}
        setSelectedColor={setSelectedColor}
        currentPage={currentPage}
        numPages={numPages}
        onPageChange={(page) => setPage(Math.max(1, Math.min(numPages, page)))}
        zoom={zoom}
        onZoomChange={setZoom}
        onFitWidth={handleFitWidth}
        isBookmarked={isCurrentBookmarked}
        onToggleBookmark={() => toggleBookmark(currentPage)}
        bookmarks={workspaceDoc.bookmarks}
        canUndo={canUndo}
        onUndo={() => undoLastAnnotation()}
        syncStatus={syncStatus}
        syncStatusText={syncStatusText}
        onRetrySync={retrySync}
        onExportJson={exportWorkspaceJson}
        pdfUrl={`/api/pdfs/${pdfId}`}
        onAddAccessibleNote={handleAddAccessibleNote}
      />

      {/* Main Workspace Area */}
      <div className="relative flex flex-1 overflow-hidden">
        {/* PDF Page Canvas Scrollport */}
        <div
          ref={containerRef}
          className="relative min-w-0 flex-1 overflow-auto bg-stone-200 p-4"
        >
          {/* Loading Indicator */}
          {(isPdfLoading || isWorkspaceLoading) && (
            <div className="flex h-full w-full flex-col items-center justify-center p-8 text-stone-500">
              <RefreshCw className="h-8 w-8 animate-spin text-stone-400 mb-3" />
              <p className="text-sm font-semibold">PDF hazırlanıyor...</p>
            </div>
          )}

          {/* Error View */}
          {(pdfLoadError || workspaceLoadError) && (
            <div className="flex h-full w-full flex-col items-center justify-center p-8 text-center">
              <AlertTriangle className="h-10 w-10 text-rose-500 mb-3" />
              <p className="text-sm font-bold text-stone-800">
                {pdfLoadError || workspaceLoadError}
              </p>
              <button
                type="button"
                onClick={() => {
                  if (pdfLoadError) setPdfAttempt((attempt) => attempt + 1);
                  if (workspaceLoadError) retrySync();
                }}
                className="mt-4 rounded-xl bg-stone-900 px-4 py-2 text-xs font-semibold text-white hover:bg-stone-800"
              >
                Tekrar Dene
              </button>
            </div>
          )}

          {/* Canvas & Normalized SVG Layer */}
          <div
            className={`relative mx-auto rounded shadow-lg bg-white ${
              isPdfLoading || isWorkspaceLoading || pdfLoadError || workspaceLoadError ? "hidden" : "block"
            }`}
            style={{
              width: pageSize.width,
              height: pageSize.height,
            }}
          >
            {/* The Real Canvas Viewport */}
            <canvas ref={canvasRef} className="block select-none" />

            {/* Normalized SVG Layer */}
            <svg
              ref={svgRef}
              aria-label="PDF çizim katmanı"
              viewBox={`0 0 ${pageSize.width} ${pageSize.height}`}
              className={`absolute inset-0 h-full w-full ${
                activeTool === "hand"
                  ? "pointer-events-none"
                  : activeTool === "note"
                  ? "cursor-crosshair pointer-events-auto"
                  : "cursor-crosshair pointer-events-auto touch-none"
              }`}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={() => {
                isDrawingRef.current = false;
                strokeRef.current = null;
                setCurrentStroke(null);
              }}
              onClick={handleSvgClick}
            >
              {/* Completed Page Strokes */}
              {pageAnnotations.map((ann) => {
                if (ann.kind === "pen") {
                  return (
                    <path
                      key={ann.id}
                      d={generatePathData(ann.points)}
                      fill="none"
                      stroke={ann.color}
                      strokeWidth={ann.width * pageSize.width}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  );
                }
                if (ann.kind === "highlight") {
                  return (
                    <path
                      key={ann.id}
                      d={generatePathData(ann.points)}
                      fill="none"
                      stroke={ann.color}
                      strokeWidth={ann.width * pageSize.width}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      opacity={0.35}
                      style={{ mixBlendMode: "multiply" }}
                    />
                  );
                }
                if (ann.kind === "note") {
                  const x = ann.x * pageSize.width;
                  const y = ann.y * pageSize.height;
                  const isSelected = ann.id === selectedNoteId;

                  return (
                    <g
                      key={ann.id}
                      transform={`translate(${x}, ${y})`}
                      className="pointer-events-auto cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedNoteId(ann.id);
                        setIsNotesOpen(true);
                      }}
                    >
                      <circle
                        r={isSelected ? 16 : 12}
                        fill={ann.color}
                        stroke="#FFFFFF"
                        strokeWidth={2}
                        className="shadow-sm transition-transform hover:scale-110"
                      />
                      <StickyNote
                        x={-6}
                        y={-6}
                        width={12}
                        height={12}
                        className="fill-white stroke-none pointer-events-none"
                      />
                    </g>
                  );
                }
                return null;
              })}

              {/* In-progress Active Stroke */}
              {currentStroke && (
                <path
                  d={generatePathData(currentStroke)}
                  fill="none"
                  stroke={selectedColor}
                  strokeWidth={
                    (activeTool === "highlight" ? 0.03 : 0.004) * pageSize.width
                  }
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={activeTool === "highlight" ? 0.35 : 1}
                  style={
                    activeTool === "highlight"
                      ? { mixBlendMode: "multiply" }
                      : undefined
                  }
                />
              )}
            </svg>
          </div>
        </div>

        {/* Notes Toggle Tab (when panel is closed) */}
        {!isNotesOpen && (
          <button
            type="button"
            onClick={() => setIsNotesOpen(true)}
            className="absolute right-4 top-1 z-20 flex min-h-11 items-center gap-1.5 rounded-xl border border-stone-200 bg-white/95 px-3 text-xs font-semibold text-stone-700 shadow-sm hover:bg-stone-50"
            title="Notlar panelini aç"
            aria-label="Notlar panelini aç"
          >
            <StickyNote className="h-4 w-4 text-amber-500" />
            <span>Notlar ({noteAnnotations.length})</span>
          </button>
        )}

        {/* Notes Side Panel */}
        <PdfWorkspaceNotes
          notes={noteAnnotations}
          currentPage={currentPage}
          selectedNoteId={selectedNoteId}
          onSelectNote={setSelectedNoteId}
          onUpdateNote={updateAnnotation}
          onDeleteNote={deleteAnnotation}
          onNavigateToPage={setPage}
          isOpen={isNotesOpen}
          readOnly={isConflict}
          onClose={() => setIsNotesOpen(false)}
        />
      </div>
    </div>
  );
}
export default PdfWorkspace;
