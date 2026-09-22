"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  ArrowRight,
  Check,
  CheckCheck,
  ChevronDown,
  ChevronRight,
  CreditCard,
  Equal,
  Heart,
  Plus,
  SlidersHorizontal,
  Sparkles,
  TrendingUp,
  X,
} from "lucide-react";
import {
  expenseOptions,
  type CardChoice,
  type DiscoveryInput,
  type DiscoveryResult,
  type Expense,
} from "@/lib/discovery-types";

const won = (value: number) => `${Math.round(value).toLocaleString("ko-KR")}원`;
const percent = (value: number) => `${value.toFixed(2)}%`;
const amounts = [300000, 400000, 500000, 700000, 1000000, 1200000];

export function CardThumbnail({ card }: { card: CardChoice }) {
  return (
    <div
      className="card-thumbnail"
      style={{
        background: card.color.background,
        color: card.color.foreground,
      }}
      aria-hidden="true"
    >
      <span>{card.issuer}</span>
      <i style={{ background: card.color.accent }} />
      <small>{card.cardType === "check" ? "CHECK" : "CREDIT"}</small>
    </div>
  );
}

function Sheet({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current!;
    const focused = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      dialog.close();
      document.body.style.overflow = overflow;
      focused?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className="choice-sheet"
      aria-label={title}
      onCancel={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="sheet-frame">
        <div className="sheet-heading">
          <span>{title}</span>
          <button
            autoFocus
            type="button"
            className="icon-button"
            title="닫기"
            aria-label="닫기"
            onClick={onClose}
          >
            <X size={22} />
          </button>
        </div>
        <div className="sheet-body">{children}</div>
      </div>
    </dialog>
  );
}

export function CardChoiceDetails({
  card,
  maximum = false,
}: {
  card: CardChoice;
  maximum?: boolean;
}) {
  return (
    <>
      <div className="detail-identity">
        <CardThumbnail card={card} />
        <div>
          <p className="eyebrow">
            {card.issuer} ·{" "}
            {card.cardType === "check" ? "체크카드" : "신용카드"}
          </p>
          <h2>{card.name}</h2>
        </div>
      </div>
      <p className="detail-summary">{card.summary}</p>
      <div className="detail-value">
        <div>
          <span>
            {maximum ? "조건 충족 시 최대 피킹률" : "내 소비 예상 피킹률"}
          </span>
          <strong>
            {percent(maximum ? card.maximumRate : card.pickingRate)}
          </strong>
        </div>
        <div>
          <span>연회비 반영 월 순혜택</span>
          <b>{won(maximum ? card.maximumBenefit : card.netBenefit)}</b>
        </div>
      </div>
      <dl className="detail-facts">
        <div>
          <dt>{maximum ? "필요한 월 사용액" : "월 사용액"}</dt>
          <dd>{won(maximum ? card.maximumSpend : card.totalSpend)}</dd>
        </div>
        <div>
          <dt>연회비</dt>
          <dd>
            {won(card.annualFee)} <small>(월 {won(card.monthlyFee)})</small>
          </dd>
        </div>
        {!maximum && (
          <>
            <div>
              <dt>할인·적립 합계</dt>
              <dd>{won(card.grossBenefit)}</dd>
            </div>
            <div>
              <dt>연간 순혜택</dt>
              <dd>{won(card.annualBenefit)}</dd>
            </div>
            <div>
              <dt>다음 달 인정실적</dt>
              <dd>{won(card.qualifyingSpend)}</dd>
            </div>
          </>
        )}
      </dl>
      {!maximum && card.performanceGap > 0 && (
        <p className="notice">
          현재 소비로는 다음 달 실적이 {won(card.performanceGap)} 부족합니다.
          혜택 때문에 소비를 늘리기 전에 다른 카드를 비교해보세요.
        </p>
      )}
      {!maximum && card.feeShortfall > 0 && (
        <p className="notice">
          할인·적립보다 월 연회비 부담이 {won(card.feeShortfall)} 큽니다.
        </p>
      )}
      {maximum && (
        <section className="detail-section">
          <h3>이렇게 썼을 때의 혜택이에요</h3>
          <p>지정 가맹점·결제 조건을 모두 충족하는 소비 예시입니다.</p>
          <dl className="detail-facts">
            {card.maximumAllocation.map((item) => (
              <div key={item.label}>
                <dt>{item.label}</dt>
                <dd>{won(item.amount)}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}
      <section className="detail-section">
        <h3>얼마나 신경 써야 할까요?</h3>
        <div className="tag-list">
          <span className={card.simple ? "tag green" : "tag amber"}>
            {card.easeLabel}
          </span>
          {card.conditions.map((condition) => (
            <span className="tag" key={condition}>
              {condition}
            </span>
          ))}
        </div>
        <p>{card.performanceDescription}</p>
      </section>
      <section className="detail-section">
        <h3>실적 구간과 혜택 한도</h3>
        <dl className="detail-facts">
          {card.tiers.map((tier) => (
            <div key={tier.label}>
              <dt>{tier.label}</dt>
              <dd>{tier.limits}</dd>
            </div>
          ))}
        </dl>
      </section>
      <section className="detail-section">
        <h3>주요 혜택과 사용 조건</h3>
        {card.benefits.map((benefit) => (
          <div className="benefit-line" key={benefit.label}>
            <div className="benefit-title">
              <h4>{benefit.label}</h4>
              {!maximum && <b>{won(benefit.saving)}</b>}
            </div>
            <p>{benefit.note}</p>
            <small>{benefit.merchants.join(" · ")}</small>
          </div>
        ))}
      </section>
      <section className="detail-section">
        <h3>발급 전에 확인하세요</h3>
        <ul className="condition-list">
          {card.cautions.map((caution) => (
            <li key={caution}>{caution}</li>
          ))}
        </ul>
      </section>
    </>
  );
}

function CompareChoices({ cards }: { cards: CardChoice[] }) {
  return (
    <div className="comparison-scroll">
      <table className="comparison-table">
        <caption>같은 월 사용액 기준 카드 비교</caption>
        <thead>
          <tr>
            <th scope="col">비교 항목</th>
            {cards.map((card) => (
              <th scope="col" key={card.slug}>
                <CardThumbnail card={card} />
                {card.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[
            ["예상 피킹률", (card: CardChoice) => percent(card.pickingRate)],
            ["월 순혜택", (card: CardChoice) => won(card.netBenefit)],
            ["연간 순혜택", (card: CardChoice) => won(card.annualBenefit)],
            ["연회비", (card: CardChoice) => won(card.annualFee)],
            [
              "전월실적",
              (card: CardChoice) =>
                card.minimumSpend ? won(card.minimumSpend) : "조건 없음",
            ],
            ["실적 부족분", (card: CardChoice) => won(card.performanceGap)],
            ["관리 부담", (card: CardChoice) => card.easeLabel],
            [
              "확인할 조건",
              (card: CardChoice) =>
                card.conditions.join(" · ") || "기본 할인 제외 항목",
            ],
            ["유의사항", (card: CardChoice) => card.cautions.join(" ")],
          ].map(([label, render]) => (
            <tr key={String(label)}>
              <th scope="row">{String(label)}</th>
              {cards.map((card) => (
                <td key={card.slug}>
                  {(render as (card: CardChoice) => string)(card)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function CardExplorer({
  initial,
  personal = false,
  compare = false,
}: {
  initial: DiscoveryResult;
  personal?: boolean;
  compare?: boolean;
}) {
  const [input, setInput] = useState<DiscoveryInput>(initial.input);
  const [result, setResult] = useState(initial);
  const [expanded, setExpanded] = useState(personal);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<{
    card: CardChoice;
    maximum: boolean;
  } | null>(null);
  const [compareIds, setCompareIds] = useState<string[]>(
    compare ? initial.cards.slice(0, 2).map((card) => card.slug) : [],
  );
  const [comparisonOpen, setComparisonOpen] = useState(false);
  const requestRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);
  const formRef = useRef<HTMLDivElement>(null);
  useEffect(() => () => abortRef.current?.abort(), []);
  const assigned = input.expenses.reduce(
    (sum, expense) => sum + expense.amount,
    0,
  );
  const isDirty = JSON.stringify(input) !== JSON.stringify(result.input);
  const visibleCompare = result.cards.filter((card) =>
    compareIds.includes(card.slug),
  );

  async function refresh(next: DiscoveryInput) {
    setInput(next);
    const requestId = ++requestRef.current;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/discovery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
        signal: controller.signal,
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "다시 시도해주세요.");
      if (requestRef.current === requestId) {
        setResult(payload);
        setCompareIds((ids) =>
          ids.filter((slug) =>
            payload.cards.some((card: CardChoice) => card.slug === slug),
          ),
        );
      }
    } catch (failure) {
      if (requestRef.current === requestId && !controller.signal.aborted)
        setError(
          failure instanceof Error
            ? failure.message
            : "잠시 후 다시 시도해주세요.",
        );
    } finally {
      if (requestRef.current === requestId) setPending(false);
    }
  }

  function editExpense(
    category: Expense["category"],
    update: Partial<Expense>,
  ) {
    setInput((current) => ({
      ...current,
      expenses: current.expenses.map((expense) =>
        expense.category === category ? { ...expense, ...update } : expense,
      ),
    }));
  }
  function toggleExpense(category: Expense["category"]) {
    const option = expenseOptions.find((item) => item.category === category)!;
    setInput((current) => ({
      ...current,
      expenses: current.expenses.some(
        (expense) => expense.category === category,
      )
        ? current.expenses.filter((expense) => expense.category !== category)
        : [
            ...current.expenses,
            {
              category,
              amount: 0,
              count: 1,
              merchant: option.merchants[0],
              weekend: false,
              night: false,
              autopay: false,
            },
          ],
    }));
  }
  function toggleCompare(slug: string) {
    setCompareIds((current) =>
      current.includes(slug)
        ? current.filter((id) => id !== slug)
        : current.length < 3
          ? [...current, slug]
          : current,
    );
  }

  return (
    <>
      {!personal && !compare && (
        <section className="maximum-band" aria-labelledby="maximum-heading">
          <div className="section-heading">
            <div>
              <p className="eyebrow">
                <TrendingUp size={15} /> 혜택의 가능성
              </p>
              <h2 id="maximum-heading">잘 챙기면, 이만큼.</h2>
            </div>
            <button
              className="text-action"
              type="button"
              onClick={() => {
                void refresh({ ...input, mode: "maximum" });
                formRef.current?.scrollIntoView({
                  behavior: "smooth",
                  block: "start",
                });
              }}
            >
              최대 피킹률 순위 <ArrowRight size={16} />
            </button>
          </div>
          <div className="maximum-list">
            {result.highlights.map((card, index) => (
              <button
                key={card.slug}
                type="button"
                className="maximum-item"
                onClick={() => setSelected({ card, maximum: true })}
              >
                <span className="rank-number">0{index + 1}</span>
                <div>
                  <span className="maximum-card-name">{card.name}</span>
                  <small>
                    월 {won(card.maximumSpend)} 사용 · 순혜택{" "}
                    {won(card.maximumBenefit)}
                  </small>
                </div>
                <strong>{percent(card.maximumRate)}</strong>
                <ChevronRight size={18} />
              </button>
            ))}
          </div>
          <p className="caption">
            월 30~120만원 소비 예시 · 지정 가맹점과 모든 혜택 조건 충족 · 연회비
            반영
          </p>
        </section>
      )}

      <section
        className="discovery-section"
        id="find"
        ref={formRef}
        aria-labelledby="find-heading"
      >
        <div className="section-heading">
          <div>
            <p className="eyebrow">나에게 남는 혜택</p>
            <h2 id="find-heading">
              {compare
                ? "고민되는 카드, 나란히."
                : personal
                  ? "내 소비를 바꾸지 않는 카드."
                  : "좋은 카드보다, 내게 좋은 카드."}
            </h2>
          </div>
          <span className="quiet-label">
            <CheckCheck size={16} /> 연회비까지 반영
          </span>
        </div>
        <div className="discovery-layout">
          <aside className="preferences" aria-label="카드 선택 조건">
            <fieldset>
              <legend>한 달에 얼마나 쓰세요?</legend>
              <div className="amount-options">
                {amounts.map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    aria-pressed={input.total === amount}
                    onClick={() => void refresh({ ...input, total: amount })}
                  >
                    {amount / 10000}
                    <small>만</small>
                  </button>
                ))}
              </div>
              <label className="custom-amount">
                <span>직접 입력</span>
                <input
                  aria-label="월 카드 사용액 만원"
                  type="number"
                  min="1"
                  max="1000"
                  step="0.1"
                  value={input.total / 10000 || ""}
                  onChange={(event) =>
                    setInput((current) => ({
                      ...current,
                      total: Math.round(Number(event.target.value) * 10000),
                    }))
                  }
                />
                <span>만원</span>
              </label>
            </fieldset>
            <fieldset>
              <legend>어떻게 쓰고 싶으세요?</legend>
              <div
                className="usage-options"
                role="group"
                aria-label="사용 방식"
              >
                <button
                  type="button"
                  aria-pressed={input.mode === "easy"}
                  onClick={() => void refresh({ ...input, mode: "easy" })}
                >
                  <Heart size={19} />
                  <span>
                    <b>편하게 쓰기</b>
                    <small>실적 관리 없이, 어디서나</small>
                  </span>
                  <span className="radio-mark" />
                </button>
                <button
                  type="button"
                  aria-pressed={input.mode === "benefit"}
                  onClick={() => {
                    setExpanded(true);
                    void refresh({ ...input, mode: "benefit" });
                  }}
                >
                  <Sparkles size={19} />
                  <span>
                    <b>생활비 혜택 챙기기</b>
                    <small>평소 쓰는 곳에서 더 받기</small>
                  </span>
                  <span className="radio-mark" />
                </button>
              </div>
            </fieldset>
            <div className="filter-pair">
              <label>
                카드 종류
                <select
                  value={input.cardType}
                  onChange={(event) =>
                    void refresh({
                      ...input,
                      cardType: event.target
                        .value as DiscoveryInput["cardType"],
                    })
                  }
                >
                  <option value="all">전체</option>
                  <option value="credit">신용</option>
                  <option value="check">체크</option>
                </select>
              </label>
              <label>
                연회비
                <select
                  value={input.maxAnnualFee}
                  onChange={(event) =>
                    void refresh({
                      ...input,
                      maxAnnualFee: Number(event.target.value),
                    })
                  }
                >
                  <option value="1000000">상관없음</option>
                  <option value="0">없음</option>
                  <option value="10000">1만원 이하</option>
                  <option value="20000">2만원 이하</option>
                  <option value="30000">3만원 이하</option>
                </select>
              </label>
            </div>
            <button
              type="button"
              className="expense-toggle"
              aria-expanded={expanded}
              onClick={() => setExpanded(!expanded)}
            >
              <SlidersHorizontal size={17} /> 내 소비 더하기{" "}
              <ChevronDown size={17} className={expanded ? "rotate-180" : ""} />
            </button>
            {expanded && (
              <div className="expense-editor">
                <div className="expense-categories">
                  {expenseOptions.map((option) => (
                    <button
                      key={option.category}
                      type="button"
                      aria-pressed={input.expenses.some(
                        (item) => item.category === option.category,
                      )}
                      onClick={() => toggleExpense(option.category)}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                {input.expenses.map((expense) => {
                  const option = expenseOptions.find(
                    (item) => item.category === expense.category,
                  )!;
                  return (
                    <fieldset className="expense-row" key={expense.category}>
                      <legend>{option.label}</legend>
                      <div className="expense-inputs">
                        <label>
                          월 사용액
                          <div className="unit-input">
                            <input
                              type="number"
                              min="0"
                              step="0.1"
                              value={expense.amount / 10000 || ""}
                              placeholder="0"
                              aria-label={`${option.label} 월 사용액 만원`}
                              onChange={(event) =>
                                editExpense(expense.category, {
                                  amount: Math.round(
                                    Number(event.target.value) * 10000,
                                  ),
                                })
                              }
                            />
                            <span>만원</span>
                          </div>
                        </label>
                        {!["telecom", "transport"].includes(
                          expense.category,
                        ) && (
                          <label>
                            서로 다른 날 결제
                            <div className="unit-input">
                              <input
                                type="number"
                                min="1"
                                max={expense.weekend ? 8 : 28}
                                value={expense.count}
                                aria-label={`${option.label} 결제 횟수`}
                                onChange={(event) =>
                                  editExpense(expense.category, {
                                    count: Number(event.target.value),
                                  })
                                }
                              />
                              <span>회</span>
                            </div>
                          </label>
                        )}
                      </div>
                      {option.merchants.length > 1 && (
                        <label className="merchant-field">
                          주로 쓰는 곳
                          <select
                            value={expense.merchant}
                            onChange={(event) =>
                              editExpense(expense.category, {
                                merchant: event.target.value,
                              })
                            }
                          >
                            {option.merchants.map((merchant) => (
                              <option key={merchant}>{merchant}</option>
                            ))}
                          </select>
                        </label>
                      )}
                      {["shopping", "coffee", "dining", "taxi"].includes(
                        expense.category,
                      ) && (
                        <label className="check-label">
                          <input
                            type="checkbox"
                            checked={expense.night}
                            onChange={(event) =>
                              editExpense(expense.category, {
                                night: event.target.checked,
                              })
                            }
                          />{" "}
                          해당 금액 모두 밤 9시~아침 9시 결제
                        </label>
                      )}
                      {["mart", "fuel"].includes(expense.category) && (
                        <label className="check-label">
                          <input
                            type="checkbox"
                            checked={expense.weekend}
                            onChange={(event) =>
                              editExpense(expense.category, {
                                weekend: event.target.checked,
                              })
                            }
                          />{" "}
                          해당 금액 모두 토·일요일 결제
                        </label>
                      )}
                      {expense.category === "telecom" && (
                        <label className="check-label">
                          <input
                            type="checkbox"
                            checked={expense.autopay}
                            onChange={(event) =>
                              editExpense(expense.category, {
                                autopay: event.target.checked,
                              })
                            }
                          />{" "}
                          이 카드로 자동납부
                        </label>
                      )}
                    </fieldset>
                  );
                })}
                <div className="expense-total">
                  <span>나머지 일반 결제</span>
                  <b>{won(Math.max(0, input.total - assigned))}</b>
                </div>
                <p className="caption">
                  입력한 소비처·횟수 기준의 예상 금액입니다. 나머지는 일반 국내
                  결제로 반영하며 세금·상품권 등은 별도입니다.
                </p>
              </div>
            )}
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <button
              type="button"
              className="primary-action apply-button"
              disabled={
                pending || assigned > input.total || input.total < 10000
              }
              onClick={() => void refresh(input)}
            >
              {pending ? "혜택 계산 중" : "이 조건으로 비교"}
              <ArrowRight size={18} />
            </button>
            {assigned > input.total && (
              <p className="form-error" role="alert">
                소비 합계가 월 사용액보다 {won(assigned - input.total)} 큽니다.
              </p>
            )}
          </aside>

          <div className="choice-results" aria-busy={pending}>
            <div className="results-heading">
              <div>
                <h3>
                  {result.input.mode === "easy"
                    ? "신경 덜 쓰고, 꾸준히 받기"
                    : result.input.mode === "maximum"
                      ? "조건 충족 시 최대 피킹률 순위"
                      : "내 생활비에서 더 많이 받기"}
                </h3>
                <p>
                  {result.input.mode === "maximum"
                    ? "카드마다 가장 유리한 사용액이 다릅니다."
                    : `월 ${won(result.input.total)} 기준 · 예상 순혜택 순`}
                </p>
              </div>
              <CreditCard size={22} />
            </div>
            {isDirty && (
              <p className="pending-note" role="status">
                {pending
                  ? "새 조건으로 혜택을 계산하고 있어요."
                  : "수정한 소비는 ‘이 조건으로 비교’를 누르면 반영돼요."}
              </p>
            )}
            {!result.cards.length ? (
              <div className="empty-state">
                <CreditCard size={32} />
                <h3>지금 조건에 맞는 카드가 없어요</h3>
                <p>
                  연회비나 카드 종류를 바꾸거나 생활비 혜택까지 비교해보세요.
                </p>
                <button
                  type="button"
                  className="secondary-action"
                  onClick={() =>
                    void refresh({
                      ...input,
                      cardType: "all",
                      maxAnnualFee: 1000000,
                      mode: "benefit",
                    })
                  }
                >
                  전체 카드 비교 <ArrowRight size={16} />
                </button>
              </div>
            ) : (
              <div className="choice-list">
                {result.cards.map((card, index) => (
                  <article
                    className={`choice-row ${index === 0 ? "leading-choice" : ""}`}
                    key={card.slug}
                  >
                    <div className="choice-topline">
                      <span className="choice-rank">
                        {String(index + 1).padStart(2, "0")}
                        <span>
                          {index === 0
                            ? result.input.mode === "maximum"
                              ? "최대 피킹률 1위"
                              : "현재 조건에서 가장 유리"
                            : card.easeLabel}
                        </span>
                      </span>
                      <button
                        type="button"
                        className={`icon-button compare-toggle ${compareIds.includes(card.slug) ? "selected" : ""}`}
                        title={
                          compareIds.includes(card.slug)
                            ? "비교에서 빼기"
                            : "비교에 담기"
                        }
                        aria-label={`${card.name} 비교 ${compareIds.includes(card.slug) ? "해제" : "선택"}`}
                        aria-pressed={compareIds.includes(card.slug)}
                        disabled={
                          !compareIds.includes(card.slug) &&
                          compareIds.length >= 3
                        }
                        onClick={() => toggleCompare(card.slug)}
                      >
                        {compareIds.includes(card.slug) ? (
                          <Check size={19} />
                        ) : (
                          <Plus size={19} />
                        )}
                      </button>
                    </div>
                    <button
                      type="button"
                      className="choice-main"
                      aria-label={`${card.name} 상세 보기`}
                      onClick={() =>
                        setSelected({
                          card,
                          maximum: result.input.mode === "maximum",
                        })
                      }
                    >
                      <CardThumbnail card={card} />
                      <div className="choice-identity">
                        <p>
                          {card.issuer} ·{" "}
                          {card.cardType === "check" ? "체크" : "신용"}
                        </p>
                        <h4>{card.name}</h4>
                        <span>
                          {card.simple
                            ? "전월실적 없음 · 기본 할인 월 한도 없음"
                            : card.bestFor[0]}
                        </span>
                      </div>
                      <div className="choice-rate">
                        <small>
                          {result.input.mode === "maximum"
                            ? "조건 충족 시 최대"
                            : "예상 피킹률"}
                        </small>
                        <strong>
                          {percent(
                            result.input.mode === "maximum"
                              ? card.maximumRate
                              : card.pickingRate,
                          )}
                        </strong>
                      </div>
                    </button>
                    <div className="choice-money">
                      <span>
                        월 순혜택{" "}
                        <b>
                          {won(
                            result.input.mode === "maximum"
                              ? card.maximumBenefit
                              : card.netBenefit,
                          )}
                        </b>
                      </span>
                      <span>
                        연회비 <b>{won(card.annualFee)}</b>
                      </span>
                      <span>
                        {result.input.mode === "maximum"
                          ? "필요 사용액"
                          : "연간 순혜택"}{" "}
                        <b>
                          {won(
                            result.input.mode === "maximum"
                              ? card.maximumSpend
                              : card.annualBenefit,
                          )}
                        </b>
                      </span>
                    </div>
                    {result.input.mode !== "maximum" &&
                      !card.simple &&
                      card.comparisonDelta !== null &&
                      card.comparisonDelta > 0 && (
                        <p className="comparison-insight">
                          <TrendingUp size={15} /> 무실적 카드 대비 월{" "}
                          {won(card.comparisonDelta)} 더 받아요
                        </p>
                      )}
                    <div className="choice-bottom">
                      <div className="tag-list">
                        <span
                          className={`tag ${card.simple ? "green" : "amber"}`}
                        >
                          {card.easeLabel}
                        </span>
                        {card.conditions.slice(0, 2).map((condition) => (
                          <span className="tag" key={condition}>
                            {condition}
                          </span>
                        ))}
                      </div>
                      <button
                        type="button"
                        className="text-action"
                        onClick={() =>
                          setSelected({
                            card,
                            maximum: result.input.mode === "maximum",
                          })
                        }
                      >
                        혜택·조건 <ChevronRight size={16} />
                      </button>
                    </div>
                    {result.input.mode !== "maximum" &&
                      card.performanceGap > 0 && (
                        <p className="row-warning">
                          다음 달 실적 {won(card.performanceGap)} 부족
                        </p>
                      )}
                    {result.input.mode !== "maximum" &&
                      card.feeShortfall > 0 && (
                        <p className="row-warning">
                          현재 혜택으로는 월 연회비 {won(card.feeShortfall)}를
                          회수하지 못해요.
                        </p>
                      )}
                  </article>
                ))}
              </div>
            )}
            <p className="results-footnote">
              신규 발급 이벤트는 제외했어요. 할인·적립과 연회비를 함께 반영한
              예상값으로, 실제 결제 내역에 따라 달라질 수 있어요.
            </p>
            {result.input.expenses.length === 0 &&
              result.input.mode !== "maximum" && (
                <button
                  className="refine-prompt"
                  type="button"
                  onClick={() => {
                    setExpanded(true);
                    formRef.current?.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  <SlidersHorizontal size={20} />
                  <span>
                    <b>자주 쓰는 곳이 있다면?</b>
                    <small>쇼핑·통신·교통비를 더해 내 혜택 확인하기</small>
                  </span>
                  <ArrowRight size={18} />
                </button>
              )}
          </div>
        </div>
      </section>
      {visibleCompare.length > 0 && (
        <div className="compare-dock">
          <span>
            <CheckCheck size={18} /> {visibleCompare.length}장 선택
          </span>
          <button
            type="button"
            className="primary-action"
            disabled={visibleCompare.length < 2}
            onClick={() => setComparisonOpen(true)}
          >
            나란히 비교 <Equal size={18} />
          </button>
          <button
            type="button"
            className="icon-button"
            title="선택 지우기"
            aria-label="비교 선택 지우기"
            onClick={() => setCompareIds([])}
          >
            <X size={18} />
          </button>
        </div>
      )}
      {selected && (
        <Sheet title="카드 혜택" onClose={() => setSelected(null)}>
          <CardChoiceDetails card={selected.card} maximum={selected.maximum} />
        </Sheet>
      )}
      {comparisonOpen && (
        <Sheet title="카드 비교" onClose={() => setComparisonOpen(false)}>
          <CompareChoices cards={visibleCompare} />
        </Sheet>
      )}
    </>
  );
}
