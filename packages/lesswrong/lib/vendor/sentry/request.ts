import type { WebFetchHeaders } from "@sentry/core";

// MIT License

// Copyright (c) 2012 Functional Software, Inc. dba Sentry

// Permission is hereby granted, free of charge, to any person obtaining a copy of
// this software and associated documentation files (the "Software"), to deal in
// the Software without restriction, including without limitation the rights to
// use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
// of the Software, and to permit persons to whom the Software is furnished to do
// so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

// Source: https://github.com/getsentry/sentry-javascript/blob/9.41.0/packages/core/src/utils/request.ts#L9

/**
 * Transforms a `Headers` object that implements the `Web Fetch API` (https://developer.mozilla.org/en-US/docs/Web/API/Headers) into a simple key-value dict.
 * The header keys will be lower case: e.g. A "Content-Type" header will be stored as "content-type".
 */
export function winterCGHeadersToDict(winterCGHeaders?: WebFetchHeaders): Record<string, string> {
  const headers: Record<string, string> = {};
  try {
    winterCGHeaders?.forEach((value, key) => {
      if (typeof value === 'string') {
        // We check that value is a string even though it might be redundant to make sure prototype pollution is not possible.
        headers[key] = value;
      }
    });
  } catch {
    // just return the empty headers
  }

  return headers;
}
