import { getVoteableSchemaFields } from "../make_voteable";

class ClientCollection<
  N extends CollectionNameString = CollectionNameString
> implements CollectionBase<N> {
  collectionName: N;
  tableName: string;
  postProcess?: (data: ObjectsByCollectionName[N]) => ObjectsByCollectionName[N];
  typeName: string;
  options: CollectionOptions<N>;
  _schemaFields: SchemaType<N>;
  _simpleSchema: any = null;
  checkAccess: CheckAccessFunction<ObjectsByCollectionName[N]>;
  private voteable = false;

  constructor(options: CollectionOptions<N>) {
    this.collectionName = options.collectionName;
    this.typeName = options.typeName;
    this.tableName = options.dbCollectionName ?? options.collectionName.toLowerCase();
    this.options = options;

    const votingFields: SchemaType<N> = options.voteable
      ? getVoteableSchemaFields(options.collectionName as N&VoteableCollectionName, options.voteable) as SchemaType<N>
      : {};
    this._schemaFields = {
      ...options.schema,
      ...votingFields,
    };
  }

  isConnected() {
    return false;
  }

  isVoteable(): this is ClientCollection<VoteableCollectionName> {
    return !!this.options.voteable;
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

  getIndexes(): never {
    throw new Error("ClientCollection: getIndexes called on client");
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
}

export default ClientCollection;
