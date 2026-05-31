import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const SessionIdSchema = z
  .string()
  .min(8)
  .max(64)
  .regex(/^[a-zA-Z0-9_-]+$/);

const SaveSchema = z.object({
  session_id: SessionIdSchema,
  filename: z.string().max(512).nullable().optional(),
  category: z.string().max(128).nullable().optional(),
  score_total: z.number().int().min(0).max(100).nullable().optional(),
  result: z.unknown(),
  extracted: z.unknown().nullable().optional(),
  embed_text: z.string().max(20000).nullable().optional(),
});

const ListSchema = z.object({
  session_id: SessionIdSchema,
});

const DeleteSchema = z.object({
  session_id: SessionIdSchema,
  id: z.string().uuid(),
});

const SearchSchema = z.object({
  session_id: SessionIdSchema,
  query: z.string().min(1).max(500),
  limit: z.number().int().min(1).max(20).optional(),
});

const AskSchema = z.object({
  session_id: SessionIdSchema,
  id: z.string().uuid().optional(),
  transcript: z.string().min(1).max(50000).optional(),
  question: z.string().min(1).max(1000),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(4000),
      }),
    )
    .max(20)
    .optional(),
});
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type StoredAnalysis = {
  id: string;
  filename: string | null;
  category: string | null;
  score_total: number | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  result: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  extracted: any;
  created_at: string;
  similarity?: number;
};

// Upstage Solar Embedding — 4096 dims.
// "passage" model for stored docs, "query" model for searches (asymmetric).
const UPSTAGE_EMBEDDING_URL = "https://api.upstage.ai/v1/solar/embeddings";
const UPSTAGE_PASSAGE_MODEL = "embedding-passage";
const UPSTAGE_QUERY_MODEL = "embedding-query";
const EMBEDDING_DIMS = 4096;

async function embed(
  text: string,
  kind: "passage" | "query",
): Promise<number[] | null> {
  const key = process.env.SOLAR_API_KEY;
  if (!key) {
    console.error("SOLAR_API_KEY missing — embedding skipped");
    return null;
  }
  try {
    const res = await fetch(UPSTAGE_EMBEDDING_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: kind === "passage" ? UPSTAGE_PASSAGE_MODEL : UPSTAGE_QUERY_MODEL,
        input: text.slice(0, 8000),
      }),
    });
    if (!res.ok) {
      const t = await res.text();
      console.error(`Upstage embedding error ${res.status}: ${t.slice(0, 300)}`);
      return null;
    }
    const data = (await res.json()) as {
      data?: Array<{ embedding?: number[] }>;
    };
    const vec = data.data?.[0]?.embedding;
    return Array.isArray(vec) && vec.length === EMBEDDING_DIMS ? vec : null;
  } catch (e) {
    console.error("Upstage embedding fetch failed:", e);
    return null;
  }
}

export const saveAnalysis = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => SaveSchema.parse(input))
  .handler(async ({ data }) => {
    // Embed in the background — failure should not block saving.
    const vector = data.embed_text ? await embed(data.embed_text, "passage") : null;

    const { data: row, error } = await supabaseAdmin
      .from("analyses")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .insert({
        session_id: data.session_id,
        filename: data.filename ?? null,
        category: data.category ?? null,
        score_total: data.score_total ?? null,
        result: data.result as never,
        extracted: (data.extracted ?? null) as never,
        embed_text: data.embed_text ?? null,
        // pgvector accepts the JS array directly via the JS client
        embedding: vector as never,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any)
      .select("id, created_at")
      .single();

    if (error) {
      console.error("saveAnalysis failed:", error);
      throw new Error(error.message);
    }
    return { id: row.id, created_at: row.created_at, embedded: vector !== null };
  });

export const listAnalyses = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => ListSchema.parse(input))
  .handler(async ({ data }): Promise<StoredAnalysis[]> => {
    const { data: rows, error } = await supabaseAdmin
      .from("analyses")
      .select("id, filename, category, score_total, result, extracted, created_at")
      .eq("session_id", data.session_id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("listAnalyses failed:", error);
      throw new Error(error.message);
    }
    return (rows ?? []) as StoredAnalysis[];
  });

export const deleteAnalysis = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => DeleteSchema.parse(input))
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin
      .from("analyses")
      .delete()
      .eq("session_id", data.session_id)
      .eq("id", data.id);
    if (error) {
      console.error("deleteAnalysis failed:", error);
      throw new Error(error.message);
    }
    return { ok: true };
  });

export const searchAnalyses = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => SearchSchema.parse(input))
  .handler(async ({ data }): Promise<StoredAnalysis[]> => {
    const vector = await embed(data.query, "query");
    if (!vector) {
      throw new Error("검색 쿼리 임베딩 생성에 실패했습니다.");
    }
    const { data: rows, error } = await supabaseAdmin.rpc("match_analyses", {
      query_embedding: vector as unknown as string,
      match_session_id: data.session_id,
      match_count: data.limit ?? 10,
      min_similarity: 0.2,
    });
    if (error) {
      console.error("searchAnalyses failed:", error);
      throw new Error(error.message);
    }
    return (rows ?? []) as StoredAnalysis[];
  });

// ───────────────────────────────────────────────────────────────────────
// Grounded Q&A — answers based ONLY on a stored analysis transcript.
// Uses Upstage Solar Chat with a strict grounding system prompt.
// ───────────────────────────────────────────────────────────────────────
const SOLAR_CHAT_URL = "https://api.upstage.ai/v1/solar/chat/completions";
const SOLAR_CHAT_MODEL = "solar-pro2";

type AnalysisResultLike = {
  transcript?: string;
  transcript_preview?: string;
  report?: string;
  category?: string;
  auto_category?: { primary_category?: string; sub_category?: string };
} | null;

export const askAnalysis = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => AskSchema.parse(input))
  .handler(async ({ data }): Promise<{ answer: string }> => {
    const key = process.env.SOLAR_API_KEY;
    if (!key) throw new Error("SOLAR_API_KEY가 설정되어 있지 않습니다.");

    // Prefer client-passed transcript; fall back to loading from DB by id.
    let transcript = (data.transcript ?? "").trim();
    let category: string | undefined;
    if (!transcript && data.id) {
      const { data: row, error } = await supabaseAdmin
        .from("analyses")
        .select("result, category")
        .eq("session_id", data.session_id)
        .eq("id", data.id)
        .maybeSingle();
      if (error) throw new Error(error.message);
      const r = (row?.result ?? null) as AnalysisResultLike;
      transcript = (r?.transcript ?? r?.transcript_preview ?? "").trim();
      category = row?.category ?? r?.category ?? undefined;
    }
    if (!transcript) {
      throw new Error("대본을 찾을 수 없습니다. 분석 결과에 대본이 저장되지 않았어요.");
    }

    const truncated = transcript.slice(0, 12000);
    const system = `당신은 유튜브 콘텐츠 컨설턴트입니다. 사용자의 질문에 대해 아래 [영상 대본] 내용만 근거로 한국어로 답하세요.

규칙:
1. 대본에 직접 나오지 않은 사실은 절대 추측하거나 지어내지 마세요.
2. 대본에 없는 정보를 물어보면 "대본에 해당 내용이 없습니다."라고 명확히 답하세요.
3. 답변 마지막에는 (필요시) 대본의 짧은 인용구를 1~2개 따옴표로 제시하세요.
4. 답변은 간결하고 구체적으로, 불필요한 서론 없이 바로 답하세요.

[영상 대본${category ? ` · 카테고리: ${category}` : ""}]
${truncated}`;

    const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
      { role: "system", content: system },
      ...(data.history ?? []).map((m) => ({ role: m.role, content: m.content })),
      { role: "user", content: data.question },
    ];

    const res = await fetch(SOLAR_CHAT_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: SOLAR_CHAT_MODEL,
        messages,
        temperature: 0.2,
        max_tokens: 800,
      }),
    });
    if (!res.ok) {
      const t = await res.text();
      throw new Error(`Solar 응답 오류 ${res.status}: ${t.slice(0, 200)}`);
    }
    const json = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const answer = (json.choices?.[0]?.message?.content ?? "").trim();
    if (!answer) throw new Error("빈 응답을 받았습니다.");
    return { answer };
  });
