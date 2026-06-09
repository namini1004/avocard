# 아보카드

아는 만큼 보이는 카드. 카드사 광고 문구가 아니라 실제 혜택, 예상 절감액, 실제 피킹률을 보여주는 카드 추천/분석 웹사이트 프로토타입입니다.

## 프로젝트 구조

- `app/`: Next.js App Router 페이지
  - `/`: 홈 랜딩페이지
  - `/cards/[slug]`: 카드 상세 분석
  - `/recommend`: AI 카드 추천 입력 폼
  - `/results`: 추천 결과 Top 3
  - `/compare`: 카드 비교
  - `/sources`: 공식/협회 출처 기반 100개 카드 수집 플랜
- `components/`: 브랜드 마크, 검색, 카드 비주얼, 지표 카드, 추천 카드 등 재사용 UI
- `data/cards.ts`: 카드 더미 데이터 6개
- `data/collection.ts`: 실제 데이터 수집 파이프라인과 출처 우선순위
- `data/official-sources.ts`: 카드사 10곳 × 혜택 목적 10개 수집 슬롯
- `lib/calculate.ts`: 예상 절감액, 연간 절감액, 피킹률 계산 유틸
- `lib/data-quality.ts`: 카드 데이터 품질 검증 유틸
- `lib/source-quality.ts`: 공식 소스 커버리지 검증 유틸
- `docs/data-collection-strategy.md`: 실제 카드 데이터 수집/검수 운영 전략

## 디자인/정보구조

홈은 `Hero -> 문제 공감 -> 해결 방식 -> 실제 혜택 예시 -> AI 추천 -> 신뢰 원칙 -> FAQ -> CTA` 흐름입니다.
아보카도 그린, 크림, 다크그린, 씨앗 옐로우를 사용해 금융 서비스의 신뢰감과 라이프스타일 서비스의 친근함을 함께 표현했습니다.

## 핵심 컴포넌트

- `SearchBox`: 카드명/카드사/사용자 유형 기반 검색 UI
- `CardVisual`: 아보카도 씨앗 모티프가 들어간 카드 이미지 목업
- `RecommendationCard`: 추천 카드 Top 3 결과 카드
- `BenefitBar`: 카테고리별 실제 할인액 시각화
- `MetricCard`: 월 절감액, 피킹률, 전월실적 등 핵심 숫자 표시

## 실행 방법

```bash
npm install
npm run dev
```

브라우저에서 `http://localhost:3000`을 열면 됩니다.

이 작업 환경처럼 프로젝트 내 포터블 Node를 쓰는 경우:

```bash
npm run dev:portable
npm run build:portable
```

## 데이터 검증

```bash
npm run validate:data
```

공식 출처 존재 여부, 검수 상태, 계산 가능한 혜택 규칙, 한도/실적 이상치를 점검합니다.

포터블 Node 환경에서는 다음 명령을 사용합니다.

```bash
npm run validate:data:portable
npm run validate:sources:portable
```

## 계산 기준

더미 소비 패턴과 입력 소비 패턴을 기준으로 카테고리별 지출에 할인율을 적용하고, 카테고리별 월 한도와 카드 전체 월 한도를 반영합니다. 월 총 소비가 전월실적보다 낮으면 핵심 혜택을 받을 수 없는 것으로 계산합니다.
