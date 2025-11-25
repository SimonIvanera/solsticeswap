"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { WalletButton } from "./WalletButton";

export function Navigation() {
  const pathname = usePathname();

  const navLinks = [
    { href: "/swap", label: "Swap" },
    { href: "/orders", label: "Orders" },
    { href: "/match", label: "Match" },
    { href: "/analytics", label: "Analytics" },
    { href: "/test", label: "Test" },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-white/95 backdrop-blur-md shadow-sm" suppressHydrationWarning>
      <div className="container mx-auto px-4 md:px-8 h-16 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/30 via-secondary/30 to-accent/30 blur-2xl group-hover:opacity-50 transition-opacity rounded-full"></div>
            <span className="relative text-xl md:text-2xl font-bold text-foreground drop-shadow-sm">
              SolsticeSwap
            </span>
          </div>
        </Link>
        <div className="flex items-center gap-1 md:gap-2">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-all ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-foreground/70 hover:text-foreground hover:bg-surface/80"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          <div className="ml-2 pl-2 border-l border-border/50">
            <WalletButton />
          </div>
        </div>
      </div>
    </nav>
  );
}


