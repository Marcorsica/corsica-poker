# Corsica Poker Certification Backend Notes

## Fairness reveal
The backend now exposes a dedicated endpoint:

- `GET /fairness/reveal?gameId=...`

Behavior:
- before settlement: returns HTTP 409 with `Fairness reveal unavailable before settlement` and current fairness status
- after settlement: returns the revealed `serverSeed`, the committed hash, deck commitment, full revealed deck, dealt hands, revealed board, and a `verification: reproducible` flag

## Verification endpoint
The backend keeps:

- `GET /fairness/verify?gameId=...`

This endpoint reconstructs the full deck from the revealed values and checks:
- `serverSeedHashMatches`
- `deckCommitmentMatches`
- `revealedDeckMatches`

## RTP endpoint
The backend now exposes:

- `GET /rtp`

This returns the configured margin, pricing formula, RTP target, rounding notes, and sample values for the standard settlement model.
