import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
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
  AlertCircle,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Think:it Pro — AI 유튜브 썸네일·제목 컨설팅" },
      {
        name: "description",
        content: "영상·음성 분석 기반 유튜브 썸네일·제목 자동 생성 AI 컨설팅 서비스",
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
const N8N_WEBHOOK_URL = "https://eugene385.app.n8n.cloud/webhook/Think-it-Pro";

/* ---------- API result types ---------- */

type ApiScore = {
  keyword_score: number;
  topic_score: number;
  visual_score: number;
  keyword_comment: string;
  topic_comment: string;
  visual_comment: string;
  comment: string;
  total: number;
};
type ApiTitle = { style: string; title: string; why: string };
type ApiThumb = { style: string; url: string | null; prompt: string; error?: string };
export type AnalysisResult = {
  score: ApiScore;
  titles: ApiTitle[];
  thumbnails: ApiThumb[];
  report: string;
  transcript_preview: string;
  wpm: number;
  category: string;
  analyzed_at: string;
  filename?: string;
};

type HistoryItem = {
  filename: string;
  category: string;
  date: string;
  score: number;
  result: AnalysisResult;
};

const HISTORY_KEY = "thinkit_history_v1";
const IDB_NAME = "thinkit";
const IDB_STORE = "history";

function openHistoryDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE, { keyPath: "key" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function loadHistory(): Promise<HistoryItem[]> {
  if (typeof window === "undefined" || !("indexedDB" in window)) return [];
  try {
    const db = await openHistoryDB();
    const items = await new Promise<HistoryItem[]>((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, "readonly");
      const store = tx.objectStore(IDB_STORE);
      const req = store.get(HISTORY_KEY);
      req.onsuccess = () => {
        const row = req.result as { key: string; items: HistoryItem[] } | undefined;
        resolve(row?.items ?? []);
      };
      req.onerror = () => reject(req.error);
    });
    db.close();
    return items;
  } catch {
    // Fallback to legacy localStorage payload (won't contain base64 thumbnails).
    try {
      const raw = window.localStorage.getItem(HISTORY_KEY);
      return raw ? (JSON.parse(raw) as HistoryItem[]) : [];
    } catch {
      return [];
    }
  }
}

async function saveHistory(items: HistoryItem[]): Promise<void> {
  if (typeof window === "undefined" || !("indexedDB" in window)) return;
  const trimmed = items.slice(0, 20);
  try {
    const db = await openHistoryDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, "readwrite");
      tx.objectStore(IDB_STORE).put({ key: HISTORY_KEY, items: trimmed });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
    db.close();
    // Clear legacy localStorage entry so we don't read stale data on fallback.
    try {
      window.localStorage.removeItem(HISTORY_KEY);
    } catch {
      /* ignore */
    }
  } catch {
    // Last resort: ignore. IndexedDB usually has hundreds of MB available.
  }
}

function Index() {
  const [view, setView] = useState<View>("login");
  const [file, setFile] = useState<File | null>(null);
  const [category, setCategory] = useState("Science & Technology");
  const [customPrompt, setCustomPrompt] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startAnalysis = () => {
    if (!file) return;
    setError(null);
    setResult(null);
    setView("loading");
  };

  return (
    <div className="min-h-screen bg-white font-sans" style={{ color: INK }}>
      {view === "login" && <LoginView onContinue={() => setView("upload")} />}
      {view === "upload" && (
        <Shell view={view} setView={setView}>
          <UploadView
            file={file}
            setFile={setFile}
            category={category}
            setCategory={setCategory}
            customPrompt={customPrompt}
            setCustomPrompt={setCustomPrompt}
            onAnalyze={startAnalysis}
          />
        </Shell>
      )}
      {view === "loading" && file && (
        <Shell view={view} setView={setView}>
          <LoadingView
            file={file}
            category={category}
            customPrompt={customPrompt}
            onDone={(r) => {
              const enriched: AnalysisResult = { ...r, filename: file.name };
              setResult(enriched);
              const item: HistoryItem = {
                filename: file.name,
                category: r.category,
                date: r.analyzed_at.slice(0, 10),
                score: r.score.total,
                result: enriched,
              };
              void loadHistory().then((prev) => saveHistory([item, ...prev]));
              setView("results");
            }}
            onError={(msg) => {
              setError(msg);
              setView("upload");
            }}
          />
        </Shell>
      )}
      {view === "results" && result && (
        <Shell view={view} setView={setView}>
          <ResultsView result={result} />
        </Shell>
      )}
      {view === "history" && (
        <Shell view={view} setView={setView}>
          <HistoryView
            onOpen={(r) => {
              setResult(r);
              setView("results");
            }}
          />
        </Shell>
      )}
      {error && view === "upload" && (
        <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 sm:bottom-6">
          <div
            className="flex max-w-md items-start gap-2 rounded-lg bg-white px-4 py-3 text-sm shadow-lg"
            style={{ border: `1px solid ${RED}`, color: INK }}
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" style={{ color: RED }} />
            <span>{error}</span>
            <button onClick={() => setError(null)} className="ml-2 text-xs font-semibold" style={{ color: MUTED }}>
              닫기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------- Shell ---------------- */

function Shell({ view, setView, children }: { view: View; setView: (v: View) => void; children: React.ReactNode }) {
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
          className="hidden w-56 shrink-0 border-r p-4 sm:block"
          style={{ borderColor: "#333333", backgroundColor: INK }}
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
            <SideLink icon={<User className="h-4 w-4" />} label="마이페이지" active={false} onClick={() => {}} />
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
          <MobileLink icon={<User className="h-5 w-5" />} label="마이" active={false} onClick={() => {}} />
        </nav>

        <main className="flex-1 overflow-x-hidden p-4 pb-20 sm:p-8 sm:pb-8" style={{ backgroundColor: BG }}>
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
        color: active ? "#FFFFFF" : "#CCCCCC",
        borderLeft: active ? `3px solid ${RED}` : "3px solid transparent",
        backgroundColor: active ? "#1A1A1A" : "transparent",
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
    <div className="flex min-h-screen items-center justify-center px-4 py-10" style={{ backgroundColor: BG }}>
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm" style={{ border: `1px solid ${BORDER}` }}>
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
            e.stopPropagation();
            onContinue();
          }}
        >
          <Input type="email" placeholder="이메일" autoComplete="email" />
          <Input type="password" placeholder="비밀번호" autoComplete="current-password" />
          {tab === "signup" && <Input type="password" placeholder="비밀번호 확인" autoComplete="new-password" />}
          <button
            type="button"
            onClick={() => onContinue()}
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

const CATEGORIES = [
  "Science & Technology",
  "Entertainment",
  "Gaming",
  "Education",
  "Howto & Style",
  "People & Blogs",
  "Music",
  "Comedy",
  "News & Politics",
  "Sports",
  "Travel & Events",
  "Film & Animation",
  "Autos & Vehicles",
  "Pets & Animals",
];

function UploadView({
  file,
  setFile,
  category,
  setCategory,
  customPrompt,
  setCustomPrompt,
  onAnalyze,
}: {
  file: File | null;
  setFile: (f: File | null) => void;
  category: string;
  setCategory: (c: string) => void;
  customPrompt: string;
  setCustomPrompt: (s: string) => void;
  onAnalyze: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const sizeMB = file ? (file.size / (1024 * 1024)).toFixed(1) : null;
  const tooBig = file ? file.size > 25 * 1024 * 1024 : false;

  return (
    <div className="mx-auto max-w-3xl">
      <h2 className="mb-6 text-2xl font-bold" style={{ color: INK }}>
        새 영상 분석
      </h2>

      <input
        ref={inputRef}
        type="file"
        accept="video/*,audio/*"
        className="hidden"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
      />
      <button
        onClick={() => inputRef.current?.click()}
        className="flex w-full flex-col items-center gap-3 rounded-xl border-2 border-dashed bg-white p-10 transition-colors hover:border-[#A70100]"
        style={{ borderColor: file ? RED : "#D1D5DB" }}
      >
        <Cloud className="h-12 w-12" style={{ color: RED }} />
        {file ? (
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-2 text-sm font-medium" style={{ color: INK }}>
              <FileVideo className="h-4 w-4" />
              {file.name}
            </div>
            <span className="text-xs" style={{ color: tooBig ? RED : MUTED }}>
              {sizeMB}MB {tooBig ? "(25MB 초과 — Whisper API 제한)" : ""}
            </span>
          </div>
        ) : (
          <p className="text-sm" style={{ color: MUTED }}>
            영상 파일을 클릭해서 업로드 (최대 25MB · MP4/MP3 권장)
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
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium" style={{ color: INK }}>
            AI 맞춤 요청 (선택사항)
          </label>
          <textarea
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            rows={3}
            placeholder="예: 배경은 우주 느낌으로, 밝은 톤으로 제작해주세요"
            className="w-full resize-none rounded-lg bg-white px-4 py-2.5 text-sm outline-none focus:border-[#A70100]"
            style={{ border: `1px solid ${BORDER}` }}
          />
        </div>
      </div>

      <button
        onClick={onAnalyze}
        disabled={!file || tooBig}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl py-4 text-base font-semibold text-white shadow-sm transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        style={{ backgroundColor: RED }}
      >
        AI 분석 시작 <Rocket className="h-5 w-5" />
      </button>
    </div>
  );
}

/* ---------------- View 3: Loading ---------------- */

const STEPS = [
  "영상 업로드 중",
  "오디오 추출 및 음성 분석 중 (Whisper)",
  "트렌드 분석 중 (Solar)",
  "AI 콘텐츠 생성 중",
];

function encodeWav(samples: Float32Array, sampleRate: number): Blob {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  const writeString = (offset: number, value: string) => {
    for (let i = 0; i < value.length; i += 1) view.setUint8(offset + i, value.charCodeAt(i));
  };

  writeString(0, "RIFF");
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, "data");
  view.setUint32(40, samples.length * 2, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i += 1, offset += 2) {
    const sample = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
  }
  return new Blob([buffer], { type: "audio/wav" });
}

async function extractAudioForWhisper(file: File): Promise<File> {
  if (file.type.startsWith("audio/")) {
    return new File([await file.arrayBuffer()], "upload.wav", { type: file.type || "audio/wav" });
  }

  const AudioContextClass =
    window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) {
    throw new Error("이 브라우저는 영상 오디오 추출을 지원하지 않습니다. MP3/WAV 파일로 업로드해주세요.");
  }

  const source = await file.arrayBuffer();
  const audioContext = new AudioContextClass({ sampleRate: 16000 });
  try {
    const decoded = await audioContext.decodeAudioData(source.slice(0));
    const targetRate = 16000;
    const targetLength = Math.max(1, Math.round(decoded.duration * targetRate));
    const samples = new Float32Array(targetLength);
    const channels = Array.from({ length: decoded.numberOfChannels }, (_, i) => decoded.getChannelData(i));

    for (let i = 0; i < targetLength; i += 1) {
      const sourceIndex = (i / targetRate) * decoded.sampleRate;
      const left = Math.floor(sourceIndex);
      const right = Math.min(left + 1, decoded.length - 1);
      const ratio = sourceIndex - left;
      let mixed = 0;
      for (const channel of channels) {
        mixed += channel[left] * (1 - ratio) + channel[right] * ratio;
      }
      samples[i] = mixed / Math.max(1, channels.length);
    }

    const wav = encodeWav(samples, targetRate);
    return new File([wav], "upload.wav", { type: "audio/wav" });
  } catch (e) {
    throw new Error(
      `영상의 오디오 트랙을 추출하지 못했습니다. MP4 안의 오디오 코덱이 브라우저에서 지원되지 않을 수 있습니다. MP3/WAV로 변환해 업로드해주세요. (${e instanceof Error ? e.message : String(e)})`,
    );
  } finally {
    void audioContext.close();
  }
}

function LoadingView({
  file,
  category,
  customPrompt,
  onDone,
  onError,
}: {
  file: File;
  category: string;
  customPrompt: string;
  onDone: (result: AnalysisResult) => void;
  onError: (msg: string) => void;
}) {
  const [active, setActive] = useState(0);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    // 시각적 진행 (실제 API 응답 전까지 단계별 애니메이션)
    const t1 = setTimeout(() => setActive(1), 800);
    const t2 = setTimeout(() => setActive(2), 4000);
    const t3 = setTimeout(() => setActive(3), 12000);

    extractAudioForWhisper(file)
      .then(
        (audioFile) => {
          const fd = new FormData();
          fd.append("audio", audioFile, "upload.wav");
          fd.append("original_filename", file.name);
          fd.append("category", category);
          fd.append("custom_prompt", customPrompt);
          return fetch("/api/analyze", { method: "POST", body: fd });
        },
        // Fallback: browser couldn't decode the video's audio track.
        // Send the original file as `video` and let Whisper handle it server-side.
        () => {
          const fd = new FormData();
          fd.append("video", file, file.name);
          fd.append("original_filename", file.name);
          fd.append("category", category);
          fd.append("custom_prompt", customPrompt);
          return fetch("/api/analyze", { method: "POST", body: fd });
        },
      )
      .then(async (res) => {
        const data = (await res.json()) as { result: AnalysisResult; status: string } | { error: string };
        if (!res.ok || "error" in data) {
          throw new Error("error" in data ? data.error : "분석에 실패했습니다");
        }
        setActive(STEPS.length);
        setTimeout(() => onDone(data.result), 400);
      })
      .catch((e: unknown) => {
        onError(e instanceof Error ? e.message : String(e));
      })
      .finally(() => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      });

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [file, category, customPrompt, onDone, onError]);

  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center justify-center py-16">
      <h2 className="mb-2 text-xl font-bold" style={{ color: INK }}>
        AI가 영상을 분석하고 있습니다
      </h2>
      <p className="mb-10 text-sm" style={{ color: MUTED }}>
        영상 길이에 따라 30초~2분 소요됩니다
      </p>

      <div className="w-full rounded-2xl bg-white p-6 shadow-sm sm:p-10" style={{ border: `1px solid ${BORDER}` }}>
        <div className="relative grid grid-cols-4">
          {/* Progress line: spans from center of first circle to center of last circle.
              Circle is h-10 (2.5rem). Column has pt-5 (1.25rem) above the circle,
              so circle vertical center sits at 1.25rem + 1.25rem = 2.5rem from grid top. */}
          <div
            className="pointer-events-none absolute h-0.5"
            style={{
              left: "12.5%",
              right: "12.5%",
              top: "2.5rem",
              transform: "translateY(-50%)",
              backgroundColor: BORDER,
            }}
          >
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
              <div key={label} className="flex flex-col items-center gap-2 pt-5">
                <div
                  className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 bg-white"
                  style={{ borderColor: done || current ? RED : "#D1D5DB" }}
                >
                  {done ? (
                    <Check className="h-5 w-5" style={{ color: RED }} />
                  ) : current ? (
                    <Loader2 className="h-5 w-5 animate-spin" style={{ color: RED }} />
                  ) : (
                    <span className="text-xs" style={{ color: MUTED }}>
                      {i + 1}
                    </span>
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

function ResultsView({ result }: { result: AnalysisResult }) {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <h2 className="text-2xl font-bold" style={{ color: INK }}>
        분석 결과
      </h2>
      <TrendScoreCard score={result.score} />
      <TitlesCard titles={result.titles} />
      <ThumbnailsCard thumbnails={result.thumbnails} />
      <ReportCard result={result} />
    </div>
  );
}

function TrendScoreCard({ score }: { score: ApiScore }) {
  const total = score.total;
  const radius = 70;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (total / 100) * circ;
  const gaugeColor = total < 60 ? "#888888" : RED;
  const badge = total >= 80 ? "Great Potential" : total >= 60 ? "Good Potential" : "Needs Work";

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm sm:p-8" style={{ border: `1px solid ${BORDER}` }}>
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
                stroke={gaugeColor}
                strokeWidth="14"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={circ}
                strokeDashoffset={offset}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-bold" style={{ color: INK }}>
                {total}
              </span>
              <span className="text-xs" style={{ color: MUTED }}>
                / 100
              </span>
            </div>
          </div>
          <p className="text-sm font-medium" style={{ color: INK }}>
            종합 트렌드 적합도
          </p>
          <span
            className="rounded-full px-3 py-1 text-xs font-semibold text-white"
            style={{ backgroundColor: gaugeColor }}
          >
            {badge}
          </span>
        </div>

        <div className="flex flex-1 flex-col gap-4 self-stretch">
          <SubScore label="제목 키워드 적합도" value={score.keyword_score} comment={score.keyword_comment} />
          <SubScore label="시각적 트렌드 부합도" value={score.visual_score} comment={score.visual_comment} />
          <SubScore label="콘텐츠 주제 관련성" value={score.topic_score} comment={score.topic_comment} />
          {score.comment && (
            <p className="mt-2 rounded-lg p-3 text-xs leading-relaxed" style={{ backgroundColor: BG, color: INK }}>
              {score.comment}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function SubScore({ label, value, comment }: { label: string; value: number; comment?: string }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs">
        <span style={{ color: MUTED }}>{label}</span>
        <span className="font-semibold" style={{ color: INK }}>
          {value} / 100
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full" style={{ backgroundColor: BG }}>
        <div className="h-full rounded-full" style={{ width: `${value}%`, backgroundColor: RED }} />
      </div>
      {comment && (
        <p className="mt-1 text-[11px]" style={{ color: MUTED }}>
          {comment}
        </p>
      )}
    </div>
  );
}

function TitlesCard({ titles }: { titles: ApiTitle[] }) {
  const [copied, setCopied] = useState<number | null>(null);
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm sm:p-8" style={{ border: `1px solid ${BORDER}` }}>
      <h3 className="mb-4 text-lg font-bold" style={{ color: INK }}>
        클릭을 부르는 제목 추천
      </h3>
      <div className="flex flex-col gap-3">
        {titles.map((t, i) => (
          <div key={i} className="rounded-lg p-4" style={{ backgroundColor: BG }}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <span
                  className="inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold text-white"
                  style={{ backgroundColor: RED }}
                >
                  {t.style}
                </span>
                <p className="mt-2 text-sm font-semibold" style={{ color: INK }}>
                  {t.title}
                </p>
                {t.why && (
                  <p className="mt-1.5 text-xs" style={{ color: MUTED }}>
                    <span className="font-semibold">WHY: </span>
                    {t.why}
                  </p>
                )}
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

function ThumbnailsCard({ thumbnails }: { thumbnails: ApiThumb[] }) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm sm:p-8" style={{ border: `1px solid ${BORDER}` }}>
      <h3 className="text-lg font-bold" style={{ color: INK }}>
        AI 완성형 썸네일
      </h3>
      <p className="mt-1 text-xs" style={{ color: MUTED }}>
        OpenAI gpt-image-1이 영상 내용을 기반으로 3가지 스타일의 썸네일을 생성했습니다
      </p>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {thumbnails.map((t, i) => {
          const filename = `thinkit_${t.style.replace(/\s+/g, "_")}_${i + 1}.png`;
          const isDataUrl = t.url?.startsWith("data:");
          const downloadHref = t.url
            ? isDataUrl
              ? t.url
              : `/api/thumbnail?url=${encodeURIComponent(t.url)}&name=${encodeURIComponent(filename)}`
            : "";
          return (
            <div key={i} className="flex flex-col gap-2">
              {t.url ? (
                <img
                  src={t.url}
                  alt={t.style}
                  className="aspect-video w-full rounded-lg object-cover shadow-sm transition-all hover:ring-2 hover:ring-[#A70100]"
                />
              ) : (
                <div
                  className="flex aspect-video items-center justify-center rounded-lg p-3 text-center text-xs text-white"
                  style={{ background: "#444" }}
                >
                  생성 실패{t.error ? `: ${t.error.slice(0, 60)}` : ""}
                </div>
              )}
              <p className="text-xs font-medium" style={{ color: INK }}>
                {t.style}
              </p>
              {t.url && (
                <a
                  href={downloadHref}
                  download={filename}
                  className="flex items-center justify-center gap-1 rounded-lg py-1.5 text-xs font-semibold text-[#A70100] transition-colors hover:bg-[#A70100] hover:text-white"
                  style={{ border: `1px solid ${RED}` }}
                >
                  <Download className="h-3.5 w-3.5" /> 썸네일 다운로드
                </a>
              )}
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
          );
        })}
      </div>
    </div>
  );
}

/* ---------------- Report ---------------- */

function renderMarkdownReport(md: string) {
  // ## 헤더 기준으로 섹션 분리
  const blocks = md
    .split(/\n(?=##\s)/g)
    .map((b) => b.trim())
    .filter(Boolean);
  return blocks.map((block, i) => {
    const lines = block.split("\n");
    const headerLine = lines[0]?.startsWith("##") ? (lines.shift() ?? "") : "";
    const title = headerLine
      .replace(/^#+\s*/, "")
      .replace(/\*\*(.+?)\*\*/g, "$1")
      .trim();
    const body = lines.join("\n").trim();
    return (
      <section key={i} className="flex flex-col">
        {title && (
          <>
            <div className="flex items-center gap-2">
              <span className="inline-block h-3 w-3" style={{ backgroundColor: RED }} aria-hidden />
              <h4 className="text-[15px] font-bold" style={{ color: INK }}>
                {title}
              </h4>
            </div>
            <div className="mt-2 h-px w-full" style={{ backgroundColor: BORDER }} />
          </>
        )}
        <div className="mt-4 whitespace-pre-wrap text-[15px]" style={{ color: "#333333", lineHeight: 1.8 }}>
          {body
            .replace(/^\s*#{1,6}\s*/gm, "")
            .replace(/#{2,6}\s*/g, "")
            .replace(/\*\*(.+?)\*\*/g, "$1")}
        </div>
      </section>
    );
  });
}

function ReportCard({ result }: { result: AnalysisResult }) {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sendMsg, setSendMsg] = useState<string | null>(null);
  const date = result.analyzed_at.slice(0, 10).replace(/-/g, ".");

  return (
    <div
      className="overflow-hidden rounded-2xl bg-white shadow-sm"
      style={{ border: `1px solid ${BORDER}`, borderLeft: `4px solid ${RED}` }}
    >
      <div className="p-6 sm:p-10">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h3 className="text-[20px] font-bold" style={{ color: INK }}>
              AI 상세 분석 리포트
            </h3>
            <p className="mt-1.5 text-xs sm:text-sm" style={{ color: MUTED }}>
              [카테고리] {result.category} &nbsp;|&nbsp; 분석일: {date} &nbsp;|&nbsp; 종합 점수: {result.score.total} /
              100 &nbsp;|&nbsp; WPM: {result.wpm}
            </p>
          </div>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors hover:bg-[#F5F5F5]"
            style={{ borderColor: BORDER, color: INK }}
          >
            <Printer className="h-4 w-4" />
            인쇄 / PDF 저장
          </button>
        </div>

        <div className="flex flex-col gap-6">{renderMarkdownReport(result.report)}</div>

        {result.transcript_preview && (
          <details className="mt-6">
            <summary className="cursor-pointer text-xs font-semibold" style={{ color: MUTED }}>
              대본 미리보기 (첫 500자)
            </summary>
            <p className="mt-2 rounded-lg p-3 text-xs leading-relaxed" style={{ backgroundColor: BG, color: INK }}>
              {result.transcript_preview}
            </p>
          </details>
        )}

        <div className="my-8 h-px w-full" style={{ backgroundColor: BORDER }} />

        <div className="flex flex-col gap-3">
          <label className="text-sm font-semibold" style={{ color: INK }}>
            분석 리포트를 이메일로 받아보세요
          </label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: MUTED }} />
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
              disabled={sending || !email}
              onClick={async () => {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(email)) {
                  setSendMsg("올바른 이메일 형식을 입력해주세요.");
                  return;
                }

                setSending(true);
                setSendMsg(null);

                try {
                  const response = await fetch(N8N_WEBHOOK_URL, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      email: email,
                      category: result.category,
                      analyzed_at: result.analyzed_at,
                      score_total: result.score.total,
                      wpm: result.wpm,
                      score_title_keyword: result.score.keyword_score,
                      score_visual_trend: result.score.visual_score,
                      score_content_relevance: result.score.topic_score,
                      titles: result.titles,
                      report: result.report,
                      transcript_preview: result.transcript_preview ?? "",
                    }),
                  });

                  if (response.ok) {
                    setSendMsg("✓ 입력하신 이메일로 리포트가 발송되었습니다.");
                  } else {
                    setSendMsg("✗ 발송에 실패했습니다. 잠시 후 다시 시도해주세요.");
                  }
                } catch {
                  setSendMsg("✗ 발송에 실패했습니다. 네트워크 연결을 확인해주세요.");
                } finally {
                  setSending(false);
                }
              }}
              className="rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: RED }}
            >
              {sending ? "발송 중..." : "리포트 발송"}
            </button>
          </div>
          {sendMsg && (
            <p
              className="text-xs"
              style={{
                color: sendMsg.startsWith("✓") ? "#16A34A" : sendMsg.startsWith("✗") ? "#A70100" : MUTED,
              }}
            >
              {sendMsg}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------------- View 5: History ---------------- */

function HistoryView({ onOpen }: { onOpen: (r: AnalysisResult) => void }) {
  const [items, setItems] = useState<HistoryItem[]>([]);
  useEffect(() => {
    let cancelled = false;
    void loadHistory().then((data) => {
      if (!cancelled) setItems(data);
    });
    const onStorage = (e: StorageEvent) => {
      if (e.key === HISTORY_KEY) {
        void loadHistory().then((data) => {
          if (!cancelled) setItems(data);
        });
      }
    };
    window.addEventListener("storage", onStorage);
    return () => {
      cancelled = true;
      window.removeEventListener("storage", onStorage);
    };
  }, []);

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
          <p className="text-sm" style={{ color: MUTED }}>
            아직 분석한 영상이 없습니다
          </p>
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
                className="flex h-16 w-28 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
                style={{
                  background: `linear-gradient(135deg, ${RED}, #5B0000)`,
                }}
              >
                {it.score}
              </div>
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
                onClick={() => onOpen(it.result)}
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
