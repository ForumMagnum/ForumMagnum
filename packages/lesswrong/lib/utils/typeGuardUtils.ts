export function fieldIn<T extends {}>(field: string | number | symbol, ...objects: T[]): field is keyof T {
  return objects.every(object => field in object);
}

type Literal<T> = string|number extends T ? never : T;
type Tuple<T extends ReadonlyArray<string|number>> = Literal<T[number]> extends never ? never : T;

/**
 * We fairly frequently encounter the following pattern:
 * - we have some known set of literal values
 * - we need to check some unknown value to see if it's one of them
 * - we want to preserve type info (i.e. have that previous check act as a type guard)
 * 
 * Most ways of doing this in Typescript rely on type casts, which are fragile, since you can change something in one place but not another
 * 
 * The generic constraints here ensure that you can only pass in tuples with literal values known at compile-time, and not string arrays
 * This ensures that the type guard works as intended and doesn't silently "break" if the set is instantiated with an insufficiently-typed set of values
 * 
 * Example usage:
 * ```
 * const tabs = new TupleSet(['sunshineNewUsers', 'allUsers'] as const);
 * type DashboardTabs = UnionOf<typeof tabs>;
 * 
 * const getCurrentView = (query: Record<string, string>): DashboardTabs => {
 *  const tabQuery = query.view; // this is type `string`
 *  if (tabs.has(tabQuery)) return tabQuery; // This is now type `DashboardTabs`
 *  else return 'sunshineNewUsers';
 * }
 * ```
 * 
 * The following will cause a type error:
 * ```
 * const tabNames = ['sunshineNewUsers', 'allUsers'];
 * new TupleSet(tabNames); // tabNames is typed `string[]`
 * new TupleSet(['sunshineNewUsers', 'allUsers']); // missing `as const`
 * ```
 */
export class TupleSet<T extends ReadonlyArray<string|number>> extends Set<string|number> {
  constructor(knownValues: Tuple<T>) {
    super(knownValues);
  }

  has (value: string|number): value is T[number] {
    return super.has(value);
  }
  
  [Symbol.iterator](): IterableIterator<Tuple<T>[number]> {
    return super[Symbol.iterator]();
  }
}

export type TupleOf<T extends TupleSet<any>> = T extends TupleSet<infer U> ? U : never;
export type UnionOf<T extends TupleSet<any>> = TupleOf<T>[number];

export function filterNonnull<T>(arr: (T|null|undefined)[]): T[] {
  return arr.filter(x=>x!=null && x!==undefined) as T[];
}

//type for filterWhereFieldsNotNull that is the same field as T but no nullable values in the specified fields
export type FieldsNotNull<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>> & {
  [P in K]-?: NonNullable<T[P]>;
}; 

export function areFieldsNotNull<T, K extends keyof T>(item: T, ...fields: [K, ...K[]]): item is T & FieldsNotNull<T, K> {
  return fields.some((field) => item[field] !== null && item[field] !== undefined);
}

function areFieldsNotNullCurry<T, K extends keyof T>(...fields: [K, ...K[]]): (item: T) => item is T & FieldsNotNull<T, K> {
  return ((item) => fields.some((field) => item[field] !== null && item[field] !== undefined)) as (item: T) => item is T & FieldsNotNull<T, K>;
}

export function filterWhereFieldsNotNull<T, K extends keyof T>(arr: T[], ...fields: [K, ...K[]]): FieldsNotNull<T, K>[] {
  return arr.filter(areFieldsNotNullCurry(...fields));
}

