import { Server, type Extension } from '@hocuspocus/server';
import { Logger } from '@hocuspocus/extension-logger';
import { PostgresExtension } from './extensions/postgres';
import { RevisionSyncExtension } from './extensions/revisionSync';
import { verifyAuthToken } from './auth';
import * as Y from 'yjs';
import crypto from 'crypto';

const port = parseInt(process.env.PORT ?? '8080');
const e2eDebug = process.env.E2E === 'true';

const postgresExtension = new PostgresExtension({
  connectionString: process.env.DATABASE_URL!,
});

const extensions: Extension[] = [
  postgresExtension,
  new Logger(),
];

// Only enable the RevisionSync extension if the webhook URL is configured
if (process.env.HOCUSPOCUS_WEBHOOK_URL && process.env.HOCUSPOCUS_WEBHOOK_SECRET) {
  extensions.push(
    new RevisionSyncExtension({
      webhookUrl: process.env.HOCUSPOCUS_WEBHOOK_URL,
      webhookSecret: process.env.HOCUSPOCUS_WEBHOOK_SECRET,
    }),
  );
}

/**
 * Verify the admin secret for the /admin/reset-document endpoint.
 * Uses the same HOCUSPOCUS_WEBHOOK_SECRET that ForumMagnum uses
 * to authenticate webhook requests.
 */
function verifyAdminSecret(providedSecret: string): boolean {
  const expectedSecret = process.env.HOCUSPOCUS_WEBHOOK_SECRET;
  if (!expectedSecret) {
    return false;
  }
  // Constant-time comparison to prevent timing attacks
  try {
    return crypto.timingSafeEqual(
      Buffer.from(expectedSecret),
      Buffer.from(providedSecret),
    );
  } catch {
    return false;
  }
}

const server = new Server({
  port,
  address: '0.0.0.0',
  
  quiet: process.env.NODE_ENV === 'production',
  
  extensions,
  
  async onAuthenticate({ token, documentName }) {
    if (!token) {
      throw new Error('Authentication required');
    }
    
    const payload = await verifyAuthToken(token);

    const { userId, displayName, accessLevel, postId } = payload;
    if (e2eDebug) {
      // eslint-disable-next-line no-console
      console.error('[e2e:hocuspocus] authenticate', { documentName, postId, userId, accessLevel });
    }
    
    if (accessLevel === 'none') {
      throw new Error('Access denied');
    }
    
    // Validate that the document belongs to the post the token authorizes.
    // Document names are "post-{postId}" or "post-{postId}/{subDocId}" for nested documents.
    const expectedPrefix = `post-${postId}`;
    if (documentName !== expectedPrefix && !documentName.startsWith(`${expectedPrefix}/`)) {
      throw new Error(`Access denied: token for post ${postId} cannot access document ${documentName}`);
    }
    
    return {
      user: {
        id: userId,
        name: displayName,
        accessLevel,
        // Allow both 'edit' and 'comment' users to write to the document.
        // 'comment' users are forced into suggestion mode on the client side,
        // so their edits will be wrapped in suggestion marks rather than being direct edits.
        canEdit: accessLevel === 'edit' || accessLevel === 'comment',
      },
    };
  },
  
  // Enforce read-only for non-editors.
  async onChange({ context }) {
    if (!context.user?.canEdit) {
      throw new Error('Read-only access');
    }
    if (e2eDebug) {
      // eslint-disable-next-line no-console
      console.error('[e2e:hocuspocus] change', { documentName: context.documentName, userId: context.user?.id });
    }
  },
  
  async onRequest({ request, response }) {
    if (request.url === '/health') {
      response.writeHead(200, { 'Content-Type': 'text/plain' });
      response.end('OK');
      // Prevent Hocuspocus' default request handler from also writing a response.
      // Hocuspocus treats a falsy thrown value as "handled".
      // See: Server.requestHandler in @hocuspocus/server.
      throw null;
    }

    // Admin endpoint: replace a document's Yjs state entirely.
    // Called by ForumMagnum's revertPostToRevision mutation to restore
    // a collaborative Lexical document to a previous revision.
    //
    // This does a destructive replacement, not a CRDT merge:
    //   1. Writes the new Yjs state to the YjsDocuments table
    //   2. Closes all WebSocket connections for the document
    //   3. Unloads the in-memory Y.Doc (skipping onStoreDocument so
    //      the old state doesn't overwrite the new state in the DB)
    //   4. Clients auto-reconnect → Hocuspocus loads from DB → restored
    //
    // Writing to DB first ensures that even if a client reconnects
    // before unload completes, it will load the restored state.
    //
    // The new Yjs state is sent as a base64-encoded binary in the
    // request body. The document name is passed as a header.
    if (request.url === '/admin/reset-document' && request.method === 'POST') {
      try {
        const authHeader = request.headers.authorization;
        if (!authHeader?.startsWith('Bearer ') || !verifyAdminSecret(authHeader.slice(7))) {
          response.writeHead(401, { 'Content-Type': 'text/plain' });
          response.end('Unauthorized');
          throw null;
        }

        const documentName = request.headers['x-document-name'] as string | undefined;
        if (!documentName) {
          response.writeHead(400, { 'Content-Type': 'text/plain' });
          response.end('Missing X-Document-Name header');
          throw null;
        }

        // Read the request body (base64-encoded Yjs state)
        const body = await new Promise<string>((resolve, reject) => {
          let data = '';
          request.on('data', (chunk: Buffer) => { data += chunk.toString(); });
          request.on('end', () => resolve(data));
          request.on('error', reject);
        });

        const newState = new Uint8Array(Buffer.from(body, 'base64'));

        // Step 1: Write the new state to the database FIRST, so that
        // any client that reconnects after eviction loads the restored
        // state (not the old state).
        const tempDoc = new Y.Doc();
        Y.applyUpdate(tempDoc, newState);
        const newStateVector = Y.encodeStateVector(tempDoc);
        tempDoc.destroy();

        // Diagnostic: compare new state with what's currently in DB
        const documentId = documentName.replace(/^post-/, '');
        const existingRow = await postgresExtension.pool.query(
          'SELECT "yjsState" FROM "YjsDocuments" WHERE "documentId" = $1',
          [documentId]
        );
        if (existingRow.rows.length > 0) {
          const existingState = new Uint8Array(existingRow.rows[0].yjsState);
          const statesMatch = existingState.length === newState.length && existingState.every((b: number, i: number) => b === newState[i]);
          // eslint-disable-next-line no-console
          console.log(`[Admin] Existing DB state: ${existingState.length} bytes, new state: ${newState.length} bytes, identical: ${statesMatch}`);

          // Decode both to compare text content
          const existingDoc2 = new Y.Doc();
          Y.applyUpdate(existingDoc2, existingState);
          // eslint-disable-next-line no-console
          console.log(`[Admin] Existing text: "${existingDoc2.getXmlElement('root').toString().slice(0, 200)}"`);
          existingDoc2.destroy();
        } else {
          // eslint-disable-next-line no-console
          console.log(`[Admin] No existing state in DB for ${documentId}`);
        }

        const newDoc2 = new Y.Doc();
        Y.applyUpdate(newDoc2, newState);
        // eslint-disable-next-line no-console
        console.log(`[Admin] New (restored) text: "${newDoc2.getXmlElement('root').toString().slice(0, 200)}"`);
        newDoc2.destroy();

        await postgresExtension.storeDocumentState(documentName, newState, newStateVector);

        // eslint-disable-next-line no-console
        console.log(`[Admin] Wrote restored state for ${documentName} (${newState.length} bytes)`);

        // Step 2: Evict the in-memory document (if any). We tell the
        // PostgresExtension to skip its onStoreDocument hook for this
        // document so the unload doesn't overwrite the new state we
        // just wrote with the old in-memory state.
        const hocuspocus = server.hocuspocus;
        const existingDoc = hocuspocus.documents.get(documentName);
        const connectionCount = existingDoc?.getConnectionsCount() ?? 0;

        if (existingDoc) {
          hocuspocus.closeConnections(documentName);
          postgresExtension.skipNextStoreForDocument(documentName);
          try {
            await hocuspocus.unloadDocument(existingDoc);
          } finally {
            postgresExtension.clearSkipStoreForDocument(documentName);
          }

          // eslint-disable-next-line no-console
          console.log(`[Admin] Evicted document ${documentName} (had ${connectionCount} connections)`);
        } else {
          // eslint-disable-next-line no-console
          console.log(`[Admin] No active session for ${documentName}`);
        }

        response.writeHead(200, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify({
          status: 'ok',
          documentName,
          hadActiveSession: !!existingDoc,
          connectionCount,
        }));
      } catch (err) {
        if (err === null) throw null; // Re-throw the Hocuspocus "handled" sentinel
        // eslint-disable-next-line no-console
        console.error('[Admin] Error resetting document:', err);
        response.writeHead(500, { 'Content-Type': 'text/plain' });
        response.end('Internal server error');
      }
      throw null;
    }
    
    response.writeHead(200, { 'Content-Type': 'text/plain' });
    response.end('Hocuspocus Server');
    // Prevent Hocuspocus' default request handler from also writing a response.
    throw null;
  },
});

void server.listen().then(() => {
  // eslint-disable-next-line no-console
  console.log(`Hocuspocus server running on port ${port}`);
});
