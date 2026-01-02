"use client";

import { Users, Code, Activity, Globe } from 'lucide-react';
import React from 'react';

export default function Page() {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-green-500/30">
      <div className="max-w-6xl mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-green-400 to-emerald-600 bg-clip-text text-transparent mb-6">
            Meet the Team
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto mb-6">
            Meet the developer behind GreenTrade and explore the technical foundation of sustainable technology
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8 text-center hover:border-green-500/50 transition-colors">
            <div className="w-24 h-24 bg-zinc-800 rounded-full mx-auto mb-6 flex items-center justify-center">
              <Users className="w-10 h-10 text-green-500" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">GreenTrade Team</h3>
            <p className="text-green-400 mb-4">Core Contributors</p>
            <p className="text-zinc-500">
              A collective of open-source developers dedicated to fighting climate change through technology.
            </p>
          </div>

          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8 text-center hover:border-green-500/50 transition-colors">
            <div className="w-24 h-24 bg-zinc-800 rounded-full mx-auto mb-6 flex items-center justify-center">
              <Code className="w-10 h-10 text-blue-500" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Open Source</h3>
            <p className="text-blue-400 mb-4">Community Driven</p>
            <p className="text-zinc-500">
              Built on Next.js, Python, and Ethereum. Fully open for community contributions and improvements.
            </p>
          </div>

          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8 text-center hover:border-green-500/50 transition-colors">
            <div className="w-24 h-24 bg-zinc-800 rounded-full mx-auto mb-6 flex items-center justify-center">
              <Globe className="w-10 h-10 text-purple-500" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Global Impact</h3>
            <p className="text-purple-400 mb-4">Worldwide Reach</p>
            <p className="text-zinc-500">
              Connecting projects and investors across the globe to maximize environmental impact.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
