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
  $applyEditWithNarrowing,
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
 * session via `replaceTextInMainDoc`, take the post-edit HTML from the live
 * Lexical state (single source of truth), and publish that via `updatePost`.
 * Before publishing we replay the same edit offline against the latest
 * published revision and require the result to canonicalize to the same
 * HTML as the live post-edit state — that's the invariant that guarantees
 * the only difference between the live doc and the published rev is our
 * typo fix. If the invariant fails the author has unpublished edits that
 * aren't part of this fix; we leave them in Yjs and don't auto-publish.
 *
 * Posts (mode: "SUGGEST"): only insert a ProtonNode delete/insert pair into
 * the live Yjs state via `replaceTextInMainDoc` mode "suggest". The author
 * handles accept/reject in the editor.
 *
 * Comments (mode: "APPLY"): apply the edit primitives offline against a
 * headless Lexical editor loaded with the latest revision's HTML, save
 * through `updateComment`. Comments don't go through Hocuspocus and don't
 * get mode: "SUGGEST" — baking ProtonNodes into a non-collaborative Lexical
 * doc with no thread tracking is too risky.
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
  // State-machine boundary: any unexpected throw inside `runApply` must still
  // transition the row out of `pending`, otherwise the suggestion is stuck.
  let outcome: ApplyOutcome;
  try {
    outcome = await runApply(suggestion, mode, context);
  } catch (err) {
    captureException(err);
    outcome = {
      status: "failed",
      message: err instanceof Error ? err.message : "Typo apply failed.",
    };
  }
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

  if (outcome.message) {
    throw new Error(outcome.message);
  }

  return TypoSuggestions.findOne(suggestion._id);
}

async function runApply(
  suggestion: DbTypoSuggestion,
  mode: TypoAcceptMode,
  context: ResolverContext,
): Promise<ApplyOutcome> {
  const { proposedReplacement, llmCanonicalQuote } = suggestion;
  if (!proposedReplacement) {
    return { status: "failed", message: "No proposed replacement on suggestion." };
  }
  // Apply-time matching is in markdown coordinates; the reactor-form `quote`
  // can't drive the edit primitives. If we don't have an LLM canonical span,
  // we never had a `fix_typo` verdict and shouldn't be here.
  if (!llmCanonicalQuote) {
    return { status: "failed", message: "No LLM canonical quote on suggestion." };
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
    return applyToPost(suggestion, mode, latestHtml, llmCanonicalQuote, proposedReplacement, context);
  }
  if (suggestion.collectionName === "Comments") {
    if (mode === "SUGGEST") {
      return { status: "failed", message: "'Open in editor' is not supported for comments." };
    }
    return applyToComment(suggestion, latestHtml, llmCanonicalQuote, proposedReplacement, context);
  }
  return { status: "failed", message: `Unknown collectionName: ${suggestion.collectionName}` };
}

async function applyToPost(
  suggestion: DbTypoSuggestion,
  mode: TypoAcceptMode,
  latestHtml: string,
  quote: string,
  replacement: string,
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
    quote,
    replacement,
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

  // APPLY mode. The live Yjs state now has the typo fix. We want to publish
  // it as a new revision — but only if the live state matches "latest
  // published rev + this typo fix". Anything else means the author has
  // pending unrelated edits in Yjs; auto-publishing those would unilaterally
  // ship work the author hasn't chosen to publish, so we bail and leave the
  // typo fix in Yjs for them to publish manually.
  const livePostEditHtml = result.postEditHtml;
  if (!livePostEditHtml) {
    return {
      status: "accepted",
      message: "Typo applied to the live editor, but couldn't read post-edit state for auto-publishing. Open the editor and click 'Publish Changes' to push the fix live.",
    };
  }

  // From here, the typo IS already in Yjs. Wrap the rest so any unexpected
  // throw (offline replay, canonicalization, or the publish call) still
  // resolves to "applied to live, publish manually" rather than leaving the
  // row in pending while the live state silently has the fix.
  try {
    const offlineResult = applyEditOffline(latestHtml, quote, replacement);
    if (offlineResult.kind !== "replaced") {
      return {
        status: "accepted",
        message: "Typo applied to the live editor, but couldn't compute a reference for auto-publishing. Open the editor and click 'Publish Changes'.",
      };
    }
    if (!liveAndReferenceMatch(livePostEditHtml, offlineResult.html)) {
      return {
        status: "accepted",
        message: "Typo applied to the live editor, but the post has unpublished edits unrelated to this fix. Open the editor and click 'Publish Changes' to publish all your changes — including this fix — together.",
      };
    }
    const updated = await updatePost(
      {
        selector: { _id: suggestion.documentId },
        data: { contents: { originalContents: { type: "lexical", data: livePostEditHtml } } },
      },
      context,
    );
    return { status: "accepted", appliedRevisionId: updated.contents_latest ?? undefined };
  } catch (err) {
    captureException(err);
    return {
      status: "accepted",
      message: "Typo applied to the live editor, but auto-publishing failed; open the editor and click 'Publish Changes' to push the fix live.",
    };
  }
}

/**
 * Two HTMLs are considered equivalent for invariant-check purposes if they
 * canonicalize to the same string after a round-trip through a headless
 * Lexical editor. This absorbs benign differences (attribute ordering,
 * whitespace) between the live Yjs serializer and the offline-replay
 * serializer while still catching real content drift.
 */
function liveAndReferenceMatch(liveHtml: string, referenceHtml: string): boolean {
  if (liveHtml === referenceHtml) return true;
  return canonicalizeHtml(liveHtml) === canonicalizeHtml(referenceHtml);
}

function canonicalizeHtml(html: string): string {
  return withDomGlobals(() => {
    const editor = loadHtmlIntoHeadlessEditor(html, "TypoCanonicalize");
    let out = "";
    editor.getEditorState().read(() => {
      out = $generateHtmlFromNodes(editor, null);
    });
    return out;
  });
}

async function applyToComment(
  suggestion: DbTypoSuggestion,
  latestHtml: string,
  quote: string,
  replacement: string,
  context: ResolverContext,
): Promise<ApplyOutcome> {
  const offlineResult = applyEditOffline(latestHtml, quote, replacement);
  if (offlineResult.kind === "stale") {
    return { status: "stale", message: "The flagged text is no longer in the comment." };
  }
  if (offlineResult.kind === "unmatched") {
    return {
      status: "failed",
      message: "Quote was found but spanned formatting boundaries; could not be applied.",
    };
  }

  const updated = await updateComment(
    {
      selector: { _id: suggestion.documentId },
      data: { contents: { originalContents: { type: "lexical", data: offlineResult.html } } },
    },
    context,
  );
  return { status: "accepted", appliedRevisionId: updated.contents_latest ?? undefined };
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

        const editResult = $applyEditWithNarrowing({
          editor,
          anchor: selectionResult.anchor,
          focus: selectionResult.focus,
          quote,
          replacement,
        });
        replaced = editResult.replaced;
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
      },
    },
  );
}
