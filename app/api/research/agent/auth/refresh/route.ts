import { NextRequest, NextResponse } from "next/server";
import { captureException } from "@/lib/sentryWrapper";
import {
  authorizeAgentRequest,
  mintSandboxCallbackToken,
} from "../../researchAgentAuth";
import {
  captureResearchAgentApiEvent,
  captureResearchAgentApiFailure,
} from "../../captureResearchAgentAnalytics";

const ROUTE = "auth.refresh";

/**
 * Refresh a still-valid sandbox-callback token. Issues a new token with
 * extended expiry, scoped identically to the inbound one. Used by the
 * supervisor to keep long-running conversations alive without rotating
 * out the rest of the connection state.
 *
 * The inbound token must still pass `verifySandboxCallbackToken` (i.e. not
 * expired); a token that has already expired requires a fresh dispatch from
 * our backend, not a refresh.
 */
export async function POST(req: NextRequest) {
  try {
    const auth = authorizeAgentRequest({ req, route: ROUTE });
    if (auth.kind === "errorResponse") return auth.errorResponse;

    const newToken = mintSandboxCallbackToken({
      sandboxId: auth.payload.sandboxId,
      conversationId: auth.payload.conversationId,
      projectId: auth.payload.projectId,
      userId: auth.payload.userId,
    });

    captureResearchAgentApiEvent({
      route: ROUTE,
      status: "success",
      conversationId: auth.payload.conversationId,
      projectId: auth.payload.projectId,
      userId: auth.payload.userId,
    });

    return NextResponse.json({ ok: true, token: newToken });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    captureException(error);
    captureResearchAgentApiFailure(ROUTE, error);
    return NextResponse.json(
      {
        error: "Failed to refresh sandbox callback token",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
