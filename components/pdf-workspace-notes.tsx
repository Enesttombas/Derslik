"use client";

import React, { useState } from "react";
import { StickyNote, Trash2, X, ChevronRight } from "lucide-react";
import type { NoteAnnotation } from "@/lib/pdf-workspace";
import { PALETTE_COLORS } from "./pdf-workspace-toolbar";

interface PdfWorkspaceNotesProps {
  notes: NoteAnnotation[];
  currentPage: number;
  selectedNoteId: string | null;
  onSelectNote: (id: string | null) => void;
  onUpdateNote: (id: string, updates: Partial<NoteAnnotation>) => void;
  onDeleteNote: (id: string) => void;
  onNavigateToPage: (page: number) => void;
  isOpen: boolean;
  readOnly?: boolean;
  onClose: () => void;
}

export function PdfWorkspaceNotes({
  notes,
  currentPage,
  selectedNoteId,
  onSelectNote,
  onUpdateNote,
  onDeleteNote,
  onNavigateToPage,
  isOpen,
  readOnly = false,
  onClose,
}: PdfWorkspaceNotesProps) {
  const [filterPage, setFilterPage] = useState<"current" | "all">("current");

  const filteredNotes = notes.filter((n) =>
    filterPage === "current" ? n.page === currentPage : true
  );

  const selectedNote = notes.find((n) => n.id === selectedNoteId);
  const [editingText, setEditingText] = useState<{ id: string; text: string } | null>(null);

  const currentText =
    editingText && editingText.id === selectedNoteId
      ? editingText.text
      : selectedNote?.text ?? "";

  if (!isOpen) return null;

  const handleTextChange = (newVal: string) => {
    if (readOnly) return;
    if (newVal.length > 10000) return;
    if (selectedNote) {
      setEditingText({ id: selectedNote.id, text: newVal });
      if (newVal.trim().length > 0) {
        onUpdateNote(selectedNote.id, { text: newVal });
      }
    }
  };

  return (
    <aside
      aria-label="Notlar Paneli"
      className="absolute inset-y-0 right-0 z-20 flex w-[min(20rem,100%)] flex-col border-l border-stone-200 bg-stone-50/95 backdrop-blur-sm text-xs text-stone-800 sm:static sm:w-72 sm:shrink-0 md:w-80"
    >
      {/* Header */}
      <div className="flex h-12 items-center justify-between border-b border-stone-200 px-4">
        <div className="flex items-center gap-2 font-bold text-stone-900">
          <StickyNote className="h-4 w-4 text-amber-500" />
          <span>Notlar ({notes.length})</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1 text-stone-400 hover:bg-stone-200 hover:text-stone-700"
          title="Paneli kapat"
          aria-label="Kapat"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex border-b border-stone-200 bg-white p-1">
        <button
          type="button"
          onClick={() => setFilterPage("current")}
          className={`flex-1 rounded-lg py-1.5 text-center font-medium transition-colors ${
            filterPage === "current"
              ? "bg-stone-100 font-semibold text-stone-900"
              : "text-stone-500 hover:text-stone-800"
          }`}
        >
          Bu Sayfa ({notes.filter((n) => n.page === currentPage).length})
        </button>
        <button
          type="button"
          onClick={() => setFilterPage("all")}
          className={`flex-1 rounded-lg py-1.5 text-center font-medium transition-colors ${
            filterPage === "all"
              ? "bg-stone-100 font-semibold text-stone-900"
              : "text-stone-500 hover:text-stone-800"
          }`}
        >
          Tümü ({notes.length})
        </button>
      </div>

      {/* Selected Note Editor */}
      {selectedNote ? (
        <div className="border-b border-stone-200 bg-white p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-stone-700">
              Sayfa {selectedNote.page} Notu
            </span>
            <div className="flex items-center gap-1">
              {PALETTE_COLORS.map((col) => (
                <button
                  key={col}
                  type="button"
                  disabled={readOnly}
                  onClick={() => onUpdateNote(selectedNote.id, { color: col })}
                  className={`h-3.5 w-3.5 rounded-full border ${
                    selectedNote.color === col
                      ? "ring-2 ring-stone-500"
                      : "border-black/10"
                  }`}
                  style={{ backgroundColor: col }}
                  title={`Not rengi ${col}`}
                />
              ))}
              <button
                type="button"
                disabled={readOnly}
                onClick={() => {
                  onDeleteNote(selectedNote.id);
                  onSelectNote(null);
                }}
                className="ml-2 rounded p-1 text-stone-400 hover:bg-rose-50 hover:text-rose-600"
                title="Notu sil"
                aria-label="Notu sil"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <textarea
            rows={4}
            value={currentText}
            disabled={readOnly}
            onChange={(e) => handleTextChange(e.target.value)}
            placeholder="Notunuzu yazın..."
            maxLength={10000}
            className="w-full rounded-xl border border-stone-200 p-2.5 text-xs focus:border-stone-400 focus:outline-none"
            aria-label="Not metni"
          />
          {!currentText.trim() && <p className="text-amber-700">Boş not kaydedilmez. Notu kaldırmak için sil düğmesini kullanın.</p>}
          <div className="flex justify-between text-[10px] text-stone-400">
            <span>{currentText.length} / 10000</span>
            {currentText.trim().length === 0 && (
              <span className="text-amber-600">Not boş bırakılamaz</span>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-stone-100/50 p-2 text-center text-[11px] text-stone-500">
          Düzenlemek için listeden veya sayfadan bir nota tıklayın.
        </div>
      )}

      {/* Notes List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
        {filteredNotes.length === 0 ? (
          <div className="py-8 text-center text-stone-400">
            <StickyNote className="mx-auto h-8 w-8 stroke-1 text-stone-300 mb-2" />
            <p>Bu sayfada henüz not yok.</p>
            <p className="mt-1 text-[11px]">
              &quot;Not&quot; aracını seçip sayfada istediğiniz yere tıklayın.
            </p>
          </div>
        ) : (
          filteredNotes.map((note) => {
            const isSelected = note.id === selectedNoteId;
            return (
              <div
                key={note.id}
                onClick={() => {
                  onSelectNote(note.id);
                  if (note.page !== currentPage) {
                    onNavigateToPage(note.page);
                  }
                }}
                className={`cursor-pointer rounded-xl border p-2.5 transition-all ${
                  isSelected
                    ? "border-stone-400 bg-white shadow-sm ring-1 ring-stone-300"
                    : "border-stone-200 bg-white hover:border-stone-300"
                }`}
              >
                <div className="flex items-center justify-between text-[11px] text-stone-500 mb-1">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: note.color }}
                    />
                    <span className="font-semibold text-stone-700">
                      Sayfa {note.page}
                    </span>
                  </div>
                  {note.page !== currentPage && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onNavigateToPage(note.page);
                      }}
                      className="flex items-center gap-0.5 text-stone-400 hover:text-stone-800"
                    >
                      <span>Git</span>
                      <ChevronRight className="h-3 w-3" />
                    </button>
                  )}
                </div>
                <p className="line-clamp-2 text-stone-800 break-words font-medium">
                  {note.text || "Boş not"}
                </p>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}
