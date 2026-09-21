/**
 * Locates the `<div data-response-metadata="...">` marker that
 * <StatusCodeSetter> renders into an SSR stream, so that a proxying layer
 * (middleware.ts, or the cached-post route handler) can send the real HTTP
 * status and redirect target instead of the 200 that Next.js streams by
 * default.
 *
 * Imported by middleware.ts, so this module must stay free of heavy or
 * node-only dependencies.
 */

export interface StatusCodeMetadata {
  status: number
  redirectTarget?: string
}

const searchString: Uint8Array = new TextEncoder().encode('<div data-response-metadata="');
const doubleQuoteAscii = '\"'.charCodeAt(0);

/**
 * Look for a substring that looks like
 *   <div data-response-metadata="eyJzdGF0dXMiOjQwNH0=">
 * in a ReadableStream, parse the attribute, and return it as a StatusCodeMetadata.
 * The stream is UTF-8 encoded, and the thing we're looking for is a base64-encoded
 * string representing a serialized object, which may span chunk boundaries.
 *
 * Returns null if the stream ends, or `maxBytes` have been read, without
 * finding the marker.
 */
export async function findStatusCodeInStream(
  stream: ReadableStream<Uint8Array<ArrayBufferLike>>,
  maxBytes: number = Number.POSITIVE_INFINITY,
): Promise<StatusCodeMetadata|null> {
  let matchIndex = 0;
  let isReadingResult = false;
  let bytesRead = 0;
  const result: number[] = [];

  const reader = stream.getReader();
  loop: {
    for (;;) {
      const readResult = await reader.read();
      if (!readResult.value || readResult.done) {
        break;
      }
      const chunk = readResult.value;
      bytesRead += chunk.length;
      for (let i=0; i<chunk.length; i++) {
        if (isReadingResult) {
          const nextCh = chunk.at(i)!;
          if (nextCh === doubleQuoteAscii) {
            break loop;
          } else {
            result.push(nextCh);
          }
        } else if (chunk.at(i) === searchString.at(matchIndex)) {
          matchIndex++;
          if (matchIndex >= searchString.length) {
            isReadingResult = true;
          }
        } else {
          matchIndex = 0;
        }
      }
      if (!isReadingResult && bytesRead >= maxBytes) {
        break;
      }
    }
  }

  // Release the scanning branch without waiting: awaiting cancellation of one
  // tee branch can block until the other branch has been fully consumed.
  void reader.cancel().catch(() => {});

  if (isReadingResult) {
    const base64EncodedStr = new TextDecoder().decode(new Uint8Array(result));
    const binaryString = atob(base64EncodedStr);
    const bytes = Uint8Array.from(binaryString, c => c.charCodeAt(0));
    const decodedStr = new TextDecoder().decode(bytes);
    const parsed: StatusCodeMetadata = JSON.parse(decodedStr);
    return parsed;
  } else {
    return null;
  }
}
