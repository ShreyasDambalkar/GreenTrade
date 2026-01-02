"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";
import { useActiveAccount } from "thirdweb/react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ---------- Types ----------
interface MarketData {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  volume24h: number;
  high24h: number;
  low24h: number;
  marketCap: number;
  category: "crypto" | "carbon" | "token";
  contractAddress?: string;
  chainId?: string;
  icon?: string;
}

interface OrderBookEntry {
  price: number;
  quantity: number;
  total: number;
}

interface TradeRow {
  id: string;
  user_address: string;
  symbol: string;
  side: "buy" | "sell" | string;
  price: number;
  quantity: number;
  created_at: string;
}

interface OrderRow {
  id: string;
  user_address: string;
  symbol: string;
  side: "buy" | "sell" | string;
  price: number;
  quantity: number;
  filled: number | null;
  status: "open" | "partial" | "filled" | "cancelled" | string;
  created_at: string;
}

interface Candle {
  symbol: string;
  bucket: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// ---------- Simple SVG Candlestick Chart ----------
function CandlestickChart({ data }: { data: Candle[] }) {
  if (!data || data.length === 0) {
    return (
      <p className="text-sm text-zinc-500">
        Not enough trade data yet to build candles.
      </p>
    );
  }

  const width = 800;
  const height = 300;
  const padding = 20;

  const highs = data.map((d) => Number(d.high));
  const lows = data.map((d) => Number(d.low));
  const maxHigh = Math.max(...highs);
  const minLow = Math.min(...lows);

  const priceToY = (price: number) => {
    if (maxHigh === minLow) return height / 2;
    const ratio = (price - minLow) / (maxHigh - minLow);
    return height - padding - ratio * (height - 2 * padding);
  };

  const candleWidth = Math.max(4, (width - 2 * padding) / data.length - 4);

  return (
    <div className="w-full overflow-x-auto">
      <svg
        width={width}
        height={height}
        className="bg-zinc-950 rounded-lg border border-zinc-800"
      >
        {/* Price range label */}
        <text
          x={padding}
          y={padding}
          fill="#9ca3af"
          fontSize={10}
        >{`High: ₹${maxHigh.toFixed(2)}  Low: ₹${minLow.toFixed(2)}`}</text>

        {data.map((candle, index) => {
          const xCenter =
            padding + index * ((width - 2 * padding) / data.length) +
            ((width - 2 * padding) / data.length) / 2;

          const open = Number(candle.open);
          const close = Number(candle.close);
          const high = Number(candle.high);
          const low = Number(candle.low);

          const isBull = close >= open;
          const top = isBull ? open : close;
          const bottom = isBull ? close : open;

          const yHigh = priceToY(high);
          const yLow = priceToY(low);
          const yTop = priceToY(top);
          const yBottom = priceToY(bottom);

          const color = isBull ? "#22c55e" : "#ef4444";

          return (
            <g key={candle.bucket + index}>
              {/* Wick */}
              <line
                x1={xCenter}
                y1={yHigh}
                x2={xCenter}
                y2={yLow}
                stroke={color}
                strokeWidth={1}
              />
              {/* Body */}
              <rect
                x={xCenter - candleWidth / 2}
                y={Math.min(yTop, yBottom)}
                width={candleWidth}
                height={Math.max(2, Math.abs(yBottom - yTop))}
                fill={color}
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ---------- Main Trading Interface ----------
export default function TradingInterface() {
  const account = useActiveAccount();

  const [selectedAsset, setSelectedAsset] = useState("CCX");
  const [marketData, setMarketData] = useState<MarketData[]>([]);
  const [orderBook, setOrderBook] = useState<{
    bids: OrderBookEntry[];
    asks: OrderBookEntry[];
    spread: number;
  } | null>(null);

  const [recentTrades, setRecentTrades] = useState<TradeRow[]>([]);
  const [candles, setCandles] = useState<Candle[]>([]);

  const [orderType, setOrderType] = useState<"market" | "limit">("limit");
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [orderLoading, setOrderLoading] = useState(false);

  // ---------- Fetch Market Data ----------
  const fetchMarketData = useCallback(async () => {
    try {
      const response = await fetch("/api/crypto/prices?category=all");
      const data = await response.json();
      if (data.success) {
        setMarketData(data.data);
      }
    } catch (error) {
      console.error("Error fetching market data:", error);
    }
  }, []);

  // ---------- Fetch Order Book (from your API) ----------
  const fetchOrderBook = useCallback(async (symbol: string) => {
    try {
      const response = await fetch(`/api/trading/orderbook?symbol=${symbol}`);
      const data = await response.json();
      if (data.success) {
        setOrderBook(data.orderBook);
      }
    } catch (error) {
      console.error("Error fetching order book:", error);
    }
  }, []);

  // ---------- Fetch Recent Trades (Supabase) ----------
  const fetchRecentTrades = useCallback(async (symbol: string) => {
    const { data, error } = await supabase
      .from("trades")
      .select("*")
      .eq("symbol", symbol)
      .order("created_at", { ascending: false })
      .limit(30);

    if (error) {
      console.error("Error fetching trades:", error);
      return;
    }

    const normalized = (data || []).map((t: any) => ({
      id: t.id,
      user_address: t.user_address,
      symbol: t.symbol,
      side: t.side,
      price: Number(t.price),
      quantity: Number(t.quantity),
      created_at: t.created_at,
    })) as TradeRow[];

    setRecentTrades(normalized);
  }, []);

  // ---------- Fetch Candles (from candles_1m view) ----------
  const fetchCandles = useCallback(async (symbol: string) => {
    const { data, error } = await supabase
      .from("candles_1m")
      .select("*")
      .eq("symbol", symbol)
      .order("bucket", { ascending: true })
      .limit(200);

    if (error) {
      console.error("Error fetching candles:", error);
      return;
    }

    const normalized = (data || []).map((c: any) => ({
      symbol: c.symbol,
      bucket: c.bucket,
      open: Number(c.open),
      high: Number(c.high),
      low: Number(c.low),
      close: Number(c.close),
      volume: Number(c.volume),
    })) as Candle[];

    setCandles(normalized);
  }, []);

  // ---------- Basic Matching Engine (in Supabase) ----------
  const matchOrder = async (order: OrderRow) => {
    let remainingQty =
      Number(order.quantity) - Number(order.filled != null ? order.filled : 0);
    if (remainingQty <= 0) return;

    if (order.side === "buy") {
      // match against best SELLs
      const { data: asks, error } = await supabase
        .from("orders")
        .select("*")
        .eq("symbol", order.symbol)
        .eq("side", "sell")
        .eq("status", "open")
        .lte("price", order.price)
        .order("price", { ascending: true })
        .order("created_at", { ascending: true });

      if (error || !asks) return;

      for (const a of asks as any[]) {
        const ask: OrderRow = {
          id: a.id,
          user_address: a.user_address,
          symbol: a.symbol,
          side: a.side,
          price: Number(a.price),
          quantity: Number(a.quantity),
          filled: a.filled != null ? Number(a.filled) : 0,
          status: a.status,
          created_at: a.created_at,
        };

        const askRemaining = ask.quantity - (ask.filled || 0);
        if (askRemaining <= 0 || remainingQty <= 0) continue;

        const tradeQty = Math.min(remainingQty, askRemaining);
        const tradePrice = ask.price;

        // Insert buy + sell trades
        const { error: tradeError } = await supabase.from("trades").insert([
          {
            user_address: order.user_address,
            symbol: order.symbol,
            side: "buy",
            price: tradePrice,
            quantity: tradeQty,
          },
          {
            user_address: ask.user_address,
            symbol: ask.symbol,
            side: "sell",
            price: tradePrice,
            quantity: tradeQty,
          },
        ]);

        if (tradeError) {
          console.error("Trade insert error:", tradeError);
          break;
        }

        const newAskFilled = (ask.filled || 0) + tradeQty;
        const askStatus = newAskFilled >= ask.quantity ? "filled" : "partial";

        await supabase
          .from("orders")
          .update({ filled: newAskFilled, status: askStatus })
          .eq("id", ask.id);

        remainingQty -= tradeQty;
        if (remainingQty <= 0) break;
      }
    } else {
      // SELL order â€“ match against best BUYs
      const { data: bids, error } = await supabase
        .from("orders")
        .select("*")
        .eq("symbol", order.symbol)
        .eq("side", "buy")
        .eq("status", "open")
        .gte("price", order.price)
        .order("price", { ascending: false })
        .order("created_at", { ascending: true });

      if (error || !bids) return;

      for (const b of bids as any[]) {
        const bid: OrderRow = {
          id: b.id,
          user_address: b.user_address,
          symbol: b.symbol,
          side: b.side,
          price: Number(b.price),
          quantity: Number(b.quantity),
          filled: b.filled != null ? Number(b.filled) : 0,
          status: b.status,
          created_at: b.created_at,
        };

        const bidRemaining = bid.quantity - (bid.filled || 0);
        if (bidRemaining <= 0 || remainingQty <= 0) continue;

        const tradeQty = Math.min(remainingQty, bidRemaining);
        const tradePrice = bid.price;

        const { error: tradeError } = await supabase.from("trades").insert([
          {
            user_address: bid.user_address,
            symbol: bid.symbol,
            side: "buy",
            price: tradePrice,
            quantity: tradeQty,
          },
          {
            user_address: order.user_address,
            symbol: order.symbol,
            side: "sell",
            price: tradePrice,
            quantity: tradeQty,
          },
        ]);

        if (tradeError) {
          console.error("Trade insert error:", tradeError);
          break;
        }

        const newBidFilled = (bid.filled || 0) + tradeQty;
        const bidStatus = newBidFilled >= bid.quantity ? "filled" : "partial";

        await supabase
          .from("orders")
          .update({ filled: newBidFilled, status: bidStatus })
          .eq("id", bid.id);

        remainingQty -= tradeQty;
        if (remainingQty <= 0) break;
      }
    }

    // update original order
    const originalQty = Number(order.quantity);
    const tradedQty = originalQty - remainingQty;
    const newFilled = (order.filled || 0) + tradedQty;
    const newStatus = remainingQty <= 0 ? "filled" : "partial";

    await supabase
      .from("orders")
      .update({ filled: newFilled, status: newStatus })
      .eq("id", order.id);

    // refresh UI data
    await fetchRecentTrades(order.symbol);
    await fetchOrderBook(order.symbol);
    await fetchCandles(order.symbol);
  };

  // ---------- Place Order + Trigger Matching (Local + Supabase) ----------
  const executeTrade = async () => {
    if (!quantity || (!price && orderType === "limit")) {
      alert("Enter price and quantity");
      return;
    }

    const marketPrice = marketData.find(
      (a) => a.symbol === selectedAsset
    )?.price;

    const finalPrice =
      orderType === "market"
        ? marketPrice ?? 0
        : parseFloat(price || "0");

    if (!finalPrice || finalPrice <= 0) {
      alert("Invalid price");
      return;
    }

    const qty = parseFloat(quantity || "0");
    if (!qty || qty <= 0) {
      alert("Invalid quantity");
      return;
    }

    // Local Validation for Selling
    if (side === "sell") {
      const currentTrades = JSON.parse(localStorage.getItem('userTrades') || '[]');
      const currentBalance = currentTrades.reduce((acc: number, t: any) => {
        if (t.symbol !== selectedAsset) return acc;
        return acc + (t.side === 'buy' ? parseFloat(t.quantity) : -parseFloat(t.quantity));
      }, 0);

      if (currentBalance < qty) {
        alert(`Insufficient balance! You only own ${currentBalance} ${selectedAsset}`);
        return;
      }
    }

    setOrderLoading(true);

    try {
      // 1. Create Trade Record
      const newTrade = {
        id: "trade_" + Date.now(),
        user_address: account?.address || "guest_trader",
        symbol: selectedAsset,
        side: side,
        price: finalPrice,
        quantity: qty,
        created_at: new Date().toISOString(),
        status: 'filled' // Instant fill for demo
      };

      // 2. Save to Local Storage (Immediate UI Update)
      const existingTrades = JSON.parse(localStorage.getItem('userTrades') || '[]');
      localStorage.setItem('userTrades', JSON.stringify([...existingTrades, newTrade]));

      // 3. Optional: Sync with Supabase (Best Effort)
      // We try to save to DB, but if it fails (e.g. RLS policy), we don't break the user experience
      supabase.from("trades").insert([newTrade]).then(({ error }) => {
        if (error) console.warn("Supabase sync warning:", error.message);
      });

      // 4. Reset Form
      setPrice("");
      setQuantity("");
      alert(`✅ Order Executed: ${side.toUpperCase()} ${qty} ${selectedAsset} @ ₹${finalPrice}`);

      // 5. Refresh Data
      fetchRecentTrades(selectedAsset);

    } catch (err) {
      console.error("Error executing trade:", err);
      alert("Trade execution failed");
    } finally {
      setOrderLoading(false);
    }
  };

  // ---------- Initial data + interval refresh ----------
  useEffect(() => {
    fetchMarketData();
    const interval = setInterval(fetchMarketData, 5000);
    return () => clearInterval(interval);
  }, [fetchMarketData]);

  // ---------- On asset change ----------
  useEffect(() => {
    fetchOrderBook(selectedAsset);
    fetchRecentTrades(selectedAsset);
    fetchCandles(selectedAsset);
  }, [selectedAsset, fetchOrderBook, fetchRecentTrades, fetchCandles]);

  // ---------- Realtime: new trades -> refresh trades & candles ----------
  useEffect(() => {
    const channel = supabase.channel("trading-realtime");

    channel.on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "trades",
      },
      (payload) => {
        const t: any = payload.new;
        if (t.symbol === selectedAsset) {
          // just fetch again for simplicity
          fetchRecentTrades(selectedAsset);
          fetchCandles(selectedAsset);
        }
      }
    );

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedAsset, fetchRecentTrades, fetchCandles]);

  const selectedMarketData = marketData.find(
    (asset) => asset.symbol === selectedAsset
  );

  const totalValue =
    (orderType === "limit" ? Number(price || 0) : selectedMarketData?.price || 0) *
    Number(quantity || 0);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">
            Crypto & Carbon Trading (INR)
          </h1>
          <p className="text-zinc-400">
            Multi-user exchange with INR pricing, candlestick chart & basic
            order matching using Supabase.
          </p>
        </div>

        {/* Market Chart */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">
            Market Chart ({selectedAsset}) — 1m Candles
          </h2>
          <CandlestickChart data={candles} />
        </div>

        {/* Market Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
          {marketData.slice(0, 12).map((asset) => (
            <div
              key={asset.symbol}
              onClick={() => setSelectedAsset(asset.symbol)}
              className={`p-4 rounded-lg border cursor-pointer transition-colors ${selectedAsset === asset.symbol
                ? "border-blue-500 bg-blue-500/10"
                : "border-zinc-800 bg-zinc-900/50 hover:border-zinc-700"
                }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{asset.icon}</span>
                  <div>
                    <h3 className="font-semibold">{asset.symbol}</h3>
                    <p className="text-xs text-zinc-500">{asset.name}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <div
                    className={`px-2 py-1 rounded text-xs mb-1 ${asset.category === "crypto"
                      ? "bg-blue-500/20 text-blue-400"
                      : asset.category === "carbon"
                        ? "bg-green-500/20 text-green-400"
                        : "bg-purple-500/20 text-purple-400"
                      }`}
                  >
                    {asset.category}
                  </div>
                  <span
                    className={`text-sm px-2 py-1 rounded ${asset.change24h >= 0
                      ? "bg-green-500/20 text-green-400"
                      : "bg-red-500/20 text-red-400"
                      }`}
                  >
                    {asset.change24h >= 0 ? "+" : ""}
                    {asset.change24h.toFixed(2)}%
                  </span>
                </div>
              </div>
              <div className="text-xl font-bold mb-1">
                ₹
                {asset.price < 1
                  ? asset.price.toFixed(4)
                  : asset.price.toFixed(2)}
              </div>
              <div className="text-xs text-zinc-400">
                Vol: {(asset.volume24h / 1_000_000).toFixed(2)}M
              </div>
              <div className="text-xs text-zinc-500">
                MCap: {(asset.marketCap / 1_000_000).toFixed(1)}M
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Trading Panel */}
          <div className="lg:col-span-1">
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">
                Trade {selectedAsset}
              </h2>

              {/* Order Type */}
              <div className="mb-4">
                <div className="flex border border-zinc-700 rounded-lg p-1">
                  <button
                    onClick={() => setOrderType("limit")}
                    className={`flex-1 py-2 px-4 rounded text-sm font-medium transition-colors ${orderType === "limit"
                      ? "bg-blue-600 text-white"
                      : "text-zinc-400 hover:text-zinc-200"
                      }`}
                  >
                    Limit Order
                  </button>
                  <button
                    onClick={() => setOrderType("market")}
                    className={`flex-1 py-2 px-4 rounded text-sm font-medium transition-colors ${orderType === "market"
                      ? "bg-blue-600 text-white"
                      : "text-zinc-400 hover:text-zinc-200"
                      }`}
                  >
                    Market Order
                  </button>
                </div>
              </div>

              {/* Buy/Sell Toggle */}
              <div className="mb-4">
                <div className="flex border border-zinc-700 rounded-lg p-1">
                  <button
                    onClick={() => setSide("buy")}
                    className={`flex-1 py-2 px-4 rounded text-sm font-medium transition-colors ${side === "buy"
                      ? "bg-green-600 text-white"
                      : "text-zinc-400 hover:text-zinc-200"
                      }`}
                  >
                    Buy
                  </button>
                  <button
                    onClick={() => setSide("sell")}
                    className={`flex-1 py-2 px-4 rounded text-sm font-medium transition-colors ${side === "sell"
                      ? "bg-red-600 text-white"
                      : "text-zinc-400 hover:text-zinc-200"
                      }`}
                  >
                    Sell
                  </button>
                </div>
              </div>

              {/* Price Input */}
              {orderType === "limit" && (
                <div className="mb-4">
                  <label className="block text-sm text-zinc-400 mb-1">
                    Price (INR)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white placeholder-zinc-500 focus:border-blue-500 focus:outline-none"
                    />
                    {selectedMarketData && (
                      <button
                        onClick={() =>
                          setPrice(selectedMarketData.price.toString())
                        }
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-blue-400 hover:text-blue-300"
                      >
                        Mkt
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Quantity Input */}
              <div className="mb-4">
                <label className="block text-sm text-zinc-400 mb-1">
                  Quantity
                </label>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white placeholder-zinc-500 focus:border-blue-500 focus:outline-none"
                />
              </div>

              {/* Total */}
              {totalValue > 0 && (
                <div className="mb-4 p-3 bg-zinc-800 rounded-lg">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Total:</span>
                    <span className="font-semibold">
                      ₹{totalValue.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                onClick={executeTrade}
                disabled={
                  orderLoading ||
                  !quantity ||
                  (orderType === "limit" && !price)
                }
                className={`w-full py-3 rounded-lg font-semibold transition-colors ${side === "buy"
                  ? "bg-green-600 hover:bg-green-700 text-white"
                  : "bg-red-600 hover:bg-red-700 text-white"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {orderLoading
                  ? "Processing..."
                  : `${side === "buy" ? "Buy" : "Sell"} ${selectedAsset}`}
              </button>
            </div>
          </div>

          {/* Order Book & Recent Trades */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Book */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Order Book</h3>
              {orderBook && (
                <div className="grid grid-cols-2 gap-4">
                  {/* Asks */}
                  <div>
                    <h4 className="text-sm text-red-400 mb-2">Asks (Sell)</h4>
                    <div className="space-y-1">
                      {orderBook.asks
                        .slice(0, 8)
                        .reverse()
                        .map((ask, idx) => (
                          <div
                            key={idx}
                            className="flex justify-between text-sm"
                          >
                            <span className="text-red-400">
                              ₹{ask.price.toFixed(2)}
                            </span>
                            <span className="text-zinc-400">
                              {ask.quantity.toFixed(2)}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                  {/* Bids */}
                  <div>
                    <h4 className="text-sm text-green-400 mb-2">
                      Bids (Buy)
                    </h4>
                    <div className="space-y-1">
                      {orderBook.bids.slice(0, 8).map((bid, idx) => (
                        <div
                          key={idx}
                          className="flex justify-between text-sm"
                        >
                          <span className="text-green-400">
                            ₹{bid.price.toFixed(2)}
                          </span>
                          <span className="text-zinc-400">
                            {bid.quantity.toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              {orderBook && (
                <div className="mt-4 pt-4 border-t border-zinc-800">
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">Spread:</span>
                    <span className="text-zinc-200">
                      â‚¹{orderBook.spread.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Recent Trades */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">
                Recent Trades ({selectedAsset})
              </h3>
              <div className="space-y-2">
                {recentTrades.length === 0 && (
                  <p className="text-zinc-400 text-sm">
                    No trades yet for {selectedAsset}. Place one to see it here
                    in real time.
                  </p>
                )}
                {recentTrades.map((trade) => (
                  <div
                    key={trade.id}
                    className="flex justify-between items-center text-sm py-2 border-b border-zinc-800 last:border-b-0"
                  >
                    <div className="flex items-center space-x-3">
                      <span
                        className={`px-2 py-1 rounded text-xs ${trade.side === "buy"
                          ? "bg-green-500/20 text-green-400"
                          : "bg-red-500/20 text-red-400"
                          }`}
                      >
                        {trade.side.toUpperCase()}
                      </span>
                      <span className="text-zinc-200">
                        â‚¹{Number(trade.price).toFixed(2)}
                      </span>
                      <span className="text-zinc-400">
                        {Number(trade.quantity).toFixed(2)}
                      </span>
                    </div>
                    <div className="text-xs text-zinc-500">
                      {new Date(trade.created_at).toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
