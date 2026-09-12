import { NextRequest, NextResponse } from "next/server";
import {
  $getRoot,
  $isElementNode,
  type LexicalNode,
} from "lexical";
import {
  $isImageNode,
  type ImageNode,
} from "@/components/lexical/nodes/ImageNode";
import { getContextFromReqAndRes } from "@/server/vulcan-lib/apollo-server/context";
import { captureException } from "@/lib/sentryWrapper";
import {
  authorizeAgentDraftAccess,
  waitForProviderFlush,
  withMainDocEditorSession,
} from "../editorAgentUtil";
import { replaceImageToolSchema } from "../toolSchemas";
import {
  captureAgentApiEvent,
  captureAgentApiFailure,
} from "../captureAgentAnalytics";

interface ReplaceImageResult {
  replaced: boolean;
  matchCount: number;
  note: string;
}

function $collectImagesBySrc(node: LexicalNode, src: string, matches: ImageNode[]): void {
  if ($isImageNode(node) && node.getSrc() === src) {
    matches.push(node);
  }
  if ($isElementNode(node)) {
    for (const child of node.getChildren()) {
      $collectImagesBySrc(child, src, matches);
    }
  }
}

export function $replaceImageInEditor({
  currentSrc,
  replacementSrc,
  altText,
}: {
  currentSrc: string;
  replacementSrc: string;
  altText?: string;
}): ReplaceImageResult {
  const matches: ImageNode[] = [];
  $collectImagesBySrc($getRoot(), currentSrc, matches);

  if (matches.length === 0) {
    return {
      replaced: false,
      matchCount: 0,
      note: "No image has the given currentSrc. Re-read the draft and copy the exact image URL.",
    };
  }
  if (matches.length > 1) {
    return {
      replaced: false,
      matchCount: matches.length,
      note: "More than one image has the given currentSrc, so the replacement is ambiguous.",
    };
  }

  const image = matches[0];
  image.setSrc(replacementSrc);
  image.setSrcset(null);
  if (altText !== undefined) {
    image.setAltText(altText);
  }

  return {
    replaced: true,
    matchCount: 1,
    note: "Replaced the image while preserving its caption and display size.",
  };
}

async function replaceImageInMainDoc({
  postId,
  token,
  currentSrc,
  replacementSrc,
  altText,
}: {
  postId: string;
  token: string;
  currentSrc: string;
  replacementSrc: string;
  altText?: string;
}): Promise<ReplaceImageResult> {
  return withMainDocEditorSession({
    postId,
    token,
    operationLabel: "ReplaceImage",
    callback: async ({ editor, provider }) => {
      let result: ReplaceImageResult = {
        replaced: false,
        matchCount: 0,
        note: "No image replacement performed.",
      };

      await new Promise<void>((resolve) => {
        editor.update(() => {
          result = $replaceImageInEditor({
            currentSrc,
            replacementSrc,
            altText,
          });
        }, { onUpdate: resolve });
      });

      if (result.replaced) {
        await waitForProviderFlush(provider);
      }
      return result;
    },
  });
}

export async function POST(req: NextRequest) {
  const [body, context] = await Promise.all([
    req.json(),
    getContextFromReqAndRes({ req, isSSR: false }),
  ]);
  const parseResult = replaceImageToolSchema.safeParse(body);

  if (!parseResult.success) {
    captureAgentApiEvent({
      route: "replaceImage",
      postId: body?.postId,
      userId: context.currentUser?._id,
      agentName: body?.agentName,
      status: "validation_error",
    });
    return NextResponse.json(
      { error: "Invalid request body", details: parseResult.error.format() },
      { status: 400 },
    );
  }

  const {
    postId,
    key,
    agentName,
    currentSrc,
    replacementSrc,
    altText,
  } = parseResult.data;

  try {
    const auth = await authorizeAgentDraftAccess({
      route: "replaceImage",
      postId,
      context,
      linkSharingKey: key,
      agentName,
    });
    if ("errorResponse" in auth) {
      return auth.errorResponse;
    }

    const result = await replaceImageInMainDoc({
      postId,
      token: auth.token,
      currentSrc,
      replacementSrc,
      altText,
    });
    captureAgentApiEvent({
      route: "replaceImage",
      postId,
      userId: context.currentUser?._id,
      agentName,
      status: "success",
      operationResult: result.replaced ? "replaced" : "not_replaced",
    });

    return NextResponse.json({
      ok: true,
      postId,
      replaced: result.replaced,
      matchCount: result.matchCount,
      note: result.note,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    captureException(error);
    captureAgentApiFailure("replaceImage", error, {
      postId,
      userId: context.currentUser?._id,
      agentName,
    });
    return NextResponse.json(
      {
        error: "Failed to replace image in collaborative draft",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
