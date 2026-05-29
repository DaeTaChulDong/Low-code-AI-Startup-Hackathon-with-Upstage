import { createFileRoute } from "@tanstack/react-router";

/**
 * Think:it Pro — 분석 파이프라인
 * 1. Whisper API (OpenAI)        : 비디오 → 한국어 대본
 * 2. Solar LLM (Upstage)          : 트렌드 점수 + 제목 + 리포트 + 키워드 추출
 * 3. DALL-E 3 (OpenAI)            : 3종 썸네일 병렬 생성
 *
 * 모든 호출은 외부 API로 위임 — Workers 런타임에서 안전.
 */

const SOLAR_URL = "https://api.upstage.ai/v1/solar/chat/completions";
const SOLAR_MODEL = "solar-pro2";

const OPENAI_BASE = "https://api.openai.com/v1";

type TrendScore = {
  keyword_score: number;
  topic_score: number;
  visual_score: number;
  keyword_comment: string;
  topic_comment: string;
  visual_comment: string;
  comment: string;
  total: number;
};

type TitleItem = { style: string; title: string; why: string };
type Thumbnail = { style: string; url: string | null; prompt: string; error?: string };

async function solarJSON(
  apiKey: string,
  prompt: string,
  temperature = 0.3,
  maxTokens = 800,
): Promise<unknown> {
  const res = await fetch(SOLAR_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: SOLAR_MODEL,
      messages: [
        {
          role: "system",
          content:
            "당신은 유튜브 콘텐츠 트렌드 분석 전문가입니다. 반드시 요청된 JSON 형식만 출력하세요. 다른 텍스트는 출력하지 마세요.",
        },
        { role: "user", content: prompt },
      ],
      temperature,
      max_tokens: maxTokens,
      response_format: { type: "json_object" },
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Solar API error ${res.status}: ${text.slice(0, 300)}`);
  }
  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content ?? "";
  const cleaned = content.replace(/```json|```/g, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    // 배열 prefix가 없는 경우 시도
    const start = cleaned.indexOf("{");
    const arrStart = cleaned.indexOf("[");
    const first =
      start === -1 ? arrStart : arrStart === -1 ? start : Math.min(start, arrStart);
    if (first >= 0) {
      return JSON.parse(cleaned.slice(first));
    }
    throw new Error(`Solar JSON parse failed: ${cleaned.slice(0, 200)}`);
  }
}

async function solarText(
  apiKey: string,
  prompt: string,
  temperature = 0.7,
  maxTokens = 1500,
): Promise<string> {
  const res = await fetch(SOLAR_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: SOLAR_MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature,
      max_tokens: maxTokens,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Solar API error ${res.status}: ${text.slice(0, 300)}`);
  }
  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  return (data.choices?.[0]?.message?.content ?? "").trim();
}

async function transcribeWithWhisper(
  openaiKey: string,
  videoFile: File,
): Promise<{ text: string; wpm: number }> {
  const fd = new FormData();
  fd.append("file", videoFile, videoFile.name || "video.mp4");
  fd.append("model", "whisper-1");
  fd.append("language", "ko");
  fd.append("response_format", "text");

  const res = await fetch(`${OPENAI_BASE}/audio/transcriptions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${openaiKey}` },
    body: fd,
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Whisper error ${res.status}: ${t.slice(0, 300)}`);
  }
  const text = (await res.text()).trim();
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const estMinutes = Math.max(videoFile.size / (1024 * 1024) / 1.5, 0.1);
  const wpm = Math.round(wordCount / estMinutes);
  return { text, wpm };
}

function normalize100(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v) || 50;
  const clamped = Math.max(0, Math.min(100, n));
  return Math.round(70 + (clamped / 100) * 30);
}

async function calculateTrendScore(
  solarKey: string,
  script: string,
  category: string,
): Promise<TrendScore> {
  const prompt = `아래 영상 대본을 분석하여 '${category}' 카테고리 유튜브 트렌드 적합도를 평가하세요.

[영상 대본]
${script.slice(0, 3000)}

반드시 아래 JSON 형식으로만 응답:
{
  "keyword_score": 0~100 사이 정수,
  "keyword_comment": "대본의 키워드가 트렌드 키워드와 얼마나 부합하는지 한 줄 평가",
  "topic_score": 0~100 사이 정수,
  "topic_comment": "영상 주제가 현재 인기 콘텐츠 방향과 얼마나 일치하는지 한 줄 평가",
  "visual_score": 0~100 사이 정수,
  "visual_comment": "영상 내용이 시각적으로 매력적인 썸네일을 만들기 좋은 소재인지 한 줄 평가",
  "total_comment": "종합 평가 한 줄"
}`;

  const raw = (await solarJSON(solarKey, prompt, 0.3, 600)) as Record<string, unknown>;
  const keyword = normalize100(raw.keyword_score);
  const topic = normalize100(raw.topic_score);
  const visual = normalize100(raw.visual_score);
  const total = Math.round(keyword * 0.4 + visual * 0.3 + topic * 0.3);
  return {
    keyword_score: keyword,
    topic_score: topic,
    visual_score: visual,
    keyword_comment: String(raw.keyword_comment ?? ""),
    topic_comment: String(raw.topic_comment ?? ""),
    visual_comment: String(raw.visual_comment ?? ""),
    comment: String(raw.total_comment ?? ""),
    total,
  };
}

async function generateTitles(
  solarKey: string,
  script: string,
  category: string,
  customPrompt: string,
): Promise<TitleItem[]> {
  const prompt = `당신은 유튜브 콘텐츠 전략 전문가입니다.
아래 '${category}' 카테고리 영상 대본을 분석하여 클릭률(CTR)을 극대화할 제목 3종을 추천하세요.

[영상 대본 요약]
${script.slice(0, 2000)}

${customPrompt ? `[사용자 추가 요청] ${customPrompt}` : ""}

다음 3가지 톤으로 각각 한국어 제목을 작성하고, WHY 근거를 한 줄로 설명하세요:
1. 강렬한 클릭 유도형 (호기심 자극, 의문문/숫자 활용)
2. 감성 스토리형 (감정적 공감, 스토리텔링)
3. 깔끔한 정보형 (명확한 정보 전달)

반드시 아래 JSON 형식으로만 응답:
{
  "titles": [
    {"style": "강렬한 클릭 유도형", "title": "...", "why": "..."},
    {"style": "감성 스토리형", "title": "...", "why": "..."},
    {"style": "깔끔한 정보형", "title": "...", "why": "..."}
  ]
}`;
  const raw = (await solarJSON(solarKey, prompt, 0.8, 1000)) as {
    titles?: TitleItem[];
  };
  return Array.isArray(raw.titles) ? raw.titles.slice(0, 3) : [];
}

async function generateReport(
  solarKey: string,
  script: string,
  score: TrendScore,
  category: string,
): Promise<string> {
  const prompt = `당신은 유튜브 콘텐츠 전략 컨설턴트입니다.
아래 영상 분석 결과를 바탕으로 상세 컨설팅 리포트를 한국어로 작성하세요.

[카테고리] ${category}
[트렌드 적합도 점수] ${score.total}/100
  - 제목 키워드 적합도: ${score.keyword_score}/100
  - 시각적 트렌드 부합도: ${score.visual_score}/100
  - 콘텐츠 주제 관련성: ${score.topic_score}/100

[영상 대본 요약]
${script.slice(0, 2000)}

다음 구조로 마크다운 형식의 리포트를 작성하세요. 각 섹션은 ## 으로 시작:
## 영상 강점
(2~3가지)

## 개선이 필요한 부분
(2~3가지)

## 구체적 개선 방향
(행동 가능한 제안 3가지)

## 참신성(Novelty) 평가
기존 인기 영상 대비 이 영상만의 차별점`;

  return solarText(solarKey, prompt, 0.7, 1500);
}

async function extractKeywords(
  solarKey: string,
  script: string,
  category: string,
): Promise<string> {
  try {
    const text = await solarText(
      solarKey,
      `다음 영상 대본에서 썸네일에 넣을 핵심 키워드 3개를 영어로 추출하세요. 키워드만 쉼표로 구분하여 답하세요:\n\n${script.slice(0, 1000)}`,
      0.3,
      60,
    );
    return text.replace(/```/g, "").trim() || category;
  } catch {
    return category;
  }
}

async function generateOneThumbnail(
  openaiKey: string,
  keywords: string,
  style: { name: string; suffix: string },
  customPrompt: string,
): Promise<Thumbnail> {
  let prompt = `YouTube thumbnail for a video about ${keywords}. ${style.suffix}`;
  if (customPrompt) prompt += ` Additional request: ${customPrompt}`;
  try {
    const res = await fetch(`${OPENAI_BASE}/images/generations`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt,
        size: "1792x1024",
        quality: "standard",
        n: 1,
      }),
    });
    if (!res.ok) {
      const t = await res.text();
      throw new Error(`DALL-E ${res.status}: ${t.slice(0, 200)}`);
    }
    const data = (await res.json()) as { data?: Array<{ url?: string }> };
    return {
      style: style.name,
      url: data.data?.[0]?.url ?? null,
      prompt,
    };
  } catch (e) {
    return {
      style: style.name,
      url: null,
      prompt,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

async function generateThumbnails(
  openaiKey: string,
  solarKey: string,
  script: string,
  category: string,
  customPrompt: string,
): Promise<Thumbnail[]> {
  const styles = [
    {
      name: "강렬한 클릭 유도형",
      suffix:
        "Bold, high-contrast colors with large dramatic text overlay. Eye-catching YouTube thumbnail.",
    },
    {
      name: "감성 스토리형",
      suffix:
        "Warm, emotional atmosphere with soft lighting. Storytelling-focused YouTube thumbnail.",
    },
    {
      name: "깔끔한 정보형",
      suffix:
        "Clean, professional design with clear information hierarchy. Minimalist YouTube thumbnail.",
    },
  ];
  const keywords = await extractKeywords(solarKey, script, category);
  return Promise.all(
    styles.map((s) => generateOneThumbnail(openaiKey, keywords, s, customPrompt)),
  );
}

export const Route = createFileRoute("/api/analyze")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const solarKey = process.env.SOLAR_API_KEY;
        const openaiKey = process.env.OPENAI_API_KEY;
        if (!solarKey || !openaiKey) {
          return Response.json(
            { error: "SOLAR_API_KEY 또는 OPENAI_API_KEY가 설정되어 있지 않습니다." },
            { status: 500 },
          );
        }

        let form: FormData;
        try {
          form = await request.formData();
        } catch (e) {
          return Response.json(
            { error: `폼 데이터 파싱 실패: ${e instanceof Error ? e.message : String(e)}` },
            { status: 400 },
          );
        }

        const video = form.get("video");
        const category = (form.get("category") as string) || "Entertainment";
        const customPrompt = (form.get("custom_prompt") as string) || "";

        if (!(video instanceof File)) {
          return Response.json({ error: "video 파일이 필요합니다." }, { status: 400 });
        }
        if (video.size > 25 * 1024 * 1024) {
          return Response.json(
            { error: "영상 파일이 25MB를 초과합니다. Whisper API 제한으로 더 짧은 영상을 사용해주세요." },
            { status: 400 },
          );
        }

        try {
          // Phase 1: 대본 추출 (Whisper)
          const transcript = await transcribeWithWhisper(openaiKey, video);
          const script = transcript.text;
          if (!script || script.length < 5) {
            return Response.json(
              { error: "대본 추출에 실패했거나 음성이 감지되지 않았습니다." },
              { status: 422 },
            );
          }

          // Phase 2: 트렌드 점수 (Solar)
          const score = await calculateTrendScore(solarKey, script, category);

          // Phase 3: 제목 + 썸네일 + 리포트 병렬
          const [titles, thumbnails, report] = await Promise.all([
            generateTitles(solarKey, script, category, customPrompt),
            generateThumbnails(openaiKey, solarKey, script, category, customPrompt),
            generateReport(solarKey, script, score, category),
          ]);

          return Response.json({
            status: "completed",
            result: {
              score,
              titles,
              thumbnails,
              report,
              transcript_preview: script.slice(0, 500),
              wpm: transcript.wpm,
              category,
              analyzed_at: new Date().toISOString(),
            },
          });
        } catch (e) {
          console.error("Analyze pipeline failed:", e);
          return Response.json(
            { error: e instanceof Error ? e.message : String(e) },
            { status: 500 },
          );
        }
      },
    },
  },
});
