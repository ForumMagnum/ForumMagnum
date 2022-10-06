import type { GraphQLScalarType } from 'graphql';
import type { SimpleSchema } from 'simpl-schema';

/// This file is wrapped in 'declare global' because it's an ambient declaration
/// file (meaning types in this file can be used without being imported).
declare global {

// TODO: This should probably be defined in some central permissions file
type PermissionGroups = 'guests' |
  'members' |
  'admins' |
  'sunshineRegiment' |
  'alignmentForumAdmins' |
  'alignmentForum' |
  'alignmentVoters' |
  'podcasters' |
  'canBypassPostRateLimit' |
  'trustLevel1' |
  'canModeratePersonal';

type SingleFieldCreatePermission = PermissionGroups | ((user: DbUser|UsersCurrent|null)=>boolean);
type FieldCreatePermissions = SingleFieldCreatePermission|Array<SingleFieldCreatePermission>
type SingleFieldPermissions = PermissionGroups | ((user: DbUser|UsersCurrent|null, object: any)=>boolean)
type FieldPermissions = SingleFieldPermissions|Array<SingleFieldPermissions>

interface CollectionFieldPermissions {
  viewableBy?: FieldPermissions,
  insertableBy?: FieldCreatePermissions,
  editableBy?: FieldPermissions,
  canRead?: FieldPermissions,
  canUpdate?: FieldPermissions,
  canCreate?: FieldCreatePermissions,
}

interface CollectionFieldSpecification<T extends DbObject> extends CollectionFieldPermissions {
  type?: any,
  description?: string,
  optional?: boolean,
  defaultValue?: any,
  graphQLType?: string,
  typescriptType?: string,
  /** Use the following information in the GraphQL schema and at query-time to
   * calculate a response */
  resolveAs?: {
    type: string|GraphQLScalarType,
    description?: string,
    fieldName?: string,
    addOriginalField?: boolean,
    arguments?: string|null,
    resolver: (root: T, args: any, context: ResolverContext, info?: any)=>any,
  },
  blackbox?: boolean,
  denormalized?: boolean,
  canAutoDenormalize?: boolean,
  canAutofillDefault?: boolean,
  needsUpdate?: (doc: Partial<T>) => boolean,
  getValue?: (doc: T, context: ResolverContext) => any,
  foreignKey?: any,
  logChanges?: boolean,
  nullable?: boolean,
  
  min?: number,
  max?: number,
  regEx?: any,
  minCount?: number,
  /** NOTE: not in use or tested as of 2022-05 */
  maxCount?: number,
  options?: any,
  allowedValues?: any,
  
  form?: any,
  input?: any,
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
   * NOTE: this is unused and untested as of 2022-05
   */
  inputProperties?: any,
  
  beforeComponent?: keyof ComponentTypes,
  /** NOTE: not in use or tested as of 2022-05 */
  afterComponent?: keyof ComponentTypes,
  order?: number,
  label?: string,
  tooltip?: string,
  // See: packages/lesswrong/components/vulcan-forms/FormComponent.tsx
  control?: 'text' |
    'number' |
    'url' |
    'email' |
    'textarea' |
    'checkbox' |
    'checkboxgroup' |
    'radiogroup' |
    'select' |
    'datetime' |
    'date' |
    keyof ComponentTypes,
  placeholder?: string,
  hidden?: boolean|((formProps: any)=>boolean),
  group?: FormGroup,
  inputType?: any,
  
  // Field mutation callbacks, invoked from Vulcan mutators. Notes:
  //  * onInsert and onEdit are deprecated (but still used) because
  //    of Vulcan's mass-renaming and switch to named arguments
  //  * The "document" field in onUpdate is deprecated due to an earlier mixup
  //    (breaking change) affecting whether it means oldDocument or newDocument
  //  * Return type of these callbacks is not enforced because we don't have the
  //    field's type in a usable format here. onInsert, onCreate, onEdit, and
  //    onUpdate should all return a new value for the field, EXCEPT that if
  //    they return undefined the field value is left unchanged.
  //
  onInsert?: (doc: DbInsertion<T>, currentUser: DbUser|null) => any,
  onCreate?: (args: {data: DbInsertion<T>, currentUser: DbUser|null, collection: CollectionBase<T>, context: ResolverContext, document: T, newDocument: T, schema: SchemaType<T>, fieldName: string}) => any,
  onEdit?: (modifier: any, oldDocument: T, currentUser: DbUser|null, newDocument: T) => any,
  onUpdate?: (args: {data: Partial<T>, oldDocument: T, newDocument: T, document: T, currentUser: DbUser|null, collection: CollectionBase<T>, context: ResolverContext, schema: SchemaType<T>, fieldName: string}) => any,
  onDelete?: (args: {document: T, currentUser: DbUser|null, collection: CollectionBase<T>, context: ResolverContext, schema: SchemaType<T>}) => Promise<void>,
}

type FormGroup = {
  name?: string,
  order: number,
  label?: string,
  paddingStyle?: boolean,
  startCollapsed?: boolean,
  defaultStyle?: boolean,
  helpText?: string,
  flexStyle?: boolean,
}

type SchemaType<T extends DbObject> = Record<string,CollectionFieldSpecification<T>>
type SimpleSchemaType<T extends DbObject> = SimpleSchema & {_schema: SchemaType<T>};

}
