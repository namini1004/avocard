import { pathToFileURL } from "node:url";

const root = process.cwd();

async function main() {
  const { cards } = await import(pathToFileURL(`${root}/data/cards.ts`).href);
  const { cardCandidates, candidateSources } = await import(pathToFileURL(`${root}/data/card-candidates.ts`).href);
  const { validateCardData } = await import(pathToFileURL(`${root}/lib/data-quality.ts`).href);
  const { analyzeCard, defaultProfile } = await import(pathToFileURL(`${root}/lib/calculate.ts`).href);

  const issues = validateCardData(cards);
  const candidateSourceIds = new Set(candidateSources.map((source) => source.id));
  const candidateSlugs = new Set();

  for (const candidate of cardCandidates) {
    if (candidateSlugs.has(candidate.slug)) {
      issues.push({
        severity: "error",
        cardSlug: candidate.slug,
        field: "candidate.slug",
        message: "Duplicate candidate slug."
      });
    }
    candidateSlugs.add(candidate.slug);

    if (candidate.sourceRefs.length === 0) {
      issues.push({
        severity: "error",
        cardSlug: candidate.slug,
        field: "candidate.sourceRefs",
        message: "Candidate needs at least one source reference."
      });
    }

    for (const ref of candidate.sourceRefs) {
      if (!candidateSourceIds.has(ref)) {
        issues.push({
          severity: "error",
          cardSlug: candidate.slug,
          field: "candidate.sourceRefs",
          message: `Unknown candidate source ref: ${ref}`
        });
      }
    }
  }

  for (const card of cards) {
    const analysis = analyzeCard(card, defaultProfile);
    if (analysis.monthlySaving < 0 || analysis.annualSaving < 0 || analysis.pickingRate < 0) {
      issues.push({
        severity: "error",
        cardSlug: card.slug,
        field: "analysis",
        message: "Net benefit and picking rate must not be negative."
      });
    }
  }

  if (issues.length === 0) {
    console.log("Card data quality check passed.");
    return;
  }

  for (const issue of issues) {
    console.log(`[${issue.severity}] ${issue.cardSlug} ${issue.field}: ${issue.message}`);
  }

  if (issues.some((issue) => issue.severity === "error")) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
