"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Crosshair, Target, LineChart, Briefcase, Settings } from "lucide-react";

const NAV = [
  { href: "/", label: "Screener", icon: Crosshair },
  { href: "/stock-finder", label: "Signals", icon: Target },
  { href: "/paper-trading", label: "Trades", icon: LineChart },
  { href: "/portfolio", label: "Portfolio", icon: Briefcase },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-[200px] flex-col bg-black" style={{ borderRight: "1px solid rgba(255,255,255,0.08)" }}>
      <div className="px-5 py-5">
        <span className="text-[15px] font-semibold tracking-tight">Quantamental</span>
      </div>

      <nav className="flex-1 px-3 space-y-0.5">
        {NAV.map((item) => {
          const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] transition-all ${
                active
                  ? "bg-[rgba(255,255,255,0.08)] text-white"
                  : "text-[#868F97] hover:bg-[rgba(255,255,255,0.04)] hover:text-white"
              }`}
            >
              <item.icon size={15} strokeWidth={1.5} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 pb-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <Link
          href="/settings"
          className="flex items-center gap-2.5 rounded-lg px-3 py-2 mt-2 text-[13px] text-[#868F97] hover:bg-[rgba(255,255,255,0.04)] hover:text-white transition-all"
        >
          <Settings size={15} strokeWidth={1.5} />
          Settings
        </Link>
      </div>
    </aside>
  );
}
