"use client"

import { useState } from "react"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import { useAccount } from "wagmi"
import { motion, AnimatePresence } from "framer-motion"
import { AnalysisPanel } from "@/components/AnalysisPanel"

type Tab = "analyze" | "history"

function HistoryPanel({ walletAddress }: { walletAddress: string }) {
  return (
    <div className="pt-8">
      <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-10 text-center">
        <div className="text-4xl mb-4 text-slate-300">◎</div>
        <p className="font-mono text-[0.65rem] text-slate-500 tracking-widest uppercase">
          Lịch sử phân tích của ví
        </p>
        <p className="font-mono text-[0.75rem] text-[#3b82f6] mt-2 font-semibold">
          {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
        </p>
        <p className="font-mono text-[0.55rem] text-slate-400 mt-4 tracking-widest uppercase bg-slate-50 inline-block px-3 py-1 rounded-full border border-slate-100">
          Coming soon · On-chain history indexer
        </p>
      </div>
    </div>
  )
}

export default function Home() {
  const { address, isConnected } = useAccount()
  const [tab, setTab] = useState<Tab>("analyze")

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-[#3b82f6] selection:text-white">
      {/* ── Navbar ── */}
      <nav className="border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-50 bg-white/80 backdrop-blur-md shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#3b82f6] to-[#00c896] flex items-center justify-center shadow-md">
            <span className="text-white text-xl leading-none -mt-0.5">⬡</span>
          </div>
          <div>
            <div className="font-sans font-extrabold text-lg tracking-tight leading-none text-slate-900">
              VeriQuant Global
            </div>
            <div className="font-mono text-[0.55rem] tracking-widest uppercase text-slate-500 mt-0.5">
              Verifiable Crypto Intelligence
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {isConnected && (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200 bg-white shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00c896] animate-pulse" />
              <span className="font-mono text-[0.6rem] text-slate-600 tracking-widest uppercase font-semibold">
                {address?.slice(0, 6)}...{address?.slice(-4)}
              </span>
            </div>
          )}
          <div className="shadow-sm rounded-xl">
            <ConnectButton label="Connect Wallet" showBalance={false} />
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <div className="px-6 pt-12 pb-0 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex gap-2 mb-5 flex-wrap">
            <span className="font-mono text-[0.6rem] font-semibold tracking-widest uppercase px-2.5 py-1 rounded-full border border-[#00c896]/30 text-[#00c896] bg-[#00c896]/10">
              TEE Verified
            </span>
            <span className="font-mono text-[0.6rem] font-semibold tracking-widest uppercase px-2.5 py-1 rounded-full border border-[#3b82f6]/30 text-[#3b82f6] bg-[#3b82f6]/10">
              x402 Protocol
            </span>
            <span className="font-mono text-[0.6rem] font-semibold tracking-widest uppercase px-2.5 py-1 rounded-full border border-slate-300 text-slate-500 bg-white shadow-sm">
              Testnet
            </span>
          </div>

          <h1 className="font-sans font-extrabold text-4xl sm:text-5xl tracking-tight leading-tight mb-4 text-slate-900">
            Crypto Analysis <br />
            <span className="bg-gradient-to-r from-[#3b82f6] to-[#00c896] bg-clip-text text-transparent">
              You Can Verify On-Chain.
            </span>
          </h1>
          <p className="font-medium text-[0.9rem] text-slate-500 leading-relaxed max-w-xl">
            Every inference runs inside a Trusted Execution Environment.
            Every result settles on the OpenGradient blockchain.
            Connect your wallet — no private key needed.
          </p>
        </motion.div>

        {/* ── Tab nav ── */}
        {isConnected && (
          <div className="flex gap-6 mt-12 border-b border-slate-200">
            {(["analyze", "history"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`font-sans font-bold text-[0.85rem] uppercase tracking-wider px-2 py-3 border-b-2 transition-all ${
                  tab === t
                    ? "border-[#3b82f6] text-[#3b82f6]"
                    : "border-transparent text-slate-400 hover:text-slate-600"
                }`}
              >
                {t === "analyze" ? "◈ Analyze" : "◎ History"}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Content ── */}
      <div className="px-6 pb-20 max-w-5xl mx-auto">
        {!isConnected ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-28 gap-6 bg-white mt-10 rounded-2xl border border-slate-200 shadow-sm"
          >
            <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center shadow-inner">
              <span className="text-slate-300 text-3xl">⬡</span>
            </div>
            <p className="font-sans font-semibold text-[0.9rem] text-slate-500 text-center">
              Connect your wallet to begin verifiable inference
            </p>
            <div className="shadow-md rounded-xl hover:shadow-lg transition-shadow">
              <ConnectButton label="Connect Wallet" showBalance={false} />
            </div>
          </motion.div>
        ) : (
          <AnimatePresence mode="wait">
            {tab === "analyze" ? (
              <motion.div
                key="analyze"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
              >
                <AnalysisPanel walletAddress={address!} />
              </motion.div>
            ) : (
              <motion.div
                key="history"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                <HistoryPanel walletAddress={address!} />
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-200 bg-white px-6 py-6 mt-auto">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex flex-col items-center sm:items-start gap-1">
            <span className="font-sans font-bold text-[0.75rem] text-slate-700 tracking-wide">
              VeriQuant Global
            </span>
            <span className="font-mono text-[0.6rem] text-slate-400 tracking-widest uppercase">
              Powered by OpenGradient x402
            </span>
          </div>
          
          <div className="flex flex-col items-center sm:items-end gap-1">
            <span className="font-sans font-semibold text-[0.7rem] text-slate-500">
              Made with 💙 by <span className="text-[#3b82f6] font-bold">DivineBraid</span>
            </span>
            <a
              href="https://explorer.opengradient.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-[0.55rem] text-slate-400 hover:text-[#3b82f6] transition-colors tracking-widest uppercase mt-1"
            >
              View Explorer ↗
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
