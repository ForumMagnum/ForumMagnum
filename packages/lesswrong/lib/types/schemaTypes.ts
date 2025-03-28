import type { GraphQLScalarType } from 'graphql';
import type { SimpleSchema } from 'simpl-schema';
import type { formProperties } from '../vulcan-forms/schema_utils';
import type { SmartFormProps } from '../../components/vulcan-forms/propTypes';
import type { permissionGroups } from "../permissions";
import type { FormGroupLayoutProps } from '../../components/form-components/FormGroupLayout';
import type { EditableFieldCallbackOptions, EditableFieldClientOptions, EditableFieldOptions } from '../editor/makeEditableOptions';

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

type FormInputBuiltinName = 'text' | 'number' | 'checkbox' | 'checkboxgroup' | 'radiogroup' | 'select' | 'datetime' | 'date';
type FormInputType = FormInputBuiltinName | keyof ComponentTypes;

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

type CollectionFieldResolveAs<N extends CollectionNameString> = {
  type: string | GraphQLScalarType,
  description?: string,
  fieldName?: string,
  addOriginalField?: boolean,
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

interface CountOfReferenceOptions {
  foreignCollectionName: CollectionNameString
  foreignFieldName: string
  filterFn: (obj: AnyBecauseHard) => boolean
  resyncElastic: boolean
}

interface SlugCallbackOptions<N extends CollectionNameString> {
  /**
   * The collection to add slug fields to.
   */
  // collection: CollectionBase<CollectionNameString>,

  /**
   * If set, check for collisions not just within the same collision, but also
   * within a provided list of other collections.
   */
  collectionsToAvoidCollisionsWith: CollectionNameWithSlug[],

  /**
   * Returns the title that will be used to generate slugs. (This does not have
   * to already be slugified.)
   */
  getTitle: (obj: ObjectsByCollectionName[N] | Partial<DbInsertion<ObjectsByCollectionName[N]>>) => string,
  
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
  onCreate?: (args: {
    currentUser: DbUser|null,
    collection: CollectionBase<N>,
    context: ResolverContext,
    document: Partial<DbInsertion<ObjectsByCollectionName[N]>>,
    newDocument: Partial<DbInsertion<ObjectsByCollectionName[N]>>,
    fieldName: string
  }) => any, 
  onUpdate?: (args: {
    data: Partial<DbInsertion<ObjectsByCollectionName[N]>>,
    oldDocument: ObjectsByCollectionName[N],
    newDocument: ObjectsByCollectionName[N] & Partial<DbInsertion<ObjectsByCollectionName[N]>>,
    currentUser: DbUser|null,
    collection: CollectionBase<N>,
    context: ResolverContext,
    fieldName: string
    modifier: MongoModifier<ObjectsByCollectionName[N]>
  }) => any,
  onDelete?: (args: {document: ObjectsByCollectionName[N], currentUser: DbUser|null, collection: CollectionBase<N>, context: ResolverContext}) => Promise<void>,
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

interface FormFieldSpecification<N extends CollectionNameString> {
  description?: string,
  min?: number,
  max?: number,
  minCount?: number,
  maxCount?: number,
  options?: (props: SmartFormProps<N>) => any,
  form?: Record<string, string | number | boolean | Record<string, any> | ((props: SmartFormProps<N>) => any) | undefined>,
  beforeComponent?: keyof ComponentTypes,
  afterComponent?: keyof ComponentTypes,
  order?: number,
  label?: string,
  tooltip?: string,
  control?: FormInputType,
  placeholder?: string,
  hidden?: MaybeFunction<boolean,SmartFormProps<N>>,
  group?: () => FormGroupType<N>,
  editableFieldOptions?: EditableFieldClientOptions,
  canRead?: FieldPermissions,
  canUpdate?: FieldPermissions,
  canCreate?: FieldCreatePermissions,
}

interface NewCollectionFieldSpecification<N extends CollectionNameString> {
  database?: DatabaseFieldSpecification<N>,
  graphql?: GraphQLFieldSpecification<N>,
  form?: FormFieldSpecification<N>,
}

interface CollectionFieldSpecification<N extends CollectionNameString> extends CollectionFieldPermissions {
  type?: any,
  description?: string,
  /**
   * Whether this field must be included in create and update
   * mutations (separate from whether it is allowed to be null)
   */
  optional?: boolean,
  defaultValue?: any,
  graphQLType?: string,
  typescriptType?: string,
  /** Use the following information in the GraphQL schema and at query-time to
   * calculate a response */
  resolveAs?: CollectionFieldResolveAs<N>,
  blackbox?: boolean,
  denormalized?: boolean,
  canAutoDenormalize?: boolean,
  canAutofillDefault?: boolean,
  needsUpdate?: (doc: Partial<ObjectsByCollectionName[N]>) => boolean,
  getValue?: (doc: ObjectsByCollectionName[N], context: ResolverContext) => any,
  foreignKey?: any,
  logChanges?: boolean,
  /**
   * Whether this field can be null (enforced at the database level)
   */
  nullable?: boolean,
  
  min?: number,
  max?: number,
  regEx?: any,
  minCount?: number,
  /** NOTE: not in use or tested as of 2022-05 */
  maxCount?: number,
  options?: (props: SmartFormProps<N>) => any,
  allowedValues?: string[],
  vectorSize?: number,
  
  /**
   * Custom props that will be passed to the input component. Can pass in
   * values or functions. All functions will be called before being passed into
   * the input component. Example:
   *
   * {
   *   emphasis: 'bold',
   *   defaultValue: () => new Date(),
   * }
   *
   * Note that if you want to put a component as one of the input values (you're
   * doing something crazy aren't you), components are functions and so would be
   * called. To get your intended behavior, wrap it in a callback:
   *
   * {
   *   decorativeComponent: () => MyDecorativeComponent
   * }
   *
   * This used to have a synonym `inputProperties` (a legacy of Vulcan's mass-renaming).
   */
  form?: Record<string, string | number | boolean | Record<string, any> | ((props: SmartFormProps<N>) => any) | undefined>,
  
  beforeComponent?: keyof ComponentTypes,
  /** NOTE: not in use or tested as of 2022-05 */
  afterComponent?: keyof ComponentTypes,
  order?: number,
  label?: string,
  tooltip?: string,
  control?: FormInputType,
  placeholder?: string,
  hidden?: MaybeFunction<boolean,SmartFormProps<N>>,
  group?: () => FormGroupType<N>,
  
  // Field mutation callbacks, invoked from Vulcan mutators. Notes:
  //  * The "document" field in onUpdate is deprecated due to an earlier mixup
  //    (breaking change) affecting whether it means oldDocument or newDocument
  //  * Return type of these callbacks is not enforced because we don't have the
  //    field's type in a usable format here. onCreate and onUpdate should all
  //    return a new value for the field, EXCEPT that if they return undefined
  //    the field value is left unchanged.
  //
  onCreate?: (args: {
    currentUser: DbUser|null,
    collection: CollectionBase<N>,
    context: ResolverContext,
    document: Partial<DbInsertion<ObjectsByCollectionName[N]>>,
    newDocument: Partial<DbInsertion<ObjectsByCollectionName[N]>>,
    fieldName: string
  }) => any,
  onUpdate?: (args: {
    data: Partial<ObjectsByCollectionName[N]>,
    oldDocument: ObjectsByCollectionName[N],
    newDocument: ObjectsByCollectionName[N],
    document: ObjectsByCollectionName[N],
    currentUser: DbUser|null,
    collection: CollectionBase<N>,
    context: ResolverContext,
    fieldName: string
    modifier: MongoModifier<ObjectsByCollectionName[N]>
  }) => any,
  onDelete?: (args: {document: ObjectsByCollectionName[N], currentUser: DbUser|null, collection: CollectionBase<N>, context: ResolverContext}) => Promise<void>,

  countOfReferences?: CountOfReferenceOptions;
  editableFieldOptions?: EditableFieldOptions;
  slugCallbackOptions?: SlugCallbackOptions<N>;
}

/** Field specification for a Form field, created from the collection schema */
type FormField<N extends CollectionNameString> = Pick<
  FormFieldSpecification<N> & Exclude<GraphQLBaseFieldSpecification['validation'], undefined> & Pick<DatabaseFieldSpecification<N>, 'defaultValue'>,
  typeof formProperties[number]
> & {
  document: any
  name: string
  datatype: any
  layout: string
  input: FormInputType
  label: string
  help: string
  path: string
  parentFieldName?: string
  disabled?: boolean
  arrayField: any
  arrayFieldSchema: any
  nestedInput: any
  nestedSchema: any
  nestedFields: any
}

type FormGroupType<N extends CollectionNameString> = {
  name: string,
  order: number,
  label?: string,
  startCollapsed?: boolean,
  helpText?: string,
  hideHeader?: boolean,
  //layoutComponent?: ComponentWithProps<FormGroupLayoutProps>,
  layoutComponent?: keyof ComponentTypes
  layoutComponentProps?: Partial<FormGroupLayoutProps>,
  fields?: FormField<N>[]
}

// Using FormGroupType as part of the props of a function causes a circular reference (because ComponentWithProps<T>
// needs to know the prop types of all registered components), omit `layoutComponent` to fix this
type FormGroupSafeType<N extends CollectionNameString> = Omit<FormGroupType<N>, "layoutComponent"> & {
  layoutComponent?: string;
};

type SchemaType<N extends CollectionNameString> = Record<string, CollectionFieldSpecification<N>>;
type OldSimpleSchemaType<N extends CollectionNameString> = SimpleSchema & {_schema: SchemaType<N>};

type DerivedSimpleSchemaFieldType = {
  optional: boolean,
  label: string,
  blackbox?: boolean,
  nullable?: boolean,
  typescriptType?: string,
  type: {
    singleType: Function | string | SimpleSchema,
    definitions: Array<{
      type: NewSimpleSchemaType<CollectionNameString>,
      allowedValues: string[]
    }>
  },
} & FormFieldSpecification<CollectionNameString>;

type DerivedSimpleSchemaType<T extends Partial<Record<string, any>>> = {
  [k in keyof T]: DerivedSimpleSchemaFieldType
};

type NewSchemaType<N extends CollectionNameString> = Record<string, NewCollectionFieldSpecification<N>>;
type NewSimpleSchemaType<N extends CollectionNameString> = SimpleSchema & { _schema: DerivedSimpleSchemaType<NewSchemaType<N>> };

}
