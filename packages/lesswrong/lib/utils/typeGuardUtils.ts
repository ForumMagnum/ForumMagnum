type Literal<T> = string extends T ? never : T;
type Tuple<T extends ReadonlyArray<string>> = Literal<T[number]> extends never ? never : T;

export class TupleSet<T extends ReadonlyArray<string>> extends Set<string> {
  constructor(knownValues: Tuple<T>) {
    super(knownValues);
  }

  has (value: string): value is T[number] {
    return this.has(value);
  }
}

export type TupleOf<T extends TupleSet<any>> = T extends TupleSet<infer U> ? U : never;
