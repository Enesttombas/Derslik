"use client";

import React, { useEffect, useState } from "react";
import { Command } from "cmdk";
import { BookOpen, Code2, FileQuestion, Focus, GraduationCap, MessageSquare, Timer } from "lucide-react";

type PaletteCourse = { id: string; code: string; title: string };
type PaletteCard = { id: string; courseId: string; prompt: string };

export type CommandPaletteProps = {
  courses: PaletteCourse[];
  focusMode: boolean;
  onSelectCourse: (courseId: string) => void;
  onOpenHomework: () => void;
  onToggleFocus: () => void;
  onStartExam: () => void;
};

const itemClass =
  "flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-stone-700 aria-selected:bg-stone-100 aria-selected:text-stone-900";
const groupClass =
  "[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-stone-400";

export function CommandPalette({ courses, focusMode, onSelectCourse, onOpenHomework, onToggleFocus, onStartExam }: CommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const [cards, setCards] = useState<PaletteCard[] | null>(null);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!open || cards) return;
    let cancelled = false;
    fetch("/api/cards")
      .then((res): Promise<{ cards?: PaletteCard[] }> => (res.ok ? res.json() : Promise.resolve({ cards: [] })))
      .then((data) => {
        if (!cancelled) setCards(data.cards ?? []);
      })
      .catch(() => {
        if (!cancelled) setCards([]);
      });
    return () => {
      cancelled = true;
    };
  }, [open, cards]);

  const run = (action: () => void) => {
    setOpen(false);
    action();
  };

  return (
    <Command.Dialog
      open={open}
      onOpenChange={setOpen}
      label="Komut paleti"
      overlayClassName="fixed inset-0 z-[60] bg-stone-900/40 backdrop-blur-[2px]"
      contentClassName="fixed left-1/2 top-[12vh] z-[61] w-[calc(100vw-32px)] max-w-xl -translate-x-1/2 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-2xl"
    >
      <Command.Input
        placeholder="Ders, ödev, kart veya not ara..."
        className="w-full border-b border-stone-200 bg-transparent px-4 py-3.5 text-base sm:text-sm text-stone-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--primary)] placeholder:text-stone-400"
      />
      <Command.List className="max-h-[56vh] overflow-y-auto p-2">
        <Command.Empty className="px-3 py-6 text-center text-sm text-stone-500">Sonuç yok.</Command.Empty>
        <Command.Group heading="Eylemler" className={groupClass}>
          <Command.Item className={itemClass} value="odak modu aç kapat" onSelect={() => run(onToggleFocus)}>
            <Focus className="h-4 w-4" /> {focusMode ? "Odak modundan çık" : "Odak modunu aç"}
          </Command.Item>
          <Command.Item className={itemClass} value="deneme sınavı başlat" onSelect={() => run(onStartExam)}>
            <Timer className="h-4 w-4" /> Deneme sınavı başlat
          </Command.Item>
          <Command.Item
            className={itemClass}
            value="çalışma asistanı sohbet chatbot"
            onSelect={() => run(() => window.dispatchEvent(new CustomEvent("study-chat-open")))}
          >
            <MessageSquare className="h-4 w-4" /> Çalışma asistanını aç
          </Command.Item>
        </Command.Group>
        <Command.Group heading="Dersler" className={groupClass}>
          {courses.map((course) => (
            <Command.Item
              key={course.id}
              className={itemClass}
              value={`ders ${course.code} ${course.title}`}
              onSelect={() => run(() => onSelectCourse(course.id))}
            >
              <GraduationCap className="h-4 w-4" />
              <span className="min-w-0 truncate">{course.code} — {course.title}</span>
            </Command.Item>
          ))}
        </Command.Group>
        <Command.Group heading="Ödevler" className={groupClass}>
          <Command.Item className={itemClass} value="ödevler ödevleri ödev görüntü işleme eblg351 python opencv" onSelect={() => run(onOpenHomework)}>
            <Code2 className="h-4 w-4" /> EBLG351 ödevleri (Python / OpenCV)
          </Command.Item>
        </Command.Group>
        {cards && cards.length > 0 && (
          <Command.Group heading="Kartlar" className={groupClass}>
            {cards.slice(0, 200).map((card) => (
              <Command.Item
                key={card.id}
                className={itemClass}
                value={`kart ${card.prompt}`}
                onSelect={() => run(() => onSelectCourse(card.courseId))}
              >
                <FileQuestion className="h-4 w-4 shrink-0" />
                <span className="min-w-0 truncate">{card.prompt.replace(/\s+/g, " ")}</span>
              </Command.Item>
            ))}
          </Command.Group>
        )}
        <div className="flex items-center gap-1.5 px-3 pb-1 pt-2 text-[11px] text-stone-400">
          <BookOpen className="h-3 w-3" /> Ctrl+K · Esc kapatır · Ctrl+Shift+F odak modu
        </div>
      </Command.List>
    </Command.Dialog>
  );
}
