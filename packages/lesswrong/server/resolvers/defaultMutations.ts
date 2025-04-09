export interface MutationOptions<T extends DbObject> {
  newCheck?: (user: DbUser|null, document: DbInsertion<T>|null, context: ResolverContext) => Promise<boolean>|boolean,
  editCheck?: (user: DbUser|null, document: T|null, context: ResolverContext) => Promise<boolean>|boolean,
  removeCheck?: (user: DbUser|null, document: T|null, context: ResolverContext) => Promise<boolean>|boolean,
  create?: boolean,
  update?: boolean,
  upsert?: boolean,
  delete?: boolean,
}

interface UpdateFunctionArgs<N extends CollectionNameString> {
  selector: SelectorInput;
  data: Partial<Record<keyof ObjectsByCollectionName[N], unknown>> // Partial<DbInsertion<ObjectsByCollectionName[N]>>;
}

export interface CreateFunctionOptions {
  skipValidation?: boolean;
  skipAccessFilter?: boolean;
}

export type CreateFunction<N extends CollectionNameString> = ({ data }: { data: Partial<Record<keyof ObjectsByCollectionName[N], unknown>> }, context: ResolverContext) => Promise<ObjectsByCollectionName[N]>;
export type UpdateFunction<N extends CollectionNameString> = ({ selector, data }: UpdateFunctionArgs<N>, context: ResolverContext) => Promise<ObjectsByCollectionName[N]>;

interface DefaultMutationFunctionProps<N extends CollectionNameString> {
  createFunction?: CreateFunction<N>;
  updateFunction?: UpdateFunction<N>;
}

type DefaultMutationFunctionReturn<N extends CollectionNameString, I extends DefaultMutationFunctionProps<N>> = {
  [k in keyof I]: I[k] extends (...args: AnyBecauseHard[]) => Promise<null>
    ? never
    : I[k] extends CreateFunction<N>
      ? I[k]
      : I[k] extends UpdateFunction<N>
        ? I[k]
        : never;
}

export function getDefaultMutationFunctions<N extends CollectionNameString, I extends DefaultMutationFunctionProps<N>>(collectionName: N, props: I): DefaultMutationFunctionReturn<N, I> {
  return {
    ...(props.createFunction ? { createFunction: props.createFunction } : {}),
    ...(props.updateFunction ? { updateFunction: props.updateFunction } : {}),
  } as DefaultMutationFunctionReturn<N, I>;
}
