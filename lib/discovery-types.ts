import type { BenefitCategory } from "../data/verified-card-types.ts";

export type ChoiceMode = "easy" | "benefit" | "maximum";
export type Expense = {
  category: BenefitCategory;
  amount: number;
  count: number;
  merchant: string;
  weekend: boolean;
  night: boolean;
  autopay: boolean;
};
export type DiscoveryInput = {
  total: number;
  mode: ChoiceMode;
  cardType: "all" | "credit" | "check";
  maxAnnualFee: number;
  expenses: Expense[];
};
export const initialDiscovery: DiscoveryInput = {
  total: 700000,
  mode: "easy",
  cardType: "all",
  maxAnnualFee: 1000000,
  expenses: [],
};

export const expenseOptions: {
  category: BenefitCategory;
  label: string;
  merchants: string[];
}[] = [
  {
    category: "shopping",
    label: "온라인쇼핑",
    merchants: [
      "미지정",
      "쿠팡",
      "네이버페이",
      "컬리",
      "SSG.COM",
      "G마켓",
      "옥션",
      "11번가",
    ],
  },
  {
    category: "mart",
    label: "마트",
    merchants: ["미지정", "이마트", "롯데마트", "홈플러스"],
  },
  {
    category: "fuel",
    label: "주유",
    merchants: ["미지정", "SK에너지", "GS칼텍스", "HD현대오일뱅크", "S-OIL"],
  },
  {
    category: "coffee",
    label: "커피",
    merchants: ["미지정", "스타벅스", "이디야", "기타 카페"],
  },
  {
    category: "convenience",
    label: "편의점",
    merchants: ["미지정", "GS25", "CU", "세븐일레븐"],
  },
  {
    category: "delivery",
    label: "배달",
    merchants: ["미지정", "배달의민족", "요기요", "쿠팡이츠"],
  },
  {
    category: "telecom",
    label: "통신",
    merchants: ["미지정", "SKT", "KT", "LG U+", "알뜰폰"],
  },
  { category: "transport", label: "대중교통", merchants: ["버스·지하철"] },
  { category: "dining", label: "외식", merchants: ["음식점"] },
  { category: "medical", label: "병원·약국", merchants: ["병원·약국"] },
  { category: "taxi", label: "택시", merchants: ["택시"] },
  { category: "ott", label: "구독", merchants: ["OTT·구독"] },
];

export type CardChoice = {
  slug: string;
  name: string;
  issuer: string;
  cardType: "credit" | "check";
  color: { background: string; foreground: string; accent: string };
  summary: string;
  annualFee: number;
  minimumSpend: number;
  simple: boolean;
  easeLabel: string;
  conditions: string[];
  cautions: string[];
  bestFor: string[];
  performanceDescription: string;
  tiers: { label: string; limits: string }[];
  benefits: {
    label: string;
    note: string;
    merchants: string[];
    saving: number;
  }[];
  totalSpend: number;
  grossBenefit: number;
  monthlyFee: number;
  netBenefit: number;
  feeShortfall: number;
  pickingRate: number;
  annualBenefit: number;
  qualifyingSpend: number;
  performanceGap: number;
  maximumRate: number;
  maximumSpend: number;
  maximumBenefit: number;
  maximumAllocation: { label: string; amount: number }[];
  comparisonDelta: number | null;
};

export type DiscoveryResult = {
  input: DiscoveryInput;
  cards: CardChoice[];
  highlights: CardChoice[];
  unassignedSpend: number;
};
