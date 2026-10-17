"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Download,
  FileText,
  HelpCircle,
  Plus,
  RefreshCw,
  Trash2,
  X,
  ExternalLink,
  Maximize2,
  Minimize2,
  ChevronRight,
  ArrowLeft,
  GraduationCap,
  Sparkles,
  WifiOff,
  LogOut,
  FolderPlus,
  Layers,
  FileUp,
  Brain,
  Eye,
  AlertTriangle,
} from "lucide-react";
import { chatGPTSignOutPath } from "@/app/chatgpt-auth";
import StudyGuide, { CardMarkdown } from "@/app/study-guide";
import Odevler from "@/app/odevler";
import WeekDisclosure from "@/app/week-disclosure";
import { StudyChatbot } from "@/components/study-chatbot";
import { CommandPalette } from "@/components/command-palette";
import { ExamSimulator } from "@/components/exam-simulator";
import { PdfWorkspace } from "@/components/pdf-workspace";
import { AkisSekme } from "@/components/akis/akis-sekme";
import { ThemeSwitcher } from "@/components/theme-switcher";

export interface Course {
  id: string;
  code: string;
  title: string;
  createdAt: string;
  stats: {
    units: number;
    pdfs: number;
    cards: number;
    dueCards: number;
  };
}

export interface Unit {
  id: string;
  courseId: string;
  title: string;
  orderIndex: number;
  createdAt: string;
}

export interface PdfSource {
  id: string;
  courseId: string;
  unitId?: string | null;
  fileName: string;
  fileSize: number;
  mimeType: string;
  storageKey: string;
  createdAt: string;
}

export interface StudyItem {
  id: string;
  courseId: string;
  unitId?: string | null;
  pdfSourceId?: string | null;
  sourcePage?: number | null;
  kind: "question" | "flashcard";
  prompt: string;
  answer: string;
  hint?: string | null;
  intervalDays: number;
  easeFactor: number;
  repetitionCount: number;
  lastReviewedAt?: string | null;
  nextReviewAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface StudyNote {
  id: string;
  courseId: string;
  unitId?: string | null;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface CurriculumWeek {
  week: number;
  title: string;
  total: number;
  imported: number;
}

export interface CurriculumCourse {
  courseId: string;
  courseCode: string;
  courseTitle: string;
  weeks: CurriculumWeek[];
  nextWeek: CurriculumWeek | null;
}

// One focused session: ~25 minutes at roughly 1.25 minutes per retrieval attempt.
const SESSION_CARD_LIMIT = 20;
const MINUTES_PER_CARD = 1.25;

function CourseCurriculumDisclosure({
  pool,
  importingKey,
  onImportWeek,
}: {
  pool: CurriculumCourse;
  importingKey: string | null;
  onImportWeek: (courseId: string, week: number) => void;
}) {
  const [openWeek, setOpenWeek] = useState<number | null>(null);
  const weekNumbers = useMemo(() => pool.weeks.map((w) => w.week), [pool.weeks]);
  const selectedWeek = pool.weeks.find((w) => w.week === openWeek);

  const handleToggle = (week: number) => {
    setOpenWeek((prev) => (prev === week ? null : week));
  };

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm space-y-3">
      <div>
        <h4 className="text-sm font-bold text-stone-900">Hazır müfredat soruları</h4>
        <p className="text-xs text-stone-500">
          Haftalık notlardaki cevap anahtarlı sorular. Eklediğin hafta kendi tekrar kuyruğuna kopyalanır; ilerlemen yalnız sende tutulur.
        </p>
      </div>
      <WeekDisclosure
        weeks={weekNumbers}
        openWeek={openWeek}
        onToggle={handleToggle}
        idPrefix={`curriculum-${pool.courseId}`}
        label="Müfredat haftaları"
      >
        {selectedWeek && (() => {
          const done = selectedWeek.imported >= selectedWeek.total;
          const busy = importingKey === `${pool.courseId}:${selectedWeek.week}`;
          return (
            <div className="flex items-center justify-between gap-3 rounded-lg border border-stone-100 bg-stone-50 px-3 py-2.5">
              <span className="min-w-0 text-xs text-stone-700">
                <span className="font-bold">Hafta {selectedWeek.week}</span>
                <span className="block truncate font-medium text-stone-900">{selectedWeek.title}</span>
              </span>
              {done ? (
                <span className="shrink-0 text-[11px] font-semibold text-emerald-700">
                  Eklendi ({selectedWeek.total})
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => onImportWeek(pool.courseId, selectedWeek.week)}
                  disabled={importingKey !== null}
                  className="inline-flex min-h-9 shrink-0 items-center gap-1 rounded-lg border border-stone-300 bg-white px-2.5 text-[11px] font-semibold text-stone-800 hover:bg-stone-100 disabled:opacity-60"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>{busy ? "Ekleniyor…" : `${selectedWeek.total - selectedWeek.imported} soru ekle`}</span>
                </button>
              )}
            </div>
          );
        })()}
      </WeekDisclosure>
    </div>
  );
}

interface DerslikClientProps {
  user: {
    userId: string;
    displayName: string;
    email: string;
  };
}

export default function DerslikClient({ user }: DerslikClientProps) {
  // Navigation State
  const [activeTab, setActiveTab] = useState<"dashboard" | "courses" | "review" | "feed">("dashboard");
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [focusMode, setFocusMode] = useState<boolean>(false);
  const [showExam, setShowExam] = useState<boolean>(false);
  const [courseSection, setCourseSection] = useState<"units" | "pdfs" | "cards" | "notes" | "guide" | "odevler" | "resources">("guide");

  // Data State
  const [courses, setCourses] = useState<Course[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [pdfs, setPdfs] = useState<PdfSource[]>([]);
  const [cards, setCards] = useState<StudyItem[]>([]);
  const [notes, setNotes] = useState<StudyNote[]>([]);
  const [summary, setSummary] = useState({
    totalCourses: 0,
    totalDue: 0,
    totalCards: 0,
    totalPdfs: 0,
  });

  // UI / Async State
  const [curriculumPool, setCurriculumPool] = useState<CurriculumCourse[]>([]);
  const [importingKey, setImportingKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(true);

  // Modals & Panels
  const [showAddUnitModal, setShowAddUnitModal] = useState<boolean>(false);
  const [showAddPdfModal, setShowAddPdfModal] = useState<boolean>(false);
  const [showAddCardModal, setShowAddCardModal] = useState<boolean>(false);
  const [showAddNoteModal, setShowAddNoteModal] = useState<boolean>(false);
  const [activeViewingPdf, setActiveViewingPdf] = useState<PdfSource | null>(null);
  const [isPdfFullscreen, setIsPdfFullscreen] = useState<boolean>(false);

  // Study / Review Mode State
  const [reviewCards, setReviewCards] = useState<StudyItem[]>([]);
  const [feedAcilis, setFeedAcilis] = useState<"kod" | "soru">("kod");
  const [currentReviewIndex, setCurrentReviewIndex] = useState<number>(0);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState<boolean>(false);
  const [userAttemptAnswer, setUserAttemptAnswer] = useState<string>("");
  const [isReviewSubmitting, setIsReviewSubmitting] = useState<boolean>(false);
  const [, setReviewCompletedCount] = useState<number>(0);
  const [isReviewFinished, setIsReviewFinished] = useState<boolean>(false);

  // Form States
  const [newUnitTitle, setNewUnitTitle] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<boolean>(false);
  const [newCardKind, setNewCardKind] = useState<"flashcard" | "question">("flashcard");
  const [newCardPrompt, setNewCardPrompt] = useState("");
  const [newCardAnswer, setNewCardAnswer] = useState("");
  const [newCardHint, setNewCardHint] = useState("");
  const [newCardUnitId, setNewCardUnitId] = useState("");
  const [newCardPdfId, setNewCardPdfId] = useState("");
  const [newCardPage, setNewCardPage] = useState("");
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [newNoteContent, setNewNoteContent] = useState("");

  // Online / Offline Status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Fetch Courses & Summary
  const loadCourses = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/courses");
      if (!res.ok) {
        throw new Error("Dersler yüklenirken sunucu hatası oluştu.");
      }
      const data = (await res.json()) as { courses?: Course[]; summary?: typeof summary };
      setCourses(data.courses || []);
      if (data.summary) {
        setSummary(data.summary);
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Dersler yüklenemedi.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadCurriculum = useCallback(async () => {
    try {
      const res = await fetch("/api/curriculum");
      if (!res.ok) return;
      const data = (await res.json()) as { pool?: CurriculumCourse[] };
      setCurriculumPool(data.pool || []);
    } catch {
      // The pool is optional; the dashboard still works without it.
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(() => Promise.all([loadCourses(), loadCurriculum()]));
  }, [loadCourses, loadCurriculum]);

  // Today's session: due cards first (most due course leads); otherwise the next
  // curriculum week that has not been copied into the learner's queue yet.
  const todayPlan = useMemo(() => {
    if (summary.totalDue > 0) {
      const cardCount = Math.min(summary.totalDue, SESSION_CARD_LIMIT);
      const focus = [...courses].sort((a, b) => b.stats.dueCards - a.stats.dueCards)[0];
      return {
        kind: "review" as const,
        cardCount,
        minutes: Math.max(5, Math.round(cardCount * MINUTES_PER_CARD)),
        focus: focus && focus.stats.dueCards > 0 ? `${focus.code} — ${focus.title}` : null,
      };
    }
    const next = curriculumPool.find((c) => c.nextWeek);
    if (next?.nextWeek) {
      const cardCount = next.nextWeek.total - next.nextWeek.imported;
      return {
        kind: "curriculum" as const,
        course: next,
        week: next.nextWeek,
        cardCount,
        minutes: Math.max(5, Math.round(cardCount * MINUTES_PER_CARD)),
      };
    }
    return null;
  }, [summary.totalDue, courses, curriculumPool]);

  // Selected Course Object
  useEffect(() => {
    void Promise.resolve().then(() => {
      try {
        if (window.localStorage.getItem("derslik-focus") === "1") setFocusMode(true);
      } catch {
        // storage unavailable
      }
    });
  }, []);

  useEffect(() => {
    document.documentElement.dataset.focus = focusMode ? "true" : "false";
    try {
      window.localStorage.setItem("derslik-focus", focusMode ? "1" : "0");
    } catch {
      // storage unavailable
    }
  }, [focusMode]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === "f") {
        event.preventDefault();
        setFocusMode((value) => !value);
      } else if (event.key === "Escape" && focusMode) {
        const target = event.target as HTMLElement | null;
        if (!target || !/INPUT|TEXTAREA/.test(target.tagName)) setFocusMode(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [focusMode]);

  const currentCourse = useMemo(() => {
    return courses.find((c) => c.id === selectedCourseId) || null;
  }, [courses, selectedCourseId]);

  // Load Course Detail Sub-collections
  const loadCourseDetails = useCallback(async (courseId: string) => {
    try {
      const [unitsRes, pdfsRes, cardsRes, notesRes] = await Promise.all([
        fetch(`/api/units?courseId=${courseId}`),
        fetch(`/api/pdfs?courseId=${courseId}`),
        fetch(`/api/cards?courseId=${courseId}`),
        fetch(`/api/notes?courseId=${courseId}`),
      ]);

      if (unitsRes.ok) {
        const u = (await unitsRes.json()) as { units?: Unit[] };
        setUnits(u.units || []);
      }
      if (pdfsRes.ok) {
        const p = (await pdfsRes.json()) as { pdfs?: PdfSource[] };
        setPdfs(p.pdfs || []);
      }
      if (cardsRes.ok) {
        const c = (await cardsRes.json()) as { cards?: StudyItem[] };
        setCards(c.cards || []);
      }
      if (notesRes.ok) {
        const n = (await notesRes.json()) as { notes?: StudyNote[] };
        setNotes(n.notes || []);
      }
    } catch {
      // Keep existing data on failure
    }
  }, []);

  useEffect(() => {
    if (selectedCourseId) {
      void Promise.resolve().then(() => loadCourseDetails(selectedCourseId));
    }
  }, [selectedCourseId, loadCourseDetails]);

  // Tekrar artık Akış > Sorular içinde (aynı SRS, şıklı)
  const startReviewSession = (courseId?: string) => {
    if (courseId) setSelectedCourseId(courseId);
    setFeedAcilis("soru");
    setActiveTab("feed");
  };

  // Copy one week of verified curriculum questions into the learner's own queue.
  const importCurriculumWeek = async (courseId: string, week: number, startAfter = false) => {
    const key = `${courseId}:${week}`;
    setImportingKey(key);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/curriculum", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId, week }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error || "Hazır sorular eklenemedi.");
      }
      await Promise.all([loadCourses(), loadCurriculum()]);
      if (selectedCourseId === courseId) await loadCourseDetails(courseId);
      if (startAfter) await startReviewSession(courseId);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Hazır sorular eklenemedi.");
    } finally {
      setImportingKey(null);
    }
  };

  // Submit Study Rating (SM-2 Spaced Repetition)
  const handleRatingSubmit = useCallback(async (rating: "again" | "hard" | "good" | "easy") => {
    const currentCard = reviewCards[currentReviewIndex];
    if (!currentCard || isReviewSubmitting) return;

    setIsReviewSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studyItemId: currentCard.id,
          rating,
          userResponse: userAttemptAnswer || null,
        }),
      });
      if (!res.ok) throw new Error("review not saved");

      setReviewCompletedCount((prev) => prev + 1);

      // Keep forgotten cards in the current session so the learner gets a
      // second retrieval attempt before leaving the study flow.
      const nextCards = rating === "again" ? [...reviewCards, currentCard] : reviewCards;
      if (rating === "again") setReviewCards(nextCards);

      if (currentReviewIndex + 1 < nextCards.length) {
        setCurrentReviewIndex((prev) => prev + 1);
        setIsAnswerRevealed(false);
        setUserAttemptAnswer("");
      } else {
        setIsReviewFinished(true);
        loadCourses(); // Refresh counts
      }
    } catch {
      alert("Tekrar kaydedilemedi; kart yerinde duruyor, tekrar dene.");
    } finally {
      setIsReviewSubmitting(false);
    }
  }, [reviewCards, currentReviewIndex, isReviewSubmitting, userAttemptAnswer, loadCourses]);

  // Keyboard Navigation for Study Mode
  useEffect(() => {
    if (activeTab !== "review" || isReviewFinished || reviewCards.length === 0) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Do not trigger hotkeys if typing in textarea
      if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) {
        if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
          e.preventDefault();
          setIsAnswerRevealed(true);
        }
        return;
      }

      if (e.code === "Space" || e.key === "Enter") {
        e.preventDefault();
        setIsAnswerRevealed(true);
      } else if (isAnswerRevealed) {
        if (e.key === "1") handleRatingSubmit("again");
        if (e.key === "2") handleRatingSubmit("hard");
        if (e.key === "3") handleRatingSubmit("good");
        if (e.key === "4") handleRatingSubmit("easy");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeTab, isAnswerRevealed, isReviewFinished, reviewCards, currentReviewIndex, handleRatingSubmit]);

  // Actions: Add Unit
  const handleCreateUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseId || !newUnitTitle.trim()) return;

    try {
      const res = await fetch("/api/units", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: selectedCourseId,
          title: newUnitTitle.trim(),
          orderIndex: units.length + 1,
        }),
      });

      if (!res.ok) throw new Error("Ünite kaydedilemedi.");
      const data = (await res.json()) as { unit: Unit };
      setUnits((prev) => [...prev, data.unit]);
      setNewUnitTitle("");
      setShowAddUnitModal(false);
      loadCourses();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Ünite eklenemedi.");
    }
  };

  // Actions: Upload PDF
  const handleUploadPdf = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseId || !selectedFile) return;

    setUploadProgress(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("courseId", selectedCourseId);
      if (newCardUnitId) {
        formData.append("unitId", newCardUnitId);
      }

      const res = await fetch("/api/pdfs", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorData = (await res.json()) as { error?: string };
        throw new Error(errorData.error || "PDF yüklenemedi.");
      }

      const data = (await res.json()) as { pdf: PdfSource };
      setPdfs((prev) => [data.pdf, ...prev]);
      setSelectedFile(null);
      setShowAddPdfModal(false);
      loadCourses();
    } catch (err) {
      alert(err instanceof Error ? err.message : "PDF yükleme başarısız.");
    } finally {
      setUploadProgress(false);
    }
  };

  // Actions: Delete PDF
  const handleDeletePdf = async (pdfId: string) => {
    if (!confirm("Bu PDF dosyasını silmek istediğinizden emin misiniz?")) return;

    try {
      const res = await fetch(`/api/pdfs/${pdfId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("PDF silinemedi.");
      setPdfs((prev) => prev.filter((p) => p.id !== pdfId));
      if (activeViewingPdf?.id === pdfId) {
        setActiveViewingPdf(null);
      }
      loadCourses();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Hata oluştu.");
    }
  };

  // Actions: Create Card / Question
  const handleCreateCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseId || !newCardPrompt.trim() || !newCardAnswer.trim()) return;

    try {
      const res = await fetch("/api/cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: selectedCourseId,
          unitId: newCardUnitId || null,
          pdfSourceId: newCardPdfId || null,
          sourcePage: newCardPage ? Number(newCardPage) : null,
          kind: newCardKind,
          prompt: newCardPrompt.trim(),
          answer: newCardAnswer.trim(),
          hint: newCardHint.trim() || null,
        }),
      });

      if (!res.ok) throw new Error("Soru/kart eklenemedi.");
      const data = (await res.json()) as { card: StudyItem };
      setCards((prev) => [data.card, ...prev]);
      setNewCardPrompt("");
      setNewCardAnswer("");
      setNewCardHint("");
      setNewCardPage("");
      setShowAddCardModal(false);
      loadCourses();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Kart oluşturulamadı.");
    }
  };

  // Actions: Delete Card
  const handleDeleteCard = async (cardId: string) => {
    if (!confirm("Bu çalışma kartını silmek istiyor musunuz?")) return;

    try {
      const res = await fetch(`/api/cards/${cardId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Kart silinemedi.");
      setCards((prev) => prev.filter((c) => c.id !== cardId));
      loadCourses();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Hata oluştu.");
    }
  };

  // Actions: Create Note
  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseId || !newNoteTitle.trim()) return;

    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: selectedCourseId,
          unitId: newCardUnitId || null,
          title: newNoteTitle.trim(),
          content: newNoteContent.trim(),
        }),
      });

      if (!res.ok) throw new Error("Not eklenemedi.");
      const data = (await res.json()) as { note: StudyNote };
      setNotes((prev) => [data.note, ...prev]);
      setNewNoteTitle("");
      setNewNoteContent("");
      setShowAddNoteModal(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Not kaydedilemedi.");
    }
  };

  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground font-sans">
      {/* Offline Alert Banner */}
      {!isOnline && (
        <div
          role="status"
          aria-live="polite"
          className="sticky top-0 z-50 flex items-center justify-center gap-2 bg-amber-600 px-4 py-2.5 text-xs sm:text-sm font-medium text-white shadow-sm"
        >
          <WifiOff className="h-4 w-4 shrink-0" />
          <span>
            Çevrimdışısınız. Uygulama kabuğu hafızadadır; yeni kayıtlar ve henüz açılmamış PDF&apos;ler internet bağlantısı gerektirir.
          </span>
        </div>
      )}

      {/* Main Header */}
      <header data-focus-hide className="sticky top-0 z-40 border-b border-stone-200 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl min-[1280px]:max-w-[1400px] items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setActiveTab("dashboard");
                setSelectedCourseId(null);
              }}
              className="flex items-center gap-2.5 text-left focus:outline-none focus:ring-2 focus:ring-stone-400 rounded-lg p-1"
            >
              <div className="flex h-10 w-10 items-center justify-center text-primary">
                <GraduationCap className="h-5 w-5" />
              </div>
              <div>
                <span className="block text-base font-bold tracking-tight text-stone-900">
                  Enes Derslik
                </span>
              </div>
            </button>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block"><nav className="akis-segment" aria-label="Ana Gezinme">
            <button
              role="tab"
              aria-selected={activeTab === "dashboard" && !selectedCourseId}
              onClick={() => {
                setActiveTab("dashboard");
                setSelectedCourseId(null);
              }}
            >
              Panel
            </button>
            <button
              role="tab"
              aria-selected={activeTab === "feed"}
              onClick={() => {
                setActiveTab("feed");
                setSelectedCourseId(null);
              }}
            >
              Akış
            </button>
          </nav></div>

          {/* User Profile & Sign Out */}
          <div className="flex items-center gap-2">
            <ThemeSwitcher />
            <a
              href={chatGPTSignOutPath("/")}
              title="Çıkış Yap"
              className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-stone-600 hover:bg-stone-100 hover:text-stone-900 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span className="sr-only">Çıkış Yap</span>
            </a>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 pb-[calc(6rem+env(safe-area-inset-bottom,0px))] md:pb-12">
        <div className="mx-auto max-w-6xl min-[1280px]:max-w-[1400px] px-4 sm:px-6 pt-6">
          {errorMessage && (
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              <AlertTriangle className="h-5 w-5 shrink-0 text-red-600" />
              <div className="flex-1">
                <p className="font-semibold">Bir hata oluştu</p>
                <p>{errorMessage}</p>
              </div>
              <button
                onClick={() => setErrorMessage(null)}
                className="text-red-500 hover:text-red-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {isLoading && courses.length === 0 ? (
            <div className="flex min-h-[300px] flex-col items-center justify-center gap-3 text-stone-500">
              <RefreshCw className="h-8 w-8 animate-spin text-stone-400" />
              <p className="text-sm font-medium">Derslik verileri yükleniyor...</p>
            </div>
          ) : (
            <div key={`${activeTab}-${selectedCourseId ?? ""}`} className="sayfa-gecis">
              {/* TAB 1: DASHBOARD VIEW */}
              {activeTab === "dashboard" && !selectedCourseId && (
                <div className="space-y-6">
                  <h1 className="baslik-gr text-[28px] sm:text-4xl font-bold tracking-tight">Merhaba, Enes</h1>

                  {/* Today's Session */}
                  {todayPlan && (
                    <button
                      type="button"
                      onClick={() => setActiveTab("feed")}
                      className="course-card group relative flex w-full items-center gap-4 overflow-hidden rounded-[32px] akis-hero p-6 text-left shadow-lg"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-3xl font-bold tracking-tight">Akış</p>
                        <p className="mt-1 text-sm opacity-80">
                          {summary.totalDue > 0 ? `${summary.totalDue} tekrar seni bekliyor` : "Kaydır, çöz, öğren"}
                        </p>
                      </div>
                      <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-white/15 backdrop-blur-md transition-transform group-hover:scale-105 group-active:scale-95">
                        <Sparkles className="h-7 w-7" />
                      </span>
                    </button>
                  )}

                  {/* Course Cards Grid */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {courses.map((course) => (
                        <div
                          key={course.id}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              setSelectedCourseId(course.id);
                              setActiveTab("courses");
                            }
                          }}
                          onClick={() => {
                            setSelectedCourseId(course.id);
                            setActiveTab("courses");
                          }}
                          className="course-card group relative flex items-center gap-3 rounded-[24px] border border-stone-200 bg-white p-5 shadow-sm cursor-pointer"
                        >
                          <div className="min-w-0 flex-1">
                            <span className="text-xs font-semibold text-stone-500">{course.code}</span>
                            <h3 className="mt-0.5 text-[17px] font-semibold leading-snug tracking-tight text-stone-900">
                              {course.title}
                            </h3>
                          </div>
                          {course.stats.dueCards > 0 && (
                            <span className="rounded-full bg-amber-500 px-2 py-0.5 text-xs font-bold text-white">{course.stats.dueCards}</span>
                          )}
                          <ChevronRight className="h-5 w-5 shrink-0 text-stone-300 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: COURSE LIST & COURSE DETAIL VIEW */}
              {(activeTab === "courses" || selectedCourseId) && (
                <div>
                  {!selectedCourseId ? (
                    /* Courses Index */
                    <div className="space-y-6">
                      <h1 className="text-[28px] sm:text-4xl font-bold tracking-tight">Dersler</h1>

                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {courses.map((course) => (
                          <div
                            key={course.id}
                            onClick={() => setSelectedCourseId(course.id)}
                            className="course-card group flex items-center gap-3 rounded-[24px] border border-stone-200 bg-white p-5 shadow-sm cursor-pointer"
                          >
                            <div className="min-w-0 flex-1">
                              <span className="text-xs font-semibold text-stone-500">{course.code}</span>
                              <h3 className="mt-0.5 text-[17px] font-semibold leading-snug tracking-tight text-stone-900">
                                {course.title}
                              </h3>
                            </div>
                            <ChevronRight className="h-5 w-5 shrink-0 text-stone-300 group-hover:translate-x-0.5 transition-transform" />
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    /* Single Course Details */
                    <div className="space-y-6">
                      {/* Course Header & Breadcrumb */}
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setSelectedCourseId(null)}
                          aria-label="Tüm dersler"
                          className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-stone-100 text-stone-600 hover:bg-stone-200 transition-colors"
                        >
                          <ArrowLeft className="h-5 w-5" />
                        </button>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-stone-500">{currentCourse?.code}</p>
                          <h1 className="text-xl sm:text-2xl font-bold leading-tight tracking-tight text-stone-900">
                            {currentCourse?.title}
                          </h1>
                        </div>
                        <button
                          onClick={() => startReviewSession(selectedCourseId)}
                          aria-label="Bu dersi tekrar et"
                          className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-stone-900 text-white shadow-sm hover:bg-stone-800 transition-colors"
                        >
                          <Brain className="h-5 w-5" />
                        </button>
                      </div>

                      {/* Course Sub-navigation */}
                      <div className="akis-segment max-w-full overflow-x-auto scrollbar-none" role="tablist">
                        <button role="tab" aria-selected={courseSection === "guide"} onClick={() => setCourseSection("guide")}>Rehber</button>
                        {(currentCourse?.code === "EBLG351.1" || currentCourse?.code === "EBLG359.1") && (
                          <button role="tab" aria-selected={courseSection === "odevler"} onClick={() => setCourseSection("odevler")}>
                            {currentCourse?.code === "EBLG359.1" ? "Pratik" : "Ödevler"}
                          </button>
                        )}
                        <button role="tab" aria-selected={courseSection === "resources"} onClick={() => setCourseSection("resources")}>Notlar</button>
                      </div>

                      {courseSection === "odevler" && currentCourse?.code === "EBLG351.1" && <Odevler key="eblg351" course="eblg351" />}
                      {courseSection === "odevler" && currentCourse?.code === "EBLG359.1" && <Odevler key="eblg359" course="eblg359" />}

                      {courseSection === "guide" && currentCourse && (
                        <StudyGuide courseCode={currentCourse.code} courseTitle={currentCourse.title} />
                      )}

                      {/* SECTION 1: UNITS */}
                      {courseSection === "units" && (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <p className="text-sm text-stone-500">
                              Ders konularını ünite veya haftalara bölerek düzenleyin.
                            </p>
                            <button
                              onClick={() => setShowAddUnitModal(true)}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-stone-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-stone-800 transition-colors"
                            >
                              <FolderPlus className="h-4 w-4" />
                              <span>Yeni Ünite Ekle</span>
                            </button>
                          </div>

                          {units.length === 0 ? (
                            <div className="flex min-h-[200px] flex-col items-center justify-center rounded-xl border border-dashed border-stone-300 bg-white p-8 text-center">
                              <Layers className="h-10 w-10 text-stone-300 mb-2" />
                              <h4 className="text-sm font-bold text-stone-800">
                                Henüz ünite eklenmedi
                              </h4>
                              <p className="mt-1 text-xs text-stone-500 max-w-sm">
                                &apos;Yeni Ünite Ekle&apos; butonunu kullanarak bu ders için konularınızı veya haftalık modüllerinizi oluşturabilirsiniz.
                              </p>
                              <button
                                onClick={() => setShowAddUnitModal(true)}
                                className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs font-semibold text-stone-800 hover:bg-stone-50"
                              >
                                <Plus className="h-3.5 w-3.5" />
                                <span>İlk Üniteyi Ekle</span>
                              </button>
                            </div>
                          ) : (
                            <div className="divide-y divide-stone-200 rounded-xl border border-stone-200 bg-white overflow-hidden shadow-sm">
                              {units.map((unit, idx) => (
                                <div
                                  key={unit.id}
                                  className="flex items-center justify-between p-4 hover:bg-stone-50 transition-colors"
                                >
                                  <div className="flex items-center gap-3">
                                    <span className="flex h-7 w-7 items-center justify-center rounded-md bg-stone-100 text-xs font-bold text-stone-600">
                                      {idx + 1}
                                    </span>
                                    <span className="text-sm font-semibold text-stone-900">
                                      {unit.title}
                                    </span>
                                  </div>
                                  <span className="text-xs text-stone-400">
                                    {new Date(unit.createdAt).toLocaleDateString("tr-TR")}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* SECTION 2: RESOURCES (PDFS & NOTES) */}
                      {courseSection === "resources" && (
                        <div className="space-y-6">
                          <div className="flex flex-wrap items-center justify-between gap-4">
                            <div>
                              <h3 className="text-base font-bold text-stone-900">Ders Notları ve PDF’ler</h3>
                              <p className="text-sm text-stone-500">
                                Ders slaytlarını, PDF kaynaklarını ve aldığınız kişisel çalışma notlarını tek bir yerde inceleyin.
                              </p>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setShowAddPdfModal(true)}
                                className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg bg-stone-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-stone-800 transition-colors"
                              >
                                <FileUp className="h-4 w-4" />
                                <span>PDF Yükle</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setShowAddNoteModal(true)}
                                className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-3.5 py-2 text-xs font-semibold text-stone-800 hover:bg-stone-50 transition-colors"
                              >
                                <Plus className="h-4 w-4" />
                                <span>Not Ekle</span>
                              </button>
                            </div>
                          </div>

                          {pdfs.length === 0 && notes.length === 0 ? (
                            <div className="flex min-h-[200px] flex-col items-center justify-center rounded-xl border border-dashed border-stone-300 bg-white p-8 text-center">
                              <FileText className="h-10 w-10 text-stone-300 mb-2" />
                              <h4 className="text-sm font-bold text-stone-800">
                                Henüz ders notu veya PDF eklenmedi
                              </h4>
                              <p className="mt-1 text-xs text-stone-500 max-w-sm">
                                Ders slaytlarını yükleyebilir veya ders esnasında aldığınız kişisel notları ekleyebilirsiniz.
                              </p>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                              {pdfs.map((pdf) => (
                                <div
                                  key={`pdf-${pdf.id}`}
                                  className="flex flex-col justify-between rounded-xl border border-stone-200 bg-white p-4 shadow-sm"
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-start gap-3 min-w-0">
                                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-700">
                                        <FileText className="h-5 w-5" />
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                          <span className="rounded bg-stone-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-stone-600">
                                            PDF
                                          </span>
                                        </div>
                                        <h4
                                          className="text-sm font-bold text-stone-900 truncate"
                                          title={pdf.fileName}
                                        >
                                          {pdf.fileName}
                                        </h4>
                                        <span className="text-xs text-stone-500">
                                          {(pdf.fileSize / (1024 * 1024)).toFixed(2)} MB •{" "}
                                          {new Date(pdf.createdAt).toLocaleDateString("tr-TR")}
                                        </span>
                                      </div>
                                    </div>

                                    <button
                                      type="button"
                                      onClick={() => handleDeletePdf(pdf.id)}
                                      title="PDF'i Sil"
                                      className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-stone-500 hover:text-red-600 transition-colors shrink-0"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>

                                  <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-stone-100 pt-3">
                                    <button
                                      type="button"
                                      onClick={() => setActiveViewingPdf(pdf)}
                                      className="flex-1 inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg bg-stone-100 px-3 py-1.5 text-xs font-bold text-stone-800 hover:bg-stone-200 transition-colors"
                                    >
                                      <Eye className="h-3.5 w-3.5" />
                                      <span>Görüntüle</span>
                                    </button>
                                    <a
                                      href={`/api/pdfs/${pdf.id}`}
                                      download={pdf.fileName}
                                      className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-bold text-stone-800 hover:bg-stone-50 focus:outline-none focus:ring-2 focus:ring-stone-400 transition-colors"
                                    >
                                      <Download className="h-3.5 w-3.5" />
                                      <span>İndir</span>
                                    </a>
                                    <a
                                      href={`/api/pdfs/${pdf.id}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-stone-200 p-1.5 text-stone-600 hover:bg-stone-50"
                                      title="Yeni Sekmede Aç"
                                    >
                                      <ExternalLink className="h-4 w-4" />
                                    </a>
                                  </div>
                                </div>
                              ))}

                              {notes.map((note) => (
                                <div
                                  key={`note-${note.id}`}
                                  className="flex flex-col justify-between rounded-xl border border-stone-200 bg-white p-4 shadow-sm"
                                >
                                  <div className="space-y-2">
                                    <div className="flex items-center justify-between gap-2">
                                      <span className="rounded bg-stone-100 px-1.5 py-0.5 text-[10px] font-bold text-stone-600">
                                        Ders notu
                                      </span>
                                      <span className="text-xs text-stone-400">
                                        {new Date(note.createdAt).toLocaleDateString("tr-TR")}
                                      </span>
                                    </div>
                                    <h4 className="text-base font-bold text-stone-900">
                                      {note.title}
                                    </h4>
                                    <p className="text-sm text-stone-700 whitespace-pre-wrap">
                                      {note.content}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* SECTION 3: CARDS & QUESTIONS */}
                      {courseSection === "cards" && (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <p className="text-sm text-stone-500">
                              Aktif hatırlama için soru ve flaş kartlar oluşturun.
                            </p>
                            <button
                              onClick={() => setShowAddCardModal(true)}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-stone-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-stone-800 transition-colors"
                            >
                              <Plus className="h-4 w-4" />
                              <span>Yeni Soru / Kart Ekle</span>
                            </button>
                          </div>

                          {(() => {
                            const pool = curriculumPool.find((c) => c.courseId === selectedCourseId);
                            if (!pool || pool.weeks.length === 0) return null;
                            return (
                              <CourseCurriculumDisclosure
                                key={pool.courseId}
                                pool={pool}
                                importingKey={importingKey}
                                onImportWeek={importCurriculumWeek}
                              />
                            );
                          })()}

                          {cards.length === 0 ? (
                            <div className="flex min-h-[200px] flex-col items-center justify-center rounded-xl border border-dashed border-stone-300 bg-white p-8 text-center">
                              <HelpCircle className="h-10 w-10 text-stone-300 mb-2" />
                              <h4 className="text-sm font-bold text-stone-800">
                                Henüz soru veya kart eklenmedi
                              </h4>
                              <p className="mt-1 text-xs text-stone-500 max-w-sm">
                                Okuduğunuz PDF&apos;lerden soru ve cevaplar ekleyerek aktif hatırlama döngüsünü başlatın.
                              </p>
                              <button
                                onClick={() => setShowAddCardModal(true)}
                                className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs font-semibold text-stone-800 hover:bg-stone-50"
                              >
                                <Plus className="h-3.5 w-3.5" />
                                <span>İlk Soruyu Oluştur</span>
                              </button>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                              {cards.map((card) => {
                                const isDue = new Date(card.nextReviewAt) <= new Date();
                                return (
                                  <div
                                    key={card.id}
                                    className="flex flex-col justify-between rounded-xl border border-stone-200 bg-white p-4 shadow-sm"
                                  >
                                    <div className="space-y-2">
                                      <div className="flex items-center justify-between gap-2">
                                        <span className="rounded bg-stone-100 px-2 py-0.5 text-[11px] font-bold text-stone-700 uppercase">
                                          {card.kind === "question" ? "Soru" : "Flaş Kart"}
                                        </span>
                                        {isDue ? (
                                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-800">
                                            Tekrar Vadesi Geldi
                                          </span>
                                        ) : (
                                          <span className="text-[11px] text-stone-400">
                                            Tekrar: {new Date(card.nextReviewAt).toLocaleDateString("tr-TR")}
                                          </span>
                                        )}
                                      </div>
                                      <div className="text-sm font-bold text-stone-900 line-clamp-3">
                                        <CardMarkdown source={card.prompt} />
                                      </div>
                                      {card.hint && card.id.startsWith("cur:") && (
                                        <span className="block text-[11px] text-stone-500">{card.hint}</span>
                                      )}
                                    </div>

                                    <div className="mt-4 flex items-center justify-between border-t border-stone-100 pt-3 text-xs text-stone-500">
                                      <span>Tekrar: {card.repetitionCount}x</span>
                                      <div className="flex items-center gap-2">
                                        <button
                                          onClick={() => handleDeleteCard(card.id)}
                                          className="text-stone-400 hover:text-red-600 transition-colors p-1"
                                          title="Kartı Sil"
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}

                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: AKIŞ (FEED) */}
              {activeTab === "feed" && (
                <AkisSekme
                  key={feedAcilis}
                  acilis={feedAcilis}
                  userId={user.userId}
                  courses={courses}
                  initialCourseId={selectedCourseId}
                  onGoToReview={() => startReviewSession()}
                  onGoToCourses={() => {
                    setActiveTab("dashboard");
                    setSelectedCourseId(null);
                  }}
                />
              )}
            </div>
          )}
        </div>
      </main>

      {/* Built-in PDF Viewer Modal */}
      {activeViewingPdf && (
        <div
          role="dialog"
          aria-label="PDF görüntüleyici"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-2 sm:p-4 backdrop-blur-sm"
        >
          <div
            className={`flex flex-col rounded-2xl bg-white shadow-2xl overflow-hidden transition-all duration-200 ${
              isPdfFullscreen
                ? "h-full w-full"
                : "h-[90dvh] w-full max-w-5xl"
            }`}
          >
            {/* Viewer Header */}
            <div className="flex h-14 shrink-0 items-center justify-between border-b border-stone-200 bg-stone-100 px-4">
              <div className="flex items-center gap-2 overflow-hidden">
                <FileText className="h-4 w-4 shrink-0 text-red-600" />
                <span className="text-sm font-bold text-stone-900 truncate">
                  {activeViewingPdf.fileName}
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setIsPdfFullscreen(!isPdfFullscreen)}
                  className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-stone-600 hover:bg-stone-200"
                  title={isPdfFullscreen ? "Küçült" : "Tam Ekran"}
                >
                  {isPdfFullscreen ? (
                    <Minimize2 className="h-4 w-4" />
                  ) : (
                    <Maximize2 className="h-4 w-4" />
                  )}
                </button>
                <a
                  href={`/api/pdfs/${activeViewingPdf.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-stone-600 hover:bg-stone-200"
                  title="Yeni Sekmede Aç"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
                <button
                  onClick={() => setActiveViewingPdf(null)}
                  className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-stone-600 hover:bg-stone-200"
                  title="Kapat"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Interactive Persistent PDF Workspace Frame */}
            <div className="relative flex-1 bg-stone-200 overflow-hidden">
              <PdfWorkspace
                key={`${user.userId}-${activeViewingPdf.id}`}
                pdfId={activeViewingPdf.id}
                userId={user.userId}
                fileName={activeViewingPdf.fileName}
                onClose={() => setActiveViewingPdf(null)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add Unit */}
      {showAddUnitModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-stone-900">Yeni Ünite Ekle</h3>
              <button
                onClick={() => setShowAddUnitModal(false)}
                className="text-stone-400 hover:text-stone-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUnit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Ünite / Hafta Başlığı
                </label>
                <input
                  type="text"
                  required
                  value={newUnitTitle}
                  onChange={(e) => setNewUnitTitle(e.target.value)}
                  placeholder="Örnek: Ünite 1 - Temel Kavramlar"
                  className="w-full rounded-xl border border-stone-200 p-3 text-sm focus:border-stone-400 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddUnitModal(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-stone-900 px-4 py-2 text-xs font-bold text-white hover:bg-stone-800"
                >
                  Üniteyi Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Upload PDF */}
      {showAddPdfModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-stone-900">PDF Dosyası Yükle</h3>
              <button
                onClick={() => setShowAddPdfModal(false)}
                className="text-stone-400 hover:text-stone-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUploadPdf} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  PDF Dosyası (Maksimum 25 MB)
                </label>
                <input
                  type="file"
                  accept="application/pdf,.pdf"
                  required
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setSelectedFile(e.target.files[0]);
                    }
                  }}
                  className="w-full text-xs text-stone-600 file:mr-3 file:rounded-lg file:border-0 file:bg-stone-100 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-stone-700 hover:file:bg-stone-200"
                />
              </div>

              {units.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Bağlı Ünite (İsteğe bağlı)
                  </label>
                  <select
                    value={newCardUnitId}
                    onChange={(e) => setNewCardUnitId(e.target.value)}
                    className="w-full rounded-xl border border-stone-200 p-2.5 text-xs focus:border-stone-400 focus:outline-none"
                  >
                    <option value="">Seçim Yapılmadı</option>
                    {units.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddPdfModal(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={uploadProgress || !selectedFile}
                  className="rounded-xl bg-stone-900 px-4 py-2 text-xs font-bold text-white hover:bg-stone-800 disabled:opacity-50"
                >
                  {uploadProgress ? "Yükleniyor..." : "Yükle"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Question / Flashcard */}
      {showAddCardModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
        >
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl space-y-4 max-h-[90dvh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-stone-900">
                Yeni Soru / Flaş Kart Ekle
              </h3>
              <button
                onClick={() => setShowAddCardModal(false)}
                className="text-stone-400 hover:text-stone-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCard} className="space-y-4">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setNewCardKind("flashcard")}
                  className={`flex-1 rounded-lg py-2 text-xs font-bold transition-colors ${
                    newCardKind === "flashcard"
                      ? "bg-stone-900 text-white"
                      : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                  }`}
                >
                  Flaş Kart
                </button>
                <button
                  type="button"
                  onClick={() => setNewCardKind("question")}
                  className={`flex-1 rounded-lg py-2 text-xs font-bold transition-colors ${
                    newCardKind === "question"
                      ? "bg-stone-900 text-white"
                      : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                  }`}
                >
                  Klasik Soru
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Soru / Kart Ön Yüzü (Prompt)
                </label>
                <textarea
                  required
                  rows={2}
                  value={newCardPrompt}
                  onChange={(e) => setNewCardPrompt(e.target.value)}
                  placeholder="Örn: von Neumann mimarisinin temel bileşenleri nelerdir?"
                  className="w-full rounded-xl border border-stone-200 p-2.5 text-xs focus:border-stone-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Cevap / Kart Arka Yüzü
                </label>
                <textarea
                  required
                  rows={3}
                  value={newCardAnswer}
                  onChange={(e) => setNewCardAnswer(e.target.value)}
                  placeholder="Örn: CPU (ALU ve Kontrol Birimi), Bellek, Giriş/Çıkış birimleri ve ortak veri yolu."
                  className="w-full rounded-xl border border-stone-200 p-2.5 text-xs focus:border-stone-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  İpucu veya Kaynak Notu (İsteğe bağlı)
                </label>
                <input
                  type="text"
                  value={newCardHint}
                  onChange={(e) => setNewCardHint(e.target.value)}
                  placeholder="Örn: Slayt 2, mimari diyagramı"
                  className="w-full rounded-xl border border-stone-200 p-2.5 text-xs focus:border-stone-400 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {units.length > 0 && (
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                      Ünite
                    </label>
                    <select
                      value={newCardUnitId}
                      onChange={(e) => setNewCardUnitId(e.target.value)}
                      className="w-full rounded-xl border border-stone-200 p-2 text-xs focus:border-stone-400 focus:outline-none"
                    >
                      <option value="">Seçilmedi</option>
                      {units.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.title}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {pdfs.length > 0 && (
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                      Kaynak PDF
                    </label>
                    <select
                      value={newCardPdfId}
                      onChange={(e) => setNewCardPdfId(e.target.value)}
                      className="w-full rounded-xl border border-stone-200 p-2 text-xs focus:border-stone-400 focus:outline-none"
                    >
                      <option value="">Seçilmedi</option>
                      {pdfs.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.fileName}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                    PDF Sayfası
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={newCardPage}
                    onChange={(e) => setNewCardPage(e.target.value)}
                    placeholder="Örn: 14"
                    className="w-full rounded-xl border border-stone-200 p-2 text-xs focus:border-stone-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddCardModal(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-stone-900 px-4 py-2 text-xs font-bold text-white hover:bg-stone-800"
                >
                  Kartı Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Note */}
      {showAddNoteModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-stone-900">Çalışma Notu Ekle</h3>
              <button
                onClick={() => setShowAddNoteModal(false)}
                className="text-stone-400 hover:text-stone-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNote} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Not Başlığı
                </label>
                <input
                  type="text"
                  required
                  value={newNoteTitle}
                  onChange={(e) => setNewNoteTitle(e.target.value)}
                  placeholder="Örn: Vize Konuları Özeti"
                  className="w-full rounded-xl border border-stone-200 p-2.5 text-xs focus:border-stone-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Not İçeriği
                </label>
                <textarea
                  rows={4}
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  placeholder="Önemli formüller, hatırlatıcılar..."
                  className="w-full rounded-xl border border-stone-200 p-2.5 text-xs focus:border-stone-400 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddNoteModal(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-stone-900 px-4 py-2 text-xs font-bold text-white hover:bg-stone-800"
                >
                  Notu Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation Bar */}
      <nav aria-label="Mobil gezinme" data-focus-hide className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-stone-200 bg-white/95 backdrop-blur-md px-4 pt-1.5 pb-[calc(0.375rem+env(safe-area-inset-bottom,0px))]">
        <div className="flex items-center justify-around">
          <button
            aria-current={(activeTab === "dashboard" && !selectedCourseId) ? "page" : undefined}
            onClick={() => {
              setActiveTab("dashboard");
              setSelectedCourseId(null);
            }}
            className={`flex min-h-12 min-w-16 flex-col items-center justify-center rounded-xl px-2 py-1 text-[11px] font-semibold ${
              activeTab === "dashboard" && !selectedCourseId
                ? "text-stone-900"
                : "text-stone-500"
            }`}
          >
            <GraduationCap className="h-[22px] w-[22px]" />
            <span className="sr-only">Panom</span>
          </button>

          <button
            aria-current={(activeTab === "feed") ? "page" : undefined}
            onClick={() => {
              setActiveTab("feed");
              setSelectedCourseId(null);
            }}
            className={`flex min-h-12 min-w-16 flex-col items-center justify-center rounded-xl px-2 py-1 text-[11px] font-semibold ${
              activeTab === "feed" ? "text-stone-900 font-bold" : "text-stone-500"
            }`}
          >
            <Sparkles className="h-[22px] w-[22px]" />
            <span className="sr-only">Akış</span>
          </button>
        </div>
      </nav>

      {/* Sağ alt yüzen çalışma chatbotu */}
      <div hidden={!!activeViewingPdf} className={activeTab === "feed" ? "max-md:[&>button.fixed]:hidden" : undefined}>
        <StudyChatbot courseId={selectedCourseId ?? undefined} />
      </div>
      <CommandPalette
        courses={courses}
        focusMode={focusMode}
        onSelectCourse={(id) => {
          setSelectedCourseId(id);
          setActiveTab("courses");
        }}
        onOpenHomework={() => {
          const course = courses.find((c) => c.code === "EBLG351.1");
          if (!course) return;
          setSelectedCourseId(course.id);
          setActiveTab("courses");
          setCourseSection("odevler");
        }}
        onToggleFocus={() => setFocusMode((value) => !value)}
        onStartExam={() => setShowExam(true)}
      />
      {showExam && <ExamSimulator courseId={selectedCourseId} onClose={() => setShowExam(false)} />}
      {focusMode && (
        <button
          type="button"
          onClick={() => setFocusMode(false)}
          className="fixed left-3 top-3 z-50 rounded-full border border-stone-200 bg-white/95 px-3 py-1.5 text-xs font-semibold text-stone-700 shadow-sm"
        >
          Odak modundan çık
        </button>
      )}
    </div>
  );
}
