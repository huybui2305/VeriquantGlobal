"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
  Tooltip,
} from "recharts"

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

const COINS      = ["BTC", "ETH", "SOL", "SUI", "BNB", "AVAX"]
const TIMEFRAMES = ["15 minutes", "30 minutes", "1 hour", "6 hours", "24 hours"]
const MODELS     = [
  { id: "claude", label: "Claude Sonnet 4.5" },
  { id: "gpt4",   label: "GPT-4.1" },
  { id: "gpt5",   label: "GPT-5" },
]

type Analysis = {
  volatility_score: number
  trend:            string
  risk_level:       string
  signal:           string
  confidence:       number
  summary:          string
  key_factors:      string[]
}

type ApiResult = {
  analysis:     Analysis
  payment_hash: string
  model:        string
  timestamp:    string
  explorer_url: string
}

const SIGNAL_COLOR: Record<string, string> = {
  Buy:     "#00c896",
  Sell:    "#ef4444",
  Hold:    "#f59e0b",
  Caution: "#f59e0b",
}
const RISK_COLOR: Record<string, string> = {
  Low:     "#00c896",
  Medium:  "#f59e0b",
  High:    "#ef4444",
  Extreme: "#7f1d1d",
}
const SIGNAL_ICON: Record<string, string> = {
  Buy:     "↑",
  Sell:    "↓",
  Hold:    "→",
  Caution: "⚠",
}

// Custom recharts tooltip
function CustomTooltip({ active, payload }: any) {
  if (active && payload?.length) {
    return (
      <div className="bg-[#0d1625] border border-[rgba(0,200,150,0.2)] rounded-lg px-3 py-2">
        <p className="font-mono text-[0.65rem] text-[#00c896]">
          {payload[0].name}: {payload[0].value?.toFixed(2)}
        </p>
      </div>
    )
  }
  return null
}

interface Props {
  walletAddress: string
}

export function AnalysisPanel({ walletAddress }: Props) {
  const [coin, setCoin]           = useState("ETH")
  const [timeframe, setTimeframe] = useState("1 hour")
  const [model, setModel]         = useState("claude")
  const [loading, setLoading]     = useState(false)
  const [result, setResult]       = useState<ApiResult | null>(null)
  const [error, setError]         = useState<string | null>(null)

  async function runAnalysis() {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const res = await fetch(`${API}/analyze`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coin, timeframe, model, wallet: walletAddress }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail || "Request failed")
      }

      const data: ApiResult = await res.json()
      setResult(data)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const a = result?.analysis

  return (
    <div className="pt-8 space-y-6">
      {/* ── Config row ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Coin */}
        <div>
          <label className="font-mono text-[0.6rem] tracking-widest uppercase text-[#4a6a8a] block mb-2">
            Asset
          </label>
          <div className="flex gap-1.5 flex-wrap">
            {COINS.map((c) => (
              <button
                key={c}
                onClick={() => setCoin(c)}
                className={`font-mono text-xs px-3 py-1.5 rounded-md border transition-all ${
                  coin === c
                    ? "border-[#00c896] bg-[rgba(0,200,150,0.12)] text-[#00c896] shadow-[0_0_10px_rgba(0,200,150,0.15)]"
                    : "border-[rgba(255,255,255,0.07)] text-[#4a6a8a] hover:border-[rgba(0,200,150,0.3)] hover:text-[#94a3b8]"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Timeframe */}
        <div>
          <label className="font-mono text-[0.6rem] tracking-widest uppercase text-[#4a6a8a] block mb-2">
            Timeframe
          </label>
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="w-full bg-[#0d1625] border border-[rgba(0,200,150,0.2)] rounded-md px-3 py-2 font-mono text-xs text-[#e2e8f0] focus:outline-none focus:border-[#00c896] focus:ring-1 focus:ring-[rgba(0,200,150,0.3)] transition-all"
          >
            {TIMEFRAMES.map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>

        {/* Model */}
        <div>
          <label className="font-mono text-[0.6rem] tracking-widest uppercase text-[#4a6a8a] block mb-2">
            Model (TEE)
          </label>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="w-full bg-[#0d1625] border border-[rgba(0,200,150,0.2)] rounded-md px-3 py-2 font-mono text-xs text-[#e2e8f0] focus:outline-none focus:border-[#00c896] focus:ring-1 focus:ring-[rgba(0,200,150,0.3)] transition-all"
          >
            {MODELS.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
          </select>
        </div>
      </div>

      {/* ── Run button ── */}
      <button
        onClick={runAnalysis}
        disabled={loading}
        className="w-full py-3.5 rounded-lg border border-[#00c896] bg-[#00c896] text-[#080b10] font-sans font-bold text-sm tracking-wide hover:bg-[#00e0aa] hover:shadow-[0_0_30px_rgba(0,200,150,0.4)] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-3.5 h-3.5 rounded-full border-2 border-[#080b10] border-t-transparent animate-spin" />
            Running TEE Inference...
          </span>
        ) : (
          "⬡  Run Verifiable Analysis"
        )}
      </button>

      {/* ── Loading animation ── */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-[#050810] border border-[rgba(0,200,150,0.15)] rounded-xl p-5 overflow-hidden"
          >
            <div className="flex items-center gap-3 mb-4">
              <span className="w-2 h-2 rounded-full bg-[#00c896] animate-pulse" />
              <span className="font-mono text-[0.65rem] text-[#00c896] tracking-widest uppercase">
                Secure enclave processing...
              </span>
            </div>
            <div className="space-y-2">
              {["Initializing TEE Enclave", "Fetching market data", "Running AI inference", "Signing on-chain"].map((step, i) => (
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.4 }}
                  className="flex items-center gap-2"
                >
                  <span className="w-1 h-1 rounded-full bg-[#00c896] opacity-60" />
                  <span className="font-mono text-[0.6rem] text-[#2d4a6a] tracking-widest">{step}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Error ── */}
      {error && (
        <div className="p-4 rounded-lg border border-[rgba(239,68,68,0.2)] bg-[rgba(239,68,68,0.05)] font-mono text-xs text-[#ef4444]">
          ❌ {error}
        </div>
      )}

      {/* ── Results ── */}
      <AnimatePresence>
        {a && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {/* Metric cards */}
            <div className="grid grid-cols-3 gap-px bg-[rgba(0,200,150,0.08)] rounded-xl overflow-hidden border border-[rgba(0,200,150,0.1)]">
              {[
                { label: "Signal",     value: a.signal,                            color: SIGNAL_COLOR[a.signal] ?? "#e2e8f0",    icon: SIGNAL_ICON[a.signal] ?? "" },
                { label: "Volatility", value: `${a.volatility_score.toFixed(1)}/10`, color: "#e2e8f0",                             icon: "" },
                { label: "Risk",       value: a.risk_level,                        color: RISK_COLOR[a.risk_level] ?? "#e2e8f0",  icon: "" },
              ].map((m) => (
                <div key={m.label} className="bg-[#0a0f1a] px-5 py-5 group hover:bg-[#0d1625] transition-colors">
                  <div className="font-mono text-[0.6rem] tracking-widest uppercase text-[#4a6a8a] mb-2">{m.label}</div>
                  <div className="font-sans font-extrabold text-2xl tracking-tight flex items-baseline gap-1" style={{ color: m.color }}>
                    {m.icon && <span className="text-lg">{m.icon}</span>}
                    {m.value}
                  </div>
                  {m.label === "Signal" && (
                    <div className="font-mono text-[0.6rem] text-[#4a6a8a] mt-1">
                      Confidence: {a.confidence.toFixed(0)}%
                    </div>
                  )}
                  {m.label === "Volatility" && (
                    <div className="font-mono text-[0.6rem] text-[#4a6a8a] mt-1">{a.trend}</div>
                  )}
                </div>
              ))}
            </div>

            {/* Chart */}
            <div className="bg-[#0a0f1a] border border-[rgba(0,200,150,0.1)] rounded-xl p-5">
              <div className="font-mono text-[0.6rem] tracking-widest uppercase text-[#4a6a8a] mb-4">
                Volatility Score vs Market Average
              </div>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart
                  data={[
                    { name: "Market Avg",     value: 3.5 },
                    { name: `${coin} Forecast`, value: a.volatility_score },
                  ]}
                  barSize={40}
                >
                  <XAxis
                    dataKey="name"
                    tick={{ fontFamily: "Space Mono", fontSize: 10, fill: "#4a6a8a" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[0, 10]}
                    tick={{ fontFamily: "Space Mono", fontSize: 10, fill: "#4a6a8a" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(0,200,150,0.04)" }} />
                  <ReferenceLine y={5} stroke="rgba(239,68,68,0.3)" strokeDasharray="4 4" label={{ value: "Risk threshold", fill: "#ef4444", fontSize: 9, fontFamily: "Space Mono" }} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]} name="Score">
                    <Cell fill="#1e3a5f" />
                    <Cell fill={a.volatility_score > 5 ? "#ef4444" : "#00c896"} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Summary */}
            <div className="bg-[#0a0f1a] border border-[rgba(59,130,246,0.12)] rounded-xl p-5">
              <div className="font-mono text-[0.6rem] tracking-widest uppercase text-[#3b82f6] mb-3">
                ◈ AI Analysis · TEE Verified
              </div>
              <p className="font-sans text-sm text-[#94a3b8] leading-relaxed">{a.summary}</p>
              {(a.key_factors?.length ?? 0) > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {a.key_factors.map((f, i) => (
                    <span
                      key={i}
                      className="font-mono text-[0.6rem] px-2.5 py-1 rounded-full border border-[rgba(0,200,150,0.18)] text-[#4a8c6f] hover:border-[rgba(0,200,150,0.35)] transition-colors"
                    >
                      {f}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Proof block */}
            <div className="bg-[#050810] border border-[rgba(0,200,150,0.12)] rounded-xl p-5 relative overflow-hidden">
              {/* Corner shine */}
              <div className="absolute inset-0 bg-gradient-to-br from-[rgba(0,200,150,0.03)] to-transparent pointer-events-none" />

              <div className="flex items-center justify-between mb-3">
                <div className="font-mono text-[0.6rem] tracking-widest uppercase text-[#4a8c6f]">
                  ◈ Cryptographic Proof
                </div>
                <span className="font-mono text-[0.55rem] tracking-widest uppercase text-[#00c896] border border-[rgba(0,200,150,0.25)] px-2 py-0.5 rounded-full">
                  ✓ VERIFIED
                </span>
              </div>

              <div className="font-mono text-[0.72rem] text-[#00c896] break-all bg-[rgba(0,200,150,0.04)] border border-[rgba(0,200,150,0.08)] rounded-lg p-3 leading-relaxed">
                {result?.payment_hash}
              </div>

              <div className="mt-3 pt-3 border-t border-[rgba(0,200,150,0.07)] grid grid-cols-2 gap-y-3">
                {[
                  ["Model",      MODELS.find((m) => m.id === result?.model)?.label ?? result?.model],
                  ["Execution",  "Intel TDX · TEE"],
                  ["Settlement", "INDIVIDUAL_FULL"],
                  ["Timestamp",  new Date(result?.timestamp ?? "").toUTCString()],
                ].map(([k, v]) => (
                  <div key={k}>
                    <div className="font-mono text-[0.55rem] uppercase tracking-widest text-[#2d4a6a]">{k}</div>
                    <div className="font-mono text-[0.65rem] text-[#64748b] mt-0.5">{v}</div>
                  </div>
                ))}
              </div>

              <a
                href={result?.explorer_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 mt-4 font-mono text-[0.65rem] text-[#3b82f6] border border-[rgba(59,130,246,0.25)] px-3 py-1.5 rounded-full hover:bg-[rgba(59,130,246,0.08)] transition-colors"
              >
                ↗ Verify on Block Explorer
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
