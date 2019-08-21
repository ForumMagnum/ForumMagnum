import { Utils } from 'meteor/vulcan:lib';

export const getMultiQueryName = (typeName) => `multi${typeName}Query`;
export const getMultiResolverName = (typeName) => Utils.camelCaseify(Utils.pluralize(typeName));
export const getCreateMutationName = (typeName) => `create${typeName}`;
export const getUpdateMutationName = (typeName) => `update${typeName}`;
export const getDeleteMutationName = (typeName) => `delete${typeName}`;
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
