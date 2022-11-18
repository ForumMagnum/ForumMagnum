import { getCollectionHooks } from '../mutationCallbacks';
import { Revisions, ChangeMetrics } from '../../lib/collections/revisions/collection'
import { extractVersionsFromSemver } from '../../lib/editor/utils'
import { ensureIndex } from '../../lib/collectionIndexUtils'
import { htmlToPingbacks } from '../pingbacks';
import { diff } from '../vendor/node-htmldiff/htmldiff';
import { editableCollections, editableCollectionsFields, editableCollectionsFieldOptions, sealEditableFields, MakeEditableOptions } from '../../lib/editor/make_editable';
import { getCollection } from '../../lib/vulcan-lib/getCollection';
import { CallbackHook } from '../../lib/vulcan-lib/callbacks';
import { createMutator } from '../vulcan-lib/mutators';
import * as _ from 'underscore';
import cheerio from 'cheerio';
import { onStartup } from '../../lib/executionEnvironment';
import { dataToHTML, dataToWordCount } from './conversionUtils';
import { convertImagesInObject } from '../scripts/convertImagesToCloudinary';

// TODO: Now that the make_editable callbacks use createMutator to create
// revisions, we can now add these to the regular ${collection}.create.after
// callbacks
interface AfterCreateRevisionCallbackContext {
  revisionID: string
}
export const afterCreateRevisionCallback = new CallbackHook<[AfterCreateRevisionCallbackContext]>("revisions.afterRevisionCreated");

function getInitialVersion(document: DbPost|DbObject) {
  if ((document as DbPost).draft) {
    return '0.1.0'
  } else {
    return '1.0.0'
  }
}

export async function getLatestRev(documentId: string, fieldName: string): Promise<DbRevision|null> {
  return await Revisions.findOne({documentId: documentId, fieldName}, {sort: {editedAt: -1}})
}

/// Given a revision, return the last revision of the same document/field prior
/// to it (null if the revision is the first).
export async function getPrecedingRev(rev: DbRevision): Promise<DbRevision|null> {
  return await Revisions.findOne(
    {documentId: rev.documentId, fieldName: rev.fieldName, editedAt: {$lt: rev.editedAt}},
    {sort: {editedAt: -1}}
  );
}

export async function getNextVersion(documentId: string, updateType = 'minor', fieldName: string, isDraft: boolean) {
  const lastRevision = await getLatestRev(documentId, fieldName);
  const { major, minor, patch } = extractVersionsFromSemver(lastRevision?.version || "1.0.0")
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

function versionIsDraft(semver: string, collectionName: CollectionNameString) {
  if (collectionName === "Tags")
    return false;
  const { major, minor, patch } = extractVersionsFromSemver(semver)
  return major===0;
}

ensureIndex(Revisions, {documentId: 1, version: 1, fieldName: 1, editedAt: 1})

export async function buildRevision({ originalContents, currentUser, dataWithDiscardedSuggestions }:{
  originalContents: DbRevision["originalContents"],
  currentUser: DbUser,
  dataWithDiscardedSuggestions?: string
}) {
  const { data, type } = originalContents;
  const readerVisibleData = dataWithDiscardedSuggestions ?? data
  const html = await dataToHTML(readerVisibleData, type, !currentUser.isAdmin)
  const wordCount = await dataToWordCount(readerVisibleData, type)

  return {
    html, wordCount, originalContents,
    editedAt: new Date(),
    userId: currentUser._id,
  };
}

// Given a revised document, check whether fieldName (a content-editor field) is
// different from the previous revision (or there is no previous revision).
export const revisionIsChange = async (doc, fieldName: string): Promise<boolean> => {
  const id = doc._id;
  const previousVersion = await getLatestRev(id, fieldName);

  if (!previousVersion)
    return true;

  if (!_.isEqual(doc[fieldName].originalContents, previousVersion.originalContents)) {
    return true;
  }

  if (doc[fieldName].commitMessage && doc[fieldName].commitMessage.length>0) {
    return true;
  }

  return false;
}

function addEditableCallbacks<T extends DbObject>({collection, options = {}}: {
  collection: CollectionBase<T>,
  options: MakeEditableOptions
}) {
  const {
    fieldName = "contents",
    pingbacks = false,
  } = options

  const collectionName = collection.collectionName;

  getCollectionHooks(collectionName).createBefore.add(
    async function editorSerializationBeforeCreate (doc, { currentUser })
  {
    if (doc[fieldName]?.originalContents) {
      if (!currentUser) { throw Error("Can't create document without current user") }
      const { data, type } = doc[fieldName].originalContents
      const commitMessage = doc[fieldName].commitMessage;
      const html = await dataToHTML(data, type, !currentUser.isAdmin)
      const wordCount = await dataToWordCount(data, type)
      const version = getInitialVersion(doc)
      const userId = currentUser._id
      const editedAt = new Date()
      const changeMetrics = htmlToChangeMetrics("", html);
      const newRevision: Omit<DbRevision, "documentId" | "schemaVersion" | "_id" | "voteCount" | "baseScore" | "extendedScore" | "score" | "inactive" | "autosaveTimeoutStart" | "afBaseScore" | "afExtendedScore" | "afVoteCount" | "legacyData"> = {
        ...(await buildRevision({
          originalContents: doc[fieldName].originalContents,
          currentUser,
        })),
        fieldName,
        collectionName,
        version,
        draft: versionIsDraft(version, collectionName),
        updateType: 'initial',
        commitMessage,
        changeMetrics,
        createdAt: editedAt,
      };
      const firstRevision = await createMutator({
        collection: Revisions,
        document: newRevision,
        validate: false
      });

      return {
        ...doc,
        [fieldName]: {
          ...doc[fieldName],
          html, version, userId, editedAt, wordCount,
          updateType: 'initial'
        },
        [`${fieldName}_latest`]: firstRevision.data._id,
        ...(pingbacks ? {
          pingbacks: await htmlToPingbacks(html, null),
        } : null),
      }
    }
    return doc
  });

  getCollectionHooks(collectionName).updateBefore.add(
    async function editorSerializationEdit (docData, { oldDocument: document, newDocument, currentUser })
  {
    if (docData[fieldName]?.originalContents) {
      if (!currentUser) { throw Error("Can't create document without current user") }

      const { data, type } = docData[fieldName].originalContents
      const commitMessage = docData[fieldName].commitMessage;
      const dataWithDiscardedSuggestions = docData[fieldName].dataWithDiscardedSuggestions
      delete docData[fieldName].dataWithDiscardedSuggestions

      const readerVisibleData = dataWithDiscardedSuggestions ?? data
      const html = await dataToHTML(readerVisibleData, type, !currentUser.isAdmin)
      const wordCount = await dataToWordCount(readerVisibleData, type)
      const defaultUpdateType = docData[fieldName].updateType || (!document[fieldName] && 'initial') || 'minor'
      const isBeingUndrafted = (document as DbPost).draft && !(newDocument as DbPost).draft
      // When a document is undrafted for the first time, we ensure that this constitutes a major update
      const { major } = extractVersionsFromSemver((document[fieldName] && document[fieldName].version) ? document[fieldName].version : undefined)
      const updateType = (isBeingUndrafted && (major < 1)) ? 'major' : defaultUpdateType
      const version = await getNextVersion(document._id, updateType, fieldName, (newDocument as DbPost).draft)
      const userId = currentUser._id
      const editedAt = new Date()

      let newRevisionId;
      if (await revisionIsChange(newDocument, fieldName)) {
        const previousRev = await getLatestRev(newDocument._id, fieldName);
        const changeMetrics = htmlToChangeMetrics(previousRev?.html || "", html);

        const newRevision: Omit<DbRevision, '_id' | 'schemaVersion' | "voteCount" | "baseScore" | "extendedScore"| "score" | "inactive" | "autosaveTimeoutStart" | "afBaseScore" | "afExtendedScore" | "afVoteCount" | "legacyData"> = {
          documentId: document._id,
          ...await buildRevision({
            originalContents: newDocument[fieldName].originalContents,
            dataWithDiscardedSuggestions,
            currentUser,
          }),
          fieldName,
          collectionName,
          version,
          draft: versionIsDraft(version, collectionName),
          updateType,
          commitMessage,
          changeMetrics,
          createdAt: editedAt,
        }
        const newRevisionDoc = await createMutator({
          collection: Revisions,
          document: newRevision,
          validate: false
        });
        newRevisionId = newRevisionDoc.data._id;
      } else {
        newRevisionId = (await getLatestRev(newDocument._id, fieldName))!._id;
      }

      if (newRevisionId) {
        await afterCreateRevisionCallback.runCallbacksAsync([{ revisionID: newRevisionId }]);
      }

      return {
        ...docData,
        [fieldName]: {
          ...docData[fieldName],
          html, version, userId, editedAt, wordCount
        },
        [`${fieldName}_latest`]: newRevisionId,
        ...(pingbacks ? {
          pingbacks: await htmlToPingbacks(html, [{
              collectionName: collection.collectionName,
              documentId: document._id,
            }]
          ),
        } : null),
      }
    }
    return docData
  });

  getCollectionHooks(collectionName).createAfter.add(
    async function editorSerializationAfterCreate(newDoc: DbRevision)
  {
    // Update revision to point to the document that owns it.
    const revisionID = newDoc[`${fieldName}_latest`];
    if (revisionID) {
      await Revisions.rawUpdateOne(
        { _id: revisionID },
        { $set: { documentId: newDoc._id } }
      );
      await afterCreateRevisionCallback.runCallbacksAsync([{ revisionID: revisionID }]);
    }
    return newDoc;
  });
  
  
  /**
   * Reupload images to cloudinary. This is mainly for images pasted from google docs, because
   * they have fairly strict rate limits that often result in them failing to load.
   *
   * NOTE: This is still necessary even if CkEditor is configured to reupload
   * images, because images have URLs that come from Markdown or RSS sync.
   * See: https://app.asana.com/0/628521446211730/1203311932993130/f
   * It's fine to leave it here just in case though
   */
  getCollectionHooks(collectionName).editAsync.add(async (doc: DbObject) => {
    await convertImagesInObject(collectionName, doc._id);
  })
  getCollectionHooks(collectionName).newAsync.add(async (doc: DbObject) => {
    await convertImagesInObject(collectionName, doc._id)
  })
}

export function addAllEditableCallbacks() {
  sealEditableFields();
  for (let collectionName of editableCollections) {
    for (let fieldName of editableCollectionsFields[collectionName]) {
      const collection = getCollection(collectionName);
      const options = editableCollectionsFieldOptions[collectionName][fieldName];
      addEditableCallbacks({collection, options});
    }
  }
}

onStartup(addAllEditableCallbacks);

/// Given an HTML diff, where added sections are marked with <ins> and <del>
/// tags, count the number of chars added and removed. This is used for providing
/// a quick distinguisher between small and large changes, on revision history
/// lists.
const diffToChangeMetrics = (diffHtml: string): ChangeMetrics => {
  // @ts-ignore
  const parsedHtml = cheerio.load(diffHtml, null, false);

  const insertedChars = countCharsInTag(parsedHtml, "ins");
  const removedChars = countCharsInTag(parsedHtml, "del");

  return { added: insertedChars, removed: removedChars };
}

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
  const htmlDiff = diff(oldHtml, newHtml);
  return diffToChangeMetrics(htmlDiff);
}
