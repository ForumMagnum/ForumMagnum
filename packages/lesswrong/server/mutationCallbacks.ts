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
