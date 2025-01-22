import SimpleSchema from 'simpl-schema';
import { addGlobalForShell } from '../executionEnvironment';

// Set up a global dumping ground for stuff that's convenient to have accessible
// in meteor shell. (This is a hack to deal with meteor-shell not being able to
// import stuff inside modules easily.)
//
// Aliased to both the names Vulcan and Globals.

export const Globals: any = {};
export const Vulcan = Globals;

addGlobalForShell("Globals", Globals);
addGlobalForShell("Vulcan", Globals);

// eslint-disable-next-line no-undef
Globals.VERSION = '2.0.0';

// ------------------------------------- Schemas -------------------------------- //

SimpleSchema.extendOptions([
  'hidden', // hidden: true means the field is never shown in a form no matter what
  'form', // extra form properties
  'input', // SmartForm control (String or React component)
  'control', // SmartForm control (String or React component) (legacy)
  'order', // position in the form
  'group', // form fieldset group

  'onCreate', // field insert callback
  'onInsert', // field insert callback (OpenCRUD backwards compatibility)

  'onUpdate', // field edit callback

  'onDelete', // field remove callback

  'canRead', // who can view the field
  'canCreate', // who can insert the field
  'canUpdate', // who can edit the field

  'resolveAs', // field-level resolver
  'description', // description/help
  'beforeComponent', // before form component
  'afterComponent', // after form component
  'placeholder', // form field placeholder value
  'options', // form options
  'query', // field-specific data loading query
  'unique', // field can be used as part of a selectorUnique when querying for data

  'tooltip', // if not empty, the field will provide a tooltip when hovered over

  // canAutofillDefault: Marks a field where, if its value is null, it should
  // be auto-replaced with defaultValue in migration scripts.
  'canAutofillDefault',

  // denormalized: In a schema entry, denormalized:true means that this field can
  // (in principle) be regenerated from other fields. For now, it's a glorified
  // machine-readable comment; in the future, it may have other infrastructure
  // attached.
  'denormalized',

  // foreignKey: In a schema entry, this is either an object {collection,field},
  // or just a string, in which case the string is the collection name and field
  // is _id. Indicates that if this field is present and not null, its value
  // must correspond to an existing row in the named collection. For example,
  //
  //   foreignKey: 'Users'
  //   means that the value of this field must be the _id of a user;
  //
  //   foreignKey: {
  //     collection: 'Posts',
  //     field: 'slug'
  //   }
  //   means that the value of this field must be the slug of a post.
  //
   'foreignKey',

  // nullable: In a schema entry, this boolean indicates whether the type system
  // should treat this field as nullable 
   'nullable',

  // Define a static vector size for use in Postgres - this should only be
  // used on array fields
   'vectorSize'
]);


// eslint-disable-next-line no-undef
export default Globals;
