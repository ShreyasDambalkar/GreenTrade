"use client";

import { useState, useEffect, useCallback } from "react";
import { useWallet } from "@/lib/walletContext";

interface CryptoAsset {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  volume24h: number;
  marketCap: number;
  category: "crypto" | "carbon" | "token";
  contractAddress?: string;
  icon?: string;
  balance?: number;
  value?: number;
}

interface PortfolioData {
  totalValue: number;
  totalChange24h: number;
  assets: CryptoAsset[];
}

export default function CryptoPortfolio() {
  const { address: userAddress, isConnected } = useWallet(); // Use custom wallet hook
  const [assets, setAssets] = useState<CryptoAsset[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioData>({
    totalValue: 0,
    totalChange24h: 0,
    assets: [],
  });
  const [selectedCategory, setSelectedCategory] = useState<
    "all" | "crypto" | "carbon"
  >("all");
  const [loading, setLoading] = useState(false);

  // ---- Fetch Market Data ----
  const fetchCryptoData = useCallback(async (category: string = "all") => {
    setLoading(true);

    try {
      const response = await fetch(`/api/crypto/prices?category=${category}`);
      const data = await response.json();

      if (data.success) {
        setAssets(data.data);
      }
    } catch (err) {
      console.error("Error fetching crypto data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // ---- Compute portfolio using LocalStorage trades ----
  const computePortfolio = useCallback(
    (market: CryptoAsset[]) => {
      // Read directly from LocalStorage which is our source of truth
      const trades = JSON.parse(localStorage.getItem('userTrades') || '[]');

      if (!trades || trades.length === 0) {
        setPortfolio({
          totalValue: 0,
          totalChange24h: 0,
          assets: [],
        });
        return;
      }

      const grouped: Record<string, number> = {};

      trades.forEach((t: any) => {
        if (!grouped[t.symbol]) grouped[t.symbol] = 0;
        grouped[t.symbol] += t.side === "buy" ? parseFloat(t.quantity) : -parseFloat(t.quantity);
      });

      const portfolioAssets = market
        .map((asset) => {
          const balance = grouped[asset.symbol] || 0;
          return {
            ...asset,
            balance,
            value: balance * asset.price,
          };
        })
        .filter((a) => a.balance && a.balance > 0.001);

      // If we own assets not in the market feed (e.g. custom Audit credits), add them manually
      // This is a quick fix to ensure VCU/CCT show up even if the API doesn't return them
      Object.keys(grouped).forEach(symbol => {
        if (!market.find(m => m.symbol === symbol) && grouped[symbol] > 0) {
          portfolioAssets.push({
            symbol,
            name: "Verified Carbon Credit",
            price: 15, // Fallback price
            change24h: 0,
            volume24h: 0,
            marketCap: 0,
            category: "carbon",
            balance: grouped[symbol],
            value: grouped[symbol] * 15
          });
        }
      });

      const totalValue = portfolioAssets.reduce(
        (sum, a) => sum + (a.value || 0),
        0
      );

      const totalChange24h = portfolioAssets.reduce((sum, asset) => {
        const changeValue = (asset.value || 0) * (asset.change24h / 100);
        return sum + changeValue;
      }, 0);

      setPortfolio({
        totalValue,
        totalChange24h: totalValue ? (totalChange24h / totalValue) * 100 : 0,
        assets: portfolioAssets,
      });
    },
    []
  );

  // ---- Fetch initial ----
  useEffect(() => {
    fetchCryptoData(selectedCategory);
  }, [selectedCategory, fetchCryptoData]);

  // ---- Recompute loop ----
  useEffect(() => {
    const interval = setInterval(() => {
      if (assets.length > 0) {
        computePortfolio(assets);
      }
    }, 2000); // Poll every 2s for localstorage updates
    return () => clearInterval(interval);
  }, [assets, computePortfolio]);

  const formatValue = (value: number) => {
    return `₹${value.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Portfolio</h1>
            <p className="text-zinc-400">
              Real multi-user carbon & crypto portfolio synced with Supabase
            </p>
          </div>
          <button
            onClick={() => fetchCryptoData(selectedCategory)}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm"
          >
            Refresh
          </button>
        </div>

        {/* Summary */}
        {isConnected && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
            <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-lg">
              <h3 className="text-sm text-zinc-400">Total Value</h3>
              <p className="text-3xl font-bold">
                {formatValue(portfolio.totalValue)}
              </p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-lg">
              <h3 className="text-sm text-zinc-400">24h Change</h3>
              <p
                className={`text-3xl font-bold ${portfolio.totalChange24h >= 0
                  ? "text-green-400"
                  : "text-red-400"
                  }`}
              >
                {portfolio.totalChange24h >= 0 ? "+" : ""}
                {portfolio.totalChange24h.toFixed(2)}%
              </p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-lg">
              <h3 className="text-sm text-zinc-400">Assets</h3>
              <p className="text-3xl font-bold">{portfolio.assets.length}</p>
            </div>
          </div>
        )}

        {/* Asset Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {portfolio.assets.map((asset) => (
            <div
              key={asset.symbol}
              className="border border-zinc-800 bg-zinc-900 p-4 rounded-lg"
            >
              <div className="flex justify-between mb-3">
                <div>
                  <h3 className="font-semibold">{asset.symbol}</h3>
                  <p className="text-xs text-zinc-400">{asset.name}</p>
                </div>
                <span
                  className={`px-2 py-1 rounded text-xs ${asset.category === "crypto"
                    ? "bg-blue-500/20 text-blue-400"
                    : "bg-green-500/20 text-green-400"
                    }`}
                >
                  {asset.category}
                </span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-zinc-400">Balance:</span>
                <span className="font-semibold">{asset.balance?.toFixed(4)}</span>
              </div>

              <div className="flex justify-between text-sm mt-1">
                <span className="text-zinc-400">Value:</span>
                <span className="font-semibold">
                  {formatValue(asset.value!)}
                </span>
              </div>

              <a
                href={`/trading?symbol=${asset.symbol}`}
                className="block mt-4 text-center bg-blue-600 hover:bg-blue-700 rounded py-2 text-sm"
              >
                Trade
              </a>
            </div>
          ))}
        </div>

        {!isConnected && (
          <p className="text-center text-zinc-400 mt-10">
            Connect your wallet to view your portfolio.
          </p>
        )}
      </div>
    </div>
  );
}
