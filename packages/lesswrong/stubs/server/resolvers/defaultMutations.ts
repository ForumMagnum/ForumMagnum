
export interface MutationOptions<T extends DbObject> {
  newCheck?: (user: DbUser|null, document: T|null) => Promise<boolean>|boolean,
  editCheck?: (user: DbUser|null, document: T|null) => Promise<boolean>|boolean,
  removeCheck?: (user: DbUser|null, document: T|null) => Promise<boolean>|boolean,
  create?: boolean,
  update?: boolean,
  upsert?: boolean,
  delete?: boolean,
}

export function getDefaultMutations<N extends CollectionNameString>(collectionName: N, options?: MutationOptions<ObjectsByCollectionName[N]>) {
  type T = ObjectsByCollectionName[N];
  const mutations: DefaultMutations<T> = {};
  return mutations;
}
