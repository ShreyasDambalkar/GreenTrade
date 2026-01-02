"use client";

import { useState } from "react";

export default function TokenPanel() {
  const [balance, setBalance] = useState("0");
  const [auditBalance, setAuditBalance] = useState("0");
  const [value, setValue] = useState("0");

  useState(() => {
    // Poll for updates every second to keep dashboard fresh
    const interval = setInterval(() => {
      const trades = JSON.parse(localStorage.getItem('userTrades') || '[]');

      let total = 0;
      let auditTotal = 0;

      trades.forEach((t: any) => {
        const qty = parseFloat(t.quantity || 0);
        if (t.side === 'buy') {
          total += qty;
          // Check if this came from the Audit system
          if (t.projectName && t.projectName.includes('Audit')) {
            auditTotal += qty;
          }
        } else if (t.side === 'sell') {
          total -= qty;
          if (t.projectName && t.projectName.includes('Audit')) {
            auditTotal -= qty;
          }
        }
      });

      setBalance(total.toLocaleString());
      setAuditBalance(auditTotal.toLocaleString());
      setValue((total * 15).toFixed(2)); // Dummy price $15/tonne
    }, 1000);

    return () => clearInterval(interval);
  });

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6">
      <h3 className="text-xl font-semibold text-zinc-100 mb-4">Token Portfolio</h3>
      <div className="space-y-4">

        {/* Total Holdings */}
        <div className="flex justify-between items-center">
          <span className="text-zinc-300">Total Carbon Credits</span>
          <span className="text-zinc-100 font-semibold">{balance} CCT</span>
        </div>

        {/* Audit Specific Holdings */}
        {parseFloat(auditBalance) > 0 && (
          <div className="flex justify-between items-center bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20">
            <span className="text-emerald-400 text-sm flex items-center gap-1">
              Verified by Audit
            </span>
            <span className="text-emerald-300 font-bold text-sm">{auditBalance} VCU</span>
          </div>
        )}

        <div className="flex justify-between items-center pt-2 border-t border-zinc-800">
          <span className="text-zinc-300">Est. Value</span>
          <span className="text-zinc-100 font-semibold">${value}</span>
        </div>

        <button className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-100 py-2 px-4 rounded transition-colors mt-2">
          View Detailed Portfolio
        </button>
      </div>
    </div>
  );
}
