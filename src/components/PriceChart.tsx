"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";

// Cache the chart library import so it's instant after first load
let chartLibPromise: Promise<typeof import("lightweight-charts")> | null = null;
function getChartLib() {
  if (!chartLibPromise) {
    chartLibPromise = import("lightweight-charts");
  }
  return chartLibPromise;
}

// Preload chart library on module load
if (typeof window !== "undefined") {
  getChartLib();
}

export function PriceChart({ ticker }: { ticker: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const candleSeriesRef = useRef<any>(null);
  const dataRef = useRef<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Initialize chart + load data
  useEffect(() => {
    let cancelled = false;

    async function init() {
      if (!containerRef.current) return;
      setLoading(true);
      setError(false);

      try {
        // Load chart library (cached after first import) + fetch data in parallel
        const [chartLib, historyRes] = await Promise.all([
          getChartLib(),
          fetch(`/api/stock/${ticker}/history`),
        ]);

        if (cancelled || !containerRef.current) return;

        const { createChart, ColorType } = chartLib;

        // Clean up previous chart
        if (chartRef.current) {
          try { chartRef.current.remove(); } catch {}
          chartRef.current = null;
        }

        // Wait for container to have dimensions
        const container = containerRef.current;
        if (container.clientWidth === 0) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
        if (cancelled || !containerRef.current) return;

        const chart = createChart(container, {
          autoSize: true,
          layout: {
            background: { type: ColorType.Solid, color: "transparent" },
            textColor: "#868F97",
            fontFamily: "ui-monospace, monospace",
            fontSize: 11,
          },
          grid: {
            vertLines: { color: "rgba(255,255,255,0.03)" },
            horzLines: { color: "rgba(255,255,255,0.03)" },
          },
          crosshair: {
            mode: 0,
            vertLine: {
              color: "rgba(71,159,250,0.3)",
              labelBackgroundColor: "rgba(71,159,250,0.9)",
            },
            horzLine: {
              color: "rgba(71,159,250,0.3)",
              labelBackgroundColor: "rgba(71,159,250,0.9)",
            },
          },
          rightPriceScale: {
            borderColor: "rgba(255,255,255,0.06)",
          },
          timeScale: {
            borderColor: "rgba(255,255,255,0.06)",
            timeVisible: false,
            minBarSpacing: 0.5,
          },
          handleScroll: true,
          handleScale: true,
        });

        chartRef.current = chart;

        const candleSeries = chart.addCandlestickSeries({
          upColor: "#4EBE96",
          downColor: "#f87171",
          borderDownColor: "#f87171",
          borderUpColor: "#4EBE96",
          wickDownColor: "#f87171",
          wickUpColor: "#4EBE96",
        });

        candleSeriesRef.current = candleSeries;

        if (historyRes.ok) {
          const data = await historyRes.json();
          if (data.length > 0) {
            dataRef.current = data;
            candleSeries.setData(data);
            chart.timeScale().fitContent();
          } else {
            setError(true);
          }
        } else {
          setError(true);
        }

        setLoading(false);
      } catch (err) {
        console.error("Failed to load chart:", err);
        if (!cancelled) {
          setError(true);
          setLoading(false);
        }
      }
    }

    init();

    return () => {
      cancelled = true;
      if (chartRef.current) {
        try { chartRef.current.remove(); } catch {}
        chartRef.current = null;
      }
    };
  }, [ticker]);

  // Recover chart when tab becomes visible again (handles zoom/tab-switch)
  useEffect(() => {
    function handleVisibility() {
      if (document.visibilityState === "visible" && chartRef.current) {
        // Force chart to recalculate its size
        try {
          chartRef.current.timeScale().fitContent();
        } catch {}
      }
    }

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("focus", handleVisibility);
    window.addEventListener("resize", () => {
      if (chartRef.current) {
        try { chartRef.current.timeScale().fitContent(); } catch {}
      }
    });

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", handleVisibility);
    };
  }, []);

  // Live price polling — update the last candle every 15s
  useEffect(() => {
    async function pollPrice() {
      try {
        const res = await fetch(`/api/stock/${ticker}/quote`);
        if (!res.ok) return;
        const q = await res.json();
        if (!q.price || !candleSeriesRef.current) return;

        const now = new Date();
        const dateStr = now.toISOString().split("T")[0];

        candleSeriesRef.current.update({
          time: dateStr,
          open: q.open || q.price,
          high: Math.max(q.high || q.price, q.price),
          low: Math.min(q.low || q.price, q.price),
          close: q.price,
        });
      } catch {}
    }

    const interval = setInterval(pollPrice, 15_000);
    pollPrice();

    return () => clearInterval(interval);
  }, [ticker]);

  return (
    <div className="relative">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center z-10" style={{ height: 380 }}>
          <div className="flex flex-col items-center gap-2">
            <Loader2 size={20} className="animate-spin text-[#555]" />
            <span className="text-[12px] text-[#555]">Loading chart...</span>
          </div>
        </div>
      )}

      {error && !loading && (
        <div className="absolute inset-0 flex items-center justify-center z-10" style={{ height: 380 }}>
          <p className="text-[13px] text-[#868F97]">
            No chart data available for {ticker}
          </p>
        </div>
      )}

      <div
        ref={containerRef}
        className="w-full rounded-lg"
        style={{ height: 380, opacity: loading ? 0.3 : 1, transition: "opacity 0.3s" }}
      />
      <div className="flex items-center justify-between mt-1.5">
        <p className="text-[10px] text-[#555]">
          Daily candles &middot; 1 year
        </p>
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <p className="text-[10px] text-[#555]">
            Live — updates every 15s
          </p>
        </div>
      </div>
    </div>
  );
}
