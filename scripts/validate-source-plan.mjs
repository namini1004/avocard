import { pathToFileURL } from "node:url";

const root = process.cwd();

async function main() {
  const {
    officialIssuerSources,
    popularCoverageTargets,
    minimumPopularCardCoverage
  } = await import(pathToFileURL(`${root}/data/official-sources.ts`).href);
  const { validateOfficialSourcePlan } = await import(pathToFileURL(`${root}/lib/source-quality.ts`).href);

  const issues = validateOfficialSourcePlan({
    issuers: officialIssuerSources,
    targets: popularCoverageTargets,
    minimumCoverage: minimumPopularCardCoverage
  });

  if (issues.length === 0) {
    console.log(`Official source plan passed. ${popularCoverageTargets.length} coverage targets are ready.`);
    return;
  }

  for (const issue of issues) {
    console.log(`[${issue.severity}] ${issue.field}: ${issue.message}`);
  }

  if (issues.some((issue) => issue.severity === "error")) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
