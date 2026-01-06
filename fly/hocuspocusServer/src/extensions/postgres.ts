import { Extension, onLoadDocumentPayload, onStoreDocumentPayload } from '@hocuspocus/server';
import { Pool } from 'pg';
import * as Y from 'yjs';
import crypto from 'crypto';

interface PostgresExtensionConfig {
  connectionString: string;
}

// Generate a random ID compatible with ForumMagnum's ID format (17 chars alphanumeric)
function generateId(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTWXYZabcdefghijkmnopqrstuvwxyz';
  let result = '';
  const randomBytes = crypto.randomBytes(17);
  for (let i = 0; i < 17; i++) {
    result += chars[randomBytes[i] % chars.length];
  }
  return result;
}

export class PostgresExtension implements Extension {
  private pool: Pool;
  
  constructor(config: PostgresExtensionConfig) {
    this.pool = new Pool({
      connectionString: config.connectionString,
      max: 20,
      idleTimeoutMillis: 30000,
    });
  }
  
  async onLoadDocument({ documentName, document }: onLoadDocumentPayload): Promise<void> {
    const postId = documentName.replace('post-', '');
    
    try {
      const result = await this.pool.query(
        'SELECT "yjsState" FROM "YjsDocuments" WHERE "documentId" = $1',
        [postId]
      );
      
      if (result.rows.length === 0) {
        return;
      }
      
      const yjsState = result.rows[0].yjsState;
      
      // PostgreSQL returns Buffer, convert to Uint8Array
      const update = new Uint8Array(yjsState);
      
      // Apply the update directly to the document
      // We do this instead of returning the bytes because Hocuspocus
      // needs the data applied before syncing to clients
      Y.applyUpdate(document, update);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(`[PostgresExtension] Error loading document for postId: ${postId}`, error);
      throw error;
    }
  }
  
  async onStoreDocument({ documentName, document }: onStoreDocumentPayload): Promise<void> {
    const postId = documentName.replace('post-', '');
    const state = Y.encodeStateAsUpdate(document);
    const stateVector = Y.encodeStateVector(document);
    
    try {
      await this.pool.query(`
        INSERT INTO "YjsDocuments" ("_id", "documentId", "yjsState", "yjsStateVector", "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, NOW(), NOW())
        ON CONFLICT ("documentId") DO UPDATE SET
          "yjsState" = EXCLUDED."yjsState",
          "yjsStateVector" = EXCLUDED."yjsStateVector",
          "updatedAt" = NOW()
      `, [generateId(), postId, state, stateVector]);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(`[PostgresExtension] Error storing document for postId: ${postId}`, error);
      throw error;
    }
  }
  
  async onDestroy(): Promise<void> {
    await this.pool.end();
  }
}
