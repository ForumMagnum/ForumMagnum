import type { MakeEditableOptions } from "@/lib/editor/makeEditableOptions";
import { afterCreateRevisionCallback, buildRevision, getInitialVersion } from "../editor/make_editable_callbacks";
import { getNextVersion, getLatestRev, htmlToChangeMetrics, isBeingUndrafted, MaybeDrafteable } from "../editor/utils";
import type { AfterCreateCallbackProperties, CreateCallbackProperties, UpdateCallbackProperties } from "../mutationCallbacks";
import { createMutator, validateCreateMutation } from "../vulcan-lib/mutators";
import { htmlToPingbacks } from "../pingbacks";
import { extractVersionsFromSemver } from "@/lib/editor/utils";
import { fetchFragmentSingle } from "../fetchFragment";
import { collectionNameToTypeName } from "@/lib/vulcan-lib/getCollection";
import { notifyUsersAboutMentions, PingbackDocumentPartial } from "../editor/mentions-notify";
import { getLatestContentsRevision } from "@/lib/collections/revisions/helpers";

type EditableCallbackProperties<N extends CollectionNameString> = Pick<MakeEditableOptions<N>, 'fieldName' | 'normalized' | 'pingbacks'> & { collectionName: N };

function versionIsDraft(semver: string, collectionName: CollectionNameString) {
  if (collectionName === "Tags")
    return false;
  const {major} = extractVersionsFromSemver(semver)
  return major===0;
}

// createBefore
async function editorSerializationBeforeCreate<N extends CollectionNameString>(
  doc: DbInsertion<ObjectsByCollectionName[N]>,
  {currentUser, context}: CreateCallbackProperties<N>,
  options: EditableCallbackProperties<N>,
) {
  const {
    fieldName = "contents",
    pingbacks = false,
    normalized,
    collectionName,
  } = options;

  const { Comments, Revisions } = context;

  const editableField = (doc as AnyBecauseHard)[fieldName] as EditableFieldInsertion | undefined;
  if (editableField?.originalContents) {
    if (!currentUser) { throw Error("Can't create document without current user") }
    const originalContents: DbRevision["originalContents"] = editableField.originalContents
    const commitMessage = editableField.commitMessage ?? null;
    const googleDocMetadata = editableField.googleDocMetadata;
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
          contents: editableField,
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
      skipAttributions: false,
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
      ...(!normalized && {
        [fieldName]: {
          ...editableField,
          html, version, userId, editedAt, wordCount,
          updateType: 'initial'
        },
      }),
      [`${fieldName}_latest`]: firstRevision.data._id,
      ...(pingbacks ? {
        pingbacks: await htmlToPingbacks(html, null),
      } : null),
    }
  }
  return doc
}

// updateBefore
async function editorSerializationEdit<N extends CollectionNameString>(
  docData: Partial<ObjectsByCollectionName[N]>,
  { oldDocument: document, newDocument, currentUser, context }: UpdateCallbackProperties<N>,
  options: EditableCallbackProperties<N>,
) {
  const {
    fieldName = "contents",
    pingbacks = false,
    normalized,
    collectionName,
  } = options;

  const { Revisions } = context;

  const editableField = (docData as AnyBecauseHard)[fieldName] as EditableFieldUpdate | undefined;
  if (editableField?.originalContents) {
    if (!currentUser) { throw Error("Can't create document without current user") }

    const commitMessage = editableField.commitMessage ?? null;
    const dataWithDiscardedSuggestions = editableField.dataWithDiscardedSuggestions
    delete editableField.dataWithDiscardedSuggestions

    const oldRevisionId = (document as AnyBecauseHard)?.[`${fieldName}_latest`];
    const oldRevision = oldRevisionId
      ? await fetchFragmentSingle({
        collectionName: "Revisions",
        fragmentName: "RevisionMetadata",
        selector: {_id: oldRevisionId},
        currentUser: null,
        skipFiltering: true,
      })
      : null;

    const revision = await buildRevision({
      originalContents: (newDocument as AnyBecauseHard)[fieldName].originalContents,
      dataWithDiscardedSuggestions,
      currentUser,
    });
    const { html, wordCount } = revision;

    const defaultUpdateType = editableField.updateType ||
      (!oldRevision && 'initial') ||
      'minor';
    // When a document is undrafted for the first time, we ensure that this constitutes a major update
    const { major } = extractVersionsFromSemver(oldRevision?.version ?? null);
    const beingUndrafted = isBeingUndrafted(document as MaybeDrafteable, newDocument as MaybeDrafteable)
    const updateType = (beingUndrafted && (major < 1)) ? 'major' : defaultUpdateType
    const userId = currentUser._id
    const editedAt = new Date()
    const previousRev = await getLatestRev(newDocument._id, fieldName);
    const version = getNextVersion(previousRev, updateType, (newDocument as DbPost).draft)
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
      skipAttributions: false,
    };
    
    const newRevisionDoc = await createMutator({
      collection: Revisions,
      document: newRevision,
      validate: false
    });

    const newRevisionId = newRevisionDoc.data._id;

    if (newRevisionId) {
      await afterCreateRevisionCallback.runCallbacksAsync([{ revisionID: newRevisionId }]);
    }

    return {
      ...docData,
      ...(!normalized && {
        [fieldName]: {
          ...editableField,
          html, version, userId, editedAt, wordCount
        },
      }),
      [`${fieldName}_latest`]: newRevisionId,
      ...(pingbacks ? {
        pingbacks: await htmlToPingbacks(html, [{
            collectionName: collectionName,
            documentId: document._id,
          }]
        ),
      } : null),
    }
  }
  return docData
}

// createAfter
async function editorSerializationAfterCreate<N extends CollectionNameString>(newDoc: ObjectsByCollectionName[N], { context }: AfterCreateCallbackProperties<N>, options: EditableCallbackProperties<N>) {
  const { fieldName = "contents" } = options;

  const { Revisions } = context;

  // Update revision to point to the document that owns it.
  const revisionID = (newDoc as AnyBecauseHard)[`${fieldName}_latest`];
  if (revisionID) {
    await Revisions.rawUpdateOne(
      { _id: revisionID },
      { $set: { documentId: newDoc._id } }
    );
    await afterCreateRevisionCallback.runCallbacksAsync([{ revisionID: revisionID }]);
  }
  return newDoc;
}

async function notifyUsersAboutPingbackMentionsInCreate<N extends CollectionNameString>(
  newDocument: ObjectsByCollectionName[N],
  { currentUser }: AfterCreateCallbackProperties<N>,
  options: EditableCallbackProperties<N>,
) {
  const { pingbacks = false, collectionName } = options;

  const typeName = collectionNameToTypeName(collectionName);

  if (currentUser && pingbacks && 'pingbacks' in newDocument) {
    await notifyUsersAboutMentions(currentUser, typeName, newDocument)
  }

  return newDocument
}

async function updateFirstDebateCommentPostId(newDoc: DbPost, { context, currentUser }: AfterCreateCallbackProperties<'Posts'>) {
  const { Comments } = context;

  const isFirstDebatePostComment = 'debate' in newDoc
      ? !!newDoc.debate
      : false;
  if (currentUser && isFirstDebatePostComment) {
    const revision = await getLatestContentsRevision(newDoc, context);
    if (!revision?.html) {
      return newDoc;
    }
    await createMutator({
      collection: Comments,
      document: {
        userId: currentUser._id,
        postId: newDoc._id,
        contents: revision as EditableFieldInsertion,
        debateResponse: true,
      },
      context,
      currentUser,
    });
  }
  return newDoc;
}

// updateAfter
async function notifyUsersAboutPingbackMentionsInUpdate<N extends CollectionNameString>(
  newDocument: ObjectsByCollectionName[N],
  { oldDocument, currentUser, context }: UpdateCallbackProperties<N>,
  options: EditableCallbackProperties<N>,
) {
  const { pingbacks = false, collectionName } = options;

  if (currentUser && pingbacks && 'pingbacks' in newDocument) {
    await notifyUsersAboutMentions(currentUser, collectionName, newDocument, oldDocument as PingbackDocumentPartial)
  }

  return newDocument
}

// editAsync
/**
 * Reupload images to cloudinary. This is mainly for images pasted from google docs, because
 * they have fairly strict rate limits that often result in them failing to load.
 *
 * NOTE: This is still necessary even if CkEditor is configured to reupload
 * images, because images have URLs that come from Markdown or RSS sync.
 * See: https://app.asana.com/0/628521446211730/1203311932993130/f
 * It's fine to leave it here just in case though
 */
async function reuploadImagesInEdit(doc: DbObject, oldDoc: DbObject, options: EditableCallbackProperties<CollectionNameString>) {
  const { fieldName = "contents", collectionName } = options;

  const latestField = `${fieldName}_latest`;
  const hasChanged = (oldDoc as AnyBecauseHard)?.[latestField] !== (doc as AnyBecauseHard)?.[latestField];

  if (!hasChanged) return;

  await Globals.convertImagesInObject(collectionName, doc._id, fieldName);
}

// newAsync
async function reuploadImagesInNew(doc: DbObject, options: EditableCallbackProperties<CollectionNameString>) {
  const { fieldName = "contents", collectionName } = options;

  await Globals.convertImagesInObject(collectionName, doc._id, fieldName)
}

async function rehostPostMetaImagesInNew(doc: DbPost) {
  await Globals.rehostPostMetaImages(doc);
}
