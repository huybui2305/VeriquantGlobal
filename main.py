import json
import os
import re
import httpx
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import Optional
from eth_account import Account

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

load_dotenv()

# ─────────────────────────────────────────
#  Config
# ─────────────────────────────────────────
OG_PRIVATE_KEY = os.environ.get("OG_PRIVATE_KEY")
if not OG_PRIVATE_KEY:
    raise RuntimeError("OG_PRIVATE_KEY not set. Create a .env file from .env.example.")

try:
    import opengradient as og
    MODEL_MAP = {
        "claude": og.TEE_LLM.CLAUDE_SONNET_4_6,
        "gpt4":   og.TEE_LLM.GPT_4_1_2025_04_14,
        "gpt5":   og.TEE_LLM.GPT_5,
    }
except ImportError as e:
    raise RuntimeError(f"OpenGradient SDK not installed: {e}")

llm_client = None

# CoinGecko ID map
COIN_IDS = {
    "BTC":  "bitcoin",
    "ETH":  "ethereum",
    "SOL":  "solana",
    "SUI":  "sui",
    "BNB":  "binancecoin",
    "AVAX": "avalanche-2",
}
SUPPORTED_COINS = set(COIN_IDS.keys())


# ─────────────────────────────────────────
#  Lifespan
# ─────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    global llm_client
    try:
        llm_client = og.LLM(private_key=OG_PRIVATE_KEY)
        llm_client.ensure_opg_approval(opg_amount=10.0)
        print("✅ VeriQuant backend ready (OpenGradient TEE + Real-Time Data)")
    except Exception as e:
        print(f"❌ Failed to init OpenGradient client: {e}")
        raise
    yield
    llm_client = None


# ─────────────────────────────────────────
#  App
# ─────────────────────────────────────────
app = FastAPI(title="VeriQuant API", version="4.0.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins (Vercel, localhost, etc.)
    allow_credentials=False,  # Must be False when allow_origins=["*"]
    allow_methods=["*"],
    allow_headers=["*"],
)


class AnalyzeRequest(BaseModel):
    coin:      str
    timeframe: str
    model:     str = "claude"
    wallet:    Optional[str] = None


# ─────────────────────────────────────────
#  CoinGecko price fetcher
# ─────────────────────────────────────────
async def fetch_price_data(coin: str) -> dict:
    cg_id = COIN_IDS.get(coin, coin.lower())
    url = (
        f"https://api.coingecko.com/api/v3/coins/{cg_id}"
        "?localization=false&tickers=false&community_data=false&developer_data=false"
    )
    try:
        async with httpx.AsyncClient(timeout=8) as client:
            r = await client.get(url)
            r.raise_for_status()
            data = r.json()
            mkt = data.get("market_data", {})
            return {
                "price_usd":         mkt.get("current_price", {}).get("usd", 0),
                "change_1h":         mkt.get("price_change_percentage_1h_in_currency", {}).get("usd", 0),
                "change_24h":        mkt.get("price_change_percentage_24h_in_currency", {}).get("usd", 0),
                "change_7d":         mkt.get("price_change_percentage_7d_in_currency", {}).get("usd", 0),
                "market_cap":        mkt.get("market_cap", {}).get("usd", 0),
                "volume_24h":        mkt.get("total_volume", {}).get("usd", 0),
                "high_24h":          mkt.get("high_24h", {}).get("usd", 0),
                "low_24h":           mkt.get("low_24h", {}).get("usd", 0),
                "ath":               mkt.get("ath", {}).get("usd", 0),
                "ath_change":        mkt.get("ath_change_percentage", {}).get("usd", 0),
                "circulating_supply": mkt.get("circulating_supply", 0),
                "last_updated":      data.get("last_updated", ""),
            }
    except Exception as e:
        print(f"⚠️ Price fetch failed for {coin}: {e}")
        return {}


# ─────────────────────────────────────────
#  Helpers
# ─────────────────────────────────────────
def extract_json(text: str) -> dict:
    text = text.strip()
    try:
        return json.loads(text)
    except Exception:
        pass
    fence = re.search(r"```(?:json)?\s*([\s\S]*?)```", text)
    if fence:
        try:
            return json.loads(fence.group(1).strip())
        except Exception:
            pass
    brace = re.search(r"\{[\s\S]*\}", text)
    if brace:
        try:
            return json.loads(brace.group(0))
        except Exception:
            pass
    return {}


def safe_analysis(raw: dict) -> dict:
    def _float(v, d=0.0):
        try: return float(v)
        except: return d
    return {
        "volatility_score": _float(raw.get("volatility_score")),
        "trend":            str(raw.get("trend",      "Neutral")),
        "risk_level":       str(raw.get("risk_level", "Medium")),
        "signal":           str(raw.get("signal",     "Hold")),
        "confidence":       _float(raw.get("confidence"), 50.0),
        "summary":          str(raw.get("summary",    "Analysis completed.")),
        "key_factors":      list(raw.get("key_factors", [])),
    }


def fmt_price(p: float) -> str:
    if p >= 1000:
        return f"${p:,.2f}"
    elif p >= 1:
        return f"${p:.4f}"
    else:
        return f"${p:.6f}"


def fmt_mcap(v: float) -> str:
    if v >= 1e12: return f"${v/1e12:.2f}T"
    if v >= 1e9:  return f"${v/1e9:.2f}B"
    if v >= 1e6:  return f"${v/1e6:.2f}M"
    return f"${v:,.0f}"


SYSTEM_PROMPT = """You are VeriQuant, an expert crypto quantitative analyst running inside an Intel TDX Trusted Execution Environment on the OpenGradient network.

You will receive REAL-TIME market data for the asset. Use this data in your analysis.

Return ONLY a valid JSON object — no markdown, no extra text:
{
  "volatility_score": <float 0-10>,
  "trend": "<Bullish|Bearish|Neutral>",
  "risk_level": "<Low|Medium|High|Extreme>",
  "signal": "<Buy|Sell|Hold|Caution>",
  "confidence": <float 0-100>,
  "summary": "<2-3 sentence quantitative analysis using the real-time data provided>",
  "key_factors": ["<factor1 with specific numbers>", "<factor2>", "<factor3>"]
}"""


# ─────────────────────────────────────────
#  GET /price/{coin}  — Real-time price
# ─────────────────────────────────────────
@app.get("/price/{coin}")
async def get_price(coin: str):
    coin = coin.upper()
    if coin not in SUPPORTED_COINS:
        raise HTTPException(400, f"Unsupported asset: {coin}")
    data = await fetch_price_data(coin)
    if not data:
        raise HTTPException(503, "Price data unavailable. Try again.")
    return {"coin": coin, **data}


# ─────────────────────────────────────────
#  POST /analyze
# ─────────────────────────────────────────
@app.post("/analyze")
async def analyze(req: AnalyzeRequest):
    coin = req.coin.upper()
    if coin not in SUPPORTED_COINS:
        raise HTTPException(400, f"Unsupported asset: {coin}")
    if llm_client is None:
        raise HTTPException(503, "Service not ready.")

    tee_model = MODEL_MAP.get(req.model, og.TEE_LLM.CLAUDE_SONNET_4_6)
    timestamp = datetime.now(timezone.utc).isoformat()

    # Fetch real-time price data to pass into the AI prompt
    price_data = await fetch_price_data(coin)
    valid_price = price_data.get("price_usd", 0) > 0

    if valid_price:
        price_ctx = f"""
REAL-TIME MARKET DATA (as of {timestamp}):
- Price: {fmt_price(price_data.get('price_usd', 0))}
- 1h Change: {price_data.get('change_1h', 0):.2f}%
- 24h Change: {price_data.get('change_24h', 0):.2f}%
- 7d Change: {price_data.get('change_7d', 0):.2f}%
- 24h High: {fmt_price(price_data.get('high_24h', 0))}
- 24h Low: {fmt_price(price_data.get('low_24h', 0))}
- 24h Volume: {fmt_mcap(price_data.get('volume_24h', 0))}
- Market Cap: {fmt_mcap(price_data.get('market_cap', 0))}
- ATH: {fmt_price(price_data.get('ath', 0))} ({price_data.get('ath_change', 0):.1f}% from ATH)
"""
    else:
        price_ctx = "(Real-time price data currently experiencing API rate limits. Provide a general technical analysis based on historical patterns for this asset and timeframe.)"

    user_prompt = (
        f"Asset: {coin}/USDT\n"
        f"Timeframe: {req.timeframe}\n"
        f"UTC: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M')}\n"
        f"{price_ctx}\n"
        "Provide a quantitative trading analysis and signal based on the data above."
    )

    try:
        result = await llm_client.chat(
            model=tee_model,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user",   "content": user_prompt},
            ],
            max_tokens=512,
            temperature=0.1,
            x402_settlement_mode=og.x402SettlementMode.INDIVIDUAL_FULL,
        )
    except Exception as e:
        raise HTTPException(502, f"OpenGradient TEE Inference failed: {e}")

    raw_text = (
        result.chat_output.get("content", str(result.chat_output))
        if isinstance(result.chat_output, dict)
        else str(result.chat_output)
    )

    # Try every known field name for the real tx hash
    raw_hash = (
        getattr(result, "payment_hash", None)
        or getattr(result, "tx_hash", None)
        or getattr(result, "transaction_hash", None)
        or getattr(result, "hash", None)
    )

    # "external" / None / "CONFIRMED" are not real hashes — use wallet address link instead
    FAKE_HASHES = {"external", "confirmed", "none", "", None}
    is_real_hash = (
        raw_hash is not None
        and str(raw_hash).lower() not in FAKE_HASHES
        and len(str(raw_hash)) > 20
    )

    payment_hash = raw_hash if is_real_hash else "PENDING"

    # Build explorer URL
    try:
        operator_address = Account.from_key(OG_PRIVATE_KEY).address
    except Exception:
        operator_address = ""

    explorer_url = (
        f"https://explorer.opengradient.ai/tx/{payment_hash}"
        if is_real_hash
        else f"https://explorer.opengradient.ai/address/{operator_address}"
    )

    return {
        "analysis":        safe_analysis(extract_json(raw_text)),
        "price_data":      price_data,
        "payment_hash":    payment_hash,
        "operator_wallet": operator_address,
        "model":           req.model,
        "coin":            coin,
        "timeframe":       req.timeframe,
        "timestamp":       timestamp,
        "wallet":          req.wallet,
        "explorer_url":    explorer_url,
        "demo":            False,
    }


@app.get("/health")
async def health():
    return {"status": "ok", "mode": "operator-pays+realtime", "ready": llm_client is not None}

@app.get("/models")
async def list_models():
    return {"models": [
        {"id": "claude", "name": "Claude Sonnet 4.6",  "provider": "Anthropic (OpenGradient TEE)"},
        {"id": "gpt5",   "name": "GPT-5",              "provider": "OpenAI (OpenGradient TEE)"},
        {"id": "gpt4",   "name": "GPT-4.1",            "provider": "OpenAI (OpenGradient TEE)"},
    ]}
