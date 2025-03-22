import type { ChangeMetrics } from '../../server/collections/revisions/collection';
import { diff } from "../vendor/node-htmldiff/htmldiff";
import { cheerioParse } from '../utils/htmlUtil'
import cheerio from 'cheerio'
import { extractVersionsFromSemver } from '../../lib/editor/utils';
import { normalizeHtmlForDiff } from '../resolvers/htmlDiff';

const countCharsInTag = (parsedHtml: cheerio.Root, tagName: string): number => {
  const instancesOfTag = parsedHtml(tagName);
  let cumulative = 0;
  for (let i=0; i<instancesOfTag.length; i++) {
    const tag = instancesOfTag[i];
    const text = cheerio(tag).text();
    cumulative += text.length;
  }
  return cumulative;
}

export const htmlToChangeMetrics = (oldHtml: string, newHtml: string): ChangeMetrics => {
  const htmlDiff = diff(normalizeHtmlForDiff(oldHtml), normalizeHtmlForDiff(newHtml));
  const parsedHtml = cheerioParse(htmlDiff);

  /// Given an HTML diff, where added sections are marked with <ins> and <del>
  /// tags, count the number of chars added and removed. This is used for providing
  /// a quick distinguisher between small and large changes, on revision history
  /// lists.
  const insertedChars = countCharsInTag(parsedHtml, "ins");
  const removedChars = countCharsInTag(parsedHtml, "del");

  return { added: insertedChars, removed: removedChars };
}

export async function getLatestRev(documentId: string, fieldName: string, context: ResolverContext): Promise<DbRevision|null> {
  const { Revisions } = context;
  return await Revisions.findOne({documentId: documentId, fieldName}, {sort: {editedAt: -1}})
}

/// Given a revision, return the last revision of the same document/field prior
/// to it (null if the revision is the first).
export async function getPrecedingRev(rev: DbRevision, context: ResolverContext): Promise<DbRevision|null> {
  const { Revisions } = context;
  return await Revisions.findOne(
    {documentId: rev.documentId, fieldName: rev.fieldName, editedAt: {$lt: rev.editedAt}},
    {sort: {editedAt: -1}}
  );
}

export function getNextVersion(previousRevision: DbRevision | null, updateType: DbRevision['updateType'] = 'minor', isDraft: boolean) {
  const { major, minor, patch } = extractVersionsFromSemver(previousRevision?.version || "1.0.0")
  switch (updateType) {
    case "patch":
      return `${major}.${minor}.${patch + 1}`
    case "minor":
      return `${major}.${minor + 1}.0`
    case "major":
      return `${major+1}.0.0`
    case "initial":
      return isDraft ? '0.1.0' : '1.0.0'
    default:
      throw new Error("Invalid updateType, must be one of 'patch', 'minor' or 'major'")
  }
}

/**
 * Make an editable document reflect the latest revision available
 *
 * Documents can get out of sync with revisions if a revision gets deleted, or
 * if there's a bug. This function will update a document to match the most
 * recent *version* in the revisions schema.
 */
export async function syncDocumentWithLatestRevision<N extends CollectionNameString>(
  collection: CollectionBase<N>,
  document: ObjectsByCollectionName[N],
  fieldName: string,
  context: ResolverContext
): Promise<void> {
  const { Revisions } = context;
  const latestRevision = await Revisions.findOne(
    {
      documentId: document._id,
      draft: false
    },
    { sort: { version: -1 } }
  )
  if (!latestRevision) {
    // Some documents are deletable, but typescript doesn't know that
    if ((document as unknown as {deleted: boolean}).deleted) {
      return
    } else {
      throw new Error(
        `Document ${document._id} (${collection.collectionName}) has no revisions`
      )
    }
  }
  await collection.rawUpdateOne(document._id, {
    $set: {
      [`${fieldName}_latest`]: latestRevision._id
    }
  })
}

export type MaybeDrafteable = { draft?: boolean } 
export const isBeingUndrafted = (oldDocument: MaybeDrafteable, newDocument: MaybeDrafteable) => oldDocument.draft && !newDocument.draft
