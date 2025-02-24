class ClientCollection<
  N extends CollectionNameString = CollectionNameString
> implements CollectionBase<N> {
  collectionName: N;
  tableName: string;
  defaultView: ViewFunction<N> | undefined;
  views: Record<string, ViewFunction<N>> = {};
  postProcess?: (data: ObjectsByCollectionName[N]) => ObjectsByCollectionName[N];
  typeName: string;
  options: CollectionOptions<N>;
  _schemaFields: SchemaType<N>;
  _simpleSchema: any;
  checkAccess: CheckAccessFunction<ObjectsByCollectionName[N]>;
  private voteable = false;

  constructor(options: CollectionOptions<N>) {
    this.collectionName = options.collectionName;
    this.typeName = options.typeName;
    this.tableName = options.dbCollectionName ?? options.collectionName.toLowerCase();
    this.options = options;

    this._schemaFields = options.schema;
    this._simpleSchema = null;
  }

  isConnected() {
    return false;
  }

  isVoteable(): this is ClientCollection<VoteableCollectionName> {
    return this.voteable;
  }

  makeVoteable() {
    this.voteable = true;
  }

  hasSlug(): this is ClientCollection<CollectionNameWithSlug> {
    return !!this._schemaFields.slug;
  }

  private executeQuery(): never {
    throw new Error("ClientCollection: Executed SQL on the client");
  }

  getTable() {
    return this.executeQuery();
  }

  rawCollection() {
    return this.executeQuery();
  }

  find() {
    return this.executeQuery();
  }

  findOne() {
    return this.executeQuery();
  }

  findOneArbitrary() {
    return this.executeQuery();
  }

  rawUpdateOne() {
    return this.executeQuery();
  }

  rawUpdateMany() {
    return this.executeQuery();
  }

  rawRemove() {
    return this.executeQuery();
  }

  rawInsert() {
    return this.executeQuery();
  }

  aggregate() {
    return this.executeQuery();
  }

  _ensureIndex() {
    return this.executeQuery();
  }

  addDefaultView(view: ViewFunction<N>) {
    this.defaultView = view;
  }

  addView(viewName: string, view: ViewFunction<N>) {
    this.views[viewName] = view;
  }
}

export default ClientCollection;
