import type { GraphQLScalarType } from '@apollo/client/node_modules/graphql';
import type { SimpleSchema } from 'simpl-schema';
import type { permissionGroups } from "../permissions";
import type { EditableFieldCallbackOptions } from '../editor/makeEditableOptions';
import type { UsersCurrent } from '../generated/gql-codegen/graphql';

/// This file is wrapped in 'declare global' because it's an ambient declaration
/// file (meaning types in this file can be used without being imported).
declare global {

type PermissionGroups = typeof permissionGroups[number];

type SingleFieldCreatePermission = PermissionGroups | ((user: DbUser|UsersCurrent|null) => boolean);
type FieldCreatePermissions = SingleFieldCreatePermission|Array<SingleFieldCreatePermission>
type SingleFieldPermissions = PermissionGroups | ((user: DbUser|UsersCurrent|null, object: any) => boolean)
type FieldPermissions = SingleFieldPermissions|Array<SingleFieldPermissions>

interface CollectionFieldPermissions {
  canRead?: FieldPermissions,
  canUpdate?: FieldPermissions,
  canCreate?: FieldCreatePermissions,
}

type FieldName<N extends CollectionNameString> = (keyof ObjectsByCollectionName[N] & string) | '*';

type SqlFieldFunction<N extends CollectionNameString> = (fieldName: FieldName<N>) => string;

type SqlJoinType = "inner" | "full" | "left" | "right";

type SqlJoinBase<N extends CollectionNameString> = {
  table: N,
  type?: SqlJoinType,
  on: Partial<Record<FieldName<N>, string>> | ((field: SqlFieldFunction<N>) => string),
}

type SqlResolverJoin<N extends CollectionNameString> = SqlJoinBase<N> & {
  /**
   * By default, the `table` value in `SqlJoinBase` must be a table associated
   * with a collection, and when this is the case we get type safety for the
   * values in `on` and for the `field` argument to `resolver`.
   * Setting `isNonCollectionJoin` to true allows us to join on anything that
   * isn't a collection (like a custom table or a view for instance) at the
   * expense of type-safety as we don't have schemas for these objects so
   * everything just becomes strings.
   */
  isNonCollectionJoin?: false,
  resolver: (field: SqlFieldFunction<N>) => string,
}

type SqlNonCollectionJoinBase = {
  table: string,
  type?: SqlJoinType,
  on: Record<string, string> | ((field: (fieldName: string) => string) => string),
}

type SqlNonCollectionJoin = SqlNonCollectionJoinBase & {
  isNonCollectionJoin: true,
  resolver: (field: (fieldName: string) => string) => string,
}

type SqlJoinFunction = <N extends CollectionNameString>(
  args: SqlResolverJoin<N> | SqlNonCollectionJoin,
) => string;

type SqlJoinSpec<N extends CollectionNameString = CollectionNameString> =
  (SqlJoinBase<N> | SqlNonCollectionJoinBase) & {
    prefix: string,
  };

type SqlResolverArgs<N extends CollectionNameString> = {
  field: SqlFieldFunction<N>,
  currentUserField: SqlFieldFunction<'Users'>,
  join: SqlJoinFunction,
  arg: (value: unknown) => string,
  resolverArg: (name: string) => string,
}

type SqlResolver<N extends CollectionNameString> = (args: SqlResolverArgs<N>) => string;

type SqlPostProcess<N extends CollectionNameString> = (
  /** The value returned by the sql resolver */
  value: AnyBecauseHard,
  /** The entire database object (complete with sql resolver fields) */
  root: ObjectsByCollectionName[N],
  context: ResolverContext,
) => AnyBecauseHard;

interface CountOfReferenceOptions {
  foreignCollectionName: CollectionNameString
  foreignFieldName: string
  filterFn: (obj: AnyBecauseHard) => boolean
  resyncElastic: boolean
}

interface SlugCallbackOptions<N extends CollectionNameString> {
  /**
   * If set, check for collisions not just within the same collision, but also
   * within a provided list of other collections.
   */
  collectionsToAvoidCollisionsWith: CollectionNameWithSlug[],

  /**
   * Returns the title that will be used to generate slugs. (This does not have
   * to already be slugified.)
   */
  getTitle: (obj: ObjectsByCollectionName[N] | CreateInputsByCollectionName[N]['data'] | UpdateInputsByCollectionName[N]['data']) => string,
  
  /**
   * How to handle it when a newly created document's slug, or the new slug in
   * a document whose slug is being edited, collides with the slug on an
   * existing document.
   *   newDocumentGetsSuffix: Add a suffix to the slug of the new document
   *   rejectNewDocument: Block the creation/edit of the new document that
   *     had a colliding slug
   *   rejectIfExplicit: If the colliding slug was inferred from a change to
   *     the title, deconflict it with a suffix. If the slug was edited
   *     directly, however, reject the edit.
   */
  onCollision: "newDocumentGetsSuffix"|"rejectNewDocument"|"rejectIfExplicit",

  /**
   * If true, adds a field `oldSlugs` and automatically adds to it when slugs
   * change.
   */
  includesOldSlugs: boolean,
}

type DatabaseBaseType = `VARCHAR(${number})` | 'TEXT' | 'BOOL' | 'DOUBLE PRECISION' | 'INTEGER' | 'JSONB' | 'TIMESTAMPTZ' | 'VECTOR(1536)';

interface DatabaseFieldSpecification<N extends CollectionNameString> {
  type: DatabaseBaseType | `${DatabaseBaseType}[]`,
  defaultValue?: any,
  typescriptType?: string,
  denormalized?: boolean, 
  canAutoDenormalize?: boolean,
  canAutofillDefault?: boolean,
  needsUpdate?: (doc: Partial<ObjectsByCollectionName[N]>) => boolean,
  getValue?: (doc: ObjectsByCollectionName[N], context: ResolverContext) => any,
  foreignKey?: CollectionNameString | { collection: CollectionNameString, field: string },
  logChanges?: boolean,
  nullable?: boolean,
}

interface GraphQLWriteableFieldSpecification<N extends CollectionNameString> {
  inputType?: string,
  canRead: FieldPermissions,
  canUpdate?: FieldPermissions,
  canCreate?: FieldCreatePermissions,
  /** @deprecated Prefer to avoid using onCreate callbacks on fields for new collections. */
  onCreate?: (args: {
    currentUser: DbUser|null,
    collection: CollectionBase<N>,
    context: ResolverContext,
    document: CreateInputsByCollectionName[N]['data'],
    newDocument: CreateInputsByCollectionName[N]['data'],
    fieldName: string
  }) => any,
  /** @deprecated Prefer to avoid using onCreate callbacks on fields for new collections. */
  onUpdate?: (args: {
    data: UpdateInputsByCollectionName[N]['data'],
    oldDocument: ObjectsByCollectionName[N],
    newDocument: ObjectsByCollectionName[N],
    currentUser: DbUser|null,
    collection: CollectionBase<N>,
    context: ResolverContext,
    fieldName: string
    modifier: MongoModifier
  }) => any,
  countOfReferences?: CountOfReferenceOptions;
  editableFieldOptions?: EditableFieldCallbackOptions,
  slugCallbackOptions?: SlugCallbackOptions<N>;
  resolver?: (root: ObjectsByCollectionName[N], args: any, context: ResolverContext) => any,

  arguments?: string,
  sqlResolver?: SqlResolver<N>,
  sqlPostProcess?: undefined,
}

interface GraphQLResolverOnlyFieldSpecification<N extends CollectionNameString> {
  canRead: FieldPermissions,
  canUpdate?: undefined,
  canCreate?: undefined,
  arguments?: string|null,
  resolver: (root: ObjectsByCollectionName[N], args: any, context: ResolverContext) => any,
  sqlResolver?: SqlResolver<N>,
  /**
   * `sqlPostProcess` is run on the result of the database call, in addition
   * to the `sqlResolver`. It should return the value of this `field`, generally
   * by performing some operation on the value returned by the `sqlResolver`.
   * Most of the time this is an anti-pattern which should be avoided, but
   * sometimes it's unavoidable.
   */
  sqlPostProcess?: SqlPostProcess<N>,
}

type NotAGraphQLFieldSpecification = Record<string, never>;

interface GraphQLBaseFieldSpecification {
  outputType: string | GraphQLScalarType,
  typescriptType?: string,
  validation?: {
    optional?: boolean,
    simpleSchema?: SimpleSchema | [SimpleSchema],
    regEx?: any,
    allowedValues?: string[],
    blackbox?: boolean,
  },
  // This is a dumb hack to enable the performance optimization of the `PostSideComments` fragment.
  // We need to include some SideCommentCache fields in the executable schema even if they don't end up served to the client
  // because they need to live on that fragment (for the optimization), and if they aren't in the executable schema then 
  // the server barfs when getting a query with a fragment that includes those fields (even though it'll never get anything back for them).
  forceIncludeInExecutableSchema?: boolean,
}

type GraphQLFieldSpecification<N extends CollectionNameString> = GraphQLBaseFieldSpecification & (
  | GraphQLWriteableFieldSpecification<N>
  | GraphQLResolverOnlyFieldSpecification<N>
  | NotAGraphQLFieldSpecification
);

interface CollectionFieldSpecification<N extends CollectionNameString> {
  database?: DatabaseFieldSpecification<N>,
  graphql?: GraphQLFieldSpecification<N>,
}

type DerivedSimpleSchemaFieldType = {
  optional: boolean,
  label: string,
  blackbox?: boolean,
  nullable?: boolean,
  typescriptType?: string,
  type: {
    singleType: Function | string | SimpleSchema,
    definitions: Array<{
      type: SimpleSchemaType<CollectionNameString>,
      allowedValues: string[]
    }>
  },
};

type DerivedSimpleSchemaType<T extends Partial<Record<string, any>>> = {
  [k in keyof T]: DerivedSimpleSchemaFieldType
};

type SchemaType<N extends CollectionNameString> = Record<string, CollectionFieldSpecification<N>>;
type SimpleSchemaType<N extends CollectionNameString> = SimpleSchema & { _schema: DerivedSimpleSchemaType<SchemaType<N>> };

}
