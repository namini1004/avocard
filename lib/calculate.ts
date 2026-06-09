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
  monthlySaving: number;
  annualSaving: number;
  pickingRate: number;
  matchedBenefit: number;
  reason: string;
};

export function formatWon(value: number) {
  return `${Math.round(value).toLocaleString("ko-KR")}원`;
}

export function analyzeCard(card: CreditCard, profile: SpendingProfile): CardAnalysis {
  if (profile.total < card.previousSpend) {
    return {
      card,
      monthlySaving: 0,
      annualSaving: 0,
      pickingRate: 0,
      matchedBenefit: 0,
      reason: `월 사용액이 전월실적 ${formatWon(card.previousSpend)}에 미치지 못해 핵심 혜택을 받기 어렵습니다.`
    };
  }

  const grossSaving = card.benefitRules.reduce((sum, rule) => {
    if (profile.total < rule.previousMonthSpendRequired) {
      return sum;
    }

    const spend = profile[rule.category] ?? 0;
    const variableReward = rule.rate ? spend * rule.rate : 0;
    const fixedReward = rule.fixedAmount ?? 0;
    return sum + Math.min(variableReward + fixedReward, rule.monthlyCap);
  }, 0);

  const monthlySaving = Math.min(grossSaving, card.monthlyCap);
  const pickingRate = profile.total > 0 ? (monthlySaving / profile.total) * 100 : 0;
  const topBenefits = [...card.benefitRules]
    .sort((a, b) => (profile[b.category] ?? 0) * (b.rate ?? 0) - (profile[a.category] ?? 0) * (a.rate ?? 0))
    .slice(0, 2)
    .map((rule) => rule.label)
    .join(", ");

  return {
    card,
    monthlySaving,
    annualSaving: monthlySaving * 12 - card.annualFee,
    pickingRate,
    matchedBenefit: grossSaving,
    reason: `${topBenefits} 지출과 카드 혜택이 잘 맞습니다. 월 ${formatWon(profile.total)} 소비 기준 전월실적을 충족하면서 실제 절감액이 선명하게 남습니다.`
  };
}

export function rankCards(cards: CreditCard[], profile: SpendingProfile) {
  return cards
    .map((card) => analyzeCard(card, profile))
    .sort((a, b) => b.pickingRate - a.pickingRate || b.monthlySaving - a.monthlySaving);
}
