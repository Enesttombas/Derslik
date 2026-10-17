"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  BookmarkPlus,
  Check,
  Code2,
  LoaderCircle,
  MessageSquare,
  Send,
  Square,
  X,
} from "lucide-react";
import { CardMarkdown } from "@/app/study-guide";

export interface StudyChatContextDetail {
  kind: "code" | "week";
  label?: string;
  file?: string;
  startLine?: number;
  endLine?: number;
  source?: string;
  explanation?: string;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  userPrompt?: string;
}

const HISTORY_KEY = "derslik-chat-history";
const HISTORY_LIMIT = 40;
const QUICK_CODE_PROMPTS = [
  "Bu kodu satır satır açıkla",
  "Sınavda bundan nasıl soru gelir?",
  "Olası hata ve sık yapılan yanlışlar",
];
const QUICK_GENERAL_PROMPTS = ["Bu konuyu örnekle anlat", "Kendimi test et"];

export function StudyChatbot({ courseId }: { courseId?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [activeContext, setActiveContext] = useState<StudyChatContextDetail | null>(null);

  // Kart kaydetme durumları: messageId -> "idle" | "saving" | "saved" | "error"
  const [cardSaveStates, setCardSaveStates] = useState<Record<string, "idle" | "saving" | "saved" | "error">>({});
  const [cardSaveErrors, setCardSaveErrors] = useState<Record<string, string>>({});

  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const historyLoadedRef = useRef(false);

  // Sohbet geçmişi: ilk render boş kalır (hydration), sonra localStorage'dan yüklenir
  useEffect(() => {
    void Promise.resolve().then(() => {
      try {
        const raw = window.localStorage.getItem(HISTORY_KEY);
        const saved = raw ? (JSON.parse(raw) as ChatMessage[]) : [];
        if (Array.isArray(saved) && saved.length > 0) {
          setMessages(saved.filter((m) => m && typeof m.content === "string" && (m.role === "user" || m.role === "assistant")));
        }
      } catch {
        // storage unavailable or corrupt
      }
      historyLoadedRef.current = true;
    });
  }, []);

  useEffect(() => {
    if (!historyLoadedRef.current || isStreaming) return;
    try {
      window.localStorage.setItem(HISTORY_KEY, JSON.stringify(messages.slice(-HISTORY_LIMIT)));
    } catch {
      // storage unavailable
    }
  }, [messages, isStreaming]);

  const handleClear = () => {
    if (isStreaming) return;
    setMessages([]);
    setCardSaveStates({});
    setCardSaveErrors({});
  };

  // Klavye kısayolları (Ctrl+/ ile aç/kapa, Escape ile kapat)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "/") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      } else if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Pencere olayları dinleme: 'study-chat-open' ve 'study-chat-context'
  useEffect(() => {
    const handleOpen = () => {
      setIsOpen(true);
    };

    const handleContext = (e: Event) => {
      const customEvent = e as CustomEvent<StudyChatContextDetail>;
      if (customEvent.detail) {
        setActiveContext(customEvent.detail);
        setIsOpen(true);
      }
    };

    window.addEventListener("study-chat-open", handleOpen);
    window.addEventListener("study-chat-context", handleContext as EventListener);

    return () => {
      window.removeEventListener("study-chat-open", handleOpen);
      window.removeEventListener("study-chat-context", handleContext as EventListener);
    };
  }, []);

  // Panel açıldığında textarea'ya odaklan
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Yeni mesaj geldiğinde veya akış sırasında aşağı kaydır
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isStreaming, isOpen]);

  // Akışı durdur
  const handleAbort = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  // Soru gönder
  const handleSubmit = async (e?: React.FormEvent, override?: string) => {
    if (e) e.preventDefault();
    const trimmed = (override ?? input).trim();
    if (!trimmed || isStreaming) return;

    const messageKey = crypto.randomUUID();
    const userMessageId = `user-${messageKey}`;
    const assistantMessageId = `asst-${messageKey}`;

    const userMsg: ChatMessage = {
      id: userMessageId,
      role: "user",
      content: trimmed,
    };

    const assistantMsg: ChatMessage = {
      id: assistantMessageId,
      role: "assistant",
      content: "",
      userPrompt: trimmed,
    };

    const currentContext = activeContext;

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setInput("");
    setIsStreaming(true);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      const payloadMessages = [...messages, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: payloadMessages,
          context: currentContext || undefined,
        }),
        signal: abortController.signal,
      });

      if (!res.ok) {
        const errorData = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(errorData.error || `Sunucu hatası: ${res.status}`);
      }

      const body = res.body;
      if (!body) {
        throw new Error("Yanıt akışı boş.");
      }

      const reader = body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split(/\r?\n\r?\n/);
        buffer = parts.pop() ?? "";

        for (const part of parts) {
          const lines = part.split(/\r?\n/);
          for (const line of lines) {
            const lineTrimmed = line.trim();
            if (!lineTrimmed.startsWith("data:")) continue;
            const dataStr = lineTrimmed.slice(5).trim();
            if (dataStr === "[DONE]") {
              break;
            }
            try {
              const parsed = JSON.parse(dataStr) as { delta?: string };
              if (typeof parsed.delta === "string") {
                const deltaText = parsed.delta;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMessageId
                      ? { ...m, content: m.content + deltaText }
                      : m
                  )
                );
              }
            } catch {
              // Parça henüz tamamlanmamış olabilir
            }
          }
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        // İptal edildi
      } else {
        const errorMsg =
          err instanceof Error ? err.message : "Yanıt alınırken bir hata oluştu";
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMessageId
              ? {
                  ...m,
                  content:
                    m.content ||
                    `⚠️ **Yanıt alınamadı:** ${errorMsg}`,
                }
              : m
          )
        );
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  // Kart olarak kaydet
  const handleSaveCard = async (messageId: string, promptText: string, answerText: string) => {
    if (!courseId) return;

    setCardSaveStates((prev) => ({ ...prev, [messageId]: "saving" }));
    setCardSaveErrors((prev) => ({ ...prev, [messageId]: "" }));

    try {
      const res = await fetch("/api/cards", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          courseId,
          kind: "flashcard",
          prompt: promptText,
          answer: answerText,
        }),
      });

      if (!res.ok) {
        const errorData = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(errorData.error || "Kart kaydedilemedi");
      }

      setCardSaveStates((prev) => ({ ...prev, [messageId]: "saved" }));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Kart kaydedilemedi";
      setCardSaveStates((prev) => ({ ...prev, [messageId]: "error" }));
      setCardSaveErrors((prev) => ({ ...prev, [messageId]: msg }));
    }
  };

  return (
    <>
      {/* Sağ alt yüzen çalışma chatbot butonu */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Çalışma Asistanını Aç/Kapat (Ctrl+/)"
        className={`fixed bottom-[calc(5.25rem+env(safe-area-inset-bottom,0px))] right-4 z-50 flex h-11 w-11 items-center justify-center rounded-full opacity-95 bg-stone-900 text-white shadow-lg transition-all duration-150 hover:bg-stone-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 md:bottom-6 md:right-6 ${
          isOpen ? "ring-2 ring-[var(--primary)] ring-offset-2" : ""
        }`}
      >
        {isOpen ? (
          <X className="h-5 w-5" />
        ) : (
          <div className="relative flex items-center justify-center">
            <MessageSquare className="h-5 w-5 text-white" />
            {activeContext && (
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[var(--primary)]" />
              </span>
            )}
          </div>
        )}
      </button>

      {/* Chatbot Paneli */}
      {isOpen && (
        <button type="button" aria-label="Asistanı kapat" tabIndex={-1} onClick={() => setIsOpen(false)} className="fixed inset-0 z-40 bg-black/30 md:hidden" />
      )}
      {isOpen && (
        <div role="region" aria-label="Çalışma asistanı" className="animate-in fade-in slide-in-from-bottom-2 duration-200 motion-reduce:animate-none fixed inset-x-0 bottom-0 z-50 flex h-[70dvh] max-h-[560px] w-full flex-col overflow-hidden rounded-t-2xl border-t border-stone-200 bg-white shadow-xl md:inset-auto md:bottom-22 md:right-6 md:h-[580px] md:w-[420px] md:max-h-[85dvh] md:rounded-2xl md:border md:border-stone-200">
          {/* Başlık Barı */}
          <div className="flex shrink-0 items-center justify-between border-b border-stone-200 bg-stone-50/80 px-4 py-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-stone-900 text-white">
                <MessageSquare className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <h3 className="truncate text-xs font-semibold uppercase tracking-wider text-stone-900">
                  Çalışma Asistanı
                </h3>
                <p className="truncate text-[11px] text-stone-500">
                  Ders & Sınav Rehberi
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <span className="hidden rounded bg-stone-200 px-1.5 py-0.5 font-mono text-[10px] text-stone-600 sm:inline">
                Ctrl+/
              </span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-stone-500 hover:bg-stone-200 hover:text-stone-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
                aria-label="Kapat (Escape)"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Aktif Bağlam Rozeti */}
          {activeContext && (
            <div className="flex shrink-0 flex-col gap-1 border-b border-stone-200 bg-stone-50 px-3.5 py-2 text-xs text-stone-800">
              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-1.5 truncate">
                  <Code2 className="h-3.5 w-3.5 shrink-0 text-[var(--ring)]" />
                  <span className="font-semibold text-stone-900">
                    {activeContext.kind === "week" ? "Hafta bağlamı:" : "Kod bağlamı:"}
                  </span>
                  <span
                    className="truncate font-mono text-[11px] text-stone-700"
                    title={activeContext.label ?? activeContext.file}
                  >
                    {activeContext.label ?? activeContext.file}
                    {activeContext.startLine && activeContext.endLine
                      ? ` (Satır ${activeContext.startLine}-${activeContext.endLine})`
                      : ""}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveContext(null)}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded text-stone-500 hover:bg-stone-200 hover:text-stone-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
                  title="Bağlamı kaldır"
                  aria-label="Bağlamı kaldır"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <p className="text-[11px] text-stone-500">
                Bağlam hazır. Bu içerikle ilgili sorunu yazabilirsin.
              </p>
            </div>
          )}

          {/* Mesaj Listesi */}
          <div className="min-w-0 flex-1 space-y-3.5 overflow-y-auto overflow-x-hidden p-4">
            {messages.length === 0 && (
              <div className="flex h-full flex-col items-center justify-center space-y-3 text-center text-stone-500">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-stone-100 text-stone-700">
                  <MessageSquare className="h-6 w-6" />
                </div>
                <div className="max-w-[280px] space-y-1">
                  <p className="text-xs font-semibold text-stone-800">
                    Nasıl yardımcı olabilirim?
                  </p>
                  <p className="text-xs leading-relaxed text-stone-500">
                    Ders notları, ödev kodları veya formüller hakkında soru sorabilirsin.
                  </p>
                </div>
                <div className="rounded-xl border border-stone-200 bg-stone-50 p-2.5 text-left text-[11px] text-stone-600">
                  💡 Ödevler sekmesindeki <strong className="text-stone-900">&quot;Aktif kodu sor&quot;</strong> butonuna basarak seçili kodu doğrudan buraya aktarabilirsin.
                </div>
              </div>
            )}

            {messages.map((msg, index) => {
              const isUser = msg.role === "user";
              const isLast = index === messages.length - 1;
              const isAssistantStreaming = !isUser && isStreaming && isLast;

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
                >
                  <div
                    className={`min-w-0 max-w-[90%] rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm leading-relaxed [overflow-wrap:anywhere] break-words ${
                      isUser
                        ? "rounded-tr-xs bg-stone-900 text-white"
                        : "rounded-tl-xs border border-stone-200 bg-stone-100/80 text-stone-900 shadow-2xs"
                    }`}
                  >
                    {isUser ? (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    ) : (
                      <>
                        <CardMarkdown
                          source={msg.content || (isAssistantStreaming ? "..." : "")}
                          className="min-w-0 text-stone-800 [&_pre]:my-2 [&_pre]:max-w-full [&_pre]:overflow-x-auto [&_pre]:rounded-xl [&_pre]:bg-stone-950 [&_pre]:p-3 [&_pre]:text-xs [&_pre]:text-stone-100 [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-inherit [&_p]:my-1.5 [&_ul]:my-1.5 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-1.5 [&_ol]:list-decimal [&_ol]:pl-5 [&_table]:min-w-full [&_table]:border-collapse [&_th]:border [&_th]:border-stone-200 [&_th]:bg-stone-100 [&_th]:p-1.5 [&_td]:border [&_td]:border-stone-200 [&_td]:p-1.5"
                        />

                        {/* Kart olarak kaydet butonu */}
                        {!isAssistantStreaming && msg.content && (
                          <div className="mt-2.5 flex flex-wrap items-center gap-2 border-t border-stone-200/60 pt-2">
                            <button
                              type="button"
                              disabled={
                                !courseId ||
                                cardSaveStates[msg.id] === "saving" ||
                                cardSaveStates[msg.id] === "saved"
                              }
                              onClick={() =>
                                handleSaveCard(
                                  msg.id,
                                  msg.userPrompt || "Ders Çalışma Notu",
                                  msg.content
                                )
                              }
                              title={
                                !courseId
                                  ? "Kart kaydetmek için aktif bir ders açmalısınız"
                                  : "Bu açıklamayı tekrar kartı olarak kaydet"
                              }
                              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
                                cardSaveStates[msg.id] === "saved"
                                  ? "border border-emerald-300 bg-emerald-50 text-emerald-800"
                                  : cardSaveStates[msg.id] === "error"
                                  ? "border border-red-300 bg-red-50 text-red-800"
                                  : !courseId
                                  ? "cursor-not-allowed border border-stone-200 bg-stone-100 text-stone-400"
                                  : "border border-stone-300 bg-white text-stone-700 hover:bg-stone-50 hover:text-stone-900 shadow-2xs"
                              }`}
                            >
                              {cardSaveStates[msg.id] === "saving" ? (
                                <>
                                  <LoaderCircle className="h-3 w-3 animate-spin" />
                                  <span>Kaydediliyor…</span>
                                </>
                              ) : cardSaveStates[msg.id] === "saved" ? (
                                <>
                                  <Check className="h-3 w-3 text-emerald-600" />
                                  <span>Kart Kaydedildi ✓</span>
                                </>
                              ) : (
                                <>
                                  <BookmarkPlus className="h-3 w-3" />
                                  <span>Kart olarak kaydet</span>
                                </>
                              )}
                            </button>

                            {!courseId && (
                              <span
                                className="text-[10.5px] text-stone-400"
                                title="Kart kaydı için ders seçilmelidir"
                              >
                                (Ders seçilmedi)
                              </span>
                            )}

                            {cardSaveStates[msg.id] === "error" && (
                              <span className="text-[11px] font-medium text-red-600">
                                {cardSaveErrors[msg.id] || "Hata oluştu"}
                              </span>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Soru Giriş Alanı */}
          <form
            onSubmit={handleSubmit}
            className="shrink-0 border-t border-stone-200 bg-white p-3 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))]"
          >
            <div className="mb-2 flex flex-wrap items-center gap-1.5">
              {(activeContext?.kind === "code" ? QUICK_CODE_PROMPTS : QUICK_GENERAL_PROMPTS).map((quick) => (
                <button
                  key={quick}
                  type="button"
                  disabled={isStreaming}
                  onClick={() => void handleSubmit(undefined, quick)}
                  className="rounded-full border border-stone-200 bg-stone-50 px-2.5 py-1 text-[11px] font-medium text-stone-700 transition-colors hover:bg-stone-100 disabled:opacity-50"
                >
                  {quick}
                </button>
              ))}
              {messages.length > 0 && (
                <button
                  type="button"
                  disabled={isStreaming}
                  onClick={handleClear}
                  className="ml-auto inline-flex min-h-[44px] items-center rounded-lg px-2.5 py-1 text-xs font-medium text-stone-500 hover:text-stone-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] disabled:opacity-50"
                >
                  Sohbeti temizle
                </button>
              )}
            </div>
            <div className="flex items-end gap-2">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
                rows={1}
                placeholder="Bir soru sor... (Shift+Enter yeni satır)"
                className="max-h-28 min-h-[44px] flex-1 resize-none rounded-xl border border-stone-200 px-3 py-2.5 text-base md:text-sm leading-relaxed text-stone-900 placeholder-stone-400 focus:border-[var(--primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
                disabled={isStreaming}
              />

              {isStreaming ? (
                <button
                  type="button"
                  onClick={handleAbort}
                  className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl bg-stone-200 px-3.5 text-xs font-semibold text-stone-800 transition-colors hover:bg-stone-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
                  title="Yanıtı durdur"
                >
                  <Square className="h-3.5 w-3.5 fill-current" />
                  <span className="hidden sm:inline">Durdur</span>
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className="inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-xl bg-stone-900 text-white transition-colors hover:bg-stone-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] disabled:opacity-40 disabled:hover:bg-stone-900"
                  aria-label="Gönder"
                >
                  <Send className="h-4 w-4" />
                </button>
              )}
            </div>
          </form>
        </div>
      )}
    </>
  );
}
