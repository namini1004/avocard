import { pathToFileURL } from "node:url";

const root = process.cwd();

async function main() {
  const { cards } = await import(pathToFileURL(`${root}/data/cards.ts`).href);
  const { validateCardData } = await import(pathToFileURL(`${root}/lib/data-quality.ts`).href);

  const issues = validateCardData(cards);

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
