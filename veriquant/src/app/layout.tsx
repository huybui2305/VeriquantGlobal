import type { Metadata } from "next"
import "./globals.css"
import { Providers } from "./providers"

export const metadata: Metadata = {
  title: "VeriQuant Global — Verifiable Crypto Intelligence",
  description:
    "Crypto analysis powered by AI inference inside Trusted Execution Environments (TEE), settled on the OpenGradient blockchain.",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
