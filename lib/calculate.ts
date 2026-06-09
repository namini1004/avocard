import { BenefitCategory, CreditCard } from "@/data/cards";

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
      monthlySaving: -monthlyFee,
      annualSaving: -card.annualFee,
      pickingRate: profile.total > 0 ? (-monthlyFee / profile.total) * 100 : 0,
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
      reason: `월 사용액이 전월실적 ${formatWon(card.previousSpend)}에 미치지 못해 핵심 혜택을 받기 어렵습니다.`
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

  const grossSaving = ruleSavings.reduce((sum, rule) => sum + rule.saving, 0);
  const grossMonthlySaving = Math.min(grossSaving, effectiveMonthlyCap);
  const monthlySaving = grossMonthlySaving - monthlyFee;
  const pickingRate = profile.total > 0 ? (monthlySaving / profile.total) * 100 : 0;
  const topBenefits = [...card.benefitRules]
    .sort((a, b) => (profile[b.category] ?? 0) * (b.rate ?? 0) - (profile[a.category] ?? 0) * (a.rate ?? 0))
    .slice(0, 2)
    .map((rule) => rule.label)
    .join(", ");

  return {
    card,
    grossMonthlySaving,
    monthlySaving,
    annualSaving: monthlySaving * 12,
    pickingRate,
    matchedBenefit: grossSaving,
    effectiveMonthlyCap,
    monthlyFee,
    totalRuleCap,
    ruleSavings,
    reason: `${topBenefits} 지출과 카드 혜택이 잘 맞습니다. 월 ${formatWon(profile.total)} 소비 기준 통합 월 한도와 연회비 월할까지 반영해 순혜택을 계산했습니다.`
  };
}

export function rankCards(cards: CreditCard[], profile: SpendingProfile) {
  return cards
    .map((card) => analyzeCard(card, profile))
    .sort((a, b) => b.pickingRate - a.pickingRate || b.monthlySaving - a.monthlySaving);
}
