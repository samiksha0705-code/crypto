
import httpx

from app.config import COINGECKO_API_KEY, COINGECKO_BASE_URL

STABLECOINS = {
    "tether": {"symbol": "USDT", "name": "Tether"},
    "usd-coin": {"symbol": "USDC", "name": "USD Coin"},
    "dai": {"symbol": "DAI", "name": "Dai"},
}


async def fetch_market_data():
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
