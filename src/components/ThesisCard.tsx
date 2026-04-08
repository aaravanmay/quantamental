"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface ThesisProps {
  thesis: {
    recommendation: string;
    signal: string;
    thesis: string;
    risk: string;
    confidence: string;
    monitoring: string;
    events_assessment: string;
    fundamentals_assessment: string;
    created_at?: string;
  };
}

export function ThesisCard({ thesis }: ThesisProps) {
  const [showDetails, setShowDetails] = useState(false);

  const isGo =
    thesis.recommendation.toUpperCase().includes("GO") &&
    !thesis.recommendation.toUpperCase().includes("NO");

  return (
    <div className="space-y-4">
      {/* Recommendation Header */}
      <div
        className="flex items-center justify-between rounded-xl p-3"
        style={
          isGo
            ? {
                background: "rgba(78,190,150,0.08)",
                border: "1px solid rgba(78,190,150,0.2)",
              }
            : {
                background: "rgba(248,113,113,0.08)",
                border: "1px solid rgba(248,113,113,0.2)",
              }
        }
      >
        <div>
          <span
            className={cn(
              "text-xl font-bold",
              isGo ? "text-[#4EBE96]" : "text-[#f87171]"
            )}
          >
            {thesis.recommendation}
          </span>
          <span className="ml-3 text-[10px] uppercase tracking-wider text-[#555]">
            Confidence: {thesis.confidence}
          </span>
        </div>
        {thesis.created_at && (
          <span className="text-[10px] text-[#555]">
            {new Date(thesis.created_at).toLocaleString()}
          </span>
        )}
      </div>

      {/* Thesis Fields */}
      <div className="space-y-3">
        <ThesisField label="Signal" value={thesis.signal} />
        <ThesisField label="Thesis" value={thesis.thesis} />
        <ThesisField label="Risk" value={thesis.risk} color="text-[#f87171]" />
        <ThesisField label="Monitoring" value={thesis.monitoring} />
      </div>

      {/* Detailed Assessments */}
      <div>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-[12px] text-[#555] hover:text-[#868F97] transition-colors"
        >
          {showDetails ? "Hide" : "View"} detailed assessments
        </button>

        {showDetails && (
          <div className="mt-3 space-y-4">
            <div>
              <h4 className="mb-1 text-[10px] uppercase tracking-wider font-medium text-[#868F97]">
                Events Assessment
              </h4>
              <pre className="whitespace-pre-wrap bg-[rgba(255,255,255,0.02)] text-[11px] text-[#868F97] p-3 rounded">
                {thesis.events_assessment}
              </pre>
            </div>
            <div>
              <h4 className="mb-1 text-[10px] uppercase tracking-wider font-medium text-[#868F97]">
                Fundamentals Assessment
              </h4>
              <pre className="whitespace-pre-wrap bg-[rgba(255,255,255,0.02)] text-[11px] text-[#868F97] p-3 rounded">
                {thesis.fundamentals_assessment}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ThesisField({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div>
      <span className="text-[10px] uppercase tracking-wider text-[#868F97]">
        {label}
      </span>
      <p className={cn("mt-0.5 text-[13px] leading-snug text-white", color)}>
        {value || "\u2014"}
      </p>
    </div>
  );
}
