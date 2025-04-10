import { throwError } from "@/server/vulcan-lib/errors";
import { logGroupConstructor, loggerConstructor } from "@/lib/utils/logging";
import { maxAllowedApiSkip } from "@/lib/instanceSettings";
import { restrictViewableFieldsMultiple, restrictViewableFieldsSingle } from "@/lib/vulcan-users/permissions.ts";
import { asyncFilter } from "@/lib/utils/asyncUtils";
import { getSqlClientOrThrow } from "../sql/sqlClient";
import { describeTerms, viewTermsToQuery } from "@/lib/utils/viewUtils";
import SelectFragmentQuery from "@/server/sql/SelectFragmentQuery";
import { captureException } from "@sentry/core";
import isEqual from "lodash/isEqual";
import { collectionNameToGraphQLType } from "@/lib/vulcan-lib/collections.ts";
import { convertDocumentIdToIdInSelector } from "@/lib/vulcan-lib/utils.ts";
import { getCollectionAccessFilter } from "../permissions/accessFilters";
import { print, type FieldNode, type FragmentDefinitionNode, type GraphQLResolveInfo } from "graphql";

export interface DefaultResolverOptions {
  cacheMaxAge: number
}

const defaultOptions: DefaultResolverOptions = {
  cacheMaxAge: 300,
};

const getFragmentInfo = ({ fieldName, fieldNodes, fragments }: GraphQLResolveInfo, resultFieldName: string, typeName: string) => {
  const query = fieldNodes.find(
    ({ name: { value } }) => value === fieldName,
  );
  const mainSelections = query?.selectionSet?.selections;
  const results = mainSelections?.find(
    (node): node is FieldNode => node.kind === "Field" && node.name.value === resultFieldName,
  );

  if (!results || !results.selectionSet) {
    return;
  }

  const resultSelections = results.selectionSet.selections;

  // We construct an implicit fragment using whatever selections were in the result/results field
  // because because we need to handle the possibility of fields directly selected from the root
  // rather than being nested inside a subfragment.
  const implicitFragment: FragmentDefinitionNode = {
    kind: 'FragmentDefinition',
    name: {
      kind: 'Name',
      value: fieldName,
    },
    typeCondition: {
      kind: 'NamedType',
      name: {
        kind: 'Name',
        value: typeName,
      },
    },
    selectionSet: {
      kind: 'SelectionSet',
      selections: resultSelections,
    },
  };

  const fragmentsWithImplicitFragment = [implicitFragment, ...Object.values(fragments)];
  // TODO: at some point, would be good to switch to just returning AST nodes and parsing those in SqlFragment directly
  // since we're doing a bunch of hacky regex parsing over there
  const fragmentText = fragmentsWithImplicitFragment.map(print).join('\n\n');
  return {
    fragmentText,
    fragmentName: fieldName,
  };
};

export const getDefaultResolvers = <N extends CollectionNameString>(
  collectionName: N, 
  collectionOptions?: Partial<DefaultResolverOptions>,
) => {
  type T = ObjectsByCollectionName[N];
  const resolverOptions = {...defaultOptions, ...collectionOptions};
  const typeName = collectionNameToGraphQLType(collectionName);

  const multiResolver = async (
    root: void,
    args: {
      input?: {
        terms: ViewTermsBase & Record<string, unknown>,
        enableCache?: boolean,
        enableTotal?: boolean,
        createIfMissing?: Partial<T>,
        resolverArgs?: Record<string, unknown>
      },
      [resolverArgKeys: string]: unknown
    },
    context: ResolverContext,
    info: GraphQLResolveInfo,
  ) => {
    const collection = context[collectionName] as CollectionBase<N>;
    // const startResolve = Date.now()
    const { input } = args ?? { input: {} };
    const { terms = {}, enableCache = false, enableTotal = false, createIfMissing, resolverArgs = {} } = input ?? {};
    const logger = loggerConstructor(`views-${collectionName.toLowerCase()}-${terms.view?.toLowerCase() ?? 'default'}`)
    logger('multi resolver()')
    logger('multi terms', terms)

    // Terms and resolverArgs are both passed into the `SelectFragmentQuery` in the same place,
    // so if we have any overlapping keys, they need to have the same value or we're probably doing something wrong by having one clobber the other.
    //
    // Historically I don't think this was technically required, since resolverArgs were just the extraVariableValues
    // that got passed down to various resolver field variable arguments, and you could imagine constructing some situation
    // where e.g. you might have a tagId in the terms which could sensibly have a different value from a `tagId` resolver argument
    // (say, if we had some feature that did something with the relationship between two tags).
    //
    // In practice, resolver field variable args are rarely used and there's pretty much always going to be a way to avoid conflict (i.e. renaming them).
    //
    // We continue to permit overlapping keys as long as they have the same value because there's a few tag-related pieces of code that do that
    // and it'd be a headache to refactor them right now.  But we probably ought to clean that up at some point.
    const termKeys = Object.keys(terms);
    const conflictingKeys = Object.keys(resolverArgs).filter(termKey => {
      if (!termKeys.includes(termKey)) {
        return false;
      }

      return !isEqual(terms[termKey], resolverArgs[termKey]);
    });

    if (conflictingKeys.length) {
      captureException(`Got a ${collectionName} multi request with conflicting term and resolverArg keys: ${conflictingKeys.join(', ')}`);
      throwError({
        id: 'app.conflicting_term_and_resolver_arg_keys',
        data: { terms, resolverArgs, collectionName },
      });
    }

    // Don't allow API requests with an arbitrarily large offset. This
    // prevents some extremely-slow queries.
    const maxAllowedSkip = maxAllowedApiSkip.get();
    if (
      terms.offset &&
      maxAllowedSkip !== null &&
      terms.offset > maxAllowedSkip
    ) {
      throw new Error("Exceeded maximum value for skip");
    }

    const {cacheControl} = info;
    if (cacheControl && enableCache) {
      const maxAge = resolverOptions.cacheMaxAge || defaultOptions.cacheMaxAge;
      cacheControl.setCacheHint({ maxAge });
    }

    // get currentUser and Users collection from context
    const { currentUser }: {currentUser: DbUser|null} = context;

    // Get selector and options from terms and perform Mongo query
    // Downcasts terms because there are collection-specific terms but this function isn't collection-specific
    const parameters = viewTermsToQuery(collectionName, terms, {}, context);

    // get fragment from GraphQL AST
    const fragmentInfo = getFragmentInfo(info, "results", typeName);

    let fetchDocs: () => Promise<T[]>;
    if (fragmentInfo) {
      // Make a dynamic require here to avoid our circular dependency lint rule, since really by this point we should be fine
      const getSqlFragment: typeof import('../../lib/fragments/allFragments').getSqlFragment = require('../../lib/fragments/allFragments').getSqlFragment;
      const sqlFragment = getSqlFragment(fragmentInfo.fragmentName, fragmentInfo.fragmentText);
      const query = new SelectFragmentQuery(
        sqlFragment,
        currentUser,
        {...resolverArgs, ...terms},
        parameters.selector,
        parameters.syntheticFields,
        parameters.options,
      );
      const compiledQuery = query.compile();
      const db = getSqlClientOrThrow();
      fetchDocs = () => db.any(compiledQuery.sql, compiledQuery.args);
    } else {
      fetchDocs = () => performQueryFromViewParameters(
        collection,
        terms,
        parameters,
      );
    }
    let docs = await fetchDocs();
    // Create a doc if none exist, using the actual create mutation to ensure permission checks are run correctly
    if (createIfMissing && docs.length === 0) {
      await collection.options.mutations?.create?.mutation(root, {data: createIfMissing}, context)
      docs = await fetchDocs();
    }

    // Were there enough results to reach the limit specified in the query?
    const saturated = parameters.options.limit && docs.length>=parameters.options.limit;

    // if collection has a checkAccess function defined, remove any documents that doesn't pass the check
    const checkAccess = getCollectionAccessFilter(collectionName);
    const viewableDocs: T[] = checkAccess
      ? await asyncFilter(docs, async (doc: T) => await checkAccess(currentUser, doc as AnyBecauseHard, context))
      : docs;

    // take the remaining documents and remove any fields that shouldn't be accessible
    const restrictedDocs = restrictViewableFieldsMultiple(currentUser, collectionName, viewableDocs);

    // prime the cache
    restrictedDocs.forEach((doc: AnyBecauseTodo) => context.loaders[collectionName].prime(doc._id, doc));

    const data: any = { results: restrictedDocs };

    if (enableTotal) {
      // get total count of documents matching the selector
      // TODO: Make this handle synthetic fields
      if (saturated) {
        data.totalCount = await collection.find(parameters.selector).count();
      } else {
        data.totalCount = viewableDocs.length;
      }
    }

    // const timeElapsed = Date.now() - startResolve;
    // Temporarily disabled to investigate performance issues
    // captureEvent("resolveMultiCompleted", {documentIds: restrictedDocs.map((d: DbObject) => d._id), collectionName, timeElapsed, terms}, true);
    // return results
    return data;
  };

  const singleResolver = async (
    _root: void,
    {input = {}}: {input: AnyBecauseTodo},
    context: ResolverContext,
    info: GraphQLResolveInfo,
  ) => {
    const collection = context[collectionName] as CollectionBase<N>;
    // const startResolve = Date.now();
    const {enableCache = false, allowNull = false, resolverArgs} = input;
    // In this context (for reasons I don't fully understand) selector is an object with a null prototype, i.e.
    // it has none of the methods you would usually associate with objects like `toString`. This causes various problems
    // down the line. See https://stackoverflow.com/questions/56298481/how-to-fix-object-null-prototype-title-product
    // So we copy it here to give it back those methoods
    const selector = {...(input.selector || {})}

    const logger = loggerConstructor(`resolvers-${collectionName.toLowerCase()}`)
    const {logGroupStart, logGroupEnd} = logGroupConstructor(`resolvers-${collectionName.toLowerCase()}`)
    logger('');
    logGroupStart(
      `--------------- start \x1b[35m${typeName} Single Resolver\x1b[0m ---------------`
    );
    logger(`Options: ${JSON.stringify(resolverOptions)}`);
    logger(`Selector: ${JSON.stringify(selector)}`);

    const {cacheControl} = info;
    if (cacheControl && enableCache) {
      const maxAge = resolverOptions.cacheMaxAge || defaultOptions.cacheMaxAge;
      cacheControl.setCacheHint({ maxAge });
    }

    const { currentUser }: {currentUser: DbUser|null} = context;

    // useSingle allows passing in `_id` as `documentId`
    if (selector.documentId) {
      selector._id = selector.documentId;
      delete selector.documentId;
    }
    const documentId = selector._id;

    // get fragment from GraphQL AST
    const fragmentInfo = getFragmentInfo(info, "result", typeName);

    let doc: ObjectsByCollectionName[N] | null;
    if (fragmentInfo) {
      // Make a dynamic require here to avoid our circular dependency lint rule, since really by this point we should be fine
      const getSqlFragment: typeof import('../../lib/fragments/allFragments').getSqlFragment = require('../../lib/fragments/allFragments').getSqlFragment;
      const sqlFragment = getSqlFragment(fragmentInfo.fragmentName, fragmentInfo.fragmentText);
      const query = new SelectFragmentQuery(
        sqlFragment,
        currentUser,
        resolverArgs,
        selector,
        undefined,
        {limit: 1},
      );
      const compiledQuery = query.compile();
      const db = getSqlClientOrThrow();
      doc = await db.oneOrNone(compiledQuery.sql, compiledQuery.args);
    } else {
      doc = await collection.findOne(convertDocumentIdToIdInSelector(selector));
    }

    if (!doc) {
      if (allowNull) {
        return { result: null };
      } else {
        throwError({
          id: 'app.missing_document',
          data: { documentId, selector, collectionName: collection.collectionName },
        });
      }
    }

    // if collection has a checkAccess function defined, use it to perform a check on the current document
    // (will throw an error if check doesn't pass)
    const checkAccess = getCollectionAccessFilter(collectionName);
    if (checkAccess) {
      const reasonDenied: {reason?: string} = {reason: undefined};
      const canAccess = await checkAccess(currentUser, doc as AnyBecauseHard, context, reasonDenied)
      if (!canAccess) {
        if (reasonDenied.reason) {
          throwError({
            id: reasonDenied.reason,
          });
        } else {
          throwError({
            id: 'app.operation_not_allowed',
            data: {documentId, operationName: `${typeName}.read.single`}
          });
        }
      }
    }

    const restrictedDoc = restrictViewableFieldsSingle(currentUser, collection.collectionName, doc);

    logGroupEnd();
    logger(`--------------- end \x1b[35m${typeName} Single Resolver\x1b[0m ---------------`);
    logger('');

    // const timeElapsed = Date.now() - startResolve;
    // Temporarily disabled to investigate performance issues
    // captureEvent("resolveSingleCompleted", {documentId: restrictedDoc._id, collectionName, timeElapsed}, true);

    // filter out disallowed properties and return resulting document
    return { result: restrictedDoc };
  };

  return {
    single: {
      description: `A single ${typeName} document fetched by ID or slug`,
      resolver: singleResolver,
    },
    multi: {
      description: `A list of ${typeName} documents matching a set of query terms`,
      resolver: multiResolver,
    },
  }
};

export const performQueryFromViewParameters = async <N extends CollectionNameString>(
  collection: CollectionBase<N>,
  terms: ViewTermsBase,
  parameters: AnyBecauseTodo,
): Promise<ObjectsByCollectionName[N][]> => {
  const logger = loggerConstructor(`views-${collection.collectionName.toLowerCase()}`)
  const selector = parameters.selector;
  const description = describeTerms(collection.collectionName, terms);

  const options: MongoFindOptions<ObjectsByCollectionName[N]> = {
    ...parameters.options,
    skip: terms.offset,
    comment: description
  };

  // I don't know if we ever get a `skip` value in `parameters.options`, but if we do, we've been running on that logic for years
  // So defer to that if it exists, instead of overriding it with the value from `terms.offset`
  parameters.options.skip ??= options.skip;

  if (parameters.syntheticFields && Object.keys(parameters.syntheticFields).length>0) {
    const pipeline = [
      // First stage: Filter by selector
      { $match: {
        ...selector,
        $comment: description,
      }},
      // Second stage: Add computed fields
      { $addFields: parameters.syntheticFields },

      // Third stage: Filter by computed fields (if applicable)
      ...(parameters.syntheticFieldSelector || []),

      // Fourth stage: Sort
      { $sort: parameters.options.sort },
    ];

    // Apply skip and limit (if applicable)
    if (parameters.options.skip) {
      pipeline.push({ $skip: parameters.options.skip });
    }
    if (parameters.options.limit) {
      pipeline.push({ $limit: parameters.options.limit });
    }
    logger('aggregation pipeline', pipeline);
    return await collection.aggregate(pipeline).toArray();
  } else {
    logger('performQueryFromViewParameters connector find', selector, terms, options);
    return await collection.find({
      ...selector,
    }, options).fetch();
  }
}
