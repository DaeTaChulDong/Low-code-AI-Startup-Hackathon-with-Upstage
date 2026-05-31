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
});

const ListSchema = z.object({
  session_id: SessionIdSchema,
});

const DeleteSchema = z.object({
  session_id: SessionIdSchema,
  id: z.string().uuid(),
});

export type StoredAnalysis = {
  id: string;
  filename: string | null;
  category: string | null;
  score_total: number | null;
  result: unknown;
  extracted: unknown;
  created_at: string;
};

export const saveAnalysis = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => SaveSchema.parse(input))
  .handler(async ({ data }) => {
    const { data: row, error } = await supabaseAdmin
      .from("analyses")
      .insert({
        session_id: data.session_id,
        filename: data.filename ?? null,
        category: data.category ?? null,
        score_total: data.score_total ?? null,
        result: data.result as never,
        extracted: (data.extracted ?? null) as never,
      })
      .select("id, created_at")
      .single();

    if (error) {
      console.error("saveAnalysis failed:", error);
      throw new Error(error.message);
    }
    return { id: row.id, created_at: row.created_at };
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
