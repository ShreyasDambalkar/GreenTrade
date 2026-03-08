"use client";

import dynamic from "next/dynamic";
import Reveal from "@/components/Reveal";

const EmissionTracker = dynamic(() => import("@/components/EmissionTracker"), { ssr: false });

export default function TrackingPage() {
  return (
      <main className="max-w-7xl mx-auto pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="mb-12">
            <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-emerald-400 via-emerald-200 to-white bg-clip-text text-transparent mb-4">
              Real-time Ingestion & <br />Baseline Tracking
            </h1>
            <p className="text-zinc-400 text-lg max-w-2xl">
              Compliance-ready dashboard for monitoring Scope 1, 2, and 3 emissions through IoT connectivity and public dataset integration.
            </p>
          </div>
        </Reveal>

        <section className="space-y-12">
          {/* Emission Tracker Component contains the charts, IoT feeds, and Manual entry */}
          <EmissionTracker />
        </section>
      </main>
  );
}
