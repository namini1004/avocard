import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const benchmarkPath = path.join(root, "data", "external-picking", "benchmarks.csv");
const reportPath = path.join(root, "data", "external-picking", "validation-report.csv");
const summaryPath = path.join(root, "data", "external-picking", "validation-summary.json");

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

function numberValue(value) {
  if (value === null || value === undefined || value === "") return 0;
  const number = Number(String(value).replace(/[^\d.-]/g, ""));
  return Number.isFinite(number) ? number : 0;
}

function normalizeName(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[()[\]{}·.,:;'"`~!@#$%^&*_+=|\\/<>?-]/g, "")
    .replace(/카드$/g, "");
}

function safeJson(value) {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function buildProfile(row, defaultProfile) {
  const observedSpend = numberValue(row.observed_spend);
  const custom = safeJson(row.spend_profile_json);
  const profile = { ...defaultProfile, ...(custom ?? {}) };
  profile.total = numberValue(profile.total) || observedSpend || defaultProfile.total;

  if (!custom && observedSpend > 0) {
    const categoryKeys = Object.keys(defaultProfile).filter((key) => key !== "total");
    const categoryTotal = categoryKeys.reduce((sum, key) => sum + numberValue(defaultProfile[key]), 0);
    const scale = categoryTotal > 0 ? observedSpend / categoryTotal : 1;
    for (const key of categoryKeys) {
      profile[key] = Math.max(0, Math.round((numberValue(defaultProfile[key]) * scale) / 1000) * 1000);
    }
    profile.total = observedSpend;
  }

  return profile;
}

function findCard(row, cards) {
  if (row.card_slug) {
    const bySlug = cards.find((card) => card.slug === row.card_slug);
    if (bySlug) return bySlug;
  }

  const target = normalizeName(row.card_name);
  if (!target) return null;

  const issuer = normalizeName(row.issuer);
  return (
    cards.find((card) => normalizeName(card.name) === target && (!issuer || normalizeName(card.issuer).includes(issuer))) ??
    cards.find((card) => normalizeName(card.name).includes(target) || target.includes(normalizeName(card.name)))
  );
}

function observedRate(row) {
  const explicitRate = numberValue(row.observed_picking_rate_percent);
  if (explicitRate > 0) return explicitRate;

  const spend = numberValue(row.observed_spend);
  const benefit = numberValue(row.observed_monthly_benefit);
  if (spend > 0 && benefit > 0) return (benefit / spend) * 100;
  return 0;
}

function compareStatus(diff) {
  const abs = Math.abs(diff);
  if (abs <= 0.3) return "pass";
  if (abs <= 0.8) return "watch";
  return "fail";
}

async function main() {
  const [{ cards }, { analyzeCard, defaultProfile }] = await Promise.all([
    import(pathToFileURL(path.join(root, "data", "cards.ts")).href),
    import(pathToFileURL(path.join(root, "lib", "calculate.ts")).href)
  ]);

  const rows = parseCsv(await readFile(benchmarkPath, "utf8"));
  const reportRows = rows.map((row) => {
    const card = findCard(row, cards);
    const observed = observedRate(row);

    if (!card) {
      return {
        benchmark_id: row.benchmark_id,
        status: "card_not_found",
        source_id: row.source_id,
        source_url: row.source_url,
        card_slug: row.card_slug,
        card_name: row.card_name,
        observed_spend: row.observed_spend,
        observed_picking_rate_percent: observed ? observed.toFixed(3) : "",
        avocard_picking_rate_percent: "",
        diff_percentage_points: "",
        avocard_monthly_benefit: "",
        notes: "No matching Avocard card."
      };
    }

    if (!observed) {
      return {
        benchmark_id: row.benchmark_id,
        status: "insufficient_observation",
        source_id: row.source_id,
        source_url: row.source_url,
        card_slug: card.slug,
        card_name: card.name,
        observed_spend: row.observed_spend,
        observed_picking_rate_percent: "",
        avocard_picking_rate_percent: "",
        diff_percentage_points: "",
        avocard_monthly_benefit: "",
        notes: "Observed picking rate or monthly benefit is required."
      };
    }

    const profile = buildProfile(row, defaultProfile);
    const analysis = analyzeCard(card, profile);
    const includeAnnualFee = String(row.annual_fee_included).toLowerCase() !== "false";
    const avocardRate = includeAnnualFee
      ? analysis.pickingRate
      : profile.total > 0
        ? (analysis.grossMonthlySaving / profile.total) * 100
        : 0;
    const diff = avocardRate - observed;

    return {
      benchmark_id: row.benchmark_id,
      status: compareStatus(diff),
      source_id: row.source_id,
      source_url: row.source_url,
      card_slug: card.slug,
      card_name: card.name,
      observed_spend: profile.total,
      observed_picking_rate_percent: observed.toFixed(3),
      avocard_picking_rate_percent: avocardRate.toFixed(3),
      diff_percentage_points: diff.toFixed(3),
      avocard_monthly_benefit: Math.round(includeAnnualFee ? analysis.monthlySaving : analysis.grossMonthlySaving),
      notes: row.notes
    };
  });

  const counts = reportRows.reduce((acc, row) => {
    acc[row.status] = (acc[row.status] ?? 0) + 1;
    return acc;
  }, {});

  const summary = {
    generatedAt: new Date().toISOString(),
    benchmarks: rows.length,
    counts,
    reportPath: path.relative(root, reportPath)
  };

  const headers = [
    "benchmark_id",
    "status",
    "source_id",
    "source_url",
    "card_slug",
    "card_name",
    "observed_spend",
    "observed_picking_rate_percent",
    "avocard_picking_rate_percent",
    "diff_percentage_points",
    "avocard_monthly_benefit",
    "notes"
  ];

  await mkdir(path.dirname(reportPath), { recursive: true });
  await writeFile(reportPath, toCsv(headers, reportRows), "utf8");
  await writeFile(summaryPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");

  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
