import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Target,
  Upload,
  History,
  User,
  Cloud,
  Rocket,
  Loader2,
  Check,
  Copy,
  Download,
  Mail,
  FileVideo,
  Inbox,
  Printer,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Think:it Pro — AI 유튜브 썸네일·제목 컨설팅" },
      {
        name: "description",
        content:
          "영상·음성 분석 기반 유튜브 썸네일·제목 자동 생성 AI 컨설팅 서비스",
      },
    ],
  }),
  component: Index,
});

type View = "login" | "upload" | "loading" | "results" | "history";

const RED = "#A70100";
const INK = "#111111";
const BG = "#F5F5F5";
const BORDER = "#E5E5E5";
const MUTED = "#888888";

function Index() {
  const [view, setView] = useState<View>("login");

  return (
    <div className="min-h-screen bg-white font-sans" style={{ color: INK }}>
      {view === "login" && <LoginView onContinue={() => setView("upload")} />}
      {view === "upload" && (
        <Shell view={view} setView={setView}>
          <UploadView onAnalyze={() => setView("loading")} />
        </Shell>
      )}
      {view === "loading" && (
        <Shell view={view} setView={setView}>
          <LoadingView onDone={() => setView("results")} />
        </Shell>
      )}
      {view === "results" && (
        <Shell view={view} setView={setView}>
          <ResultsView />
        </Shell>
      )}
      {view === "history" && (
        <Shell view={view} setView={setView}>
          <HistoryView onOpen={() => setView("results")} />
        </Shell>
      )}
    </div>
  );
}

/* ---------------- Shell ---------------- */

function Shell({
  view,
  setView,
  children,
}: {
  view: View;
  setView: (v: View) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <header
        className="flex items-center justify-between border-b bg-white px-4 py-3 sm:px-6"
        style={{ borderColor: BORDER }}
      >
        <div className="flex items-center gap-2">
          <Target className="h-6 w-6" style={{ color: RED }} />
          <span className="text-lg font-bold" style={{ color: INK }}>
            Think:it Pro
          </span>
        </div>
        <button
          className="flex h-9 w-9 items-center justify-center rounded-full text-white"
          style={{ backgroundColor: RED }}
          onClick={() => setView("login")}
          aria-label="user"
        >
          <User className="h-4 w-4" />
        </button>
      </header>

      <div className="flex flex-1">
        <aside
          className="hidden w-56 shrink-0 border-r bg-white p-4 sm:block"
          style={{ borderColor: BORDER }}
        >
          <nav className="flex flex-col gap-1">
            <SideLink
              icon={<Upload className="h-4 w-4" />}
              label="업로드"
              active={view === "upload" || view === "loading"}
              onClick={() => setView("upload")}
            />
            <SideLink
              icon={<History className="h-4 w-4" />}
              label="분석 히스토리"
              active={view === "history"}
              onClick={() => setView("history")}
            />
            <SideLink
              icon={<User className="h-4 w-4" />}
              label="마이페이지"
              active={false}
              onClick={() => {}}
            />
          </nav>
        </aside>

        <nav
          className="fixed bottom-0 left-0 right-0 z-10 flex justify-around border-t bg-white py-2 sm:hidden"
          style={{ borderColor: BORDER }}
        >
          <MobileLink
            icon={<Upload className="h-5 w-5" />}
            label="업로드"
            active={view === "upload" || view === "loading"}
            onClick={() => setView("upload")}
          />
          <MobileLink
            icon={<History className="h-5 w-5" />}
            label="히스토리"
            active={view === "history"}
            onClick={() => setView("history")}
          />
          <MobileLink
            icon={<User className="h-5 w-5" />}
            label="마이"
            active={false}
            onClick={() => {}}
          />
        </nav>

        <main
          className="flex-1 overflow-x-hidden p-4 pb-20 sm:p-8 sm:pb-8"
          style={{ backgroundColor: BG }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}

function SideLink({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 px-3 py-2 text-left text-sm font-medium transition-colors"
      style={{
        color: active ? RED : INK,
        borderLeft: active ? `3px solid ${RED}` : "3px solid transparent",
        backgroundColor: active ? BG : "transparent",
      }}
    >
      {icon}
      {label}
    </button>
  );
}

function MobileLink({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-0.5 text-xs"
      style={{ color: active ? RED : MUTED }}
    >
      {icon}
      {label}
    </button>
  );
}

/* ---------------- View 1: Login ---------------- */

function LoginView({ onContinue }: { onContinue: () => void }) {
  const [tab, setTab] = useState<"login" | "signup">("login");

  return (
    <div
      className="flex min-h-screen items-center justify-center px-4 py-10"
      style={{ backgroundColor: BG }}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm"
        style={{ border: `1px solid ${BORDER}` }}
      >
        <div className="mb-6 flex flex-col items-center gap-2">
          <div className="flex items-center gap-2">
            <Target className="h-7 w-7" style={{ color: RED }} />
            <h1 className="text-2xl font-bold" style={{ color: INK }}>
              Think:it Pro
            </h1>
          </div>
          <p className="text-center text-sm" style={{ color: MUTED }}>
            영상·음성 분석 기반 유튜브 썸네일·제목 자동 생성 AI 컨설팅
          </p>
        </div>

        <div className="mb-6 flex rounded-lg p-1" style={{ backgroundColor: BG }}>
          {(["login", "signup"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="flex-1 rounded-md py-2 text-sm font-medium transition-colors"
              style={{
                backgroundColor: tab === t ? "white" : "transparent",
                color: tab === t ? INK : MUTED,
                boxShadow: tab === t ? "0 1px 2px rgba(0,0,0,0.05)" : "none",
              }}
            >
              {t === "login" ? "로그인" : "회원가입"}
            </button>
          ))}
        </div>

        <form
          className="flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            onContinue();
          }}
        >
          <Input type="email" placeholder="이메일" />
          <Input type="password" placeholder="비밀번호" />
          {tab === "signup" && (
            <Input type="password" placeholder="비밀번호 확인" />
          )}
          <button
            type="submit"
            className="mt-2 rounded-lg py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: RED }}
          >
            시작하기
          </button>
        </form>
      </div>
    </div>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full rounded-lg bg-white px-4 py-2.5 text-sm outline-none transition-colors focus:border-[#A70100] focus:ring-2 focus:ring-[#A70100]/20"
      style={{ border: `1px solid ${BORDER}` }}
    />
  );
}

/* ---------------- View 2: Upload ---------------- */

function UploadView({ onAnalyze }: { onAnalyze: () => void }) {
  const [file, setFile] = useState<string | null>(null);
  const [category, setCategory] = useState("Science & Technology");
  const [request, setRequest] = useState("");

  return (
    <div className="mx-auto max-w-3xl">
      <h2 className="mb-6 text-2xl font-bold" style={{ color: INK }}>
        새 영상 분석
      </h2>

      <button
        onClick={() => setFile("테스트영상.mp4")}
        className="flex w-full flex-col items-center gap-3 rounded-xl border-2 border-dashed bg-white p-10 transition-colors hover:border-[#A70100]"
        style={{ borderColor: file ? RED : "#D1D5DB" }}
      >
        <Cloud className="h-12 w-12" style={{ color: RED }} />
        {file ? (
          <div className="flex items-center gap-2 text-sm font-medium" style={{ color: INK }}>
            <FileVideo className="h-4 w-4" />
            {file}
          </div>
        ) : (
          <p className="text-sm" style={{ color: MUTED }}>
            MP4 파일을 드래그하거나 클릭해서 업로드
          </p>
        )}
      </button>

      <div
        className="mt-6 flex flex-col gap-4 rounded-xl bg-white p-6 shadow-sm"
        style={{ border: `1px solid ${BORDER}` }}
      >
        <div>
          <label className="mb-1.5 block text-sm font-medium" style={{ color: INK }}>
            카테고리 선택
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-lg bg-white px-4 py-2.5 text-sm outline-none focus:border-[#A70100]"
            style={{ border: `1px solid ${BORDER}` }}
          >
            {[
              "Science & Technology",
              "Entertainment",
              "Gaming",
              "Education",
              "Cooking",
              "Travel",
              "Beauty & Fashion",
            ].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium" style={{ color: INK }}>
            AI 맞춤 요청 (선택사항)
          </label>
          <textarea
            value={request}
            onChange={(e) => setRequest(e.target.value)}
            rows={3}
            placeholder="예: 배경은 우주 느낌으로, 밝은 톤으로 제작해주세요"
            className="w-full resize-none rounded-lg bg-white px-4 py-2.5 text-sm outline-none focus:border-[#A70100]"
            style={{ border: `1px solid ${BORDER}` }}
          />
        </div>
      </div>

      <button
        onClick={onAnalyze}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl py-4 text-base font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
        style={{ backgroundColor: RED }}
      >
        AI 분석 시작 <Rocket className="h-5 w-5" />
      </button>
    </div>
  );
}

/* ---------------- View 3: Loading ---------------- */

const STEPS = [
  "영상 전처리 중",
  "음성 분석 중",
  "트렌드 분석 중",
  "AI 콘텐츠 생성 중",
];

function LoadingView({ onDone }: { onDone: () => void }) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (active >= STEPS.length) {
      const t = setTimeout(onDone, 500);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setActive(active + 1), 1500);
    return () => clearTimeout(t);
  }, [active, onDone]);

  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center justify-center py-16">
      <h2 className="mb-2 text-xl font-bold" style={{ color: INK }}>
        AI가 영상을 분석하고 있습니다
      </h2>
      <p className="mb-10 text-sm" style={{ color: MUTED }}>
        평균 소요 시간: 1분 30초 이내
      </p>

      <div
        className="w-full rounded-2xl bg-white p-6 shadow-sm sm:p-10"
        style={{ border: `1px solid ${BORDER}` }}
      >
        <div className="relative flex items-center justify-between">
          <div className="absolute left-5 right-5 top-5 h-0.5" style={{ backgroundColor: BORDER }}>
            <div
              className="h-full transition-all duration-500"
              style={{
                width: `${(Math.min(active, STEPS.length - 1) / (STEPS.length - 1)) * 100}%`,
                backgroundColor: RED,
              }}
            />
          </div>

          {STEPS.map((label, i) => {
            const done = i < active;
            const current = i === active;
            return (
              <div key={label} className="relative z-10 flex flex-1 flex-col items-center gap-2">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-full border-2 bg-white"
                  style={{
                    borderColor: done || current ? RED : "#D1D5DB",
                  }}
                >
                  {done ? (
                    <Check className="h-5 w-5" style={{ color: RED }} />
                  ) : current ? (
                    <Loader2 className="h-5 w-5 animate-spin" style={{ color: RED }} />
                  ) : (
                    <span className="text-xs" style={{ color: MUTED }}>{i + 1}</span>
                  )}
                </div>
                <span
                  className="text-center text-[11px] font-medium sm:text-xs"
                  style={{ color: done || current ? INK : MUTED }}
                >
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ---------------- View 4: Results ---------------- */

function ResultsView() {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <h2 className="text-2xl font-bold" style={{ color: INK }}>
        분석 결과
      </h2>
      <TrendScoreCard />
      <TitlesCard />
      <ThumbnailsCard />
      <ReportCard />
    </div>
  );
}

function TrendScoreCard() {
  const score = 74;
  const radius = 70;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (score / 100) * circ;

  return (
    <div
      className="rounded-2xl bg-white p-6 shadow-sm sm:p-8"
      style={{ border: `1px solid ${BORDER}` }}
    >
      <h3 className="mb-6 text-lg font-bold" style={{ color: INK }}>
        트렌드 점수
      </h3>
      <div className="flex flex-col items-center gap-8 md:flex-row md:items-center md:gap-10">
        <div className="flex shrink-0 flex-col items-center gap-3">
          <div className="relative h-44 w-44">
            <svg viewBox="0 0 180 180" className="h-full w-full -rotate-90">
              <circle cx="90" cy="90" r={radius} stroke="#F0F0F0" strokeWidth="14" fill="none" />
              <circle
                cx="90"
                cy="90"
                r={radius}
                stroke={RED}
                strokeWidth="14"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={circ}
                strokeDashoffset={offset}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-bold" style={{ color: INK }}>
                {score}
              </span>
              <span className="text-xs" style={{ color: MUTED }}>/ 100</span>
            </div>
          </div>
          <p className="text-sm font-medium" style={{ color: INK }}>종합 트렌드 적합도</p>
          <span
            className="rounded-full px-3 py-1 text-xs font-semibold text-white"
            style={{ backgroundColor: RED }}
          >
            Good Potential
          </span>
        </div>

        <div className="flex flex-1 flex-col gap-4 self-stretch">
          <SubScore label="제목 키워드 적합도" value={78} />
          <SubScore label="시각적 트렌드 부합도" value={71} />
          <SubScore label="콘텐츠 주제 관련성" value={73} />
          <div className="mt-auto flex flex-wrap justify-end gap-2 pt-2">
            <span
              className="rounded-full px-3 py-1 text-xs font-medium"
              style={{ backgroundColor: BG, color: INK }}
            >
              Coverage 64%
            </span>
            <span
              className="rounded-full px-3 py-1 text-xs font-medium text-white"
              style={{ backgroundColor: RED }}
            >
              Novelty 72%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function SubScore({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs">
        <span style={{ color: MUTED }}>{label}</span>
        <span className="font-semibold" style={{ color: INK }}>
          {value} / 100
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full" style={{ backgroundColor: BG }}>
        <div
          className="h-full rounded-full"
          style={{ width: `${value}%`, backgroundColor: RED }}
        />
      </div>
    </div>
  );
}

const TITLES = [
  {
    tag: "강렬 클릭 유도형",
    title: "행성들은 왜 모두 동글까요? 그 비밀을 밝혀봅니다!",
    why: "호기심을 자극하여 시청자가 답을 찾고 싶도록 유도합니다",
  },
  {
    tag: "감성 스토리형",
    title: "행성들이 동글게 변하는 과정과 이유",
    why: "과학적으로 구체적인 정보를 제공하여 문제 해결에 초점을 맞춥니다",
  },
  {
    tag: "깔끔 정보형",
    title: "행성과 소행성, 그들의 놀라운 차이점은?",
    why: "행성과 소행성의 차이를 강력하게 부각시켜 관심을 끌 수 있습니다",
  },
];

function TitlesCard() {
  const [copied, setCopied] = useState<number | null>(null);
  return (
    <div
      className="rounded-2xl bg-white p-6 shadow-sm sm:p-8"
      style={{ border: `1px solid ${BORDER}` }}
    >
      <h3 className="mb-4 text-lg font-bold" style={{ color: INK }}>
        클릭을 부르는 제목 추천
      </h3>
      <div className="flex flex-col gap-3">
        {TITLES.map((t, i) => (
          <div
            key={i}
            className="rounded-lg p-4"
            style={{ backgroundColor: BG }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <span
                  className="inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold text-white"
                  style={{ backgroundColor: RED }}
                >
                  {t.tag}
                </span>
                <p className="mt-2 text-sm font-semibold" style={{ color: INK }}>
                  {t.title}
                </p>
                <p className="mt-1.5 text-xs" style={{ color: MUTED }}>
                  <span className="font-semibold">WHY: </span>
                  {t.why}
                </p>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(t.title);
                  setCopied(i);
                  setTimeout(() => setCopied(null), 1200);
                }}
                className="rounded-md p-2 transition-colors hover:bg-white"
                style={{ color: copied === i ? RED : MUTED }}
                aria-label="copy"
              >
                {copied === i ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const THUMBS = [
  {
    label: "강렬한 클릭 유도형",
    text: "왜 동글까?",
    gradient: "linear-gradient(135deg, #A70100 0%, #5B0000 100%)",
    prompt:
      "Vibrant space scene, glowing planet, bold yellow text '왜 동글까?', high contrast, click-bait style YouTube thumbnail",
  },
  {
    label: "감성 스토리형",
    text: "행성의 비밀",
    gradient: "linear-gradient(135deg, #333333 0%, #111111 100%)",
    prompt:
      "Soft pastel space illustration, planet evolution, elegant serif overlay '행성의 비밀', cinematic mood",
  },
  {
    label: "깔끔한 정보형",
    text: "행성 vs 소행성",
    gradient: "linear-gradient(135deg, #888888 0%, #444444 100%)",
    prompt:
      "Clean infographic style thumbnail, side-by-side planet vs asteroid, minimalist sans-serif text '행성 vs 소행성'",
  },
];

function ThumbnailsCard() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  return (
    <div
      className="rounded-2xl bg-white p-6 shadow-sm sm:p-8"
      style={{ border: `1px solid ${BORDER}` }}
    >
      <h3 className="text-lg font-bold" style={{ color: INK }}>
        AI 완성형 썸네일 (텍스트 포함)
      </h3>
      <p className="mt-1 text-xs" style={{ color: MUTED }}>
        AI가 영상 내용을 요약한 핵심 키워드를 이미지 안에 직접 써넣었습니다
      </p>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {THUMBS.map((t, i) => (
          <div key={i} className="flex flex-col gap-2">
            <div
              className="flex aspect-video items-center justify-center rounded-lg p-3 text-center text-lg font-extrabold text-white shadow-sm"
              style={{ background: t.gradient }}
            >
              {t.text}
            </div>
            <p className="text-xs font-medium" style={{ color: INK }}>{t.label}</p>
            <button
              className="flex items-center justify-center gap-1 rounded-lg py-1.5 text-xs font-semibold transition-colors hover:bg-[#A70100] hover:text-white"
              style={{ border: `1px solid ${RED}`, color: RED }}
            >
              <Download className="h-3.5 w-3.5" /> 다운로드
            </button>
            <button
              onClick={() => setOpenIdx(openIdx === i ? null : i)}
              className="flex items-center justify-center gap-1 text-xs"
              style={{ color: MUTED }}
            >
              프롬프트 보기 {openIdx === i ? "▴" : "▾"}
            </button>
            {openIdx === i && (
              <pre
                className="whitespace-pre-wrap break-words rounded-md p-2 text-[10px] leading-relaxed"
                style={{ backgroundColor: BG, color: INK }}
              >
                {t.prompt}
              </pre>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------- Report (long-form) ---------------- */

function ReportSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col">
      <div className="flex items-center gap-2">
        <span
          className="inline-block h-3 w-3"
          style={{ backgroundColor: RED }}
          aria-hidden
        />
        <h4 className="text-[15px] font-bold" style={{ color: INK }}>
          {title}
        </h4>
      </div>
      <div
        className="mt-2 h-px w-full"
        style={{ backgroundColor: BORDER }}
      />
      <div
        className="mt-4 flex flex-col gap-4 text-[15px]"
        style={{ color: "#333333", lineHeight: 1.8 }}
      >
        {children}
      </div>
    </section>
  );
}

function ReportCard() {
  const [email, setEmail] = useState("");

  return (
    <div
      className="overflow-hidden rounded-2xl bg-white shadow-sm"
      style={{ border: `1px solid ${BORDER}`, borderLeft: `4px solid ${RED}` }}
    >
      <div className="p-6 sm:p-10">
        <div className="mb-8">
          <h3 className="text-[20px] font-bold" style={{ color: INK }}>
            AI 상세 분석 리포트
          </h3>
          <p className="mt-1.5 text-xs sm:text-sm" style={{ color: MUTED }}>
            [카테고리] Science & Technology &nbsp;|&nbsp; 분석일: 2026.05.21 &nbsp;|&nbsp; 종합 점수: 74 / 100
          </p>
        </div>

        <div className="flex flex-col gap-6">
          <ReportSection title="영상 강점">
            <p>
              이 영상은 주제와 핵심 메시지가 명확하며, 시청자에게 과학적 호기심을 전달하는 구성이 잘 갖춰져 있습니다.
              특히 <strong style={{ color: INK }}>행성의 형성 원리</strong>와{" "}
              <strong style={{ color: INK }}>중력의 작용</strong>이라는 두 축을 중심으로 서사가 전개되어,
              시청자가 자연스럽게 내용을 따라갈 수 있는 구조적 장점이 있습니다.
            </p>
            <p>
              또한 <strong style={{ color: INK }}>WPM(분당 단어 수) 분석</strong> 결과, 초반 2분간 발화 속도가
              안정적으로 유지되어 시청자 이탈을 방지하는 데 유리한 템포를 갖추고 있습니다.
            </p>
          </ReportSection>

          <ReportSection title="개선이 필요한 부분">
            <p>
              현재 영상의 제목 키워드는 카테고리 내{" "}
              <strong style={{ color: INK }}>상위 인기 영상의 트렌드 키워드와 약 22% 편차</strong>를 보이고 있습니다.
              특히 ‘행성’, ‘우주’와 같은 범용 키워드 위주로 구성되어 있어, 현재 Science & Technology 카테고리에서
              높은 <strong style={{ color: INK }}>CTR</strong>을 기록 중인 ‘놀라운 사실’, ‘실제로는’, ‘과학이 밝힌’
              등의 어구와 차이가 있습니다.
            </p>
            <p>
              시각적 측면에서는 썸네일의 <strong style={{ color: INK }}>색상 대비</strong>가 카테고리 상위 영상 대비
              낮게 측정되었으며, 텍스트 배치가 중앙에 집중되어 있어 모바일 피드에서 시인성이 떨어질 수 있습니다.
            </p>
          </ReportSection>

          <ReportSection title="구체적 개선 방향">
            <p>
              <strong style={{ color: INK }}>훅 구간</strong>을 영상 초반 8초 이내로 재구성하고, 핵심 질문을
              오프닝에서 먼저 제시하는 방식을 권장합니다. 예를 들어 ‘행성이 동글다는 사실, 당신은 왜 그렇다고
              생각하시나요?’와 같이 시청자의 즉각적 반응을 유도하는 문장으로 시작하면 이탈률을 줄이는 데
              효과적입니다.
            </p>
            <p>
              제목 구성에서는 의문문 형식(현재 카테고리 내 인기 영상의{" "}
              <strong style={{ color: INK }}>38%</strong>가 채택)을 적극 활용하고, 숫자 포함 패턴(예: ‘3가지 이유’,
              ‘10초 안에 이해하는’)을 결합하면 <strong style={{ color: INK }}>클릭률 향상</strong>을 기대할 수 있습니다.
            </p>
            <p>
              썸네일은 배경 대비를 높이고 핵심 키워드를 이미지 좌상단에 배치하는 구도를 추천드립니다. 인물 또는
              클로즈업 오브젝트를 중앙에 두는 구성이 현재 카테고리 트렌드와 부합합니다.
            </p>
          </ReportSection>

          <ReportSection title="참신성(Novelty) 평가">
            <p>
              현재 영상의 <strong style={{ color: INK }}>Novelty 지수는 72/100</strong>으로, 카테고리 내 기존 인기
              영상과 적절한 차별성을 유지하고 있습니다. 이는 완전히 새로운 접근이라기보다는 검증된 주제를 자신만의
              방식으로 재해석한 포지셔닝으로, 안정적인 초기 유입을 기대할 수 있는 수준입니다.
            </p>
            <p>
              <strong style={{ color: INK }}>Coverage 지수 64%</strong> 기준으로 해당 카테고리는 일부 인기 토픽에
              편중되는 경향이 있으나, 현재 임계치(20%) 이상을 유지하고 있어 필터 버블 경고 대상에 해당하지 않습니다.
              현재 전략을 유지하면서 제목과 썸네일의 트렌드 적합도를 보완하면 채널 성장에 긍정적인 효과를 기대할 수
              있습니다.
            </p>
          </ReportSection>
        </div>

        <div className="my-8 h-px w-full" style={{ backgroundColor: BORDER }} />

        <div className="flex flex-col gap-3">
          <label className="text-sm font-semibold" style={{ color: INK }}>
            분석 리포트를 이메일로 받아보세요
          </label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Mail
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
                style={{ color: MUTED }}
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="이메일 주소를 입력하세요"
                className="w-full rounded-lg bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#A70100]"
                style={{ border: `1px solid ${BORDER}` }}
              />
            </div>
            <button
              className="rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: RED }}
            >
              리포트 발송
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- View 5: History ---------------- */

const HISTORY = [
  {
    filename: "우주영상_v2.mp4",
    category: "Science & Technology",
    date: "2026-05-25",
    score: 82,
    color: "linear-gradient(135deg, #A70100, #5B0000)",
  },
  {
    filename: "여행브이로그_제주.mp4",
    category: "Travel",
    date: "2026-05-20",
    score: 74,
    color: "linear-gradient(135deg, #333333, #111111)",
  },
  {
    filename: "쿠킹_파스타레시피.mp4",
    category: "Cooking",
    date: "2026-05-15",
    score: 58,
    color: "linear-gradient(135deg, #888888, #444444)",
  },
];

function HistoryView({ onOpen }: { onOpen: () => void }) {
  const items = HISTORY;
  return (
    <div className="mx-auto max-w-4xl">
      <h2 className="mb-6 text-2xl font-bold" style={{ color: INK }}>
        분석 히스토리
      </h2>
      {items.length === 0 ? (
        <div
          className="flex flex-col items-center gap-3 rounded-2xl bg-white p-12 shadow-sm"
          style={{ border: `1px solid ${BORDER}` }}
        >
          <Inbox className="h-12 w-12" style={{ color: MUTED }} />
          <p className="text-sm" style={{ color: MUTED }}>아직 분석한 영상이 없습니다</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((it, i) => (
            <div
              key={i}
              className="flex flex-col items-start gap-4 rounded-xl bg-white p-4 shadow-sm sm:flex-row sm:items-center"
              style={{ border: `1px solid ${BORDER}` }}
            >
              <div
                className="h-16 w-28 shrink-0 rounded-lg"
                style={{ background: it.color }}
              />
              <div className="flex-1">
                <p className="text-sm font-semibold" style={{ color: INK }}>
                  {it.filename}
                </p>
                <p className="mt-0.5 text-xs" style={{ color: MUTED }}>
                  {it.category} · {it.date}
                </p>
              </div>
              <span
                className="rounded-full px-3 py-1 text-xs font-semibold text-white"
                style={{ backgroundColor: RED }}
              >
                점수 {it.score}
              </span>
              <button
                onClick={onOpen}
                className="rounded-lg px-4 py-2 text-xs font-semibold text-white"
                style={{ backgroundColor: RED }}
              >
                결과 보기
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
