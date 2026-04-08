"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const ROUTES: Record<string, string> = {
  "1": "/",
  "2": "/stock-finder",
  "3": "/paper-trading",
  "4": "/portfolio",
  "5": "/settings",
};

export function KeyboardShortcuts() {
  const router = useRouter();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Require Cmd (Mac) or Ctrl (Windows/Linux)
      if (!e.metaKey && !e.ctrlKey) return;

      // Ignore if user is typing in an input/textarea/contenteditable
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable) {
        // Allow Cmd+K to pass through even in inputs (handled by StockSearch)
        if (e.key === "k" || e.key === "K") return;
        return;
      }

      const route = ROUTES[e.key];
      if (route) {
        e.preventDefault();
        router.push(route);
        return;
      }

      // Cmd+K is handled by StockSearch — don't interfere
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router]);

  return null;
}
