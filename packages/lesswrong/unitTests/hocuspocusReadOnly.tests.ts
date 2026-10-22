import jwt from "jsonwebtoken";
import WebSocket from "ws";
import { Doc } from "yjs";
import { HocuspocusProvider, HocuspocusProviderWebsocket } from "@hocuspocus/provider";
// @hocuspocus/server is only installed for the Hocuspocus server package.
import { Server } from "../../../fly/hocuspocusServer/node_modules/@hocuspocus/server";
import { authenticateConnection } from "../../../fly/hocuspocusServer/src/auth";
import type { CollaborativeEditingAccessLevel } from "@/lib/collections/posts/collabEditingPermissions";
import { sleep } from "@/lib/utils/asyncUtils";

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

function newConnectionConfig() {
  return { readOnly: false, isAuthenticated: false };
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

describe("Hocuspocus authenticateConnection", () => {
  const originalSecret = process.env.HOCUSPOCUS_JWT_SECRET;
  beforeAll(() => {
    process.env.HOCUSPOCUS_JWT_SECRET = JWT_SECRET;
  });
  afterAll(() => {
    process.env.HOCUSPOCUS_JWT_SECRET = originalSecret;
  });

  it.each([
    ["read", true],
    ["comment", false],
    ["edit", false],
  ] as const)("sets readOnly for %s access to %s", async (accessLevel, expectedReadOnly) => {
    const connectionConfig = newConnectionConfig();
    const context = await authenticateConnection({ token: signToken(accessLevel), documentName: DOCUMENT_NAME, connectionConfig });
    expect(connectionConfig.readOnly).toBe(expectedReadOnly);
    expect(context.user.canEdit).toBe(!expectedReadOnly);
  });

  it("applies the token's access level to the document's subdocuments", async () => {
    const connectionConfig = newConnectionConfig();
    await authenticateConnection({ token: signToken("read"), documentName: `${DOCUMENT_NAME}/comments`, connectionConfig });
    expect(connectionConfig.readOnly).toBe(true);
  });

  it("rejects tokens with no access", async () => {
    await expect(authenticateConnection({
      token: signToken("none"),
      documentName: DOCUMENT_NAME,
      connectionConfig: newConnectionConfig(),
    })).rejects.toThrow("Access denied");
  });

  it("rejects tokens issued for a different document", async () => {
    await expect(authenticateConnection({
      token: signToken("edit", "someOtherPost"),
      documentName: DOCUMENT_NAME,
      connectionConfig: newConnectionConfig(),
    })).rejects.toThrow("cannot access document");
  });
});

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

    commenter.document.getText("text").insert(0, "suggestion;");
    await waitUntilServerHasProcessedPriorMessages(commenter, "commenter-flush");

    expect(getServerDocumentText(server)).toBe(`suggestion;${textBefore}`);
    await waitForCondition(() => editor.document.getText("text").toString() === `suggestion;${textBefore}`, "the editor to receive the commenter's change");
  });
});
