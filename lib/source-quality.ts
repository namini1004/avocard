import type { OfficialIssuerSource, PopularCoverageTarget } from "../data/official-sources";

export type SourcePlanIssue = {
  severity: "error" | "warning";
  field: string;
  message: string;
};

function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:";
  } catch {
    return false;
  }
}

export function validateOfficialSourcePlan({
  issuers,
  targets,
  minimumCoverage
}: {
  issuers: OfficialIssuerSource[];
  targets: PopularCoverageTarget[];
  minimumCoverage: number;
}) {
  const issues: SourcePlanIssue[] = [];
  const issuerCodes = new Set(issuers.map((issuer) => issuer.code));
  const targetIds = new Set<string>();

  if (targets.length < minimumCoverage) {
    issues.push({
      severity: "error",
      field: "popularCoverageTargets",
      message: `최소 ${minimumCoverage}개 수집 슬롯이 필요하지만 ${targets.length}개만 있습니다.`
    });
  }

  for (const issuer of issuers) {
    if (issuer.productListUrls.length === 0) {
      issues.push({
        severity: "error",
        field: `${issuer.code}.productListUrls`,
        message: "공식 상품 목록 URL이 필요합니다."
      });
    }

    for (const url of issuer.productListUrls) {
      if (!isHttpUrl(url)) {
        issues.push({
          severity: "error",
          field: `${issuer.code}.productListUrls`,
          message: `HTTPS URL이 아닙니다: ${url}`
        });
      }
    }
  }

  for (const target of targets) {
    if (targetIds.has(target.id)) {
      issues.push({
        severity: "error",
        field: target.id,
        message: "중복 수집 슬롯 ID입니다."
      });
    }
    targetIds.add(target.id);

    if (!issuerCodes.has(target.issuerCode)) {
      issues.push({
        severity: "error",
        field: target.id,
        message: "등록되지 않은 카드사 코드입니다."
      });
    }

    if (!target.requiredSources.includes("issuer_page") || !target.requiredSources.includes("issuer_pdf")) {
      issues.push({
        severity: "error",
        field: target.id,
        message: "공식 상품 페이지와 상품설명서 PDF가 모두 필수 출처여야 합니다."
      });
    }
  }

  return issues;
}
