import { mkdir, readFile, writeFile, appendFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";

const root = process.cwd();
const dbRoot = path.join(root, "data", "raw", "naver-cards");
const snapshotDir = path.join(dbRoot, "snapshots");
const parsedCardDir = path.join(dbRoot, "parsed-cards");
const listPageDir = path.join(dbRoot, "list-pages");
const queuePath = path.join(dbRoot, "queue.json");
const statePath = path.join(dbRoot, "state.json");
const cardsPath = path.join(dbRoot, "cards.jsonl");
const failuresPath = path.join(dbRoot, "failures.jsonl");
const robotsCachePath = path.join(dbRoot, "robots-cache.json");

const defaultSeedUrl =
  "https://m-card-search.naver.com/list?sortMethod=ri&ptn=1&bizType=CPC&companyCode=&brandNames=&benefitCategoryIds=&subBenefitCategoryIds=&affiliateIds=&minAnnualFee=0&maxAnnualFee=0&basePayment=0";

const mode = getArg("mode", "status");
const seedUrl = getArg("url", defaultSeedUrl);
const maxPages = Number(getArg("max", process.env.NAVER_COLLECT_MAX ?? "1"));
const delayMs = Number(getArg("delay", process.env.NAVER_COLLECT_DELAY_MS ?? "90000"));
const jitterMs = Number(getArg("jitter", process.env.NAVER_COLLECT_JITTER_MS ?? "30000"));
const daemonDelayMs = Number(getArg("daemon-delay", process.env.NAVER_COLLECT_DAEMON_DELAY_MS ?? "1000"));
const daemonJitterMs = Number(getArg("daemon-jitter", process.env.NAVER_COLLECT_DAEMON_JITTER_MS ?? "9000"));
const idleDelayMs = Number(getArg("idle-delay", process.env.NAVER_COLLECT_IDLE_DELAY_MS ?? "10000"));
const idleJitterMs = Number(getArg("idle-jitter", process.env.NAVER_COLLECT_IDLE_JITTER_MS ?? "50000"));
const daemonCyclesArg = getArg("cycles", process.env.NAVER_COLLECT_DAEMON_CYCLES ?? "0");
const daemonCycles = Number(daemonCyclesArg);
const timeoutMs = Number(getArg("timeout", process.env.NAVER_COLLECT_TIMEOUT_MS ?? "20000"));
const listPageSize = Number(getArg("page-size", process.env.NAVER_COLLECT_LIST_PAGE_SIZE ?? "10"));
const listPageNoArg = getArg("page-no", process.env.NAVER_COLLECT_LIST_PAGE_NO ?? "");
const maxListPages = Number(getArg("list-pages", process.env.NAVER_COLLECT_LIST_PAGES ?? "1"));

const userAgent =
  process.env.NAVER_COLLECT_USER_AGENT ??
  "AvocardResearch/0.1 (+local slow collection; randomized delay; contact owner)";

const smartSearchQuery = `query smartSearch(
  $cardAdIds: [Int]
  $companyCode: [String]
  $brandNames: [String]
  $benefitCategoryIds: [Int]
  $subBenefitCategoryIds: [Int]
  $affiliateIds: [Int]
  $maxAnnualFee: Int
  $minAnnualFee: Int
  $basePayment: Int
  $pageNo: Int = 1
  $pageSize: Int = 10
  $device: AdDeviceType
  $sortMethod: SortMethod
  $where: String
  $isRefetch: Boolean
  $bizType: BizType
  $searchedAgeGroup: Int
  $searchedGender: String
) {
  cardAdList(
    cardAdIds: $cardAdIds
    companyCode: $companyCode
    brandNames: $brandNames
    benefitCategoryIds: $benefitCategoryIds
    subBenefitCategoryIds: $subBenefitCategoryIds
    affiliateIds: $affiliateIds
    maxAnnualFee: $maxAnnualFee
    minAnnualFee: $minAnnualFee
    basePayment: $basePayment
    pageNo: $pageNo
    pageSize: $pageSize
    device: $device
    sortMethod: $sortMethod
    where: $where
    isRefetch: $isRefetch
    bizType: $bizType
    searchedAgeGroup: $searchedAgeGroup
    searchedGender: $searchedGender
  ) {
    cardAds {
      cardAdId
      cardName
      companyCode
      titleDescription
      cardImage
      cardImageUrl
      registerUrl
      registerUrlForNoCharge
      domesticAnnualFee
      foreignAnnualFee
      familyAnnualFee
      enableNpayMO
      enableNpayPC
      impBeacon
      benefits {
        order
        rootBenefitCategoryIdName
        iconFileName
        iconFileNameUrl
      }
      releaseAt
      annualBenefitStr
      eventData {
        rewardRate
        maxLimitPrice
      }
      bizType
      isMinCPC
      isVisibleLimitCheckBanner
    }
    totalSize
    totalMaxLimitPrice
    customReportKeyword
    nvkwd
    bt
    limitCheckBanner {
      impBeacon
      clkBeacon
    }
  }
}`;

function getArg(name, fallback) {
  const prefix = `--${name}=`;
  const arg = process.argv.find((item) => item.startsWith(prefix));
  return arg ? arg.slice(prefix.length) : fallback;
}

async function ensureDb() {
  await mkdir(snapshotDir, { recursive: true });
  await mkdir(parsedCardDir, { recursive: true });
  await mkdir(listPageDir, { recursive: true });
  await ensureJson(queuePath, []);
  await ensureJson(statePath, { visited: [], discovered: [], list: { nextPageNo: 1, totalSize: null, completed: false }, updatedAt: null });
  await ensureJson(robotsCachePath, {});
}

async function ensureJson(filePath, value) {
  try {
    await readFile(filePath, "utf8");
  } catch {
    await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  }
}

async function readJson(filePath, fallback) {
  try {
    return JSON.parse(await readFile(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

async function writeJson(filePath, value) {
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function getListState(state) {
  return {
    nextPageNo: Number(state.list?.nextPageNo ?? 1),
    totalSize: state.list?.totalSize ?? null,
    completed: Boolean(state.list?.completed),
    updatedAt: state.list?.updatedAt ?? null
  };
}

function hashUrl(url) {
  return createHash("sha256").update(url).digest("hex").slice(0, 16);
}

function normalizeUrl(href, baseUrl) {
  try {
    const url = new URL(href.replaceAll("\\u0026", "&"), baseUrl);
    url.hash = "";
    return url.toString();
  } catch {
    return null;
  }
}

function isLikelyCardUrl(url, options = {}) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname !== "m-card-search.naver.com") return false;
    if (options.includeList && parsed.pathname === "/list") return true;
    if (parsed.pathname === "/item" && parsed.searchParams.has("cardAdId")) return true;
    if (parsed.searchParams.has("cardId")) return true;
    if (parsed.searchParams.has("cardNo")) return true;
    return false;
  } catch {
    return false;
  }
}

function extractLinks(html, baseUrl) {
  const links = new Set();
  const hrefPattern = /href=["']([^"']+)["']/g;
  const urlPattern = /https?:\\?\/\\?\/m-card-search\.naver\.com[^\s"'<>\\]+/g;

  for (const match of html.matchAll(hrefPattern)) {
    const normalized = normalizeUrl(match[1], baseUrl);
    if (normalized && isLikelyCardUrl(normalized)) links.add(normalized);
  }

  for (const match of html.matchAll(urlPattern)) {
    const normalized = normalizeUrl(match[0].replaceAll("\\/", "/"), baseUrl);
    if (normalized && isLikelyCardUrl(normalized)) links.add(normalized);
  }

  return [...links];
}

function extractListCards(html, baseUrl) {
  const cards = new Map();
  const itemPattern =
    /cardAdId["']?\s*:\s*(\d+)[\s\S]{0,1200}?cardName["']?\s*:\s*["']([^"']+)["'][\s\S]{0,1200}?companyCode["']?\s*:\s*["']([^"']+)["'][\s\S]{0,1200}?titleDescription["']?\s*:\s*["']([^"']*)["']/g;
  const anchorPattern =
    /href=["']\/item\?cardAdId=(\d+)["'][\s\S]{0,800}?<b class=["']name["']>([^<]+)<\/b>[\s\S]{0,400}?<p class=["']desc["']>([^<]*)<\/p>/g;

  for (const match of html.matchAll(itemPattern)) {
    const [, cardAdId, cardName, companyCode, titleDescription] = match;
    cards.set(cardAdId, {
      cardAdId,
      cardName,
      companyCode,
      titleDescription,
      url: normalizeUrl(`/item?cardAdId=${cardAdId}`, baseUrl)
    });
  }

  for (const match of html.matchAll(anchorPattern)) {
    const [, cardAdId, cardName, titleDescription] = match;
    if (!cards.has(cardAdId)) {
      cards.set(cardAdId, {
        cardAdId,
        cardName,
        companyCode: null,
        titleDescription,
        url: normalizeUrl(`/item?cardAdId=${cardAdId}`, baseUrl)
      });
    }
  }

  return [...cards.values()].filter((card) => card.url);
}

function stripTags(value) {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function firstMatch(text, patterns) {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[0].slice(0, 160);
  }
  return null;
}

function snippets(text, keywords) {
  return keywords
    .map((keyword) => {
      const index = text.indexOf(keyword);
      if (index < 0) return null;
      return text.slice(Math.max(0, index - 60), Math.min(text.length, index + 160));
    })
    .filter(Boolean)
    .slice(0, 12);
}

function parseCardPage(html, url) {
  const text = stripTags(html);
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim() ?? null;
  const jsonLd = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)].map(
    (match) => match[1].trim()
  );

  return {
    source: "naver-card-search",
    url,
    capturedAt: new Date().toISOString(),
    title,
    likelyName: firstMatch(text, [/[^ ]+(카드|체크카드|신용카드)/]),
    annualFeeText: firstMatch(text, [/연회비.{0,80}/, /국내전용.{0,80}/, /해외겸용.{0,80}/]),
    previousSpendText: firstMatch(text, [/전월.{0,40}(실적|이용금액).{0,100}/, /실적.{0,80}/]),
    benefitSnippets: snippets(text, [
      "할인",
      "적립",
      "캐시백",
      "전월",
      "한도",
      "연회비",
      "교통",
      "커피",
      "배달",
      "주유",
      "통신",
      "OTT",
      "쇼핑"
    ]),
    jsonLd,
    textLength: text.length
  };
}

function parseNaverPage(html, url) {
  const parsedUrl = new URL(url);
  const base = parseCardPage(html, url);
  const listCards = parsedUrl.pathname.includes("/list") ? extractListCards(html, url) : [];
  const itemCard = parsedUrl.pathname.includes("/item") ? extractItemCard(html, url) : null;

  return {
    ...base,
    pageType: parsedUrl.pathname.includes("/item") ? "item" : parsedUrl.pathname.includes("/list") ? "list" : "unknown",
    listCards,
    itemCard
  };
}

function cleanText(value) {
  return String(value ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractMeta(html, name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`<meta[^>]+(?:property|name)=["']${escaped}["'][^>]+content=["']([^"']*)["'][^>]*>`, "i");
  return html.match(pattern)?.[1]?.trim() ?? null;
}

function extractNextDataObject(html) {
  const match =
    html.match(/<script[^>]+id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i) ??
    html.match(/window\.__INITIAL_STATE__\s*=\s*({[\s\S]*?});/);
  if (!match) return null;
  try {
    return JSON.parse(match[1]);
  } catch {
    return null;
  }
}

function findObjectsByKey(value, keyName, results = []) {
  if (!value || typeof value !== "object") return results;
  if (Array.isArray(value)) {
    value.forEach((item) => findObjectsByKey(item, keyName, results));
    return results;
  }
  if (Object.prototype.hasOwnProperty.call(value, keyName)) results.push(value);
  Object.values(value).forEach((item) => findObjectsByKey(item, keyName, results));
  return results;
}

function firstJsonObject(html, keyName) {
  const direct = extractNextDataObject(html);
  const fromNext = findObjectsByKey(direct, keyName)[0];
  if (fromNext) return fromNext;

  const keyIndex = html.indexOf(`"${keyName}"`);
  if (keyIndex < 0) return null;
  const start = html.lastIndexOf("{", keyIndex);
  const end = html.indexOf("}", keyIndex + keyName.length);
  if (start < 0 || end < 0) return null;
  try {
    return JSON.parse(html.slice(start, end + 1));
  } catch {
    return null;
  }
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
      const raw = benefit.rootBenefitCategoryIdName ?? benefit.name ?? benefit.label ?? "";
      const [, label = raw] = String(raw).split("|");
      return {
        order: benefit.order ?? null,
        idName: raw || null,
        label: cleanText(label),
        iconUrl: benefit.iconFileNameUrl ?? null
      };
    })
    .filter((benefit) => benefit.label);
}

function listCardToSourceCard(card) {
  if (!card?.cardAdId) return null;
  const cardAdId = String(card.cardAdId);
  return {
    source: "naver-card-search",
    sourceType: "graphql-list",
    cardAdId,
    cardName: card.cardName ?? null,
    companyCode: card.companyCode ?? null,
    titleDescription: card.titleDescription ?? null,
    cardImageUrl: card.cardImageUrl ?? null,
    domesticAnnualFee: moneyValue(card.domesticAnnualFee),
    foreignAnnualFee: moneyValue(card.foreignAnnualFee),
    familyAnnualFee: moneyValue(card.familyAnnualFee),
    benefitCategories: parseBenefitCategories(card.benefits),
    releaseAt: card.releaseAt ?? null,
    annualBenefitText: card.annualBenefitStr ?? null,
    eventData: card.eventData ?? null,
    bizType: card.bizType ?? null,
    url: normalizeUrl(`/item?cardAdId=${cardAdId}`, defaultSeedUrl)
  };
}

function extractItemCard(html, url) {
  const parsedUrl = new URL(url);
  const cardAdId = parsedUrl.searchParams.get("cardAdId");
  const jsonCard = firstJsonObject(html, "cardAdId") ?? {};
  const text = stripTags(html);
  const cardName =
    jsonCard.cardName ??
    cleanText(html.match(/<h[12][^>]*>([\s\S]*?)<\/h[12]>/i)?.[1]) ??
    extractMeta(html, "og:title");

  return {
    source: "naver-card-search",
    sourceUrl: url,
    capturedAt: new Date().toISOString(),
    cardAdId,
    cardName: cardName || null,
    companyCode: jsonCard.companyCode ?? null,
    titleDescription: jsonCard.titleDescription ?? firstMatch(text, [/혜택요약.{0,120}/, /[^.]{0,60}(할인|적립|캐시백)[^.]{0,80}/]),
    cardImageUrl: jsonCard.cardImageUrl ?? extractMeta(html, "og:image"),
    domesticAnnualFee: moneyValue(jsonCard.domesticAnnualFee),
    foreignAnnualFee: moneyValue(jsonCard.foreignAnnualFee),
    familyAnnualFee: moneyValue(jsonCard.familyAnnualFee),
    annualFeeText: firstMatch(text, [/연회비.{0,100}/, /국내\s*\d+만?원.{0,60}/, /해외\s*\d+만?원.{0,60}/]),
    previousSpendText: firstMatch(text, [/기준실적.{0,120}/, /전월.{0,80}실적.{0,120}/, /조건없음/]),
    summaryBenefitText: firstMatch(text, [/혜택요약.{0,160}/, /주요혜택.{0,160}/]),
    benefitCategories: parseBenefitCategories(jsonCard.benefits),
    releaseAt: jsonCard.releaseAt ?? null,
    annualBenefitText: jsonCard.annualBenefitStr ?? null,
    applyUrlPresent: Boolean(jsonCard.registerUrl || html.includes("온라인 신청") || html.includes("카드신청")),
    rawJsonKeys: Object.keys(jsonCard).sort(),
    evidenceSnippets: snippets(text, [
      "연회비",
      "기준실적",
      "혜택요약",
      "주요혜택",
      "최대",
      "한도",
      "적립",
      "할인",
      "캐시백",
      "전월"
    ])
  };
}

function mergeSourceCard(itemCard, sourceCard) {
  if (!itemCard || !sourceCard) return itemCard;
  return {
    ...itemCard,
    cardName: sourceCard.cardName || itemCard.cardName,
    companyCode: sourceCard.companyCode || itemCard.companyCode,
    titleDescription: sourceCard.titleDescription || itemCard.titleDescription,
    listSourceCard: sourceCard
  };
}

async function saveParsedCard(card) {
  if (!card?.cardAdId) return null;
  const filePath = path.join(parsedCardDir, `${card.cardAdId}.json`);
  await writeFile(filePath, `${JSON.stringify(card, null, 2)}\n`, "utf8");
  return filePath;
}

function fieldSummary(card) {
  if (!card) return null;
  return {
    cardAdId: card.cardAdId,
    cardName: card.cardName,
    companyCode: card.companyCode,
    titleDescription: card.titleDescription,
    cardImageUrl: Boolean(card.cardImageUrl),
    domesticAnnualFee: card.domesticAnnualFee,
    foreignAnnualFee: card.foreignAnnualFee,
    annualFeeText: card.annualFeeText,
    previousSpendText: card.previousSpendText,
    summaryBenefitText: card.summaryBenefitText,
    benefitCategories: card.benefitCategories?.map((item) => item.label) ?? [],
    releaseAt: card.releaseAt,
    annualBenefitText: card.annualBenefitText,
    applyUrlPresent: card.applyUrlPresent
  };
}

async function sleep(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithTimeout(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "user-agent": userAgent,
        accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "accept-language": "ko-KR,ko;q=0.9,en-US;q=0.6,en;q=0.5"
      }
    });
    const body = await response.text();
    return { status: response.status, ok: response.ok, body };
  } finally {
    clearTimeout(timer);
  }
}

async function fetchJsonWithTimeout(url, body) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "user-agent": userAgent,
        accept: "application/json",
        "content-type": "application/json",
        "accept-language": "ko-KR,ko;q=0.9,en-US;q=0.6,en;q=0.5",
        referer: defaultSeedUrl
      },
      body: JSON.stringify(body)
    });
    const text = await response.text();
    let json = null;
    try {
      json = JSON.parse(text);
    } catch {
      // Keep the raw response below for debugging.
    }
    return { status: response.status, ok: response.ok, text, json };
  } finally {
    clearTimeout(timer);
  }
}

async function isAllowedByRobots(url) {
  const parsed = new URL(url);
  const robots = await readJson(robotsCachePath, {});
  const robotsUrl = `${parsed.origin}/robots.txt`;

  if (!robots[parsed.origin]) {
    try {
      const result = await fetchWithTimeout(robotsUrl);
      robots[parsed.origin] = {
        fetchedAt: new Date().toISOString(),
        status: result.status,
        body: result.body
      };
    } catch (error) {
      robots[parsed.origin] = {
        fetchedAt: new Date().toISOString(),
        status: "error",
        body: "",
        error: String(error)
      };
    }
    await writeJson(robotsCachePath, robots);
  }

  const body = robots[parsed.origin]?.body ?? "";
  const rules = parseRobots(body);
  return !rules.some((rule) => parsed.pathname.startsWith(rule));
}

function parseRobots(body) {
  const disallow = [];
  let applies = false;

  for (const rawLine of body.split(/\r?\n/)) {
    const line = rawLine.split("#")[0].trim();
    if (!line) continue;
    const [keyRaw, ...rest] = line.split(":");
    const key = keyRaw.trim().toLowerCase();
    const value = rest.join(":").trim();

    if (key === "user-agent") {
      applies = value === "*" || value.toLowerCase().includes("avocard");
    }

    if (applies && key === "disallow" && value) {
      disallow.push(value);
    }
  }

  return disallow;
}

async function addToQueue(urls, options = {}) {
  let queue = await readJson(queuePath, []);
  const state = await readJson(statePath, { visited: [], discovered: [] });
  const queued = new Set(queue.map((item) => item.url));
  const visited = new Set(state.visited);
  let added = 0;

  for (const url of urls) {
    if (queued.has(url)) {
      if (options.allowVisited) {
        const item = queue.find((entry) => entry.url === url);
        if (item) item.force = true;
      }
      continue;
    }
    if (!options.allowVisited && visited.has(url)) continue;
    const sourceCard = options.cardsByUrl?.get(url) ?? null;
    queue.push({ url, addedAt: new Date().toISOString(), attempts: 0, force: Boolean(options.allowVisited), sourceCard });
    queued.add(url);
    added += 1;
  }

  state.discovered = [...new Set([...(state.discovered ?? []), ...urls])];
  state.updatedAt = new Date().toISOString();
  await writeJson(queuePath, queue);
  await writeJson(statePath, state);
  return added;
}

async function seed() {
  const added = await addToQueue([seedUrl], { allowVisited: getArg("force", "0") === "1" });
  console.log(JSON.stringify({ mode: "seed", added, url: seedUrl }, null, 2));
}

async function status() {
  let queue = await readJson(queuePath, []);
  const state = await readJson(statePath, { visited: [], discovered: [] });
  const parsedCards = await countFiles(parsedCardDir, ".json");
  const listPages = await countFiles(listPageDir, ".json");
  console.log(
    JSON.stringify(
      {
        mode: "status",
        queued: queue.length,
        visited: state.visited?.length ?? 0,
        discovered: state.discovered?.length ?? 0,
        parsedCards,
        listPages,
        list: getListState(state),
        dbRoot
      },
      null,
      2
    )
  );
}

async function countFiles(dir, suffix) {
  try {
    const { readdir } = await import("node:fs/promises");
    return (await readdir(dir)).filter((name) => name.endsWith(suffix)).length;
  } catch {
    return 0;
  }
}

async function collectListPages(limit = maxListPages) {
  let state = await readJson(statePath, { visited: [], discovered: [], list: { nextPageNo: 1, totalSize: null, completed: false } });
  let listState = getListState(state);
  let processed = 0;

  while (!listState.completed && processed < limit) {
    const pageNo = listPageNoArg ? Number(listPageNoArg) + processed : listState.nextPageNo;
    const allowed = await isAllowedByRobots("https://m-card-search.naver.com/graphql");
    if (!allowed) {
      await appendFile(
        failuresPath,
        `${JSON.stringify({ url: "https://m-card-search.naver.com/graphql", reason: "robots_disallow", at: new Date().toISOString() })}\n`,
        "utf8"
      );
      throw new Error("robots.txt disallows /graphql");
    }

    const result = await fetchJsonWithTimeout("https://m-card-search.naver.com/graphql", {
      operationName: "smartSearch",
      variables: {
        pageNo,
        pageSize: listPageSize,
        device: "mobile",
        sortMethod: "ri",
        bizType: "CPC",
        companyCode: [],
        brandNames: [],
        benefitCategoryIds: [],
        subBenefitCategoryIds: [],
        affiliateIds: [],
        minAnnualFee: 0,
        maxAnnualFee: 0,
        basePayment: 0
      },
      query: smartSearchQuery
    });

    const pagePath = path.join(listPageDir, `page-${String(pageNo).padStart(4, "0")}.json`);
    await writeJson(pagePath, {
      source: "naver-card-search",
      sourceUrl: "https://m-card-search.naver.com/graphql",
      capturedAt: new Date().toISOString(),
      request: { pageNo, pageSize: listPageSize, sortMethod: "ri", bizType: "CPC" },
      status: result.status,
      response: result.json ?? result.text
    });

    if (!result.ok || !result.json?.data?.cardAdList) {
      await appendFile(
        failuresPath,
        `${JSON.stringify({ url: "https://m-card-search.naver.com/graphql", pageNo, status: result.status, reason: result.text.slice(0, 500), at: new Date().toISOString() })}\n`,
        "utf8"
      );
      throw new Error(`list page ${pageNo} failed with status ${result.status}`);
    }

    const cardAdList = result.json.data.cardAdList;
    const cards = (cardAdList.cardAds ?? []).map(listCardToSourceCard).filter(Boolean);
    const cardsByUrl = new Map(cards.map((card) => [card.url, card]));
    const added = await addToQueue(cards.map((card) => card.url), { cardsByUrl });
    const totalSize = Number(cardAdList.totalSize ?? 0);
    const loadedUntil = pageNo * listPageSize;
    const completed = cards.length === 0 || (totalSize > 0 && loadedUntil >= totalSize);

    state = await readJson(statePath, state);
    state.list = {
      nextPageNo: listPageNoArg ? pageNo + 1 : pageNo + 1,
      totalSize,
      completed,
      updatedAt: new Date().toISOString()
    };
    state.updatedAt = new Date().toISOString();
    await writeJson(statePath, state);

    console.log(
      JSON.stringify(
        {
          mode: "list-page",
          pageNo,
          pageSize: listPageSize,
          cards: cards.length,
          addedToQueue: added,
          totalSize,
          completed,
          pagePath,
          sampleFields: cards[0]
            ? {
                cardAdId: cards[0].cardAdId,
                cardName: cards[0].cardName,
                companyCode: cards[0].companyCode,
                titleDescription: cards[0].titleDescription,
                domesticAnnualFee: cards[0].domesticAnnualFee,
                foreignAnnualFee: cards[0].foreignAnnualFee,
                benefitCategories: cards[0].benefitCategories?.map((item) => item.label) ?? [],
                annualBenefitText: cards[0].annualBenefitText
              }
            : null
        },
        null,
        2
      )
    );

    processed += 1;
    listState = getListState(state);

    if (!listState.completed && processed < limit) {
      const wait = randomWait(idleDelayMs, idleJitterMs);
      console.log(JSON.stringify({ event: "list_page_wait", waitingMs: wait }, null, 2));
      await sleep(wait);
    }
  }

  await status();
  return processed;
}

async function collect(limit = maxPages) {
  const state = await readJson(statePath, { visited: [], discovered: [] });
  const visited = new Set(state.visited);
  let queue = await readJson(queuePath, []);
  let processed = 0;

  while (queue.length > 0 && processed < limit) {
    const item = queue.shift();
    if (!item?.url || (visited.has(item.url) && !item.force)) continue;

    const allowed = await isAllowedByRobots(item.url);
    if (!allowed) {
      await appendFile(failuresPath, `${JSON.stringify({ url: item.url, reason: "robots_disallow", at: new Date().toISOString() })}\n`);
      visited.add(item.url);
      processed += 1;
      continue;
    }

    try {
      const result = await fetchWithTimeout(item.url);
      const id = hashUrl(item.url);
      const htmlPath = path.join(snapshotDir, `${id}.html`);
      await writeFile(htmlPath, result.body, "utf8");

      const links = extractLinks(result.body, item.url);
      const parsed = parseNaverPage(result.body, item.url);
      parsed.itemCard = mergeSourceCard(parsed.itemCard, item.sourceCard);
      const parsedCardPath = await saveParsedCard(parsed.itemCard);
      await appendFile(cardsPath, `${JSON.stringify({ ...parsed, status: result.status, snapshot: htmlPath })}\n`, "utf8");
      await addToQueue([...links, ...parsed.listCards.map((card) => card.url)], {
        cardsByUrl: new Map(parsed.listCards.map((card) => [card.url, card]))
      });
      queue = (await readJson(queuePath, queue)).filter((entry) => entry.url !== item.url);

      visited.add(item.url);
      processed += 1;
      console.log(
        JSON.stringify(
          {
            collected: item.url,
            status: result.status,
            links: links.length,
            snapshot: htmlPath,
            parsedCardPath,
            fields: fieldSummary(parsed.itemCard)
          },
          null,
          2
        )
      );
    } catch (error) {
      await appendFile(failuresPath, `${JSON.stringify({ url: item.url, reason: String(error), at: new Date().toISOString() })}\n`, "utf8");
      item.attempts = (item.attempts ?? 0) + 1;
      if (item.attempts < 2) queue.push(item);
      processed += 1;
    }

    await writeJson(queuePath, queue);
    await writeJson(statePath, { ...state, visited: [...visited], updatedAt: new Date().toISOString() });

    if (queue.length > 0 && processed < limit) {
      const wait = delayMs + Math.floor(Math.random() * jitterMs);
      console.log(JSON.stringify({ waitingMs: wait }, null, 2));
      await sleep(wait);
    }
  }

  await status();
  return processed;
}

function randomWait(baseMs, jitter) {
  return baseMs + Math.floor(Math.random() * Math.max(0, jitter));
}

async function daemon() {
  let cycle = 0;

  console.log(
    JSON.stringify(
      {
        mode: "daemon",
        daemonDelayMs,
        daemonJitterMs,
        idleDelayMs,
        idleJitterMs,
        cycles: daemonCycles === 0 ? "infinite" : daemonCycles
      },
      null,
      2
    )
  );

  while (daemonCycles === 0 || cycle < daemonCycles) {
    const queue = await readJson(queuePath, []);
    if (queue.length === 0) {
      const state = await readJson(statePath, { list: { completed: false } });
      if (!getListState(state).completed) {
        await collectListPages(1);
      } else {
        const added = await addToQueue([seedUrl], { allowVisited: true });
        console.log(JSON.stringify({ event: "list_complete_seed_detail_links", addedSeed: added }, null, 2));
      }
      const wait = randomWait(idleDelayMs, idleJitterMs);
      console.log(JSON.stringify({ event: "idle", waitingMs: wait }, null, 2));
      await sleep(wait);
      cycle += 1;
      continue;
    }

    await collectOneForDaemon();
    const wait = randomWait(daemonDelayMs, daemonJitterMs);
    console.log(JSON.stringify({ event: "daemon_wait", waitingMs: wait }, null, 2));
    await sleep(wait);
    cycle += 1;
  }
}

async function collectOneForDaemon() {
  await collect(1);
}

await ensureDb();

if (mode === "seed") {
  await seed();
} else if (mode === "list-page") {
  await collectListPages();
} else if (mode === "collect") {
  await collect();
} else if (mode === "daemon") {
  await daemon();
} else {
  await status();
}
