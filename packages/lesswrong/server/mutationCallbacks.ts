import { CallbackHook, CallbackChainHook } from '../lib/vulcan-lib/callbacks';
import { getCollection } from '../lib/vulcan-lib/getCollection';

type CallbackValidationErrors = Array<any>;

export interface CallbackPropertiesBase<T extends DbObject> {
  // TODO: Many of these are empirically optional, but setting them to optional
  // causes a bajillion type errors, so we will not be fixing today
  currentUser: DbUser|null
  collection: CollectionBase<T>
  context: ResolverContext
  schema: SchemaType<T>
}

export interface CreateCallbackProperties<T extends DbObject> extends CallbackPropertiesBase<T> {
  document: T
  newDocument: T
}

export interface UpdateCallbackProperties<T extends DbObject> extends CallbackPropertiesBase<T> {
  data: Partial<T>
  oldDocument: T
  /** DEPRECATED: Is a "preview" of the new document. Use newDocument instead */
  document: T
  /** Is a "preview" of the new document */
  newDocument: T
}

export interface DeleteCallbackProperties<T extends DbObject> extends CallbackPropertiesBase<T> {
  document: T
}

export class CollectionMutationCallbacks<T extends DbObject> {
  createValidate: CallbackChainHook<CallbackValidationErrors,[CreateCallbackProperties<T>]>
  newValidate: CallbackChainHook<DbInsertion<T>,[DbUser|null,CallbackValidationErrors]>
  createBefore: CallbackChainHook<T,[CreateCallbackProperties<T>]>
  newBefore: CallbackChainHook<T,[DbUser|null]>
  newSync: CallbackChainHook<T,[DbUser|null]>
  createAfter: CallbackChainHook<T,[CreateCallbackProperties<T>]>
  newAfter: CallbackChainHook<T,[DbUser|null]>
  createAsync: CallbackHook<[CreateCallbackProperties<T>]>
  newAsync: CallbackHook<[T,DbUser|null,any]>
  
  updateValidate: CallbackChainHook<CallbackValidationErrors,[UpdateCallbackProperties<T>]>
  editValidate: CallbackChainHook<MongoModifier<T>,[T,DbUser|null,CallbackValidationErrors]>
  updateBefore: CallbackChainHook<Partial<T>,[UpdateCallbackProperties<T>]>
  /** DEPRECATED: use updateBefore */
  editBefore: CallbackChainHook<MongoModifier<T>,[T,DbUser|null,T]>
  editSync: CallbackChainHook<MongoModifier<T>,[T,DbUser|null,T]>
  updateAfter: CallbackChainHook<T,[UpdateCallbackProperties<T>]>
  editAfter: CallbackChainHook<T,[T,DbUser|null]>
  updateAsync: CallbackHook<[UpdateCallbackProperties<T>]>
  editAsync: CallbackHook<[T,T,DbUser|null,CollectionBase<T>]>
  
  deleteValidate: CallbackChainHook<CallbackValidationErrors,[DeleteCallbackProperties<T>]>
  removeValidate: CallbackChainHook<T,[DbUser|null]>
  deleteBefore: CallbackChainHook<T,[DeleteCallbackProperties<T>]>
  removeBefore: CallbackChainHook<T,[DbUser|null]>
  removeSync: CallbackChainHook<T,[DbUser|null]>
  deleteAsync: CallbackHook<[DeleteCallbackProperties<T>]>
  removeAsync: CallbackHook<[T,DbUser|null,CollectionBase<T>]>
  
  constructor(collectionName: CollectionNameString) {
    const collection = getCollection(collectionName);
    const typeName = collection.options.typeName;
    
    this.createValidate = new CallbackChainHook<CallbackValidationErrors,[CreateCallbackProperties<T>]>(`${typeName.toLowerCase()}.create.validate`);
    this.newValidate = new CallbackChainHook<DbInsertion<T>,[DbUser|null,CallbackValidationErrors]>(`${collectionName.toLowerCase()}.new.validate`);
    this.createBefore = new CallbackChainHook<T,[CreateCallbackProperties<T>]>(`${typeName.toLowerCase()}.create.before`);
    this.newBefore = new CallbackChainHook<T,[DbUser|null]>(`${collectionName.toLowerCase()}.new.before`);
    this.newSync = new CallbackChainHook<T,[DbUser|null]>(`${collectionName.toLowerCase()}.new.sync`);
    this.createAfter = new CallbackChainHook<T,[CreateCallbackProperties<T>]>(`${typeName.toLowerCase()}.create.after`);
    this.newAfter = new CallbackChainHook<T,[DbUser|null]>(`${collectionName.toLowerCase()}.new.after`);
    this.createAsync = new CallbackHook<[CreateCallbackProperties<T>]>(`${typeName.toLowerCase()}.create.async`);
    this.newAsync = new CallbackHook<[T,DbUser|null,any]>(`${collectionName.toLowerCase()}.new.async`);
    
    this.updateValidate = new CallbackChainHook<CallbackValidationErrors,[UpdateCallbackProperties<T>]>(`${typeName.toLowerCase()}.update.validate`);
    this.editValidate = new CallbackChainHook<MongoModifier<T>,[T,DbUser|null,CallbackValidationErrors]>(`${collectionName.toLowerCase()}.edit.validate`)
    this.updateBefore = new CallbackChainHook<Partial<T>,[UpdateCallbackProperties<T>]>(`${typeName.toLowerCase()}.update.before`);
    this.editBefore = new CallbackChainHook<MongoModifier<T>,[T,DbUser|null,T]>(`${collectionName.toLowerCase()}.edit.before`);
    this.editSync = new CallbackChainHook<MongoModifier<T>,[T,DbUser|null,T]>(`${collectionName.toLowerCase()}.edit.sync`);
    this.updateAfter = new CallbackChainHook<T,[UpdateCallbackProperties<T>]>(`${typeName.toLowerCase()}.update.after`);
    this.editAfter = new CallbackChainHook<T,[T,DbUser|null]>(`${collectionName.toLowerCase()}.edit.after`)
    this.updateAsync = new CallbackHook<[UpdateCallbackProperties<T>]>(`${typeName.toLowerCase()}.update.async`);
    this.editAsync = new CallbackHook<[T,T,DbUser|null,CollectionBase<T>]>(`${collectionName.toLowerCase()}.edit.async`)
  
    this.deleteValidate = new CallbackChainHook<CallbackValidationErrors,[DeleteCallbackProperties<T>]>(`${typeName.toLowerCase()}.delete.validate`);
    this.removeValidate = new CallbackChainHook<T,[DbUser|null]>(`${collectionName.toLowerCase()}.remove.validate`);
    this.deleteBefore = new CallbackChainHook<T,[DeleteCallbackProperties<T>]>(`${typeName.toLowerCase()}.delete.before`);
    this.removeBefore = new CallbackChainHook<T,[DbUser|null]>(`${collectionName.toLowerCase()}.remove.before`);
    this.removeSync = new CallbackChainHook<T,[DbUser|null]>(`${collectionName.toLowerCase()}.remove.sync`);
    this.deleteAsync = new CallbackHook<[DeleteCallbackProperties<T>]>(`${typeName.toLowerCase()}.delete.async`);
    this.removeAsync = new CallbackHook<[T,DbUser|null,CollectionBase<T>]>(`${collectionName.toLowerCase()}.remove.async`);
  }
}

const collectionHooks: any = {};

export const getCollectionHooks = <N extends CollectionNameString>(collectionName: N): CollectionMutationCallbacks<ObjectsByCollectionName[N]> =>  {
  if (!(collectionName in collectionHooks)) {
    collectionHooks[collectionName] = new CollectionMutationCallbacks(collectionName);
  }
  return collectionHooks[collectionName];
}
