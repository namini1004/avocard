import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const inputPath = path.join(root, "data", "external-picking", "source-urls.csv");
const outputPath = path.join(root, "data", "external-picking", "collected-candidates.csv");

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

function csvCell(value) {
  if (value === null || value === undefined) return "";
  return `"${String(value).replaceAll('"', '""').replace(/\r?\n/g, " ").trim()}"`;
}

function toCsv(headers, rows) {
  return [headers, ...rows.map((row) => headers.map((header) => row[header] ?? ""))]
    .map((row) => row.map(csvCell).join(","))
    .join("\n") + "\n";
}

function cleanText(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function stripHtml(html) {
  return cleanText(
    String(html ?? "")
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
  );
}

function titleFromHtml(html) {
  const match = String(html ?? "").match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match ? cleanText(stripHtml(match[1])) : "";
}

function numberTextToWon(value) {
  const text = cleanText(value).replace(/,/g, "");
  const composite = text.match(/(\d+(?:\.\d+)?)\s*만\s*(\d+(?:\.\d+)?)\s*천\s*원?/);
  if (composite) return Math.round(Number(composite[1]) * 10000 + Number(composite[2]) * 1000);
  const match = text.match(/(\d+(?:\.\d+)?)\s*(만원|만|천원|천|원)/);
  if (!match) return "";
  const amount = Number(match[1]);
  if (match[2] === "만원" || match[2] === "만") return Math.round(amount * 10000);
  if (match[2] === "천원" || match[2] === "천") return Math.round(amount * 1000);
  return Math.round(amount);
}

function nearby(text, index, radius = 180) {
  return cleanText(text.slice(Math.max(0, index - radius), Math.min(text.length, index + radius)));
}

function extractCandidates({ sourceId, sourceUrl, title, text }) {
  const candidates = [];
  const patterns = [
    /피킹[률율][^\d]{0,20}(\d+(?:\.\d+)?)\s*%/gi,
    /(\d+(?:\.\d+)?)\s*%[^\n.]{0,25}피킹[률율]/gi
  ];

  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) {
      const evidence = nearby(text, match.index ?? 0);
      const spendMatch = evidence.match(/(?:월|매월)?\s*(\d+(?:\.\d+)?\s*(?:만원|만|천원|천|원))\s*(?:사용|소비|구간|쓰면|썼을 때)/);
      const benefitMatch = evidence.match(/(?:혜택|할인|절감|캐시백|적립)[^\d]{0,15}(\d+(?:\.\d+)?\s*(?:만원|만|천원|천|원))/);

      candidates.push({
        candidate_id: `${sourceId}-${candidates.length + 1}`,
        source_id: sourceId,
        source_url: sourceUrl,
        page_title: title,
        card_name_guess: guessCardName(evidence, title),
        observed_spend_guess: spendMatch ? numberTextToWon(spendMatch[1]) : "",
        observed_monthly_benefit_guess: benefitMatch ? numberTextToWon(benefitMatch[1]) : "",
        observed_picking_rate_percent_guess: match[1],
        evidence_excerpt: evidence,
        review_status: "needs_review"
      });
    }
  }

  return candidates;
}

function guessCardName(evidence, title) {
  const source = `${evidence} ${title}`;
  const match = source.match(/([가-힣A-Za-z0-9+:\-·™\s]{2,40}카드)/);
  return match ? cleanText(match[1]) : "";
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      "user-agent": "AvocardExternalValidationBot/0.1; manual permalink validation"
    }
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.text();
}

async function main() {
  const urls = parseCsv(await readFile(inputPath, "utf8")).filter((row) => String(row.enabled).toLowerCase() === "true");
  const allCandidates = [];

  for (const [index, row] of urls.entries()) {
    if (index > 0) {
      const jitter = 3000 + Math.floor(Math.random() * 9000);
      await delay(jitter);
    }

    try {
      const html = await fetchText(row.source_url);
      const title = titleFromHtml(html);
      const text = stripHtml(html);
      allCandidates.push(...extractCandidates({ sourceId: row.source_id, sourceUrl: row.source_url, title, text }));
    } catch (error) {
      allCandidates.push({
        candidate_id: `${row.source_id}-error-${index + 1}`,
        source_id: row.source_id,
        source_url: row.source_url,
        page_title: "",
        card_name_guess: "",
        observed_spend_guess: "",
        observed_monthly_benefit_guess: "",
        observed_picking_rate_percent_guess: "",
        evidence_excerpt: error instanceof Error ? error.message : String(error),
        review_status: "fetch_error"
      });
    }
  }

  const headers = [
    "candidate_id",
    "source_id",
    "source_url",
    "page_title",
    "card_name_guess",
    "observed_spend_guess",
    "observed_monthly_benefit_guess",
    "observed_picking_rate_percent_guess",
    "evidence_excerpt",
    "review_status"
  ];

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, toCsv(headers, allCandidates), "utf8");
  console.log(JSON.stringify({ urls: urls.length, candidates: allCandidates.length, outputPath: path.relative(root, outputPath) }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
