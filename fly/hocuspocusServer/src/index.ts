import { Server } from '@hocuspocus/server';
import { Logger } from '@hocuspocus/extension-logger';
import { PostgresExtension } from './extensions/postgres';
import { verifyAuthToken } from './auth';

const port = parseInt(process.env.PORT ?? '8080');
const e2eDebug = process.env.E2E === 'true';

const server = new Server({
  port,
  address: '0.0.0.0',
  
  quiet: process.env.NODE_ENV === 'production',
  
  extensions: [    
    new PostgresExtension({
      connectionString: process.env.DATABASE_URL!,
    }),
    
    new Logger(),
  ],
  
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
  
  // Enforce read-only for non-editors
  async onChange({ context }) {
    if (!context.user.canEdit) {
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
