import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Header } from "@/components/Header";
import { AvocadoMascot } from "@/components/AvocadoMark";
import { CardExplorer } from "@/components/CardExplorer";
import { discoverCards } from "@/lib/card-discovery";

export default function HomePage() {
  return (
    <>
      <Header />
      <main className="site-main">
        <section className="home-intro">
          <div className="intro-top">
            <span className="eyebrow">아보카드 · 아는 만큼 보이는 카드</span>
            <AvocadoMascot className="intro-mascot" />
          </div>
          <h1>
            쓰는 건 그대로.
            <br />
            <span>남는 혜택은 더 크게.</span>
          </h1>
          <p>
            얼마나 할인되는지, 얼마나 신경 써야 하는지.
            <br className="desktop-break" /> 내 일상에 맞는 카드 한 장을
            찾아보세요.
          </p>
          <a className="intro-link" href="#find">
            평소처럼 쓸 카드 찾기 <ArrowDownRight size={20} />
          </a>
          <div className="intro-note">
            <span>카드 광고보다 솔직하게</span>
            <ArrowUpRight size={16} />
          </div>
        </section>
        <CardExplorer initial={discoverCards()} />
        <section className="decision-principles">
          <div>
            <span>01</span>
            <h2>할인율보다 남는 돈</h2>
            <p>한도와 연회비를 빼고, 내 지갑에 실제로 남을 금액을 봅니다.</p>
          </div>
          <div>
            <span>02</span>
            <h2>평소 소비 안에서</h2>
            <p>혜택을 받으려고 더 쓰는 대신, 이미 쓰는 돈에서 찾습니다.</p>
          </div>
          <div>
            <span>03</span>
            <h2>지킬 수 있는 조건</h2>
            <p>결제 시간과 가맹점까지 챙길 가치가 있는지 함께 비교합니다.</p>
          </div>
        </section>
        <section id="faq" className="faq-section">
          <div>
            <p className="eyebrow">궁금할 수 있어요</p>
            <h2>
              카드 고르기,
              <br />
              조금 더 쉽게.
            </h2>
          </div>
          <div>
            {[
              [
                "피킹률은 할인율과 어떻게 다른가요?",
                "피킹률은 전체 카드 사용액에 비해 실제로 남는 혜택의 비율이에요. 특정 업종의 할인율과 달리, 할인한도와 연회비 부담까지 함께 봅니다.",
              ],
              [
                "최대 피킹률이 가장 높은 카드가 좋은가요?",
                "지정 가맹점과 결제 조건을 모두 맞출 수 있을 때 유리한 수치예요. 평소 소비와 다르면 무실적 카드가 더 편하고 유리할 수 있어요.",
              ],
              [
                "소비를 입력하지 않으면 어떻게 되나요?",
                "선택한 월 사용액 전체를 일반 국내 가맹점 결제로 봅니다. 쇼핑·교통·통신비를 추가하면 해당 소비를 반영한 예상 혜택으로 바뀝니다.",
              ],
              [
                "할인받은 결제도 전월실적에 포함되나요?",
                "카드마다 달라요. 전액 포함되기도 하고 일부만 인정되거나 제외되기도 합니다. 카드 상세에서 다음 달 인정실적과 부족분을 확인할 수 있어요.",
              ],
              [
                "입력한 소비는 저장되나요?",
                "이번 비교에만 사용하고 별도로 저장하지 않습니다. 카드번호나 개인 신용정보도 입력할 필요가 없어요.",
              ],
            ].map(([question, answer]) => (
              <details key={question}>
                <summary>
                  {question}
                  <span>+</span>
                </summary>
                <p>{answer}</p>
              </details>
            ))}
          </div>
        </section>
        <footer className="site-footer">
          <b>Avocard</b>
          <span>아는 만큼 보이는 카드</span>
          <a href="#find">
            내 카드 찾기 <ArrowUpRight size={15} />
          </a>
        </footer>
      </main>
    </>
  );
}
