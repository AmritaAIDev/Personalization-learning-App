"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import TopicPickerDialog from "@/components/search/TopicPickerDialog";

type Destination = "learn" | "practice";

interface CommandPaletteContextValue {
  openPalette: (destination?: Destination) => void;
  closePalette: () => void;
}

const CommandPaletteContext = createContext<CommandPaletteContextValue | null>(null);

export function CommandPaletteProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [destination, setDestination] = useState<Destination>("learn");

  const openPalette = useCallback((next: Destination = "learn") => {
    setDestination(next);
    setOpen(true);
  }, []);

  const closePalette = useCallback(() => setOpen(false), []);

  useEffect(() => {
    const openWithShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        openPalette();
      }
    };
    window.addEventListener("keydown", openWithShortcut);
    return () => window.removeEventListener("keydown", openWithShortcut);
  }, [openPalette]);

  const value = useMemo(() => ({ openPalette, closePalette }), [openPalette, closePalette]);

  return (
    <CommandPaletteContext.Provider value={value}>
      {children}
      <TopicPickerDialog open={open} onClose={closePalette} destination={destination} />
    </CommandPaletteContext.Provider>
  );
}

export function useCommandPalette(): CommandPaletteContextValue {
  const ctx = useContext(CommandPaletteContext);
  if (!ctx) {
    throw new Error("useCommandPalette must be used within a CommandPaletteProvider");
  }
  return ctx;
}
