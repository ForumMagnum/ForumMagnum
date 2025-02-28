import { cascadeSoftDeleteToTagRels, reexportProfileTagUsersToElastic, taggedPostNewNotifications, updateParentTagSubTagIds, validateTagCreate, validateTagRelCreate, validateTagUpdate, voteForTagWhenCreated } from "../callbacks/tagCallbackFunctions";
import { CallbackValidationErrors, CreateCallbackProperties, AfterCreateCallbackProperties, UpdateCallbackProperties, getCollectionHooks, DeleteCallbackProperties } from "../mutationCallbacks";

async function tagCreateValidate(validationErrors: CallbackValidationErrors, props: CreateCallbackProperties<'Tags'>): Promise<CallbackValidationErrors> {
  await validateTagCreate(validationErrors, props);

  return validationErrors;
}

async function tagCreateBefore(doc: DbInsertion<DbTag>, props: CreateCallbackProperties<'Tags'>): Promise<DbInsertion<DbTag>> {
  // slugCreateBeforeCallbackFunction-Tags
  // 3x editorSerializationBeforeCreate

  return doc;
}

async function tagNewSync(tag: DbTag, currentUser: DbUser | null, context: ResolverContext): Promise<DbTag> {
  return tag;
}

async function tagCreateAfter(tag: DbTag, props: AfterCreateCallbackProperties<'Tags'>): Promise<DbTag> {
  // 3x (editorSerializationAfterCreate, notifyUsersAboutMentions)

  return tag;
}

async function tagNewAfter(tag: DbTag, currentUser: DbUser | null, props: AfterCreateCallbackProperties<'Tags'>): Promise<DbTag> {
  return tag;
}

async function tagCreateAsync(props: AfterCreateCallbackProperties<'Tags'>) {
  // elasticSyncDocument
}

async function tagNewAsync(tag: DbTag, currentUser: DbUser | null, collection: CollectionBase<'Tags'>, props: AfterCreateCallbackProperties<'Tags'>) {
  // 1x convertImagesInObject
}

async function tagUpdateValidate(validationErrors: CallbackValidationErrors, props: UpdateCallbackProperties<'Tags'>): Promise<CallbackValidationErrors> {
  await validateTagUpdate(validationErrors, props);

  return validationErrors;
}

async function tagUpdateBefore(tag: Partial<DbTag>, props: UpdateCallbackProperties<'Tags'>): Promise<Partial<DbTag>> {
  // slugUpdateBeforeCallbackFunction-Tags
  // 3x editorSerializationEdit

  return tag;
}

async function tagEditSync(modifier: MongoModifier<DbTag>, tag: DbTag, _0: DbUser | null, _1: DbTag, props: UpdateCallbackProperties<'Tags'>): Promise<MongoModifier<DbTag>> {
  return modifier;
}

async function tagUpdateAfter(tag: DbTag, props: UpdateCallbackProperties<'Tags'>): Promise<DbTag> {
  tag = await cascadeSoftDeleteToTagRels(tag, props);
  tag = await updateParentTagSubTagIds(tag, props);
  tag = await reexportProfileTagUsersToElastic(tag, props);

  // 3x notifyUsersAboutMentions

  return tag;
}

async function tagUpdateAsync(props: UpdateCallbackProperties<'Tags'>) {
}

async function tagEditAsync(tag: DbTag, oldTag: DbTag, currentUser: DbUser | null, collection: CollectionBase<'Tags'>, props: UpdateCallbackProperties<'Tags'>) {
  // 3x convertImagesInObject
  // elasticSyncDocument
}

getCollectionHooks('Tags').createValidate.add(tagCreateValidate);
getCollectionHooks('Tags').createBefore.add(tagCreateBefore);
getCollectionHooks('Tags').newSync.add(tagNewSync);
getCollectionHooks('Tags').createAfter.add(tagCreateAfter);
getCollectionHooks('Tags').newAfter.add(tagNewAfter);
getCollectionHooks('Tags').createAsync.add(tagCreateAsync);
getCollectionHooks('Tags').newAsync.add(tagNewAsync);

getCollectionHooks('Tags').updateValidate.add(tagUpdateValidate);
getCollectionHooks('Tags').updateBefore.add(tagUpdateBefore);
getCollectionHooks('Tags').editSync.add(tagEditSync);
getCollectionHooks('Tags').updateAfter.add(tagUpdateAfter);
getCollectionHooks('Tags').updateAsync.add(tagUpdateAsync);
getCollectionHooks('Tags').editAsync.add(tagEditAsync);

async function tagRelCreateBefore(newDocument: DbInsertion<DbTagRel>, props: CreateCallbackProperties<'TagRels'>): Promise<DbInsertion<DbTagRel>> {
  await validateTagRelCreate(newDocument, props);

  return newDocument;
}

async function tagRelCreateAfter(tagRel: DbTagRel, props: AfterCreateCallbackProperties<'TagRels'>): Promise<DbTagRel> {
  // 1x countOfReferenceCallbacks

  return tagRel;
}

async function tagRelNewAfter(tagRel: DbTagRel, currentUser: DbUser | null, props: AfterCreateCallbackProperties<'TagRels'>): Promise<DbTagRel> {
  tagRel = await voteForTagWhenCreated(tagRel, props);

  return tagRel;
}

async function tagRelNewAsync(tagRel: DbTagRel, currentUser: DbUser | null, collection: CollectionBase<'TagRels'>, props: AfterCreateCallbackProperties<'TagRels'>) {
  await taggedPostNewNotifications(tagRel, props);
}

async function tagRelUpdateAfter(tagRel: DbTagRel, props: UpdateCallbackProperties<'TagRels'>): Promise<DbTagRel> {
  // 1x countOfReferenceCallbacks

  return tagRel;
}

async function tagRelDeleteAsync(props: DeleteCallbackProperties<'TagRels'>) {
  // 1x countOfReferenceCallbacks
}

getCollectionHooks('TagRels').createBefore.add(tagRelCreateBefore);
getCollectionHooks('TagRels').createAfter.add(tagRelCreateAfter);
getCollectionHooks('TagRels').newAfter.add(tagRelNewAfter);
getCollectionHooks('TagRels').newAsync.add(tagRelNewAsync);

getCollectionHooks('TagRels').updateAfter.add(tagRelUpdateAfter);

getCollectionHooks('TagRels').deleteAsync.add(tagRelDeleteAsync);
