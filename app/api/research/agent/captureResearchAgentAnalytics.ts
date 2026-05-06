import { serverCaptureEvent } from "@/server/analytics/serverAnalyticsWriter";

type ResearchAgentApiStatus =
  | "success"
  | "validation_error"
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "unsupported_editor"
  | "internal_error";

interface ResearchAgentApiEventProps {
  route: string;
  conversationId?: string;
  projectId?: string;
  documentId?: string;
  userId?: string;
  status: ResearchAgentApiStatus;
  /** For `unauthorized`: discriminator from `verifySandboxCallbackToken`. */
  authFailure?: string;
  /** For `forbidden`: short tag describing which check failed. */
  reason?: string;
  errorCategory?: string;
  /** Set on success to describe what actually happened (e.g. "inserted", "replaced"). */
  operationResult?: string;
}

function categorizeError(error: unknown): string {
  if (!(error instanceof Error)) return "unknown";
  const msg = error.message.toLowerCase();
  if (msg.includes("timeout") || msg.includes("timed out")) return "timeout";
  if (msg.includes("hocuspocus") || msg.includes("websocket")) return "connection_error";
  return "internal_error";
}

export function captureResearchAgentApiEvent(props: ResearchAgentApiEventProps) {
  serverCaptureEvent("researchAgentApiCall", props);
}

export function captureResearchAgentApiFailure(
  route: string,
  error: unknown,
  extra?: { conversationId?: string; projectId?: string; documentId?: string; userId?: string },
) {
  captureResearchAgentApiEvent({
    route,
    status: "internal_error",
    errorCategory: categorizeError(error),
    ...extra,
  });
}
