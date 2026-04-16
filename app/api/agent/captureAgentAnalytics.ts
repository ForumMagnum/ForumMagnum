import { serverCaptureEvent } from "@/server/analytics/serverAnalyticsWriter";

type AgentApiStatus = "success" | "validation_error" | "unauthorized" | "unsupported_editor" | "internal_error";

interface AgentApiEventProps {
  route: string;
  postId?: string;
  agentName?: string;
  userId?: string;
  status: AgentApiStatus;
  errorCategory?: string;
  // Set on success to describe what actually happened, especially partial failures
  // e.g. "inserted", "not_inserted", "replaced", "quote_not_found", "anchor_top_level_no_match"
  operationResult?: string;
  threadId?: string;
}

function categorizeError(error: unknown): string {
  if (!(error instanceof Error)) return "unknown";
  const msg = error.message.toLowerCase();
  if (msg.includes("timeout") || msg.includes("timed out")) return "timeout";
  if (msg.includes("hocuspocus") || msg.includes("websocket")) return "connection_error";
  return "internal_error";
}

export function captureAgentApiEvent(props: AgentApiEventProps) {
  serverCaptureEvent("agentApiCall", props);
}

export function captureAgentApiFailure(
  route: string,
  error: unknown,
  extra?: { postId?: string; agentName?: string; userId?: string },
) {
  captureAgentApiEvent({
    route,
    status: "internal_error",
    errorCategory: categorizeError(error),
    ...extra,
  });
}
