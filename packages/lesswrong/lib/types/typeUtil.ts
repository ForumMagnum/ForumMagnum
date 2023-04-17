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

/** Either T, or a function taking P and returning T. */
export type MaybeFunction<T,P> = T|((props:P)=>T)

}
