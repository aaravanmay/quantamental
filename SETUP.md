# Quantamental Architect — Setup Guide

## 1. Supabase (Database)

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Click "New Project" → name it `quantamental` → choose a region → set a database password
3. Wait for the project to initialize (~1 minute)
4. Go to **Project Settings → API** and copy:
   - **Project URL** (looks like `https://abcdef.supabase.co`)
   - **anon public** key (starts with `eyJ...`)
5. Create `dashboard/.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...your-anon-key-here
   ```
6. In Supabase, go to **SQL Editor** → paste the contents of `dashboard/supabase-schema.sql` → click **Run**
7. Restart the dev server: `npm run dev`

## 2. API Keys (Free Tiers)

### Finnhub (Company News + Market Data)
1. Go to [finnhub.io](https://finnhub.io) → Sign up (free)
2. Copy your API key from the dashboard
3. Add to `dashboard/.env.local`:
   ```
   FINNHUB_API_KEY=your-finnhub-key
   ```
4. **Limits:** 60 requests/minute, no daily cap

### FMP (Fundamentals + Quotes + History)
1. Go to [financialmodelingprep.com](https://financialmodelingprep.com) → Sign up (free)
2. Copy your API key
3. Add to `dashboard/.env.local`:
   ```
   FMP_API_KEY=your-fmp-key
   ```
4. **Limits:** 250 requests/day

### Perplexity (Optional — AI Web Search)
1. Go to [perplexity.ai](https://perplexity.ai) → API section
2. Add to `dashboard/.env.local` (or skip for free mode):
   ```
   PERPLEXITY_API_KEY=your-key
   ```
3. **Cost:** ~$0.001 per request

### SnapTrade (Fidelity Portfolio Sync)
1. Go to [snaptrade.com](https://snaptrade.com) → Sign up for API access
2. Add to `dashboard/.env.local`:
   ```
   SNAPTRADE_CLIENT_ID=your-client-id
   SNAPTRADE_CONSUMER_KEY=your-consumer-key
   ```

## 3. Google OAuth (Authentication)

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project or select existing
3. Go to **APIs & Services → Credentials → Create Credentials → OAuth client ID**
4. Application type: **Web application**
5. Add authorized redirect URI: `http://localhost:3001/api/auth/callback/google`
6. Copy the Client ID and Client Secret
7. Add to `dashboard/.env.local`:
   ```
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   NEXTAUTH_SECRET=generate-a-random-32-char-string
   NEXTAUTH_URL=http://localhost:3001
   ```

## 4. PC Setup (Validation Pipeline)

On your PC (RTX 4070 Ti Super):

```bash
cd "Finance project"
pip install -r requirements.txt

# Set API keys
export FINNHUB_API_KEY=your-key
export FMP_API_KEY=your-key
export PERPLEXITY_API_KEY=your-key  # optional

# Start Ollama
ollama serve
ollama pull llama3.1:8b

# Start the validation server
uvicorn validation_server:app --host 0.0.0.0 --port 8000
```

Add to `dashboard/.env.local`:
```
PC_VALIDATION_URL=http://your-pc-ip:8000
```

## 5. Tailscale (MacBook → PC Connection)

1. Install [Tailscale](https://tailscale.com) on both MacBook and PC
2. Sign in with the same account on both
3. Your PC gets a Tailscale IP (e.g., `100.x.y.z`)
4. Set `PC_VALIDATION_URL=http://100.x.y.z:8000` in `.env.local`

## 6. Running the Dashboard

```bash
cd "Finance project/dashboard"
npm install
npm run dev
```

Open [http://localhost:3001](http://localhost:3001)

## Security Checklist

- [ ] `.env.local` exists and is gitignored (check `.gitignore`)
- [ ] No API keys in committed files
- [ ] Supabase RLS enabled on all tables (already in schema)
- [ ] Google OAuth configured for authentication
- [ ] SnapTrade credentials are server-side only (no `NEXT_PUBLIC_` prefix)
- [ ] PC validation server is only accessible via Tailscale (not public internet)

## Complete `.env.local` Template

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# Market Data APIs
FMP_API_KEY=your-fmp-key
FINNHUB_API_KEY=your-finnhub-key

# AI (Optional)
PERPLEXITY_API_KEY=your-perplexity-key

# Fidelity Sync
SNAPTRADE_CLIENT_ID=your-snaptrade-client-id
SNAPTRADE_CONSUMER_KEY=your-snaptrade-consumer-key

# Authentication
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
NEXTAUTH_SECRET=random-32-character-string-here
NEXTAUTH_URL=http://localhost:3001

# PC Validation Server
PC_VALIDATION_URL=http://100.x.y.z:8000
```
