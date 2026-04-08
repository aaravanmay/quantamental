"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { searchTickers } from "@/lib/api";
import type { SearchResult } from "@/lib/types";

export function StockSearch({ autoFocus = false, fullWidth = false }: { autoFocus?: boolean; fullWidth?: boolean }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(-1);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>(undefined);

  useEffect(() => { if (autoFocus) inputRef.current?.focus(); }, [autoFocus]);

  const handleGlobalKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); inputRef.current?.focus(); }
  }, []);
  useEffect(() => {
    document.addEventListener("keydown", handleGlobalKeyDown);
    return () => document.removeEventListener("keydown", handleGlobalKeyDown);
  }, [handleGlobalKeyDown]);

  function handleChange(value: string) {
    setQuery(value);
    setSelectedIdx(-1);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.length < 1) { setResults([]); setIsOpen(false); return; }
    debounceRef.current = setTimeout(async () => {
      try { const data = await searchTickers(value); setResults(data.slice(0, 8)); setIsOpen(true); } catch { setResults([]); }
    }, 250);
  }

  function navigate(symbol: string) { setIsOpen(false); setQuery(""); router.push(`/stock/${symbol}`); }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!isOpen) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setSelectedIdx((p) => Math.min(p + 1, results.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setSelectedIdx((p) => Math.max(p - 1, 0)); }
    else if (e.key === "Enter") { e.preventDefault(); if (selectedIdx >= 0 && results[selectedIdx]) navigate(results[selectedIdx].symbol); else if (query.length > 0) navigate(query.toUpperCase()); }
    else if (e.key === "Escape") setIsOpen(false);
  }

  return (
    <div className={`relative w-full ${fullWidth ? "" : "max-w-xl"}`}>
      <div className="relative">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#555]" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
          placeholder="Search stocks, sectors, or ask AI..."
          className="glass-input w-full py-3 pl-11 pr-14 text-[14px] text-white placeholder-[#555]"
        />
        <kbd className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-md px-2 py-0.5 text-[10px] text-[#555]" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}>
          ⌘K
        </kbd>
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute z-50 mt-2 w-full glass py-1" style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}>
          {results.map((r, i) => (
            <button
              key={r.symbol}
              onMouseDown={() => navigate(r.symbol)}
              className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors ${
                i === selectedIdx ? "bg-[rgba(255,255,255,0.08)] text-white" : "text-[#868F97] hover:bg-[rgba(255,255,255,0.04)] hover:text-white"
              }`}
            >
              <span className="w-16 font-semibold text-white">{r.symbol}</span>
              <span className="flex-1 truncate">{r.name}</span>
              <span className="text-[10px] text-[#555]">{r.stockExchange}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
