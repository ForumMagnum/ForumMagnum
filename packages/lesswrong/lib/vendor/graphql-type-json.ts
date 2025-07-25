// The MIT License (MIT)

// Copyright (c) 2016 Jimmy Jia

// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

// Source:
// https://github.com/taion/graphql-type-json/blob/master/src/index.js

// We vendored this because it was causing module resolution issues in turbopack(?)
// after installing @sentry/nextjs, possibly due to some weird interaction with how
// Sentry does instrumentation of e.g. the graphql (though we haven't figured out
// exactly why)

import { GraphQLScalarType, Kind, ObjectValueNode, print, ValueNode } from 'graphql';
import type { ObjMap } from 'graphql/jsutils/ObjMap';

function identity<T>(value: T): T {
  return value;
}

function ensureObject(value: AnyBecauseHard) {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new TypeError(
      `JSONObject cannot represent non-object value: ${value}`,
    );
  }

  return value;
}

function parseObject(typeName: string, ast: ObjectValueNode, variables?: Maybe<ObjMap<unknown>>) {
  const value = Object.create(null);
  ast.fields.forEach((field) => {
    // eslint-disable-next-line no-use-before-define
    value[field.name.value] = parseLiteral(typeName, field.value, variables);
  });

  return value;
}

function parseLiteral(typeName: string, ast: ValueNode, variables?: Maybe<ObjMap<unknown>>): Json | unknown {
  switch (ast.kind) {
    case Kind.STRING:
    case Kind.BOOLEAN:
      return ast.value;
    case Kind.INT:
    case Kind.FLOAT:
      return parseFloat(ast.value);
    case Kind.OBJECT:
      return parseObject(typeName, ast, variables);
    case Kind.LIST:
      return ast.values.map((n) => parseLiteral(typeName, n, variables));
    case Kind.NULL:
      return null;
    case Kind.VARIABLE:
      return variables ? variables[ast.name.value] : undefined;
    default:
      throw new TypeError(`${typeName} cannot represent value: ${print(ast)}`);
  }
}

// This named export is intended for users of CommonJS. Users of ES modules
//  should instead use the default export.
export const GraphQLJSON = new GraphQLScalarType({
  name: 'JSON',
  description:
    'The `JSON` scalar type represents JSON values as specified by [ECMA-404](http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf).',
  specifiedByURL:
    'http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf',
  serialize: identity,
  parseValue: identity,
  parseLiteral: (ast, variables) => parseLiteral('JSON', ast, variables),
});

export default GraphQLJSON;

export const GraphQLJSONObject = new GraphQLScalarType({
  name: 'JSONObject',
  description:
    'The `JSONObject` scalar type represents JSON objects as specified by [ECMA-404](http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf).',
  specifiedByURL:
    'http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf',
  serialize: ensureObject,
  parseValue: ensureObject,
  parseLiteral: (ast, variables) => {
    if (ast.kind !== Kind.OBJECT) {
      throw new TypeError(
        `JSONObject cannot represent non-object value: ${print(ast)}`,
      );
    }

    return parseObject('JSONObject', ast, variables);
  },
});