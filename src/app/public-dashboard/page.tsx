import EmissionTracker from "@/components/EmissionTracker";
import NavBar from "@/components/NavBar";

export default function PublicDashboardPage() {
  return (
    <main className="min-h-screen bg-[#020617] text-white">
      <NavBar />
      
      <div className="max-w-7xl mx-auto pt-24 pb-20">
        <div className="px-6 mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold mb-4">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Public Access Enabled
          </div>
          <h1 className="text-4xl md:text-6xl font-black mb-4 bg-gradient-to-r from-white via-white to-slate-500 bg-clip-text text-transparent">
            Transparency Protocol
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl leading-relaxed">
            GreenTrade's open-source emission monitoring system. 
            Immutable data, verified on-chain, and accessible to everyone.
          </p>
        </div>

        <EmissionTracker />

        {/* Accountability Section */}
        <div className="mt-20 px-6 grid grid-cols-1 md:grid-cols-3 gap-12 border-t border-white/5 pt-20">
          <div className="space-y-4">
            <h3 className="text-xl font-bold">Real-time Verification</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Our sensors and industrial API integrations provide sub-second updates. 
              Each data point is timestamped and cryptographically signed before being processed.
            </p>
          </div>
          <div className="space-y-4">
            <h3 className="text-xl font-bold">AI Consistency Checks</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              We use the GreenTrade AI Engine to cross-reference reported data with 
              satellite imagery and historical benchmarks to ensure 85%+ accuracy in audits.
            </p>
          </div>
          <div className="space-y-4">
            <h3 className="text-xl font-bold">Public Accountability</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              By making this data public, we empower communities to hold entities accountable. 
              The blockchain ensures that no data can be deleted or altered once recorded.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
