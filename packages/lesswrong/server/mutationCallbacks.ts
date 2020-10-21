import { CallbackHook } from '../lib/vulcan-lib/callbacks';

interface CreateCallbackProperties {
  data: any
  currentUser: DbUser|null|undefined
  collection: any
  context: ResolverContext
  document: any
  newDocument: any
  schema: any
}

class CollectionMutationCallbacks<T extends DbObject> {
  createBefore: CallbackHook<T,[CreateCallbackProperties]>
  
  constructor(collectionName: string) {
    const typeName = collectionName;
    this.createBefore = new CallbackHook<T,[CreateCallbackProperties]>(`${typeName.toLowerCase()}.create.before`);
  }
}

const collectionHooks: any = {};

export const getCollectionHooks = <N extends CollectionNameString>(collectionName: N): CollectionMutationCallbacks<ObjectsByCollectionName[N]> =>  {
  if (!(collectionName in collectionHooks)) {
    collectionHooks[collectionName] = new CollectionMutationCallbacks(collectionName);
  }
  return collectionHooks[collectionName];
}
