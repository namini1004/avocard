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

function toDisplayBenefits(rules: BenefitRule[]): CardBenefit[] {
  return rules.map((rule) => ({
    category: rule.category,
    label: rule.label,
    rate: rule.rate ?? 0,
    monthlyCap: rule.monthlyCap,
    note: rule.note
  }));
}

const issuerProductListUrls: Record<string, string> = {
  신한: "https://www.shinhancard.com",
  삼성: "https://www.samsungcard.com/personal/card/UHPPCA0340M0.jsp",
  현대: "https://www.hyundaicard.com/cpc/cr/CPCCR0201_01.hc",
  국민: "https://card.kbcard.com/CXPRICAC0031.cms",
  롯데: "https://m.lottecard.co.kr/app/LPCDANA_V110.lc",
  우리: "https://pc.wooricard.com",
  하나: "https://www.hanacard.co.kr",
  BC: "https://www.bccard.com/app/card/ContentsLinkActn.do?pgm_id=ind1020",
  NH농협: "https://card.nonghyup.com",
  IBK기업: "https://www.ibk.co.kr"
};

function issuerSource(issuer: string, slug: string): CardSource[] {
  const productListUrl = issuerProductListUrls[issuer] ?? "https://www.crefia.or.kr";

  return [
    {
      type: "issuer_page",
      title: `${issuer} 공식 상품 목록`,
      url: productListUrl,
      capturedAt: "2026-06-08"
    },
    {
      type: "public_disclosure",
      title: "여신금융협회 상품공시실",
      url: "https://www.crefia.or.kr",
      capturedAt: "2026-06-08"
    }
  ];
}

const freshLifeRules: BenefitRule[] = [
  {
    id: "fresh-life-coffee",
    category: "coffee",
    label: "커피",
    merchantScope: ["스타벅스", "투썸플레이스", "이디야"],
    rewardType: "discount",
    rate: 0.1,
    monthlyCap: 8000,
    previousMonthSpendRequired: 500000,
    performanceBand: "50만원 이상",
    excludedItems: ["상품권 구매", "선불카드 충전"],
    sourceRef: "issuer_page",
    note: "스타벅스, 투썸, 이디야"
  },
  {
    id: "fresh-life-delivery",
    category: "delivery",
    label: "배달",
    merchantScope: ["배달의민족", "쿠팡이츠", "요기요"],
    rewardType: "discount",
    rate: 0.08,
    monthlyCap: 10000,
    previousMonthSpendRequired: 500000,
    performanceBand: "50만원 이상",
    excludedItems: ["상품권", "포인트 충전"],
    sourceRef: "issuer_page",
    note: "배달앱 통합"
  },
  {
    id: "fresh-life-transport",
    category: "transport",
    label: "대중교통",
    merchantScope: ["버스", "지하철"],
    rewardType: "discount",
    rate: 0.07,
    monthlyCap: 7000,
    previousMonthSpendRequired: 500000,
    performanceBand: "50만원 이상",
    excludedItems: ["시외버스", "고속버스"],
    sourceRef: "issuer_pdf",
    note: "버스/지하철"
  },
  {
    id: "fresh-life-convenience",
    category: "convenience",
    label: "편의점",
    merchantScope: ["CU", "GS25", "세븐일레븐"],
    rewardType: "discount",
    rate: 0.05,
    monthlyCap: 5000,
    previousMonthSpendRequired: 500000,
    performanceBand: "50만원 이상",
    excludedItems: ["담배", "서비스 상품"],
    sourceRef: "issuer_pdf",
    note: "CU/GS25/세븐일레븐"
  }
];

const commutePlusRules: BenefitRule[] = [
  {
    id: "commute-plus-transport",
    category: "transport",
    label: "대중교통",
    merchantScope: ["버스", "지하철"],
    rewardType: "discount",
    rate: 0.12,
    monthlyCap: 10000,
    previousMonthSpendRequired: 400000,
    performanceBand: "40만원 이상",
    excludedItems: ["시외버스", "공항버스"],
    sourceRef: "issuer_page",
    note: "버스/지하철"
  },
  {
    id: "commute-plus-taxi",
    category: "taxi",
    label: "택시",
    merchantScope: ["카카오T", "일반택시"],
    rewardType: "discount",
    rate: 0.08,
    monthlyCap: 6000,
    previousMonthSpendRequired: 400000,
    performanceBand: "40만원 이상",
    excludedItems: ["현장 현금 결제"],
    sourceRef: "issuer_page",
    note: "카카오T 포함"
  },
  {
    id: "commute-plus-coffee",
    category: "coffee",
    label: "커피",
    merchantScope: ["주요 커피전문점"],
    rewardType: "discount",
    rate: 0.05,
    monthlyCap: 4000,
    previousMonthSpendRequired: 400000,
    performanceBand: "40만원 이상",
    excludedItems: ["상품권"],
    sourceRef: "issuer_pdf",
    note: "주요 커피전문점"
  },
  {
    id: "commute-plus-telecom",
    category: "telecom",
    label: "통신",
    merchantScope: ["SKT", "KT", "LG U+"],
    rewardType: "discount",
    rate: 0.05,
    monthlyCap: 4000,
    previousMonthSpendRequired: 400000,
    performanceBand: "40만원 이상",
    excludedItems: ["알뜰폰 일부"],
    sourceRef: "issuer_pdf",
    note: "자동이체"
  }
];

const oilSignalRules: BenefitRule[] = [
  {
    id: "oil-signal-fuel",
    category: "fuel",
    label: "주유",
    merchantScope: ["SK에너지", "GS칼텍스", "S-OIL", "현대오일뱅크"],
    rewardType: "discount",
    rate: 0.09,
    monthlyCap: 18000,
    previousMonthSpendRequired: 700000,
    performanceBand: "70만원 이상",
    excludedItems: ["LPG 충전소 일부", "상품권"],
    sourceRef: "issuer_page",
    note: "정유 4사"
  },
  {
    id: "oil-signal-telecom",
    category: "telecom",
    label: "통신",
    merchantScope: ["SKT", "KT", "LG U+"],
    rewardType: "discount",
    rate: 0.08,
    monthlyCap: 10000,
    previousMonthSpendRequired: 700000,
    performanceBand: "70만원 이상",
    excludedItems: ["결합상품 일부"],
    sourceRef: "issuer_pdf",
    note: "휴대폰 요금 자동납부"
  },
  {
    id: "oil-signal-mart",
    category: "mart",
    label: "마트",
    merchantScope: ["이마트", "롯데마트", "홈플러스"],
    rewardType: "discount",
    rate: 0.05,
    monthlyCap: 8000,
    previousMonthSpendRequired: 700000,
    performanceBand: "70만원 이상",
    excludedItems: ["임대매장", "온라인몰 일부"],
    sourceRef: "issuer_pdf",
    note: "이마트/롯데마트/홈플러스"
  },
  {
    id: "oil-signal-coffee",
    category: "coffee",
    label: "커피",
    merchantScope: ["주요 커피전문점"],
    rewardType: "discount",
    rate: 0.05,
    monthlyCap: 6000,
    previousMonthSpendRequired: 700000,
    performanceBand: "70만원 이상",
    excludedItems: ["상품권"],
    sourceRef: "issuer_pdf",
    note: "월 6천원 한도"
  }
];

const basketSmartRules: BenefitRule[] = [
  {
    id: "basket-smart-shopping",
    category: "shopping",
    label: "온라인쇼핑",
    merchantScope: ["쿠팡", "네이버쇼핑", "무신사"],
    rewardType: "discount",
    rate: 0.1,
    monthlyCap: 12000,
    previousMonthSpendRequired: 600000,
    performanceBand: "60만원 이상",
    excludedItems: ["상품권", "선불전자지급수단 충전"],
    sourceRef: "issuer_page",
    note: "쿠팡/네이버/무신사"
  },
  {
    id: "basket-smart-mart",
    category: "mart",
    label: "마트",
    merchantScope: ["대형마트", "창고형마트"],
    rewardType: "discount",
    rate: 0.08,
    monthlyCap: 10000,
    previousMonthSpendRequired: 600000,
    performanceBand: "60만원 이상",
    excludedItems: ["임대매장", "문화센터"],
    sourceRef: "issuer_pdf",
    note: "대형마트/창고형마트"
  },
  {
    id: "basket-smart-delivery",
    category: "delivery",
    label: "배달",
    merchantScope: ["배달의민족", "쿠팡이츠", "요기요"],
    rewardType: "discount",
    rate: 0.07,
    monthlyCap: 8000,
    previousMonthSpendRequired: 600000,
    performanceBand: "60만원 이상",
    excludedItems: ["포인트 충전"],
    sourceRef: "issuer_pdf",
    note: "배민/쿠팡이츠/요기요"
  },
  {
    id: "basket-smart-convenience",
    category: "convenience",
    label: "편의점",
    merchantScope: ["편의점 통합"],
    rewardType: "discount",
    rate: 0.05,
    monthlyCap: 6000,
    previousMonthSpendRequired: 600000,
    performanceBand: "60만원 이상",
    excludedItems: ["담배", "교통카드 충전"],
    sourceRef: "issuer_pdf",
    note: "편의점 통합"
  }
];

const streamingSeedRules: BenefitRule[] = [
  {
    id: "streaming-seed-ott",
    category: "ott",
    label: "OTT/구독",
    merchantScope: ["넷플릭스", "티빙", "유튜브 프리미엄"],
    rewardType: "discount",
    rate: 0.2,
    monthlyCap: 7000,
    previousMonthSpendRequired: 300000,
    performanceBand: "30만원 이상",
    excludedItems: ["앱스토어 인앱결제 일부"],
    sourceRef: "issuer_page",
    note: "넷플릭스/티빙/유튜브"
  },
  {
    id: "streaming-seed-telecom",
    category: "telecom",
    label: "통신",
    merchantScope: ["SKT", "KT", "LG U+"],
    rewardType: "discount",
    rate: 0.07,
    monthlyCap: 5000,
    previousMonthSpendRequired: 300000,
    performanceBand: "30만원 이상",
    excludedItems: ["알뜰폰 일부"],
    sourceRef: "issuer_pdf",
    note: "휴대폰 자동납부"
  },
  {
    id: "streaming-seed-coffee",
    category: "coffee",
    label: "커피",
    merchantScope: ["주요 커피전문점"],
    rewardType: "discount",
    rate: 0.08,
    monthlyCap: 4000,
    previousMonthSpendRequired: 300000,
    performanceBand: "30만원 이상",
    excludedItems: ["상품권"],
    sourceRef: "issuer_pdf",
    note: "주요 브랜드"
  },
  {
    id: "streaming-seed-convenience",
    category: "convenience",
    label: "편의점",
    merchantScope: ["편의점 통합"],
    rewardType: "discount",
    rate: 0.04,
    monthlyCap: 2000,
    previousMonthSpendRequired: 300000,
    performanceBand: "30만원 이상",
    excludedItems: ["담배"],
    sourceRef: "issuer_pdf",
    note: "편의점 통합"
  }
];

const familyGroundRules: BenefitRule[] = [
  {
    id: "family-ground-mart",
    category: "mart",
    label: "마트",
    merchantScope: ["대형마트", "SSM"],
    rewardType: "discount",
    rate: 0.08,
    monthlyCap: 15000,
    previousMonthSpendRequired: 900000,
    performanceBand: "90만원 이상",
    excludedItems: ["임대매장", "상품권"],
    sourceRef: "issuer_page",
    note: "대형마트/SSM"
  },
  {
    id: "family-ground-medical",
    category: "medical",
    label: "병원/약국",
    merchantScope: ["병의원", "약국"],
    rewardType: "discount",
    rate: 0.07,
    monthlyCap: 12000,
    previousMonthSpendRequired: 900000,
    performanceBand: "90만원 이상",
    excludedItems: ["동물병원", "건강식품"],
    sourceRef: "issuer_pdf",
    note: "병의원/약국"
  },
  {
    id: "family-ground-education",
    category: "education",
    label: "교육",
    merchantScope: ["학원", "서점"],
    rewardType: "discount",
    rate: 0.06,
    monthlyCap: 15000,
    previousMonthSpendRequired: 900000,
    performanceBand: "90만원 이상",
    excludedItems: ["대학등록금"],
    sourceRef: "issuer_pdf",
    note: "학원/서점"
  },
  {
    id: "family-ground-telecom",
    category: "telecom",
    label: "통신",
    merchantScope: ["SKT", "KT", "LG U+"],
    rewardType: "discount",
    rate: 0.06,
    monthlyCap: 10000,
    previousMonthSpendRequired: 900000,
    performanceBand: "90만원 이상",
    excludedItems: ["알뜰폰 일부"],
    sourceRef: "issuer_pdf",
    note: "가족 통신비"
  }
];

export const cards: CreditCard[] = [
  {
    slug: "fresh-life",
    name: "프레시 라이프 카드",
    issuer: "신한",
    cardType: "credit",
    status: "active",
    reviewStatus: "draft",
    summary: "커피, 배달, 대중교통 비중이 높은 생활밀착형 소비자에게 강한 카드",
    annualFee: 15000,
    previousSpend: 500000,
    advertisedBenefit: "생활 영역 최대 10% 할인",
    monthlyCap: 30000,
    excluded: ["상품권", "아파트관리비", "국세/지방세", "선불카드 충전"],
    benefitRules: freshLifeRules,
    benefits: toDisplayBenefits(freshLifeRules),
    sourceUrls: issuerSource("신한", "fresh-life"),
    lastVerifiedAt: "2026-06-08",
    color: "from-avocado-400 to-avocado-700",
    bestFor: ["커피 + 대중교통형", "배달 빈도 높은 1인 가구"],
    cautions: ["월 생활영역 한도가 낮아 고액 소비자에게는 피킹률이 빨리 꺾입니다."],
    strengths: ["생활 카테고리 구성이 선명합니다.", "월 50만~80만원 소비 구간에서 효율이 좋습니다."],
    weaknesses: ["주유, 마트 혜택은 약합니다.", "통신비 자동이체 혜택이 없습니다."]
  },
  {
    slug: "commute-plus",
    name: "출근길 플러스 카드",
    issuer: "국민",
    cardType: "credit",
    status: "active",
    reviewStatus: "draft",
    summary: "대중교통과 택시 이동이 잦은 직장인에게 유리한 이동 특화 카드",
    annualFee: 12000,
    previousSpend: 400000,
    advertisedBenefit: "교통비 최대 15% 할인",
    monthlyCap: 24000,
    excluded: ["무이자할부", "보험료", "공과금", "대학등록금"],
    benefitRules: commutePlusRules,
    benefits: toDisplayBenefits(commutePlusRules),
    sourceUrls: issuerSource("국민", "commute-plus"),
    lastVerifiedAt: "2026-06-08",
    color: "from-lime-300 to-emerald-700",
    bestFor: ["대중교통 + 택시형", "출퇴근 고정비 최적화"],
    cautions: ["택시 혜택은 월 한도가 작아 자주 타면 초과분 효율이 낮습니다."],
    strengths: ["전월실적 기준이 낮습니다.", "교통비 할인율이 실제로 높은 편입니다."],
    weaknesses: ["배달/온라인쇼핑 혜택이 없습니다.", "월 총 할인한도는 보수적입니다."]
  },
  {
    slug: "oil-signal",
    name: "오일 시그널 카드",
    issuer: "현대",
    cardType: "credit",
    status: "active",
    reviewStatus: "draft",
    summary: "자가용 출퇴근, 주유, 통신 고정비가 큰 사용자에게 맞는 카드",
    annualFee: 20000,
    previousSpend: 700000,
    advertisedBenefit: "주유 리터당 최대 120원 할인",
    monthlyCap: 42000,
    excluded: ["자동차세", "현금서비스", "연회비", "기프트카드"],
    benefitRules: oilSignalRules,
    benefits: toDisplayBenefits(oilSignalRules),
    sourceUrls: issuerSource("현대", "oil-signal"),
    lastVerifiedAt: "2026-06-08",
    color: "from-yellow-300 to-avocado-700",
    bestFor: ["주유 + 통신형", "자가용 출퇴근"],
    cautions: ["전월실적 70만원을 안정적으로 쓰지 못하면 혜택이 크게 줄어듭니다."],
    strengths: ["주유와 통신 고정비를 함께 잡습니다.", "고정비가 큰 가구에 유리합니다."],
    weaknesses: ["전월실적 부담이 있습니다.", "무차량 사용자에게는 비효율적입니다."]
  },
  {
    slug: "basket-smart",
    name: "바스켓 스마트 카드",
    issuer: "삼성",
    cardType: "credit",
    status: "active",
    reviewStatus: "draft",
    summary: "온라인쇼핑, 마트, 배달이 많은 생활비 집중형 카드",
    annualFee: 18000,
    previousSpend: 600000,
    advertisedBenefit: "쇼핑/생활 최대 12% 할인",
    monthlyCap: 36000,
    excluded: ["상품권", "전자지급수단 충전", "세금", "수수료"],
    benefitRules: basketSmartRules,
    benefits: toDisplayBenefits(basketSmartRules),
    sourceUrls: issuerSource("삼성", "basket-smart"),
    lastVerifiedAt: "2026-06-08",
    color: "from-avocado-300 to-teal-700",
    bestFor: ["배달 + 온라인쇼핑형", "생활비 집중형"],
    cautions: ["쇼핑 혜택은 월 한도가 있어 대형 결제 한 번으로 끝날 수 있습니다."],
    strengths: ["생활비 카테고리 커버리지가 넓습니다.", "온라인 소비가 많은 사용자에게 체감이 좋습니다."],
    weaknesses: ["교통 혜택이 없습니다.", "고정비 자동이체 혜택은 약합니다."]
  },
  {
    slug: "streaming-seed",
    name: "스트리밍 씨드 카드",
    issuer: "우리",
    cardType: "credit",
    status: "active",
    reviewStatus: "draft",
    summary: "OTT, 통신, 커피처럼 반복 구독과 소액 소비를 챙기는 카드",
    annualFee: 10000,
    previousSpend: 300000,
    advertisedBenefit: "구독 서비스 최대 30% 할인",
    monthlyCap: 18000,
    excluded: ["아파트관리비", "보험료", "세금", "대학등록금"],
    benefitRules: streamingSeedRules,
    benefits: toDisplayBenefits(streamingSeedRules),
    sourceUrls: issuerSource("우리", "streaming-seed"),
    lastVerifiedAt: "2026-06-08",
    color: "from-seed to-avocado-700",
    bestFor: ["구독/OTT 특화형", "월 30만~50만원 라이트 유저"],
    cautions: ["광고상 30%는 구독 카테고리 한도 안에서만 적용됩니다."],
    strengths: ["낮은 전월실적에서도 혜택이 열립니다.", "구독 고정비가 작은 사용자에게도 체감이 있습니다."],
    weaknesses: ["총 할인한도가 낮습니다.", "쇼핑/주유 혜택은 없습니다."]
  },
  {
    slug: "family-ground",
    name: "패밀리 그라운드 카드",
    issuer: "하나",
    cardType: "credit",
    status: "active",
    reviewStatus: "draft",
    summary: "마트, 병원, 교육비 지출이 큰 가족 생활비형 카드",
    annualFee: 25000,
    previousSpend: 900000,
    advertisedBenefit: "가족 생활비 최대 8% 할인",
    monthlyCap: 52000,
    excluded: ["상품권", "렌탈료", "세금", "무이자할부"],
    benefitRules: familyGroundRules,
    benefits: toDisplayBenefits(familyGroundRules),
    sourceUrls: issuerSource("하나", "family-ground"),
    lastVerifiedAt: "2026-06-08",
    color: "from-green-300 to-avocado-800",
    bestFor: ["생활비 집중형", "가족 고정비 관리"],
    cautions: ["전월실적 90만원 미만이면 핵심 혜택이 열리지 않습니다."],
    strengths: ["가족 단위 필수 지출에 강합니다.", "월 할인한도가 넉넉한 편입니다."],
    weaknesses: ["연회비와 실적 부담이 큽니다.", "1인 가구에게는 과한 카드입니다."]
  }
];
