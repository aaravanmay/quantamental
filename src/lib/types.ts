// ── Timeframe ──
export type Timeframe = "day" | "swing" | "longterm";

export const TIMEFRAME_CONFIG = {
  day: { label: "Day Trade", duration: "1 day", holdPeriod: "minutes to hours", description: "Intraday momentum plays" },
  swing: { label: "Swing Trade", duration: "4 months", holdPeriod: "weeks to months", description: "Medium-term technical + fundamental" },
  longterm: { label: "Long-Term", duration: "1 year", holdPeriod: "months to years", description: "Value investing + macro thesis" },
} as const;

// ── Technical Signal (from Vectorbt grid search) ──
export interface TechnicalSignal {
  ticker: string;
  strategy: string;
  params?: Record<string, number>;
  sharpe: number;
  win_rate: number;
  max_drawdown: number;
  direction: "LONG" | "SHORT";
  sector: string;
  signal_date: string;
  timeframe?: Timeframe;
}

// ── Trade Signal (stored in Supabase) ──
export interface TradeSignal {
  id: string;
  ticker: string;
  strategy: string;
  params_json: Record<string, number>;
  sharpe: number;
  win_rate: number;
  max_drawdown: number;
  direction: "LONG" | "SHORT";
  signal_date: string;
  validation_status: "pending" | "go" | "nogo";
  thesis_json: Thesis | null;
  timeframe?: Timeframe;
}

// ── AI Thesis ──
export interface Thesis {
  ticker: string;
  recommendation: "GO" | "NO-GO";
  signal: string;
  thesis: string;
  risk: string;
  confidence: "HIGH" | "MEDIUM" | "LOW";
  monitoring: string;
  events_assessment: string;
  fundamentals_assessment: string;
  created_at: string;
}

// ── Paper Trade ──
export interface PaperTrade {
  id: string;
  user_id: string;
  ticker: string;
  direction: "LONG" | "SHORT";
  entry_price: number;
  exit_price: number | null;
  entry_date: string;
  exit_date: string | null;
  status: "open" | "closed";
  mode: "auto" | "manual";
  thesis_id: string | null;
  shares: number;
  pnl_pct?: number;
  timeframe?: Timeframe;
}

// ── Portfolio Holding ──
export interface Holding {
  id: string;
  user_id: string;
  ticker: string;
  shares: number;
  avg_cost: number;
  sector: string;
  added_date: string;
  current_price?: number;
  pnl_pct?: number;
  weight_pct?: number;
}

// ── Portfolio Scan Result ──
export interface ScanResult {
  ticker: string;
  action: "HOLD" | "WATCH" | "REDUCE" | "EXIT";
  reasoning: string;
  risk_level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  trigger: string;
  events_assessment: string;
  fundamentals_assessment: string;
  scanned_at: string;
}

// ── Stock Quote ──
export interface StockQuote {
  ticker: string;
  price: number;
  change: number;
  change_pct: number;
  open: number;
  high: number;
  low: number;
  volume: number;
  market_cap?: number;
  name?: string;
  sector?: string;
}

// ── Search Result ──
export interface SearchResult {
  symbol: string;
  name: string;
  currency: string;
  stockExchange: string;
}

// ── Performance Stats ──
export interface PerformanceStats {
  total_return_pct: number;
  sharpe_ratio: number;
  win_rate: number;
  avg_hold_days: number;
  total_trades: number;
  open_trades: number;
}

// ── Broker Account (Fidelity via SnapTrade) ──
export interface BrokerAccount {
  id: string;
  user_id: string;
  broker_name: string;
  snaptrade_user_id: string;
  account_id: string;
  account_name: string;
  connected_at: string;
  last_synced_at: string | null;
}
