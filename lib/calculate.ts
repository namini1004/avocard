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
    saving: number;
  }>;
  reason: string;
};

export function formatWon(value: number) {
  return `${Math.round(value).toLocaleString("ko-KR")}원`;
}

export function analyzeCard(card: CreditCard, profile: SpendingProfile): CardAnalysis {
  const totalRuleCap = card.benefitRules.reduce((sum, rule) => sum + rule.monthlyCap, 0);
  const effectiveMonthlyCap = Math.min(card.monthlyCap, totalRuleCap);
  const monthlyFee = card.annualFee / 12;

  if (profile.total < card.previousSpend) {
    return {
      card,
      grossMonthlySaving: 0,
      netMonthlySavingBeforeFloor: -monthlyFee,
      monthlySaving: 0,
      annualSaving: 0,
      pickingRate: 0,
      matchedBenefit: 0,
      effectiveMonthlyCap,
      monthlyFee,
      totalRuleCap,
      ruleSavings: card.benefitRules.map((rule) => ({
        id: rule.id,
        category: rule.category,
        label: rule.label,
        spend: profile[rule.category] ?? 0,
        rate: rule.rate ?? 0,
        cap: rule.monthlyCap,
        saving: 0
      })),
      reason: `월 사용액이 전월실적 ${formatWon(card.previousSpend)}에 미치지 못해 통합 혜택을 받기 어렵습니다. 이 구간에서는 연회비 월할액만 피킹률에서 차감했습니다.`
    };
  }

  const ruleSavings = card.benefitRules.map((rule) => {
    if (profile.total < rule.previousMonthSpendRequired) {
      return {
        id: rule.id,
        category: rule.category,
        label: rule.label,
        spend: profile[rule.category] ?? 0,
        rate: rule.rate ?? 0,
        cap: rule.monthlyCap,
        saving: 0
      };
    }

    const spend = profile[rule.category] ?? 0;
    const variableReward = rule.rate ? spend * rule.rate : 0;
    const fixedReward = rule.fixedAmount ?? 0;
    const saving = Math.min(variableReward + fixedReward, rule.monthlyCap);

    return {
      id: rule.id,
      category: rule.category,
      label: rule.label,
      spend,
      rate: rule.rate ?? 0,
      cap: rule.monthlyCap,
      saving
    };
  });

  const matchedBenefit = ruleSavings.reduce((sum, rule) => sum + rule.saving, 0);
  const grossMonthlySaving = Math.min(matchedBenefit, effectiveMonthlyCap);
  const netMonthlySavingBeforeFloor = grossMonthlySaving - monthlyFee;
  const monthlySaving = Math.max(0, netMonthlySavingBeforeFloor);
  const pickingRate = profile.total > 0 ? (monthlySaving / profile.total) * 100 : 0;
  const topBenefits = [...ruleSavings]
    .sort((a, b) => b.saving - a.saving)
    .slice(0, 2)
    .map((rule) => rule.label)
    .join(", ");

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
    reason: `${topBenefits || "주요 혜택"}에서 계산된 예상 혜택 ${formatWon(matchedBenefit)} 중 통합 월 한도 ${formatWon(
      effectiveMonthlyCap
    )}를 적용하고, 연회비 월할액 ${formatWon(monthlyFee)}을 뺀 값이 월 순혜택입니다. 피킹률은 월 순혜택을 월 사용액 ${formatWon(
      profile.total
    )}으로 나눈 비율입니다.`
  };
}

export function rankCards(cards: CreditCard[], profile: SpendingProfile) {
  return cards
    .map((card) => analyzeCard(card, profile))
    .sort((a, b) => b.pickingRate - a.pickingRate || b.monthlySaving - a.monthlySaving);
}
