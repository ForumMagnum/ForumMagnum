import type { ApolloCache } from '@apollo/client';
import * as _ from 'underscore';
import { camelCaseify } from "../vulcan-lib/utils";
import { pluralize } from "../vulcan-lib/pluralize";

export const getMultiQueryName = (typeName: string) => `multi${typeName}Query`;
export const getSingleResolverName = (typeName: string) => camelCaseify(typeName);
export const getMultiResolverName = (typeName: string) => camelCaseify(pluralize(typeName));
export const getCreateMutationName = (typeName: string) => `create${typeName}`;
export const getUpdateMutationName = (typeName: string) => `update${typeName}`;
export const getDeleteMutationName = (typeName: string) => `delete${typeName}`;

/**
 * Given a parsed graphql query found inside Apollo's internals, get the name
 * of the first top-level resolver in that query.
 */
function getQueryName(query: any) {
  if (query.kind !== "Document") {
    return null;
  }

  if (query.definitions.length > 0) {
    const operation = query.definitions.find((definition: any) => {
      return definition.kind === "OperationDefinition";
    });

    if (operation && operation.name) {
      return operation.name.value;
    }
  }

  return null;
}

/**
 * Look inside the apollo-client cache for useMulti resolvers on the collection
 * corresponding to the given typeName. This abuses private apollo-client APIs,
 * and runs client-side only.
 */
export const findWatchesByTypeName = (store: ApolloCache<any>, typeName: string) => {
  // Use a private variable on ApolloCache to cover an API hole (no good way to
  // do this directly, though upgrading apollo-client maybe adds functions that
  // offer a more elegant solution.)
  //FIXME likely to be trouble if/when we upgrade apollo-client
  const watches = Array.from((store as any).watches);
  
  return watches.filter((watch: any) => {
    const name = getQueryName(watch.query)
    const multiQueryName = getMultiQueryName(typeName);
    return name === multiQueryName
  })
}

/**
 * Extract `extraVariables` (fed to resolvers where referenced in fragments)
 * from options passed to an HoC mutation. Obsolete-ish since we've almost
 * fully gotten rid of HoCs in this context, but may be needed by the few HoC
 * mutation usages still hanging on.
 */
export const getExtraVariables = (props: any, extraVariables: any) => {
  return _.pick(props || {}, Object.keys(extraVariables || {}))
}
