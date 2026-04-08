"use client";

import { useEffect, useRef } from "react";

// TradingView Lightweight Charts — loaded dynamically on client
export function PriceChart({ ticker }: { ticker: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let chart: any;

    async function init() {
      if (!containerRef.current) return;

      try {
        const { createChart, ColorType } = await import("lightweight-charts");

        chart = createChart(containerRef.current, {
          width: containerRef.current.clientWidth,
          height: 360,
          layout: {
            background: { type: ColorType.Solid, color: "#000" },
            textColor: "#868F97",
          },
          grid: {
            vertLines: { color: "rgba(255,255,255,0.04)" },
            horzLines: { color: "rgba(255,255,255,0.04)" },
          },
          crosshair: {
            mode: 0,
          },
          rightPriceScale: {
            borderColor: "rgba(255,255,255,0.08)",
          },
          timeScale: {
            borderColor: "rgba(255,255,255,0.08)",
            timeVisible: true,
          },
        });

        const candleSeries = chart.addCandlestickSeries({
          upColor: "#4EBE96",
          downColor: "#f87171",
          borderDownColor: "#f87171",
          borderUpColor: "#4EBE96",
          wickDownColor: "#f87171",
          wickUpColor: "#4EBE96",
        });

        // Fetch historical data from our API
        try {
          const res = await fetch(`/api/stock/${ticker}/history`);
          if (res.ok) {
            const data = await res.json();
            candleSeries.setData(data);
            chart.timeScale().fitContent();
          }
        } catch {
          // Show empty chart if no data
        }

        // Handle resize
        const observer = new ResizeObserver(() => {
          if (containerRef.current) {
            chart.applyOptions({
              width: containerRef.current.clientWidth,
            });
          }
        });
        observer.observe(containerRef.current);

        return () => observer.disconnect();
      } catch (err) {
        console.error("Failed to load chart:", err);
      }
    }

    init();

    return () => {
      if (chart) chart.remove();
    };
  }, [ticker]);

  return (
    <div>
      <div ref={containerRef} className="w-full rounded-lg" />
      <p className="text-[10px] text-[#555] mt-1">
        Data may be delayed up to 15 minutes
      </p>
    </div>
  );
}
