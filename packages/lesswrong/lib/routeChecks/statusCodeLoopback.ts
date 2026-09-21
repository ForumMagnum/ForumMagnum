// Imported by middleware.ts; keep free of heavy or node-only dependencies.

// Marks a loopback render made by middleware.ts (for status code discovery)
// or by the cached-post route handler. Requests carrying it bypass the
// middleware's proxying and cache routing.
export const STATUS_CODE_LOOPBACK_HEADER = 'X-Forwarded-For-Status-Codes';

// Requests forwarded through ngrok or Cloudflare's tunnel arrive with an
// X-Forwarded-Proto of https, so the request URL is https://localhost, which
// the local server doesn't serve.
export function fixLoopbackUrl(url: string): string {
  if (url.startsWith('https://localhost')) {
    return url.replace('https://localhost', 'http://localhost');
  }
  return url;
}

interface StatusCodeMetadata {
  status: number
  redirectTarget?: string
}

const searchString: Uint8Array = new TextEncoder().encode('<div data-response-metadata="');
const doubleQuoteAscii = '"'.charCodeAt(0);

// Finds the `<div data-response-metadata="...">` marker that <StatusCodeSetter>
// renders into an SSR stream and parses its base64-encoded JSON attribute,
// which may span chunk boundaries. Returns null if the stream ends, or
// `maxBytes` have been read, without the marker appearing.
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

  // Not awaited: cancelling one branch of a tee only settles once the other
  // branch has been fully consumed.
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
