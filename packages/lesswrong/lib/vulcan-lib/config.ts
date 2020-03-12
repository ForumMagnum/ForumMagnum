import SimpleSchema from 'simpl-schema';

/**
 * @summary Kick off the namespace for Vulcan.
 * @namespace Vulcan
 */

// eslint-disable-next-line no-undef
export const Vulcan: any = {};

(global as any).Vulcan = Vulcan;

// eslint-disable-next-line no-undef
Vulcan.VERSION = '1.13.0';

// ------------------------------------- Schemas -------------------------------- //

SimpleSchema.extendOptions([
  'hidden', // hidden: true means the field is never shown in a form no matter what
  'form', // extra form properties
  'inputProperties', // extra form properties
  'input', // SmartForm control (String or React component)
  'control', // SmartForm control (String or React component) (legacy)
  'order', // position in the form
  'group', // form fieldset group

  'onCreate', // field insert callback
  'onInsert', // field insert callback (OpenCRUD backwards compatibility)

  'onUpdate', // field edit callback
  'onEdit', // field edit callback (OpenCRUD backwards compatibility)

  'onDelete', // field remove callback
  'onRemove', // field remove callback (OpenCRUD backwards compatibility)

  'canRead', // who can view the field
  'viewableBy', // who can view the field (OpenCRUD backwards compatibility)

  'canCreate', // who can insert the field
  'insertableBy', // who can insert the field (OpenCRUD backwards compatibility)

  'canUpdate', // who can edit the field
  'editableBy', // who can edit the field (OpenCRUD backwards compatibility)

  'resolveAs', // field-level resolver
  'description', // description/help
  'beforeComponent', // before form component
  'afterComponent', // after form component
  'placeholder', // form field placeholder value
  'options', // form options
  'query', // field-specific data loading query
  'unique', // field can be used as part of a selectorUnique when querying for data

  'tooltip', // if not empty, the field will provide a tooltip when hovered over
]);

// eslint-disable-next-line no-undef
export default Vulcan;
