"use client";

import { useState, useEffect, useCallback } from "react";
import { Link2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface BrokerState {
  connected: boolean;
  accountName: string | null;
  lastSyncedAt: string | null;
  loading: boolean;
}

export function FidelityConnect() {
  const [state, setState] = useState<BrokerState>({
    connected: false,
    accountName: null,
    lastSyncedAt: null,
    loading: true,
  });
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const userId =
    typeof window !== "undefined"
      ? localStorage.getItem("qa_user_id") || "default-user"
      : "default-user";

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/fidelity/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      if (res.status === 404) {
        setState({ connected: false, accountName: null, lastSyncedAt: null, loading: false });
        return;
      }

      if (res.ok) {
        const data = await res.json();
        setState({
          connected: true,
          accountName: data.accountName || "Fidelity Account",
          lastSyncedAt: data.synced_at || null,
          loading: false,
        });
        return;
      }

      setState((prev) => ({ ...prev, loading: false }));
    } catch {
      setState((prev) => ({ ...prev, loading: false }));
    }
  }, [userId]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("connected") === "true") {
      setState((prev) => ({ ...prev, connected: true }));
      window.history.replaceState({}, "", window.location.pathname);
    }
    fetchStatus();
  }, [fetchStatus]);

  const handleConnect = async () => {
    setActionLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/fidelity/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Connection failed"); return; }
      if (data.redirectUrl) window.location.href = data.redirectUrl;
    } catch (err: any) {
      setError(err.message || "Failed to connect");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSync = async () => {
    setActionLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/fidelity/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Sync failed"); return; }
      setState((prev) => ({ ...prev, lastSyncedAt: data.synced_at }));
    } catch (err: any) {
      setError(err.message || "Sync failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm("Disconnect Fidelity? This will remove all synced holdings.")) return;
    setActionLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/fidelity/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Disconnect failed"); return; }
      setState({ connected: false, accountName: null, lastSyncedAt: null, loading: false });
    } catch (err: any) {
      setError(err.message || "Disconnect failed");
    } finally {
      setActionLoading(false);
    }
  };

  const formatSyncTime = (iso: string | null) => {
    if (!iso) return "Never";
    return new Date(iso).toLocaleString(undefined, {
      month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
    });
  };

  const ErrorBanner = () =>
    error ? (
      <div className="mb-3 rounded-lg px-3 py-2 text-xs text-loss" style={{ background: "rgba(248,113,113,0.08)" }}>
        {error}
      </div>
    ) : null;

  // Loading
  if (state.loading) {
    return (
      <div className="glass px-5 py-4">
        <div className="flex items-center gap-2 text-[13px] text-[#555]">
          <Loader2 size={14} className="animate-spin" />
          Checking Fidelity connection...
        </div>
      </div>
    );
  }

  // Connected
  if (state.connected) {
    return (
      <div className="glass px-5 py-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {/* Pulsing green dot */}
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gain opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-gain" />
            </span>
            <div>
              <div className="text-sm font-medium text-white">
                {state.accountName || "Fidelity Account"}
              </div>
              <div className="mt-0.5 text-[11px] text-[#868F97]">
                Last synced: {formatSyncTime(state.lastSyncedAt)}
              </div>
            </div>
          </div>
          <span className="text-[10px] font-medium uppercase tracking-wider text-gain">
            Connected
          </span>
        </div>

        <ErrorBanner />

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleSync}
            disabled={actionLoading}
            className={cn(
              "rounded-lg px-4 py-1.5 text-xs font-medium transition-colors",
              "bg-[rgba(71,159,250,0.12)] text-[#479FFA] hover:bg-[rgba(71,159,250,0.2)]",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
            style={{ border: "0.5px solid rgba(71,159,250,0.25)" }}
          >
            {actionLoading ? "Syncing..." : "Sync Now"}
          </button>
          <button
            onClick={handleDisconnect}
            disabled={actionLoading}
            className="px-2 py-1.5 text-[11px] text-[#555] transition-colors hover:text-loss disabled:cursor-not-allowed"
          >
            Disconnect
          </button>
        </div>
      </div>
    );
  }

  // Not Connected
  return (
    <div className="glass px-5 py-4">
      <ErrorBanner />

      <button
        onClick={handleConnect}
        disabled={actionLoading}
        className={cn(
          "flex w-full items-center gap-2.5 rounded-xl px-4 py-3 text-[13px] font-medium transition-all",
          "bg-[rgba(71,159,250,0.08)] text-[#479FFA] hover:bg-[rgba(71,159,250,0.14)]",
          "disabled:opacity-50 disabled:cursor-not-allowed"
        )}
        style={{ border: "0.5px solid rgba(71,159,250,0.2)" }}
      >
        <Link2 size={16} />
        <span>{actionLoading ? "Connecting..." : "Connect Fidelity Account"}</span>
        <span className="ml-auto text-[10px] font-normal text-[#868F97]">via SnapTrade</span>
      </button>

      <p className="mt-2.5 text-[11px] leading-relaxed text-[#555]">
        Securely connect your Fidelity brokerage to auto-sync holdings.
        Read-only access. You can disconnect at any time.
      </p>
    </div>
  );
}
