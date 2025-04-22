import pick from "lodash/pick";
import type { AnyFormApi } from "@tanstack/react-form";

function sanitizeEditableFieldValues<T extends Record<string, AnyBecauseHard>>(data: T, editableFields: Array<keyof T>) {
  return Object.fromEntries(Object.entries(data).map(([key, value]) => {
    if (editableFields.includes(key as keyof T) && typeof value === 'object' && value !== null) {
      const { originalContents: { type, data }, commitMessage, updateType, dataWithDiscardedSuggestions } = value;
      return [key, { originalContents: { type, data }, commitMessage, updateType, dataWithDiscardedSuggestions }];
    }
    return [key, value];
  })) as T;
}

type EditableFieldsOf<T> = {
  [k in keyof T & string]: IfAny<T[k], never, T[k] extends { originalContents: any } | null | undefined ? k : never>;
}[keyof T & string];

export function getUpdatedFieldValues<T extends AnyFormApi>(formApi: T, editableFields?: Array<EditableFieldsOf<T["state"]["values"]>>): Partial<T["state"]["values"]> {
  const updatedFieldNames = Object.entries(formApi.state.fieldMeta).filter(([key, meta]) => meta.isDirty).map(([key]) => key);
  const updatedFields = pick(formApi.state.values, updatedFieldNames);
  if (!editableFields?.length) {
    return updatedFields;
  }
  return sanitizeEditableFieldValues(updatedFields, editableFields);
}
