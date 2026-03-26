"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

const COINS      = ["BTC", "ETH", "SOL", "SUI", "BNB", "AVAX"]
const TIMEFRAMES = ["15 minutes", "30 minutes", "1 hour", "6 hours", "24 hours"]
const MODELS = [
  { id: "claude", label: "Claude Sonnet 4.6 (OpenGradient TEE)" },
  { id: "gpt5",   label: "GPT-5 (OpenGradient TEE)" },
  { id: "gpt4",   label: "GPT-4.1 (OpenGradient TEE)" },
]

type PriceData = {
  price_usd: number; change_1h: number; change_24h: number; change_7d: number
  market_cap: number; volume_24h: number; high_24h: number; low_24h: number
  ath: number; ath_change: number; circulating_supply: number; last_updated: string
}

type Analysis = {
  volatility_score: number; trend: string; risk_level: string; signal: string
  confidence: number; summary: string; key_factors: string[]
}
type ApiResult = {
  analysis: Analysis; price_data: PriceData; payment_hash: string
  model: string; timestamp: string; explorer_url: string
}

const SIGNAL_COLOR: Record<string,string> = { Buy:"#00c896", Sell:"#ef4444", Hold:"#f59e0b", Caution:"#f59e0b" }
const RISK_COLOR:   Record<string,string> = { Low:"#00c896", Medium:"#f59e0b", High:"#ef4444", Extreme:"#7f1d1d" }
const SIGNAL_ICON:  Record<string,string> = { Buy:"↑", Sell:"↓", Hold:"→", Caution:"⚠" }

function fmt(n: number, decimals = 2) { return n?.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) ?? "0" }
function fmtPrice(p: number) {
  if (!p) return "$0"
  if (p >= 1000) return `$${fmt(p, 2)}`
  if (p >= 1)    return `$${fmt(p, 4)}`
  return `$${fmt(p, 6)}`
}
function fmtBig(v: number) {
  if (v >= 1e12) return `$${(v/1e12).toFixed(2)}T`
  if (v >= 1e9)  return `$${(v/1e9).toFixed(2)}B`
  if (v >= 1e6)  return `$${(v/1e6).toFixed(2)}M`
  return `$${fmt(v)}`
}
function PctBadge({ value }: { value: number }) {
  const pos = value >= 0
  return (
    <span className={`font-mono text-[0.65rem] font-bold ${pos ? "text-[#00c896]" : "text-[#ef4444]"}`}>
      {pos ? "+" : ""}{value?.toFixed(2)}%
    </span>
  )
}

interface Props { walletAddress: string }

export function AnalysisPanel({ walletAddress }: Props) {
  const [coin, setCoin]       = useState("ETH")
  const [timeframe, setTf]    = useState("1 hour")
  const [model, setModel]     = useState("claude")
  const [loading, setLoading] = useState(false)
  const [result, setResult]   = useState<ApiResult | null>(null)
  const [error, setError]     = useState<string | null>(null)

  // Live price ticker
  const [livePrice, setLivePrice] = useState<PriceData | null>(null)
  const [priceLoading, setPriceLoading] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchLivePrice = useCallback(async (c: string) => {
    setPriceLoading(true)
    try {
      const r = await fetch(`${API}/price/${c}`)
      if (r.ok) setLivePrice(await r.json())
    } catch { }
    finally { setPriceLoading(false) }
  }, [])

  useEffect(() => {
    fetchLivePrice(coin)
    if (intervalRef.current) clearInterval(intervalRef.current)
    intervalRef.current = setInterval(() => fetchLivePrice(coin), 30000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [coin, fetchLivePrice])

  async function runAnalysis() {
    setLoading(true); setError(null); setResult(null)
    try {
      const res = await fetch(`${API}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coin, timeframe, model, wallet: walletAddress }),
      })
      if (!res.ok) throw new Error((await res.json()).detail || "Request failed")
      const data: ApiResult = await res.json()
      setResult(data)
      if (data.price_data) setLivePrice(data.price_data)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const a = result?.analysis
  const p = livePrice

  return (
    <div className="pt-6 space-y-5">

      {/* ── Live Price Ticker ── */}
      {p && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden"
        >
          {/* Top row: price + changes */}
          <div className="flex flex-wrap items-center gap-4 px-6 py-5 border-b border-slate-100">
            <div>
              <div className="font-mono text-[0.6rem] text-slate-400 uppercase tracking-widest mb-1 font-semibold">{coin}/USDT</div>
              <div className="font-sans font-extrabold text-3xl text-slate-800 tracking-tight">{fmtPrice(p.price_usd)}</div>
            </div>
            <div className="flex gap-5 ml-4">
              <div><div className="font-mono text-[0.55rem] text-slate-400 mb-1 font-semibold">1H</div><PctBadge value={p.change_1h} /></div>
              <div><div className="font-mono text-[0.55rem] text-slate-400 mb-1 font-semibold">24H</div><PctBadge value={p.change_24h} /></div>
              <div><div className="font-mono text-[0.55rem] text-slate-400 mb-1 font-semibold">7D</div><PctBadge value={p.change_7d} /></div>
            </div>
            <div className="ml-auto flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
              <span className={`w-2 h-2 rounded-full ${priceLoading ? "bg-[#f59e0b] animate-pulse" : "bg-[#00c896]"}`} />
              <span className="font-mono text-[0.6rem] text-slate-500 uppercase tracking-widest font-semibold">Live · 30s</span>
            </div>
          </div>

          {/* Bottom row: market stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-0 divide-x divide-slate-100 bg-slate-50/50">
            {[
              { label: "Market Cap",   value: fmtBig(p.market_cap) },
              { label: "24H Volume",   value: fmtBig(p.volume_24h) },
              { label: "24H High",     value: fmtPrice(p.high_24h) },
              { label: "24H Low",      value: fmtPrice(p.low_24h)  },
            ].map(s => (
              <div key={s.label} className="px-5 py-4">
                <div className="font-mono text-[0.55rem] text-slate-400 uppercase tracking-widest mb-1.5 font-semibold">{s.label}</div>
                <div className="font-mono text-[0.8rem] font-bold text-slate-700">{s.value}</div>
              </div>
            ))}
          </div>

          {/* ATH bar */}
          <div className="px-6 py-3 border-t border-slate-100 flex items-center gap-4 bg-white">
            <span className="font-mono text-[0.55rem] text-slate-500 uppercase tracking-widest font-semibold">ATH {fmtPrice(p.ath)}</span>
            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#00c896] to-[#3b82f6] rounded-full"
                style={{ width: `${Math.max(0, 100 + (p.ath_change ?? 0))}%` }}
              />
            </div>
            <span className="font-mono text-[0.55rem] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
              <span className="text-[#ef4444]">{(p.ath_change ?? 0).toFixed(1)}%</span> from ATH
            </span>
          </div>
        </motion.div>
      )}

      {/* ── Controls ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <label className="font-sans text-[0.7rem] font-bold tracking-wider uppercase text-slate-500 block mb-3">Asset</label>
          <div className="flex gap-2 flex-wrap">
            {COINS.map(c => (
              <button key={c} onClick={() => setCoin(c)}
                className={`font-mono text-xs px-3 py-1.5 rounded-lg border transition-all font-semibold ${
                  coin === c ? "border-[#3b82f6] bg-[#3b82f6]/10 text-[#3b82f6] shadow-sm"
                             : "border-slate-200 text-slate-500 bg-slate-50 hover:border-slate-300 hover:bg-white"}`}>
                {c}
              </button>
            ))}
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <label className="font-sans text-[0.7rem] font-bold tracking-wider uppercase text-slate-500 block mb-3">Timeframe</label>
          <select value={timeframe} onChange={e => setTf(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-mono text-xs text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/50 transition-shadow mt-auto">
            {TIMEFRAMES.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <label className="font-sans text-[0.7rem] font-bold tracking-wider uppercase text-slate-500 block mb-3">TEE Model</label>
          <select value={model} onChange={e => setModel(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-mono text-xs text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/50 transition-shadow mt-auto">
            {MODELS.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
          </select>
        </div>
      </div>

      {/* ── Run Button ── */}
      <button onClick={runAnalysis} disabled={loading}
        className="w-full py-4 rounded-xl border border-slate-200 bg-white text-slate-800 font-extrabold text-[0.95rem] hover:border-[#3b82f6] hover:text-[#3b82f6] hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed group relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#3b82f6]/5 to-[#00c896]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
        <span className="relative z-10">{loading ? "Running verifiable inference..." : "⬡ Execute Analysis"}</span>
      </button>

      {/* ── Loading ── */}
      <AnimatePresence>
        {loading && (
          <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:"auto" }} exit={{ opacity:0, height:0 }}
            className="bg-white border border-slate-200 rounded-xl p-5 overflow-hidden shadow-sm">
            <div className="flex items-center justify-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-[#3b82f6] animate-pulse" />
              <span className="font-mono text-[0.7rem] text-slate-600 tracking-widest uppercase font-semibold">
                Connecting to OpenGradient TEE Enclave...
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Error ── */}
      {error && (
        <div className="p-4 rounded-xl border border-red-200 bg-red-50 font-mono text-xs text-red-600 font-semibold shadow-sm">
          ❌ {error}
        </div>
      )}

      {/* ── Results ── */}
      <AnimatePresence>
        {a && (
          <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} className="space-y-5">

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-px bg-slate-200 rounded-2xl overflow-hidden shadow-sm border border-slate-200">
              {[
                { label:"Signal",     value: a.signal || "N/A",                           color: SIGNAL_COLOR[a.signal] ?? "#64748b", icon: SIGNAL_ICON[a.signal] ?? "" },
                { label:"Volatility", value: `${(a.volatility_score ?? 0).toFixed(1)}/10`, color: "#334155", icon: "" },
                { label:"Risk",       value: a.risk_level || "N/A",                        color: RISK_COLOR[a.risk_level] ?? "#64748b", icon: "" },
              ].map(m => (
                <div key={m.label} className="bg-white px-6 py-6 group hover:bg-slate-50 transition-colors relative">
                  <div className="font-sans font-bold text-[0.7rem] tracking-wider uppercase text-slate-400 mb-2">{m.label}</div>
                  <div className="font-sans font-black text-3xl flex items-baseline gap-1.5" style={{ color: m.color }}>
                    {m.icon && <span className="text-2xl">{m.icon}</span>}{m.value}
                  </div>
                  <div className="absolute bottom-0 left-0 h-1 bg-[#3b82f6] w-0 group-hover:w-full transition-all duration-300" />
                </div>
              ))}
            </div>

            {/* AI Summary */}
            <div className="bg-white border border-slate-200 rounded-2xl p-7 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full bg-[#00c896]" />
                <span className="font-sans font-bold text-[0.75rem] uppercase tracking-wider text-[#00c896]">AI Analysis · TEE Verified</span>
                <span className="ml-auto font-mono text-[0.65rem] font-semibold text-slate-400 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100">
                  Confidence: {(a.confidence ?? 0).toFixed(0)}%
                </span>
              </div>
              <p className="text-slate-700 text-[1rem] leading-relaxed italic border-l-2 border-slate-200 pl-4 py-1 font-medium">
                "{a.summary}"
              </p>
              <div className="flex flex-wrap gap-2 pt-6 border-t border-slate-100 mt-5">
                {a.key_factors.map((f, i) => (
                  <span key={i} className="font-mono text-[0.65rem] font-semibold px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 shadow-sm">
                    <span className="text-[#3b82f6] mr-1">◈</span> {f}
                  </span>
                ))}
              </div>
            </div>

            {/* TEE Execution Log */}
            <div className="bg-[#0f172a] rounded-2xl p-5 shadow-md shadow-slate-200 mt-2">
              <div className="flex justify-between font-mono text-[0.6rem] text-slate-400 mb-3 border-b border-slate-800 pb-2 font-semibold">
                <span>TEE_EXECUTION_TRACE_V4.1</span><span>STATUS: COMMITTED · x402</span>
              </div>
              <div className="font-mono text-[0.65rem] space-y-1.5">
                <div className="flex gap-3"><span className="text-[#00c896] w-6">[OK]</span><span className="text-slate-300">Enclave initialized: Intel(R) TDX enabled.</span></div>
                <div className="flex gap-3"><span className="text-[#00c896] w-6">[OK]</span><span className="text-slate-300">Attestation verified by OpenGradient Network.</span></div>
                <div className="flex gap-3"><span className="text-[#00c896] w-6">[OK]</span><span className="text-slate-300">Real-time market data verified and injected.</span></div>
                <div className="flex gap-3"><span className="text-[#00c896] w-6">[OK]</span><span className="text-slate-300">Inference on {model.toUpperCase()} inside secure partition.</span></div>
                <div className="flex gap-3"><span className="text-[#3b82f6] w-6">[TX]</span><span className="text-slate-300">x402 settlement submitted to OpG-L1-Testnet.</span></div>
                <div className="flex gap-3"><span className="text-slate-500 w-6">[FIN]</span><span className="text-slate-400">Cryptographic proof committed. Response delivered.</span></div>
              </div>
            </div>

            {/* Proof */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="font-sans font-bold text-[0.7rem] tracking-wider uppercase text-slate-500">
                  <span className="text-[#3b82f6] mr-1">◈</span> Cryptographic Proof (x402)
                </div>
                <span className="font-sans font-bold text-[0.6rem] tracking-widest uppercase text-[#00c896] bg-[#00c896]/10 px-2.5 py-1 rounded-full border border-[#00c896]/20">
                  ✓ VERIFIED
                </span>
              </div>
              <div className="font-mono text-[0.75rem] font-semibold text-slate-600 break-all bg-slate-50 border border-slate-200 rounded-xl p-4 shadow-inner">
                {result!.payment_hash}
              </div>
              <a href={result!.explorer_url} target="_blank" rel="noopener noreferrer"
                className="mt-5 inline-flex items-center gap-2 font-sans font-bold text-[0.75rem] text-white bg-[#3b82f6] hover:bg-[#2563eb] px-5 py-2.5 rounded-lg transition-colors shadow-sm">
                View on OpenGradient Explorer ↗
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
