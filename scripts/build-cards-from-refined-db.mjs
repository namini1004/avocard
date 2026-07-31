import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const refinedDir = path.join(root, "data", "refined-db");
const rawCardsJsonlPath = path.join(root, "data", "raw", "naver-cards", "cards.jsonl");
const outputPath = path.join(root, "data", "collected-cards.ts");

const colors = [
  "from-avocado-100 to-avocado-800",
  "from-lime-100 to-emerald-800",
  "from-yellow-100 to-avocado-700",
  "from-green-100 to-ink",
  "from-cream to-avocado-800"
];

const appCategoryMap = {
  transport: "transport",
  taxi: "taxi",
  fuel: "fuel",
  coffee: "coffee",
  convenience: "convenience",
  delivery: "delivery",
  dining: "dining",
  shopping_online: "shopping",
  shopping_offline: "shopping",
  shopping: "shopping",
  mart: "mart",
  telecom: "telecom",
  ott: "ott",
  medical: "medical",
  education: "education",
  travel: "travel",
  culture: "etc",
  finance: "etc",
  etc: "etc"
};

const categoryLabels = {
  transport: "대중교통",
  taxi: "택시",
  fuel: "주유",
  coffee: "커피",
  convenience: "편의점",
  delivery: "배달",
  dining: "외식",
  shopping: "쇼핑",
  mart: "마트",
  telecom: "통신",
  ott: "OTT/구독",
  medical: "병원/약국",
  education: "교육",
  travel: "여행",
  etc: "기타"
};

const commonExcluded = ["상품권", "선불카드 충전", "세금", "공과금", "연회비", "수수료"];

const noisePattern =
  /연회비|이벤트|행사|신규\s*발급|캐시백\s*제공|지급\s*일자|응모|추첨|프로모션|카드\s*신청|온라인\s*신청|최초\s*발급|최대\s*100%|네이버페이\s*포인트\s*지급/i;

const negativeConditionPattern = /제외|불가|미제공|지급되지|해지|연체|취소|반환|제한/i;
const performanceConditionPattern =
  /전월실적\s*산정|실적\s*산정|실적에\s*반영|50%\s*반영|할인대상\s*가맹점\s*이용액|통합\s*월\s*\d+회|연\s*\d+회\s*제공|주요서비스\s*통합\s*월\s*할인한도|총\s*할인한도|On-Line|Off-Line/i;

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (quoted) {
      if (char === '"' && next === '"') {
        cell += '"';
        index += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        cell += char;
      }
      continue;
    }

    if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      row.push(cell);
      cell = "";
    } else if (char === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else if (char !== "\r") {
      cell += char;
    }
  }

  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }

  const headers = rows.shift() ?? [];
  return rows
    .filter((item) => item.length > 1 || item[0])
    .map((item) => Object.fromEntries(headers.map((header, index) => [header, item[index] ?? ""])));
}

async function readCsv(name) {
  return parseCsv(await readFile(path.join(refinedDir, name), "utf8"));
}

async function readRawCards() {
  try {
    const lines = (await readFile(rawCardsJsonlPath, "utf8")).split(/\r?\n/).filter(Boolean);
    const rows = [];
    for (const line of lines) {
      try {
        const entry = JSON.parse(line);
        const id = entry?.itemCard?.cardAdId ?? entry?.url?.match(/cardAdId=(\d+)/)?.[1];
        if (id) rows.push({ card_id: String(id), entry });
      } catch {
        // Ignore malformed collector lines; the refined CSV remains the source of truth.
      }
    }
    return rows;
  } catch {
    return [];
  }
}

function cleanText(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function truncate(value, max = 160) {
  const text = cleanText(value);
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function numberValue(value) {
  if (value === null || value === undefined || value === "") return 0;
  const number = Number(String(value).replace(/[^\d.-]/g, ""));
  return Number.isFinite(number) ? number : 0;
}

function parseKoreanMoneyAmount(value) {
  const text = cleanText(value).replace(/,/g, "");
  const composite = text.match(/(\d+(?:\.\d+)?)\s*만\s*(\d+(?:\.\d+)?)\s*천\s*원?/);
  if (composite) return Math.round(Number(composite[1]) * 10000 + Number(composite[2]) * 1000);

  const match = text.match(/(\d+(?:\.\d+)?)\s*(만원|만|천원|천|원)/);
  if (!match) return 0;

  const amount = Number(match[1]);
  const unit = match[2];
  if (unit === "만원" || unit === "만") return Math.round(amount * 10000);
  if (unit === "천원" || unit === "천") return Math.round(amount * 1000);
  return Math.round(amount);
}

function groupBy(rows, key) {
  const map = new Map();
  for (const row of rows) {
    const value = row[key];
    if (!map.has(value)) map.set(value, []);
    map.get(value).push(row);
  }
  return map;
}

function safeJson(value, fallback) {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function parsePercent(text) {
  const values = [...String(text ?? "").matchAll(/(\d+(?:\.\d+)?)\s*%/g)]
    .map((match) => Number(match[1]) / 100)
    .filter((value) => Number.isFinite(value) && value > 0 && value <= 0.5);
  return values.length ? Math.max(...values) : 0;
}

function deriveRate(row) {
  const labelRate = parsePercent(`${row.benefit_rule_name ?? ""} ${row.benefit_group_name ?? ""}`);
  if (labelRate) return labelRate;

  const source = cleanText(row.source_text ?? "");
  const beforeConditions = source
    .split(/\[유의사항\]|\[주요서비스|\b전월실적\b|실적\s*산정|50%\s*반영/i)[0]
    .slice(0, 220);
  const sourceRate =
    /할인|적립|캐시백|마일/i.test(beforeConditions) && !performanceConditionPattern.test(beforeConditions)
      ? parsePercent(beforeConditions)
      : 0;
  if (sourceRate) return sourceRate;

  const parsed = numberValue(row.reward_rate);
  if (parsed > 0 && parsed <= 0.3) return parsed;
  return 0;
}

function rewardType(value) {
  const text = cleanText(value);
  if (/마일|mile/i.test(text)) return "mileage";
  if (/캐시백/i.test(text)) return "cashback";
  if (/포인트|적립|point/i.test(text)) return "point";
  return "discount";
}

function inclusionStatus(value) {
  if (value === "included") return "included";
  if (value === "excluded") return "excluded";
  return "unknown";
}

function statusValue(value) {
  if (/discontinued|중지|종료|단종/i.test(value)) return "discontinued";
  return "active";
}

function reviewStatus(value) {
  if (value === "manual_required") return "draft";
  return "needs_review";
}

function cardType(value) {
  return value === "check" ? "check" : "credit";
}

function issuerName(value) {
  return cleanText(value) || "기타";
}

function isGenericCardName(value) {
  return /^(신용카드|체크카드|카드)$/.test(cleanText(value));
}

function performanceBand(spend) {
  return spend > 0 ? `${Math.round(spend / 10000)}만원 이상` : "실적 조건 없음";
}

function tierLabel(minSpend, maxSpend) {
  if (maxSpend) return `${Math.round(minSpend / 10000)}만원~${Math.round(maxSpend / 10000)}만원`;
  if (minSpend) return `${Math.round(minSpend / 10000)}만원 이상`;
  return "실적 조건 없음";
}

function buildTiers(card, tierRows) {
  const tiers = tierRows
    .map((row) => {
      const minSpend = numberValue(row.min_spend);
      const maxSpend = numberValue(row.max_spend);
      const totalCap = numberValue(row.total_monthly_cap);
      const channelCaps = safeJson(row.channel_caps, [])
        .map((item) => ({
          label: cleanText(item.label),
          cap: numberValue(item.cap)
        }))
        .filter((item) => item.label && item.cap > 0);

      return {
        minSpend,
        ...(maxSpend > 0 ? { maxSpend } : {}),
        totalCap,
        label: cleanText(row.tier_label) || tierLabel(minSpend, maxSpend),
        ...(channelCaps.length ? { channelCaps } : {})
      };
    })
    .filter((tier) => tier.totalCap > 0)
    .sort((a, b) => a.minSpend - b.minSpend || a.totalCap - b.totalCap);

  if (tiers.length) return tiers;

  const previousSpend = numberValue(card.base_spend_amount);
  const fallbackCap = Math.max(numberValue(card.max_monthly_cap), previousSpend > 0 ? 5000 : 1000);
  return [
    {
      minSpend: previousSpend,
      totalCap: fallbackCap,
      label: tierLabel(previousSpend, 0)
    }
  ];
}

function explicitCategory(row) {
  return appCategoryMap[row.category] ?? "etc";
}

function inferCategoryFromText(text, fallback = "etc") {
  const source = cleanText(text);
  if (/버스|지하철|대중교통|교통/i.test(source)) return "transport";
  if (/택시/i.test(source)) return "taxi";
  if (/주유|LPG|충전소|에너지/i.test(source)) return "fuel";
  if (/커피|카페|베이커리|스타벅스|이디야|투썸|폴바셋/i.test(source)) return "coffee";
  if (/편의점|CU|GS25|세븐일레븐|이마트24/i.test(source)) return "convenience";
  if (/배달|요기요|배달의\s*민족|쿠팡이츠/i.test(source)) return "delivery";
  if (/외식|음식|레스토랑|패밀리/i.test(source)) return "dining";
  if (/쇼핑|온라인|쿠팡|G마켓|옥션|11번가|SSG|무신사|백화점|면세점/i.test(source)) return "shopping";
  if (/마트|이마트|홈플러스|롯데마트|트레이더스/i.test(source)) return "mart";
  if (/통신|SKT|KT|LGU|이동통신/i.test(source)) return "telecom";
  if (/OTT|구독|넷플릭스|유튜브|티빙|웨이브|디즈니/i.test(source)) return "ott";
  if (/병원|약국|의료|미용/i.test(source)) return "medical";
  if (/교육|학원|도서|서점|시험|어학/i.test(source)) return "education";
  if (/여행|항공|호텔|숙박|공항|라운지|해외|마일/i.test(source)) return "travel";
  return fallback;
}

function ruleMonthlyCap(row, maxTierCap, rate, fixedAmount) {
  const parsed = numberValue(row.monthly_cap);
  if (parsed > 0) return Math.min(parsed, maxTierCap);

  const monthlyCountCap = numberValue(row.monthly_count_cap);
  if (fixedAmount > 0) {
    const fixedCap = monthlyCountCap > 0 ? fixedAmount * monthlyCountCap : fixedAmount;
    return Math.min(Math.max(fixedCap, fixedAmount), maxTierCap);
  }

  if (rate > 0) return maxTierCap;
  return 0;
}

function summaryRules(card, maxTierCap, exclusions) {
  const summary = cleanText(`${card.benefit_summary ?? ""} ${card.summary ?? ""}`);
  const fallbackSpend = numberValue(card.base_spend_amount);
  if (!summary) return [];

  return summary
    .split(/(?<!\d),(?!\d)|[·/!]| 그리고 | 및 /)
    .map(cleanText)
    .map((part, index) => {
      const rate = parsePercent(part);
      const fixedAmount = parseSummaryFixedAmount(part, maxTierCap);
      const mileageRate = parseMileageRate(part);
      const fuelRate = parseFuelLiterRate(part);
      const category = fuelRate ? "fuel" : inferCategoryFromText(part);
      const effectiveRate = rate || mileageRate || fuelRate;
      if (!effectiveRate && !fixedAmount) return null;
      if (category === "etc" && !/할인|적립|캐시백|포인트|마일|리워드/i.test(part)) return null;
      const monthlyCap = fixedAmount ? fixedAmount : maxTierCap;
      const reward = /마일/i.test(part) ? "mileage" : /적립|포인트|리워드/i.test(part) ? "point" : "discount";

      return {
        category,
        label: truncate(part, 70),
        merchantScope: [categoryLabels[category]],
        rewardType: reward,
        ...(effectiveRate > 0 ? { rate: effectiveRate } : {}),
        ...(fixedAmount > 0 ? { fixedAmount } : {}),
        monthlyCap,
        previousMonthSpendRequired: fallbackSpend,
        discountedSpendCountsForPerformance: "unknown",
        performanceBand: performanceBand(fallbackSpend),
        excludedItems: exclusions.length ? exclusions : commonExcluded,
        sourceRef: "refined-db",
        note: fixedAmount
          ? "카드 요약 문구에서 추출한 정액 할인입니다. 해당 영역 지출액과 월 한도 안에서만 인정합니다."
          : fuelRate
            ? "리터당 할인은 1L 1,700원 가정으로 월 환산했습니다. 실제 피킹률은 유가에 따라 달라질 수 있습니다."
            : mileageRate
              ? "원당 포인트/마일리지 문구를 1P/1마일=10원으로 보수 환산했습니다."
              : "카드 요약 문구에서 추출한 혜택률입니다. 실제 인정 금액은 구간별 통합 월 한도로 제한합니다.",
        confidence: 0.85,
        score: 5000 + (effectiveRate || 0) * 10000 + fixedAmount / 100 - index
      };
    })
    .filter(Boolean);
}

function parseSummaryFixedAmount(part, maxTierCap) {
  const text = cleanText(part);
  if (!/할인|캐시백|결제일|청구/i.test(text)) return 0;
  if (/바우처|숙박권|라운지|멤버십|기프트|연간|연\s*\d+회/i.test(text)) return 0;

  const amount = parseKoreanMoneyAmount(text);
  if (amount <= 0) return 0;
  if (amount > 100000) return 0;
  return amount;
}

function parseMileageRate(part) {
  const text = cleanText(part);
  const match = text.match(/((?:\d+(?:,\d{3})*|\d+(?:\.\d+)?)\s*원|\d+(?:\.\d+)?\s*천원|\d+(?:\.\d+)?\s*만원)\s*당\s*(?:최대\s*)?(\d+(?:\.\d+)?)\s*(P|p|포인트|마일)/i);
  if (!match) return 0;
  const base = parseKoreanMoneyAmount(match[1]) || numberValue(match[1]);
  const unitReward = Number(match[2]);
  if (!base || !Number.isFinite(unitReward) || unitReward <= 0) return 0;
  return Math.min((unitReward * 10) / base, 0.1);
}

function parseFuelLiterRate(part) {
  const text = cleanText(part);
  const match = text.match(/리터당\s*(?:최대\s*)?(\d+(?:,\d{3})*)\s*원/);
  if (!match) return 0;
  const amount = numberValue(match[1]);
  if (!amount) return 0;
  return Math.min(amount / 1700, 0.3);
}

function shouldDropRule(row, rate, fixedAmount) {
  const label = cleanText(`${row.benefit_group_name ?? ""} ${row.benefit_rule_name ?? ""} ${row.source_text ?? ""}`);
  const shortLabel = cleanText(`${row.benefit_group_name ?? ""} ${row.benefit_rule_name ?? ""}`);
  if (!rate && !fixedAmount) return true;
  if (noisePattern.test(label)) return true;
  if (performanceConditionPattern.test(shortLabel)) return true;
  if (negativeConditionPattern.test(row.benefit_rule_name ?? "") && !/%|할인|적립|캐시백|마일/i.test(row.benefit_rule_name ?? "")) return true;
  return false;
}

function chooseRules(card, ruleRows, maxTierCap, exclusions) {
  const fallbackSpend = numberValue(card.base_spend_amount);
  const parsedCandidates = ruleRows
    .map((row) => {
      const rate = deriveRate(row);
      const shortLabel = cleanText(`${row.benefit_group_name ?? ""} ${row.benefit_rule_name ?? ""}`);
      const rawFixedAmount = numberValue(row.fixed_reward_amount);
      const fixedAmount = rawFixedAmount > 0 && rawFixedAmount <= maxTierCap && !performanceConditionPattern.test(shortLabel) ? rawFixedAmount : 0;
      const monthlyCap = ruleMonthlyCap(row, maxTierCap, rate, fixedAmount);
      const category = explicitCategory(row);
      const requiredSpend = Math.max(numberValue(row.required_spend), fallbackSpend);
      const label = truncate(row.benefit_rule_name || row.benefit_group_name || categoryLabels[category], 70);
      const merchantScope = cleanText(row.merchant_scope)
        ? cleanText(row.merchant_scope)
            .split(/\s*\|\s*|,\s*/)
            .map(cleanText)
            .filter(Boolean)
            .slice(0, 8)
        : [categoryLabels[category]];

      return {
        sourceRow: row,
        category,
        label,
        merchantScope,
        rewardType: rewardType(`${row.reward_type ?? ""} ${row.benefit_rule_name ?? ""}`),
        ...(rate > 0 ? { rate } : {}),
        ...(fixedAmount > 0 ? { fixedAmount } : {}),
        monthlyCap,
        previousMonthSpendRequired: requiredSpend,
        discountedSpendCountsForPerformance: inclusionStatus(row.discounted_spend_counts_for_performance),
        performanceBand: performanceBand(requiredSpend),
        excludedItems: exclusions.length ? exclusions : commonExcluded,
        sourceRef: "refined-db",
        note: truncate(row.source_text || row.benefit_rule_name || row.benefit_group_name, 180),
        confidence: numberValue(row.extraction_confidence),
        score:
          numberValue(row.extraction_confidence) * 1000 +
          (rate || 0) * 10000 +
          Math.min(monthlyCap, maxTierCap) / 100 +
          (fixedAmount > 0 ? 40 : 0)
      };
    })
    .filter((rule) => rule.monthlyCap > 0 && !shouldDropRule(rule.sourceRow, rule.rate ?? 0, rule.fixedAmount ?? 0));

  const candidates = [...summaryRules(card, maxTierCap, exclusions), ...parsedCandidates];

  const byCategory = new Map();
  for (const rule of candidates.sort((a, b) => b.score - a.score)) {
    if (!byCategory.has(rule.category)) byCategory.set(rule.category, []);
    const bucket = byCategory.get(rule.category);
    const duplicate = bucket.some((item) => item.label === rule.label || Math.abs((item.rate ?? 0) - (rule.rate ?? 0)) < 0.0001);
    if (!duplicate && bucket.length < 2) bucket.push(rule);
  }

  const chosen = [...byCategory.values()]
    .flat()
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map((rule, index) => {
      const { sourceRow, confidence, score, ...cleanRule } = rule;
      return {
        id: `${card.card_id}-rule-${index + 1}`,
        ...cleanRule
      };
    });

  if (chosen.length) return chosen;

  const fallbackCap = Math.max(1000, Math.min(maxTierCap || 1000, 1000));
  return [
    {
      id: `${card.card_id}-rule-1`,
      category: "etc",
      label: "혜택 원문 검수 필요",
      merchantScope: ["기타"],
      rewardType: "discount",
      rate: 0.001,
      monthlyCap: fallbackCap,
      previousMonthSpendRequired: fallbackSpend,
      discountedSpendCountsForPerformance: "unknown",
      performanceBand: performanceBand(fallbackSpend),
      excludedItems: exclusions.length ? exclusions : commonExcluded,
      sourceRef: "refined-db",
      note: "자동 정제 규칙에서 계산 가능한 혜택을 찾지 못해 보수적인 임시 계산값을 적용했습니다."
    }
  ];
}

function makeBenefits(rules) {
  return rules.slice(0, 6).map((rule) => ({
    category: rule.category,
    label: rule.label,
    rate: rule.rate ?? 0,
    monthlyCap: rule.monthlyCap,
    note: rule.note
  }));
}

function compactCard(card, raw) {
  const rawCard = raw?.entry?.itemCard ?? {};
  const benefitSummary = cleanText(rawCard.titleDescription);
  const rawName = cleanText(rawCard.cardName);
  const refinedName = cleanText(card.card_name);
  const cardName = rawName && !isGenericCardName(rawName) ? rawName : refinedName && !isGenericCardName(refinedName) ? refinedName : rawName || refinedName || card.card_id;

  return {
    slug: card.card_id,
    name: cardName,
    issuer: issuerName(rawCard.companyName || card.issuer),
    cardType: cardType(card.card_type),
    status: statusValue(card.status),
    reviewStatus: reviewStatus(card.refine_status),
    summary: truncate(benefitSummary || card.summary || `${cardName} 혜택 분석`, 120),
    annualFee: numberValue(card.annual_fee),
    previousSpend: numberValue(card.base_spend_amount),
    advertisedBenefit: truncate(benefitSummary || card.summary || "정밀 정제 데이터 기반 혜택 분석", 100),
    monthlyCap: numberValue(card.max_monthly_cap),
    monthlyCapTiers: [],
    excluded: commonExcluded,
    benefitRules: [],
    benefits: [],
    sourceUrls: [
      {
        type: "editorial_reference",
        title: "네이버 카드 검색 정밀 수집 데이터",
        url: cleanText(card.detail_url) || "https://m-card-search.naver.com/list",
        capturedAt: cleanText(card.exported_at)
      }
    ],
    lastVerifiedAt: cleanText(card.exported_at),
    bestFor: [],
    cautions: [],
    strengths: [],
    weaknesses: [],
    color: colors[0]
  };
}

function buildCard(card, index, grouped) {
  const raw = (grouped.raw.get(card.source_card_id) ?? [])[0];
  const benefitSummary = cleanText(raw?.entry?.itemCard?.titleDescription);
  const enrichedCard = { ...card, benefit_summary: benefitSummary };
  const tierRows = grouped.tiers.get(card.card_id) ?? [];
  const exclusions = [...new Set((grouped.exclusions.get(card.card_id) ?? []).map((row) => cleanText(row.item)).filter(Boolean))].slice(0, 10);
  const monthlyCapTiers = buildTiers(card, tierRows);
  const maxTierCap = Math.max(...monthlyCapTiers.map((tier) => tier.totalCap), numberValue(card.max_monthly_cap), 1000);
  const benefitRules = chooseRules(enrichedCard, grouped.rules.get(card.card_id) ?? [], maxTierCap, exclusions);
  const categories = [...new Set(benefitRules.map((rule) => categoryLabels[rule.category] ?? "기타"))].slice(0, 4);
  const review = (grouped.reviews.get(card.card_id) ?? [])[0];
  const reviewReasons = cleanText(review?.review_reasons);

  return {
    ...compactCard(card, raw),
    color: colors[index % colors.length],
    monthlyCap: Math.max(maxTierCap, ...benefitRules.map((rule) => rule.monthlyCap)),
    monthlyCapTiers,
    excluded: exclusions.length ? exclusions : commonExcluded,
    benefitRules,
    benefits: makeBenefits(benefitRules),
    bestFor: categories.length ? categories : ["혜택 검수 필요"],
    cautions: [
      "네이버 카드 검색 원문을 자동 정제한 데이터입니다.",
      "카드사 약관 원문 대조 전까지는 needs_review 상태로 관리합니다.",
      ...(reviewReasons ? [reviewReasons] : [])
    ].slice(0, 4),
    strengths: [
      `구간별 한도 ${monthlyCapTiers.length}개 반영`,
      `계산 가능 혜택 규칙 ${benefitRules.length}개 반영`,
      "월 사용액별 피킹률 계산 가능"
    ],
    weaknesses: [
      card.refine_status === "ready_for_review" ? "공식 약관 최종 검수 전" : "부분 정제 데이터로 추가 검수 필요",
      "가맹점 업종 분류와 실적 제외 조건은 카드사 기준을 따릅니다."
    ]
  };
}

function buildTs(cards) {
  return `import type { CreditCard } from "./cards";\n\nexport const collectedCards: CreditCard[] = ${JSON.stringify(cards, null, 2)};\n`;
}

const [cards, tiers, rules, exclusions, reviews, rawCards] = await Promise.all([
  readCsv("refined_cards.csv"),
  readCsv("refined_cap_tiers.csv"),
  readCsv("refined_benefit_rules.csv"),
  readCsv("refined_exclusions.csv"),
  readCsv("refined_review_queue.csv"),
  readRawCards()
]);

const grouped = {
  tiers: groupBy(tiers, "card_id"),
  rules: groupBy(rules, "card_id"),
  exclusions: groupBy(exclusions, "card_id"),
  reviews: groupBy(reviews, "card_id"),
  raw: groupBy(rawCards, "card_id")
};

const collectedCards = cards.map((card, index) => buildCard(card, index, grouped));

await writeFile(outputPath, buildTs(collectedCards), "utf8");

const calculated = collectedCards.filter((card) => card.benefitRules.some((rule) => rule.label !== "혜택 원문 검수 필요")).length;
const withTierBands = collectedCards.filter((card) => card.monthlyCapTiers.length > 1).length;
console.log(`Wrote ${collectedCards.length} cards to ${path.relative(root, outputPath)}`);
console.log(`Calculated cards: ${calculated}`);
console.log(`Cards with multiple cap tiers: ${withTierBands}`);
