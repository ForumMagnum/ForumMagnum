import type { HocuspocusProvider } from "@hocuspocus/provider";
import { $createListItemNode, $createListNode, type ListNode } from "@lexical/list";
import { $createParagraphNode, $createTextNode, $getRoot, type LexicalEditor } from "lexical";
import { applyUpdate, Doc, XmlText } from "yjs";
// @hocuspocus/server is only installed for the Hocuspocus server package.
import { Server } from "../../../fly/hocuspocusServer/node_modules/@hocuspocus/server";
import { encodeStateAsUpdate as encodeServerDoc } from "../../../fly/hocuspocusServer/node_modules/yjs";
import { buildHocuspocusDocumentName, withMainDocEditorSession } from "../../../app/api/agent/editorAgentUtil";
import { connectAndSync, createHeadlessProvider, withProviderFlush } from "../../../app/api/agent/headlessProvider";
import { createSuggestionThreadInCommentsDoc } from "../../../app/api/agent/suggestionThreads";
import { sleep } from "@/lib/utils/asyncUtils";

/**
 * Regression tests for the provider lifecycle, against a real in-process
 * Hocuspocus server. `messageDelayMs` models a server that's slower than the
 * client's teardown. lightcone-commons's headlessProvider.test.ts covers the
 * same scenarios against its own Hocuspocus server version.
 */

const TOKEN = "unit-test-token";

let server: Server;
let messageDelayMs = 0;

interface ConnectedDoc {
  doc: Doc
  provider: HocuspocusProvider
}

function postDocumentName(postId: string): string {
  return buildHocuspocusDocumentName("Posts", postId);
}

async function connectDoc(name: string): Promise<ConnectedDoc> {
  const doc = new Doc();
  const provider = createHeadlessProvider({ name, document: doc, token: TOKEN });
  await connectAndSync(provider);
  return { doc, provider };
}

function serverCopy(name: string): Doc {
  const serverDoc = server.hocuspocus.documents.get(name);
  if (!serverDoc) {
    throw new Error(`${name} is not loaded`);
  }
  const copy = new Doc();
  applyUpdate(copy, encodeServerDoc(serverDoc));
  return copy;
}

/** Writes while the socket is down. */
async function writeDuringOutage({ doc, provider }: ConnectedDoc, text: string): Promise<void> {
  const sockets = Array.from(server.hocuspocus.documents.get(provider.configuration.name)?.connections.keys() ?? []);
  const closed = new Promise((resolve) => provider.configuration.websocketProvider.on("close", resolve));
  sockets.forEach((socket) => socket.terminate());
  await closed;

  doc.getText("text").insert(0, text);
}

function rootBlockIds(doc: Doc): string[] {
  return doc.get("root", XmlText).toDelta().map(({ insert }: { insert: XmlText }) => `${insert._item?.id.client}:${insert._item?.id.clock}`);
}

function createBulletList(): ListNode {
  return $createListNode("bullet").append($createListItemNode().append($createTextNode("item")));
}

function appendParagraph(editor: LexicalEditor, text: string): void {
  editor.update(() => {
    const paragraph = $createParagraphNode();
    paragraph.append($createTextNode(text));
    $getRoot().append(paragraph);
  }, { discrete: true });
}

function seedEmptyParagraph({ doc, provider }: ConnectedDoc): Promise<void> {
  return withProviderFlush(provider, async () => {
    const paragraph = new XmlText();
    paragraph.setAttribute("__type", "paragraph");
    doc.get("root", XmlText).insertEmbed(0, paragraph);
  });
}

describe("headless provider lifecycle (live server)", () => {
  beforeAll(async () => {
    server = new Server({
      port: 0,
      address: "127.0.0.1",
      quiet: true,
      stopOnSignals: false,
      extensions: [{
        beforeHandleMessage: async () => {
          if (messageDelayMs > 0) {
            await sleep(messageDelayMs);
          }
        },
      }],
    });
    await server.listen();
    process.env.HOCUSPOCUS_URL = server.webSocketURL;
  });

  afterAll(async () => {
    await server.destroy();
  });

  it("doesn't end a session until the server has applied its write", async () => {
    const postId = "slowServerWrite";
    const name = postDocumentName(postId);
    const witness = await connectDoc(name);
    try {
      await seedEmptyParagraph(witness);

      await withMainDocEditorSession({
        postId,
        token: TOKEN,
        operationLabel: "TestSlowServerWrite",
        callback: async ({ editor }) => {
          messageDelayMs = 50;
          appendParagraph(editor, "Written by the session");
        },
      });

      expect(serverCopy(name).get("root", XmlText).toString()).toContain("Written by the session");
    } finally {
      messageDelayMs = 0;
      witness.provider.destroy();
      witness.doc.destroy();
    }
  });

  it("confirms a write made during an outage", async () => {
    const name = postDocumentName("writeDuringOutage");
    const session = await connectDoc(name);
    try {
      await withProviderFlush(session.provider, () => writeDuringOutage(session, "during"));

      expect(serverCopy(name).getText("text").toString()).toBe("during");
    } finally {
      session.provider.destroy();
      session.doc.destroy();
    }
  });

  it("waits for the server to apply a write made after an outage", async () => {
    const name = postDocumentName("writeAfterOutage");
    const session = await connectDoc(name);
    try {
      await withProviderFlush(session.provider, async () => {
        await writeDuringOutage(session, "during");
        await sleep(200);

        messageDelayMs = 50;
        session.doc.getText("text").insert(0, "after ");
      });

      expect(serverCopy(name).getText("text").toString()).toBe("after during");
    } finally {
      messageDelayMs = 0;
      session.provider.destroy();
      session.doc.destroy();
    }
  });

  it("waits for the server to apply a write made after one queued as the socket closed", async () => {
    const name = postDocumentName("writeAfterClosingSocket");
    const session = await connectDoc(name);
    try {
      await withProviderFlush(session.provider, async () => {
        const { websocketProvider } = session.provider.configuration;
        const closed = new Promise((resolve) => websocketProvider.on("close", resolve));
        websocketProvider.webSocket?.close();
        session.doc.getText("text").insert(0, "closing");
        await closed;
        await sleep(200);

        messageDelayMs = 50;
        session.doc.getText("text").insert(0, "after ");
      });

      expect(serverCopy(name).getText("text").toString()).toBe("after closing");
    } finally {
      messageDelayMs = 0;
      session.provider.destroy();
      session.doc.destroy();
    }
  });

  it("doesn't receive another session's update before the server has applied it", async () => {
    const name = postDocumentName("broadcastBetweenSessions");
    const writer = await connectDoc(name);
    const reader = await connectDoc(name);
    try {
      messageDelayMs = 50;
      writer.doc.getText("text").insert(0, "unapplied");
      await sleep(20);

      expect(reader.doc.getText("text").toString()).toBe("");
    } finally {
      messageDelayMs = 0;
      writer.provider.destroy();
      writer.doc.destroy();
      reader.provider.destroy();
      reader.doc.destroy();
    }
  });

  it("sees the whole document and writes in the right place when it repairs an orphan", async () => {
    const postId = "orphanRepair";
    const name = postDocumentName(postId);
    const witness = await connectDoc(name);
    try {
      await seedEmptyParagraph(witness);
      await withMainDocEditorSession({
        postId,
        token: TOKEN,
        operationLabel: "TestOrphanSeed",
        callback: async ({ editor }) => {
          appendParagraph(editor, "first");
          appendParagraph(editor, "second");
        },
      });

      await sleep(50);
      await withProviderFlush(witness.provider, async () => {
        witness.doc.get("root", XmlText).insertEmbed(0, new XmlText());
      });

      await sleep(50);
      const seen = await withMainDocEditorSession({
        postId,
        token: TOKEN,
        operationLabel: "TestOrphanEdit",
        callback: async ({ editor }) => {
          const before = editor.getEditorState().read(() => $getRoot().getTextContent());
          appendParagraph(editor, "third");
          return before;
        },
      });

      expect(seen).toMatch(/first\s*second/);
      expect(serverCopy(name).get("root", XmlText).toString()).toMatch(/first.*second.*third/);
    } finally {
      witness.provider.destroy();
      witness.doc.destroy();
    }
  });

  it("leaves blocks alone when a transform would change them on hydration", async () => {
    const postId = "adjacentLists";
    const name = postDocumentName(postId);
    const witness = await connectDoc(name);
    try {
      await seedEmptyParagraph(witness);
      await withMainDocEditorSession({
        postId,
        token: TOKEN,
        operationLabel: "TestAdjacentListsSeed",
        callback: async ({ editor }) => {
          editor.update(() => {
            $getRoot().clear().append(createBulletList(), $createParagraphNode(), createBulletList());
          }, { discrete: true });
        },
      });

      await sleep(50);
      await withProviderFlush(witness.provider, async () => {
        witness.doc.get("root", XmlText).delete(1, 1);
      });

      await sleep(50);
      const blocksBefore = rootBlockIds(serverCopy(name));
      await withMainDocEditorSession({
        postId,
        token: TOKEN,
        operationLabel: "TestAdjacentListsEdit",
        callback: async ({ editor }) => appendParagraph(editor, "after"),
      });

      expect(rootBlockIds(serverCopy(name)).slice(0, 2)).toEqual(blocksBefore);
    } finally {
      witness.provider.destroy();
      witness.doc.destroy();
    }
  });

  it("closes a suggestion thread's socket without reconnecting", async () => {
    const opened: { readyState: number, CLOSED: number }[] = [];
    const recordSocket = (socket: { readyState: number, CLOSED: number }) => opened.push(socket);
    server.webSocketServer.on("connection", recordSocket);
    try {
      await createSuggestionThreadInCommentsDoc({
        collectionName: "Posts",
        documentId: "suggestionThreadSocket",
        token: TOKEN,
        suggestionId: "suggestion-1",
        summaryItems: [{ type: "insert", content: "text" }],
        authorName: "Author",
        authorId: "author-1",
      });

      await sleep(500);
      expect(opened.map((socket) => socket.readyState === socket.CLOSED)).toEqual([true]);
    } finally {
      server.webSocketServer.off("connection", recordSocket);
    }
  });
});
