
def calculate_risk(price_usd, change_24h_pct):
    if price_usd is None:
        return {
            "score": None,
            "level": "Unknown",
            "signals": ["Price data unavailable"],
        }

    # Measure distance from the $1 target in basis points.
    deviation_bps = abs(price_usd - 1.0) * 10_000
    peg_risk = min(deviation_bps / 50.0, 1.0) * 100

    # Missing change data is not treated as zero risk.
    if change_24h_pct is None:
        movement_risk = None
        score = round(peg_risk)
    else:
        movement_risk = min(abs(change_24h_pct), 1.0) * 100
        score = round(0.8 * peg_risk + 0.2 * movement_risk)

    if score >= 70:
        level = "High"
    elif score >= 35:
        level = "Moderate"
    else:
        level = "Low"

    signals = []

    if deviation_bps >= 10:
        signals.append("Price deviation detected")

    if movement_risk is not None and movement_risk >= 50:
        signals.append("Large 24-hour price movement detected")

    if not signals:
        signals.append("No major price-based warning detected")

    return {
        "score": score,
        "level": level,
        "deviation_bps": round(deviation_bps, 2),
        "signals": signals,
    }
