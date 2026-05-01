# Corsica Poker RTP Summary

## Scope
This RTP summary covers the standard hand bets and tie bets settled by the server `/settle` endpoint. Jackpot side bets are excluded because they follow a separate pool-based mechanic and are not part of the normal quoted-odds settlement flow.

## Pricing formula in code
The server prices every normal bet from the exact probability computed for the current game state:

- `fair_odds = 1 / probability`
- `quoted_odds = round(fair_odds * (1 - margin), 2)`
- `margin = 0.05`

The current implementation in `server/server.js` is:

```js
function oddsValue(prob) {
  if (!prob || prob <= 0) return 0;
  const fair = 1 / prob;
  return Math.round((fair * (1 - MARGIN)) * 100) / 100;
}
```

## RTP result
For any standard bet priced from this formula, the theoretical RTP before rounding is:

- `RTP = probability * fair_odds * (1 - margin)`
- `RTP = 1 - margin`
- `RTP = 0.95`

So the target RTP of every standard quoted bet is **95.00%**.

Because quoted odds are rounded to 2 decimals, the realized RTP of an individual bet can vary slightly around that target. In practice the RTP stays very close to 95.00%.

## Sample values
- Probability 50.00% → quoted odds 1.90 → RTP 95.00%
- Probability 25.00% → quoted odds 3.80 → RTP 95.00%
- Probability 10.00% → quoted odds 9.50 → RTP 95.00%
- Probability 2.00% → quoted odds 47.50 → RTP 95.00%

## Audit note
This RTP model is dynamic: odds are recomputed from the exact current win/tie probability of the selected target at each betting phase. Therefore the standard bet RTP remains anchored to the configured margin rather than to a fixed paytable.
