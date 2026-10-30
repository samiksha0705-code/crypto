
import os
from datetime import datetime, timezone

import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.services.market_data import fetch_market_data
from app.services.risk_engine import calculate_risk


app = FastAPI(
    title="PegGuard AI API",
    description="Stablecoin monitoring and risk intelligence",
    version="0.1.0",
)

# Allow the local Next.js frontend to access the API.
_extra_origins = [
    o.strip().rstrip("/")
    for o in os.getenv("ALLOWED_ORIGINS", "").split(",")
    if o.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        *_extra_origins,
    ],
    # Also allow Vercel deployment URLs (production + previews).
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=False,
    allow_methods=["GET"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "service": "PegGuard AI",
    }


@app.get("/api/v1/stablecoins")
async def get_stablecoins():
    try:
        coins = await fetch_market_data()

    except httpx.HTTPStatusError as exc:
        raise HTTPException(
            status_code=502,
            detail=(
                "Market data provider returned "
                f"HTTP {exc.response.status_code}"
            ),
        ) from exc

    except httpx.RequestError as exc:
        raise HTTPException(
            status_code=503,
            detail="Unable to connect to market data provider",
        ) from exc

    assets = []

    for coin in coins:
        risk = calculate_risk(
            coin.get("price_usd"),
            coin.get("change_24h_pct"),
        )

        assets.append({
            **coin,
            "risk": risk,
        })

    return {
        "observed_at": datetime.now(timezone.utc).isoformat(),
        "count": len(assets),
        "assets": assets,
        "model_version": "heuristic-v1",
    }
