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
  status?: CardStatus;
  summary: string;
  annualFee: number;
  previousSpend: number;
  advertisedBenefit: string;
  monthlyCap: number;
  color: string;
  bestFor: string[];
  strengths: string[];
  weaknesses: string[];
  specs: BenefitSpec[];
};

const commonExcluded = ["상품권", "선불/기프트카드", "세금", "수수료", "연회비", "카드대출", "무이자할부"];

const issuerUrls: Record<string, string> = {
  신한: "https://www.shinhancard.com",
  삼성: "https://www.samsungcard.com",
  현대: "https://www.hyundaicard.com",
  KB국민: "https://card.kbcard.com",
  롯데: "https://www.lottecard.co.kr",
  우리: "https://pc.wooricard.com",
  하나: "https://www.hanacard.co.kr",
  NH농협: "https://card.nonghyup.com",
  BC: "https://www.bccard.com",
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
    title: "카드고릴라 2026년 1분기 인기 체크카드 TOP 10",
    url: "https://www.card-gorilla.com/contents/detail/4217",
    capturedAt: "2026-06-09"
  },
  {
    type: "editorial_reference",
    title: "카드고릴라 2025년 총결산 인기 신용카드 TOP 20",
    url: "https://m.card-gorilla.com/contents/detail/4096",
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
      title: `${issuer}카드 공식 상품 페이지`,
      url: issuerUrls[issuer] ?? "https://www.crefia.or.kr",
      capturedAt: "2026-06-09"
    },
    ...rankingSources
  ];
}

function rewardType(name: string, rate: number): RewardType {
  if (name.includes("MILEAGE") || name.includes("스카이패스") || name.includes("마일")) return "mileage";
  if (rate >= 0.08) return "discount";
  return "point";
}

function makeRules(seed: CardSeed): BenefitRule[] {
  return seed.specs.map(([category, label, rate, monthlyCap, note, merchants], index) => ({
    id: `${seed.slug}-${category}-${index}`,
    category,
    label,
    merchantScope: merchants ?? [label],
    rewardType: rewardType(seed.name, rate),
    rate,
    monthlyCap,
    previousMonthSpendRequired: seed.previousSpend,
    performanceBand: seed.previousSpend > 0 ? `${Math.round(seed.previousSpend / 10000)}만원 이상` : "실적 부담 낮음",
    excludedItems: commonExcluded,
    sourceRef: "issuer_page",
    note
  }));
}

function toBenefits(rules: BenefitRule[]): CardBenefit[] {
  return rules.map((rule) => ({
    category: rule.category,
    label: rule.label,
    rate: rule.rate ?? 0,
    monthlyCap: rule.monthlyCap,
    note: rule.note
  }));
}

function card(seed: CardSeed): CreditCard {
  const benefitRules = makeRules(seed);

  return {
    slug: seed.slug,
    name: seed.name,
    issuer: seed.issuer,
    cardType: seed.cardType,
    status: seed.status ?? "active",
    reviewStatus: "needs_review",
    summary: seed.summary,
    annualFee: seed.annualFee,
    previousSpend: seed.previousSpend,
    advertisedBenefit: seed.advertisedBenefit,
    monthlyCap: seed.monthlyCap,
    excluded: commonExcluded,
    benefitRules,
    benefits: toBenefits(benefitRules),
    sourceUrls: sources(seed.issuer),
    lastVerifiedAt: "2026-06-09",
    bestFor: seed.bestFor,
    cautions: ["공식 상품설명서와 여신협회 공시 기준으로 최종 한도와 제외 항목을 다시 확인해야 합니다."],
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
    summary: "생활 업종을 직접 고르는 선택형 할인 카드입니다.",
    annualFee: 20000,
    previousSpend: 500000,
    advertisedBenefit: "선택 생활영역 최대 10% 할인",
    monthlyCap: 35000,
    color: "from-avocado-300 to-avocado-800",
    bestFor: ["생활비 선택형", "통신/교육/쇼핑 조합"],
    strengths: ["선택 업종을 소비 패턴에 맞출 수 있습니다.", "해외 이용 보조 혜택이 있습니다."],
    weaknesses: ["선택팩과 구간별 한도를 맞춰야 효율이 납니다."],
    specs: [
      ["shopping", "온라인 생활 선택팩", 0.07, 15000, "온라인쇼핑/의류/마켓 중 선택 영역"],
      ["telecom", "관리비·통신·교육 선택팩", 0.07, 15000, "통신·교육·아파트관리비 선택 영역"],
      ["delivery", "생활 편의", 0.05, 5000, "배달앱·디지털콘텐츠"],
      ["travel", "해외 이용", 0.02, 35000, "해외 결제 보조 할인"]
    ]
  },
  {
    slug: "shinhan-mr-life",
    name: "신한카드 Mr.Life",
    issuer: "신한",
    cardType: "credit",
    status: "discontinued",
    summary: "공과금, 통신, 편의점, 병원, 마트, 주유까지 생활비에 강한 카드입니다.",
    annualFee: 15000,
    previousSpend: 300000,
    advertisedBenefit: "월납요금·생활업종 10% 할인",
    monthlyCap: 50000,
    color: "from-lime-300 to-avocado-700",
    bestFor: ["생활비 집중형", "고정비가 많은 사용자"],
    strengths: ["30만원 실적부터 생활비 할인이 열립니다.", "고정비와 주말 소비를 같이 잡습니다."],
    weaknesses: ["시간대와 업종 조건을 꼼꼼히 봐야 합니다."],
    specs: [
      ["telecom", "월납요금", 0.1, 10000, "통신·전기·도시가스 등 월납요금"],
      ["convenience", "편의점·병원", 0.1, 10000, "편의점·병원·약국·세탁소"],
      ["mart", "주말 마트", 0.1, 10000, "주말 주요 마트"],
      ["fuel", "주말 주유", 0.1, 10000, "주말 4대 정유사"],
      ["dining", "야간 식음료", 0.1, 10000, "야간 식음료 업종"]
    ]
  },
  {
    slug: "woori-shopping-plus",
    name: "우리 카드의정석 SHOPPING+",
    issuer: "우리",
    cardType: "credit",
    summary: "온라인·오프라인 쇼핑과 간편결제 할인을 함께 보는 쇼핑 특화 카드입니다.",
    annualFee: 12000,
    previousSpend: 300000,
    advertisedBenefit: "쇼핑 최대 15% 할인",
    monthlyCap: 35000,
    color: "from-avocado-200 to-teal-700",
    bestFor: ["온라인쇼핑형", "마트/백화점 소비"],
    strengths: ["온라인과 오프라인 쇼핑을 모두 커버합니다.", "간편결제 추가 할인이 있습니다."],
    weaknesses: ["교통·통신 고정비 혜택은 약합니다."],
    specs: [
      ["shopping", "온라인쇼핑", 0.1, 15000, "온라인 업종 할인"],
      ["shopping", "간편결제 추가", 0.05, 5000, "주요 간편결제 추가 할인"],
      ["mart", "오프라인 쇼핑", 0.1, 10000, "백화점·마트·아울렛·슈퍼"],
      ["fuel", "주말 주유", 0.05, 5000, "주말 주유 할인"]
    ]
  },
  {
    slug: "samsung-mileage-platinum-skypass",
    name: "삼성카드 & MILEAGE PLATINUM",
    issuer: "삼성",
    cardType: "credit",
    summary: "스카이패스 마일리지 적립을 중심으로 해외·주유·백화점 보조 적립을 제공합니다.",
    annualFee: 49000,
    previousSpend: 0,
    advertisedBenefit: "1천원당 1~2마일 적립",
    monthlyCap: 70000,
    color: "from-sky-300 to-avocado-800",
    bestFor: ["항공마일리지형", "해외/주유/백화점"],
    strengths: ["기본 적립 구조가 단순합니다.", "해외와 국내 추가 적립처가 있습니다."],
    weaknesses: ["마일리지 가치는 사용처에 따라 달라집니다."],
    specs: [
      ["etc", "국내외 기본 적립", 0.01, 40000, "가맹점 1천원당 1마일 상당"],
      ["fuel", "국내 추가 적립", 0.01, 10000, "백화점·주유·카페·편의점·택시"],
      ["travel", "해외 추가 적립", 0.01, 20000, "해외 가맹점/직구"]
    ]
  },
  {
    slug: "kb-my-wesh",
    name: "KB국민 My WE:SH 카드",
    issuer: "KB국민",
    cardType: "credit",
    summary: "간편결제, 외식, 편의점, 통신, OTT, 커피를 묶은 2030 생활 카드입니다.",
    annualFee: 15000,
    previousSpend: 400000,
    advertisedBenefit: "생활영역 최대 10% 할인",
    monthlyCap: 32000,
    color: "from-yellow-300 to-avocado-700",
    bestFor: ["2030 생활형", "간편결제/OTT"],
    strengths: ["자주 쓰는 소비처 커버가 좋습니다.", "통신·OTT·커피를 함께 봅니다."],
    weaknesses: ["주유/교육 소비에는 약합니다."],
    specs: [
      ["shopping", "KB Pay", 0.1, 10000, "KB Pay 간편결제"],
      ["dining", "외식·편의점", 0.1, 8000, "외식점·편의점"],
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
    summary: "대중교통, 택시, 통신, 커피, 쇼핑 패키지를 고르는 생활 카드입니다.",
    annualFee: 10000,
    previousSpend: 300000,
    advertisedBenefit: "교통·통신 10% 할인",
    monthlyCap: 30000,
    color: "from-orange-200 to-avocado-700",
    bestFor: ["대중교통+커피형", "사회초년생"],
    strengths: ["교통·통신·커피 조합이 좋습니다.", "연회비 부담이 낮습니다."],
    weaknesses: ["고액 쇼핑 사용자는 한도가 작을 수 있습니다."],
    specs: [
      ["transport", "대중교통·택시", 0.1, 10000, "버스·지하철·택시"],
      ["telecom", "통신", 0.1, 5000, "이동통신 자동납부"],
      ["coffee", "커피 패키지", 0.3, 10000, "커피 라이프스타일 패키지"],
      ["shopping", "쇼핑 패키지", 0.07, 5000, "오픈마켓/소셜커머스"]
    ]
  },
  {
    slug: "samsung-the-1-skypass",
    name: "삼성 THE 1 스카이패스",
    issuer: "삼성",
    cardType: "credit",
    summary: "기프트 옵션과 스카이패스 마일리지 적립을 결합한 프리미엄 카드입니다.",
    annualFee: 200000,
    previousSpend: 500000,
    advertisedBenefit: "15만원 상당 기프트와 마일리지 적립",
    monthlyCap: 90000,
    color: "from-zinc-300 to-avocado-900",
    bestFor: ["프리미엄/마일리지형", "항공 이용자"],
    strengths: ["연간 기프트 가치가 큽니다.", "마일리지 적립 구조가 단순합니다."],
    weaknesses: ["연회비가 높아 기프트 사용 여부가 중요합니다."],
    specs: [
      ["travel", "기프트 환산", 0.2, 12500, "15만원 상당 기프트 월 환산"],
      ["etc", "기본 마일리지", 0.01, 40000, "국내외 기본 적립"],
      ["travel", "여행/해외 추가", 0.02, 35000, "여행·호텔·해외 추가 적립"]
    ]
  },
  {
    slug: "lotte-loca-365",
    name: "롯데 LOCA 365 카드",
    issuer: "롯데",
    cardType: "credit",
    summary: "관리비, 공과금, 통신, 교통, 배달 같은 반복 생활비를 항목별로 할인합니다.",
    annualFee: 20000,
    previousSpend: 500000,
    advertisedBenefit: "생활업종 매월 365일 할인",
    monthlyCap: 50000,
    color: "from-red-200 to-avocado-800",
    bestFor: ["고정비 관리형", "반복 생활비형"],
    strengths: ["생활비 항목이 넓습니다.", "고정비가 많을수록 안정적입니다."],
    weaknesses: ["항목별 한도가 작아 여러 항목을 써야 합니다."],
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
    issuer: "KB국민",
    cardType: "credit",
    summary: "쿠팡, 쿠팡이츠, 쿠팡플레이 이용자에게 쿠팡캐시 적립을 제공합니다.",
    annualFee: 20000,
    previousSpend: 0,
    advertisedBenefit: "쿠팡 이용 쿠팡캐시 적립",
    monthlyCap: 52000,
    color: "from-blue-200 to-avocado-800",
    bestFor: ["쿠팡 집중형", "온라인쇼핑+배달"],
    strengths: ["쿠팡 생태계에서는 체감이 큽니다.", "실적 부담이 낮습니다."],
    weaknesses: ["쿠팡 밖 범용 생활 할인은 약합니다."],
    specs: [
      ["shopping", "쿠팡 쇼핑", 0.04, 40000, "쿠팡 결제 쿠팡캐시 적립"],
      ["delivery", "쿠팡이츠", 0.04, 8000, "쿠팡이츠 적립"],
      ["ott", "쿠팡플레이 관련", 0.04, 4000, "쿠팡 관련 구독/콘텐츠"]
    ]
  },
  {
    slug: "hyundai-amex-gold-edition2",
    name: "현대 American Express Gold Edition2",
    issuer: "현대",
    cardType: "credit",
    summary: "바우처, MR 적립, 공항/호텔 혜택을 제공하는 프리미엄 카드입니다.",
    annualFee: 300000,
    previousSpend: 500000,
    advertisedBenefit: "25만원 바우처와 최대 3MR 적립",
    monthlyCap: 120000,
    color: "from-yellow-200 to-zinc-800",
    bestFor: ["프리미엄 바우처형", "해외/호텔/여행"],
    strengths: ["바우처 가치가 큽니다.", "여행·호텔 적립이 강합니다."],
    weaknesses: ["연회비가 매우 높아 바우처 사용률이 중요합니다."],
    specs: [
      ["travel", "바우처 환산", 0.2, 20833, "연 25만원 바우처 월 환산"],
      ["travel", "해외/호텔/항공", 0.03, 50000, "추가 MR 적립 영역"],
      ["etc", "기본 MR", 0.01, 30000, "국내외 기본 적립"],
      ["travel", "라운지/발레파킹", 0.02, 19167, "공항·호텔 부가혜택 환산"]
    ]
  },
  {
    slug: "kbank-one-check",
    name: "케이뱅크 ONE 체크카드",
    issuer: "BC",
    cardType: "check",
    summary: "교통과 선택형 캐시백을 결합한 체크카드입니다.",
    annualFee: 0,
    previousSpend: 0,
    advertisedBenefit: "선택형 캐시백과 교통 혜택",
    monthlyCap: 35000,
    color: "from-violet-200 to-avocado-800",
    bestFor: ["체크카드형", "교통/온라인"],
    strengths: ["연회비가 없습니다.", "교통과 온라인 소비에 맞습니다."],
    weaknesses: ["신용카드만큼 큰 한도는 어렵습니다."],
    specs: [
      ["transport", "교통 캐시백", 0.1, 3000, "대중교통 캐시백"],
      ["shopping", "온라인 캐시백", 0.01, 15000, "온라인 결제"],
      ["etc", "오프라인 캐시백", 0.005, 10000, "오프라인 결제"],
      ["etc", "보너스 캐시백", 0.02, 7000, "결제 패턴형 캐시백"]
    ]
  },
  {
    slug: "kb-youth-club-check",
    name: "KB Youth Club 체크카드",
    issuer: "KB국민",
    cardType: "check",
    summary: "OTT, 앱, 택시, 편의점, 배달 등 20대 생활 소비를 겨냥한 체크카드입니다.",
    annualFee: 0,
    previousSpend: 200000,
    advertisedBenefit: "20대 전용 생활 할인",
    monthlyCap: 20000,
    color: "from-pink-200 to-avocado-800",
    bestFor: ["20대 체크카드", "OTT/편의점/배달"],
    strengths: ["20대 주요 소비처에 집중되어 있습니다.", "연회비가 없습니다."],
    weaknesses: ["연령 조건과 선택형 조건을 확인해야 합니다."],
    specs: [
      ["ott", "OTT/멤버십", 0.5, 5000, "OTT 또는 멤버십"],
      ["shopping", "앱/패션", 0.3, 5000, "앱·패션 영역"],
      ["delivery", "배달", 0.2, 4000, "배달앱"],
      ["convenience", "편의점", 0.2, 3000, "편의점"],
      ["taxi", "택시/철도", 0.2, 3000, "택시·철도"]
    ]
  },
  {
    slug: "kb-nori2-kbpay-check",
    name: "KB국민 노리2 체크카드(KB Pay)",
    issuer: "KB국민",
    cardType: "check",
    summary: "KB Pay, 편의점, 커피, 교통, 콘텐츠 혜택을 담은 대표 체크카드입니다.",
    annualFee: 0,
    previousSpend: 200000,
    advertisedBenefit: "KB Pay와 생활영역 할인",
    monthlyCap: 25000,
    color: "from-yellow-200 to-avocado-800",
    bestFor: ["체크카드 입문", "KB Pay"],
    strengths: ["생활 필수 영역이 고르게 있습니다.", "연회비가 없습니다."],
    weaknesses: ["고액 소비자는 한도가 낮습니다."],
    specs: [
      ["shopping", "KB Pay", 0.02, 6000, "KB Pay 결제"],
      ["convenience", "편의점", 0.05, 4000, "편의점"],
      ["coffee", "커피", 0.05, 4000, "커피전문점"],
      ["transport", "대중교통", 0.1, 5000, "버스·지하철"],
      ["ott", "문화/모바일", 0.1, 6000, "콘텐츠·모바일"]
    ]
  },
  {
    slug: "shinhan-sol-travel-check",
    name: "신한카드 SOL트래블 체크",
    issuer: "신한",
    cardType: "check",
    summary: "해외 결제와 환전, 공항 라운지 등 여행 기능에 집중한 체크카드입니다.",
    annualFee: 0,
    previousSpend: 300000,
    advertisedBenefit: "해외 이용·환전 여행 혜택",
    monthlyCap: 40000,
    color: "from-sky-200 to-avocado-800",
    bestFor: ["여행 체크카드", "해외결제"],
    strengths: ["해외 결제에 적합합니다.", "연회비가 없습니다."],
    weaknesses: ["국내 생활 할인은 제한적입니다."],
    specs: [
      ["travel", "해외 수수료 절감", 0.02, 20000, "해외 결제 체감 혜택"],
      ["travel", "공항 라운지", 0.1, 10000, "라운지 환산 가치"],
      ["shopping", "국내 간편결제", 0.005, 5000, "국내 보조 혜택"],
      ["transport", "교통", 0.05, 5000, "국내 교통 보조 혜택"]
    ]
  },
  {
    slug: "naverpay-money-card",
    name: "네이버페이 머니카드",
    issuer: "네이버페이",
    cardType: "check",
    summary: "네이버페이 머니 기반 결제와 네이버 생태계 적립이 강한 카드입니다.",
    annualFee: 0,
    previousSpend: 0,
    advertisedBenefit: "네이버페이 포인트 적립",
    monthlyCap: 30000,
    color: "from-green-200 to-avocado-800",
    bestFor: ["네이버페이형", "온라인쇼핑형"],
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
    summary: "군 장병과 청년 생활 소비에 맞춘 체크카드입니다.",
    annualFee: 0,
    previousSpend: 0,
    advertisedBenefit: "군마트·쇼핑·편의점 할인",
    monthlyCap: 25000,
    color: "from-emerald-200 to-avocado-900",
    bestFor: ["군 장병/청년", "편의점/쇼핑"],
    strengths: ["연회비와 실적 부담이 낮습니다.", "생활 밀착 혜택이 있습니다."],
    weaknesses: ["일부 혜택은 대상자/기간 조건이 있을 수 있습니다."],
    specs: [
      ["mart", "군마트", 0.05, 7000, "군마트 할인"],
      ["shopping", "쿠팡/네이버", 0.03, 8000, "온라인 쇼핑"],
      ["convenience", "CU", 0.05, 5000, "편의점"],
      ["travel", "여행", 0.05, 5000, "프로모션형 여행 혜택"]
    ]
  },
  {
    slug: "kb-travelers-tosimi-check",
    name: "KB국민 트래블러스 체크카드(토심이)",
    issuer: "KB국민",
    cardType: "check",
    summary: "해외결제와 여행 편의 혜택을 담은 여행 체크카드입니다.",
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
    summary: "소비 타입에 따라 혜택을 고르는 우체국 체크카드입니다.",
    annualFee: 0,
    previousSpend: 300000,
    advertisedBenefit: "MY-TYPE 선택형 할인",
    monthlyCap: 25000,
    color: "from-orange-200 to-avocado-800",
    bestFor: ["선택형 체크", "생활비"],
    strengths: ["선택형 구조입니다.", "연회비가 없습니다."],
    weaknesses: ["선택 타입 관리가 필요합니다."],
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
    summary: "간편한 캐시백과 앱 기반 혜택 관리가 특징인 체크카드입니다.",
    annualFee: 0,
    previousSpend: 0,
    advertisedBenefit: "시즌별 캐시백",
    monthlyCap: 25000,
    color: "from-blue-200 to-avocado-800",
    bestFor: ["간편 체크", "소액 캐시백"],
    strengths: ["앱 관리가 쉽습니다.", "실적 부담이 낮습니다."],
    weaknesses: ["혜택은 시즌제로 바뀝니다."],
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
    summary: "모빌리티와 생활 결제를 함께 노리는 체크카드입니다.",
    annualFee: 0,
    previousSpend: 300000,
    advertisedBenefit: "모빌리티/생활 캐시백",
    monthlyCap: 22000,
    color: "from-indigo-200 to-avocado-800",
    bestFor: ["모빌리티", "교통/편의점"],
    strengths: ["이동 관련 소비와 맞습니다.", "연회비가 없습니다."],
    weaknesses: ["제휴처 중심이라 범용 혜택은 제한적입니다."],
    specs: [
      ["transport", "교통/모빌리티", 0.05, 8000, "대중교통·모빌리티"],
      ["taxi", "택시", 0.05, 5000, "택시/호출"],
      ["convenience", "편의점", 0.03, 4000, "편의점"],
      ["coffee", "커피", 0.03, 5000, "카페"]
    ]
  },
  {
    slug: "hana-travelogue-plus-credit",
    name: "하나 트래블로그+ 신용카드",
    issuer: "하나",
    cardType: "credit",
    summary: "해외 결제, 환전, 여행 관련 혜택을 신용카드 한 장에 묶은 여행 카드입니다.",
    annualFee: 20000,
    previousSpend: 300000,
    advertisedBenefit: "해외·여행 특화 혜택",
    monthlyCap: 45000,
    color: "from-cyan-200 to-avocado-800",
    bestFor: ["해외결제", "여행 준비"],
    strengths: ["여행 소비가 몰릴 때 효율이 납니다.", "국내 보조 혜택도 일부 있습니다."],
    weaknesses: ["일상 생활비만 쓰면 피킹률이 낮아집니다."],
    specs: [
      ["travel", "해외 결제", 0.03, 20000, "해외 가맹점/직구"],
      ["travel", "환전·여행", 0.02, 10000, "환전 및 여행 서비스 환산"],
      ["shopping", "국내 쇼핑", 0.005, 5000, "국내 쇼핑 보조"],
      ["dining", "외식", 0.05, 10000, "여행 전후 외식 혜택"]
    ]
  },
  {
    slug: "shinhan-discount-plan-plus",
    name: "신한카드 Discount Plan+",
    issuer: "신한",
    cardType: "credit",
    summary: "생활 업종별 할인보다 월 통합 할인 구조를 선호하는 사용자에게 맞는 카드입니다.",
    annualFee: 18000,
    previousSpend: 400000,
    advertisedBenefit: "생활 할인 플랜",
    monthlyCap: 40000,
    color: "from-teal-200 to-avocado-800",
    bestFor: ["균형 소비", "생활비+온라인"],
    strengths: ["혜택 영역이 비교적 넓습니다.", "통합 한도 관리가 쉽습니다."],
    weaknesses: ["특정 업종 몰빵 소비에는 특화 카드가 유리할 수 있습니다."],
    specs: [
      ["shopping", "온라인/간편결제", 0.07, 12000, "온라인·간편결제"],
      ["dining", "외식", 0.05, 8000, "외식 업종"],
      ["transport", "교통", 0.07, 6000, "대중교통"],
      ["telecom", "통신", 0.07, 7000, "이동통신 자동납부"],
      ["coffee", "커피", 0.07, 7000, "커피전문점"]
    ]
  },
  {
    slug: "hyundai-card-m",
    name: "현대카드 M",
    issuer: "현대",
    cardType: "credit",
    summary: "M포인트 적립을 기반으로 자동차, 쇼핑, 생활 영역 활용도가 높은 대표 카드입니다.",
    annualFee: 30000,
    previousSpend: 500000,
    advertisedBenefit: "M포인트 적립",
    monthlyCap: 45000,
    color: "from-slate-200 to-avocado-800",
    bestFor: ["포인트 적립형", "자동차/쇼핑"],
    strengths: ["포인트 사용처가 넓습니다.", "생활 전반에서 기본 적립이 됩니다."],
    weaknesses: ["현금성 할인보다 포인트 활용 계획이 필요합니다."],
    specs: [
      ["etc", "기본 M포인트", 0.01, 18000, "국내외 기본 적립"],
      ["fuel", "주유/차량", 0.03, 12000, "주유·차량 관련"],
      ["shopping", "쇼핑", 0.02, 10000, "온라인/오프라인 쇼핑"],
      ["dining", "외식", 0.02, 5000, "외식 업종"]
    ]
  },
  {
    slug: "woori-card-ui2",
    name: "우리 카드의정석2",
    issuer: "우리",
    cardType: "credit",
    summary: "일상 소비 전반의 적립과 할인 균형을 잡은 범용 카드입니다.",
    annualFee: 15000,
    previousSpend: 300000,
    advertisedBenefit: "생활 전반 할인/적립",
    monthlyCap: 33000,
    color: "from-blue-200 to-avocado-700",
    bestFor: ["범용 생활형", "첫 신용카드"],
    strengths: ["소비처가 넓어 쓰기 쉽습니다.", "연회비 부담이 낮습니다."],
    weaknesses: ["최상위 한도는 특화 카드보다 낮습니다."],
    specs: [
      ["shopping", "쇼핑", 0.05, 8000, "온라인/오프라인 쇼핑"],
      ["dining", "외식", 0.05, 7000, "외식"],
      ["transport", "교통", 0.05, 5000, "대중교통"],
      ["coffee", "커피", 0.05, 5000, "커피"],
      ["telecom", "통신", 0.05, 8000, "통신 자동납부"]
    ]
  },
  {
    slug: "samsung-id-simple",
    name: "삼성 iD SIMPLE 카드",
    issuer: "삼성",
    cardType: "credit",
    summary: "복잡한 업종 조건보다 기본 할인과 낮은 관리 부담을 앞세운 카드입니다.",
    annualFee: 7000,
    previousSpend: 0,
    advertisedBenefit: "조건 없는 기본 할인",
    monthlyCap: 30000,
    color: "from-stone-200 to-avocado-700",
    bestFor: ["단순 할인형", "조건 싫은 사용자"],
    strengths: ["실적 부담이 낮습니다.", "계산이 쉽습니다."],
    weaknesses: ["최대 혜택 규모는 크지 않습니다."],
    specs: [
      ["etc", "국내외 기본 할인", 0.007, 18000, "전 가맹점 기본 할인"],
      ["shopping", "온라인", 0.01, 5000, "온라인 결제 보조"],
      ["telecom", "정기결제", 0.01, 4000, "정기결제 보조"],
      ["coffee", "커피", 0.01, 3000, "생활 보조"]
    ]
  },
  {
    slug: "hyundai-zero-up",
    name: "현대카드 ZERO Up",
    issuer: "현대",
    cardType: "credit",
    summary: "전월실적 부담을 낮추고 기본 할인 체감에 집중한 범용 카드입니다.",
    annualFee: 10000,
    previousSpend: 0,
    advertisedBenefit: "조건 없는 할인",
    monthlyCap: 35000,
    color: "from-neutral-200 to-avocado-800",
    bestFor: ["조건 없는 할인", "소비처가 다양한 사용자"],
    strengths: ["실적을 채우려고 과소비할 필요가 적습니다.", "범용성이 좋습니다."],
    weaknesses: ["특정 업종 고율 할인은 약합니다."],
    specs: [
      ["etc", "기본 할인", 0.008, 20000, "전 가맹점 기본 할인"],
      ["shopping", "온라인", 0.01, 5000, "온라인 결제"],
      ["dining", "외식", 0.01, 5000, "외식"],
      ["transport", "교통", 0.01, 5000, "교통"]
    ]
  },
  {
    slug: "shinhan-deep-oil",
    name: "신한카드 Deep Oil",
    issuer: "신한",
    cardType: "credit",
    summary: "주유, 정비, 주차, 편의점까지 차량 유지비를 줄이는 주유 특화 카드입니다.",
    annualFee: 13000,
    previousSpend: 300000,
    advertisedBenefit: "주유 최대 10% 할인",
    monthlyCap: 45000,
    color: "from-amber-200 to-avocado-800",
    bestFor: ["주유 집중형", "차량 유지비"],
    strengths: ["주유 소비가 크면 피킹률이 올라갑니다.", "차량 관련 보조 혜택이 있습니다."],
    weaknesses: ["차량이 없으면 효율이 낮습니다."],
    specs: [
      ["fuel", "주유", 0.1, 30000, "선택 주유소/정유사"],
      ["etc", "차량 정비", 0.1, 5000, "정비/주차 보조"],
      ["convenience", "편의점", 0.05, 5000, "편의점"],
      ["coffee", "커피", 0.05, 5000, "커피전문점"]
    ]
  },
  {
    slug: "nh-allbarun-flex",
    name: "NH농협 올바른 FLEX 카드",
    issuer: "NH농협",
    cardType: "credit",
    summary: "커피, 스트리밍, 배달, 편의점 등 디지털 생활 소비에 맞춘 카드입니다.",
    annualFee: 12000,
    previousSpend: 300000,
    advertisedBenefit: "커피·스트리밍·배달 할인",
    monthlyCap: 35000,
    color: "from-lime-200 to-avocado-800",
    bestFor: ["디지털 생활형", "커피/OTT/배달"],
    strengths: ["젊은 생활 패턴과 잘 맞습니다.", "연회비 부담이 낮습니다."],
    weaknesses: ["마트·교육 소비에는 약합니다."],
    specs: [
      ["coffee", "커피", 0.5, 10000, "커피전문점"],
      ["ott", "스트리밍", 0.2, 7000, "OTT/구독"],
      ["delivery", "배달", 0.1, 8000, "배달앱"],
      ["convenience", "편의점", 0.05, 5000, "편의점"],
      ["transport", "교통", 0.07, 5000, "대중교통"]
    ]
  },
  {
    slug: "hana-jade-classic",
    name: "하나 JADE Classic",
    issuer: "하나",
    cardType: "credit",
    summary: "프리미엄 바우처와 여행·쇼핑 적립을 결합한 카드입니다.",
    annualFee: 120000,
    previousSpend: 500000,
    advertisedBenefit: "프리미엄 바우처와 적립",
    monthlyCap: 70000,
    color: "from-emerald-200 to-zinc-800",
    bestFor: ["프리미엄 혜택형", "여행/쇼핑"],
    strengths: ["바우처를 쓰면 연회비 부담이 줄어듭니다.", "여행 소비와 맞습니다."],
    weaknesses: ["바우처 미사용 시 피킹률이 낮습니다."],
    specs: [
      ["travel", "바우처 환산", 0.12, 10000, "연간 바우처 월 환산"],
      ["shopping", "쇼핑 적립", 0.02, 15000, "쇼핑 업종"],
      ["travel", "여행 적립", 0.03, 20000, "항공/호텔/면세"],
      ["dining", "다이닝", 0.02, 10000, "외식"],
      ["etc", "기본 적립", 0.01, 15000, "기본 가맹점"]
    ]
  },
  {
    slug: "woori-every-discount",
    name: "우리 EVERY DISCOUNT",
    issuer: "우리",
    cardType: "credit",
    summary: "전 가맹점 기본 할인과 생활영역 보조 할인을 함께 보는 카드입니다.",
    annualFee: 12000,
    previousSpend: 300000,
    advertisedBenefit: "모든 가맹점 할인",
    monthlyCap: 36000,
    color: "from-indigo-200 to-avocado-800",
    bestFor: ["범용 할인형", "생활비 분산형"],
    strengths: ["가맹점 제한이 적은 편입니다.", "생활 보조 할인이 있습니다."],
    weaknesses: ["특정 업종 최고 할인률은 낮습니다."],
    specs: [
      ["etc", "기본 할인", 0.008, 16000, "전 가맹점"],
      ["shopping", "온라인", 0.03, 7000, "온라인 쇼핑"],
      ["dining", "외식", 0.03, 5000, "외식"],
      ["telecom", "통신", 0.03, 4000, "통신"],
      ["transport", "교통", 0.03, 4000, "교통"]
    ]
  },
  {
    slug: "lotte-loca-likit-1-2",
    name: "롯데 LOCA LIKIT 1.2",
    issuer: "롯데",
    cardType: "credit",
    summary: "전월실적 부담 없이 국내외 기본 할인을 제공하는 단순 할인 카드입니다.",
    annualFee: 10000,
    previousSpend: 0,
    advertisedBenefit: "국내외 1.2% 할인",
    monthlyCap: 35000,
    color: "from-red-100 to-avocado-800",
    bestFor: ["조건 없는 할인", "소비처 분산형"],
    strengths: ["실적 조건이 낮아 관리가 쉽습니다.", "기본 할인 체감이 안정적입니다."],
    weaknesses: ["특정 카테고리 고율 할인은 없습니다."],
    specs: [
      ["etc", "국내외 기본 할인", 0.012, 25000, "국내외 가맹점"],
      ["shopping", "온라인", 0.012, 5000, "온라인 쇼핑"],
      ["travel", "해외", 0.012, 5000, "해외 결제"]
    ]
  },
  {
    slug: "woori-every-mile-skypass",
    name: "우리 카드의정석 EVERY MILE SKYPASS",
    issuer: "우리",
    cardType: "credit",
    summary: "스카이패스 마일리지를 생활 결제에서 꾸준히 쌓는 마일리지 카드입니다.",
    annualFee: 39000,
    previousSpend: 0,
    advertisedBenefit: "스카이패스 마일리지 적립",
    monthlyCap: 60000,
    color: "from-sky-200 to-avocado-900",
    bestFor: ["항공마일리지", "생활 결제 적립"],
    strengths: ["전반적 결제에서 마일리지를 쌓습니다.", "해외 사용과 맞습니다."],
    weaknesses: ["마일리지 사용 계획이 없으면 할인 체감이 낮습니다."],
    specs: [
      ["etc", "기본 마일리지", 0.01, 30000, "일반 가맹점"],
      ["travel", "해외/여행", 0.02, 15000, "해외/여행"],
      ["shopping", "쇼핑", 0.01, 10000, "쇼핑"],
      ["dining", "외식", 0.01, 5000, "외식"]
    ]
  },
  {
    slug: "shinhan-cheoeum-anniverse",
    name: "신한카드 처음(ANNIVERSE)",
    issuer: "신한",
    cardType: "credit",
    summary: "첫 신용카드 사용자에게 맞춘 생활/구독/간편결제 카드입니다.",
    annualFee: 15000,
    previousSpend: 300000,
    advertisedBenefit: "처음 쓰기 좋은 생활 혜택",
    monthlyCap: 32000,
    color: "from-purple-100 to-avocado-800",
    bestFor: ["첫 신용카드", "구독/간편결제"],
    strengths: ["생활 영역이 익숙합니다.", "연회비가 높지 않습니다."],
    weaknesses: ["고액 소비자는 한도에 빨리 닿습니다."],
    specs: [
      ["shopping", "간편결제", 0.05, 8000, "간편결제"],
      ["ott", "구독", 0.1, 6000, "OTT/구독"],
      ["coffee", "커피", 0.1, 5000, "커피"],
      ["transport", "교통", 0.05, 5000, "교통"],
      ["dining", "외식", 0.05, 8000, "외식"]
    ]
  },
  {
    slug: "samsung-taptap-digital",
    name: "삼성 taptap DIGITAL",
    issuer: "삼성",
    cardType: "credit",
    summary: "온라인쇼핑, 스트리밍, 간편결제 같은 디지털 소비에 맞춘 카드입니다.",
    annualFee: 10000,
    previousSpend: 300000,
    advertisedBenefit: "디지털 생활 할인",
    monthlyCap: 30000,
    color: "from-fuchsia-100 to-avocado-800",
    bestFor: ["온라인/OTT", "간편결제형"],
    strengths: ["디지털 소비 비중이 높으면 유리합니다.", "연회비가 낮습니다."],
    weaknesses: ["오프라인 생활비에는 약합니다."],
    specs: [
      ["shopping", "온라인쇼핑", 0.1, 10000, "온라인 쇼핑"],
      ["ott", "스트리밍", 0.1, 7000, "OTT/구독"],
      ["delivery", "배달", 0.05, 5000, "배달앱"],
      ["coffee", "커피", 0.05, 4000, "커피"],
      ["telecom", "통신", 0.05, 4000, "통신"]
    ]
  },
  {
    slug: "samsung-id-global",
    name: "삼성 iD GLOBAL 카드",
    issuer: "삼성",
    cardType: "credit",
    summary: "해외 결제와 여행 소비에 초점을 맞춘 글로벌 생활 카드입니다.",
    annualFee: 20000,
    previousSpend: 300000,
    advertisedBenefit: "해외·여행 할인",
    monthlyCap: 45000,
    color: "from-cyan-100 to-avocado-800",
    bestFor: ["해외결제", "여행/직구"],
    strengths: ["해외 결제 비중이 높으면 유리합니다.", "여행 전후 생활 혜택을 함께 봅니다."],
    weaknesses: ["국내 고정비 혜택은 생활카드보다 약합니다."],
    specs: [
      ["travel", "해외 결제", 0.03, 18000, "해외 가맹점/직구"],
      ["travel", "여행", 0.05, 10000, "항공/호텔/면세"],
      ["shopping", "온라인", 0.03, 7000, "온라인 쇼핑"],
      ["dining", "외식", 0.03, 5000, "외식"],
      ["coffee", "커피", 0.03, 5000, "커피"]
    ]
  },
  {
    slug: "kb-wesh-travel",
    name: "KB국민 WE:SH Travel",
    issuer: "KB국민",
    cardType: "credit",
    summary: "여행, 해외 결제, 공항 편의 혜택을 묶은 KB국민 여행 카드입니다.",
    annualFee: 25000,
    previousSpend: 400000,
    advertisedBenefit: "해외·여행 특화 할인",
    monthlyCap: 50000,
    color: "from-sky-100 to-avocado-800",
    bestFor: ["여행 준비", "해외결제"],
    strengths: ["여행 소비가 몰릴 때 체감이 좋습니다.", "해외 결제와 국내 보조 혜택을 함께 봅니다."],
    weaknesses: ["일상 생활비만 쓰면 한도 활용이 낮습니다."],
    specs: [
      ["travel", "해외/여행", 0.03, 20000, "해외·항공·호텔"],
      ["shopping", "면세/쇼핑", 0.05, 10000, "면세·온라인"],
      ["transport", "공항/교통", 0.05, 7000, "공항교통/대중교통"],
      ["dining", "다이닝", 0.05, 8000, "국내외 외식"],
      ["coffee", "카페", 0.05, 5000, "카페"]
    ]
  },
  {
    slug: "shinhan-marriott-bonvoy-best",
    name: "메리어트 본보이 더 베스트 신한카드",
    issuer: "신한",
    cardType: "credit",
    summary: "메리어트 숙박과 항공 마일 전환을 중시하는 프리미엄 여행 카드입니다.",
    annualFee: 267000,
    previousSpend: 500000,
    advertisedBenefit: "메리어트 포인트와 숙박권",
    monthlyCap: 100000,
    color: "from-stone-200 to-zinc-800",
    bestFor: ["호텔 멤버십", "프리미엄 여행"],
    strengths: ["숙박권을 쓰면 체감 가치가 큽니다.", "호텔 포인트 활용도가 높습니다."],
    weaknesses: ["호텔 이용이 적으면 연회비 부담이 큽니다."],
    specs: [
      ["travel", "숙박권 환산", 0.18, 25000, "연간 숙박권 월 환산"],
      ["travel", "메리어트 적립", 0.04, 35000, "메리어트 계열"],
      ["travel", "항공/여행", 0.02, 15000, "항공·여행"],
      ["dining", "다이닝", 0.02, 10000, "외식"],
      ["etc", "기본 적립", 0.01, 15000, "일반 가맹점"]
    ]
  },
  {
    slug: "shinhan-the-classic-s",
    name: "신한카드 The CLASSIC-S",
    issuer: "신한",
    cardType: "credit",
    summary: "기프트, 라운지, 여행 적립을 제공하는 신한 프리미엄 카드입니다.",
    annualFee: 125000,
    previousSpend: 500000,
    advertisedBenefit: "프리미엄 기프트와 여행 혜택",
    monthlyCap: 75000,
    color: "from-zinc-200 to-avocado-900",
    bestFor: ["프리미엄 입문", "여행/기프트"],
    strengths: ["기프트 사용 시 연회비 부담이 낮아집니다.", "여행 보조 혜택이 있습니다."],
    weaknesses: ["기프트를 쓰지 않으면 효율이 낮습니다."],
    specs: [
      ["travel", "기프트 환산", 0.12, 10000, "연간 기프트 월 환산"],
      ["travel", "라운지/여행", 0.05, 15000, "공항/여행"],
      ["shopping", "쇼핑", 0.02, 12000, "쇼핑"],
      ["dining", "다이닝", 0.02, 10000, "외식"],
      ["etc", "기본 적립", 0.01, 15000, "일반 가맹점"]
    ]
  },
  {
    slug: "nh-classy-travel",
    name: "NH농협 클래시 트래블카드",
    issuer: "NH농협",
    cardType: "credit",
    summary: "해외 결제와 여행 관련 혜택을 중심으로 한 NH농협 여행 카드입니다.",
    annualFee: 30000,
    previousSpend: 300000,
    advertisedBenefit: "해외·여행 캐시백",
    monthlyCap: 45000,
    color: "from-green-100 to-avocado-800",
    bestFor: ["여행", "해외결제"],
    strengths: ["여행 소비에 맞춰 한도가 구성되어 있습니다.", "연회비가 프리미엄 카드보다 낮습니다."],
    weaknesses: ["국내 생활비 절감은 제한적입니다."],
    specs: [
      ["travel", "해외 결제", 0.03, 18000, "해외 가맹점"],
      ["travel", "항공/호텔", 0.04, 12000, "항공·호텔"],
      ["shopping", "면세/온라인", 0.03, 7000, "면세·온라인"],
      ["transport", "교통", 0.05, 4000, "교통"],
      ["coffee", "카페", 0.05, 4000, "카페"]
    ]
  },
  {
    slug: "hyundai-card-t",
    name: "현대카드T",
    issuer: "현대",
    cardType: "credit",
    summary: "국내 기본 할인과 해외 할인, 해외 수수료 면제 성격의 혜택을 앞세운 여행 카드입니다.",
    annualFee: 20000,
    previousSpend: 0,
    advertisedBenefit: "국내 0.7%, 해외 2% 할인",
    monthlyCap: 50000,
    color: "from-blue-100 to-avocado-800",
    bestFor: ["조건 없는 여행카드", "해외결제"],
    strengths: ["전월실적 부담이 낮습니다.", "해외 결제에 단순하게 적용됩니다."],
    weaknesses: ["국내 고율 카테고리 혜택은 약합니다."],
    specs: [
      ["etc", "국내 기본", 0.007, 18000, "국내 가맹점"],
      ["travel", "해외 결제", 0.02, 25000, "해외 가맹점"],
      ["shopping", "온라인/직구", 0.02, 7000, "온라인 직구"]
    ]
  },
  {
    slug: "samsung-the-id-first",
    name: "삼성 THE iD. 1st",
    issuer: "삼성",
    cardType: "credit",
    summary: "바우처와 프리미엄 생활 혜택을 결합한 삼성 프리미엄 카드입니다.",
    annualFee: 200000,
    previousSpend: 500000,
    advertisedBenefit: "프리미엄 바우처와 생활 혜택",
    monthlyCap: 95000,
    color: "from-neutral-100 to-zinc-900",
    bestFor: ["프리미엄 생활형", "바우처 활용"],
    strengths: ["바우처를 쓰면 체감 연회비가 낮아집니다.", "생활/여행 혜택이 함께 있습니다."],
    weaknesses: ["프리미엄 혜택 사용 계획이 필요합니다."],
    specs: [
      ["travel", "바우처 환산", 0.15, 16667, "연간 바우처 월 환산"],
      ["shopping", "쇼핑", 0.03, 20000, "쇼핑"],
      ["dining", "다이닝", 0.03, 15000, "외식"],
      ["travel", "여행", 0.03, 20000, "여행/호텔"],
      ["etc", "기본 적립", 0.01, 20000, "일반 가맹점"]
    ]
  },
  {
    slug: "hyundai-card-summit",
    name: "현대카드 Summit",
    issuer: "현대",
    cardType: "credit",
    summary: "바우처, 프리미엄 포인트, 여행 편의 혜택을 제공하는 현대 프리미엄 카드입니다.",
    annualFee: 300000,
    previousSpend: 500000,
    advertisedBenefit: "프리미엄 바우처와 포인트 적립",
    monthlyCap: 120000,
    color: "from-zinc-100 to-avocado-900",
    bestFor: ["고연회비 프리미엄", "바우처/여행"],
    strengths: ["바우처와 여행 혜택 가치가 큽니다.", "고액 소비자에게 적합합니다."],
    weaknesses: ["연회비가 높아 혜택 사용률이 핵심입니다."],
    specs: [
      ["travel", "바우처 환산", 0.18, 25000, "연간 바우처 월 환산"],
      ["travel", "여행/호텔", 0.04, 30000, "여행·호텔"],
      ["shopping", "쇼핑", 0.03, 20000, "쇼핑"],
      ["dining", "다이닝", 0.03, 15000, "외식"],
      ["etc", "기본 적립", 0.01, 30000, "일반 가맹점"]
    ]
  },
  {
    slug: "hyundai-koreanair-300",
    name: "현대카드 대한항공카드 300",
    issuer: "현대",
    cardType: "credit",
    summary: "대한항공 마일리지와 항공/여행 혜택을 결합한 프리미엄 항공 카드입니다.",
    annualFee: 300000,
    previousSpend: 500000,
    advertisedBenefit: "대한항공 마일리지와 바우처",
    monthlyCap: 110000,
    color: "from-sky-100 to-zinc-900",
    bestFor: ["대한항공 마일리지", "항공 이용자"],
    strengths: ["항공 마일리지 활용도가 높으면 유리합니다.", "여행 혜택과 함께 볼 수 있습니다."],
    weaknesses: ["마일리지 사용 계획이 없으면 체감이 낮습니다."],
    specs: [
      ["travel", "항공 바우처 환산", 0.15, 20000, "항공/여행 바우처 월 환산"],
      ["travel", "대한항공 마일리지", 0.03, 40000, "항공/여행 적립"],
      ["etc", "기본 마일리지", 0.01, 30000, "일반 가맹점"],
      ["shopping", "면세/쇼핑", 0.02, 10000, "면세/쇼핑"],
      ["dining", "외식", 0.02, 10000, "외식"]
    ]
  },
  {
    slug: "kb-goodday-ollim",
    name: "KB국민 굿데이올림카드",
    issuer: "KB국민",
    cardType: "credit",
    summary: "주유, 통신, 마트, 교육, 외식 등 생활비 전반을 할인하는 스테디셀러 카드입니다.",
    annualFee: 20000,
    previousSpend: 300000,
    advertisedBenefit: "생활비 업종 할인",
    monthlyCap: 45000,
    color: "from-yellow-100 to-avocado-800",
    bestFor: ["주유+생활비", "가족 생활비"],
    strengths: ["생활비 항목이 넓습니다.", "주유와 고정비를 함께 줄일 수 있습니다."],
    weaknesses: ["항목별 한도를 분산해서 써야 합니다."],
    specs: [
      ["fuel", "주유", 0.1, 15000, "주유소"],
      ["telecom", "통신", 0.1, 7000, "이동통신"],
      ["mart", "마트", 0.1, 8000, "마트"],
      ["education", "교육", 0.1, 7000, "학원/교육"],
      ["dining", "외식", 0.1, 8000, "외식"]
    ]
  },
  {
    slug: "mg-better-check",
    name: "MG새마을금고 더나은 체크카드",
    issuer: "BC",
    cardType: "check",
    summary: "편의점, 카페, 간편결제 등 생활 밀착 캐시백을 제공하는 체크카드입니다.",
    annualFee: 0,
    previousSpend: 200000,
    advertisedBenefit: "생활 캐시백",
    monthlyCap: 22000,
    color: "from-emerald-100 to-avocado-800",
    bestFor: ["생활 체크카드", "편의점/카페"],
    strengths: ["연회비가 없습니다.", "소액 생활 소비와 맞습니다."],
    weaknesses: ["신용카드 대비 한도는 낮습니다."],
    specs: [
      ["convenience", "편의점", 0.05, 5000, "편의점"],
      ["coffee", "카페", 0.05, 5000, "카페"],
      ["shopping", "간편결제", 0.03, 6000, "간편결제"],
      ["transport", "교통", 0.05, 3000, "대중교통"],
      ["delivery", "배달", 0.03, 3000, "배달앱"]
    ]
  },
  {
    slug: "naverpay-money-hana-check",
    name: "네이버페이 머니 하나 체크카드",
    issuer: "하나",
    cardType: "check",
    summary: "네이버페이 머니 하나통장과 연결해 온라인 적립 체감을 높이는 체크카드입니다.",
    annualFee: 0,
    previousSpend: 0,
    advertisedBenefit: "네이버페이 최대 적립",
    monthlyCap: 30000,
    color: "from-green-100 to-avocado-800",
    bestFor: ["네이버페이", "온라인쇼핑"],
    strengths: ["실적 부담이 낮습니다.", "네이버 생태계에서 쓰기 좋습니다."],
    weaknesses: ["오프라인 생활비 특화 혜택은 약합니다."],
    specs: [
      ["shopping", "네이버페이", 0.03, 20000, "네이버페이/네이버쇼핑"],
      ["shopping", "온라인", 0.01, 7000, "온라인 결제"],
      ["convenience", "편의점", 0.01, 3000, "편의점"]
    ]
  },
  {
    slug: "shinhan-deep-dream",
    name: "신한카드 Deep Dream",
    issuer: "신한",
    cardType: "credit",
    summary: "전월실적 부담이 낮고 생활 전반 적립을 제공하는 신한 대표 포인트 카드입니다.",
    annualFee: 10000,
    previousSpend: 0,
    advertisedBenefit: "생활 전반 포인트 적립",
    monthlyCap: 40000,
    color: "from-blue-100 to-avocado-800",
    bestFor: ["범용 적립", "실적 부담 낮은 카드"],
    strengths: ["관리 부담이 낮습니다.", "소비처가 넓은 사용자에게 안정적입니다."],
    weaknesses: ["특정 업종 고율 할인은 약합니다."],
    specs: [
      ["etc", "기본 적립", 0.007, 18000, "전 가맹점"],
      ["shopping", "쇼핑", 0.02, 8000, "쇼핑"],
      ["dining", "외식", 0.02, 6000, "외식"],
      ["coffee", "카페", 0.02, 4000, "카페"],
      ["transport", "교통", 0.02, 4000, "교통"]
    ]
  },
  {
    slug: "kb-tantan-all-shopping",
    name: "KB국민 탄탄대로 올쇼핑 티타늄카드",
    issuer: "KB국민",
    cardType: "credit",
    summary: "온라인쇼핑, 마트, 통신, 관리비까지 쇼핑·생활비를 함께 보는 카드입니다.",
    annualFee: 30000,
    previousSpend: 400000,
    advertisedBenefit: "쇼핑·생활비 할인",
    monthlyCap: 55000,
    color: "from-yellow-100 to-avocado-900",
    bestFor: ["쇼핑+관리비", "가족 생활비"],
    strengths: ["쇼핑과 고정비를 함께 줄입니다.", "월 한도 구성이 넓습니다."],
    weaknesses: ["티타늄 카드라 연회비가 다소 높습니다."],
    specs: [
      ["shopping", "온라인쇼핑", 0.1, 15000, "온라인쇼핑"],
      ["mart", "마트", 0.1, 10000, "마트"],
      ["telecom", "통신", 0.1, 8000, "통신"],
      ["etc", "관리비", 0.1, 7000, "아파트관리비"],
      ["coffee", "카페", 0.1, 5000, "카페"]
    ]
  },
  {
    slug: "woori-da-card",
    name: "우리 DA@카드의정석",
    issuer: "우리",
    cardType: "credit",
    summary: "조건을 줄이고 국내외 기본 할인과 생활 영역 할인을 함께 제공하는 우리카드입니다.",
    annualFee: 10000,
    previousSpend: 0,
    advertisedBenefit: "국내외 기본 할인",
    monthlyCap: 35000,
    color: "from-blue-100 to-avocado-800",
    bestFor: ["기본 할인", "조건 부담 낮은 카드"],
    strengths: ["실적 부담이 낮습니다.", "국내외 결제에 두루 적용됩니다."],
    weaknesses: ["고율 업종 한도는 크지 않습니다."],
    specs: [
      ["etc", "기본 할인", 0.008, 20000, "전 가맹점"],
      ["shopping", "온라인", 0.01, 5000, "온라인"],
      ["travel", "해외", 0.01, 5000, "해외"],
      ["coffee", "커피", 0.01, 5000, "커피"]
    ]
  },
  {
    slug: "hana-any-plus",
    name: "하나 Any PLUS 카드",
    issuer: "하나",
    cardType: "credit",
    summary: "전 가맹점 기본 할인과 온라인/해외 보조 혜택을 제공하는 범용 카드입니다.",
    annualFee: 15000,
    previousSpend: 0,
    advertisedBenefit: "어디서나 기본 할인",
    monthlyCap: 36000,
    color: "from-emerald-100 to-avocado-800",
    bestFor: ["범용 할인", "조건 적은 카드"],
    strengths: ["쓰기 쉽고 관리 부담이 낮습니다.", "온라인과 해외도 보조합니다."],
    weaknesses: ["특화 할인카드 대비 폭발력은 낮습니다."],
    specs: [
      ["etc", "기본 할인", 0.007, 18000, "전 가맹점"],
      ["shopping", "온라인", 0.01, 7000, "온라인 쇼핑"],
      ["travel", "해외", 0.012, 7000, "해외 결제"],
      ["dining", "외식", 0.01, 4000, "외식"]
    ]
  },
  {
    slug: "samsung-id-on",
    name: "삼성 iD ON 카드",
    issuer: "삼성",
    cardType: "credit",
    summary: "많이 쓰는 영역을 중심으로 자동 맞춤 할인을 제공하는 생활 카드입니다.",
    annualFee: 20000,
    previousSpend: 300000,
    advertisedBenefit: "많이 쓰는 영역 자동 할인",
    monthlyCap: 42000,
    color: "from-lime-100 to-avocado-800",
    bestFor: ["자동 맞춤 할인", "생활비"],
    strengths: ["소비패턴에 따라 주요 영역이 잡힙니다.", "생활 영역 커버가 넓습니다."],
    weaknesses: ["자동 선택 기준을 이해해야 합니다."],
    specs: [
      ["shopping", "많이 쓰는 영역", 0.1, 12000, "쇼핑/온라인"],
      ["dining", "외식", 0.1, 8000, "외식"],
      ["coffee", "커피", 0.1, 5000, "커피"],
      ["transport", "교통", 0.1, 7000, "대중교통"],
      ["telecom", "통신", 0.1, 10000, "통신"]
    ]
  }
];

export const cards: CreditCard[] = seeds.map(card);
