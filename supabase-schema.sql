-- Quantamental Architect — Supabase Schema
-- Run this in the Supabase SQL Editor to create all tables

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- ══════════════════════════════════════════
-- Portfolio Holdings
-- ══════════════════════════════════════════
create table portfolio_holdings (
  id uuid primary key default uuid_generate_v4(),
  user_id text not null,
  ticker text not null,
  shares numeric not null default 0,
  avg_cost numeric not null default 0,
  sector text default '',
  added_date date default current_date,
  created_at timestamptz default now()
);

alter table portfolio_holdings enable row level security;
create policy "Users can manage their own holdings"
  on portfolio_holdings for all
  using (auth.uid()::text = user_id);

-- ══════════════════════════════════════════
-- Paper Trades
-- ══════════════════════════════════════════
create table paper_trades (
  id uuid primary key default uuid_generate_v4(),
  user_id text not null,
  ticker text not null,
  direction text not null check (direction in ('LONG', 'SHORT')),
  shares numeric not null default 0,
  entry_price numeric not null,
  exit_price numeric,
  entry_date date not null default current_date,
  exit_date date,
  status text not null default 'open' check (status in ('open', 'closed')),
  mode text not null default 'manual' check (mode in ('auto', 'manual')),
  thesis_id uuid,
  created_at timestamptz default now()
);

alter table paper_trades enable row level security;
create policy "Users can manage their own trades"
  on paper_trades for all
  using (auth.uid()::text = user_id);

-- ══════════════════════════════════════════
-- Trade Signals (from grid search)
-- ══════════════════════════════════════════
create table trade_signals (
  id uuid primary key default uuid_generate_v4(),
  ticker text not null,
  strategy text not null,
  params_json jsonb default '{}',
  sharpe numeric not null default 0,
  win_rate numeric not null default 0,
  max_drawdown numeric not null default 0,
  direction text not null default 'LONG' check (direction in ('LONG', 'SHORT')),
  sector text default '',
  signal_date date not null default current_date,
  validation_status text not null default 'pending' check (validation_status in ('pending', 'go', 'nogo')),
  thesis_json jsonb,
  created_at timestamptz default now()
);

alter table trade_signals enable row level security;
create policy "Signals are readable by authenticated users"
  on trade_signals for select
  using (auth.role() = 'authenticated');
create policy "Signals can be inserted by authenticated users"
  on trade_signals for insert
  with check (auth.role() = 'authenticated');
create policy "Signals can be updated by authenticated users"
  on trade_signals for update
  using (auth.role() = 'authenticated');

-- ══════════════════════════════════════════
-- AI Theses
-- ══════════════════════════════════════════
create table theses (
  id uuid primary key default uuid_generate_v4(),
  ticker text not null,
  technical_signal_json jsonb,
  events_assessment text,
  fundamentals_assessment text,
  synthesis_json jsonb,
  recommendation text check (recommendation in ('GO', 'NO-GO')),
  confidence text check (confidence in ('HIGH', 'MEDIUM', 'LOW')),
  created_at timestamptz default now()
);

alter table theses enable row level security;
create policy "Theses are readable by authenticated users"
  on theses for select
  using (auth.role() = 'authenticated');
create policy "Theses can be inserted by authenticated users"
  on theses for insert
  with check (auth.role() = 'authenticated');

-- ══════════════════════════════════════════
-- Portfolio Scans
-- ══════════════════════════════════════════
create table portfolio_scans (
  id uuid primary key default uuid_generate_v4(),
  user_id text not null,
  scan_date timestamptz default now(),
  results_json jsonb not null default '[]'
);

alter table portfolio_scans enable row level security;
create policy "Users can manage their own scans"
  on portfolio_scans for all
  using (auth.uid()::text = user_id);

-- ══════════════════════════════════════════
-- Watchlist
-- ══════════════════════════════════════════
create table watchlist (
  id uuid primary key default uuid_generate_v4(),
  user_id text not null,
  ticker text not null,
  added_date date default current_date,
  unique(user_id, ticker)
);

alter table watchlist enable row level security;
create policy "Users can manage their own watchlist"
  on watchlist for all
  using (auth.uid()::text = user_id);

-- ══════════════════════════════════════════
-- User Settings
-- ══════════════════════════════════════════
create table user_settings (
  id uuid primary key default uuid_generate_v4(),
  user_id text unique not null,
  paper_trading_mode text default 'manual' check (paper_trading_mode in ('auto', 'manual')),
  default_position_size numeric default 1000,
  created_at timestamptz default now()
);

alter table user_settings enable row level security;
create policy "Users can manage their own settings"
  on user_settings for all
  using (auth.uid()::text = user_id);

-- App settings columns (added for settings-context sync)
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS default_timeframe text DEFAULT 'swing';
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS auto_mode boolean DEFAULT false;
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS starting_balance numeric DEFAULT 100000;
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS stop_loss_pct numeric DEFAULT 10;
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS take_profit_pct numeric DEFAULT 25;
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS max_position_pct numeric DEFAULT 10;
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS data_refresh_min integer DEFAULT 15;
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS ollama_url text DEFAULT 'http://localhost:11434';
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS ollama_model text DEFAULT 'quantamental';

-- ══════════════════════════════════════════
-- Indexes for performance
-- ══════════════════════════════════════════
create index idx_holdings_user on portfolio_holdings(user_id);
create index idx_trades_user on paper_trades(user_id);
create index idx_trades_status on paper_trades(status);
create index idx_signals_date on trade_signals(signal_date desc);
create index idx_signals_status on trade_signals(validation_status);
create index idx_theses_ticker on theses(ticker);
create index idx_watchlist_user on watchlist(user_id);

-- ══════════════════════════════════════════
-- Broker Accounts (Fidelity via SnapTrade)
-- ══════════════════════════════════════════
create table broker_accounts (
  id uuid primary key default uuid_generate_v4(),
  user_id text not null,
  broker_name text default 'fidelity',
  snaptrade_user_id text,
  snaptrade_user_secret text,
  account_id text,
  account_name text,
  connected_at timestamptz default now(),
  last_synced_at timestamptz
);

alter table broker_accounts enable row level security;
create policy "Users can manage their own broker accounts"
  on broker_accounts for all
  using (auth.uid()::text = user_id);

-- Add sync metadata to portfolio_holdings
alter table portfolio_holdings add column if not exists source text default 'manual';
alter table portfolio_holdings add column if not exists broker_account_id uuid references broker_accounts(id);
alter table portfolio_holdings add column if not exists last_synced_at timestamptz;

-- Indexes for broker features
create index idx_broker_accounts_user on broker_accounts(user_id);
create index idx_holdings_source on portfolio_holdings(source);

-- ══════════════════════════════════════════
-- Approved Trades (Fidelity execution queue)
-- ══════════════════════════════════════════
create table approved_trades (
  id uuid primary key default uuid_generate_v4(),
  user_id text not null,
  ticker text not null,
  direction text not null check (direction in ('LONG', 'SHORT')),
  shares numeric not null,
  thesis_id uuid references theses(id),
  approved_at timestamptz default now(),
  executed boolean default false,
  executed_at timestamptz,
  execution_price numeric
);

alter table approved_trades enable row level security;
create policy "Users manage own approved trades"
  on approved_trades for all
  using (auth.uid()::text = user_id);

create index idx_approved_trades_user on approved_trades(user_id);
create index idx_approved_trades_executed on approved_trades(executed);
create index idx_approved_trades_ticker on approved_trades(ticker);
