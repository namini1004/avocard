# External Picking Rate Benchmarks

This folder stores third-party picking-rate observations used to validate Avocard's calculated card data.

External community/service values are not treated as source-of-truth card terms. They are benchmark signals used to detect suspicious gaps in our parsed rules, caps, spend tiers, or annual-fee handling.

## Files

- `source-registry.csv`: allowed external sources and trust weights.
- `benchmarks.csv`: individual picking-rate observations.
- `validation-report.csv`: generated comparison report.
- `validation-summary.json`: generated aggregate summary.

## Benchmark Rules

Add a row only when the external page provides enough context to compare:

- card name or Avocard `card_slug`
- monthly spend amount
- observed monthly benefit or observed picking rate
- whether annual fee was included
- source permalink
- calculation basis or spend profile

Use `spend_profile_json` when the external source has category-specific spend. Example:

```json
{"total":700000,"coffee":100000,"transport":80000,"telecom":60000,"shopping":150000}
```

If category spend is unknown, the validator scales Avocard's default profile to `observed_spend`.

## Status Meaning

- `pass`: Avocard is within 0.30 percentage points.
- `watch`: Avocard differs by 0.30 to 0.80 percentage points.
- `fail`: Avocard differs by more than 0.80 percentage points.
- `card_not_found`: benchmark card could not be matched.
- `insufficient_observation`: benchmark row lacks a comparable observed benefit/rate.
