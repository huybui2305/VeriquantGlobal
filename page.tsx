"use client"

import { useState } from "react"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import { useAccount } from "wagmi"
import { motion, AnimatePresence } from "framer-motion"
import { AnalysisPanel } from "@/components/AnalysisPanel"

type Tab = "analyze" | "history"

// ── History Panel (placeholder — expand as needed) ──────────────────────────
function HistoryPanel({ walletAddress }: { walletAddress: string }) {
  return (
    <div className="pt-8">
      <div className="bg-[#0a0f1a] border border-[rgba(0,200,150,0.1)] rounded-xl p-8 text-center">
        <div className="text-4xl mb-4 text-[#1e3a5f]">◎</div>
        <p className="font-mono text-[0.65rem] text-[#2d4a6a] tracking-widest uppercase">
          Lịch sử phân tích sẽ được lưu theo địa chỉ
        </p>
        <p className="font-mono text-[0.7rem] text-[#00c896] mt-2">
          {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
        </p>
        <p className="font-mono text-[0.55rem] text-[#1e3a5f] mt-4 tracking-widest uppercase">
          Coming soon · On-chain history indexer
        </p>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function Home() {
  const { address, isConnected } = useAccount()
  const [tab, setTab] = useState<Tab>("analyze")

  return (
    <div className="min-h-screen bg-[#080b10]">
      {/* ── Navbar ── */}
      <nav className="border-b border-[rgba(0,200,150,0.1)] px-6 py-4 flex items-center justify-between sticky top-0 z-50 bg-[#080b10]/90 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <span className="text-[#00c896] text-2xl">⬡</span>
          <div>
            <div className="font-sans font-extrabold text-lg tracking-tight leading-none text-white">
              VeriQuant Global
            </div>
            <div className="font-mono text-[0.55rem] tracking-widest uppercase text-[#4a8c6f] mt-0.5">
              Verifiable Crypto Intelligence
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {isConnected && (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[rgba(0,200,150,0.2)] bg-[rgba(0,200,150,0.05)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00c896] animate-pulse" />
              <span className="font-mono text-[0.6rem] text-[#4a8c6f] tracking-widest uppercase">
                {address?.slice(0, 6)}...{address?.slice(-4)}
              </span>
            </div>
          )}
          <ConnectButton label="Connect Wallet" showBalance={false} />
        </div>
      </nav>

      {/* ── Hero ── */}
      <div className="px-6 pt-12 pb-0 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex gap-2 mb-4">
            <span className="font-mono text-[0.6rem] tracking-widest uppercase px-2.5 py-1 rounded-full border border-[rgba(0,200,150,0.3)] text-[#00c896] bg-[rgba(0,200,150,0.06)]">
              TEE Verified
            </span>
            <span className="font-mono text-[0.6rem] tracking-widest uppercase px-2.5 py-1 rounded-full border border-[rgba(59,130,246,0.3)] text-[#3b82f6] bg-[rgba(59,130,246,0.06)]">
              x402 Protocol
            </span>
            <span className="font-mono text-[0.6rem] tracking-widest uppercase px-2.5 py-1 rounded-full border border-[rgba(100,100,100,0.3)] text-[#64748b] bg-[rgba(100,100,100,0.06)]">
              Testnet
            </span>
          </div>

          <h1 className="font-sans font-extrabold text-4xl sm:text-5xl tracking-tight leading-none mb-3">
            <span className="text-white">Crypto Analysis</span>
            <br />
            <span className="bg-gradient-to-r from-[#00c896] to-[#3b82f6] bg-clip-text text-transparent">
              You Can Verify On-Chain.
            </span>
          </h1>
          <p className="font-mono text-[0.75rem] text-[#4a6a8a] leading-relaxed max-w-lg">
            Every inference runs inside a Trusted Execution Environment.
            Every result settles on the OpenGradient blockchain.
            Connect your wallet — no private key needed.
          </p>
        </motion.div>

        {/* ── Tab nav ── */}
        {isConnected && (
          <div className="flex gap-1 mt-10 border-b border-[rgba(0,200,150,0.1)]">
            {(["analyze", "history"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`font-mono text-[0.7rem] tracking-widest uppercase px-4 py-2.5 border-b-2 transition-all ${
                  tab === t
                    ? "border-[#00c896] text-[#00c896]"
                    : "border-transparent text-[#4a6a8a] hover:text-[#94a3b8]"
                }`}
              >
                {t === "analyze" ? "◈ Analyze" : "◎ History"}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Content ── */}
      <div className="px-6 pb-16 max-w-5xl mx-auto">
        {!isConnected ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-24 gap-5"
          >
            <div className="text-[#1e3a5f] text-5xl">⬡</div>
            <p className="font-mono text-[0.7rem] text-[#2d4a6a] tracking-widest uppercase text-center">
              Connect wallet to begin verifiable inference
            </p>
            <ConnectButton label="Connect Wallet" showBalance={false} />
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
      <footer className="border-t border-[rgba(0,200,150,0.06)] px-6 py-4 flex justify-between items-center">
        <span className="font-mono text-[0.55rem] text-[#1e3a5f] tracking-widest uppercase">
          ⬡ VeriQuant Global · OpenGradient x402
        </span>
        <a
          href="https://explorer.opengradient.ai"
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono text-[0.55rem] text-[#1e3a5f] hover:text-[#3b82f6] transition-colors tracking-widest uppercase"
        >
          Block Explorer ↗
        </a>
      </footer>
    </div>
  )
}
