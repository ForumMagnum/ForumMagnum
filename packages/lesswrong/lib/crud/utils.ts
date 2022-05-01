import { camelCaseify, pluralize } from '../vulcan-lib';
import * as _ from 'underscore';

export const getMultiQueryName = (typeName: string) => `multi${typeName}Query`;
export const getMultiResolverName = (typeName: string) => camelCaseify(pluralize(typeName));
export const getCreateMutationName = (typeName: string) => `create${typeName}`;
export const getUpdateMutationName = (typeName: string) => `update${typeName}`;
export const getDeleteMutationName = (typeName: string) => `delete${typeName}`;
export function getQueryName(query) {
  if (query.kind !== "Document") {
    return null;
  }

  if (query.definitions.length > 0) {
    const operation = query.definitions.find(definition => {
      return definition.kind === "OperationDefinition";
    });

    if (operation && operation.name) {
      return operation.name.value;
    }
  }

  return null;
}

export const findWatchesByTypeName = (watches, typeName) => {
  return watches.filter((watch) => {
    const name = getQueryName(watch.query)
    const multiQueryName = getMultiQueryName(typeName);
    return name === multiQueryName
  })
}

export const getExtraVariables = (props, extraVariables) => {
  return _.pick(props || {}, Object.keys(extraVariables || {}))
}
