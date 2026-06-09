"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { categoryLabels, BenefitCategory } from "@/data/cards";
import { defaultProfile, SpendingProfile } from "@/lib/calculate";

const fields: BenefitCategory[] = [
  "transport",
  "taxi",
  "fuel",
  "coffee",
  "convenience",
  "delivery",
  "dining",
  "shopping",
  "mart",
  "telecom",
  "ott",
  "medical",
  "education",
  "travel",
  "etc"
];

type SelectGroup = {
  label: string;
  value: string;
  setter: (value: string) => void;
  options: string[];
};

export default function RecommendPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<SpendingProfile>(defaultProfile);
  const [feeSensitivity, setFeeSensitivity] = useState("보통");
  const [performanceLoad, setPerformanceLoad] = useState("60만원까지");
  const [issuer, setIssuer] = useState("상관없음");
  const [cardType, setCardType] = useState("신용");

  const subtotal = useMemo(() => fields.reduce((sum, field) => sum + profile[field], 0), [profile]);
  const selectGroups: SelectGroup[] = [
    { label: "연회비 민감도", value: feeSensitivity, setter: setFeeSensitivity, options: ["낮음", "보통", "높음"] },
    {
      label: "전월실적 부담",
      value: performanceLoad,
      setter: setPerformanceLoad,
      options: ["40만원까지", "60만원까지", "90만원까지"]
    },
    { label: "카드사 선호", value: issuer, setter: setIssuer, options: ["상관없음", "신한", "삼성", "현대", "국민"] },
    { label: "카드 유형", value: cardType, setter: setCardType, options: ["신용", "체크", "상관없음"] }
  ];

  function updateField(field: keyof SpendingProfile, value: string) {
    const number = Number(value.replace(/[^0-9]/g, ""));
    setProfile((current) => ({ ...current, [field]: Number.isFinite(number) ? number : 0 }));
  }

  function submit() {
    const params = new URLSearchParams();
    params.set("total", String(profile.total));
    fields.forEach((field) => params.set(field, String(profile[field])));
    params.set("fee", feeSensitivity);
    params.set("load", performanceLoad);
    params.set("issuer", issuer);
    params.set("type", cardType);
    router.push(`/results?${params.toString()}`);
  }

  return (
    <>
      <Header />
      <main className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
        <section className="grid gap-8 lg:grid-cols-[0.82fr_1.18fr]">
          <div>
            <h1 className="text-5xl font-black leading-tight text-ink">당신의 소비에 맞는 카드는 따로 있습니다</h1>
            <p className="mt-5 text-lg leading-8 text-ink/68">
              월 총 사용액과 카테고리별 지출을 넣으면 실제 피킹률 기준으로 추천합니다. 전월실적 부담, 연회비 민감도,
              브랜드 선호까지 함께 반영하는 경험을 설계했습니다.
            </p>
            <div className="mt-8 rounded-[2rem] bg-ink p-6 text-white shadow-soft">
              <p className="text-sm font-bold text-avocado-200">AI 설명 미리보기</p>
              <p className="mt-3 text-xl font-black leading-8">
                커피, 배달, 대중교통 비중이 높다면 생활밀착형 할인 카드가 유리합니다. 단, 전월실적을 맞추기 위해
                불필요한 소비를 늘리는 카드는 피하는 편이 좋습니다.
              </p>
            </div>
          </div>

          <form
            className="rounded-[2rem] bg-white p-5 shadow-soft md:p-7"
            onSubmit={(event) => {
              event.preventDefault();
              submit();
            }}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="sm:col-span-2">
                <span className="text-sm font-black text-ink">월 총 카드 사용액</span>
                <input
                  value={profile.total}
                  onChange={(event) => updateField("total", event.target.value)}
                  className="focus-ring mt-2 min-h-12 w-full rounded-2xl border border-avocado-900/10 bg-cream px-4 font-black"
                  inputMode="numeric"
                />
              </label>
              {fields.map((field) => (
                <label key={field}>
                  <span className="text-sm font-black text-ink/70">{categoryLabels[field]}</span>
                  <input
                    value={profile[field]}
                    onChange={(event) => updateField(field, event.target.value)}
                    className="focus-ring mt-2 min-h-12 w-full rounded-2xl border border-avocado-900/10 bg-white px-4 font-bold"
                    inputMode="numeric"
                  />
                </label>
              ))}
            </div>

            <div className="mt-7 grid gap-4 md:grid-cols-4">
              {selectGroups.map((group) => (
                <label key={group.label}>
                  <span className="text-sm font-black text-ink/70">{group.label}</span>
                  <select
                    value={group.value}
                    onChange={(event) => group.setter(event.target.value)}
                    className="focus-ring mt-2 min-h-12 w-full rounded-2xl border border-avocado-900/10 bg-cream px-3 font-bold"
                  >
                    {group.options.map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>
                </label>
              ))}
            </div>

            <div className="mt-7 flex flex-col justify-between gap-4 rounded-3xl bg-avocado-100 p-5 sm:flex-row sm:items-center">
              <div>
                <p className="text-sm font-bold text-ink/56">카테고리 합계</p>
                <p className="text-2xl font-black text-ink">{subtotal.toLocaleString("ko-KR")}원</p>
              </div>
              <button
                type="submit"
                className="focus-ring min-h-12 rounded-full bg-ink px-6 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-avocado-800"
              >
                AI 추천 결과 보기
              </button>
            </div>
          </form>
        </section>
      </main>
    </>
  );
}
