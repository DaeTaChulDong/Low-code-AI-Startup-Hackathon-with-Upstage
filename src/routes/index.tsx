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
  ChevronDown,
  ChevronUp,
  Mail,
  FileVideo,
  Inbox,
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

const CORAL = "#F05454";
const NAVY = "#1A2B4A";
const LIGHT = "#F8F9FB";

function Index() {
  const [view, setView] = useState<View>("login");

  return (
    <div className="min-h-screen bg-white font-sans text-[#1A2B4A]">
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
      {/* Top nav */}
      <header
        className="flex items-center justify-between border-b px-4 py-3 sm:px-6"
        style={{ borderColor: "#E5E7EB" }}
      >
        <div className="flex items-center gap-2">
          <Target className="h-6 w-6" style={{ color: CORAL }} />
          <span className="text-lg font-bold" style={{ color: CORAL }}>
            Think:it Pro
          </span>
        </div>
        <button
          className="flex h-9 w-9 items-center justify-center rounded-full text-white"
          style={{ backgroundColor: NAVY }}
          onClick={() => setView("login")}
          aria-label="user"
        >
          <User className="h-4 w-4" />
        </button>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside
          className="hidden w-56 shrink-0 border-r p-4 sm:block"
          style={{ borderColor: "#E5E7EB", backgroundColor: NAVY }}
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

        {/* Mobile bottom nav */}
        <nav
          className="fixed bottom-0 left-0 right-0 z-10 flex justify-around border-t bg-white py-2 sm:hidden"
          style={{ borderColor: "#E5E7EB" }}
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
          style={{ backgroundColor: LIGHT }}
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
      className="flex items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors"
      style={{
        backgroundColor: active ? CORAL : "transparent",
        color: active ? "white" : "rgba(255,255,255,0.75)",
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
      style={{ color: active ? CORAL : "#6B7280" }}
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
      style={{ backgroundColor: LIGHT }}
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm">
        <div className="mb-6 flex flex-col items-center gap-2">
          <div className="flex items-center gap-2">
            <Target className="h-7 w-7" style={{ color: CORAL }} />
            <h1 className="text-2xl font-bold" style={{ color: CORAL }}>
              Think:it Pro
            </h1>
          </div>
          <p className="text-center text-sm text-gray-600">
            영상·음성 분석 기반 유튜브 썸네일·제목 자동 생성 AI 컨설팅
          </p>
        </div>

        <div className="mb-6 flex rounded-lg bg-gray-100 p-1">
          {(["login", "signup"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="flex-1 rounded-md py-2 text-sm font-medium transition-colors"
              style={{
                backgroundColor: tab === t ? "white" : "transparent",
                color: tab === t ? NAVY : "#6B7280",
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
            style={{ backgroundColor: CORAL }}
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
      className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none transition-colors focus:border-[#F05454] focus:ring-2 focus:ring-[#F05454]/20"
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
      <h2 className="mb-6 text-2xl font-bold" style={{ color: NAVY }}>
        새 영상 분석
      </h2>

      <button
        onClick={() => setFile("테스트영상.mp4")}
        className="flex w-full flex-col items-center gap-3 rounded-xl border-2 border-dashed bg-white p-10 transition-colors hover:border-[#F05454]"
        style={{ borderColor: file ? CORAL : "#D1D5DB" }}
      >
        <Cloud className="h-12 w-12" style={{ color: CORAL }} />
        {file ? (
          <div className="flex items-center gap-2 text-sm font-medium" style={{ color: NAVY }}>
            <FileVideo className="h-4 w-4" />
            {file}
          </div>
        ) : (
          <p className="text-sm text-gray-600">
            MP4 파일을 드래그하거나 클릭해서 업로드
          </p>
        )}
      </button>

      <div className="mt-6 flex flex-col gap-4 rounded-xl bg-white p-6 shadow-sm">
        <div>
          <label className="mb-1.5 block text-sm font-medium" style={{ color: NAVY }}>
            카테고리 선택
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#F05454]"
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
          <label className="mb-1.5 block text-sm font-medium" style={{ color: NAVY }}>
            AI 맞춤 요청 (선택사항)
          </label>
          <textarea
            value={request}
            onChange={(e) => setRequest(e.target.value)}
            rows={3}
            placeholder="예: 배경은 우주 느낌으로, 밝은 톤으로 제작해주세요"
            className="w-full resize-none rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#F05454]"
          />
        </div>
      </div>

      <button
        onClick={onAnalyze}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl py-4 text-base font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
        style={{ backgroundColor: CORAL }}
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
      <h2 className="mb-2 text-xl font-bold" style={{ color: NAVY }}>
        AI가 영상을 분석하고 있습니다
      </h2>
      <p className="mb-10 text-sm text-gray-600">평균 소요 시간: 1분 30초 이내</p>

      <div className="w-full rounded-2xl bg-white p-6 shadow-sm sm:p-10">
        <div className="relative flex items-center justify-between">
          {/* progress line */}
          <div className="absolute left-5 right-5 top-5 h-0.5 bg-gray-200">
            <div
              className="h-full transition-all duration-500"
              style={{
                width: `${(Math.min(active, STEPS.length - 1) / (STEPS.length - 1)) * 100}%`,
                backgroundColor: CORAL,
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
                    borderColor: done || current ? CORAL : "#D1D5DB",
                  }}
                >
                  {done ? (
                    <Check className="h-5 w-5" style={{ color: CORAL }} />
                  ) : current ? (
                    <Loader2 className="h-5 w-5 animate-spin" style={{ color: CORAL }} />
                  ) : (
                    <span className="text-xs text-gray-400">{i + 1}</span>
                  )}
                </div>
                <span
                  className="text-center text-[11px] font-medium sm:text-xs"
                  style={{ color: done || current ? NAVY : "#9CA3AF" }}
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
    <div className="mx-auto max-w-7xl">
      <h2 className="mb-6 text-2xl font-bold" style={{ color: NAVY }}>
        분석 결과
      </h2>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-6">
          <TrendScoreCard />
          <ReportCard />
        </div>
        <div className="flex flex-col gap-6">
          <TitlesCard />
          <ThumbnailsCard />
        </div>
      </div>
    </div>
  );
}

function TrendScoreCard() {
  const score = 74;
  const radius = 70;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (score / 100) * circ;

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-lg font-bold" style={{ color: NAVY }}>
        트렌드 점수
      </h3>
      <div className="flex flex-col items-center gap-3">
        <div className="relative h-44 w-44">
          <svg viewBox="0 0 180 180" className="h-full w-full -rotate-90">
            <circle cx="90" cy="90" r={radius} stroke="#F3F4F6" strokeWidth="14" fill="none" />
            <circle
              cx="90"
              cy="90"
              r={radius}
              stroke={CORAL}
              strokeWidth="14"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={circ}
              strokeDashoffset={offset}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-bold" style={{ color: NAVY }}>
              {score}
            </span>
            <span className="text-xs text-gray-500">/ 100</span>
          </div>
        </div>
        <p className="text-sm font-medium text-gray-700">종합 트렌드 적합도</p>
        <span
          className="rounded-full px-3 py-1 text-xs font-semibold text-white"
          style={{ backgroundColor: CORAL }}
        >
          Good Potential
        </span>
      </div>

      <div className="mt-6 flex flex-col gap-3">
        <SubScore label="제목 키워드 적합도" value={78} />
        <SubScore label="시각적 트렌드 부합도" value={71} />
        <SubScore label="콘텐츠 주제 관련성" value={73} />
      </div>

      <div className="mt-4 flex gap-2">
        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
          Coverage 64%
        </span>
        <span className="rounded-full bg-teal-100 px-3 py-1 text-xs font-medium text-teal-700">
          Novelty 72%
        </span>
      </div>
    </div>
  );
}

function SubScore({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs">
        <span className="text-gray-600">{label}</span>
        <span className="font-semibold" style={{ color: NAVY }}>
          {value} / 100
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-gray-100">
        <div
          className="h-full rounded-full"
          style={{ width: `${value}%`, backgroundColor: CORAL }}
        />
      </div>
    </div>
  );
}

const REPORT_SECTIONS = [
  {
    icon: "✅",
    title: "영상 강점",
    body: "영상의 주제와 핵심 메시지가 명확하며, 시청자의 호기심을 자극하는 도입부 구성이 강점입니다.",
  },
  {
    icon: "⚠️",
    title: "개선이 필요한 부분",
    body: "제목 키워드가 현재 트렌드 대비 다소 일반적입니다. 더 구체적이고 검색에 잘 노출될 수 있는 단어로 보완이 필요합니다.",
  },
  {
    icon: "💡",
    title: "구체적 개선 방향",
    body: "훅 구간을 영상 초반 8초 이내로 압축하고, 썸네일에 핵심 키워드 1~2개를 강조하면 클릭률 상승이 기대됩니다.",
  },
  {
    icon: "🌟",
    title: "참신성 평가",
    body: "현재 카테고리 내 유사 콘텐츠 대비 차별화된 시각 자료와 설명 방식을 보여주며 참신성 지수가 높습니다.",
  },
];

function ReportCard() {
  const [open, setOpen] = useState<number | null>(0);
  const [email, setEmail] = useState("");

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-lg font-bold" style={{ color: NAVY }}>
        AI 상세 분석 리포트
      </h3>
      <div className="flex flex-col gap-2">
        {REPORT_SECTIONS.map((s, i) => {
          const isOpen = open === i;
          return (
            <div key={s.title} className="rounded-lg border border-gray-100">
              <button
                onClick={() => setOpen(isOpen ? null : i)}
                className="flex w-full items-center justify-between px-4 py-3 text-left"
              >
                <span className="flex items-center gap-2 text-sm font-medium" style={{ color: NAVY }}>
                  <span>{s.icon}</span>
                  {s.title}
                </span>
                {isOpen ? (
                  <ChevronUp className="h-4 w-4 text-gray-400" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                )}
              </button>
              {isOpen && (
                <p className="px-4 pb-3 text-sm leading-relaxed text-gray-600">
                  {s.body}
                </p>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#F05454]"
          />
        </div>
        <button
          className="rounded-lg px-4 py-2.5 text-sm font-semibold text-white"
          style={{ backgroundColor: CORAL }}
        >
          리포트 이메일로 받기
        </button>
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
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-lg font-bold" style={{ color: NAVY }}>
        클릭을 부르는 제목 추천
      </h3>
      <div className="flex flex-col gap-3">
        {TITLES.map((t, i) => (
          <div key={i} className="rounded-lg bg-[#F8F9FB] p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <span
                  className="inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold text-white"
                  style={{ backgroundColor: CORAL }}
                >
                  {t.tag}
                </span>
                <p className="mt-2 text-sm font-semibold" style={{ color: NAVY }}>
                  {t.title}
                </p>
                <p className="mt-1.5 text-xs text-gray-600">
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
                className="rounded-md p-2 text-gray-500 transition-colors hover:bg-white hover:text-[#F05454]"
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
    gradient: "linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)",
    prompt:
      "Vibrant space scene, glowing planet, bold yellow text '왜 동글까?', high contrast, click-bait style YouTube thumbnail",
  },
  {
    label: "감성 스토리형",
    text: "행성의 비밀",
    gradient: "linear-gradient(135deg, #14B8A6 0%, #22C55E 100%)",
    prompt:
      "Soft pastel space illustration, planet evolution, elegant serif overlay '행성의 비밀', cinematic mood",
  },
  {
    label: "깔끔한 정보형",
    text: "행성 vs 소행성",
    gradient: "linear-gradient(135deg, #1A2B4A 0%, #334155 100%)",
    prompt:
      "Clean infographic style thumbnail, side-by-side planet vs asteroid, minimalist sans-serif text '행성 vs 소행성'",
  },
];

function ThumbnailsCard() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <h3 className="text-lg font-bold" style={{ color: NAVY }}>
        AI 완성형 썸네일 (텍스트 포함)
      </h3>
      <p className="mt-1 text-xs text-gray-500">
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
            <p className="text-xs font-medium text-gray-700">{t.label}</p>
            <button
              className="flex items-center justify-center gap-1 rounded-lg border py-1.5 text-xs font-semibold transition-colors hover:bg-[#F05454] hover:text-white"
              style={{ borderColor: CORAL, color: CORAL }}
            >
              <Download className="h-3.5 w-3.5" /> 다운로드
            </button>
            <button
              onClick={() => setOpenIdx(openIdx === i ? null : i)}
              className="flex items-center justify-center gap-1 text-xs text-gray-500 hover:text-[#1A2B4A]"
            >
              프롬프트 보기 {openIdx === i ? "▴" : "▾"}
            </button>
            {openIdx === i && (
              <pre className="whitespace-pre-wrap break-words rounded-md bg-gray-100 p-2 text-[10px] leading-relaxed text-gray-700">
                {t.prompt}
              </pre>
            )}
          </div>
        ))}
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
    color: "linear-gradient(135deg, #3B82F6, #8B5CF6)",
  },
  {
    filename: "여행브이로그_제주.mp4",
    category: "Travel",
    date: "2026-05-20",
    score: 74,
    color: "linear-gradient(135deg, #14B8A6, #22C55E)",
  },
  {
    filename: "쿠킹_파스타레시피.mp4",
    category: "Cooking",
    date: "2026-05-15",
    score: 58,
    color: "linear-gradient(135deg, #F05454, #F59E0B)",
  },
];

function HistoryView({ onOpen }: { onOpen: () => void }) {
  const items = HISTORY;
  return (
    <div className="mx-auto max-w-4xl">
      <h2 className="mb-6 text-2xl font-bold" style={{ color: NAVY }}>
        분석 히스토리
      </h2>
      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl bg-white p-12 shadow-sm">
          <Inbox className="h-12 w-12 text-gray-300" />
          <p className="text-sm text-gray-500">아직 분석한 영상이 없습니다</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((it, i) => {
            const color =
              it.score >= 80 ? "#22C55E" : it.score >= 60 ? "#F59E0B" : "#EF4444";
            return (
              <div
                key={i}
                className="flex flex-col items-start gap-4 rounded-xl bg-white p-4 shadow-sm sm:flex-row sm:items-center"
              >
                <div
                  className="h-16 w-28 shrink-0 rounded-lg"
                  style={{ background: it.color }}
                />
                <div className="flex-1">
                  <p className="text-sm font-semibold" style={{ color: NAVY }}>
                    {it.filename}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-500">
                    {it.category} · {it.date}
                  </p>
                </div>
                <span
                  className="rounded-full px-3 py-1 text-xs font-semibold text-white"
                  style={{ backgroundColor: color }}
                >
                  점수 {it.score}
                </span>
                <button
                  onClick={onOpen}
                  className="rounded-lg px-4 py-2 text-xs font-semibold text-white"
                  style={{ backgroundColor: CORAL }}
                >
                  결과 보기
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
