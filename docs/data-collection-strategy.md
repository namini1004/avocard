# Avocard Data Collection Strategy

Avocard should not publish a card as "verified" until the card has both an official issuer product page and an official product guide or terms PDF. Public disclosure and editorial sites can help discover candidates, but they should not be the final source for benefit rules.

## Coverage Goal

The first production-quality target is 100 popular cards:

- 10 issuer groups
- 10 benefit-purpose buckets per issuer
- 100 official-source collection targets total

The target slots are defined in `data/official-sources.ts` as `popularCoverageTargets`.

## Source Priority

1. Issuer product page: card name, issue status, headline benefit, product guide link
2. Issuer PDF or terms: previous-month spend, monthly caps, exclusions, cautions
3. Public disclosure source: candidate discovery and cross-checking
4. Editorial/reference sites: popularity discovery only
5. User reports: change alerts and review queue only

## Pipeline

1. `discover`: find card candidates from official issuer pages and public disclosure sources
2. `fetch`: save raw HTML/PDF, HTTP status, captured time, and content hash
3. `extract`: extract annual fee, previous spend, cap, exclusions, and benefit sentences
4. `normalize`: convert benefit sentences into `BenefitRule`
5. `validate`: check official sources, rule completeness, caps, spend conditions, duplicates
6. `calculate`: preview monthly saving, annual saving, and picking rate
7. `review`: human editor verifies against the official source
8. `monitor`: detect source hash changes and move affected cards to `needs_review`

## Publish Rule

Only cards with `reviewStatus: "verified"` should be treated as real production data. Prototype cards may remain in the app for UI development, but they must stay `draft` until official card-specific sources are attached.

## Commands

```bash
npm run validate:data:portable
npm run validate:sources:portable
npm run build:portable
```

`validate:sources` enforces the 100-card source coverage plan. `validate:data` checks card-level data quality.
