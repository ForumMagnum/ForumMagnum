import SimpleSchema from "simpl-schema"

declare module "simpl-schema" {
  interface SchemaDefinition {
    canAutofillDefault?: boolean
    denormalized?: boolean
    foreignKey?: CollectionNameString | {collection: CollectionNameString,field: string}
    nullable?: boolean
  }
}

// For auto-generated database type definitions, provides a (string) definition
// of this field's type. Useful for fields that would otherwise be black-box types.
SimpleSchema.extendOptions(['typescriptType'])

// For denormalized fields, needsUpdate is an optional attribute that
// determines whether the denormalization function should be rerun given
// the new document after an update or an insert
SimpleSchema.extendOptions(['needsUpdate'])

// For denormalized fields, getValue returns the new denormalized value of
// the field, given the new document after an update or an insert
SimpleSchema.extendOptions(['getValue'])

// For denormalized fields, marks a field so that we can automatically
// get the automatically recompute the new denormalized value via
// `Vulcan.recomputeDenormalizedValues` in the Meteor shell
SimpleSchema.extendOptions(['canAutoDenormalize'])

// Whether to log changes to this field to the LWEvents collection. If undefined
// (neither true nor false), will be logged if the logChanges option is set on
// the collection and the denormalized option is false.
SimpleSchema.extendOptions(['logChanges'])

// For fields that are automatically updated counts of references (see
// addCountOfReferenceCallbacks).
SimpleSchema.extendOptions(['countOfReferences']);

// For fields that are editable, this option allows you to specify the editable field options
SimpleSchema.extendOptions(['editableFieldOptions']);

// For slug fields, this option allows you to specify the options necessary to run the slug callbacks
SimpleSchema.extendOptions(['slugCallbackOptions']);


SimpleSchema.extendOptions([
  'hidden', // hidden: true means the field is never shown in a form no matter what
  'form', // extra form properties
  'input', // SmartForm control (String or React component)
  'control', // SmartForm control (String or React component) (legacy)
  'order', // position in the form
  'group', // form fieldset group

  'onCreate', // field insert callback
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

// We re-export the SimpleSchema constructor to avoid import order issues
// e.g. in schema files that use the above custom properties
export default SimpleSchema;
