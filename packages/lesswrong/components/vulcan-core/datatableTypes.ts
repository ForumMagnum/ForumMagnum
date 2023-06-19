export type ColumnComponents = {
  [T in keyof ComponentTypes]: FromPartial<ComponentTypes[T]['propTypes']> extends { column: any; } | undefined ? T : never
}[keyof ComponentTypes];
