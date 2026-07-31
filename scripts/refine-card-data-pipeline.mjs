import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";

const root = process.cwd();
const rawDir = path.join(root, "data", "raw", "naver-cards");
const rawCardsJsonlPath = path.join(rawDir, "cards.jsonl");
const outDir = path.join(root, "data", "refined-db");
const generatedAt = new Date().toISOString();

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
  TO: "토스뱅크",
  SK: "하나"
};

const categoryMap = [
  ["transport", /대중교통|교통|버스|지하철|택시|후불교통|기후동행/i],
  ["fuel", /주유|충전소|LPG|SK에너지|GS칼텍스|S-OIL|현대오일뱅크/i],
  ["coffee", /커피|카페|베이커리|스타벅스|이디야|투썸|폴바셋/i],
  ["convenience", /편의점|CU|GS25|세븐일레븐|이마트24/i],
  ["delivery", /배달|배달의민족|요기요|쿠팡이츠/i],
  ["dining", /외식|음식|레스토랑|패밀리레스토랑|푸드/i],
  ["shopping_online", /온라인쇼핑|온라인 쇼핑|쿠팡|네이버페이|11번가|G마켓|옥션|SSG|무신사/i],
  ["shopping_offline", /백화점|아울렛|쇼핑|면세점|올리브영|다이소/i],
  ["mart", /마트|대형마트|이마트|홈플러스|롯데마트|트레이더스/i],
  ["telecom", /통신|이동통신|SK텔레콤|KT|LGU|알뜰폰|휴대폰/i],
  ["ott", /OTT|구독|넷플릭스|유튜브|티빙|웨이브|디즈니|멜론|스트리밍/i],
  ["medical", /병원|약국|의료|뷰티|미용|피부|동물병원/i],
  ["education", /교육|학원|서점|어학|시험|도서|온라인서점/i],
  ["travel", /여행|항공|호텔|숙박|공항|라운지|마일|해외|면세/i],
  ["culture", /영화|문화|공연|레저|놀이공원|스포츠|게임/i],
  ["finance", /금융|수수료|ATM|대출|보험/i],
  ["etc", /./]
];

function cleanText(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function flattenText(value) {
  if (value === null || value === undefined) return "";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.map(flattenText).filter(Boolean).join(" ");
  if (typeof value === "object") return Object.values(value).map(flattenText).filter(Boolean).join(" ");
  return "";
}

function csvCell(value) {
  if (value === null || value === undefined) return "";
  if (Array.isArray(value)) return csvCell(value.some((item) => typeof item === "object") ? JSON.stringify(value) : value.join(" | "));
  if (typeof value === "object") return csvCell(JSON.stringify(value));
  return `"${String(value).replaceAll('"', '""').replace(/\r?\n/g, " ").trim()}"`;
}

async function writeCsv(name, headers, rows) {
  const content = [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\n") + "\n";
  await writeFile(path.join(outDir, name), content, "utf8");
}

function hashText(value) {
  return createHash("sha256").update(String(value ?? ""), "utf8").digest("hex");
}

function parseMoney(value) {
  const text = cleanText(String(value ?? "").replace(/,/g, ""));
  const composite = text.match(/(\d+(?:\.\d+)?)\s*만\s*(\d+(?:\.\d+)?)\s*천\s*원?/);
  if (composite) return Math.round(Number(composite[1]) * 10000 + Number(composite[2]) * 1000);
  const match = text.match(/(\d+(?:\.\d+)?)\s*(억원|천만원|백만원|십만원|만원|만|천원|천|원)/);
  if (!match) return 0;
  const amount = Number(match[1]);
  const unit = match[2];
  if (unit === "억원") return Math.round(amount * 100000000);
  if (unit === "천만원") return Math.round(amount * 10000000);
  if (unit === "백만원") return Math.round(amount * 1000000);
  if (unit === "십만원") return Math.round(amount * 100000);
  if (unit === "만원" || unit === "만") return Math.round(amount * 10000);
  if (unit === "천원" || unit === "천") return Math.round(amount * 1000);
  return Math.round(amount);
}

function formatSpendLabel(minSpend, maxSpend) {
  if (maxSpend) return `${Math.round(minSpend / 10000)}만원~${Math.round(maxSpend / 10000)}만원`;
  if (minSpend) return `${Math.round(minSpend / 10000)}만원 이상`;
  return "조건 없음";
}

function parsePercentValues(text) {
  return [...String(text ?? "").matchAll(/(\d+(?:\.\d+)?)\s*%/g)]
    .map((match) => Number(match[1]) / 100)
    .filter((value) => Number.isFinite(value) && value > 0 && value <= 1);
}

function parseWonValues(text) {
  const moneyPattern = /(\d+(?:,\d{3})*|\d+(?:\.\d+)?)\s*(억원|천만원|백만원|십만원|만원|만|천원|천|원)/g;
  return [...String(text ?? "").matchAll(moneyPattern)]
    .map((match) => parseMoney(match[0]))
    .filter((value) => value > 0);
}

function inferCategory(label, text = "") {
  const source = `${label ?? ""} ${text ?? ""}`;
  return categoryMap.find(([, pattern]) => pattern.test(source))?.[0] ?? "etc";
}

function inferRewardType(text) {
  if (/마일|마일리지|스카이패스|Mile/i.test(text)) return "mileage";
  if (/캐시백/i.test(text)) return "cashback";
  if (/적립|포인트|point/i.test(text)) return "point";
  return "discount";
}

function extractMonthlyCap(text) {
  const target = cleanText(text);
  const capPatterns = [
    /(?:월|매월|통합|합산)[^.;\n]{0,35}?(?:할인|적립|캐시백)?\s*한도[^0-9]{0,20}((?:\d+(?:\.\d+)?\s*만\s*\d+(?:\.\d+)?\s*천\s*원?)|(?:\d+(?:,\d{3})*|\d+(?:\.\d+)?)\s*(?:만원|만|천원|천|원))/i,
    /((?:\d+(?:\.\d+)?\s*만\s*\d+(?:\.\d+)?\s*천\s*원?)|(?:\d+(?:,\d{3})*|\d+(?:\.\d+)?)\s*(?:만원|만|천원|천|원))\s*(?:까지|한도|할인한도|적립한도)/i,
    /월\s*최대\s*((?:\d+(?:\.\d+)?\s*만\s*\d+(?:\.\d+)?\s*천\s*원?)|(?:\d+(?:,\d{3})*|\d+(?:\.\d+)?)\s*(?:만원|만|천원|천|원))/i
  ];
  for (const pattern of capPatterns) {
    const match = target.match(pattern);
    if (match) {
      const value = parseMoney(match[1]);
      if (value >= 500 && value <= 300000) return value;
    }
  }
  return 0;
}

function extractMinTransaction(text) {
  const target = cleanText(text);
  const match = target.match(/(?:건당|1회|결제|이용금액|승인금액)[^.;\n]{0,25}?((?:\d+(?:\.\d+)?\s*만\s*\d+(?:\.\d+)?\s*천\s*원?)|(?:\d+(?:,\d{3})*|\d+(?:\.\d+)?)\s*(?:만원|만|천원|천|원))\s*이상/i);
  return match ? parseMoney(match[1]) : 0;
}

function extractRequiredSpend(text, fallback = 0) {
  const target = cleanText(text);
  if (/조건\s*없음|실적\s*없음|실적[·\s]*한도\s*없이|조건없이|조건\s*없이/i.test(target)) return 0;
  const scopedIndex = target.search(/전월|지난달|직전|기준실적|이용실적|카드\s*사용금액/);
  const scoped = scopedIndex >= 0 ? target.slice(scopedIndex, scopedIndex + 180) : target;
  const values = [...scoped.matchAll(/((?:\d+(?:\.\d+)?\s*만\s*\d+(?:\.\d+)?\s*천\s*원?)|(?:\d+(?:,\d{3})*|\d+(?:\.\d+)?)\s*(?:백만원|십만원|만원|만|천원|천|원))\s*(?:이상|부터)/g)]
    .map((match) => parseMoney(match[1]))
    .filter((value) => value >= 100000 && value <= 5000000);
  return values.length ? Math.min(...values) : fallback;
}

function extractCountCap(text, unit) {
  const pattern = unit === "annual" ? /연\s*(\d+)\s*회/ : /월\s*(\d+)\s*회/;
  const match = cleanText(text).match(pattern);
  return match ? Number(match[1]) : "";
}

function inclusionPolicy(text) {
  const target = cleanText(text);
  if (/할인대상\s*가맹점\s*이용액은\s*50%\s*반영|50%\s*반영/.test(target)) return { status: "partial", ratio: 0.5 };
  if (/할인.*(?:실적|이용금액).*제외|할인받은.*제외|실적.*제외.*할인/.test(target)) return { status: "excluded", ratio: 0 };
  if (/할인.*(?:실적|이용금액).*포함|실적.*포함/.test(target)) return { status: "included", ratio: 1 };
  return { status: "unknown", ratio: "" };
}

function splitLines(value) {
  if (Array.isArray(value)) return value.flatMap(splitLines);
  if (value === null || value === undefined) return [];
  if (typeof value === "object") return Object.values(value).flatMap(splitLines);
  return String(value)
    .split(/\r?\n|ㆍ|•|\u2022/)
    .map(cleanText)
    .filter(Boolean);
}

function extractApolloState(html) {
  const marker = "window.__APOLLO_STATE__=";
  const index = html.indexOf(marker);
  if (index < 0) return null;
  const start = html.indexOf("{", index + marker.length);
  if (start < 0) return null;
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < html.length; i += 1) {
    const ch = html[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === "{") depth += 1;
    else if (ch === "}") {
      depth -= 1;
      if (depth === 0) {
        return JSON.parse(html.slice(start, i + 1));
      }
    }
  }
  return null;
}

function findApolloCard(state, cardAdId) {
  const rootQuery = state?.ROOT_QUERY ?? {};
  for (const value of Object.values(rootQuery)) {
    const card = value?.cardAd;
    if (card && String(card.cardAdId) === String(cardAdId)) return card;
  }
  return null;
}

async function loadRawEntries() {
  const lines = (await readFile(rawCardsJsonlPath, "utf8")).split(/\r?\n/).filter(Boolean);
  const byId = new Map();
  for (const line of lines) {
    let entry;
    try {
      entry = JSON.parse(line);
    } catch {
      continue;
    }
    const cardAdId = entry?.itemCard?.cardAdId ?? entry?.url?.match(/cardAdId=(\d+)/)?.[1];
    if (!cardAdId) continue;
    const key = String(cardAdId);
    const previous = byId.get(key);
    const score = (entry.itemCard ? 3 : 0) + (entry.snapshot ? 2 : 0) + (entry.benefitSnippets?.length ?? 0);
    if (!previous || score >= previous.__score) byId.set(key, { ...entry, __score: score });
  }
  return [...byId.values()];
}

async function loadSnapshotCard(entry) {
  if (!entry.snapshot) return { apolloCard: null, html: "" };
  try {
    const html = await readFile(entry.snapshot, "utf8");
    const state = extractApolloState(html);
    return { apolloCard: findApolloCard(state, entry.itemCard?.cardAdId), html };
  } catch {
    return { apolloCard: null, html: "" };
  }
}

function cardTextBundle(entry, apolloCard) {
  return cleanText(
    [
      entry.title,
      entry.annualFeeText,
      entry.previousSpendText,
      ...(entry.benefitSnippets ?? []),
      flattenText(entry.itemCard ?? {}),
      flattenText(apolloCard ?? {})
    ].join(" ")
  );
}

function extractCapTiers(text, fallbackSpend, fallbackCap) {
  const money = String.raw`(?:\d+(?:\.\d+)?\s*만\s*\d+(?:\.\d+)?\s*천\s*원?|(?:\d+(?:,\d{3})*|\d+(?:\.\d+)?)\s*(?:억원|천만원|백만원|십만원|만원|만|천원|천|원))`;
  const rows = new Map();

  function add(minText, maxText, capText, sourceText) {
    const minSpend = parseMoney(minText);
    const maxSpend = maxText ? parseMoney(maxText) : "";
    const totalCap = parseMoney(capText);
    if (minSpend < 0 || minSpend > 10000000 || totalCap < 500 || totalCap > 500000) return;
    if (maxSpend && maxSpend <= minSpend) return;
    const channelCaps = [];
    for (const match of sourceText.matchAll(new RegExp(String.raw`(${money})\s*\(([^)]+)\)`, "g"))) {
      const cap = parseMoney(match[1]);
      const label = cleanText(match[2]);
      if (cap > 0 && cap <= totalCap && label) channelCaps.push({ label, cap });
    }
    const key = `${minSpend}-${maxSpend}`;
    const row = {
      minSpend,
      maxSpend,
      totalCap,
      tierLabel: formatSpendLabel(minSpend, maxSpend),
      channelCaps,
      sourceText: cleanText(sourceText).slice(0, 800),
      confidence: /총\s*(?:할인|적립|캐시백)?\s*한도/.test(sourceText) ? 0.95 : 0.75
    };
    const previous = rows.get(key);
    if (!previous || row.confidence > previous.confidence || row.totalCap > previous.totalCap) rows.set(key, row);
  }

  const rangeWithTotal = new RegExp(
    String.raw`(${money})\s*(?:이상|부터)?\s*(?:~|-|–)\s*(${money})\s*(?:미만|이하)?[\s\S]{0,260}?총\s*(?:할인|적립|캐시백)?\s*한도\s*(${money})`,
    "g"
  );
  for (const match of text.matchAll(rangeWithTotal)) add(match[1], match[2], match[3], match[0]);

  const rangeSimple = new RegExp(
    String.raw`(?:이용금액|실적|사용금액|전월실적)?\s*(${money})\s*이상\s*(${money})\s*미만\s*[:：]?\s*(${money})\s*(?:할인|적립|캐시백|한도)`,
    "g"
  );
  for (const match of text.matchAll(rangeSimple)) add(match[1], match[2], match[3], match[0]);

  const openWithTotal = new RegExp(
    String.raw`(${money})\s*(?:이상|부터)(?!\s*(?:~|–))[\s\S]{0,260}?총\s*(?:할인|적립|캐시백)?\s*한도\s*(${money})`,
    "g"
  );
  for (const match of text.matchAll(openWithTotal)) {
    if (match[0].includes("~")) continue;
    add(match[1], "", match[2], match[0]);
  }

  const openSimple = new RegExp(
    String.raw`(?:이용금액|실적|사용금액|전월실적)?\s*(${money})\s*이상\s*[:：]?\s*(${money})\s*(?:할인|적립|캐시백|한도)`,
    "g"
  );
  for (const match of text.matchAll(openSimple)) {
    if (match[0].includes("~")) continue;
    add(match[1], "", match[2], match[0]);
  }

  if (rows.size === 0 && fallbackCap > 0) {
    add(`${fallbackSpend || 0}원`, "", `${fallbackCap}원`, "fallback_from_existing_normalized_card");
  }

  return [...rows.values()].sort((a, b) => a.minSpend - b.minSpend || (Number(a.maxSpend) || Infinity) - (Number(b.maxSpend) || Infinity));
}

function extractExclusionItems(text) {
  const items = new Set();
  const lines = splitLines(text);
  for (const line of lines) {
    if (!/제외|미포함|포함되지|할인.*불가|적립.*불가/.test(line)) continue;
    const normalized = line.replace(/[\[\]]/g, " ");
    for (const keyword of ["상품권", "선불카드", "기프트카드", "국세", "지방세", "공과금", "아파트관리비", "대학등록금", "보험료", "연회비", "수수료", "무이자할부", "현금서비스", "카드론", "포인트 충전", "교통카드 충전"]) {
      if (normalized.includes(keyword)) items.add(keyword);
    }
  }
  return [...items];
}

function buildBenefitRules(cardId, apolloCard, entry, fallbackSpend) {
  const benefits = apolloCard?.benefits?.length ? apolloCard.benefits : [];
  const rows = [];
  let index = 0;

  for (const benefit of benefits) {
    const benefitName = benefit.benefitCategoryName ?? "기타";
    const descriptionGroups = benefit.descriptions?.length ? benefit.descriptions : [benefit.summary ?? []];
    for (const group of descriptionGroups) {
      const lines = splitLines(group);
      const groupText = cleanText(lines.join(" "));
      const titleLines = lines.filter((line) => /할인|적립|캐시백|마일|무료|면제|제공|우대/.test(line));
      const ruleTexts = titleLines.length ? titleLines : lines.slice(0, 1);
      for (const ruleText of ruleTexts) {
        const sourceText = cleanText(`${ruleText} ${groupText}`);
        const rates = parsePercentValues(sourceText);
        const wonValues = parseWonValues(ruleText);
        const monthlyCap = extractMonthlyCap(sourceText);
        const fixedReward = wonValues.find((value) => value <= 300000 && !/실적|이용금액|사용금액/.test(ruleText)) ?? "";
        const rewardRate = rates.length ? Math.max(...rates) : "";
        const requiredSpend = extractRequiredSpend(sourceText, fallbackSpend);
        const inclusion = inclusionPolicy(sourceText);
        const category = inferCategory(benefitName, sourceText);
        const confidenceParts = [
          rewardRate || fixedReward ? 0.25 : 0,
          requiredSpend !== "" ? 0.15 : 0,
          monthlyCap ? 0.2 : 0,
          sourceText.length > 20 ? 0.15 : 0,
          benefits.length > 0 ? 0.15 : 0,
          inclusion.status !== "unknown" ? 0.1 : 0
        ];
        const confidence = Number(confidenceParts.reduce((sum, value) => sum + value, 0).toFixed(2));
        index += 1;
        rows.push({
          benefitId: `${cardId}-benefit-${index}`,
          category,
          benefitName,
          ruleName: cleanText(ruleText).slice(0, 140),
          rewardType: inferRewardType(sourceText),
          rewardRate,
          fixedReward,
          monthlyCap,
          minTransactionAmount: extractMinTransaction(sourceText),
          monthlyCountCap: extractCountCap(sourceText, "monthly"),
          annualCountCap: extractCountCap(sourceText, "annual"),
          requiredSpend,
          merchantScope: benefitName,
          inclusionStatus: inclusion.status,
          inclusionRatio: inclusion.ratio,
          sourceText: sourceText.slice(0, 1200),
          extractionConfidence: confidence
        });
      }
    }
  }

  if (rows.length === 0) {
    const fallbackText = cleanText(`${entry.itemCard?.titleDescription ?? ""} ${entry.itemCard?.summaryBenefitText ?? ""}`);
    const rates = parsePercentValues(fallbackText);
    rows.push({
      benefitId: `${cardId}-benefit-1`,
      category: inferCategory("", fallbackText),
      benefitName: "summary",
      ruleName: fallbackText.slice(0, 140) || "summary benefit",
      rewardType: inferRewardType(fallbackText),
      rewardRate: rates.length ? Math.max(...rates) : "",
      fixedReward: "",
      monthlyCap: 0,
      minTransactionAmount: 0,
      monthlyCountCap: "",
      annualCountCap: "",
      requiredSpend: fallbackSpend,
      merchantScope: "",
      inclusionStatus: "unknown",
      inclusionRatio: "",
      sourceText: fallbackText,
      extractionConfidence: 0.25
    });
  }

  return rows;
}

function annualFee(card) {
  const values = [card?.domesticAnnualFee, card?.foreignAnnualFee]
    .map((value) => Number(value ?? 0))
    .filter((value) => Number.isFinite(value) && value > 0);
  return values.length ? Math.min(...values) : 0;
}

function confidenceAndReasons({ apolloCard, benefitRules, capTiers, baseSpend, annualFeeValue, text }) {
  const reasons = [];
  let score = 0;
  if (apolloCard) score += 20;
  else reasons.push("apollo_card_missing");
  if (baseSpend > 0 || /조건\s*없음|실적\s*없음/.test(text)) score += 15;
  else reasons.push("base_spend_unclear");
  if (annualFeeValue >= 0) score += 10;
  if (benefitRules.length > 1 && benefitRules.some((rule) => rule.rewardRate || rule.fixedReward)) score += 20;
  else reasons.push("benefit_rules_weak");
  if (capTiers.length > 0 && capTiers.some((tier) => tier.totalCap > 0)) score += 20;
  else reasons.push("cap_tiers_missing");
  if (benefitRules.some((rule) => rule.inclusionStatus !== "unknown")) score += 5;
  else reasons.push("performance_inclusion_unknown");
  if (benefitRules.some((rule) => rule.monthlyCap > 0) || capTiers.length > 0) score += 10;
  else reasons.push("monthly_cap_unclear");

  const status = score >= 80 ? "ready_for_review" : score >= 55 ? "partial_review" : "manual_required";
  return { score, status, reasons };
}

async function main() {
  await mkdir(outDir, { recursive: true });
  const entries = await loadRawEntries();

  const cardsRows = [];
  const performanceRows = [];
  const capTierRows = [];
  const benefitRows = [];
  const capGroupRows = [];
  const exclusionRows = [];
  const textBlockRows = [];
  const reviewRows = [];
  const rawRows = [];

  for (const entry of entries) {
    const item = entry.itemCard ?? {};
    const cardAdId = String(item.cardAdId ?? entry.url?.match(/cardAdId=(\d+)/)?.[1] ?? "");
    if (!cardAdId) continue;
    const cardId = `naver-card-${cardAdId}`;
    const { apolloCard, html } = await loadSnapshotCard(entry);
    const card = apolloCard ?? item;
    const fullText = cardTextBundle(entry, apolloCard);
    const fee = annualFee(card);
    const baseRecord = card.baseRecord ?? {};
    const baseSpend = Number(baseRecord.valueFrom ?? 0) || extractRequiredSpend(fullText, 0);
    const baseSpendTo = Number(baseRecord.valueTo ?? 0) || "";
    const inclusion = inclusionPolicy(fullText);
    const capTiers = extractCapTiers(fullText, baseSpend, extractMonthlyCap(fullText));
    const benefitRules = buildBenefitRules(cardId, apolloCard, entry, baseSpend);
    const exclusions = extractExclusionItems(fullText);
    const quality = confidenceAndReasons({ apolloCard, benefitRules, capTiers, baseSpend, annualFeeValue: fee, text: fullText });

    cardsRows.push([
      cardId,
      cardAdId,
      card.cardName ?? item.cardName ?? "",
      issuerMap[card.companyCode] ?? card.companyName ?? item.companyCode ?? "",
      /체크/.test(`${card.cardName ?? ""} ${fullText}`) ? "check" : "credit",
      card.active === false ? "inactive_or_unknown" : "active_or_unknown",
      quality.status,
      quality.score,
      card.titleDescription ?? item.titleDescription ?? "",
      fee,
      card.domesticAnnualFee ?? item.domesticAnnualFee ?? "",
      card.foreignAnnualFee ?? item.foreignAnnualFee ?? "",
      card.familyAnnualFee ?? item.familyAnnualFee ?? "",
      baseSpend,
      capTiers.length ? Math.max(...capTiers.map((tier) => tier.totalCap)) : "",
      card.releaseAt ?? item.releaseAt ?? "",
      card.cardImageUrl ?? item.cardImageUrl ?? "",
      card.detailUrl ?? item.sourceUrl ?? entry.url ?? "",
      card.registerUrl ? "true" : "",
      generatedAt
    ]);

    performanceRows.push([
      `${cardId}-performance-1`,
      cardId,
      baseSpend,
      baseSpendTo,
      baseRecord.term ?? "before",
      baseRecord.unit ?? "month",
      baseRecord.unitValue ?? 1,
      baseRecord.method ?? "sum",
      inclusion.status,
      inclusion.ratio,
      fullText.match(/전월실적.{0,260}/)?.[0] ?? fullText.match(/기준실적.{0,260}/)?.[0] ?? "",
      generatedAt
    ]);

    capTiers.forEach((tier, index) => {
      const tierId = `${cardId}-tier-${index + 1}-${tier.minSpend}`;
      capTierRows.push([
        tierId,
        cardId,
        tier.minSpend,
        tier.maxSpend,
        tier.totalCap,
        tier.tierLabel,
        tier.channelCaps,
        tier.confidence,
        tier.sourceText,
        generatedAt
      ]);
      capGroupRows.push([
        `${tierId}-main-cap`,
        cardId,
        "main_monthly_cap",
        tierId,
        tier.totalCap,
        benefitRules.map((rule) => rule.benefitId),
        /별도|별도\s*운영/.test(tier.sourceText) ? "true" : "false",
        tier.sourceText,
        generatedAt
      ]);
    });

    benefitRules.forEach((rule) => {
      benefitRows.push([
        rule.benefitId,
        cardId,
        rule.category,
        rule.benefitName,
        rule.ruleName,
        rule.rewardType,
        rule.rewardRate,
        rule.fixedReward,
        rule.monthlyCap,
        rule.minTransactionAmount,
        rule.monthlyCountCap,
        rule.annualCountCap,
        rule.requiredSpend,
        rule.merchantScope,
        rule.inclusionStatus,
        rule.inclusionRatio,
        rule.extractionConfidence,
        rule.sourceText,
        generatedAt
      ]);
    });

    exclusions.forEach((itemText, index) => {
      exclusionRows.push([`${cardId}-exclusion-${index + 1}`, cardId, "raw_detected", itemText, generatedAt]);
    });

    const textBlocks = [
      ["base", flattenText(card.baseRecord ?? item.previousSpendText ?? "")],
      ["annual_fee", flattenText(card.annualBrandFees ?? item.annualFeeText ?? "")],
      ["rate_notices", flattenText(card.rateNotices ?? [])],
      ["benefit_notices", flattenText(card.benefitNotices ?? [])],
      ["benefits", flattenText(card.benefits ?? [])],
      ["collector_snippets", flattenText(entry.benefitSnippets ?? [])]
    ];
    textBlocks.forEach(([blockType, blockText], index) => {
      const clean = cleanText(blockText);
      if (!clean) return;
      textBlockRows.push([
        `${cardId}-text-${index + 1}`,
        cardId,
        blockType,
        clean.length,
        hashText(clean),
        clean.slice(0, 4000),
        generatedAt
      ]);
    });

    reviewRows.push([
      `${cardId}-review`,
      cardId,
      quality.status,
      quality.score,
      quality.reasons.join(" | "),
      capTiers.length,
      benefitRules.length,
      benefitRules.filter((rule) => rule.extractionConfidence < 0.5).length,
      exclusions.length,
      generatedAt
    ]);

    rawRows.push([
      `${cardId}-raw`,
      cardId,
      entry.url ?? item.sourceUrl ?? "",
      entry.snapshot ?? "",
      html ? hashText(html) : "",
      fullText.length,
      hashText(fullText),
      generatedAt
    ]);
  }

  await Promise.all([
    writeCsv(
      "refined_cards.csv",
      [
        "card_id",
        "source_card_id",
        "card_name",
        "issuer",
        "card_type",
        "status",
        "refine_status",
        "confidence_score",
        "summary",
        "annual_fee",
        "annual_fee_domestic",
        "annual_fee_foreign",
        "annual_fee_family",
        "base_spend_amount",
        "max_monthly_cap",
        "released_at",
        "card_image_url",
        "detail_url",
        "apply_url_present",
        "exported_at"
      ],
      cardsRows
    ),
    writeCsv(
      "refined_performance_rules.csv",
      [
        "performance_rule_id",
        "card_id",
        "base_spend_amount",
        "base_spend_to",
        "period_term",
        "period_unit",
        "period_unit_value",
        "method",
        "discounted_spend_counts_for_performance",
        "discounted_spend_count_ratio",
        "source_text",
        "exported_at"
      ],
      performanceRows
    ),
    writeCsv(
      "refined_cap_tiers.csv",
      ["tier_id", "card_id", "min_spend", "max_spend", "total_monthly_cap", "tier_label", "channel_caps", "extraction_confidence", "source_text", "exported_at"],
      capTierRows
    ),
    writeCsv(
      "refined_benefit_rules.csv",
      [
        "benefit_id",
        "card_id",
        "category",
        "benefit_group_name",
        "benefit_rule_name",
        "reward_type",
        "reward_rate",
        "fixed_reward_amount",
        "monthly_cap",
        "min_transaction_amount",
        "monthly_count_cap",
        "annual_count_cap",
        "required_spend",
        "merchant_scope",
        "discounted_spend_counts_for_performance",
        "discounted_spend_count_ratio",
        "extraction_confidence",
        "source_text",
        "exported_at"
      ],
      benefitRows
    ),
    writeCsv(
      "refined_cap_groups.csv",
      ["cap_group_id", "card_id", "group_name", "tier_id", "group_monthly_cap", "included_benefit_ids", "is_separate_from_main_cap", "source_text", "exported_at"],
      capGroupRows
    ),
    writeCsv("refined_exclusions.csv", ["exclusion_id", "card_id", "scope", "item", "exported_at"], exclusionRows),
    writeCsv("refined_text_blocks.csv", ["text_block_id", "card_id", "block_type", "text_length", "text_hash", "source_text", "exported_at"], textBlockRows),
    writeCsv("refined_review_queue.csv", ["review_id", "card_id", "refine_status", "confidence_score", "review_reasons", "cap_tier_count", "benefit_rule_count", "low_confidence_benefit_rule_count", "exclusion_count", "exported_at"], reviewRows),
    writeCsv("refined_raw_snapshots.csv", ["raw_id", "card_id", "source_url", "snapshot_path", "snapshot_hash", "raw_text_length", "raw_text_hash", "exported_at"], rawRows)
  ]);

  const summary = {
    generatedAt,
    outDir,
    cards: cardsRows.length,
    performanceRules: performanceRows.length,
    capTiers: capTierRows.length,
    benefitRules: benefitRows.length,
    capGroups: capGroupRows.length,
    exclusions: exclusionRows.length,
    textBlocks: textBlockRows.length,
    reviewQueue: reviewRows.length,
    statusCounts: reviewRows.reduce((acc, row) => {
      acc[row[2]] = (acc[row[2]] ?? 0) + 1;
      return acc;
    }, {})
  };

  await writeFile(path.join(outDir, "refinement_summary.json"), `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  await writeFile(
    path.join(outDir, "README.md"),
    `# Avocard Refined Card Data Pipeline\n\nGenerated at: ${generatedAt}\n\nThis folder is generated from raw Naver collector data and snapshot HTML. It is the precision-refinement layer before importing into an online DB.\n\nMain files:\n- refined_cards.csv\n- refined_performance_rules.csv\n- refined_cap_tiers.csv\n- refined_benefit_rules.csv\n- refined_cap_groups.csv\n- refined_exclusions.csv\n- refined_text_blocks.csv\n- refined_review_queue.csv\n- refined_raw_snapshots.csv\n- refinement_summary.json\n\nUse refined_review_queue.csv first. Cards marked manual_required or partial_review should not be trusted for production ranking without review.\n`,
    "utf8"
  );

  console.log(JSON.stringify(summary, null, 2));
}

await main();
