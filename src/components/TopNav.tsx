"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/", label: "Screener" },
  { href: "/stocks", label: "Stocks" },
  { href: "/stock-finder", label: "Signals" },
  { href: "/paper-trading", label: "Trades" },
  { href: "/portfolio", label: "Portfolio" },
];

export function TopNav() {
  const pathname = usePathname();

  return (
    <header
      className="sticky top-0 z-50 flex items-center justify-between px-6 py-3"
      style={{
        background: "rgba(0,0,0,0.8)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div className="flex items-center gap-8">
        <Link href="/" className="text-[15px] font-semibold tracking-tight">
          Quantamental
        </Link>
        <nav className="flex items-center gap-1">
          {NAV.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-lg px-3 py-1.5 text-[13px] transition-all ${
                  active
                    ? "bg-[rgba(71,159,250,0.08)] text-white"
                    : "text-[#868F97] hover:text-white"
                }`}
                style={active ? { boxShadow: "0 0 12px 2px rgba(71,159,250,0.12)" } : undefined}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="flex items-center gap-4">
        <span className="text-[11px] text-[#555] hidden md:inline" title="Cmd+1 through Cmd+6 to navigate, Cmd+K to search">
          <kbd className="px-1 py-0.5 rounded bg-[rgba(255,255,255,0.06)] text-[10px]">&#8984;K</kbd> search
        </span>
        <Link
          href="/settings"
          className="text-[13px] text-[#868F97] hover:text-white transition-colors"
        >
          Settings
        </Link>
      </div>
    </header>
  );
}
