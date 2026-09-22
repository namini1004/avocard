# Card choice redesign

## Product decision

The default journey favors a card people can keep using without reorganizing their spending.
Maximum picking rates remain a short acquisition section, explicitly tied to the required
spend and conditions. They are not personalized predictions or measured popularity.

The main comparison uses monthly net benefit after annual fee, recurring qualifying spend,
and concrete maintenance conditions. There is no opaque weighted recommendation score.
Easy mode selects cards with an unrestricted domestic base reward and no performance minimum.
Lifestyle mode ranks all eligible cards by the same actual input budget and net benefit.
A conditional card shows its incremental monthly benefit over the best eligible easy card
only when that baseline exists.

## Calculation boundaries

- Calculation and source metadata stay in server modules; the browser receives public results.
- No assumed share of weekend, night, or branded spending is assigned in the new flow.
- Users explicitly choose merchants, eligible timing, payment count and automatic payment.
- Unassigned money is general domestic spending; amounts are never increased to reach a threshold.
- Monthly category amounts are divided into the user's stated number of different-day payments.
- Unknown merchant eligibility is not automatically granted.
- Existing tier, category, shared cap and performance-weight rules remain the calculation engine.
- Gross rewards cannot be negative. Net benefits are displayed at zero when fees outweigh them,
  with the unrecovered fee shown separately.
- The maximum illustration uses the existing 300,000-1,200,000 won search range.
- Current executable data covers five cards. The large collected dataset is not treated as
  calculation-ready; this UI change does not reverify issuance status or expand the data catalog.
- Daily/merchant restrictions not fully represented in the existing engine and varying transaction
  amounts still limit precision. The result is an estimate from stated conditions, not a guarantee.

## Research

CardGorilla's 2026 selection-benefit trend report supports offering convenience and lifestyle
choices, but does not establish that all users prefer the same card:
https://www.card-gorilla.com/contents/detail/4317

## Checks

- node --experimental-strip-types scripts/validate-discovery.mjs
- npm run validate:verified:portable
- npm run build:portable
