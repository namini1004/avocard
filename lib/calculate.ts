import type { BenefitCategory, CreditCard } from "../data/cards";

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

export function analyzeCard(card: CreditCard, profile: SpendingProfile): CardAnalysis {
  const totalRuleCap = card.benefitRules.reduce((sum, rule) => sum + clampBenefit(rule.monthlyCap), 0);
  const effectiveMonthlyCap = Math.min(clampBenefit(card.monthlyCap), totalRuleCap);
  const monthlyFee = clampBenefit(card.annualFee) / 12;

  const baseRuleSavings = card.benefitRules.map((rule) => {
    const spend = clampBenefit(profile[rule.category] ?? 0);
    const rate = clampBenefit(rule.rate ?? 0);
    const cap = clampBenefit(rule.monthlyCap);
    const isEligible = profile.total >= card.previousSpend && profile.total >= rule.previousMonthSpendRequired;
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

  const isCardEligible = profile.total >= card.previousSpend;
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
    .slice(0, 2)
    .map((rule) => rule.label)
    .filter(Boolean)
    .join(", ");

  const reason = isCardEligible
    ? `피킹률은 월 순혜택 ${formatWon(monthlySaving)}을 월 사용금액 ${formatWon(profile.total)}으로 나눈 값입니다. 영역별 예상 혜택 ${formatWon(
        matchedBenefit
      )} 중 카드 통합 월 한도 ${formatWon(effectiveMonthlyCap)}를 적용해 ${formatWon(
        grossMonthlySaving
      )}까지 인정하고, 연회비 월할 ${formatWon(monthlyFee)}을 뺀 뒤 계산했습니다.${
        topBenefits ? ` 이번 조건에서는 ${topBenefits} 영역의 기여도가 큽니다.` : ""
      }`
    : `월 사용금액 ${formatWon(profile.total)}이 전월실적 조건 ${formatWon(
        card.previousSpend
      )}보다 낮아 혜택을 받을 수 없는 구간입니다. 이 경우 피킹률은 0%로 처리합니다.`;

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
    ruleSavings,
    reason
  };
}

export function rankCards(cards: CreditCard[], profile: SpendingProfile) {
  return cards
    .map((card) => analyzeCard(card, profile))
    .sort((a, b) => b.pickingRate - a.pickingRate || b.monthlySaving - a.monthlySaving);
}
