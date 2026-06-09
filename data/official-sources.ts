export type IssuerCode =
  | "shinhan"
  | "samsung"
  | "hyundai"
  | "kb"
  | "lotte"
  | "woori"
  | "hana"
  | "bc"
  | "nh"
  | "ibk";

export type OfficialIssuerSource = {
  issuer: string;
  code: IssuerCode;
  domains: string[];
  productListUrls: string[];
  notes: string;
};

export type BenefitPurposeCode =
  | "all_around"
  | "transport"
  | "coffee_convenience"
  | "delivery_dining"
  | "shopping_mart"
  | "telecom_subscription"
  | "fuel_ev"
  | "travel_mileage"
  | "premium_lounge"
  | "simple_no_performance";

export type BenefitPurpose = {
  code: BenefitPurposeCode;
  label: string;
  searchTerms: string[];
};

export type PopularCoverageTarget = {
  id: string;
  issuerCode: IssuerCode;
  issuer: string;
  purposeCode: BenefitPurposeCode;
  purposeLabel: string;
  priority: number;
  requiredSources: ["issuer_page", "issuer_pdf"];
  candidateQuery: string;
};

export const publicDisclosureSources = [
  {
    name: "여신금융협회 상품공시실",
    url: "https://www.crefia.or.kr",
    usage: "카드상품 공시와 카드사 공시 메뉴 진입점"
  },
  {
    name: "여신금융협회 카드매출 통합조회서비스",
    url: "https://www.cardsales.or.kr",
    usage: "가맹점/공시 관련 보조 확인용. 카드 혜택 확정 원천은 아님"
  }
] as const;

export const officialIssuerSources: OfficialIssuerSource[] = [
  {
    issuer: "신한",
    code: "shinhan",
    domains: ["shinhancard.com"],
    productListUrls: ["https://www.shinhancard.com"],
    notes: "공식 홈페이지에서 상품 상세 URL을 발견한 뒤 카드별 PDF를 별도 검수"
  },
  {
    issuer: "삼성",
    code: "samsung",
    domains: ["samsungcard.com"],
    productListUrls: [
      "https://www.samsungcard.com/personal/card/UHPPCA0340M0.jsp",
      "https://www.samsungcard.com/personal/card/cardfinder/UHPPCA0113M0.jsp"
    ],
    notes: "카드 한눈에 보기와 카드찾기에서 후보 발견 후 상세/약관 확인"
  },
  {
    issuer: "현대",
    code: "hyundai",
    domains: ["hyundaicard.com"],
    productListUrls: ["https://www.hyundaicard.com/cpc/cr/CPCCR0201_01.hc"],
    notes: "상품군별 상세 페이지와 상품설명서 링크 확인"
  },
  {
    issuer: "국민",
    code: "kb",
    domains: ["kbcard.com", "card.kbcard.com"],
    productListUrls: ["https://card.kbcard.com/CXPRICAC0031.cms"],
    notes: "KB Pay/카드신청 상세 페이지에서 후보 발견"
  },
  {
    issuer: "롯데",
    code: "lotte",
    domains: ["lottecard.co.kr", "image.lottecard.co.kr"],
    productListUrls: ["https://m.lottecard.co.kr/app/LPCDANA_V110.lc"],
    notes: "모바일 상품 상세와 image.lottecard PDF를 함께 저장"
  },
  {
    issuer: "우리",
    code: "woori",
    domains: ["wooricard.com"],
    productListUrls: ["https://pc.wooricard.com"],
    notes: "우리WON카드/공식 상품 페이지에서 상세 약관 확인"
  },
  {
    issuer: "하나",
    code: "hana",
    domains: ["hanacard.co.kr", "m.hanacard.co.kr"],
    productListUrls: ["https://www.hanacard.co.kr", "https://m.hanacard.co.kr"],
    notes: "leaflet PDF와 상품 상세 페이지를 함께 검수"
  },
  {
    issuer: "BC",
    code: "bc",
    domains: ["bccard.com"],
    productListUrls: [
      "https://www.bccard.com/app/card/ContentsLinkActn.do?pgm_id=ind1020",
      "https://www.bccard.com/app/card/ContentsLinkActn.do?pgm_id=ind1016"
    ],
    notes: "BC 자체/회원사 상품 공시와 카드설명서 확인"
  },
  {
    issuer: "NH농협",
    code: "nh",
    domains: ["nonghyup.com", "card.nonghyup.com"],
    productListUrls: ["https://card.nonghyup.com"],
    notes: "카드 상품 페이지와 file/ebank/product/info PDF 수집"
  },
  {
    issuer: "IBK기업",
    code: "ibk",
    domains: ["ibk.co.kr"],
    productListUrls: ["https://www.ibk.co.kr"],
    notes: "IBK 카드 상품 페이지에서 후보 발견 후 약관 PDF 확인"
  }
];

export const benefitPurposes: BenefitPurpose[] = [
  { code: "all_around", label: "전가맹점/기본적립", searchTerms: ["전가맹점", "기본 적립", "캐시백"] },
  { code: "transport", label: "대중교통/택시", searchTerms: ["대중교통", "버스", "지하철", "택시"] },
  { code: "coffee_convenience", label: "커피/편의점", searchTerms: ["커피", "편의점", "생활"] },
  { code: "delivery_dining", label: "배달/외식", searchTerms: ["배달", "외식", "음식점"] },
  { code: "shopping_mart", label: "온라인쇼핑/마트", searchTerms: ["온라인쇼핑", "마트", "쇼핑"] },
  { code: "telecom_subscription", label: "통신/OTT/구독", searchTerms: ["통신", "OTT", "구독"] },
  { code: "fuel_ev", label: "주유/전기차", searchTerms: ["주유", "전기차", "충전"] },
  { code: "travel_mileage", label: "여행/마일리지", searchTerms: ["항공", "마일리지", "여행"] },
  { code: "premium_lounge", label: "프리미엄/라운지", searchTerms: ["프리미엄", "라운지", "발렛"] },
  { code: "simple_no_performance", label: "무실적/단순혜택", searchTerms: ["무실적", "조건없이", "심플"] }
];

export const popularCoverageTargets: PopularCoverageTarget[] = officialIssuerSources.flatMap((issuer, issuerIndex) =>
  benefitPurposes.map((purpose, purposeIndex) => ({
    id: `${issuer.code}-${purpose.code}`,
    issuerCode: issuer.code,
    issuer: issuer.issuer,
    purposeCode: purpose.code,
    purposeLabel: purpose.label,
    priority: issuerIndex * benefitPurposes.length + purposeIndex + 1,
    requiredSources: ["issuer_page", "issuer_pdf"],
    candidateQuery: `${issuer.issuer}카드 ${purpose.searchTerms.join(" ")} 공식 상품설명서`
  }))
);

export const minimumPopularCardCoverage = 100;
