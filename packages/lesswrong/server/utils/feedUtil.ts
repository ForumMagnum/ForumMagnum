import * as _ from 'underscore';
import { addGraphQLResolvers, addGraphQLQuery, addGraphQLSchema } from '../../lib/vulcan-lib/graphql';
import { accessFilterMultiple } from '../../lib/utils/schemaUtils';

export function feedSubquery<ResultType, SortKeyType>(params: {
  type: string,
  getSortKey: (result: ResultType) => SortKeyType,
  doQuery: (limit: number, cutoff?: SortKeyType) => Promise<Array<ResultType>>
}) {
  return params;
}

export function viewBasedSubquery<ResultType extends DbObject, SortKeyType, SortFieldName extends keyof ResultType>({type, sortField, collection, context, selector}: {
  type: string,
  sortField: keyof ResultType,
  collection: CollectionBase<ResultType>,
  context: ResolverContext,
  selector: MongoSelector<ResultType>,
}) {
  return feedSubquery({
    type,
    getSortKey: (item: ResultType): SortKeyType => (item[sortField] as unknown as SortKeyType),
    doQuery: async (limit: number, cutoff: SortKeyType): Promise<Array<ResultType>> => {
      return queryWithCutoff({context, collection, selector, limit, cutoffField: sortField, cutoff});
    }
  });
}

export function fixedResultSubquery<ResultType extends DbObject, SortKeyType>({type, result, sortKey}: {
  type: string,
  result: ResultType,
  sortKey: SortKeyType,
}) {
  return feedSubquery({
    type,
    getSortKey: (item: ResultType): SortKeyType => sortKey,
    doQuery: async (limit: number, cutoff: SortKeyType): Promise<Array<ResultType>> => {
      return [result];
    }
  });
}

export function defineFeedResolver<CutoffType>({name, resolver, args, cutoffTypeGraphQL, resultTypesGraphQL}: {
  name: string,
  resolver: ({limit, cutoff, args, context}: {
    limit?: number, cutoff?: CutoffType|null,
    args: any, context: ResolverContext
  }) => Promise<{
    cutoff: CutoffType|null,
    results: Array<any>
  }>,
  args: string,
  cutoffTypeGraphQL: string,
  resultTypesGraphQL: string,
}) {
  addGraphQLSchema(`
    type ${name}QueryResults {
      cutoff: Date
      results: [${name}EntryType!]
    }
    type ${name}EntryType {
      type: String!
      ${resultTypesGraphQL}
    }
  `);
  addGraphQLQuery(`${name}(limit: Int, cutoff: ${cutoffTypeGraphQL}${isNonEmptyObject(args)?", ":""}${args}): ${name}QueryResults!`);
  
  addGraphQLResolvers({
    Query: {
      [name]: async (root: void, args: any, context: ResolverContext) => {
        const {limit, cutoff, ...rest} = args;
        return {
          __typename: `${name}QueryResults`,
          ...await resolver({
            limit, cutoff,
            args: rest,
            context
          })
        };
      }
    },
  });
}

export async function mergeFeedQueries<SortKeyType>({limit, cutoff, subqueries}: {
  limit: number
  cutoff?: SortKeyType,
  subqueries: Array<any>
}) {
  // Perform the subqueries
  const unsortedSubqueryResults = await Promise.all(
    subqueries.map(async (subquery) => {
      const subqueryResults = await subquery.doQuery(limit, cutoff)
      return subqueryResults.map(result => ({
        type: subquery.type,
        sortKey: subquery.getSortKey(result),
        [subquery.type]: result,
      }))
    })
  );
  
  // Merge the result lists
  const unsortedResults = _.flatten(unsortedSubqueryResults);
  
  // Sort by shared sort key
  const sortedResults = _.sortBy(unsortedResults, r=>r.sortKey);
  sortedResults.reverse();
  
  // Apply limit and cutoff
  const withCutoffApplied = cutoff
    ? _.filter(sortedResults, r=>r.sortKey<cutoff)
    : sortedResults;
  const withLimitApplied = _.first(withCutoffApplied, limit);
  
  return {
    results: withLimitApplied,
    cutoff: withLimitApplied.length>0 ? withLimitApplied[withLimitApplied.length-1].sortKey : null,
  };
}

function isNonEmptyObject(obj: {}): boolean {
  return Object.keys(obj).length > 0;
}

export async function queryWithCutoff<ResultType extends DbObject>({context, collection, selector, limit, cutoffField, cutoff}: {
  context: ResolverContext,
  collection: CollectionBase<ResultType>,
  selector: MongoSelector<ResultType>,
  limit: number,
  cutoffField: keyof ResultType,
  cutoff: any,
}) {
  const defaultViewSelector = collection.defaultView ? collection.defaultView({} as any).selector : {};
  const {currentUser} = context;
  
  const resultsRaw = await collection.find({
    ...defaultViewSelector,
    ...selector,
    ...(cutoff && {[cutoffField]: {$lt: cutoff}}),
  }, {
    sort: {[cutoffField]: -1, _id: 1},
    limit,
  }).fetch();
  
  return await accessFilterMultiple(currentUser, collection, resultsRaw, context);
}



