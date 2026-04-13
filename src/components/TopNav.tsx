"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/stock-finder", label: "Signals" },
  { href: "/proposals", label: "Proposals" },
  { href: "/stocks", label: "Stocks" },
  { href: "/watchlist", label: "Watchlist" },
  { href: "/earnings", label: "Earnings" },
  { href: "/paper-trading", label: "Trades" },
  { href: "/portfolio", label: "Portfolio" },
];

export function TopNav() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header
      className="sticky top-0 z-50"
      style={{
        background: "rgba(0,0,0,0.8)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div className="flex items-center justify-between px-4 sm:px-6 py-3">
        <div className="flex items-center gap-4 sm:gap-8">
          <Link href="/" className="text-[15px] font-semibold tracking-tight shrink-0">
            Quantamental
          </Link>
          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
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

        <div className="flex items-center gap-3">
          <span className="text-[11px] text-[#555] hidden lg:inline" title="Cmd+1 through Cmd+6 to navigate, Cmd+K to search">
            <kbd className="px-1 py-0.5 rounded bg-[rgba(255,255,255,0.06)] text-[10px]">&#8984;K</kbd> search
          </span>
          <Link
            href="/settings"
            className="text-[13px] text-[#868F97] hover:text-white transition-colors hidden sm:inline"
          >
            Settings
          </Link>
          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden text-[#868F97] hover:text-white transition-colors"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {mobileOpen && (
        <nav className="md:hidden border-t border-[rgba(255,255,255,0.06)] px-4 py-3 space-y-1"
          style={{ background: "rgba(0,0,0,0.95)" }}>
          {[...NAV, { href: "/settings", label: "Settings" }].map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`block rounded-lg px-3 py-2.5 text-[14px] transition-all ${
                  active
                    ? "bg-[rgba(71,159,250,0.08)] text-white"
                    : "text-[#868F97] hover:text-white hover:bg-[rgba(255,255,255,0.04)]"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      )}
    </header>
  );
}
