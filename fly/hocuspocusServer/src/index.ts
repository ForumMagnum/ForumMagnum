import { Server } from '@hocuspocus/server';
import { Logger } from '@hocuspocus/extension-logger';
import { PostgresExtension } from './extensions/postgres';
import { verifyAuthToken } from './auth';

const port = parseInt(process.env.PORT ?? '8080');

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
  
  async onAuthenticate({ token }) {
    if (!token) {
      throw new Error('Authentication required');
    }
    
    const payload = await verifyAuthToken(token);

    const { userId, displayName, accessLevel } = payload;
    
    if (accessLevel === 'none') {
      throw new Error('Access denied');
    }
    
    return {
      user: {
        id: userId,
        name: displayName,
        accessLevel,
        canEdit: accessLevel === 'edit',
      },
    };
  },
  
  // Enforce read-only for non-editors
  async onChange({ context }) {
    if (!context.user.canEdit) {
      throw new Error('Read-only access');
    }
  },
  
  async onRequest({ request, response }) {
    if (request.url === '/health') {
      response.writeHead(200, { 'Content-Type': 'text/plain' });
      response.end('OK');
      return;
    }
    
    response.writeHead(200, { 'Content-Type': 'text/plain' });
    response.end('Hocuspocus Server');
  },
});

void server.listen().then(() => {
  // eslint-disable-next-line no-console
  console.log(`Hocuspocus server running on port ${port}`);
});
