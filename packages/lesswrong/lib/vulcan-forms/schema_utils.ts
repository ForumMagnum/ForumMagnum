/*
 * Schema converter/getters
 */
import { userCanCreateField, userCanUpdateField } from '../vulcan-users/permissions';
import _keys from 'lodash/keys';
import _filter from 'lodash/filter';
import * as _ from 'underscore';

/* getters */
// filter out fields with "." or "$"
export const getValidFields = <N extends CollectionNameString>(schema: SchemaType<N>) => {
  return Object.keys(schema).filter(fieldName => !fieldName.includes('$') && !fieldName.includes('.'));
};

export const getReadableFields = <N extends CollectionNameString>(schema: SchemaType<N>) => {
  // OpenCRUD backwards compatibility
  return getValidFields(schema).filter(fieldName => schema[fieldName].canRead);
};

export const getCreateableFields = <N extends CollectionNameString>(schema: SchemaType<N>) => {
  // OpenCRUD backwards compatibility
  return getValidFields(schema).filter(fieldName => schema[fieldName].canCreate);
};

export const getUpdateableFields = <N extends CollectionNameString>(schema: SchemaType<N>) => {
  // OpenCRUD backwards compatibility
  return getValidFields(schema).filter(fieldName => schema[fieldName].canUpdate);
};

/* permissions */

/**
 * @method Mongo.Collection.getInsertableFields
 * Get an array of all fields editable by a specific user for a given collection
 * @param {Object} user – the user for which to check field permissions
 */
export const getInsertableFields = function<N extends CollectionNameString>(schema: SchemaType<N>, user: UsersCurrent|null): Array<string> {
  const fields: Array<string> = _filter(_keys(schema), function(fieldName: string): boolean {
    var field = schema[fieldName];
    return userCanCreateField(user, field);
  });
  return fields;
};

/**
 * @method Mongo.Collection.getEditableFields
 * Get an array of all fields editable by a specific user for a given collection (and optionally document)
 * @param {Object} user – the user for which to check field permissions
 */
export const getEditableFields = function<N extends CollectionNameString>(
  schema: SchemaType<N>,
  user: UsersCurrent|null,
  document: ObjectsByCollectionName[N],
): Array<string> {
  const fields = _.filter(_.keys(schema), function(fieldName: string): boolean {
    var field = schema[fieldName];
    return userCanUpdateField(user, field, document);
  });
  return fields;
};

/**
 * Convert a nested SimpleSchema schema into a JSON object
 * If flatten = true, will create a flat object instead of nested tree
 */
export const convertSchema = <N extends CollectionNameString>(schema: SimpleSchemaType<N>, flatten = false) => {
  if (schema._schema) {
    let jsonSchema: AnyBecauseTodo = {};

    Object.keys(schema._schema).forEach(fieldName => {
      // exclude array fields
      if (fieldName.includes('$')) {
        return;
      }

      // extract schema
      jsonSchema[fieldName] = getFieldSchema(fieldName, schema);

      // check for existence of nested field
      // and get its schema if possible or its type otherwise
      const subSchemaOrType = getNestedFieldSchemaOrType(fieldName, schema);
      if (subSchemaOrType) {
        // if nested field exists, call convertSchema recursively
        const convertedSubSchema = convertSchema(subSchemaOrType);
        // nested schema can be a field schema ({type, canRead, etc.}) (convertedSchema will be null)
        // or a schema on its own with subfields (convertedSchema will return smth)
        if (!convertedSubSchema) {
          // subSchema is a simple field in this case (eg array of numbers)
          jsonSchema[fieldName].field = getFieldSchema(`${fieldName}.$`, schema);
        } else {
          // subSchema is a full schema with multiple fields (eg array of objects)
          if (flatten) {
            jsonSchema = { ...jsonSchema, ...convertedSubSchema };
          } else {
            jsonSchema[fieldName].schema = convertedSubSchema;
          }
        }
      }
    });
    return jsonSchema;
  } else {
    return null;
  }
};

/*

Get a JSON object representing a field's schema

*/
export const getFieldSchema = <N extends CollectionNameString>(fieldName: string, schema: SimpleSchemaType<N>) => {
  let fieldSchema: AnyBecauseTodo = {};
  schemaProperties.forEach(property => {
    const propertyValue = schema.get(fieldName, property);
    if (propertyValue) {
      fieldSchema[property] = propertyValue;
    }
  });
  return fieldSchema;
};

// type is an array due to the possibility of using SimpleSchema.oneOf
// right now we support only fields with one type
export const getSchemaType = (schema: AnyBecauseTodo) => schema.type.definitions[0].type;

const getArrayNestedSchema = <N extends CollectionNameString>(
  fieldName: string & keyof ObjectsByCollectionName[N],
  schema: SimpleSchemaType<N>,
) => {
  const arrayItemSchema = schema._schema[`${fieldName}.$`];
  
  const nestedSchema = arrayItemSchema && getSchemaType(arrayItemSchema);
  return nestedSchema;
};
// nested object fields type is of the form "type: new SimpleSchema({...})"
// so they should possess a "_schema" prop
const isNestedSchemaField = (fieldSchema: AnyBecauseTodo) => {
  const fieldType = getSchemaType(fieldSchema);
  //console.log('fieldType', typeof fieldType, fieldType._schema)
  return fieldType && !!fieldType._schema;
};
const getObjectNestedSchema = (fieldName: AnyBecauseTodo, schema: AnyBecauseTodo) => {
  const fieldSchema = schema._schema[fieldName];
  if (!isNestedSchemaField(fieldSchema)) return null;
  const nestedSchema = fieldSchema && getSchemaType(fieldSchema);
  return nestedSchema;
};
/*

Given an array field, get its nested schema
If the field is not an object, this will return the subfield type instead
*/
export const getNestedFieldSchemaOrType = (fieldName: AnyBecauseTodo, schema: AnyBecauseTodo) => {
  const arrayItemSchema = getArrayNestedSchema(fieldName, schema);
  if (!arrayItemSchema) {
    // look for an object schema
    const objectItemSchema = getObjectNestedSchema(fieldName, schema);
    // no schema was found
    if (!objectItemSchema) return null;
    return objectItemSchema;
  }
  return arrayItemSchema;
};

export const schemaProperties = [
  'type',
  'label',
  'optional',
  'min',
  'max',
  'minCount',
  'maxCount',
  'allowedValues',
  'regEx',
  'blackbox',
  'defaultValue',
  'hidden', // hidden: true means the field is never shown in a form no matter what
  'form', // form placeholder
  'control', // SmartForm control (String or React component)
  'input', // SmartForm control (String or React component)
  'autoform', // legacy form placeholder; backward compatibility (not used anymore)
  'order', // position in the form
  'group', // form fieldset group
  'onCreate', // field insert callback
  'onUpdate', // field edit callback
  'onDelete', // field remove callback
  'onInsert', // OpenCRUD backwards compatibility
  'canRead',
  'canCreate',
  'canUpdate',
  'resolveAs',
  'description',
  'beforeComponent',
  'afterComponent',
  'placeholder',
  'options',
  'tooltip'
] as const;

/** Fields that, if they appear on a field schema, will be passed through to the
 * form component for that field. */
export const formProperties = [
  'optional',
  'min',
  'max',
  'minCount',
  'maxCount',
  'allowedValues',
  'regEx',
  'blackbox',
  'defaultValue',
  'form', // form placeholder
  'control', // SmartForm control (String or React component)
  'input', // SmartForm control (String or React component)
  'order', // position in the form
  'group', // form fieldset group
  'description',
  'beforeComponent',
  'afterComponent',
  'placeholder',
  'options',
  'tooltip'
] as const;
