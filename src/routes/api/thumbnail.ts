import { createFileRoute } from "@tanstack/react-router";

/**
 * 썸네일 다운로드 프록시
 * DALL-E 임시 URL은 CORS로 인해 브라우저에서 직접 download 속성으로 저장이 불가.
 * 서버에서 받아 Content-Disposition: attachment 헤더로 다시 내려준다.
 */
export const Route = createFileRoute("/api/thumbnail")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const target = url.searchParams.get("url");
        const filename = (url.searchParams.get("name") || "thumbnail.png").replace(
          /[^a-zA-Z0-9._-]/g,
          "_",
        );

        if (!target) {
          return new Response("Missing url", { status: 400 });
        }

        // 화이트리스트: OpenAI/Azure blob 도메인만 허용
        let parsed: URL;
        try {
          parsed = new URL(target);
        } catch {
          return new Response("Invalid url", { status: 400 });
        }
        const ok =
          parsed.hostname.endsWith(".openai.com") ||
          parsed.hostname.endsWith(".blob.core.windows.net") ||
          parsed.hostname.endsWith(".oaiusercontent.com");
        if (!ok) {
          return new Response("Host not allowed", { status: 400 });
        }

        const upstream = await fetch(parsed.toString());
        if (!upstream.ok || !upstream.body) {
          return new Response(`Upstream ${upstream.status}`, { status: 502 });
        }
        const contentType = upstream.headers.get("content-type") || "image/png";
        return new Response(upstream.body, {
          status: 200,
          headers: {
            "Content-Type": contentType,
            "Content-Disposition": `attachment; filename="${filename}"`,
            "Cache-Control": "no-store",
          },
        });
      },
    },
  },
});
