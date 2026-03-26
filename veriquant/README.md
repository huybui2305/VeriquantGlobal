# VeriQuant Global

**Verifiable Crypto Intelligence powered by OpenGradient TEE**

Every AI inference runs inside an Intel TDX Trusted Execution Environment on the OpenGradient blockchain. Every result is cryptographically proven — no trust required.

---

## Architecture

```
Frontend (Next.js 15)           Backend (FastAPI + OpenGradient SDK)
    localhost:3000       ←→          localhost:8000
         ↓                                  ↓
  RainbowKit Wallet               OpenGradient TEE
  Glassmorphism UI               Intel TDX Secure Enclave
  Framer Motion                  x402 On-chain Settlement
```

## Quick Start

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd veriquant
```

### 2. Backend Setup

```bash
cd .. # go to root (where main.py is)

# Create your .env from the example
cp .env.example .env
# Then edit .env and fill in your OG_PRIVATE_KEY

# Install Python dependencies
pip install -r requirements.txt

# Start the backend
uvicorn main:app --reload --port 8000
```

The backend will print `✅ VeriQuant backend ready (OpenGradient TEE mode)` if everything is working.

> **Get OPG testnet tokens:** https://faucet.opengradient.ai

### 3. Frontend Setup

```bash
cd veriquant

# Install Node dependencies
npm install

# Configure environment (copy example and fill in values)
cp .env.local.example .env.local
# Edit .env.local:
#   NEXT_PUBLIC_WALLETCONNECT_ID=your_project_id_from_cloud.walletconnect.com

# Start the frontend
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

> **Get WalletConnect Project ID:** https://cloud.walletconnect.com (free)

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/analyze` | Run TEE inference on a crypto asset |
| `GET`  | `/health`  | Check backend status |
| `GET`  | `/models`  | List available OpenGradient TEE models |

### POST `/analyze` Request Body

```json
{
  "coin": "ETH",
  "timeframe": "1 hour",
  "model": "claude"
}
```

### Models

| ID | Name | Provider |
|----|------|---------|
| `claude` | Claude Sonnet 4.6 | Anthropic (OpenGradient TEE) |
| `gpt5` | GPT-5 | OpenAI (OpenGradient TEE) |
| `gpt4` | GPT-4.1 | OpenAI (OpenGradient TEE) |

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15 (App Router), TypeScript |
| Styling | Tailwind CSS v4, Framer Motion |
| Charts | Recharts |
| Wallet | RainbowKit + Wagmi |
| Backend | FastAPI (Python 3.11+) |
| AI Infra | OpenGradient SDK 0.9.1 |
| Payment | x402 Protocol (OPG Token) |
| Proof | Intel TDX TEE Attestation |

---

## Project Structure

```
.                       ← Backend (FastAPI)
├── main.py             ← API server + OpenGradient integration
├── requirements.txt    ← Python dependencies
├── .env.example        ← Environment template (copy to .env)
└── veriquant/          ← Frontend (Next.js)
    ├── src/
    │   ├── app/
    │   │   ├── page.tsx          ← Main page
    │   │   ├── layout.tsx        ← Root layout
    │   │   ├── providers.tsx     ← RainbowKit/Wagmi setup
    │   │   └── globals.css       ← Global styles
    │   └── components/
    │       └── AnalysisPanel.tsx ← Core analysis component
    ├── .env.local        ← Frontend env (WalletConnect ID)
    └── package.json
```

---

## Links

- OpenGradient: https://opengradient.ai
- OpenGradient Explorer: https://explorer.opengradient.ai
- OPG Testnet Faucet: https://faucet.opengradient.ai
- WalletConnect Cloud: https://cloud.walletconnect.com
