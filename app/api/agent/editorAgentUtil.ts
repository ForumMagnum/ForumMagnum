import { HocuspocusProvider } from "@hocuspocus/provider";
import { Doc, UndoManager } from "yjs";
import type { Provider as LexicalProvider } from "@lexical/yjs";
import { createBinding, syncLexicalUpdateToYjs, syncYjsChangesToLexical } from "@lexical/yjs";
import {
  $createRangeSelection,
  $getRoot,
  $setSelection,
  createEditor,
  type LexicalEditor,
  SKIP_COLLAB_TAG,
} from "lexical";
import PlaygroundNodes from "@/components/lexical/nodes/PlaygroundNodes";
import { randomId } from "@/lib/random";

const HOCUSPOCUS_SYNC_TIMEOUT_MS = 15_000;
const INITIAL_SYNC_SETTLE_MS = 25;

export interface SelectQuotedTextResult {
  quoteFoundInDocument: boolean
  selectionCreated: boolean
  matchedNodeKey?: string
  startOffset?: number
  endOffset?: number
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function normalizeText(value: string): string {
  return value.replace(/\s+/g, " ").trim().toLowerCase();
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
    onError: (error) => {
      throw error;
    },
    editable: false,
  });
}

export function selectQuotedTextInEditor(quote: string): SelectQuotedTextResult {
  const rawQuote = quote.trim();
  const normalizedQuote = normalizeText(rawQuote);
  const textNodes = $getRoot().getAllTextNodes();
  const aggregateText = textNodes.map((node) => node.getTextContent()).join(" ");
  const quoteFoundInDocument = !!normalizedQuote && normalizeText(aggregateText).includes(normalizedQuote);

  if (!rawQuote || !normalizedQuote || !quoteFoundInDocument) {
    return { quoteFoundInDocument, selectionCreated: false };
  }

  for (const textNode of textNodes) {
    const nodeText = textNode.getTextContent();
    const matchIndex = nodeText.toLowerCase().indexOf(rawQuote.toLowerCase());
    if (matchIndex === -1) {
      continue;
    }

    const selection = $createRangeSelection();
    selection.anchor.set(textNode.getKey(), matchIndex, "text");
    selection.focus.set(textNode.getKey(), matchIndex + rawQuote.length, "text");
    $setSelection(selection);
    return {
      quoteFoundInDocument,
      selectionCreated: true,
      matchedNodeKey: textNode.getKey(),
      startOffset: matchIndex,
      endOffset: matchIndex + rawQuote.length,
    };
  }

  return { quoteFoundInDocument, selectionCreated: false };
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
        isFromUndoManager
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
    return await callback({ editor, provider });
  } finally {
    rootSharedType.unobserveDeep(onYjsTreeChanges);
    removeLexicalListener();
    provider.destroy();
    doc.destroy();
  }
}
