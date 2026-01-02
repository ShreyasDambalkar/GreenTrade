import Link from "next/link";
import React from "react";
import Reveal from "@/components/Reveal";

export default function HeroSection({ twClient, ConnectButton, CTA }: any) {
    return (
        <section className="relative z-10 mx-auto max-w-7xl px-4 pt-20 pb-24 md:pt-32 md:pb-40 flex flex-col items-center text-center">
            <Reveal>
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 backdrop-blur-md px-4 py-1.5 text-emerald-400 text-sm font-medium mb-8">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    Live Carbon Market v2.0
                </div>

                <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold tracking-tighter text-white mb-6">
                    The Future of <br className="hidden md:block" />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-emerald-400 to-cyan-400">
                        Carbon Trading
                    </span>
                </h1>

                <p className="text-zinc-400 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
                    GreenTrade combines <span className="text-white font-medium">AI-driven insights</span> with <span className="text-white font-medium">blockchain transparency</span> to revolutionize how the world trades and offsets carbon credits.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <CTA
                        href="/dashboard"
                        label="Start Trading"
                        onClick={(e: React.MouseEvent) => {
                            e.preventDefault();
                            window.dispatchEvent(new CustomEvent('open-mega-menu'));
                        }}
                    />
                    <CTA href="#how-it-works" label="Learn More" variant="secondary" />
                </div>
            </Reveal>

            {/* Floating Abstract Visuals replacing the iframe for a cleaner look */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 w-[800px] h-[800px] opacity-30 pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/20 to-cyan-500/20 rounded-full blur-[100px] animate-pulse" />
            </div>
        </section>
    );
}
