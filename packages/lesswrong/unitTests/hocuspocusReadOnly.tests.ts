import jwt from "jsonwebtoken";
import WebSocket from "ws";
import { Doc, XmlText } from "yjs";
import { HocuspocusProvider, HocuspocusProviderWebsocket } from "@hocuspocus/provider";
import { $isMarkNode } from "@lexical/mark";
import { $dfs } from "@lexical/utils";
import { $createParagraphNode, $createTextNode, $getRoot } from "lexical";
// @hocuspocus/server is only installed for the Hocuspocus server package.
import { Server } from "../../../fly/hocuspocusServer/node_modules/@hocuspocus/server";
import { authenticateConnection } from "../../../fly/hocuspocusServer/src/auth";
import type { CollaborativeEditingAccessLevel } from "@/lib/collections/posts/collabEditingPermissions";
import { sleep } from "@/lib/utils/asyncUtils";
import { appendReplyToCommentThread, insertCollabCommentThread, resolveCollabCommentThread } from "../../../app/api/agent/collabCommentThreads";
import { buildHocuspocusCommentsDocName, buildHocuspocusDocumentName, withMainDocEditorSession } from "../../../app/api/agent/editorAgentUtil";
import { connectAndSync, createHeadlessProvider, withProviderFlush } from "../../../app/api/agent/headlessProvider";
import { replaceTextInMainDoc } from "../../../app/api/agent/replaceText/route";

const JWT_SECRET = "unit-test-hocuspocus-secret";
const DOCUMENT_ID = "readOnlyTestPost";
const DOCUMENT_NAME = `post-${DOCUMENT_ID}`;
const WAIT_TIMEOUT_MS = 5_000;

// Resolvers for stateless messages the test server is waiting to receive, keyed by payload.
const pendingStatelessMessages = new Map<string, () => void>();

function signToken(accessLevel: CollaborativeEditingAccessLevel, documentId = DOCUMENT_ID): string {
  return jwt.sign(
    {
      userId: `user-${accessLevel}`,
      displayName: `User with ${accessLevel} access`,
      collectionName: "Posts",
      documentId,
      accessLevel,
    },
    JWT_SECRET,
    { expiresIn: "1h" },
  );
}

function connectProvider(url: string, accessLevel: CollaborativeEditingAccessLevel): Promise<HocuspocusProvider> {
  const websocketProvider = new HocuspocusProviderWebsocket({ url, WebSocketPolyfill: WebSocket });
  return new Promise((resolve, reject) => {
    const provider = new HocuspocusProvider({
      websocketProvider,
      name: DOCUMENT_NAME,
      document: new Doc(),
      token: signToken(accessLevel),
      onSynced: () => resolve(provider),
      onAuthenticationFailed: ({ reason }) => reject(new Error(reason)),
    });
  });
}

/**
 * Hocuspocus handles each connection's messages in order, so once a stateless
 * message sent after an update reaches the server, that update has been
 * processed (applied, or discarded for a read-only connection).
 */
function waitUntilServerHasProcessedPriorMessages(provider: HocuspocusProvider, marker: string): Promise<void> {
  const received = new Promise<void>((resolve) => pendingStatelessMessages.set(marker, resolve));
  provider.sendStateless(marker);
  return received;
}

async function waitForCondition(condition: () => boolean, description: string): Promise<void> {
  const deadline = Date.now() + WAIT_TIMEOUT_MS;
  while (!condition()) {
    if (Date.now() > deadline) {
      throw new Error(`Timed out waiting for ${description}`);
    }
    await sleep(10);
  }
}

function getServerDocumentText(server: Server): string | undefined {
  return server.hocuspocus.documents.get(DOCUMENT_NAME)?.getText("text").toString();
}

async function connectTrackedProvider(
  server: Server,
  providers: HocuspocusProvider[],
  accessLevel: CollaborativeEditingAccessLevel,
): Promise<HocuspocusProvider> {
  const provider = await connectProvider(server.webSocketURL, accessLevel);
  providers.push(provider);
  return provider;
}

const SEEDED_TEXT = "Text to comment on";

async function connectWitness(providers: HocuspocusProvider[], name: string, postId: string): Promise<HocuspocusProvider> {
  const witness = createHeadlessProvider({ name, document: new Doc(), token: signToken("edit", postId) });
  providers.push(witness);
  await connectAndSync(witness);
  return witness;
}

/** The server here doesn't persist, so witnesses keep the post's docs loaded between sessions. */
async function seedPost(providers: HocuspocusProvider[], postId: string): Promise<HocuspocusProvider> {
  const witness = await connectWitness(providers, buildHocuspocusDocumentName("Posts", postId), postId);
  await connectWitness(providers, buildHocuspocusCommentsDocName("Posts", postId), postId);
  await withProviderFlush(witness, async () => {
    const paragraph = new XmlText();
    paragraph.setAttribute("__type", "paragraph");
    witness.document.get("root", XmlText).insertEmbed(0, paragraph);
  });
  await withMainDocEditorSession({
    postId,
    token: signToken("edit", postId),
    operationLabel: "TestSeed",
    callback: async ({ editor }) => {
      editor.update(() => {
        $getRoot().clear().append($createParagraphNode().append($createTextNode(SEEDED_TEXT)));
      }, { discrete: true });
    },
  });
  return witness;
}

function readCommentMarkerIds(postId: string): Promise<string[]> {
  return withMainDocEditorSession({
    postId,
    token: signToken("edit", postId),
    operationLabel: "TestReadMarkers",
    callback: async ({ editor }) => editor.getEditorState().read(() =>
      $dfs().flatMap(({ node }) => $isMarkNode(node) ? node.getIDs() : []),
    ),
  });
}

describe("Hocuspocus read-only enforcement", () => {
  const originalSecret = process.env.HOCUSPOCUS_JWT_SECRET;
  let server: Server;
  const providers: HocuspocusProvider[] = [];

  beforeAll(async () => {
    process.env.HOCUSPOCUS_JWT_SECRET = JWT_SECRET;
    server = new Server({
      port: 0,
      address: "127.0.0.1",
      quiet: true,
      stopOnSignals: false,
      onAuthenticate: authenticateConnection,
      async onStateless({ payload }) {
        pendingStatelessMessages.get(payload)?.();
        pendingStatelessMessages.delete(payload);
      },
    });
    await server.listen();
    process.env.HOCUSPOCUS_URL = server.webSocketURL;
  });

  afterEach(() => {
    for (const provider of providers.splice(0)) {
      provider.destroy();
      provider.configuration.websocketProvider.destroy();
    }
  });

  afterAll(async () => {
    await server.destroy();
    process.env.HOCUSPOCUS_JWT_SECRET = originalSecret;
  });

  it("discards updates from read-only connections instead of applying and broadcasting them", async () => {
    const editor = await connectTrackedProvider(server, providers, "edit");
    const reader = await connectTrackedProvider(server, providers, "read");
    expect(reader.authorizedScope).toBe("readonly");

    editor.document.getText("text").insert(0, "original;");
    await waitForCondition(() => reader.document.getText("text").toString() === "original;", "the reader to receive the editor's change");

    reader.document.getText("text").insert(0, "injected;");
    await waitUntilServerHasProcessedPriorMessages(reader, "reader-flush");

    expect(getServerDocumentText(server)).toBe("original;");

    // The editor keeps receiving other updates, but never the reader's.
    editor.document.getText("text").insert(9, "more;");
    await waitUntilServerHasProcessedPriorMessages(editor, "editor-flush");
    expect(getServerDocumentText(server)).toBe("original;more;");
    expect(editor.document.getText("text").toString()).toBe("original;more;");
  });

  it("applies updates from connections with comment access", async () => {
    const commenter = await connectTrackedProvider(server, providers, "comment");
    const editor = await connectTrackedProvider(server, providers, "edit");
    const textBefore = getServerDocumentText(server) ?? "";
    expect(commenter.authorizedScope).toBe("read-write");

    commenter.document.getText("text").insert(0, "suggestion;");
    await waitUntilServerHasProcessedPriorMessages(commenter, "commenter-flush");

    expect(getServerDocumentText(server)).toBe(`suggestion;${textBefore}`);
    await waitForCondition(() => editor.document.getText("text").toString() === `suggestion;${textBefore}`, "the editor to receive the commenter's change");
  });

  it("applies read-only access to a document's comments", async () => {
    const postId = "readOnlyComments";
    const reader = createHeadlessProvider({
      name: buildHocuspocusCommentsDocName("Posts", postId),
      document: new Doc(),
      token: signToken("read", postId),
    });
    providers.push(reader);
    await connectAndSync(reader);

    expect(reader.authorizedScope).toBe("readonly");
  });

  it("lets comment access add, reply to, and resolve a comment, including its marker in the document", async () => {
    const postId = "commentFlow";
    await seedPost(providers, postId);
    const commentArgs = { collectionName: "Posts", documentId: postId, token: signToken("comment", postId) };

    const { threadId, anchorStatus } = await insertCollabCommentThread({ ...commentArgs, comment: "A comment", quote: SEEDED_TEXT, author: "Commenter", authorId: "commenter" });
    expect(anchorStatus).toBe("attached_by_quote_match");
    expect(await readCommentMarkerIds(postId)).toEqual([threadId]);

    const reply = await appendReplyToCommentThread({ ...commentArgs, threadId, comment: "A reply", author: "Commenter", authorId: "commenter" });
    expect(reply.kind).toBe("success");

    expect(await resolveCollabCommentThread({ ...commentArgs, threadId })).toEqual({ kind: "success" });
    expect(await readCommentMarkerIds(postId)).toEqual([]);
  });

  it("lets comment access make a suggestion, including its review thread", async () => {
    const postId = "suggestionFlow";
    await seedPost(providers, postId);

    const result = await replaceTextInMainDoc({
      postId,
      token: signToken("comment", postId),
      quote: SEEDED_TEXT,
      replacement: "Suggested text",
      mode: "suggest",
      authorName: "Commenter",
      authorId: "commenter",
    });

    expect(result.replaced).toBe(true);
    expect(result.threadCreationFailed).toBeFalsy();
  });

  it("reads a document with an orphan over a read-only connection", async () => {
    const postId = "readOnlyOrphan";
    const witness = await seedPost(providers, postId);
    await withProviderFlush(witness, async () => {
      witness.document.get("root", XmlText).insertEmbed(0, new XmlText());
    });
    await sleep(50);

    const text = await withMainDocEditorSession({
      postId,
      token: signToken("read", postId),
      operationLabel: "TestReadOrphan",
      callback: async ({ editor }) => editor.getEditorState().read(() => $getRoot().getTextContent()),
    });

    expect(text).toContain(SEEDED_TEXT);
  });
});
