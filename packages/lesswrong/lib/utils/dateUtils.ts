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
}[keyof T];

export function withDateFields<T extends unknown | null | undefined, const K extends StringFieldsOf<Exclude<T, null | undefined>>[]>(obj: T, fields: K) {
  if (!obj) {
    return obj as Extract<T, null | undefined>;
  }

  const originalFields = pick(obj, fields) as Record<K[number], string | null | undefined>;
  const remainingFields = omit(obj, fields) as Omit<Exclude<T, null | undefined>, K[number]>;
  
  const dateFields = mapValues(originalFields, (value) => maybeDate(value));
  return { ...remainingFields, ...dateFields };
}