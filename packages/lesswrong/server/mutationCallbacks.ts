import { CallbackHook, CallbackChainHook } from './utils/callbackHooks';

export type CallbackValidationErrors = Array<any>;

interface CallbackPropertiesBase<N extends CollectionNameString> {
  // TODO: Many of these are empirically optional, but setting them to optional
  // causes a bajillion type errors, so we will not be fixing today
  currentUser: DbUser|null
  collection: CollectionBase<N>
  context: ResolverContext
  schema: SchemaType<N>
}

export interface CreateCallbackProperties<N extends CollectionNameString, D = CreateInputsByCollectionName[N]['data']> extends CallbackPropertiesBase<N> {
  document: D,
  /**
   * BE CAREFUL USING THIS - IT'S NOT THE INSERTED RECORD, BUT THE DATA PASSED IN TO `createMutator`
   * Correspondingly, it won't have fields like `_id`
   */
  newDocument: D,
}

export interface AfterCreateCallbackProperties<N extends CollectionNameString> extends CallbackPropertiesBase<N> {
  document: ObjectsByCollectionName[N],
  newDocument: ObjectsByCollectionName[N],
}

export interface UpdateCallbackProperties<N extends CollectionNameString, D extends {} = UpdateInputsByCollectionName[N]['data']> extends CallbackPropertiesBase<N> {
  data: D,
  oldDocument: ObjectsByCollectionName[N],
  /** Is a "preview" of the new document */
  newDocument: ObjectsByCollectionName[N]
}

export interface DeleteCallbackProperties<N extends CollectionNameString> extends CallbackPropertiesBase<N> {
  document: ObjectsByCollectionName[N]
}

export class CollectionMutationCallbacks<N extends CollectionNameString> {
  createValidate: CallbackChainHook<CallbackValidationErrors,[CreateCallbackProperties<N>]>
  
  createBefore: CallbackChainHook<Partial<DbInsertion<ObjectsByCollectionName[N]>>, [CreateCallbackProperties<N>]>
  newSync: CallbackChainHook<Partial<DbInsertion<ObjectsByCollectionName[N]>>, [DbUser|null,ResolverContext]>

  createAfter: CallbackChainHook<ObjectsByCollectionName[N],[AfterCreateCallbackProperties<N>]>
  newAfter: CallbackChainHook<ObjectsByCollectionName[N],[DbUser|null, AfterCreateCallbackProperties<N>]>

  createAsync: CallbackHook<[AfterCreateCallbackProperties<N>]>
  newAsync: CallbackHook<[ObjectsByCollectionName[N],DbUser|null,any,AfterCreateCallbackProperties<N>]>

  updateValidate: CallbackChainHook<CallbackValidationErrors,[UpdateCallbackProperties<N>]>

  updateBefore: CallbackChainHook<Partial<ObjectsByCollectionName[N]>,[UpdateCallbackProperties<N>]>

  editSync: CallbackChainHook<MongoModifier,[ObjectsByCollectionName[N],DbUser|null,ObjectsByCollectionName[N],UpdateCallbackProperties<N>]>

  updateAfter: CallbackChainHook<ObjectsByCollectionName[N],[UpdateCallbackProperties<N>]>

  updateAsync: CallbackHook<[UpdateCallbackProperties<N>]>
  editAsync: CallbackHook<[ObjectsByCollectionName[N],ObjectsByCollectionName[N],DbUser|null,CollectionBase<N>,UpdateCallbackProperties<N>]>

  deleteValidate: CallbackChainHook<CallbackValidationErrors,[DeleteCallbackProperties<N>]>
  deleteBefore: CallbackChainHook<ObjectsByCollectionName[N],[DeleteCallbackProperties<N>]>
  deleteAsync: CallbackHook<[DeleteCallbackProperties<N>]>

  constructor(collectionName: N) {
    const namePrefix = collectionName.toLowerCase();
    this.createValidate = new CallbackChainHook<CallbackValidationErrors,[CreateCallbackProperties<N>]>(`${namePrefix}.create.validate`);
    this.createBefore = new CallbackChainHook<DbInsertion<ObjectsByCollectionName[N]>,[CreateCallbackProperties<N>]>(`${namePrefix}.create.before`);
    this.newSync = new CallbackChainHook<DbInsertion<ObjectsByCollectionName[N]>,[DbUser|null,ResolverContext]>(`${namePrefix}.new.sync`);
    this.createAfter = new CallbackChainHook<ObjectsByCollectionName[N],[AfterCreateCallbackProperties<N>]>(`${namePrefix}.create.after`);
    this.newAfter = new CallbackChainHook<ObjectsByCollectionName[N],[DbUser|null, AfterCreateCallbackProperties<N>]>(`${namePrefix}.new.after`);
    this.createAsync = new CallbackHook<[AfterCreateCallbackProperties<N>]>(`${namePrefix}.create.async`);
    this.newAsync = new CallbackHook<[ObjectsByCollectionName[N],DbUser|null,any,AfterCreateCallbackProperties<N>]>(`${namePrefix}.new.async`);

    this.updateValidate = new CallbackChainHook<CallbackValidationErrors,[UpdateCallbackProperties<N>]>(`${namePrefix}.update.validate`);
    this.updateBefore = new CallbackChainHook<Partial<ObjectsByCollectionName[N]>,[UpdateCallbackProperties<N>]>(`${namePrefix}.update.before`);
    this.editSync = new CallbackChainHook<MongoModifier,[ObjectsByCollectionName[N],DbUser|null,ObjectsByCollectionName[N],UpdateCallbackProperties<N>]>(`${namePrefix}.edit.sync`);
    this.updateAfter = new CallbackChainHook<ObjectsByCollectionName[N],[UpdateCallbackProperties<N>]>(`${namePrefix}.update.after`);
    this.updateAsync = new CallbackHook<[UpdateCallbackProperties<N>]>(`${namePrefix}.update.async`);
    this.editAsync = new CallbackHook<[ObjectsByCollectionName[N],ObjectsByCollectionName[N],DbUser|null,CollectionBase<N>,UpdateCallbackProperties<N>]>(`${namePrefix}.edit.async`)

    this.deleteValidate = new CallbackChainHook<CallbackValidationErrors,[DeleteCallbackProperties<N>]>(`${namePrefix}.delete.validate`);
    this.deleteBefore = new CallbackChainHook<ObjectsByCollectionName[N],[DeleteCallbackProperties<N>]>(`${namePrefix}.delete.before`);
    this.deleteAsync = new CallbackHook<[DeleteCallbackProperties<N>]>(`${namePrefix}.delete.async`);
  }
}

const collectionHooks: any = {};

export const getCollectionHooks = <N extends CollectionNameString>(collectionName: N) =>  {
  if (!(collectionName in collectionHooks)) {
    collectionHooks[collectionName] = new CollectionMutationCallbacks(collectionName);
  }
  return collectionHooks[collectionName];
}
