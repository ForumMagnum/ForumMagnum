export const pluralize = (s: string): string => {
  const plural = s.slice(-1) === 'y' ?
    `${s.slice(0, -1)}ies` :
    s.slice(-1) === 's' ?
      `${s}es` :
      `${s}s`;
  return plural;
};
