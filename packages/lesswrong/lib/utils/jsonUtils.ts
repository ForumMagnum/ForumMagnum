/**
 * Given something serializable (can be JSON.stringify'ed), serialize it into
 * a form that can be embedded into an HTML document. Escapes </script> tags
 * but does *not* wrap it in quotes or escape quotes.
 */
export const toEmbeddableJson = (serializable: unknown): string => {
  const json = JSON.stringify(serializable);
  // JSON.stringify(undefined) returns undefined; when embedding into inline
  // scripts we want the literal `undefined` instead of throwing on .replace
  if (json === undefined) return "undefined";
  return json
    .replace(/<\//g, "<\\/")
}
