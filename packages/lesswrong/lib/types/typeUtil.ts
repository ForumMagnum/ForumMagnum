// To augment the default scope, this must be a module; to be a module, it needs
// at least one import or export. Hence, export nothing.
export {}

declare global {

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

/**
 * Has Typescript type "any" because it's a JSON blob coming from a user input,
 * wire protocol field, config file, or similar. This should probably be
 * validated and converted to a more specific type before use.
 */
type AnyBecauseIsInput = any

/**
 * Has Typescript type "any" because no one has gotten around to annotating
 * this with a more specific type yet. This is intended for code written prior
 * to when we switched from Javascript to Typescript and should mostly not be
 * used in new code.
 */
type AnyBecauseTodo = any

/**
 * Has Typescript type "any" because this is legacy code that someone has
 * judged to not be worth ever adding type annotations to, eg old migration and
 * import scripts that are kept around for recordkeeping purposes but aren't
 * expected to actually be used again.
 */
type AnyBecauseObsolete = any

/**
 * Has Typescript type "any" because the developer spent more than 5 minutes
 * trying to type this and was very frustrated. The developer promises they
 * were not just being lazy.
 */
type AnyBecauseHard = any

}
