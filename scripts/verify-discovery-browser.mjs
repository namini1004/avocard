import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdir } from "node:fs/promises";

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const base = process.env.TEST_BASE_URL || "http://localhost:3035";
const output = ".tmp-browser";
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
const errors = [];
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
page.setDefaultTimeout(15000);
page.on("pageerror", (error) => errors.push(error.message));
page.on("console", (message) => {
  if (message.type() === "error") errors.push(message.text());
});
const noOverflow = async () =>
  assert(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    "Horizontal page overflow",
  );
const recalculate = async (action) => {
  const response = page.waitForResponse((response) =>
    response.url().endsWith("/api/discovery"),
  );
  try {
    await action();
  } catch (error) {
    response.catch(() => {});
    throw error;
  }
  assert.equal((await response).status(), 200);
  await page.waitForFunction(() =>
    document.querySelector('.choice-results[aria-busy="false"]'),
  );
};

try {
  assert.equal((await page.goto(base)).status(), 200);
  await page
    .getByRole("heading", { name: "쓰는 건 그대로. 남는 혜택은 더 크게." })
    .waitFor();
  assert.equal(await page.locator(".choice-row").count(), 2);
  assert.match(
    await page.locator(".choice-row").first().innerText(),
    /7,567원/,
  );
  await noOverflow();
  await page.screenshot({ path: `${output}/desktop.png`, fullPage: true });

  await page.locator(".maximum-item").first().click();
  await page.getByRole("dialog").waitFor();
  assert.match(
    await page.getByRole("dialog").innerText(),
    /조건 충족 시 최대 피킹률/,
  );
  const before = await page
    .getByRole("button", { name: "닫기", exact: true })
    .boundingBox();
  await page.locator(".sheet-body").evaluate((element) => {
    element.scrollTop = element.scrollHeight;
  });
  assert.deepEqual(
    await page.getByRole("button", { name: "닫기", exact: true }).boundingBox(),
    before,
  );
  await page.keyboard.press("Escape");
  assert.equal(await page.getByRole("dialog").count(), 0);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => window.scrollTo(0, 0));
  await noOverflow();
  await page.screenshot({ path: `${output}/mobile-home.png`, fullPage: true });
  await page
    .getByRole("button", { name: "LOCA LIKIT 1.2 상세 보기", exact: true })
    .click();
  const mobileDialog = await page.getByRole("dialog").boundingBox();
  assert.equal(mobileDialog.width, 390);
  assert.equal(mobileDialog.height, 844);
  await page.screenshot({ path: `${output}/mobile-detail.png` });
  await page.getByRole("button", { name: "닫기", exact: true }).click();

  await recalculate(() =>
    page
      .getByRole("button", {
        name: "생활비 혜택 챙기기 평소 쓰는 곳에서 더 받기",
      })
      .click(),
  );
  assert.equal(await page.locator(".choice-row").count(), 5);
  await page.getByRole("button", { name: "온라인쇼핑", exact: true }).click();
  await page
    .getByRole("spinbutton", { name: "온라인쇼핑 월 사용액 만원" })
    .fill("30");
  await page
    .getByRole("spinbutton", { name: "온라인쇼핑 결제 횟수" })
    .fill("4");
  await page.getByLabel("주로 쓰는 곳").selectOption("쿠팡");
  await recalculate(() =>
    page.getByRole("button", { name: "이 조건으로 비교", exact: true }).click(),
  );
  assert.match(await page.locator(".choice-results").innerText(), /8,467원/);
  await noOverflow();
  await page.screenshot({
    path: `${output}/mobile-personal.png`,
    fullPage: true,
  });

  await page.locator(".compare-toggle").nth(0).click();
  await page.locator(".compare-toggle").nth(1).click();
  await page.getByRole("button", { name: "나란히 비교", exact: true }).click();
  assert.equal(await page.locator(".comparison-table thead th").count(), 3);
  await page.screenshot({ path: `${output}/mobile-compare.png` });
  await page.getByRole("button", { name: "닫기", exact: true }).click();
  await page
    .getByRole("spinbutton", { name: "온라인쇼핑 월 사용액 만원" })
    .fill("80");
  assert.equal(
    await page
      .getByRole("button", { name: "이 조건으로 비교", exact: true })
      .isDisabled(),
    true,
  );
  await page
    .getByRole("spinbutton", { name: "온라인쇼핑 월 사용액 만원" })
    .fill("30");

  await recalculate(() =>
    page
      .getByRole("button", { name: "편하게 쓰기 실적 관리 없이, 어디서나" })
      .click(),
  );
  await recalculate(() =>
    page.getByRole("combobox", { name: "카드 종류" }).selectOption("check"),
  );
  assert.equal(await page.locator(".choice-row").count(), 0);
  await recalculate(() =>
    page.getByRole("button", { name: "전체 카드 비교", exact: true }).click(),
  );
  assert.equal(await page.locator(".choice-row").count(), 5);

  await page.setViewportSize({ width: 320, height: 740 });
  await noOverflow();
  await page.screenshot({ path: `${output}/small-mobile.png`, fullPage: true });
  for (const route of [
    "/recommend",
    "/compare",
    "/cards",
    "/cards/loca-likit-1-2",
    "/results",
  ]) {
    assert.equal((await page.goto(`${base}${route}`)).status(), 200, route);
    await noOverflow();
  }
  // The owner-only evidence route is intentionally not public.
  assert.equal((await page.request.get(`${base}/sources`)).status(), 404);
  assert.deepEqual(errors, []);
  console.log(
    "Browser checks passed: desktop/mobile, exact figures, filtering, explicit spend, comparison, full-screen detail, fixed close, no overflow or JS errors.",
  );
} catch (error) {
  await page.screenshot({ path: `${output}/failure.png`, fullPage: true });
  console.error(
    await page
      .locator(".filter-pair")
      .innerText()
      .catch(() => "No filters"),
  );
  throw error;
} finally {
  await browser.close();
}
