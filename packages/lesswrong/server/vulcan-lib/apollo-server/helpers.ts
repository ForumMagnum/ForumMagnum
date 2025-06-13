import { ACCESS_FILTERED, accessFilterMultiple, accessFilterSingle } from "@/lib/utils/schemaUtils";
import { UpdateSelector, convertDocumentIdToIdInSelector } from "@/lib/vulcan-lib/utils";
import isEmpty from "lodash/isEmpty";
import { throwError } from "../errors";
import { validateData, validateDocument } from "../validation";
import { getPreviewDocument } from "../mutators";
import { createError } from "apollo-errors";
import { collectionNameToTypeName, typeNameToCollectionName } from "@/lib/generated/collectionTypeNames";
import { GraphQLScalarType } from "graphql";
import { userCanReadField } from '@/lib/vulcan-users/permissions';
import { isGraphQLField } from "./graphqlTemplates";

interface CreateMutationOptions<D, T extends DbObject, R extends { [ACCESS_FILTERED]: true } | null = { [ACCESS_FILTERED]: true } | null> {
  newCheck: (user: DbUser | null, document: D | null, context: ResolverContext) => Promise<boolean> | boolean,
  accessFilter: (rawResult: T, context: ResolverContext) => Promise<R>,
}

interface UpdateMutationOptions<T extends DbObject, R extends { [ACCESS_FILTERED]: true } | null = { [ACCESS_FILTERED]: true } | null> {
  editCheck: (user: DbUser | null, document: T, context: ResolverContext, previewDocument: T) => Promise<boolean> | boolean,
  accessFilter: (rawResult: T, context: ResolverContext) => Promise<R>,
}

export function makeGqlCreateMutation<
  N extends CollectionNameString,
  D extends {},
  T extends (args: { data: D }, context: ResolverContext) => Promise<any>,
  O extends CreateMutationOptions<D, Awaited<ReturnType<T>>, R>,
  R extends { [ACCESS_FILTERED]: true } | null
>(collectionName: N, func: T, options: O) {
  return async (root: void, args: Parameters<T>[0], context: ResolverContext): Promise<{ data: Awaited<ReturnType<O['accessFilter']>> }> => {
    const { newCheck, accessFilter } = options;
    if (!(await newCheck(context.currentUser, args.data, context))) {
      throwError({ id: 'app.operation_not_allowed' });
    }

    const validationErrors = validateDocument(args.data, collectionName, context);
    if (validationErrors.length) {
      throwError({ id: 'app.validation_error', data: { break: true, errors: validationErrors } });
    }

    const rawResult = await func(args, context);
    const filteredResult = await accessFilter(rawResult, context);
    return { data: filteredResult as Awaited<ReturnType<O['accessFilter']>> };
  };
}

function getDocumentId(selector: SelectorInput | string) {
  if (typeof selector === 'string') {
    return selector;
  }

  if (isEmpty(selector)) {
    throw new Error('Selector cannot be empty');
  }

  return convertDocumentIdToIdInSelector(selector as UpdateSelector)._id;
}

// Historically we allowed update selectors shaped like { _id: string | null, documentId: string | null }
// Moving forward, it'd be nice to allow string (_id) selectors.
type UpdateFunc<N extends CollectionNameString, D extends CreateInputsByCollectionName[N]['data']> = 
  | ((args: { selector: SelectorInput, data: D }, context: ResolverContext) => Promise<any>)
  | ((args: { selector: string, data: D }, context: ResolverContext) => Promise<any>);

  export function makeGqlUpdateMutation<
  N extends CollectionNameString,
  D extends CreateInputsByCollectionName[N]['data'],
  T extends UpdateFunc<N, D>,
  O extends UpdateMutationOptions<ObjectsByCollectionName[N], R>,
  R extends { [ACCESS_FILTERED]: true } | null
>(collectionName: N, func: T, options: O): (root: void, args: Parameters<T>[0], context: ResolverContext) => Promise<{ data: Awaited<ReturnType<O['accessFilter']>> }> {
  return async (root: void, args: Parameters<T>[0], context: ResolverContext): Promise<{ data: Awaited<ReturnType<O['accessFilter']>> }> => {
    const { editCheck, accessFilter } = options;
    const { loaders, currentUser } = context;
    const { selector, data } = args;

    if (isEmpty(selector)) {
      throw new Error('Selector cannot be empty');
    }

    // get entire unmodified document from database
    const id = getDocumentId(selector);
    const oldDocument = await loaders[collectionName].load(id);

    if (!oldDocument) {
      throwError({ id: 'app.document_not_found', data: { documentId: id } });
    }

    const previewDocument = getPreviewDocument(data, oldDocument);

    if (!(await editCheck(currentUser, oldDocument, context, previewDocument))) {
      throwError({ id: 'app.operation_not_allowed', data: { documentId: id } });
    }

    const validationErrors = validateData<N>(data, previewDocument, collectionName, context);
    if (validationErrors.length) {
      const ValidationError = createError('app.validation_error', { message: JSON.stringify(validationErrors) });
      throw new ValidationError({ data: { break: true, errors: validationErrors } });
    }
    
    // Unfortunately, because `func` is a union type, the first argument it accepts turns into an intersection,
    // so we can't actually satisify it properly.  In practice, this ends up working correctly because the function
    // we return is correct constrained to accept the same element of the union as the one we pass in.
    // (Though even that doesn't _really_ matter, since we aren't constraining this output to match up to the
    // function type that the mutation resolver needs to have, so we could theoretically get some completely
    // random input and have no way of knowing it.)
    const rawResult = await func(args as AnyBecauseHard, context);
    const filteredResult = await accessFilter(rawResult, context);
    return { data: filteredResult as Awaited<ReturnType<O['accessFilter']>> };
  };
}

// get GraphQL type for a given schema and field name
function getGraphQLType<N extends CollectionNameString>(
  graphql: GraphQLFieldSpecification<N>,
  isInput = false,
) {
  if (isInput && 'inputType' in graphql && graphql.inputType) {
    return graphql.inputType;
  }

  return graphql.outputType;
};

/**
 * Get the data needed to apply an access filter based on a graphql resolver
 * return type.
 */
function getSqlResolverPermissionsData(type: string | GraphQLScalarType) {
  // We only have access filters for return types that correspond to a collection.
  if (typeof type !== "string") {
    return null;
  }

  // We need to use a multi access filter for arrays, or a single access filter
  // otherwise. We only apply the automatic filter for single dimensional arrays.
  const isArray = type.indexOf("[") === 0 && type.lastIndexOf("[") === 0;

  // Remove all "!"s (denoting nullability) and any array brackets to leave behind
  // a type name string.
  const nullableScalarType = type.replace(/[![\]]+/g, "");

  try {
    // Get the collection corresponding to the type name string.
    const collectionName = nullableScalarType in typeNameToCollectionName
      ? typeNameToCollectionName[nullableScalarType as keyof typeof typeNameToCollectionName]
      : null;

    return collectionName ? {collectionName, isArray} : null;
  } catch (_e) {
    return null;
  }
}

function isGraphQLResolverField<N extends CollectionNameString>(field: [string, GraphQLFieldSpecification<N> | undefined]): field is [string, GraphQLFieldSpecification<N> & { resolver: Exclude<GraphQLFieldSpecification<N>['resolver'], undefined> }] {
  return isGraphQLField(field) && !!field[1].resolver;
}

export function getFieldGqlResolvers<N extends CollectionNameString, S extends SchemaType<N>>(collectionName: N, schema: S) {
  const typeName = collectionNameToTypeName[collectionName];
  const collectionFieldResolvers = Object.fromEntries(Object.entries(schema)
    .map(([fieldName, field]) => [fieldName, field.graphql])
    .filter(isGraphQLResolverField)
    .map(([fieldName, graphql]) => {
      const fieldType = getGraphQLType(graphql);
      const permissionData = getSqlResolverPermissionsData(fieldType);
      const fieldResolver = (document: ObjectsByCollectionName[N], args: any, context: ResolverContext) => {
        // Check that current user has permission to access the original
        // non-resolved field.
        if (!userCanReadField(context.currentUser, graphql.canRead, document)) {
          return null;
        }

        // First, check if the value was already fetched by a SQL resolver.
        // A field with a SQL resolver that returns no value (for instance,
        // if it uses a LEFT JOIN and no matching object is found) can be
        // distinguished from a field with no SQL resolver as the former
        // will be `null` and the latter will be `undefined`.
        if (graphql.sqlResolver) {
          const typedName = fieldName as keyof ObjectsByCollectionName[N];
          let existingValue = document[typedName];
          if (existingValue !== undefined) {
            const {sqlPostProcess} = graphql;
            if (sqlPostProcess) {
              existingValue = sqlPostProcess(existingValue, document, context);
            }
            if (permissionData) {
              const filter = permissionData.isArray
                ? accessFilterMultiple
                : accessFilterSingle;
              return filter(
                context.currentUser,
                permissionData.collectionName,
                existingValue as AnyBecauseHard,
                context,
              );
            }
            return existingValue;
          }
        }

        // If the value wasn't supplied by a SQL resolver then we need
        // to run the code resolver instead.
        return graphql.resolver!(document, args, context);
      };

      return [fieldName, fieldResolver];
    }));

  if (Object.keys(collectionFieldResolvers).length === 0) {
    return {};
  }

  return { [typeName]: collectionFieldResolvers };
}
