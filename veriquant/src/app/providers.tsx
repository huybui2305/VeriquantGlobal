"use client"

import "@rainbow-me/rainbowkit/styles.css"
import { RainbowKitProvider, getDefaultConfig, darkTheme } from "@rainbow-me/rainbowkit"
import { WagmiProvider } from "wagmi"
import { mainnet, sepolia } from "wagmi/chains"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

const config = getDefaultConfig({
  appName: "VeriQuant Global",
  // Fallback to a valid 32-character hex string to prevent RainbowKit from crashing during Vercel SSR
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_ID || "00000000000000000000000000000000",
  chains: [mainnet, sepolia],
  ssr: true,
})

const queryClient = new QueryClient()

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: "#00c896",
            accentColorForeground: "#080b10",
            borderRadius: "medium",
            fontStack: "system",
          })}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
