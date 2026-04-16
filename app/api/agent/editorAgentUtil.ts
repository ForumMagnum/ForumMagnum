import { HocuspocusProvider } from "@hocuspocus/provider";
import { Doc, UndoManager } from "yjs";
import type { Provider as LexicalProvider } from "@lexical/yjs";
import { createBinding, syncLexicalUpdateToYjs, syncYjsChangesToLexical } from "@lexical/yjs";
import {
  $getRoot,
  createEditor,
  type LexicalEditor,
  SKIP_COLLAB_TAG,
} from "lexical";
import PlaygroundNodes from "@/components/lexical/nodes/PlaygroundNodes";
import { buildTextNodeExportMap } from "@/components/editor/lexicalDomExport";
import { randomId } from "@/lib/random";
import { sleep } from "@/lib/utils/asyncUtils";
import { getLatestRev } from "@/server/editor/utils";
import { captureException } from "@/lib/sentryWrapper";
import YjsDocuments from "@/server/collections/yjsDocuments/collection";

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

export function normalizeText(value: string): string {
  return value.replace(/\s+/g, " ").trim().toLowerCase();
}

/**
 * Replace characters that vary cosmetically across writing tools so that
 * agent-supplied markdown can match document text even when one side uses
 * smart punctuation and the other uses ASCII (or one uses non-breaking spaces
 * while the other uses regular spaces). Each replacement is one-to-one in
 * character count so the offset math used by `findTextRangeInNodeByPlainQuote`
 * (which maps from a normalized index back to the raw lowercased index) keeps
 * working unchanged.
 */
export function normalizeQuoteCharacters(value: string): string {
  return value
    .replace(/[\u2018\u2019\u201A\u201B]/g, "'")
    .replace(/[\u201C\u201D\u201E\u201F]/g, "\"")
    .replace(/\u00A0/g, " ");
}

/**
 * Strip markdown emphasis/code/strikethrough markers from text. Underscores
 * are only stripped when they sit at a word boundary (i.e. could plausibly be
 * an italic delimiter); mid-word underscores are preserved so identifiers like
 * `var_name` survive intact for matching against the raw document text. The
 * markdown-it parser uses the same word-boundary rule for `_emphasis_`.
 */
export function stripMarkdownEmphasisMarkers(value: string): string {
  return value
    .replace(/[*`~]+/g, "")
    .replace(/(?<![A-Za-z0-9])_+|_+(?![A-Za-z0-9])/g, "");
}

export function paragraphMarkdownStartsWith(paragraphMarkdown: string, prefix: string): boolean {
  const normalizedParagraph = normalizeQuoteCharacters(paragraphMarkdown).trimStart().replace(/\s+/g, " ").toLowerCase();
  const normalizedPrefix = normalizeQuoteCharacters(prefix).trim().replace(/\s+/g, " ").toLowerCase();
  return normalizedParagraph.startsWith(normalizedPrefix);
}

export function plainTextStartsWith(nodeTextContent: string, prefix: string): boolean {
  const prefixPlainText = stripMarkdownEmphasisMarkers(
    normalizeQuoteCharacters(prefix)
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1")
      .replace(/\$\$([\s\S]*?)\$\$/g, "$1")
      .replace(/\$([^$]+)\$/g, "$1")
      .replace(/\\([A-Za-z]+)/g, "$1")
  )
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
  const normalizedTextContent = normalizeQuoteCharacters(nodeTextContent)
    .replace(/\s+/g, " ")
    .trimStart()
    .toLowerCase();
  return prefixPlainText.length > 0 && normalizedTextContent.startsWith(prefixPlainText);
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
 * Check whether a post uses the Lexical editor. The agent editing API surface
 * only works with Lexical collaborative documents; legacy CKEditor posts must
 * be read via /editPost or /api/editPost instead.
 *
 * When a user converts a post from markdown to Lexical in the editor UI, the
 * Lexical editor opens and syncs to Hocuspocus, but no new revision is saved
 * until the user actually edits the document. During that window the latest
 * revision still says "markdown", even though the live document is Lexical.
 * To handle this, we also check for a YjsDocuments entry -- its existence
 * means the Lexical collaborative editor has synced state for this post.
 */
export async function isSupportedEditorType(postId: string, context: ResolverContext): Promise<EditorTypeCheckResult> {
  const rev = await getLatestRev(postId, "contents", context);
  const editorType = rev?.originalContents?.type ?? "unknown";
  if (editorType === "lexical") {
    return { supported: true, editorType };
  }

  // The latest revision isn't Lexical, but the post may have been converted
  // and opened in the collaborative editor without saving a revision yet.
  // A YjsDocuments row means Hocuspocus has synced Lexical state for this post.
  const yjsDoc = await YjsDocuments.findOne({ documentId: postId });
  if (yjsDoc) {
    return { supported: true, editorType: "lexical" };
  }

  return { supported: false, editorType };
}

export function unsupportedEditorMessage(editorType: string): string {
  return `This post uses the ${editorType} editor and cannot be edited via the agent API. Only posts created in the Lexical editor are supported.`;
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
    nodes: PlaygroundNodes,
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
  postId,
  token,
  operationLabel,
  callback,
}: {
  postId: string
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

  const doc = new Doc();
  const provider = new HocuspocusProvider({
    url: wsUrl,
    name: `post-${postId}`,
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
        `[${operationLabel}] Lexical editor root is empty after Hocuspocus sync for post ${postId}. ` +
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
