// Based on https://github.com/apollographql/apollo-client-integrations/blob/b619e76cbe7345a712dde96b7fa51cfdd6ee9d55/packages/client-react-streaming/src/ManualDataTransport/serialization.ts
/**
 * The MIT License (MIT)

  Copyright (c) 2023 Apollo Graph, Inc. (Formerly Meteor Development Group, Inc.)

  Permission is hereby granted, free of charge, to any person obtaining a copy
  of this software and associated documentation files (the "Software"), to deal
  in the Software without restriction, including without limitation the rights
  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
  copies of the Software, and to permit persons to whom the Software is
  furnished to do so, subject to the following conditions:

  The above copyright notice and this permission notice shall be included in all
  copies or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
  SOFTWARE.
*/

/**
 * Stringifies a value to be injected into JavaScript "text" - preserves `undefined` values.
 */
export function stringify(value: any) {
  let undefinedPlaceholder = "$apollo.undefined$";

  const stringified = JSON.stringify(value);
  while (stringified.includes(JSON.stringify(undefinedPlaceholder))) {
    undefinedPlaceholder = "$" + undefinedPlaceholder;
  }
  return JSON.stringify(value, (_, v) =>
    v === undefined ? undefinedPlaceholder : v
  ).replaceAll(JSON.stringify(undefinedPlaceholder), "undefined");
}

export function revive(value: any): any {
  return value;
}

export type Stringify = typeof stringify;
export type Revive = typeof revive;