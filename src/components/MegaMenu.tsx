"use client";

import Link from "next/link";
import { useEffect } from "react";

interface MegaMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MegaMenu({ isOpen, onClose }: MegaMenuProps) {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };

    // Only close on page scroll, not on menu scroll
    const onPageScroll = (e: Event) => {
      // Only respond to scroll events on the main window, not within the menu
      if (e.target === document || e.target === document.body) {
        onClose();
      }
    };

    window.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onPageScroll, { passive: true });
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onPageScroll);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[60]">
      {/* Backdrop */}
      <button aria-label="Close menu" onClick={onClose} className="absolute inset-0 bg-black/50" />

      {/* Panel */}
      <div onClick={(e) => e.stopPropagation()} className="absolute left-1/2 -translate-x-1/2 top-4 md:top-8 w-[96%] md:w-[95%] max-w-6xl rounded-3xl border border-zinc-800 bg-zinc-900 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Top bar with brand and close */}
        <div className="flex items-center justify-between px-4 md:px-6 py-3">
          <div className="flex items-center gap-6">
            <Link prefetch={false} href="/" className="font-semibold text-zinc-100">Gen Carbon</Link>
            <nav className="hidden md:flex items-center gap-4 text-sm text-zinc-300">
              <span className="font-medium">Menu ▾</span>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="h-9 w-9 inline-flex items-center justify-center rounded-full bg-zinc-800 text-white">✕</button>
          </div>
        </div>

        {/* Content grid */}
        <div className="p-4 md:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            <FeatureTile title="Marketplace" text="Browse verified carbon credits" color="from-orange-500 to-red-500" href="/marketplace" badge="HOT" onClick={onClose} />
            <FeatureTile title="Trading" text="Trade carbon credits" color="from-indigo-500 to-blue-600" href="/trading" badge="NEW" onClick={onClose} />
            <FeatureTile title="Portfolio" text="Track crypto assets" color="from-violet-500 to-purple-600" href="/portfolio" badge="NEW" onClick={onClose} />
            <FeatureTile title="Toucan Protocol" text="Real blockchain carbon credits" color="from-emerald-500 to-emerald-600" href="/toucan-demo" badge="NEW" onClick={onClose} />
            <FeatureTile title="AI Calculator" text="AI powered carbon credits" color="from-green-500 to-emerald-600" href="/ai-calculator" badge="AI" onClick={onClose} />
            <FeatureTile title="Event Planner" text="Plan sustainable events" color="from-emerald-500 to-green-600" href="/event-planner" badge="NEW" onClick={onClose} />
            <FeatureTile title="Audit System" text="Verify carbon projects" color="from-blue-500 to-cyan-600" href="/audit" badge="NEW" onClick={onClose} />
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureTile({ title, text, color, href, badge, onClick }: { title: string; text: string; color: string; href: string; badge?: string; onClick?: () => void }) {
  return (
    <Link prefetch={false} href={href} onClick={onClick} className={`group relative overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-gradient-to-br ${color} text-white p-5 min-h-[140px] flex items-end`}>
      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_30%_20%,white,transparent_40%)]" />
      <div className="relative">
        <div className="text-2xl font-bold drop-shadow-sm">{title}</div>
        <div className="text-sm opacity-90">{text}</div>
      </div>
      {badge && (
        <span className="absolute top-3 right-3 text-[10px] px-2 py-1 rounded-full bg-white/90 text-zinc-800">{badge}</span>
      )}
    </Link>
  );
}
