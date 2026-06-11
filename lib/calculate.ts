import type { BenefitCategory, CreditCard, MonthlyCapTier } from "../data/cards";

export type SpendingProfile = Record<BenefitCategory, number> & {
  total: number;
};

export const defaultProfile: SpendingProfile = {
  total: 700000,
  transport: 80000,
  taxi: 30000,
  fuel: 60000,
  coffee: 100000,
  convenience: 50000,
  delivery: 120000,
  dining: 90000,
  shopping: 110000,
  mart: 80000,
  telecom: 60000,
  ott: 25000,
  medical: 30000,
  education: 0,
  travel: 0,
  etc: 55000
};

export type CardAnalysis = {
  card: CreditCard;
  grossMonthlySaving: number;
  netMonthlySavingBeforeFloor: number;
  monthlySaving: number;
  annualSaving: number;
  pickingRate: number;
  matchedBenefit: number;
  effectiveMonthlyCap: number;
  monthlyFee: number;
  totalRuleCap: number;
  appliedMonthlyCapTier: MonthlyCapTier | null;
  ruleSavings: Array<{
    id: string;
    category: BenefitCategory;
    label: string;
    spend: number;
    rate: number;
    cap: number;
    savingBeforeCap: number;
    saving: number;
  }>;
  reason: string;
};

export function formatWon(value: number) {
  return `${Math.round(value).toLocaleString("ko-KR")}원`;
}

function clampBenefit(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, value);
}

function fallbackTier(card: CreditCard): MonthlyCapTier {
  return {
    minSpend: card.previousSpend,
    totalCap: card.monthlyCap,
    label: card.previousSpend > 0 ? `${Math.round(card.previousSpend / 10000)}만원 이상` : "실적 조건 없음"
  };
}

export function getApplicableMonthlyCapTier(card: CreditCard, totalSpend: number): MonthlyCapTier | null {
  const tiers = (card.monthlyCapTiers?.length ? card.monthlyCapTiers : [fallbackTier(card)])
    .filter((tier) => tier.totalCap > 0)
    .sort((a, b) => a.minSpend - b.minSpend);

  const exact = tiers.find((tier) => totalSpend >= tier.minSpend && (tier.maxSpend === undefined || totalSpend < tier.maxSpend));
  if (exact) return exact;

  const lower = [...tiers].reverse().find((tier) => totalSpend >= tier.minSpend);
  return lower ?? null;
}

function tierLabel(tier: MonthlyCapTier | null) {
  return tier ? tier.label : "적용 구간 없음";
}

export function analyzeCard(card: CreditCard, profile: SpendingProfile): CardAnalysis {
  const appliedMonthlyCapTier = getApplicableMonthlyCapTier(card, profile.total);
  const tierCap = appliedMonthlyCapTier ? clampBenefit(appliedMonthlyCapTier.totalCap) : 0;
  const totalRuleCap = card.benefitRules.reduce((sum, rule) => sum + clampBenefit(rule.monthlyCap), 0);
  const effectiveMonthlyCap = appliedMonthlyCapTier ? Math.min(tierCap, totalRuleCap || tierCap) : 0;
  const monthlyFee = clampBenefit(card.annualFee) / 12;

  const baseRuleSavings = card.benefitRules.map((rule) => {
    const spend = clampBenefit(profile[rule.category] ?? 0);
    const rate = clampBenefit(rule.rate ?? 0);
    const cap = clampBenefit(rule.monthlyCap);
    const isEligible =
      Boolean(appliedMonthlyCapTier) &&
      profile.total >= card.previousSpend &&
      profile.total >= rule.previousMonthSpendRequired;
    const variableReward = isEligible ? spend * rate : 0;
    const fixedReward = isEligible ? clampBenefit(rule.fixedAmount ?? 0) : 0;
    const savingBeforeCap = variableReward + fixedReward;
    const saving = Math.min(savingBeforeCap, cap);

    return {
      id: rule.id,
      category: rule.category,
      label: rule.label,
      spend,
      rate,
      cap,
      savingBeforeCap,
      saving
    };
  });

  const isCardEligible = Boolean(appliedMonthlyCapTier) && profile.total >= card.previousSpend;
  const ruleSavings = isCardEligible
    ? baseRuleSavings
    : baseRuleSavings.map((rule) => ({ ...rule, savingBeforeCap: 0, saving: 0 }));
  const matchedBenefit = ruleSavings.reduce((sum, rule) => sum + rule.saving, 0);
  const grossMonthlySaving = Math.min(matchedBenefit, effectiveMonthlyCap);
  const netMonthlySavingBeforeFloor = grossMonthlySaving - monthlyFee;
  const monthlySaving = Math.max(0, netMonthlySavingBeforeFloor);
  const pickingRate = profile.total > 0 ? (monthlySaving / profile.total) * 100 : 0;
  const topBenefits = [...ruleSavings]
    .sort((a, b) => b.saving - a.saving)
    .slice(0, 3)
    .map((rule) => rule.label)
    .filter(Boolean)
    .join(", ");

  const reason = isCardEligible
    ? `선택한 월 사용액 ${formatWon(profile.total)}은 ${tierLabel(appliedMonthlyCapTier)} 구간입니다. 이 구간의 통합 월 한도 ${formatWon(
        effectiveMonthlyCap
      )} 안에서 영역별 예상 혜택 ${formatWon(matchedBenefit)}을 인정하고, 연회비 월할 ${formatWon(
        monthlyFee
      )}을 뺀 ${formatWon(monthlySaving)}을 피킹률 계산에 사용했습니다.${
        topBenefits ? ` 이번 조건에서는 ${topBenefits} 영역의 기여도가 큽니다.` : ""
      }`
    : `월 사용액 ${formatWon(profile.total)}이 전월실적 조건 ${formatWon(
        card.previousSpend
      )} 또는 적용 가능한 한도 구간보다 낮아 혜택을 0원으로 계산했습니다.`;

  return {
    card,
    grossMonthlySaving,
    netMonthlySavingBeforeFloor,
    monthlySaving,
    annualSaving: monthlySaving * 12,
    pickingRate,
    matchedBenefit,
    effectiveMonthlyCap,
    monthlyFee,
    totalRuleCap,
    appliedMonthlyCapTier,
    ruleSavings,
    reason
  };
}

export function rankCards(cards: CreditCard[], profile: SpendingProfile) {
  return cards
    .map((card) => analyzeCard(card, profile))
    .sort((a, b) => b.pickingRate - a.pickingRate || b.monthlySaving - a.monthlySaving);
}
