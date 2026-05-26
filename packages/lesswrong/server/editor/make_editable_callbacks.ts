import {extractVersionsFromSemver} from '../../lib/editor/utils'
import {htmlToPingbacks} from '../pingbacks'
import { isEditableField } from './isEditableField'
import {notifyUsersAboutMentions, PingbackDocumentPartial} from './mentions-notify'
import {getLatestRev, getNextVersion, htmlToChangeMetrics, isBeingUndrafted, MaybeDrafteable} from './utils'
import isEqual from 'lodash/isEqual'
import { fetchFragmentSingle } from '../fetchFragment'
import { convertImagesInObject } from '../scripts/convertImagesToCloudinary'
import type { AfterCreateCallbackProperties, CreateCallbackProperties, UpdateCallbackProperties } from '../mutationCallbacks'
import type { MakeEditableOptions } from '@/lib/editor/makeEditableOptions'
import type { RevisionOriginalContentsData } from '@/lib/collections/revisions/revisionSchemaTypes'
import { getStoredOriginalContentsForRevision } from '@/lib/collections/revisions/helpers'
import { buildAndCreateRevision } from '../collections/revisions/mutations'
import { updateDenormalizedHtmlAttributionsDueToRev, upvoteOwnTagRevision } from '../callbacks/revisionCallbacks'
import { RevisionMetadata } from '@/lib/collections/revisions/fragments'
import { backgroundTask } from '../utils/backgroundTask'

interface CreateBeforeEditableCallbackProperties<N extends CollectionNameString> {
  documentId: string;
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

function getEditableFieldsCallbackProps<N extends CollectionNameString>({ schema, collection }: { schema: SchemaType<N>, collection: CollectionBase<N> }) {
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

  const previousOriginalContents = await getStoredOriginalContentsForRevision(previousVersion, context);
  if (!isEqual(doc[fieldName].originalContents, previousOriginalContents)) {
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
  documentId: string,
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

  const editableField = (doc as AnyBecauseHard)[fieldName] as EditableFieldInsertion | undefined;
  if (editableField?.originalContents) {
    if (!currentUser) { throw Error("Can't create document without current user") }
    const originalContents: RevisionOriginalContentsData = editableField.originalContents
    const commitMessage = editableField.commitMessage ?? null;
    const googleDocMetadata = editableField.googleDocMetadata;
    const version = getInitialVersion(doc)

    const firstRevision = await buildAndCreateRevision({
      originalContents,
      user: currentUser,
      collectionName,
      documentId,
      fieldName,
      version,
      draft: versionIsDraft(version, collectionName),
      updateType: 'initial',
      commitMessage,
      googleDocMetadata,
      skipAttributions: false,
      previousHtmlForChangeMetrics: "",
    }, context);
    const html = firstRevision.html;

    return {
      ...doc,
      ...(!normalized && {
        [fieldName]: revisionToDenormalizedField(firstRevision, originalContents),
      }),
      [`${fieldName}_latest`]: firstRevision._id,
      ...(pingbacks ? {
        pingbacks: await htmlToPingbacks(html ?? "", null),
      } : null),
    }
  }
  return doc
}

function revisionToDenormalizedField(revision: DbRevision, originalContents: RevisionOriginalContentsData) {
  return {
    html: revision.html,
    userId: revision.userId,
    version: revision.version,
    editedAt: revision.editedAt,
    wordCount: revision.wordCount,
    updateType: revision.updateType,
    originalContents,
  }
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
        fragmentDoc: RevisionMetadata,
        selector: {_id: oldRevisionId},
        currentUser: null,
        skipFiltering: true,
      })
      : null;

    const originalContents = (newDocument as AnyBecauseHard)[fieldName].originalContents as RevisionOriginalContentsData;

    const defaultUpdateType = editableField.updateType ||
      (!oldRevision && 'initial') ||
      'minor';
    // When a document is undrafted for the first time, we ensure that this constitutes a major update
    const { major } = extractVersionsFromSemver(oldRevision?.version ?? null);
    const beingUndrafted = isBeingUndrafted(document as MaybeDrafteable, newDocument as MaybeDrafteable)
    const updateType = (beingUndrafted && (major < 1)) ? 'major' : defaultUpdateType
    const previousRev = await getLatestRev(newDocument._id, fieldName, context);
    const version = getNextVersion(previousRev, updateType, (newDocument as DbPost).draft)

    const newRevisionDoc = await buildAndCreateRevision({
      documentId: document._id,
      originalContents: originalContents,
      dataWithDiscardedSuggestions,
      user: currentUser,
      fieldName,
      collectionName,
      version,
      draft: versionIsDraft(version, collectionName),
      updateType,
      commitMessage,
      previousHtmlForChangeMetrics: previousRev?.html || "",
      skipAttributions: false,
    }, context);
    const newRevisionId = newRevisionDoc._id;
    const updatedHtml = newRevisionDoc.html ?? "";

    return {
      ...docData,
      ...(!normalized && {
        [fieldName]: revisionToDenormalizedField(newRevisionDoc, originalContents),
      }),
      [`${fieldName}_latest`]: newRevisionId,
      ...(pingbacks ? {
        pingbacks: await htmlToPingbacks(updatedHtml, [{
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
      await Promise.all([
        upvoteOwnTagRevision({
          revision: updatedRevision,
          context
        }),
        updateDenormalizedHtmlAttributionsDueToRev({
          revision: updatedRevision,
          skipDenormalizedAttributions: updatedRevision.skipAttributions,
          context
        })
      ]);
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

  if (currentUser && pingbacks && 'pingbacks' in newDocument) {
    await notifyUsersAboutMentions(currentUser, collectionName, newDocument)
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

export async function createInitialRevisionsForEditableFields<P extends CreateBeforeEditableCallbackProperties<N>, N extends CollectionNameString>(runCallbackStageProperties: P): Promise<P['doc']> {
  let { documentId, props, doc: mutableDoc } = runCallbackStageProperties;

  const editableFieldsCallbackProps = getEditableFieldsCallbackProps(props);

  for (const editableFieldCallbackProps of editableFieldsCallbackProps) {
    mutableDoc = await createInitialRevision<N>(documentId, mutableDoc, props, editableFieldCallbackProps);
  }

  return mutableDoc;
}

export async function updateRevisionsDocumentIds<N extends CollectionNameString>(runCallbackStageProperties: CreateAfterEditableCallbackProperties<N>) {
  let { props, newDoc: mutableDoc } = runCallbackStageProperties;

  const editableFieldsCallbackProps = getEditableFieldsCallbackProps(props);
  
  for (const editableFieldCallbackProps of editableFieldsCallbackProps) {
    mutableDoc = await updateRevisionDocumentId<N>(mutableDoc, props, editableFieldCallbackProps);
  }

  return mutableDoc;
}

export async function notifyUsersOfPingbackMentions<N extends CollectionNameString>(runCallbackStageProperties: CreateAfterEditableCallbackProperties<N>) {
  let { props, newDoc: mutableDoc } = runCallbackStageProperties;

  const editableFieldsCallbackProps = getEditableFieldsCallbackProps(props);

  for (const editableFieldCallbackProps of editableFieldsCallbackProps) {
    mutableDoc = await notifyUsersAboutPingbackMentionsInCreate<N>(mutableDoc, props, editableFieldCallbackProps);
  }

  return mutableDoc;
}

export function uploadImagesInEditableFields<N extends CollectionNameString>(runCallbackStageProperties: NewAsyncEditableCallbackProperties<N>) {
  let { props, newDoc } = runCallbackStageProperties;
  const { context } = props;

  const editableFieldsCallbackProps = getEditableFieldsCallbackProps(props);

  for (const editableFieldCallbackProps of editableFieldsCallbackProps) {
    backgroundTask(reuploadImagesInNew(newDoc, editableFieldCallbackProps, context));
  }
}

export async function createRevisionsForEditableFields<N extends CollectionNameString>(runCallbackStageProperties: UpdateBeforeEditableCallbackProperties<N>) {
  let { props, docData } = runCallbackStageProperties;

  const editableFieldsCallbackProps = getEditableFieldsCallbackProps(props);

  for (const editableFieldCallbackProps of editableFieldsCallbackProps) {
    docData = await createUpdateRevision<N>(docData, props, editableFieldCallbackProps);
  }

  return docData;
}

export async function notifyUsersOfNewPingbackMentions<N extends CollectionNameString>(runCallbackStageProperties: UpdateAfterEditableCallbackProperties<N>) {
  let { props, newDoc } = runCallbackStageProperties;

  const editableFieldsCallbackProps = getEditableFieldsCallbackProps(props);

  for (const editableFieldCallbackProps of editableFieldsCallbackProps) {
    newDoc = await notifyUsersAboutPingbackMentionsInUpdate<N>(newDoc, props, editableFieldCallbackProps);
  }

  return newDoc;
}

// This is explicitly not an async function and internalizes the background task for two reasons:
// 1. if we end up having images to upload, that can take a while and we don't want to block submissions on that
// 2. for posts in particular, we risk recalculating the side comments cache using a stale revision and caching
// html that has non-mirrored urls in it.
export function reuploadImagesIfEditableFieldsChanged<N extends CollectionNameString>(runCallbackStageProperties: EditAsyncEditableCallbackProperties<N>) {
  let { props, newDoc } = runCallbackStageProperties;
  const { context } = props;

  const editableFieldsCallbackProps = getEditableFieldsCallbackProps(props);

  for (const editableFieldCallbackProps of editableFieldsCallbackProps) {
    backgroundTask(reuploadImagesInEdit(newDoc, props.oldDocument, editableFieldCallbackProps, context));
  }
}
