import type { VoteDocTuple } from "@/lib/voting/vote";
import type {
  NamesAttachedReactionsVote,
  UserVoteOnSingleReaction,
} from "@/lib/voting/namesAttachedReactions";
import Votes from "@/server/collections/votes/collection";
import TypoSuggestions from "@/server/collections/typoSuggestions/collection";
import { getLatestRev } from "@/server/editor/utils";
import { backgroundTask } from "@/server/utils/backgroundTask";
import { captureException } from "@/lib/sentryWrapper";
import type { TypoSuggestionTargetCollection } from "@/lib/collections/typoSuggestions/constants";

const TYPO_REACT_NAME = "typo";
const POSTGRES_UNIQUE_VIOLATION = "23505";

function isPostgresUniqueViolation(err: unknown): boolean {
  return (
    !!err &&
    typeof err === "object" &&
    "code" in err &&
    err.code === POSTGRES_UNIQUE_VIOLATION
  );
}

interface NewTypoReact {
  quote: string;
}

function getReactsList(extendedVote: NamesAttachedReactionsVote | null | undefined): UserVoteOnSingleReaction[] {
  return extendedVote?.reacts ?? [];
}

function reactKey(react: UserVoteOnSingleReaction): string {
  const quote = (react.quotes && react.quotes[0]) ?? "";
  return `${react.react}::${quote}`;
}

/**
 * Compare the new vote's reacts to the user's previous (now-cancelled) vote
 * on the same document, returning the typo reacts that are newly present.
 *
 * Caveat: the client at NamesAttachedReactionsVoteOnComment.tsx:227 stamps
 * every new react as `vote: "created"` (with a TODO to distinguish "created"
 * vs "seconded"). We can't tell first-reactor from piggybacker via the vote
 * type, so this only filters by "is this entry new in this user's vote
 * compared to their previous vote." Cross-user dedup happens at the
 * TypoSuggestions unique index.
 */
async function findNewTypoReactsByUserOnDocument(
  voteDocTuple: VoteDocTuple,
): Promise<NewTypoReact[]> {
  const { vote } = voteDocTuple;
  const newReacts = getReactsList(vote.extendedVoteType as NamesAttachedReactionsVote | null);
  const newTypos = newReacts.filter(
    (r) => r.react === TYPO_REACT_NAME && r.vote === "created" && r.quotes && r.quotes[0],
  );
  if (newTypos.length === 0) return [];

  // Find the user's most recent prior cancelled vote on this document (the
  // vote we just superseded). Excludes the current vote.
  const priorVote = await Votes.findOne(
    {
      _id: { $ne: vote._id },
      documentId: vote.documentId,
      collectionName: vote.collectionName,
      userId: vote.userId,
    },
    { sort: { votedAt: -1 } },
  );
  const priorReacts = getReactsList(priorVote?.extendedVoteType as NamesAttachedReactionsVote | null);
  const priorKeys = new Set(priorReacts.map(reactKey));

  return newTypos
    .filter((r) => !priorKeys.has(reactKey(r)))
    .map((r) => ({ quote: r.quotes![0] }));
}

async function getDocumentAuthorId(
  collectionName: "Posts" | "Comments",
  documentId: string,
  context: ResolverContext,
): Promise<string | null> {
  if (collectionName === "Posts") {
    const post = await context.Posts.findOne(documentId);
    return post?.userId ?? null;
  }
  const comment = await context.Comments.findOne(documentId);
  return comment?.userId ?? null;
}

async function isLexicalDocument(
  documentId: string,
  context: ResolverContext,
): Promise<boolean> {
  const rev = await getLatestRev(documentId, "contents", context);
  return rev?.originalContents?.type === "lexical";
}

/**
 * The Apply path connects a HocuspocusProvider to read the live Yjs state.
 * If no `YjsDocuments` row exists, Hocuspocus loads an empty document
 * (`postgres.ts:onLoadDocument` returns without applying anything when the
 * row is missing), and the post-agent infra throws on the empty-root guard
 * in `withMainDocEditorSession`. About 8% of recent Lexical posts are in
 * this state — typically posts that were created via the form-based path
 * or bulk-imported and never opened in the live collab editor since.
 *
 * Rather than risk operating on an empty doc and overwriting the published
 * revision with a corrupt result, we bail before we ever evaluate or notify.
 */
async function hasLiveYjsRecord(
  documentId: string,
  context: ResolverContext,
): Promise<boolean> {
  const yjsDoc = await context.YjsDocuments.findOne(
    { documentId },
    undefined,
    { _id: 1 },
  );
  return !!yjsDoc;
}

export async function maybeEvaluateTypoReacts(
  voteDocTuple: VoteDocTuple,
  context: ResolverContext,
): Promise<void> {
  const { vote } = voteDocTuple;
  if (vote.collectionName !== "Posts" && vote.collectionName !== "Comments") {
    return;
  }
  if (vote.cancelled) return;

  const newTypos = await findNewTypoReactsByUserOnDocument(voteDocTuple);
  if (newTypos.length === 0) return;

  // The three gating lookups are independent; fan them out before the
  // sequential bail checks. Posts go through Hocuspocus on Apply; without a
  // YjsDocuments row, the live doc loads empty and the post-agent guard
  // throws. Bail upstream rather than create a suggestion we can't safely
  // apply. Comments don't touch Hocuspocus (they apply offline against the
  // rev HTML).
  const [authorId, isLexical, missingYjs] = await Promise.all([
    getDocumentAuthorId(vote.collectionName, vote.documentId, context),
    isLexicalDocument(vote.documentId, context),
    vote.collectionName === "Posts"
      ? hasLiveYjsRecord(vote.documentId, context).then((hasYjs) => !hasYjs)
      : Promise.resolve(false),
  ]);

  if (!authorId) return;
  // Skip self-flagged typos.
  if (vote.userId === authorId) return;
  if (!isLexical) return;
  if (missingYjs) return;

  const suggestionIds = await Promise.all(
    newTypos.map(({ quote }) =>
      tryInsertPendingSuggestion({
        documentId: vote.documentId,
        collectionName: vote.collectionName as TypoSuggestionTargetCollection,
        voteId: vote._id,
        authorId,
        quote,
      }),
    ),
  );
  // `evaluateTypoReact` and `applyTypoSuggestion` (loaded in
  // typoSuggestionResolvers.ts) transitively import the headless Lexical
  // editor (`createHeadlessEditor` → `PlaygroundNodes` → CSS), which breaks
  // codegen's CommonJS loader if imported eagerly. Same pattern as
  // @/server/editor/htmlToYjsState.ts.
  for (const suggestionId of suggestionIds.filter((id): id is string => !!id)) {
    backgroundTask((async () => {
      const { evaluateTypoReact } = await import("@/server/typoSuggestions/evaluateTypoReact");
      await evaluateTypoReact(suggestionId, context);
    })());
  }
}

async function tryInsertPendingSuggestion({
  documentId,
  collectionName,
  voteId,
  authorId,
  quote,
}: {
  documentId: string;
  collectionName: TypoSuggestionTargetCollection;
  voteId: string;
  authorId: string;
  quote: string;
}): Promise<string | null> {
  try {
    return await TypoSuggestions.rawInsert({
      documentId,
      collectionName,
      fieldName: "contents",
      voteId,
      authorId,
      quote,
      llmCanonicalQuote: null,
      proposedReplacement: null,
      narrowedQuote: null,
      narrowedReplacement: null,
      explanation: null,
      llmVerdict: "pending",
      status: "pending",
      resolvedByUserId: null,
      appliedRevisionId: null,
      resolvedAt: null,
      createdAt: new Date(),
    });
  } catch (err: unknown) {
    // Cross-user dedup: another reactor already triggered evaluation for
    // this (documentId, fieldName, quote). Silently no-op.
    if (isPostgresUniqueViolation(err)) return null;
    captureException(err);
    return null;
  }
}
