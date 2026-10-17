"use client";

import React, { useState, useEffect, useRef, useCallback, useSyncExternalStore } from "react";
import { Sun, Moon, BookOpen, Check, Palette } from "lucide-react";

export type Theme = "light" | "dark" | "sepia" | "twilight";

interface ThemeOption {
  id: Theme;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const THEMES: ThemeOption[] = [
  {
    id: "light",
    label: "Açık",
    description: "Varsayılan nötr / mavi",
    icon: Sun,
  },
  {
    id: "dark",
    label: "Koyu",
    description: "Grafit koyu / mavi",
    icon: Moon,
  },
  {
    id: "sepia",
    label: "Adaçayı",
    description: "Yumuşak adaçayı yeşili",
    icon: BookOpen,
  },
  {
    id: "twilight",
    label: "Alacakaranlık",
    description: "Yumuşak mor-mavi ton",
    icon: Palette,
  },
];

const STORAGE_KEY = "derslik-theme";

function isValidTheme(value: unknown): value is Theme {
  return value === "light" || value === "dark" || value === "sepia" || value === "twilight";
}

function readTheme(): Theme {
  const value = document.documentElement.getAttribute("data-theme");
  return isValidTheme(value) ? value : "light";
}

function subscribeTheme(onChange: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY) return;
    document.documentElement.setAttribute("data-theme", isValidTheme(event.newValue) ? event.newValue : "light");
    onChange();
  };
  window.addEventListener("derslik-theme-change", onChange);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener("derslik-theme-change", onChange);
    window.removeEventListener("storage", onStorage);
  };
}

const serverTheme = (): Theme => "light";

export function ThemeSwitcher() {
  const theme = useSyncExternalStore(subscribeTheme, readTheme, serverTheme);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    if (isOpen) itemRefs.current[activeIndex]?.focus();
  }, [isOpen, activeIndex]);

  // Outside click listener
  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("pointerdown", handleClickOutside);
    return () => document.removeEventListener("pointerdown", handleClickOutside);
  }, [isOpen]);

  const applyTheme = useCallback((nextTheme: Theme) => {
    document.documentElement.setAttribute("data-theme", nextTheme);
    window.dispatchEvent(new Event("derslik-theme-change"));
    try {
      localStorage.setItem(STORAGE_KEY, nextTheme);
    } catch {
      // Storage failure ignored safely
    }
    setIsOpen(false);
    triggerRef.current?.focus();
  }, []);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (!isOpen) {
      if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        setActiveIndex(THEMES.findIndex((option) => option.id === theme));
        setIsOpen(true);
      }
      return;
    }

    switch (event.key) {
      case "Escape": {
        event.preventDefault();
        setIsOpen(false);
        triggerRef.current?.focus();
        break;
      }
      case "ArrowDown": {
        event.preventDefault();
        const next = (activeIndex + 1) % THEMES.length;
        setActiveIndex(next);
        itemRefs.current[next]?.focus();
        break;
      }
      case "ArrowUp": {
        event.preventDefault();
        const prev = (activeIndex - 1 + THEMES.length) % THEMES.length;
        setActiveIndex(prev);
        itemRefs.current[prev]?.focus();
        break;
      }
      case "Home": {
        event.preventDefault();
        setActiveIndex(0);
        itemRefs.current[0]?.focus();
        break;
      }
      case "End": {
        event.preventDefault();
        const last = THEMES.length - 1;
        setActiveIndex(last);
        itemRefs.current[last]?.focus();
        break;
      }
      case "Tab": {
        setIsOpen(false);
        break;
      }
      default:
        break;
    }
  };

  const CurrentIcon =
    theme === "dark" ? Moon : theme === "sepia" ? BookOpen : theme === "twilight" ? Palette : theme === "light" ? Sun : Palette;

  return (
    <div ref={containerRef} className="relative inline-block text-left" onKeyDown={handleKeyDown}>
      <button
        ref={triggerRef}
        type="button"
        id="theme-switcher-button"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label="Tema seçimi"
        title="Tema seçimi"
        onClick={() => {
          setActiveIndex(THEMES.findIndex((option) => option.id === theme));
          setIsOpen((prev) => !prev);
        }}
        className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-700 hover:bg-stone-100 hover:text-stone-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] transition-colors"
      >
        <CurrentIcon className="h-4 w-4" />
        <span className="sr-only">Tema seçimi</span>
      </button>

      {isOpen && (
        <div
          role="menu"
          aria-labelledby="theme-switcher-button"
          aria-orientation="vertical"
          className="absolute right-0 mt-2 w-56 origin-top-right rounded-2xl border border-stone-200 bg-white p-1.5 shadow-lg ring-1 ring-black/5 focus:outline-none z-50 animate-in fade-in zoom-in-95 duration-100"
        >
          <div className="px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-stone-500">
            Görünüm Teması
          </div>
          {THEMES.map((opt, index) => {
            const Icon = opt.icon;
            const isSelected = theme === opt.id;
            return (
              <button
                key={opt.id}
                ref={(el) => {
                  itemRefs.current[index] = el;
                }}
                role="menuitemradio"
                aria-checked={isSelected}
                tabIndex={index === activeIndex ? 0 : -1}
                onClick={() => applyTheme(opt.id)}
                className={`flex w-full min-h-[44px] items-center gap-3 rounded-xl px-2.5 py-2 text-left text-xs transition-colors focus:outline-none ${
                  isSelected
                    ? "bg-stone-100 font-semibold text-stone-900"
                    : "text-stone-700 hover:bg-stone-50 hover:text-stone-900"
                } ${index === activeIndex ? "ring-2 ring-[var(--primary)]/40 ring-inset" : ""}`}
              >
                <div
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                    isSelected ? "bg-white text-[var(--ring)] shadow-xs" : "bg-stone-100 text-stone-600"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-stone-900">{opt.label}</div>
                  <div className="truncate text-[11px] text-stone-500">{opt.description}</div>
                </div>
                {isSelected && <Check className="h-4 w-4 shrink-0 text-[var(--ring)]" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
