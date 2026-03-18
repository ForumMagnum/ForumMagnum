/**
 * Lazily loads the headless Lexical -> Yjs conversion path.
 *
 * `htmlToYjsBinary` transitively imports PlaygroundNodes, which pull in CSS and
 * break codegen's CommonJS loader if imported eagerly from resolver modules.
 */
export async function htmlToYjsBinaryAsync(html: string): Promise<Uint8Array> {
  const { htmlToYjsBinary } = await import('./htmlToYjsBinary');
  return htmlToYjsBinary(html);
}

export async function htmlToYjsStateFromHtml(html: string): Promise<{
  yjsBinary: Uint8Array;
  yjsState: string;
}> {
  const yjsBinary = await htmlToYjsBinaryAsync(html);
  return {
    yjsBinary,
    yjsState: Buffer.from(yjsBinary).toString('base64'),
  };
}
