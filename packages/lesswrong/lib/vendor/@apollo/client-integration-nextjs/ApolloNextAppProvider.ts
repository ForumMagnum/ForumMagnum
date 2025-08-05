// Based on https://github.com/apollographql/apollo-client-integrations/blob/c465affd9e31674e868cdc7ac90cf0cab4c7f70e/packages/nextjs/src/ApolloNextAppProvider.ts
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

'use client';

import { useContext } from "react";
import { buildManualDataTransport } from "@apollo/client-react-streaming/manual-transport";
import { type QueryEvent, WrapApolloProvider } from "@apollo/client-react-streaming";
import { ServerInsertedHTMLContext } from "next/navigation";
import { stringify as defaultTransportStringify } from "../client-react-streaming/ManualDataTransport/serialization";
import keyBy from "lodash/keyBy";

type RehydrationCache = Record<string, unknown>;

interface ExpectedDataTransportObject {
  rehydrate: RehydrationCache;
  events: QueryEvent[];
}

function isExpectedDataTransportObject(value: unknown): value is ExpectedDataTransportObject {
  return typeof value === "object" && value !== null && "rehydrate" in value && "events" in value && Array.isArray(value.events);
}

/**
 * > This export is only available in React Client Components
 *
 * A version of `ApolloProvider` to be used with the Next.js App Router.
 *
 * As opposed to the normal `ApolloProvider`, this version does not require a `client` prop,
 * but requires a `makeClient` prop instead.
 *
 * Use this component together with `ApolloClient` and `InMemoryCache`
 * from the `"@apollo/client-integration-nextjs"` package
 * to make an ApolloClient instance available to your Client Component hooks in the
 * Next.js App Router.
 *
 * @example
 * `app/ApolloWrapper.jsx`
 * ```tsx
 * import { HttpLink } from "@apollo/client";
 * import { ApolloNextAppProvider, ApolloClient, InMemoryCache } from "@apollo/client-integration-nextjs";
 *
 * function makeClient() {
 *   const httpLink = new HttpLink({
 *     uri: "https://example.com/api/graphql",
 *   });
 *
 *   return new ApolloClient({
 *     cache: new InMemoryCache(),
 *     link: httpLink,
 *   });
 * }
 *
 * export function ApolloWrapper({ children }: React.PropsWithChildren) {
 *   return (
 *     <ApolloNextAppProvider makeClient={makeClient}>
 *       {children}
 *     </ApolloNextAppProvider>
 *   );
 * }
 * ```
 *
 * @public
 */
// eslint-disable-next-line babel/new-cap
export const ApolloNextAppProvider = WrapApolloProvider(
  buildManualDataTransport({
    useInsertHtml() {
      const insertHtml = useContext(ServerInsertedHTMLContext);
      if (!insertHtml) {
        if (process.env.REACT_ENV === "browser") {
          //Allow using the browser build of ApolloNextAppProvider outside of Next.js, e.g. for tests.
          return () => {};
        }
        throw new Error(
          "The SSR build of ApolloNextAppProvider cannot be used outside of the Next App Router!\n" +
            'If you encounter this in a test, make sure that your tests are using the browser build by adding the "browser" import condition to your test setup.'
        );
      }
      return insertHtml;
    },
    stringifyForStream(value) {
      if (!isExpectedDataTransportObject(value)) {
        return defaultTransportStringify(value);
      }

      const { rehydrate, events } = value;

      // TODO: figure out if there's a lower-overhead way to do this
      // The current implementation adds roughly an additional 15ms to streaming larger post pages,
      // mostly from the overhead of stringifying all of the graphql data twice instead of once.

      const dataFromEvents = events
        .filter(event => event.type === 'next')
        .map(event => [event.id, event.value.data] as const)
        .filter((event): event is [QueryEvent['id'], Record<string, any>] => !!event[1]);

      const keyedData = keyBy(dataFromEvents, ([_, data]) => defaultTransportStringify(data));

      const sharedValues = Object.values(rehydrate)
        .map(rehydrateWrapper => (rehydrateWrapper as AnyBecauseHard).data)
        .filter(rehydrateData => !!rehydrateData)
        .map(rehydrateData => {
          const stringifiedData = defaultTransportStringify(rehydrateData);
          const transportIdDataTuple = keyedData[stringifiedData];
          return { stringifiedData, transportIdDataTuple };
        })
        .filter(({ transportIdDataTuple }) => !!transportIdDataTuple);

      if (sharedValues.length === 0) {
        const stringifiedObject = defaultTransportStringify(value);
        return stringifiedObject;
      }

      const sharedValueMap = Object.fromEntries(sharedValues.map((sharedValue) => sharedValue.transportIdDataTuple));

      const sharedValueMapDeclaration = `const sharedValueMap = ${defaultTransportStringify(sharedValueMap)};`;
      let stringifiedRehydrate = defaultTransportStringify(rehydrate);
      let stringifiedEvents = defaultTransportStringify(events);

      for (let sharedValue of sharedValues) {
        stringifiedRehydrate = stringifiedRehydrate.replaceAll(sharedValue.stringifiedData, `sharedValueMap['${sharedValue.transportIdDataTuple[0]}']`);
        stringifiedEvents = stringifiedEvents.replaceAll(sharedValue.stringifiedData, `sharedValueMap['${sharedValue.transportIdDataTuple[0]}']`);
      }

      const rehydrateDeclaration = `const rehydrate = ${stringifiedRehydrate};`;
      const eventsDeclaration = `const events = ${stringifiedEvents};`;

      return `(function(){${sharedValueMapDeclaration}\n${rehydrateDeclaration}\n${eventsDeclaration}\nreturn {rehydrate,events}})()`;
    }
  })
);

ApolloNextAppProvider.info = {
  pkg: "@apollo/client-integration-nextjs",
  client: "ApolloClient",
  cache: "InMemoryCache",
} as AnyBecauseHard;

