// LW1.0 identified objects by sequential numeric IDs (rather than 17-character
// strings like we currently do), which, when they appeared in URLs, would be
// in base 36 (a-z0-9). These are sometimes referred to as legacy IDs. In the
// database, they're stored as integers, not as base36 strings. So we have
// these utility functions for converting from base36 strings to integers and
// back.

export function isValidBase36Id(id: string): boolean {
  return !isNaN(parseInt(id, 36));
}

export function base36toNumber(id: string): number|null {
  const parsed = parseInt(id, 36)
  if (isNaN(parsed))
    return null
  else
    return parsed;
}

export function numberToBase36(n: number): string {
  return n.toString(36);
}

