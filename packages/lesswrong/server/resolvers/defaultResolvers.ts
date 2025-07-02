import { getMultiResolverName, getSingleResolverName } from "@/lib/crud/utils";
import { collectionNameToTypeName } from "@/lib/generated/collectionTypeNames";
import { isEAForum, maxAllowedApiSkip } from "@/lib/instanceSettings";
import { asyncFilter } from "@/lib/utils/asyncUtils";
import { logGroupConstructor, loggerConstructor } from "@/lib/utils/logging";
import { describeTerms, viewTermsToQuery } from "@/lib/utils/viewUtils";
import { Pluralize } from "@/lib/vulcan-lib/pluralize";
import { CamelCaseify, convertDocumentIdToIdInSelector } from "@/lib/vulcan-lib/utils";
import { restrictViewableFieldsMultiple, restrictViewableFieldsSingle } from '@/lib/vulcan-users/restrictViewableFields';
import SelectFragmentQuery from "@/server/sql/SelectFragmentQuery";
import { throwError } from "@/server/vulcan-lib/errors";
import { captureException } from "@sentry/core";
import { Kind, print, type FieldNode, type FragmentDefinitionNode, type GraphQLResolveInfo } from "graphql";
import isEqual from "lodash/isEqual";
import { getCollectionAccessFilter } from "../permissions/accessFilters";
import { getSqlClientOrThrow } from "../sql/sqlClient";
import { CollectionViewSet } from "@/lib/views/collectionViewSet";
import UserActivities from "../collections/useractivities/collection";
import { visitorGetsDynamicFrontpage } from "@/lib/betas";
import { getWithCustomLoader } from "@/lib/loaders";


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
    kind: Kind.FRAGMENT_DEFINITION,
    name: {
      kind: Kind.NAME,
      value: fieldName,
    },
    typeCondition: {
      kind: Kind.NAMED_TYPE,
      name: {
        kind: Kind.NAME,
        value: typeName,
      },
    },
    selectionSet: {
      kind: Kind.SELECTION_SET,
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

type DefaultSingleResolverHandler<N extends CollectionNameString> = {
  [k in N as `${CamelCaseify<typeof collectionNameToTypeName[k]>}`]: (_root: void, { input }: { input: AnyBecauseTodo; }, context: ResolverContext, info: GraphQLResolveInfo) => Promise<{ result: Partial<ObjectsByCollectionName[N]> | null; }>
};

type DefaultMultiResolverHandler<N extends CollectionNameString> = {
  [k in N as `${CamelCaseify<Pluralize<typeof collectionNameToTypeName[k]>>}`]: (_root: void, { input }: { input: AnyBecauseTodo; }, context: ResolverContext, info: GraphQLResolveInfo) => Promise<{ results: Partial<ObjectsByCollectionName[N]>[]; totalCount: number; }>
};

export const getDefaultResolvers = <N extends CollectionNameString>(
  collectionName: N,
  viewSet: CollectionViewSet<N, Record<string, ViewFunction<N>>>,
): DefaultSingleResolverHandler<N> & DefaultMultiResolverHandler<N> => {
  type T = ObjectsByCollectionName[N];
  const typeName = collectionNameToTypeName[collectionName];

  const multiResolver = async (
    root: void,
    args: {
      input?: {
        terms: ViewTermsBase & Record<string, unknown>,
        enableTotal?: boolean,
        resolverArgs?: Record<string, unknown>,
      },
      selector?: Record<string, Omit<ViewTermsBase, 'view'> & Record<string, unknown>>,
      limit?: number,
      offset?: number,
      enableTotal?: boolean,
      [resolverArgKeys: string]: unknown
    },
    context: ResolverContext,
    info: GraphQLResolveInfo,
  ): Promise<{ results: Partial<T>[]; totalCount?: number }> => {
    const collection = context[collectionName] as PgCollection<N>;
    const { input, selector, limit, offset, enableTotal } = args ?? { input: {} };

    // We used to handle selector terms just using a generic "terms" object, but now we use a more structured approach
    // with multiple named views. This translates this new input format into the old one.
    const [selectorViewName, selectorViewTerms] = Object.entries(selector ?? {})?.[0] ?? [undefined, undefined];
    const selectorTerms = { view: selectorViewName === 'default' ? undefined : selectorViewName, ...selectorViewTerms } as ViewTermsBase & Record<string, unknown>;

    // Use the legacy input terms if `input` is provided; otherwise use the new selector terms
    // const { terms = selectorTerms, enableTotal = false } = input ?? {};
    const terms = input?.terms ?? { ...selectorTerms,
      limit: selectorTerms.limit ?? limit,
      offset: selectorTerms.offset ?? offset,
    };
    const logger = loggerConstructor(`views-${collectionName.toLowerCase()}-${terms.view?.toLowerCase() ?? 'default'}`)
    logger('multi resolver()')
    logger('multi terms', terms)

    const { input: _input, selector: _selector, ...otherQueryVariables } = info.variableValues;

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
    const conflictingKeys = Object.keys(otherQueryVariables).filter(termKey => {
      if (!termKeys.includes(termKey)) {
        return false;
      }

      return !isEqual(terms[termKey as keyof typeof terms], otherQueryVariables[termKey as keyof typeof otherQueryVariables]);
    });

    if (conflictingKeys.length) {
      captureException(`Got a ${collectionName} multi request with conflicting term and resolverArg keys: ${conflictingKeys.join(', ')}`);
      throwError({
        id: 'app.conflicting_term_and_resolver_arg_keys',
        data: { terms, otherQueryVariables, collectionName },
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

    // get currentUser and Users collection from context
    const { currentUser }: {currentUser: DbUser|null} = context;
    
    // HACK: If this is a post query, the default view sometimes uses
    // `context.visitorActivity`, to adjust the time-decay constant, but it isn't
    // async so can't await the required DB fetch. So if this is a query on the
    // Posts collection, add that to the context now.
    // (This was previously in computeContextFromUser, which was much more
    // costly since it adds a DB roundtrip to the start of every request.)
    if (collectionName === "Posts" && !('visitorActivity' in context)) {
      context.visitorActivity = await getWithCustomLoader(context, "visitorActivityLoader", "_",
        async () => [await getUserActivity(currentUser, context.clientId)]
      );
    }

    // Get selector and options from terms and perform Mongo query
    // Downcasts terms because there are collection-specific terms but this function isn't collection-specific
    // Also downcast the generic to avoid a very expensive but useless type inference that indexes over all view terms by collection
    const parameters = viewTermsToQuery<CollectionNameString>(viewSet, terms, {}, context);

    // get fragment from GraphQL AST
    const fragmentInfo = getFragmentInfo(info, "results", typeName);

    let fetchDocs: () => Promise<T[]>;
    if (fragmentInfo) {
      // Make a dynamic require here to avoid our circular dependency lint rule, since really by this point we should be fine
      const { getSqlFragment } = await import('../../lib/fragments/sqlFragments');
      const sqlFragment = getSqlFragment(fragmentInfo.fragmentName, fragmentInfo.fragmentText);
      const query = new SelectFragmentQuery(
        sqlFragment,
        currentUser,
        {...otherQueryVariables, ...terms},
        parameters.selector,
        parameters.syntheticFields,
        {
          comment: `${collectionName}::${terms.view}`,
          ...parameters.options,
          skip: terms.offset,
        },
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

    // Were there enough results to reach the limit specified in the query?
    const saturated = parameters.options.limit && docs.length>=parameters.options.limit;

    // if collection has a checkAccess function defined, remove any documents that doesn't pass the check
    const checkAccess = getCollectionAccessFilter(collectionName);
    const viewableDocs: T[] = checkAccess
      ? await asyncFilter(docs, async (doc: T) => await checkAccess(currentUser, doc as AnyBecauseHard, context))
      : docs;

    // take the remaining documents and remove any fields that shouldn't be accessible
    const restrictedDocs = await restrictViewableFieldsMultiple(currentUser, collection, viewableDocs);

    // prime the cache
    restrictedDocs.forEach((doc: AnyBecauseTodo) => context.loaders[collectionName].prime(doc._id, doc));

    const data: { results: Partial<T>[]; totalCount?: number } = { results: restrictedDocs };

    if (enableTotal) {
      // get total count of documents matching the selector
      // TODO: Make this handle synthetic fields
      if (saturated) {
        data.totalCount = await collection.find(parameters.selector).count();
      } else {
        data.totalCount = viewableDocs.length;
      }
    }

    // return results
    return data;
  };

  const singleResolver = async (
    _root: void,
    { input = {}, selector, allowNull }: { input: AnyBecauseTodo, selector?: SelectorInput, allowNull?: boolean },
    context: ResolverContext,
    info: GraphQLResolveInfo,
  ) => {
    const collection = context[collectionName] as PgCollection<N>;
    const { input: _input, selector: _selector, ...otherQueryVariables } = info.variableValues;
    allowNull ??= input.allowNull ?? false;
    // In this context (for reasons I don't fully understand) selector is an object with a null prototype, i.e.
    // it has none of the methods you would usually associate with objects like `toString`. This causes various problems
    // down the line. See https://stackoverflow.com/questions/56298481/how-to-fix-object-null-prototype-title-product
    // So we copy it here to give it back those methoods
    const usedSelector = { ...(input.selector ?? selector ?? {}) };

    const logger = loggerConstructor(`resolvers-${collectionName.toLowerCase()}`)
    const {logGroupStart, logGroupEnd} = logGroupConstructor(`resolvers-${collectionName.toLowerCase()}`)
    logger('');
    logGroupStart(
      `--------------- start \x1b[35m${typeName} Single Resolver\x1b[0m ---------------`
    );
    logger(`Selector: ${JSON.stringify(usedSelector)}`);

    const { currentUser } = context;

    // useSingle allows passing in `_id` as `documentId`
    if (usedSelector.documentId) {
      usedSelector._id = usedSelector.documentId;
      delete usedSelector.documentId;
    }
    const documentId = usedSelector._id;

    // get fragment from GraphQL AST
    const fragmentInfo = getFragmentInfo(info, "result", typeName);

    let doc: ObjectsByCollectionName[N] | null;
    if (fragmentInfo) {
      // Make a dynamic require here to avoid our circular dependency lint rule, since really by this point we should be fine
      const { getSqlFragment } = await import('../../lib/fragments/sqlFragments');
      const sqlFragment = getSqlFragment(fragmentInfo.fragmentName, fragmentInfo.fragmentText);
      let query: SelectFragmentQuery;
      query = new SelectFragmentQuery(
        sqlFragment,
        currentUser,
        otherQueryVariables,
        usedSelector,
        undefined,
        {limit: 1},
      );
      const compiledQuery = query.compile();
      const db = getSqlClientOrThrow();
      doc = await db.oneOrNone(compiledQuery.sql, compiledQuery.args);
    } else {
      doc = await collection.findOne(convertDocumentIdToIdInSelector(usedSelector));
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

    const restrictedDoc = await restrictViewableFieldsSingle(currentUser, collection, doc);

    logGroupEnd();
    logger(`--------------- end \x1b[35m${typeName} Single Resolver\x1b[0m ---------------`);
    logger('');

    // filter out disallowed properties and return resulting document
    return { result: restrictedDoc };
  };

  const singleResolverName: CamelCaseify<typeof collectionNameToTypeName[N]> = getSingleResolverName(typeName);
  const multiResolverName: CamelCaseify<Pluralize<typeof collectionNameToTypeName[N]>> = getMultiResolverName(typeName);

  return {
    [singleResolverName]: singleResolver,
    [multiResolverName]: multiResolver,
  } as DefaultSingleResolverHandler<N> & DefaultMultiResolverHandler<N>;
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

async function getUserActivity(user: DbUser|null, clientId: string|null): Promise<DbUserActivity|null> {
  if ((user || clientId) && (isEAForum || visitorGetsDynamicFrontpage(user))) {
    if (user) {
      return await UserActivities.findOne({visitorId: user._id, type: 'userId'});
    } else if (clientId) {
      return await UserActivities.findOne({visitorId: clientId, type: 'clientId'});
    }
  }
  return null;
}
