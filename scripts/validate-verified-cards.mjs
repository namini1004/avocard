import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";

const root = process.cwd();

function transaction(id, amount, category, tags = [], channel = "offline") {
  return {
    id,
    amount,
    category,
    channel,
    merchant: "검증 거래",
    tags: Array.from(new Set([...tags, channel]))
  };
}

async function main() {
  const { verifiedCards } = await import(
    pathToFileURL(`${root}/data/verified-cards.ts`).href
  );
  const {
    analyzeVerifiedCard,
    calculateMonth,
    calculateQualifyingSpend,
    createRankingProfile,
    maximumScenarioRange,
    rankMaximumVerifiedCards
  } = await import(pathToFileURL(`${root}/lib/calculate-v2.ts`).href);

  const slugs = new Set();

  for (const card of verifiedCards) {
    assert.equal(card.status, "active", `${card.slug}: only active cards may enter ranking`);
    assert.equal(card.verification.status, "verified", `${card.slug}: verification gate failed`);
    assert.ok(!slugs.has(card.slug), `${card.slug}: duplicate slug`);
    slugs.add(card.slug);
    assert.ok(card.annualFee >= 0, `${card.slug}: annual fee must be non-negative`);
    assert.ok(card.benefitRules.length > 0, `${card.slug}: benefit rules are required`);
    assert.ok(
      card.verification.sources.some((source) => source.type === "issuer_page"),
      `${card.slug}: an official issuer page is required`
    );

    const sourceIds = new Set(card.verification.sources.map((source) => source.id));
    const ruleIds = new Set();
    for (const rule of card.benefitRules) {
      assert.ok(!ruleIds.has(rule.id), `${card.slug}: duplicate rule id ${rule.id}`);
      ruleIds.add(rule.id);
      assert.ok(sourceIds.has(rule.sourceId), `${card.slug}: unknown source ${rule.sourceId}`);
      assert.ok(rule.rewardBands.length > 0, `${card.slug}/${rule.id}: reward band required`);
      assert.ok((rule.minPreviousSpend ?? 0) >= 0, `${card.slug}/${rule.id}: invalid spend`);

      for (const band of rule.rewardBands) {
        if (band.formula.kind === "rate") {
          assert.ok(
            band.formula.rate > 0 && band.formula.rate <= 1,
            `${card.slug}/${rule.id}: invalid rate`
          );
        }
      }
    }

    for (const total of [300000, 400000, 500000, 700000, 1000000, 1200000]) {
      for (const focus of ["balanced", "fuel", "shopping", "coffee", "transport"]) {
        const analysis = analyzeVerifiedCard(card, createRankingProfile(total, focus));
        assert.ok(analysis.sustainable.grossBenefit >= 0, `${card.slug}: negative gross benefit`);
        assert.ok(analysis.sustainable.netBenefit >= 0, `${card.slug}: negative net benefit`);
        assert.ok(analysis.sustainable.pickingRate >= 0, `${card.slug}: negative picking rate`);
        assert.equal(
          analysis.sustainable.currentSpend,
          total,
          `${card.slug}: scenario denominator drift`
        );
      }
    }
  }

  const zero = verifiedCards.find((card) => card.slug === "hyundai-zero-edition3-discount");
  assert.ok(zero, "ZERO fixture missing");
  const zeroMonth = calculateMonth(
    zero,
    [transaction("zero-current", 700000, "etc")],
    [transaction("zero-previous", 700000, "etc")]
  );
  assert.equal(Math.round(zeroMonth.grossBenefit), 5600, "ZERO 0.8% calculation changed");
  assert.equal(Math.round(zeroMonth.netBenefit), 4350, "ZERO annual fee deduction changed");
  assert.equal(Number(zeroMonth.pickingRate.toFixed(2)), 0.62, "ZERO picking rate changed");

  const loca = verifiedCards.find((card) => card.slug === "loca-likit-1-2");
  assert.ok(loca, "LOCA fixture missing");
  const locaMonth = calculateMonth(
    loca,
    [
      transaction("loca-online", 300000, "shopping", ["online"], "online"),
      transaction("loca-offline", 400000, "etc")
    ],
    []
  );
  assert.equal(Math.round(locaMonth.grossBenefit), 9300, "LOCA online priority changed");

  const macao = verifiedCards.find((card) => card.slug === "bc-macao");
  assert.ok(macao, "MACAO fixture missing");
  const macaoCurrent = [
    transaction("macao-fuel", 120000, "fuel"),
    transaction("macao-shop", 100000, "shopping", ["macao_shopping", "online"], "online"),
    transaction("macao-etc", 80000, "etc")
  ];
  const macaoMonth = calculateMonth(
    macao,
    macaoCurrent,
    [transaction("macao-previous", 300000, "etc")]
  );
  assert.equal(Math.round(macaoMonth.grossBenefit), 15000, "MACAO total cap changed");
  assert.equal(Math.round(macaoMonth.netBenefit), 14000, "MACAO fee deduction changed");
  assert.equal(Number(macaoMonth.pickingRate.toFixed(2)), 4.67, "MACAO picking rate changed");
  assert.equal(
    calculateQualifyingSpend(macao, macaoCurrent),
    180000,
    "MACAO fuel must be excluded from next performance"
  );
  const macaoBasketPrevious = [
    ...Array.from({ length: 5 }, (_, index) =>
      transaction(
        `macao-basket-${index}`,
        50000,
        "shopping",
        ["macao_shopping", "online"],
        "online"
      )
    ),
    transaction("macao-basket-etc", 50000, "etc")
  ];
  const macaoBasketMonth = calculateMonth(
    macao,
    [
      transaction("macao-basket-fuel", 100000, "fuel"),
      transaction(
        "macao-basket-shop",
        100000,
        "shopping",
        ["macao_shopping", "online"],
        "online"
      ),
      transaction("macao-basket-current-etc", 100000, "etc")
    ],
    macaoBasketPrevious
  );
  assert.equal(
    Math.round(macaoBasketMonth.grossBenefit),
    20000,
    "MACAO basket bonus cap changed"
  );
  assert.deepEqual(
    macaoBasketMonth.activatedBonusLabels,
    ["장바구니 한도"],
    "MACAO basket condition must activate the bonus cap"
  );

  const maximumRankings = rankMaximumVerifiedCards(verifiedCards);
  assert.equal(
    maximumRankings.length,
    verifiedCards.length,
    "every verified card must have a maximum scenario"
  );
  for (const scenario of maximumRankings) {
    assert.ok(
      scenario.totalSpend >= maximumScenarioRange.min &&
        scenario.totalSpend <= maximumScenarioRange.max,
      `${scenario.card.slug}: maximum scenario escaped the public search range`
    );
    assert.ok(
      scenario.nextQualifyingSpend >= (scenario.calculation.appliedTier?.minPreviousSpend ?? 0),
      `${scenario.card.slug}: maximum scenario is not repeatable next month`
    );
    assert.equal(
      Number(
        (
          (scenario.calculation.netBenefit / scenario.calculation.currentSpend) *
          100
        ).toFixed(6)
      ),
      Number(scenario.pickingRate.toFixed(6)),
      `${scenario.card.slug}: maximum picking-rate denominator changed`
    );
  }
  const macaoMaximum = maximumRankings.find((scenario) => scenario.card.slug === "bc-macao");
  assert.ok(macaoMaximum, "MACAO maximum fixture missing");
  assert.equal(macaoMaximum.totalSpend, 400000, "MACAO recurring optimum spend changed");
  assert.equal(
    Number(macaoMaximum.pickingRate.toFixed(2)),
    5,
    "MACAO recurring maximum picking rate changed"
  );

  console.log(
    `Verified card data passed: ${verifiedCards.length} active cards, official-source gate, recurring maximum scenarios and calculation fixtures OK.`
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
