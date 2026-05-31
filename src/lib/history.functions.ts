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
    const vector = data.embed_text ? await embed(data.embed_text) : null;

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
    const vector = await embed(data.query);
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
