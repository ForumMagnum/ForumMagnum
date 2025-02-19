export const pluralize = (s: string): string => {
  const end = s.slice(-2);
  const plural = end[1] === 'y' && end[0] !== 'e' ?
    `${s.slice(0, -1)}ies` :
    end[1] === 's' ?
      `${s}es` :
      `${s}s`;
  return plural;
};
