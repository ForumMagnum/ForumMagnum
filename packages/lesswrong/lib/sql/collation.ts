export type CollationType = "case-sensitive" | "case-insensitive";

export const getCollationType = (collation: any) => {
  if (!collation) {
    return "case-sensitive";
  }

  const {locale, strength} = collation;
  if (locale !== "en" || strength !== 2) {
    throw new Error(`Unsupported collation type: ${JSON.stringify(collation)}`);
  }

  return "case-insensitive";
}
