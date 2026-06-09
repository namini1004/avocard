export type CandidateCardType = "credit" | "check";
export type CandidateStatus = "in_ranking" | "candidate";

export type CandidateSource = {
  id: string;
  title: string;
  url: string;
  trust: "popular_reference" | "official_catalog" | "public_disclosure";
};

export type CardCandidate = {
  priority: number;
  slug: string;
  name: string;
  issuer: string;
  cardType: CandidateCardType;
  status: CandidateStatus;
  purposeTags: string[];
  sourceRefs: string[];
};

export const candidateSources: CandidateSource[] = [
  {
    id: "cardgorilla-2026-may-credit",
    title: "카드고릴라 2026년 5월 인기 신용카드 TOP10",
    url: "https://www.card-gorilla.com/contents/detail/4218",
    trust: "popular_reference"
  },
  {
    id: "cardgorilla-2026-q1-credit",
    title: "카드고릴라 2026년 1분기 인기 신용카드 TOP10",
    url: "https://www.card-gorilla.com/contents/detail/4216",
    trust: "popular_reference"
  },
  {
    id: "cardgorilla-2026-q1-check",
    title: "카드고릴라 2026년 1분기 인기 체크카드 TOP10",
    url: "https://www.card-gorilla.com/contents/detail/4217",
    trust: "popular_reference"
  },
  {
    id: "cardgorilla-2025-credit-top20",
    title: "카드고릴라 2025년 총결산 인기 신용카드 TOP20",
    url: "https://m.card-gorilla.com/contents/detail/4096",
    trust: "popular_reference"
  },
  {
    id: "cardgorilla-2026-travel",
    title: "카드고릴라 2026년 1분기 트래블카드 TOP10",
    url: "https://m.card-gorilla.com/contents/detail/4224",
    trust: "popular_reference"
  },
  {
    id: "cardgorilla-2026-premium",
    title: "카드고릴라 2026년 프리미엄 카드 TOP5",
    url: "https://m.card-gorilla.com/contents/detail/4252",
    trust: "popular_reference"
  },
  {
    id: "issuer-catalog",
    title: "카드사 공식 상품 목록",
    url: "https://www.crefia.or.kr",
    trust: "official_catalog"
  },
  {
    id: "crefia-disclosure",
    title: "여신금융협회 상품공시실",
    url: "https://www.crefia.or.kr",
    trust: "public_disclosure"
  }
];

type CandidateInput = Omit<CardCandidate, "priority">;

function candidate(input: CandidateInput): CandidateInput {
  return input;
}

const rankedSources = ["cardgorilla-2026-may-credit", "cardgorilla-2026-q1-credit", "issuer-catalog"];
const checkSources = ["cardgorilla-2026-q1-check", "issuer-catalog"];
const travelSources = ["cardgorilla-2026-travel", "issuer-catalog"];
const premiumSources = ["cardgorilla-2026-premium", "issuer-catalog"];
const catalogSources = ["issuer-catalog", "crefia-disclosure"];

const candidates: CandidateInput[] = [
  candidate({ slug: "samsung-id-select-all", name: "삼성 iD SELECT ALL 카드", issuer: "삼성", cardType: "credit", status: "in_ranking", purposeTags: ["생활", "선택형"], sourceRefs: rankedSources }),
  candidate({ slug: "shinhan-mr-life", name: "신한카드 Mr.Life", issuer: "신한", cardType: "credit", status: "in_ranking", purposeTags: ["생활비", "고정비"], sourceRefs: rankedSources }),
  candidate({ slug: "woori-shopping-plus", name: "우리 카드의정석 SHOPPING+", issuer: "우리", cardType: "credit", status: "in_ranking", purposeTags: ["쇼핑", "간편결제"], sourceRefs: rankedSources }),
  candidate({ slug: "samsung-mileage-platinum-skypass", name: "삼성카드 & MILEAGE PLATINUM", issuer: "삼성", cardType: "credit", status: "in_ranking", purposeTags: ["마일리지", "해외"], sourceRefs: rankedSources }),
  candidate({ slug: "kb-my-wesh", name: "KB국민 My WE:SH 카드", issuer: "KB국민", cardType: "credit", status: "in_ranking", purposeTags: ["생활", "OTT"], sourceRefs: rankedSources }),
  candidate({ slug: "samsung-taptap-o", name: "삼성카드 taptap O", issuer: "삼성", cardType: "credit", status: "in_ranking", purposeTags: ["교통", "커피"], sourceRefs: ["cardgorilla-2025-credit-top20", "issuer-catalog"] }),
  candidate({ slug: "samsung-the-1-skypass", name: "삼성 THE 1 스카이패스", issuer: "삼성", cardType: "credit", status: "in_ranking", purposeTags: ["프리미엄", "마일리지"], sourceRefs: premiumSources }),
  candidate({ slug: "lotte-loca-365", name: "롯데 LOCA 365 카드", issuer: "롯데", cardType: "credit", status: "in_ranking", purposeTags: ["생활비", "고정비"], sourceRefs: rankedSources }),
  candidate({ slug: "kb-coupang-wow", name: "KB국민 쿠팡 와우카드", issuer: "KB국민", cardType: "credit", status: "in_ranking", purposeTags: ["쿠팡", "온라인쇼핑"], sourceRefs: rankedSources }),
  candidate({ slug: "hyundai-amex-gold-edition2", name: "현대 American Express Gold Edition2", issuer: "현대", cardType: "credit", status: "in_ranking", purposeTags: ["프리미엄", "여행"], sourceRefs: premiumSources }),
  candidate({ slug: "kbank-one-check", name: "케이뱅크 ONE 체크카드", issuer: "BC", cardType: "check", status: "in_ranking", purposeTags: ["체크", "교통"], sourceRefs: checkSources }),
  candidate({ slug: "kb-youth-club-check", name: "KB Youth Club 체크카드", issuer: "KB국민", cardType: "check", status: "in_ranking", purposeTags: ["20대", "체크"], sourceRefs: checkSources }),
  candidate({ slug: "kb-nori2-kbpay-check", name: "KB국민 노리2 체크카드(KB Pay)", issuer: "KB국민", cardType: "check", status: "in_ranking", purposeTags: ["체크", "KB Pay"], sourceRefs: checkSources }),
  candidate({ slug: "shinhan-sol-travel-check", name: "신한카드 SOL트래블 체크", issuer: "신한", cardType: "check", status: "in_ranking", purposeTags: ["여행", "해외"], sourceRefs: checkSources }),
  candidate({ slug: "naverpay-money-card", name: "네이버페이 머니카드", issuer: "네이버페이", cardType: "check", status: "in_ranking", purposeTags: ["네이버페이", "온라인"], sourceRefs: checkSources }),
  candidate({ slug: "hana-nara-sarang", name: "하나 나라사랑카드", issuer: "하나", cardType: "check", status: "in_ranking", purposeTags: ["군장병", "체크"], sourceRefs: checkSources }),
  candidate({ slug: "kb-travelers-tosimi-check", name: "KB국민 트래블러스 체크카드(토심이)", issuer: "KB국민", cardType: "check", status: "in_ranking", purposeTags: ["여행", "체크"], sourceRefs: checkSources }),
  candidate({ slug: "post-my-type-check", name: "우체국 MY-TYPE 체크카드", issuer: "우체국", cardType: "check", status: "in_ranking", purposeTags: ["선택형", "체크"], sourceRefs: checkSources }),
  candidate({ slug: "toss-bank-check", name: "토스뱅크 체크카드", issuer: "BC", cardType: "check", status: "in_ranking", purposeTags: ["체크", "캐시백"], sourceRefs: checkSources }),
  candidate({ slug: "kg-mobil-card", name: "모빌카드", issuer: "BC", cardType: "check", status: "in_ranking", purposeTags: ["모빌리티", "체크"], sourceRefs: checkSources }),
  candidate({ slug: "hana-travelogue-plus-credit", name: "하나 트래블로그+ 신용카드", issuer: "하나", cardType: "credit", status: "in_ranking", purposeTags: ["여행", "해외"], sourceRefs: travelSources }),
  candidate({ slug: "shinhan-discount-plan-plus", name: "신한카드 Discount Plan+", issuer: "신한", cardType: "credit", status: "in_ranking", purposeTags: ["생활", "할인"], sourceRefs: rankedSources }),
  candidate({ slug: "hyundai-card-m", name: "현대카드 M", issuer: "현대", cardType: "credit", status: "in_ranking", purposeTags: ["포인트", "생활"], sourceRefs: ["cardgorilla-2025-credit-top20", "issuer-catalog"] }),
  candidate({ slug: "woori-card-ui2", name: "우리 카드의정석2", issuer: "우리", cardType: "credit", status: "in_ranking", purposeTags: ["생활", "범용"], sourceRefs: rankedSources }),
  candidate({ slug: "samsung-id-simple", name: "삼성 iD SIMPLE 카드", issuer: "삼성", cardType: "credit", status: "in_ranking", purposeTags: ["무실적", "기본할인"], sourceRefs: ["cardgorilla-2025-credit-top20", "issuer-catalog"] }),
  candidate({ slug: "hyundai-zero-up", name: "현대카드 ZERO Up", issuer: "현대", cardType: "credit", status: "in_ranking", purposeTags: ["무실적", "기본할인"], sourceRefs: ["cardgorilla-2025-credit-top20", "issuer-catalog"] }),
  candidate({ slug: "shinhan-deep-oil", name: "신한카드 Deep Oil", issuer: "신한", cardType: "credit", status: "in_ranking", purposeTags: ["주유", "차량"], sourceRefs: ["cardgorilla-2025-credit-top20", "issuer-catalog"] }),
  candidate({ slug: "nh-allbarun-flex", name: "NH농협 올바른 FLEX 카드", issuer: "NH농협", cardType: "credit", status: "in_ranking", purposeTags: ["커피", "디지털"], sourceRefs: ["cardgorilla-2025-credit-top20", "issuer-catalog"] }),
  candidate({ slug: "hana-jade-classic", name: "하나 JADE Classic", issuer: "하나", cardType: "credit", status: "in_ranking", purposeTags: ["프리미엄", "여행"], sourceRefs: ["cardgorilla-2025-credit-top20", "issuer-catalog"] }),
  candidate({ slug: "woori-every-discount", name: "우리 EVERY DISCOUNT", issuer: "우리", cardType: "credit", status: "in_ranking", purposeTags: ["범용", "할인"], sourceRefs: ["cardgorilla-2025-credit-top20", "issuer-catalog"] }),
  candidate({ slug: "lotte-loca-likit-1-2", name: "롯데 LOCA LIKIT 1.2", issuer: "롯데", cardType: "credit", status: "in_ranking", purposeTags: ["무실적", "기본할인"], sourceRefs: ["cardgorilla-2025-credit-top20", "issuer-catalog"] }),
  candidate({ slug: "woori-every-mile-skypass", name: "우리 카드의정석 EVERY MILE SKYPASS", issuer: "우리", cardType: "credit", status: "in_ranking", purposeTags: ["마일리지", "항공"], sourceRefs: ["cardgorilla-2025-credit-top20", "issuer-catalog"] }),
  candidate({ slug: "shinhan-cheoeum-anniverse", name: "신한카드 처음(ANNIVERSE)", issuer: "신한", cardType: "credit", status: "in_ranking", purposeTags: ["입문", "생활"], sourceRefs: ["cardgorilla-2025-credit-top20", "issuer-catalog"] }),
  candidate({ slug: "samsung-taptap-digital", name: "삼성 taptap DIGITAL", issuer: "삼성", cardType: "credit", status: "in_ranking", purposeTags: ["디지털", "OTT"], sourceRefs: ["cardgorilla-2025-credit-top20", "issuer-catalog"] }),
  candidate({ slug: "samsung-id-global", name: "삼성 iD GLOBAL 카드", issuer: "삼성", cardType: "credit", status: "in_ranking", purposeTags: ["해외", "여행"], sourceRefs: travelSources }),
  candidate({ slug: "kb-wesh-travel", name: "KB국민 WE:SH Travel", issuer: "KB국민", cardType: "credit", status: "in_ranking", purposeTags: ["여행", "해외"], sourceRefs: travelSources }),
  candidate({ slug: "shinhan-marriott-bonvoy-best", name: "메리어트 본보이 더 베스트 신한카드", issuer: "신한", cardType: "credit", status: "in_ranking", purposeTags: ["호텔", "프리미엄"], sourceRefs: travelSources }),
  candidate({ slug: "shinhan-the-classic-s", name: "신한카드 The CLASSIC-S", issuer: "신한", cardType: "credit", status: "in_ranking", purposeTags: ["프리미엄", "여행"], sourceRefs: travelSources }),
  candidate({ slug: "nh-classy-travel", name: "NH농협 클래시 트래블카드", issuer: "NH농협", cardType: "credit", status: "in_ranking", purposeTags: ["여행", "해외"], sourceRefs: travelSources }),
  candidate({ slug: "hyundai-card-t", name: "현대카드T", issuer: "현대", cardType: "credit", status: "in_ranking", purposeTags: ["해외", "무실적"], sourceRefs: travelSources }),
  candidate({ slug: "samsung-the-id-first", name: "삼성 THE iD. 1st", issuer: "삼성", cardType: "credit", status: "in_ranking", purposeTags: ["프리미엄", "바우처"], sourceRefs: premiumSources }),
  candidate({ slug: "hyundai-card-summit", name: "현대카드 Summit", issuer: "현대", cardType: "credit", status: "in_ranking", purposeTags: ["프리미엄", "바우처"], sourceRefs: premiumSources }),
  candidate({ slug: "hyundai-koreanair-300", name: "현대카드 대한항공카드 300", issuer: "현대", cardType: "credit", status: "in_ranking", purposeTags: ["대한항공", "마일리지"], sourceRefs: premiumSources }),
  candidate({ slug: "kb-goodday-ollim", name: "KB국민 굿데이올림카드", issuer: "KB국민", cardType: "credit", status: "in_ranking", purposeTags: ["생활비", "주유"], sourceRefs: catalogSources }),
  candidate({ slug: "mg-better-check", name: "MG새마을금고 더나은 체크카드", issuer: "BC", cardType: "check", status: "in_ranking", purposeTags: ["체크", "생활"], sourceRefs: checkSources }),
  candidate({ slug: "naverpay-money-hana-check", name: "네이버페이 머니 하나 체크카드", issuer: "하나", cardType: "check", status: "in_ranking", purposeTags: ["네이버페이", "체크"], sourceRefs: checkSources }),
  candidate({ slug: "shinhan-deep-dream", name: "신한카드 Deep Dream", issuer: "신한", cardType: "credit", status: "in_ranking", purposeTags: ["범용", "포인트"], sourceRefs: catalogSources }),
  candidate({ slug: "kb-tantan-all-shopping", name: "KB국민 탄탄대로 올쇼핑 티타늄카드", issuer: "KB국민", cardType: "credit", status: "in_ranking", purposeTags: ["쇼핑", "마트"], sourceRefs: catalogSources }),
  candidate({ slug: "woori-da-card", name: "우리 DA@카드의정석", issuer: "우리", cardType: "credit", status: "in_ranking", purposeTags: ["기본할인", "무실적"], sourceRefs: catalogSources }),
  candidate({ slug: "hana-any-plus", name: "하나 Any PLUS 카드", issuer: "하나", cardType: "credit", status: "in_ranking", purposeTags: ["기본할인", "범용"], sourceRefs: catalogSources }),
  candidate({ slug: "samsung-id-on", name: "삼성 iD ON 카드", issuer: "삼성", cardType: "credit", status: "in_ranking", purposeTags: ["생활", "자동맞춤"], sourceRefs: catalogSources }),
  candidate({ slug: "hyundai-zero-edition3", name: "현대카드 ZERO Edition3", issuer: "현대", cardType: "credit", status: "candidate", purposeTags: ["무실적", "기본할인"], sourceRefs: catalogSources }),
  candidate({ slug: "lotte-tello-se", name: "롯데 TELLO SE 카드", issuer: "롯데", cardType: "credit", status: "candidate", purposeTags: ["통신", "고정비"], sourceRefs: catalogSources }),
  candidate({ slug: "shinhan-deep-store", name: "신한카드 Deep Store", issuer: "신한", cardType: "credit", status: "candidate", purposeTags: ["쇼핑", "생활"], sourceRefs: catalogSources }),
  candidate({ slug: "shinhan-deep-on-platinum-plus", name: "신한카드 Deep On Platinum+", issuer: "신한", cardType: "credit", status: "candidate", purposeTags: ["간편결제", "온라인"], sourceRefs: catalogSources }),
  candidate({ slug: "shinhan-deep-dream-platinum-plus", name: "신한카드 Deep Dream Platinum+", issuer: "신한", cardType: "credit", status: "candidate", purposeTags: ["포인트", "생활"], sourceRefs: catalogSources }),
  candidate({ slug: "shinhan-the-more", name: "신한카드 The More", issuer: "신한", cardType: "credit", status: "candidate", purposeTags: ["포인트", "잔돈적립"], sourceRefs: catalogSources }),
  candidate({ slug: "shinhan-lady-classic", name: "신한카드 Lady Classic", issuer: "신한", cardType: "credit", status: "candidate", purposeTags: ["생활", "프리미엄"], sourceRefs: catalogSources }),
  candidate({ slug: "shinhan-rpm-plus-platinum", name: "신한카드 RPM+ Platinum#", issuer: "신한", cardType: "credit", status: "candidate", purposeTags: ["주유", "차량"], sourceRefs: catalogSources }),
  candidate({ slug: "shinhan-b-big", name: "신한카드 B.Big", issuer: "신한", cardType: "credit", status: "candidate", purposeTags: ["교통", "생활"], sourceRefs: catalogSources }),
  candidate({ slug: "samsung-id-nomad", name: "삼성 iD NOMAD 카드", issuer: "삼성", cardType: "credit", status: "candidate", purposeTags: ["여행", "해외"], sourceRefs: catalogSources }),
  candidate({ slug: "samsung-id-vita", name: "삼성 iD VITA 카드", issuer: "삼성", cardType: "credit", status: "candidate", purposeTags: ["병원", "건강"], sourceRefs: catalogSources }),
  candidate({ slug: "samsung-id-ev", name: "삼성 iD EV 카드", issuer: "삼성", cardType: "credit", status: "candidate", purposeTags: ["전기차", "충전"], sourceRefs: catalogSources }),
  candidate({ slug: "samsung-id-edu", name: "삼성 iD EDU 카드", issuer: "삼성", cardType: "credit", status: "candidate", purposeTags: ["교육", "학원"], sourceRefs: catalogSources }),
  candidate({ slug: "samsung-id-energy", name: "삼성 iD ENERGY 카드", issuer: "삼성", cardType: "credit", status: "candidate", purposeTags: ["주유", "에너지"], sourceRefs: catalogSources }),
  candidate({ slug: "samsung-id-move", name: "삼성 iD MOVE 카드", issuer: "삼성", cardType: "credit", status: "candidate", purposeTags: ["교통", "모빌리티"], sourceRefs: catalogSources }),
  candidate({ slug: "samsung-id-all", name: "삼성 iD ALL 카드", issuer: "삼성", cardType: "credit", status: "candidate", purposeTags: ["범용", "생활"], sourceRefs: catalogSources }),
  candidate({ slug: "samsung-taptap-drive", name: "삼성카드 taptap DRIVE", issuer: "삼성", cardType: "credit", status: "candidate", purposeTags: ["주유", "차량"], sourceRefs: catalogSources }),
  candidate({ slug: "samsung-taptap-s", name: "삼성카드 taptap S", issuer: "삼성", cardType: "credit", status: "candidate", purposeTags: ["쇼핑", "생활"], sourceRefs: catalogSources }),
  candidate({ slug: "hyundai-card-x", name: "현대카드 X", issuer: "현대", cardType: "credit", status: "candidate", purposeTags: ["캐시백", "범용"], sourceRefs: catalogSources }),
  candidate({ slug: "hyundai-z-family", name: "현대카드 Z family", issuer: "현대", cardType: "credit", status: "candidate", purposeTags: ["가족", "생활"], sourceRefs: catalogSources }),
  candidate({ slug: "hyundai-z-work", name: "현대카드 Z work", issuer: "현대", cardType: "credit", status: "candidate", purposeTags: ["직장인", "생활"], sourceRefs: catalogSources }),
  candidate({ slug: "hyundai-z-ontact", name: "현대카드 Z ontact", issuer: "현대", cardType: "credit", status: "candidate", purposeTags: ["온라인", "구독"], sourceRefs: catalogSources }),
  candidate({ slug: "hyundai-green-edition2", name: "현대카드 Green Edition2", issuer: "현대", cardType: "credit", status: "candidate", purposeTags: ["프리미엄", "여행"], sourceRefs: catalogSources }),
  candidate({ slug: "hyundai-red-edition5", name: "현대카드 Red Edition5", issuer: "현대", cardType: "credit", status: "candidate", purposeTags: ["프리미엄", "바우처"], sourceRefs: catalogSources }),
  candidate({ slug: "hyundai-mx-black", name: "현대카드 MX Black", issuer: "현대", cardType: "credit", status: "candidate", purposeTags: ["프리미엄", "포인트"], sourceRefs: catalogSources }),
  candidate({ slug: "hyundai-koreanair-150", name: "현대카드 대한항공카드 150", issuer: "현대", cardType: "credit", status: "candidate", purposeTags: ["대한항공", "마일리지"], sourceRefs: catalogSources }),
  candidate({ slug: "hyundai-koreanair-070", name: "현대카드 대한항공카드 070", issuer: "현대", cardType: "credit", status: "candidate", purposeTags: ["대한항공", "마일리지"], sourceRefs: catalogSources }),
  candidate({ slug: "hyundai-koreanair-the-first", name: "현대카드 대한항공카드 the First", issuer: "현대", cardType: "credit", status: "candidate", purposeTags: ["대한항공", "프리미엄"], sourceRefs: catalogSources }),
  candidate({ slug: "kb-easy-all-titanium", name: "KB국민 Easy all 티타늄카드", issuer: "KB국민", cardType: "credit", status: "candidate", purposeTags: ["생활", "티타늄"], sourceRefs: catalogSources }),
  candidate({ slug: "kb-easy-shopping-titanium", name: "KB국민 Easy shopping 티타늄카드", issuer: "KB국민", cardType: "credit", status: "candidate", purposeTags: ["쇼핑", "티타늄"], sourceRefs: catalogSources }),
  candidate({ slug: "kb-easy-fly-titanium", name: "KB국민 Easy fly 티타늄카드", issuer: "KB국민", cardType: "credit", status: "candidate", purposeTags: ["여행", "항공"], sourceRefs: catalogSources }),
  candidate({ slug: "kb-easy-study-titanium", name: "KB국민 Easy study 티타늄카드", issuer: "KB국민", cardType: "credit", status: "candidate", purposeTags: ["교육", "티타늄"], sourceRefs: catalogSources }),
  candidate({ slug: "kb-dadam-card", name: "KB국민 다담카드", issuer: "KB국민", cardType: "credit", status: "candidate", purposeTags: ["선택형", "생활"], sourceRefs: catalogSources }),
  candidate({ slug: "kb-youth-talktalk", name: "KB국민 청춘대로 톡톡카드", issuer: "KB국민", cardType: "credit", status: "candidate", purposeTags: ["커피", "간편결제"], sourceRefs: catalogSources }),
  candidate({ slug: "kb-tantan-miz-mr", name: "KB국민 탄탄대로 Miz&Mr 티타늄카드", issuer: "KB국민", cardType: "credit", status: "candidate", purposeTags: ["가족", "생활"], sourceRefs: catalogSources }),
  candidate({ slug: "kb-happy-card", name: "KB국민행복카드", issuer: "KB국민", cardType: "credit", status: "candidate", purposeTags: ["바우처", "생활"], sourceRefs: catalogSources }),
  candidate({ slug: "kb-worker-bonus-check", name: "KB국민 직장인보너스체크카드", issuer: "KB국민", cardType: "check", status: "candidate", purposeTags: ["체크", "직장인"], sourceRefs: catalogSources }),
  candidate({ slug: "kb-nara-sarang-card", name: "KB국민 나라사랑카드", issuer: "KB국민", cardType: "check", status: "candidate", purposeTags: ["군장병", "체크"], sourceRefs: catalogSources }),
  candidate({ slug: "lotte-digiloca-london", name: "롯데 디지로카 London", issuer: "롯데", cardType: "credit", status: "candidate", purposeTags: ["디지털", "생활"], sourceRefs: catalogSources }),
  candidate({ slug: "lotte-digiloca-paris", name: "롯데 디지로카 Paris", issuer: "롯데", cardType: "credit", status: "candidate", purposeTags: ["디지털", "생활"], sourceRefs: catalogSources }),
  candidate({ slug: "lotte-digiloca-monaco", name: "롯데 디지로카 Monaco", issuer: "롯데", cardType: "credit", status: "candidate", purposeTags: ["디지털", "생활"], sourceRefs: catalogSources }),
  candidate({ slug: "lotte-loca-likit-eat", name: "롯데 LOCA LIKIT Eat", issuer: "롯데", cardType: "credit", status: "candidate", purposeTags: ["외식", "배달"], sourceRefs: catalogSources }),
  candidate({ slug: "lotte-loca-likit-play", name: "롯데 LOCA LIKIT Play", issuer: "롯데", cardType: "credit", status: "candidate", purposeTags: ["문화", "OTT"], sourceRefs: catalogSources }),
  candidate({ slug: "lotte-loca-likit-shop", name: "롯데 LOCA LIKIT Shop", issuer: "롯데", cardType: "credit", status: "candidate", purposeTags: ["쇼핑", "온라인"], sourceRefs: catalogSources }),
  candidate({ slug: "lotte-likit-all", name: "롯데 LIKIT all", issuer: "롯데", cardType: "credit", status: "candidate", purposeTags: ["범용", "할인"], sourceRefs: catalogSources }),
  candidate({ slug: "lotte-im-wonderful", name: "롯데 I'm WONDERFUL 카드", issuer: "롯데", cardType: "credit", status: "candidate", purposeTags: ["범용", "생활"], sourceRefs: catalogSources }),
  candidate({ slug: "woori-every-1", name: "우리 카드의정석 EVERY 1", issuer: "우리", cardType: "credit", status: "candidate", purposeTags: ["범용", "할인"], sourceRefs: catalogSources }),
  candidate({ slug: "woori-every-check", name: "우리 카드의정석 EVERY CHECK", issuer: "우리", cardType: "check", status: "candidate", purposeTags: ["체크", "범용"], sourceRefs: catalogSources }),
  candidate({ slug: "woori-nu-uniq", name: "우리 NU Uniq 카드", issuer: "우리", cardType: "credit", status: "candidate", purposeTags: ["생활", "선택형"], sourceRefs: catalogSources }),
  candidate({ slug: "woori-nu-blanc", name: "우리 NU Blanc 카드", issuer: "우리", cardType: "credit", status: "candidate", purposeTags: ["프리미엄", "생활"], sourceRefs: catalogSources }),
  candidate({ slug: "woori-nu-i-and-u", name: "우리 NU I&U 카드", issuer: "우리", cardType: "credit", status: "candidate", purposeTags: ["생활", "쇼핑"], sourceRefs: catalogSources }),
  candidate({ slug: "woori-card-ui-point", name: "우리 카드의정석 POINT", issuer: "우리", cardType: "credit", status: "candidate", purposeTags: ["포인트", "생활"], sourceRefs: catalogSources }),
  candidate({ slug: "hana-1q-daily-plus", name: "하나 1Q Daily+ 카드", issuer: "하나", cardType: "credit", status: "candidate", purposeTags: ["생활", "포인트"], sourceRefs: catalogSources }),
  candidate({ slug: "hana-multi-any", name: "하나 MULTI Any 카드", issuer: "하나", cardType: "credit", status: "candidate", purposeTags: ["범용", "멀티"], sourceRefs: catalogSources }),
  candidate({ slug: "hana-multi-living", name: "하나 MULTI Living 카드", issuer: "하나", cardType: "credit", status: "candidate", purposeTags: ["생활비", "고정비"], sourceRefs: catalogSources }),
  candidate({ slug: "hana-multi-oil", name: "하나 MULTI Oil 카드", issuer: "하나", cardType: "credit", status: "candidate", purposeTags: ["주유", "차량"], sourceRefs: catalogSources }),
  candidate({ slug: "hana-travelogue-check", name: "하나 트래블로그 체크카드", issuer: "하나", cardType: "check", status: "candidate", purposeTags: ["여행", "체크"], sourceRefs: catalogSources }),
  candidate({ slug: "hana-club-sk-card", name: "하나 CLUB SK 카드", issuer: "하나", cardType: "credit", status: "candidate", purposeTags: ["통신", "생활"], sourceRefs: catalogSources }),
  candidate({ slug: "bc-baro-goat", name: "BC 바로 GOAT 카드", issuer: "BC", cardType: "credit", status: "candidate", purposeTags: ["여행", "해외"], sourceRefs: travelSources }),
  candidate({ slug: "bc-baro-k-first", name: "BC 바로 K-First 카드", issuer: "BC", cardType: "credit", status: "candidate", purposeTags: ["범용", "생활"], sourceRefs: catalogSources }),
  candidate({ slug: "nh-zgm-the-pay", name: "NH농협 zgm.the pay 카드", issuer: "NH농협", cardType: "credit", status: "candidate", purposeTags: ["간편결제", "생활"], sourceRefs: catalogSources }),
  candidate({ slug: "nh-zgm-streaming", name: "NH농협 zgm.streaming 카드", issuer: "NH농협", cardType: "credit", status: "candidate", purposeTags: ["OTT", "구독"], sourceRefs: catalogSources }),
  candidate({ slug: "nh-zgm-discount", name: "NH농협 zgm.discount 카드", issuer: "NH농협", cardType: "credit", status: "candidate", purposeTags: ["할인", "생활"], sourceRefs: catalogSources }),
  candidate({ slug: "nh-olleh-super-dc", name: "NH농협 올원 파이카드", issuer: "NH농협", cardType: "credit", status: "candidate", purposeTags: ["생활", "선택형"], sourceRefs: catalogSources }),
  candidate({ slug: "ibk-oil-and-life", name: "IBK Oil&Life 카드", issuer: "IBK기업", cardType: "credit", status: "candidate", purposeTags: ["주유", "생활"], sourceRefs: catalogSources }),
  candidate({ slug: "ibk-bliss7", name: "IBK BLISS.7 카드", issuer: "IBK기업", cardType: "credit", status: "candidate", purposeTags: ["프리미엄", "여행"], sourceRefs: catalogSources })
];

export const cardCandidates: CardCandidate[] = candidates.map((item, index) => ({
  ...item,
  priority: index + 1
}));

export const candidateStats = {
  total: cardCandidates.length,
  inRanking: cardCandidates.filter((item) => item.status === "in_ranking").length,
  backlog: cardCandidates.filter((item) => item.status === "candidate").length,
  issuers: Array.from(new Set(cardCandidates.map((item) => item.issuer))).length
};
