import type { CreditCard } from "../data/cards";

export type DataQualityIssue = {
  severity: "error" | "warning";
  cardSlug: string;
  field: string;
  message: string;
};

export function validateCardData(cards: CreditCard[]): DataQualityIssue[] {
  const issues: DataQualityIssue[] = [];
  const seenSlugs = new Set<string>();

  for (const card of cards) {
    if (seenSlugs.has(card.slug)) {
      issues.push({
        severity: "error",
        cardSlug: card.slug,
        field: "slug",
        message: "중복 카드 slug입니다."
      });
    }
    seenSlugs.add(card.slug);

    if (card.reviewStatus === "verified" && !card.sourceUrls.some((source) => source.type === "issuer_page" || source.type === "issuer_pdf")) {
      issues.push({
        severity: "error",
        cardSlug: card.slug,
        field: "sourceUrls",
        message: "공식 카드사 페이지 또는 상품설명서 PDF 출처가 필요합니다."
      });
    }

    if (card.reviewStatus === "verified" && !card.lastVerifiedAt) {
      issues.push({
        severity: "error",
        cardSlug: card.slug,
        field: "lastVerifiedAt",
        message: "검수 완료 카드에는 마지막 확인일이 필요합니다."
      });
    }

    if (card.benefitRules.length === 0) {
      issues.push({
        severity: "error",
        cardSlug: card.slug,
        field: "benefitRules",
        message: "계산 가능한 혜택 규칙이 없습니다."
      });
    }

    for (const rule of card.benefitRules) {
      if (!rule.rate && !rule.fixedAmount) {
        issues.push({
          severity: "error",
          cardSlug: card.slug,
          field: `benefitRules.${rule.id}`,
          message: "할인율 또는 고정 할인액 중 하나는 필요합니다."
        });
      }

      if (rule.monthlyCap > card.monthlyCap) {
        issues.push({
          severity: "warning",
          cardSlug: card.slug,
          field: `benefitRules.${rule.id}.monthlyCap`,
          message: "개별 혜택 한도가 카드 전체 월 한도보다 큽니다."
        });
      }

      if (rule.previousMonthSpendRequired < card.previousSpend) {
        issues.push({
          severity: "warning",
          cardSlug: card.slug,
          field: `benefitRules.${rule.id}.previousMonthSpendRequired`,
          message: "개별 혜택 실적 조건이 카드 대표 전월실적보다 낮습니다. 구간형 상품인지 확인하세요."
        });
      }
    }
  }

  return issues;
}
