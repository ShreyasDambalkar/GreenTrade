import Link from "next/link";

export default function Footer() {
  return (
    <footer className="relative z-10 border-t border-emerald-900/20 bg-zinc-950 py-12 mt-20">
      <div className="mx-auto max-w-7xl px-4 flex flex-col md:flex-row items-center justify-between gap-6">

        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-white font-bold text-xl shadow-[0_0_15px_rgba(16,185,129,0.3)]">
            G
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400">
              GreenTrade
            </span>
            <span className="text-[10px] text-emerald-500 font-medium tracking-wider uppercase">
              Sustainable Future
            </span>
          </div>
        </div>

        {/* Project Info */}
        <div className="text-center md:text-right">
          <p className="text-sm text-zinc-500">
            Advanced Carbon Credit Trading Platform
          </p>
          <div className="mt-2 text-xs text-zinc-600">
            © {new Date().getFullYear()} GreenTrade Project. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}
