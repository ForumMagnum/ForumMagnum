import * as Y from 'yjs';
import YjsDocuments from '@/server/collections/yjsDocuments/collection';
import { randomId } from '@/lib/random';
import { htmlToYjsBinaryAsync } from '@/server/editor/htmlToYjsState';

/**
 * Seed an empty-but-non-empty Lexical state into YjsDocuments for a freshly
 * created ResearchDocument.
 *
 * Why: `withMainDocEditorSession()` throws if the root has zero children
 * after Hocuspocus sync (`editorAgentUtil.ts:372-379`). Without a seed, the
 * first agent edit on a brand-new ResearchDocument trips that guard.
 *
 * What we write: a Yjs binary representing a Lexical document with a single
 * empty paragraph node (parsed from "<p></p>"). Subsequent edits go through
 * the normal collab path; this is purely a one-time bootstrap.
 *
 * The Hocuspocus server reads from this same row on its first onLoadDocument
 * for "research-doc-{id}", so seeding the DB is sufficient — no need to
 * connect to the live server here.
 */
export async function bootstrapResearchDocumentYjsState(documentId: string): Promise<void> {
  const yjsBinary = await htmlToYjsBinaryAsync('<p></p>');

  // Compute the state-vector for the freshly-built doc by re-applying the
  // update into a fresh Y.Doc; this matches what onStoreDocument writes.
  const tempDoc = new Y.Doc();
  Y.applyUpdate(tempDoc, yjsBinary);
  const stateVector = Y.encodeStateVector(tempDoc);
  tempDoc.destroy();

  await YjsDocuments.rawInsert({
    _id: randomId(),
    collectionName: 'ResearchDocuments',
    documentId,
    yjsState: Buffer.from(yjsBinary),
    yjsStateVector: Buffer.from(stateVector),
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}
