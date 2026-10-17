"use client";

import React from "react";
import {
  Hand,
  Pen,
  Highlighter,
  StickyNote,
  ZoomIn,
  ZoomOut,
  Maximize,
  ChevronLeft,
  ChevronRight,
  Bookmark,
  BookmarkCheck,
  Undo2,
  Download,
  FileDown,
  RefreshCw,
  CheckCircle2,
  Clock,
  AlertTriangle,
} from "lucide-react";
import type { SyncStatus } from "@/hooks/use-pdf-workspace";

export type WorkspaceTool = "hand" | "pen" | "highlight" | "note";

export const PALETTE_COLORS = [
  "#E11D48", // Rose
  "#2563EB", // Blue
  "#16A34A", // Green
  "#CA8A04", // Amber
  "#9333EA", // Purple
  "#18181B", // Dark Zinc
];

interface PdfWorkspaceToolbarProps {
  activeTool: WorkspaceTool;
  setActiveTool: (tool: WorkspaceTool) => void;
  selectedColor: string;
  setSelectedColor: (color: string) => void;
  currentPage: number;
  numPages: number;
  onPageChange: (page: number) => void;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  onFitWidth: () => void;
  isBookmarked: boolean;
  onToggleBookmark: () => void;
  bookmarks: number[];
  canUndo: boolean;
  onUndo: () => void;
  syncStatus: SyncStatus;
  syncStatusText: string;
  onRetrySync: () => void;
  onExportJson: () => void;
  pdfUrl: string;
  onAddAccessibleNote: () => void;
}

export function PdfWorkspaceToolbar({
  activeTool,
  setActiveTool,
  selectedColor,
  setSelectedColor,
  currentPage,
  numPages,
  onPageChange,
  zoom,
  onZoomChange,
  onFitWidth,
  isBookmarked,
  onToggleBookmark,
  bookmarks,
  canUndo,
  onUndo,
  syncStatus,
  syncStatusText,
  onRetrySync,
  onExportJson,
  pdfUrl,
  onAddAccessibleNote,
}: PdfWorkspaceToolbarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200 bg-white px-3 py-2 text-xs text-stone-700">
      {/* Tool Selection */}
      <div className="flex items-center gap-1 rounded-xl bg-stone-100 p-1">
        <button
          type="button"
          onClick={() => setActiveTool("hand")}
          className={`inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-1.5 rounded-lg px-3 py-2 font-medium transition-colors ${
            activeTool === "hand"
              ? "bg-white text-stone-900 shadow-sm font-semibold"
              : "text-stone-600 hover:text-stone-900"
          }`}
          title="El (Kaydırma modu)"
          aria-label="El aracı"
        >
          <Hand className="h-4 w-4" />
          <span className="hidden sm:inline">El</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTool("pen")}
          className={`inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-1.5 rounded-lg px-3 py-2 font-medium transition-colors ${
            activeTool === "pen"
              ? "bg-white text-stone-900 shadow-sm font-semibold"
              : "text-stone-600 hover:text-stone-900"
          }`}
          title="Kalem (Çizim modu)"
          aria-label="Kalem aracı"
        >
          <Pen className="h-4 w-4" />
          <span className="hidden sm:inline">Kalem</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTool("highlight")}
          className={`inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-1.5 rounded-lg px-3 py-2 font-medium transition-colors ${
            activeTool === "highlight"
              ? "bg-white text-stone-900 shadow-sm font-semibold"
              : "text-stone-600 hover:text-stone-900"
          }`}
          title="Vurgula (Saydam fosforlu kalem)"
          aria-label="Vurgulayıcı aracı"
        >
          <Highlighter className="h-4 w-4" />
          <span className="hidden sm:inline">Vurgula</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTool("note")}
          className={`inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-1.5 rounded-lg px-3 py-2 font-medium transition-colors ${
            activeTool === "note"
              ? "bg-white text-stone-900 shadow-sm font-semibold"
              : "text-stone-600 hover:text-stone-900"
          }`}
          title="Not (Sayfaya tıklayarak not bırakın)"
          aria-label="Not aracı"
        >
          <StickyNote className="h-4 w-4" />
          <span className="hidden sm:inline">Not</span>
        </button>
      </div>

      {/* Color Palette (Active for pen, highlight, and note) */}
      {(activeTool === "pen" ||
        activeTool === "highlight" ||
        activeTool === "note") && (
        <div
          className="flex items-center gap-1 px-1 py-1"
          role="radiogroup"
          aria-label="Renk seçimi"
        >
          {PALETTE_COLORS.map((col) => (
            <button
              key={col}
              type="button"
              onClick={() => setSelectedColor(col)}
              className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg"
              title={col}
              aria-label={`Renk ${col}`}
              aria-checked={selectedColor === col}
              role="radio"
            >
              <span
                className={`h-5 w-5 rounded-full border transition-transform ${
                  selectedColor === col
                    ? "scale-125 border-stone-800 shadow-sm ring-2 ring-stone-400 ring-offset-1"
                    : "border-black/10 hover:scale-110"
                }`}
                style={{ backgroundColor: col }}
              />
            </button>
          ))}
        </div>
      )}

      {/* Undo & Keyboard Note Actions */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onUndo}
          disabled={!canUndo}
          className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-stone-600 hover:bg-stone-100 disabled:opacity-40"
          title="Son çizimi geri al"
          aria-label="Geri al"
        >
          <Undo2 className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={onAddAccessibleNote}
          className="inline-flex min-h-[44px] items-center rounded-lg border border-stone-200 px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50"
          title="Klavyeyle geçerli sayfaya not ekle"
          aria-label="Sayfaya not ekle"
        >
          + Not Ekle
        </button>
      </div>

      {/* Page Navigation */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-stone-600 hover:bg-stone-100 disabled:opacity-40"
          aria-label="Önceki sayfa"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-1">
          <input
            type="number"
            min={1}
            max={numPages || 1}
            value={currentPage}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              if (!isNaN(val)) onPageChange(val);
            }}
            aria-label="Geçerli sayfa numarası"
            className="min-h-[44px] w-11 rounded border border-stone-300 text-center text-base md:text-xs font-semibold focus:border-stone-500 focus:outline-none"
          />
          <span className="text-stone-500">/ {numPages || 1}</span>
        </div>

        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={numPages > 0 && currentPage >= numPages}
          className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-stone-600 hover:bg-stone-100 disabled:opacity-40"
          aria-label="Sonraki sayfa"
        >
          <ChevronRight className="h-4 w-4" />
        </button>

        {/* Bookmark Toggle */}
        <button
          type="button"
          onClick={onToggleBookmark}
          className={`inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg transition-colors ${
            isBookmarked
              ? "text-amber-500 hover:bg-amber-50"
              : "text-stone-400 hover:bg-stone-100 hover:text-stone-700"
          }`}
          title={isBookmarked ? "Yer işaretini kaldır" : "Sayfayı yer işaretlerine ekle"}
          aria-label={isBookmarked ? "Yer işaretini kaldır" : "Yer işareti ekle"}
        >
          {isBookmarked ? (
            <BookmarkCheck className="h-4 w-4 fill-amber-500" />
          ) : (
            <Bookmark className="h-4 w-4" />
          )}
        </button>

        {bookmarks.length > 0 && (
          <select
            value={bookmarks.includes(currentPage) ? currentPage : ""}
            onChange={(e) => {
              const target = parseInt(e.target.value, 10);
              if (!isNaN(target)) onPageChange(target);
            }}
            aria-label="Yer işaretli sayfalara atla"
            className="min-h-[44px] rounded border border-stone-200 bg-white px-1 text-base md:text-xs text-stone-600"
          >
            <option value="">İşaretler ({bookmarks.length})</option>
            {bookmarks.map((p) => (
              <option key={p} value={p}>
                Sayfa {p}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Zoom Controls */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onZoomChange(Math.max(0.5, zoom - 0.25))}
          className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-stone-600 hover:bg-stone-100"
          title="Uzaklaştır"
          aria-label="Uzaklaştır"
        >
          <ZoomOut className="h-3.5 w-3.5" />
        </button>

        <span className="w-10 text-center text-[11px] font-semibold text-stone-600">
          {Math.round(zoom * 100)}%
        </span>

        <button
          type="button"
          onClick={() => onZoomChange(Math.min(3.0, zoom + 0.25))}
          className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-stone-600 hover:bg-stone-100"
          title="Yakınlaştır"
          aria-label="Yakınlaştır"
        >
          <ZoomIn className="h-3.5 w-3.5" />
        </button>

        <button
          type="button"
          onClick={onFitWidth}
          className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-stone-600 hover:bg-stone-100"
          title="Genişliğe sığdır"
          aria-label="Genişliğe sığdır"
        >
          <Maximize className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Exports & Sync Status */}
      <div className="flex items-center gap-2">
        <a
          href={pdfUrl}
          target="_blank"
          rel="noopener noreferrer"
          download
          className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-1 rounded-lg px-2 text-[11px] font-medium text-stone-600 hover:bg-stone-100"
          title="Orijinal PDF indir"
        >
          <Download className="h-3 w-3" />
          <span className="hidden md:inline">PDF</span>
        </a>

        <button
          type="button"
          onClick={onExportJson}
          className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-1 rounded-lg px-2 text-[11px] font-medium text-stone-600 hover:bg-stone-100"
          title="Çalışma alanı verilerini JSON olarak yedekle"
        >
          <FileDown className="h-3 w-3" />
          <span className="hidden md:inline">JSON</span>
        </button>

        {/* Sync Indicator */}
        <div
          className="flex items-center gap-1.5 rounded-full bg-stone-50 px-2 py-1 text-[11px]"
          title={syncStatusText}
        >
          {syncStatus === "saving" && (
            <RefreshCw className="h-3 w-3 animate-spin text-amber-500" />
          )}
          {syncStatus === "local_saved" && (
            <Clock className="h-3 w-3 text-amber-600" />
          )}
          {syncStatus === "synced" && (
            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
          )}
          {syncStatus === "error" && (
            <button
              type="button"
              onClick={onRetrySync}
              className="flex items-center gap-1 text-red-600 hover:underline"
              title="Yeniden dene"
            >
              <AlertTriangle className="h-3 w-3" />
              <span>Tekrar</span>
            </button>
          )}
          {syncStatus === "conflict" && (
            <AlertTriangle className="h-3 w-3 text-rose-600" />
          )}
          <span
            className={`hidden lg:inline text-[10px] font-medium ${
              syncStatus === "error"
                ? "text-red-600"
                : syncStatus === "conflict"
                ? "text-rose-600"
                : "text-stone-500"
            }`}
          >
            {syncStatusText}
          </span>
        </div>
      </div>
    </div>
  );
}

