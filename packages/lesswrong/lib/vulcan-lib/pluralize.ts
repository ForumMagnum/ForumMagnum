export const pluralize = <T extends string>(s: T): Pluralize<T> => {
  const end = s.slice(-2);
  const plural = end[1] === 'y' && end[0] !== 'e'
    ? `${s.slice(0, -1)}ies`
    : end[1] === 's'
      ? `${s}es`
      : `${s}s`;

  return plural as Pluralize<T>;
};

export type Pluralize<T extends string> =
  T extends `${infer Head}y`
    ? Head extends `${string}e`
      ? `${T}s`
      : `${Head}ies`
    : T extends `${string}s`
      ? `${T}es`
      : `${T}s`;

type PluralizeResult = Pluralize<'PostViews'>;

