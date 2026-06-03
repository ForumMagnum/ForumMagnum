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
  sandboxId?: string;
  userId?: string;
  status: ResearchAgentApiStatus;
  /** For `unauthorized`: discriminator from `verifySandboxCallbackToken`. */
  authFailure?: string;
  /** For `forbidden`: short tag describing which check failed. */
  reason?: string;
  errorCategory?: string;
  /** Categorical outcome of the operation (e.g. "inserted", "deleted", "persisted"). */
  operationResult?: string;
  /** Whether a turn was running, on the heartbeat route. */
  turnRunning?: boolean;
  /** Size of a returned collection (conversations, documents, transcript turns). */
  count?: number;
  /** Character length of returned/affected content. */
  charCount?: number;
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
