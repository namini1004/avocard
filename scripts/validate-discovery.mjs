import assert from "node:assert/strict";
import {
  discoverCards,
  buildConfirmedTransactions,
  parseDiscoveryInput,
} from "../lib/card-discovery.ts";
import { initialDiscovery } from "../lib/discovery-types.ts";

const expense = (category, amount, merchant, extra = {}) => ({
  category,
  amount,
  merchant,
  count: 1,
  night: false,
  weekend: false,
  autopay: false,
  ...extra,
});
const resultFor = (expenses, total = 700000, extra = {}) =>
  discoverCards({
    ...initialDiscovery,
    mode: "benefit",
    total,
    expenses,
    ...extra,
  });
const find = (result, slug) => result.cards.find((card) => card.slug === slug);
const loca = "loca-likit-1-2";
const nh = "nh20-haebom-check";

const baseline = discoverCards();
assert.deepEqual(
  baseline.cards.map((card) => card.slug),
  [loca, "hyundai-zero-edition3-discount"],
);
assert.equal(Math.round(baseline.cards[0].grossBenefit), 8400);
assert.equal(Math.round(baseline.cards[0].netBenefit), 7567);
assert.equal(Math.round(baseline.cards[1].netBenefit), 4350);
assert.equal(Number(baseline.cards[1].pickingRate.toFixed(2)), 0.62);
assert.equal(
  find(resultFor([expense("transport", 100000, "버스·지하철")]), loca)
    .grossBenefit,
  7200,
);
assert.equal(
  find(resultFor([expense("shopping", 300000, "미지정")]), loca).grossBenefit,
  9300,
);
assert.equal(
  find(resultFor([expense("shopping", 200000, "쿠팡")]), nh).grossBenefit,
  0,
  "NH must not receive another card's marketplace eligibility",
);
const shopping = find(
  resultFor([expense("shopping", 200000, "G마켓", { count: 4 })], 400000),
  nh,
);
assert.equal(shopping.qualifyingSpend, 300000);
assert.equal(shopping.grossBenefit, 4000, "online group limit must apply");
assert.equal(shopping.pickingRate, 1);
const insufficient = find(
  resultFor([expense("shopping", 200000, "G마켓", { count: 4 })], 200000),
  nh,
);
assert.equal(insufficient.performanceGap, 100000);
assert.equal(insufficient.grossBenefit, 0);
assert.equal(find(resultFor([], 10000), loca).netBenefit, 0);
assert.ok(find(resultFor([], 10000), loca).feeShortfall > 0);
assert.equal(
  discoverCards({ ...initialDiscovery, cardType: "check" }).cards.length,
  0,
  "never silently relax a filter",
);
assert.equal(
  resultFor([], 700000, { cardType: "check" }).cards[0].comparisonDelta,
  null,
);
assert.throws(() =>
  parseDiscoveryInput({
    ...initialDiscovery,
    expenses: [expense("coffee", 800000, "미지정")],
  }),
);
assert.throws(() => parseDiscoveryInput({ ...initialDiscovery, total: NaN }));
assert.throws(() =>
  parseDiscoveryInput({
    ...initialDiscovery,
    expenses: [expense("mart", 100000, "이마트", { weekend: true, count: 9 })],
  }),
);
for (const total of [300000, 400000, 500000, 700000, 1000000]) {
  const input = {
    ...initialDiscovery,
    total,
    expenses: [expense("shopping", 100000, "G마켓", { count: 3 })],
  };
  assert.equal(
    buildConfirmedTransactions(input).reduce(
      (sum, item) => sum + item.amount,
      0,
    ),
    total,
  );
  for (const card of resultFor(input.expenses, total).cards) {
    assert.equal(card.totalSpend, total);
    assert.ok(
      Math.abs((card.netBenefit / total) * 100 - card.pickingRate) < 1e-8,
    );
    assert.ok(Math.abs(card.annualBenefit - card.netBenefit * 12) < 1e-8);
  }
}
assert.ok(
  !JSON.stringify(baseline).includes("verifiedFields"),
  "internal verification metadata must stay server-side",
);
console.log(
  "Discovery checks passed: explicit merchant eligibility, annual fee, exclusions, monthly caps, recurring performance, strict filters and exact spend totals.",
);
