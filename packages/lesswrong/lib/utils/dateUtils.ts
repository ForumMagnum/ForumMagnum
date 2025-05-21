import mapValues from "lodash/mapValues";
import omit from "lodash/omit";
import pick from "lodash/pick";

export function maybeDate<T extends string | null | undefined>(stringDate: T) {
  if (typeof stringDate !== 'string') {
    return stringDate as Exclude<T, string>;
  }

  return new Date(stringDate);
}

type StringFieldsOf<T> = {
  [K in keyof T]: T[K] extends string | null | undefined ? K : never;
};

type StringFieldNamesOf<T> = StringFieldsOf<T>[keyof T];

type StringToDateFields<T, K extends keyof T> = {
  [k in keyof T]: k extends K
    ? (T[k] extends (infer FieldType extends string | null | undefined) ? Exclude<FieldType, string> | Date : never)
    : T[k];
}

export type WithDateFields<T, K extends (StringFieldNamesOf<T> & keyof T)[]> = T extends null | undefined ? T : StringToDateFields<T, K[number]>;

export function withDateFields<T extends Record<string, unknown> | null | undefined, const K extends (StringFieldNamesOf<NonNullable<T>> & keyof NonNullable<T>)[]>(obj: T, fields: K): WithDateFields<NonNullable<T>, K> {
  if (!obj) {
    return obj as WithDateFields<NonNullable<T>, K>;
  } 

  const originalFields = pick(obj, fields);
  const remainingFields = omit(obj, fields);
  
  const dateFields = mapValues(originalFields, (value) => maybeDate(value as string | null | undefined));
  return { ...remainingFields, ...dateFields } as WithDateFields<NonNullable<T>, K>;
}
