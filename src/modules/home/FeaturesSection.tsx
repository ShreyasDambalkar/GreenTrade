
import React from 'react';
import Reveal from "@/components/Reveal";
import { IconSpark, IconBrain, IconChart, IconShield, IconBlock, IconWallet } from "./HomeIcons";

export default function FeaturesSection() {
    return (
        <section id="features" className="relative z-10 mx-auto max-w-7xl px-4 py-12 md:py-16">
            <Reveal className="text-center mb-10">
                <h2 className="text-3xl md:text-5xl font-bold text-zinc-900 dark:text-zinc-100">Built for a climate positive economy</h2>
                <p className="text-zinc-600 dark:text-zinc-400 mt-3">High-utility features that make carbon markets usable and trustworthy.</p>
            </Reveal>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <FeatureCard title="Real-time Trading" desc="Buy and sell carbon credits with live liquidity and best execution." icon={
                    <IconSpark />
                } />
                <FeatureCard title="AI Footprint" desc="Quantify and offset your carbon impact with AI-guided tooling." icon={<IconBrain />} />
                <FeatureCard title="Price Prediction" desc="ML models forecast credit prices for smarter entries and exits." icon={<IconChart />} />
                <FeatureCard title="Fraud Detection" desc="Anomaly detection flags suspicious credits and behaviors." icon={<IconShield />} />
                <FeatureCard title="On-chain Proof" desc="Transparent, verifiable ownership and retirements on-chain." icon={<IconBlock />} />
                <FeatureCard title="Portfolio Tools" desc="Track PnL, holdings, and retirement progress instantly." icon={<IconWallet />} />
            </div>
        </section>
    );
}

function FeatureCard({
    title,
    desc,
    icon,
}: {
    title: string;
    desc: string;
    icon: React.ReactNode;
}) {
    return (
        <div className="group relative overflow-hidden rounded-2xl p-[1px] bg-gradient-to-br from-indigo-200 via-fuchsia-200 to-pink-100 transition-all duration-300 hover:scale-[1.02] hover:-translate-y-2 hover:shadow-[0_20px_40px_-12px_rgba(99,102,241,0.4)] cursor-pointer">
            <div className="relative rounded-2xl bg-white border border-zinc-200 p-6 dark:bg-zinc-900 dark:border-zinc-800 transition-all duration-300 group-hover:border-indigo-400 dark:group-hover:border-indigo-500">
                <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-emerald-300/20 blur-2xl transition-opacity duration-300 group-hover:bg-emerald-300/30" />


                <div className="mb-3 text-indigo-600 dark:text-indigo-300 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
                    {icon}
                </div>


                <h3 className="text-xl font-semibold mb-1 text-zinc-900 dark:text-zinc-100 transition-colors duration-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                    {title}
                </h3>

                <p className="text-zinc-700 dark:text-zinc-300 text-sm">{desc}</p>


                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-fuchsia-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl pointer-events-none" />
            </div>
        </div>
    );
}
