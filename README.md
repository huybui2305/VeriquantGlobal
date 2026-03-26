# ⬡ VeriQuant Global

> **Verifiable Crypto Intelligence**  
> Every inference runs inside a Trusted Execution Environment (TEE). Every result settles cryptographically on the OpenGradient blockchain via the x402 Protocol. 

**VeriQuant Global** is a full-stack, AI-driven crypto analysis platform. It provides high-confidence market signals using real-time price action data natively injected into secure OpenGradient Large Language Models (LLMs), with an emphasis on **on-chain verifiable proofs**.

![VeriQuant Global Bright Theme](https://raw.githubusercontent.com/huybui2305/VeriquantGlobal/main/veriquant/public/favicon.ico) *(Replace with actual screenshot later)*

## 🌟 Key Features
- **Real-Time Data Injection:** Fetches live market data (Price, Volume, ATH, 24h/7d Changes) via CoinGecko and securely injects it into the AI prompt to prevent hallucination.
- **Trusted Execution Environments (TEE):** AI inference logic is computed strictly on Intel(R) TDX-enabled hardware through the OpenGradient framework, ensuring the output cannot be tampered with.
- **Operator-Pays Architecture (x402):** The backend server securely signs and pays for the inference on OpenGradient, allowing end-users to securely view data without needing native crypto on the OpG Testnet.
- **Cryptographic Settlement:** Every inference returns a deterministic `payment_hash` that can be verified natively on the OpenGradient Blockchain Explorer.
- **Dynamic Modern UI:** Lightning-fast, hyper-responsive frontend built with Next.js 15, TailwindCSS, Framer Motion, and Wagmi/RainbowKit. 

## 🏗️ Architecture

The repository is structured as a robust **Monorepo** connecting a high-performance Python backend directly to a React (Next.js) frontend.

1. **`main.py` (FastAPI / Python)**
   - Exposes `/price/{coin}` for live data retrieval.
   - Exposes `/analyze` to trigger the OpenGradient SDK, handle exceptions (Rate limits, Model constraints), and interact directly with the RPC endpoint.
2. **`veriquant/` (Next.js 15 / TypeScript)**
   - The user-facing dashboard, built with Web3 primitives (`wagmi`, `viem`, `rainbowkit`). 
   - Handles connection state, local price polling (every 30s), and the UI execution flow.

---

## 🚀 Local Development

### 1. Backend Setup (FastAPI)
The Python backend manages the OpenGradient SDK calls and requires setting up a secure `.env` file.

```bash
# In the root repository folder
python -m venv .venv

# Activate virtual environment
# Windows:
.venv\Scripts\activate
# Mac/Linux:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

Create a `.env` file in the root folder with an **OpenGradient funded private key**:
```properties
OG_PRIVATE_KEY=your_private_key_here
```

**Run the backend:**
```bash
uvicorn main:app --reload --port 8000
```


### 2. Frontend Setup (Next.js)
Open a separate terminal to run the UI.

```bash
cd veriquant

# Install Node dependencies
npm install

# Start development server
npm run dev
```
Visit `http://localhost:3000` to interact with the platform.

---

## 🌐 Production Deployment

The platform is designed to be easily deployed on standard cloud infrastructure:

### Backend Deployment (Render or Railway)
It is highly recommended to host the **FastAPI process** on [Render](https://render.com) using a Web Service.
- **Build Command:** `pip install -r requirements.txt`
- **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
- **Envs:** Remember to add `OG_PRIVATE_KEY` to the environment securely.

### Frontend Deployment (Vercel)
The Next.js dashboard is optimized for [Vercel](https://vercel.com).
- **Root Directory:** Edit the Vercel project settings so the Root Directory strictly points to `veriquant`.
- **Envs:** Define `NEXT_PUBLIC_API_URL` to point strictly to your Render backend URL (e.g. `https://veriquant-api.onrender.com`).
- *(Optional)* Define `NEXT_PUBLIC_WALLETCONNECT_ID` with a 32-character hex ID (e.g. from WalletConnect Cloud).

---

## 📜 Copyright & License
*Made with 💙 by DivineBraid.*
