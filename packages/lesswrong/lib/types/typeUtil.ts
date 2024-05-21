// To augment the default scope, this must be a module; to be a module, it needs
// at least one import or export. Hence, export nothing.
export {}

declare global {

// The version of the typescript lib we use is missing several of the valid
// constructors for `Error`, so we add them here
interface ErrorConstructor {
    new(message?: string, options?: {cause?: Error}): Error;
    new(message?: string, fileName?: string, lineNumber?: number): Error;
    (message?: string, options?: {cause?: Error}): Error;
    (message?: string, fileName?: string, lineNumber?: number): Error;
}

// Test whether T is type 'any'; if so evaluates to Y, otherwise to N. From
// https://stackoverflow.com/questions/55541275/typescript-check-for-the-any-type
type IfAny<T,Y,N> = 0 extends (1 & T) ? Y : N;

// Test whether two non-any types are the same type. (Technically, tests whether
// they each extend each other.) If they are, evaluates to Equal, otherwise to
// NotEqual.
type TypesEqual<A,B, Equal,NotEqual> =
  A extends B
    ? (B extends A ? Equal : NotEqual)
    : NotEqual


type NonAnyFieldsOfType<Interface,Type> = {
  [K in keyof Interface]: IfAny<Interface[K],
    never,
    TypesEqual<Interface[K],Type, K,never>
  >
}[keyof Interface]


type ReplaceFieldsOfType<Interface, FieldType,ReplacementType> = {
  [K in keyof Interface]: IfAny<Interface[K],
    any,
    TypesEqual<Interface[K],FieldType, ReplacementType, Interface[K]>
  >
}

type AtLeast<T, K extends keyof T> = Partial<T> & Pick<T, K>

type NameOfFieldWithType<ObjType,FieldName,FieldType> =
  FieldName extends keyof ObjType
    ? TypesEqual<ObjType[FieldName],FieldType,FieldName&string,never>
    : never;

type FromPartial<T> = T extends Partial<infer U> ? U : never;

/** Either T, or a function taking P and returning T. */
export type MaybeFunction<T,P> = T|((props: P) => T)

/**
 * Has Typescript type "any" because it's a JSON blob coming from a user input,
 * wire protocol field, config file, or similar. This should probably be
 * validated and converted to a more specific type before use.
 */
export type AnyBecauseIsInput = any

/**
 * Has Typescript type "any" because no one has gotten around to annotating
 * this with a more specific type yet. This is intended for code written prior
 * to when we switched from Javascript to Typescript and should mostly not be
 * used in new code.
 *
 * If something is cast to this, eg `(x as AnyBecauseTodo)[s]`, this indicates
 * that without the cast it would be an implicit-any type error. This can happen
 * if an object is annotated with a more detailed type than the index accessor;
 * eg `s` is type `string` but `x` contains only *specific* strings.
 */
export type AnyBecauseTodo = any

/**
 * Has Typescript type "any" because this is legacy code that someone has
 * judged to not be worth ever adding type annotations to, eg old migration and
 * import scripts that are kept around for recordkeeping purposes but aren't
 * expected to actually be used again.
 */
export type AnyBecauseObsolete = any

/**
 * Has Typescript type "any" because the developer spent more than 5 minutes
 * trying to type this and was very frustrated. The developer promises they
 * were not just being lazy.
 */
export type AnyBecauseHard = any

export interface JsonArray extends ReadonlyArray<Json> {}
export interface JsonRecord extends Record<string, Json> {}
export type Json = boolean | number | string | null | JsonArray | JsonRecord

type ComponentProps<C> = C extends React.ComponentType<infer P> ? P : never;

type IsOptional<T, K extends keyof T> = undefined extends T[K] ? true : false;

export type ComponentWithProps<T> = {
  // The ternary here is to make sure e.g. `{onClose?: any}` only matches components that have onClose as an optional parameter,
  // and not components that don't have it at all
  [K in keyof ComponentTypes]: IsOptional<ComponentProps<ComponentTypes[K]>, keyof T & keyof ComponentProps<ComponentTypes[K]>> extends true
    ? (ComponentProps<ComponentTypes[K]> extends T ? K : never)
    : (ComponentProps<ComponentTypes[K]> extends Required<T> ? K : never)
}[keyof ComponentTypes];

}

