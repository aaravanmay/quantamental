"use client";

import { useRouter } from "next/navigation";
import { actionColor } from "@/lib/utils";
import type { ScanResult } from "@/lib/types";

export function ScanResultCard({ result }: { result: ScanResult }) {
  const router = useRouter();

  return (
    <div
      onClick={() => router.push(`/stock/${result.ticker}`)}
      className="glass glass-hover p-3 cursor-pointer"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-semibold text-white">
            {result.ticker}
          </span>
          <span
            className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${actionColor(
              result.action
            )}`}
          >
            {result.action}
          </span>
        </div>
        <span className="text-[11px] text-[#555]">
          Risk: {result.risk_level}
        </span>
      </div>

      <p className="mt-2 text-[12px] leading-snug text-[#868F97]">
        {result.reasoning}
      </p>

      <p className="mt-1.5 text-[11px] text-[#555]">
        <span className="font-medium">Trigger:</span> {result.trigger}
      </p>

      {/* Collapsible detail */}
      <details className="mt-2 group">
        <summary className="cursor-pointer text-[11px] text-[#555] hover:text-[#868F97] transition-colors">
          View full analysis
        </summary>
        <div className="mt-2 space-y-2">
          <pre className="whitespace-pre-wrap rounded bg-[rgba(255,255,255,0.02)] p-2 text-[10px] text-[#555] leading-relaxed">
            {result.events_assessment}
          </pre>
          <pre className="whitespace-pre-wrap rounded bg-[rgba(255,255,255,0.02)] p-2 text-[10px] text-[#555] leading-relaxed">
            {result.fundamentals_assessment}
          </pre>
        </div>
      </details>
    </div>
  );
}
