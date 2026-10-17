"use client";

import { useState, type ComponentProps } from "react";
import { StudyFeed } from "@/components/study-feed";
import { AkisFeed } from "./akis-feed";

// Kod akışı (yeni) varsayılan; eski soru akışı tek dokunuşla yanında.
export function AkisSekme({ acilis = "kod", ...props }: ComponentProps<typeof StudyFeed> & { acilis?: "kod" | "soru" }) {
  const [mod, setMod] = useState<"kod" | "soru">(acilis);
  return (
    <div className="akis-kok">
      <div className="akis-segment akis-mod" role="tablist">
        <button type="button" role="tab" aria-selected={mod === "kod"} onClick={() => setMod("kod")}>Kod</button>
        <button type="button" role="tab" aria-selected={mod === "soru"} onClick={() => setMod("soru")}>Sorular</button>
      </div>
      {mod === "kod" ? <AkisFeed /> : <StudyFeed {...props} />}
    </div>
  );
}
