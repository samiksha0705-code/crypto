
"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Clock3,
  Database,
  RefreshCw,
  ShieldCheck,
  TriangleAlert,
  Waves,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Risk = {
  score: number | null;
  level: string;
  deviation_bps?: number;
  signals: string[];
};

type Asset = {
  id: string;
  name: string;
  symbol: string;
  price_usd: number | null;
  market_cap_usd: number | null;
  volume_24h_usd: number | null;
  change_24h_pct: number | null;
  last_updated: string | null;
  risk: Risk;
};

type ApiResponse = {
  observed_at: string;
  count: number;
  assets: Asset[];
  model_version: string;
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

const money = (value: number | null | undefined) =>
  value == null
    ? "—"
    : value >= 1000000000
      ? `$${(value / 1000000000).toFixed(2)}B`
      : value >= 1000000
        ? `$${(value / 1000000).toFixed(1)}M`
        : `$${value.toLocaleString("en-US", {
            maximumFractionDigits: 4,
          })}`;

const price = (value: number | null) =>
  value == null
    ? "Unavailable"
    : `$${value.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 6,
      })}`;

const deviation = (value: number | null) =>
  value == null ? null : (value - 1) * 10000;

function riskStyle(level: string) {
  const normalized = level.toLowerCase();

  if (normalized === "high")
    return "bg-[#f7e3dc] text-[#a9432d]";

  if (normalized === "moderate")
    return "bg-[#f4ecd5] text-[#8a6a24]";

  if (normalized === "low")
    return "bg-[#e0e9df] text-[#42674c]";

  return "bg-[#e9e5dc] text-[#716d64]";
}

export default function Home() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [lastFetch, setLastFetch] = useState<Date | null>(null);

  const loadData = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true);

    try {
      const response = await fetch(`${API_URL}/api/v1/stablecoins`, {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`Backend returned HTTP ${response.status}`);
      }

      const result: ApiResponse = await response.json();
      setData(result);
      setLastFetch(new Date());
      setError("");
    } catch {
      setError(
        "Market data is unavailable. Check that FastAPI is running on port 8000."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
    const timer = window.setInterval(() => void loadData(), 30000);
    return () => window.clearInterval(timer);
  }, [loadData]);

  const assets = data?.assets ?? [];
  const highRisk = assets.filter(
    (asset) => asset.risk.level.toLowerCase() === "high"
  ).length;

  const chartData = assets
    .filter((asset) => asset.price_usd != null)
    .map((asset) => ({
      name: asset.symbol,
      deviation: Number(deviation(asset.price_usd)!.toFixed(2)),
    }));

  const signals = assets.flatMap((asset) =>
    asset.risk.signals.map((signal, index) => ({
      key: `${asset.id}-${index}`,
      symbol: asset.symbol,
      name: asset.name,
      signal,
      level: asset.risk.level,
    }))
  );

  return (
    <main className="min-h-screen bg-[#f4f1e9] text-[#202b24]">
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <aside className="hidden w-[225px] shrink-0 flex-col border-r border-[#ded9ce] px-6 py-8 lg:flex">
          <a href="#" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center bg-[#243c30] text-[#f4f1e9]">
              <ShieldCheck size={22} strokeWidth={1.7} />
            </div>
            <div>
              <div className="text-[15px] font-bold tracking-[0.13em]">
                PEGGUARD
              </div>
              <div className="mt-1 text-[9px] tracking-[0.18em] text-[#79796d]">
                THE OBSERVATORY
              </div>
            </div>
          </a>

          <div className="mt-14 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8d8b7f]">
            Research desk
          </div>

          <div className="mt-4 flex items-center gap-3 border-l-2 border-[#b75c40] bg-[#e9e5da] px-3 py-3 text-sm font-medium">
            <Activity size={17} />
            Market overview
          </div>

          <div className="mt-2 flex items-center gap-3 px-3 py-3 text-sm text-[#77796e]">
            <Waves size={17} />
            Peg monitor
          </div>

          <div className="mt-2 flex items-center gap-3 px-3 py-3 text-sm text-[#77796e]">
            <TriangleAlert size={17} />
            Signal journal
          </div>

          <div className="mt-auto border-t border-[#ded9ce] pt-5">
            <div className="flex items-center gap-2 text-xs text-[#74766c]">
              <span className="h-2 w-2 rounded-full bg-[#618369]" />
              API connection
            </div>
            <div className="mt-2 text-sm font-medium">
              {error ? "Disconnected" : loading ? "Connecting..." : "Monitoring"}
            </div>
            <div className="mt-1 break-all text-[10px] text-[#8b897e]">
              localhost:8000
            </div>
          </div>
        </aside>

        <section className="min-w-0 flex-1 px-5 py-6 sm:px-8 lg:px-10 lg:py-9">
          <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[#dcd7cb] pb-5">
            <div className="flex items-center gap-3 lg:hidden">
              <ShieldCheck size={25} />
              <span className="text-sm font-bold tracking-[0.15em]">
                PEGGUARD
              </span>
            </div>

            <div className="hidden text-[11px] uppercase tracking-[0.16em] text-[#77796e] lg:block">
              Independent stablecoin research
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-[11px] text-[#687467]">
                <span
                  className={`h-2 w-2 rounded-full ${
                    error ? "bg-[#b75c40]" : "bg-[#618369]"
                  }`}
                />
                {error ? "Connection issue" : loading ? "Connecting" : "Feed connected"}
              </div>

              <button
                onClick={() => void loadData(true)}
                disabled={refreshing}
                className="flex items-center gap-2 border border-[#d6d1c5] px-3 py-2 text-xs transition hover:bg-[#e9e5da] disabled:opacity-50"
              >
                <RefreshCw
                  size={13}
                  className={refreshing ? "animate-spin" : ""}
                />
                Refresh
              </button>
            </div>
          </header>

          <div className="py-9 sm:py-12">
            <div className="text-[10px] font-semibold uppercase tracking-[0.23em] text-[#b15a3e]">
              The stablecoin observatory / 001
            </div>

            <div className="mt-4 grid gap-6 xl:grid-cols-[1fr_230px] xl:items-end">
              <div>
                <h1 className="max-w-[760px] font-serif text-[43px] leading-[1.06] tracking-[-0.045em] sm:text-6xl lg:text-[72px]">
                  Trust, measured
                  <br />
                  in basis points.
                </h1>
                <p className="mt-5 max-w-xl text-sm leading-7 text-[#77786e] sm:text-base">
                  Reading the small market signals that can precede a break.
                  Three dollar-pegged assets. One question: how firmly do they
                  hold the line?
                </p>
              </div>

              <div className="border-l border-[#d8d2c6] pl-5">
                <div className="text-[10px] uppercase tracking-[0.17em] text-[#89877b]">
                  Latest observation
                </div>
                <div className="mt-2 text-sm font-medium">
                  {lastFetch
                    ? lastFetch.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })
                    : "Awaiting data"}
                </div>
                <div className="mt-1 text-xs text-[#89877b]">
                  Auto-refresh · 30 seconds
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-6 flex items-start gap-3 border border-[#dfb7a8] bg-[#f7e3dc] p-4 text-sm text-[#873f2c]">
              <TriangleAlert size={18} className="mt-0.5 shrink-0" />
              <div>
                <div className="font-semibold">Market feed unavailable</div>
                <div className="mt-1">{error}</div>
                <button
                  className="mt-2 underline underline-offset-2"
                  onClick={() => void loadData(true)}
                >
                  Try again
                </button>
              </div>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-3">
            <Metric
              label="Assets under watch"
              value={loading ? "—" : String(assets.length).padStart(2, "0")}
              note="Stablecoin market coverage"
            />
            <Metric
              label="High-risk readings"
              value={loading ? "—" : String(highRisk).padStart(2, "0")}
              note="From current price-based model"
              accent={highRisk > 0}
            />
            <Metric
              label="Observation status"
              value={error ? "Offline" : loading ? "Loading" : "Live feed"}
              note={
                data?.model_version
                  ? `Scoring: ${data.model_version}`
                  : "Waiting for first response"
              }
            />
          </div>

          <div className="mt-8 grid gap-6 xl:grid-cols-[1.45fr_0.85fr]">
            <section className="border border-[#ded9ce] bg-[#f8f6f0] p-5 sm:p-7">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.18em] text-[#89877b]">
                    Figure 01 / Current deviation
                  </div>
                  <h2 className="mt-2 font-serif text-2xl">
                    Distance from the peg
                  </h2>
                </div>
                <div className="border border-[#ded9ce] px-3 py-2 text-[10px] text-[#74766c]">
                  USD target = $1.00
                </div>
              </div>

              <p className="mt-3 max-w-lg text-xs leading-5 text-[#858478]">
                Current price distance in basis points. Positive values mean
                above $1; negative values mean below $1. This is a snapshot,
                not a historical time series.
              </p>

              <div className="mt-6 h-[250px] w-full">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={chartData}
                      margin={{ top: 12, right: 8, left: -18, bottom: 0 }}
                    >
                      <CartesianGrid
                        stroke="#e4dfd4"
                        strokeDasharray="3 5"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="name"
                        tick={{ fill: "#696c61", fontSize: 12 }}
                        axisLine={{ stroke: "#d8d2c6" }}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fill: "#89877b", fontSize: 10 }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(value: number) => `${value}`}
                      />
                      <ReferenceLine
                        y={0}
                        stroke="#77796e"
                        strokeDasharray="4 4"
                      />
                      <Tooltip
                        cursor={{ fill: "#eae6dc", opacity: 0.6 }}
                        contentStyle={{
                          background: "#f8f6f0",
                          border: "1px solid #d8d2c6",
                          borderRadius: 0,
                          fontSize: 12,
                        }}
                        formatter={(value) => [
                          `${Number(value).toFixed(2)} bps`,
                          "Deviation",
                        ]}
                      />
                      <Bar dataKey="deviation" maxBarSize={54} radius={[2, 2, 0, 0]}>
                        {chartData.map((entry) => (
                          <Cell
                            key={entry.name}
                            fill={
                              Math.abs(entry.deviation) >= 50
                                ? "#b75c40"
                                : "#55735e"
                            }
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-[#89877b]">
                    {loading ? "Fetching market observations..." : "No price observations available."}
                  </div>
                )}
              </div>

              <div className="mt-3 flex items-center gap-2 border-t border-[#e4dfd4] pt-4 text-[11px] text-[#89877b]">
                <Clock3 size={13} />
                Values update when the market API is refreshed.
              </div>
            </section>

            <section className="border border-[#ded9ce] bg-[#eae6dc] p-5 sm:p-7">
              <div className="text-[10px] uppercase tracking-[0.18em] text-[#89877b]">
                Field notes / 002
              </div>
              <h2 className="mt-2 font-serif text-2xl">Signals in view</h2>
              <p className="mt-3 text-xs leading-5 text-[#77786e]">
                Observations produced by the current price-based risk engine.
                Liquidity and on-chain signals will be added separately.
              </p>

              <div className="mt-5 space-y-0">
                {loading ? (
                  <div className="py-5 text-sm text-[#89877b]">
                    Reading market signals...
                  </div>
                ) : signals.length === 0 ? (
                  <div className="border-t border-[#d6d0c4] py-5 text-sm text-[#77786e]">
                    No signals returned by the current model.
                  </div>
                ) : (
                  signals.slice(0, 6).map((item) => (
                    <div
                      key={item.key}
                      className="border-t border-[#d6d0c4] py-4"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold tracking-wide">
                          {item.symbol}
                        </span>
                        <span
                          className={`px-2 py-1 text-[9px] uppercase tracking-wider ${riskStyle(item.level)}`}
                        >
                          {item.level}
                        </span>
                      </div>
                      <p className="mt-2 text-sm leading-5">{item.signal}</p>
                      <div className="mt-1 text-[10px] text-[#89877b]">
                        {item.name} · Price-based assessment
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-2 border-t border-[#d6d0c4] pt-4 text-[10px] leading-5 text-[#89877b]">
                These are model signals, not confirmed causes of market stress.
              </div>
            </section>
          </div>

          <section className="mt-8">
            <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[#dcd7cb] pb-4">
              <div>
                <div className="text-[10px] uppercase tracking-[0.18em] text-[#89877b]">
                  Market ledger / 003
                </div>
                <h2 className="mt-2 font-serif text-3xl">The dollar watch</h2>
              </div>
              <div className="flex items-center gap-2 text-xs text-[#77796e]">
                <Database size={14} />
                CoinGecko market feed
              </div>
            </div>

            <div className="mt-2 overflow-x-auto">
              <table className="w-full min-w-[650px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-[#dcd7cb] text-[10px] uppercase tracking-[0.14em] text-[#89877b]">
                    <th className="py-4 pr-4 font-medium">Asset</th>
                    <th className="px-4 py-4 font-medium">Market price</th>
                    <th className="px-4 py-4 font-medium">Peg distance</th>
                    <th className="px-4 py-4 font-medium">24h change</th>
                    <th className="px-4 py-4 font-medium">Volume / 24h</th>
                    <th className="px-4 py-4 font-medium">Risk reading</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && assets.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-sm text-[#89877b]">
                        Gathering market observations...
                      </td>
                    </tr>
                  ) : assets.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-sm text-[#89877b]">
                        No market data available. Check the API connection.
                      </td>
                    </tr>
                  ) : (
                    assets.map((asset) => {
                      const bps = deviation(asset.price_usd);
                      const change = asset.change_24h_pct;

                      return (
                        <tr
                          key={asset.id}
                          className="border-b border-[#e2ddd2] transition hover:bg-[#ece8de]"
                        >
                          <td className="py-5 pr-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center border border-[#d7d2c6] font-serif text-base">
                                {asset.symbol.slice(0, 1)}
                              </div>
                              <div>
                                <div className="text-sm font-semibold">
                                  {asset.symbol}
                                </div>
                                <div className="mt-1 text-[11px] text-[#89877b]">
                                  {asset.name}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-5 font-mono text-sm">
                            {price(asset.price_usd)}
                          </td>
                          <td className="px-4 py-5">
                            <div className="flex items-center gap-1 font-mono text-sm">
                              {bps == null ? (
                                "—"
                              ) : bps > 0 ? (
                                <ArrowUpRight size={13} className="text-[#b75c40]" />
                              ) : bps < 0 ? (
                                <ArrowDownRight size={13} className="text-[#55735e]" />
                              ) : null}
                              {bps == null
                                ? "—"
                                : `${bps > 0 ? "+" : ""}${bps.toFixed(2)} bps`}
                            </div>
                          </td>
                          <td className="px-4 py-5">
                            <span
                              className={`font-mono text-xs ${
                                change == null
                                  ? "text-[#89877b]"
                                  : change < 0
                                    ? "text-[#b75c40]"
                                    : "text-[#55735e]"
                              }`}
                            >
                              {change == null
                                ? "—"
                                : `${change > 0 ? "+" : ""}${change.toFixed(3)}%`}
                            </span>
                          </td>
                          <td className="px-4 py-5 font-mono text-xs text-[#686b60]">
                            {money(asset.volume_24h_usd)}
                          </td>
                          <td className="px-4 py-5">
                            <div className="flex items-center gap-2">
                              <span
                                className={`inline-block h-2 w-2 rounded-full ${
                                  asset.risk.level.toLowerCase() === "high"
                                    ? "bg-[#b75c40]"
                                    : asset.risk.level.toLowerCase() === "moderate"
                                      ? "bg-[#b49a4e]"
                                      : asset.risk.level.toLowerCase() === "low"
                                        ? "bg-[#618369]"
                                        : "bg-[#89877b]"
                                }`}
                              />
                              <span className="text-xs">
                                {asset.risk.level}
                                {asset.risk.score != null
                                  ? ` · ${asset.risk.score}/100`
                                  : ""}
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <footer className="mt-12 flex flex-wrap items-center justify-between gap-3 border-t border-[#dcd7cb] py-5 text-[10px] leading-5 text-[#89877b]">
            <span>PEGGUARD OBSERVATORY · AN INDEPENDENT MONITORING PROJECT</span>
            <span>
              {data
                ? `Observation: ${new Date(data.observed_at).toLocaleString()}`
                : "Awaiting first observation"}
            </span>
          </footer>
        </section>
      </div>
    </main>
  );
}

function Metric({
  label,
  value,
  note,
  accent = false,
}: {
  label: string;
  value: string;
  note: string;
  accent?: boolean;
}) {
  return (
    <div className="border border-[#ded9ce] bg-[#f8f6f0] px-5 py-5 sm:px-6">
      <div className="text-[10px] uppercase tracking-[0.16em] text-[#89877b]">
        {label}
      </div>
      <div
        className={`mt-3 font-serif text-3xl ${
          accent ? "text-[#b75c40]" : "text-[#202b24]"
        }`}
      >
        {value}
      </div>
      <div className="mt-2 text-[11px] text-[#89877b]">{note}</div>
    </div>
  );
}
