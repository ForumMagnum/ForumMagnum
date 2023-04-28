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
  'onEdit', // field edit callback (OpenCRUD backwards compatibility)

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
  'getPostgresType', // For defining a custom type for use in Postgres only

  'tooltip', // if not empty, the field will provide a tooltip when hovered over
]);

// eslint-disable-next-line no-undef
export default Globals;
