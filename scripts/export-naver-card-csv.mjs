import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const dbRoot = path.join(root, "data", "raw", "naver-cards");
const listPageDir = path.join(dbRoot, "list-pages");
const parsedCardDir = path.join(dbRoot, "parsed-cards");
const exportDir = path.join(dbRoot, "exports");

const now = new Date();
const stamp = now
  .toISOString()
  .replace(/[-:]/g, "")
  .replace(/\.\d{3}Z$/, "Z");

const cardsCsvPath = path.join(exportDir, `naver-cards-${stamp}.csv`);
const manifestPath = path.join(exportDir, `naver-cards-${stamp}.manifest.json`);
const latestCsvPath = path.join(exportDir, "naver-cards-latest.csv");
const latestManifestPath = path.join(exportDir, "naver-cards-latest.manifest.json");

function csvCell(value) {
  if (value === null || value === undefined) return "";
  const text = Array.isArray(value) ? value.join(" | ") : String(value);
  return `"${text.replaceAll('"', '""').replace(/\r?\n/g, " ").trim()}"`;
}

function moneyValue(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(String(value).replace(/[^\d]/g, ""));
  return Number.isFinite(number) ? number : null;
}

function parseBenefitCategories(benefits) {
  if (!Array.isArray(benefits)) return [];
  return benefits
    .map((benefit) => {
      const raw = benefit.rootBenefitCategoryIdName ?? "";
      const [, label = raw] = String(raw).split("|");
      return label.trim();
    })
    .filter(Boolean);
}

async function readJson(filePath, fallback = null) {
  try {
    return JSON.parse(await readFile(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

async function loadListCards() {
  const files = (await readdir(listPageDir)).filter((name) => name.endsWith(".json")).sort();
  const cards = new Map();
  const pages = [];

  for (const file of files) {
    const filePath = path.join(listPageDir, file);
    const page = await readJson(filePath);
    if (!page?.response?.data?.cardAdList) continue;

    const list = page.response.data.cardAdList;
    pages.push({
      file,
      pageNo: page.request?.pageNo ?? null,
      pageSize: page.request?.pageSize ?? null,
      cards: list.cardAds?.length ?? 0,
      totalSize: list.totalSize ?? null,
      capturedAt: page.capturedAt ?? null
    });

    for (const card of list.cardAds ?? []) {
      if (!card?.cardAdId) continue;
      cards.set(String(card.cardAdId), {
        cardAdId: String(card.cardAdId),
        cardName: card.cardName ?? "",
        companyCode: card.companyCode ?? "",
        titleDescription: card.titleDescription ?? "",
        cardImageUrl: card.cardImageUrl ?? "",
        domesticAnnualFee: moneyValue(card.domesticAnnualFee),
        foreignAnnualFee: moneyValue(card.foreignAnnualFee),
        familyAnnualFee: moneyValue(card.familyAnnualFee),
        benefitCategories: parseBenefitCategories(card.benefits),
        releaseAt: card.releaseAt ?? "",
        annualBenefitText: card.annualBenefitStr ?? "",
        eventRewardRate: card.eventData?.rewardRate ?? "",
        eventMaxLimitPrice: card.eventData?.maxLimitPrice ?? "",
        bizType: card.bizType ?? "",
        enableNpayMO: card.enableNpayMO ?? "",
        enableNpayPC: card.enableNpayPC ?? "",
        registerUrlPresent: Boolean(card.registerUrl || card.registerUrlForNoCharge),
        listSourcePage: file
      });
    }
  }

  return { cards, pages };
}

async function loadParsedCards() {
  const files = (await readdir(parsedCardDir)).filter((name) => name.endsWith(".json")).sort();
  const cards = new Map();

  for (const file of files) {
    const card = await readJson(path.join(parsedCardDir, file));
    if (!card?.cardAdId) continue;
    cards.set(String(card.cardAdId), {
      sourceUrl: card.sourceUrl ?? "",
      capturedAt: card.capturedAt ?? "",
      annualFeeText: card.annualFeeText ?? "",
      previousSpendText: card.previousSpendText ?? "",
      summaryBenefitText: card.summaryBenefitText ?? "",
      applyUrlPresent: card.applyUrlPresent ?? "",
      evidenceSnippets: Array.isArray(card.evidenceSnippets) ? card.evidenceSnippets.slice(0, 5).join(" | ") : "",
      parsedSourceFile: file
    });
  }

  return cards;
}

await mkdir(exportDir, { recursive: true });

const { cards: listCards, pages } = await loadListCards();
const parsedCards = await loadParsedCards();
const allIds = [...new Set([...listCards.keys(), ...parsedCards.keys()])].sort((a, b) => Number(a) - Number(b));

const columns = [
  "cardAdId",
  "cardName",
  "companyCode",
  "titleDescription",
  "domesticAnnualFee",
  "foreignAnnualFee",
  "familyAnnualFee",
  "benefitCategories",
  "releaseAt",
  "annualBenefitText",
  "eventRewardRate",
  "eventMaxLimitPrice",
  "bizType",
  "enableNpayMO",
  "enableNpayPC",
  "registerUrlPresent",
  "sourceUrl",
  "cardImageUrl",
  "capturedAt",
  "annualFeeText",
  "previousSpendText",
  "summaryBenefitText",
  "applyUrlPresent",
  "evidenceSnippets",
  "listSourcePage",
  "parsedSourceFile"
];

const rows = [columns.map(csvCell).join(",")];

for (const id of allIds) {
  const list = listCards.get(id) ?? {};
  const parsed = parsedCards.get(id) ?? {};
  const merged = { ...parsed, ...list, cardAdId: id, sourceUrl: parsed.sourceUrl || `https://m-card-search.naver.com/item?cardAdId=${id}` };
  rows.push(columns.map((column) => csvCell(merged[column])).join(","));
}

const csv = `\uFEFF${rows.join("\n")}\n`;
await writeFile(cardsCsvPath, csv, "utf8");
await writeFile(latestCsvPath, csv, "utf8");

const manifest = {
  exportedAt: now.toISOString(),
  source: "naver-card-search",
  dbRoot,
  cardsCsvPath,
  latestCsvPath,
  cardCount: allIds.length,
  listCardCount: listCards.size,
  parsedCardCount: parsedCards.size,
  listPageCount: pages.length,
  columns,
  listPages: pages
};

await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
await writeFile(latestManifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

console.log(JSON.stringify(manifest, null, 2));
