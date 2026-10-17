import React from "react";
import { ChevronRight } from "lucide-react";

export default function WeekDisclosure({
  weeks,
  openWeek,
  onToggle,
  idPrefix,
  children,
  label,
}: {
  weeks: number[];
  openWeek: number | null;
  onToggle: (week: number) => void;
  idPrefix: string;
  children: React.ReactNode;
  label?: string;
}) {
  const isValidOpen = openWeek !== null && weeks.includes(openWeek);

  return (
    <div className="flex flex-col md:flex-row md:items-start gap-5 min-w-0">
      <nav
        aria-label={label ?? "Haftalar"}
        className="flex flex-nowrap overflow-x-auto pb-1.5 md:pb-0 md:flex-col gap-2 shrink-0 md:w-44 min-w-0 max-w-full scrollbar-thin"
      >
        {weeks.map((week) => {
          const isActive = openWeek === week;
          const buttonId = `${idPrefix}-week-${week}`;
          const regionId = `${idPrefix}-region-${week}`;
          return (
            <button
              key={week}
              type="button"
              id={buttonId}
              aria-expanded={isActive}
              aria-controls={regionId}
              onClick={() => onToggle(week)}
              className={`inline-flex min-h-[44px] min-w-[44px] shrink-0 md:shrink items-center justify-between gap-2.5 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 ${
                isActive
                  ? "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-xs"
                  : "bg-white text-stone-700 border border-stone-200 hover:bg-stone-50 hover:text-stone-900"
              }`}
            >
              <span className="whitespace-nowrap">{week}. Hafta</span>
              <ChevronRight
                className={`h-4 w-4 shrink-0 transition-transform ${
                  isActive ? "rotate-90 md:rotate-0 text-white" : "text-stone-400"
                }`}
                aria-hidden="true"
              />
            </button>
          );
        })}
      </nav>

      {isValidOpen ? (
        <div
          role="region"
          id={`${idPrefix}-region-${openWeek}`}
          aria-labelledby={`${idPrefix}-week-${openWeek}`}
          className="flex-1 min-w-0 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-left-2 motion-reduce:animate-none duration-200"
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}
