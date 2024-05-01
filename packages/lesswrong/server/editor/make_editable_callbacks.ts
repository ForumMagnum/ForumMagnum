import {getCollectionHooks} from '../mutationCallbacks'
import {Revisions} from '../../lib/collections/revisions/collection'
import {extractVersionsFromSemver} from '../../lib/editor/utils'
import {ensureIndex} from '../../lib/collectionIndexUtils'
import {htmlToPingbacks} from '../pingbacks'
import {
  editableCollections,
  editableCollectionsFieldOptions,
  editableCollectionsFields,
  MakeEditableOptions,
  sealEditableFields,
} from '../../lib/editor/make_editable'
import {getCollection} from '../../lib/vulcan-lib/getCollection'
import {CallbackHook} from '../../lib/vulcan-lib/callbacks'
import {createMutator, validateCreateMutation} from '../vulcan-lib/mutators'
import * as _ from 'underscore'
import {onStartup} from '../../lib/executionEnvironment'
import {dataToHTML, dataToWordCount} from './conversionUtils'
import {Globals} from '../../lib/vulcan-lib/config'
import {notifyUsersAboutMentions, PingbackDocumentPartial} from './mentions-notify'
import {getLatestRev, getNextVersion, htmlToChangeMetrics, isBeingUndrafted, MaybeDrafteable} from './utils'
import { Comments } from '../../lib/collections/comments'

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

function versionIsDraft(semver: string, collectionName: CollectionNameString) {
  if (collectionName === "Tags")
    return false;
  const { major, minor, patch } = extractVersionsFromSemver(semver)
  return major===0;
}

ensureIndex(Revisions, {documentId: 1, version: 1, fieldName: 1, editedAt: 1})

export async function buildRevision({ originalContents, currentUser, dataWithDiscardedSuggestions }: {
  originalContents: DbRevision["originalContents"],
  currentUser: DbUser,
  dataWithDiscardedSuggestions?: string
}) {

  if (!originalContents) throw new Error ("Can't build revision without originalContents")

  const { data, type } = originalContents;
  const readerVisibleData = dataWithDiscardedSuggestions ?? data
  const html = await dataToHTML(readerVisibleData, type, { sanitize: !currentUser.isAdmin })
  const wordCount = await dataToWordCount(readerVisibleData, type)

  return {
    html, wordCount, originalContents,
    editedAt: new Date(),
    userId: currentUser._id,
  };
}

// Given a revised document, check whether fieldName (a content-editor field) is
// different from the previous revision (or there is no previous revision).
export const revisionIsChange = async (doc: AnyBecauseTodo, fieldName: string): Promise<boolean> => {
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

function addEditableCallbacks<N extends CollectionNameString>({collection, options = {}}: {
  collection: CollectionBase<N>,
  options: MakeEditableOptions
}) {
  const {
    fieldName = "contents",
    pingbacks = false,
  } = options

  const collectionName = collection.collectionName;

  getCollectionHooks(collectionName).createBefore.add(
    async function editorSerializationBeforeCreate (doc: AnyBecauseTodo, { currentUser, context }: AnyBecauseTodo)
  {
    if (doc[fieldName]?.originalContents) {
      if (!currentUser) { throw Error("Can't create document without current user") }
      const originalContents: DbRevision["originalContents"] = doc[fieldName].originalContents
      const commitMessage = doc[fieldName].commitMessage;
      const googleDocMetadata = doc[fieldName].googleDocMetadata;
      const revision = await buildRevision({
        originalContents,
        currentUser,
      });
      const { html, wordCount } = revision;
      const version = getInitialVersion(doc)
      const userId = currentUser._id
      const editedAt = new Date()
      const changeMetrics = htmlToChangeMetrics("", html);
      const isFirstDebatePostComment = (collectionName === 'Posts' && 'debate' in doc)
        ? (!!doc.debate && fieldName === 'contents')
        : false;

      if (isFirstDebatePostComment) {
        const createFirstCommentParams: CreateMutatorParams<"Comments"> = {
          collection: Comments,
          document: {
            userId,
            contents: doc[fieldName],
            debateResponse: true,
          },
          context,
          currentUser,
        };

        // We need to validate that we'll be able to successfully create the comment in the updateFirstDebateCommentPostId callback
        // If we can't, we'll be stuck with a malformed debate post with no comments
        await validateCreateMutation(createFirstCommentParams);
      }

      const newRevision: Omit<DbRevision, "documentId" | "schemaVersion" | "_id" | "voteCount" | "baseScore" | "extendedScore" | "score" | "inactive" | "autosaveTimeoutStart" | "afBaseScore" | "afExtendedScore" | "afVoteCount" | "legacyData"> = {
        ...revision,
        fieldName,
        collectionName,
        version,
        draft: versionIsDraft(version, collectionName),
        updateType: 'initial',
        commitMessage,
        googleDocMetadata,
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
    async function editorSerializationEdit (docData: AnyBecauseTodo, { oldDocument: document, newDocument, currentUser }: AnyBecauseTodo)
  {
    if (docData[fieldName]?.originalContents) {
      if (!currentUser) { throw Error("Can't create document without current user") }

      const commitMessage = docData[fieldName].commitMessage;
      const dataWithDiscardedSuggestions = docData[fieldName].dataWithDiscardedSuggestions
      delete docData[fieldName].dataWithDiscardedSuggestions

      const revision = await buildRevision({
        originalContents: newDocument[fieldName].originalContents,
        dataWithDiscardedSuggestions,
        currentUser,
      });
      const { html, wordCount } = revision;

      const defaultUpdateType = docData[fieldName].updateType || (!document[fieldName] && 'initial') || 'minor'
      // When a document is undrafted for the first time, we ensure that this constitutes a major update
      const { major } = extractVersionsFromSemver((document[fieldName] && document[fieldName].version) ? document[fieldName].version : undefined)
      const beingUndrafted = isBeingUndrafted(document as MaybeDrafteable, newDocument as MaybeDrafteable)
      const updateType = (beingUndrafted && (major < 1)) ? 'major' : defaultUpdateType
      const userId = currentUser._id
      const editedAt = new Date()
      const previousRev = await getLatestRev(newDocument._id, fieldName);
      const version = getNextVersion(previousRev, updateType, (newDocument as DbPost).draft)

      let newRevisionId;
      if (await revisionIsChange(newDocument, fieldName)) {
        const changeMetrics = htmlToChangeMetrics(previousRev?.html || "", html);

        const newRevision: Omit<DbRevision, '_id' | 'schemaVersion' | "voteCount" | "baseScore" | "extendedScore"| "score" | "inactive" | "autosaveTimeoutStart" | "afBaseScore" | "afExtendedScore" | "afVoteCount" | "legacyData" | "googleDocMetadata"> = {
          documentId: document._id,
          ...revision,
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
        newRevisionId = previousRev!._id;
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
    async function editorSerializationAfterCreate(newDoc: AnyBecauseTodo)
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


  getCollectionHooks(collectionName).createAfter.add(async (newDocument, {currentUser}) => {
    if (currentUser && pingbacks && 'pingbacks' in newDocument) {
      await notifyUsersAboutMentions(currentUser, collection.typeName, newDocument)
    }

    return newDocument
  })

  if (collectionName === 'Posts') {
    getCollectionHooks(collectionName).createAfter.add(
      async function updateFirstDebateCommentPostId(newDoc, { context, currentUser })
    {
      const isFirstDebatePostComment = 'debate' in newDoc
          ? (!!newDoc.debate && fieldName === 'contents')
          : false;
      if (currentUser && isFirstDebatePostComment) {
        await createMutator({
          collection: Comments,
          document: {
            userId: currentUser._id,
            postId: newDoc._id,
            contents: (newDoc as DbPost)[fieldName as keyof DbPost],
            debateResponse: true,
          },
          context,
          currentUser,
        });
      }
      return newDoc;
    });
  }

  getCollectionHooks(collectionName).updateAfter.add(async (newDocument, {oldDocument, currentUser}) => {
    if (currentUser && pingbacks && 'pingbacks' in newDocument) {
      await notifyUsersAboutMentions(currentUser, collection.typeName, newDocument, oldDocument as PingbackDocumentPartial)
    }

    return newDocument
  })

  /**
   * Reupload images to cloudinary. This is mainly for images pasted from google docs, because
   * they have fairly strict rate limits that often result in them failing to load.
   *
   * NOTE: This is still necessary even if CkEditor is configured to reupload
   * images, because images have URLs that come from Markdown or RSS sync.
   * See: https://app.asana.com/0/628521446211730/1203311932993130/f
   * It's fine to leave it here just in case though
   */
  getCollectionHooks(collectionName).editAsync.add(async (doc: DbObject, oldDoc: DbObject) => {
    const hasChanged = (oldDoc as AnyBecauseHard)?.[fieldName]?.html !== (doc as AnyBecauseHard)?.[fieldName]?.html;
    
    if (!hasChanged) return;

    await Globals.convertImagesInObject(collectionName, doc._id, fieldName);
  })
  getCollectionHooks(collectionName).newAsync.add(async (doc: DbObject) => {
    await Globals.convertImagesInObject(collectionName, doc._id, fieldName)
  })
  if (collectionName === 'Posts') {
    getCollectionHooks("Posts").newAsync.add(async (doc: DbPost) => {
      await Globals.rehostPostMetaImages(doc);
    })
  }
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
