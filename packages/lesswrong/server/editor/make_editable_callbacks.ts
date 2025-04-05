import {extractVersionsFromSemver} from '../../lib/editor/utils'
import {htmlToPingbacks} from '../pingbacks'
import { isEditableField } from '../../lib/editor/make_editable'
import { collectionNameToTypeName } from '../../lib/generated/collectionTypeNames'
import { CallbackHook } from '../utils/callbackHooks'
import {notifyUsersAboutMentions, PingbackDocumentPartial} from './mentions-notify'
import {getLatestRev, getNextVersion, htmlToChangeMetrics, isBeingUndrafted, MaybeDrafteable} from './utils'
import isEqual from 'lodash/isEqual'
import { fetchFragmentSingle } from '../fetchFragment'
import { convertImagesInObject } from '../scripts/convertImagesToCloudinary'
import type { AfterCreateCallbackProperties, CreateCallbackProperties, UpdateCallbackProperties } from '../mutationCallbacks'
import type { MakeEditableOptions } from '@/lib/editor/makeEditableOptions'
import { createRevision } from '../collections/revisions/mutations'
import { buildRevision } from './conversionUtils'
import { updateDenormalizedHtmlAttributionsDueToRev } from '../callbacks/revisionCallbacks'

interface CreateBeforeEditableCallbackProperties<N extends CollectionNameString> {
  doc: CreateInputsByCollectionName[N]['data'];
  props: CreateCallbackProperties<N>;
}

interface UpdateBeforeEditableCallbackProperties<N extends CollectionNameString> {
  docData: UpdateInputsByCollectionName[N]['data'];
  props: UpdateCallbackProperties<N>;
}

interface CreateAfterEditableCallbackProperties<N extends CollectionNameString> {
  newDoc: ObjectsByCollectionName[N];
  props: AfterCreateCallbackProperties<N>;
}

interface UpdateAfterEditableCallbackProperties<N extends CollectionNameString> {
  newDoc: ObjectsByCollectionName[N];
  props: UpdateCallbackProperties<N>;
}

interface NewAsyncEditableCallbackProperties<N extends CollectionNameString> {
  newDoc: ObjectsByCollectionName[N];
  props: AfterCreateCallbackProperties<N>;
}

interface EditAsyncEditableCallbackProperties<N extends CollectionNameString> {
  newDoc: ObjectsByCollectionName[N];
  props: UpdateCallbackProperties<N>;
}

function getEditableFieldsCallbackProps<N extends CollectionNameString>({ schema, collection }: { schema: NewSchemaType<N>, collection: CollectionBase<N> }) {
  const editableFields = Object.entries(schema).filter(isEditableField);
  return editableFields.map(([fieldName, fieldSpec]) => {
    const { collectionName } = collection;
    const { pingbacks, normalized } = fieldSpec.graphql.editableFieldOptions;
    return {
      fieldName,
      pingbacks,
      normalized,
      collectionName,
    };
  });
}

export function getInitialVersion(document: CreateInputsByCollectionName[CollectionNameString]['data'] | ObjectsByCollectionName[CollectionNameString]) {
  if ((document as CreatePostDataInput).draft) {
    return '0.1.0'
  } else {
    return '1.0.0'
  }
}

function versionIsDraft(semver: string, collectionName: CollectionNameString) {
  if (collectionName === "Tags")
    return false;
  const {major} = extractVersionsFromSemver(semver)
  return major===0;
}

// Given a revised document, check whether fieldName (a content-editor field) is
// different from the previous revision (or there is no previous revision).
export const revisionIsChange = async (doc: AnyBecauseTodo, fieldName: string, context: ResolverContext): Promise<boolean> => {
  const id = doc._id;
  const previousVersion = await getLatestRev(id, fieldName, context);

  if (!previousVersion)
    return true;

  if (!isEqual(doc[fieldName].originalContents, previousVersion.originalContents)) {
    return true;
  }

  if (doc[fieldName].commitMessage && doc[fieldName].commitMessage.length>0) {
    return true;
  }

  return false;
}

export type EditableCallbackProperties<N extends CollectionNameString> = Pick<MakeEditableOptions<N>, 'fieldName' | 'normalized' | 'pingbacks'> & { collectionName: N };

// createBefore
async function createInitialRevision<N extends CollectionNameString>(
  doc: CreateInputsByCollectionName[N]['data'],
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
      context,
    });
    const { html, wordCount } = revision;
    const version = getInitialVersion(doc)
    const userId = currentUser._id
    const editedAt = new Date()
    const changeMetrics = htmlToChangeMetrics("", html);

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

    const firstRevision = await createRevision({ data: newRevision }, context, true);

    return {
      ...doc,
      ...(!normalized && {
        [fieldName]: {
          ...editableField,
          html, version, userId, editedAt, wordCount,
          updateType: 'initial'
        },
      }),
      [`${fieldName}_latest`]: firstRevision._id,
      ...(pingbacks ? {
        pingbacks: await htmlToPingbacks(html, null),
      } : null),
    }
  }
  return doc
}

// updateBefore
async function createUpdateRevision<N extends CollectionNameString>(
  docData: UpdateInputsByCollectionName[N]['data'],
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
      context,
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
    const previousRev = await getLatestRev(newDocument._id, fieldName, context);
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

    const newRevisionDoc = await createRevision({ data: newRevision }, context, true);
    const newRevisionId = newRevisionDoc._id;

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
async function updateRevisionDocumentId<N extends CollectionNameString>(newDoc: ObjectsByCollectionName[N], { context }: AfterCreateCallbackProperties<N>, options: EditableCallbackProperties<N>) {
  const { fieldName = "contents" } = options;

  const { Revisions } = context;

  // Update revision to point to the document that owns it.
  const revisionID = (newDoc as AnyBecauseHard)[`${fieldName}_latest`];
  if (revisionID) {
    await Revisions.rawUpdateOne(
      { _id: revisionID },
      { $set: { documentId: newDoc._id } }
    );
    const updatedRevision = await Revisions.findOne({_id: revisionID});
    if (updatedRevision) {
      await updateDenormalizedHtmlAttributionsDueToRev({
        revision: updatedRevision,
        skipDenormalizedAttributions: updatedRevision.skipAttributions,
        context
      });
    }
  }
  return newDoc;
}

// createAfter
async function notifyUsersAboutPingbackMentionsInCreate<N extends CollectionNameString>(
  newDocument: ObjectsByCollectionName[N],
  { currentUser }: AfterCreateCallbackProperties<N>,
  options: EditableCallbackProperties<N>,
) {
  const { pingbacks = false, collectionName } = options;

  const typeName = collectionNameToTypeName[collectionName];

  if (currentUser && pingbacks && 'pingbacks' in newDocument) {
    await notifyUsersAboutMentions(currentUser, typeName, newDocument)
  }

  return newDocument
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

// newAsync
async function reuploadImagesInNew(doc: DbObject, options: EditableCallbackProperties<CollectionNameString>, context: ResolverContext) {
  const { fieldName = "contents", collectionName } = options;

  await convertImagesInObject(collectionName, doc._id, context, fieldName)
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
async function reuploadImagesInEdit(doc: DbObject, oldDoc: DbObject, options: EditableCallbackProperties<CollectionNameString>, context: ResolverContext) {
  const { fieldName = "contents", collectionName } = options;

  const latestField = `${fieldName}_latest`;
  const hasChanged = (oldDoc as AnyBecauseHard)?.[latestField] !== (doc as AnyBecauseHard)?.[latestField];

  if (!hasChanged) return;

  await convertImagesInObject(collectionName, doc._id, context, fieldName);
}

export async function runCreateBeforeEditableCallbacks<P extends CreateBeforeEditableCallbackProperties<N>, N extends CollectionNameString>(runCallbackStageProperties: P): Promise<P['doc']> {
  let { props, doc: mutableDoc } = runCallbackStageProperties;

  const editableFieldsCallbackProps = getEditableFieldsCallbackProps(props);

  for (const editableFieldCallbackProps of editableFieldsCallbackProps) {
    mutableDoc = await createInitialRevision<N>(mutableDoc, props, editableFieldCallbackProps);
  }

  return mutableDoc;
}

export async function runCreateAfterEditableCallbacks<N extends CollectionNameString>(runCallbackStageProperties: CreateAfterEditableCallbackProperties<N>) {
  let { props, newDoc: mutableDoc } = runCallbackStageProperties;

  const editableFieldsCallbackProps = getEditableFieldsCallbackProps(props);

  for (const editableFieldCallbackProps of editableFieldsCallbackProps) {
    mutableDoc = await updateRevisionDocumentId<N>(mutableDoc, props, editableFieldCallbackProps);
    mutableDoc = await notifyUsersAboutPingbackMentionsInCreate<N>(mutableDoc, props, editableFieldCallbackProps);

  }

  return mutableDoc;
}

export async function runNewAsyncEditableCallbacks<N extends CollectionNameString>(runCallbackStageProperties: NewAsyncEditableCallbackProperties<N>) {
  let { props, newDoc } = runCallbackStageProperties;
  const { context } = props;

  const editableFieldsCallbackProps = getEditableFieldsCallbackProps(props);

  for (const editableFieldCallbackProps of editableFieldsCallbackProps) {
    await reuploadImagesInNew(newDoc, editableFieldCallbackProps, context);
  }
}

export async function runUpdateBeforeEditableCallbacks<N extends CollectionNameString>(runCallbackStageProperties: UpdateBeforeEditableCallbackProperties<N>) {
  let { props, docData } = runCallbackStageProperties;

  const editableFieldsCallbackProps = getEditableFieldsCallbackProps(props);

  for (const editableFieldCallbackProps of editableFieldsCallbackProps) {
    docData = await createUpdateRevision<N>(docData, props, editableFieldCallbackProps);
  }

  return docData;
}

export async function runUpdateAfterEditableCallbacks<N extends CollectionNameString>(runCallbackStageProperties: UpdateAfterEditableCallbackProperties<N>) {
  let { props, newDoc } = runCallbackStageProperties;

  const editableFieldsCallbackProps = getEditableFieldsCallbackProps(props);

  for (const editableFieldCallbackProps of editableFieldsCallbackProps) {
    newDoc = await notifyUsersAboutPingbackMentionsInUpdate<N>(newDoc, props, editableFieldCallbackProps);
  }

  return newDoc;
}

export async function runEditAsyncEditableCallbacks<N extends CollectionNameString>(runCallbackStageProperties: EditAsyncEditableCallbackProperties<N>) {
  let { props, newDoc } = runCallbackStageProperties;
  const { context } = props;

  const editableFieldsCallbackProps = getEditableFieldsCallbackProps(props);

  for (const editableFieldCallbackProps of editableFieldsCallbackProps) {
    await reuploadImagesInEdit(newDoc, props.oldDocument, editableFieldCallbackProps, context);
  }
}
