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

/**
 * Parse a document name to extract the document ID for storage.
 * Document names can be:
 * - "post-{postId}" for main document
 * - "post-{postId}/{subDocId}" for nested documents (captions, comments, etc.)
 * 
 * Returns the full path after "post-" as the document ID.
 */
function parseDocumentId(documentName: string): string {
  return documentName.replace(/^post-/, '');
}

export class PostgresExtension implements Extension {
  // Public for diagnostic access from the admin endpoint
  pool: Pool;

  /**
   * Document names for which onStoreDocument should be skipped once.
   * Used by the admin reset-document endpoint: it writes the new state
   * to the DB first, then unloads the document. Without this, the
   * unload would trigger onStoreDocument which would overwrite the new
   * state with the old in-memory state.
   */
  private skipStoreForDocuments = new Set<string>();
  
  constructor(config: PostgresExtensionConfig) {
    this.pool = new Pool({
      connectionString: config.connectionString,
      max: 20,
      idleTimeoutMillis: 30000,
    });
  }
  
  async onLoadDocument({ documentName, document }: onLoadDocumentPayload): Promise<void> {
    const documentId = parseDocumentId(documentName);
    
    try {
      const result = await this.pool.query(
        'SELECT "yjsState" FROM "YjsDocuments" WHERE "documentId" = $1',
        [documentId]
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

      // Diagnostic: log what was loaded
      const rootXml = document.getXmlElement('root');
      // eslint-disable-next-line no-console
      console.log(`[PostgresExtension] Loaded ${documentName} (${update.length} bytes), text: "${rootXml.toString().slice(0, 200)}"`);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(`[PostgresExtension] Error loading document: ${documentId}`, error);
      throw error;
    }
  }
  
  async onStoreDocument({ documentName, document }: onStoreDocumentPayload): Promise<void> {
    if (this.skipStoreForDocuments.delete(documentName)) {
      // eslint-disable-next-line no-console
      console.log(`[PostgresExtension] SKIPPED onStoreDocument for ${documentName} (restore in progress)`);
      return;
    }
    const state = Y.encodeStateAsUpdate(document);
    const stateVector = Y.encodeStateVector(document);
    // eslint-disable-next-line no-console
    const rootXml = document.getXmlElement('root');
    // eslint-disable-next-line no-console
    console.log(`[PostgresExtension] onStoreDocument for ${documentName} (${state.length} bytes), text: "${rootXml.toString().slice(0, 200)}"`);
    await this.storeDocumentState(documentName, state, stateVector);
  }

  /**
   * Mark a document so that the next onStoreDocument call for it is
   * skipped. Call this before unloadDocument when you've already written
   * the desired state to the DB and don't want the unload's
   * onStoreDocument to overwrite it with stale in-memory state.
   *
   * Always pair with clearSkipStoreForDocument in a finally block to
   * prevent the flag from leaking if unloadDocument throws or doesn't
   * trigger onStoreDocument.
   */
  skipNextStoreForDocument(documentName: string): void {
    this.skipStoreForDocuments.add(documentName);
  }

  /**
   * Remove the skip-store flag for a document. No-op if the flag was
   * already consumed by onStoreDocument.
   */
  clearSkipStoreForDocument(documentName: string): void {
    this.skipStoreForDocuments.delete(documentName);
  }

  /**
   * Upserts a Yjs state into the YjsDocuments table for a given document.
   * Used by onStoreDocument (Hocuspocus autosave) and by the admin
   * reset-document endpoint (revision restore).
   */
  async storeDocumentState(
    documentName: string,
    state: Uint8Array,
    stateVector: Uint8Array,
  ): Promise<void> {
    const documentId = parseDocumentId(documentName);
    try {
      await this.pool.query(`
        INSERT INTO "YjsDocuments" ("_id", "documentId", "yjsState", "yjsStateVector", "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, NOW(), NOW())
        ON CONFLICT ("documentId") DO UPDATE SET
          "yjsState" = EXCLUDED."yjsState",
          "yjsStateVector" = EXCLUDED."yjsStateVector",
          "updatedAt" = NOW()
      `, [generateId(), documentId, state, stateVector]);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(`[PostgresExtension] Error storing document: ${documentId}`, error);
      throw error;
    }
  }
  
  async onDestroy(): Promise<void> {
    await this.pool.end();
  }
}
