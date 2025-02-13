import type { GraphQLScalarType } from 'graphql';
import type { SimpleSchema } from 'simpl-schema';
import { formProperties } from '../vulcan-forms/schema_utils';
import type { SmartFormProps } from '../../components/vulcan-forms/propTypes';
import { permissionGroups } from "../permissions";
import type { FormGroupLayoutProps } from '../../components/form-components/FormGroupLayout';

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

type FormInputType = 'text' | 'number' | 'url' | 'email' | 'textarea' | 'checkbox' | 'checkboxgroup' | 'radiogroup' | 'select' | 'datetime' | 'date' | keyof ComponentTypes;

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
  // See: packages/lesswrong/components/vulcan-forms/FormComponent.tsx
  input?: FormInputType,
  control?: FormInputType,
  placeholder?: string,
  hidden?: MaybeFunction<boolean,SmartFormProps<N>>,
  group?: FormGroupType<N>,
  inputType?: any,
  
  // Field mutation callbacks, invoked from Vulcan mutators. Notes:
  //  * The "document" field in onUpdate is deprecated due to an earlier mixup
  //    (breaking change) affecting whether it means oldDocument or newDocument
  //  * Return type of these callbacks is not enforced because we don't have the
  //    field's type in a usable format here. onCreate and onUpdate should all
  //    return a new value for the field, EXCEPT that if they return undefined
  //    the field value is left unchanged.
  //
  onCreate?: (args: {
    data: DbInsertion<ObjectsByCollectionName[N]>,
    currentUser: DbUser|null,
    collection: CollectionBase<N>,
    context: ResolverContext,
    document: ObjectsByCollectionName[N],
    newDocument: ObjectsByCollectionName[N],
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

  countOfReferences?: {
    foreignCollectionName: CollectionNameString
    foreignFieldName: string
    filterFn?: (obj: AnyBecauseHard) => boolean
    resyncElastic: boolean
  }
}

/** Field specification for a Form field, created from the collection schema */
type FormField<N extends CollectionNameString> = Pick<
  CollectionFieldSpecification<N>,
  typeof formProperties[number]
> & {
  document: any
  name: string
  datatype: any
  layout: string
  input: CollectionFieldSpecification<N>["input"] | CollectionFieldSpecification<N>["control"]
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
  layoutComponent?: ComponentWithProps<FormGroupLayoutProps>,
  layoutComponentProps?: Partial<FormGroupLayoutProps>,
  fields?: FormField<N>[]
}

// Using FormGroupType as part of the props of a function causes a circular reference (because ComponentWithProps<T>
// needs to know the prop types of all registered components), omit `layoutComponent` to fix this
type FormGroupSafeType<N extends CollectionNameString> = Omit<FormGroupType<N>, "layoutComponent"> & {
  layoutComponent?: string;
};

type SchemaType<N extends CollectionNameString> = Record<string, CollectionFieldSpecification<N>>;
type SimpleSchemaType<N extends CollectionNameString> = SimpleSchema & {_schema: SchemaType<N>};

}
