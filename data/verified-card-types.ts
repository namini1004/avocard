export const benefitCategories = [
  "transport",
  "taxi",
  "fuel",
  "coffee",
  "convenience",
  "delivery",
  "dining",
  "shopping",
  "mart",
  "telecom",
  "ott",
  "medical",
  "education",
  "travel",
  "etc"
] as const;

export type BenefitCategory = (typeof benefitCategories)[number];

export const categoryLabels: Record<BenefitCategory, string> = {
  transport: "대중교통",
  taxi: "택시",
  fuel: "주유",
  coffee: "커피",
  convenience: "편의점",
  delivery: "배달",
  dining: "외식",
  shopping: "온라인쇼핑",
  mart: "마트",
  telecom: "통신",
  ott: "OTT/구독",
  medical: "병원/약국",
  education: "교육",
  travel: "여행/해외",
  etc: "기타"
};

export type SpendingProfile = Record<BenefitCategory, number> & {
  total: number;
};

export type TransactionChannel = "online" | "offline" | "overseas";

export type ScenarioTransaction = {
  id: string;
  amount: number;
  category: BenefitCategory;
  channel: TransactionChannel;
  merchant: string;
  tags: string[];
};

export type RewardFormula =
  | {
      kind: "rate";
      rate: number;
    }
  | {
      kind: "fixed";
      amount: number;
    }
  | {
      kind: "per_liter";
      wonPerLiter: number;
      assumedPricePerLiter: number;
    };

export type RewardBand = {
  minTransactionAmount?: number;
  maxTransactionAmountExclusive?: number;
  formula: RewardFormula;
};

export type RuleCapTier = {
  minPreviousSpend: number;
  maxPreviousSpendExclusive?: number;
  monthlyCap: number;
};

export type VerifiedBenefitRule = {
  id: string;
  label: string;
  appliesTo: BenefitCategory[] | "all";
  merchantScope: string[];
  rewardType: "discount" | "cashback" | "point";
  rewardBands: RewardBand[];
  requiredTags?: string[];
  excludedTags?: string[];
  minPreviousSpend?: number;
  monthlyCategorySpendMin?: number;
  perTransactionCap?: number;
  monthlyCap?: number;
  monthlyCapTiers?: RuleCapTier[];
  monthlyCountCap?: number;
  capGroupId?: string;
  separateFromMainCap?: boolean;
  performanceWeight?: number;
  priority?: number;
  sourceId: string;
  note: string;
};

export type BonusCapCondition = {
  label: string;
  capGroupId: string;
  totalCap: number;
  categories: BenefitCategory[];
  minTransactionAmount: number;
  minTransactionCount: number;
  requiredTags?: string[];
};

export type CardCapTier = {
  id: string;
  label: string;
  minPreviousSpend: number;
  maxPreviousSpendExclusive?: number;
  totalCap?: number;
  groupCaps?: Record<string, number>;
  ruleCaps?: Record<string, number>;
  bonusConditions?: BonusCapCondition[];
};

export type PerformancePolicy = {
  minimumSpend: number;
  defaultWeight: number;
  categoryWeights?: Partial<Record<BenefitCategory, number>>;
  excludedTags: string[];
  description: string;
};

export type OfficialSource = {
  id: string;
  type: "issuer_page" | "issuer_pdf" | "issuer_notice";
  title: string;
  url: string;
  capturedAt: string;
  verifiedFields: string[];
};

export type VerifiedCard = {
  slug: string;
  name: string;
  issuer: string;
  cardType: "credit" | "check";
  status: "active";
  summary: string;
  advertisedBenefit: string;
  annualFee: number;
  performance: PerformancePolicy;
  capTiers: CardCapTier[];
  benefitRules: VerifiedBenefitRule[];
  excludedBenefitTags: string[];
  bestFor: string[];
  cautions: string[];
  strengths: string[];
  weaknesses: string[];
  nonCalculatedBenefits: string[];
  calculationCoverage: "full_monetary" | "core_monetary";
  verification: {
    status: "verified";
    verifiedAt: string;
    method: string;
    sources: OfficialSource[];
  };
  color: {
    background: string;
    foreground: string;
    accent: string;
  };
};
