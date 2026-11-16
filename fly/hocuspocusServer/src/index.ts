import { Server, type Extension } from '@hocuspocus/server';
import { Logger } from '@hocuspocus/extension-logger';
import { PostgresExtension } from './extensions/postgres';
import { RevisionSyncExtension } from './extensions/revisionSync';
import { verifyAuthToken } from './auth';
import { documentNamePrefixForCollection } from './documentNames';
import { replaceLexicalContents, RESTORE_TRANSACTION_ORIGIN } from './restoreDocument';
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

    const { userId, displayName, accessLevel, collectionName, documentId } = payload;
    if (e2eDebug) {
      // eslint-disable-next-line no-console
      console.error('[e2e:hocuspocus] authenticate', { documentName, collectionName, documentId, userId, accessLevel });
    }

    if (accessLevel === 'none') {
      throw new Error('Access denied');
    }

    const expected = `${documentNamePrefixForCollection(collectionName)}${documentId}`;
    if (documentName !== expected && !documentName.startsWith(`${expected}/`)) {
      throw new Error(`Access denied: token for ${collectionName} ${documentId} cannot access document ${documentName}`);
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
  async onChange({ context, transactionOrigin }) {
    if (transactionOrigin === RESTORE_TRANSACTION_ORIGIN) {
      return;
    }
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

    // Admin endpoint: replace a document's content with the content of the
    // Yjs state in the request body (base64-encoded; document name in a
    // header). Called by ForumMagnum to restore a revision, and after
    // converting or importing a post into Lexical.
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
        const restoredDoc = new Y.Doc();
        Y.applyUpdate(restoredDoc, newState);

        const connection = await server.hocuspocus.openDirectConnection(documentName);
        const connectionCount = connection.document?.connections.size ?? 0;
        try {
          await connection.transact((document) => replaceLexicalContents(document, restoredDoc));
        } finally {
          await connection.disconnect();
          restoredDoc.destroy();
        }

        // eslint-disable-next-line no-console
        console.log(`[Admin] Replaced contents of ${documentName} (${newState.length} bytes, ${connectionCount} connections)`);

        response.writeHead(200, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify({
          status: 'ok',
          documentName,
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
