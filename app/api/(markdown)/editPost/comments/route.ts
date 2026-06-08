import { NextRequest, NextResponse } from "next/server";
import { getContextFromReqAndRes } from "@/server/vulcan-lib/apollo-server/context";
import { checkEditorTypeAndGetToken } from "../../../agent/editorAgentUtil";
import { readOpenCommentThreads } from "../../editorMarkdownUtils";
import { captureException } from "@/lib/sentryWrapper";

const NO_CACHE_HEADERS = {
  "Cache-Control": "private, no-store, max-age=0",
};

export async function GET(req: NextRequest) {
  const postId = req.nextUrl.searchParams.get("postId");
  const key = req.nextUrl.searchParams.get("key") ?? undefined;

  if (!postId) {
    return NextResponse.json(
      { error: "No postId provided" },
      { status: 400, headers: NO_CACHE_HEADERS },
    );
  }

  try {
    const context = await getContextFromReqAndRes({ req });
    const checkResult = await checkEditorTypeAndGetToken({
      postId,
      context,
      linkSharingKey: key,
    });

    if (checkResult.kind === "unsupported_editor") {
      return NextResponse.json(
        {
          error: "Unsupported editor",
          editorType: checkResult.editorType,
          message: "Only posts authored in the Lexical editor are currently supported.",
        },
        { status: 400, headers: NO_CACHE_HEADERS },
      );
    }

    if (checkResult.kind === "unauthorized") {
      return NextResponse.json(
        {
          error: "Unauthorized",
          message: "No accessible shared draft found for this postId and key.",
        },
        { status: 403, headers: NO_CACHE_HEADERS },
      );
    }

    const threads = await readOpenCommentThreads({ postId, token: checkResult.token });
    return NextResponse.json(
      { postId, threads },
      { headers: NO_CACHE_HEADERS },
    );
  } catch (error) {
    captureException(error);
    return NextResponse.json(
      {
        error: "Failed to read draft comment threads",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500, headers: NO_CACHE_HEADERS },
    );
  }
}
