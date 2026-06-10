import { mkdir, readFile, writeFile, appendFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";

const root = process.cwd();
const dbRoot = path.join(root, "data", "raw", "naver-cards");
const snapshotDir = path.join(dbRoot, "snapshots");
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
const timeoutMs = Number(getArg("timeout", process.env.NAVER_COLLECT_TIMEOUT_MS ?? "20000"));

const userAgent =
  process.env.NAVER_COLLECT_USER_AGENT ??
  "AvocardResearch/0.1 (+local manual collection; slow rate; contact owner)";

function getArg(name, fallback) {
  const prefix = `--${name}=`;
  const arg = process.argv.find((item) => item.startsWith(prefix));
  return arg ? arg.slice(prefix.length) : fallback;
}

async function ensureDb() {
  await mkdir(snapshotDir, { recursive: true });
  await ensureJson(queuePath, []);
  await ensureJson(statePath, { visited: [], discovered: [], updatedAt: null });
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

function isLikelyCardUrl(url) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname !== "m-card-search.naver.com") return false;
    if (parsed.pathname.includes("/list")) return true;
    if (parsed.pathname.includes("/card")) return true;
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

async function addToQueue(urls) {
  const queue = await readJson(queuePath, []);
  const state = await readJson(statePath, { visited: [], discovered: [] });
  const queued = new Set(queue.map((item) => item.url));
  const visited = new Set(state.visited);
  let added = 0;

  for (const url of urls) {
    if (queued.has(url) || visited.has(url)) continue;
    queue.push({ url, addedAt: new Date().toISOString(), attempts: 0 });
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
  const added = await addToQueue([seedUrl]);
  console.log(JSON.stringify({ mode: "seed", added, url: seedUrl }, null, 2));
}

async function status() {
  const queue = await readJson(queuePath, []);
  const state = await readJson(statePath, { visited: [], discovered: [] });
  console.log(
    JSON.stringify(
      {
        mode: "status",
        queued: queue.length,
        visited: state.visited?.length ?? 0,
        discovered: state.discovered?.length ?? 0,
        dbRoot
      },
      null,
      2
    )
  );
}

async function collect() {
  const state = await readJson(statePath, { visited: [], discovered: [] });
  const visited = new Set(state.visited);
  const queue = await readJson(queuePath, []);
  let processed = 0;

  while (queue.length > 0 && processed < maxPages) {
    const item = queue.shift();
    if (!item?.url || visited.has(item.url)) continue;

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
      const parsed = parseCardPage(result.body, item.url);
      await appendFile(cardsPath, `${JSON.stringify({ ...parsed, status: result.status, snapshot: htmlPath })}\n`, "utf8");
      await addToQueue(links);

      visited.add(item.url);
      processed += 1;
      console.log(JSON.stringify({ collected: item.url, status: result.status, links: links.length, snapshot: htmlPath }, null, 2));
    } catch (error) {
      await appendFile(failuresPath, `${JSON.stringify({ url: item.url, reason: String(error), at: new Date().toISOString() })}\n`, "utf8");
      item.attempts = (item.attempts ?? 0) + 1;
      if (item.attempts < 2) queue.push(item);
      processed += 1;
    }

    await writeJson(queuePath, queue);
    await writeJson(statePath, { ...state, visited: [...visited], updatedAt: new Date().toISOString() });

    if (queue.length > 0 && processed < maxPages) {
      const wait = delayMs + Math.floor(Math.random() * jitterMs);
      console.log(JSON.stringify({ waitingMs: wait }, null, 2));
      await sleep(wait);
    }
  }

  await status();
}

await ensureDb();

if (mode === "seed") {
  await seed();
} else if (mode === "collect") {
  await collect();
} else {
  await status();
}
