import type {
  BenefitCategory,
  CardCapTier,
  ScenarioTransaction,
  SpendingProfile,
  VerifiedBenefitRule,
  VerifiedCard
} from "../data/verified-card-types.ts";
import { benefitCategories, categoryLabels } from "../data/verified-card-types.ts";

export const defaultProfile: SpendingProfile = {
  total: 700000,
  transport: 60000,
  taxi: 20000,
  fuel: 50000,
  coffee: 40000,
  convenience: 30000,
  delivery: 50000,
  dining: 70000,
  shopping: 100000,
  mart: 60000,
  telecom: 60000,
  ott: 20000,
  medical: 20000,
  education: 0,
  travel: 0,
  etc: 120000
};

type RuleSaving = {
  id: string;
  label: string;
  spend: number;
  transactionCount: number;
  savingBeforeCaps: number;
  saving: number;
  effectiveCap: number | null;
};

export type MonthlyCalculation = {
  currentSpend: number;
  previousQualifyingSpend: number;
  grossBenefit: number;
  monthlyFee: number;
  netBenefitBeforeFloor: number;
  netBenefit: number;
  grossPickingRate: number;
  pickingRate: number;
  appliedTier: CardCapTier | null;
  activatedBonusLabels: string[];
  ruleSavings: RuleSaving[];
};

export type VerifiedCardAnalysis = {
  card: VerifiedCard;
  profile: SpendingProfile;
  transactions: ScenarioTransaction[];
  potential: MonthlyCalculation;
  sustainable: MonthlyCalculation;
  nextQualifyingSpend: number;
  annualSaving: number;
  pickingRate: number;
  reason: string;
  assumptionSummary: string[];
};

export type MaximumScenarioAllocation = {
  category: BenefitCategory;
  label: string;
  amount: number;
  share: number;
};

export type MaximumCardScenario = {
  card: VerifiedCard;
  transactions: ScenarioTransaction[];
  calculation: MonthlyCalculation;
  totalSpend: number;
  nextQualifyingSpend: number;
  annualSaving: number;
  pickingRate: number;
  allocation: MaximumScenarioAllocation[];
  keyBenefitLabels: string[];
  difficulty: "easy" | "moderate" | "hard";
  difficultyLabel: string;
  reason: string;
  assumptionSummary: string[];
};

export const maximumScenarioRange = {
  min: 300000,
  max: 1200000
} as const;

type Segment = {
  share: number;
  tags: string[];
  channel?: ScenarioTransaction["channel"];
  merchant?: string;
};

const transactionUnits: Record<BenefitCategory, number> = {
  transport: 20000,
  taxi: 15000,
  fuel: 60000,
  coffee: 10000,
  convenience: 10000,
  delivery: 25000,
  dining: 30000,
  shopping: 50000,
  mart: 50000,
  telecom: 60000,
  ott: 15000,
  medical: 30000,
  education: 100000,
  travel: 100000,
  etc: 50000
};

const categorySegments: Record<BenefitCategory, Segment[]> = {
  transport: [{ share: 1, tags: ["public_transport"], merchant: "버스·지하철" }],
  taxi: [
    { share: 0.5, tags: ["taxi", "night", "mr_life_night"], merchant: "택시" },
    { share: 0.5, tags: ["taxi"], merchant: "택시" }
  ],
  fuel: [
    { share: 0.38, tags: ["major_fuel", "weekend"], merchant: "4대 주유소" },
    { share: 0.47, tags: ["major_fuel"], merchant: "4대 주유소" },
    { share: 0.15, tags: [], merchant: "기타 주유소" }
  ],
  coffee: [
    { share: 0.15, tags: ["coffee_chain", "night", "mr_life_night"], merchant: "주요 커피전문점" },
    { share: 0.5, tags: ["coffee_chain"], merchant: "주요 커피전문점" },
    { share: 0.35, tags: [], merchant: "기타 카페" }
  ],
  convenience: [
    { share: 0.25, tags: ["gs25"], merchant: "GS25" },
    { share: 0.75, tags: [], merchant: "기타 편의점" }
  ],
  delivery: [
    { share: 0.9, tags: ["delivery_app"], channel: "online", merchant: "주요 배달앱" },
    { share: 0.1, tags: [], channel: "online", merchant: "기타 배달앱" }
  ],
  dining: [
    { share: 0.4, tags: ["night", "mr_life_night"], merchant: "야간 음식점" },
    { share: 0.6, tags: [], merchant: "음식점" }
  ],
  shopping: [
    {
      share: 0.25,
      tags: ["major_marketplace", "macao_shopping", "night", "mr_life_night"],
      channel: "online",
      merchant: "야간 주요 온라인몰"
    },
    {
      share: 0.45,
      tags: ["major_marketplace", "macao_shopping"],
      channel: "online",
      merchant: "주요 온라인몰"
    },
    {
      share: 0.1,
      tags: ["macao_shopping"],
      channel: "online",
      merchant: "기타 MACAO 대상몰"
    },
    { share: 0.2, tags: [], channel: "online", merchant: "기타 온라인몰" }
  ],
  mart: [
    {
      share: 0.3,
      tags: ["major_mart", "macao_shopping", "weekend"],
      merchant: "주말 3대 마트"
    },
    { share: 0.5, tags: ["major_mart", "macao_shopping"], merchant: "주요 마트" },
    { share: 0.2, tags: [], merchant: "기타 마트" }
  ],
  telecom: [{ share: 1, tags: ["auto_pay"], merchant: "이동통신 자동납부" }],
  ott: [{ share: 1, tags: [], channel: "online", merchant: "OTT·구독" }],
  medical: [{ share: 1, tags: [], merchant: "병원·약국" }],
  education: [{ share: 1, tags: [], merchant: "교육비" }],
  travel: [
    { share: 0.7, tags: ["overseas"], channel: "overseas", merchant: "해외 가맹점" },
    { share: 0.3, tags: [], merchant: "국내 여행" }
  ],
  etc: [{ share: 1, tags: [], merchant: "일반 가맹점" }]
};

export function formatWon(value: number) {
  return `${Math.round(value).toLocaleString("ko-KR")}원`;
}

export function formatPercent(value: number) {
  return `${value.toFixed(2)}%`;
}

function safeAmount(value: number) {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

function roundToThousand(value: number) {
  return Math.max(0, Math.round(value / 1000) * 1000);
}

export function normalizeProfile(profile: SpendingProfile): SpendingProfile {
  const total = roundToThousand(safeAmount(profile.total));
  const normalized = { ...profile, total };
  const categoryTotal = benefitCategories.reduce((sum, category) => sum + safeAmount(profile[category]), 0);

  if (categoryTotal <= total) {
    benefitCategories.forEach((category) => {
      normalized[category] = roundToThousand(safeAmount(profile[category]));
    });
    const roundedTotal = benefitCategories.reduce((sum, category) => sum + normalized[category], 0);
    normalized.etc += total - roundedTotal;
    return normalized;
  }

  const scale = categoryTotal > 0 ? total / categoryTotal : 0;
  benefitCategories.forEach((category) => {
    normalized[category] = roundToThousand(safeAmount(profile[category]) * scale);
  });
  const roundedTotal = benefitCategories.reduce((sum, category) => sum + normalized[category], 0);
  normalized.etc += total - roundedTotal;
  return normalized;
}

export function createRankingProfile(
  total: number,
  focus: "balanced" | BenefitCategory = "balanced"
): SpendingProfile {
  const profile = { ...defaultProfile, total };
  const baseTotal = benefitCategories.reduce((sum, category) => sum + defaultProfile[category], 0);

  benefitCategories.forEach((category) => {
    profile[category] = roundToThousand((defaultProfile[category] / baseTotal) * total);
  });

  if (focus !== "balanced") {
    const focusedAmount = roundToThousand(total * 0.35);
    const remaining = Math.max(0, total - focusedAmount);
    const otherTotal = benefitCategories
      .filter((category) => category !== focus)
      .reduce((sum, category) => sum + profile[category], 0);

    profile[focus] = focusedAmount;
    benefitCategories
      .filter((category) => category !== focus)
      .forEach((category) => {
        profile[category] =
          otherTotal > 0 ? roundToThousand((profile[category] / otherTotal) * remaining) : 0;
      });
  }

  return normalizeProfile(profile);
}

function segmentAmounts(amount: number, segments: Segment[]) {
  let allocated = 0;
  return segments.map((segment, index) => {
    const segmentAmount =
      index === segments.length - 1 ? amount - allocated : roundToThousand(amount * segment.share);
    allocated += segmentAmount;
    return { ...segment, amount: Math.max(0, segmentAmount) };
  });
}

function splitIntoTransactions(amount: number, unit: number) {
  if (amount <= 0) return [];
  const count = Math.max(1, Math.ceil(amount / unit));
  const base = Math.floor(amount / count / 1000) * 1000;
  let remaining = amount;

  return Array.from({ length: count }, (_, index) => {
    const chunk = index === count - 1 ? remaining : Math.min(remaining, base);
    remaining -= chunk;
    return chunk;
  }).filter((chunk) => chunk > 0);
}

export function buildScenarioTransactions(profile: SpendingProfile): ScenarioTransaction[] {
  const normalized = normalizeProfile(profile);
  const transactions: ScenarioTransaction[] = [];

  benefitCategories.forEach((category) => {
    const amount = normalized[category];
    const segments = segmentAmounts(amount, categorySegments[category]);

    segments.forEach((segment, segmentIndex) => {
      const chunks = splitIntoTransactions(segment.amount, transactionUnits[category]);
      chunks.forEach((chunk, chunkIndex) => {
        const channel = segment.channel ?? "offline";
        transactions.push({
          id: `${category}-${segmentIndex}-${chunkIndex}`,
          amount: chunk,
          category,
          channel,
          merchant: segment.merchant ?? categoryLabels[category],
          tags: Array.from(new Set([...segment.tags, channel]))
        });
      });
    });
  });

  return transactions;
}

function tagsMatch(transaction: ScenarioTransaction, required: string[] | undefined) {
  return !required || required.every((tag) => transaction.tags.includes(tag));
}

function appliesToCategory(rule: VerifiedBenefitRule, category: BenefitCategory) {
  return rule.appliesTo === "all" || rule.appliesTo.includes(category);
}

function ruleScopeMatches(rule: VerifiedBenefitRule, transaction: ScenarioTransaction) {
  return (
    appliesToCategory(rule, transaction.category) &&
    tagsMatch(transaction, rule.requiredTags) &&
    !(rule.excludedTags ?? []).some((tag) => transaction.tags.includes(tag))
  );
}

export function calculateQualifyingSpend(card: VerifiedCard, transactions: ScenarioTransaction[]) {
  return transactions.reduce((sum, transaction) => {
    if (card.performance.excludedTags.some((tag) => transaction.tags.includes(tag))) return sum;

    const matchingWeights = card.benefitRules
      .filter((rule) => rule.performanceWeight !== undefined && ruleScopeMatches(rule, transaction))
      .map((rule) => rule.performanceWeight as number);
    const categoryWeight = card.performance.categoryWeights?.[transaction.category];
    const weight =
      matchingWeights.length > 0
        ? Math.min(...matchingWeights)
        : categoryWeight ?? card.performance.defaultWeight;

    return sum + transaction.amount * Math.max(0, Math.min(1, weight));
  }, 0);
}

export function getApplicableTier(card: VerifiedCard, previousQualifyingSpend: number) {
  return (
    [...card.capTiers]
      .sort((a, b) => b.minPreviousSpend - a.minPreviousSpend)
      .find(
        (tier) =>
          previousQualifyingSpend >= tier.minPreviousSpend &&
          (tier.maxPreviousSpendExclusive === undefined ||
            previousQualifyingSpend < tier.maxPreviousSpendExclusive)
      ) ?? null
  );
}

function bonusConditionMet(
  condition: NonNullable<CardCapTier["bonusConditions"]>[number],
  previousTransactions: ScenarioTransaction[]
) {
  const count = previousTransactions.filter(
    (transaction) =>
      condition.categories.includes(transaction.category) &&
      transaction.amount >= condition.minTransactionAmount &&
      tagsMatch(transaction, condition.requiredTags)
  ).length;
  return count >= condition.minTransactionCount;
}

function resolveCaps(tier: CardCapTier | null, previousTransactions: ScenarioTransaction[]) {
  const groupCaps = { ...(tier?.groupCaps ?? {}) };
  const activatedBonusLabels: string[] = [];

  tier?.bonusConditions?.forEach((condition) => {
    if (bonusConditionMet(condition, previousTransactions)) {
      groupCaps[condition.capGroupId] = condition.totalCap;
      activatedBonusLabels.push(condition.label);
    }
  });

  return { groupCaps, activatedBonusLabels };
}

function matchingRewardBand(rule: VerifiedBenefitRule, amount: number) {
  return rule.rewardBands.find(
    (band) =>
      amount >= (band.minTransactionAmount ?? 0) &&
      (band.maxTransactionAmountExclusive === undefined ||
        amount < band.maxTransactionAmountExclusive)
  );
}

function calculateFormula(
  formula: VerifiedBenefitRule["rewardBands"][number]["formula"],
  amount: number
) {
  if (formula.kind === "rate") return amount * formula.rate;
  if (formula.kind === "fixed") return Math.min(amount, formula.amount);
  return (amount / formula.assumedPricePerLiter) * formula.wonPerLiter;
}

function ruleMonthlyCap(
  rule: VerifiedBenefitRule,
  tier: CardCapTier | null,
  previousQualifyingSpend: number
) {
  const candidates: number[] = [];
  if (rule.monthlyCap !== undefined) candidates.push(rule.monthlyCap);
  if (tier?.ruleCaps?.[rule.id] !== undefined) candidates.push(tier.ruleCaps[rule.id]);

  const ruleTier = rule.monthlyCapTiers?.find(
    (item) =>
      previousQualifyingSpend >= item.minPreviousSpend &&
      (item.maxPreviousSpendExclusive === undefined ||
        previousQualifyingSpend < item.maxPreviousSpendExclusive)
  );
  if (ruleTier) candidates.push(ruleTier.monthlyCap);
  return candidates.length > 0 ? Math.min(...candidates) : null;
}

function transactionCategorySpend(
  transactions: ScenarioTransaction[],
  rule: VerifiedBenefitRule
) {
  return transactions
    .filter((transaction) => appliesToCategory(rule, transaction.category))
    .reduce((sum, transaction) => sum + transaction.amount, 0);
}

export function calculateMonth(
  card: VerifiedCard,
  currentTransactions: ScenarioTransaction[],
  previousTransactions: ScenarioTransaction[]
): MonthlyCalculation {
  const currentSpend = currentTransactions.reduce((sum, transaction) => sum + transaction.amount, 0);
  const previousQualifyingSpend = calculateQualifyingSpend(card, previousTransactions);
  const appliedTier = getApplicableTier(card, previousQualifyingSpend);
  const { groupCaps, activatedBonusLabels } = resolveCaps(appliedTier, previousTransactions);
  const ruleApplied = new Map<string, number>();
  const ruleBeforeCaps = new Map<string, number>();
  const ruleSpend = new Map<string, number>();
  const ruleCount = new Map<string, number>();
  const groupApplied = new Map<string, number>();
  let mainTotalApplied = 0;

  currentTransactions.forEach((transaction) => {
    if (card.excludedBenefitTags.some((tag) => transaction.tags.includes(tag))) return;

    const candidates = card.benefitRules
      .filter((rule) => {
        if (!ruleScopeMatches(rule, transaction)) return false;
        if (previousQualifyingSpend < (rule.minPreviousSpend ?? 0)) return false;
        if (
          rule.monthlyCategorySpendMin !== undefined &&
          transactionCategorySpend(currentTransactions, rule) < rule.monthlyCategorySpendMin
        ) {
          return false;
        }
        if ((ruleCount.get(rule.id) ?? 0) >= (rule.monthlyCountCap ?? Number.POSITIVE_INFINITY)) {
          return false;
        }
        return Boolean(matchingRewardBand(rule, transaction.amount));
      })
      .map((rule) => {
        const band = matchingRewardBand(rule, transaction.amount);
        const raw = band ? calculateFormula(band.formula, transaction.amount) : 0;
        return {
          rule,
          raw: Math.min(raw, rule.perTransactionCap ?? Number.POSITIVE_INFINITY)
        };
      })
      .filter((candidate) => candidate.raw > 0)
      .sort(
        (a, b) =>
          b.raw - a.raw ||
          (b.rule.priority ?? 0) - (a.rule.priority ?? 0) ||
          a.rule.id.localeCompare(b.rule.id)
      );

    const selected = candidates[0];
    if (!selected) return;

    const { rule, raw } = selected;
    const effectiveRuleCap = ruleMonthlyCap(rule, appliedTier, previousQualifyingSpend);
    const remainingRule =
      effectiveRuleCap === null
        ? Number.POSITIVE_INFINITY
        : Math.max(0, effectiveRuleCap - (ruleApplied.get(rule.id) ?? 0));
    const remainingGroup =
      !rule.separateFromMainCap && rule.capGroupId && groupCaps[rule.capGroupId] !== undefined
        ? Math.max(0, groupCaps[rule.capGroupId] - (groupApplied.get(rule.capGroupId) ?? 0))
        : Number.POSITIVE_INFINITY;
    const remainingTotal =
      !rule.separateFromMainCap && appliedTier?.totalCap !== undefined
        ? Math.max(0, appliedTier.totalCap - mainTotalApplied)
        : Number.POSITIVE_INFINITY;
    const saving = Math.max(0, Math.min(raw, remainingRule, remainingGroup, remainingTotal));

    ruleBeforeCaps.set(rule.id, (ruleBeforeCaps.get(rule.id) ?? 0) + raw);
    ruleSpend.set(rule.id, (ruleSpend.get(rule.id) ?? 0) + transaction.amount);
    if (saving <= 0) return;

    ruleApplied.set(rule.id, (ruleApplied.get(rule.id) ?? 0) + saving);
    ruleCount.set(rule.id, (ruleCount.get(rule.id) ?? 0) + 1);
    if (!rule.separateFromMainCap) {
      mainTotalApplied += saving;
      if (rule.capGroupId) {
        groupApplied.set(rule.capGroupId, (groupApplied.get(rule.capGroupId) ?? 0) + saving);
      }
    }
  });

  const ruleSavings = card.benefitRules.map((rule) => ({
    id: rule.id,
    label: rule.label,
    spend: ruleSpend.get(rule.id) ?? 0,
    transactionCount: ruleCount.get(rule.id) ?? 0,
    savingBeforeCaps: ruleBeforeCaps.get(rule.id) ?? 0,
    saving: ruleApplied.get(rule.id) ?? 0,
    effectiveCap: ruleMonthlyCap(rule, appliedTier, previousQualifyingSpend)
  }));
  const grossBenefit = ruleSavings.reduce((sum, rule) => sum + rule.saving, 0);
  const monthlyFee = card.annualFee / 12;
  const netBenefitBeforeFloor = grossBenefit - monthlyFee;
  const netBenefit = Math.max(0, netBenefitBeforeFloor);

  return {
    currentSpend,
    previousQualifyingSpend,
    grossBenefit,
    monthlyFee,
    netBenefitBeforeFloor,
    netBenefit,
    grossPickingRate: currentSpend > 0 ? (grossBenefit / currentSpend) * 100 : 0,
    pickingRate: currentSpend > 0 ? (netBenefit / currentSpend) * 100 : 0,
    appliedTier,
    activatedBonusLabels,
    ruleSavings
  };
}

function buildQualifiedPreviousTransactions(total: number): ScenarioTransaction[] {
  return [
    {
      id: "qualified-previous",
      amount: total,
      category: "etc",
      channel: "offline",
      merchant: "전월 실적 인정 가맹점",
      tags: ["offline"]
    }
  ];
}

function topBenefitLabels(result: MonthlyCalculation) {
  return [...result.ruleSavings]
    .filter((rule) => rule.saving > 0)
    .sort((a, b) => b.saving - a.saving)
    .slice(0, 3)
    .map((rule) => rule.label);
}

export function analyzeVerifiedCard(
  card: VerifiedCard,
  inputProfile: SpendingProfile
): VerifiedCardAnalysis {
  const profile = normalizeProfile(inputProfile);
  const transactions = buildScenarioTransactions(profile);
  const currentSpend = transactions.reduce((sum, transaction) => sum + transaction.amount, 0);
  const potential = calculateMonth(
    card,
    transactions,
    buildQualifiedPreviousTransactions(currentSpend)
  );
  const sustainable = calculateMonth(card, transactions, transactions);
  const nextQualifyingSpend = calculateQualifyingSpend(card, transactions);
  const topBenefits = topBenefitLabels(sustainable);
  const performanceGap = Math.max(0, card.performance.minimumSpend - nextQualifyingSpend);
  const reason =
    performanceGap > 0 && card.performance.minimumSpend > 0
      ? `같은 소비를 반복하면 다음 달 인정실적은 ${formatWon(nextQualifyingSpend)}입니다. 최소 ${formatWon(
          card.performance.minimumSpend
        )}보다 ${formatWon(performanceGap)} 부족해 지속 피킹률이 낮아집니다.`
      : `${sustainable.appliedTier?.label ?? "실적 조건 없음"} 기준으로 ${
          topBenefits.length > 0 ? `${topBenefits.join(", ")} 혜택이 적용됩니다.` : "적용 가능한 혜택이 없습니다."
        } 연회비 월할 ${formatWon(sustainable.monthlyFee)}을 차감한 순혜택으로 피킹률을 계산했습니다.`;

  return {
    card,
    profile,
    transactions,
    potential,
    sustainable,
    nextQualifyingSpend,
    annualSaving: sustainable.netBenefit * 12,
    pickingRate: sustainable.pickingRate,
    reason,
    assumptionSummary: [
      "카테고리 금액을 1천원 단위 대표 결제 건으로 나눔",
      "야간·주말·지정 가맹점 비중은 공개된 대표 소비 시나리오 사용",
      "같은 소비 패턴을 매달 반복했을 때의 인정실적으로 지속 피킹률 계산"
    ]
  };
}

export function rankVerifiedCards(cards: VerifiedCard[], profile: SpendingProfile) {
  return cards
    .map((card) => analyzeVerifiedCard(card, profile))
    .sort(
      (a, b) =>
        b.pickingRate - a.pickingRate ||
        b.sustainable.netBenefit - a.sustainable.netBenefit ||
        a.card.annualFee - b.card.annualFee
    );
}

type OptimizerUnit = {
  id: string;
  label: string;
  maxUses: number;
  createTransactions: (useIndex: number) => ScenarioTransaction[];
};

type OptimizerState = {
  counts: number[];
  scenario: MaximumCardScenario;
};

function roundUpToThousand(value: number) {
  return Math.max(0, Math.ceil(value / 1000) * 1000);
}

function formulaEfficiency(
  formula: VerifiedBenefitRule["rewardBands"][number]["formula"]
) {
  if (formula.kind === "rate") return formula.rate;
  if (formula.kind === "fixed") return formula.amount;
  return formula.wonPerLiter / formula.assumedPricePerLiter;
}

function ruleCapForOptimizer(
  card: VerifiedCard,
  rule: VerifiedBenefitRule,
  tier: CardCapTier
) {
  const caps: number[] = [];
  if (rule.monthlyCap !== undefined) caps.push(rule.monthlyCap);
  if (tier.ruleCaps?.[rule.id] !== undefined) caps.push(tier.ruleCaps[rule.id]);
  if (!rule.separateFromMainCap && rule.capGroupId && tier.groupCaps?.[rule.capGroupId] !== undefined) {
    caps.push(tier.groupCaps[rule.capGroupId]);
  }
  if (!rule.separateFromMainCap && tier.totalCap !== undefined) caps.push(tier.totalCap);

  const ruleTier = rule.monthlyCapTiers?.find(
    (item) =>
      tier.minPreviousSpend >= item.minPreviousSpend &&
      (item.maxPreviousSpendExclusive === undefined ||
        tier.minPreviousSpend < item.maxPreviousSpendExclusive)
  );
  if (ruleTier) caps.push(ruleTier.monthlyCap);
  return caps.length > 0 ? Math.min(...caps) : null;
}

function optimizedBandAndAmount(
  card: VerifiedCard,
  rule: VerifiedBenefitRule,
  tier: CardCapTier
) {
  const relevantCap = ruleCapForOptimizer(card, rule, tier);
  const candidates = rule.rewardBands.flatMap((band) => {
    const minimum = Math.max(1000, band.minTransactionAmount ?? 0);
    const maximum =
      band.maxTransactionAmountExclusive === undefined
        ? Number.POSITIVE_INFINITY
        : Math.max(minimum, band.maxTransactionAmountExclusive - 1000);
    let amount = minimum;

    if (band.formula.kind === "rate") {
      const transactionBenefitTarget =
        rule.perTransactionCap !== undefined && relevantCap !== null
          ? Math.min(rule.perTransactionCap, relevantCap)
          : rule.perTransactionCap ?? relevantCap;
      if (transactionBenefitTarget !== null) {
        amount = Math.max(amount, transactionBenefitTarget / band.formula.rate);
      } else if (band.minTransactionAmount === undefined) {
        amount = 100000;
      }
    } else if (band.formula.kind === "fixed") {
      amount = Math.max(amount, band.minTransactionAmount ?? band.formula.amount);
    } else if (relevantCap !== null) {
      amount = Math.max(
        amount,
        (relevantCap / band.formula.wonPerLiter) * band.formula.assumedPricePerLiter
      );
    } else {
      amount = Math.max(amount, 100000);
    }

    amount = roundUpToThousand(Math.min(amount, maximum));
    if (
      amount < (band.minTransactionAmount ?? 0) ||
      (band.maxTransactionAmountExclusive !== undefined &&
        amount >= band.maxTransactionAmountExclusive)
    ) {
      return [];
    }

    const rawBenefit = Math.min(
      calculateFormula(band.formula, amount),
      rule.perTransactionCap ?? Number.POSITIVE_INFINITY
    );
    return [{ band, amount, rawBenefit, efficiency: rawBenefit / amount }];
  });

  return candidates.sort(
    (a, b) =>
      b.efficiency - a.efficiency ||
      formulaEfficiency(b.band.formula) - formulaEfficiency(a.band.formula) ||
      a.amount - b.amount
  )[0];
}

function optimizerCategory(rule: VerifiedBenefitRule): BenefitCategory {
  if (rule.appliesTo !== "all") return rule.appliesTo[0];
  if (rule.requiredTags?.includes("overseas")) return "travel";
  if (rule.requiredTags?.includes("online")) return "shopping";
  return "etc";
}

function optimizerChannel(
  category: BenefitCategory,
  requiredTags: string[] | undefined
): ScenarioTransaction["channel"] {
  if (requiredTags?.includes("overseas")) return "overseas";
  if (
    requiredTags?.includes("online") ||
    category === "shopping" ||
    category === "delivery" ||
    category === "ott"
  ) {
    return "online";
  }
  return "offline";
}

function optimizerTransaction(
  id: string,
  rule: VerifiedBenefitRule,
  amount: number,
  forcedCategory?: BenefitCategory,
  forcedTags: string[] = []
): ScenarioTransaction {
  const category = forcedCategory ?? optimizerCategory(rule);
  const channel = optimizerChannel(category, [...(rule.requiredTags ?? []), ...forcedTags]);
  return {
    id,
    amount: roundUpToThousand(amount),
    category,
    channel,
    merchant: rule.merchantScope[0] ?? rule.label,
    tags: Array.from(new Set([...(rule.requiredTags ?? []), ...forcedTags, channel]))
  };
}

function optimizerUnitsForTier(card: VerifiedCard, tier: CardCapTier): OptimizerUnit[] {
  const units: OptimizerUnit[] = card.benefitRules.flatMap((rule) => {
    if ((rule.minPreviousSpend ?? 0) > tier.minPreviousSpend) return [];
    const optimized = optimizedBandAndAmount(card, rule, tier);
    if (!optimized || optimized.rawBenefit <= 0) return [];
    const relevantCap = ruleCapForOptimizer(card, rule, tier);
    const countLimit =
      rule.monthlyCountCap ??
      (relevantCap !== null
        ? Math.ceil(relevantCap / optimized.rawBenefit) + 1
        : Math.ceil(maximumScenarioRange.max / optimized.amount));
    const categoryMinimumCount =
      rule.monthlyCategorySpendMin !== undefined
        ? Math.ceil(rule.monthlyCategorySpendMin / optimized.amount)
        : 1;
    const transactionsPerUse = Math.max(1, categoryMinimumCount);
    const maxUses = Math.max(1, Math.min(16, Math.ceil(countLimit / transactionsPerUse)));

    const ruleUnits: OptimizerUnit[] = [
      {
        id: rule.id,
        label: rule.label,
        maxUses,
        createTransactions: (useIndex: number) =>
          Array.from({ length: transactionsPerUse }, (_, transactionIndex) =>
            optimizerTransaction(
              `optimizer-${rule.id}-${useIndex}-${transactionIndex}`,
              rule,
              optimized.amount
            )
          )
      }
    ];

    const optimizedBand = optimized.band;
    const fineAmount =
      optimizedBand.formula.kind === "rate"
        ? roundUpToThousand(Math.max(10000, optimizedBand.minTransactionAmount ?? 0))
        : optimized.amount;
    if (
      relevantCap === null &&
      optimizedBand.formula.kind === "rate" &&
      fineAmount < optimized.amount
    ) {
      ruleUnits.push({
        id: `${rule.id}-fine`,
        label: `${rule.label} 금액 보정`,
        maxUses: Math.max(1, Math.ceil(optimized.amount / fineAmount) - 1),
        createTransactions: (useIndex: number) => [
          optimizerTransaction(`optimizer-${rule.id}-fine-${useIndex}`, rule, fineAmount)
        ]
      });
    }

    return ruleUnits;
  });

  tier.bonusConditions?.forEach((condition, conditionIndex) => {
    const matchingRule = card.benefitRules.find(
      (rule) =>
        (rule.appliesTo === "all" ||
          rule.appliesTo.some((category) => condition.categories.includes(category))) &&
        (condition.requiredTags ?? []).every((tag) => rule.requiredTags?.includes(tag))
    );
    if (!matchingRule) return;

    units.push({
      id: `bonus-${conditionIndex}`,
      label: condition.label,
      maxUses: 1,
      createTransactions: () =>
        Array.from({ length: condition.minTransactionCount }, (_, transactionIndex) =>
          optimizerTransaction(
            `optimizer-bonus-${conditionIndex}-${transactionIndex}`,
            matchingRule,
            condition.minTransactionAmount,
            condition.categories[0],
            condition.requiredTags
          )
        )
    });
  });

  return units;
}

function transactionsFromCounts(units: OptimizerUnit[], counts: number[]) {
  return units.flatMap((unit, unitIndex) =>
    Array.from({ length: counts[unitIndex] }, (_, useIndex) => unit.createTransactions(useIndex)).flat()
  );
}

function completeRecurringScenario(
  card: VerifiedCard,
  transactions: ScenarioTransaction[],
  targetQualifyingSpend: number
) {
  const completed = [...transactions];
  const qualifyingGap = Math.max(
    0,
    targetQualifyingSpend - calculateQualifyingSpend(card, completed)
  );
  if (qualifyingGap > 0) {
    completed.push({
      id: "optimizer-performance-filler",
      amount: roundUpToThousand(qualifyingGap),
      category: "etc",
      channel: "offline",
      merchant: "실적 충족용 일반 결제",
      tags: ["offline"]
    });
  }

  const currentTotal = completed.reduce((sum, transaction) => sum + transaction.amount, 0);
  const minimumGap = Math.max(0, maximumScenarioRange.min - currentTotal);
  if (minimumGap > 0) {
    const filler = completed.find((transaction) => transaction.id === "optimizer-performance-filler");
    if (filler) {
      filler.amount += roundUpToThousand(minimumGap);
    } else {
      completed.push({
        id: "optimizer-minimum-filler",
        amount: roundUpToThousand(minimumGap),
        category: "etc",
        channel: "offline",
        merchant: "일반 결제",
        tags: ["offline"]
      });
    }
  }

  return completed;
}

function scenarioDifficulty(
  card: VerifiedCard,
  calculation: MonthlyCalculation,
  transactions: ScenarioTransaction[]
) {
  const appliedRuleIds = new Set(
    calculation.ruleSavings.filter((saving) => saving.saving > 0).map((saving) => saving.id)
  );
  const appliedRules = card.benefitRules.filter((rule) => appliedRuleIds.has(rule.id));
  const requiredPerformance = calculation.appliedTier?.minPreviousSpend ?? 0;
  let score = 0;
  if (requiredPerformance >= 500000) score += 1;
  if (requiredPerformance >= 1000000) score += 1;
  if (appliedRules.length >= 3) score += 1;
  if (appliedRules.some((rule) => (rule.requiredTags?.length ?? 0) > 0)) score += 1;
  if (appliedRules.some((rule) => (rule.performanceWeight ?? 1) < 1)) score += 1;
  if (calculation.activatedBonusLabels.length > 0) score += 1;
  if (
    transactions.some(
      (transaction) =>
        transaction.id === "optimizer-performance-filler" &&
        transaction.amount >= 100000
    )
  ) {
    score += 1;
  }

  if (score >= 4) return { difficulty: "hard" as const, difficultyLabel: "조건 높음" };
  if (score >= 2) return { difficulty: "moderate" as const, difficultyLabel: "조건 보통" };
  return { difficulty: "easy" as const, difficultyLabel: "조건 낮음" };
}

function buildMaximumScenario(
  card: VerifiedCard,
  benefitTransactions: ScenarioTransaction[],
  targetQualifyingSpend: number
): MaximumCardScenario {
  const transactions = completeRecurringScenario(
    card,
    benefitTransactions,
    targetQualifyingSpend
  );
  const calculation = calculateMonth(card, transactions, transactions);
  const totalSpend = calculation.currentSpend;
  const nextQualifyingSpend = calculateQualifyingSpend(card, transactions);
  const allocation = benefitCategories
    .map((category) => {
      const amount = transactions
        .filter((transaction) => transaction.category === category)
        .reduce((sum, transaction) => sum + transaction.amount, 0);
      return {
        category,
        label: category === "etc" ? "일반 결제·실적 충족" : categoryLabels[category],
        amount,
        share: totalSpend > 0 ? amount / totalSpend : 0
      };
    })
    .filter((item) => item.amount > 0)
    .sort((a, b) => b.amount - a.amount);
  const keyBenefitLabels = topBenefitLabels(calculation);
  const difficulty = scenarioDifficulty(card, calculation, transactions);
  const tierLabel = calculation.appliedTier?.label ?? "실적 조건 없음";

  return {
    card,
    transactions,
    calculation,
    totalSpend,
    nextQualifyingSpend,
    annualSaving: calculation.netBenefit * 12,
    pickingRate: calculation.pickingRate,
    allocation,
    keyBenefitLabels,
    ...difficulty,
    reason: `${tierLabel} 조건에서 ${
      keyBenefitLabels.length > 0 ? keyBenefitLabels.join(", ") : "기본 혜택"
    }을 가장 유리하게 배분했습니다. 할인 결제의 실적 인정률과 연회비 월할 ${formatWon(
      calculation.monthlyFee
    )}까지 포함한 반복 가능한 최대값입니다.`,
    assumptionSummary: [
      `월 ${formatWon(maximumScenarioRange.min)}~${formatWon(maximumScenarioRange.max)} 범위 탐색`,
      "공식 혜택 대상 가맹점과 거래 조건을 모두 지키는 최적 소비 조합",
      "할인받은 결제의 다음 달 실적 인정률과 실적 충족용 일반 결제 포함",
      "신규회원·이벤트·일회성 프로모션 제외"
    ]
  };
}

function compareMaximumScenarios(a: MaximumCardScenario, b: MaximumCardScenario) {
  return (
    b.pickingRate - a.pickingRate ||
    b.calculation.netBenefit - a.calculation.netBenefit ||
    a.totalSpend - b.totalSpend
  );
}

function optimizeCardForTier(card: VerifiedCard, tier: CardCapTier) {
  const units = optimizerUnitsForTier(card, tier);
  const seedCounts = units.map(() => 0);
  const seed = buildMaximumScenario(card, [], tier.minPreviousSpend);
  let best = seed;
  let frontier: OptimizerState[] = [{ counts: seedCounts, scenario: seed }];
  const seen = new Set([seedCounts.join(",")]);
  const maxDepth = Math.min(48, units.reduce((sum, unit) => sum + unit.maxUses, 0));

  for (let depth = 0; depth < maxDepth; depth += 1) {
    const candidates: OptimizerState[] = [];

    frontier.forEach((state) => {
      units.forEach((unit, unitIndex) => {
        if (state.counts[unitIndex] >= unit.maxUses) return;
        const counts = [...state.counts];
        counts[unitIndex] += 1;
        const key = counts.join(",");
        if (seen.has(key)) return;
        seen.add(key);

        const transactions = transactionsFromCounts(units, counts);
        const scenario = buildMaximumScenario(card, transactions, tier.minPreviousSpend);
        if (scenario.totalSpend > maximumScenarioRange.max) return;
        if (compareMaximumScenarios(scenario, best) < 0) best = scenario;
        candidates.push({ counts, scenario });
      });
    });

    if (candidates.length === 0) break;
    candidates.sort((a, b) => compareMaximumScenarios(a.scenario, b.scenario));
    frontier = candidates.slice(0, 72);
  }

  return best;
}

export function findMaximumVerifiedCardScenario(card: VerifiedCard) {
  return card.capTiers
    .map((tier) => optimizeCardForTier(card, tier))
    .sort(compareMaximumScenarios)[0];
}

export function rankMaximumVerifiedCards(cards: VerifiedCard[]) {
  return cards.map(findMaximumVerifiedCardScenario).sort(compareMaximumScenarios);
}
