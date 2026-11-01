
import asyncio
import time

import httpx

from app.config import COINGECKO_API_KEY, COINGECKO_BASE_URL

STABLECOINS = {
    "tether": {"symbol": "USDT", "name": "Tether"},
    "usd-coin": {"symbol": "USDC", "name": "USD Coin"},
    "dai": {"symbol": "DAI", "name": "Dai"},
}

# Cache results so every page view doesn't hit CoinGecko (avoids HTTP 429).
CACHE_TTL_SECONDS = 60
_cache = {"data": None, "fetched_at": 0.0}
_lock = asyncio.Lock()


async def _fetch_from_provider():
    url = f"{COINGECKO_BASE_URL}/coins/markets"

    params = {
        "vs_currency": "usd",
        "ids": ",".join(STABLECOINS.keys()),
        "price_change_percentage": "24h",
    }

    headers = {}
    if COINGECKO_API_KEY:
        headers["x-cg-demo-api-key"] = COINGECKO_API_KEY

    async with httpx.AsyncClient(timeout=20.0) as client:
        response = await client.get(
            url,
            params=params,
            headers=headers,
        )
        response.raise_for_status()
        records = response.json()

    results = []

    for coin in records:
        metadata = STABLECOINS.get(coin["id"])
        if not metadata:
            continue

        results.append({
            "id": coin["id"],
            "name": metadata["name"],
            "symbol": metadata["symbol"],
            "price_usd": coin.get("current_price"),
            "market_cap_usd": coin.get("market_cap"),
            "volume_24h_usd": coin.get("total_volume"),
            "change_24h_pct": coin.get(
                "price_change_percentage_24h"
            ),
            "last_updated": coin.get("last_updated"),
        })

    return results


async def fetch_market_data():
    async with _lock:
        age = time.monotonic() - _cache["fetched_at"]
        if _cache["data"] is not None and age < CACHE_TTL_SECONDS:
            return _cache["data"]

        try:
            data = await _fetch_from_provider()
        except (httpx.HTTPStatusError, httpx.RequestError):
            # Serve the last good data if we have it; otherwise re-raise.
            if _cache["data"] is not None:
                return _cache["data"]
            raise

        _cache["data"] = data
        _cache["fetched_at"] = time.monotonic()
        return data
