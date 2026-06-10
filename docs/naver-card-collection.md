# Naver Card Slow Collection

아보카드의 네이버 카드 정보 보강은 상시 크롤러가 아니라 수동 실행형 저속 수집으로 운영한다.

## 원칙

- 한 번 실행에 기본 1개 URL만 처리한다.
- 기본 딜레이는 90초, 지터는 최대 30초다.
- `robots.txt`에서 금지한 경로는 수집하지 않는다.
- 원문 HTML은 `data/raw/naver-cards/snapshots`에 저장하고 Git에는 올리지 않는다.
- 추출 JSONL은 계산 데이터 초안으로만 사용한다.
- 공식 상품설명서/PDF 검수 전에는 `needs_review` 상태로 둔다.

## 로컬 DB 위치

- Queue: `data/raw/naver-cards/queue.json`
- State: `data/raw/naver-cards/state.json`
- Extracted records: `data/raw/naver-cards/cards.jsonl`
- HTML snapshots: `data/raw/naver-cards/snapshots/*.html`
- Failures: `data/raw/naver-cards/failures.jsonl`

## 실행

```powershell
.\.tools\node-v22.11.0-win-x64\npm.cmd run collect:naver:seed:portable
.\.tools\node-v22.11.0-win-x64\npm.cmd run collect:naver:status:portable
.\.tools\node-v22.11.0-win-x64\npm.cmd run collect:naver:slow:portable
```

## 긴 수집을 할 때

한 번에 많이 가져오지 않는다. 필요하면 Windows 작업 스케줄러나 수동 반복으로 하루에 소량만 처리한다.

```powershell
$env:NAVER_COLLECT_MAX='1'
$env:NAVER_COLLECT_DELAY_MS='180000'
$env:NAVER_COLLECT_JITTER_MS='60000'
.\.tools\node-v22.11.0-win-x64\npm.cmd run collect:naver:slow:portable
```

## 데이터 승격 기준

1. 네이버 상세에서 카드명, 연회비, 주요 혜택 문구 후보를 확보한다.
2. 카드사 공식 상품 페이지 또는 여신금융협회 공시 링크를 매칭한다.
3. 상품설명서/PDF에서 전월실적, 통합한도, 영역별 한도, 제외 항목을 확인한다.
4. 할인받은 이용금액이 다음 달 실적에 포함되는지 확인한다.
5. 검수된 값만 `data/cards.ts`의 카드별 규칙에 반영한다.
