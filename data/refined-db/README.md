# Avocard Refined Card Data Pipeline

Generated at: 2026-06-11T13:04:13.065Z

This folder is generated from raw Naver collector data and snapshot HTML. It is the precision-refinement layer before importing into an online DB.

Main files:
- refined_cards.csv
- refined_performance_rules.csv
- refined_cap_tiers.csv
- refined_benefit_rules.csv
- refined_cap_groups.csv
- refined_exclusions.csv
- refined_text_blocks.csv
- refined_review_queue.csv
- refined_raw_snapshots.csv
- refinement_summary.json

Use refined_review_queue.csv first. Cards marked manual_required or partial_review should not be trusted for production ranking without review.
