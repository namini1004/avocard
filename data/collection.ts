import type { SourceType } from "./cards";

export type CollectionStageId =
  | "discover"
  | "fetch"
  | "extract"
  | "normalize"
  | "validate"
  | "calculate"
  | "review"
  | "monitor";

export type CollectionStage = {
  id: CollectionStageId;
  title: string;
  owner: "crawler" | "parser" | "rules_engine" | "editor";
  output: string;
  acceptanceCriteria: string[];
};

export type SourcePriority = {
  type: SourceType;
  priority: number;
  usage: string;
  trust: "primary" | "secondary" | "reference";
};

export const sourcePriorities: SourcePriority[] = [
  {
    type: "issuer_page",
    priority: 1,
    trust: "primary",
    usage: "카드명, 발급 상태, 대표 혜택, 공식 상품설명서 링크 확인"
  },
  {
    type: "issuer_pdf",
    priority: 2,
    trust: "primary",
    usage: "전월실적, 할인한도, 제외 항목, 유의사항의 최종 근거"
  },
  {
    type: "public_disclosure",
    priority: 3,
    trust: "secondary",
    usage: "카드 후보 발견, 카드사/연회비/주요 혜택 교차 확인"
  },
  {
    type: "editorial_reference",
    priority: 4,
    trust: "reference",
    usage: "인기 카드 후보와 사용자 관심 카테고리 파악. 공개 데이터 확정에는 사용하지 않음"
  },
  {
    type: "user_report",
    priority: 5,
    trust: "reference",
    usage: "변경 제보, 누락 조건 발견, 검수 큐 생성"
  }
];

export const collectionPipeline: CollectionStage[] = [
  {
    id: "discover",
    title: "카드 후보 발견",
    owner: "crawler",
    output: "card-candidates.json",
    acceptanceCriteria: ["카드명", "카드사", "상세 페이지 URL", "발급 가능 상태 후보"]
  },
  {
    id: "fetch",
    title: "원문 수집",
    owner: "crawler",
    output: "raw/{issuer}/{slug}/source.html 또는 source.pdf",
    acceptanceCriteria: ["HTTP 상태 기록", "수집 시각 기록", "원문 해시 저장"]
  },
  {
    id: "extract",
    title: "혜택 문장 추출",
    owner: "parser",
    output: "extracted/{slug}.json",
    acceptanceCriteria: ["연회비", "전월실적", "월 한도", "카테고리별 혜택 후보", "실적 제외 항목"]
  },
  {
    id: "normalize",
    title: "계산 규칙 정규화",
    owner: "rules_engine",
    output: "benefitRules",
    acceptanceCriteria: ["BenefitRule 스키마 통과", "카테고리 매핑", "한도/실적 조건 숫자화"]
  },
  {
    id: "validate",
    title: "데이터 품질 검증",
    owner: "rules_engine",
    output: "quality-report.json",
    acceptanceCriteria: ["공식 출처 존재", "계산 규칙 존재", "한도/실적 이상치 점검"]
  },
  {
    id: "calculate",
    title: "피킹률 계산",
    owner: "rules_engine",
    output: "analysis-preview.json",
    acceptanceCriteria: ["기본 소비 프로필 계산", "전월실적 미달 케이스 계산", "연회비 반영"]
  },
  {
    id: "review",
    title: "운영자 검수",
    owner: "editor",
    output: "reviewStatus=verified",
    acceptanceCriteria: ["상품설명서 원문 대조", "반영/미반영 조건 표기", "마지막 확인일 기록"]
  },
  {
    id: "monitor",
    title: "변경 감지",
    owner: "crawler",
    output: "diff-alerts.json",
    acceptanceCriteria: ["원문 해시 변경 감지", "변경 카드 needs_review 전환", "검수 큐 생성"]
  }
];
