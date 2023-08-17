export type CollationType = "case-sensitive" | "case-insensitive";

export const DEFAULT_COLLATION: CollationType = "case-sensitive";

export const getCollationType = (collation?: {locale: string, strength?: number}) => {
  if (!collation) {
    return DEFAULT_COLLATION;
  }

  const {locale, strength} = collation;
  if (locale !== "en" || strength !== 2) {
    throw new Error(`Unsupported collation type: ${JSON.stringify(collation)}`);
  }

  return "case-insensitive";
}
