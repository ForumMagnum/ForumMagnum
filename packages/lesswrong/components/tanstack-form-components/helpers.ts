import pick from "lodash/pick";
import type { AnyFormApi } from "@tanstack/react-form";
import mapValues from "lodash/mapValues";
import isPlainObject from "lodash/isPlainObject";

type EditableFieldsOf<T> = {
  [k in keyof T & string]: IfAny<T[k], never, T[k] extends { originalContents?: ContentTypeInput | null } | null | undefined ? k : never>;
}[keyof T & string];

export function sanitizeEditableFieldValues<T extends Record<string, AnyBecauseHard>>(data: T, editableFields: Array<EditableFieldsOf<T>>) {
  return Object.fromEntries(Object.entries(data).map(([key, value]) => {
    if (editableFields.includes(key as EditableFieldsOf<T>) && typeof value === 'object' && value !== null) {
      const { originalContents: { type, data }, commitMessage, updateType, dataWithDiscardedSuggestions } = value;
      return [key, { originalContents: { type, data }, commitMessage, updateType, dataWithDiscardedSuggestions }];
    }
    return [key, value];
  })) as T;
}

/**
 * Filter edits to only fields that have been edited, and also remove all
 * keys named __typename recursively from JSON (because it may have been
 * sneakily added to objects by apollo-client without exactly being part of the
 * schema)
 */
export function getUpdatedFieldValues<T extends AnyFormApi>(formApi: T, editableFields?: Array<EditableFieldsOf<T["state"]["values"]>>): Partial<T["state"]["values"]> {
  const updatedFieldNames: Array<keyof T["state"]["values"]> = Object.entries(formApi.state.fieldMeta).filter(([key, meta]) => meta.isDirty).map(([key]) => key);
  const updatedFields = pick(formApi.state.values, updatedFieldNames);
  if (!editableFields?.length) {
    return recursivelyRemoveTypenameFrom(updatedFields);
  }
  return recursivelyRemoveTypenameFrom(sanitizeEditableFieldValues(updatedFields, editableFields));
}

function recursivelyRemoveTypenameFrom(json: any): any {
  if (!json) {
    return json;
  } else if (Array.isArray(json)) {
    return json.map(el => recursivelyRemoveTypenameFrom(el));
  } else if (typeof json === 'object' && isPlainObject(json)) {
    const clone = mapValues(json, v=>recursivelyRemoveTypenameFrom(v));
    delete clone.__typename;
    return clone;
  } else {
    return json;
  }
}
