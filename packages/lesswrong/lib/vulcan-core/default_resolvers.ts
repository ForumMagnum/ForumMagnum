import { Utils, getTypeName, getCollection } from '../vulcan-lib';
import { restrictViewableFieldsMultiple, restrictViewableFieldsSingle } from '../vulcan-users/permissions';
import { asyncFilter } from '../utils/asyncUtils';
import { loggerConstructor, logGroupConstructor } from '../utils/logging';
import { viewTermsToQuery } from '../utils/viewUtils';
import type { FieldNode, GraphQLResolveInfo } from 'graphql';
import { FragmentSpreadNode } from 'graphql';
import SelectFragmentQuery from '../sql/SelectFragmentQuery';
import { getSqlClientOrThrow } from '../sql/sqlClient';

interface DefaultResolverOptions {
  cacheMaxAge: number
}

const defaultOptions: DefaultResolverOptions = {
  cacheMaxAge: 300,
};

const getFragmentNameFromInfo = (
  {fieldName, fieldNodes}: GraphQLResolveInfo,
  resultFieldName: string,
) => {
  const query = fieldNodes.find(
    ({name: {value}}) => value === fieldName,
  );
  const mainSelections = query?.selectionSet?.selections;
  const results = mainSelections?.find(
    (node) => node.kind === "Field" && node.name.value === resultFieldName,
  ) as FieldNode | undefined;
  const resultSelections = results?.selectionSet?.selections;
  const fragmentSpread = resultSelections?.find(
    ({kind}) => kind === "FragmentSpread",
  ) as FragmentSpreadNode | undefined;
  const fragmentName = fragmentSpread?.name.value;
  if (!fragmentName) {
    throw new Error("Fragment name not found");
  }
  return fragmentName;
}

// Default resolvers. Provides `single` and `multi` resolvers, which power the
// useSingle and useMulti hooks.
export function getDefaultResolvers<N extends CollectionNameString>(
  collectionName: N,
  options?: Partial<DefaultResolverOptions>,
) {
  type T = ObjectsByCollectionName[N]
  const typeName = getTypeName(collectionName);
  const resolverOptions = {...defaultOptions, options};
  
  return {
    // resolver for returning a list of documents based on a set of query terms

    multi: {
      description: `A list of ${typeName} documents matching a set of query terms`,

      async resolver(
        root: void,
        args: {
          input: {
            terms: ViewTermsBase,
            enableCache?: boolean,
            enableTotal?: boolean,
            createIfMissing?: Partial<T>,
          },
        },
        context: ResolverContext,
        info: GraphQLResolveInfo,
      ) {
        // const startResolve = Date.now()
        const input = args?.input || {};
        const { terms={}, enableCache = false, enableTotal = false } = input;
        const logger = loggerConstructor(`views-${collectionName.toLowerCase()}-${terms.view?.toLowerCase() ?? 'default'}`)
        logger('multi resolver()')
        logger('multi terms', terms)

        const {cacheControl} = info;
        if (cacheControl && enableCache) {
          const maxAge = resolverOptions.cacheMaxAge || defaultOptions.cacheMaxAge;
          cacheControl.setCacheHint({ maxAge });
        }

        // get currentUser and Users collection from context
        const { currentUser }: {currentUser: DbUser|null} = context;

        // get collection based on collectionName argument
        const collection = getCollection(collectionName);

        // get fragment from GraphQL AST
        const fragmentName = getFragmentNameFromInfo(info, "results");

        // Get selector and options from terms and perform Mongo query
        // Downcasts terms because there are collection-specific terms but this function isn't collection-specific
        const parameters = viewTermsToQuery(collectionName, terms as any, {}, context);

        const query = new SelectFragmentQuery(
          fragmentName as FragmentName,
          currentUser,
          (args as any).input.terms, // TODO figure out correct types for this
          parameters.selector,
          parameters.options,
        );
        const compiledQuery = query.compile();
        const db = getSqlClientOrThrow();
        let docs = await db.any(compiledQuery.sql, compiledQuery.args);

        // Create a doc if none exist, using the actual create mutation to ensure permission checks are run correctly
        if (input.createIfMissing && docs.length === 0) {
          await collection.options.mutations.create.mutation(root, {data: input.createIfMissing}, context)
          docs = await db.any(compiledQuery.sql, compiledQuery.args);
        }

        if (docs?.length) {
          docs = await Promise.all(docs.map(
            (doc) => query.executeCodeResolvers(doc, context, info),
          ));
        }

        // Were there enough results to reach the limit specified in the query?
        const saturated = parameters.options.limit && docs.length>=parameters.options.limit;
        
        // if collection has a checkAccess function defined, remove any documents that doesn't pass the check
        const viewableDocs: Array<T> = collection.checkAccess
          ? await asyncFilter(docs, async (doc: T) => await collection.checkAccess(currentUser, doc, context))
          : docs;

        // take the remaining documents and remove any fields that shouldn't be accessible
        const restrictedDocs = restrictViewableFieldsMultiple(currentUser, collection, viewableDocs);

        // prime the cache
        restrictedDocs.forEach((doc: AnyBecauseTodo) => context.loaders[collectionName].prime(doc._id, doc));

        const data: any = { results: restrictedDocs };

        if (enableTotal) {
          // get total count of documents matching the selector
          // TODO: Make this handle synthetic fields
          if (saturated) {
            const { hint } = parameters.options;
            data.totalCount = await Utils.Connectors.count(collection, parameters.selector, { hint });
          } else {
            data.totalCount = viewableDocs.length;
          }
        }
  
        // const timeElapsed = Date.now() - startResolve;
        // Temporarily disabled to investigate performance issues
        // captureEvent("resolveMultiCompleted", {documentIds: restrictedDocs.map((d: DbObject) => d._id), collectionName, timeElapsed, terms}, true);
        // return results
        return data;
      },
    },

    // resolver for returning a single document queried based on id or slug

    single: {
      description: `A single ${typeName} document fetched by ID or slug`,

      async resolver(
        _root: void,
        {input = {}}: {input: AnyBecauseTodo},
        context: ResolverContext,
        info: GraphQLResolveInfo,
      ) {
        // const startResolve = Date.now();
        const { enableCache = false, allowNull = false } = input;
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
        const collection = getCollection(collectionName);

        // get fragment from GraphQL AST
        const fragmentName = getFragmentNameFromInfo(info, "result");

        // use Dataloader if doc is selected by documentId/_id
        const documentId = selector.documentId || selector._id;

        let doc: ObjectsByCollectionName[N] | null;
        if (documentId) {
          doc = await context.loaders[collectionName].load(documentId);
        } else {
          const query = new SelectFragmentQuery(
            fragmentName as FragmentName,
            currentUser,
            {}, //(args as any).input.terms, // TODO figure out correct types for this
            selector,
            {limit: 1},
          );
          const compiledQuery = query.compile();
          const db = getSqlClientOrThrow();
          doc = await db.oneOrNone(compiledQuery.sql, compiledQuery.args);
          if (doc) {
            await query.executeCodeResolvers(doc, context, info);
          }
        }

        if (!doc) {
          if (allowNull) {
            return { result: null };
          } else {
            Utils.throwError({
              id: 'app.missing_document',
              data: { documentId, selector, collectionName: collection.collectionName },
            });
          }
        }

        // if collection has a checkAccess function defined, use it to perform a check on the current document
        // (will throw an error if check doesn't pass)
        if (collection.checkAccess) {
          const reasonDenied: {reason?: string} = {reason: undefined};
          const canAccess = await collection.checkAccess(currentUser, doc, context, reasonDenied)
          if (!canAccess) {
            if (reasonDenied.reason) {
              Utils.throwError({
                id: reasonDenied.reason,
              });
            } else {
              Utils.throwError({
                id: 'app.operation_not_allowed',
                data: {documentId, operationName: `${typeName}.read.single`}
              });
            }
          }
        }

        const restrictedDoc = restrictViewableFieldsSingle(currentUser, collection, doc);

        logGroupEnd();
        logger(`--------------- end \x1b[35m${typeName} Single Resolver\x1b[0m ---------------`);
        logger('');
        
        // const timeElapsed = Date.now() - startResolve;
        // Temporarily disabled to investigate performance issues
        // captureEvent("resolveSingleCompleted", {documentId: restrictedDoc._id, collectionName, timeElapsed}, true);
        
        // filter out disallowed properties and return resulting document
        return { result: restrictedDoc };
      },
    },
  };
}
