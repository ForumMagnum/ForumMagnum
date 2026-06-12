import { NextResponse } from "next/server";
import { HocuspocusProvider } from "@hocuspocus/provider";
import { Doc, UndoManager } from "yjs";
import type { Provider as LexicalProvider } from "@lexical/yjs";
import { createBinding, syncLexicalUpdateToYjs, syncYjsChangesToLexical } from "@lexical/yjs";
import {
  $createParagraphNode,
  $getRoot,
  createEditor,
  type LexicalEditor,
  type LexicalNode,
  type ParagraphNode,
  SKIP_COLLAB_TAG,
} from "lexical";
import { $isMathNode } from "@/components/editor/lexicalPlugins/math/MathNode";
import allLexicalNodes from "@/components/lexical/nodes/allLexicalNodes";
import { buildTextNodeExportMap } from "@/components/editor/lexicalDomExport";
import { randomId } from "@/lib/random";
import { sleep } from "@/lib/utils/asyncUtils";
import { getLatestRev } from "@/server/editor/utils";
import { captureException } from "@/lib/sentryWrapper";
import YjsDocuments from "@/server/collections/yjsDocuments/collection";
import { getHocuspocusTokenForCollection } from "./getHocuspocusToken";
import { captureAgentApiEvent } from "./captureAgentAnalytics";
import { sanitize } from "@/lib/utils/sanitize";
import { foldCaseOutsideMath, canonicalizeMathTokens } from "@/lib/utils/mathTokens";
import type MarkdownIt from "markdown-it";

/**
 * Render agent-supplied markdown to sanitized HTML for import into a Lexical
 * editor. The caller picks the markdown-it instance (post vs research — both
 * `math-tex`-emitting). This deliberately never runs `renderMathInHtml`: that
 * produces reader-facing display HTML (`<mjx-container>`), which Lexical's DOM
 * importer cannot turn back into editable nodes.
 */
export function renderAgentMarkdownToHtml(markdownIt: MarkdownIt, markdown: string): string {
  return sanitize(markdownIt.render(markdown, { docId: randomId() }));
}

// Split a paragraph around any display (non-inline) MathNode children: runs of
// other children become their own paragraphs and each display MathNode becomes
// a top-level sibling. A display MathNode is block-level — the editor's own
// MathPlugin inserts it as a direct child of root — so it must not stay nested
// inside an inline-content paragraph. Returns `[paragraph]` unchanged when the
// paragraph contains no display math.
export function splitParagraphAtDisplayMath(paragraph: ParagraphNode): LexicalNode[] {
  const children = paragraph.getChildren();
  if (!children.some((child) => $isMathNode(child) && !child.isInline())) {
    return [paragraph];
  }
  const result: LexicalNode[] = [];
  let currentParagraph: ParagraphNode | null = null;
  for (const child of children) {
    if ($isMathNode(child) && !child.isInline()) {
      result.push(child);
      currentParagraph = null;
    } else {
      if (!currentParagraph) {
        currentParagraph = $createParagraphNode();
        result.push(currentParagraph);
      }
      currentParagraph.append(child);
    }
  }
  return result;
}

/**
 * Mapping from a collab-editor-participating collection name to the prefix
 * used in Hocuspocus document names. Mirrors the table in the Hocuspocus
 * server's parseDocumentId.
 */
const COLLAB_DOCUMENT_NAME_PREFIXES: Record<string, string> = {
  Posts: "post-",
  ResearchDocuments: "research-doc-",
};

export function buildHocuspocusDocumentName(collectionName: string, documentId: string): string {
  const prefix = COLLAB_DOCUMENT_NAME_PREFIXES[collectionName];
  if (!prefix) {
    throw new Error(`buildHocuspocusDocumentName: unsupported collection ${collectionName}`);
  }
  return `${prefix}${documentId}`;
}

/**
 * Name of the Yjs subdocument holding the comment/suggestion threads for a
 * collaborative document. The `/`-suffixed form matters for auth: the
 * Hocuspocus server authorizes subdocuments by prefix match against the
 * main document's name, so a main-doc token covers this subdocument too.
 */
export function buildHocuspocusCommentsDocName(collectionName: string, documentId: string): string {
  return `${buildHocuspocusDocumentName(collectionName, documentId)}/comments`;
}

const HOCUSPOCUS_SYNC_TIMEOUT_MS = 15_000;
const INITIAL_SYNC_SETTLE_MS = 25;

const FLUSH_POLL_INTERVAL_MS = 5;
const FLUSH_TIMEOUT_MS = 2_000;

/**
 * Wait for a HocuspocusProvider's WebSocket send buffer to drain, indicating
 * that all pending updates have been handed off to the OS network layer.
 *
 * The provider sends Yjs updates synchronously during `doc.transact()` via
 * `ws.send()`, which buffers data immediately. We just need to wait for
 * `bufferedAmount` to reach 0 before destroying the provider so that the
 * close handshake doesn't race with pending data frames.
 *
 * Returns immediately if the WebSocket isn't accessible or the buffer is
 * already empty.
 */
export async function waitForProviderFlush(provider: HocuspocusProvider): Promise<void> {
  const ws = provider.configuration.websocketProvider.webSocket;
  if (!ws || ws.bufferedAmount === 0) return;

  const deadline = Date.now() + FLUSH_TIMEOUT_MS;
  while (ws.bufferedAmount && ws.bufferedAmount > 0 && Date.now() < deadline) {
    await sleep(FLUSH_POLL_INTERVAL_MS);
  }
}

// 1:1 fold of typographic punctuation onto ASCII equivalents. Restricted to
// length-preserving substitutions so that callers which map positions between
// pre- and post-normalized strings (e.g. `mapNormalizedIndexToRaw`) remain
// correct. Intentionally excludes ellipsis (U+2026 → `...`), NFKC, and other
// length-changing transforms.
const PUNCTUATION_FOLD_MAP: Record<string, string> = {
  "\u2018": "'", "\u2019": "'", "\u201A": "'", "\u201B": "'",
  "\u2032": "'", "\u02B9": "'", "\u02BC": "'",
  "\u201C": '"', "\u201D": '"', "\u201E": '"', "\u201F": '"',
  "\u2033": '"', "\u00AB": '"', "\u00BB": '"',
  "\u2010": "-", "\u2011": "-", "\u2013": "-", "\u2014": "-",
  "\u2015": "-", "\u2212": "-",
};
const PUNCTUATION_FOLD_REGEX = new RegExp(
  `[${Object.keys(PUNCTUATION_FOLD_MAP).join("")}]`,
  "g",
);

export function foldPunctuation(value: string): string {
  return value.replace(PUNCTUATION_FOLD_REGEX, (ch) => PUNCTUATION_FOLD_MAP[ch]);
}

// Normalizes a string for lenient quote/prefix matching, but preserves the
// case of math content (LaTeX is case-sensitive) and canonicalizes math
// tokens, so the same equation matches regardless of which delimiter shape
// (`$$…$$`, `\[…\]`, …) it was written with.
export function normalizeText(value: string): string {
  return canonicalizeMathTokens(foldCaseOutsideMath(foldPunctuation(value).replace(/\s+/g, " ").trim()));
}

interface DeriveAgentAuthorArgs {
  context: ResolverContext;
  args: {
    agentName?: string;
  };
}

interface DerivedAgentAuthor {
  authorId: string;
  authorName: string;
}

export function deriveAgentAuthor({ context, args }: DeriveAgentAuthorArgs): DerivedAgentAuthor {
  const authorId = context.currentUser?._id ?? context.clientId ?? `agent-${randomId()}`;
  const authorName = args.agentName ?? context.currentUser?.displayName ?? "AI Agent";
  return { authorId, authorName };
}

interface EditorTypeCheckResult {
  supported: boolean;
  editorType: string;
}

/**
 * Check whether a document uses the Lexical editor. The agent editing API
 * surface only works with Lexical collaborative documents; legacy CKEditor
 * posts must be read via /editPost or /api/editPost instead.
 *
 * When a user converts a post from markdown to Lexical in the editor UI, the
 * Lexical editor opens and syncs to Hocuspocus, but no new revision is saved
 * until the user actually edits the document. During that window the latest
 * revision still says "markdown", even though the live document is Lexical.
 * To handle this, we also check for a YjsDocuments entry -- its existence
 * means the Lexical collaborative editor has synced state for this document.
 *
 * For non-Posts collections (e.g. ResearchDocuments) we always treat the
 * editor as Lexical (no legacy CKEditor history exists).
 */
export async function isSupportedEditorType(
  collectionName: string,
  documentId: string,
  context: ResolverContext,
): Promise<EditorTypeCheckResult> {
  if (collectionName !== 'Posts') {
    return { supported: true, editorType: "lexical" };
  }

  const rev = await getLatestRev(documentId, "contents", context);
  const editorType = rev?.originalContents?.type ?? "unknown";
  if (editorType === "lexical") {
    return { supported: true, editorType };
  }

  // The latest revision isn't Lexical, but the post may have been converted
  // and opened in the collaborative editor without saving a revision yet.
  // A YjsDocuments row means Hocuspocus has synced Lexical state for this post.
  const yjsDoc = await YjsDocuments.findOne({ collectionName, documentId });
  if (yjsDoc) {
    return { supported: true, editorType: "lexical" };
  }

  return { supported: false, editorType };
}

export function unsupportedEditorMessage(editorType: string): string {
  return `This document uses the ${editorType} editor and cannot be edited via the agent API. Only documents created in the Lexical editor are supported.`;
}

export const UNAUTHORIZED_DRAFT_MESSAGE =
  "Unauthorized to access this draft. Make sure the post's sharing settings have 'Anyone with the link can' set to 'Edit', and that the correct link-sharing key is provided.";

export type EditorTypeAndTokenCheckResult =
  | { kind: "unsupported_editor"; editorType: string }
  | { kind: "unauthorized" }
  | { kind: "ready"; token: string };

/**
 * Fire the editor-type check and the Hocuspocus auth-token query in parallel,
 * then await editor-type first. Lets the token round-trip overlap with the
 * editor-type DB read while still allowing an early return on unsupported
 * editor types without waiting for the token.
 *
 * Use the discriminated return value to emit per-route analytics events
 * and respond with the appropriate status code; `unsupportedEditorMessage`
 * and `UNAUTHORIZED_DRAFT_MESSAGE` are the canonical message texts.
 */
export async function checkEditorTypeAndGetToken({
  collectionName,
  documentId,
  postId,
  context,
  linkSharingKey,
}: {
  // Either pass {collectionName, documentId} or {postId} (legacy).
  collectionName?: string
  documentId?: string
  postId?: string
  context: ResolverContext
  linkSharingKey?: string
}): Promise<EditorTypeAndTokenCheckResult> {
  const effectiveCollectionName = collectionName ?? 'Posts';
  const effectiveDocumentId = documentId ?? postId;
  if (!effectiveDocumentId) {
    throw new Error('checkEditorTypeAndGetToken: must pass documentId or postId');
  }
  const editorCheckPromise = isSupportedEditorType(effectiveCollectionName, effectiveDocumentId, context);
  const tokenPromise = getHocuspocusTokenForCollection(context, effectiveCollectionName, effectiveDocumentId, linkSharingKey);
  // If the editor-type check returns "unsupported" first, we early-return
  // without awaiting tokenPromise. Attach a no-op handler so a later
  // rejection doesn't bubble up as an unhandled-rejection warning. The
  // real `await tokenPromise` below still throws on real failures.
  tokenPromise.catch(() => {});

  const editorCheck = await editorCheckPromise;
  if (!editorCheck.supported) {
    return { kind: "unsupported_editor", editorType: editorCheck.editorType };
  }
  const token = await tokenPromise;
  if (!token) {
    return { kind: "unauthorized" };
  }
  return { kind: "ready", token };
}

/**
 * Wrapper around `checkEditorTypeAndGetToken` for the agent write routes:
 * runs the parallel check, emits the matching analytics event, and returns
 * either a token to use or an HTTP error response to forward verbatim.
 *
 * The non-route `/editPost` markdown caller wants different status codes
 * and a plaintext body, so it uses `checkEditorTypeAndGetToken` directly.
 */
export async function authorizeAgentDraftAccess({
  route,
  collectionName,
  documentId,
  postId,
  context,
  linkSharingKey,
  agentName,
}: {
  route: string
  // Either pass {collectionName, documentId} or {postId} (legacy).
  collectionName?: string
  documentId?: string
  postId?: string
  context: ResolverContext
  linkSharingKey?: string
  agentName?: string
}): Promise<{ token: string } | { errorResponse: NextResponse }> {
  const effectiveCollectionName = collectionName ?? 'Posts';
  const effectiveDocumentId = documentId ?? postId;
  if (!effectiveDocumentId) {
    throw new Error('authorizeAgentDraftAccess: must pass documentId or postId');
  }
  const checkResult = await checkEditorTypeAndGetToken({
    collectionName: effectiveCollectionName,
    documentId: effectiveDocumentId,
    context,
    linkSharingKey,
  });
  if (checkResult.kind === "unsupported_editor") {
    captureAgentApiEvent({ route, postId: effectiveDocumentId, userId: context.currentUser?._id, agentName, status: "unsupported_editor" });
    return {
      errorResponse: NextResponse.json(
        { error: unsupportedEditorMessage(checkResult.editorType) },
        { status: 400 },
      ),
    };
  }
  if (checkResult.kind === "unauthorized") {
    captureAgentApiEvent({ route, postId: effectiveDocumentId, userId: context.currentUser?._id, agentName, status: "unauthorized" });
    return {
      errorResponse: NextResponse.json(
        { error: UNAUTHORIZED_DRAFT_MESSAGE },
        { status: 403 },
      ),
    };
  }
  return { token: checkResult.token };
}

export function waitForProviderSync(provider: HocuspocusProvider): Promise<void> {
  if (provider.synced) {
    return Promise.resolve();
  }

  return new Promise<void>((resolve, reject) => {
    const timeoutHandle = setTimeout(() => {
      provider.off("synced", handleSynced);
      reject(new Error("Timed out waiting for Hocuspocus sync"));
    }, HOCUSPOCUS_SYNC_TIMEOUT_MS);

    const handleSynced = () => {
      clearTimeout(timeoutHandle);
      provider.off("synced", handleSynced);
      resolve();
    };

    provider.on("synced", handleSynced);
  });
}

export function getLexicalCompatibleProvider(provider: HocuspocusProvider): HocuspocusProvider & LexicalProvider {
  if (!provider.awareness) {
    throw new Error("Hocuspocus provider awareness is not initialized");
  }
  return provider as HocuspocusProvider & LexicalProvider;
}

export function createHeadlessEditor(errorLabel: string): LexicalEditor {
  return createEditor({
    namespace: `Agent-${errorLabel}`,
    // `allLexicalNodes` registers every custom node type the codebase defines
    // across all collections. Headless editors live downstream of arbitrary
    // collection contexts, and the cost of missing a node type is a hard
    // parse failure ("parseEditorState: type X + not found"). The universal
    // registry trades a small init cost for correctness across all callers.
    nodes: allLexicalNodes,
    html: {
      export: buildTextNodeExportMap(),
    },
    onError: (error) => {
      throw error;
    },
    editable: false,
  });
}

export async function withMainDocEditorSession<T>({
  collectionName,
  documentId,
  postId,
  token,
  operationLabel,
  callback,
}: {
  // Either pass {collectionName, documentId} or {postId} (legacy → Posts).
  collectionName?: string
  documentId?: string
  postId?: string
  token: string
  operationLabel: string
  callback: (args: {
    editor: LexicalEditor
    provider: HocuspocusProvider
  }) => Promise<T>
}): Promise<T> {
  const wsUrl = process.env.HOCUSPOCUS_URL;
  if (!wsUrl) {
    throw new Error("HOCUSPOCUS_URL is not configured");
  }

  const effectiveCollectionName = collectionName ?? 'Posts';
  const effectiveDocumentId = documentId ?? postId;
  if (!effectiveDocumentId) {
    throw new Error('withMainDocEditorSession: must pass documentId or postId');
  }
  const documentName = buildHocuspocusDocumentName(effectiveCollectionName, effectiveDocumentId);

  const doc = new Doc();
  const provider = new HocuspocusProvider({
    url: wsUrl,
    name: documentName,
    document: doc,
    token,
    connect: false,
  });
  const editor = createHeadlessEditor(operationLabel);
  const lexicalProvider = getLexicalCompatibleProvider(provider);
  const docMap = new Map<string, Doc>([["main", doc]]);
  const binding = createBinding(editor, lexicalProvider, "main", doc, docMap);

  const rootSharedType = binding.root.getSharedType();
  const onYjsTreeChanges = (events: unknown[], transaction: { origin: unknown }) => {
    if (transaction.origin !== binding) {
      const isFromUndoManager = transaction.origin instanceof UndoManager;
      syncYjsChangesToLexical(
        binding,
        lexicalProvider,
        events as Parameters<typeof syncYjsChangesToLexical>[2],
        isFromUndoManager,
        // No-op: skip cursor position syncing on the server, since
        // the default implementation creates DOM elements (spans for
        // remote cursors) which requires `document` to exist.
        () => {},
      );
    }
  };
  rootSharedType.observeDeep(onYjsTreeChanges);
  const removeLexicalListener = editor.registerUpdateListener(({
    prevEditorState,
    editorState,
    dirtyLeaves,
    dirtyElements,
    normalizedNodes,
    tags,
  }) => {
    if (!tags.has(SKIP_COLLAB_TAG)) {
      syncLexicalUpdateToYjs(
        binding,
        lexicalProvider,
        prevEditorState,
        editorState,
        dirtyElements,
        dirtyLeaves,
        normalizedNodes,
        tags
      );
    }
  });

  try {
    await provider.connect();
    await waitForProviderSync(provider);
    await sleep(INITIAL_SYNC_SETTLE_MS);

    // After sync, verify that the Lexical editor actually has content.
    // A Lexical post should always have a non-empty Yjs document in
    // Hocuspocus. If the root is empty after sync, something critical
    // has gone wrong (e.g. missing YjsDocuments row, Hocuspocus data
    // loss, or a race condition in the sync protocol).
    let rootChildCount = 0;
    editor.getEditorState().read(() => {
      rootChildCount = $getRoot().getChildrenSize();
    });
    if (rootChildCount === 0) {
      const err = new Error(
        `[${operationLabel}] Lexical editor root is empty after Hocuspocus sync for ${effectiveCollectionName} ${effectiveDocumentId}. ` +
        `This likely means the Yjs document state is missing or corrupt.`
      );
      captureException(err);
      throw err;
    }

    return await callback({ editor, provider });
  } finally {
    rootSharedType.unobserveDeep(onYjsTreeChanges);
    removeLexicalListener();
    provider.destroy();
    doc.destroy();
  }
}

/**
 * Connect to the comment-threads Yjs subdocument of a collaborative document,
 * run `callback` against the synced doc, then flush and tear down the
 * provider. Unlike `withMainDocEditorSession` there is no Lexical editor —
 * callers work with the raw Y.Doc (a top-level `comments` Y.Array of
 * thread/comment Y.Maps).
 */
export async function withCommentsDocSession<T>({
  collectionName,
  documentId,
  token,
  callback,
}: {
  collectionName: string
  documentId: string
  token: string
  callback: (args: {
    doc: Doc
    provider: HocuspocusProvider
  }) => Promise<T>
}): Promise<T> {
  const wsUrl = process.env.HOCUSPOCUS_URL;
  if (!wsUrl) {
    throw new Error("HOCUSPOCUS_URL is not configured");
  }

  const doc = new Doc();
  const provider = new HocuspocusProvider({
    url: wsUrl,
    name: buildHocuspocusCommentsDocName(collectionName, documentId),
    document: doc,
    token,
    connect: false,
  });

  try {
    await provider.connect();
    await waitForProviderSync(provider);
    return await callback({ doc, provider });
  } finally {
    await waitForProviderFlush(provider);
    provider.destroy();
    doc.destroy();
  }
}
