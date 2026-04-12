"use client";

// React context providing shared settings to all pages
// Reads from Supabase user_settings table on mount
// Falls back to defaults when Supabase isn't configured

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

// ── Settings shape ──────────────────────────────────────────────────────────

export interface AppSettings {
  timeframe: "day" | "swing" | "longterm";
  autoMode: boolean;
  startingBalance: number;
  stopLossPct: number;
  takeProfitPct: number;
  maxPositionPct: number;
  dataRefreshMin: number;
  ollamaUrl: string;
  ollamaModel: string;
}

const DEFAULT_SETTINGS: AppSettings = {
  timeframe: "swing",
  autoMode: false,
  startingBalance: 100_000,
  stopLossPct: 10,
  takeProfitPct: 25,
  maxPositionPct: 10,
  dataRefreshMin: 15,
  ollamaUrl: "http://localhost:11434",
  ollamaModel: "quantamental",
};

// ── Supabase helper (nullable) ──────────────────────────────────────────────

function getOptionalSupabase() {
  try {
    // Dynamic require so the import itself never throws at module-parse time.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { getSupabase } = require("@/lib/supabase");
    return getSupabase();
  } catch {
    // Supabase env vars are missing — that's fine, we just use defaults.
    return null;
  }
}

// ── Context ─────────────────────────────────────────────────────────────────

interface SettingsContextValue {
  settings: AppSettings;
  ready: boolean;
  updateSettings: (partial: Partial<AppSettings>) => Promise<void>;
}

const SettingsContext = createContext<SettingsContextValue>({
  settings: DEFAULT_SETTINGS,
  ready: false,
  updateSettings: async () => {},
});

// ── Provider ────────────────────────────────────────────────────────────────

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [ready, setReady] = useState(false);

  // Fetch settings from Supabase on mount (if configured)
  useEffect(() => {
    let cancelled = false;

    async function load() {
      const supabase = getOptionalSupabase();
      if (!supabase) {
        setReady(true);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("user_settings")
          .select("*")
          .limit(1)
          .maybeSingle();

        if (!error && data && !cancelled) {
          // Capture the row ID so persistToSupabase updates THIS row
          if (data.id) storeRowId(data.id);
          setSettings((prev) => ({
            ...prev,
            timeframe: data.timeframe ?? prev.timeframe,
            autoMode: data.auto_mode ?? prev.autoMode,
            startingBalance: data.starting_balance ?? prev.startingBalance,
            stopLossPct: data.stop_loss_pct ?? prev.stopLossPct,
            takeProfitPct: data.take_profit_pct ?? prev.takeProfitPct,
            maxPositionPct: data.max_position_pct ?? prev.maxPositionPct,
            dataRefreshMin: data.data_refresh_min ?? prev.dataRefreshMin,
            ollamaUrl: data.ollama_url ?? prev.ollamaUrl,
            ollamaModel: data.ollama_model ?? prev.ollamaModel,
          }));
        }
      } catch {
        // Supabase unreachable or table doesn't exist — use defaults silently.
      }

      if (!cancelled) setReady(true);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // Merge partial settings and persist to Supabase (if configured)
  const updateSettings = useCallback(
    async (partial: Partial<AppSettings>) => {
      setSettings((prev) => {
        const next = { ...prev, ...partial };
        // Fire-and-forget persist — we don't block the UI on it
        persistToSupabase(next);
        return next;
      });
    },
    [],
  );

  return (
    <SettingsContext.Provider value={{ settings, ready, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

// ── Persist helper ──────────────────────────────────────────────────────────

// Track the row ID so we update the EXISTING row, not create a new one.
// Use localStorage as backup since module variables reset on navigation.
let _settingsRowId: string | null = null;

function getStoredRowId(): string | null {
  if (typeof window === "undefined") return null;
  try { return localStorage.getItem("settings_row_id"); } catch { return null; }
}
function storeRowId(id: string) {
  _settingsRowId = id;
  if (typeof window === "undefined") return;
  try { localStorage.setItem("settings_row_id", id); } catch {}
}

async function persistToSupabase(s: AppSettings) {
  const supabase = getOptionalSupabase();
  if (!supabase) return;

  const payload = {
    timeframe: s.timeframe,
    auto_mode: s.autoMode,
    starting_balance: s.startingBalance,
    stop_loss_pct: s.stopLossPct,
    take_profit_pct: s.takeProfitPct,
    max_position_pct: s.maxPositionPct,
    data_refresh_min: s.dataRefreshMin,
    ollama_url: s.ollamaUrl,
    ollama_model: s.ollamaModel,
  };

  try {
    // Try module variable first, then localStorage, then query Supabase
    const rowId = _settingsRowId || getStoredRowId();

    if (rowId) {
      await supabase
        .from("user_settings")
        .update(payload)
        .eq("id", rowId);
    } else {
      // No row ID cached — look it up from Supabase
      const { data } = await supabase
        .from("user_settings")
        .select("id")
        .limit(1)
        .maybeSingle();
      if (data?.id) {
        storeRowId(data.id);
        await supabase
          .from("user_settings")
          .update(payload)
          .eq("id", data.id);
      } else {
        const { data: inserted } = await supabase
          .from("user_settings")
          .insert(payload)
          .select("id")
          .single();
        if (inserted?.id) storeRowId(inserted.id);
      }
    }
  } catch {
    // Silent failure — Supabase is optional.
  }
}

// ── Hooks ───────────────────────────────────────────────────────────────────

export function useSettings(): AppSettings {
  return useContext(SettingsContext).settings;
}

export function useSettingsReady(): boolean {
  return useContext(SettingsContext).ready;
}

export function useUpdateSettings() {
  return useContext(SettingsContext).updateSettings;
}
