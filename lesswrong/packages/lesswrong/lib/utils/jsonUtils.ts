/**
 * Given something serializable (can be JSON.stringify'ed), serialize it into
 * a form that can be embedded into an HTML document. Escapes </script> tags
 * but does *not* wrap it in quotes or escape quotes.
 */
export const toEmbeddableJson = (serializable: unknown): string => {
  return JSON.stringify(serializable)
    .replace(/<\//g, "<\\/")
}
