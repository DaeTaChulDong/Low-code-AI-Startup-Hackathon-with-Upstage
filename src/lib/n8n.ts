/**
 * n8n Webhook 호출 유틸리티
 */

export interface N8nWebhookPayload {
  [key: string]: unknown;
}

export async function callN8n(payload: N8nWebhookPayload): Promise<unknown> {
  const webhookUrl = "https://eugene385.app.n8n.cloud/webhook-test/Think-it-Pro";

  if (!webhookUrl) {
    throw new Error("VITE_N8N_WEBHOOK_URL 환경변수가 설정되어 있지 않습니다.");
  }

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`n8n Webhook error ${response.status}: ${text.slice(0, 300)}`);
  }

  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json();
  }

  return response.text();
}
