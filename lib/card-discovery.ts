import { verifiedCards } from "../data/verified-cards.ts";
import type {
  ScenarioTransaction,
  VerifiedCard,
} from "../data/verified-card-types.ts";
import {
  calculateMonth,
  calculateQualifyingSpend,
  formatWon,
  rankMaximumVerifiedCards,
} from "./calculate-v2.ts";
import {
  expenseOptions,
  initialDiscovery,
  type CardChoice,
  type DiscoveryInput,
  type DiscoveryResult,
} from "./discovery-types.ts";

export function parseDiscoveryInput(value: unknown): DiscoveryInput {
  if (!value || typeof value !== "object")
    throw new Error("사용 조건을 확인해주세요.");
  const input = value as DiscoveryInput;
  if (
    !Number.isInteger(input.total) ||
    input.total < 10000 ||
    input.total > 10000000 ||
    input.total % 1000 !== 0
  ) {
    throw new Error(
      "월 사용액은 1만~1,000만원 사이, 천원 단위로 입력해주세요.",
    );
  }
  if (
    !["easy", "benefit", "maximum"].includes(input.mode) ||
    !["all", "credit", "check"].includes(input.cardType)
  ) {
    throw new Error("카드 선택 조건을 확인해주세요.");
  }
  if (
    !Number.isFinite(input.maxAnnualFee) ||
    input.maxAnnualFee < 0 ||
    input.maxAnnualFee > 1000000
  ) {
    throw new Error("연회비 조건을 확인해주세요.");
  }
  if (
    !Array.isArray(input.expenses) ||
    input.expenses.length > expenseOptions.length
  )
    throw new Error("소비 항목을 확인해주세요.");
  const seen = new Set<string>();
  const expenses = input.expenses.map((expense) => {
    if (!expense || typeof expense !== "object")
      throw new Error("소비 항목을 확인해주세요.");
    const option = expenseOptions.find(
      (item) => item.category === expense.category,
    );
    if (
      !option ||
      seen.has(expense.category) ||
      !option.merchants.includes(expense.merchant)
    )
      throw new Error("소비처를 확인해주세요.");
    seen.add(expense.category);
    if (
      !Number.isInteger(expense.amount) ||
      expense.amount < 0 ||
      expense.amount % 1000 !== 0 ||
      expense.amount > input.total
    )
      throw new Error("소비 금액은 천원 단위로 입력해주세요.");
    if (
      !Number.isInteger(expense.count) ||
      expense.count < 1 ||
      expense.count > 28 ||
      (expense.amount > 0 && expense.count > expense.amount / 1000)
    )
      throw new Error("결제 횟수는 금액 범위에서 1~28회로 입력해주세요.");
    if (expense.weekend && expense.count > 8)
      throw new Error("주말 결제는 월 8회 이하로 입력해주세요.");
    return {
      category: expense.category,
      amount: expense.amount,
      count: expense.count,
      merchant: expense.merchant,
      weekend: expense.weekend === true,
      night: expense.night === true,
      autopay: expense.autopay === true,
    };
  });
  if (expenses.reduce((sum, item) => sum + item.amount, 0) > input.total)
    throw new Error("항목별 소비 합계가 월 사용액보다 큽니다.");
  return {
    total: input.total,
    mode: input.mode,
    cardType: input.cardType,
    maxAnnualFee: input.maxAnnualFee,
    expenses,
  };
}

// Merchant and time eligibility comes only from explicit user selections.
export function buildConfirmedTransactions(
  input: DiscoveryInput,
): ScenarioTransaction[] {
  const transactions: ScenarioTransaction[] = [];
  for (const expense of input.expenses) {
    if (!expense.amount) continue;
    const { category, merchant } = expense;
    const channel = ["shopping", "delivery", "ott"].includes(category)
      ? "online"
      : "offline";
    const tags: string[] = [channel];
    if (category === "transport") tags.push("public_transport");
    if (category === "taxi") tags.push("taxi");
    if (
      category === "shopping" &&
      ["쿠팡", "네이버페이", "컬리", "SSG.COM"].includes(merchant)
    )
      tags.push("macao_shopping");
    if (
      category === "shopping" &&
      ["G마켓", "옥션", "11번가"].includes(merchant)
    )
      tags.push("major_marketplace");
    if (
      category === "mart" &&
      ["이마트", "롯데마트", "홈플러스"].includes(merchant)
    )
      tags.push("major_mart", "macao_shopping");
    if (
      category === "fuel" &&
      ["SK에너지", "GS칼텍스", "HD현대오일뱅크", "S-OIL"].includes(merchant)
    )
      tags.push("major_fuel");
    if (category === "coffee" && ["스타벅스", "이디야"].includes(merchant))
      tags.push("coffee_chain");
    if (category === "convenience" && merchant === "GS25") tags.push("gs25");
    if (category === "delivery" && ["배달의민족", "요기요"].includes(merchant))
      tags.push("delivery_app");
    if (
      category === "telecom" &&
      expense.autopay &&
      ["SKT", "KT", "LG U+"].includes(merchant)
    )
      tags.push("auto_pay");
    if (expense.weekend && ["mart", "fuel"].includes(category))
      tags.push("weekend");
    if (
      expense.night &&
      (["taxi", "dining", "coffee"].includes(category) ||
        (category === "shopping" &&
          ["G마켓", "옥션", "11번가"].includes(merchant)))
    )
      tags.push("night", "mr_life_night");
    const count = ["telecom", "transport"].includes(category)
      ? 1
      : expense.count;
    const base = Math.floor(expense.amount / count / 1000) * 1000;
    for (let index = 0; index < count; index++) {
      transactions.push({
        id: `${category}-${index}`,
        amount:
          index === count - 1 ? expense.amount - base * (count - 1) : base,
        category,
        channel,
        merchant,
        tags,
      });
    }
  }
  const remainder =
    input.total - input.expenses.reduce((sum, item) => sum + item.amount, 0);
  if (remainder > 0)
    transactions.push({
      id: "general",
      amount: remainder,
      category: "etc",
      channel: "offline",
      merchant: "일반 국내 가맹점",
      tags: ["offline"],
    });
  return transactions;
}

export function isSimpleCard(card: VerifiedCard) {
  return (
    card.performance.minimumSpend === 0 &&
    card.capTiers.every(
      (tier) =>
        tier.totalCap === undefined &&
        !Object.keys(tier.groupCaps ?? {}).length,
    ) &&
    card.benefitRules.some(
      (rule) =>
        rule.appliesTo === "all" &&
        !rule.requiredTags?.length &&
        !rule.minPreviousSpend &&
        rule.monthlyCap === undefined &&
        rule.monthlyCountCap === undefined &&
        rule.perTransactionCap === undefined &&
        rule.rewardBands.some(
          (band) => !band.minTransactionAmount && band.formula.kind === "rate",
        ),
    )
  );
}

let maximumCache: ReturnType<typeof rankMaximumVerifiedCards> | undefined;
export function discoverCards(
  rawInput: unknown = initialDiscovery,
): DiscoveryResult {
  const input = parseDiscoveryInput(rawInput);
  const transactions = buildConfirmedTransactions(input);
  maximumCache ??= rankMaximumVerifiedCards(verifiedCards);
  const choices: CardChoice[] = verifiedCards.map((card) => {
    const calculation = calculateMonth(card, transactions, transactions);
    const maximum = maximumCache!.find((item) => item.card.slug === card.slug)!;
    const qualifyingSpend = calculateQualifyingSpend(card, transactions);
    const simple = isSimpleCard(card);
    const conditions: string[] = [];
    if (card.performance.minimumSpend)
      conditions.push(`전월실적 ${formatWon(card.performance.minimumSpend)}`);
    if (
      card.benefitRules.some((rule) =>
        rule.requiredTags?.some((tag) => ["night", "weekend"].includes(tag)),
      )
    )
      conditions.push("시간·요일 조건");
    if (
      card.benefitRules.some((rule) =>
        rule.requiredTags?.some(
          (tag) =>
            ![
              "online",
              "offline",
              "overseas",
              "public_transport",
              "night",
              "weekend",
              "auto_pay",
            ].includes(tag),
        ),
      )
    )
      conditions.push("지정 가맹점");
    if (
      card.benefitRules.some((rule) =>
        rule.rewardBands.some((band) => (band.minTransactionAmount ?? 0) > 0),
      )
    )
      conditions.push("건당 결제금액 조건");
    if (
      card.benefitRules.some((rule) => (rule.performanceWeight ?? 1) < 1) ||
      Object.values(card.performance.categoryWeights ?? {}).some(
        (weight) => weight < 1,
      )
    )
      conditions.push("일부 결제 실적 제외");
    return {
      slug: card.slug,
      name: card.name,
      issuer: card.issuer,
      cardType: card.cardType,
      color: card.color,
      summary: card.summary,
      annualFee: card.annualFee,
      minimumSpend: card.performance.minimumSpend,
      simple,
      easeLabel: simple ? "관리 부담 낮음" : "조건 확인 필요",
      conditions,
      cautions: card.cautions,
      bestFor: card.bestFor,
      performanceDescription: card.performance.description,
      tiers: card.capTiers.map((tier) => ({
        label: tier.label,
        limits:
          tier.totalCap !== undefined
            ? `통합 ${formatWon(tier.totalCap)}`
            : Object.values(tier.groupCaps ?? {}).length
              ? `영역별 ${Object.values(tier.groupCaps!).map(formatWon).join(" / ")}`
              : "월 한도 없음",
      })),
      benefits: card.benefitRules.map((rule) => ({
        label: rule.label,
        note: rule.note,
        merchants: rule.merchantScope,
        saving:
          calculation.ruleSavings.find((item) => item.id === rule.id)?.saving ??
          0,
      })),
      totalSpend: input.total,
      grossBenefit: calculation.grossBenefit,
      monthlyFee: calculation.monthlyFee,
      netBenefit: calculation.netBenefit,
      feeShortfall: Math.max(0, -calculation.netBenefitBeforeFloor),
      pickingRate: calculation.pickingRate,
      annualBenefit: calculation.netBenefit * 12,
      qualifyingSpend,
      performanceGap: Math.max(
        0,
        card.performance.minimumSpend - qualifyingSpend,
      ),
      maximumRate: maximum.pickingRate,
      maximumSpend: maximum.totalSpend,
      maximumBenefit: maximum.calculation.netBenefit,
      maximumAllocation: maximum.allocation.map(({ label, amount }) => ({
        label,
        amount,
      })),
      comparisonDelta: 0,
    };
  });
  const eligible = choices.filter(
    (card) =>
      (input.cardType === "all" || card.cardType === input.cardType) &&
      card.annualFee <= input.maxAnnualFee,
  );
  const simpleChoices = eligible.filter((card) => card.simple);
  const bestSimple = Math.max(
    0,
    ...simpleChoices.map((card) => card.netBenefit),
  );
  for (const card of eligible)
    card.comparisonDelta = simpleChoices.length
      ? card.netBenefit - bestSimple
      : null;
  const cards = eligible
    .filter((card) => input.mode !== "easy" || card.simple)
    .sort((a, b) =>
      input.mode === "maximum"
        ? b.maximumRate - a.maximumRate
        : b.netBenefit - a.netBenefit ||
          Number(b.simple) - Number(a.simple) ||
          a.annualFee - b.annualFee,
    );
  return {
    input,
    cards,
    highlights: [...choices]
      .sort((a, b) => b.maximumRate - a.maximumRate)
      .slice(0, 3),
    unassignedSpend:
      input.total - input.expenses.reduce((sum, item) => sum + item.amount, 0),
  };
}
