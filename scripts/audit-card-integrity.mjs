import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const externalBenchmarkPath = path.join(root, "data", "external-picking", "benchmarks.csv");
const outDir = path.join(root, "data", "integrity");
const reportPath = path.join(outDir, "card-integrity-report.csv");
const priorityPath = path.join(outDir, "external-collection-priority.csv");
const summaryPath = path.join(outDir, "card-integrity-summary.json");

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

function normalizeName(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[()[\]{}·.,:;'"`~!@#$%^&*_+=|\\/<>?-]/g, "")
    .replace(/카드$/g, "");
}

async function readBenchmarks() {
  try {
    return parseCsv(await readFile(externalBenchmarkPath, "utf8"));
  } catch {
    return [];
  }
}

function hasExternalBenchmark(card, benchmarks) {
  const normalized = normalizeName(card.name);
  return benchmarks.some((row) => row.card_slug === card.slug || (row.card_name && normalizeName(row.card_name) === normalized));
}

function riskSignals(card, analysis, rank, hasBenchmark) {
  const signals = [];
  const rules = card.benefitRules ?? [];
  const notes = rules.map((rule) => rule.note ?? "").join(" ");

  if (/^(신용카드|체크카드)$/.test(card.name) || card.name.length <= 3) {
    signals.push(["generic_card_name", 30]);
  }

  if (rules.some((rule) => rule.label === "혜택 원문 검수 필요")) {
    signals.push(["fallback_rule", 50]);
  }

  if (/요약 문구|환산|가정|보수 환산|유가/.test(notes)) {
    signals.push(["estimated_rule", 20]);
  }

  if ((card.monthlyCapTiers?.length ?? 0) <= 1 && card.monthlyCap >= 30000) {
    signals.push(["single_tier_high_cap", 15]);
  }

  if (card.monthlyCap >= 100000) {
    signals.push(["monthly_cap_outlier", 20]);
  }

  if (analysis.pickingRate >= 4 && !hasBenchmark) {
    signals.push(["high_picking_without_external_benchmark", 35]);
  } else if (rank <= 50 && !hasBenchmark) {
    signals.push(["top_rank_without_external_benchmark", 18]);
  }

  if (card.reviewStatus !== "verified") {
    signals.push(["not_officially_verified", 8]);
  }

  return signals;
}

function priorityFrom(score, signals, rank) {
  const names = new Set(signals.map(([name]) => name));
  if (names.has("fallback_rule") || names.has("high_picking_without_external_benchmark")) return "P0";
  if (score >= 45 || rank <= 30) return "P1";
  if (score >= 25 || rank <= 80) return "P2";
  return "P3";
}

function searchQueries(card) {
  const base = `${card.name} 피킹률`;
  return [
    base,
    `${card.name} 실제 혜택`,
    `${card.issuer} ${card.name} 카드 추천`
  ].join(" | ");
}

async function main() {
  const [{ cards }, { rankCards, defaultProfile }] = await Promise.all([
    import(pathToFileURL(path.join(root, "data", "cards.ts")).href),
    import(pathToFileURL(path.join(root, "lib", "calculate.ts")).href)
  ]);
  const benchmarks = await readBenchmarks();
  const ranked = rankCards(cards, defaultProfile);

  const rows = ranked.map((analysis, index) => {
    const card = analysis.card;
    const rank = index + 1;
    const externalBenchmark = hasExternalBenchmark(card, benchmarks);
    const signals = riskSignals(card, analysis, rank, externalBenchmark);
    const riskScore = signals.reduce((sum, [, score]) => sum + score, 0);
    const priority = priorityFrom(riskScore, signals, rank);

    return {
      card_slug: card.slug,
      card_name: card.name,
      issuer: card.issuer,
      rank,
      picking_rate_percent: analysis.pickingRate.toFixed(3),
      monthly_saving: Math.round(analysis.monthlySaving),
      previous_spend: card.previousSpend,
      monthly_cap: card.monthlyCap,
      rule_count: card.benefitRules.length,
      tier_count: card.monthlyCapTiers?.length ?? 0,
      has_external_benchmark: externalBenchmark ? "true" : "false",
      risk_score: riskScore,
      priority,
      risk_signals: signals.map(([name]) => name).join(" | "),
      source_url: card.sourceUrls[0]?.url ?? "",
      search_queries: searchQueries(card)
    };
  });

  const priorityRows = rows
    .filter((row) => row.priority === "P0" || row.priority === "P1")
    .sort((a, b) => {
      const priorityOrder = { P0: 0, P1: 1, P2: 2, P3: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority] || b.risk_score - a.risk_score || a.rank - b.rank;
    })
    .slice(0, 120);

  const summary = {
    generatedAt: new Date().toISOString(),
    cards: cards.length,
    benchmarks: benchmarks.length,
    priorityCounts: rows.reduce((acc, row) => {
      acc[row.priority] = (acc[row.priority] ?? 0) + 1;
      return acc;
    }, {}),
    signalCounts: rows.reduce((acc, row) => {
      for (const signal of String(row.risk_signals).split(" | ").filter(Boolean)) {
        acc[signal] = (acc[signal] ?? 0) + 1;
      }
      return acc;
    }, {}),
    reportPath: path.relative(root, reportPath),
    priorityPath: path.relative(root, priorityPath)
  };

  const headers = [
    "card_slug",
    "card_name",
    "issuer",
    "rank",
    "picking_rate_percent",
    "monthly_saving",
    "previous_spend",
    "monthly_cap",
    "rule_count",
    "tier_count",
    "has_external_benchmark",
    "risk_score",
    "priority",
    "risk_signals",
    "source_url",
    "search_queries"
  ];

  await mkdir(outDir, { recursive: true });
  await writeFile(reportPath, toCsv(headers, rows), "utf8");
  await writeFile(priorityPath, toCsv(headers, priorityRows), "utf8");
  await writeFile(summaryPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");

  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
