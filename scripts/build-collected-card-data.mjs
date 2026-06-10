import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const listPageDir = path.join(root, "data", "raw", "naver-cards", "list-pages");
const parsedCardDir = path.join(root, "data", "raw", "naver-cards", "parsed-cards");
const exportDir = path.join(root, "data", "raw", "naver-cards", "exports");
const outputPath = path.join(root, "data", "collected-cards.ts");
const candidatesPath = path.join(root, "data", "card-candidates.ts");
const overlapJsonPath = path.join(exportDir, "legacy-overlap-latest.json");
const overlapCsvPath = path.join(exportDir, "legacy-overlap-latest.csv");

const categoryOrder = [
  "transport",
  "taxi",
  "fuel",
  "coffee",
  "convenience",
  "delivery",
  "dining",
  "shopping",
  "mart",
  "telecom",
  "ott",
  "medical",
  "education",
  "travel",
  "etc"
];

const categoryLabelMap = {
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

const issuerMap = {
  SH: "신한",
  SS: "삼성",
  HD: "현대",
  KB: "KB국민",
  LO: "롯데",
  WR: "우리",
  HN: "하나",
  NH: "NH농협",
  BC: "BC",
  IBK: "IBK기업",
  CT: "씨티",
  KK: "카카오뱅크",
  TO: "토스뱅크"
};

const colors = [
  "from-avocado-100 to-avocado-800",
  "from-lime-100 to-emerald-800",
  "from-yellow-100 to-avocado-700",
  "from-green-100 to-ink",
  "from-cream to-avocado-800"
];

async function readJson(filePath, fallback = null) {
  try {
    return JSON.parse(await readFile(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

function normalizeName(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[()\[\]{}·ㆍ.,:;'"`~!@#$%^&*_+=|\\/<>?，]/g, "")
    .replace(/카드$/g, "");
}

function csvCell(value) {
  if (value === null || value === undefined) return "";
  return `"${String(value).replaceAll('"', '""').replace(/\r?\n/g, " ").trim()}"`;
}

function cleanText(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function moneyValue(value) {
  if (value === null || value === undefined || value === "") return 0;
  const number = Number(String(value).replace(/[^\d]/g, ""));
  return Number.isFinite(number) ? number : 0;
}

function parseKoreanMoney(value) {
  const text = String(value ?? "").replace(/,/g, "");
  const matches = [...text.matchAll(/(\d+(?:\.\d+)?)\s*(백만|십만|만원|만|천원|천|원)/g)];
  if (matches.length === 0) return 0;
  return Math.max(
    ...matches.map((match) => {
      const amount = Number(match[1]);
      const unit = match[2];
      if (unit === "백만") return amount * 1000000;
      if (unit === "십만") return amount * 100000;
      if (unit === "만원" || unit === "만") return amount * 10000;
      if (unit === "천원" || unit === "천") return amount * 1000;
      return amount;
    })
  );
}

function parsePreviousSpend(text) {
  const target = cleanText(text);
  if (!target || target.includes("조건없음") || target.includes("실적 없음") || target.includes("실적·한도 없이")) return 0;
  const match = target.match(/(?:기준실적|전월|직전)[^0-9]{0,30}([0-9]+(?:\.[0-9]+)?\s*(?:백만|십만|만원|만|천원|천|원))/);
  return match ? parseKoreanMoney(match[1]) : 0;
}

function parsePercent(text, fallback) {
  const matches = [...String(text ?? "").matchAll(/(\d+(?:\.\d+)?)\s*%/g)].map((match) => Number(match[1]));
  const valid = matches.filter((number) => Number.isFinite(number) && number > 0 && number <= 50);
  if (valid.length === 0) return fallback;
  return Math.min(Math.max(...valid) / 100, 0.3);
}

function parseMonthlyCap(text, fallback) {
  const target = cleanText(text);
  const match = target.match(
    /(?:월\s*(?:최대|통합|할인한도|적립한도|한도)|매월\s*(?:최대|통합|할인한도|적립한도|한도))[^0-9]{0,20}([0-9]+(?:\.[0-9]+)?\s*(?:백만|십만|만원|만|천원|천|원))/
  );
  const value = match ? parseKoreanMoney(match[1]) : 0;
  if (value > 0 && value <= 300000) return value;
  return fallback;
}

function categoryFromLabel(label) {
  const text = String(label ?? "");
  if (/대중교통|교통|버스|지하철|K-패스/i.test(text)) return "transport";
  if (/택시/i.test(text)) return "taxi";
  if (/주유|충전|오토|자동차|차량/i.test(text)) return "fuel";
  if (/커피|카페|베이커리|스타벅스/i.test(text)) return "coffee";
  if (/편의점|CU|GS25|세븐/i.test(text)) return "convenience";
  if (/배달/i.test(text)) return "delivery";
  if (/외식|음식|맛집|레스토랑/i.test(text)) return "dining";
  if (/마트|대형마트|이마트|롯데마트|홈플러스/i.test(text)) return "mart";
  if (/통신|휴대폰|이동통신/i.test(text)) return "telecom";
  if (/OTT|구독|렌탈|넷플릭스|유튜브/i.test(text)) return "ott";
  if (/병원|약국|의료|뷰티|헬스/i.test(text)) return "medical";
  if (/교육|학원|학습/i.test(text)) return "education";
  if (/여행|해외|항공|면세|외화|숙박|호텔|마일/i.test(text)) return "travel";
  if (/쇼핑|온라인|간편결제|네이버페이|쿠팡|백화점|바우처|포인트|캐시백/i.test(text)) return "shopping";
  return "etc";
}

function extractBenefitLabels(card) {
  const labels = [];
  const excludedLabels = /연회비지원|신규|이벤트|캐시백\s*이벤트|발급/i;
  for (const benefit of card.benefits ?? []) {
    const raw = benefit.rootBenefitCategoryIdName ?? "";
    const [, label = raw] = String(raw).split("|");
    if (label.trim() && !excludedLabels.test(label)) labels.push(label.trim());
  }
  for (const benefit of card.benefitCategories ?? []) {
    const label = typeof benefit === "string" ? benefit : benefit.label;
    if (String(label ?? "").trim() && !excludedLabels.test(String(label))) labels.push(String(label).trim());
  }
  return [...new Set(labels)];
}

function inferCardType(card, text) {
  if (/체크/i.test(`${card.cardName} ${text}`)) return "check";
  return "credit";
}

function makeSlug(card) {
  return `naver-card-${card.cardAdId}`;
}

function makeRules(card, parsed, index) {
  const labels = extractBenefitLabels(card);
  const text = cleanText(`${card.titleDescription ?? ""} ${parsed?.summaryBenefitText ?? ""} ${parsed?.annualFeeText ?? ""}`);
  const previousSpend = parsePreviousSpend(`${parsed?.previousSpendText ?? ""} ${text}`);
  const categories = [...new Set(labels.map(categoryFromLabel))];
  if (categories.length === 0) categories.push(categoryFromLabel(text));

  const baseRate = Math.min(parsePercent(text, /캐시백|포인트|적립/i.test(text) ? 0.01 : 0.03), 0.1);
  const defaultRuleCap = previousSpend >= 1000000 ? 12000 : previousSpend >= 500000 ? 8000 : 5000;
  const monthlyCap = parseMonthlyCap(text, Math.max(defaultRuleCap * Math.min(categories.length, 4), 10000));
  const perRuleCap = Math.min(monthlyCap, Math.max(1000, Math.round(monthlyCap / Math.max(1, Math.min(categories.length, 4)))));

  return {
    previousSpend,
    monthlyCap,
    rules: categories.slice(0, 5).map((category, ruleIndex) => {
      const label = labels.find((item) => categoryFromLabel(item) === category) ?? categoryLabelMap[category] ?? "기타";
      return {
        id: `${makeSlug(card)}-${category}-${ruleIndex}`,
        category,
        label,
        merchantScope: [label],
        rewardType: /마일/i.test(text) ? "mileage" : /캐시백/i.test(text) ? "cashback" : /적립|포인트/i.test(text) ? "point" : "discount",
        rate: baseRate,
        monthlyCap: perRuleCap,
        previousMonthSpendRequired: previousSpend,
        discountedSpendCountsForPerformance: "unknown",
        performanceBand: previousSpend > 0 ? `${Math.round(previousSpend / 10000)}만원 이상` : "실적 조건 없음",
        excludedItems: ["상품권", "선불카드 충전", "세금", "공과금", "연회비", "수수료"],
        sourceRef: "naver-card-search",
        note: `${label} 영역은 네이버 카드 상세에서 수집한 혜택 카테고리를 기준으로 임시 계산합니다.`
      };
    })
  };
}

function makeBenefits(rules) {
  return rules.map((rule) => ({
    category: rule.category,
    label: rule.label,
    rate: rule.rate,
    monthlyCap: rule.monthlyCap,
    note: rule.note
  }));
}

async function loadListCards() {
  const files = (await readdir(listPageDir)).filter((name) => name.endsWith(".json")).sort();
  const cards = new Map();
  for (const file of files) {
    const page = await readJson(path.join(listPageDir, file));
    const cardAds = page?.response?.data?.cardAdList?.cardAds ?? [];
    for (const card of cardAds) {
      if (card?.cardAdId) cards.set(String(card.cardAdId), { ...card, listSourcePage: file });
    }
  }
  return [...cards.values()];
}

async function loadParsedCards() {
  const files = (await readdir(parsedCardDir)).filter((name) => name.endsWith(".json")).sort();
  const cards = new Map();
  for (const file of files) {
    const parsed = await readJson(path.join(parsedCardDir, file));
    if (parsed?.cardAdId) cards.set(String(parsed.cardAdId), parsed);
  }
  return cards;
}

function toCreditCard(card, parsed, index) {
  const annualFee = moneyValue(card.domesticAnnualFee || card.foreignAnnualFee || parsed?.domesticAnnualFee || parsed?.foreignAnnualFee);
  const labels = extractBenefitLabels(card);
  const { previousSpend, monthlyCap, rules } = makeRules(card, parsed, index);
  const issuer = issuerMap[card.companyCode] ?? card.companyName ?? card.companyCode ?? "기타";
  const summary = cleanText(card.titleDescription || parsed?.summaryBenefitText || `${card.cardName} 혜택 분석`);
  const bestFor = labels.slice(0, 3).length > 0 ? labels.slice(0, 3) : ["혜택 분석 대기"];

  return {
    slug: makeSlug(card),
    name: card.cardName,
    issuer,
    cardType: inferCardType(card, summary),
    status: "active",
    reviewStatus: "needs_review",
    summary,
    annualFee,
    previousSpend,
    advertisedBenefit: summary,
    monthlyCap,
    excluded: ["상품권", "선불카드 충전", "세금", "공과금", "연회비", "수수료"],
    benefitRules: rules,
    benefits: makeBenefits(rules),
    sourceUrls: [
      {
        type: "editorial_reference",
        title: "네이버 카드 검색 수집 데이터",
        url: `https://m-card-search.naver.com/item?cardAdId=${card.cardAdId}`,
        capturedAt: "2026-06-10"
      }
    ],
    lastVerifiedAt: "2026-06-10",
    bestFor,
    cautions: [
      "네이버 카드 검색 원본을 기준으로 만든 임시 랭킹 데이터입니다.",
      "통합 할인한도, 실적 제외, 할인받은 매출의 실적 포함 여부는 공식 상품설명서로 추가 검증이 필요합니다."
    ],
    strengths: [`${bestFor.join(", ")} 영역 혜택 정보가 수집되었습니다.`],
    weaknesses: ["상세 한도와 제외 조건은 아직 검증 전입니다."],
    color: colors[index % colors.length]
  };
}

function parsedToListLikeCard(parsed) {
  return {
    cardAdId: parsed.cardAdId,
    cardName: parsed.cardName && parsed.cardName !== "신용카드" ? parsed.cardName : `네이버 카드 ${parsed.cardAdId}`,
    companyCode: parsed.companyCode ?? null,
    titleDescription: parsed.titleDescription ?? parsed.summaryBenefitText ?? "",
    cardImageUrl: parsed.cardImageUrl ?? "",
    domesticAnnualFee: parsed.domesticAnnualFee ?? 0,
    foreignAnnualFee: parsed.foreignAnnualFee ?? 0,
    familyAnnualFee: parsed.familyAnnualFee ?? 0,
    benefits: [],
    benefitCategories: parsed.benefitCategories ?? [],
    annualBenefitStr: parsed.annualBenefitText ?? "",
    releaseAt: parsed.releaseAt ?? "",
    listSourcePage: "parsed-only"
  };
}

async function loadLegacyCandidates() {
  const source = await readFile(candidatesPath, "utf8");
  return [...source.matchAll(/candidate\(\{\s*slug:\s*"([^"]+)"[\s\S]*?name:\s*"([^"]+)"/g)].map((match) => ({
    slug: match[1],
    name: match[2],
    normalizedName: normalizeName(match[2])
  }));
}

function buildTs(cards) {
  return `import type { CreditCard } from "./cards";

export const collectedCards: CreditCard[] = ${JSON.stringify(cards, null, 2)};
`;
}

await mkdir(exportDir, { recursive: true });

const listCards = await loadListCards();
const parsedCards = await loadParsedCards();
const cardsById = new Map(listCards.map((card) => [String(card.cardAdId), card]));
for (const [cardAdId, parsed] of parsedCards.entries()) {
  if (!cardsById.has(cardAdId)) cardsById.set(cardAdId, parsedToListLikeCard(parsed));
}

const collectedCards = [...cardsById.values()]
  .filter((card) => card.cardName && card.cardAdId)
  .map((card, index) => toCreditCard(card, parsedCards.get(String(card.cardAdId)), index));

await writeFile(outputPath, buildTs(collectedCards), "utf8");

const collectedNameMap = new Map(collectedCards.map((card) => [normalizeName(card.name), card]));
const legacyCandidates = await loadLegacyCandidates();
const duplicateLegacy = [];
const missingLegacy = [];

for (const candidate of legacyCandidates) {
  const duplicate = collectedNameMap.get(candidate.normalizedName);
  if (duplicate) duplicateLegacy.push({ ...candidate, collectedSlug: duplicate.slug, collectedName: duplicate.name });
  else missingLegacy.push(candidate);
}

const overlap = {
  generatedAt: new Date().toISOString(),
  collectedCount: collectedCards.length,
  legacyCandidateCount: legacyCandidates.length,
  duplicateCount: duplicateLegacy.length,
  missingCount: missingLegacy.length,
  duplicateLegacy,
  missingLegacy
};

await writeFile(overlapJsonPath, `${JSON.stringify(overlap, null, 2)}\n`, "utf8");
await writeFile(
  overlapCsvPath,
  [
    ["status", "legacySlug", "legacyName", "collectedSlug", "collectedName"].map(csvCell).join(","),
    ...duplicateLegacy.map((item) =>
      ["duplicate", item.slug, item.name, item.collectedSlug, item.collectedName].map(csvCell).join(",")
    ),
    ...missingLegacy.map((item) => ["missing", item.slug, item.name, "", ""].map(csvCell).join(","))
  ].join("\n") + "\n",
  "utf8"
);

console.log(
  JSON.stringify(
    {
      outputPath,
      collectedCount: collectedCards.length,
      overlapJsonPath,
      overlapCsvPath,
      duplicateCount: duplicateLegacy.length,
      missingCount: missingLegacy.length
    },
    null,
    2
  )
);
