import { CallbackHook, CallbackChainHook, CallbackPropertiesBase } from './utils/callbackHooks';

type CallbackValidationErrors = Array<any>;

export interface CreateCallbackProperties<N extends CollectionNameString> extends CallbackPropertiesBase<N> {
  document: ObjectsByCollectionName[N],
  /**
   * BE CAREFUL USING THIS - IT'S NOT THE INSERTED RECORD, BUT THE DATA PASSED IN TO `createMutator`
   * Correspondingly, it won't have fields like `_id`
   */
  newDocument: ObjectsByCollectionName[N],
}

export interface UpdateCallbackProperties<N extends CollectionNameString> extends CallbackPropertiesBase<N> {
  data: Partial<ObjectsByCollectionName[N]>
  oldDocument: ObjectsByCollectionName[N]
  /**
   * @deprecated Is a "preview" of the new document. Use newDocument instead
   */
  document: ObjectsByCollectionName[N]
  /** Is a "preview" of the new document */
  newDocument: ObjectsByCollectionName[N]
}

export interface DeleteCallbackProperties<N extends CollectionNameString> extends CallbackPropertiesBase<N> {
  document: ObjectsByCollectionName[N]
}

export class CollectionMutationCallbacks<N extends CollectionNameString> {
  createValidate: CallbackChainHook<CallbackValidationErrors,[CreateCallbackProperties<N>]>
  newValidate: CallbackChainHook<DbInsertion<ObjectsByCollectionName[N]>,[DbUser|null,CallbackValidationErrors]>
  
  createBefore: CallbackChainHook<ObjectsByCollectionName[N],[CreateCallbackProperties<N>]>
  
  newSync: CallbackChainHook<ObjectsByCollectionName[N],[DbUser|null,ResolverContext]>

  createAfter: CallbackChainHook<ObjectsByCollectionName[N],[CreateCallbackProperties<N>]>
  newAfter: CallbackChainHook<ObjectsByCollectionName[N],[DbUser|null]>

  createAsync: CallbackHook<[CreateCallbackProperties<N>]>
  newAsync: CallbackHook<[ObjectsByCollectionName[N],DbUser|null,any]>

  updateValidate: CallbackChainHook<CallbackValidationErrors,[UpdateCallbackProperties<N>]>

  updateBefore: CallbackChainHook<Partial<ObjectsByCollectionName[N]>,[UpdateCallbackProperties<N>]>

  editSync: CallbackChainHook<MongoModifier<ObjectsByCollectionName[N]>,[ObjectsByCollectionName[N],DbUser|null,ObjectsByCollectionName[N]]>

  updateAfter: CallbackChainHook<ObjectsByCollectionName[N],[UpdateCallbackProperties<N>]>

  updateAsync: CallbackHook<[UpdateCallbackProperties<N>]>
  editAsync: CallbackHook<[ObjectsByCollectionName[N],ObjectsByCollectionName[N],DbUser|null,CollectionBase<N>]>

  deleteValidate: CallbackChainHook<CallbackValidationErrors,[DeleteCallbackProperties<N>]>
  deleteBefore: CallbackChainHook<ObjectsByCollectionName[N],[DeleteCallbackProperties<N>]>
  deleteAsync: CallbackHook<[DeleteCallbackProperties<N>]>

  constructor(collectionName: N) {
    this.createValidate = new CallbackChainHook<CallbackValidationErrors,[CreateCallbackProperties<N>]>(`${collectionName.toLowerCase()}.create.validate`);
    this.newValidate = new CallbackChainHook<DbInsertion<ObjectsByCollectionName[N]>,[DbUser|null,CallbackValidationErrors]>(`${collectionName.toLowerCase()}.new.validate`);
    this.createBefore = new CallbackChainHook<ObjectsByCollectionName[N],[CreateCallbackProperties<N>]>(`${collectionName.toLowerCase()}.create.before`);
    this.newSync = new CallbackChainHook<ObjectsByCollectionName[N],[DbUser|null,ResolverContext]>(`${collectionName.toLowerCase()}.new.sync`);
    this.createAfter = new CallbackChainHook<ObjectsByCollectionName[N],[CreateCallbackProperties<N>]>(`${collectionName.toLowerCase()}.create.after`);
    this.newAfter = new CallbackChainHook<ObjectsByCollectionName[N],[DbUser|null]>(`${collectionName.toLowerCase()}.new.after`);
    this.createAsync = new CallbackHook<[CreateCallbackProperties<N>]>(`${collectionName.toLowerCase()}.create.async`);
    this.newAsync = new CallbackHook<[ObjectsByCollectionName[N],DbUser|null,any]>(`${collectionName.toLowerCase()}.new.async`);

    this.updateValidate = new CallbackChainHook<CallbackValidationErrors,[UpdateCallbackProperties<N>]>(`${collectionName.toLowerCase()}.update.validate`);
    this.updateBefore = new CallbackChainHook<Partial<ObjectsByCollectionName[N]>,[UpdateCallbackProperties<N>]>(`${collectionName.toLowerCase()}.update.before`);
    this.editSync = new CallbackChainHook<MongoModifier<ObjectsByCollectionName[N]>,[ObjectsByCollectionName[N],DbUser|null,ObjectsByCollectionName[N]]>(`${collectionName.toLowerCase()}.edit.sync`);
    this.updateAfter = new CallbackChainHook<ObjectsByCollectionName[N],[UpdateCallbackProperties<N>]>(`${collectionName.toLowerCase()}.update.after`);
    this.updateAsync = new CallbackHook<[UpdateCallbackProperties<N>]>(`${collectionName.toLowerCase()}.update.async`);
    this.editAsync = new CallbackHook<[ObjectsByCollectionName[N],ObjectsByCollectionName[N],DbUser|null,CollectionBase<N>]>(`${collectionName.toLowerCase()}.edit.async`)

    this.deleteValidate = new CallbackChainHook<CallbackValidationErrors,[DeleteCallbackProperties<N>]>(`${collectionName.toLowerCase()}.delete.validate`);
    this.deleteBefore = new CallbackChainHook<ObjectsByCollectionName[N],[DeleteCallbackProperties<N>]>(`${collectionName.toLowerCase()}.delete.before`);
    this.deleteAsync = new CallbackHook<[DeleteCallbackProperties<N>]>(`${collectionName.toLowerCase()}.delete.async`);
  }
}

const collectionHooks: any = {};

export const getCollectionHooks = <N extends CollectionNameString>(collectionName: N): CollectionMutationCallbacks<N> =>  {
  if (!(collectionName in collectionHooks)) {
    collectionHooks[collectionName] = new CollectionMutationCallbacks(collectionName);
  }
  return collectionHooks[collectionName];
}
