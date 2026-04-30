import { $getRoot } from "lexical";
import { $generateHtmlFromNodes } from "@lexical/html";
import TypoSuggestions from "@/server/collections/typoSuggestions/collection";
import { getLatestRev } from "@/server/editor/utils";
import { withDomGlobals } from "@/server/editor/withDomGlobals";
import { updateComment } from "@/server/collections/comments/mutations";
import { updatePost } from "@/server/collections/posts/mutations";
import { captureException } from "@/lib/sentryWrapper";
import type { TypoAcceptMode, TypoSuggestionStatus, TypoSuggestionTargetCollection } from "@/lib/collections/typoSuggestions/constants";
import { antiReactToTypoOnOwnContent } from "./antiReact";
import { loadHtmlIntoHeadlessEditor } from "./headlessLexical";
import {
  $applyEditReplacement,
  $applyEditReplacementMultiNode,
  replaceTextInMainDoc,
} from "../../../../app/api/agent/replaceText/route";
import { checkEditorTypeAndGetToken } from "../../../../app/api/agent/editorAgentUtil";
import { locateMarkdownQuoteSelectionInSubtree } from "../../../../app/api/agent/mapMarkdownToLexical";

const TYPO_BOT_AUTHOR_ID = "typo-suggestion-bot";

interface ApplyOutcome {
  status: TypoSuggestionStatus;
  appliedRevisionId?: string;
  message?: string;
}

type OfflineEditOutcome =
  | { kind: "replaced"; html: string }
  | { kind: "stale" }
  | { kind: "unmatched" };

/**
 * Apply (or schedule for in-editor review) a typo suggestion the author
 * has accepted, then persist the resolution to the TypoSuggestion row.
 *
 * Posts (mode: "APPLY"): route the edit through the live Yjs/Hocuspocus
 * session via `replaceTextInMainDoc`, then publish via `updatePost`. The
 * `applyWouldRequirePublishingUnrelatedChanges` resolver guards the hover —
 * it disables Apply when the live Yjs state has unpublished edits unrelated
 * to this fix, so by the time we get here the live Yjs state and the latest
 * revision were equivalent at hover time.
 *
 * Posts (mode: "SUGGEST"): only insert a ProtonNode delete/insert pair into
 * the live Yjs state via `replaceTextInMainDoc` mode "suggest". The author
 * handles accept/reject in the editor.
 *
 * Comments (mode: "APPLY"): apply the edit primitives offline against a
 * headless Lexical editor loaded with the latest revision's HTML, save
 * through `updateComment`. Comments don't get mode: "SUGGEST" — baking
 * ProtonNodes into a non-collaborative Lexical doc with no thread tracking
 * is too risky.
 */
export async function applyTypoSuggestion({
  suggestion,
  mode,
  resolvedByUserId,
  context,
}: {
  suggestion: DbTypoSuggestion;
  mode: TypoAcceptMode;
  resolvedByUserId: string;
  context: ResolverContext;
}): Promise<DbTypoSuggestion | null> {
  const outcome = await runApply(suggestion, mode, context);
  await persistOutcome(suggestion._id, outcome, resolvedByUserId);

  // On a successful resolution, anti-react to the typo so the original
  // react drops out of the public display. Skip for stale/failed — the
  // typo react may still be relevant in those cases.
  if (
    (outcome.status === "accepted" || outcome.status === "accepted_as_suggestion") &&
    context.currentUser
  ) {
    await antiReactToTypoOnOwnContent({
      collectionName: suggestion.collectionName as TypoSuggestionTargetCollection,
      documentId: suggestion.documentId,
      quote: suggestion.quote,
      user: context.currentUser,
      context,
    });
  }

  return TypoSuggestions.findOne(suggestion._id);
}

async function runApply(
  suggestion: DbTypoSuggestion,
  mode: TypoAcceptMode,
  context: ResolverContext,
): Promise<ApplyOutcome> {
  if (!suggestion.proposedReplacement) {
    return { status: "failed", message: "No proposed replacement on suggestion." };
  }

  const latestRev = await getLatestRev(suggestion.documentId, suggestion.fieldName, context);
  if (!latestRev || latestRev.originalContents?.type !== "lexical") {
    return {
      status: "failed",
      message: "This document is no longer using the Lexical editor; auto-apply isn't supported.",
    };
  }
  const latestHtml = latestRev.html ?? "";

  if (suggestion.collectionName === "Posts") {
    return applyToPost(suggestion, mode, latestHtml, context);
  }
  if (suggestion.collectionName === "Comments") {
    if (mode === "SUGGEST") {
      return { status: "failed", message: "'Open in editor' is not supported for comments." };
    }
    return applyToComment(suggestion, latestHtml, context);
  }
  return { status: "failed", message: `Unknown collectionName: ${suggestion.collectionName}` };
}

async function applyToPost(
  suggestion: DbTypoSuggestion,
  mode: TypoAcceptMode,
  latestHtml: string,
  context: ResolverContext,
): Promise<ApplyOutcome> {
  const auth = await checkEditorTypeAndGetToken({
    postId: suggestion.documentId,
    context,
    linkSharingKey: undefined,
  });
  if (auth.kind === "unsupported_editor") {
    return {
      status: "failed",
      message: `This post uses the ${auth.editorType} editor and cannot be auto-edited.`,
    };
  }
  if (auth.kind === "unauthorized") {
    return { status: "failed", message: "Could not obtain Hocuspocus token for this post." };
  }

  const replaceMode = mode === "APPLY" ? "edit" : "suggest";
  const result = await replaceTextInMainDoc({
    postId: suggestion.documentId,
    token: auth.token,
    quote: suggestion.quote,
    replacement: suggestion.proposedReplacement!,
    mode: replaceMode,
    authorName: "Typo bot",
    authorId: TYPO_BOT_AUTHOR_ID,
  });

  if (!result.quoteFoundInDocument) {
    return { status: "stale", message: "The flagged text is no longer in the document." };
  }
  if (!result.replaced) {
    return { status: "failed", message: result.note };
  }

  if (mode === "SUGGEST") {
    return { status: "accepted_as_suggestion" };
  }

  // For "Apply": the live Yjs state now has the typo fix.  We also want the
  // publicly-visible revision to reflect the fix immediately. The
  // `applyWouldRequirePublishingUnrelatedChanges` resolver guarantees Yjs
  // and the latest revision were equivalent at hover time, so applying the
  // same edit to `latestHtml` reproduces what the editor would publish — no
  // second Hocuspocus round-trip required.
  let publishedHtml: string;
  try {
    const offlineResult = applyEditOffline(latestHtml, suggestion.quote, suggestion.proposedReplacement!);
    if (offlineResult.kind !== "replaced") {
      return {
        status: "accepted",
        message: "Typo applied to the live editor, but couldn't be applied to the published revision. Open the editor and click 'Publish Changes'.",
      };
    }
    publishedHtml = offlineResult.html;
  } catch (err) {
    captureException(err);
    return {
      status: "accepted",
      message: "Typo applied to the live editor, but auto-publishing failed; open the editor and click 'Publish Changes' to push the fix live.",
    };
  }

  try {
    await updatePost(
      {
        selector: { _id: suggestion.documentId },
        data: { contents: { originalContents: { type: "lexical", data: publishedHtml } } },
      },
      context,
    );
  } catch (err) {
    captureException(err);
    return { status: "accepted", message: "Typo applied to the live editor, but auto-publishing failed." };
  }

  return { status: "accepted" };
}

async function applyToComment(
  suggestion: DbTypoSuggestion,
  latestHtml: string,
  context: ResolverContext,
): Promise<ApplyOutcome> {
  let offlineResult: OfflineEditOutcome;
  try {
    offlineResult = applyEditOffline(latestHtml, suggestion.quote, suggestion.proposedReplacement!);
  } catch (err) {
    captureException(err);
    return { status: "failed", message: err instanceof Error ? err.message : "Headless edit failed." };
  }
  if (offlineResult.kind === "stale") {
    return { status: "stale", message: "The flagged text is no longer in the comment." };
  }
  if (offlineResult.kind === "unmatched") {
    return {
      status: "failed",
      message: "Quote was found but spanned formatting boundaries; could not be applied.",
    };
  }

  try {
    const updated = await updateComment(
      {
        selector: { _id: suggestion.documentId },
        data: { contents: { originalContents: { type: "lexical", data: offlineResult.html } } },
      },
      context,
    );
    return { status: "accepted", appliedRevisionId: updated.contents_latest ?? undefined };
  } catch (err) {
    captureException(err);
    return { status: "failed", message: err instanceof Error ? err.message : "Failed to save comment edit." };
  }
}

/**
 * Headless, edit-only Lexical replacement: load HTML into an offline editor,
 * locate the markdown quote, apply the replacement using the same primitives
 * the post agent API uses for `mode: "edit"`, and serialize back to HTML.
 *
 * Used by the comment apply path (where it's the source of truth) and by the
 * post Apply path's auto-publish step (where it produces the HTML that goes
 * into the new published revision).
 */
function applyEditOffline(html: string, quote: string, replacement: string): OfflineEditOutcome {
  return withDomGlobals(() => {
    const editor = loadHtmlIntoHeadlessEditor(html, "ApplyTypoOffline");

    let replaced = false;
    let quoteFoundInDocument = false;

    editor.update(
      () => {
        const root = $getRoot();
        const selectionResult = locateMarkdownQuoteSelectionInSubtree({
          rootNodeKey: root.getKey(),
          markdownQuote: quote,
        });
        quoteFoundInDocument = selectionResult.found;
        if (!selectionResult.found || !selectionResult.anchor || !selectionResult.focus) return;

        const { anchor, focus } = selectionResult;
        const sameTextNode =
          anchor.key === focus.key && anchor.type === "text" && focus.type === "text";

        if (sameTextNode) {
          replaced = $applyEditReplacement({
            editor,
            matchedNodeKey: anchor.key,
            startOffset: anchor.offset,
            endOffset: focus.offset,
            replacement,
          });
        } else {
          replaced = $applyEditReplacementMultiNode({ editor, anchor, focus, replacement });
        }
      },
      { discrete: true },
    );

    if (!quoteFoundInDocument) return { kind: "stale" };
    if (!replaced) return { kind: "unmatched" };

    let outputHtml = html;
    editor.getEditorState().read(() => {
      outputHtml = $generateHtmlFromNodes(editor, null);
    });
    return { kind: "replaced", html: outputHtml };
  });
}

async function persistOutcome(
  suggestionId: string,
  outcome: ApplyOutcome,
  resolvedByUserId: string,
): Promise<void> {
  await TypoSuggestions.rawUpdateOne(
    { _id: suggestionId },
    {
      $set: {
        status: outcome.status,
        resolvedByUserId,
        resolvedAt: new Date(),
        ...(outcome.appliedRevisionId ? { appliedRevisionId: outcome.appliedRevisionId } : {}),
        ...(outcome.message ? { explanation: outcome.message } : {}),
      },
    },
  );
}
