import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { cards } from "../data/cards.ts";
import { analyzeCard, defaultProfile } from "../lib/calculate.ts";

const root = process.cwd();
const outDir = path.join(root, "data", "local-db");
const generatedAt = new Date().toISOString();

const spendScenarios = [
  { scenario_id: "balanced_30", profile_name: "균형 30만원", monthly_spend: 300000 },
  { scenario_id: "balanced_50", profile_name: "균형 50만원", monthly_spend: 500000 },
  { scenario_id: "balanced_70", profile_name: "균형 70만원", monthly_spend: 700000 },
  { scenario_id: "balanced_100", profile_name: "균형 100만원", monthly_spend: 1000000 },
  { scenario_id: "balanced_120", profile_name: "균형 120만원", monthly_spend: 1200000 }
];

const dataDictionary = [
  ["cards", "card_id", "text", "Y", "내부 카드 ID"],
  ["cards", "source_card_id", "text", "N", "원본 서비스 카드 ID"],
  ["cards", "card_name", "text", "Y", "카드명"],
  ["cards", "issuer", "text", "Y", "카드사"],
  ["cards", "card_type", "text", "Y", "credit/check"],
  ["cards", "status", "text", "Y", "active/discontinued/unknown"],
  ["cards", "review_status", "text", "Y", "draft/needs_review/verified"],
  ["cards", "summary", "text", "N", "카드 요약"],
  ["cards", "annual_fee", "integer", "N", "대표 연회비"],
  ["cards", "previous_spend", "integer", "N", "대표 전월실적"],
  ["cards", "advertised_benefit", "text", "N", "광고/요약 혜택 문구"],
  ["cards", "monthly_cap", "integer", "N", "대표 월 통합한도. 구간형 카드는 최대 구간 한도"],
  ["cards", "last_verified_at", "date", "N", "마지막 검증일"],
  ["cards", "best_for", "text", "N", "추천 소비 유형"],
  ["cards", "cautions", "text", "N", "주의사항"],
  ["cards", "strengths", "text", "N", "장점"],
  ["cards", "weaknesses", "text", "N", "단점"],
  ["card_sources", "source_id", "text", "Y", "출처 ID"],
  ["card_sources", "card_id", "text", "Y", "카드 ID"],
  ["card_sources", "source_type", "text", "Y", "issuer_page/issuer_pdf/public_disclosure/editorial_reference 등"],
  ["card_sources", "source_title", "text", "N", "출처 제목"],
  ["card_sources", "source_url", "text", "Y", "출처 URL"],
  ["card_sources", "captured_at", "datetime", "N", "수집 시각"],
  ["card_performance_rules", "performance_rule_id", "text", "Y", "실적 조건 ID"],
  ["card_performance_rules", "card_id", "text", "Y", "카드 ID"],
  ["card_performance_rules", "base_spend_amount", "integer", "N", "전월실적 금액"],
  ["card_performance_rules", "base_spend_period", "text", "N", "직전 1개월 등"],
  ["card_performance_rules", "base_spend_method", "text", "N", "합계/평균"],
  ["card_performance_rules", "discounted_spend_counts_for_performance", "text", "N", "할인 매출 실적 포함 여부"],
  ["card_performance_rules", "discounted_spend_count_ratio", "decimal", "N", "할인 매출 실적 반영률"],
  ["card_cap_tiers", "tier_id", "text", "Y", "한도 구간 ID"],
  ["card_cap_tiers", "card_id", "text", "Y", "카드 ID"],
  ["card_cap_tiers", "min_spend", "integer", "Y", "구간 최소 사용액"],
  ["card_cap_tiers", "max_spend", "integer", "N", "구간 최대 사용액. null이면 이상"],
  ["card_cap_tiers", "total_monthly_cap", "integer", "Y", "해당 구간 통합 월 한도"],
  ["card_cap_tiers", "tier_label", "text", "N", "구간 표시명"],
  ["card_cap_tiers", "channel_caps", "json_text", "N", "온라인/오프라인 등 채널별 한도"],
  ["card_benefit_rules", "benefit_id", "text", "Y", "혜택 규칙 ID"],
  ["card_benefit_rules", "card_id", "text", "Y", "카드 ID"],
  ["card_benefit_rules", "category", "text", "Y", "혜택 카테고리"],
  ["card_benefit_rules", "benefit_name", "text", "Y", "혜택명"],
  ["card_benefit_rules", "reward_type", "text", "Y", "discount/cashback/point/mileage"],
  ["card_benefit_rules", "reward_rate", "decimal", "N", "혜택률"],
  ["card_benefit_rules", "fixed_reward_amount", "integer", "N", "정액 혜택"],
  ["card_benefit_rules", "monthly_cap", "integer", "N", "개별 혜택 월 한도"],
  ["card_benefit_rules", "min_transaction_amount", "integer", "N", "건당 최소 결제액"],
  ["card_benefit_rules", "previous_month_spend_required", "integer", "N", "혜택별 실적 조건"],
  ["card_benefit_rules", "merchant_scope", "text", "N", "적용 가맹점/범위"],
  ["card_benefit_rules", "discounted_spend_counts_for_performance", "text", "N", "실적 포함 여부"],
  ["card_cap_groups", "cap_group_id", "text", "Y", "한도 그룹 ID"],
  ["card_cap_groups", "card_id", "text", "Y", "카드 ID"],
  ["card_cap_groups", "group_name", "text", "Y", "한도 그룹명"],
  ["card_cap_groups", "tier_id", "text", "N", "연결 한도 구간"],
  ["card_cap_groups", "group_monthly_cap", "integer", "N", "그룹 월 한도"],
  ["card_cap_groups", "included_benefit_ids", "text", "N", "그룹에 묶인 혜택 ID 목록"],
  ["card_cap_groups", "is_separate_from_main_cap", "boolean", "Y", "통합한도와 별도 여부"],
  ["card_exclusions", "exclusion_id", "text", "Y", "제외조건 ID"],
  ["card_exclusions", "card_id", "text", "Y", "카드 ID"],
  ["card_exclusions", "scope", "text", "Y", "performance/benefit/common"],
  ["card_exclusions", "item", "text", "Y", "제외 항목"],
  ["card_raw_snapshots", "snapshot_id", "text", "Y", "원본 스냅샷 ID"],
  ["card_raw_snapshots", "card_id", "text", "Y", "카드 ID"],
  ["card_raw_snapshots", "raw_source", "text", "N", "원본 종류"],
  ["card_raw_snapshots", "raw_url", "text", "N", "원본 URL"],
  ["card_raw_snapshots", "raw_text_hash", "text", "N", "원문 해시"],
  ["card_calculation_summaries", "calculation_id", "text", "Y", "계산 요약 ID"],
  ["card_calculation_summaries", "card_id", "text", "Y", "카드 ID"],
  ["card_calculation_summaries", "scenario_id", "text", "Y", "소비 시나리오 ID"],
  ["card_calculation_summaries", "monthly_spend", "integer", "Y", "월 사용액"],
  ["card_calculation_summaries", "applied_tier_id", "text", "N", "적용 한도 구간 ID"],
  ["card_calculation_summaries", "gross_monthly_saving", "integer", "N", "연회비 차감 전 월 혜택"],
  ["card_calculation_summaries", "monthly_fee", "integer", "N", "연회비 월할"],
  ["card_calculation_summaries", "net_monthly_saving", "integer", "N", "월 순혜택"],
  ["card_calculation_summaries", "picking_rate", "decimal", "N", "순혜택 기준 피킹률"],
  ["card_calculation_summaries", "calculation_status", "text", "Y", "calculable/partial/manual_required"]
];

function csvCell(value) {
  if (value === null || value === undefined) return "";
  if (Array.isArray(value)) {
    const hasObject = value.some((item) => item !== null && typeof item === "object");
    return csvCell(hasObject ? JSON.stringify(value) : value.join(" | "));
  }
  if (typeof value === "object") return csvCell(JSON.stringify(value));
  return `"${String(value).replaceAll('"', '""').replace(/\r?\n/g, " ").trim()}"`;
}

function writeCsv(name, headers, rows) {
  const content = [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\n") + "\n";
  return writeFile(path.join(outDir, name), content, "utf8");
}

function sourceCardId(card) {
  const match = card.slug.match(/(\d+)$/);
  return match ? match[1] : "";
}

function tierId(card, tier, index) {
  return `${card.slug}-tier-${index + 1}-${tier.minSpend}`;
}

function buildProfile(total) {
  const categories = Object.keys(defaultProfile).filter((key) => key !== "total");
  const categoryTotal = categories.reduce((sum, category) => sum + (defaultProfile[category] ?? 0), 0);
  const profile = { ...defaultProfile, total };
  for (const category of categories) {
    profile[category] = Math.round(((defaultProfile[category] ?? 0) / categoryTotal) * total);
  }
  const normalized = categories.reduce((sum, category) => sum + profile[category], 0);
  profile.etc += total - normalized;
  return profile;
}

await mkdir(outDir, { recursive: true });

const cardRows = [];
const sourceRows = [];
const performanceRows = [];
const capTierRows = [];
const benefitRows = [];
const capGroupRows = [];
const exclusionRows = [];
const rawSnapshotRows = [];
const calculationRows = [];

for (const card of cards) {
  const cardId = card.slug;
  cardRows.push([
    cardId,
    sourceCardId(card),
    card.name,
    card.issuer,
    card.cardType,
    card.status,
    card.reviewStatus,
    card.summary,
    card.annualFee,
    card.previousSpend,
    card.advertisedBenefit,
    card.monthlyCap,
    card.lastVerifiedAt,
    card.bestFor,
    card.cautions,
    card.strengths,
    card.weaknesses,
    generatedAt
  ]);

  card.sourceUrls.forEach((source, index) => {
    sourceRows.push([
      `${cardId}-source-${index + 1}`,
      cardId,
      source.type,
      source.title,
      source.url,
      source.capturedAt ?? "",
      generatedAt
    ]);
  });

  performanceRows.push([
    `${cardId}-performance-1`,
    cardId,
    card.previousSpend,
    "직전 1개월",
    "합계",
    "unknown",
    "",
    card.cautions.join(" | "),
    generatedAt
  ]);

  const tiers = card.monthlyCapTiers?.length
    ? card.monthlyCapTiers
    : [{ minSpend: card.previousSpend, totalCap: card.monthlyCap, label: card.previousSpend ? `${Math.round(card.previousSpend / 10000)}만원 이상` : "실적 조건 없음" }];

  tiers.forEach((tier, index) => {
    const id = tierId(card, tier, index);
    capTierRows.push([
      id,
      cardId,
      tier.minSpend,
      tier.maxSpend ?? "",
      tier.totalCap,
      tier.label,
      tier.channelCaps ?? "",
      "month",
      generatedAt
    ]);

    capGroupRows.push([
      `${id}-main-cap`,
      cardId,
      "main_monthly_cap",
      id,
      tier.totalCap,
      card.benefitRules.map((rule) => rule.id).join(" | "),
      "false",
      generatedAt
    ]);
  });

  card.benefitRules.forEach((rule) => {
    benefitRows.push([
      rule.id,
      cardId,
      rule.category,
      rule.label,
      rule.rewardType,
      rule.rate ?? "",
      rule.fixedAmount ?? "",
      rule.monthlyCap,
      rule.minTransactionAmount ?? "",
      rule.previousMonthSpendRequired,
      rule.merchantScope,
      rule.discountedSpendCountsForPerformance,
      rule.performanceBand ?? "",
      rule.excludedItems,
      rule.note,
      generatedAt
    ]);

    rule.excludedItems.forEach((item, index) => {
      exclusionRows.push([
        `${rule.id}-exclusion-${index + 1}`,
        cardId,
        "benefit",
        item,
        rule.id,
        generatedAt
      ]);
    });
  });

  card.excluded.forEach((item, index) => {
    exclusionRows.push([
      `${cardId}-common-exclusion-${index + 1}`,
      cardId,
      "common",
      item,
      "",
      generatedAt
    ]);
  });

  rawSnapshotRows.push([
    `${cardId}-raw-1`,
    cardId,
    "collected_cards_ts",
    card.sourceUrls[0]?.url ?? "",
    "",
    "data/collected-cards.ts",
    generatedAt
  ]);

  for (const scenario of spendScenarios) {
    const analysis = analyzeCard(card, buildProfile(scenario.monthly_spend));
    const appliedTier = analysis.appliedMonthlyCapTier;
    const appliedTierIndex = tiers.findIndex(
      (tier) =>
        tier.minSpend === appliedTier?.minSpend &&
        (tier.maxSpend ?? "") === (appliedTier?.maxSpend ?? "") &&
        tier.totalCap === appliedTier?.totalCap
    );
    calculationRows.push([
      `${cardId}-${scenario.scenario_id}`,
      cardId,
      scenario.scenario_id,
      scenario.profile_name,
      scenario.monthly_spend,
      appliedTierIndex >= 0 ? tierId(card, tiers[appliedTierIndex], appliedTierIndex) : "",
      analysis.grossMonthlySaving,
      analysis.monthlyFee,
      analysis.monthlySaving,
      Number(analysis.pickingRate.toFixed(4)),
      analysis.effectiveMonthlyCap,
      analysis.matchedBenefit,
      analysis.appliedMonthlyCapTier ? "calculable" : "partial",
      generatedAt
    ]);
  }
}

await Promise.all([
  writeCsv("data_dictionary.csv", ["table_name", "column_name", "data_type", "required", "description"], dataDictionary),
  writeCsv(
    "cards.csv",
    [
      "card_id",
      "source_card_id",
      "card_name",
      "issuer",
      "card_type",
      "status",
      "review_status",
      "summary",
      "annual_fee",
      "previous_spend",
      "advertised_benefit",
      "monthly_cap",
      "last_verified_at",
      "best_for",
      "cautions",
      "strengths",
      "weaknesses",
      "exported_at"
    ],
    cardRows
  ),
  writeCsv("card_sources.csv", ["source_id", "card_id", "source_type", "source_title", "source_url", "captured_at", "exported_at"], sourceRows),
  writeCsv(
    "card_performance_rules.csv",
    [
      "performance_rule_id",
      "card_id",
      "base_spend_amount",
      "base_spend_period",
      "base_spend_method",
      "discounted_spend_counts_for_performance",
      "discounted_spend_count_ratio",
      "base_spend_description",
      "exported_at"
    ],
    performanceRows
  ),
  writeCsv(
    "card_cap_tiers.csv",
    ["tier_id", "card_id", "min_spend", "max_spend", "total_monthly_cap", "tier_label", "channel_caps", "cap_period", "exported_at"],
    capTierRows
  ),
  writeCsv(
    "card_benefit_rules.csv",
    [
      "benefit_id",
      "card_id",
      "category",
      "benefit_name",
      "reward_type",
      "reward_rate",
      "fixed_reward_amount",
      "monthly_cap",
      "min_transaction_amount",
      "previous_month_spend_required",
      "merchant_scope",
      "discounted_spend_counts_for_performance",
      "performance_band",
      "excluded_items",
      "note",
      "exported_at"
    ],
    benefitRows
  ),
  writeCsv(
    "card_cap_groups.csv",
    ["cap_group_id", "card_id", "group_name", "tier_id", "group_monthly_cap", "included_benefit_ids", "is_separate_from_main_cap", "exported_at"],
    capGroupRows
  ),
  writeCsv("card_exclusions.csv", ["exclusion_id", "card_id", "scope", "item", "benefit_id", "exported_at"], exclusionRows),
  writeCsv("card_raw_snapshots.csv", ["snapshot_id", "card_id", "raw_source", "raw_url", "raw_text_hash", "raw_path", "exported_at"], rawSnapshotRows),
  writeCsv(
    "card_calculation_summaries.csv",
    [
      "calculation_id",
      "card_id",
      "scenario_id",
      "profile_name",
      "monthly_spend",
      "applied_tier_id",
      "gross_monthly_saving",
      "monthly_fee",
      "net_monthly_saving",
      "picking_rate",
      "effective_monthly_cap",
      "matched_benefit",
      "calculation_status",
      "exported_at"
    ],
    calculationRows
  )
]);

await writeFile(
  path.join(outDir, "README.md"),
  `# Avocard Local CSV DB\n\nGenerated at: ${generatedAt}\n\nThis folder is a local CSV-style database export for future import into PostgreSQL/Supabase/BigQuery.\n\nCore import order:\n1. cards.csv\n2. card_sources.csv\n3. card_performance_rules.csv\n4. card_cap_tiers.csv\n5. card_benefit_rules.csv\n6. card_cap_groups.csv\n7. card_exclusions.csv\n8. card_raw_snapshots.csv\n9. card_calculation_summaries.csv\n\nUse data_dictionary.csv as the column contract.\n`,
  "utf8"
);

console.log(
  JSON.stringify(
    {
      outDir,
      cards: cardRows.length,
      sources: sourceRows.length,
      performanceRules: performanceRows.length,
      capTiers: capTierRows.length,
      benefitRules: benefitRows.length,
      capGroups: capGroupRows.length,
      exclusions: exclusionRows.length,
      rawSnapshots: rawSnapshotRows.length,
      calculationSummaries: calculationRows.length
    },
    null,
    2
  )
);
