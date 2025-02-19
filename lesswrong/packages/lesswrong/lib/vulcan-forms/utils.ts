import set from 'lodash/set';
import { removePrefix, filterPathsByPrefix } from './path_utils';

// see http://stackoverflow.com/questions/19098797/fastest-way-to-flatten-un-flatten-nested-json-objects
export const flatten = function(data: AnyBecauseTodo) {
  var result: AnyBecauseTodo = {};
  function recurse(cur: AnyBecauseTodo, prop: AnyBecauseTodo) {
    if (Object.prototype.toString.call(cur) !== '[object Object]') {
      result[prop] = cur;
    } else if (Array.isArray(cur)) {
      for (var i = 0, l = cur.length; i < l; i++) recurse(cur[i], prop + '[' + i + ']');
      if (l === 0) result[prop] = [];
    } else {
      var isEmpty = true;
      for (var p in cur) {
        isEmpty = false;
        recurse(cur[p], prop ? prop + '.' + p : p);
      }
      if (isEmpty && prop) result[prop] = {};
    }
  }
  recurse(data, '');
  return result;
};

export const isEmptyValue = (value: AnyBecauseTodo) =>
  typeof value === 'undefined' || value === null || value === '';


/**
 * Converts a list of field names to an object of deleted values.
 *
 * @param {string[]|Object.<string|string>} deletedFields
 *  List of deleted field names or paths
 * @param {Object|Array=} accumulator={}
 *  Value to reduce the values to
 * @return {Object|Array}
 *  Deleted values, with the structure defined by taking the received deleted
 *  fields as paths
 * @example
 *  const deletedFields = [
 *    'field.subField',
 *    'field.subFieldArray[0]',
 *    'fieldArray[0]',
 *    'fieldArray[2].name',
 *  ];
 *  getNestedDeletedValues(deletedFields);
 *  // => { 'field': { 'subField': null, 'subFieldArray': [null] }, 'fieldArray': [null, undefined, { name: null } }
 */
export const getDeletedValues = (deletedFields: AnyBecauseTodo, accumulator: AnyBecauseTodo = {}) =>
  deletedFields.reduce((deletedValues: AnyBecauseTodo, path: AnyBecauseTodo) => set(deletedValues, path, null), accumulator);

/**
 * Filters the given field names by prefix, removes it from each one of them
 * and convert the list to an object of deleted values.
 *
 * @param {string=} prefix
 *  Prefix to filter and remove from deleted fields
 * @param {string[]|Object.<string|string>} deletedFields
 *  List of deleted field names or paths
 * @param {Object|Array=} accumulator={}
 *  Value to reduce the values to
 * @return {Object.<string, null>}
 *  Object keyed with the given deleted fields, valued with `null`
 * @example
 *  const deletedFields = [
 *    'field.subField',
 *    'field.subFieldArray[0]',
 *    'fieldArray[0]',
 *    'fieldArray[2].name',
 *  ];
 *  getNestedDeletedValues('field', deletedFields);
 *  // => { 'subField': null, 'subFieldArray': [null] }
 *  getNestedDeletedValues('fieldArray', deletedFields);
 *  // => { '0': null, '2': { 'name': null } }
 *  getNestedDeletedValues('fieldArray', deletedFields, []);
 *  // => [null, undefined, { 'name': null } ]
 */
export const getNestedDeletedValues = (prefix: AnyBecauseTodo, deletedFields: AnyBecauseTodo, accumulator: AnyBecauseTodo = {}) =>
  getDeletedValues(removePrefix(prefix, filterPathsByPrefix(prefix, deletedFields)), accumulator);

export const getFieldType = (datatype: AnyBecauseTodo) => datatype[0].type;
/**
 * Get appropriate null value for various field types
 *
 * @param {Array} datatype
 * Field's datatype property
 */
export const getNullValue = (datatype: AnyBecauseTodo) => {
  const fieldType = getFieldType(datatype);
  if (fieldType === Array) {
    return [];
  } else if (fieldType === Boolean) {
    return false;
  } else if (fieldType === String) {
    return '';
  } else if (fieldType === Number) {
    return '';
  } else {
    // normalize to null
    return null;
  }
};
