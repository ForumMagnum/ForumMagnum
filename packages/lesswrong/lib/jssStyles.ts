// This `any` should actually be `CSSProperties` from either MUI or JSS but this
// currently causes an avalanche of type errors, I think due to the fact that
// we're stuck on a precambrian version of MUI. Upgrading would probably fix this.
export type JssStyles<ClassKey extends string = string> =
  Record<ClassKey, AnyBecauseHard>;

export type JssStylesCallback<ClassKey extends string = string> =
  (theme: ThemeType) => JssStyles<ClassKey>;
