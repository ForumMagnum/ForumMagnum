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

interface ParsedDocument {
  collectionName: string;
  documentId: string;
}

/**
 * Mapping from Hocuspocus document-name prefix to the ForumMagnum collection
 * the document belongs to. The prefix lives only at the Hocuspocus protocol
 * layer; YjsDocuments rows store the bare documentId plus the explicit
 * collectionName column.
 */
const DOCUMENT_NAME_PREFIXES: ReadonlyArray<{ prefix: string; collectionName: string }> = [
  { prefix: 'post-', collectionName: 'Posts' },
  { prefix: 'research-doc-', collectionName: 'ResearchDocuments' },
];

/**
 * Parse a Hocuspocus document name into its (collectionName, documentId) pair.
 *
 * Document names look like:
 *   - "post-{postId}" / "post-{postId}/{subDocId}"           → Posts
 *   - "research-doc-{id}" / "research-doc-{id}/{subDocId}"   → ResearchDocuments
 *
 * The prefix table is the single source of truth for which collections
 * participate in the collab editor.
 */
function parseDocumentId(documentName: string): ParsedDocument {
  for (const { prefix, collectionName } of DOCUMENT_NAME_PREFIXES) {
    if (documentName.startsWith(prefix)) {
      return { collectionName, documentId: documentName.slice(prefix.length) };
    }
  }
  throw new Error(`[PostgresExtension] Unrecognized document name prefix: ${documentName}`);
}

export class PostgresExtension implements Extension {
  private pool: Pool;

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
    const { collectionName, documentId } = parseDocumentId(documentName);

    try {
      const result = await this.pool.query(
        'SELECT "yjsState" FROM "YjsDocuments" WHERE "collectionName" = $1 AND "documentId" = $2',
        [collectionName, documentId]
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
      console.error(`[PostgresExtension] Error loading document: ${collectionName}/${documentId}`, error);
      throw error;
    }
  }

  async onStoreDocument({ documentName, document }: onStoreDocumentPayload): Promise<void> {
    if (this.skipStoreForDocuments.delete(documentName)) {
      return;
    }
    const state = Y.encodeStateAsUpdate(document);
    const stateVector = Y.encodeStateVector(document);
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
    const { collectionName, documentId } = parseDocumentId(documentName);
    try {
      await this.pool.query(`
        INSERT INTO "YjsDocuments" ("_id", "collectionName", "documentId", "yjsState", "yjsStateVector", "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
        ON CONFLICT ("collectionName", "documentId") DO UPDATE SET
          "yjsState" = EXCLUDED."yjsState",
          "yjsStateVector" = EXCLUDED."yjsStateVector",
          "updatedAt" = NOW()
      `, [generateId(), collectionName, documentId, state, stateVector]);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(`[PostgresExtension] Error storing document: ${collectionName}/${documentId}`, error);
      throw error;
    }
  }

  async onDestroy(): Promise<void> {
    await this.pool.end();
  }
}
