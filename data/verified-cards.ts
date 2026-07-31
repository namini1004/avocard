import type { VerifiedCard } from "./verified-card-types.ts";

const verifiedAt = "2026-07-30";

const commonBenefitExclusions = [
  "tax",
  "public_fee",
  "gift_card",
  "prepaid",
  "card_loan",
  "annual_fee",
  "interest",
  "interest_free_installment"
];

export const verifiedCards: VerifiedCard[] = [
  {
    slug: "bc-macao",
    name: "BC바로 MACAO 카드",
    issuer: "BC",
    cardType: "credit",
    status: "active",
    summary: "주유·장보기 결제 건이 클수록 할인율이 높아지는 카드입니다.",
    advertisedBenefit: "주유·장보기 최대 10%, 해외 2% 할인",
    annualFee: 12000,
    performance: {
      minimumSpend: 300000,
      defaultWeight: 1,
      categoryWeights: { fuel: 0 },
      excludedTags: [
        ...commonBenefitExclusions,
        "social_insurance",
        "utility",
        "school_fee",
        "university_fee",
        "apartment_fee"
      ],
      description: "주유 업종 매출과 세금·공과금·상품권 등은 전월실적에서 제외됩니다."
    },
    capTiers: [
      {
        id: "bc-macao-30",
        label: "30만원 이상",
        minPreviousSpend: 300000,
        maxPreviousSpendExclusive: 500000,
        groupCaps: { domestic: 15000 },
        ruleCaps: { "bc-macao-fuel": 10000, "bc-macao-shopping": 10000 },
        bonusConditions: [
          {
            label: "장바구니 한도",
            capGroupId: "domestic",
            totalCap: 20000,
            categories: ["shopping", "mart"],
            minTransactionAmount: 50000,
            minTransactionCount: 5,
            requiredTags: ["macao_shopping"]
          }
        ]
      },
      {
        id: "bc-macao-50",
        label: "50만원 이상",
        minPreviousSpend: 500000,
        maxPreviousSpendExclusive: 1000000,
        groupCaps: { domestic: 20000 },
        ruleCaps: { "bc-macao-fuel": 15000, "bc-macao-shopping": 15000 },
        bonusConditions: [
          {
            label: "장바구니 한도",
            capGroupId: "domestic",
            totalCap: 30000,
            categories: ["shopping", "mart"],
            minTransactionAmount: 50000,
            minTransactionCount: 5,
            requiredTags: ["macao_shopping"]
          }
        ]
      },
      {
        id: "bc-macao-100",
        label: "100만원 이상",
        minPreviousSpend: 1000000,
        groupCaps: { domestic: 30000 },
        ruleCaps: { "bc-macao-fuel": 25000, "bc-macao-shopping": 25000 },
        bonusConditions: [
          {
            label: "장바구니 한도",
            capGroupId: "domestic",
            totalCap: 50000,
            categories: ["shopping", "mart"],
            minTransactionAmount: 50000,
            minTransactionCount: 5,
            requiredTags: ["macao_shopping"]
          }
        ]
      }
    ],
    benefitRules: [
      {
        id: "bc-macao-fuel",
        label: "국내 주유",
        appliesTo: ["fuel"],
        merchantScope: ["국내 주유 업종", "전기차 충전 업종"],
        rewardType: "discount",
        rewardBands: [
          { maxTransactionAmountExclusive: 30000, formula: { kind: "rate", rate: 0.03 } },
          {
            minTransactionAmount: 30000,
            maxTransactionAmountExclusive: 50000,
            formula: { kind: "rate", rate: 0.05 }
          },
          {
            minTransactionAmount: 50000,
            maxTransactionAmountExclusive: 70000,
            formula: { kind: "rate", rate: 0.07 }
          },
          { minTransactionAmount: 70000, formula: { kind: "rate", rate: 0.1 } }
        ],
        minPreviousSpend: 300000,
        capGroupId: "domestic",
        performanceWeight: 0,
        sourceId: "bc-macao-page",
        note: "한 번의 결제금액에 따라 3%·5%·7%·10%가 적용되며, 주유 매출은 전월실적에서 제외됩니다."
      },
      {
        id: "bc-macao-shopping",
        label: "장보기",
        appliesTo: ["shopping", "mart"],
        merchantScope: [
          "쿠팡",
          "네이버페이",
          "컬리",
          "SSG.COM",
          "배민B마트",
          "이마트",
          "홈플러스",
          "롯데마트",
          "주요 슈퍼"
        ],
        rewardType: "discount",
        rewardBands: [
          { maxTransactionAmountExclusive: 50000, formula: { kind: "rate", rate: 0.03 } },
          {
            minTransactionAmount: 50000,
            maxTransactionAmountExclusive: 100000,
            formula: { kind: "rate", rate: 0.05 }
          },
          { minTransactionAmount: 100000, formula: { kind: "rate", rate: 0.1 } }
        ],
        requiredTags: ["macao_shopping"],
        minPreviousSpend: 300000,
        capGroupId: "domestic",
        sourceId: "bc-macao-page",
        note: "대상 장보기 가맹점에서 건당 결제금액에 따라 3%·5%·10%가 적용됩니다."
      },
      {
        id: "bc-macao-overseas",
        label: "해외 가맹점",
        appliesTo: ["travel"],
        merchantScope: ["해외 가맹점"],
        rewardType: "discount",
        rewardBands: [{ formula: { kind: "rate", rate: 0.02 } }],
        requiredTags: ["overseas"],
        minPreviousSpend: 0,
        separateFromMainCap: true,
        sourceId: "bc-macao-page",
        note: "전월실적과 월 한도 없이 2% 할인되며 해외 이용 수수료는 별도입니다."
      }
    ],
    excludedBenefitTags: ["gift_card", "prepaid", "paybooc_foreign_money"],
    bestFor: ["장보기 결제 건이 큰 사용자", "주유와 해외 소비를 함께 쓰는 사용자"],
    cautions: [
      "주유 이용금액은 전월실적에 포함되지 않습니다.",
      "주유·장보기는 각각의 영역 한도와 통합 한도를 동시에 적용받습니다.",
      "장바구니 한도는 전월 대상 장보기 5만원 이상 결제 5회가 있어야 열립니다."
    ],
    strengths: ["거래 건이 클수록 할인율이 올라갑니다.", "해외 2%는 실적과 한도가 없습니다."],
    weaknesses: ["소액 결제는 광고상 최대 할인율보다 낮습니다.", "주유 중심 소비는 다음 달 실적 유지에 불리합니다."],
    nonCalculatedBenefits: ["Mastercard/VISA Platinum 기본 서비스"],
    calculationCoverage: "full_monetary",
    verification: {
      status: "verified",
      verifiedAt,
      method: "BC카드 공식 상품 페이지의 거래 구간, 실적 제외, 영역·통합 한도를 규칙 단위로 대조했습니다.",
      sources: [
        {
          id: "bc-macao-page",
          type: "issuer_page",
          title: "BC바로 MACAO 카드 공식 상품 페이지",
          url: "https://www.bccard.com/app/card/CreditCardMain.do?gdsno=101010",
          capturedAt: verifiedAt,
          verifiedFields: ["발급 가능", "연회비", "전월실적", "건당 할인율", "영역 한도", "통합 한도", "실적 제외"]
        }
      ]
    },
    color: { background: "#173f35", foreground: "#ffffff", accent: "#d7ee8a" }
  },
  {
    slug: "nh20-haebom-check",
    name: "NH20 해봄 체크카드",
    issuer: "NH농협",
    cardType: "check",
    status: "active",
    summary: "온라인·생활 할인은 넓지만 혜택 대상 매출이 실적에 50%만 반영되는 체크카드입니다.",
    advertisedBenefit: "쇼핑 5%, 커피 20%, 교통 10% 할인",
    annualFee: 0,
    performance: {
      minimumSpend: 200000,
      defaultWeight: 1,
      excludedTags: [
        ...commonBenefitExclusions,
        "social_insurance",
        "utility",
        "school_fee",
        "university_fee",
        "apartment_fee",
        "point_payment"
      ],
      description: "할인 대상 가맹점 이용액은 전월실적에 50%만 반영됩니다."
    },
    capTiers: [
      {
        id: "nh20-20",
        label: "20만~40만원",
        minPreviousSpend: 200000,
        maxPreviousSpendExclusive: 400000,
        totalCap: 7000,
        groupCaps: { online: 4000, offline: 3000 }
      },
      {
        id: "nh20-40",
        label: "40만~60만원",
        minPreviousSpend: 400000,
        maxPreviousSpendExclusive: 600000,
        totalCap: 13000,
        groupCaps: { online: 8000, offline: 5000 }
      },
      {
        id: "nh20-60",
        label: "60만~100만원",
        minPreviousSpend: 600000,
        maxPreviousSpendExclusive: 1000000,
        totalCap: 22000,
        groupCaps: { online: 15000, offline: 7000 }
      },
      {
        id: "nh20-100",
        label: "100만원 이상",
        minPreviousSpend: 1000000,
        totalCap: 35000,
        groupCaps: { online: 25000, offline: 10000 }
      }
    ],
    benefitRules: [
      {
        id: "nh20-shopping",
        label: "온라인 쇼핑몰",
        appliesTo: ["shopping"],
        merchantScope: ["G마켓", "옥션", "인터파크", "11번가", "농협몰"],
        rewardType: "discount",
        rewardBands: [{ minTransactionAmount: 20000, formula: { kind: "rate", rate: 0.05 } }],
        requiredTags: ["major_marketplace"],
        minPreviousSpend: 200000,
        perTransactionCap: 2500,
        monthlyCap: 8000,
        capGroupId: "online",
        performanceWeight: 0.5,
        sourceId: "nh20-page",
        note: "건당 2만원 이상, 건당 최대 2,500원, 월 최대 8,000원입니다."
      },
      {
        id: "nh20-delivery",
        label: "배달앱",
        appliesTo: ["delivery"],
        merchantScope: ["배달의민족", "요기요"],
        rewardType: "discount",
        rewardBands: [{ minTransactionAmount: 10000, formula: { kind: "rate", rate: 0.05 } }],
        requiredTags: ["delivery_app"],
        minPreviousSpend: 200000,
        perTransactionCap: 1000,
        monthlyCap: 6000,
        capGroupId: "online",
        performanceWeight: 0.5,
        sourceId: "nh20-page",
        note: "건당 1만원 이상, 건당 최대 1,000원, 월 최대 6,000원입니다."
      },
      {
        id: "nh20-telecom",
        label: "이동통신 자동납부",
        appliesTo: ["telecom"],
        merchantScope: ["SKT", "KT", "LG U+"],
        rewardType: "discount",
        rewardBands: [{ minTransactionAmount: 50000, formula: { kind: "fixed", amount: 2500 } }],
        requiredTags: ["auto_pay"],
        minPreviousSpend: 200000,
        monthlyCountCap: 1,
        monthlyCap: 2500,
        capGroupId: "offline",
        performanceWeight: 0.5,
        sourceId: "nh20-page",
        note: "알뜰폰을 제외한 이동통신 자동납부 5만원 이상 결제 시 월 1건 2,500원입니다."
      },
      {
        id: "nh20-coffee",
        label: "스타벅스·이디야",
        appliesTo: ["coffee"],
        merchantScope: ["스타벅스", "이디야"],
        rewardType: "discount",
        rewardBands: [{ minTransactionAmount: 10000, formula: { kind: "rate", rate: 0.2 } }],
        requiredTags: ["coffee_chain"],
        minPreviousSpend: 200000,
        monthlyCap: 3000,
        capGroupId: "offline",
        performanceWeight: 0.5,
        sourceId: "nh20-page",
        note: "건당 1만원 이상 결제에 20%, 월 최대 3,000원입니다."
      },
      {
        id: "nh20-convenience",
        label: "GS25",
        appliesTo: ["convenience"],
        merchantScope: ["GS25 가두매장"],
        rewardType: "discount",
        rewardBands: [{ minTransactionAmount: 10000, formula: { kind: "rate", rate: 0.05 } }],
        requiredTags: ["gs25"],
        minPreviousSpend: 200000,
        perTransactionCap: 1000,
        monthlyCap: 3000,
        capGroupId: "offline",
        performanceWeight: 0.5,
        sourceId: "nh20-page",
        note: "건당 1만원 이상, 건당 최대 1,000원, 월 최대 3,000원입니다."
      },
      {
        id: "nh20-transport",
        label: "버스·지하철",
        appliesTo: ["transport"],
        merchantScope: ["후불교통 버스", "지하철"],
        rewardType: "discount",
        rewardBands: [{ formula: { kind: "rate", rate: 0.1 } }],
        requiredTags: ["public_transport"],
        minPreviousSpend: 200000,
        monthlyCategorySpendMin: 20000,
        monthlyCap: 3000,
        capGroupId: "offline",
        performanceWeight: 0.5,
        sourceId: "nh20-page",
        note: "교통사업자별 월 이용금액이 2만원 이상일 때 10%, 월 최대 3,000원입니다."
      },
      {
        id: "nh20-overseas",
        label: "해외 가맹점",
        appliesTo: ["travel"],
        merchantScope: ["해외 전 가맹점", "해외직구"],
        rewardType: "discount",
        rewardBands: [{ minTransactionAmount: 20000, formula: { kind: "rate", rate: 0.01 } }],
        requiredTags: ["overseas"],
        minPreviousSpend: 200000,
        monthlyCap: 100000,
        separateFromMainCap: true,
        performanceWeight: 0.5,
        sourceId: "nh20-page",
        note: "건당 2만원 이상, 주요서비스 통합 한도와 별도로 월 최대 10만원입니다."
      }
    ],
    excludedBenefitTags: ["gift_card", "prepaid"],
    bestFor: ["온라인쇼핑·배달 소비가 많은 사용자", "연회비 없는 생활 체크카드를 찾는 사용자"],
    cautions: [
      "혜택 대상 가맹점 이용액은 전월실적에 50%만 반영됩니다.",
      "온라인·오프라인 한도와 총 할인한도를 모두 넘을 수 없습니다.",
      "커피·편의점 등은 지정 브랜드와 건당 최소 결제 조건이 있습니다."
    ],
    strengths: ["연회비가 없습니다.", "온라인·생활·교통을 한 장에 담았습니다."],
    weaknesses: ["할인 대상 소비만 반복하면 다음 달 실적이 부족해질 수 있습니다.", "브랜드와 건당 금액 조건이 촘촘합니다."],
    nonCalculatedBenefits: [
      "온라인 서점·어학시험 5%",
      "CGV 온라인 예매 2,000원",
      "앱스토어 1,000원",
      "선택형 공항라운지 또는 놀이공원"
    ],
    calculationCoverage: "core_monetary",
    verification: {
      status: "verified",
      verifiedAt,
      method: "NH농협카드 공식 상세 페이지와 상품안내 PDF에서 거래 조건과 통합 한도를 대조했습니다.",
      sources: [
        {
          id: "nh20-page",
          type: "issuer_page",
          title: "NH20 해봄 체크카드 공식 상세",
          url: "https://card.nonghyup.com/servlet/IpCc2021R.act?CD_WRS_SQNO=90000359",
          capturedAt: verifiedAt,
          verifiedFields: ["발급 가능", "연회비", "전월실적", "건당 조건", "온라인·오프라인 한도", "실적 50% 반영"]
        },
        {
          id: "nh20-pdf",
          type: "issuer_pdf",
          title: "NH20 해봄 체크카드 상품안내",
          url: "https://card.nonghyup.com/file/ebank/product/info/NHCard_M21012_191029.pdf",
          capturedAt: verifiedAt,
          verifiedFields: ["혜택 유의사항", "실적 제외", "선택 서비스"]
        }
      ]
    },
    color: { background: "#0674b9", foreground: "#ffffff", accent: "#f6d74a" }
  },
  {
    slug: "shinhan-mr-life",
    name: "신한카드 Mr.Life",
    issuer: "신한",
    cardType: "credit",
    status: "active",
    summary: "공과금·생활업종·야간 소비·주말 장보기를 서로 다른 한도로 할인합니다.",
    advertisedBenefit: "월납요금·TIME·주말 생활비 10% 할인",
    annualFee: 15000,
    performance: {
      minimumSpend: 300000,
      defaultWeight: 1,
      excludedTags: ["card_loan", "annual_fee", "fee", "interest", "gift_card", "prepaid", "cancelled"],
      description: "할인받은 이용금액도 실적에 포함되며 카드대출·연회비·수수료·상품권 등은 제외됩니다."
    },
    capTiers: [
      {
        id: "mr-life-30",
        label: "30만~50만원",
        minPreviousSpend: 300000,
        maxPreviousSpendExclusive: 500000,
        groupCaps: { utility: 3000, time: 10000, weekend: 3000 }
      },
      {
        id: "mr-life-50",
        label: "50만~100만원",
        minPreviousSpend: 500000,
        maxPreviousSpendExclusive: 1000000,
        groupCaps: { utility: 7000, time: 20000, weekend: 7000 }
      },
      {
        id: "mr-life-100",
        label: "100만원 이상",
        minPreviousSpend: 1000000,
        groupCaps: { utility: 10000, time: 30000, weekend: 10000 }
      }
    ],
    benefitRules: [
      {
        id: "mr-life-utility",
        label: "월납요금",
        appliesTo: ["telecom"],
        merchantScope: ["전기", "도시가스", "SKT", "KT", "LG U+"],
        rewardType: "discount",
        rewardBands: [{ formula: { kind: "rate", rate: 0.1 } }],
        requiredTags: ["auto_pay"],
        minPreviousSpend: 300000,
        perTransactionCap: 5000,
        capGroupId: "utility",
        sourceId: "mr-life-page",
        note: "일 1회, 1회 승인금액 5만원까지 10%가 적용됩니다."
      },
      {
        id: "mr-life-convenience",
        label: "편의점",
        appliesTo: ["convenience"],
        merchantScope: ["편의점 업종"],
        rewardType: "discount",
        rewardBands: [{ formula: { kind: "rate", rate: 0.1 } }],
        minPreviousSpend: 300000,
        perTransactionCap: 1000,
        monthlyCountCap: 5,
        capGroupId: "time",
        sourceId: "mr-life-page",
        note: "일 1회·월 5회, 1회 승인금액 1만원까지 할인됩니다."
      },
      {
        id: "mr-life-medical",
        label: "병원·약국",
        appliesTo: ["medical"],
        merchantScope: ["병원", "약국", "치과", "한의원"],
        rewardType: "discount",
        rewardBands: [{ formula: { kind: "rate", rate: 0.1 } }],
        minPreviousSpend: 300000,
        perTransactionCap: 1000,
        monthlyCountCap: 5,
        capGroupId: "time",
        sourceId: "mr-life-page",
        note: "동물병원은 제외되며 일 1회·월 5회, 건당 최대 1,000원입니다."
      },
      {
        id: "mr-life-night",
        label: "야간 쇼핑·택시·식음료",
        appliesTo: ["shopping", "taxi", "dining", "coffee"],
        merchantScope: ["지정 온라인몰", "택시", "음식점", "커피전문점"],
        rewardType: "discount",
        rewardBands: [{ formula: { kind: "rate", rate: 0.1 } }],
        requiredTags: ["night", "mr_life_night"],
        minPreviousSpend: 300000,
        perTransactionCap: 1000,
        monthlyCountCap: 10,
        capGroupId: "time",
        sourceId: "mr-life-page",
        note: "오후 9시~오전 9시 승인 건에 영역별 일 1회·월 10회, 건당 최대 1,000원입니다."
      },
      {
        id: "mr-life-weekend-mart",
        label: "주말 3대 마트",
        appliesTo: ["mart"],
        merchantScope: ["이마트", "롯데마트", "홈플러스"],
        rewardType: "discount",
        rewardBands: [{ formula: { kind: "rate", rate: 0.1 } }],
        requiredTags: ["weekend", "major_mart"],
        minPreviousSpend: 300000,
        perTransactionCap: 5000,
        capGroupId: "weekend",
        sourceId: "mr-life-page",
        note: "토·일요일 일 1회, 1회 승인금액 5만원까지 할인됩니다."
      },
      {
        id: "mr-life-weekend-fuel",
        label: "주말 4대 주유소",
        appliesTo: ["fuel"],
        merchantScope: ["SK에너지", "GS칼텍스", "HD현대오일뱅크", "S-OIL"],
        rewardType: "discount",
        rewardBands: [
          {
            formula: {
              kind: "per_liter",
              wonPerLiter: 60,
              assumedPricePerLiter: 1700
            }
          }
        ],
        requiredTags: ["weekend", "major_fuel"],
        minPreviousSpend: 300000,
        capGroupId: "weekend",
        sourceId: "mr-life-page",
        note: "토·일요일 리터당 60원입니다. 계산은 휘발유 환산가 1,700원/L 가정이며 월 승인금액 30만원까지 반영합니다."
      }
    ],
    excludedBenefitTags: ["card_loan", "annual_fee", "fee", "interest", "gift_card", "prepaid"],
    bestFor: ["공과금과 생활비를 모으는 사용자", "야간·주말 소비가 뚜렷한 사용자"],
    cautions: [
      "TIME 할인은 승인 시간과 업종 조건을 만족해야 합니다.",
      "월납·TIME·주말 한도는 서로 별도입니다.",
      "주유 할인은 실제 유가에 따라 금액이 달라져 1,700원/L로 환산합니다."
    ],
    strengths: ["생활비 할인 영역이 넓습니다.", "할인받은 매출도 전월실적에 포함됩니다."],
    weaknesses: ["시간대·요일·건당 한도 때문에 최대 할인율을 그대로 받기 어렵습니다.", "소비 패턴이 흩어져 있으면 한도를 채우기 어렵습니다."],
    nonCalculatedBenefits: ["인테이크몰 20% 할인", "세탁소 10% 할인"],
    calculationCoverage: "core_monetary",
    verification: {
      status: "verified",
      verifiedAt,
      method: "신한카드 공식 상품 페이지의 서비스별 표와 현재 온라인 신청 상태를 확인했습니다.",
      sources: [
        {
          id: "mr-life-page",
          type: "issuer_page",
          title: "신한카드 Mr.Life 공식 상품 페이지",
          url: "https://www.shinhancard.com/pconts/html/card/apply/credit/1187937_2207.html",
          capturedAt: verifiedAt,
          verifiedFields: ["발급 가능", "연회비", "전월실적", "서비스별 한도", "건당·횟수 조건", "실적 제외"]
        }
      ]
    },
    color: { background: "#2b2e32", foreground: "#ffffff", accent: "#e2d56b" }
  },
  {
    slug: "loca-likit-1-2",
    name: "LOCA LIKIT 1.2",
    issuer: "롯데",
    cardType: "credit",
    status: "active",
    summary: "전월실적과 월 한도 없이 국내외 1.2%, 온라인 1.5%를 할인합니다.",
    advertisedBenefit: "어디서나 1.2%, 온라인 1.5% 할인",
    annualFee: 10000,
    performance: {
      minimumSpend: 0,
      defaultWeight: 1,
      excludedTags: [],
      description: "전월실적 조건이 없습니다."
    },
    capTiers: [{ id: "loca-none", label: "실적 조건 없음", minPreviousSpend: 0 }],
    benefitRules: [
      {
        id: "loca-online",
        label: "온라인",
        appliesTo: "all",
        merchantScope: ["온라인 가맹점"],
        rewardType: "discount",
        rewardBands: [{ formula: { kind: "rate", rate: 0.015 } }],
        requiredTags: ["online"],
        minPreviousSpend: 0,
        priority: 20,
        sourceId: "loca-page",
        note: "온라인 이용금액은 할인한도 없이 1.5%가 적용됩니다."
      },
      {
        id: "loca-all",
        label: "국내외 모든 가맹점",
        appliesTo: "all",
        merchantScope: ["국내 가맹점", "해외 가맹점"],
        rewardType: "discount",
        rewardBands: [{ formula: { kind: "rate", rate: 0.012 } }],
        minPreviousSpend: 0,
        priority: 10,
        sourceId: "loca-page",
        note: "온라인 1.5%와 중복되지 않으며 더 큰 할인 하나만 적용됩니다."
      }
    ],
    excludedBenefitTags: [
      ...commonBenefitExclusions,
      "utility",
      "social_insurance",
      "school_fee",
      "university_fee",
      "apartment_fee",
      "public_transport",
      "taxi",
      "road_toll",
      "unapproved"
    ],
    bestFor: ["실적 관리가 싫은 사용자", "온라인 결제가 많은 사용자"],
    cautions: ["대중교통·택시·공과금·세금·상품권 등은 할인 대상에서 제외됩니다.", "온라인과 기본 할인은 중복되지 않습니다."],
    strengths: ["전월실적과 월 한도가 없습니다.", "계산 구조가 단순해 혜택 예측이 쉽습니다."],
    weaknesses: ["고정비와 교통비 비중이 크면 실제 적용 금액이 줄어듭니다.", "높은 특정 업종 할인은 없습니다."],
    nonCalculatedBenefits: [],
    calculationCoverage: "full_monetary",
    verification: {
      status: "verified",
      verifiedAt,
      method: "롯데카드 공식 상품 페이지와 공식 상품 안내 PDF에서 할인율·중복·제외 조건을 대조했습니다.",
      sources: [
        {
          id: "loca-page",
          type: "issuer_page",
          title: "LOCA LIKIT 1.2 공식 상품 페이지",
          url: "https://www.lottecard.co.kr/app/LPCDADB_V100.lc?bId=69657&vtCdKndC=P13937-A13937",
          capturedAt: verifiedAt,
          verifiedFields: ["발급 가능", "연회비", "할인율", "무실적·무한도", "중복 기준", "할인 제외"]
        },
        {
          id: "loca-pdf",
          type: "issuer_pdf",
          title: "LOCA LIKIT Series 공식 상품 안내",
          url: "https://image.lottecard.co.kr/UploadFiles/esens/pdf/pdf_normal_20210014_20211122133724.pdf",
          capturedAt: verifiedAt,
          verifiedFields: ["연회비", "실적 조건", "할인한도"]
        }
      ]
    },
    color: { background: "#f3eee5", foreground: "#1f2721", accent: "#d64b39" }
  },
  {
    slug: "hyundai-zero-edition3-discount",
    name: "현대카드ZERO Edition3(할인형)",
    issuer: "현대",
    cardType: "credit",
    status: "active",
    summary: "전월실적과 할인한도 없이 국내외 일반 가맹점에서 0.8%를 할인합니다.",
    advertisedBenefit: "국내외 가맹점 0.8% 할인",
    annualFee: 15000,
    performance: {
      minimumSpend: 0,
      defaultWeight: 1,
      excludedTags: [],
      description: "전월실적 조건이 없습니다."
    },
    capTiers: [{ id: "zero-none", label: "실적 조건 없음", minPreviousSpend: 0 }],
    benefitRules: [
      {
        id: "zero-all",
        label: "국내외 기본 할인",
        appliesTo: "all",
        merchantScope: ["국내 가맹점", "해외 가맹점"],
        rewardType: "discount",
        rewardBands: [{ formula: { kind: "rate", rate: 0.008 } }],
        minPreviousSpend: 0,
        sourceId: "zero-guide",
        note: "할인 대상 이용금액에 실적 조건과 한도 없이 0.8%가 적용됩니다."
      }
    ],
    excludedBenefitTags: [
      ...commonBenefitExclusions,
      "school_fee",
      "university_fee",
      "apartment_fee",
      "utility",
      "social_insurance"
    ],
    bestFor: ["조건 없는 기본 할인을 원하는 사용자", "소비처가 자주 바뀌는 사용자"],
    cautions: ["세금·공과금·등록금·상품권 등 공식 제외 항목에는 할인이 적용되지 않습니다.", "연회비를 빼면 저사용 구간의 순피킹률이 낮아집니다."],
    strengths: ["전월실적과 월 한도가 없습니다.", "소비처별 조건을 거의 관리하지 않아도 됩니다."],
    weaknesses: ["기본 할인율이 높지는 않습니다.", "월 사용액이 적으면 연회비 영향이 큽니다."],
    nonCalculatedBenefits: [],
    calculationCoverage: "full_monetary",
    verification: {
      status: "verified",
      verifiedAt,
      method: "현대카드 공식 상품 페이지와 최신 공식 가이드북의 할인율·연회비·제외 항목을 대조했습니다.",
      sources: [
        {
          id: "zero-page",
          type: "issuer_page",
          title: "현대카드ZERO Edition3(할인형) 공식 상품 페이지",
          url: "https://www.hyundaicard.com/cpc/cr/CPCCR0201_01.hc?cardWcd=ZROE3",
          capturedAt: verifiedAt,
          verifiedFields: ["발급 가능", "연회비", "기본 할인"]
        },
        {
          id: "zero-guide",
          type: "issuer_pdf",
          title: "현대카드ZERO Edition3(할인형) 공식 가이드북",
          url: "https://www.hyundaicard.com/upload/card/%EA%B0%80%EC%9D%B4%EB%93%9C%EB%B6%81_ZERO%20Ed3_%ED%95%A0%EC%9D%B8_260330.pdf",
          capturedAt: verifiedAt,
          verifiedFields: ["할인율", "실적·한도 없음", "할인 제외", "연회비"]
        }
      ]
    },
    color: { background: "#eeeeec", foreground: "#171a18", accent: "#b9b9b4" }
  }
];

export const verifiedCardBySlug = new Map(verifiedCards.map((card) => [card.slug, card]));
