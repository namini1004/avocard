export type BenefitCategory =
  | "transport"
  | "taxi"
  | "fuel"
  | "coffee"
  | "convenience"
  | "delivery"
  | "dining"
  | "shopping"
  | "mart"
  | "telecom"
  | "ott"
  | "medical"
  | "education"
  | "travel"
  | "etc";

export type CardStatus = "active" | "discontinued" | "unknown";
export type ReviewStatus = "draft" | "needs_review" | "verified";
export type RewardType = "discount" | "cashback" | "point" | "mileage";
export type SourceType = "issuer_page" | "issuer_pdf" | "public_disclosure" | "editorial_reference" | "user_report";

export type CardSource = {
  type: SourceType;
  title: string;
  url: string;
  capturedAt?: string;
};

export type BenefitRule = {
  id: string;
  category: BenefitCategory;
  label: string;
  merchantScope: string[];
  rewardType: RewardType;
  rate?: number;
  fixedAmount?: number;
  monthlyCap: number;
  perTransactionCap?: number;
  minTransactionAmount?: number;
  previousMonthSpendRequired: number;
  performanceBand?: string;
  excludedItems: string[];
  sourceRef: string;
  note: string;
};

export type CardBenefit = {
  category: BenefitCategory;
  label: string;
  rate: number;
  monthlyCap: number;
  note: string;
};

export type CreditCard = {
  slug: string;
  name: string;
  issuer: string;
  cardType: "credit" | "check";
  status: CardStatus;
  reviewStatus: ReviewStatus;
  summary: string;
  annualFee: number;
  previousSpend: number;
  advertisedBenefit: string;
  monthlyCap: number;
  excluded: string[];
  benefitRules: BenefitRule[];
  benefits: CardBenefit[];
  sourceUrls: CardSource[];
  lastVerifiedAt: string;
  bestFor: string[];
  cautions: string[];
  strengths: string[];
  weaknesses: string[];
  color: string;
};

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
  travel: "여행",
  etc: "기타"
};

type BenefitSpec = [
  category: BenefitCategory,
  label: string,
  rate: number,
  monthlyCap: number,
  note: string,
  merchants?: string[]
];

type CardSeed = {
  slug: string;
  name: string;
  issuer: string;
  cardType: "credit" | "check";
  summary: string;
  annualFee: number;
  previousSpend: number;
  advertisedBenefit: string;
  monthlyCap: number;
  color: string;
  bestFor: string[];
  strengths: string[];
  weaknesses: string[];
  cautions?: string[];
  specs: BenefitSpec[];
};

const commonExcluded = ["상품권", "선불/기프트카드", "세금", "수수료", "연회비", "카드대출", "무이자할부"];

const issuerProductListUrls: Record<string, string> = {
  신한: "https://www.shinhancard.com",
  삼성: "https://www.samsungcard.com/personal/card/UHPPCA0340M0.jsp",
  현대: "https://www.hyundaicard.com/cpc/cr/CPCCR0201_01.hc",
  국민: "https://card.kbcard.com/CXPRICAC0031.cms",
  롯데: "https://www.lottecard.co.kr",
  우리: "https://pc.wooricard.com",
  하나: "https://www.hanacard.co.kr",
  BC: "https://www.bccard.com/app/card/ContentsLinkActn.do?pgm_id=ind1020",
  네이버페이: "https://new-m.pay.naver.com",
  우체국: "https://www.epostbank.go.kr"
};

const rankingSources: CardSource[] = [
  {
    type: "editorial_reference",
    title: "카드고릴라 2026년 1분기 인기 신용카드 TOP 10",
    url: "https://www.card-gorilla.com/contents/detail/4216",
    capturedAt: "2026-06-09"
  },
  {
    type: "editorial_reference",
    title: "카드고릴라 2026년 5월 인기 체크카드 TOP 10",
    url: "https://m.card-gorilla.com/contents/detail/4219",
    capturedAt: "2026-06-09"
  },
  {
    type: "public_disclosure",
    title: "여신금융협회 상품공시실",
    url: "https://www.crefia.or.kr",
    capturedAt: "2026-06-09"
  }
];

function sources(issuer: string): CardSource[] {
  return [
    {
      type: "issuer_page",
      title: `${issuer} 공식 카드 상품 페이지`,
      url: issuerProductListUrls[issuer] ?? "https://www.crefia.or.kr",
      capturedAt: "2026-06-09"
    },
    ...rankingSources
  ];
}

function toDisplayBenefits(rules: BenefitRule[]): CardBenefit[] {
  return rules.map((rule) => ({
    category: rule.category,
    label: rule.label,
    rate: rule.rate ?? 0,
    monthlyCap: rule.monthlyCap,
    note: rule.note
  }));
}

function makeRules(seed: CardSeed): BenefitRule[] {
  return seed.specs.map(([category, label, rate, monthlyCap, note, merchants], index) => ({
    id: `${seed.slug}-${category}-${index}`,
    category,
    label,
    merchantScope: merchants ?? [label],
    rewardType: seed.name.includes("마일") || seed.name.includes("스카이패스") ? "mileage" : rate >= 0.08 ? "discount" : "point",
    rate,
    monthlyCap,
    previousMonthSpendRequired: seed.previousSpend,
    performanceBand: seed.previousSpend > 0 ? `${Math.round(seed.previousSpend / 10000)}만원 이상` : "실적 무관",
    excludedItems: commonExcluded,
    sourceRef: "issuer_page",
    note
  }));
}

function card(seed: CardSeed): CreditCard {
  const benefitRules = makeRules(seed);

  return {
    slug: seed.slug,
    name: seed.name,
    issuer: seed.issuer,
    cardType: seed.cardType,
    status: "active",
    reviewStatus: "needs_review",
    summary: seed.summary,
    annualFee: seed.annualFee,
    previousSpend: seed.previousSpend,
    advertisedBenefit: seed.advertisedBenefit,
    monthlyCap: seed.monthlyCap,
    excluded: commonExcluded,
    benefitRules,
    benefits: toDisplayBenefits(benefitRules),
    sourceUrls: sources(seed.issuer),
    lastVerifiedAt: "2026-06-09",
    bestFor: seed.bestFor,
    cautions: seed.cautions ?? ["상품설명서 원문 기준으로 전월실적 제외 항목과 한도를 추가 검수해야 합니다."],
    strengths: seed.strengths,
    weaknesses: seed.weaknesses,
    color: seed.color
  };
}

const seeds: CardSeed[] = [
  {
    slug: "samsung-id-select-all",
    name: "삼성 iD SELECT ALL 카드",
    issuer: "삼성",
    cardType: "credit",
    summary: "카드고릴라 2026년 1분기 인기 신용카드 1위. 생활비 혜택팩을 선택해 쓰는 삼성카드.",
    annualFee: 20000,
    previousSpend: 500000,
    advertisedBenefit: "선택 생활영역 최대 10% 할인",
    monthlyCap: 35000,
    color: "from-avocado-300 to-avocado-800",
    bestFor: ["선택형 생활비", "통신/교육/쇼핑 조합"],
    strengths: ["생활 혜택팩 선택 폭이 넓습니다.", "해외 2% 할인도 함께 제공합니다."],
    weaknesses: ["선택팩과 실적 구간별 한도 확인이 필요합니다."],
    specs: [
      ["shopping", "온라인/생활 선택팩", 0.07, 15000, "온라인쇼핑·의료·배달 등 선택 영역"],
      ["telecom", "관리비/통신/교육 선택팩", 0.07, 15000, "통신·교육·아파트관리비 선택 영역"],
      ["delivery", "생활 편의", 0.05, 5000, "배달앱·디지털콘텐츠 등"],
      ["travel", "해외", 0.02, 35000, "전월실적 관계없는 해외 할인"]
    ]
  },
  {
    slug: "shinhan-mr-life",
    name: "신한카드 Mr.Life",
    issuer: "신한",
    cardType: "credit",
    summary: "공과금, 통신, 편의점, 병원, 마트, 주유, 야간 식음료까지 넓게 할인하는 생활비 스테디셀러.",
    annualFee: 15000,
    previousSpend: 300000,
    advertisedBenefit: "월납요금·생활업종 10% 할인",
    monthlyCap: 50000,
    color: "from-lime-300 to-avocado-700",
    bestFor: ["생활비 집중형", "공과금/통신 고정비"],
    strengths: ["30만원 실적부터 생활비 할인이 열립니다.", "고정비와 주말/야간 혜택이 넓습니다."],
    weaknesses: ["시간대·요일·업종 조건을 확인해야 합니다."],
    specs: [
      ["telecom", "월납요금", 0.1, 10000, "통신·전기·도시가스 등 월납요금"],
      ["convenience", "편의점/병원", 0.1, 10000, "편의점·병원·약국·세탁소"],
      ["mart", "주말 마트", 0.1, 10000, "주말 3대 마트"],
      ["fuel", "주말 주유", 0.1, 10000, "주말 4대 정유사"],
      ["dining", "야간 식음료", 0.1, 10000, "야간 식음료·택시"]
    ]
  },
  {
    slug: "woori-shopping-plus",
    name: "우리 카드의정석 SHOPPING+",
    issuer: "우리",
    cardType: "credit",
    summary: "온라인/오프라인 쇼핑 10%와 간편결제 추가 할인을 제공하는 쇼핑 특화 카드.",
    annualFee: 12000,
    previousSpend: 300000,
    advertisedBenefit: "온라인/오프라인 쇼핑 최대 15% 할인",
    monthlyCap: 35000,
    color: "from-avocado-200 to-teal-700",
    bestFor: ["온라인쇼핑형", "마트/백화점 소비"],
    strengths: ["온라인과 오프라인 쇼핑을 모두 잡습니다.", "간편결제 추가 할인 구조가 있습니다."],
    weaknesses: ["교통·통신 고정비 혜택은 약합니다."],
    specs: [
      ["shopping", "온라인쇼핑", 0.1, 15000, "온라인 업종 할인"],
      ["shopping", "간편결제 추가", 0.05, 5000, "주요 간편결제 추가 할인"],
      ["mart", "오프라인 쇼핑", 0.1, 10000, "백화점·마트·아울렛·슈퍼"],
      ["fuel", "주말 주유", 0.05, 5000, "4대 주유소 주말 할인"]
    ]
  },
  {
    slug: "samsung-mileage-platinum-skypass",
    name: "삼성카드 & MILEAGE PLATINUM (스카이패스)",
    issuer: "삼성",
    cardType: "credit",
    summary: "전 가맹점 스카이패스 기본 적립과 국내/해외 선택형 추가 적립을 제공하는 마일리지 카드.",
    annualFee: 49000,
    previousSpend: 0,
    advertisedBenefit: "1천원당 1~2마일 적립",
    monthlyCap: 70000,
    color: "from-sky-300 to-avocado-800",
    bestFor: ["항공마일리지", "해외/주유/백화점"],
    strengths: ["기본 적립 구조가 단순합니다.", "해외형/국내형 추가 적립을 고를 수 있습니다."],
    weaknesses: ["마일리지 가치는 사용처에 따라 달라집니다."],
    specs: [
      ["etc", "국내외 기본 적립", 0.01, 40000, "전 가맹점 1천원당 1마일 상당"],
      ["fuel", "국내형 추가 적립", 0.01, 10000, "백화점·주유·커피·편의점·택시"],
      ["travel", "해외형 추가 적립", 0.01, 20000, "해외 가맹점/직구"]
    ]
  },
  {
    slug: "kb-my-wesh",
    name: "KB국민 My WE:SH 카드",
    issuer: "국민",
    cardType: "credit",
    summary: "간편결제, 음식점, 편의점, 통신, OTT, 커피 등 2030 생활 소비에 맞춘 카드.",
    annualFee: 15000,
    previousSpend: 400000,
    advertisedBenefit: "생활영역 최대 10% 할인",
    monthlyCap: 32000,
    color: "from-yellow-300 to-avocado-700",
    bestFor: ["2030 생활형", "간편결제/OTT"],
    strengths: ["젊은 층 소비처 커버가 좋습니다.", "통신·OTT·커피를 함께 잡습니다."],
    weaknesses: ["주유/교육 소비에는 약합니다."],
    specs: [
      ["shopping", "간편결제", 0.1, 10000, "KB Pay 등 간편결제"],
      ["dining", "음식점/편의점", 0.1, 8000, "음식점·편의점 생활 할인"],
      ["telecom", "통신", 0.1, 7000, "이동통신 자동납부"],
      ["ott", "OTT", 0.1, 4000, "OTT/구독"],
      ["coffee", "커피", 0.1, 3000, "커피전문점"]
    ]
  },
  {
    slug: "samsung-taptap-o",
    name: "삼성카드 taptap O",
    issuer: "삼성",
    cardType: "credit",
    summary: "대중교통·택시·통신 10%와 커피/쇼핑 라이프스타일 패키지를 제공하는 카드.",
    annualFee: 10000,
    previousSpend: 300000,
    advertisedBenefit: "교통·통신 10% 할인",
    monthlyCap: 30000,
    color: "from-orange-200 to-avocado-700",
    bestFor: ["대중교통 + 커피", "사회초년생"],
    strengths: ["교통·통신·커피 조합이 좋습니다.", "연회비 부담이 낮습니다."],
    weaknesses: ["고액 쇼핑형 사용자에게는 한도가 작을 수 있습니다."],
    specs: [
      ["transport", "대중교통/택시", 0.1, 10000, "버스·지하철·택시"],
      ["telecom", "통신", 0.1, 5000, "이동통신 자동납부"],
      ["coffee", "커피 패키지", 0.3, 10000, "커피 라이프스타일 패키지"],
      ["shopping", "쇼핑 패키지", 0.07, 5000, "오픈마켓/소셜커머스 등"]
    ]
  },
  {
    slug: "samsung-the-1-skypass",
    name: "삼성 THE 1 (스카이패스)",
    issuer: "삼성",
    cardType: "credit",
    summary: "15만원 상당 기프트 옵션과 스카이패스 마일리지 적립을 결합한 프리미엄 카드.",
    annualFee: 200000,
    previousSpend: 500000,
    advertisedBenefit: "15만원 상당 기프트와 마일리지 적립",
    monthlyCap: 90000,
    color: "from-zinc-300 to-avocado-900",
    bestFor: ["프리미엄/마일리지", "항공 이용자"],
    strengths: ["연간 기프트가 큽니다.", "마일리지 적립 구조가 단순합니다."],
    weaknesses: ["연회비가 높고 기프트 사용 여부가 중요합니다."],
    specs: [
      ["travel", "기프트 월환산", 0.2, 12500, "15만원 상당 기프트 월환산"],
      ["etc", "기본 마일리지", 0.01, 40000, "전 가맹점 스카이패스 적립"],
      ["travel", "여행/해외 추가", 0.02, 35000, "여행·호텔·해외 추가 적립"]
    ]
  },
  {
    slug: "lotte-loca-365",
    name: "롯데 LOCA 365 카드",
    issuer: "롯데",
    cardType: "credit",
    summary: "아파트관리비, 공과금, 통신, 교통, 배달 등 반복 생활비를 항목별로 할인하는 카드.",
    annualFee: 20000,
    previousSpend: 500000,
    advertisedBenefit: "생활업종 매월 365일 할인",
    monthlyCap: 50000,
    color: "from-red-200 to-avocado-800",
    bestFor: ["공과금/관리비", "반복 생활비"],
    strengths: ["생활비 항목이 넓습니다.", "고정비가 많은 사용자에게 좋습니다."],
    weaknesses: ["항목별 한도가 작아 여러 항목을 써야 효율이 납니다."],
    specs: [
      ["etc", "관리비/공과금", 0.1, 10000, "아파트관리비·도시가스·전기"],
      ["telecom", "통신", 0.1, 5000, "이동통신 자동납부"],
      ["transport", "대중교통", 0.1, 5000, "버스·지하철"],
      ["delivery", "배달앱", 0.1, 5000, "배달앱"],
      ["ott", "구독/보험", 0.1, 10000, "구독·보험 등 반복 납부"]
    ]
  },
  {
    slug: "kb-coupang-wow",
    name: "KB국민 쿠팡 와우카드",
    issuer: "국민",
    cardType: "credit",
    summary: "쿠팡, 쿠팡이츠, 쿠팡플레이 등 쿠팡 생태계 이용에 쿠팡캐시 적립을 제공하는 카드.",
    annualFee: 20000,
    previousSpend: 0,
    advertisedBenefit: "쿠팡 이용 쿠팡캐시 적립",
    monthlyCap: 52000,
    color: "from-blue-200 to-avocado-800",
    bestFor: ["쿠팡 집중형", "온라인쇼핑/배달"],
    strengths: ["쿠팡 생태계에서는 체감이 쉽습니다.", "실적 부담이 낮습니다."],
    weaknesses: ["쿠팡 외 범용 생활 할인은 약합니다."],
    specs: [
      ["shopping", "쿠팡 쇼핑", 0.04, 40000, "쿠팡 결제 쿠팡캐시 적립"],
      ["delivery", "쿠팡이츠", 0.04, 8000, "쿠팡이츠 적립"],
      ["ott", "쿠팡플레이/와우", 0.04, 4000, "쿠팡 관련 구독/콘텐츠"]
    ]
  },
  {
    slug: "hyundai-amex-gold-edition2",
    name: "현대 American Express® Gold Card Edition2",
    issuer: "현대",
    cardType: "credit",
    summary: "연 25만원 상당 바우처, MR 적립, 공항/호텔 혜택을 제공하는 프리미엄 카드.",
    annualFee: 300000,
    previousSpend: 500000,
    advertisedBenefit: "연 25만원 바우처와 최대 3MR 적립",
    monthlyCap: 120000,
    color: "from-yellow-200 to-zinc-800",
    bestFor: ["프리미엄 바우처", "해외/호텔/여행"],
    strengths: ["바우처 가치가 큽니다.", "여행·호텔 적립이 강합니다."],
    weaknesses: ["연회비가 매우 높아 바우처 사용이 중요합니다."],
    specs: [
      ["travel", "바우처 월환산", 0.2, 20833, "연 25만원 상당 바우처 월환산"],
      ["travel", "해외/호텔/항공", 0.03, 50000, "추가 MR 적립 영역"],
      ["etc", "기본 MR", 0.01, 30000, "국내외 기본 적립"],
      ["travel", "라운지/발레파킹", 0.02, 19167, "공항·호텔 부가혜택 월환산"]
    ]
  },
  {
    slug: "kbank-one-check",
    name: "케이뱅크 ONE 체크카드",
    issuer: "BC",
    cardType: "check",
    summary: "K-패스 교통 환급과 선택형 캐시백으로 2026년 체크카드 인기 1위에 오른 카드.",
    annualFee: 0,
    previousSpend: 0,
    advertisedBenefit: "선택형 캐시백과 K-패스 교통 혜택",
    monthlyCap: 35000,
    color: "from-violet-200 to-avocado-800",
    bestFor: ["체크카드", "교통/온라인"],
    strengths: ["연회비가 없습니다.", "교통과 온라인 소비에 좋습니다."],
    weaknesses: ["신용카드형 고한도 할인은 어렵습니다."],
    specs: [
      ["transport", "K-패스/교통", 0.1, 3000, "대중교통 추가 캐시백"],
      ["shopping", "온라인 캐시백", 0.01, 15000, "온라인 1% 캐시백"],
      ["etc", "오프라인 캐시백", 0.005, 10000, "오프라인 0.5% 캐시백"],
      ["etc", "369 캐시백", 0.02, 7000, "결제 패턴형 캐시백"]
    ]
  },
  {
    slug: "kb-youth-club-check",
    name: "KB Youth Club 체크카드",
    issuer: "국민",
    cardType: "check",
    summary: "만 18~29세를 대상으로 OTT, APP, 택시, 편의점, 배달 등 선택팩 할인을 제공하는 카드.",
    annualFee: 0,
    previousSpend: 200000,
    advertisedBenefit: "20대 전용 선택형 생활 할인",
    monthlyCap: 20000,
    color: "from-pink-200 to-avocado-800",
    bestFor: ["20대 체크카드", "OTT/편의점/배달"],
    strengths: ["20대 주요 소비처에 집중되어 있습니다.", "연회비가 없습니다."],
    weaknesses: ["연령 제한과 선택팩 조건이 있습니다."],
    specs: [
      ["ott", "OTT/멤버십", 0.5, 5000, "OTT 또는 멤버십 선택팩"],
      ["shopping", "APP/패션", 0.3, 5000, "앱/패션/올리브영 등"],
      ["delivery", "배달", 0.2, 4000, "배달앱"],
      ["convenience", "편의점", 0.2, 3000, "편의점"],
      ["taxi", "택시/철도", 0.2, 3000, "택시·철도"]
    ]
  },
  {
    slug: "kb-nori2-kbpay-check",
    name: "KB국민 노리2 체크카드(KB Pay)",
    issuer: "국민",
    cardType: "check",
    summary: "KB Pay, 편의점, 커피, 모바일, 문화 영역을 담은 대표 체크카드.",
    annualFee: 0,
    previousSpend: 200000,
    advertisedBenefit: "KB Pay와 생활영역 할인",
    monthlyCap: 25000,
    color: "from-yellow-200 to-avocado-800",
    bestFor: ["체크카드 입문", "KB Pay"],
    strengths: ["생활 필수 영역이 고르게 있습니다.", "연회비가 없습니다."],
    weaknesses: ["고액 소비에는 한도가 낮습니다."],
    specs: [
      ["shopping", "KB Pay", 0.02, 6000, "KB Pay 결제"],
      ["convenience", "편의점", 0.05, 4000, "편의점"],
      ["coffee", "커피", 0.05, 4000, "커피전문점"],
      ["transport", "대중교통", 0.1, 5000, "버스·지하철"],
      ["ott", "문화/모바일", 0.1, 6000, "콘텐츠/모바일"]
    ]
  },
  {
    slug: "shinhan-sol-travel-check",
    name: "신한카드 SOL트래블 체크",
    issuer: "신한",
    cardType: "check",
    summary: "해외 수수료와 환전 혜택, 공항라운지 등 여행 특화 기능을 담은 체크카드.",
    annualFee: 0,
    previousSpend: 300000,
    advertisedBenefit: "해외 이용/환전 우대와 여행 혜택",
    monthlyCap: 40000,
    color: "from-sky-200 to-avocado-800",
    bestFor: ["여행 체크카드", "해외결제"],
    strengths: ["해외 결제에 적합합니다.", "연회비가 없습니다."],
    weaknesses: ["국내 생활 할인은 제한적입니다."],
    specs: [
      ["travel", "해외 수수료/환율", 0.02, 20000, "해외 결제 체감 혜택"],
      ["travel", "공항라운지", 0.1, 10000, "라운지 월환산 가치"],
      ["shopping", "국내 간편결제", 0.005, 5000, "국내 보조 혜택"],
      ["transport", "교통", 0.05, 5000, "국내 교통 보조 혜택"]
    ]
  },
  {
    slug: "naverpay-money-card",
    name: "네이버페이 머니카드",
    issuer: "네이버페이",
    cardType: "check",
    summary: "네이버페이 머니 기반 결제와 네이버 생태계 적립에 강한 카드.",
    annualFee: 0,
    previousSpend: 0,
    advertisedBenefit: "네이버페이 포인트 적립",
    monthlyCap: 30000,
    color: "from-green-200 to-avocado-800",
    bestFor: ["네이버페이", "온라인쇼핑"],
    strengths: ["실적 부담이 낮습니다.", "네이버 쇼핑과 궁합이 좋습니다."],
    weaknesses: ["오프라인 특화 혜택은 약합니다."],
    specs: [
      ["shopping", "네이버페이", 0.01, 20000, "네이버페이 결제 적립"],
      ["shopping", "온라인쇼핑", 0.005, 7000, "온라인 결제"],
      ["etc", "일반 결제", 0.003, 3000, "일반 가맹점"]
    ]
  },
  {
    slug: "hana-nara-sarang",
    name: "하나 나라사랑카드",
    issuer: "하나",
    cardType: "check",
    summary: "군마트, 쿠팡, 네이버플러스 스토어, CU 등 군 장병/청년 생활 혜택을 제공하는 체크카드.",
    annualFee: 0,
    previousSpend: 0,
    advertisedBenefit: "군마트·쿠팡·CU 등 생활 할인",
    monthlyCap: 25000,
    color: "from-emerald-200 to-avocado-900",
    bestFor: ["군 장병/청년", "편의점/쇼핑"],
    strengths: ["연회비와 실적 부담이 낮습니다.", "생활 밀착 혜택이 있습니다."],
    weaknesses: ["일부 혜택은 대상자/기간 조건이 있을 수 있습니다."],
    specs: [
      ["mart", "군마트", 0.05, 7000, "군마트 할인"],
      ["shopping", "쿠팡/네이버", 0.03, 8000, "쿠팡·네이버플러스 스토어"],
      ["convenience", "CU", 0.05, 5000, "CU 편의점"],
      ["travel", "야놀자/여행", 0.05, 5000, "프로모션형 여행 혜택"]
    ]
  },
  {
    slug: "kb-travelers-tosimi-check",
    name: "KB국민 트래블러스 체크카드(토심이)",
    issuer: "국민",
    cardType: "check",
    summary: "해외결제와 여행 편의 혜택에 캐릭터 디자인을 더한 트래블 체크카드.",
    annualFee: 0,
    previousSpend: 300000,
    advertisedBenefit: "해외/여행 체크카드 혜택",
    monthlyCap: 35000,
    color: "from-rose-200 to-avocado-800",
    bestFor: ["해외여행", "체크카드"],
    strengths: ["여행과 일상 결제가 함께 가능합니다.", "연회비가 없습니다."],
    weaknesses: ["국내 생활비 특화 혜택은 제한적입니다."],
    specs: [
      ["travel", "해외 결제", 0.02, 15000, "해외 결제 체감 혜택"],
      ["travel", "여행 편의", 0.05, 10000, "여행/공항 편의 혜택"],
      ["shopping", "국내 쇼핑", 0.005, 5000, "국내 쇼핑 보조 혜택"],
      ["coffee", "카페", 0.05, 5000, "카페/간식"]
    ]
  },
  {
    slug: "post-my-type-check",
    name: "우체국 MY-TYPE 체크카드",
    issuer: "우체국",
    cardType: "check",
    summary: "소비 타입별 혜택을 고르는 우체국 체크카드.",
    annualFee: 0,
    previousSpend: 300000,
    advertisedBenefit: "MY-TYPE 선택형 할인",
    monthlyCap: 25000,
    color: "from-orange-200 to-avocado-800",
    bestFor: ["선택형 체크", "생활비"],
    strengths: ["선택형 구조입니다.", "연회비가 없습니다."],
    weaknesses: ["혜택 타입 관리가 필요합니다."],
    specs: [
      ["shopping", "쇼핑 타입", 0.05, 7000, "쇼핑 선택 혜택"],
      ["dining", "외식 타입", 0.05, 6000, "외식 선택 혜택"],
      ["transport", "교통 타입", 0.05, 6000, "교통 선택 혜택"],
      ["coffee", "카페 타입", 0.05, 6000, "카페 선택 혜택"]
    ]
  },
  {
    slug: "toss-bank-check",
    name: "토스뱅크 체크카드",
    issuer: "BC",
    cardType: "check",
    summary: "시즌별 캐시백과 간편한 앱 기반 혜택 관리가 특징인 체크카드.",
    annualFee: 0,
    previousSpend: 0,
    advertisedBenefit: "시즌형 캐시백",
    monthlyCap: 25000,
    color: "from-blue-200 to-avocado-800",
    bestFor: ["간편 체크", "소액 캐시백"],
    strengths: ["앱 관리가 쉽습니다.", "실적 부담이 낮습니다."],
    weaknesses: ["혜택이 시즌제로 바뀝니다."],
    specs: [
      ["convenience", "편의점", 0.03, 5000, "시즌 캐시백"],
      ["coffee", "커피", 0.03, 5000, "시즌 캐시백"],
      ["transport", "교통", 0.03, 5000, "시즌 캐시백"],
      ["shopping", "온라인", 0.03, 10000, "시즌 캐시백"]
    ]
  },
  {
    slug: "kg-mobil-card",
    name: "모빌카드",
    issuer: "BC",
    cardType: "check",
    summary: "모빌리티와 생활 결제를 함께 노리는 체크카드.",
    annualFee: 0,
    previousSpend: 300000,
    advertisedBenefit: "모빌리티/생활 캐시백",
    monthlyCap: 22000,
    color: "from-indigo-200 to-avocado-800",
    bestFor: ["모빌리티", "교통/편의점"],
    strengths: ["이동 관련 소비에 맞습니다.", "연회비가 없습니다."],
    weaknesses: ["제휴처 외 혜택은 제한적입니다."],
    specs: [
      ["transport", "교통/모빌리티", 0.05, 8000, "대중교통·모빌리티"],
      ["taxi", "택시", 0.05, 5000, "택시/호출"],
      ["convenience", "편의점", 0.03, 4000, "편의점"],
      ["coffee", "커피", 0.03, 5000, "카페"]
    ]
  }
];

export const cards: CreditCard[] = seeds.map(card);
